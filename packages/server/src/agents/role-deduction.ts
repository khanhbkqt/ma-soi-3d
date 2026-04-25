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

interface ConfirmedRole {
  kind: 'confirmed';
  player: string;
  role: string;
  source: string;
}
interface SeerResult {
  kind: 'seer';
  player: string;
  wolf: boolean;
}
interface RoleClaim {
  kind: 'claim';
  player: string;
  role: string;
  round: number;
}
interface Accusation {
  kind: 'accusation';
  target: string;
  by: string;
}
interface DuskVote {
  kind: 'dusk_vote';
  voter: string;
  target: string;
  round: number;
}
interface JudgementVoteFact {
  kind: 'judgement_vote';
  voter: string;
  verdict: 'GIẾT' | 'THA';
  round: number;
}

type Fact = ConfirmedRole | SeerResult | RoleClaim | Accusation | DuskVote | JudgementVoteFact;

type Extractor = (obs: string, round: number) => Fact | null;

// ── Vietnamese role keywords for claim/accusation matching ──

const ROLE_KEYWORDS: [string, string][] = [
  ['tiên tri', 'Tiên Tri'],
  ['seer', 'Tiên Tri'],
  ['phù thủy', 'Phù Thủy'],
  ['witch', 'Phù Thủy'],
  ['thợ săn', 'Thợ Săn'],
  ['hunter', 'Thợ Săn'],
  ['bảo vệ', 'Bảo Vệ'],
  ['guard', 'Bảo Vệ'],
  ['thần tình yêu', 'Thần Tình Yêu'],
  ['cupid', 'Thần Tình Yêu'],
];

const CLAIM_PREFIXES = [
  /tao là/,
  /tui là/,
  /tao chính là/,
  /role tao là/,
  /tao là con/,
  /tui chính là/,
  /tao đây là/,
  /mình là/,
  /anh là/,
  /chị là/,
];

/** Patterns that mention roles but are NOT self-claims (accusations, descriptions of others) */
const CLAIM_NEGATIVES = [
  /nhận .+ nghe mùi/, // "nhận Tiên Tri nghe mùi" = tố cáo
  /claim .+ để/, // "claim TT để chặn" = mô tả hành vi người khác
  /nhảy ra nhận/, // "nó nhảy ra nhận" = mô tả người khác
  /nhảy ra claim/, // "nhảy ra claim" = mô tả người khác
  /nó tự nhận/, // Nói về người khác tự nhận
  /hắn tự nhận/, // Nói về người khác tự nhận
  /nó là/, // "nó là Tiên Tri" = nói về người khác
  /hắn là/, // "hắn là Bảo Vệ" = nói về người khác
  /thằng .+ là/, // "thằng A là sói" = nói về người khác
  /con .+ là/, // "con B là Phù Thủy" = nói về người khác
  /fake|giả|xạo|láo/, // Tố cáo claim giả
  /claim .+ mâu thuẫn/, // "claim X mâu thuẫn" = phân tích
  /đã nhận|đã claim/, // "nó đã nhận" = nói về quá khứ người khác
];

const ACCUSE_PATTERNS = [/sói/, /fake/, /giả/, /nói láo/, /nói xạo/, /chắc luôn/, /đéo tin/];

// ── Vote extractors ──

/** Dusk nomination votes: "X vote Y." (not GIẾT/THA) */
const extractDuskVote: Extractor = (obs, round) => {
  // Must NOT match judgement votes ("X vote GIẾT/THA.")
  if (/vote (GIẾT|THA)/.test(obs)) return null;
  const m = obs.match(/^(.+?) vote (.+?)\.?$/);
  if (m) return { kind: 'dusk_vote', voter: m[1], target: m[2], round };
  return null;
};

/** Judgement votes: "X vote GIẾT." or "X vote THA." */
const extractJudgementVote: Extractor = (obs, round) => {
  const m = obs.match(/^(.+?) vote (GIẾT|THA)\.?$/);
  if (m) return { kind: 'judgement_vote', voter: m[1], verdict: m[2] as 'GIẾT' | 'THA', round };
  return null;
};

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

/** Role claims from chat: 'X nói: "tao là Thợ Săn..."' — only self-claims, not accusations */
const extractClaim: Extractor = (obs, round) => {
  const chatMatch = obs.match(/^(.+?) (?:nói|biện hộ): "(.+)"$/);
  if (!chatMatch) return null;
  const [, speaker, text] = chatMatch;
  const lower = text.toLowerCase();

  // Reject if matches any negative pattern (accusations, descriptions of others)
  if (CLAIM_NEGATIVES.some((p) => p.test(lower))) return null;

  // Only extract first-person self-claims
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

/**
 * Exported helper: checks if an observation string contains a valid role claim.
 * Used by memory-compression to preserve claim-containing chats.
 */
export function isRoleClaim(obs: string): boolean {
  return extractClaim(obs, 0) !== null;
}

/** Checks if an observation is a defense speech */
export function isDefenseSpeech(obs: string): boolean {
  return /biện hộ: "/.test(obs);
}

/** Accusations from chat: 'X nói: "thằng Y sói chắc luôn"' */
const extractAccusation: Extractor = (obs, round) => {
  const chatMatch = obs.match(/^(.+?) nói: "(.+)"$/);
  if (!chatMatch) return null;
  const [, speaker, text] = chatMatch;
  const lower = text.toLowerCase();

  if (!ACCUSE_PATTERNS.some((p) => p.test(lower))) return null;

  // Try to find a player name being accused — caller provides alive names via context
  // For now we store the raw accusation; buildPrompt will resolve names
  return null; // handled by extractAccusationWithNames below
};

const EXTRACTORS: Extractor[] = [
  extractConfirmed,
  extractSeer,
  extractClaim,
  extractDuskVote,
  extractJudgementVote,
];

// ── Tracker ──

export class RoleDeductionTracker {
  confirmed = new Map<string, { role: string; source: string }>();
  seerResults = new Map<string, 'wolf' | 'clear'>();
  claims = new Map<string, { role: string; round: number }[]>();
  accusations = new Map<string, string[]>(); // target → [accusers]
  credibility = new Map<string, number>(); // player → credibility score (0 = neutral)
  private credibilityReasons = new Map<string, string[]>(); // player → reasons for score

  // W1: Vote history — dusk nomination votes per round
  duskVotes = new Map<number, { voter: string; target: string }[]>();
  // W2: Judgement vote history — who voted KILL/SPARE per judgement
  judgementVotes: { round: number; accused: string; kills: string[]; spares: string[] }[] = [];
  private currentAccused: string | null = null;

  private currentRound = 1;
  private aliveNames: string[] = [];

  /** Update alive player names (call when state changes) */
  setAliveNames(names: string[]) {
    this.aliveNames = names;
  }

  /** Feed one observation — extracts all facts */
  ingest(obs: string) {
    // Track round from phase markers
    const roundMatch = obs.match(/^--- Vòng (\d+)/);
    if (roundMatch) {
      this.currentRound = parseInt(roundMatch[1]);
      return;
    }

    // Track who is on trial (for judgement vote context)
    const nominationMatch = obs.match(/^(.+?) bị đưa lên giàn/);
    if (nominationMatch) {
      this.currentAccused = nominationMatch[1];
    }

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
        if (!list.some((c) => c.role === fact.role))
          list.push({ role: fact.role, round: fact.round });
        this.claims.set(fact.player, list);
        break;
      }
      case 'dusk_vote': {
        const votes = this.duskVotes.get(fact.round) || [];
        if (!votes.some((v) => v.voter === fact.voter))
          votes.push({ voter: fact.voter, target: fact.target });
        this.duskVotes.set(fact.round, votes);
        break;
      }
      case 'judgement_vote': {
        // Find or create the current judgement entry
        let entry = this.judgementVotes.find(
          (j) => j.round === fact.round && j.accused === (this.currentAccused || '?'),
        );
        if (!entry) {
          entry = { round: fact.round, accused: this.currentAccused || '?', kills: [], spares: [] };
          this.judgementVotes.push(entry);
        }
        if (fact.verdict === 'GIẾT' && !entry.kills.includes(fact.voter)) {
          entry.kills.push(fact.voter);
        } else if (fact.verdict === 'THA' && !entry.spares.includes(fact.voter)) {
          entry.spares.push(fact.voter);
        }
        break;
      }
    }
  }

  private extractAccusations(obs: string) {
    const chatMatch = obs.match(/^(.+?) nói: "(.+)"$/);
    if (!chatMatch) return;
    const [, speaker, text] = chatMatch;
    const lower = text.toLowerCase();
    if (!ACCUSE_PATTERNS.some((p) => p.test(lower))) return;

    for (const name of this.aliveNames) {
      if (name === speaker) continue;
      if (text.includes(name)) {
        const accusers = this.accusations.get(name) || [];
        if (!accusers.includes(speaker)) accusers.push(speaker);
        this.accusations.set(name, accusers);
      }
    }
  }

  /**
   * Update credibility scores when a player's role is confirmed (usually via death).
   * Retroactively rewards/penalizes accusers and voters.
   */
  updateCredibilityOnDeath(deadPlayer: string, isWolf: boolean): void {
    // Reward/penalize accusers
    const accusers = this.accusations.get(deadPlayer) || [];
    for (const accuser of accusers) {
      if (isWolf) {
        this.addCredibility(accuser, 2, `tố đúng ${deadPlayer} là sói`);
      } else {
        this.addCredibility(accuser, -1, `tố nhầm ${deadPlayer} (là dân)`);
      }
    }

    // Penalize claim conflicts
    if (isWolf) {
      const claims = this.claims.get(deadPlayer);
      if (claims && claims.length > 0) {
        // Wolf that fake-claimed — anyone who supported the claim loses credibility
        // (handled implicitly via accusation rewards above)
      }
    }
  }

  private addCredibility(player: string, delta: number, reason: string): void {
    const current = this.credibility.get(player) || 0;
    this.credibility.set(player, current + delta);
    const reasons = this.credibilityReasons.get(player) || [];
    reasons.push(reason);
    this.credibilityReasons.set(player, reasons);
  }

  /** Build the SỔ TAY SỰ KIỆN HỆ THỐNG prompt block */
  buildPrompt(myRole: Role, myName: string): string {
    const lines: string[] = [];

    // Confirmed roles (deaths)
    if (this.confirmed.size) {
      const items = [...this.confirmed].map(([p, r]) => `${p} = ${r.role}`);
      lines.push(`Xác nhận: ${items.join(' | ')}`);
    }

    // Seer results (only seer/apprentice has these)
    if (this.seerResults.size) {
      const items = [...this.seerResults].map(
        ([p, r]) => `${p} = ${r === 'wolf' ? 'SÓI' : 'Không sói'}`,
      );
      lines.push(`Soi: ${items.join(' | ')}`);
    }

    // Role claims
    if (this.claims.size) {
      const items = [...this.claims].map(([p, cs]) =>
        cs.map((c) => `${p} tự nhận ${c.role} (vòng ${c.round})`).join(', '),
      );
      lines.push(`Claim: ${items.join(' | ')}`);
    }

    // Claim consistency — detect role-switching (same person claiming different roles)
    for (const [player, cs] of this.claims) {
      if (cs.length >= 2) {
        const roles = cs.map((c) => c.role);
        const uniqueRoles = [...new Set(roles)];
        if (uniqueRoles.length >= 2) {
          lines.push(
            `⚠ ${player} ĐỔI ROLE: ${cs.map((c) => `${c.role}(vòng ${c.round})`).join(' → ')} — RẤT ĐÁNG NGỜ!`,
          );
        }
      }
    }

    // Conflict detection — someone claims MY role
    const myRoleVi = roleNameVi(myRole);
    for (const [player, cs] of this.claims) {
      if (player === myName) continue;
      for (const c of cs) {
        if (c.role === myRoleVi) {
          lines.push(
            `⚠ ${player} claim ${c.role} nhưng MÀY mới là ${myRoleVi} thật → ${player} NÓI LÁO!`,
          );
        }
      }
    }

    // Accusations
    const accused = [...this.accusations]
      .filter(([, a]) => a.length > 0)
      .sort((a, b) => b[1].length - a[1].length);
    if (accused.length) {
      const items = accused.map(([t, a]) => `${t} (${a.length} người tố)`);
      lines.push(`Bị tố sói: ${items.join(' | ')}`);
    }

    // W2: Judgement vote history — compressed format, highlight suspicious patterns
    const judgementBlock = this.buildJudgementBlock();
    if (judgementBlock) lines.push(judgementBlock);

    // W1: Vote correlation — when a wolf is confirmed, who voted with them?
    const voteCorrelation = this.buildVoteCorrelation();
    if (voteCorrelation) lines.push(voteCorrelation);

    // Credibility scores
    const credEntries = [...this.credibility]
      .filter(([name]) => name !== myName) // Don't show own credibility
      .sort((a, b) => b[1] - a[1]); // Sort by score descending
    if (credEntries.length) {
      const credItems = credEntries.map(([name, score]) => {
        const reasons = this.credibilityReasons.get(name) || [];
        const icon = score > 0 ? '🟢' : score < 0 ? '🔴' : '🟡';
        const sign = score > 0 ? '+' : '';
        const reasonStr = reasons.length ? ` (${reasons.slice(-2).join(', ')})` : '';
        return `${icon} ${name}: ${sign}${score}${reasonStr}`;
      });
      lines.push(`ĐỘ TIN CẬY:\n${credItems.join('\n')}`);
    }

    if (!lines.length) return '';
    return `<event_log>\nSỔ TAY SỰ KIỆN HỆ THỐNG:\n${lines.join('\n')}\n</event_log>`;
  }

  /**
   * W2: Build compressed judgement vote history block.
   * Format: "V3 xử Bảo(Sói): GIẾT:Mai,Lan,Minh... | THA:Tú"
   * Highlights who spared a confirmed wolf or killed a confirmed villager.
   */
  private buildJudgementBlock(): string {
    if (!this.judgementVotes.length) return '';
    const wolfRoles = new Set(['Sói', 'Sói Đầu Đàn', 'Sói Con']);
    const entries: string[] = [];
    const warnings: string[] = [];

    for (const jv of this.judgementVotes) {
      const confirmed = this.confirmed.get(jv.accused);
      const roleStr = confirmed ? `(${confirmed.role})` : '';
      const killStr = jv.kills.length ? `GIẾT:${jv.kills.join(',')}` : '';
      const spareStr = jv.spares.length ? `THA:${jv.spares.join(',')}` : '';
      entries.push(
        `V${jv.round} ${jv.accused}${roleStr}: ${[killStr, spareStr].filter(Boolean).join(' | ')}`,
      );

      // Highlight suspicious: who spared a confirmed wolf?
      if (confirmed && wolfRoles.has(confirmed.role) && jv.spares.length > 0) {
        warnings.push(`⚠ ${jv.spares.join(',')} THA ${jv.accused}(Sói) → đáng nghi!`);
      }
      // Highlight suspicious: who killed a confirmed villager?
      if (confirmed && !wolfRoles.has(confirmed.role) && jv.kills.length > 0) {
        // Only flag if the person was executed (majority killed)
        if (jv.kills.length > jv.spares.length) {
          warnings.push(`⚠ ${jv.accused} là ${confirmed.role} bị treo oan. Ai dẫn vote GIẾT?`);
        }
      }
    }

    let block = `PHÁN XÉT CŨ: ${entries.join(' | ')}`;
    if (warnings.length) block += `\n${warnings.join('\n')}`;
    return block;
  }

  /**
   * W1: Build vote correlation analysis.
   * When a wolf is confirmed dead, check who voted the same targets across rounds.
   * Format: "⚠ Lan,Mai vote GIỐNG Bảo(Sói) ở V2 Phán xét → cùng phe?"
   */
  private buildVoteCorrelation(): string {
    const wolfRoles = new Set(['Sói', 'Sói Đầu Đàn', 'Sói Con']);
    const confirmedWolves = [...this.confirmed]
      .filter(([, r]) => wolfRoles.has(r.role))
      .map(([name]) => name);
    if (!confirmedWolves.length) return '';

    const warnings: string[] = [];

    // Check judgement votes: who voted GIẾT the same person as confirmed wolves?
    for (const jv of this.judgementVotes) {
      for (const wolfName of confirmedWolves) {
        // Find non-wolf players who voted the same way as the wolf in this judgement
        const wolfVotedKill = jv.kills.includes(wolfName);
        const wolfVotedSpare = jv.spares.includes(wolfName);
        if (!wolfVotedKill && !wolfVotedSpare) continue;

        const confirmed = this.confirmed.get(jv.accused);
        const accusedIsWolf = confirmed && wolfRoles.has(confirmed.role);

        if (wolfVotedKill && !accusedIsWolf) {
          // Wolf voted to KILL a non-wolf → who else voted KILL?
          const sameVoters = jv.kills.filter((v) => v !== wolfName && !confirmedWolves.includes(v));
          // Only flag if there are alive players who matched
          const aliveSame = sameVoters.filter((v) => this.aliveNames.includes(v));
          if (aliveSame.length > 0) {
            warnings.push(
              `${aliveSame.join(',')} vote GIẾT giống ${wolfName}(Sói) ở V${jv.round} xử ${jv.accused}`,
            );
          }
        }

        if (wolfVotedSpare && accusedIsWolf) {
          // Wolf voted to SPARE fellow wolf → who else voted SPARE?
          const sameVoters = jv.spares.filter(
            (v) => v !== wolfName && !confirmedWolves.includes(v),
          );
          const aliveSame = sameVoters.filter((v) => this.aliveNames.includes(v));
          if (aliveSame.length > 0) {
            warnings.push(
              `${aliveSame.join(',')} THA ${jv.accused}(Sói) giống ${wolfName}(Sói) ở V${jv.round}`,
            );
          }
        }
      }
    }

    // Check dusk votes: who voted same targets as confirmed wolves?
    for (const [round, votes] of this.duskVotes) {
      for (const wolfName of confirmedWolves) {
        const wolfVote = votes.find((v) => v.voter === wolfName);
        if (!wolfVote) continue;

        // Find alive players who voted the same target
        const sameVoters = votes
          .filter(
            (v) =>
              v.voter !== wolfName &&
              v.target === wolfVote.target &&
              !confirmedWolves.includes(v.voter) &&
              this.aliveNames.includes(v.voter),
          )
          .map((v) => v.voter);

        if (sameVoters.length > 0) {
          // Check if the target was a confirmed villager (wrongly voted)
          const targetConfirmed = this.confirmed.get(wolfVote.target);
          const targetIsVillage = targetConfirmed && !wolfRoles.has(targetConfirmed.role);
          if (targetIsVillage) {
            warnings.push(
              `${sameVoters.join(',')} vote ${wolfVote.target}(dân) giống ${wolfName}(Sói) ở V${round}`,
            );
          }
        }
      }
    }

    if (!warnings.length) return '';
    // Cap at 3 entries to keep prompt compact
    const capped = warnings.slice(0, 3);
    return `VOTE GIỐNG SÓI:\n${capped.map((w) => `⚠ ${w}`).join('\n')}`;
  }
}
