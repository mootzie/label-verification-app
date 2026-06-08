import dotenv from "dotenv";
dotenv.config();

// Trigger provider selection and log which mode is active.
// Provider falls back to mock if no API credentials are found.
import { getProvider } from "./providers/index";
getProvider();

if (!process.env.REDIS_URL) {
  console.warn(
    "[startup] REDIS_URL is not set. Caching and batch processing are disabled.",
  );
}

import app from "./app";
import redis, { setBatchJob } from "./services/redis";
import type { BatchJob } from "./types/index";

const PORT = process.env.PORT || 3000;

async function recoverStuckJobs(): Promise<void> {
  if (!redis) return;
  const THIRTY_MINUTES = 30 * 60 * 1000;
  const cutoff = Date.now() - THIRTY_MINUTES;
  const jobKeys = await redis.keys("batch:job:*");
  let recovered = 0;

  for (const key of jobKeys) {
    try {
      const raw = await redis.get(key);
      if (!raw) continue;
      const job = JSON.parse(raw) as BatchJob;
      if (job.status !== "processing" || job.createdAt >= cutoff) continue;
      job.status = "failed";
      job.labels = job.labels.map((label) =>
        label.status === "pending" || label.status === "processing"
          ? {
              ...label,
              status: "failed" as const,
              error: "Server restart — job did not complete",
            }
          : label,
      );
      await setBatchJob(job);
      recovered++;
    } catch {
      // corrupt or unexpected key — skip silently
    }
  }

  if (recovered > 0) {
    console.log(`[startup] Recovered ${recovered} stuck processing job(s).`);
  }
}

(async () => {
  await recoverStuckJobs();
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
})();