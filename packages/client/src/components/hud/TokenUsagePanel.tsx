import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';

function fmt(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

function pct(part: number, whole: number) {
  if (whole === 0) return '0%';
  return `${Math.round((part / whole) * 100)}%`;
}

export default function TokenUsagePanel() {
  const [expanded, setExpanded] = useState(false);
  const tokenUsage = useGameStore((s) => s.tokenUsage);
  if (!tokenUsage) return null;

  const { total, perPlayer } = tokenUsage;
  const hasCached = total.cachedTokens > 0;

  return (
    <div className="pointer-events-auto">
      <div
        className="flex items-center justify-between px-3 py-1.5 cursor-pointer hover:bg-white/5 transition-colors border-t border-gray-700/30"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="text-[10px] text-gray-500 font-medium flex items-center gap-2">
          <span>🔢 {fmt(total.totalTokens)}</span>
          <span className="text-gray-600">·</span>
          <span className="text-blue-400/70">↑{fmt(total.promptTokens)}</span>
          <span className="text-emerald-400/70">↓{fmt(total.completionTokens)}</span>
          {hasCached && <span className="text-amber-400/70">⚡{fmt(total.cachedTokens)}</span>}
          <span className="text-gray-600">· {total.callCount} calls</span>
        </div>
        <div className="text-[10px] text-gray-500">{expanded ? '▼' : '▲'}</div>
      </div>
      {expanded && (
        <div className="px-3 pb-2 space-y-1.5 max-h-[250px] overflow-y-auto">
          {/* Summary row */}
          <div className="text-[10px] text-gray-400 flex justify-between gap-3">
            <span>
              Input: <span className="text-blue-300">{fmt(total.promptTokens)}</span>
            </span>
            <span>
              Output: <span className="text-emerald-300">{fmt(total.completionTokens)}</span>
            </span>
            {hasCached && (
              <span>
                Cached: <span className="text-amber-300">{fmt(total.cachedTokens)}</span>
                <span className="text-amber-400/60 ml-0.5">
                  ({pct(total.cachedTokens, total.promptTokens)})
                </span>
              </span>
            )}
          </div>
          {/* Per-player breakdown */}
          {perPlayer
            .filter((p) => p.callCount > 0)
            .sort((a, b) => b.usage.totalTokens - a.usage.totalTokens)
            .map((p) => (
              <div key={p.playerId} className="text-[10px] flex justify-between text-gray-500">
                <span className="text-gray-300 truncate mr-2">{p.playerName}</span>
                <span className="whitespace-nowrap flex items-center gap-1.5">
                  <span className="text-blue-400/60">↑{fmt(p.usage.promptTokens)}</span>
                  <span className="text-emerald-400/60">↓{fmt(p.usage.completionTokens)}</span>
                  {(p.usage.cachedTokens || 0) > 0 && (
                    <span className="text-amber-400/60">⚡{fmt(p.usage.cachedTokens)}</span>
                  )}
                  <span className="text-gray-600">· {p.callCount}c</span>
                </span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
