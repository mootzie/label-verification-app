import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { verifyLabel } from "../services/labelVerifier";
import { verifyLimiter } from "../middleware/rateLimiters";
import type { ImageMediaType } from "../services/claude";

const VERIFY_TIMEOUT_MS = 20_000;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed: string[] = ["image/jpeg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, and WebP images are accepted"));
    }
  },
});

const LabelApplicationSchema = z.object({
  brandName: z.string().min(1),
  productName: z.string().optional(),
  classType: z.string().min(1),
  alcoholContent: z.string().min(1),
  netContents: z.string().min(1),
  beverageType: z.enum(["beer", "wine", "distilled_spirits"]),
  producerName: z.string().min(1),
  producerAddress: z.string().min(1),
  countryOfOrigin: z.string().optional(),
  appellation: z.string().optional(),
  vintageYear: z.string().optional(),
}).partial();

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
