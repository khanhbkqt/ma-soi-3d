import { TokenUsage } from '@ma-soi/shared';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  model?: string;
  cacheControl?: { type: 'ephemeral' };
}

export interface CacheMetrics {
  cachedTokens: number;
  cacheWriteTokens: number;
}

export interface LLMResponse {
  content: string;
  usage?: TokenUsage;
  cacheMetrics?: CacheMetrics;
}

export interface LLMProvider {
  chat(messages: LLMMessage[], options?: LLMOptions): Promise<LLMResponse>;
  test(model?: string): Promise<boolean>;
  getModels?(): Promise<string[]>;
}
