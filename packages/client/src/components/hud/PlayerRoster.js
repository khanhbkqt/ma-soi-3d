import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { useGameStore } from '../../store/gameStore';
import { Phase } from '@ma-soi/shared';
import { ROLE_COLORS, ROLE_NAMES_VI } from './constants';
export default function PlayerRoster() {
  const gameState = useGameStore((s) => s.gameState);
  const spectatorMode = useGameStore((s) => s.spectatorMode);
  const playerViewId = useGameStore((s) => s.playerViewId);
  const setPlayerView = useGameStore((s) => s.setPlayerView);
  if (!gameState) return null;
  const voteCounts = {};
  if (gameState.phase === Phase.Dusk) {
    gameState.votes.forEach((v) => {
      voteCounts[v.targetId] = (voteCounts[v.targetId] || 0) + 1;
    });
  }
  const isAccused = (id) => gameState.phase === Phase.Judgement && gameState.accusedId === id;
  const isPlayerView = spectatorMode === 'player';
  return _jsx('div', {
    className: 'space-y-1',
    children: gameState.players.map((p) => {
      const voteCount = voteCounts[p.id] || 0;
      const isVoteTarget = voteCount > 0;
      const accused = isAccused(p.id);
      const isViewing = isPlayerView && playerViewId === p.id;
      return _jsxs(
        'div',
        {
          onClick: isPlayerView ? () => setPlayerView(p.id) : undefined,
          className: `flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-all duration-300 ${
            isViewing
              ? 'bg-cyan-900/60 border border-cyan-400/60 ring-1 ring-cyan-400/30'
              : accused
                ? 'bg-red-900/50 border border-red-500/50 judgement-phase-pulse'
                : p.alive
                  ? isVoteTarget
                    ? 'bg-amber-900/40 border border-amber-600/40'
                    : 'bg-gray-800/50'
                  : 'bg-gray-900/30 opacity-50'
          } ${isPlayerView ? 'cursor-pointer hover:bg-gray-700/50' : ''}`,
          children: [
            _jsx('span', { className: 'text-sm', children: p.personality.emoji }),
            _jsx('span', {
              className: `flex-1 font-medium ${
                isViewing
                  ? 'text-cyan-200'
                  : p.alive
                    ? accused
                      ? 'text-red-300'
                      : 'text-white'
                    : 'text-gray-500 line-through'
              }`,
              children: p.name,
            }),
            _jsx('span', {
              className: 'text-[9px] text-gray-500 truncate max-w-[60px]',
              title: p.modelName,
              children: p.modelName,
            }),
            isViewing &&
              _jsx('span', { className: 'text-cyan-400 text-[10px]', children: '\uD83D\uDC41' }),
            accused &&
              _jsx('span', {
                className: 'text-red-400 text-[10px] font-bold',
                children: '\u2696\uFE0F',
              }),
            isVoteTarget &&
              _jsx('span', {
                className:
                  'vote-count-badge px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-600/80 text-white min-w-[20px] text-center',
                children: voteCount,
              }),
            (spectatorMode === 'god' || !p.alive) &&
              _jsx('span', {
                className: 'px-1.5 py-0.5 rounded text-[10px] font-bold',
                style: { color: ROLE_COLORS[p.role], backgroundColor: ROLE_COLORS[p.role] + '20' },
                children: ROLE_NAMES_VI[p.role],
              }),
            isViewing &&
              _jsx('span', {
                className: 'px-1.5 py-0.5 rounded text-[10px] font-bold',
                style: { color: ROLE_COLORS[p.role], backgroundColor: ROLE_COLORS[p.role] + '20' },
                children: ROLE_NAMES_VI[p.role],
              }),
            !p.alive && _jsx('span', { children: '\uD83D\uDC80' }),
          ],
        },
        p.id,
      );
    }),
  });
}
