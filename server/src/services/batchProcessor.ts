import type {
  BatchJob,
  BatchLabelItem,
  LabelInput,
} from "../types/index";
import { verifyLabelStream } from "./labelVerifier";
import { recordLabelCompletion } from "./redis";

const MAX_CONCURRENT = 5; // raise if Anthropic rate limits hit; lower for free-tier keys

export async function processBatch(
  job: BatchJob,
  inputs: LabelInput[],
): Promise<void> {
  const queue = [...inputs];

  async function worker(): Promise<void> {
    while (queue.length > 0) {
      const input = queue.shift();
      if (!input) break;

      try {
        const result = await verifyLabelStream(
          input.imageBase64,
          input.mediaType,
          input.application,
          () => {}, // per-field events not needed at batch level
        );

        const completed: BatchLabelItem = {
          labelId: input.labelId,
          filename: input.filename,
          status: "complete",
          result,
        };

        await recordLabelCompletion(job.jobId, completed, result);
      } catch (err) {
        const failed: BatchLabelItem = {
          labelId: input.labelId,
          filename: input.filename,
          status: "failed",
          error: err instanceof Error ? err.message : "Unknown error",
        };

        const failResult = {
          overallStatus: "fail" as const,
          fields: [],
          labelId: input.labelId,
        };

        await recordLabelCompletion(job.jobId, failed, failResult).catch(
          (redisErr) => {
            console.error(
              `[batch] failed to record error for label ${input.labelId}:`,
              redisErr,
            );
          },
        );
      }
    }
  }

  const workers = Array.from(
    { length: Math.min(MAX_CONCURRENT, inputs.length) },
    () => worker(),
  );
  await Promise.all(workers);
}
