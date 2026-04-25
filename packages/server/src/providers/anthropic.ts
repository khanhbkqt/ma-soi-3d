import { LLMProvider, LLMMessage, LLMOptions, LLMResponse } from './types.js';

export class AnthropicProvider implements LLMProvider {
  constructor(
    private apiKey: string,
    private model: string,
  ) {}

  async chat(messages: LLMMessage[], options?: LLMOptions): Promise<LLMResponse> {
    const system = messages.find((m) => m.role === 'system')?.content || '';
    const msgs = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role, content: m.content }));
    const body: any = {
      model: options?.model || this.model,
      max_tokens: options?.maxTokens ?? 1024,
      system,
      messages: msgs,
      temperature: options?.temperature ?? 0.8,
    };
    // Enable automatic prompt caching
    if (options?.cacheControl) {
      body.cache_control = options.cacheControl;
    }
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(180000),
    });
    if (!res.ok) throw new Error(`Anthropic error: ${res.status} ${await res.text()}`);
    const data = (await res.json()) as any;
    const cacheRead = data.usage?.cache_read_input_tokens || 0;
    const cacheWrite = data.usage?.cache_creation_input_tokens || 0;
    const inputTokens = (data.usage?.input_tokens || 0) + cacheRead + cacheWrite;
    return {
      content: data.content[0].text,
      usage: data.usage
        ? {
            promptTokens: inputTokens,
            completionTokens: data.usage.output_tokens || 0,
            totalTokens: inputTokens + (data.usage.output_tokens || 0),
            cachedTokens: cacheRead,
          }
        : undefined,
      cacheMetrics: {
        cachedTokens: cacheRead,
        cacheWriteTokens: cacheWrite,
      },
    };
  }

  async test(model?: string) {
    await this.chat([{ role: 'user', content: 'Say "ok"' }], { maxTokens: 5, model });
    return true;
  }

  async getModels(): Promise<string[]> {
    return [
      'claude-3-7-sonnet-latest',
      'claude-3-5-sonnet-latest',
      'claude-3-5-haiku-latest',
      'claude-3-opus-latest',
      'claude-3-7-sonnet-20250219',
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
    ];
  }
}
