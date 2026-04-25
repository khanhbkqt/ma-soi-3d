import { vi } from 'vitest';
import { Player, GameState, GameConfig, Phase, Role, Team, AgentPersonality } from '@ma-soi/shared';
import { GameMaster, ActionResolver } from '../game/GameMaster.js';

const DEFAULT_PERSONALITY: AgentPersonality = {
  id: 'test',
  name: 'Test',
  trait: 'test',
  speechStyle: 'test',
  emoji: '🧪',
};

let _counter = 0;
export function createMockPlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    name: overrides.name ?? `Player${_counter++}`,
    role: Role.Villager,
    alive: true,
    personality: DEFAULT_PERSONALITY,
    providerId: 'test',
    modelName: 'test',
    ...overrides,
  };
}

export function createMockConfig(overrides: Partial<GameConfig> = {}): GameConfig {
  return {
    gameName: 'test',
    playerCount: 6,
    discussionRounds: 1,
    discussionTimeLimitMs: 1000,
    autoPlay: true,
    phaseDelay: 0,
    providers: [],
    playerSetup: [],
    enabledSpecialRoles: [],
    ...overrides,
  };
}

export function createMockState(players: Player[], overrides: Partial<GameState> = {}): GameState {
  return {
    id: 'test-game',
    config: createMockConfig({ playerCount: players.length }),
    phase: Phase.Night,
    round: 1,
    players,
    events: [],
    nightActions: [],
    votes: [],
    witchPotions: { healUsed: false, killUsed: false },
    lastGuardedId: null,
    winner: null,
    isPaused: false,
    discussionMessages: [],
    accusedId: null,
    defenseSpeech: null,
    judgementVotes: [],
    pendingDeaths: [],
    couple: null,
    alphaInfectUsed: false,
    wolfCubDead: false,
    wolfCubRevengeActive: false,
    originalSeerDead: false,
    apprenticeSeerActivated: false,
    ...overrides,
  };
}

export function createMockResolver(overrides: Partial<ActionResolver> = {}): ActionResolver {
  return {
    wolfKill: vi.fn().mockResolvedValue(''),
    alphaInfect: vi.fn().mockResolvedValue({ target: '', infect: false }),
    wolfDoubleKill: vi.fn().mockResolvedValue(['', '']),
    wolfDiscuss: vi.fn().mockResolvedValue('ok'),
    seerInvestigate: vi.fn().mockResolvedValue(''),
    witchAction: vi.fn().mockResolvedValue({ heal: false, killTarget: null }),
    guardProtect: vi.fn().mockResolvedValue(''),
    cupidPair: vi.fn().mockResolvedValue(['', '']),
    discuss: vi.fn().mockResolvedValue({ message: 'test', wantToSpeak: false }),
    vote: vi.fn().mockResolvedValue('skip'),
    defend: vi.fn().mockResolvedValue('I am innocent'),
    judgeVote: vi.fn().mockResolvedValue('spare'),
    hunterShot: vi.fn().mockResolvedValue(''),
    witchCureInfect: vi.fn().mockResolvedValue(true),
    ...overrides,
  };
}

/** Create a GameMaster with state initialized and resolver set. Ready to call private phase methods. */
export function createTestGM(
  players: Player[],
  resolverOverrides: Partial<ActionResolver> = {},
  stateOverrides: Partial<GameState> = {},
) {
  const gm = new GameMaster();
  const config = createMockConfig({ playerCount: players.length });
  gm.createGame(config, players);
  // Apply state overrides
  Object.assign(gm.state, stateOverrides);
  const resolver = createMockResolver(resolverOverrides);
  gm.setResolver(resolver);
  return { gm, resolver };
}

/** Collect all emitted events from a GameMaster */
export function collectEvents(gm: GameMaster) {
  const events: any[] = [];
  gm.on('gameEvent', (e: any) => events.push(e));
  return events;
}
