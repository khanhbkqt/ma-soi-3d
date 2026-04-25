/**
 * Memory compression for agent observations.
 *
 * Problem: observations.slice(-30) drops early-game facts (deaths, seer results, vote outcomes).
 * Solution: Compress older observations into structured per-round summaries, keep recent ones raw.
 *
 * Key design choices:
 * - Per-round summaries use <round_summary round="N"> XML tags so each completed round
 *   is "frozen" — its text never changes once the next round starts.
 * - This preserves prompt prefix stability for LLM context caching
 *   (OpenAI auto-caches matching prefixes; Anthropic needs explicit cache_control).
 * - Rule-based, not LLM-based — no extra API calls, deterministic.
 *
 * Uses shared helpers from role-deduction.ts (isRoleClaim, isDefenseSpeech)
 * to ensure claim detection consistency between memory and deduction systems.
 */

import { isRoleClaim, isDefenseSpeech } from './role-deduction.js';

const RECENT_COUNT = 20;

/** Standardized round boundary marker regex */
const ROUND_MARKER = /^--- Vòng (\d+),\s*(.+?)\s*---$/;

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
  /vote GIẾT/, // W2: judgement kill vote — critical for vote pattern analysis
  /vote THA/, // W2: judgement spare vote — critical for vote pattern analysis
  /bị đưa lên giàn/, // W2: nomination — needed for judgement context
];

const VOTE_PATTERN = /vote/;
const CHAT_PATTERN = /nói: "/;

interface RoundObservations {
  round: number;
  observations: string[];
}

interface CompressedMemory {
  /** Per-round summaries, frozen — each string is a complete <round_summary> block */
  frozenSummaries: string[];
  /** Recent raw observations from the current (incomplete) round */
  recent: string[];
}

function isHighImportance(obs: string): boolean {
  return HIGH_IMPORTANCE.some((p) => p.test(obs));
}

function isChat(obs: string): boolean {
  return CHAT_PATTERN.test(obs);
}

/**
 * Parse observations into groups by round number.
 * Observations before any round marker are assigned to round 0.
 */
function groupByRound(observations: string[]): RoundObservations[] {
  const groups: RoundObservations[] = [];
  let current: RoundObservations = { round: 0, observations: [] };

  for (const obs of observations) {
    const m = obs.match(ROUND_MARKER);
    if (m) {
      const roundNum = parseInt(m[1], 10);
      if (roundNum !== current.round) {
        // Save previous group if non-empty
        if (current.observations.length > 0) {
          groups.push(current);
        }
        current = { round: roundNum, observations: [] };
      }
      // Include the marker in this round's observations
      current.observations.push(obs);
    } else {
      current.observations.push(obs);
    }
  }

  // Push last group
  if (current.observations.length > 0) {
    groups.push(current);
  }

  return groups;
}

/**
 * Compress a single round's observations into a compact summary.
 * Returns empty string if nothing important was found.
 */
function compressRound(roundObs: string[]): string {
  const deaths: string[] = [];
  const seerResults: string[] = [];
  const executions: string[] = [];
  const keyEvents: string[] = [];
  const votePatterns: string[] = [];
  const roleClaims: string[] = [];

  for (const obs of roundObs) {
    // Skip phase markers
    if (ROUND_MARKER.test(obs)) continue;

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
      // Preserve role claims and defense speeches — critical for agent reasoning
      if (isRoleClaim(obs) || isDefenseSpeech(obs)) {
        roleClaims.push(obs);
      }
      // Drop normal chat messages — noise by that point
    }
  }

  const parts: string[] = [];
  if (deaths.length) parts.push(`Chết: ${deaths.join(' | ')}`);
  if (seerResults.length) parts.push(`Soi: ${seerResults.join(' | ')}`);
  if (executions.length) parts.push(`Phán xét: ${executions.join(' | ')}`);
  if (keyEvents.length) parts.push(`Sự kiện: ${keyEvents.join(' | ')}`);
  if (roleClaims.length) parts.push(`Claim role: ${roleClaims.join(' | ')}`);
  if (votePatterns.length) {
    const voteSummary = condenseVotes(votePatterns);
    if (voteSummary) parts.push(`Vote: ${voteSummary}`);
  }

  return parts.join('\n');
}

/** Condense vote lines into "X,Y → Z; A → B" format */
function condenseVotes(votes: string[]): string {
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
 * Compress observations into per-round frozen summaries + recent raw observations.
 *
 * Design for context caching:
 * - Each completed round produces a `<round_summary round="N">` block that NEVER changes.
 * - These frozen summaries form a stable prefix in the prompt → cache hit.
 * - Only the current round's observations change (suffix) → doesn't break cache.
 */
export function compressMemory(observations: string[]): CompressedMemory {
  if (observations.length <= RECENT_COUNT) {
    return { frozenSummaries: [], recent: observations };
  }

  // Group observations by round
  const roundGroups = groupByRound(observations);

  if (roundGroups.length <= 1) {
    // All observations are in one round — just split by count
    const cutoff = observations.length - RECENT_COUNT;
    const old = observations.slice(0, cutoff);
    const recent = observations.slice(cutoff);
    const summary = compressRound(old);
    return {
      frozenSummaries: summary ? [`<round_summary round="1">\n${summary}\n</round_summary>`] : [],
      recent,
    };
  }

  // Find current round (last group)
  const currentRound = roundGroups[roundGroups.length - 1];
  const completedRounds = roundGroups.slice(0, -1);

  // Check total observation count to decide if we need compression
  const completedObsCount = completedRounds.reduce((sum, g) => sum + g.observations.length, 0);
  const totalCount = completedObsCount + currentRound.observations.length;

  if (totalCount <= RECENT_COUNT) {
    // Not enough to compress — return all as recent
    return { frozenSummaries: [], recent: observations };
  }

  // Compress each completed round into a frozen summary
  const frozenSummaries: string[] = [];
  for (const group of completedRounds) {
    const summary = compressRound(group.observations);
    if (summary) {
      frozenSummaries.push(`<round_summary round="${group.round}">\n${summary}\n</round_summary>`);
    }
  }

  // Current round observations kept raw
  // If current round is very long, also apply a sliding window
  let recent: string[];
  if (currentRound.observations.length > RECENT_COUNT) {
    const cutoff = currentRound.observations.length - RECENT_COUNT;
    const oldCurrent = currentRound.observations.slice(0, cutoff);
    const currentSummary = compressRound(oldCurrent);
    if (currentSummary) {
      frozenSummaries.push(
        `<round_summary round="${currentRound.round}" partial="true">\n${currentSummary}\n</round_summary>`,
      );
    }
    recent = currentRound.observations.slice(cutoff);
  } else {
    recent = currentRound.observations;
  }

  return { frozenSummaries, recent };
}

/**
 * Build the full memory prompt with per-round compression.
 * Structure:
 *   1. Frozen per-round summaries (stable prefix → cacheable)
 *   2. Deduction block (semi-stable within a round)
 *   3. Recent observations (dynamic suffix)
 */
export function compressedMemoryPrompt(observations: string[], deductionBlock?: string): string {
  if (!observations.length && !deductionBlock) return '';

  const { frozenSummaries, recent } = compressMemory(observations);
  const recentBlock = recent.length ? recent.map((o) => `- ${o}`).join('\n') : '';

  const parts: string[] = [];

  // Frozen summaries: stable text that never changes once a round completes
  if (frozenSummaries.length) {
    parts.push(`<memory_summary>\n${frozenSummaries.join('\n\n')}\n</memory_summary>`);
  }

  // Deduction analysis (changes per action, but still knowledge)
  if (deductionBlock) parts.push(deductionBlock);

  // Recent observations from current round
  if (recentBlock) {
    const header =
      !frozenSummaries.length && !deductionBlock
        ? 'NHẬT KÝ (những gì mày biết/thấy/nghe)'
        : 'NHẬT KÝ GẦN ĐÂY';
    parts.push(`<recent_observations>\n${header}:\n${recentBlock}\n</recent_observations>`);
  }

  return parts.join('\n\n');
}

// ── Legacy exports for backward compatibility ──

/** @deprecated Use compressMemory() directly */
export { compressMemory as compressMemoryLegacy };
