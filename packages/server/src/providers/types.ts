export interface LLMMessage { role: 'system' | 'user' | 'assistant'; content: string; }
export interface LLMOptions { temperature?: number; maxTokens?: number; jsonMode?: boolean; }

export interface LLMProvider {
  chat(messages: LLMMessage[], options?: LLMOptions): Promise<string>;
  test(): Promise<boolean>;
}
