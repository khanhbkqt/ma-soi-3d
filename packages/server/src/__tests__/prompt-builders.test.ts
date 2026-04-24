import { describe, it, expect } from 'vitest';
import { Role, Phase } from '@ma-soi/shared';
import { getPromptBuilder } from '../agents/prompt-builders/index.js';
import { playerContext, roleNameVi } from '../agents/prompt-builders/base.js';
import { WolfPromptBuilder, AlphaWolfPromptBuilder } from '../agents/prompt-builders/wolf.js';
import { SeerPromptBuilder } from '../agents/prompt-builders/seer.js';
import { VillagerPromptBuilder } from '../agents/prompt-builders/villager.js';
import { createMockPlayer, createMockState } from './helpers.js';

describe('getPromptBuilder — builder selection', () => {
  it('Werewolf → WolfPromptBuilder', () => {
    expect(getPromptBuilder(Role.Werewolf)).toBeInstanceOf(WolfPromptBuilder);
  });

  it('AlphaWolf → AlphaWolfPromptBuilder', () => {
    expect(getPromptBuilder(Role.AlphaWolf)).toBeInstanceOf(AlphaWolfPromptBuilder);
  });

  it('Seer → SeerPromptBuilder', () => {
    expect(getPromptBuilder(Role.Seer)).toBeInstanceOf(SeerPromptBuilder);
  });

  it('Villager → VillagerPromptBuilder', () => {
    expect(getPromptBuilder(Role.Villager)).toBeInstanceOf(VillagerPromptBuilder);
  });
});

describe('systemPrompt content', () => {
  const wolves = [
    createMockPlayer({ name: 'Wolf1', role: Role.Werewolf }),
    createMockPlayer({ name: 'Alpha', role: Role.AlphaWolf }),
  ];
  const others = [
    createMockPlayer({ name: 'Seer', role: Role.Seer }),
    createMockPlayer({ name: 'V1', role: Role.Villager }),
  ];
  const allPlayers = [...wolves, ...others];
  const state = createMockState(allPlayers, { phase: Phase.Day, round: 2 });

  it('wolf builder includes SÓI and teammate info', () => {
    const prompt = getPromptBuilder(Role.Werewolf).systemPrompt(wolves[0], state);
    expect(prompt).toContain('SÓI');
    expect(prompt).toContain('Alpha'); // teammate
  });

  it('alpha builder includes infect status', () => {
    const prompt = getPromptBuilder(Role.AlphaWolf).systemPrompt(wolves[1], state);
    expect(prompt).toContain('LÂY NHIỄM');
    expect(prompt).toContain('CÒN'); // not used yet
  });

  it('seer builder includes investigation instructions', () => {
    const prompt = getPromptBuilder(Role.Seer).systemPrompt(others[0], state);
    expect(prompt).toContain('TIÊN TRI');
  });

  it('all builders include game rules', () => {
    for (const role of [Role.Werewolf, Role.Seer, Role.Villager]) {
      const player = allPlayers.find(p => p.role === role)!;
      const prompt = getPromptBuilder(role).systemPrompt(player, state);
      expect(prompt).toContain('MA SÓI');
    }
  });
});

describe('playerContext', () => {
  it('shows correct Vietnamese role name and team', () => {
    const wolf = createMockPlayer({ name: 'Wolf1', role: Role.Werewolf });
    const state = createMockState([wolf]);
    const ctx = playerContext(wolf, state);
    expect(ctx).toContain('Sói');
    expect(ctx).toContain('phe Sói');
    expect(ctx).toContain('Wolf1');
  });

  it('shows village team for villager', () => {
    const v = createMockPlayer({ name: 'V1', role: Role.Villager });
    const state = createMockState([v]);
    const ctx = playerContext(v, state);
    expect(ctx).toContain('phe Dân');
  });

  it('shows alive and dead lists', () => {
    const alive = createMockPlayer({ name: 'Alive1' });
    const dead = createMockPlayer({ name: 'Dead1', alive: false });
    const state = createMockState([alive, dead]);
    const ctx = playerContext(alive, state);
    expect(ctx).toContain('Alive1');
    expect(ctx).toContain('Dead1');
  });

  it('shows couple info for paired player', () => {
    const p1 = createMockPlayer({ name: 'Lover1' });
    const p2 = createMockPlayer({ name: 'Lover2' });
    const state = createMockState([p1, p2], {
      couple: { player1Id: p1.id, player2Id: p2.id },
    });
    const ctx = playerContext(p1, state);
    expect(ctx).toContain('Lover2');
    expect(ctx).toContain('GHÉP ĐÔI');
  });
});

describe('roleNameVi', () => {
  it('maps all roles to Vietnamese', () => {
    expect(roleNameVi(Role.Werewolf)).toBe('Sói');
    expect(roleNameVi(Role.AlphaWolf)).toBe('Sói Đầu Đàn');
    expect(roleNameVi(Role.Seer)).toBe('Tiên Tri');
    expect(roleNameVi(Role.Witch)).toBe('Phù Thủy');
    expect(roleNameVi(Role.Hunter)).toBe('Thợ Săn');
    expect(roleNameVi(Role.Guard)).toBe('Bảo Vệ');
    expect(roleNameVi(Role.Fool)).toBe('Kẻ Ngốc');
  });
});
