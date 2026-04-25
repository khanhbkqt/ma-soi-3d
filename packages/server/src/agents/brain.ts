import {
  Player,
  GameState,
  Role,
  AgentMemory,
  DayMessage,
  isWolfRole,
  TokenUsage,
} from '@ma-soi/shared';
import { LLMProvider, LLMMessage } from '../providers/index.js';
import { getPromptBuilder, parseActionResponse } from './prompt-builders/index.js';
import { WolfPromptBuilder, AlphaWolfPromptBuilder } from './prompt-builders/index.js';
import { SeerPromptBuilder } from './prompt-builders/index.js';
import { WitchPromptBuilder } from './prompt-builders/index.js';
import { GuardPromptBuilder } from './prompt-builders/index.js';
import { HunterPromptBuilder } from './prompt-builders/index.js';
import { CupidPromptBuilder } from './prompt-builders/index.js';
import { RoleDeductionTracker } from './role-deduction.js';
import {
  SituationAnalyzer,
  formatSignals,
  ActionType,
  AnalyzerContext,
  RecentDeath,
} from './situation-analyzer.js';

export class AgentBrain {
  memory: AgentMemory = { observations: [], reflections: [], knownRoles: {}, suspicions: {} };
  readonly deduction = new RoleDeductionTracker();
  private readonly analyzer = new SituationAnalyzer();
  private actionType: ActionType = 'discuss';
  private actionMessages: DayMessage[] = [];
  lastReasoning: string | undefined;
  tokenUsage: TokenUsage = {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    cachedTokens: 0,
  };
  callCount = 0;

  constructor(
    public player: Player,
    private provider: LLMProvider,
  ) {}

  addObservation(obs: string) {
    this.memory.observations.push(obs);
    this.deduction.ingest(obs);
  }

  private get builder() {
    return getPromptBuilder(this.player.role);
  }

  private get deductionBlock(): string {
    return this.deduction.buildPrompt(this.player.role, this.player.name);
  }

  /** Names that Seer confirmed NOT_WOLF */
  private get seerClearNames(): string[] {
    return [...this.deduction.seerResults].filter(([, r]) => r === 'clear').map(([name]) => name);
  }

  /** Names confirmed as village-side (seer clear + dead village roles) */
  private get confirmedVillageNames(): string[] {
    const villageRoles = new Set([
      'Dân',
      'Tiên Tri',
      'Tiên Tri Tập Sự',
      'Phù Thủy',
      'Thợ Săn',
      'Bảo Vệ',
      'Thần Tình Yêu',
      'Kẻ Ngốc',
    ]);
    const fromDeaths = [...this.deduction.confirmed]
      .filter(([, r]) => villageRoles.has(r.role))
      .map(([name]) => name);
    return [...new Set([...this.seerClearNames, ...fromDeaths])];
  }

  private isSeerRole(): boolean {
    return this.player.role === Role.Seer || this.player.role === Role.ApprenticeSeer;
  }

  private setAction(type: ActionType, messages: DayMessage[] = []) {
    this.actionType = type;
    this.actionMessages = messages;
  }

  /**
   * Extract recent deaths from observations for the current round.
   * Matches: "X đã chết (bị sói cắn). Vai: Dân." format.
   */
  private extractRecentDeaths(state: GameState): RecentDeath[] {
    if (state.round <= 1) return [];

    const deaths: RecentDeath[] = [];
    const deathPattern = /^(.+?) đã chết \((.+?)\)\. Vai: (.+?)\.$/;
    const causeMap: Record<string, string> = {
      'bị sói cắn': 'wolf_kill',
      'bị đầu độc': 'witch_kill',
      'bị Thợ Săn bắn': 'hunter_shot',
      'chết theo người yêu': 'lover_death',
      'bị treo cổ': 'judged',
    };

    // Scan recent observations (last 30) for death events
    // We scan from the end backwards — deaths from current dawn appear after the Dawn marker
    const recentObs = this.memory.observations.slice(-30);
    let foundDawn = false;

    for (let i = recentObs.length - 1; i >= 0; i--) {
      const obs = recentObs[i];

      // Mark that we've found a Dawn phase marker for the current round
      if (obs.includes('Rạng sáng') || obs.includes('Ban ngày')) {
        if (obs.includes(`Vòng ${state.round}`)) {
          foundDawn = true;
        }
      }

      // Match death observations
      const m = obs.match(deathPattern);
      if (m && !deaths.some((d) => d.name === m[1])) {
        const cause = causeMap[m[2]] || m[2];
        deaths.push({ name: m[1], role: m[3], cause });
      }

      // Stop scanning once we hit a Night phase marker (too far back)
      if (obs.includes('Đêm') && obs.includes('Vòng')) {
        break;
      }
    }

    return deaths;
  }

  private async ask(prompt: string, state: GameState, jsonMode = true): Promise<string> {
    // Inject deduction analysis into user prompt
    const deduc = this.deductionBlock;
    // Inject situation signals
    const sigCtx: AnalyzerContext = {
      player: this.player,
      state,
      messages: this.actionMessages,
      observations: this.memory.observations,
      deduction: this.deduction,
      actionType: this.actionType,
      recentDeaths: this.extractRecentDeaths(state),
    };
    const signals = this.analyzer.analyze(sigCtx);
    const situationBlock = formatSignals(signals);

    let userContent = prompt;
    // Inject <event_log> inside <game_knowledge> (it's data, belongs with memory)
    if (deduc && userContent.includes('<game_knowledge>')) {
      userContent = userContent.replace('<game_knowledge>\n', `<game_knowledge>\n${deduc}\n\n`);
    } else if (deduc) {
      userContent = `${deduc}\n\n${userContent}`;
    }
    // Inject <current_situation> between <game_knowledge> and the rest
    if (situationBlock) {
      const gkEnd = '</game_knowledge>';
      const idx = userContent.indexOf(gkEnd);
      if (idx !== -1) {
        const insertAt = idx + gkEnd.length;
        userContent = `${userContent.slice(0, insertAt)}\n\n${situationBlock}${userContent.slice(insertAt)}`;
      } else {
        userContent = `${situationBlock}\n\n${userContent}`;
      }
    }

    const messages: LLMMessage[] = [
      { role: 'system', content: this.builder.systemPrompt(this.player, state) },
      { role: 'user', content: userContent },
    ];
    try {
      const res = await this.provider.chat(messages, {
        temperature: 0.85,
        maxTokens: 250,
        jsonMode,
        model: this.player.modelName,
        cacheControl: { type: 'ephemeral' },
      });
      const content = res.content;
      if (res.usage) {
        this.tokenUsage.promptTokens += res.usage.promptTokens;
        this.tokenUsage.completionTokens += res.usage.completionTokens;
        this.tokenUsage.totalTokens += res.usage.totalTokens;
        this.tokenUsage.cachedTokens += res.usage.cachedTokens || 0;
      }
      this.callCount++;
      try {
        const json = JSON.parse(content.match(/\{[\s\S]*\}/)?.[0] || '{}');
        this.lastReasoning = json.reasoning || undefined;
      } catch {
        this.lastReasoning = undefined;
      }
      return content;
    } catch (e) {
      console.error(`[AgentBrain] ${this.player.name} LLM error:`, e);
      this.lastReasoning = undefined;
      return '{}';
    }
  }

  // ── Night actions ──

  async decideWolfDiscuss(
    state: GameState,
    messages: { playerName: string; message: string }[],
    round: number,
  ): Promise<string> {
    this.setAction('night');
    const b = this.builder as WolfPromptBuilder;
    const prompt = b.wolfDiscussionHint(this.player, state, this.memory.observations, messages);
    const res = await this.ask(prompt, state);
    return parseActionResponse(res, []).message || 'Cắn thằng nào cũng được.';
  }

  async decideWolfKill(
    state: GameState,
    discussion: { playerName: string; message: string }[] = [],
  ): Promise<string> {
    this.setAction('night');
    const b = this.builder as WolfPromptBuilder;
    const prompt = b.wolfKill(this.player, state, this.memory.observations, discussion);
    const res = await this.ask(prompt, state);
    const valid = state.players.filter((p) => p.alive && !isWolfRole(p.role)).map((p) => p.name);
    return parseActionResponse(res, valid).target || valid[0];
  }

  async decideWolfDoubleKill(
    state: GameState,
    discussion: { playerName: string; message: string }[] = [],
  ): Promise<[string, string]> {
    this.setAction('night');
    const b = this.builder as WolfPromptBuilder;
    const prompt = b.wolfDoubleKill(this.player, state, this.memory.observations, discussion);
    const res = await this.ask(prompt, state);
    const valid = state.players.filter((p) => p.alive && !isWolfRole(p.role)).map((p) => p.name);
    const parsed = parseActionResponse(res, valid);
    const t1 = parsed.target1 || parsed.target || valid[0];
    const t2 = parsed.target2 || valid.find((n) => n !== t1) || valid[0];
    return [t1, t2];
  }

  async decideAlphaInfect(
    state: GameState,
    discussion: { playerName: string; message: string }[] = [],
  ): Promise<{ target: string; infect: boolean }> {
    this.setAction('night');
    const b = this.builder as AlphaWolfPromptBuilder;
    const prompt = b.alphaInfect(this.player, state, this.memory.observations, discussion);
    const res = await this.ask(prompt, state);
    const valid = state.players.filter((p) => p.alive && !isWolfRole(p.role)).map((p) => p.name);
    const parsed = parseActionResponse(res, valid);
    return { target: parsed.target || valid[0], infect: !!parsed.infect };
  }

  async decideSeerInvestigate(state: GameState): Promise<string> {
    this.setAction('night');
    const b = this.builder as SeerPromptBuilder;
    const prompt = b.seerInvestigate(this.player, state, this.memory.observations);
    const res = await this.ask(prompt, state);
    const valid = state.players
      .filter((p) => p.alive && p.id !== this.player.id)
      .map((p) => p.name);
    return parseActionResponse(res, valid).target || valid[0];
  }

  async decideWitchAction(
    state: GameState,
    killedName: string | null,
    potions: { healUsed: boolean; killUsed: boolean },
  ): Promise<{ heal: boolean; killTarget: string | null }> {
    this.setAction('night');
    const b = this.builder as WitchPromptBuilder;
    const prompt = b.witchAction(this.player, state, this.memory.observations, killedName, potions);
    const res = await this.ask(prompt, state);
    const valid = state.players
      .filter((p) => p.alive && p.id !== this.player.id)
      .map((p) => p.name);
    const parsed = parseActionResponse(res, valid);
    return { heal: !!parsed.heal, killTarget: parsed.killTarget || null };
  }

  async decideGuardProtect(state: GameState, lastGuardedId: string | null): Promise<string> {
    this.setAction('night');
    const b = this.builder as GuardPromptBuilder;
    const prompt = b.guardProtect(this.player, state, this.memory.observations, lastGuardedId);
    const res = await this.ask(prompt, state);
    const valid = state.players.filter((p) => p.alive && p.id !== lastGuardedId).map((p) => p.name);
    return parseActionResponse(res, valid).target || valid[0];
  }

  async decideCupidPair(state: GameState): Promise<[string, string]> {
    this.setAction('night');
    const b = this.builder as CupidPromptBuilder;
    const prompt = b.cupidPair(this.player, state, this.memory.observations);
    const res = await this.ask(prompt, state);
    const valid = state.players.filter((p) => p.alive).map((p) => p.name);
    const parsed = parseActionResponse(res, valid);
    const p1 = parsed.player1 || valid[0];
    const p2 = parsed.player2 || valid.find((n) => n !== p1) || valid[1];
    return [p1, p2];
  }

  // ── Day actions ──

  async discuss(
    state: GameState,
    messages: DayMessage[],
    round: number,
  ): Promise<{ message: string; wantToSpeak: boolean }> {
    this.setAction('discuss', messages);
    const prompt = this.builder.discuss(
      this.player,
      state,
      this.memory.observations,
      messages,
      round,
    );
    const res = await this.ask(prompt, state);
    try {
      const json = JSON.parse(res.match(/\{[\s\S]*\}/)?.[0] || '{}');
      const message = this.sanitizeWolfMessage(json.message || '...', state);
      return { message, wantToSpeak: json.wantToSpeak !== false };
    } catch {
      return { message: '...', wantToSpeak: true };
    }
  }

  /**
   * Post-processing filter: detect if a wolf agent leaked night-only information
   * in their day discussion message. Logs a warning if detected.
   */
  private sanitizeWolfMessage(message: string, _state: GameState): string {
    if (!isWolfRole(this.player.role)) return message;

    const nightLeakPatterns = [
      /cắn .+? (đêm|đêm qua)/i, // "cắn Trang đêm qua"
      /đêm qua cắn/i, // "đêm qua cắn"
      /sói cắn/i, // "sói cắn"
      /cắn mà không chết/i, // "cắn mà không chết"
      /\[Họp sói\]/i, // wolf meeting content leak
      /bị cắn .+? không chết/i, // "bị cắn mà không chết"
    ];

    for (const pattern of nightLeakPatterns) {
      if (pattern.test(message)) {
        console.warn(
          `[AgentBrain] Wolf ${this.player.name} leaked night info: "${message.substring(0, 80)}..."`,
        );
        break;
      }
    }
    return message;
  }

  async vote(state: GameState, messages: DayMessage[]): Promise<string> {
    this.setAction('vote', messages);
    const prompt = this.builder.vote(this.player, state, this.memory.observations, messages);
    const res = await this.ask(prompt, state);
    let valid = state.players.filter((p) => p.alive && p.id !== this.player.id).map((p) => p.name);
    // Safety net: Seer/ApprenticeSeer cannot vote seer-cleared players
    if (this.isSeerRole()) {
      const clear = this.seerClearNames;
      const filtered = valid.filter((n) => !clear.includes(n));
      if (filtered.length) valid = filtered;
    }
    return parseActionResponse(res, [...valid, 'skip']).target || valid[0];
  }

  async defend(state: GameState, messages: DayMessage[]): Promise<string> {
    this.setAction('defense', messages);
    const prompt = this.builder.defense(this.player, state, this.memory.observations, messages);
    const res = await this.ask(prompt, state);
    return parseActionResponse(res, []).message || 'Tao vô tội!';
  }

  async judgeVote(
    state: GameState,
    accusedName: string,
    defenseSpeech: string,
    messages: DayMessage[],
  ): Promise<'kill' | 'spare'> {
    // Safety net: Seer/ApprenticeSeer auto-spares seer-cleared players
    if (this.isSeerRole() && this.seerClearNames.includes(accusedName)) {
      return 'spare';
    }
    this.setAction('judgement', messages);
    const prompt = this.builder.judgement(
      this.player,
      state,
      this.memory.observations,
      accusedName,
      defenseSpeech,
      messages,
    );
    const res = await this.ask(prompt, state);
    try {
      const json = JSON.parse(res.match(/\{[\s\S]*\}/)?.[0] || '{}');
      return json.verdict === 'spare' ? 'spare' : 'kill';
    } catch {
      return 'kill';
    }
  }

  async hunterShot(state: GameState): Promise<string> {
    this.setAction('night');
    const b = this.builder as HunterPromptBuilder;
    const prompt = b.hunterShot(this.player, state, this.memory.observations);
    const res = await this.ask(prompt, state);
    let valid = state.players.filter((p) => p.alive && p.id !== this.player.id).map((p) => p.name);
    // Safety net: filter out confirmed village-side players
    const village = this.confirmedVillageNames;
    const filtered = valid.filter((n) => !village.includes(n));
    if (filtered.length) valid = filtered;
    return parseActionResponse(res, valid).target || valid[0];
  }
}
