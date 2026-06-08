import Anthropic from "@anthropic-ai/sdk";
import {
  callClaudeVision,
  streamClaudeVision,
} from "../services/claude";
import type { ImageMediaType } from "../types/index";
import {
  ProviderError,
  type AIProviderHealth,
  type LabelVisionProvider,
} from "./types";

function wrapAnthropicError(err: unknown): never {
  if (err instanceof Anthropic.APIConnectionTimeoutError) {
    throw new ProviderError("timeout", "Claude API request timed out");
  }
  if (err instanceof Anthropic.AuthenticationError) {
    throw new ProviderError("auth", "Claude API authentication failed — check ANTHROPIC_API_KEY");
  }
  if (err instanceof Anthropic.RateLimitError) {
    throw new ProviderError("rate_limit", "Claude API rate limit exceeded");
  }
  if (err instanceof Anthropic.APIConnectionError) {
    throw new ProviderError("endpoint_blocked", "Could not reach Claude API endpoint");
  }
  if (err instanceof Anthropic.APIError) {
    throw new ProviderError("unavailable", `Claude API error: ${err.message}`);
  }
  throw err;
}

export class AnthropicProvider implements LabelVisionProvider {
  readonly providerName = "anthropic_direct";
  readonly mode = "real" as const;

  async callVision(
    imageBase64: string,
    mediaType: ImageMediaType,
    userMessage: string,
    systemPrompt?: string,
    signal?: AbortSignal,
  ): Promise<string> {
    try {
      return await callClaudeVision(imageBase64, mediaType, userMessage, systemPrompt, signal);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") throw err;
      wrapAnthropicError(err);
    }
  }

  async streamVision(
    imageBase64: string,
    mediaType: ImageMediaType,
    userMessage: string,
    systemPrompt: string | undefined,
    onField: (rawFieldJson: string) => void,
    signal?: AbortSignal,
  ): Promise<string> {
    try {
      return await streamClaudeVision(imageBase64, mediaType, userMessage, systemPrompt, onField, signal);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") throw err;
      wrapAnthropicError(err);
    }
  }

  async healthCheck(): Promise<AIProviderHealth> {
    const configured = Boolean(process.env.ANTHROPIC_API_KEY);
    return {
      provider: "anthropic_direct",
      configured,
      available: configured,
      mode: "real",
      message: configured
        ? "Claude API — direct connection via ANTHROPIC_API_KEY"
        : "ANTHROPIC_API_KEY is not set",
    };
  }
}