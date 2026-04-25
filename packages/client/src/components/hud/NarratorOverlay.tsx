import { useState, useEffect } from 'react';
import { GameEventType, NarratorAnnouncementData } from '@ma-soi/shared';
import { useGameStore } from '../../store/gameStore';

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
      setDisplayedLines((prev) => [...prev, line]);
      setCurrentLine((l) => l + 1);
      setCurrentChar(0);
      return;
    }

    const timer = setTimeout(() => setCurrentChar((c) => c + 1), speed);
    return () => clearTimeout(timer);
  }, [currentLine, currentChar, lines, speed, done]);

  const partialLine = currentLine < lines.length ? lines[currentLine].slice(0, currentChar) : '';
  return { displayedLines, partialLine, done, currentLine };
}

/* ── NarratorOverlay ── */
export default function NarratorOverlay() {
  const lastEvent = useGameStore((s) => s.lastEvent);

  const [queue, setQueue] = useState<NarratorAnnouncementData[]>([]);
  const [current, setCurrent] = useState<NarratorAnnouncementData | null>(null);
  const [opacity, setOpacity] = useState(0);
  const [processedIds] = useState(() => new Set<string>());

  const { displayedLines, partialLine } = useTypewriter(current?.lines ?? [], 30);

  // React to server narrator events
  useEffect(() => {
    if (!lastEvent) return;

    if (lastEvent.type === GameEventType.NarratorAnnouncement) {
      const data = lastEvent.data as NarratorAnnouncementData;
      if (processedIds.has(data.id)) return;
      processedIds.add(data.id);
      if (processedIds.size > 100) {
        const arr = Array.from(processedIds);
        for (let i = 0; i < arr.length - 50; i++) processedIds.delete(arr[i]);
      }
      setQueue((q) => [...q, data]);
    }

    if (lastEvent.type === GameEventType.NarratorDismiss) {
      // Fade out current immediately
      setOpacity(0);
      setTimeout(() => setCurrent(null), 600);
    }
  }, [lastEvent]);

  // Dequeue
  useEffect(() => {
    if (!current && queue.length > 0) {
      setCurrent(queue[0]);
      setQueue((q) => q.slice(1));
      setOpacity(0);
    }
  }, [current, queue.length]);

  // Fade in on new current; auto-dismiss after duration as fallback
  useEffect(() => {
    if (!current) return;
    const fadeInTimer = setTimeout(() => setOpacity(1), 50);
    const fallbackTimer = setTimeout(() => {
      setOpacity(0);
      setTimeout(() => setCurrent(null), 600);
    }, current.duration);
    return () => {
      clearTimeout(fadeInTimer);
      clearTimeout(fallbackTimer);
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
