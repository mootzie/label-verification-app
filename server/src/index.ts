import dotenv from "dotenv";
dotenv.config();

if (!process.env.ANTHROPIC_API_KEY) {
  console.error(
    "[startup] ANTHROPIC_API_KEY is not set. Set it in server/.env and restart.",
  );
  process.exit(1);
}

if (!process.env.REDIS_URL) {
  console.warn(
    "[startup] REDIS_URL is not set. Defaulting to redis://localhost:6379.",
  );
}

import app from "./app";
import redis, { setBatchJob } from "./services/redis";
import type { BatchJob } from "./types/index";

const PORT = process.env.PORT || 3001;

async function recoverStuckJobs(): Promise<void> {
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
