/**
 * Role Deduction Tracker — extracts structured facts from raw observations.
 *
 * Uses an extractor pattern: each extractor is a function that receives an
 * observation string and returns a Fact or null. Adding new extractors is
 * just appending to the array — no core logic changes needed.
 */

import { Role } from '@ma-soi/shared';
import { roleNameVi } from './prompt-builders/base.js';

// ── Fact types ──

interface ConfirmedRole { kind: 'confirmed'; player: string; role: string; source: string }
interface SeerResult    { kind: 'seer';      player: string; wolf: boolean }
interface RoleClaim     { kind: 'claim';     player: string; role: string; round: number }
interface Accusation    { kind: 'accusation'; target: string; by: string }

type Fact = ConfirmedRole | SeerResult | RoleClaim | Accusation;

type Extractor = (obs: string, round: number) => Fact | null;

// ── Vietnamese role keywords for claim/accusation matching ──

const ROLE_KEYWORDS: [string, string][] = [
  ['tiên tri', 'Tiên Tri'], ['seer', 'Tiên Tri'],
  ['phù thủy', 'Phù Thủy'], ['witch', 'Phù Thủy'],
  ['thợ săn', 'Thợ Săn'], ['hunter', 'Thợ Săn'],
  ['bảo vệ', 'Bảo Vệ'], ['guard', 'Bảo Vệ'],
  ['thần tình yêu', 'Thần Tình Yêu'], ['cupid', 'Thần Tình Yêu'],
];

const CLAIM_PREFIXES = [
  /tao là/, /tui là/, /tao chính là/, /role tao là/, /tao là con/,
  /tui chính là/, /tao đây là/, /mình là/, /anh là/, /chị là/,
];

const ACCUSE_PATTERNS = [
  /sói/, /fake/, /giả/, /nói láo/, /nói xạo/, /chắc luôn/, /đéo tin/,
];

// ── Extractors ──

/** Deaths with role reveal: "X đã chết (...). Vai: Y." */
const extractConfirmed: Extractor = (obs) => {
  const m = obs.match(/^(.+?) đã chết \(.+?\)\. Vai: (.+?)\.$/);
  if (m) return { kind: 'confirmed', player: m[1], role: m[2], source: 'chết lộ role' };
  return null;
};

/** Seer investigation: "Mày soi X: LÀ SÓI!" or "Mày soi X: Không phải sói." */
const extractSeer: Extractor = (obs) => {
  const m = obs.match(/^Mày soi (.+?): (LÀ SÓI|Không phải sói)/);
  if (m) return { kind: 'seer', player: m[1], wolf: m[2] === 'LÀ SÓI' };
  return null;
};

/** Role claims from chat: 'X nói: "tao là Thợ Săn..."' */
const extractClaim: Extractor = (obs, round) => {
  const chatMatch = obs.match(/^(.+?) (?:nói|biện hộ): "(.+)"$/);
  if (!chatMatch) return null;
  const [, speaker, text] = chatMatch;
  const lower = text.toLowerCase();

  for (const prefix of CLAIM_PREFIXES) {
    if (!prefix.test(lower)) continue;
    for (const [keyword, roleName] of ROLE_KEYWORDS) {
      if (lower.includes(keyword)) {
        return { kind: 'claim', player: speaker, role: roleName, round };
      }
    }
  }
  return null;
};

/** Accusations from chat: 'X nói: "thằng Y sói chắc luôn"' */
const extractAccusation: Extractor = (obs, round) => {
  const chatMatch = obs.match(/^(.+?) nói: "(.+)"$/);
  if (!chatMatch) return null;
  const [, speaker, text] = chatMatch;
  const lower = text.toLowerCase();

  if (!ACCUSE_PATTERNS.some(p => p.test(lower))) return null;

  // Try to find a player name being accused — caller provides alive names via context
  // For now we store the raw accusation; buildPrompt will resolve names
  return null; // handled by extractAccusationWithNames below
};

const EXTRACTORS: Extractor[] = [extractConfirmed, extractSeer, extractClaim];

// ── Tracker ──

export class RoleDeductionTracker {
  confirmed = new Map<string, { role: string; source: string }>();
  seerResults = new Map<string, 'wolf' | 'clear'>();
  claims = new Map<string, { role: string; round: number }[]>();
  accusations = new Map<string, string[]>(); // target → [accusers]

  private currentRound = 1;
  private aliveNames: string[] = [];

  /** Update alive player names (call when state changes) */
  setAliveNames(names: string[]) { this.aliveNames = names; }

  /** Feed one observation — extracts all facts */
  ingest(obs: string) {
    // Track round from phase markers
    const roundMatch = obs.match(/^--- Vòng (\d+)/);
    if (roundMatch) { this.currentRound = parseInt(roundMatch[1]); return; }

    // Run all extractors
    for (const extract of EXTRACTORS) {
      const fact = extract(obs, this.currentRound);
      if (fact) this.addFact(fact);
    }

    // Accusation extraction needs alive names for name matching
    this.extractAccusations(obs);
  }

  private addFact(fact: Fact) {
    switch (fact.kind) {
      case 'confirmed':
        this.confirmed.set(fact.player, { role: fact.role, source: fact.source });
        break;
      case 'seer':
        this.seerResults.set(fact.player, fact.wolf ? 'wolf' : 'clear');
        break;
      case 'claim': {
        const list = this.claims.get(fact.player) || [];
        // Avoid duplicate claims of same role
        if (!list.some(c => c.role === fact.role)) list.push({ role: fact.role, round: fact.round });
        this.claims.set(fact.player, list);
        break;
      }
    }
  }

  private extractAccusations(obs: string) {
    const chatMatch = obs.match(/^(.+?) nói: "(.+)"$/);
    if (!chatMatch) return;
    const [, speaker, text] = chatMatch;
    const lower = text.toLowerCase();
    if (!ACCUSE_PATTERNS.some(p => p.test(lower))) return;

    for (const name of this.aliveNames) {
      if (name === speaker) continue;
      if (text.includes(name)) {
        const accusers = this.accusations.get(name) || [];
        if (!accusers.includes(speaker)) accusers.push(speaker);
        this.accusations.set(name, accusers);
      }
    }
  }

  /** Build the PHÂN TÍCH ROLE prompt block */
  buildPrompt(myRole: Role, myName: string): string {
    const lines: string[] = [];

    // Confirmed roles (deaths)
    if (this.confirmed.size) {
      const items = [...this.confirmed].map(([p, r]) => `${p} = ${r.role}`);
      lines.push(`Xác nhận: ${items.join(' | ')}`);
    }

    // Seer results (only seer/apprentice has these)
    if (this.seerResults.size) {
      const items = [...this.seerResults].map(([p, r]) => `${p} = ${r === 'wolf' ? 'SÓI' : 'Không sói'}`);
      lines.push(`Soi: ${items.join(' | ')}`);
    }

    // Role claims
    if (this.claims.size) {
      const items = [...this.claims].map(([p, cs]) =>
        cs.map(c => `${p} tự nhận ${c.role} (vòng ${c.round})`).join(', ')
      );
      lines.push(`Claim: ${items.join(' | ')}`);
    }

    // Conflict detection — someone claims MY role
    const myRoleVi = roleNameVi(myRole);
    for (const [player, cs] of this.claims) {
      if (player === myName) continue;
      for (const c of cs) {
        if (c.role === myRoleVi) {
          lines.push(`⚠ ${player} claim ${c.role} nhưng MÀY mới là ${myRoleVi} thật → ${player} NÓI LÁO!`);
        }
      }
    }

    // Accusations
    const accused = [...this.accusations].filter(([, a]) => a.length > 0).sort((a, b) => b[1].length - a[1].length);
    if (accused.length) {
      const items = accused.map(([t, a]) => `${t} (${a.length} người tố)`);
      lines.push(`Bị tố sói: ${items.join(' | ')}`);
    }

    if (!lines.length) return '';
    return `PHÂN TÍCH ROLE:\n${lines.join('\n')}`;
  }
}
