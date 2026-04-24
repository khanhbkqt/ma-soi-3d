import { useState, useEffect, useRef } from 'react';
import { Phase, GameEventType } from '@ma-soi/shared';
import { useGameStore } from '../../store/gameStore';

/* ──────────────────────────────────────────────────────────────────
 *  DiscussionCountdown — Shows remaining time during Day (discussion) phase
 *  Tracks time based on when the Day phase started (PhaseChanged event timestamp)
 *  and counts down from config.discussionTimeLimitMs.
 * ────────────────────────────────────────────────────────────────── */

export default function DiscussionCountdown() {
  const gameState = useGameStore((s) => s.gameState);
  const events = useGameStore((s) => s.events);
  const phase = gameState?.phase;
  const timeLimitMs = gameState?.config.discussionTimeLimitMs ?? 90_000;

  const [remaining, setRemaining] = useState<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Find when the Day phase started
  useEffect(() => {
    if (phase !== Phase.Day) {
      setRemaining(null);
      startTimeRef.current = null;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Find the most recent PhaseChanged event for the Day phase
    const dayPhaseEvent = [...events]
      .reverse()
      .find((e) => e.type === GameEventType.PhaseChanged && e.data.phase === Phase.Day);

    const startTime = dayPhaseEvent?.timestamp ?? Date.now();
    startTimeRef.current = startTime;

    const update = () => {
      const elapsed = Date.now() - startTime;
      const left = Math.max(0, timeLimitMs - elapsed);
      setRemaining(left);
    };

    update();
    intervalRef.current = setInterval(update, 100);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [phase, timeLimitMs, events.length]);

  if (phase !== Phase.Day || remaining === null) return null;

  const totalSeconds = Math.ceil(remaining / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const progress = remaining / timeLimitMs;
  const isLow = remaining < 15_000;
  const isCritical = remaining < 5_000;

  // Color transitions
  const barColor = isCritical ? '#ef4444' : isLow ? '#f59e0b' : '#3b82f6';
  const textColor = isCritical ? 'text-red-400' : isLow ? 'text-amber-400' : 'text-blue-300';
  const glowColor = isCritical
    ? 'rgba(239, 68, 68, 0.4)'
    : isLow
      ? 'rgba(245, 158, 11, 0.3)'
      : 'rgba(59, 130, 246, 0.2)';

  return (
    <div
      className="discussion-countdown"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 12px',
      }}
    >
      {/* Timer display */}
      <div className="flex items-center gap-2">
        <span
          className={`text-xs font-medium ${textColor} transition-colors duration-300`}
          style={{
            textShadow: `0 0 8px ${glowColor}`,
          }}
        >
          ⏱️
        </span>
        <span
          className={`font-mono text-sm font-bold ${textColor} transition-colors duration-300 ${isCritical ? 'countdown-critical-pulse' : ''}`}
          style={{
            textShadow: `0 0 10px ${glowColor}`,
            minWidth: '3.5em',
            textAlign: 'center',
          }}
        >
          {minutes}:{seconds.toString().padStart(2, '0')}
        </span>
      </div>

      {/* Progress bar */}
      <div
        style={{
          width: '80px',
          height: '3px',
          borderRadius: '2px',
          background: 'rgba(255,255,255,0.1)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${progress * 100}%`,
            height: '100%',
            borderRadius: '2px',
            background: barColor,
            boxShadow: `0 0 6px ${glowColor}`,
            transition: 'width 0.1s linear, background 0.5s ease',
          }}
        />
      </div>
    </div>
  );
}
