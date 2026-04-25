// ── Roles & Teams ──
export var Role;
(function (Role) {
  Role['Werewolf'] = 'Werewolf';
  Role['AlphaWolf'] = 'AlphaWolf';
  Role['WolfCub'] = 'WolfCub';
  Role['Villager'] = 'Villager';
  Role['Seer'] = 'Seer';
  Role['ApprenticeSeer'] = 'ApprenticeSeer';
  Role['Witch'] = 'Witch';
  Role['Hunter'] = 'Hunter';
  Role['Guard'] = 'Guard';
  Role['Cupid'] = 'Cupid';
  Role['Fool'] = 'Fool';
})(Role || (Role = {}));
export var Team;
(function (Team) {
  Team['Wolf'] = 'Wolf';
  Team['Village'] = 'Village';
  Team['Lovers'] = 'Lovers';
})(Team || (Team = {}));
export const roleTeam = {
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
export function isWolfRole(role) {
  return role === Role.Werewolf || role === Role.AlphaWolf || role === Role.WolfCub;
}
// ── Phases ──
export var Phase;
(function (Phase) {
  Phase['Lobby'] = 'Lobby';
  Phase['Night'] = 'Night';
  Phase['Dawn'] = 'Dawn';
  Phase['Day'] = 'Day';
  Phase['Dusk'] = 'Dusk';
  Phase['Judgement'] = 'Judgement';
  Phase['GameOver'] = 'GameOver';
})(Phase || (Phase = {}));
export const VIETNAMESE_NAMES = [
  'Minh',
  'Lan',
  'Hùng',
  'Tú',
  'Hoa',
  'Đức',
  'Linh',
  'Phong',
  'Mai',
  'Khoa',
  'Thảo',
  'Bảo',
  'Ngọc',
  'Quân',
  'Trang',
  'Dũng',
];
// ── Toggleable Special Roles ──
// Roles the player can enable/disable in lobby. Core roles (Werewolf, Villager, Seer) are always on.
export const TOGGLEABLE_ROLES = [
  {
    role: Role.AlphaWolf,
    label: 'Sói Đầu Đàn',
    emoji: '🐺👑',
    description: 'Lây nhiễm 1 người thành sói (1 lần)',
    minPlayers: 6,
  },
  {
    role: Role.WolfCub,
    label: 'Sói Con',
    emoji: '🐺🍼',
    description: 'Chết → đêm sau sói cắn 2',
    minPlayers: 9,
  },
  {
    role: Role.Witch,
    label: 'Phù Thủy',
    emoji: '🧪',
    description: '1 thuốc cứu + 1 thuốc độc',
    minPlayers: 6,
  },
  {
    role: Role.Hunter,
    label: 'Thợ Săn',
    emoji: '🏹',
    description: 'Chết → bắn 1 người theo',
    minPlayers: 6,
  },
  {
    role: Role.Guard,
    label: 'Bảo Vệ',
    emoji: '🛡️',
    description: 'Bảo vệ 1 người mỗi đêm',
    minPlayers: 6,
  },
  {
    role: Role.ApprenticeSeer,
    label: 'TT Tập Sự',
    emoji: '🔮📚',
    description: 'Kế thừa khi Tiên Tri chết',
    minPlayers: 9,
  },
  {
    role: Role.Cupid,
    label: 'Thần Tình Yêu',
    emoji: '💘',
    description: 'Ghép đôi 2 người, chết chung',
    minPlayers: 9,
  },
  {
    role: Role.Fool,
    label: 'Kẻ Ngốc',
    emoji: '🃏',
    description: 'Bị treo cổ = thắng ngay',
    minPlayers: 10,
  },
];
export function getDefaultEnabledRoles(playerCount) {
  return TOGGLEABLE_ROLES.filter((r) => r.minPlayers <= playerCount).map((r) => r.role);
}
// ── Game Events ──
export var GameEventType;
(function (GameEventType) {
  GameEventType['GameStarted'] = 'GameStarted';
  GameEventType['PhaseChanged'] = 'PhaseChanged';
  GameEventType['NightActionPerformed'] = 'NightActionPerformed';
  GameEventType['NightResolved'] = 'NightResolved';
  GameEventType['PlayerDied'] = 'PlayerDied';
  GameEventType['DayMessage'] = 'DayMessage';
  GameEventType['VoteCast'] = 'VoteCast';
  GameEventType['VoteResult'] = 'VoteResult';
  GameEventType['HunterShot'] = 'HunterShot';
  GameEventType['GameOver'] = 'GameOver';
  GameEventType['SeerResult'] = 'SeerResult';
  GameEventType['GuardProtect'] = 'GuardProtect';
  GameEventType['WitchAction'] = 'WitchAction';
  GameEventType['RoleReveal'] = 'RoleReveal';
  // New phases
  GameEventType['DawnAnnouncement'] = 'DawnAnnouncement';
  GameEventType['DuskNomination'] = 'DuskNomination';
  GameEventType['DefenseSpeech'] = 'DefenseSpeech';
  GameEventType['JudgementVoteCast'] = 'JudgementVoteCast';
  GameEventType['JudgementResult'] = 'JudgementResult';
  // New roles
  GameEventType['AlphaInfect'] = 'AlphaInfect';
  GameEventType['WolfCubRevenge'] = 'WolfCubRevenge';
  GameEventType['CupidPair'] = 'CupidPair';
  GameEventType['LoverDeath'] = 'LoverDeath';
  GameEventType['ApprenticeSeerActivated'] = 'ApprenticeSeerActivated';
  GameEventType['FoolVictory'] = 'FoolVictory';
  GameEventType['WolfDiscussMessage'] = 'WolfDiscussMessage';
  GameEventType['InfectResolved'] = 'InfectResolved';
  GameEventType['PlayerThinking'] = 'PlayerThinking';
})(GameEventType || (GameEventType = {}));
// ── Role Balancing ──
export function getRoleDistribution(playerCount, enabledRoles) {
  if (playerCount < 6 || playerCount > 16) throw new Error('Player count must be 6-16');
  const enabled = enabledRoles ?? getDefaultEnabledRoles(playerCount);
  const has = (r) => enabled.includes(r);
  const roles = [];
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
  const villageToggles = [
    Role.Witch,
    Role.Hunter,
    Role.Guard,
    Role.ApprenticeSeer,
    Role.Cupid,
    Role.Fool,
  ];
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
  TOKEN_USAGE: 'token_usage',
  ERROR: 'error',
};
