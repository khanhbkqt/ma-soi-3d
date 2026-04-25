import { describe, it, expect, vi } from 'vitest';
import { Role, Phase, GameEventType, Team } from '@ma-soi/shared';
import { createMockPlayer, createTestGM, collectEvents } from './helpers.js';

describe('Alpha Wolf infect', () => {
  function infectSetup() {
    const players = [
      createMockPlayer({ name: 'Alpha', role: Role.AlphaWolf }),
      createMockPlayer({ name: 'Wolf2', role: Role.Werewolf }),
      createMockPlayer({ name: 'Seer', role: Role.Seer }),
      createMockPlayer({ name: 'Hunter', role: Role.Hunter }),
      createMockPlayer({ name: 'V1', role: Role.Villager }),
      createMockPlayer({ name: 'V2', role: Role.Villager }),
    ];
    return players;
  }

  it('infect sets infected=true, keeps original role, does NOT kill', async () => {
    const players = infectSetup();
    const hunter = players.find((p) => p.name === 'Hunter')!;
    const { gm } = createTestGM(
      players,
      {
        guardProtect: vi.fn().mockResolvedValue('Alpha'),
        alphaInfect: vi.fn().mockResolvedValue({ target: 'Hunter', infect: true }),
        witchAction: vi.fn().mockResolvedValue({ heal: false, killTarget: null }),
        witchCureInfect: vi.fn().mockResolvedValue(false), // irrelevant (Hunter is not Witch)
        seerInvestigate: vi.fn().mockResolvedValue('V1'),
      },
      { round: 2 }, // round > 1 required
    );
    await (gm as any).nightPhase();
    // Infected: flag set, role preserved
    expect(hunter.infected).toBe(true);
    expect(hunter.role).toBe(Role.Hunter); // role unchanged!
    expect(gm.state.alphaInfectUsed).toBe(true);
    expect(gm.state.pendingDeaths).toHaveLength(0); // infect does NOT kill
  });

  it('cannot infect on night 1 (round === 1)', async () => {
    const players = infectSetup();
    const hunter = players.find((p) => p.name === 'Hunter')!;
    const alphaInfect = vi.fn().mockResolvedValue({ target: 'Hunter', infect: true });
    const { gm } = createTestGM(
      players,
      {
        guardProtect: vi.fn().mockResolvedValue('Alpha'),
        alphaInfect,
        wolfKill: vi.fn().mockResolvedValue('V1'), // fallback regular kill
        witchAction: vi.fn().mockResolvedValue({ heal: false, killTarget: null }),
        seerInvestigate: vi.fn().mockResolvedValue('V1'),
      },
      { round: 1 }, // night 1 — infect blocked
    );
    await (gm as any).nightPhase();
    // alphaInfect resolver not called (logic gated at round > 1)
    expect(alphaInfect).not.toHaveBeenCalled();
    expect(hunter.infected).toBeFalsy();
    expect(hunter.role).toBe(Role.Hunter);
  });

  it('guard blocks infect — target NOT infected, no kill', async () => {
    const players = [
      createMockPlayer({ name: 'Alpha', role: Role.AlphaWolf }),
      createMockPlayer({ name: 'Wolf2', role: Role.Werewolf }),
      createMockPlayer({ name: 'Seer', role: Role.Seer }),
      createMockPlayer({ name: 'Guard', role: Role.Guard }), // must have Guard player!
      createMockPlayer({ name: 'Hunter', role: Role.Hunter }),
      createMockPlayer({ name: 'V1', role: Role.Villager }),
    ];
    const hunter = players.find((p) => p.name === 'Hunter')!;
    const { gm } = createTestGM(
      players,
      {
        guardProtect: vi.fn().mockResolvedValue('Hunter'), // guard protects Hunter
        alphaInfect: vi.fn().mockResolvedValue({ target: 'Hunter', infect: true }),
        witchAction: vi.fn().mockResolvedValue({ heal: false, killTarget: null }),
        seerInvestigate: vi.fn().mockResolvedValue('V1'),
      },
      { round: 2 },
    );
    const events = collectEvents(gm);
    await (gm as any).nightPhase();
    expect(hunter.infected).toBeFalsy(); // Guard blocked infect
    expect(gm.state.alphaInfectUsed).toBe(true); // used up even if blocked
    expect(gm.state.pendingDeaths).toHaveLength(0);
    // NightActionPerformed event with infect_blocked emitted
    expect(
      events.some(
        (e) => e.type === GameEventType.NightActionPerformed && e.data.action === 'infect_blocked',
      ),
    ).toBe(true);
  });

  it('witch self-cures when infected (uses heal potion)', async () => {
    const players = [
      createMockPlayer({ name: 'Alpha', role: Role.AlphaWolf }),
      createMockPlayer({ name: 'Wolf2', role: Role.Werewolf }),
      createMockPlayer({ name: 'Witch', role: Role.Witch }),
      createMockPlayer({ name: 'V1', role: Role.Villager }),
      createMockPlayer({ name: 'V2', role: Role.Villager }),
      createMockPlayer({ name: 'V3', role: Role.Villager }),
    ];
    const witch = players.find((p) => p.name === 'Witch')!;
    const { gm } = createTestGM(
      players,
      {
        guardProtect: vi.fn().mockResolvedValue('Alpha'),
        alphaInfect: vi.fn().mockResolvedValue({ target: 'Witch', infect: true }),
        witchAction: vi.fn().mockResolvedValue({ heal: false, killTarget: null }),
        witchCureInfect: vi.fn().mockResolvedValue(true), // cure!
        seerInvestigate: vi.fn().mockResolvedValue('V1'),
      },
      { round: 2 },
    );
    await (gm as any).nightPhase();
    expect(witch.infected).toBe(false); // cured!
    expect(gm.state.witchPotions.healUsed).toBe(true); // potion consumed
  });

  it('witch infected and declines to cure → stays infected', async () => {
    const players = [
      createMockPlayer({ name: 'Alpha', role: Role.AlphaWolf }),
      createMockPlayer({ name: 'Wolf2', role: Role.Werewolf }),
      createMockPlayer({ name: 'Witch', role: Role.Witch }),
      createMockPlayer({ name: 'V1', role: Role.Villager }),
      createMockPlayer({ name: 'V2', role: Role.Villager }),
      createMockPlayer({ name: 'V3', role: Role.Villager }),
    ];
    const witch = players.find((p) => p.name === 'Witch')!;
    const { gm } = createTestGM(
      players,
      {
        guardProtect: vi.fn().mockResolvedValue('Alpha'),
        alphaInfect: vi.fn().mockResolvedValue({ target: 'Witch', infect: true }),
        witchAction: vi.fn().mockResolvedValue({ heal: false, killTarget: null }),
        witchCureInfect: vi.fn().mockResolvedValue(false), // declines
        seerInvestigate: vi.fn().mockResolvedValue('V1'),
      },
      { round: 2 },
    );
    await (gm as any).nightPhase();
    expect(witch.infected).toBe(true); // not cured
    expect(gm.state.witchPotions.healUsed).toBe(false); // potion not consumed
  });

  it('emits AlphaInfect and InfectResolved events with originalRole', async () => {
    const players = infectSetup();
    const { gm } = createTestGM(
      players,
      {
        guardProtect: vi.fn().mockResolvedValue('Alpha'),
        alphaInfect: vi.fn().mockResolvedValue({ target: 'Hunter', infect: true }),
        witchAction: vi.fn().mockResolvedValue({ heal: false, killTarget: null }),
        seerInvestigate: vi.fn().mockResolvedValue('V1'),
      },
      { round: 2 },
    );
    const events = collectEvents(gm);
    await (gm as any).nightPhase();

    expect(
      events.some((e) => e.type === GameEventType.AlphaInfect && e.data.targetName === 'Hunter'),
    ).toBe(true);
    const resolved = events.find((e) => e.type === GameEventType.InfectResolved);
    expect(resolved).toBeDefined();
    expect(resolved.data.targetName).toBe('Hunter');
    expect(resolved.data.originalRole).toBe(Role.Hunter); // new field
    expect(resolved.data.wolfTeammates.length).toBeGreaterThan(0);
    expect(Array.isArray(resolved.data.wolfDiscussion)).toBe(true);
  });
});

describe('Regression: Seer + infect same night', () => {
  it('seer sees infected target AS WOLF after infection resolves (isWolfTeam)', async () => {
    const players = [
      createMockPlayer({ name: 'Alpha', role: Role.AlphaWolf }),
      createMockPlayer({ name: 'Wolf2', role: Role.Werewolf }),
      createMockPlayer({ name: 'Seer', role: Role.Seer }),
      createMockPlayer({ name: 'Target', role: Role.Hunter }),
      createMockPlayer({ name: 'V1', role: Role.Villager }),
      createMockPlayer({ name: 'V2', role: Role.Villager }),
    ];
    const { gm } = createTestGM(
      players,
      {
        guardProtect: vi.fn().mockResolvedValue('Alpha'),
        alphaInfect: vi.fn().mockResolvedValue({ target: 'Target', infect: true }),
        witchAction: vi.fn().mockResolvedValue({ heal: false, killTarget: null }),
        seerInvestigate: vi.fn().mockResolvedValue('Target'), // seer investigates the infected target
      },
      { round: 2 },
    );
    const events = collectEvents(gm);
    await (gm as any).nightPhase();

    const seerResult = events.find((e) => e.type === GameEventType.SeerResult);
    expect(seerResult.data.targetName).toBe('Target');
    // Infect resolves BEFORE Seer result is emitted → infected target shows as wolf
    expect(seerResult.data.isWolf).toBe(true);
    // Role preserved but infected flag set
    const target = players.find((p) => p.name === 'Target')!;
    expect(target.role).toBe(Role.Hunter);
    expect(target.infected).toBe(true);
  });

  it('seer sees normal wolf as wolf', async () => {
    const players = [
      createMockPlayer({ name: 'Wolf1', role: Role.Werewolf }),
      createMockPlayer({ name: 'Wolf2', role: Role.Werewolf }),
      createMockPlayer({ name: 'Seer', role: Role.Seer }),
      createMockPlayer({ name: 'V1', role: Role.Villager }),
      createMockPlayer({ name: 'V2', role: Role.Villager }),
      createMockPlayer({ name: 'V3', role: Role.Villager }),
    ];
    const { gm } = createTestGM(players, {
      guardProtect: vi.fn().mockResolvedValue('Seer'),
      wolfKill: vi.fn().mockResolvedValue('V1'),
      witchAction: vi.fn().mockResolvedValue({ heal: false, killTarget: null }),
      seerInvestigate: vi.fn().mockResolvedValue('Wolf1'),
    });
    const events = collectEvents(gm);
    await (gm as any).nightPhase();
    expect(events.find((e) => e.type === GameEventType.SeerResult)!.data.isWolf).toBe(true);
  });

  it('seer sees previously infected player (infected=true) as wolf', async () => {
    const players = [
      createMockPlayer({ name: 'Alpha', role: Role.AlphaWolf }),
      createMockPlayer({ name: 'Seer', role: Role.Seer }),
      createMockPlayer({ name: 'Target', role: Role.Hunter, infected: true }), // already infected
      createMockPlayer({ name: 'V1', role: Role.Villager }),
      createMockPlayer({ name: 'V2', role: Role.Villager }),
      createMockPlayer({ name: 'V3', role: Role.Villager }),
    ];
    const { gm } = createTestGM(
      players,
      {
        guardProtect: vi.fn().mockResolvedValue('Seer'),
        wolfKill: vi.fn().mockResolvedValue('V1'),
        witchAction: vi.fn().mockResolvedValue({ heal: false, killTarget: null }),
        seerInvestigate: vi.fn().mockResolvedValue('Target'),
      },
      { alphaInfectUsed: true },
    );
    const events = collectEvents(gm);
    await (gm as any).nightPhase();
    expect(events.find((e) => e.type === GameEventType.SeerResult)!.data.isWolf).toBe(true);
  });
});

describe('Wolf Cub', () => {
  it('WolfCub death sets revenge flags', async () => {
    const players = [
      createMockPlayer({ name: 'Wolf1', role: Role.Werewolf }),
      createMockPlayer({ name: 'Cub', role: Role.WolfCub }),
      createMockPlayer({ name: 'V1', role: Role.Villager }),
      createMockPlayer({ name: 'V2', role: Role.Villager }),
      createMockPlayer({ name: 'V3', role: Role.Villager }),
      createMockPlayer({ name: 'V4', role: Role.Villager }),
    ];
    const cub = players.find((p) => p.name === 'Cub')!;
    const { gm } = createTestGM(players);
    await (gm as any).killPlayer(cub, 'judged');
    expect(gm.state.wolfCubDead).toBe(true);
    expect(gm.state.wolfCubRevengeActive).toBe(true);
  });

  it('revenge night calls wolfDoubleKill', async () => {
    const players = [
      createMockPlayer({ name: 'Wolf1', role: Role.Werewolf }),
      createMockPlayer({ name: 'Seer', role: Role.Seer }),
      createMockPlayer({ name: 'V1', role: Role.Villager }),
      createMockPlayer({ name: 'V2', role: Role.Villager }),
      createMockPlayer({ name: 'V3', role: Role.Villager }),
      createMockPlayer({ name: 'V4', role: Role.Villager }),
    ];
    const doubleKill = vi.fn().mockResolvedValue(['V1', 'V2']);
    const { gm } = createTestGM(
      players,
      {
        guardProtect: vi.fn().mockResolvedValue('Seer'),
        wolfDoubleKill: doubleKill,
        witchAction: vi.fn().mockResolvedValue({ heal: false, killTarget: null }),
        seerInvestigate: vi.fn().mockResolvedValue('Wolf1'),
      },
      { wolfCubRevengeActive: true, wolfCubDead: true },
    );

    await (gm as any).nightPhase();
    expect(doubleKill).toHaveBeenCalled();
    expect(gm.state.pendingDeaths).toHaveLength(2);
    expect(gm.state.wolfCubRevengeActive).toBe(false);
  });
});

describe('Hunter', () => {
  it('hunter killed by wolf → hunterShot triggered', async () => {
    const players = [
      createMockPlayer({ name: 'Wolf1', role: Role.Werewolf }),
      createMockPlayer({ name: 'Hunter', role: Role.Hunter }),
      createMockPlayer({ name: 'V1', role: Role.Villager }),
      createMockPlayer({ name: 'V2', role: Role.Villager }),
      createMockPlayer({ name: 'V3', role: Role.Villager }),
      createMockPlayer({ name: 'V4', role: Role.Villager }),
    ];
    const hunterShot = vi.fn().mockResolvedValue('V1');
    const { gm } = createTestGM(players, { hunterShot });
    const hunter = players.find((p) => p.name === 'Hunter')!;

    await (gm as any).killPlayer(hunter, 'wolf_kill');
    expect(hunterShot).toHaveBeenCalled();
    expect(players.find((p) => p.name === 'V1')!.alive).toBe(false);
  });

  it('hunter killed by witch poison → NO hunterShot', async () => {
    const players = [
      createMockPlayer({ name: 'Wolf1', role: Role.Werewolf }),
      createMockPlayer({ name: 'Hunter', role: Role.Hunter }),
      createMockPlayer({ name: 'V1', role: Role.Villager }),
      createMockPlayer({ name: 'V2', role: Role.Villager }),
      createMockPlayer({ name: 'V3', role: Role.Villager }),
      createMockPlayer({ name: 'V4', role: Role.Villager }),
    ];
    const hunterShot = vi.fn().mockResolvedValue('V1');
    const { gm } = createTestGM(players, { hunterShot });
    const hunter = players.find((p) => p.name === 'Hunter')!;

    await (gm as any).killPlayer(hunter, 'witch_kill');
    expect(hunterShot).not.toHaveBeenCalled();
  });
});

describe('Cupid couple', () => {
  it('one dies → lover dies too', async () => {
    const players = [
      createMockPlayer({ name: 'Wolf1', role: Role.Werewolf }),
      createMockPlayer({ name: 'V1', role: Role.Villager }),
      createMockPlayer({ name: 'V2', role: Role.Villager }),
      createMockPlayer({ name: 'V3', role: Role.Villager }),
      createMockPlayer({ name: 'V4', role: Role.Villager }),
      createMockPlayer({ name: 'V5', role: Role.Villager }),
    ];
    const v1 = players.find((p) => p.name === 'V1')!;
    const v2 = players.find((p) => p.name === 'V2')!;
    const { gm } = createTestGM(
      players,
      {},
      {
        couple: { player1Id: v1.id, player2Id: v2.id },
      },
    );
    const events = collectEvents(gm);
    await (gm as any).killPlayer(v1, 'wolf_kill');
    expect(v2.alive).toBe(false);
    expect(events.some((e) => e.type === GameEventType.LoverDeath)).toBe(true);
  });

  it('cross-team couple last 2 alive → Lovers win', () => {
    const players = [
      createMockPlayer({ name: 'Wolf1', role: Role.Werewolf }),
      createMockPlayer({ name: 'V1', role: Role.Villager }),
    ];
    const { gm } = createTestGM(
      players,
      {},
      {
        couple: { player1Id: players[0].id, player2Id: players[1].id },
      },
    );
    expect((gm as any).checkWin()).toBe(Team.Lovers);
  });
});

describe('Apprentice Seer', () => {
  it('seer dies → apprentice activated', async () => {
    const players = [
      createMockPlayer({ name: 'Wolf1', role: Role.Werewolf }),
      createMockPlayer({ name: 'Seer', role: Role.Seer }),
      createMockPlayer({ name: 'Apprentice', role: Role.ApprenticeSeer }),
      createMockPlayer({ name: 'V1', role: Role.Villager }),
      createMockPlayer({ name: 'V2', role: Role.Villager }),
      createMockPlayer({ name: 'V3', role: Role.Villager }),
    ];
    const seer = players.find((p) => p.name === 'Seer')!;
    const { gm } = createTestGM(players);
    const events = collectEvents(gm);
    await (gm as any).killPlayer(seer, 'wolf_kill');
    expect(gm.state.originalSeerDead).toBe(true);
    expect(gm.state.apprenticeSeerActivated).toBe(true);
    expect(events.some((e) => e.type === GameEventType.ApprenticeSeerActivated)).toBe(true);
  });

  it('apprentice used as seer after activation', async () => {
    const players = [
      createMockPlayer({ name: 'Wolf1', role: Role.Werewolf }),
      createMockPlayer({ name: 'Wolf2', role: Role.Werewolf }),
      createMockPlayer({ name: 'Seer', role: Role.Seer, alive: false }),
      createMockPlayer({ name: 'Apprentice', role: Role.ApprenticeSeer }),
      createMockPlayer({ name: 'V1', role: Role.Villager }),
      createMockPlayer({ name: 'V2', role: Role.Villager }),
    ];
    const seerInvestigate = vi.fn().mockResolvedValue('Wolf1');
    const { gm } = createTestGM(
      players,
      {
        guardProtect: vi.fn().mockResolvedValue('Apprentice'),
        wolfKill: vi.fn().mockResolvedValue('V1'),
        witchAction: vi.fn().mockResolvedValue({ heal: false, killTarget: null }),
        seerInvestigate,
      },
      { originalSeerDead: true, apprenticeSeerActivated: true },
    );

    const events = collectEvents(gm);
    await (gm as any).nightPhase();
    // seerInvestigate should be called with the Apprentice player
    expect(seerInvestigate).toHaveBeenCalled();
    const calledWith = seerInvestigate.mock.calls[0][0];
    expect(calledWith.name).toBe('Apprentice');
  });
});

describe('Fool', () => {
  it('fool executed → FoolVictory + GameOver', async () => {
    const players = [
      createMockPlayer({ name: 'Wolf1', role: Role.Werewolf }),
      createMockPlayer({ name: 'Fool', role: Role.Fool }),
      createMockPlayer({ name: 'V1', role: Role.Villager }),
      createMockPlayer({ name: 'V2', role: Role.Villager }),
    ];
    const fool = players.find((p) => p.name === 'Fool')!;
    const { gm } = createTestGM(
      players,
      {
        defend: vi.fn().mockResolvedValue('I am innocent'),
        judgeVote: vi.fn().mockResolvedValue('kill'),
      },
      { accusedId: fool.id, phase: Phase.Judgement },
    );

    const events = collectEvents(gm);
    await (gm as any).judgementPhase();
    expect(gm.state.winner).toBe('Fool');
    expect(events.some((e) => e.type === GameEventType.FoolVictory)).toBe(true);
    expect(events.some((e) => e.type === GameEventType.GameOver)).toBe(true);
  });
});

describe('Guard', () => {
  it('guard protect blocks wolf kill but NOT witch kill', async () => {
    const players = [
      createMockPlayer({ name: 'Wolf1', role: Role.Werewolf }),
      createMockPlayer({ name: 'Wolf2', role: Role.Werewolf }),
      createMockPlayer({ name: 'Seer', role: Role.Seer }),
      createMockPlayer({ name: 'Witch', role: Role.Witch }),
      createMockPlayer({ name: 'Guard', role: Role.Guard }),
      createMockPlayer({ name: 'V1', role: Role.Villager }),
    ];
    const { gm } = createTestGM(players, {
      guardProtect: vi.fn().mockResolvedValue('V1'), // guard protects V1
      wolfKill: vi.fn().mockResolvedValue('V1'), // wolves target V1 (blocked)
      witchAction: vi.fn().mockResolvedValue({ heal: false, killTarget: 'V1' }), // witch also targets V1
      seerInvestigate: vi.fn().mockResolvedValue('Wolf1'),
    });
    await (gm as any).nightPhase();
    // Wolf kill blocked by guard, but witch kill goes through
    const v1Death = gm.state.pendingDeaths.find((d: any) => d.playerName === 'V1');
    expect(v1Death).toBeDefined();
    expect(v1Death!.cause).toBe('witch_kill');
    // Only 1 death (witch kill), not 2
    expect(gm.state.pendingDeaths).toHaveLength(1);
  });
});
