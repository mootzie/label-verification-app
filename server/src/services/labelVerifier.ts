import { z } from 'zod';
import type { FieldResult, LabelApplication, OverallStatus, VerificationResult } from '../types/index';
import { callClaudeVision, preflightImageCheck, type ImageMediaType } from './claude';
import { GOVERNMENT_WARNING } from '../constants/warnings';
import { TTB_REQUIREMENTS } from '../constants/requirements';

export const FieldResultSchema = z.object({
  fieldName: z.string(),
  expectedValue: z.string().nullable(),
  foundValue: z.string().nullable(),
  status: z.enum(['pass', 'warning', 'fail', 'not_found']),
  notes: z.string(),
});

export const VerificationResultSchema = z.object({
  overallStatus: z.enum(['pass', 'fail', 'warning']),
  fields: z.array(FieldResultSchema).min(1),
  processingTimeMs: z.number().optional(),
  labelId: z.string().optional(),
});

const SYSTEM_PROMPT = `You are a TTB (Alcohol and Tobacco Tax and Trade Bureau) label compliance verifier.

Analyze the provided label image against the application data. Return ONLY valid JSON — no prose, no markdown, no code fences, no backticks.

Response schema:
{
  "overallStatus": "pass" | "warning" | "fail",
  "fields": [
    {
      "fieldName": string,
      "expectedValue": string | null,
      "foundValue": string | null,
      "status": "pass" | "warning" | "fail" | "not_found",
      "notes": string
    }
  ]
}

FIELD VERIFICATION RULES:

brandName: Case-insensitive exact match → "pass". Same name with different case or stylization → "warning". Different name → "fail".

alcoholContent: Compare numeric value only. "45%", "45% Alc./Vol.", and "45% Alc./Vol. (90 Proof)" are all equivalent. Fail only on numeric mismatch.

governmentWarning: The label must contain this exact text:
${GOVERNMENT_WARNING}
"GOVERNMENT WARNING:" must appear in all caps. Any deviation, truncation, or omission → "fail".

All other fields (netContents, beverageType, producerName, producerAddress, countryOfOrigin, appellation, vintageYear): Exact or functionally equivalent match → "pass". Minor formatting differences → "warning". Missing or clearly different → "fail". Only verify optional fields if present in the application data.

IMAGE QUALITY: If a field is affected by glare, angle, or blur, set status to "warning" and note the quality issue in notes.

NEVER infer or guess field values. If you cannot clearly read a value → "not_found" with an explanation in notes.

OVERALL STATUS:
- "pass" — all fields are "pass"
- "warning" — any field is "warning" (no fields are "fail" or "not_found")
- "fail" — any field is "fail" or "not_found"`;

const STRICT_SYSTEM_PROMPT = SYSTEM_PROMPT + `

CRITICAL: Your previous response was not valid JSON matching the required schema. Return ONLY a raw JSON object. The response must begin with { and end with }. No text before or after the JSON.`;

export function deriveOverallStatus(fields: FieldResult[]): OverallStatus {
  if (fields.some(f => f.status === 'fail' || f.status === 'not_found')) return 'fail';
  if (fields.some(f => f.status === 'warning')) return 'warning';
  return 'pass';
}

export function tryParse(raw: string): VerificationResult | null {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const result = VerificationResultSchema.safeParse(JSON.parse(match[0]));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export async function verifyLabel(
  imageBase64: string,
  mediaType: ImageMediaType,
  application: LabelApplication,
  signal?: AbortSignal
): Promise<VerificationResult> {
  const start = Date.now();

  // Run preflight and verification in parallel — eliminates sequential haiku overhead
  // and prevents haiku false-negatives from blocking the sonnet verification
  const [preflight, raw] = await Promise.all([
    preflightImageCheck(imageBase64, mediaType, signal),
    callClaudeVision(imageBase64, mediaType, application, SYSTEM_PROMPT, signal),
  ]);

  // Annotate with quality warning without blocking — haiku opinion doesn't gate sonnet
  const annotate = (fields: FieldResult[]): FieldResult[] => {
    if (preflight.readable) return fields;
    return [
      {
        fieldName: 'imageQuality',
        expectedValue: 'Clear, readable label image',
        foundValue: null,
        status: 'warning',
        notes: preflight.issues.length > 0
          ? `Image quality may affect accuracy: ${preflight.issues.join('; ')}`
          : 'Image quality may affect accuracy',
      },
      ...fields,
    ];
  };

  const parsed = tryParse(raw);
  if (parsed) {
    const fields = annotate(parsed.fields);
    return { ...parsed, fields, overallStatus: deriveOverallStatus(fields), processingTimeMs: Date.now() - start };
  }

  if (signal?.aborted) {
    const err = new Error('Aborted');
    err.name = 'AbortError';
    throw err;
  }

  const rawRetry = await callClaudeVision(imageBase64, mediaType, application, STRICT_SYSTEM_PROMPT, signal);
  const parsedRetry = tryParse(rawRetry);

  if (parsedRetry) {
    const fields = annotate(parsedRetry.fields);
    return { ...parsedRetry, fields, overallStatus: deriveOverallStatus(fields), processingTimeMs: Date.now() - start };
  }

  throw new Error(
    `Claude response failed schema validation after retry. Last response: ${rawRetry.slice(0, 200)}`
  );
}
