import { describe, it, expect } from 'vitest';
import { getRoleDistribution, isWolfRole, isWolfTeam, Role } from '@ma-soi/shared';

const wolfRoles = [Role.Werewolf, Role.AlphaWolf, Role.WolfCub];

describe('getRoleDistribution', () => {
  it('6 players: 2 wolves', () => {
    const roles = getRoleDistribution(6);
    expect(roles).toHaveLength(6);
    expect(roles.filter((r) => wolfRoles.includes(r))).toHaveLength(2);
    expect(roles).toContain(Role.Seer);
  });

  it('10 players: 3 wolves', () => {
    const roles = getRoleDistribution(10);
    expect(roles).toHaveLength(10);
    expect(roles.filter((r) => wolfRoles.includes(r))).toHaveLength(3);
    expect(roles).toContain(Role.Seer);
  });

  it('14 players: 4 wolves', () => {
    const roles = getRoleDistribution(14);
    expect(roles).toHaveLength(14);
    expect(roles.filter((r) => wolfRoles.includes(r))).toHaveLength(4);
    expect(roles).toContain(Role.Seer);
  });

  it('throws for <6 players', () => {
    expect(() => getRoleDistribution(5)).toThrow();
  });

  it('throws for >16 players', () => {
    expect(() => getRoleDistribution(17)).toThrow();
  });
});

describe('isWolfRole', () => {
  it('returns true for wolf roles', () => {
    expect(isWolfRole(Role.Werewolf)).toBe(true);
    expect(isWolfRole(Role.AlphaWolf)).toBe(true);
    expect(isWolfRole(Role.WolfCub)).toBe(true);
  });

  it('returns false for village roles', () => {
    const villageRoles = [
      Role.Villager,
      Role.Seer,
      Role.ApprenticeSeer,
      Role.Witch,
      Role.Hunter,
      Role.Guard,
      Role.Cupid,
      Role.Fool,
    ];
    for (const r of villageRoles) {
      expect(isWolfRole(r)).toBe(false);
    }
  });
});

describe('isWolfTeam', () => {
  const makePlayer = (role: Role, infected = false) => ({
    id: 'x',
    name: 'X',
    role,
    alive: true,
    infected,
    personality: {} as any,
    providerId: '',
    modelName: '',
  });

  it('native wolf roles are on wolf team', () => {
    expect(isWolfTeam(makePlayer(Role.Werewolf))).toBe(true);
    expect(isWolfTeam(makePlayer(Role.AlphaWolf))).toBe(true);
    expect(isWolfTeam(makePlayer(Role.WolfCub))).toBe(true);
  });

  it('infected villager is on wolf team even with village role', () => {
    expect(isWolfTeam(makePlayer(Role.Seer, true))).toBe(true);
    expect(isWolfTeam(makePlayer(Role.Hunter, true))).toBe(true);
    expect(isWolfTeam(makePlayer(Role.Villager, true))).toBe(true);
    expect(isWolfTeam(makePlayer(Role.Guard, true))).toBe(true);
    expect(isWolfTeam(makePlayer(Role.Witch, true))).toBe(true);
  });

  it('non-infected villagers are NOT on wolf team', () => {
    expect(isWolfTeam(makePlayer(Role.Seer))).toBe(false);
    expect(isWolfTeam(makePlayer(Role.Villager))).toBe(false);
    expect(isWolfTeam(makePlayer(Role.Witch))).toBe(false);
  });
});
