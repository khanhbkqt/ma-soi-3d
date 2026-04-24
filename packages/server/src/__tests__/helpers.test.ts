import { describe, it, expect } from 'vitest';
import { Role, Phase } from '@ma-soi/shared';
import { createMockPlayer, createMockState, createTestGM } from './helpers.js';

describe('test helpers', () => {
  it('createMockPlayer returns valid player', () => {
    const p = createMockPlayer({ name: 'Minh', role: Role.Werewolf });
    expect(p.name).toBe('Minh');
    expect(p.role).toBe(Role.Werewolf);
    expect(p.alive).toBe(true);
  });

  it('createMockState returns valid state', () => {
    const players = [createMockPlayer(), createMockPlayer()];
    const state = createMockState(players);
    expect(state.players).toHaveLength(2);
    expect(state.phase).toBe(Phase.Night);
  });

  it('createTestGM returns working GameMaster', () => {
    const players = [createMockPlayer({ role: Role.Werewolf }), createMockPlayer()];
    const { gm } = createTestGM(players);
    expect(gm.state.players).toHaveLength(2);
  });
});
