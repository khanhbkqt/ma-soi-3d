import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { Phase } from '@ma-soi/shared';

export default function GameControls() {
  const { gameState, pauseGame, resumeGame, stepGame, setSpectatorMode, spectatorMode, setView, setPlayerView } = useGameStore();
  const [showPlayerList, setShowPlayerList] = useState(false);
  if (!gameState) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap relative">
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
        <button onClick={() => setShowPlayerList(!showPlayerList)}
          className={`px-3 py-1.5 text-xs transition ${spectatorMode === 'player' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white'}`}>
          👤 Player {spectatorMode === 'player' ? '▴' : '▾'}
        </button>
      </div>

      {/* Player selector dropdown */}
      {showPlayerList && (
        <div className="absolute top-full right-0 mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 min-w-[180px] py-1 max-h-[300px] overflow-y-auto">
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
        </div>
      )}

      {gameState.phase === Phase.GameOver && (
        <button onClick={() => setView('lobby')} className="bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded text-xs font-medium transition">
          🔄 Ván Mới
        </button>
      )}
    </div>
  );
}
