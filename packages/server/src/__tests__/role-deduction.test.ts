import { describe, it, expect, beforeEach } from 'vitest';
import { Role } from '@ma-soi/shared';
import { RoleDeductionTracker } from '../agents/role-deduction.js';

describe('RoleDeductionTracker', () => {
  let tracker: RoleDeductionTracker;

  beforeEach(() => { tracker = new RoleDeductionTracker(); });

  it('extracts death with role reveal', () => {
    tracker.ingest('Minh đã chết (bị sói cắn). Vai: Dân.');
    expect(tracker.confirmed.get('Minh')).toEqual({ role: 'Dân', source: 'chết lộ role' });
  });

  it('extracts seer wolf result', () => {
    tracker.ingest('Mày soi Hùng: LÀ SÓI!');
    expect(tracker.seerResults.get('Hùng')).toBe('wolf');
  });

  it('extracts seer clear result', () => {
    tracker.ingest('Mày soi Tú: Không phải sói.');
    expect(tracker.seerResults.get('Tú')).toBe('clear');
  });

  it('extracts role claim from chat', () => {
    tracker.ingest('Hùng nói: "tao là Thợ Săn nha"');
    expect(tracker.claims.get('Hùng')).toEqual([{ role: 'Thợ Săn', round: 1 }]);
  });

  it('does not duplicate claims for same role', () => {
    tracker.ingest('Hùng nói: "tao là Thợ Săn"');
    tracker.ingest('Hùng nói: "tao là Thợ Săn nha"');
    expect(tracker.claims.get('Hùng')).toHaveLength(1);
  });

  it('extracts accusation when alive names set', () => {
    tracker.setAliveNames(['Hùng', 'Tú', 'Lan']);
    tracker.ingest('Tú nói: "thằng Hùng sói chắc luôn"');
    expect(tracker.accusations.get('Hùng')).toEqual(['Tú']);
  });

  it('tracks round from phase markers', () => {
    tracker.ingest('--- Vòng 3, Ban ngày ---');
    tracker.ingest('Lan nói: "tao là Tiên Tri"');
    expect(tracker.claims.get('Lan')).toEqual([{ role: 'Tiên Tri', round: 3 }]);
  });

  it('buildPrompt includes all sections', () => {
    tracker.ingest('Minh đã chết (bị sói cắn). Vai: Dân.');
    tracker.ingest('Mày soi Hùng: LÀ SÓI!');
    tracker.ingest('Lan nói: "tao là Bảo Vệ"');
    tracker.setAliveNames(['Hùng', 'Tú', 'Lan']);
    tracker.ingest('Tú nói: "thằng Hùng sói chắc luôn"');

    const prompt = tracker.buildPrompt(Role.Seer, 'Tôi');
    expect(prompt).toContain('PHÂN TÍCH ROLE:');
    expect(prompt).toContain('Xác nhận: Minh = Dân');
    expect(prompt).toContain('Soi: Hùng = SÓI');
    expect(prompt).toContain('Claim: Lan tự nhận Bảo Vệ (vòng 1)');
    expect(prompt).toContain('Bị tố sói: Hùng (1 người tố)');
  });

  it('detects conflict when someone claims my role', () => {
    tracker.ingest('Hùng nói: "tao là Thợ Săn"');
    const prompt = tracker.buildPrompt(Role.Hunter, 'Tôi');
    expect(prompt).toContain('⚠ Hùng claim Thợ Săn nhưng MÀY mới là Thợ Săn thật → Hùng NÓI LÁO!');
  });

  it('returns empty string when no facts', () => {
    expect(tracker.buildPrompt(Role.Villager, 'Tôi')).toBe('');
  });
});
