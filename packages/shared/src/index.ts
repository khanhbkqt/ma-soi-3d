// ── Roles & Teams ──
export enum Role {
  Werewolf = 'Werewolf',
  AlphaWolf = 'AlphaWolf',
  WolfCub = 'WolfCub',
  Villager = 'Villager',
  Seer = 'Seer',
  ApprenticeSeer = 'ApprenticeSeer',
  Witch = 'Witch',
  Hunter = 'Hunter',
  Guard = 'Guard',
  Cupid = 'Cupid',
  Fool = 'Fool',
}

export enum Team { Wolf = 'Wolf', Village = 'Village', Lovers = 'Lovers' }

export const roleTeam: Record<Role, Team> = {
  [Role.Werewolf]: Team.Wolf,
  [Role.AlphaWolf]: Team.Wolf,
  [Role.WolfCub]: Team.Wolf,
  [Role.Villager]: Team.Village,
  [Role.Seer]: Team.Village,
  [Role.ApprenticeSeer]: Team.Village,
  [Role.Witch]: Team.Village,
  [Role.Hunter]: Team.Village,
  [Role.Guard]: Team.Village,
  [Role.Cupid]: Team.Village,
  [Role.Fool]: Team.Village,
};

export function isWolfRole(role: Role): boolean {
  return role === Role.Werewolf || role === Role.AlphaWolf || role === Role.WolfCub;
}

// ── Phases ──
export enum Phase {
  Lobby = 'Lobby',
  Night = 'Night',
  Dawn = 'Dawn',          // Kết quả đêm, thông báo ai chết
  Day = 'Day',            // Thảo luận tự do
  Dusk = 'Dusk',          // Biểu quyết đưa lên giàn
  Judgement = 'Judgement', // Biện hộ + vote giết/tha
  GameOver = 'GameOver',
}

// ── Player ──
export interface Player {
  id: string;
  name: string;
  role: Role;
  alive: boolean;
  personality: AgentPersonality;
  providerId: string;
}

// ── Agent Personality ──
export interface AgentPersonality {
  id: string;
  name: string;
  trait: string;        // e.g. "aggressive accuser"
  speechStyle: string;  // e.g. "short, punchy sentences with lots of accusations"
  emoji: string;
}

// ── Provider Config ──
export interface ProviderConfig {
  id: string;
  type: 'openai-compatible' | 'openai' | 'anthropic' | 'ollama';
  name: string;
  apiKey?: string;
  baseUrl?: string;
  model: string;
}

// ── Toggleable Special Roles ──
// Roles the player can enable/disable in lobby. Core roles (Werewolf, Villager, Seer) are always on.
export const TOGGLEABLE_ROLES: { role: Role; label: string; emoji: string; description: string; minPlayers: number }[] = [
  { role: Role.AlphaWolf,      label: 'Sói Đầu Đàn',     emoji: '🐺👑', description: 'Lây nhiễm 1 người thành sói (1 lần)',   minPlayers: 6 },
  { role: Role.WolfCub,        label: 'Sói Con',          emoji: '🐺🍼', description: 'Chết → đêm sau sói cắn 2',              minPlayers: 9 },
  { role: Role.Witch,          label: 'Phù Thủy',        emoji: '🧪',   description: '1 thuốc cứu + 1 thuốc độc',              minPlayers: 6 },
  { role: Role.Hunter,         label: 'Thợ Săn',         emoji: '🏹',   description: 'Chết → bắn 1 người theo',                minPlayers: 6 },
  { role: Role.Guard,          label: 'Bảo Vệ',          emoji: '🛡️',  description: 'Bảo vệ 1 người mỗi đêm',                minPlayers: 6 },
  { role: Role.ApprenticeSeer, label: 'TT Tập Sự',       emoji: '🔮📚', description: 'Kế thừa khi Tiên Tri chết',              minPlayers: 9 },
  { role: Role.Cupid,          label: 'Thần Tình Yêu',   emoji: '💘',   description: 'Ghép đôi 2 người, chết chung',           minPlayers: 9 },
  { role: Role.Fool,           label: 'Kẻ Ngốc',         emoji: '🃏',   description: 'Bị treo cổ = thắng ngay',                minPlayers: 10 },
];

export function getDefaultEnabledRoles(playerCount: number): Role[] {
  return TOGGLEABLE_ROLES.filter(r => r.minPlayers <= playerCount).map(r => r.role);
}

// ── Game Config ──
export interface GameConfig {
  gameName: string;
  playerCount: number;
  discussionRounds: number;  // 2-3
  autoPlay: boolean;
  phaseDelay: number;        // ms between phases
  providers: ProviderConfig[];
  playerSetup: PlayerSetup[];
  enabledSpecialRoles: Role[];  // which special roles are active this game
}

export interface PlayerSetup {
  name: string;
  providerId: string;
  personalityId?: string;  // auto-assign if not set
}

// ── Night Actions ──
export type NightActionType = 'wolf_kill' | 'wolf_infect' | 'seer_investigate' | 'witch_heal' | 'witch_kill' | 'guard_protect' | 'cupid_pair';
export interface NightAction {
  type: NightActionType;
  actorId: string;
  targetId: string;
  targetId2?: string;  // for cupid pairing
}

// ── Day Messages ──
export interface DayMessage {
  playerId: string;
  playerName: string;
  message: string;
  round: number;
  timestamp: number;
}

// ── Votes ──
export interface Vote {
  voterId: string;
  targetId: string;
}

// ── Judgement ──
export interface JudgementVote {
  voterId: string;
  verdict: 'kill' | 'spare';
}

export interface DefenseMessage {
  playerId: string;
  playerName: string;
  message: string;
  timestamp: number;
}

// ── Couple (Cupid) ──
export interface CoupleState {
  player1Id: string;
  player2Id: string;
}

// ── Game Events ──
export enum GameEventType {
  GameStarted = 'GameStarted',
  PhaseChanged = 'PhaseChanged',
  NightActionPerformed = 'NightActionPerformed',
  NightResolved = 'NightResolved',
  PlayerDied = 'PlayerDied',
  DayMessage = 'DayMessage',
  VoteCast = 'VoteCast',
  VoteResult = 'VoteResult',
  HunterShot = 'HunterShot',
  GameOver = 'GameOver',
  SeerResult = 'SeerResult',
  GuardProtect = 'GuardProtect',
  WitchAction = 'WitchAction',
  RoleReveal = 'RoleReveal',
  // New phases
  DawnAnnouncement = 'DawnAnnouncement',
  DuskNomination = 'DuskNomination',
  DefenseSpeech = 'DefenseSpeech',
  JudgementVoteCast = 'JudgementVoteCast',
  JudgementResult = 'JudgementResult',
  // New roles
  AlphaInfect = 'AlphaInfect',
  WolfCubRevenge = 'WolfCubRevenge',
  CupidPair = 'CupidPair',
  LoverDeath = 'LoverDeath',
  ApprenticeSeerActivated = 'ApprenticeSeerActivated',
  FoolVictory = 'FoolVictory',
}

export interface GameEvent {
  type: GameEventType;
  data: any;
  timestamp: number;
  isPublic: boolean;  // false = god-view only
}

// ── Game State ──
export interface WitchPotions { healUsed: boolean; killUsed: boolean; }

export interface GameState {
  id: string;
  config: GameConfig;
  phase: Phase;
  round: number;
  players: Player[];
  events: GameEvent[];
  nightActions: NightAction[];
  votes: Vote[];
  witchPotions: WitchPotions;
  lastGuardedId: string | null;  // guard can't protect same person twice in a row
  winner: Team | 'Fool' | null;
  isPaused: boolean;
  discussionMessages: DayMessage[];
  // Judgement
  accusedId: string | null;
  defenseSpeech: DefenseMessage | null;
  judgementVotes: JudgementVote[];
  // Night deaths (resolved during night, announced at dawn)
  pendingDeaths: { playerId: string; playerName: string; cause: string }[];
  // New role states
  couple: CoupleState | null;
  alphaInfectUsed: boolean;
  wolfCubDead: boolean;
  wolfCubRevengeActive: boolean;  // true = this night wolves kill 2
  originalSeerDead: boolean;
  apprenticeSeerActivated: boolean;
}

// ── Player View (Spectator) ──
export interface RoleContext {
  wolfTeammates?: { name: string; role: string; alive: boolean }[];
  seerResults?: { targetName: string; isWolf: boolean }[];
  witchPotions?: WitchPotions;
  lastGuardedName?: string | null;
  coupleNames?: [string, string] | null;
  loverName?: string | null;
  isApprenticeSeerActivated?: boolean;
  alphaInfectUsed?: boolean;
}

export interface PlayerViewDeduction {
  confirmed: [string, { role: string; source: string }][];
  seerResults: [string, 'wolf' | 'clear'][];
  claims: [string, { role: string; round: number }[]][];
  accusations: [string, string[]][];
  deductionPrompt: string;
}

export interface PlayerViewState {
  playerId: string;
  playerName: string;
  role: Role;
  alive: boolean;
  personality: AgentPersonality;
  observations: string[];
  compressedMemory: string;
  deduction: PlayerViewDeduction;
  roleContext: RoleContext;
}

// ── Agent Memory ──
export interface AgentMemory {
  observations: string[];
  reflections: string[];
  knownRoles: Record<string, Role>;  // player id -> known role
  suspicions: Record<string, number>; // player id -> suspicion level
}

// ── Role Balancing ──
export function getRoleDistribution(playerCount: number, enabledRoles?: Role[]): Role[] {
  if (playerCount < 6 || playerCount > 16) throw new Error('Player count must be 6-16');

  const enabled = enabledRoles ?? getDefaultEnabledRoles(playerCount);
  const has = (r: Role) => enabled.includes(r);

  const roles: Role[] = [];

  // ── Wolves ──
  if (playerCount <= 8) {
    roles.push(has(Role.AlphaWolf) ? Role.AlphaWolf : Role.Werewolf);
    roles.push(Role.Werewolf);
  } else if (playerCount <= 12) {
    roles.push(has(Role.AlphaWolf) ? Role.AlphaWolf : Role.Werewolf);
    roles.push(has(Role.WolfCub) ? Role.WolfCub : Role.Werewolf);
    roles.push(Role.Werewolf);
  } else {
    roles.push(has(Role.AlphaWolf) ? Role.AlphaWolf : Role.Werewolf);
    roles.push(has(Role.WolfCub) ? Role.WolfCub : Role.Werewolf);
    roles.push(Role.Werewolf, Role.Werewolf);
  }

  // ── Village: Seer is always on ──
  roles.push(Role.Seer);

  // ── Toggleable village roles ──
  const villageToggles: Role[] = [Role.Witch, Role.Hunter, Role.Guard, Role.ApprenticeSeer, Role.Cupid, Role.Fool];
  for (const r of villageToggles) {
    if (has(r) && roles.length < playerCount) roles.push(r);
  }

  // ── Fill remaining with Villagers ──
  while (roles.length < playerCount) roles.push(Role.Villager);

  return roles;
}

// ── Socket Events ──
export const SocketEvents = {
  // Client -> Server
  CREATE_GAME: 'create_game',
  START_GAME: 'start_game',
  PAUSE_GAME: 'pause_game',
  RESUME_GAME: 'resume_game',
  STEP_GAME: 'step_game',
  SET_SPECTATOR_MODE: 'set_spectator_mode',
  SET_PLAYER_VIEW: 'set_player_view',
  TEST_PROVIDER: 'test_provider',
  // Server -> Client
  GAME_EVENT: 'game_event',
  GAME_STATE: 'game_state',
  PLAYER_VIEW_STATE: 'player_view_state',
  PROVIDER_TEST_RESULT: 'provider_test_result',
  ERROR: 'error',
} as const;
