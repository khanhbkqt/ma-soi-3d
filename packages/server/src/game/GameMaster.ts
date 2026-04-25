import {
  GameState,
  GameConfig,
  GameEvent,
  GameEventType,
  Phase,
  Role,
  Team,
  Player,
  NightAction,
  DayMessage,
  Vote,
  WitchPotions,
  getRoleDistribution,
  isWolfRole,
  JudgementVote,
  DefenseMessage,
  CoupleState,
} from '@ma-soi/shared';

export interface WolfDiscussMessage {
  playerId: string;
  playerName: string;
  message: string;
  round: number;
  timestamp: number;
}
import { EventEmitter } from 'events';

export type ActionResolver = {
  wolfKill(wolves: Player[], state: GameState, discussion: WolfDiscussMessage[]): Promise<string>;
  alphaInfect(
    alpha: Player,
    state: GameState,
    discussion: WolfDiscussMessage[],
  ): Promise<{ target: string; infect: boolean }>;
  wolfDoubleKill(
    wolves: Player[],
    state: GameState,
    discussion: WolfDiscussMessage[],
  ): Promise<[string, string]>;
  wolfDiscuss(
    wolf: Player,
    state: GameState,
    messages: WolfDiscussMessage[],
    round: number,
  ): Promise<string>;
  seerInvestigate(seer: Player, state: GameState): Promise<string>;
  witchAction(
    witch: Player,
    state: GameState,
    killedName: string | null,
    potions: WitchPotions,
  ): Promise<{ heal: boolean; killTarget: string | null }>;
  guardProtect(guard: Player, state: GameState, lastGuardedId: string | null): Promise<string>;
  cupidPair(cupid: Player, state: GameState): Promise<[string, string]>;
  discuss(
    player: Player,
    state: GameState,
    messages: DayMessage[],
    round: number,
  ): Promise<{ message: string; wantToSpeak: boolean }>;
  vote(player: Player, state: GameState, messages: DayMessage[]): Promise<string>;
  defend(player: Player, state: GameState, messages: DayMessage[]): Promise<string>;
  judgeVote(
    player: Player,
    state: GameState,
    accusedName: string,
    defenseSpeech: string,
    messages: DayMessage[],
  ): Promise<'kill' | 'spare'>;
  hunterShot(hunter: Player, state: GameState): Promise<string>;
};

export class GameMaster extends EventEmitter {
  state!: GameState;
  private resolver!: ActionResolver;
  private stepResolve: (() => void) | null = null;

  createGame(config: GameConfig, players: Player[]): GameState {
    this.state = {
      id: crypto.randomUUID(),
      config,
      phase: Phase.Lobby,
      round: 0,
      players,
      events: [],
      nightActions: [],
      votes: [],
      witchPotions: { healUsed: false, killUsed: false },
      lastGuardedId: null,
      winner: null,
      isPaused: false,
      discussionMessages: [],
      // Judgement
      accusedId: null,
      defenseSpeech: null,
      judgementVotes: [],
      // Dawn
      pendingDeaths: [],
      // New role states
      couple: null,
      alphaInfectUsed: false,
      wolfCubDead: false,
      wolfCubRevengeActive: false,
      originalSeerDead: false,
      apprenticeSeerActivated: false,
    };
    return this.state;
  }

  setResolver(resolver: ActionResolver) {
    this.resolver = resolver;
  }

  private emitEvent(type: GameEventType, data: any, isPublic = true) {
    const event: GameEvent = { type, data, timestamp: Date.now(), isPublic };
    this.state.events.push(event);
    this.emit('gameEvent', event);
  }

  private async thinkWrap<T>(playerIds: string[], fn: () => Promise<T>): Promise<T> {
    for (const id of playerIds) {
      this.emitEvent(GameEventType.PlayerThinking, { playerId: id, thinking: true }, true);
    }
    try {
      return await fn();
    } finally {
      for (const id of playerIds) {
        this.emitEvent(GameEventType.PlayerThinking, { playerId: id, thinking: false }, true);
      }
    }
  }

  private findByName(name: string): Player | undefined {
    return this.state.players.find((p) => p.name === name);
  }

  private alive() {
    return this.state.players.filter((p) => p.alive);
  }
  private aliveWithRole(role: Role) {
    return this.alive().filter((p) => p.role === role);
  }
  private aliveWolves() {
    return this.alive().filter((p) => isWolfRole(p.role));
  }

  private checkWin(): Team | 'Fool' | null {
    const alivePlayers = this.alive();

    // Check couple win: if only the couple remains alive
    if (this.state.couple) {
      const { player1Id, player2Id } = this.state.couple;
      const p1 = this.state.players.find((p) => p.id === player1Id);
      const p2 = this.state.players.find((p) => p.id === player2Id);
      if (p1?.alive && p2?.alive) {
        // Check if couple is cross-team (wolf + village)
        const p1Wolf = isWolfRole(p1.role);
        const p2Wolf = isWolfRole(p2.role);
        if (p1Wolf !== p2Wolf && alivePlayers.length === 2) {
          return Team.Lovers;
        }
      }
    }

    const wolves = alivePlayers.filter((p) => isWolfRole(p.role)).length;
    const villagers = alivePlayers.filter((p) => !isWolfRole(p.role)).length;
    if (wolves === 0) return Team.Village;
    if (wolves >= villagers) return Team.Wolf;
    return null;
  }

  private async killPlayer(player: Player, cause: string): Promise<void> {
    player.alive = false;

    // Track Wolf Cub death
    if (player.role === Role.WolfCub) {
      this.state.wolfCubDead = true;
      this.state.wolfCubRevengeActive = true;
      this.emitEvent(GameEventType.WolfCubRevenge, { cubName: player.name }, false);
    }

    // Track Seer death → activate Apprentice
    if (player.role === Role.Seer && !this.state.originalSeerDead) {
      this.state.originalSeerDead = true;
      const apprentice = this.state.players.find((p) => p.role === Role.ApprenticeSeer && p.alive);
      if (apprentice) {
        this.state.apprenticeSeerActivated = true;
        this.emitEvent(
          GameEventType.ApprenticeSeerActivated,
          { apprenticeId: apprentice.id, apprenticeName: apprentice.name },
          false,
        );
      }
    }

    this.emitEvent(
      GameEventType.PlayerDied,
      { playerId: player.id, playerName: player.name, role: player.role, cause },
      true,
    );

    // Hunter revenge — only if NOT poisoned by witch
    if (player.role === Role.Hunter && cause !== 'witch_kill') {
      const targetName = await this.thinkWrap([player.id], () =>
        this.resolver.hunterShot(player, this.state),
      );
      const target = this.findByName(targetName);
      if (target && target.alive) {
        this.emitEvent(
          GameEventType.HunterShot,
          { hunterId: player.id, targetId: target.id, targetName: target.name },
          true,
        );
        await this.killPlayer(target, 'hunter_shot');
      }
    }

    // Couple death — if one dies, the other dies too
    if (this.state.couple) {
      const { player1Id, player2Id } = this.state.couple;
      if (player.id === player1Id || player.id === player2Id) {
        const loverId = player.id === player1Id ? player2Id : player1Id;
        const lover = this.state.players.find((p) => p.id === loverId);
        if (lover && lover.alive) {
          this.emitEvent(
            GameEventType.LoverDeath,
            { deadId: player.id, deadName: player.name, loverId: lover.id, loverName: lover.name },
            true,
          );
          await this.killPlayer(lover, 'lover_death');
        }
      }
    }

    // NOTE: Win check is deferred to the caller (dawnPhase, judgementPhase, etc.)
    // so that ALL cascading deaths (Hunter shot, Lover death) resolve first.
    // Previously, checkWin() here could end the game before Hunter gets to shoot.
  }

  /**
   * Check win condition and end game if there's a winner.
   * Called AFTER all cascading deaths from killPlayer() have resolved.
   */
  private checkAndResolveWin(): boolean {
    const winner = this.checkWin();
    if (winner) {
      this.state.winner = winner;
      this.state.phase = Phase.GameOver;
      this.emitEvent(
        GameEventType.GameOver,
        {
          winner,
          players: this.state.players.map((p) => ({
            id: p.id,
            name: p.name,
            role: p.role,
            alive: p.alive,
          })),
        },
        true,
      );
      return true; // game over
    }
    return false;
  }

  private async delay(ms: number) {
    if (!this.state.config.autoPlay) {
      // Manual mode: wait for step signal
      await new Promise<void>((resolve) => {
        this.stepResolve = resolve;
      });
    } else {
      await new Promise((r) => setTimeout(r, ms));
      // Check pause
      while (this.state.isPaused) {
        await new Promise((r) => setTimeout(r, 200));
      }
    }
  }

  step() {
    if (this.stepResolve) {
      this.stepResolve();
      this.stepResolve = null;
    }
  }
  pause() {
    this.state.isPaused = true;
  }
  resume() {
    this.state.isPaused = false;
  }

  async startGame() {
    this.state.phase = Phase.Day;
    this.state.round = 1;
    this.emitEvent(
      GameEventType.GameStarted,
      { players: this.state.players.map((p) => ({ id: p.id, name: p.name })) },
      true,
    );

    // Reveal roles privately
    for (const p of this.state.players) {
      this.emitEvent(
        GameEventType.RoleReveal,
        { playerId: p.id, playerName: p.name, role: p.role },
        false,
      );
    }

    // Cupid pairs on the first day (before the loop starts)
    await this.cupidPhase();

    while (!this.state.winner) {
      // Day -> Dusk -> Judgement
      await this.dayPhase();
      if (this.state.winner) break;

      await this.duskPhase();
      if (this.state.winner) break;

      if (this.state.accusedId) {
        await this.judgementPhase();
        if (this.state.winner) break;
      }

      // Night -> Dawn
      await this.nightPhase();
      if (this.state.winner) break;

      await this.dawnPhase();
      if (this.state.winner) break;

      this.state.round++;
    }
  }

  // ── Cupid: First night only ──
  private async cupidPhase() {
    const cupid = this.state.players.find((p) => p.role === Role.Cupid && p.alive);
    if (!cupid) return;

    const [name1, name2] = await this.thinkWrap([cupid.id], () =>
      this.resolver.cupidPair(cupid, this.state),
    );
    const p1 = this.findByName(name1);
    const p2 = this.findByName(name2);
    if (p1 && p2 && p1.id !== p2.id) {
      this.state.couple = { player1Id: p1.id, player2Id: p2.id };
      this.emitEvent(
        GameEventType.CupidPair,
        { cupidId: cupid.id, player1Name: p1.name, player2Name: p2.name },
        false,
      );
    }
  }

  // ── NIGHT PHASE ──
  private async nightPhase() {
    this.state.phase = Phase.Night;
    this.state.nightActions = [];
    this.state.pendingDeaths = [];
    this.emitEvent(
      GameEventType.PhaseChanged,
      { phase: Phase.Night, round: this.state.round },
      true,
    );
    await this.delay(this.state.config.phaseDelay);

    const wolfTargets: Player[] = [];
    let guardedId: string | null = null;

    // ── 1. Guard protects (runs first) ──
    const guard = this.aliveWithRole(Role.Guard)[0];
    if (guard) {
      const targetName = await this.thinkWrap([guard.id], () =>
        this.resolver.guardProtect(guard, this.state, this.state.lastGuardedId),
      );
      const target = this.findByName(targetName);
      if (target) {
        guardedId = target.id;
        this.state.lastGuardedId = target.id;
        this.state.nightActions.push({
          type: 'guard_protect',
          actorId: guard.id,
          targetId: target.id,
        });
        this.emitEvent(
          GameEventType.GuardProtect,
          { guardId: guard.id, targetId: target.id, targetName: target.name },
          false,
        );
      }
      await this.delay(this.state.config.phaseDelay / 3);
    }

    // ── 2. Wolves discuss & attack ──
    const wolves = this.aliveWolves();
    const wolfDiscussion: WolfDiscussMessage[] = [];
    if (wolves.length > 1) {
      for (let round = 1; round <= 1; round++) {
        const order = [...wolves].sort(() => Math.random() - 0.5);
        for (const wolf of order) {
          const msg = await this.thinkWrap([wolf.id], () =>
            this.resolver.wolfDiscuss(wolf, this.state, wolfDiscussion, round),
          );
          const dm: WolfDiscussMessage = {
            playerId: wolf.id,
            playerName: wolf.name,
            message: msg,
            round,
            timestamp: Date.now(),
          };
          wolfDiscussion.push(dm);
          this.emitEvent(GameEventType.WolfDiscussMessage, dm, false);
          await this.delay(this.state.config.phaseDelay / 4);
        }
      }
    }

    if (wolves.length > 0) {
      const alpha = wolves.find((w) => w.role === Role.AlphaWolf);

      if (this.state.wolfCubRevengeActive) {
        // Wolf Cub revenge: kill 2 this night
        this.state.wolfCubRevengeActive = false;
        const [name1, name2] = await this.thinkWrap(
          wolves.map((w) => w.id),
          () => this.resolver.wolfDoubleKill(wolves, this.state, wolfDiscussion),
        );
        const t1 = this.findByName(name1);
        const t2 = this.findByName(name2);
        if (t1) {
          wolfTargets.push(t1);
          this.state.nightActions.push({
            type: 'wolf_kill',
            actorId: wolves[0].id,
            targetId: t1.id,
          });
        }
        if (t2 && t2.id !== t1?.id) {
          wolfTargets.push(t2);
          this.state.nightActions.push({
            type: 'wolf_kill',
            actorId: wolves[0].id,
            targetId: t2.id,
          });
        }
        this.emitEvent(
          GameEventType.NightActionPerformed,
          { action: 'wolf_double_kill', targetNames: wolfTargets.map((t) => t.name) },
          false,
        );
      } else if (alpha && !this.state.alphaInfectUsed) {
        // Alpha can choose to infect instead of kill
        const decision = await this.thinkWrap([alpha.id], () =>
          this.resolver.alphaInfect(alpha, this.state, wolfDiscussion),
        );
        const target = this.findByName(decision.target);
        if (target) {
          if (decision.infect && !isWolfRole(target.role)) {
            // Infect: convert target to regular Werewolf
            this.state.alphaInfectUsed = true;
            this.state.nightActions.push({
              type: 'wolf_infect',
              actorId: alpha.id,
              targetId: target.id,
            });
            this.emitEvent(
              GameEventType.AlphaInfect,
              {
                alphaId: alpha.id,
                targetId: target.id,
                targetName: target.name,
                oldRole: target.role,
              },
              false,
            );
            // Role change happens at resolve
          } else {
            wolfTargets.push(target);
            this.state.nightActions.push({
              type: 'wolf_kill',
              actorId: wolves[0].id,
              targetId: target.id,
            });
            this.emitEvent(
              GameEventType.NightActionPerformed,
              { action: 'wolf_kill', targetName: target.name },
              false,
            );
          }
        }
      } else {
        // Normal wolf kill
        const targetName = await this.thinkWrap(
          wolves.map((w) => w.id),
          () => this.resolver.wolfKill(wolves, this.state, wolfDiscussion),
        );
        const target = this.findByName(targetName);
        if (target) {
          wolfTargets.push(target);
          this.state.nightActions.push({
            type: 'wolf_kill',
            actorId: wolves[0].id,
            targetId: target.id,
          });
          this.emitEvent(
            GameEventType.NightActionPerformed,
            { action: 'wolf_kill', targetName: target.name },
            false,
          );
        }
      }
      await this.delay(this.state.config.phaseDelay / 3);
    }

    // ── 3. Witch acts (knows who was bitten) ──
    const witch = this.aliveWithRole(Role.Witch)[0];
    if (witch) {
      const primaryKilledName = wolfTargets[0]?.name || null;
      const decision = await this.thinkWrap([witch.id], () =>
        this.resolver.witchAction(witch, this.state, primaryKilledName, this.state.witchPotions),
      );

      if (decision.heal && wolfTargets[0] && !this.state.witchPotions.healUsed) {
        this.state.witchPotions.healUsed = true;
        this.state.nightActions.push({
          type: 'witch_heal',
          actorId: witch.id,
          targetId: wolfTargets[0].id,
        });
        this.emitEvent(
          GameEventType.WitchAction,
          { action: 'heal', targetName: wolfTargets[0].name },
          false,
        );
      }
      if (decision.killTarget && !this.state.witchPotions.killUsed) {
        const killTarget = this.findByName(decision.killTarget);
        if (killTarget && killTarget.alive) {
          this.state.witchPotions.killUsed = true;
          this.state.nightActions.push({
            type: 'witch_kill',
            actorId: witch.id,
            targetId: killTarget.id,
          });
          this.emitEvent(
            GameEventType.WitchAction,
            { action: 'kill', targetName: killTarget.name },
            false,
          );
        }
      }
      await this.delay(this.state.config.phaseDelay / 3);
    }

    // ── 4. Seer investigates (runs last) ──
    let activeSeer: Player | undefined;

    if (this.state.apprenticeSeerActivated) {
      activeSeer = this.aliveWithRole(Role.ApprenticeSeer)[0];
    }
    if (!activeSeer) {
      activeSeer = this.aliveWithRole(Role.Seer)[0];
    }

    if (activeSeer) {
      const targetName = await this.thinkWrap([activeSeer.id], () =>
        this.resolver.seerInvestigate(activeSeer, this.state),
      );
      const target = this.findByName(targetName);
      if (target) {
        this.state.nightActions.push({
          type: 'seer_investigate',
          actorId: activeSeer.id,
          targetId: target.id,
        });
        // Seer sees the role as it was BEFORE this night's infect resolves
        // (per standard Werewolf rules, infect takes effect after dawn)
        const pendingInfect = this.state.nightActions.some(
          (a) => a.type === 'wolf_infect' && a.targetId === target.id,
        );
        const isWolf = pendingInfect ? false : isWolfRole(target.role);
        this.emitEvent(
          GameEventType.SeerResult,
          { seerId: activeSeer.id, targetId: target.id, targetName: target.name, isWolf },
          false,
        );
      }
      await this.delay(this.state.config.phaseDelay / 3);
    }

    // ── 5. RESOLVE Night Actions ──
    // Process Alpha Infect
    const infectAction = this.state.nightActions.find((a) => a.type === 'wolf_infect');
    if (infectAction) {
      const target = this.state.players.find((p) => p.id === infectAction.targetId);
      if (target) {
        target.role = Role.Werewolf; // Convert to regular werewolf
        // Notify AgentManager so it can inject wolf-context observations
        // (wolf discussion, kill target, teammates) into the infected player's memory
        const wolves = this.state.players.filter((p) => isWolfRole(p.role) && p.id !== target.id);
        this.emitEvent(
          GameEventType.InfectResolved,
          {
            targetId: target.id,
            targetName: target.name,
            wolfTeammates: wolves.map((w) => ({ name: w.name, role: w.role, alive: w.alive })),
            wolfKillTarget: wolfTargets[0]?.name || null,
            wolfDiscussion: wolfDiscussion.map((m) => ({
              playerName: m.playerName,
              message: m.message,
            })),
          },
          false,
        );
      }
    }

    // Process wolf kills
    for (const wolfTarget of wolfTargets) {
      const wasGuarded = guardedId === wolfTarget.id;
      const wasHealed = this.state.nightActions.some(
        (a) => a.type === 'witch_heal' && a.targetId === wolfTarget.id,
      );
      if (!wasGuarded && !wasHealed) {
        this.state.pendingDeaths.push({
          playerId: wolfTarget.id,
          playerName: wolfTarget.name,
          cause: 'wolf_kill',
        });
      }
    }

    // Process witch kill (NOT blocked by guard)
    const witchKill = this.state.nightActions.find((a) => a.type === 'witch_kill');
    if (witchKill) {
      const target = this.state.players.find((p) => p.id === witchKill.targetId);
      if (
        target &&
        target.alive &&
        !this.state.pendingDeaths.some((d) => d.playerId === target.id)
      ) {
        this.state.pendingDeaths.push({
          playerId: target.id,
          playerName: target.name,
          cause: 'witch_kill',
        });
      }
    }
  }

  // ── DAWN PHASE ── (Announce night results)
  private async dawnPhase() {
    this.state.phase = Phase.Dawn;
    this.emitEvent(
      GameEventType.PhaseChanged,
      { phase: Phase.Dawn, round: this.state.round },
      true,
    );
    await this.delay(this.state.config.phaseDelay);

    const deaths = this.state.pendingDeaths;
    this.emitEvent(
      GameEventType.DawnAnnouncement,
      {
        deaths: deaths.map((d) => ({ id: d.playerId, name: d.playerName })),
        peaceful: deaths.length === 0,
      },
      true,
    );

    for (const death of deaths) {
      const player = this.state.players.find((p) => p.id === death.playerId);
      if (player && player.alive) {
        await this.killPlayer(player, death.cause);
      }
    }

    this.state.pendingDeaths = [];

    // Check win AFTER all cascading deaths (Hunter shot, Lover) have resolved
    if (this.checkAndResolveWin()) return;

    await this.delay(this.state.config.phaseDelay / 2);
  }

  // ── DAY PHASE ── (Discussion)
  private async dayPhase() {
    this.state.phase = Phase.Day;
    this.state.discussionMessages = [];
    this.emitEvent(GameEventType.PhaseChanged, { phase: Phase.Day, round: this.state.round }, true);
    await this.delay(this.state.config.phaseDelay);

    const alivePlayers = this.alive();
    const timeLimitMs = this.state.config.discussionTimeLimitMs || 90_000;
    const maxRounds = this.state.config.discussionRounds;
    const batchSize = Math.min(4, Math.max(3, Math.ceil(alivePlayers.length / 3)));
    const spokenCount = new Map<string, number>();
    const startTime = Date.now();
    let silentTicks = 0;
    let mentionedIds = new Set<string>();

    for (let round = 1; round <= maxRounds; round++) {
      if (Date.now() - startTime >= timeLimitMs) break;

      // Pick candidates: mentioned players first, then unheard, then least-spoken
      const pool = alivePlayers.filter((p) => p.alive);
      const mentioned = pool.filter((p) => mentionedIds.has(p.id));
      const neverSpoken = pool.filter((p) => !spokenCount.has(p.id) && !mentionedIds.has(p.id));

      let candidates: Player[] = [...mentioned];
      if (
        candidates.length < batchSize &&
        neverSpoken.length > 0 &&
        round <= Math.ceil(maxRounds / 2)
      ) {
        const shuffled = neverSpoken.sort(() => Math.random() - 0.5);
        candidates.push(...shuffled.slice(0, batchSize - candidates.length));
      }
      if (candidates.length < batchSize) {
        const rest = pool
          .filter((p) => !candidates.includes(p))
          .sort((a, b) => (spokenCount.get(a.id) || 0) - (spokenCount.get(b.id) || 0));
        candidates.push(...rest.slice(0, batchSize - candidates.length));
      }
      candidates = candidates.slice(0, batchSize);
      mentionedIds = new Set();

      // Ask candidates SEQUENTIALLY so each agent sees previous messages
      // from the same batch — enables natural back-and-forth replies.
      let anyoneSpoke = false;
      const batchStartIdx = this.state.discussionMessages.length;
      for (const player of candidates) {
        const { message, wantToSpeak } = await this.thinkWrap([player.id], () =>
          this.resolver.discuss(player, this.state, this.state.discussionMessages, round),
        );

        // Mentioned players must reply — override silent skip
        const isMentioned = mentionedIds.has(player.id);
        if (!wantToSpeak && !isMentioned) continue;
        if (!wantToSpeak && isMentioned && (!message || message === '...')) continue;
        const dayMsg: DayMessage = {
          playerId: player.id,
          playerName: player.name,
          message,
          round,
          timestamp: Date.now(),
        };
        this.state.discussionMessages.push(dayMsg);
        this.emitEvent(GameEventType.DayMessage, dayMsg, true);
        spokenCount.set(player.id, (spokenCount.get(player.id) || 0) + 1);
        anyoneSpoke = true;
        await this.delay(this.state.config.phaseDelay / 3);
      }

      if (!anyoneSpoke) {
        silentTicks++;
      } else {
        silentTicks = 0;
        // Detect mentioned players from this batch's new messages for reply priority
        const newMsgs = this.state.discussionMessages.slice(batchStartIdx);
        for (const msg of newMsgs) {
          for (const p of pool) {
            if (p.id !== msg.playerId && msg.message.includes(p.name)) {
              mentionedIds.add(p.id);
            }
          }
        }
      }
      if (silentTicks >= 3) break;
    }
    // Pause before transitioning so the last message can be read
    await this.delay(this.state.config.phaseDelay);
  }

  // ── DUSK PHASE ── (Nomination vote — pick who goes on trial)
  private async duskPhase() {
    this.state.phase = Phase.Dusk;
    this.state.votes = [];
    this.state.accusedId = null;
    this.emitEvent(
      GameEventType.PhaseChanged,
      { phase: Phase.Dusk, round: this.state.round },
      true,
    );
    await this.delay(this.state.config.phaseDelay / 2);

    const alivePlayers = this.alive();
    const voteOrder = [...alivePlayers].sort(() => Math.random() - 0.5);

    // Run all votes in parallel
    const votersFiltered = voteOrder.filter((p) => p.alive);
    const voteResults = await this.thinkWrap(
      votersFiltered.map((p) => p.id),
      () =>
        Promise.all(
          votersFiltered.map(async (player) => ({
            player,
            targetName: await this.resolver.vote(player, this.state, this.state.discussionMessages),
          })),
        ),
    );

    // Emit results sequentially with delay for visual effect
    for (const { player, targetName } of voteResults) {
      const target = this.findByName(targetName);
      const vote: Vote = { voterId: player.id, targetId: target?.id || 'skip' };
      this.state.votes.push(vote);
      this.emitEvent(GameEventType.VoteCast, { voterName: player.name, targetName }, true);
      await this.delay(this.state.config.phaseDelay / 4);
    }

    // Tally votes — most votes wins (no majority needed for nomination)
    const tally = new Map<string, number>();
    for (const v of this.state.votes) {
      if (v.targetId === 'skip') continue;
      tally.set(v.targetId, (tally.get(v.targetId) || 0) + 1);
    }

    let maxVotes = 0;
    let nominated: Player | null = null;
    let tied = false;

    for (const [playerId, count] of tally) {
      if (count > maxVotes) {
        maxVotes = count;
        nominated = this.state.players.find((p) => p.id === playerId) || null;
        tied = false;
      } else if (count === maxVotes) {
        tied = true;
      }
    }

    // Tie = no one nominated
    if (tied || maxVotes === 0) nominated = null;

    const tallyData = Array.from(tally.entries()).map(([id, count]) => ({
      playerName: this.state.players.find((p) => p.id === id)?.name,
      count,
    }));

    if (nominated) {
      this.state.accusedId = nominated.id;
      this.emitEvent(
        GameEventType.DuskNomination,
        {
          accusedId: nominated.id,
          accusedName: nominated.name,
          tally: tallyData,
        },
        true,
      );
    } else {
      this.emitEvent(GameEventType.VoteResult, { exiled: null, tally: tallyData, tied }, true);
    }
  }

  // ── JUDGEMENT PHASE ── (Defense + Kill/Spare vote)
  private async judgementPhase() {
    this.state.phase = Phase.Judgement;
    this.state.judgementVotes = [];
    this.state.defenseSpeech = null;
    this.emitEvent(
      GameEventType.PhaseChanged,
      { phase: Phase.Judgement, round: this.state.round },
      true,
    );
    await this.delay(this.state.config.phaseDelay / 2);

    const accused = this.state.players.find((p) => p.id === this.state.accusedId);
    if (!accused || !accused.alive) {
      this.state.accusedId = null;
      return;
    }

    // ── 1. Accused defends themselves ──
    const defenseText = await this.thinkWrap([accused.id], () =>
      this.resolver.defend(accused, this.state, this.state.discussionMessages),
    );
    const defense: DefenseMessage = {
      playerId: accused.id,
      playerName: accused.name,
      message: defenseText,
      timestamp: Date.now(),
    };
    this.state.defenseSpeech = defense;
    this.emitEvent(GameEventType.DefenseSpeech, defense, true);
    await this.delay(this.state.config.phaseDelay);

    // ── 2. Everyone (except accused) votes kill/spare ──
    const voters = this.alive().filter((p) => p.id !== accused.id);
    const voteOrder = [...voters].sort(() => Math.random() - 0.5);

    // Run all judgement votes in parallel
    const judgeVotersFiltered = voteOrder.filter((v) => v.alive);
    const judgeResults = await this.thinkWrap(
      judgeVotersFiltered.map((v) => v.id),
      () =>
        Promise.all(
          judgeVotersFiltered.map(async (voter) => ({
            voter,
            verdict: await this.resolver.judgeVote(
              voter,
              this.state,
              accused.name,
              defenseText,
              this.state.discussionMessages,
            ),
          })),
        ),
    );

    // Emit results sequentially with delay for visual effect
    for (const { voter, verdict } of judgeResults) {
      const jv: JudgementVote = { voterId: voter.id, verdict };
      this.state.judgementVotes.push(jv);
      this.emitEvent(GameEventType.JudgementVoteCast, { voterName: voter.name, verdict }, true);
      await this.delay(this.state.config.phaseDelay / 4);
    }

    // ── 3. Tally — need absolute majority (>50%) to kill ──
    const killVotes = this.state.judgementVotes.filter((v) => v.verdict === 'kill').length;
    const spareVotes = this.state.judgementVotes.filter((v) => v.verdict === 'spare').length;
    const totalVoters = this.state.judgementVotes.length;
    const executed = killVotes > totalVoters / 2;

    this.emitEvent(
      GameEventType.JudgementResult,
      {
        accusedId: accused.id,
        accusedName: accused.name,
        accusedRole: accused.role,
        killVotes,
        spareVotes,
        executed,
      },
      true,
    );

    if (executed) {
      // Check Fool victory — if Fool is executed, Fool wins immediately
      if (accused.role === Role.Fool) {
        this.state.winner = 'Fool';
        this.state.phase = Phase.GameOver;
        this.emitEvent(
          GameEventType.FoolVictory,
          { foolId: accused.id, foolName: accused.name },
          true,
        );
        this.emitEvent(
          GameEventType.GameOver,
          {
            winner: 'Fool',
            foolName: accused.name,
            players: this.state.players.map((p) => ({
              id: p.id,
              name: p.name,
              role: p.role,
              alive: p.alive,
            })),
          },
          true,
        );
        return;
      }

      await this.killPlayer(accused, 'judged');

      // Check win AFTER all cascading deaths resolve
      if (this.checkAndResolveWin()) return;
    }

    this.state.accusedId = null;
  }
}
