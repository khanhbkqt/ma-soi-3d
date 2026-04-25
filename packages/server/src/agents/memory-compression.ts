/**
 * Memory compression for agent observations.
 *
 * Problem: observations.slice(-30) drops early-game facts (deaths, seer results, vote outcomes).
 * Solution: Compress older observations into a structured summary, keep recent ones raw.
 *
 * Key design: uses shared helpers from role-deduction.ts (isRoleClaim, isDefenseSpeech)
 * to ensure claim detection consistency between memory and deduction systems.
 */

import { isRoleClaim, isDefenseSpeech } from './role-deduction.js';

const RECENT_COUNT = 20;

// Patterns that indicate high-importance observations
const HIGH_IMPORTANCE = [
  /đã chết/, // deaths
  /Vai:/, // role reveals
  /LÀ SÓI/, // seer wolf result
  /Không phải sói/, // seer clear result
  /bị treo cổ/, // execution
  /bị đuổi/, // exiled
  /được tha/, // spared
  /LÂY NHIỄM/, // alpha infect
  /kế thừa/, // apprentice activation
  /ghép đôi/, // cupid pair
  /chết theo/, // lover death
  /bảo vệ/, // guard protect
  /thuốc/, // witch potion
  /Sói cắn/, // wolf kill (wolf-only)
  /Thợ Săn bắn/, // hunter shot
  /trả thù/, // wolf cub revenge
  /Kẻ Ngốc/, // fool victory
];

const PHASE_MARKER = /^--- Vòng/;
const VOTE_PATTERN = /vote/;
const CHAT_PATTERN = /nói: "/;

interface CompressedMemory {
  summary: string;
  recent: string[];
}

function isHighImportance(obs: string): boolean {
  return HIGH_IMPORTANCE.some((p) => p.test(obs));
}

function isPhaseMarker(obs: string): boolean {
  return PHASE_MARKER.test(obs);
}

function isChat(obs: string): boolean {
  return CHAT_PATTERN.test(obs);
}

/**
 * Compress observations into summary + recent raw observations.
 * - Extracts key facts (deaths, seer results, votes, executions) from older observations
 * - Keeps the last RECENT_COUNT observations raw
 * - Preserves role claims and defense speeches from old rounds (critical for consistency)
 * - Normal chat messages from old rounds are dropped (noise by that point)
 */
export function compressMemory(observations: string[]): CompressedMemory {
  if (observations.length <= RECENT_COUNT) {
    return { summary: '', recent: observations };
  }

  const cutoff = observations.length - RECENT_COUNT;
  const old = observations.slice(0, cutoff);
  const recent = observations.slice(cutoff);

  // Extract key facts from old observations
  const deaths: string[] = [];
  const seerResults: string[] = [];
  const executions: string[] = [];
  const keyEvents: string[] = [];
  const votePatterns: string[] = []; // who voted whom (condensed)
  const roleClaims: string[] = []; // role claims & defense speeches preserved

  for (const obs of old) {
    if (isPhaseMarker(obs)) continue;

    if (/đã chết/.test(obs)) {
      deaths.push(obs);
    } else if (/LÀ SÓI|Không phải sói/.test(obs)) {
      seerResults.push(obs);
    } else if (/bị treo cổ|được tha|bị đuổi/.test(obs)) {
      executions.push(obs);
    } else if (
      /LÂY NHIỄM|kế thừa|ghép đôi|chết theo|Thợ Săn bắn|trả thù|thuốc|bảo vệ|Sói cắn/.test(obs)
    ) {
      keyEvents.push(obs);
    } else if (VOTE_PATTERN.test(obs) && !isChat(obs)) {
      votePatterns.push(obs);
    } else if (isChat(obs) || isDefenseSpeech(obs)) {
      // Preserve chat messages that contain role claims or defense speeches
      // These are critical for agents to remember who claimed what
      if (isRoleClaim(obs) || isDefenseSpeech(obs)) {
        roleClaims.push(obs);
      }
      // Drop normal chat messages — they're noise by now
    }
  }

  // Build compact summary
  const parts: string[] = [];
  if (deaths.length) parts.push(`Chết: ${deaths.join(' | ')}`);
  if (seerResults.length) parts.push(`Soi: ${seerResults.join(' | ')}`);
  if (executions.length) parts.push(`Phán xét: ${executions.join(' | ')}`);
  if (keyEvents.length) parts.push(`Sự kiện: ${keyEvents.join(' | ')}`);
  if (roleClaims.length) parts.push(`Claim role: ${roleClaims.join(' | ')}`);
  if (votePatterns.length) {
    // Condense votes: keep only unique vote targets with voter counts
    const voteSummary = condenseVotes(votePatterns);
    if (voteSummary) parts.push(`Vote cũ: ${voteSummary}`);
  }

  const summary = parts.length ? `TÓM TẮT CÁC VÒNG TRƯỚC:\n${parts.join('\n')}` : '';

  return { summary, recent };
}

/** Condense vote lines into "X,Y → Z; A → B" format */
function condenseVotes(votes: string[]): string {
  // Group by round-ish blocks: "Tên vote Tên"
  const tally = new Map<string, string[]>();
  for (const v of votes) {
    const m = v.match(/^(.+?) vote (.+?)\.?$/);
    if (m) {
      const target = m[2];
      if (!tally.has(target)) tally.set(target, []);
      tally.get(target)!.push(m[1]);
    }
  }
  if (!tally.size) return '';
  return [...tally.entries()]
    .map(([target, voters]) => `${voters.join(',')} → ${target}`)
    .join('; ');
}

/**
 * Build the full memory prompt with compression.
 * Replaces the old `memoryPrompt()` that just sliced to last 30.
 */
export function compressedMemoryPrompt(observations: string[], deductionBlock?: string): string {
  if (!observations.length && !deductionBlock) return '';

  const { summary, recent } = compressMemory(observations);
  const recentBlock = recent.length ? recent.map((o) => `- ${o}`).join('\n') : '';

  const parts: string[] = [];
  if (summary) parts.push(`<memory_summary>\n${summary}\n</memory_summary>`);
  if (deductionBlock) parts.push(deductionBlock);
  if (recentBlock) {
    const header =
      !summary && !deductionBlock ? 'NHẬT KÝ (những gì mày biết/thấy/nghe)' : 'NHẬT KÝ GẦN ĐÂY';
    parts.push(`<recent_observations>\n${header}:\n${recentBlock}\n</recent_observations>`);
  }

  return parts.join('\n\n');
}
