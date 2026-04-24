import { describe, it, expect } from 'vitest';
import { Role, GameEventType } from '@ma-soi/shared';
import { createMockPlayer } from './helpers.js';
import { AgentManager } from '../game/AgentManager.js';
import { GameMaster } from '../game/GameMaster.js';

// Create a minimal AgentManager just to access eventToObservation
function getObsFn() {
  const gm = new GameMaster();
  const manager = new AgentManager(gm);
  return (event: any, viewer: any) => (manager as any).eventToObservation(event, viewer);
}

const obs = getObsFn();
const ev = (type: GameEventType, data: any, isPublic = true) => ({
  type,
  data,
  timestamp: Date.now(),
  isPublic,
});

// Reusable viewers
const seerPlayer = createMockPlayer({ id: 'seer-id', name: 'Seer', role: Role.Seer });
const wolfPlayer = createMockPlayer({ id: 'wolf-id', name: 'Wolf', role: Role.Werewolf });
const villager = createMockPlayer({ id: 'v-id', name: 'V1', role: Role.Villager });
const guardPlayer = createMockPlayer({ id: 'guard-id', name: 'Guard', role: Role.Guard });
const witchPlayer = createMockPlayer({ id: 'witch-id', name: 'Witch', role: Role.Witch });
const cupidPlayer = createMockPlayer({ id: 'cupid-id', name: 'Cupid', role: Role.Cupid });
const apprentice = createMockPlayer({ id: 'app-id', name: 'App', role: Role.ApprenticeSeer });
const targetPlayer = createMockPlayer({ id: 'target-id', name: 'Target', role: Role.Hunter });

describe('eventToObservation — public events', () => {
  it('PlayerDied visible to all', () => {
    const e = ev(GameEventType.PlayerDied, { playerName: 'Minh', role: 'Sói', cause: 'wolf_kill' });
    expect(obs(e, villager)).toContain('Minh đã chết');
    expect(obs(e, wolfPlayer)).toContain('Minh đã chết');
  });

  it('DayMessage visible to all', () => {
    const e = ev(GameEventType.DayMessage, { playerName: 'Minh', message: 'hello' });
    expect(obs(e, villager)).toContain('Minh nói');
    expect(obs(e, wolfPlayer)).toContain('Minh nói');
  });

  it('VoteCast visible to all', () => {
    const e = ev(GameEventType.VoteCast, { voterName: 'A', targetName: 'B' });
    expect(obs(e, villager)).toContain('A vote B');
  });

  it('JudgementVoteCast visible to all', () => {
    const e = ev(GameEventType.JudgementVoteCast, { voterName: 'A', verdict: 'kill' });
    expect(obs(e, villager)).toContain('GIẾT');
  });

  it('DawnAnnouncement visible to all', () => {
    const e = ev(GameEventType.DawnAnnouncement, { peaceful: false, deaths: [{ name: 'X' }] });
    expect(obs(e, villager)).toContain('X');
    expect(obs(e, wolfPlayer)).toContain('X');
  });

  it('LoverDeath visible to all', () => {
    const e = ev(GameEventType.LoverDeath, { deadName: 'A', loverName: 'B' });
    expect(obs(e, villager)).toContain('B chết theo A');
  });

  it('FoolVictory visible to all', () => {
    const e = ev(GameEventType.FoolVictory, { foolName: 'Fool' });
    expect(obs(e, villager)).toContain('Kẻ Ngốc');
  });
});

describe('eventToObservation — role-gated events', () => {
  it('SeerResult only visible to seer', () => {
    const e = ev(GameEventType.SeerResult, { seerId: 'seer-id', targetName: 'Wolf', isWolf: true });
    expect(obs(e, seerPlayer)).toContain('LÀ SÓI');
    expect(obs(e, villager)).toBeNull();
    expect(obs(e, wolfPlayer)).toBeNull();
  });

  it('GuardProtect only visible to guard', () => {
    const e = ev(GameEventType.GuardProtect, { targetName: 'V1' });
    expect(obs(e, guardPlayer)).toContain('bảo vệ');
    expect(obs(e, villager)).toBeNull();
  });

  it('WitchAction only visible to witch', () => {
    const e = ev(GameEventType.WitchAction, { action: 'heal', targetName: 'V1' });
    expect(obs(e, witchPlayer)).toContain('thuốc cứu');
    expect(obs(e, villager)).toBeNull();
  });

  it('NightActionPerformed only visible to wolves', () => {
    const e = ev(GameEventType.NightActionPerformed, { action: 'wolf_kill', targetName: 'V1' });
    expect(obs(e, wolfPlayer)).toContain('Sói cắn');
    expect(obs(e, villager)).toBeNull();
  });

  it('WolfDiscussMessage only visible to wolves', () => {
    const e = ev(GameEventType.WolfDiscussMessage, { playerName: 'Wolf', message: 'cắn V1' });
    expect(obs(e, wolfPlayer)).toContain('[Họp sói]');
    expect(obs(e, villager)).toBeNull();
  });

  it('AlphaInfect visible to target + wolves', () => {
    const e = ev(GameEventType.AlphaInfect, { targetId: 'target-id', targetName: 'Target' });
    expect(obs(e, targetPlayer)).toContain('LÂY NHIỄM');
    expect(obs(e, wolfPlayer)).toContain('lây nhiễm');
    expect(obs(e, villager)).toBeNull();
  });

  it('CupidPair only visible to cupid', () => {
    const e = ev(GameEventType.CupidPair, { player1Name: 'A', player2Name: 'B' });
    expect(obs(e, cupidPlayer)).toContain('ghép đôi');
    expect(obs(e, villager)).toBeNull();
  });

  it('ApprenticeSeerActivated only visible to apprentice', () => {
    const e = ev(GameEventType.ApprenticeSeerActivated, {
      apprenticeId: 'app-id',
      apprenticeName: 'App',
    });
    expect(obs(e, apprentice)).toContain('kế thừa');
    expect(obs(e, villager)).toBeNull();
  });

  it('WolfCubRevenge only visible to wolves', () => {
    const e = ev(GameEventType.WolfCubRevenge, { cubName: 'Cub' });
    expect(obs(e, wolfPlayer)).toContain('trả thù');
    expect(obs(e, villager)).toBeNull();
  });
});

describe('eventToObservation — InfectResolved regression', () => {
  it('returns string[] for infected player with teammates + discussion', () => {
    const e = ev(GameEventType.InfectResolved, {
      targetId: 'target-id',
      targetName: 'Target',
      wolfTeammates: [{ name: 'Alpha', role: Role.AlphaWolf, alive: true }],
      wolfDiscussion: [{ playerName: 'Alpha', message: 'cắn V1' }],
      wolfKillTarget: null,
    });
    const result = obs(e, targetPlayer);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2); // teammates + 1 discussion msg
    expect(result[0]).toContain('Đồng bọn sói');
    expect(result[1]).toContain('[Họp sói]');
  });

  it('includes wolfKillTarget when present', () => {
    const e = ev(GameEventType.InfectResolved, {
      targetId: 'target-id',
      targetName: 'Target',
      wolfTeammates: [{ name: 'Alpha', role: Role.AlphaWolf, alive: true }],
      wolfDiscussion: [],
      wolfKillTarget: 'V1',
    });
    const result = obs(e, targetPlayer);
    expect(Array.isArray(result)).toBe(true);
    expect(result.some((s: string) => s.includes('Sói cắn V1'))).toBe(true);
  });

  it('returns null for non-target player', () => {
    const e = ev(GameEventType.InfectResolved, {
      targetId: 'target-id',
      targetName: 'Target',
      wolfTeammates: [],
      wolfDiscussion: [],
      wolfKillTarget: null,
    });
    expect(obs(e, villager)).toBeNull();
    expect(obs(e, wolfPlayer)).toBeNull();
  });
});
