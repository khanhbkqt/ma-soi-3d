import { describe, it, expect } from 'vitest';
import { parseActionResponse } from '../agents/prompts.js';

const names = ['Minh', 'Lan', 'Hùng'];

describe('parseActionResponse', () => {
  it('exact name match', () => {
    const r = parseActionResponse('{"target":"Minh"}', names);
    expect(r.target).toBe('Minh');
  });

  it('case-insensitive match', () => {
    const r = parseActionResponse('{"target":"minh"}', names);
    expect(r.target).toBe('Minh');
  });

  it('invalid name falls back to random valid name', () => {
    const r = parseActionResponse('{"target":"Unknown"}', names);
    expect(names).toContain(r.target);
  });

  it('target skip preserved', () => {
    const r = parseActionResponse('{"target":"skip"}', names);
    expect(r.target).toBe('skip');
  });

  it('multi-target fields', () => {
    const r = parseActionResponse('{"target1":"minh","target2":"lan","player1":"hùng","player2":"minh"}', names);
    expect(r.target1).toBe('Minh');
    expect(r.target2).toBe('Lan');
    expect(r.player1).toBe('Hùng');
    expect(r.player2).toBe('Minh');
  });

  it('heal, killTarget, infect fields', () => {
    const r = parseActionResponse('{"heal":true,"killTarget":"Lan","infect":true}', names);
    expect(r.heal).toBe(true);
    expect(r.killTarget).toBe('Lan');
    expect(r.infect).toBe(true);
  });

  it('killTarget with no match returns null', () => {
    const r = parseActionResponse('{"killTarget":"Nobody"}', names);
    expect(r.killTarget).toBeNull();
  });

  it('malformed JSON falls back to name-in-text', () => {
    const r = parseActionResponse('I think Lan is suspicious', names);
    expect(r.target).toBe('Lan');
    expect(r.message).toBe('I think Lan is suspicious');
  });

  it('empty response falls back to random valid name', () => {
    const r = parseActionResponse('', names);
    expect(names).toContain(r.target);
  });

  it('empty response with no valid names returns null', () => {
    const r = parseActionResponse('', []);
    expect(r.target).toBeNull();
  });

  it('reasoning field extracted', () => {
    const r = parseActionResponse('{"target":"Minh","reasoning":"looks sus"}', names);
    expect(r.reasoning).toBe('looks sus');
  });
});
