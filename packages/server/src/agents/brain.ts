import { Player, GameState, Role, AgentMemory, DayMessage, isWolfRole } from '@ma-soi/shared';
import { LLMProvider, LLMMessage } from '../providers/index.js';
import { getPromptBuilder, parseActionResponse } from './prompt-builders/index.js';
import { WolfPromptBuilder, AlphaWolfPromptBuilder } from './prompt-builders/index.js';
import { SeerPromptBuilder } from './prompt-builders/index.js';
import { WitchPromptBuilder } from './prompt-builders/index.js';
import { GuardPromptBuilder } from './prompt-builders/index.js';
import { HunterPromptBuilder } from './prompt-builders/index.js';
import { CupidPromptBuilder } from './prompt-builders/index.js';
import { RoleDeductionTracker } from './role-deduction.js';

export class AgentBrain {
  memory: AgentMemory = { observations: [], reflections: [], knownRoles: {}, suspicions: {} };
  readonly deduction = new RoleDeductionTracker();

  constructor(public player: Player, private provider: LLMProvider) {}

  addObservation(obs: string) {
    this.memory.observations.push(obs);
    this.deduction.ingest(obs);
  }

  private get builder() { return getPromptBuilder(this.player.role); }

  private get deductionBlock(): string {
    return this.deduction.buildPrompt(this.player.role, this.player.name);
  }

  private async ask(prompt: string, state: GameState, jsonMode = true): Promise<string> {
    // Inject deduction analysis into user prompt
    const deduc = this.deductionBlock;
    const userContent = deduc ? `${deduc}\n\n${prompt}` : prompt;
    const messages: LLMMessage[] = [
      { role: 'system', content: this.builder.systemPrompt(this.player, state) },
      { role: 'user', content: userContent },
    ];
    try {
      return await this.provider.chat(messages, { temperature: 0.85, maxTokens: 300, jsonMode, model: this.player.modelName });
    } catch (e) {
      console.error(`[AgentBrain] ${this.player.name} LLM error:`, e);
      return '{}';
    }
  }

  // ── Night actions ──

  async decideWolfDiscuss(state: GameState, messages: { playerName: string; message: string }[], round: number): Promise<string> {
    const b = this.builder as WolfPromptBuilder;
    const prompt = b.wolfDiscussionHint(this.player, state, this.memory.observations, messages);
    const res = await this.ask(prompt, state);
    return parseActionResponse(res, []).message || "Cắn thằng nào cũng được.";
  }

  async decideWolfKill(state: GameState, discussion: { playerName: string; message: string }[] = []): Promise<string> {
    const b = this.builder as WolfPromptBuilder;
    const prompt = b.wolfKill(this.player, state, this.memory.observations, discussion);
    const res = await this.ask(prompt, state);
    const valid = state.players.filter(p => p.alive && !isWolfRole(p.role)).map(p => p.name);
    return parseActionResponse(res, valid).target || valid[0];
  }

  async decideWolfDoubleKill(state: GameState, discussion: { playerName: string; message: string }[] = []): Promise<[string, string]> {
    const b = this.builder as WolfPromptBuilder;
    const prompt = b.wolfDoubleKill(this.player, state, this.memory.observations, discussion);
    const res = await this.ask(prompt, state);
    const valid = state.players.filter(p => p.alive && !isWolfRole(p.role)).map(p => p.name);
    const parsed = parseActionResponse(res, valid);
    const t1 = parsed.target1 || parsed.target || valid[0];
    const t2 = parsed.target2 || valid.find(n => n !== t1) || valid[0];
    return [t1, t2];
  }

  async decideAlphaInfect(state: GameState, discussion: { playerName: string; message: string }[] = []): Promise<{ target: string; infect: boolean }> {
    const b = this.builder as AlphaWolfPromptBuilder;
    const prompt = b.alphaInfect(this.player, state, this.memory.observations, discussion);
    const res = await this.ask(prompt, state);
    const valid = state.players.filter(p => p.alive && !isWolfRole(p.role)).map(p => p.name);
    const parsed = parseActionResponse(res, valid);
    return { target: parsed.target || valid[0], infect: !!parsed.infect };
  }

  async decideSeerInvestigate(state: GameState): Promise<string> {
    const b = this.builder as SeerPromptBuilder;
    const prompt = b.seerInvestigate(this.player, state, this.memory.observations);
    const res = await this.ask(prompt, state);
    const valid = state.players.filter(p => p.alive && p.id !== this.player.id).map(p => p.name);
    return parseActionResponse(res, valid).target || valid[0];
  }

  async decideWitchAction(state: GameState, killedName: string | null, potions: { healUsed: boolean; killUsed: boolean }): Promise<{ heal: boolean; killTarget: string | null }> {
    const b = this.builder as WitchPromptBuilder;
    const prompt = b.witchAction(this.player, state, this.memory.observations, killedName, potions);
    const res = await this.ask(prompt, state);
    const valid = state.players.filter(p => p.alive && p.id !== this.player.id).map(p => p.name);
    const parsed = parseActionResponse(res, valid);
    return { heal: !!parsed.heal, killTarget: parsed.killTarget || null };
  }

  async decideGuardProtect(state: GameState, lastGuardedId: string | null): Promise<string> {
    const b = this.builder as GuardPromptBuilder;
    const prompt = b.guardProtect(this.player, state, this.memory.observations, lastGuardedId);
    const res = await this.ask(prompt, state);
    const valid = state.players.filter(p => p.alive && p.id !== lastGuardedId).map(p => p.name);
    return parseActionResponse(res, valid).target || valid[0];
  }

  async decideCupidPair(state: GameState): Promise<[string, string]> {
    const b = this.builder as CupidPromptBuilder;
    const prompt = b.cupidPair(this.player, state, this.memory.observations);
    const res = await this.ask(prompt, state);
    const valid = state.players.filter(p => p.alive).map(p => p.name);
    const parsed = parseActionResponse(res, valid);
    const p1 = parsed.player1 || valid[0];
    const p2 = parsed.player2 || valid.find(n => n !== p1) || valid[1];
    return [p1, p2];
  }

  // ── Day actions ──

  async discuss(state: GameState, messages: DayMessage[], round: number): Promise<string> {
    const prompt = this.builder.discuss(this.player, state, this.memory.observations, messages, round);
    const res = await this.ask(prompt, state);
    return parseActionResponse(res, []).message || "...";
  }

  async vote(state: GameState, messages: DayMessage[]): Promise<string> {
    const prompt = this.builder.vote(this.player, state, this.memory.observations, messages);
    const res = await this.ask(prompt, state);
    const valid = state.players.filter(p => p.alive && p.id !== this.player.id).map(p => p.name);
    return parseActionResponse(res, [...valid, 'skip']).target || valid[0];
  }

  async defend(state: GameState, messages: DayMessage[]): Promise<string> {
    const prompt = this.builder.defense(this.player, state, this.memory.observations, messages);
    const res = await this.ask(prompt, state);
    return parseActionResponse(res, []).message || "Tao vô tội!";
  }

  async judgeVote(state: GameState, accusedName: string, defenseSpeech: string, messages: DayMessage[]): Promise<'kill' | 'spare'> {
    const prompt = this.builder.judgement(this.player, state, this.memory.observations, accusedName, defenseSpeech, messages);
    const res = await this.ask(prompt, state);
    try {
      const json = JSON.parse(res.match(/\{[\s\S]*\}/)?.[0] || '{}');
      return json.verdict === 'spare' ? 'spare' : 'kill';
    } catch { return 'kill'; }
  }

  async hunterShot(state: GameState): Promise<string> {
    const b = this.builder as HunterPromptBuilder;
    const prompt = b.hunterShot(this.player, state, this.memory.observations);
    const res = await this.ask(prompt, state);
    const valid = state.players.filter(p => p.alive && p.id !== this.player.id).map(p => p.name);
    return parseActionResponse(res, valid).target || valid[0];
  }
}
