/**
 * Situation Analyzer — detects game signals and injects contextual hints into prompts.
 *
 * Architecture: Each detector is a method that receives AnalyzerContext and returns
 * Signal[] or null. The analyze() method runs all detectors, filters by action
 * relevance, sorts by priority, and returns top signals.
 */

import { Player, GameState, DayMessage, GameEventType, Role, isWolfRole } from '@ma-soi/shared';
import { RoleDeductionTracker } from './role-deduction.js';

// ── Types ──

export interface Signal {
  id: string;
  priority: number; // higher = more important
  text: string;
}

export type ActionType = 'discuss' | 'vote' | 'defense' | 'judgement' | 'night';

export interface AnalyzerContext {
  player: Player;
  state: GameState;
  messages: DayMessage[];
  observations: string[];
  deduction: RoleDeductionTracker;
  actionType: ActionType;
}

// ── Signal relevance per action type ──

const SIGNAL_RELEVANCE: Record<string, ActionType[]> = {
  vote_pressure: ['discuss', 'defense', 'vote'],
  momentum_shift: ['discuss'],
  endgame: ['discuss', 'vote', 'judgement'],
  role_exposure: ['discuss', 'vote', 'night'],
  silence: ['discuss'],
  relationship_pattern: ['discuss', 'vote'],
  fool_risk: ['judgement', 'vote'],
};

// ── Accusation patterns (reused from role-deduction) ──

const ACCUSE_PATTERNS = [/sói/i, /fake/i, /giả/i, /nói láo/i, /nói xạo/i, /nghi/i, /đáng ngờ/i];

// ── Analyzer ──

export class SituationAnalyzer {
  analyze(ctx: AnalyzerContext): Signal[] {
    const all: Signal[] = [
      ...this.detectVotePressure(ctx),
      ...this.detectMomentumShift(ctx),
      ...this.detectEndgame(ctx),
      ...this.detectRoleExposure(ctx),
      ...this.detectSilence(ctx),
      ...this.detectRelationshipPatterns(ctx),
      ...this.detectFoolRisk(ctx),
    ];

    // Filter by action relevance
    const relevant = all.filter((s) => {
      const allowed = SIGNAL_RELEVANCE[s.id];
      return allowed ? allowed.includes(ctx.actionType) : true;
    });

    // Sort by priority descending, take top 3
    return relevant.sort((a, b) => b.priority - a.priority).slice(0, 3);
  }

  // ── Detectors ──

  private detectVotePressure(ctx: AnalyzerContext): Signal[] {
    const { player, state, deduction } = ctx;
    let pressure = 0;

    // Count dusk votes against this player
    for (const v of state.votes) {
      if (v.targetId === player.id) pressure++;
    }

    // Count accusations from deduction tracker
    const accusers = deduction.accusations.get(player.name);
    if (accusers) pressure = Math.max(pressure, accusers.length);

    if (pressure >= 3) {
      return [
        {
          id: 'vote_pressure',
          priority: 90,
          text: `⚠ MÀY ĐANG BỊ ${pressure} NGƯỜI VOTE/TỐ! Tình huống nguy cấp — phải phản bác hoặc redirect ngay.`,
        },
      ];
    }
    if (pressure >= 2) {
      return [
        {
          id: 'vote_pressure',
          priority: 70,
          text: `Mày đang bị ${pressure} người tố/nghi ngờ. Cân nhắc phản bác hoặc chuyển hướng sự chú ý.`,
        },
      ];
    }
    return [];
  }

  private detectMomentumShift(ctx: AnalyzerContext): Signal[] {
    const { player, state, messages, deduction } = ctx;
    const signals: Signal[] = [];
    const recentMsgs = messages.slice(-8);

    // Negative momentum: ≥2 people accusing player in recent messages
    let negMentions = 0;
    for (const m of recentMsgs) {
      if (m.playerId === player.id) continue;
      if (!m.message.includes(player.name)) continue;
      if (ACCUSE_PATTERNS.some((p) => p.test(m.message))) negMentions++;
    }
    if (negMentions >= 2) {
      signals.push({
        id: 'momentum_shift',
        priority: 75,
        text: `Đám đông đang quay sang tố mày (${negMentions} người nhắc tên mày tiêu cực). Phải hành động ngay.`,
      });
    }

    // Positive momentum: player accused someone confirmed wolf
    const confirmedWolves = new Set(
      [...deduction.confirmed]
        .filter(([, r]) => r.role === 'Sói' || r.role === 'Sói Đầu Đàn' || r.role === 'Sói Con')
        .map(([name]) => name),
    );
    if (confirmedWolves.size > 0) {
      const playerAccused = deduction.accusations;
      for (const wolfName of confirmedWolves) {
        const accusers = playerAccused.get(wolfName);
        if (accusers?.includes(player.name)) {
          signals.push({
            id: 'momentum_shift',
            priority: 50,
            text: `Mày đã tố đúng ${wolfName} là sói — uy tín của mày đang cao. Tận dụng để dẫn dắt.`,
          });
          break;
        }
      }
    }

    return signals;
  }

  private detectEndgame(ctx: AnalyzerContext): Signal[] {
    const { state, deduction } = ctx;
    const alive = state.players.filter((p) => p.alive);
    const aliveCount = alive.length;

    if (aliveCount > 5) return [];

    const signals: Signal[] = [];

    // Count known wolves vs villagers among alive
    const confirmedWolfNames = new Set(
      [...deduction.confirmed]
        .filter(([, r]) => r.role === 'Sói' || r.role === 'Sói Đầu Đàn' || r.role === 'Sói Con')
        .map(([name]) => name),
    );
    const totalWolvesInGame = state.players.filter((p) => isWolfRole(p.role)).length;
    const deadWolves = [...confirmedWolfNames].filter(
      (name) => !state.players.find((p) => p.name === name)?.alive,
    ).length;
    const estimatedAliveWolves = totalWolvesInGame - deadWolves;
    const estimatedAliveVillagers = aliveCount - estimatedAliveWolves;

    signals.push({
      id: 'endgame',
      priority: 85,
      text: `ENDGAME: chỉ còn ${aliveCount} người sống. Mỗi vote quyết định thắng thua!`,
    });

    if (estimatedAliveWolves >= estimatedAliveVillagers - 1 && estimatedAliveWolves > 0) {
      signals.push({
        id: 'endgame',
        priority: 95,
        text: `SÓI SẮP THẮNG (~${estimatedAliveWolves} sói vs ${estimatedAliveVillagers} dân)! Vote sai = thua ngay!`,
      });
    } else if (estimatedAliveWolves <= 1) {
      signals.push({
        id: 'endgame',
        priority: 80,
        text: `Chỉ còn ~${estimatedAliveWolves} sói. Tìm ra và treo cổ nó!`,
      });
    }

    return signals;
  }

  private detectRoleExposure(ctx: AnalyzerContext): Signal[] {
    const { player, deduction } = ctx;
    const signals: Signal[] = [];
    const isWolf = isWolfRole(player.role);

    // Check if Seer has come out
    for (const [claimant, claims] of deduction.claims) {
      for (const c of claims) {
        if (c.role === 'Tiên Tri') {
          if (isWolf) {
            signals.push({
              id: 'role_exposure',
              priority: 80,
              text: `${claimant} đã nhận Tiên Tri — cơ hội cắn hoặc phải counter-claim!`,
            });
          } else {
            signals.push({
              id: 'role_exposure',
              priority: 65,
              text: `${claimant} đã nhận Tiên Tri — cần bảo vệ nếu tin, hoặc verify nếu nghi fake.`,
            });
          }
        }
      }
    }

    // Count total exposed roles
    const exposedCount = deduction.confirmed.size + deduction.claims.size;
    if (exposedCount >= 3 && signals.length === 0) {
      signals.push({
        id: 'role_exposure',
        priority: 55,
        text: `Đã có ${exposedCount} role lộ diện. Thông tin nhiều — phân tích kỹ trước khi hành động.`,
      });
    }

    return signals;
  }

  private detectSilence(ctx: AnalyzerContext): Signal[] {
    const { player, state } = ctx;

    // Count how many discussion rounds player was silent
    // Use discussionMessages grouped by round
    const maxRound = state.config.discussionRounds;
    let silentRounds = 0;
    for (let r = 1; r <= maxRound; r++) {
      const roundMsgs = state.discussionMessages.filter((m) => m.round === r);
      if (roundMsgs.length === 0) continue; // round hasn't happened yet
      const spoke = roundMsgs.some((m) => m.playerId === player.id);
      if (!spoke) silentRounds++;
      else silentRounds = 0; // reset consecutive count
    }

    if (silentRounds >= 2) {
      return [
        {
          id: 'silence',
          priority: 60,
          text: `Mày đã im ${silentRounds} lượt liên tiếp. Dân sẽ nghi mày trốn — phải nói gì đó!`,
        },
      ];
    }
    return [];
  }

  private detectRelationshipPatterns(ctx: AnalyzerContext): Signal[] {
    const { player, state } = ctx;
    const signals: Signal[] = [];

    // Analyze vote history from past events
    const voteEvents = state.events.filter((e) => e.type === GameEventType.VoteCast);
    const playerVotes = new Map<string, string[]>(); // voterId → [targetNames]

    for (const e of voteEvents) {
      const voterId =
        state.players.find((p) => p.name === e.data.voterName)?.id || e.data.voterName;
      const list = playerVotes.get(voterId) || [];
      list.push(e.data.targetName);
      playerVotes.set(voterId, list);
    }

    const myVotes = playerVotes.get(player.id) || [];
    if (myVotes.length < 2) return signals;

    // Check vote correlation with other players
    const alivePlayers = state.players.filter((p) => p.alive && p.id !== player.id);
    for (const other of alivePlayers) {
      const otherVotes = playerVotes.get(other.id) || [];
      if (otherVotes.length < 2) continue;

      let matches = 0;
      const minLen = Math.min(myVotes.length, otherVotes.length);
      for (let i = 0; i < minLen; i++) {
        if (myVotes[i] === otherVotes[i]) matches++;
      }

      if (matches >= 2) {
        signals.push({
          id: 'relationship_pattern',
          priority: 55,
          text: `Mày và ${other.name} đã vote giống nhau ${matches} lần — cẩn thận bị bắt bài cùng phe.`,
        });
        break; // only report strongest correlation
      }
    }

    // Check if player never accused someone that many others accused
    const { accusations } = ctx.deduction;
    for (const [target, accusers] of accusations) {
      if (target === player.name) continue;
      if (accusers.length >= 2 && !accusers.includes(player.name)) {
        const targetAlive = state.players.find((p) => p.name === target && p.alive);
        if (targetAlive) {
          signals.push({
            id: 'relationship_pattern',
            priority: 45,
            text: `Mày chưa bao giờ tố ${target} dù ${accusers.length} người đã tố — dân sẽ để ý.`,
          });
          break;
        }
      }
    }

    return signals;
  }

  private detectFoolRisk(ctx: AnalyzerContext): Signal[] {
    const { state, deduction, actionType } = ctx;
    if (actionType !== 'judgement' && actionType !== 'vote') return [];
    if (!state.players.some((p) => p.role === Role.Fool)) return [];

    // Only relevant when someone is on trial
    const accusedId = state.accusedId;
    if (!accusedId && actionType === 'judgement') return [];

    const accusedName = accusedId ? state.players.find((p) => p.id === accusedId)?.name : undefined;

    // Check if there's hard evidence against the accused
    if (accusedName) {
      const seerResult = deduction.seerResults.get(accusedName);
      if (seerResult === 'wolf') return []; // Seer confirmed wolf — safe to kill
      const confirmed = deduction.confirmed.get(accusedName);
      if (confirmed) return []; // Already dead/confirmed — no risk
    }

    // No hard evidence → Fool risk is real
    if (actionType === 'judgement' && accusedName) {
      return [
        {
          id: 'fool_risk',
          priority: 92,
          text: `🚨 CẢNH BÁO KẺ NGỐC: Không có bằng chứng cứng (Tiên Tri soi, lộ role) rằng ${accusedName} là sói. Kẻ Ngốc chơi giống sói — nếu treo nhầm Kẻ Ngốc, TẤT CẢ THUA NGAY. Khi không chắc → vote THA.`,
        },
      ];
    }

    return [];
  }
}

/** Format signals into injectable prompt block */
export function formatSignals(signals: Signal[]): string {
  if (!signals.length) return '';
  const lines = signals.map((s) => `- ${s.text}`).join('\n');
  return `TÌNH HUỐNG HIỆN TẠI:\n${lines}`;
}
