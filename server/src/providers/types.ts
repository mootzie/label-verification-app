import type { ImageMediaType } from "../types/index";

export interface AIProviderHealth {
  provider: string;
  configured: boolean;
  available: boolean;
  mode: "real" | "mock";
  message: string;
}

export type ProviderErrorKind =
  | "timeout"
  | "auth"
  | "rate_limit"
  | "unavailable"
  | "invalid_response"
  | "endpoint_blocked"
  | "not_configured";

export class ProviderError extends Error {
  constructor(
    public readonly kind: ProviderErrorKind,
    message: string,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

export interface LabelVisionProvider {
  readonly providerName: string;
  readonly mode: "real" | "mock";
  callVision(
    imageBase64: string,
    mediaType: ImageMediaType,
    userMessage: string,
    systemPrompt?: string,
    signal?: AbortSignal,
  ): Promise<string>;
  streamVision(
    imageBase64: string,
    mediaType: ImageMediaType,
    userMessage: string,
    systemPrompt: string | undefined,
    onField: (rawFieldJson: string) => void,
    signal?: AbortSignal,
  ): Promise<string>;
  healthCheck(): Promise<AIProviderHealth>;
}