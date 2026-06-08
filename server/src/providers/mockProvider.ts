import type { ImageMediaType } from "../types/index";
import type { AIProviderHealth, LabelVisionProvider } from "./types";

// Standard fields by beverage type, mirroring labelVerifier.ts FIELD_LIST_BY_TYPE.
const MOCK_FIELDS_BY_TYPE: Record<string, string[]> = {
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

function detectBeverageType(userMessage: string): string {
  if (/beer/i.test(userMessage)) return "beer";
  if (/wine/i.test(userMessage)) return "wine";
  return "distilled_spirits";
}

function buildMockResponseJson(userMessage: string): string {
  const bev = detectBeverageType(userMessage);
  const fields = (MOCK_FIELDS_BY_TYPE[bev] ?? MOCK_FIELDS_BY_TYPE["distilled_spirits"]).map(
    (field) => ({
      field,
      extracted: "[Mock — AI provider not active]",
      confidence: "not_visible",
      application: null,
      status: "extracted",
      notes: "Mock mode active. This result is simulated and must not be used for compliance decisions.",
    }),
  );

  return JSON.stringify({
    fields,
    image_quality: "good",
    image_notes:
      "MOCK MODE: Results are simulated. No image analysis was performed. Do not use for compliance review.",
  });
}

export class MockProvider implements LabelVisionProvider {
  readonly providerName = "mock";
  readonly mode = "mock" as const;

  async callVision(
    _imageBase64: string,
    _mediaType: ImageMediaType,
    userMessage: string,
    _systemPrompt?: string,
    signal?: AbortSignal,
  ): Promise<string> {
    if (signal?.aborted) {
      const err = new Error("Aborted");
      err.name = "AbortError";
      throw err;
    }
    return buildMockResponseJson(userMessage);
  }

  async streamVision(
    _imageBase64: string,
    _mediaType: ImageMediaType,
    userMessage: string,
    _systemPrompt: string | undefined,
    onField: (rawFieldJson: string) => void,
    signal?: AbortSignal,
  ): Promise<string> {
    if (signal?.aborted) {
      const err = new Error("Aborted");
      err.name = "AbortError";
      throw err;
    }
    const fullJson = buildMockResponseJson(userMessage);
    const parsed = JSON.parse(fullJson) as { fields: unknown[] };
    for (const field of parsed.fields) {
      if (signal?.aborted) break;
      onField(JSON.stringify(field));
    }
    return fullJson;
  }

  async healthCheck(): Promise<AIProviderHealth> {
    return {
      provider: "mock",
      configured: true,
      available: true,
      mode: "mock",
      message:
        "Mock mode active — results are simulated and must not be used for compliance review",
    };
  }
}