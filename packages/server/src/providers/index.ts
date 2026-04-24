import { ProviderConfig } from '@ma-soi/shared';
import { LLMProvider } from './types.js';
import { OpenAIProvider } from './openai.js';
import { AnthropicProvider } from './anthropic.js';
import { OllamaProvider } from './ollama.js';

export type { LLMProvider, LLMMessage, LLMOptions, LLMResponse } from './types.js';

const providers = new Map<string, LLMProvider>();

export function createProvider(config: ProviderConfig): LLMProvider {
  switch (config.type) {
    case 'openai-compatible':
    case 'openai':
      return new OpenAIProvider(config.apiKey || '', config.model, config.baseUrl);
    case 'anthropic':
      return new AnthropicProvider(config.apiKey!, config.model);
    case 'ollama':
      return new OllamaProvider(config.model, config.baseUrl || 'http://localhost:11434');
    default:
      throw new Error(`Unknown provider type: ${(config as any).type}`);
  }
}

export function registerProvider(config: ProviderConfig) {
  providers.set(config.id, createProvider(config));
}

export function getProvider(id: string): LLMProvider {
  const p = providers.get(id);
  if (!p) throw new Error(`Provider ${id} not found`);
  return p;
}

export function registerAllProviders(configs: ProviderConfig[]) {
  providers.clear();
  configs.forEach(registerProvider);
}
