export interface LLMMessage { role: 'system' | 'user' | 'assistant'; content: string; }
export interface LLMOptions { temperature?: number; maxTokens?: number; jsonMode?: boolean; model?: string; }

export interface LLMProvider {
  chat(messages: LLMMessage[], options?: LLMOptions): Promise<string>;
  test(model?: string): Promise<boolean>;
}
