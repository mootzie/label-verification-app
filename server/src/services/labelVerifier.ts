import { z } from "zod";
import type {
  FieldResult,
  LabelApplication,
  LabelApplicationInput,
  OverallStatus,
  VerificationResult,
} from "../types/index";
import { callClaudeVision, type ImageMediaType } from "./claude";
import { GOVERNMENT_WARNING } from "../constants/warnings";
import { TTB_REQUIREMENTS, CFR_CITATIONS } from "../constants/requirements";

export const FieldResultSchema = z.object({
  fieldName: z.string(),
  expectedValue: z.string().nullable(),
  foundValue: z.string().nullable(),
  status: z.enum(["pass", "warning", "fail", "not_found"]),
  notes: z.string(),
});

export const VerificationResultSchema = z.object({
  overallStatus: z.enum(["pass", "fail", "warning"]),
  fields: z.array(FieldResultSchema).min(1),
  processingTimeMs: z.number().optional(),
  labelId: z.string().optional(),
});

const PROMPT_BASE = `You are a TTB (Alcohol and Tobacco Tax and Trade Bureau) label compliance verifier.

Analyze the provided label image. If optional application data is provided, compare it against the extracted label text. If application data is not provided for a field, extract the label value and set expectedValue to null. Return ONLY valid JSON — no prose, no markdown, no code fences, no backticks.

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
"GOVERNMENT WARNING:" must appear in all capital letters. Any deviation in capitalization is a fail. Bold formatting is not required by regulation. Any truncation or omission → "fail".

All other fields (netContents, classType, producerName, producerAddress, countryOfOrigin, appellation, vintageYear): Exact or functionally equivalent match → "pass". Minor formatting differences → "warning". Missing or clearly different → "fail". If no application value is provided, report the extracted label value with expectedValue null and status "warning" only when the field needs agent review or a mandatory requirement appears missing.

IMAGE QUALITY: If a field is affected by glare, angle, or blur, set status to "warning" and note the quality issue in notes.

NEVER infer or guess field values. If you cannot clearly read a value → "not_found" with an explanation in notes.`;

const PROMPT_FOOTER = `

OVERALL STATUS:
- "pass" — all fields are "pass"
- "warning" — any field is "warning" (no fields are "fail" or "not_found")
- "fail" — any field is "fail" or "not_found"`;

function buildRequirementsBlock(
  beverageType?: LabelApplication["beverageType"],
): string {
  if (!beverageType) {
    return `

TTB MANDATORY REQUIREMENTS:
Identify the beverage type from the label when possible. Verify mandatory fields visible on the label, including brandName, classType or product identity, alcoholContent where required, netContents, producerName, producerAddress, and governmentWarning. If a beverage-specific rule cannot be determined from the image, set the affected field to "warning" and explain what needs agent review.

CFR CITATIONS:
Include the applicable CFR citation in the notes field of any FieldResult where a violation is found when you can determine it from the label context.`;
  }

  const reqs = TTB_REQUIREMENTS[beverageType];
  const label = beverageType.replace(/_/g, " ").toUpperCase();

  const alwaysRequired = reqs.alwaysRequired.join(", ");

  const conditionalLines = reqs.conditional
    .map((c) => `- ${c.field}: required if ${c.condition}`)
    .join("\n");

  let beverageSpecific = "";

  if (beverageType === "distilled_spirits") {
    beverageSpecific = `
SAME FIELD OF VISION (${CFR_CITATIONS.sameFieldOfVision.spirits}):
brandName, classType, and alcoholContent must all be simultaneously visible on one panel without rotating the container. If any of these three fields appears on a different panel, set that field's status to "fail" and include "(${CFR_CITATIONS.sameFieldOfVision.spirits})" in its notes.`;
  }

  if (beverageType === "beer") {
    beverageSpecific = `
ALCOHOL CONTENT FOR BEER:
alcoholContent is NOT always required for beer. Only flag it missing if the label shows evidence of added flavors or non-beverage ingredients (e.g., "with natural flavors", "flavored malt beverage", "with fruit juice"). If no such evidence is present and alcoholContent is absent from the label, do not penalize.`;
  }

  return `

TTB MANDATORY REQUIREMENTS — ${label}:
Always required: ${alwaysRequired}
${beverageSpecific}
CONDITIONAL FIELDS (only flag missing if the condition applies):
${conditionalLines}

CFR CITATIONS:
Include the applicable CFR citation in the notes field of any FieldResult where a violation is found. Examples: "ABV missing (${CFR_CITATIONS.alcoholContent.spirits})", "Government warning text incorrect (${CFR_CITATIONS.governmentWarning.all})".`;
}

function buildSystemPrompt(
  beverageType?: LabelApplication["beverageType"],
): string {
  return PROMPT_BASE + buildRequirementsBlock(beverageType) + PROMPT_FOOTER;
}

function buildStrictSystemPrompt(
  beverageType?: LabelApplication["beverageType"],
): string {
  return (
    buildSystemPrompt(beverageType) +
    `

CRITICAL: Your previous response was not valid JSON matching the required schema. Return ONLY a raw JSON object. The response must begin with { and end with }. No text before or after the JSON.`
  );
}

export function deriveOverallStatus(fields: FieldResult[]): OverallStatus {
  if (fields.some((f) => f.status === "fail" || f.status === "not_found"))
    return "fail";
  if (fields.some((f) => f.status === "warning")) return "warning";
  return "pass";
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
  application: LabelApplicationInput = {},
  signal?: AbortSignal,
): Promise<VerificationResult> {
  const start = Date.now();
  const systemPrompt = buildSystemPrompt(application.beverageType);

  const raw = await callClaudeVision(
    imageBase64,
    mediaType,
    application,
    systemPrompt,
    signal,
  );

  const parsed = tryParse(raw);
  if (parsed) {
    return {
      ...parsed,
      overallStatus: deriveOverallStatus(parsed.fields),
      processingTimeMs: Date.now() - start,
    };
  }

  if (signal?.aborted) {
    const err = new Error("Aborted");
    err.name = "AbortError";
    throw err;
  }

  const rawRetry = await callClaudeVision(
    imageBase64,
    mediaType,
    application,
    buildStrictSystemPrompt(application.beverageType),
    signal,
  );
  const parsedRetry = tryParse(rawRetry);

  if (parsedRetry) {
    return {
      ...parsedRetry,
      overallStatus: deriveOverallStatus(parsedRetry.fields),
      processingTimeMs: Date.now() - start,
    };
  }

  throw new Error(
    `Claude response failed schema validation after retry. Last response: ${rawRetry.slice(0, 200)}`,
  );
}
