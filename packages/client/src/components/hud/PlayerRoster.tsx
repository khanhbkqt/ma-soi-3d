import { useGameStore } from '../../store/gameStore';
import { Phase } from '@ma-soi/shared';
import { ROLE_COLORS, ROLE_NAMES_VI } from './constants';

export default function PlayerRoster() {
  const gameState = useGameStore(s => s.gameState);
  const spectatorMode = useGameStore(s => s.spectatorMode);
  const playerViewId = useGameStore(s => s.playerViewId);
  const setPlayerView = useGameStore(s => s.setPlayerView);
  if (!gameState) return null;

  const voteCounts: Record<string, number> = {};
  if (gameState.phase === Phase.Dusk) {
    gameState.votes.forEach(v => {
      voteCounts[v.targetId] = (voteCounts[v.targetId] || 0) + 1;
    });
  }

  const isAccused = (id: string) => gameState.phase === Phase.Judgement && gameState.accusedId === id;
  const isPlayerView = spectatorMode === 'player';

  return (
    <div className="space-y-1">
      {gameState.players.map(p => {
        const voteCount = voteCounts[p.id] || 0;
        const isVoteTarget = voteCount > 0;
        const accused = isAccused(p.id);
        const isViewing = isPlayerView && playerViewId === p.id;
        return (
          <div
            key={p.id}
            onClick={isPlayerView ? () => setPlayerView(p.id) : undefined}
            className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-all duration-300 ${
              isViewing
                ? 'bg-cyan-900/60 border border-cyan-400/60 ring-1 ring-cyan-400/30'
                : accused
                  ? 'bg-red-900/50 border border-red-500/50 judgement-phase-pulse'
                  : p.alive
                    ? isVoteTarget
                      ? 'bg-amber-900/40 border border-amber-600/40'
                      : 'bg-gray-800/50'
                    : 'bg-gray-900/30 opacity-50'
            } ${isPlayerView ? 'cursor-pointer hover:bg-gray-700/50' : ''}`}
          >
            <span className="text-sm">{p.personality.emoji}</span>
            <span className={`flex-1 font-medium ${
              isViewing ? 'text-cyan-200' :
              p.alive ? (accused ? 'text-red-300' : 'text-white') : 'text-gray-500 line-through'
            }`}>{p.name}</span>
            {isViewing && <span className="text-cyan-400 text-[10px]">👁</span>}
            {accused && <span className="text-red-400 text-[10px] font-bold">⚖️</span>}
            {isVoteTarget && (
              <span className="vote-count-badge px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-600/80 text-white min-w-[20px] text-center">
                {voteCount}
              </span>
            )}
            {(spectatorMode === 'god' || !p.alive) && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ color: ROLE_COLORS[p.role], backgroundColor: ROLE_COLORS[p.role] + '20' }}>
                {ROLE_NAMES_VI[p.role]}
              </span>
            )}
            {isViewing && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ color: ROLE_COLORS[p.role], backgroundColor: ROLE_COLORS[p.role] + '20' }}>
                {ROLE_NAMES_VI[p.role]}
              </span>
            )}
            {!p.alive && <span>💀</span>}
          </div>
        );
      })}
    </div>
  );
}
