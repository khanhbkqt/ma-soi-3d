import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useGameStore } from '../../store/gameStore';
import { Phase } from '@ma-soi/shared';
import { buildGameTimeline } from './buildGameTimeline';
export default function GameControls() {
  const {
    gameState,
    pauseGame,
    resumeGame,
    stepGame,
    setSpectatorMode,
    spectatorMode,
    setView,
    setPlayerView,
  } = useGameStore();
  const [showPlayerList, setShowPlayerList] = useState(false);
  const [copied, setCopied] = useState(false);
  const btnRef = useRef(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
  useEffect(() => {
    if (showPlayerList && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
  }, [showPlayerList]);
  // Close on outside click
  useEffect(() => {
    if (!showPlayerList) return;
    const handler = (e) => {
      if (btnRef.current?.contains(e.target)) return;
      setShowPlayerList(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showPlayerList]);
  if (!gameState) return null;
  return _jsxs('div', {
    className: 'flex items-center gap-2 flex-wrap',
    children: [
      gameState.config.autoPlay
        ? _jsx('button', {
            onClick: gameState.isPaused ? resumeGame : pauseGame,
            className:
              'bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded text-xs font-medium transition',
            children: gameState.isPaused ? '▶ Tiếp tục' : '⏸ Tạm dừng',
          })
        : _jsx('button', {
            onClick: stepGame,
            className:
              'bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 rounded text-xs font-medium transition',
            children: '\u23ED B\u01B0\u1EDBc ti\u1EBFp',
          }),
      _jsxs('div', {
        className: 'flex bg-gray-800 rounded overflow-hidden',
        children: [
          _jsx('button', {
            onClick: () => {
              setSpectatorMode('god');
              setShowPlayerList(false);
            },
            className: `px-3 py-1.5 text-xs transition ${spectatorMode === 'god' ? 'bg-amber-600 text-white' : 'text-gray-400 hover:text-white'}`,
            children: '\uD83D\uDC41 To\u00E0n C\u1EA3nh',
          }),
          _jsx('button', {
            onClick: () => {
              setSpectatorMode('fog');
              setShowPlayerList(false);
            },
            className: `px-3 py-1.5 text-xs transition ${spectatorMode === 'fog' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`,
            children: '\uD83C\uDF2B S\u01B0\u01A1ng M\u00F9',
          }),
          _jsxs('button', {
            ref: btnRef,
            onClick: () => setShowPlayerList(!showPlayerList),
            className: `px-3 py-1.5 text-xs transition ${spectatorMode === 'player' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white'}`,
            children: ['\uD83D\uDC64 Player ', showPlayerList ? '▴' : '▾'],
          }),
        ],
      }),
      showPlayerList &&
        createPortal(
          _jsxs('div', {
            className:
              'fixed bg-gray-900 border border-gray-700 rounded-lg shadow-xl min-w-[180px] py-1 max-h-[300px] overflow-y-auto',
            style: { top: dropdownPos.top, right: dropdownPos.right, zIndex: 9999 },
            children: [
              gameState.players.map((p) =>
                _jsxs(
                  'button',
                  {
                    onClick: () => {
                      setPlayerView(p.id);
                      setShowPlayerList(false);
                    },
                    className: `w-full text-left px-3 py-2 text-xs flex items-center gap-2 transition hover:bg-gray-700/50 ${useGameStore.getState().playerViewId === p.id ? 'bg-cyan-900/40' : ''}`,
                    children: [
                      _jsx('span', { children: p.personality.emoji }),
                      _jsx('span', {
                        className: `flex-1 ${p.alive ? 'text-gray-200' : 'text-gray-500 line-through'}`,
                        children: p.name,
                      }),
                      !p.alive &&
                        _jsx('span', { className: 'text-[10px]', children: '\uD83D\uDC80' }),
                    ],
                  },
                  p.id,
                ),
              ),
              spectatorMode === 'player' &&
                _jsx('button', {
                  onClick: () => {
                    setPlayerView(null);
                    setShowPlayerList(false);
                  },
                  className:
                    'w-full text-left px-3 py-2 text-xs text-gray-400 hover:bg-gray-700/50 border-t border-gray-700',
                  children: '\u2715 Tho\u00E1t Player View',
                }),
            ],
          }),
          document.body,
        ),
      gameState.phase === Phase.GameOver &&
        _jsx('button', {
          onClick: () => setView('lobby'),
          className:
            'bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded text-xs font-medium transition',
          children: '\uD83D\uDD04 V\u00E1n M\u1EDBi',
        }),
      _jsx('button', {
        onClick: () => {
          const data = buildGameTimeline(gameState);
          navigator.clipboard.writeText(JSON.stringify(data, null, 2));
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        },
        className: `px-3 py-1.5 rounded text-xs font-medium transition ${copied ? 'bg-green-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`,
        children: copied ? '✅ Đã copy!' : '📋 Copy Game Data',
      }),
    ],
  });
}
