import { LLMProvider, LLMMessage, LLMOptions } from './types.js';

export class OpenAIProvider implements LLMProvider {
  constructor(private apiKey: string, private model: string, private baseUrl = 'https://api.openai.com/v1') {}

  async chat(messages: LLMMessage[], options?: LLMOptions): Promise<string> {
    const body: any = { model: options?.model || this.model, messages, temperature: options?.temperature ?? 0.8, max_tokens: options?.maxTokens ?? 1024 };
    if (options?.jsonMode) body.response_format = { type: 'json_object' };
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.apiKey) headers['Authorization'] = `Bearer ${this.apiKey}`;
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST', headers,
      body: JSON.stringify(body), signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) throw new Error(`OpenAI error: ${res.status} ${await res.text()}`);
    const data = await res.json() as any;
    return data.choices[0].message.content;
  }

  async test(model?: string) { await this.chat([{ role: 'user', content: 'Say "ok"' }], { maxTokens: 5, model }); return true; }
}
