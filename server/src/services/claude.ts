import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import type { LabelApplication } from '../types/index';

type ImageMediaType = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';

export interface PreflightResult {
  readable: boolean;
  issues: string[];
}

const PreflightSchema = z.object({
  readable: z.boolean(),
  issues: z.array(z.string()),
});

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 15_000 });

export async function callClaudeVision(
  imageBase64: string,
  mediaType: ImageMediaType,
  application: LabelApplication,
  systemPrompt?: string,
  signal?: AbortSignal
): Promise<string> {
  const data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

  const response = await client.messages.create(
    {
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      ...(systemPrompt ? { system: systemPrompt } : {}),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data,
              },
            },
            {
              type: 'text',
              text: `Application data:\n${JSON.stringify(application, null, 2)}`,
            },
          ],
        },
      ],
    },
    { signal }
  );

  const block = response.content.find((b) => b.type === 'text');
  if (!block || block.type !== 'text') {
    throw new Error('Claude returned no text content');
  }
  return block.text;
}

export async function preflightImageCheck(
  imageBase64: string,
  mediaType: ImageMediaType,
  signal?: AbortSignal
): Promise<PreflightResult> {
  const data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
  try {
    const response = await client.messages.create(
      {
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 256,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data } },
            {
              type: 'text',
              text: 'Is this image clear enough to read all label text? Reply ONLY with JSON: {"readable": true, "issues": []}. Set readable to false and list specific issues (e.g. blurry, glare, rotated, low-resolution) if label text cannot be reliably read.',
            },
          ],
        }],
      },
      { signal }
    );
    const block = response.content.find(b => b.type === 'text');
    if (!block || block.type !== 'text') return { readable: true, issues: [] };
    const match = block.text.match(/\{[\s\S]*\}/);
    if (!match) return { readable: true, issues: [] };
    const parsed = PreflightSchema.safeParse(JSON.parse(match[0]));
    return parsed.success ? parsed.data : { readable: true, issues: [] };
  } catch {
    return { readable: true, issues: [] };
  }
}

export type { ImageMediaType };
