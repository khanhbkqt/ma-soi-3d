import { describe, it, expect } from 'vitest';
import { compressMemory, compressedMemoryPrompt } from '../agents/memory-compression.js';

/** Generate observations across multiple rounds */
function multiRoundObs(
  rounds: { round: number; phases: string[]; observations: string[] }[],
): string[] {
  const obs: string[] = [];
  for (const r of rounds) {
    for (const phase of r.phases) {
      obs.push(`--- Vòng ${r.round}, ${phase} ---`);
    }
    obs.push(...r.observations);
  }
  return obs;
}

/** Generate N filler observations within a single round */
function fillerRound(round: number, n: number): string[] {
  const obs: string[] = [`--- Vòng ${round}, Ban ngày ---`];
  for (let i = 0; i < n; i++) {
    obs.push(`Player${i} nói: "blah blah vòng ${round}"`);
  }
  return obs;
}

/** Build observations with important ones in old rounds and current round as recent */
function buildMultiRound(importantObs: string[], currentRoundCount = 15): string[] {
  return [
    `--- Vòng 1, Ban đêm ---`,
    ...importantObs,
    `--- Vòng 1, Ban ngày ---`,
    ...Array.from({ length: 5 }, (_, i) => `Chat${i} nói: "vòng 1 filler"`),
    `--- Vòng 2, Ban ngày ---`,
    ...Array.from({ length: currentRoundCount }, (_, i) => `Chat${i} nói: "vòng 2 filler"`),
  ];
}

describe('compressMemory — per-round summaries', () => {
  it('returns all as recent with empty summaries when <=20', () => {
    const obs = fillerRound(1, 10);
    const { frozenSummaries, recent } = compressMemory(obs);
    expect(frozenSummaries).toEqual([]);
    expect(recent).toEqual(obs);
  });

  it('creates per-round summary for completed rounds', () => {
    const obs = buildMultiRound(['Minh đã chết (bị sói cắn). Vai: Dân.']);
    const { frozenSummaries, recent } = compressMemory(obs);
    expect(frozenSummaries.length).toBeGreaterThanOrEqual(1);
    expect(frozenSummaries[0]).toContain('<round_summary round="1">');
    expect(frozenSummaries[0]).toContain('Minh đã chết');
    expect(frozenSummaries[0]).toContain('</round_summary>');
    // Recent should be current round observations
    expect(recent.length).toBeGreaterThan(0);
  });

  it('freezes completed round summaries — adding new round does not change old summaries', () => {
    // Round 1 + Round 2
    const obs2 = buildMultiRound(['Minh đã chết (bị sói cắn). Vai: Dân.'], 10);
    const result2 = compressMemory(obs2);

    // Round 1 + Round 2 + Round 3 (new observations)
    const obs3 = [
      ...obs2,
      `--- Vòng 3, Ban ngày ---`,
      ...Array.from({ length: 8 }, (_, i) => `Chat${i} nói: "vòng 3 filler"`),
    ];
    const result3 = compressMemory(obs3);

    // Round 1 summary should be IDENTICAL in both
    expect(result3.frozenSummaries.length).toBeGreaterThanOrEqual(result2.frozenSummaries.length);
    // The first frozen summary (round 1) should be unchanged
    if (result2.frozenSummaries.length > 0 && result3.frozenSummaries.length > 0) {
      expect(result3.frozenSummaries[0]).toBe(result2.frozenSummaries[0]);
    }
  });

  it('preserves deaths in per-round summary', () => {
    const obs = buildMultiRound(['Minh đã chết (bị sói cắn). Vai: Dân.']);
    const { frozenSummaries } = compressMemory(obs);
    const summary = frozenSummaries.join('\n');
    expect(summary).toContain('Chết:');
    expect(summary).toContain('Minh đã chết');
  });

  it('preserves seer results in per-round summary', () => {
    const obs = buildMultiRound(['Mày soi Hùng: LÀ SÓI!', 'Mày soi Tú: Không phải sói.']);
    const { frozenSummaries } = compressMemory(obs);
    const summary = frozenSummaries.join('\n');
    expect(summary).toContain('Soi:');
    expect(summary).toContain('LÀ SÓI');
    expect(summary).toContain('Không phải sói');
  });

  it('preserves executions in per-round summary', () => {
    const obs = buildMultiRound(['Lan bị treo cổ sau phán xét.']);
    const { frozenSummaries } = compressMemory(obs);
    const summary = frozenSummaries.join('\n');
    expect(summary).toContain('Phán xét:');
    expect(summary).toContain('bị treo cổ');
  });

  it('preserves key events in per-round summary', () => {
    const obs = buildMultiRound(['Alpha LÂY NHIỄM Hùng!', 'Thợ Săn bắn Tú.']);
    const { frozenSummaries } = compressMemory(obs);
    const summary = frozenSummaries.join('\n');
    expect(summary).toContain('Sự kiện:');
    expect(summary).toContain('LÂY NHIỄM');
    expect(summary).toContain('Thợ Săn bắn');
  });

  it('drops chat messages from completed round summaries', () => {
    const obs = buildMultiRound(['Hùng nói: "Tao thấy thằng Tú im quá..."']);
    const { frozenSummaries } = compressMemory(obs);
    const summary = frozenSummaries.join('\n');
    expect(summary).not.toContain('Tao thấy thằng Tú');
  });

  it('condenses votes in per-round summary', () => {
    const obs = buildMultiRound(['Hùng vote Lan.', 'Minh vote Lan.', 'Tú vote Hùng.']);
    const { frozenSummaries } = compressMemory(obs);
    const summary = frozenSummaries.join('\n');
    expect(summary).toContain('Vote:');
    expect(summary).toContain('Hùng,Minh → Lan');
    expect(summary).toContain('Tú → Hùng');
  });

  it('excludes phase markers from round summaries', () => {
    const obs = buildMultiRound([]);
    const { frozenSummaries } = compressMemory(obs);
    const summary = frozenSummaries.join('\n');
    expect(summary).not.toContain('--- Vòng');
  });

  it('handles single round with >20 observations via sliding window', () => {
    const obs = fillerRound(1, 30);
    const { frozenSummaries, recent } = compressMemory(obs);
    expect(recent.length).toBeLessThanOrEqual(20);
    // Observations that don't fit in recent should produce a partial summary
    expect(frozenSummaries.length + recent.length).toBeGreaterThan(0);
  });

  it('groups observations correctly across multiple rounds', () => {
    const obs = multiRoundObs([
      {
        round: 1,
        phases: ['Ban đêm', 'Rạng sáng', 'Ban ngày'],
        observations: ['Minh đã chết (bị sói cắn). Vai: Dân.', 'A nói: "test"', 'B vote C.'],
      },
      {
        round: 2,
        phases: ['Ban đêm', 'Rạng sáng', 'Ban ngày'],
        observations: ['Lan đã chết (bị treo cổ). Vai: Sói.', 'C nói: "round 2"', 'D vote E.'],
      },
      {
        round: 3,
        phases: ['Ban ngày'],
        observations: Array.from({ length: 10 }, (_, i) => `Player${i} nói: "round 3"`),
      },
    ]);
    const { frozenSummaries, recent } = compressMemory(obs);
    // Round 1 and 2 should be frozen
    expect(frozenSummaries.some((s) => s.includes('round="1"'))).toBe(true);
    expect(frozenSummaries.some((s) => s.includes('round="2"'))).toBe(true);
    // Round 3 should be in recent
    expect(recent.some((o) => o.includes('round 3'))).toBe(true);
  });
});

describe('compressedMemoryPrompt — per-round format', () => {
  it('returns empty string for empty observations', () => {
    expect(compressedMemoryPrompt([])).toBe('');
  });

  it('renders frozen summaries in <memory_summary> block', () => {
    const obs = buildMultiRound(['Minh đã chết (bị sói cắn). Vai: Dân.']);
    const result = compressedMemoryPrompt(obs);
    expect(result).toContain('<memory_summary>');
    expect(result).toContain('<round_summary round="1">');
    expect(result).toContain('</memory_summary>');
  });

  it('includes deduction block between summary and recent', () => {
    const deduction = '<event_log>\nSỔ TAY SỰ KIỆN HỆ THỐNG:\nXác nhận: Lan = Sói\n</event_log>';
    const obs = buildMultiRound(['Minh đã chết. Vai: Dân.']);
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

  it('renders recent as NHẬT KÝ when no frozen summaries', () => {
    const obs = fillerRound(1, 10);
    const result = compressedMemoryPrompt(obs);
    expect(result).toContain('NHẬT KÝ (những gì mày biết/thấy/nghe)');
    expect(result).not.toContain('<memory_summary>');
  });

  it('renders recent as NHẬT KÝ GẦN ĐÂY when frozen summaries exist', () => {
    const obs = buildMultiRound(['Minh đã chết (bị sói cắn). Vai: Dân.']);
    const result = compressedMemoryPrompt(obs);
    expect(result).toContain('NHẬT KÝ GẦN ĐÂY');
  });
});
