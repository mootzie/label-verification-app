import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import Anthropic from "@anthropic-ai/sdk";
import { verifyLabel, verifyLabelStream } from "../services/labelVerifier";
import { verifyLimiter } from "../middleware/rateLimiters";
import { LabelApplicationSchema } from "../middleware/validation";
import { upload } from "../middleware/upload";
import type { ImageMediaType } from "../services/claude";

const VERIFY_TIMEOUT_MS = 45_000;

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

const router = Router();

router.post(
  "/stream",
  verifyLimiter,
  withMulter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Image file is required" });
      }

      let rawApplication: unknown;
      if (req.body.application) {
        try {
          rawApplication = JSON.parse(req.body.application as string);
        } catch {
          return res
            .status(400)
            .json({ error: "Application data must be valid JSON" });
        }
      } else {
        rawApplication = {};
      }

      const appResult = LabelApplicationSchema.safeParse(rawApplication);
      if (!appResult.success) {
        return res.status(400).json({
          error: "Invalid application data",
          details: appResult.error.flatten().fieldErrors,
        });
      }

      const imageBase64 = req.file.buffer.toString("base64");
      const mediaType = req.file.mimetype as ImageMediaType;

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), VERIFY_TIMEOUT_MS);
      res.on("close", () => {
        controller.abort();
        clearTimeout(timer);
      });

      try {
        const result = await verifyLabelStream(
          imageBase64,
          mediaType,
          appResult.data,
          (field) => {
            res.write(
              `data: ${JSON.stringify({ type: "field", ...field })}\n\n`,
            );
          },
          controller.signal,
        );

        res.write(
          `data: ${JSON.stringify({
            type: "done",
            overallStatus: result.overallStatus,
            processingTimeMs: result.processingTimeMs,
            imageQuality: result.imageQuality,
            imageNotes: result.imageNotes,
          })}\n\n`,
        );
        res.write("data: [DONE]\n\n");
        res.end();
      } catch (err) {
        const isTimeout =
          (err instanceof Error && err.name === "AbortError") ||
          err instanceof Anthropic.APIConnectionTimeoutError;
        res.write(
          `data: ${JSON.stringify({
            type: "error",
            error: isTimeout
              ? "Verification timed out, please try again"
              : "Verification failed",
          })}\n\n`,
        );
        res.write("data: [DONE]\n\n");
        if (!res.writableEnded) res.end();
      } finally {
        clearTimeout(timer);
      }
    } catch (err) {
      if (!res.headersSent) next(err);
      else res.end();
    }
  },
);

router.post(
  "/",
  verifyLimiter,
  withMulter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Image file is required" });
      }

      let rawApplication: unknown;
      if (req.body.application) {
        try {
          rawApplication = JSON.parse(req.body.application as string);
        } catch {
          return res
            .status(400)
            .json({ error: "Application data must be valid JSON" });
        }
      } else {
        rawApplication = {};
      }

      const appResult = LabelApplicationSchema.safeParse(rawApplication);
      if (!appResult.success) {
        return res.status(400).json({
          error: "Invalid application data",
          details: appResult.error.flatten().fieldErrors,
        });
      }

      const imageBase64 = req.file.buffer.toString("base64");
      const mediaType = req.file.mimetype as ImageMediaType;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), VERIFY_TIMEOUT_MS);

      try {
        const result = await verifyLabel(
          imageBase64,
          mediaType,
          appResult.data,
          controller.signal,
        );
        return res.json(result);
      } catch (err) {
        if (
          (err instanceof Error && err.name === "AbortError") ||
          err instanceof Anthropic.APIConnectionTimeoutError
        ) {
          return res
            .status(503)
            .json({ error: "Verification timed out, please try again" });
        }
        throw err;
      } finally {
        clearTimeout(timer);
      }
    } catch (err) {
      next(err);
    }
  },
);

export default router;
