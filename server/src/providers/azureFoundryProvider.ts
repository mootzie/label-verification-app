import type { ImageMediaType } from "../types/index";
import {
  ProviderError,
  type AIProviderHealth,
  type LabelVisionProvider,
} from "./types";

interface AzureFoundryConfig {
  endpoint: string;
  apiKey: string;
  deployment: string;
  apiVersion: string;
}

function loadConfig(): AzureFoundryConfig {
  const missing: string[] = [];
  const endpoint = process.env.AZURE_FOUNDRY_ENDPOINT ?? "";
  const apiKey = process.env.AZURE_FOUNDRY_API_KEY ?? "";
  const deployment = process.env.AZURE_FOUNDRY_DEPLOYMENT ?? "";
  const apiVersion = process.env.AZURE_FOUNDRY_API_VERSION ?? "2024-02-01";

  if (!endpoint) missing.push("AZURE_FOUNDRY_ENDPOINT");
  if (!apiKey) missing.push("AZURE_FOUNDRY_API_KEY");
  if (!deployment) missing.push("AZURE_FOUNDRY_DEPLOYMENT");

  if (missing.length > 0) {
    throw new ProviderError(
      "not_configured",
      `Azure Foundry provider not configured. Missing environment variables: ${missing.join(", ")}`,
    );
  }

  return { endpoint, apiKey, deployment, apiVersion };
}

function isConfigured(): boolean {
  return Boolean(
    process.env.AZURE_FOUNDRY_ENDPOINT &&
      process.env.AZURE_FOUNDRY_API_KEY &&
      process.env.AZURE_FOUNDRY_DEPLOYMENT,
  );
}

export class AzureFoundryProvider implements LabelVisionProvider {
  readonly providerName = "azure_foundry";
  readonly mode = "real" as const;

  async callVision(
    _imageBase64: string,
    _mediaType: ImageMediaType,
    _userMessage: string,
    _systemPrompt?: string,
    _signal?: AbortSignal,
  ): Promise<string> {
    // Config validation — throws ProviderError if not configured.
    loadConfig();

    // Full implementation requires Azure AI Foundry SDK integration.
    // Wire up the Azure OpenAI-compatible vision endpoint here using the
    // loaded config: POST to {endpoint}/openai/deployments/{deployment}/chat/completions
    // with api-version={apiVersion} and api-key header.
    throw new ProviderError(
      "unavailable",
      "Azure Foundry provider is configured but the full SDK integration is not yet implemented. " +
        "Connect the Azure AI Foundry SDK using the AZURE_FOUNDRY_* environment variables.",
    );
  }

  async streamVision(
    _imageBase64: string,
    _mediaType: ImageMediaType,
    _userMessage: string,
    _systemPrompt: string | undefined,
    _onField: (rawFieldJson: string) => void,
    _signal?: AbortSignal,
  ): Promise<string> {
    loadConfig();
    throw new ProviderError(
      "unavailable",
      "Azure Foundry provider is configured but the full SDK integration is not yet implemented.",
    );
  }

  async healthCheck(): Promise<AIProviderHealth> {
    if (!isConfigured()) {
      return {
        provider: "azure_foundry",
        configured: false,
        available: false,
        mode: "real",
        message: "Missing required Azure Foundry environment variables (AZURE_FOUNDRY_ENDPOINT, AZURE_FOUNDRY_API_KEY, AZURE_FOUNDRY_DEPLOYMENT)",
      };
    }
    return {
      provider: "azure_foundry",
      configured: true,
      available: false,
      mode: "real",
      message: "Azure Foundry provider is configured but SDK integration is pending. Contact your deployment team.",
    };
  }
}