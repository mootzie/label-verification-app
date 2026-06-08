import { AnthropicProvider } from "./anthropicProvider";
import { AzureFoundryProvider } from "./azureFoundryProvider";
import { MockProvider } from "./mockProvider";
import type { LabelVisionProvider } from "./types";

export { ProviderError } from "./types";
export type { AIProviderHealth, LabelVisionProvider } from "./types";

type ProviderName = "anthropic_direct" | "azure_foundry" | "mock";

function resolveProviderName(): ProviderName {
  const requested = (process.env.AI_PROVIDER ?? "").trim().toLowerCase() as ProviderName;

  if (requested === "azure_foundry") return "azure_foundry";
  if (requested === "mock") return "mock";

  // Default to anthropic_direct when API key is present, mock otherwise.
  if (requested === "anthropic_direct" || requested === "") {
    if (process.env.ANTHROPIC_API_KEY) return "anthropic_direct";
    console.warn(
      "[ai-provider] No ANTHROPIC_API_KEY found and AI_PROVIDER not set. " +
        "Falling back to mock mode. Results will be simulated.",
    );
    return "mock";
  }

  console.warn(
    `[ai-provider] Unknown AI_PROVIDER value "${requested}". Falling back to mock mode.`,
  );
  return "mock";
}

let _provider: LabelVisionProvider | null = null;

export function getProvider(): LabelVisionProvider {
  if (_provider) return _provider;

  const name = resolveProviderName();
  switch (name) {
    case "azure_foundry":
      _provider = new AzureFoundryProvider();
      break;
    case "mock":
      _provider = new MockProvider();
      break;
    default:
      _provider = new AnthropicProvider();
  }

  console.log(`[ai-provider] Active provider: ${_provider.providerName} (mode: ${_provider.mode})`);
  return _provider;
}

/** Reset cached provider — used in tests only. */
export function _resetProvider(): void {
  _provider = null;
}