import { describe, it, expect } from 'vitest';
import { compressMemory, compressedMemoryPrompt } from '../agents/memory-compression.js';

/** Generate N filler observations (phase markers + chat) */
function filler(n: number): string[] {
  const obs: string[] = [];
  for (let i = 0; i < n; i++) {
    obs.push(`--- Vòng ${Math.floor(i / 2) + 1}, Ban ngày ---`);
    obs.push(`Player${i} nói: "blah blah vòng ${i}"`);
  }
  return obs.slice(0, n);
}

/** Build >20 observations with important ones in the OLD portion and filler as recent */
function buildObs(importantOld: string[], recentCount = 20): string[] {
  const needed = recentCount - importantOld.length;
  const padding = filler(needed > 0 ? needed : 0);
  return [...importantOld, ...padding, ...filler(recentCount)];
}

describe('compressMemory', () => {
  it('returns all as recent with empty summary when <=20', () => {
    const obs = filler(15);
    const { summary, recent } = compressMemory(obs);
    expect(summary).toBe('');
    expect(recent).toEqual(obs);
  });

  it('splits at length-20: last 20 as recent, old compressed', () => {
    const obs = filler(25);
    const { recent } = compressMemory(obs);
    expect(recent).toHaveLength(20);
    expect(recent).toEqual(obs.slice(5));
  });

  it('preserves deaths in summary', () => {
    const obs = buildObs(['Minh đã chết (bị sói cắn). Vai: Dân.']);
    const { summary } = compressMemory(obs);
    expect(summary).toContain('Chết:');
    expect(summary).toContain('Minh đã chết');
  });

  it('preserves seer results in summary', () => {
    const obs = buildObs(['Mày soi Hùng: LÀ SÓI!', 'Mày soi Tú: Không phải sói.']);
    const { summary } = compressMemory(obs);
    expect(summary).toContain('Soi:');
    expect(summary).toContain('LÀ SÓI');
    expect(summary).toContain('Không phải sói');
  });

  it('preserves executions in summary', () => {
    const obs = buildObs(['Lan bị treo cổ sau phán xét.']);
    const { summary } = compressMemory(obs);
    expect(summary).toContain('Phán xét:');
    expect(summary).toContain('bị treo cổ');
  });

  it('preserves key events in summary', () => {
    const obs = buildObs(['Alpha LÂY NHIỄM Hùng!', 'Thợ Săn bắn Tú.']);
    const { summary } = compressMemory(obs);
    expect(summary).toContain('Sự kiện:');
    expect(summary).toContain('LÂY NHIỄM');
    expect(summary).toContain('Thợ Săn bắn');
  });

  it('drops chat messages from old observations', () => {
    const chat = 'Hùng nói: "Tao thấy thằng Tú im quá..."';
    const obs = buildObs([chat]);
    const { summary } = compressMemory(obs);
    expect(summary).not.toContain('Tao thấy thằng Tú');
  });

  it('condenses votes in old observations', () => {
    const obs = buildObs(['Hùng vote Lan.', 'Minh vote Lan.', 'Tú vote Hùng.']);
    const { summary } = compressMemory(obs);
    expect(summary).toContain('Vote cũ:');
    expect(summary).toContain('Hùng,Minh → Lan');
    expect(summary).toContain('Tú → Hùng');
  });

  it('excludes phase markers from summary', () => {
    const obs = buildObs(['--- Vòng 1, Ban ngày ---']);
    const { summary } = compressMemory(obs);
    // Phase marker is filler, not important — summary should be empty or not contain it
    expect(summary).not.toContain('--- Vòng');
  });
});

describe('compressedMemoryPrompt', () => {
  it('returns empty string for empty observations', () => {
    expect(compressedMemoryPrompt([])).toBe('');
  });

  it('includes deduction block between summary and recent', () => {
    const deduction = '<event_log>\nSỔ TAY SỰ KIỆN HỆ THỐNG:\nXác nhận: Lan = Sói\n</event_log>';
    const obs = buildObs(['Minh đã chết. Vai: Dân.']);
    const result = compressedMemoryPrompt(obs, deduction);
    expect(result).toContain('<memory_summary>');
    expect(result).toContain(deduction);
    expect(result).toContain('<recent_observations>');
    // Verify order: summary before deduction before recent
    const summaryIdx = result.indexOf('<memory_summary>');
    const deductionIdx = result.indexOf('<event_log>');
    const recentIdx = result.indexOf('<recent_observations>');
    expect(summaryIdx).toBeLessThan(deductionIdx);
    expect(deductionIdx).toBeLessThan(recentIdx);
  });
});
