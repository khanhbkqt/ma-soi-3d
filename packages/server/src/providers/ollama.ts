import { LLMProvider, LLMMessage, LLMOptions, LLMResponse, contentToString } from './types.js';

export class OllamaProvider implements LLMProvider {
  constructor(
    private model: string,
    private baseUrl = 'http://localhost:11434',
  ) {}

  async chat(messages: LLMMessage[], options?: LLMOptions): Promise<LLMResponse> {
    // Flatten ContentBlock[] to plain strings — Ollama doesn't support caching
    const flatMessages = messages.map((m) => ({
      role: m.role,
      content: contentToString(m.content),
    }));
    const body: any = {
      model: options?.model || this.model,
      messages: flatMessages,
      stream: false,
      keep_alive: '60m',
      options: {
        temperature: options?.temperature ?? 0.8,
        num_predict: options?.maxTokens ?? 1024,
      },
    };
    if (options?.jsonMode) body.format = 'json';
    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(180000),
    });
    if (!res.ok) throw new Error(`Ollama error: ${res.status} ${await res.text()}`);
    const data = (await res.json()) as any;
    return {
      content: data.message.content,
      usage:
        data.prompt_eval_count != null
          ? {
              promptTokens: data.prompt_eval_count || 0,
              completionTokens: data.eval_count || 0,
              totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
              cachedTokens: 0,
            }
          : undefined,
    };
  }

  async test(model?: string) {
    await this.chat([{ role: 'user', content: 'Say "ok"' }], { maxTokens: 5, model });
    return true;
  }

  async getModels(): Promise<string[]> {
    const res = await fetch(`${this.baseUrl}/api/tags`, { signal: AbortSignal.timeout(30000) });
    if (!res.ok) throw new Error(`Failed to fetch ollama models: ${res.status}`);
    const data = (await res.json()) as any;
    return data.models.map((m: any) => m.name);
  }
}
