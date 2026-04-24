import { useRef, useState, useEffect } from 'react';
import { Phase, GameEventType, Team } from '@ma-soi/shared';
import { useGameStore } from '../../store/gameStore';

/* ──────────────────────────────────────────────────────────────────
 *  NarratorOverlay — Game Master narration between phases
 *  Shows cinematic storytelling text when phases transition,
 *  with typewriter effect and atmospheric styling.
 *  Also narrates night sub-phases like a real quản trò:
 *  Guard, Wolves, Witch, Seer each get their own narration.
 * ────────────────────────────────────────────────────────────────── */

interface NarrationEntry {
  id: string;
  emoji: string;
  title: string;
  lines: string[]; // typewriter lines
  gradient: [string, string];
  duration: number; // total display time in ms
  small?: boolean; // smaller overlay for sub-phase narrations
}

/* ── Narration scripts per phase transition ── */

function getPhaseNarration(
  from: Phase | undefined,
  to: Phase,
  round: number,
  playerCount: number,
  aliveCount: number,
): NarrationEntry | null {
  const key = `${from ?? Phase.Lobby}_${to}`;
  const id = `narrator_${key}_r${round}_${Date.now()}`;

  const scripts: Record<string, Omit<NarrationEntry, 'id'>> = {
    // ── Game Start → First Day ──
    [`${Phase.Lobby}_${Phase.Day}`]: {
      emoji: '🐺',
      title: 'Trò Chơi Bắt Đầu',
      lines: [
        `${playerCount} người chơi quây quần bên bếp lửa...`,
        'Trong số họ, có những con sói đội lốt cừu.',
        'Ai sẽ sống? Ai sẽ chết? Cuộc chơi bắt đầu!',
      ],
      gradient: ['#1a0a2a', '#3a1a5a'],
      duration: 6000,
    },

    // ── Day (Discussion) ──
    [`${Phase.Dawn}_${Phase.Day}`]: {
      emoji: '☀️',
      title: 'Ban Ngày — Thảo Luận',
      lines:
        round <= 2
          ? [
              'Mặt trời lên cao, dân làng quây quần bàn bạc.',
              'Ai đáng ngờ? Ai đang nói dối?',
              'Hãy lắng nghe từng lời... vì kẻ phản bội ở ngay bên cạnh.',
            ]
          : [
              `Vòng ${round} — Cuộc chiến ngày càng khốc liệt.`,
              `Chỉ còn ${aliveCount} người sống sót.`,
              'Mỗi lời nói giờ đều có thể là lời cuối cùng...',
            ],
      gradient: ['#2a3a5a', '#4488cc'],
      duration: 5000,
    },

    // ── Day → Dusk (Voting) ──
    [`${Phase.Day}_${Phase.Dusk}`]: {
      emoji: '🌇',
      title: 'Hoàng Hôn — Bỏ Phiếu',
      lines: [
        'Mặt trời lặn dần, bóng tối phủ xuống ngôi làng.',
        'Đã đến lúc chọn ra kẻ tình nghi.',
        'Ai sẽ bị đưa lên giàn xử tội?',
      ],
      gradient: ['#5a2a00', '#cc6600'],
      duration: 4500,
    },

    // ── Dusk → Judgement ──
    [`${Phase.Dusk}_${Phase.Judgement}`]: {
      emoji: '⚖️',
      title: 'Phán Xét',
      lines: [
        'Bị cáo bước lên giàn, đối mặt với dân làng.',
        'Một cơ hội biện hộ trước khi phán quyết.',
        'GIẾT hay THA — số phận nằm trong tay các bạn!',
      ],
      gradient: ['#3a0a0a', '#8a2222'],
      duration: 5000,
    },

    // ── Dusk/Judgement → Night ──
    [`${Phase.Dusk}_${Phase.Night}`]: {
      emoji: '🌙',
      title: 'Đêm Buông',
      lines: [
        'Trời tối rồi, mọi người nhắm mắt lại.',
        'Tất cả đi ngủ...',
        'Đêm nay, ai sẽ bị lấy đi mạng sống?',
      ],
      gradient: ['#0a0a2a', '#1a2a4a'],
      duration: 4500,
    },
    [`${Phase.Judgement}_${Phase.Night}`]: {
      emoji: '🌙',
      title: 'Đêm Buông',
      lines: [
        'Phán quyết đã xong. Trời tối rồi, mọi người nhắm mắt lại.',
        'Ngôi làng chìm vào giấc ngủ...',
        'Nhưng có những kẻ... không ngủ đêm nay.',
      ],
      gradient: ['#0a0a2a', '#1a2a4a'],
      duration: 5000,
    },

    // ── Night → Dawn ──
    [`${Phase.Night}_${Phase.Dawn}`]: {
      emoji: '🌅',
      title: 'Bình Minh',
      lines: [
        'Trời sáng rồi, mọi người mở mắt ra.',
        'Dân làng sợ hãi nhìn quanh...',
        'Đêm qua, ai đã không còn thức dậy?',
      ],
      gradient: ['#4a2a00', '#ff8c00'],
      duration: 4500,
    },

    // ── First Night (from Lobby) ──
    [`${Phase.Lobby}_${Phase.Night}`]: {
      emoji: '🌙',
      title: 'Đêm Đầu Tiên',
      lines: [
        'Trời tối rồi, mọi người nhắm mắt lại đi!',
        'Đêm nay, những bí mật bắt đầu được tiết lộ...',
        'Và có kẻ sẽ không bao giờ tỉnh dậy.',
      ],
      gradient: ['#0a0a2a', '#1a2a4a'],
      duration: 5000,
    },
  };

  const tmpl = scripts[key];
  if (!tmpl) return null;
  return { id, ...tmpl };
}

/* ── Night sub-phase narrations (quản trò style) ── */

function getNightActionNarration(type: GameEventType, data: any): NarrationEntry | null {
  const id = `narrator_night_${type}_${Date.now()}`;

  switch (type) {
    case GameEventType.GuardProtect:
      return {
        id,
        emoji: '🛡️',
        title: 'Bảo Vệ',
        lines: [
          'Bảo vệ ơi, thức dậy đi!',
          'Đêm nay bạn muốn bảo vệ ai?',
          `Bảo vệ đã chọn... ${data.targetName}.`,
          'Bảo vệ nhắm mắt lại.',
        ],
        gradient: ['#0a2a1a', '#1a4a3a'],
        duration: 4000,
        small: true,
      };

    case GameEventType.NightActionPerformed:
      if (data.action === 'wolf_kill') {
        return {
          id,
          emoji: '🐺',
          title: 'Sói Thức Dậy',
          lines: [
            'Sói ơi, mở mắt ra!',
            'Đêm nay các bạn muốn cắn ai?',
            `Sói đã chọn con mồi... ${data.targetName}.`,
            'Sói nhắm mắt lại.',
          ],
          gradient: ['#1a0a0a', '#3a1a2a'],
          duration: 4000,
          small: true,
        };
      }
      if (data.action === 'wolf_double_kill') {
        const names = (data.targetNames || []).join(' và ');
        return {
          id,
          emoji: '🐺💀',
          title: 'Sói Báo Thù',
          lines: [
            'Sói ơi, mở mắt ra!',
            'Sói con đã chết — đêm nay các bạn được cắn 2 người!',
            `Sói chọn: ${names}.`,
            'Sói nhắm mắt lại.',
          ],
          gradient: ['#2a0a0a', '#5a1a2a'],
          duration: 4500,
          small: true,
        };
      }
      return null;

    case GameEventType.AlphaInfect:
      return {
        id,
        emoji: '🐺👑',
        title: 'Sói Đầu Đàn',
        lines: [
          'Sói Đầu Đàn quyết định dùng sức mạnh đặc biệt...',
          `${data.targetName} đã bị lây nhiễm thành Sói!`,
          'Từ nay, hàng ngũ sói thêm một thành viên mới.',
        ],
        gradient: ['#2a0a1a', '#4a1a3a'],
        duration: 4000,
        small: true,
      };

    case GameEventType.WitchAction:
      if (data.action === 'heal') {
        return {
          id,
          emoji: '🧪',
          title: 'Phù Thủy',
          lines: [
            'Phù thủy ơi, thức dậy đi!',
            `Đêm nay ${data.targetName} bị sói cắn.`,
            'Bạn có muốn dùng thuốc cứu không?',
            'Phù thủy đã dùng thuốc cứu!',
            'Phù thủy nhắm mắt lại.',
          ],
          gradient: ['#1a0a2a', '#2a1a4a'],
          duration: 4500,
          small: true,
        };
      }
      if (data.action === 'kill') {
        return {
          id,
          emoji: '🧪☠️',
          title: 'Phù Thủy',
          lines: [
            'Phù thủy ơi, thức dậy đi!',
            'Bạn có muốn dùng thuốc độc không?',
            `Phù thủy đã đầu độc ${data.targetName}!`,
            'Phù thủy nhắm mắt lại.',
          ],
          gradient: ['#2a0a2a', '#4a1a4a'],
          duration: 4000,
          small: true,
        };
      }
      return null;

    case GameEventType.SeerResult:
      return {
        id,
        emoji: '🔮',
        title: 'Tiên Tri',
        lines: [
          'Tiên tri ơi, mở mắt ra!',
          'Đêm nay bạn muốn soi ai?',
          `Tiên tri soi ${data.targetName}...`,
          data.isWolf ? `${data.targetName} LÀ SÓI! 🐺` : `${data.targetName} KHÔNG phải sói ✓`,
          'Tiên tri nhắm mắt lại.',
        ],
        gradient: ['#0a1a2a', '#1a2a5a'],
        duration: 4500,
        small: true,
      };

    case GameEventType.CupidPair:
      return {
        id,
        emoji: '💘',
        title: 'Thần Tình Yêu',
        lines: [
          'Thần Tình Yêu thức dậy!',
          'Hãy chọn hai người để ghép đôi...',
          `${data.player1Name} và ${data.player2Name} đã trở thành đôi tình nhân!`,
          'Nếu một người chết, người kia cũng sẽ chết theo.',
        ],
        gradient: ['#2a0a2a', '#5a1a4a'],
        duration: 4500,
        small: true,
      };

    default:
      return null;
  }
}

/* ── Event-based narrations (GameOver, Execution, Deaths, etc.) ── */

function getEventNarration(type: GameEventType, data: any): NarrationEntry | null {
  const id = `narrator_event_${type}_${Date.now()}`;

  switch (type) {
    case GameEventType.GameOver: {
      const teamMap: Record<string, string> = {
        [Team.Wolf]: '🐺 Phe Sói',
        [Team.Village]: '🏘️ Dân Làng',
        [Team.Lovers]: '💕 Đôi Tình Nhân',
        Fool: '🃏 Kẻ Ngốc',
      };
      const winnerName = teamMap[data.winner] || data.winner;
      return {
        id,
        emoji: '🏆',
        title: `${winnerName} Chiến Thắng!`,
        lines: [
          'Cuộc chiến đã kết thúc.',
          `${winnerName} đã giành chiến thắng!`,
          'Cảm ơn các bạn đã tham gia trò chơi.',
        ],
        gradient: ['#2a1a00', '#aa8800'],
        duration: 7000,
      };
    }
    case GameEventType.JudgementResult:
      if (data.executed) {
        return {
          id,
          emoji: '⚰️',
          title: 'Hành Hình',
          lines: [`${data.accusedName} đã bị đa số bỏ phiếu giết.`, 'Dân làng kéo họ lên giàn...'],
          gradient: ['#3a0a0a', '#6a1a1a'],
          duration: 4000,
        };
      }
      return null;

    case GameEventType.PlayerDied: {
      const causeMap: Record<string, string> = {
        wolf_kill: 'bị sói cắn chết',
        witch_kill: 'bị đầu độc',
        hunter_shot: 'bị Thợ Săn bắn',
        lover_death: 'chết theo người yêu',
        judged: 'bị treo cổ',
      };
      const causeText = causeMap[data.cause] || 'đã ra đi';
      return {
        id,
        emoji: '💀',
        title: `${data.playerName} Đã Chết`,
        lines: [`${data.playerName} đã ${causeText}.`],
        gradient: ['#1a1a1a', '#3a3a3a'],
        duration: 3500,
        small: true,
      };
    }

    case GameEventType.HunterShot:
      return {
        id,
        emoji: '🏹',
        title: 'Thợ Săn Nổ Súng!',
        lines: [
          'Thợ Săn trước khi chết được bắn 1 người!',
          `Thợ Săn giơ súng... BẮN! ${data.targetName} trúng đạn!`,
        ],
        gradient: ['#3a2a0a', '#6a4a1a'],
        duration: 4000,
        small: true,
      };

    case GameEventType.LoverDeath:
      return {
        id,
        emoji: '💔',
        title: 'Tình Nhân Chết Theo',
        lines: [
          `${data.deadName} đã chết...`,
          `${data.loverName} không thể sống thiếu người yêu, cũng chết theo!`,
        ],
        gradient: ['#2a0a1a', '#5a1a3a'],
        duration: 4000,
        small: true,
      };

    case GameEventType.FoolVictory:
      return {
        id,
        emoji: '🃏',
        title: 'Kẻ Ngốc Chiến Thắng!',
        lines: [
          `${data.foolName} bị treo cổ...`,
          'Nhưng khoan — đó là KẺ NGỐC!',
          'Kẻ Ngốc chỉ cần bị treo cổ để thắng. GG!',
        ],
        gradient: ['#2a1a3a', '#6a3a8a'],
        duration: 5000,
      };

    case GameEventType.DawnAnnouncement:
      if (data.peaceful) {
        return {
          id,
          emoji: '🕊️',
          title: 'Đêm Bình Yên',
          lines: ['Mặt trời lên... và không ai bị hại đêm qua!', 'Một đêm bình yên hiếm hoi.'],
          gradient: ['#2a4a2a', '#4a8a4a'],
          duration: 3500,
          small: true,
        };
      }
      return null;

    default:
      return null;
  }
}

/* ── Night sub-phase event types that trigger narrator ── */
const NIGHT_ACTION_EVENTS = new Set([
  GameEventType.GuardProtect,
  GameEventType.NightActionPerformed,
  GameEventType.AlphaInfect,
  GameEventType.WitchAction,
  GameEventType.SeerResult,
  GameEventType.CupidPair,
]);

/* ── Typewriter hook ── */
function useTypewriter(lines: string[], speed = 35) {
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [currentLine, setCurrentLine] = useState(0);
  const [currentChar, setCurrentChar] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayedLines([]);
    setCurrentLine(0);
    setCurrentChar(0);
    setDone(false);
  }, [lines]);

  useEffect(() => {
    if (done || currentLine >= lines.length) {
      setDone(true);
      return;
    }

    const line = lines[currentLine];
    if (currentChar >= line.length) {
      // Move to next line
      setDisplayedLines((prev) => [...prev, line]);
      setCurrentLine((l) => l + 1);
      setCurrentChar(0);
      return;
    }

    const timer = setTimeout(() => {
      setCurrentChar((c) => c + 1);
    }, speed);
    return () => clearTimeout(timer);
  }, [currentLine, currentChar, lines, speed, done]);

  const partialLine = currentLine < lines.length ? lines[currentLine].slice(0, currentChar) : '';

  return { displayedLines, partialLine, done, currentLine };
}

export default function NarratorOverlay() {
  const events = useGameStore((s) => s.events);
  const gameState = useGameStore((s) => s.gameState);
  const phase = gameState?.phase;

  const [queue, setQueue] = useState<NarrationEntry[]>([]);
  const [current, setCurrent] = useState<NarrationEntry | null>(null);
  const [opacity, setOpacity] = useState(0);
  const processedRef = useRef(new Set<string>());
  const prevPhaseRef = useRef<Phase | undefined>(undefined);

  const { displayedLines, partialLine, done } = useTypewriter(current?.lines ?? [], 30);

  // Track phase transitions
  useEffect(() => {
    if (!phase || phase === prevPhaseRef.current) return;
    const from = prevPhaseRef.current;
    prevPhaseRef.current = phase;

    const round = gameState?.round ?? 1;
    const playerCount = gameState?.players.length ?? 0;
    const aliveCount = gameState?.players.filter((p) => p.alive).length ?? 0;

    const entry = getPhaseNarration(from, phase, round, playerCount, aliveCount);
    if (entry && !processedRef.current.has(entry.id)) {
      processedRef.current.add(entry.id);
      setQueue((q) => [...q, entry]);
    }
  }, [phase]);

  // Track night sub-phase events + special events (GameOver, Execution, Deaths, etc.)
  useEffect(() => {
    if (events.length === 0) return;
    const recent = events.slice(-5);
    for (const e of recent) {
      const key = `narrator_${e.type}_${e.timestamp}`;
      if (processedRef.current.has(key)) continue;
      if (Date.now() - e.timestamp > 5000) continue;
      processedRef.current.add(key);

      // Night sub-phase narrations (god-view only events)
      if (NIGHT_ACTION_EVENTS.has(e.type)) {
        const entry = getNightActionNarration(e.type, e.data);
        if (entry) setQueue((q) => [...q, entry]);
        continue;
      }

      // General event narrations
      const entry = getEventNarration(e.type, e.data);
      if (entry) setQueue((q) => [...q, entry]);
    }
    if (processedRef.current.size > 100) {
      processedRef.current = new Set(Array.from(processedRef.current).slice(-50));
    }
  }, [events.length]);

  // Dequeue
  useEffect(() => {
    if (!current && queue.length > 0) {
      setCurrent(queue[0]);
      setQueue((q) => q.slice(1));
      setOpacity(0);
    }
  }, [current, queue.length]);

  // Animate lifecycle
  useEffect(() => {
    if (!current) return;
    const fadeInTimer = setTimeout(() => setOpacity(1), 50);
    const fadeOutTimer = setTimeout(() => setOpacity(0), current.duration - 600);
    const removeTimer = setTimeout(() => setCurrent(null), current.duration);
    return () => {
      clearTimeout(fadeInTimer);
      clearTimeout(fadeOutTimer);
      clearTimeout(removeTimer);
    };
  }, [current?.id]);

  if (!current) return null;

  const isSmall = current.small;

  return (
    <div
      className="narrator-overlay"
      style={{
        position: 'absolute',
        inset: isSmall ? undefined : 0,
        ...(isSmall
          ? {
              bottom: '20%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 'auto',
              maxWidth: '500px',
              minWidth: '320px',
              borderRadius: '16px',
              padding: '1.2rem 2rem',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 60px rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.08)',
            }
          : {}),
        zIndex: 45,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: isSmall
          ? `linear-gradient(135deg, ${current.gradient[0]}ee, ${current.gradient[1]}dd)`
          : `linear-gradient(to bottom, ${current.gradient[0]}dd, ${current.gradient[1]}bb)`,
        backdropFilter: isSmall ? 'blur(12px)' : undefined,
        opacity,
        transition: 'opacity 0.6s ease-in-out',
        pointerEvents: 'none',
      }}
    >
      {/* Decorative top border (full-screen only) */}
      {!isSmall && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '40%',
            height: '2px',
            background:
              'linear-gradient(to right, transparent, rgba(255,255,255,0.3), transparent)',
          }}
        />
      )}

      {/* Narrator label */}
      <div
        style={{
          fontSize: isSmall ? '0.6rem' : '0.7rem',
          color: 'rgba(255,255,255,0.4)',
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          marginBottom: isSmall ? '0.5rem' : '1rem',
          fontWeight: 600,
        }}
      >
        ✦ Quản Trò ✦
      </div>

      {/* Emoji */}
      <div
        className="narrator-emoji"
        style={{
          fontSize: isSmall ? '2rem' : '3.5rem',
          marginBottom: isSmall ? '0.4rem' : '0.75rem',
          filter: 'drop-shadow(0 0 25px rgba(255,255,255,0.3))',
        }}
      >
        {current.emoji}
      </div>

      {/* Title */}
      <div
        style={{
          fontSize: isSmall ? '1.2rem' : '2rem',
          fontWeight: 'bold',
          color: '#fff',
          textShadow: '0 0 30px rgba(255,255,255,0.3), 0 2px 10px rgba(0,0,0,0.8)',
          letterSpacing: isSmall ? '0.08em' : '0.12em',
          textTransform: 'uppercase',
          marginBottom: isSmall ? '0.6rem' : '1.2rem',
        }}
      >
        {current.title}
      </div>

      {/* Typewriter narration lines */}
      <div
        style={{
          maxWidth: isSmall ? '420px' : '600px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          gap: isSmall ? '0.3rem' : '0.5rem',
        }}
      >
        {displayedLines.map((line, i) => (
          <div
            key={i}
            style={{
              fontSize: isSmall ? '0.85rem' : '1rem',
              color: 'rgba(255,255,255,0.8)',
              textShadow: '0 1px 6px rgba(0,0,0,0.5)',
              lineHeight: 1.6,
              fontStyle: 'italic',
            }}
          >
            {line}
          </div>
        ))}
        {partialLine && (
          <div
            style={{
              fontSize: isSmall ? '0.85rem' : '1rem',
              color: 'rgba(255,255,255,0.8)',
              textShadow: '0 1px 6px rgba(0,0,0,0.5)',
              lineHeight: 1.6,
              fontStyle: 'italic',
            }}
          >
            {partialLine}
            <span className="narrator-cursor">|</span>
          </div>
        )}
      </div>

      {/* Decorative bottom border (full-screen only) */}
      {!isSmall && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '40%',
            height: '2px',
            background:
              'linear-gradient(to right, transparent, rgba(255,255,255,0.3), transparent)',
          }}
        />
      )}
    </div>
  );
}
