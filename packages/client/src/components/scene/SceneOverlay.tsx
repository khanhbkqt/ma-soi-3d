import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { Phase, GameEventType, Team } from '@ma-soi/shared';
import { useGameStore } from '../../store/gameStore';

interface OverlayEntry {
  id: string;
  emoji: string;
  text: string;
  sub?: string;
  gradient: [string, string]; // top, bottom colors
}

const PHASE_OVERLAYS: Record<string, Omit<OverlayEntry, 'id'>> = {
  [`${Phase.Night}_${Phase.Dawn}`]:  { emoji: '🌅', text: 'Bình Minh', sub: 'Mặt trời lên...', gradient: ['#ff8c00', '#ffcc44'] },
  [`${Phase.Dawn}_${Phase.Day}`]:    { emoji: '☀️', text: 'Ban Ngày', sub: 'Thảo luận bắt đầu', gradient: ['#4488cc', '#88ccff'] },
  [`${Phase.Day}_${Phase.Dusk}`]:    { emoji: '🌇', text: 'Hoàng Hôn', sub: 'Bỏ phiếu đề cử...', gradient: ['#cc4400', '#ff6622'] },
  [`${Phase.Dusk}_${Phase.Judgement}`]: { emoji: '⚖️', text: 'Phán Xét', sub: 'Ai sẽ bị treo cổ?', gradient: ['#aa2222', '#cc4444'] },
  [`${Phase.Dusk}_${Phase.Night}`]:  { emoji: '🌙', text: 'Đêm Buông', sub: 'Sói thức dậy...', gradient: ['#1a1a3a', '#334466'] },
  [`${Phase.Judgement}_${Phase.Night}`]: { emoji: '🌙', text: 'Đêm Buông', sub: 'Sói thức dậy...', gradient: ['#1a1a3a', '#334466'] },
};

const TEAM_NAMES: Record<string, string> = {
  [Team.Wolf]: 'Phe Sói',
  [Team.Village]: 'Dân Làng',
  [Team.Lovers]: 'Đôi Tình Nhân',
  Fool: 'Kẻ Ngốc',
};

export default function SceneOverlay() {
  const events = useGameStore(s => s.events);
  const phase = useGameStore(s => s.gameState?.phase);
  const [queue, setQueue] = useState<OverlayEntry[]>([]);
  const [current, setCurrent] = useState<OverlayEntry | null>(null);
  const [opacity, setOpacity] = useState(0);
  const phaseRef = useRef(0); // 0=idle, 1=fadeIn, 2=hold, 3=fadeOut
  const timerRef = useRef(0);
  const processedRef = useRef(new Set<string>());
  const prevPhaseRef = useRef<Phase | undefined>(undefined);

  // Track phase transitions
  useEffect(() => {
    if (!phase || phase === prevPhaseRef.current) return;
    const from = prevPhaseRef.current;
    prevPhaseRef.current = phase;
    if (!from) return;
    const phaseKey = `${from}_${phase}`;
    const tmpl = PHASE_OVERLAYS[phaseKey];
    if (tmpl) {
      const key = `phase_${phaseKey}_${Date.now()}`;
      if (!processedRef.current.has(key)) {
        processedRef.current.add(key);
        setQueue(q => [...q, { id: key, ...tmpl }]);
      }
    }
  }, [phase]);

  // Listen for non-phase events
  useEffect(() => {
    if (events.length === 0) return;
    const recent = events.slice(-5);
    for (const e of recent) {
      const key = `${e.type}_${e.timestamp}`;
      if (processedRef.current.has(key)) continue;
      if (Date.now() - e.timestamp > 3000) continue;
      processedRef.current.add(key);

      let entry: OverlayEntry | null = null;

      if (e.type === GameEventType.GameStarted) {
        entry = { id: key, emoji: '🐺', text: 'Trò Chơi Bắt Đầu', sub: 'Ma Sói 3D', gradient: ['#1a0a2a', '#3a1a5a'] };
      } else if (e.type === GameEventType.JudgementResult && e.data.executed) {
        entry = { id: key, emoji: '⚖️', text: 'Hành Hình', sub: `${e.data.accusedName} đã bị treo cổ`, gradient: ['#5a0a0a', '#aa2222'] };
      } else if (e.type === GameEventType.PlayerDied) {
        entry = { id: key, emoji: '💀', text: `${e.data.playerName} Đã Chết`, sub: e.data.cause === 'wolf_kill' ? 'Bị sói cắn' : e.data.cause === 'witch_kill' ? 'Bị đầu độc' : 'Đã ra đi', gradient: ['#1a1a1a', '#3a3a3a'] };
      } else if (e.type === GameEventType.GameOver) {
        const winnerName = TEAM_NAMES[e.data.winner] || e.data.winner;
        entry = { id: key, emoji: '🏆', text: `${winnerName} Chiến Thắng!`, gradient: ['#2a1a00', '#aa8800'] };
      }

      if (entry) setQueue(q => [...q, entry!]);
    }
    if (processedRef.current.size > 100) {
      processedRef.current = new Set(Array.from(processedRef.current).slice(-50));
    }
  }, [events.length]);

  // Dequeue
  useEffect(() => {
    if (!current && queue.length > 0) {
      setCurrent(queue[0]);
      setQueue(q => q.slice(1));
      phaseRef.current = 1;
      timerRef.current = 0;
      setOpacity(0);
    }
  }, [current, queue.length]);

  useFrame((_, dt) => {
    if (!current) return;
    timerRef.current += dt;

    if (phaseRef.current === 1) { // fade in
      setOpacity(o => Math.min(1, o + dt * 2.5));
      if (timerRef.current > 0.5) { phaseRef.current = 2; timerRef.current = 0; }
    } else if (phaseRef.current === 2) { // hold
      if (timerRef.current > 2) { phaseRef.current = 3; timerRef.current = 0; }
    } else if (phaseRef.current === 3) { // fade out
      setOpacity(o => Math.max(0, o - dt * 2.5));
      if (timerRef.current > 0.5) {
        phaseRef.current = 0;
        setCurrent(null);
        setOpacity(0);
      }
    }
  });

  if (!current || opacity <= 0.01) return null;

  return (
    <Html fullscreen style={{ pointerEvents: 'none', zIndex: 1000 }}>
      <div
        style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: `linear-gradient(to bottom, ${current.gradient[0]}ee, ${current.gradient[1]}cc)`,
          opacity,
          transition: 'none',
        }}
      >
        <div style={{ fontSize: '4rem', marginBottom: '0.5rem', filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.3))' }}>
          {current.emoji}
        </div>
        <div style={{
          fontSize: '2.5rem', fontWeight: 'bold', color: '#fff',
          textShadow: '0 0 30px rgba(255,255,255,0.4), 0 2px 10px rgba(0,0,0,0.8)',
          letterSpacing: '0.15em', textTransform: 'uppercase',
        }}>
          {current.text}
        </div>
        {current.sub && (
          <div style={{
            fontSize: '1rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.5rem',
            textShadow: '0 1px 5px rgba(0,0,0,0.6)', letterSpacing: '0.05em',
          }}>
            {current.sub}
          </div>
        )}
      </div>
    </Html>
  );
}
