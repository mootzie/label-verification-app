import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import Anthropic from "@anthropic-ai/sdk";
import { verifyLabel, verifyLabelStream } from "../services/labelVerifier";
import { verifyLimiter } from "../middleware/rateLimiters";
import { LabelApplicationSchema } from "../middleware/validation";
import { upload } from "../middleware/upload";
import type { ImageMediaType, LabelApplicationInput } from "../types/index";

const VERIFY_TIMEOUT_MS = 45_000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type UploadPayload = {
  imageBase64: string;
  mediaType: ImageMediaType;
  application: LabelApplicationInput;
};

function parseUploadPayload(req: Request, res: Response): UploadPayload | null {
  if (!req.file) {
    res.status(400).json({ error: "Image file is required" });
    return null;
  }

  let rawApplication: unknown = {};
  if (req.body.application) {
    try {
      rawApplication = JSON.parse(req.body.application as string);
    } catch {
      res.status(400).json({ error: "Application data must be valid JSON" });
      return null;
    }
  }

  const appResult = LabelApplicationSchema.safeParse(rawApplication);
  if (!appResult.success) {
    res.status(400).json({
      error: "Invalid application data",
      details: appResult.error.flatten().fieldErrors,
    });
    return null;
  }

  return {
    imageBase64: req.file.buffer.toString("base64"),
    mediaType: req.file.mimetype as ImageMediaType,
    application: appResult.data,
  };
}

function withMulter(req: Request, res: Response, next: NextFunction) {
  upload.single("image")(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      const status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
      return res.status(status).json({ error: err.message });
    }
    if (err instanceof Error) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}

function setupSSE(res: Response): void {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
}

function isTimeoutError(err: unknown): boolean {
  return (
    (err instanceof Error && err.name === "AbortError") ||
    err instanceof Anthropic.APIConnectionTimeoutError
  );
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

const router = Router();

router.post(
  "/stream",
  verifyLimiter,
  withMulter,
  async (req: Request, res: Response) => {
    const payload = parseUploadPayload(req, res);
    if (!payload) return;

    setupSSE(res);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), VERIFY_TIMEOUT_MS);
    res.on("close", () => { controller.abort(); clearTimeout(timer); });

    try {
      const result = await verifyLabelStream(
        payload.imageBase64, payload.mediaType, payload.application,
        (field) => res.write(`data: ${JSON.stringify({ type: "field", ...field })}\n\n`),
        controller.signal,
      );
      res.write(`data: ${JSON.stringify({ type: "done", overallStatus: result.overallStatus, processingTimeMs: result.processingTimeMs, imageQuality: result.imageQuality, imageNotes: result.imageNotes })}\n\n`);
      res.write("data: [DONE]\n\n");
      res.end();
    } catch (err) {
      const error = isTimeoutError(err) ? "Verification timed out, please try again" : "Verification failed";
      res.write(`data: ${JSON.stringify({ type: "error", error })}\n\n`);
      res.write("data: [DONE]\n\n");
      if (!res.writableEnded) res.end();
    } finally {
      clearTimeout(timer);
    }
  },
);

router.post(
  "/",
  verifyLimiter,
  withMulter,
  async (req: Request, res: Response, next: NextFunction) => {
    const payload = parseUploadPayload(req, res);
    if (!payload) return;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), VERIFY_TIMEOUT_MS);

    try {
      const result = await verifyLabel(
        payload.imageBase64, payload.mediaType, payload.application, controller.signal,
      );
      return res.json(result);
    } catch (err) {
      if (isTimeoutError(err)) return res.status(503).json({ error: "Verification timed out, please try again" });
      next(err);
    } finally {
      clearTimeout(timer);
    }
  },
);

export default router;