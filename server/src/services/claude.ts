import Anthropic from "@anthropic-ai/sdk";
import sharp from "sharp";
import type { LabelApplicationInput } from "../types/index";

type ImageMediaType = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  timeout: 45_000,
});

async function compressImage(
  imageBase64: string,
): Promise<{ data: string; mediaType: "image/jpeg" }> {
  const raw = imageBase64.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(raw, "base64");
  const compressed = await sharp(buffer)
    .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer();
  return { data: compressed.toString("base64"), mediaType: "image/jpeg" };
}

export async function callClaudeVision(
  imageBase64: string,
  _mediaType: ImageMediaType,
  application: LabelApplicationInput = {},
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
              text:
                Object.keys(application).length > 0
                  ? `Optional application data for comparison:\n${JSON.stringify(application, null, 2)}`
                  : "No application data was provided. Extract readable label data from the image and assess mandatory TTB label requirements from the image alone.",
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


export type { ImageMediaType };
