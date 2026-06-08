import Anthropic from "@anthropic-ai/sdk";
import sharp from "sharp";
import type { ImageMediaType } from "../types/index";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  timeout: 45_000,
});

export async function preprocessImage(buffer: Buffer): Promise<Buffer> {
  const input = sharp(buffer);
  const meta = await input.metadata();
  const result = await input
    .flatten({ background: "#ffffff" })
    .sharpen({ sigma: 1.2 })
    .resize(1024, 1024, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer({ resolveWithObject: true });
  console.log(
    `[preprocess] ${meta.width}x${meta.height} ${meta.format} → ${result.info.width}x${result.info.height} jpeg (${Math.round(result.data.length / 1024)}KB)`,
  );
  return result.data;
}

async function compressImage(
  imageBase64: string,
): Promise<{ data: string; mediaType: "image/jpeg" }> {
  const raw = imageBase64.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(raw, "base64");
  const compressed = await preprocessImage(buffer);
  return { data: compressed.toString("base64"), mediaType: "image/jpeg" };
}

function tryExtractField(
  buffer: string,
  fromPos: number,
): { json: string; nextPos: number } | null {
  let searchPos = fromPos;

  while (true) {
    // Find the field key - "field": (not "fields":, which has an 's' before the colon)
    const keyPos = buffer.indexOf('"field":', searchPos);
    if (keyPos === -1) return null;

    // Walk backwards past whitespace to find the opening { of this object
    let braceIdx = keyPos - 1;
    while (braceIdx >= 0 && /\s/.test(buffer[braceIdx])) braceIdx--;
    if (braceIdx < 0 || buffer[braceIdx] !== "{") {
      // Not a bare object opener - skip past this key and keep searching
      searchPos = keyPos + 1;
      continue;
    }

    const start = braceIdx;

    // Brace-depth count to find the matching closing }
    let depth = 0;
    let inString = false;
    let escape = false;

    for (let i = start; i < buffer.length; i++) {
      const ch = buffer[i];
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === "\\" && inString) {
        escape = true;
        continue;
      }
      if (ch === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;
      if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) {
          return { json: buffer.slice(start, i + 1), nextPos: i + 1 };
        }
      }
    }
    // Object not yet complete in the buffer
    return null;
  }
}

export async function streamClaudeVision(
  imageBase64: string,
  _mediaType: ImageMediaType,
  userMessageText: string,
  systemPrompt: string | undefined,
  onField: (rawFieldJson: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const t0 = Date.now();
  const { data, mediaType } = await compressImage(imageBase64);

  const stream = client.messages.stream(
    {
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      ...(systemPrompt ? { system: systemPrompt } : {}),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data },
            },
            { type: "text", text: userMessageText },
          ],
        },
      ],
    },
    { signal },
  );

  let buffer = "";
  let processedUpTo = 0;

  stream.on("text", (text) => {
    if (signal?.aborted) return;
    buffer += text;
    let extracted: ReturnType<typeof tryExtractField>;
    while ((extracted = tryExtractField(buffer, processedUpTo)) !== null) {
      processedUpTo = extracted.nextPos;
      onField(extracted.json);
    }
  });

  const finalMsg = await stream.finalMessage();
  console.log(`[claude] haiku stream: ${Date.now() - t0}ms`);

  const block = finalMsg.content.find((b) => b.type === "text");
  return block?.type === "text" ? block.text : buffer;
}

export async function callClaudeVision(
  imageBase64: string,
  _mediaType: ImageMediaType,
  userMessageText: string,
  systemPrompt?: string,
  signal?: AbortSignal,
): Promise<string> {
  const t0 = Date.now();
  const { data, mediaType } = await compressImage(imageBase64);

  const response = await client.messages.create(
    {
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      ...(systemPrompt ? { system: systemPrompt } : {}),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data,
              },
            },
            {
              type: "text",
              text: userMessageText,
            },
          ],
        },
      ],
    },
    { signal },
  );

  console.log(`[claude] haiku vision: ${Date.now() - t0}ms`);
  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    throw new Error("Claude returned no text content");
  }
  return block.text;
}

