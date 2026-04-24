import {
  GameState,
  GameConfig,
  Player,
  Role,
  DayMessage,
  WitchPotions,
  getRoleDistribution,
  GameEventType,
  isWolfRole,
  PlayerViewState,
  RoleContext,
  VIETNAMESE_NAMES,
} from '@ma-soi/shared';
import { AgentBrain } from '../agents/brain.js';
import { getRandomPersonalities, PERSONALITIES } from '../agents/personalities.js';
import { getProvider, registerAllProviders } from '../providers/index.js';
import { GameMaster, ActionResolver, WolfDiscussMessage } from './GameMaster.js';
import { compressedMemoryPrompt } from '../agents/memory-compression.js';
import { roleNameVi } from '../agents/prompt-builders/base.js';

export class AgentManager implements ActionResolver {
  private brains = new Map<string, AgentBrain>();
  private pendingReasoning = new Map<string, string>();

  constructor(private gm: GameMaster) {}

  setupGame(config: GameConfig): Player[] {
    registerAllProviders(config.providers);

    const roles = getRoleDistribution(config.playerCount, config.enabledSpecialRoles);
    const shuffledRoles = roles.sort(() => Math.random() - 0.5);
    const personalities = getRandomPersonalities(config.playerCount);
    const shuffledNames = [...VIETNAMESE_NAMES].sort(() => Math.random() - 0.5);

    const players: Player[] = config.playerSetup.map((setup, i) => {
      const personality = setup.personalityId
        ? PERSONALITIES.find((p) => p.id === setup.personalityId) || personalities[i]
        : personalities[i];
      const randomProvider = config.providers[Math.floor(Math.random() * config.providers.length)];

      const providerId = setup.providerId || randomProvider.id;
      const providerConfig = config.providers.find((p) => p.id === providerId);
      const modelName = setup.modelName || providerConfig?.model || randomProvider.model;

      return {
        id: crypto.randomUUID(),
        name: shuffledNames[i] || `Player${i + 1}`,
        role: shuffledRoles[i],
        alive: true,
        personality,
        providerId,
        modelName,
      };
    });

    // Create brains
    for (const player of players) {
      let provider;
      try {
        provider = getProvider(player.providerId);
      } catch {
        throw new Error(`Provider "${player.providerId}" not found for player "${player.name}"`);
      }
      this.brains.set(player.id, new AgentBrain(player, provider));
    }

    // Listen to game events to update agent memories
    this.gm.on('gameEvent', (event) => {
      // Attach pending reasoning to relevant events before they reach clients
      const d = event.data;
      const reasoningEventTypes = new Set([
        GameEventType.DayMessage,
        GameEventType.VoteCast,
        GameEventType.DefenseSpeech,
        GameEventType.JudgementVoteCast,
        GameEventType.NightActionPerformed,
        GameEventType.GuardProtect,
        GameEventType.WitchAction,
        GameEventType.SeerResult,
        GameEventType.AlphaInfect,
        GameEventType.WolfDiscussMessage,
      ]);
      if (reasoningEventTypes.has(event.type)) {
        // Try direct playerId fields first, then name-based lookup
        const playerId =
          d.playerId ||
          d.guardId ||
          d.seerId ||
          d.alphaId ||
          (d.voterName && this.gm.state.players.find((p) => p.name === d.voterName)?.id) ||
          d.witchId;
        if (playerId) {
          const reasoning = this.pendingReasoning.get(playerId);
          if (reasoning) {
            d.reasoning = reasoning;
            this.pendingReasoning.delete(playerId);
          }
        }
        // Wolf night actions: use the first alive wolf's pending reasoning
        if (!d.reasoning && event.type === GameEventType.NightActionPerformed) {
          const wolf = this.gm.state.players.find((p) => isWolfRole(p.role) && p.alive);
          if (wolf) {
            const reasoning = this.pendingReasoning.get(wolf.id);
            if (reasoning) {
              d.reasoning = reasoning;
              this.pendingReasoning.delete(wolf.id);
            }
          }
        }
        // Witch: find witch player
        if (!d.reasoning && event.type === GameEventType.WitchAction) {
          const witch = this.gm.state.players.find((p) => p.role === Role.Witch);
          if (witch) {
            const reasoning = this.pendingReasoning.get(witch.id);
            if (reasoning) {
              d.reasoning = reasoning;
              this.pendingReasoning.delete(witch.id);
            }
          }
        }
      }

      // Update alive names for deduction trackers on phase changes
      if (event.type === GameEventType.PhaseChanged) {
        const alive = this.gm.state.players.filter((p) => p.alive).map((p) => p.name);
        for (const [, brain] of this.brains) brain.deduction.setAliveNames(alive);
      }
      for (const [id, brain] of this.brains) {
        const obs = this.eventToObservation(event, brain.player);
        if (obs) {
          const items = Array.isArray(obs) ? obs : [obs];
          for (const o of items) brain.addObservation(o);
        }
      }
    });

    return players;
  }

  private eventToObservation(event: any, viewer: Player): string | string[] | null {
    const d = event.data;
    const causeVi: Record<string, string> = {
      wolf_kill: 'bị sói cắn',
      witch_kill: 'bị đầu độc',
      judged: 'bị treo cổ',
      hunter_shot: 'bị Thợ Săn bắn',
      lover_death: 'chết theo người yêu',
    };
    switch (event.type) {
      case GameEventType.PhaseChanged: {
        const phaseVi: Record<string, string> = {
          Night: 'Ban đêm',
          Dawn: 'Rạng sáng',
          Day: 'Ban ngày',
          Dusk: 'Hoàng hôn',
          Judgement: 'Phán xét',
        };
        return `--- Vòng ${d.round}, ${phaseVi[d.phase] || d.phase} ---`;
      }
      case GameEventType.PlayerDied:
        return `${d.playerName} đã chết (${causeVi[d.cause] || d.cause}). Vai: ${d.role}.`;
      case GameEventType.DayMessage:
        return `${d.playerName} nói: "${d.message}"`;
      case GameEventType.VoteCast:
        return `${d.voterName} vote ${d.targetName}.`;
      case GameEventType.VoteResult:
        return d.exiled ? `${d.exiled.name} bị đuổi bởi vote.` : 'Không ai bị đuổi (hòa phiếu).';
      case GameEventType.DuskNomination:
        return `${d.accusedName} bị đưa lên giàn để phán xét.`;
      case GameEventType.DefenseSpeech:
        return `${d.playerName} biện hộ: "${d.message}"`;
      case GameEventType.JudgementVoteCast:
        return `${d.voterName} vote ${d.verdict === 'kill' ? 'GIẾT' : 'THA'}.`;
      case GameEventType.JudgementResult:
        return d.executed
          ? `${d.accusedName} bị treo cổ sau phán xét.`
          : `${d.accusedName} được tha sau phán xét.`;
      case GameEventType.HunterShot:
        return `Thợ Săn bắn ${d.targetName}!`;
      case GameEventType.SeerResult:
        if (viewer.id === d.seerId)
          return `Mày soi ${d.targetName}: ${d.isWolf ? 'LÀ SÓI!' : 'Không phải sói.'}`;
        return null;
      case GameEventType.DawnAnnouncement:
        if (d.peaceful) return 'Đêm qua không ai chết.';
        return `Chết đêm qua: ${d.deaths.map((x: any) => x.name).join(', ')}.`;
      case GameEventType.NightResolved:
        if (d.deaths?.length === 0) return 'Đêm qua không ai chết.';
        return d.deaths ? `Chết đêm qua: ${d.deaths.map((x: any) => x.name).join(', ')}.` : null;
      case GameEventType.GuardProtect:
        if (viewer.role === Role.Guard) return `Mày đã bảo vệ ${d.targetName} đêm nay.`;
        return null;
      case GameEventType.WitchAction:
        if (viewer.role === Role.Witch)
          return `Mày đã dùng thuốc ${d.action === 'heal' ? 'cứu' : 'độc'} cho ${d.targetName}.`;
        return null;
      case GameEventType.NightActionPerformed:
        if (isWolfRole(viewer.role))
          return `Sói cắn ${d.targetName || d.targetNames?.join(', ')} đêm nay.`;
        return null;
      case GameEventType.AlphaInfect:
        if (viewer.id === d.targetId) return `MÀY ĐÃ BỊ SÓI ĐẦU ĐÀN LÂY NHIỄM! Mày giờ là Sói!`;
        if (isWolfRole(viewer.role))
          return `Sói Đầu Đàn lây nhiễm ${d.targetName}! Hắn giờ là sói.`;
        return null;
      case GameEventType.WolfCubRevenge:
        if (isWolfRole(viewer.role)) return `Sói Con đã chết! Đêm sau sói cắn 2 người trả thù.`;
        return null;
      case GameEventType.WolfDiscussMessage:
        if (isWolfRole(viewer.role)) return `[Họp sói] ${d.playerName}: "${d.message}"`;
        return null;
      case GameEventType.InfectResolved: {
        if (viewer.id !== d.targetId) return null;
        // Retroactively give the infected player wolf context they missed
        const parts: string[] = [];
        const teammates = d.wolfTeammates
          .map((w: any) => `${w.name}(${roleNameVi(w.role)})`)
          .join(', ');
        parts.push(`[Sói nội bộ] Đồng bọn sói: ${teammates}`);
        for (const m of d.wolfDiscussion) {
          parts.push(`[Họp sói] ${m.playerName}: "${m.message}"`);
        }
        if (d.wolfKillTarget) parts.push(`Sói cắn ${d.wolfKillTarget} đêm nay.`);
        return parts;
      }
      case GameEventType.CupidPair:
        if (viewer.role === Role.Cupid)
          return `Mày đã ghép đôi ${d.player1Name} và ${d.player2Name}.`;
        return null;
      case GameEventType.LoverDeath:
        return `${d.loverName} chết theo ${d.deadName} vì tình yêu.`;
      case GameEventType.ApprenticeSeerActivated:
        if (viewer.id === d.apprenticeId)
          return `Tiên Tri đã chết. Mày kế thừa — giờ mày là Tiên Tri mới!`;
        return null;
      case GameEventType.FoolVictory:
        return `${d.foolName} là Kẻ Ngốc và thắng game!`;
      default:
        return null;
    }
  }

  // ── Player View API ──

  getPlayerViewState(playerId: string): PlayerViewState | null {
    const brain = this.brains.get(playerId);
    if (!brain) return null;

    const player = brain.player;
    const state = this.gm.state;

    const deductionPrompt = brain.deduction.buildPrompt(player.role, player.name);
    const deduction = {
      confirmed: [...brain.deduction.confirmed] as [string, { role: string; source: string }][],
      seerResults: [...brain.deduction.seerResults] as [string, 'wolf' | 'clear'][],
      claims: [...brain.deduction.claims] as [string, { role: string; round: number }[]][],
      accusations: [...brain.deduction.accusations] as [string, string[]][],
      deductionPrompt,
    };

    return {
      playerId,
      playerName: player.name,
      role: player.role,
      alive: player.alive,
      personality: player.personality,
      observations: [...brain.memory.observations],
      compressedMemory: compressedMemoryPrompt(brain.memory.observations, deductionPrompt),
      deduction,
      roleContext: this.buildRoleContext(player, state),
    };
  }

  private buildRoleContext(player: Player, state: GameState): RoleContext {
    const ctx: RoleContext = {};

    if (isWolfRole(player.role)) {
      ctx.wolfTeammates = state.players
        .filter((p) => isWolfRole(p.role) && p.id !== player.id)
        .map((p) => ({ name: p.name, role: roleNameVi(p.role), alive: p.alive }));
      ctx.alphaInfectUsed = state.alphaInfectUsed;
    }

    if (
      player.role === Role.Seer ||
      (player.role === Role.ApprenticeSeer && state.apprenticeSeerActivated)
    ) {
      ctx.isApprenticeSeerActivated = state.apprenticeSeerActivated;
    }

    if (player.role === Role.Witch) {
      ctx.witchPotions = { ...state.witchPotions };
    }

    if (player.role === Role.Guard) {
      const lastGuarded = state.players.find((p) => p.id === state.lastGuardedId);
      ctx.lastGuardedName = lastGuarded?.name || null;
    }

    if (player.role === Role.Cupid && state.couple) {
      const p1 = state.players.find((p) => p.id === state.couple!.player1Id);
      const p2 = state.players.find((p) => p.id === state.couple!.player2Id);
      if (p1 && p2) ctx.coupleNames = [p1.name, p2.name];
    }

    // Couple member: knows their lover
    if (state.couple) {
      const { player1Id, player2Id } = state.couple;
      if (player.id === player1Id || player.id === player2Id) {
        const loverId = player.id === player1Id ? player2Id : player1Id;
        const lover = state.players.find((p) => p.id === loverId);
        if (lover) ctx.loverName = lover.name;
      }
    }

    return ctx;
  }

  private getBrain(player: Player): AgentBrain {
    return this.brains.get(player.id)!;
  }

  private storeReasoning(player: Player, brain: AgentBrain) {
    if (brain.lastReasoning) this.pendingReasoning.set(player.id, brain.lastReasoning);
  }

  async wolfKill(
    wolves: Player[],
    state: GameState,
    discussion: WolfDiscussMessage[],
  ): Promise<string> {
    if (!wolves.length) return '';
    const brain = this.getBrain(wolves[0]);
    const result = await brain.decideWolfKill(state, discussion);
    this.storeReasoning(wolves[0], brain);
    return result;
  }

  async wolfDoubleKill(
    wolves: Player[],
    state: GameState,
    discussion: WolfDiscussMessage[],
  ): Promise<[string, string]> {
    if (!wolves.length) return ['', ''];
    const brain = this.getBrain(wolves[0]);
    const result = await brain.decideWolfDoubleKill(state, discussion);
    this.storeReasoning(wolves[0], brain);
    return result;
  }

  async alphaInfect(
    alpha: Player,
    state: GameState,
    discussion: WolfDiscussMessage[],
  ): Promise<{ target: string; infect: boolean }> {
    const brain = this.getBrain(alpha);
    const result = await brain.decideAlphaInfect(state, discussion);
    this.storeReasoning(alpha, brain);
    return result;
  }

  async wolfDiscuss(
    wolf: Player,
    state: GameState,
    messages: WolfDiscussMessage[],
    round: number,
  ): Promise<string> {
    const brain = this.getBrain(wolf);
    const result = await brain.decideWolfDiscuss(state, messages, round);
    this.storeReasoning(wolf, brain);
    return result;
  }

  async seerInvestigate(seer: Player, state: GameState): Promise<string> {
    const brain = this.getBrain(seer);
    const result = await brain.decideSeerInvestigate(state);
    this.storeReasoning(seer, brain);
    return result;
  }

  async witchAction(
    witch: Player,
    state: GameState,
    killedName: string | null,
    potions: WitchPotions,
  ): Promise<{ heal: boolean; killTarget: string | null }> {
    const brain = this.getBrain(witch);
    const result = await brain.decideWitchAction(state, killedName, potions);
    this.storeReasoning(witch, brain);
    return result;
  }

  async guardProtect(
    guard: Player,
    state: GameState,
    lastGuardedId: string | null,
  ): Promise<string> {
    const brain = this.getBrain(guard);
    const result = await brain.decideGuardProtect(state, lastGuardedId);
    this.storeReasoning(guard, brain);
    return result;
  }

  async cupidPair(cupid: Player, state: GameState): Promise<[string, string]> {
    const brain = this.getBrain(cupid);
    const result = await brain.decideCupidPair(state);
    this.storeReasoning(cupid, brain);
    return result;
  }

  async discuss(
    player: Player,
    state: GameState,
    messages: DayMessage[],
    round: number,
  ): Promise<{ message: string; wantToSpeak: boolean }> {
    const brain = this.getBrain(player);
    const result = await brain.discuss(state, messages, round);
    this.storeReasoning(player, brain);
    return result;
  }

  async vote(player: Player, state: GameState, messages: DayMessage[]): Promise<string> {
    const brain = this.getBrain(player);
    const result = await brain.vote(state, messages);
    this.storeReasoning(player, brain);
    return result;
  }

  async defend(player: Player, state: GameState, messages: DayMessage[]): Promise<string> {
    const brain = this.getBrain(player);
    const result = await brain.defend(state, messages);
    this.storeReasoning(player, brain);
    return result;
  }

  async judgeVote(
    player: Player,
    state: GameState,
    accusedName: string,
    defenseSpeech: string,
    messages: DayMessage[],
  ): Promise<'kill' | 'spare'> {
    const brain = this.getBrain(player);
    const result = await brain.judgeVote(state, accusedName, defenseSpeech, messages);
    this.storeReasoning(player, brain);
    return result;
  }

  async hunterShot(hunter: Player, state: GameState): Promise<string> {
    const brain = this.getBrain(hunter);
    const result = await brain.hunterShot(state);
    this.storeReasoning(hunter, brain);
    return result;
  }
}
