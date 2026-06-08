import Redis from "ioredis";
import { z } from "zod";
import type {
  BatchJob,
  BatchLabelItem,
  VerificationResult,
} from "../types/index";
import { VerificationResultSchema } from "./labelVerifier";

const BATCH_TTL_SECONDS = 4 * 60 * 60; // 4 hours

const redis = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    })
  : null;

redis?.on("error", (err) => console.error("[redis] connection error:", err));

const keys = {
  batchJob: (jobId: string) => `batch:job:${jobId}`,
  labelResult: (jobId: string, labelId: string) =>
    `batch:result:${jobId}:${labelId}`,
};

// Atomically find and update one label inside a BatchJob, recount completedLabels,
// and flip job.status to 'complete' when all labels are settled.
// KEYS[1] = job key
// ARGV[1] = JSON-encoded BatchLabelItem
// ARGV[2] = TTL in seconds
const UPDATE_BATCH_SCRIPT = `
local raw = redis.call('GET', KEYS[1])
if not raw then return redis.error_reply('job not found') end
local job = cjson.decode(raw)
local labelUpdate = cjson.decode(ARGV[1])
local ttl = tonumber(ARGV[2])

local found = false
for i = 1, #job['labels'] do
  if job['labels'][i]['labelId'] == labelUpdate['labelId'] then
    job['labels'][i] = labelUpdate
    found = true
    break
  end
end
if not found then return redis.error_reply('label not found') end

local completed = 0
for i = 1, #job['labels'] do
  local s = job['labels'][i]['status']
  if s == 'complete' or s == 'failed' then
    completed = completed + 1
  end
end
job['completedLabels'] = completed
job['status'] = (completed == job['totalLabels']) and 'complete' or 'processing'

local encoded = cjson.encode(job)
redis.call('SET', KEYS[1], encoded, 'EX', ttl)
return encoded
`;

const BatchLabelItemSchema = z.object({
  labelId: z.string(),
  filename: z.string(),
  status: z.enum(["pending", "processing", "complete", "failed"]),
  result: VerificationResultSchema.optional(),
  error: z.string().optional(),
});

const BatchJobSchema = z.object({
  jobId: z.string(),
  status: z.enum(["pending", "processing", "complete", "failed"]),
  totalLabels: z.number(),
  completedLabels: z.number(),
  labels: z.array(BatchLabelItemSchema),
  createdAt: z.number(),
});

export async function setBatchJob(job: BatchJob): Promise<void> {
  if (!redis) return;
  await redis.set(
    keys.batchJob(job.jobId),
    JSON.stringify(job),
    "EX",
    BATCH_TTL_SECONDS,
  );
}

export async function getBatchJob(jobId: string): Promise<BatchJob | null> {
  if (!redis) return null;
  const raw = await redis.get(keys.batchJob(jobId));
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Corrupt JSON in Redis for job ${jobId}`);
  }
  const result = BatchJobSchema.safeParse(parsed);
  if (!result.success)
    throw new Error(
      `Schema mismatch for job ${jobId}: ${result.error.message}`,
    );
  return result.data;
}

export async function setLabelResult(
  jobId: string,
  labelId: string,
  result: VerificationResult,
): Promise<void> {
  if (!redis) return;
  await redis.set(
    keys.labelResult(jobId, labelId),
    JSON.stringify(result),
    "EX",
    BATCH_TTL_SECONDS,
  );
}

export async function getLabelResult(
  jobId: string,
  labelId: string,
): Promise<VerificationResult | null> {
  if (!redis) return null;
  const raw = await redis.get(keys.labelResult(jobId, labelId));
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Corrupt JSON in Redis for label ${jobId}/${labelId}`);
  }
  const result = VerificationResultSchema.safeParse(parsed);
  if (!result.success)
    throw new Error(
      `Schema mismatch for label ${jobId}/${labelId}: ${result.error.message}`,
    );
  return result.data;
}

// Atomic read-modify-write via Lua — no race condition when multiple workers
// finish labels concurrently.
export async function updateBatchProgress(
  jobId: string,
  labelUpdate: BatchLabelItem,
): Promise<BatchJob | null> {
  if (!redis) return null;
  const raw = (await redis.eval(
    UPDATE_BATCH_SCRIPT,
    1,
    keys.batchJob(jobId),
    JSON.stringify(labelUpdate),
    String(BATCH_TTL_SECONDS),
  )) as string | null;
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Corrupt JSON from Lua script for job ${jobId}`);
  }
  const result = BatchJobSchema.safeParse(parsed);
  if (!result.success)
    throw new Error(
      `Schema mismatch from Lua script for job ${jobId}: ${result.error.message}`,
    );
  return result.data;
}

// Writes the VerificationResult and updates the BatchJob in a single MULTI/EXEC
// pipeline so both succeed or fail together on network failure or server crash
// between the two writes. Note: Redis does not roll back on Lua runtime errors
// inside EXEC — if the job key is missing, the label result write still lands.
export async function recordLabelCompletion(
  jobId: string,
  labelUpdate: BatchLabelItem,
  result: VerificationResult,
): Promise<BatchJob | null> {
  if (!redis) return null;
  const pipeline = redis.multi();

  pipeline.set(
    keys.labelResult(jobId, labelUpdate.labelId),
    JSON.stringify(result),
    "EX",
    BATCH_TTL_SECONDS,
  );
  pipeline.eval(
    UPDATE_BATCH_SCRIPT,
    1,
    keys.batchJob(jobId),
    JSON.stringify(labelUpdate),
    String(BATCH_TTL_SECONDS),
  );

  const results = await pipeline.exec();
  if (!results) return null;

  const [evalErr, evalRaw] = results[1] as [Error | null, string | null];
  if (evalErr) throw evalErr;
  if (!evalRaw) return null;
  let parsedRaw: unknown;
  try {
    parsedRaw = JSON.parse(evalRaw);
  } catch {
    throw new Error(`Corrupt JSON from Lua script for job ${jobId}`);
  }
  const jobResult = BatchJobSchema.safeParse(parsedRaw);
  if (!jobResult.success)
    throw new Error(
      `Schema mismatch from Lua script for job ${jobId}: ${jobResult.error.message}`,
    );
  return jobResult.data;
}

export default redis;