import { LLMProvider, LLMMessage, LLMOptions } from './types.js';

export class AnthropicProvider implements LLMProvider {
  constructor(private apiKey: string, private model: string) {}

  async chat(messages: LLMMessage[], options?: LLMOptions): Promise<string> {
    const system = messages.find(m => m.role === 'system')?.content || '';
    const msgs = messages.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content }));
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': this.apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: this.model, max_tokens: options?.maxTokens ?? 1024, system, messages: msgs, temperature: options?.temperature ?? 0.8 }),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) throw new Error(`Anthropic error: ${res.status} ${await res.text()}`);
    const data = await res.json() as any;
    return data.content[0].text;
  }

  async test() { await this.chat([{ role: 'user', content: 'Say "ok"' }], { maxTokens: 5 }); return true; }
}
