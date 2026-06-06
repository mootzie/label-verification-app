import Anthropic from '@anthropic-ai/sdk';
import type { LabelApplication } from '../types/index';

type ImageMediaType = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';

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

export type { ImageMediaType };
