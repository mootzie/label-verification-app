import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import { z } from "zod";
import { batchUploadLimiter } from "../middleware/rateLimiters";
import { setBatchJob, getBatchJob } from "../services/redis";
import { processBatch } from "../services/batchProcessor";
import type { BatchJob, BatchLabelItem } from "../types/index";
import type { ImageMediaType } from "../services/claude";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
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
  upload.array("images", 50)(req, res, (err: unknown) => {
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
  "/upload",
  batchUploadLimiter,
  withMulter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const files = req.files as Express.Multer.File[] | undefined;
      if (!files || files.length === 0) {
        return res
          .status(400)
          .json({ error: "At least one image file is required" });
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

      const applicationResult =
        LabelApplicationSchema.safeParse(rawApplication);
      if (!applicationResult.success) {
        return res.status(400).json({
          error: "Invalid application data",
          details: applicationResult.error.flatten().fieldErrors,
        });
      }
      const application = applicationResult.data;

      const jobId = crypto.randomUUID();
      const now = Date.now();

      const labels: BatchLabelItem[] = files.map((file, i) => ({
        labelId: `${jobId}-${i}`,
        filename: file.originalname,
        status: "pending",
      }));

      const job: BatchJob = {
        jobId,
        status: "pending",
        totalLabels: files.length,
        completedLabels: 0,
        labels,
        createdAt: now,
      };

      await setBatchJob(job);

      const inputs = files.map((file, i) => ({
        labelId: labels[i].labelId,
        filename: file.originalname,
        imageBase64: file.buffer.toString("base64"),
        mediaType: file.mimetype as ImageMediaType,
        application,
      }));

      // Kick off processing in background — do not await
      processBatch(job, inputs).catch(async (err) => {
        console.error(
          `[batch] unhandled error in processBatch for job ${jobId}:`,
          err,
        );
        try {
          const current = await getBatchJob(jobId);
          if (current && current.status !== "complete") {
            await setBatchJob({ ...current, status: "failed" });
          }
        } catch (redisErr) {
          console.error(
            `[batch] failed to mark job ${jobId} as failed:`,
            redisErr,
          );
        }
      });

      return res.status(202).json({ jobId });
    } catch (err) {
      next(err);
    }
  },
);

router.get("/:jobId/stream", async (req: Request, res: Response) => {
  const { jobId } = req.params;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  let lastSeen: Record<string, string> = {};

  const poller = setInterval(async () => {
    try {
      const job = await getBatchJob(jobId);

      if (!job) {
        res.write(
          `event: error\ndata: ${JSON.stringify({ error: "Job not found" })}\n\n`,
        );
        clearInterval(poller);
        res.end();
        return;
      }

      for (const label of job.labels) {
        if (label.status !== lastSeen[label.labelId]) {
          lastSeen[label.labelId] = label.status;
          res.write(`event: label\ndata: ${JSON.stringify(label)}\n\n`);
        }
      }

      if (job.status === "complete" || job.status === "failed") {
        res.write(
          `event: done\ndata: ${JSON.stringify({ status: job.status, completedLabels: job.completedLabels, totalLabels: job.totalLabels })}\n\n`,
        );
        clearInterval(poller);
        res.end();
      }
    } catch (err) {
      console.error(`[batch] SSE poll error for job ${jobId}:`, err);
      res.write(
        `event: error\ndata: ${JSON.stringify({ error: "Internal server error" })}\n\n`,
      );
      clearInterval(poller);
      res.end();
    }
  }, 250);

  res.on("close", () => clearInterval(poller));
});

export default router;
