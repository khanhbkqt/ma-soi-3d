import { useRef, useState, useEffect } from 'react';
import { Phase, GameEventType, Team } from '@ma-soi/shared';
import { useGameStore } from '../../store/gameStore';

/* ──────────────────────────────────────────────────────────────────
 *  NarratorOverlay — Game Master narration between phases
 *  Shows cinematic storytelling text when phases transition,
 *  with typewriter effect and atmospheric styling.
 * ────────────────────────────────────────────────────────────────── */

interface NarrationEntry {
  id: string;
  emoji: string;
  title: string;
  lines: string[]; // typewriter lines
  gradient: [string, string];
  duration: number; // total display time in ms
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
        'Bóng đêm bao trùm ngôi làng.',
        'Dân làng chìm vào giấc ngủ...',
        'Nhưng những con sói đang thức dậy.',
      ],
      gradient: ['#0a0a2a', '#1a2a4a'],
      duration: 4500,
    },
    [`${Phase.Judgement}_${Phase.Night}`]: {
      emoji: '🌙',
      title: 'Đêm Buông',
      lines: [
        'Phán quyết đã xong, ngôi làng chìm vào tĩnh lặng.',
        'Những tiếng bước chân rón rén trong bóng tối...',
        'Đêm nay, sói sẽ lại ra tay.',
      ],
      gradient: ['#0a0a2a', '#1a2a4a'],
      duration: 5000,
    },

    // ── Night → Dawn ──
    [`${Phase.Night}_${Phase.Dawn}`]: {
      emoji: '🌅',
      title: 'Bình Minh',
      lines: [
        'Những tia nắng đầu tiên xuyên qua màn sương.',
        'Dân làng sợ hãi mở cửa nhìn ra...',
        'Đêm qua ai đã ra đi?',
      ],
      gradient: ['#4a2a00', '#ff8c00'],
      duration: 4500,
    },

    // ── First Night (from Lobby) ──
    [`${Phase.Lobby}_${Phase.Night}`]: {
      emoji: '🌙',
      title: 'Đêm Đầu Tiên',
      lines: [
        'Ngôi làng nhỏ chìm vào bóng tối.',
        'Đêm nay, những bí mật bắt đầu được tiết lộ.',
        'Sói mở mắt... và chọn con mồi.',
      ],
      gradient: ['#0a0a2a', '#1a2a4a'],
      duration: 5000,
    },
  };

  const tmpl = scripts[key];
  if (!tmpl) return null;
  return { id, ...tmpl };
}

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
    default:
      return null;
  }
}

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

  // Track special events (GameOver, Execution)
  useEffect(() => {
    if (events.length === 0) return;
    const recent = events.slice(-3);
    for (const e of recent) {
      const key = `narrator_${e.type}_${e.timestamp}`;
      if (processedRef.current.has(key)) continue;
      if (Date.now() - e.timestamp > 5000) continue;
      processedRef.current.add(key);

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

  return (
    <div
      className="narrator-overlay"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 45,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(to bottom, ${current.gradient[0]}dd, ${current.gradient[1]}bb)`,
        opacity,
        transition: 'opacity 0.6s ease-in-out',
        pointerEvents: 'none',
      }}
    >
      {/* Decorative top border */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '40%',
          height: '2px',
          background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.3), transparent)',
        }}
      />

      {/* Narrator label */}
      <div
        style={{
          fontSize: '0.7rem',
          color: 'rgba(255,255,255,0.4)',
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          marginBottom: '1rem',
          fontWeight: 600,
        }}
      >
        ✦ Quản Trò ✦
      </div>

      {/* Emoji */}
      <div
        className="narrator-emoji"
        style={{
          fontSize: '3.5rem',
          marginBottom: '0.75rem',
          filter: 'drop-shadow(0 0 25px rgba(255,255,255,0.3))',
        }}
      >
        {current.emoji}
      </div>

      {/* Title */}
      <div
        style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          color: '#fff',
          textShadow: '0 0 30px rgba(255,255,255,0.3), 0 2px 10px rgba(0,0,0,0.8)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginBottom: '1.2rem',
        }}
      >
        {current.title}
      </div>

      {/* Typewriter narration lines */}
      <div
        style={{
          maxWidth: '600px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}
      >
        {displayedLines.map((line, i) => (
          <div
            key={i}
            style={{
              fontSize: '1rem',
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
              fontSize: '1rem',
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

      {/* Decorative bottom border */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '40%',
          height: '2px',
          background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.3), transparent)',
        }}
      />
    </div>
  );
}
