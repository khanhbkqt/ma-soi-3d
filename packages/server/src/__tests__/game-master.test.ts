import { describe, it, expect, vi } from 'vitest';
import { Role, Phase, GameEventType } from '@ma-soi/shared';
import { createMockPlayer, createTestGM, collectEvents } from './helpers.js';

// Helper: standard 6-player setup
function sixPlayers() {
  return [
    createMockPlayer({ name: 'Wolf1', role: Role.Werewolf }),
    createMockPlayer({ name: 'Wolf2', role: Role.Werewolf }),
    createMockPlayer({ name: 'Seer', role: Role.Seer }),
    createMockPlayer({ name: 'Witch', role: Role.Witch }),
    createMockPlayer({ name: 'Guard', role: Role.Guard }),
    createMockPlayer({ name: 'Villager', role: Role.Villager }),
  ];
}

describe('GameMaster — night resolve', () => {
  it('wolf kills unguarded unhealed target', async () => {
    const players = sixPlayers();
    const { gm, resolver } = createTestGM(players, {
      guardProtect: vi.fn().mockResolvedValue('Wolf1'), // guard protects wolf (irrelevant)
      wolfKill: vi.fn().mockResolvedValue('Villager'),
      witchAction: vi.fn().mockResolvedValue({ heal: false, killTarget: null }),
      seerInvestigate: vi.fn().mockResolvedValue('Wolf1'),
    });
    await (gm as any).nightPhase();
    expect(gm.state.pendingDeaths).toHaveLength(1);
    expect(gm.state.pendingDeaths[0].playerName).toBe('Villager');
  });

  it('guard protects wolf target → no death', async () => {
    const players = sixPlayers();
    const { gm } = createTestGM(players, {
      guardProtect: vi.fn().mockResolvedValue('Villager'),
      wolfKill: vi.fn().mockResolvedValue('Villager'),
      witchAction: vi.fn().mockResolvedValue({ heal: false, killTarget: null }),
      seerInvestigate: vi.fn().mockResolvedValue('Wolf1'),
    });
    await (gm as any).nightPhase();
    expect(gm.state.pendingDeaths).toHaveLength(0);
  });

  it('witch heals wolf target → no death', async () => {
    const players = sixPlayers();
    const { gm } = createTestGM(players, {
      guardProtect: vi.fn().mockResolvedValue('Wolf1'),
      wolfKill: vi.fn().mockResolvedValue('Villager'),
      witchAction: vi.fn().mockResolvedValue({ heal: true, killTarget: null }),
      seerInvestigate: vi.fn().mockResolvedValue('Wolf1'),
    });
    await (gm as any).nightPhase();
    expect(gm.state.pendingDeaths).toHaveLength(0);
    expect(gm.state.witchPotions.healUsed).toBe(true);
  });

  it('witch kills separate target → 2 pending deaths', async () => {
    const players = sixPlayers();
    const { gm } = createTestGM(players, {
      guardProtect: vi.fn().mockResolvedValue('Wolf1'),
      wolfKill: vi.fn().mockResolvedValue('Villager'),
      witchAction: vi.fn().mockResolvedValue({ heal: false, killTarget: 'Seer' }),
      seerInvestigate: vi.fn().mockResolvedValue('Wolf1'),
    });
    await (gm as any).nightPhase();
    expect(gm.state.pendingDeaths).toHaveLength(2);
    const names = gm.state.pendingDeaths.map((d: any) => d.playerName).sort();
    expect(names).toEqual(['Seer', 'Villager']);
  });

  it('witch kill NOT blocked by guard', async () => {
    const players = sixPlayers();
    const { gm } = createTestGM(players, {
      guardProtect: vi.fn().mockResolvedValue('Seer'), // guard protects Seer
      wolfKill: vi.fn().mockResolvedValue('Villager'),
      witchAction: vi.fn().mockResolvedValue({ heal: false, killTarget: 'Seer' }), // witch poisons Seer
      seerInvestigate: vi.fn().mockResolvedValue('Wolf1'),
    });
    await (gm as any).nightPhase();
    // Seer should still die (witch kill not blocked by guard)
    const seerDeath = gm.state.pendingDeaths.find((d: any) => d.playerName === 'Seer');
    expect(seerDeath).toBeDefined();
    expect(seerDeath!.cause).toBe('witch_kill');
  });

  it('seer investigates wolf → isWolf=true', async () => {
    const players = sixPlayers();
    const { gm } = createTestGM(players, {
      guardProtect: vi.fn().mockResolvedValue('Guard'),
      wolfKill: vi.fn().mockResolvedValue('Villager'),
      witchAction: vi.fn().mockResolvedValue({ heal: false, killTarget: null }),
      seerInvestigate: vi.fn().mockResolvedValue('Wolf1'),
    });
    const events = collectEvents(gm);
    await (gm as any).nightPhase();
    const seerEvent = events.find((e) => e.type === GameEventType.SeerResult);
    expect(seerEvent).toBeDefined();
    expect(seerEvent.data.isWolf).toBe(true);
    expect(seerEvent.data.targetName).toBe('Wolf1');
  });

  it('seer investigates villager → isWolf=false', async () => {
    const players = sixPlayers();
    const { gm } = createTestGM(players, {
      guardProtect: vi.fn().mockResolvedValue('Guard'),
      wolfKill: vi.fn().mockResolvedValue('Seer'),
      witchAction: vi.fn().mockResolvedValue({ heal: false, killTarget: null }),
      seerInvestigate: vi.fn().mockResolvedValue('Villager'),
    });
    const events = collectEvents(gm);
    await (gm as any).nightPhase();
    const seerEvent = events.find((e) => e.type === GameEventType.SeerResult);
    expect(seerEvent.data.isWolf).toBe(false);
  });
});

describe('GameMaster — win conditions', () => {
  it('all wolves dead → Village wins', async () => {
    const players = [
      createMockPlayer({ name: 'Wolf1', role: Role.Werewolf, alive: false }),
      createMockPlayer({ name: 'Wolf2', role: Role.Werewolf, alive: false }),
      createMockPlayer({ name: 'V1', role: Role.Villager }),
      createMockPlayer({ name: 'V2', role: Role.Villager }),
    ];
    const { gm } = createTestGM(players);
    const result = (gm as any).checkWin();
    expect(result).toBe('Village');
  });

  it('wolves >= villagers → Wolf wins', async () => {
    const players = [
      createMockPlayer({ name: 'Wolf1', role: Role.Werewolf }),
      createMockPlayer({ name: 'V1', role: Role.Villager }),
    ];
    const { gm } = createTestGM(players);
    const result = (gm as any).checkWin();
    expect(result).toBe('Wolf');
  });

  it('game continues when wolves < villagers', () => {
    const players = [
      createMockPlayer({ name: 'Wolf1', role: Role.Werewolf }),
      createMockPlayer({ name: 'V1', role: Role.Villager }),
      createMockPlayer({ name: 'V2', role: Role.Villager }),
    ];
    const { gm } = createTestGM(players);
    expect((gm as any).checkWin()).toBeNull();
  });

  it('infected villager counts as wolf for win condition (wolves >= villagers)', () => {
    // 1 native wolf + 1 infected Seer = 2 wolf-team vs 2 villagers → Wolf wins
    const players = [
      createMockPlayer({ name: 'Wolf1', role: Role.Werewolf }),
      createMockPlayer({ name: 'Seer', role: Role.Seer, infected: true }), // infected spy
      createMockPlayer({ name: 'V1', role: Role.Villager }),
      createMockPlayer({ name: 'V2', role: Role.Villager }),
    ];
    const { gm } = createTestGM(players);
    expect((gm as any).checkWin()).toBe('Wolf');
  });

  it('infected villager counts as wolf — village still wins when all wolf-team dead', () => {
    // All wolves dead, infected spy also dead → Village wins
    const players = [
      createMockPlayer({ name: 'Wolf1', role: Role.Werewolf, alive: false }),
      createMockPlayer({ name: 'Seer', role: Role.Seer, infected: true, alive: false }), // dead spy
      createMockPlayer({ name: 'V1', role: Role.Villager }),
      createMockPlayer({ name: 'V2', role: Role.Villager }),
    ];
    const { gm } = createTestGM(players);
    expect((gm as any).checkWin()).toBe('Village');
  });

  it('infected spy alive but outnumbered — game continues', () => {
    // 1 infected spy vs 3 clean villagers → no win yet
    const players = [
      createMockPlayer({ name: 'Wolf1', role: Role.Werewolf, alive: false }),
      createMockPlayer({ name: 'Guard', role: Role.Guard, infected: true }),
      createMockPlayer({ name: 'V1', role: Role.Villager }),
      createMockPlayer({ name: 'V2', role: Role.Villager }),
      createMockPlayer({ name: 'V3', role: Role.Villager }),
    ];
    const { gm } = createTestGM(players);
    expect((gm as any).checkWin()).toBeNull();
  });
});

describe('GameMaster — judgement', () => {
  it('>50% kill votes → player executed', async () => {
    const players = [
      createMockPlayer({ name: 'Wolf1', role: Role.Werewolf }),
      createMockPlayer({ name: 'V1', role: Role.Villager }),
      createMockPlayer({ name: 'V2', role: Role.Villager }),
      createMockPlayer({ name: 'V3', role: Role.Villager }),
    ];
    const accused = players[0]; // Wolf1
    const { gm } = createTestGM(
      players,
      {
        defend: vi.fn().mockResolvedValue('I am innocent'),
        judgeVote: vi.fn().mockResolvedValue('kill'), // all vote kill
      },
      { accusedId: accused.id, phase: Phase.Judgement },
    );

    const events = collectEvents(gm);
    await (gm as any).judgementPhase();

    const result = events.find((e) => e.type === GameEventType.JudgementResult);
    expect(result.data.executed).toBe(true);
    expect(accused.alive).toBe(false);
  });

  it('<=50% kill votes → player spared', async () => {
    const players = [
      createMockPlayer({ name: 'Wolf1', role: Role.Werewolf }),
      createMockPlayer({ name: 'V1', role: Role.Villager }),
      createMockPlayer({ name: 'V2', role: Role.Villager }),
      createMockPlayer({ name: 'V3', role: Role.Villager }),
    ];
    const accused = players[0];
    const { gm } = createTestGM(
      players,
      {
        defend: vi.fn().mockResolvedValue('I am innocent'),
        judgeVote: vi.fn().mockResolvedValue('spare'), // all vote spare
      },
      { accusedId: accused.id, phase: Phase.Judgement },
    );

    await (gm as any).judgementPhase();
    expect(accused.alive).toBe(true);
  });
});

describe('GameMaster — dawn', () => {
  it('processes pendingDeaths → PlayerDied events', async () => {
    const players = sixPlayers();
    const villager = players.find((p) => p.name === 'Villager')!;
    const { gm } = createTestGM(
      players,
      {},
      {
        pendingDeaths: [{ playerId: villager.id, playerName: 'Villager', cause: 'wolf_kill' }],
      },
    );
    const events = collectEvents(gm);
    await (gm as any).dawnPhase();

    expect(villager.alive).toBe(false);
    expect(
      events.some((e) => e.type === GameEventType.PlayerDied && e.data.playerName === 'Villager'),
    ).toBe(true);
    expect(gm.state.pendingDeaths).toHaveLength(0);
  });

  it('peaceful night → DawnAnnouncement with peaceful=true', async () => {
    const players = sixPlayers();
    const { gm } = createTestGM(players, {}, { pendingDeaths: [] });
    const events = collectEvents(gm);
    await (gm as any).dawnPhase();

    const dawn = events.find((e) => e.type === GameEventType.DawnAnnouncement);
    expect(dawn).toBeDefined();
    expect(dawn.data.peaceful).toBe(true);
  });
});
