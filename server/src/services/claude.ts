import Anthropic from "@anthropic-ai/sdk";
import type { LabelApplicationInput } from "../types/index";

type ImageMediaType = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  timeout: 45_000,
});

export async function callClaudeVision(
  imageBase64: string,
  mediaType: ImageMediaType,
  application: LabelApplicationInput = {},
  systemPrompt?: string,
  signal?: AbortSignal,
): Promise<string> {
  const data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

  const t0 = Date.now()
  const response = await client.messages.create(
    {
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
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

  console.log(`[claude] sonnet vision: ${Date.now() - t0}ms`)
  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    throw new Error("Claude returned no text content");
  }
  return block.text;
}


export type { ImageMediaType };
