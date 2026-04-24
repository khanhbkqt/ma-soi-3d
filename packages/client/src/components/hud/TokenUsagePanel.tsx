import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';

function fmt(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

export default function TokenUsagePanel() {
  const [expanded, setExpanded] = useState(false);
  const tokenUsage = useGameStore((s) => s.tokenUsage);
  if (!tokenUsage) return null;

  const { total, perPlayer } = tokenUsage;

  return (
    <div className="pointer-events-auto">
      <div
        className="flex items-center justify-between px-3 py-1.5 cursor-pointer hover:bg-white/5 transition-colors border-t border-gray-700/30"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="text-[10px] text-gray-500 font-medium">
          🔢 TOKENS: {fmt(total.totalTokens)}
        </div>
        <div className="text-[10px] text-gray-500">{expanded ? '▼' : '▲'}</div>
      </div>
      {expanded && (
        <div className="px-3 pb-2 space-y-1 max-h-[200px] overflow-y-auto">
          <div className="text-[10px] text-gray-400 flex justify-between">
            <span>Prompt: {fmt(total.promptTokens)}</span>
            <span>Completion: {fmt(total.completionTokens)}</span>
          </div>
          {perPlayer
            .filter((p) => p.callCount > 0)
            .sort((a, b) => b.usage.totalTokens - a.usage.totalTokens)
            .map((p) => (
              <div key={p.playerId} className="text-[10px] flex justify-between text-gray-500">
                <span className="text-gray-300 truncate mr-2">{p.playerName}</span>
                <span className="whitespace-nowrap">
                  {fmt(p.usage.totalTokens)} · {p.callCount} calls
                </span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
