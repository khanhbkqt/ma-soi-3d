import { GameState, GameEvent, GameEventType, Player, Role } from '@ma-soi/shared';
import { ROLE_NAMES_VI } from './constants';

interface TimelineEntry {
  phase: string;
  round: number;
  type: string;
  player?: string;
  role?: string;
  message?: string;
  reasoning?: string;
  target?: string;
  action?: string;
  details?: Record<string, any>;
}

export function buildGameTimeline(gameState: GameState) {
  const playerMap = new Map(gameState.players.map((p) => [p.id, p]));
  const roleName = (r: Role) => ROLE_NAMES_VI[r] || r;
  const playerInfo = (p: Player) => ({
    name: p.name,
    role: roleName(p.role),
    personality: p.personality.id,
  });

  let currentPhase = 'Lobby';
  let currentRound = 0;
  const timeline: TimelineEntry[] = [];

  for (const e of gameState.events) {
    const d = e.data;

    if (e.type === GameEventType.PhaseChanged) {
      currentPhase = d.phase;
      currentRound = d.round;
      timeline.push({ phase: d.phase, round: d.round, type: 'PhaseChanged' });
      continue;
    }

    const base = { phase: currentPhase, round: currentRound };

    switch (e.type) {
      case GameEventType.DayMessage:
        timeline.push({
          ...base,
          type: 'DayMessage',
          player: d.playerName,
          role: roleName(playerMap.get(d.playerId)?.role as Role),
          message: d.message,
          reasoning: d.reasoning,
        });
        break;
      case GameEventType.WolfDiscussMessage:
        timeline.push({
          ...base,
          type: 'WolfDiscuss',
          player: d.playerName,
          message: d.message,
          reasoning: d.reasoning,
        });
        break;
      case GameEventType.VoteCast:
        timeline.push({
          ...base,
          type: 'Vote',
          player: d.voterName,
          target: d.targetName,
          reasoning: d.reasoning,
        });
        break;
      case GameEventType.DuskNomination:
        timeline.push({ ...base, type: 'Nomination', target: d.accusedName });
        break;
      case GameEventType.DefenseSpeech:
        timeline.push({
          ...base,
          type: 'Defense',
          player: d.playerName,
          message: d.message,
          reasoning: d.reasoning,
        });
        break;
      case GameEventType.JudgementVoteCast:
        timeline.push({
          ...base,
          type: 'JudgementVote',
          player: d.voterName,
          action: d.verdict,
          reasoning: d.reasoning,
        });
        break;
      case GameEventType.JudgementResult:
        timeline.push({
          ...base,
          type: 'JudgementResult',
          target: d.accusedName,
          action: d.executed ? 'executed' : 'spared',
          details: { killVotes: d.killVotes, spareVotes: d.spareVotes },
        });
        break;
      case GameEventType.NightActionPerformed:
        timeline.push({
          ...base,
          type: 'WolfKill',
          target: d.targetName || d.targetNames?.join(', '),
          reasoning: d.reasoning,
        });
        break;
      case GameEventType.SeerResult:
        timeline.push({
          ...base,
          type: 'SeerInvestigate',
          target: d.targetName,
          action: d.isWolf ? 'WOLF' : 'NOT_WOLF',
          reasoning: d.reasoning,
        });
        break;
      case GameEventType.GuardProtect:
        timeline.push({
          ...base,
          type: 'GuardProtect',
          target: d.targetName,
          reasoning: d.reasoning,
        });
        break;
      case GameEventType.WitchAction:
        timeline.push({
          ...base,
          type: 'WitchAction',
          target: d.targetName,
          action: d.action,
          reasoning: d.reasoning,
        });
        break;
      case GameEventType.AlphaInfect:
        timeline.push({
          ...base,
          type: 'AlphaInfect',
          target: d.targetName,
          reasoning: d.reasoning,
        });
        break;
      case GameEventType.HunterShot:
        timeline.push({ ...base, type: 'HunterShot', target: d.targetName });
        break;
      case GameEventType.PlayerDied:
        timeline.push({
          ...base,
          type: 'Death',
          player: d.playerName,
          role: roleName(d.role as Role),
          action: d.cause,
        });
        break;
      case GameEventType.CupidPair:
        timeline.push({
          ...base,
          type: 'CupidPair',
          details: { player1: d.player1Name, player2: d.player2Name },
        });
        break;
      case GameEventType.LoverDeath:
        timeline.push({
          ...base,
          type: 'LoverDeath',
          player: d.loverName,
          details: { deadPartner: d.deadName },
        });
        break;
      case GameEventType.GameOver:
        timeline.push({ ...base, type: 'GameOver', details: { winner: d.winner } });
        break;
    }
  }

  // Strip undefined values for cleaner JSON
  const clean = timeline.map((entry) =>
    Object.fromEntries(Object.entries(entry).filter(([, v]) => v !== undefined)),
  );

  return {
    gameId: gameState.id,
    players: gameState.players.map((p) => ({
      ...playerInfo(p),
      alive: p.alive,
      model: p.modelName,
    })),
    winner: gameState.winner,
    totalRounds: gameState.round,
    timeline: clean,
  };
}
