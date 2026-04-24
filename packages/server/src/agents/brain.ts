import { Player, GameState, Role, AgentMemory, DayMessage, isWolfRole } from '@ma-soi/shared';
import { LLMProvider, LLMMessage } from '../providers/index.js';
import * as prompts from './prompts.js';

export class AgentBrain {
  memory: AgentMemory = { observations: [], reflections: [], knownRoles: {}, suspicions: {} };

  constructor(public player: Player, private provider: LLMProvider) {}

  addObservation(obs: string) { this.memory.observations.push(obs); }

  private async ask(prompt: string, jsonMode = true): Promise<string> {
    const messages: LLMMessage[] = [
      { role: 'system', content: 'Mày đang chơi Ma Sói với bạn bè. Nói tiếng Việt tự nhiên, kiểu đời thường — được chọc ghẹo, mỉa mai, nói tục nhẹ. KHÔNG ĐƯỢC nói kiểu AI, lịch sự giả tạo, hay dài dòng. Trả lời bằng JSON đúng format được yêu cầu.' },
      { role: 'user', content: prompt },
    ];
    try {
      return await this.provider.chat(messages, { temperature: 0.85, maxTokens: 300, jsonMode });
    } catch (e) {
      console.error(`[AgentBrain] ${this.player.name} LLM error:`, e);
      return '{}';
    }
  }

  async decideWolfKill(state: GameState): Promise<string> {
    const prompt = prompts.wolfKillPrompt(this.player, state, this.memory.observations);
    const res = await this.ask(prompt);
    const valid = state.players.filter(p => p.alive && !isWolfRole(p.role)).map(p => p.name);
    const parsed = prompts.parseActionResponse(res, valid);
    return parsed.target || valid[0];
  }

  async decideWolfDoubleKill(state: GameState): Promise<[string, string]> {
    const prompt = prompts.wolfDoubleKillPrompt(this.player, state, this.memory.observations);
    const res = await this.ask(prompt);
    const valid = state.players.filter(p => p.alive && !isWolfRole(p.role)).map(p => p.name);
    const parsed = prompts.parseActionResponse(res, valid);
    const t1 = parsed.target1 || parsed.target || valid[0];
    const t2 = parsed.target2 || valid.find(n => n !== t1) || valid[0];
    return [t1, t2];
  }

  async decideAlphaInfect(state: GameState): Promise<{ target: string; infect: boolean }> {
    const prompt = prompts.alphaInfectPrompt(this.player, state, this.memory.observations);
    const res = await this.ask(prompt);
    const valid = state.players.filter(p => p.alive && !isWolfRole(p.role)).map(p => p.name);
    const parsed = prompts.parseActionResponse(res, valid);
    return { target: parsed.target || valid[0], infect: !!parsed.infect };
  }

  async decideSeerInvestigate(state: GameState): Promise<string> {
    const prompt = prompts.seerInvestigatePrompt(this.player, state, this.memory.observations);
    const res = await this.ask(prompt);
    const valid = state.players.filter(p => p.alive && p.id !== this.player.id).map(p => p.name);
    const parsed = prompts.parseActionResponse(res, valid);
    return parsed.target || valid[0];
  }

  async decideWitchAction(state: GameState, killedName: string | null, potions: { healUsed: boolean; killUsed: boolean }): Promise<{ heal: boolean; killTarget: string | null }> {
    const prompt = prompts.witchActionPrompt(this.player, state, this.memory.observations, killedName, potions);
    const res = await this.ask(prompt);
    const valid = state.players.filter(p => p.alive && p.id !== this.player.id).map(p => p.name);
    const parsed = prompts.parseActionResponse(res, valid);
    return { heal: !!parsed.heal, killTarget: parsed.killTarget || null };
  }

  async decideGuardProtect(state: GameState, lastGuardedId: string | null): Promise<string> {
    const prompt = prompts.guardProtectPrompt(this.player, state, this.memory.observations, lastGuardedId);
    const res = await this.ask(prompt);
    const valid = state.players.filter(p => p.alive && p.id !== lastGuardedId).map(p => p.name);
    const parsed = prompts.parseActionResponse(res, valid);
    return parsed.target || valid[0];
  }

  async decideCupidPair(state: GameState): Promise<[string, string]> {
    const prompt = prompts.cupidPairPrompt(this.player, state, this.memory.observations);
    const res = await this.ask(prompt);
    const valid = state.players.filter(p => p.alive).map(p => p.name);
    const parsed = prompts.parseActionResponse(res, valid);
    const p1 = parsed.player1 || valid[0];
    const p2 = parsed.player2 || valid.find(n => n !== p1) || valid[1];
    return [p1, p2];
  }

  async discuss(state: GameState, messages: DayMessage[], round: number): Promise<string> {
    const prompt = prompts.discussionPrompt(this.player, state, this.memory.observations, messages, round);
    const res = await this.ask(prompt);
    const parsed = prompts.parseActionResponse(res, []);
    return parsed.message || "...";
  }

  async vote(state: GameState, messages: DayMessage[]): Promise<string> {
    const prompt = prompts.votePrompt(this.player, state, this.memory.observations, messages);
    const res = await this.ask(prompt);
    const valid = state.players.filter(p => p.alive && p.id !== this.player.id).map(p => p.name);
    const parsed = prompts.parseActionResponse(res, [...valid, 'skip']);
    return parsed.target || valid[0];
  }

  async defend(state: GameState, messages: DayMessage[]): Promise<string> {
    const prompt = prompts.defensePrompt(this.player, state, this.memory.observations, messages);
    const res = await this.ask(prompt);
    const parsed = prompts.parseActionResponse(res, []);
    return parsed.message || "Tao vô tội!";
  }

  async judgeVote(state: GameState, accusedName: string, defenseSpeech: string): Promise<'kill' | 'spare'> {
    const prompt = prompts.judgementVotePrompt(this.player, state, this.memory.observations, accusedName, defenseSpeech);
    const res = await this.ask(prompt);
    try {
      const json = JSON.parse(res.match(/\{[\s\S]*\}/)?.[0] || '{}');
      return json.verdict === 'spare' ? 'spare' : 'kill';
    } catch { return 'kill'; }
  }

  async hunterShot(state: GameState): Promise<string> {
    const prompt = prompts.hunterShotPrompt(this.player, state, this.memory.observations);
    const res = await this.ask(prompt);
    const valid = state.players.filter(p => p.alive && p.id !== this.player.id).map(p => p.name);
    const parsed = prompts.parseActionResponse(res, valid);
    return parsed.target || valid[0];
  }
}
