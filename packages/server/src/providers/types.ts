import { TokenUsage } from '@ma-soi/shared';

/** A content block with optional cache control marker */
export interface ContentBlock {
  type: 'text';
  text: string;
  /** Mark this block for prompt caching (Anthropic: cache_control, OpenAI: prefix stability) */
  cacheControl?: boolean;
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  /** Simple string content or structured content blocks for cache control */
  content: string | ContentBlock[];
}
export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  model?: string;
  cacheControl?: { type: 'ephemeral' };
  /** Provider-specific extra body params (e.g. cache TTL for compatible providers) */
  extraBody?: Record<string, unknown>;
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

/** Helper: extract plain text from message content (string or ContentBlock[]) */
export function contentToString(content: string | ContentBlock[]): string {
  if (typeof content === 'string') return content;
  return content.map((b) => b.text).join('\n');
}
