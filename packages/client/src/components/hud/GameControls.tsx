import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useGameStore } from '../../store/gameStore';
import { Phase } from '@ma-soi/shared';

export default function GameControls() {
  const { gameState, pauseGame, resumeGame, stepGame, setSpectatorMode, spectatorMode, setView, setPlayerView } = useGameStore();
  const [showPlayerList, setShowPlayerList] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
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
    const handler = (e: MouseEvent) => {
      if (btnRef.current?.contains(e.target as Node)) return;
      setShowPlayerList(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showPlayerList]);

  if (!gameState) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {gameState.config.autoPlay ? (
        <button onClick={gameState.isPaused ? resumeGame : pauseGame}
          className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded text-xs font-medium transition">
          {gameState.isPaused ? '▶ Tiếp tục' : '⏸ Tạm dừng'}
        </button>
      ) : (
        <button onClick={stepGame} className="bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 rounded text-xs font-medium transition">
          ⏭ Bước tiếp
        </button>
      )}

      <div className="flex bg-gray-800 rounded overflow-hidden">
        <button onClick={() => { setSpectatorMode('god'); setShowPlayerList(false); }}
          className={`px-3 py-1.5 text-xs transition ${spectatorMode === 'god' ? 'bg-amber-600 text-white' : 'text-gray-400 hover:text-white'}`}>
          👁 Toàn Cảnh
        </button>
        <button onClick={() => { setSpectatorMode('fog'); setShowPlayerList(false); }}
          className={`px-3 py-1.5 text-xs transition ${spectatorMode === 'fog' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>
          🌫 Sương Mù
        </button>
        <button ref={btnRef} onClick={() => setShowPlayerList(!showPlayerList)}
          className={`px-3 py-1.5 text-xs transition ${spectatorMode === 'player' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white'}`}>
          👤 Player {showPlayerList ? '▴' : '▾'}
        </button>
      </div>

      {/* Portal dropdown — renders at body level to escape stacking context */}
      {showPlayerList && createPortal(
        <div
          className="fixed bg-gray-900 border border-gray-700 rounded-lg shadow-xl min-w-[180px] py-1 max-h-[300px] overflow-y-auto"
          style={{ top: dropdownPos.top, right: dropdownPos.right, zIndex: 9999 }}
        >
          {gameState.players.map(p => (
            <button
              key={p.id}
              onClick={() => { setPlayerView(p.id); setShowPlayerList(false); }}
              className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 transition hover:bg-gray-700/50 ${
                useGameStore.getState().playerViewId === p.id ? 'bg-cyan-900/40' : ''
              }`}
            >
              <span>{p.personality.emoji}</span>
              <span className={`flex-1 ${p.alive ? 'text-gray-200' : 'text-gray-500 line-through'}`}>{p.name}</span>
              {!p.alive && <span className="text-[10px]">💀</span>}
            </button>
          ))}
          {spectatorMode === 'player' && (
            <button
              onClick={() => { setPlayerView(null); setShowPlayerList(false); }}
              className="w-full text-left px-3 py-2 text-xs text-gray-400 hover:bg-gray-700/50 border-t border-gray-700"
            >
              ✕ Thoát Player View
            </button>
          )}
        </div>,
        document.body
      )}

      {gameState.phase === Phase.GameOver && (
        <button onClick={() => setView('lobby')} className="bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded text-xs font-medium transition">
          🔄 Ván Mới
        </button>
      )}
    </div>
  );
}
