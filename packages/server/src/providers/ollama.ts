import { LLMProvider, LLMMessage, LLMOptions } from './types.js';

export class OllamaProvider implements LLMProvider {
  constructor(private model: string, private baseUrl = 'http://localhost:11434') {}

  async chat(messages: LLMMessage[], options?: LLMOptions): Promise<string> {
    const body: any = { model: this.model, messages, stream: false, options: { temperature: options?.temperature ?? 0.8, num_predict: options?.maxTokens ?? 1024 } };
    if (options?.jsonMode) body.format = 'json';
    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body), signal: AbortSignal.timeout(60000),
    });
    if (!res.ok) throw new Error(`Ollama error: ${res.status} ${await res.text()}`);
    const data = await res.json() as any;
    return data.message.content;
  }

  async test() { await this.chat([{ role: 'user', content: 'Say "ok"' }], { maxTokens: 5 }); return true; }
}
