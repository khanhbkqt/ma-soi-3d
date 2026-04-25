import { LLMProvider, LLMMessage, LLMOptions, LLMResponse, contentToString } from './types.js';

export class OpenAIProvider implements LLMProvider {
  constructor(
    private apiKey: string,
    private model: string,
    private baseUrl = 'https://api.openai.com/v1',
  ) {}

  async chat(messages: LLMMessage[], options?: LLMOptions): Promise<LLMResponse> {
    // Flatten ContentBlock[] to plain strings — OpenAI auto-caches matching prefixes
    const flatMessages = messages.map((m) => ({
      role: m.role,
      content: contentToString(m.content),
    }));
    const body: any = {
      model: options?.model || this.model,
      messages: flatMessages,
      temperature: options?.temperature ?? 0.8,
      max_tokens: options?.maxTokens ?? 1024,
      ...options?.extraBody,
    };
    if (options?.jsonMode) body.response_format = { type: 'json_object' };
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.apiKey) headers['Authorization'] = `Bearer ${this.apiKey}`;
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(180000),
    });
    if (!res.ok) throw new Error(`OpenAI error: ${res.status} ${await res.text()}`);
    const data = (await res.json()) as any;
    return {
      content: data.choices[0].message.content,
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens || 0,
            completionTokens: data.usage.completion_tokens || 0,
            totalTokens: data.usage.total_tokens || 0,
            cachedTokens: data.usage.prompt_tokens_details?.cached_tokens || 0,
          }
        : undefined,
      cacheMetrics: data.usage
        ? {
            cachedTokens: data.usage.prompt_tokens_details?.cached_tokens || 0,
            cacheWriteTokens: 0,
          }
        : undefined,
    };
  }

  async test(model?: string) {
    await this.chat([{ role: 'user', content: 'Say "ok"' }], { maxTokens: 5, model });
    return true;
  }

  async getModels(): Promise<string[]> {
    const headers: Record<string, string> = {};
    if (this.apiKey) headers['Authorization'] = `Bearer ${this.apiKey}`;
    const res = await fetch(`${this.baseUrl}/models`, {
      headers,
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) throw new Error(`Failed to fetch models: ${res.status}`);
    const data = (await res.json()) as any;
    return data.data.map((m: any) => m.id);
  }
}
