import { describe, it, expect } from 'vitest';
import { Role, Phase } from '@ma-soi/shared';
import { getPromptBuilder } from '../agents/prompt-builders/index.js';
import {
  playerContext,
  roleNameVi,
  gameRules,
  roleDescriptions,
  speechRules,
} from '../agents/prompt-builders/base.js';
import { WolfPromptBuilder, AlphaWolfPromptBuilder } from '../agents/prompt-builders/wolf.js';
import { SeerPromptBuilder, ApprenticeSeerPromptBuilder } from '../agents/prompt-builders/seer.js';
import { WitchPromptBuilder } from '../agents/prompt-builders/witch.js';
import { HunterPromptBuilder } from '../agents/prompt-builders/hunter.js';
import { FoolPromptBuilder } from '../agents/prompt-builders/fool.js';
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
      const player = allPlayers.find((p) => p.role === role)!;
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

describe('gameRules — role descriptions', () => {
  const rules = gameRules();

  it('includes all roles from roleDescriptions registry', () => {
    for (const desc of Object.values(roleDescriptions)) {
      expect(rules).toContain(desc);
    }
  });

  it('covers every Role enum value', () => {
    for (const role of Object.values(Role)) {
      expect(roleDescriptions).toHaveProperty(role);
    }
  });
});

describe('Task 1: anti-fabrication rule in speechRules', () => {
  it('contains anti-fabrication text', () => {
    const rules = speechRules();
    expect(rules).toContain('KHÔNG được bịa thông tin');
    expect(rules).toContain('kết quả soi');
  });
});

describe('Task 2: Seer prompt constraints', () => {
  const seer = new SeerPromptBuilder();
  const player = createMockPlayer({ role: Role.Seer });
  const state = createMockState([player]);

  it('voteHint forbids voting seer-cleared players', () => {
    const hint = seer.voteHint(player, state);
    expect(hint).toContain('KHÔNG vote người mày đã soi ra KHÔNG PHẢI SÓI');
    expect(hint).toContain('<event_log>');
  });

  it('judgementHint references seer results', () => {
    const hint = seer.judgementHint(player, state);
    expect(hint).toContain('KHÔNG PHẢI SÓI');
    expect(hint).toContain('THA');
    expect(hint).toContain('GIẾT');
  });

  it('discussionHint references <event_log>', () => {
    const stateR2 = createMockState([player], { round: 2 });
    const hint = seer.discussionHint(player, stateR2);
    expect(hint).toContain('<event_log>');
  });
});

describe('Task 4: Apprentice Seer claim rules', () => {
  const builder = new ApprenticeSeerPromptBuilder();
  const player = createMockPlayer({ role: Role.ApprenticeSeer });

  it('non-activated roleIdentity forbids claiming Tiên Tri chính', () => {
    const state = createMockState([player], { apprenticeSeerActivated: false });
    const identity = builder.roleIdentity(player, state);
    expect(identity).toContain('KHÔNG BAO GIỜ tự nhận là Tiên Tri chính');
    expect(identity).toContain('Tiên Tri Tập Sự');
  });

  it('non-activated defenseHint says Tập Sự and forbids fabrication', () => {
    const state = createMockState([player], { apprenticeSeerActivated: false });
    const hint = builder.defenseHint(player, state);
    expect(hint).toContain('TẬP SỰ');
    expect(hint).toContain('KHÔNG nhận là Tiên Tri chính');
    expect(hint).toContain('KHÔNG bịa kết quả soi');
  });

  it('activated defenseHint says Tập Sự kế thừa', () => {
    const state = createMockState([player], { apprenticeSeerActivated: true });
    const hint = builder.defenseHint(player, state);
    expect(hint).toContain('TẬP SỰ');
    expect(hint).toContain('kế thừa');
  });
});

describe('Task 5: Witch poison — Kẻ Ngốc warning', () => {
  const builder = new WitchPromptBuilder();
  const witch = createMockPlayer({ name: 'Witch', role: Role.Witch });
  const target = createMockPlayer({ name: 'Target' });

  it('witchAction includes Kẻ Ngốc warning when poison available', () => {
    const state = createMockState([witch, target]);
    const prompt = builder.witchAction(witch, state, [], null, { healUsed: true, killUsed: false });
    expect(prompt).toContain('Kẻ Ngốc');
    expect(prompt).toContain('KHÔNG độc người đã lộ role phe dân');
  });

  it('witchAction does NOT include warning when poison already used', () => {
    const state = createMockState([witch, target]);
    const prompt = builder.witchAction(witch, state, [], null, { healUsed: true, killUsed: true });
    expect(prompt).not.toContain('Kẻ Ngốc');
  });
});

describe('Task 6: Hunter shot — anti-friendly-fire', () => {
  const builder = new HunterPromptBuilder();
  const hunter = createMockPlayer({ name: 'Hunter', role: Role.Hunter });
  const target = createMockPlayer({ name: 'Target' });

  it('hunterShot prompt includes anti-friendly-fire rule', () => {
    const state = createMockState([hunter, target]);
    const prompt = builder.hunterShot(hunter, state, []);
    expect(prompt).toContain('KHÔNG bắn người đã được xác nhận là phe dân');
    expect(prompt).toContain('<event_log>');
  });
});

describe('Task 7: Fool subtlety', () => {
  const builder = new FoolPromptBuilder();
  const player = createMockPlayer({ role: Role.Fool });
  const state = createMockState([player]);

  it('discussionHint emphasizes subtlety', () => {
    const hint = builder.discussionHint(player, state);
    expect(hint).toContain('VỪA ĐỦ');
    expect(hint).not.toContain('nhận vơ là Tiên Tri soi bậy');
  });

  it('roleIdentity emphasizes gradual suspicion', () => {
    const identity = builder.roleIdentity(player, state);
    expect(identity).toContain('DẦN DẦN');
    expect(identity).not.toContain('Sáng ra tự nhận là Tiên Tri');
  });
});
