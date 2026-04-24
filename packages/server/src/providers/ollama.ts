import { LLMProvider, LLMMessage, LLMOptions } from './types.js';

export class OllamaProvider implements LLMProvider {
  constructor(private model: string, private baseUrl = 'http://localhost:11434') {}

  async chat(messages: LLMMessage[], options?: LLMOptions): Promise<string> {
    const body: any = { model: options?.model || this.model, messages, stream: false, options: { temperature: options?.temperature ?? 0.8, num_predict: options?.maxTokens ?? 1024 } };
    if (options?.jsonMode) body.format = 'json';
    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body), signal: AbortSignal.timeout(180000),
    });
    if (!res.ok) throw new Error(`Ollama error: ${res.status} ${await res.text()}`);
    const data = await res.json() as any;
    return data.message.content;
  }

  async test(model?: string) { await this.chat([{ role: 'user', content: 'Say "ok"' }], { maxTokens: 5, model }); return true; }

  async getModels(): Promise<string[]> {
    const res = await fetch(`${this.baseUrl}/api/tags`, { signal: AbortSignal.timeout(30000) });
    if (!res.ok) throw new Error(`Failed to fetch ollama models: ${res.status}`);
    const data = await res.json() as any;
    return data.models.map((m: any) => m.name);
  }
}
