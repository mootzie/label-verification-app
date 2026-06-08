import { z } from "zod";
import type {
  FieldResult,
  FieldStatus,
  LabelApplicationInput,
  OverallStatus,
  VerificationResult,
} from "../types/index";
import type { ImageMediaType } from "../types/index";
import { getProvider } from "../providers/index";
import { GOVERNMENT_WARNING } from "../constants/warnings";

// ---------------------------------------------------------------------------
// Zod schema for Claude's response (new format)
// ---------------------------------------------------------------------------

const ClaudeFieldSchema = z.object({
  field: z.string(),
  extracted: z.string().nullable(),
  confidence: z.enum(["high", "medium", "low", "not_visible"]),
  application: z.string().nullable(),
  status: z.enum(["pass", "warning", "fail", "extracted"]),
  notes: z.string().optional(),
});

const ClaudeResponseSchema = z.object({
  fields: z.array(ClaudeFieldSchema).min(1),
  image_quality: z
    .enum(["good", "angled", "degraded", "angled_degraded"])
    .optional(),
  image_notes: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Zod schema for stored VerificationResult (used by Redis for read validation)
// ---------------------------------------------------------------------------

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
  imageQuality: z
    .enum(["good", "angled", "degraded", "angled_degraded"])
    .optional(),
  imageNotes: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Field name mapping: Claude snake_case → frontend camelCase
// ---------------------------------------------------------------------------

const FIELD_NAME_MAP: Record<string, string> = {
  brand_name: "brandName",
  class_type: "classType",
  alcohol_content: "alcoholContent",
  net_contents: "netContents",
  producer_name: "producerName",
  producer_address: "producerAddress",
  country_of_origin: "countryOfOrigin",
  government_warning: "governmentWarning",
  age_statement: "ageStatement",
  color_disclosures: "colorDisclosures",
  commodity_statement: "commodityStatement",
  sulfite_declaration: "sulfiteDeclaration",
  appellation: "appellation",
  foreign_wine_pct: "foreignWinePct",
  color_additives: "colorAdditives",
  aspartame_declaration: "aspartameDeclaration",
};

const FIELD_LIST_BY_TYPE: Record<string, string[]> = {
  distilled_spirits: [
    "brand_name",
    "class_type",
    "alcohol_content",
    "net_contents",
    "producer_name",
    "producer_address",
    "government_warning",
    "age_statement",
    "color_disclosures",
    "commodity_statement",
    "country_of_origin",
  ],
  wine: [
    "brand_name",
    "class_type",
    "alcohol_content",
    "net_contents",
    "producer_name",
    "producer_address",
    "government_warning",
    "sulfite_declaration",
    "appellation",
    "foreign_wine_pct",
    "color_disclosures",
    "country_of_origin",
  ],
  beer: [
    "brand_name",
    "class_type",
    "net_contents",
    "producer_name",
    "producer_address",
    "government_warning",
    "alcohol_content",
    "color_additives",
    "sulfite_declaration",
    "aspartame_declaration",
    "country_of_origin",
  ],
};

const FIELD_LABEL: Record<string, string> = {
  brand_name: "Brand Name",
  class_type: "Class / Type",
  alcohol_content: "Alcohol Content",
  net_contents: "Net Contents",
  producer_name: "Producer Name",
  producer_address: "Producer Address",
  country_of_origin: "Country of Origin",
  age_statement: "Age Statement",
  color_disclosures: "Color Disclosures",
  commodity_statement: "Commodity Statement",
  sulfite_declaration: "Sulfite Declaration",
  appellation: "Appellation",
  foreign_wine_pct: "Foreign Wine %",
  color_additives: "Color Additives",
  aspartame_declaration: "Aspartame Declaration",
};

function getAppValue(
  application: LabelApplicationInput,
  fieldKey: string,
): string {
  const map: Record<string, keyof LabelApplicationInput> = {
    brand_name: "brandName",
    class_type: "classType",
    alcohol_content: "alcoholContent",
    net_contents: "netContents",
    producer_name: "producerName",
    producer_address: "producerAddress",
    country_of_origin: "countryOfOrigin",
    age_statement: "ageStatement",
    color_disclosures: "colorDisclosures",
    commodity_statement: "commodityStatement",
    sulfite_declaration: "sulfiteDeclaration",
    appellation: "appellation",
    foreign_wine_pct: "foreignWinePct",
    color_additives: "colorAdditives",
    aspartame_declaration: "aspartameDeclaration",
  };
  const key = map[fieldKey];
  if (!key) return "Not provided";
  return (application[key] as string | undefined) || "Not provided";
}

// ---------------------------------------------------------------------------
// Programmatic government warning validation
// Claude extracts text only; all compliance rules live here.
// ---------------------------------------------------------------------------

const GW_HEADER = "GOVERNMENT WARNING:";
const GW_STATUTORY_BODY = normalizeText(
  GOVERNMENT_WARNING.slice(GW_HEADER.length).trim(),
);

function normalizeText(s: string): string {
  return s.trim().replace(/\s+/g, " ").toLowerCase();
}

function isEffectivelyUnclear(value: string): boolean {
  return value.replace(/\[UNCLEAR\]/gi, "").trim().length === 0;
}

function wordOverlapSimilarity(canonical: string, extracted: string): number {
  const tokenize = (s: string) =>
    new Set(
      s
        .split(/\s+/)
        .map((w) => w.replace(/[^a-z0-9]/g, ""))
        .filter((w) => w.length > 0),
    );
  const canonicalWords = tokenize(canonical);
  const extractedWords = tokenize(extracted);
  if (canonicalWords.size === 0) return 1;
  let matches = 0;
  for (const w of canonicalWords) {
    if (extractedWords.has(w)) matches++;
  }
  return matches / canonicalWords.size;
}

function validateGovernmentWarning(foundValue: string | null): {
  status: FieldStatus;
  notes: string;
} {
  if (!foundValue || isEffectivelyUnclear(foundValue)) {
    return {
      status: "fail",
      notes: "Government warning statement not found on label.",
    };
  }

  // Check 1: all-caps header (case-sensitive exact match)
  if (!foundValue.includes(GW_HEADER)) {
    if (foundValue.toLowerCase().includes("government warning:")) {
      return {
        status: "warning",
        notes: `Header must appear as "${GW_HEADER}" in all caps per 27 CFR 16.21.`,
      };
    }
    return {
      status: "fail",
      notes: "Government warning statement not found on label.",
    };
  }

  // Check 2: statutory body text - word-overlap similarity
  const bodyStart = foundValue.indexOf(GW_HEADER) + GW_HEADER.length;
  const extractedBody = normalizeText(foundValue.slice(bodyStart));
  const similarity = wordOverlapSimilarity(GW_STATUTORY_BODY, extractedBody);
  const pct = Math.round(similarity * 100);

  if (similarity >= 0.9) {
    return {
      status: "pass",
      notes: `Header and statutory text verified (${pct}% word match).`,
    };
  }
  if (similarity >= 0.7) {
    return {
      status: "warning",
      notes: `Warning text may have OCR errors or minor deviations (${pct}% word match) - agent should visually verify.`,
    };
  }
  return {
    status: "fail",
    notes: `Warning text does not match statutory requirement (${pct}% word match).`,
  };
}

function applyProgrammaticChecks(
  result: VerificationResult,
): VerificationResult {
  const fields = result.fields.map((field) => {
    if (field.fieldName === "governmentWarning") {
      const { status, notes } = validateGovernmentWarning(field.foundValue);
      return { ...field, status, notes };
    }
    return field;
  });
  return { ...result, fields };
}

const SYSTEM_PROMPT = `You are a TTB (Alcohol and Tobacco Tax and Trade Bureau) label compliance analyst. Your job is to extract field values from alcohol beverage label images with high accuracy.

EXTRACTION RULES:
- Extract text exactly as it appears - preserve capitalization, punctuation, and spacing character by character
- If a word or phrase is unclear due to image angle, glare, or degradation, write [UNCLEAR] in place of that portion - do NOT guess or substitute a word you think should be there
- Never correct what you see to match what you expect - extract what is visually present, even if it seems like a typo or partial word
- If a field is not visible on this label face at all, set extracted to null

GOVERNMENT WARNING FIELD RULES:
- Extract the complete warning text verbatim, starting from the header
- The header is typically "GOVERNMENT WARNING:" - copy whatever casing you see exactly, character by character
- The body text refers to the Surgeon General, pregnancy and birth defects, and driving or operating machinery - extract verbatim, do not paraphrase
- If the label is angled and some warning text is partially cut off or illegible, extract what you can and append [UNCLEAR] for the rest
- Do NOT evaluate whether the warning meets formatting requirements - extract only; compliance checking happens separately

IMAGE QUALITY:
Labels photographed at angles, with glare, or in low light are common.
Extract the best reading you can. Use "low" confidence for any field where you had difficulty reading the text, and note why briefly.

Return only valid JSON. No explanation text, no markdown fences.`;

const SYSTEM_PROMPT_STRICT =
  SYSTEM_PROMPT +
  "\n\nCRITICAL: Your previous response was not valid JSON. Return ONLY a raw JSON object. The response must begin with { and end with }. No text before or after the JSON.";

function buildUserMessage(application: LabelApplicationInput): string {
  const bev = application.beverageType ?? "distilled_spirits";
  const fieldList =
    FIELD_LIST_BY_TYPE[bev] ?? FIELD_LIST_BY_TYPE["distilled_spirits"];
  const hasAppData = Object.keys(application).length > 0;

  const appLines = fieldList
    .filter((k) => k !== "government_warning")
    .map((k) => `  ${FIELD_LABEL[k] ?? k}: ${getAppValue(application, k)}`)
    .join("\n");

  const appBlock = hasAppData
    ? `APPLICATION DATA (COLA filing):
Compare your extracted values against these application-provided values:
${appLines}
`
    : "No application data provided. Extract fields only.";

  const fieldLines = fieldList
    .map((k, i) => {
      const suffix =
        k === "government_warning"
          ? " ← extract verbatim only, no compliance judgment"
          : "";
      return `${i + 1}. ${k}${suffix}`;
    })
    .join("\n");

  return `Analyze this alcohol beverage label image and extract all visible fields.

${appBlock}

Beverage type: ${bev}

Verify fields according to TTB requirements for this beverage type.
Required fields for this type that are absent from the label should be flagged as fail.
Fields marked 'if applicable' or 'imports only' that are absent should be flagged as extracted (not a failure).

Return this exact JSON structure - no other text:

{
  "fields": [
    {
      "field": "brand_name",
      "extracted": "<verbatim text from label, or null>",
      "confidence": "high | medium | low | not_visible",
      "application": "<app value or null>",
      "status": "pass | warning | fail | extracted",
      "notes": "<plain-language explanation for any warning or fail>"
    }
  ],
  "image_quality": "good | angled | degraded | angled_degraded",
  "image_notes": "<brief note on any quality issues that affected extraction>"
}

Extract these fields in order:
${fieldLines}

STATUS RULES (only apply when application data is provided for that field):
- pass:      extracted matches application value (semantically equivalent)
- warning:   minor difference - abbreviation, punctuation, or level of specificity - always explain in notes
- fail:      clear mismatch, or a mandatory field is entirely absent
- extracted: no application value was provided for this field`;
}

// ---------------------------------------------------------------------------
// Response mapping: Claude format → VerificationResult
// ---------------------------------------------------------------------------

function mapClaudeField(cf: z.infer<typeof ClaudeFieldSchema>): FieldResult {
  return {
    fieldName: FIELD_NAME_MAP[cf.field] ?? cf.field,
    foundValue: cf.extracted,
    expectedValue: cf.application,
    // "extracted" means no comparison was requested - treat as pass
    status: cf.status === "extracted" ? "pass" : cf.status,
    notes: cf.notes ?? "",
  };
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

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
    const validated = ClaudeResponseSchema.safeParse(JSON.parse(match[0]));
    if (!validated.success) return null;
    const { data } = validated;
    return {
      overallStatus: "pass", // recalculated by verifyLabel after programmatic checks
      fields: data.fields.map(mapClaudeField),
      imageQuality: data.image_quality,
      imageNotes: data.image_notes,
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function verifyLabel(
  imageBase64: string,
  mediaType: ImageMediaType,
  application: LabelApplicationInput = {},
  signal?: AbortSignal,
): Promise<VerificationResult> {
  const start = Date.now();
  const userMessage = buildUserMessage(application);

  const raw = await getProvider().callVision(
    imageBase64,
    mediaType,
    userMessage,
    SYSTEM_PROMPT,
    signal,
  );

  const parsed = tryParse(raw);
  if (parsed) {
    const checked = applyProgrammaticChecks(parsed);
    return {
      ...checked,
      overallStatus: deriveOverallStatus(checked.fields),
      processingTimeMs: Date.now() - start,
    };
  }

  if (signal?.aborted) {
    const err = new Error("Aborted");
    err.name = "AbortError";
    throw err;
  }

  const rawRetry = await getProvider().callVision(
    imageBase64,
    mediaType,
    userMessage,
    SYSTEM_PROMPT_STRICT,
    signal,
  );
  const parsedRetry = tryParse(rawRetry);

  if (parsedRetry) {
    const checkedRetry = applyProgrammaticChecks(parsedRetry);
    return {
      ...checkedRetry,
      overallStatus: deriveOverallStatus(checkedRetry.fields),
      processingTimeMs: Date.now() - start,
    };
  }

  throw new Error(
    `Claude response failed schema validation after retry. Last response: ${rawRetry.slice(0, 200)}`,
  );
}

// ---------------------------------------------------------------------------
// Streaming entry point - emits FieldResult objects as they become parseable
// ---------------------------------------------------------------------------

export async function verifyLabelStream(
  imageBase64: string,
  mediaType: ImageMediaType,
  application: LabelApplicationInput = {},
  onField: (field: FieldResult) => void,
  signal?: AbortSignal,
): Promise<VerificationResult> {
  const start = Date.now();
  const userMessage = buildUserMessage(application);
  const fields: FieldResult[] = [];

  const fullText = await getProvider().streamVision(
    imageBase64,
    mediaType,
    userMessage,
    SYSTEM_PROMPT,
    (rawJson: string) => {
      try {
        const validated = ClaudeFieldSchema.safeParse(JSON.parse(rawJson));
        if (!validated.success) return;
        let field = mapClaudeField(validated.data);
        if (validated.data.field === "government_warning") {
          const { status, notes } = validateGovernmentWarning(field.foundValue);
          field = { ...field, status, notes };
        }
        fields.push(field);
        onField(field);
      } catch {
        // ignore malformed partial objects
      }
    },
    signal,
  );

  // Fallback: streaming missed all fields - parse the complete response instead
  if (fields.length === 0) {
    const parsed = tryParse(fullText);
    if (parsed) {
      const checked = applyProgrammaticChecks(parsed);
      const result: VerificationResult = {
        ...checked,
        overallStatus: deriveOverallStatus(checked.fields),
        processingTimeMs: Date.now() - start,
      };
      result.fields.forEach(onField);
      return result;
    }
    throw new Error("Stream produced no parseable fields");
  }

  // Extract image metadata from the full response
  const meta = tryParse(fullText);

  return {
    overallStatus: deriveOverallStatus(fields),
    fields,
    processingTimeMs: Date.now() - start,
    imageQuality: meta?.imageQuality,
    imageNotes: meta?.imageNotes,
  };
}
