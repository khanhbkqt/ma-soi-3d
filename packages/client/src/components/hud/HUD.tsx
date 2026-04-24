import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { Phase, isWolfRole } from '@ma-soi/shared';
import { PHASE_INFO } from './constants';
import ChatLog from './ChatLog';
import PlayerRoster from './PlayerRoster';
import GameControls from './GameControls';
import PlayerViewPanel from './PlayerViewPanel';
import TokenUsagePanel from './TokenUsagePanel';
import DiscussionCountdown from './DiscussionCountdown';

export default function HUD() {
  const [showRoster, setShowRoster] = useState(true);
  const gameState = useGameStore((s) => s.gameState);
  const spectatorMode = useGameStore((s) => s.spectatorMode);
  const playerViewState = useGameStore((s) => s.playerViewState);
  if (!gameState) return null;

  const phase = PHASE_INFO[gameState.phase] || PHASE_INFO[Phase.Lobby];
  const alive = gameState.players.filter((p) => p.alive).length;
  const wolves = gameState.players.filter((p) => p.alive && isWolfRole(p.role)).length;
  const isDusk = gameState.phase === Phase.Dusk;
  const isJudgement = gameState.phase === Phase.Judgement;
  const isDay = gameState.phase === Phase.Day;
  const isPlayerView = spectatorMode === 'player';

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col">
      {/* Top bar */}
      <div
        className={`pointer-events-auto backdrop-blur-sm border-b px-4 py-2 flex items-center justify-between transition-all duration-500 ${
          isJudgement
            ? 'bg-red-950/70 border-red-700/50'
            : isDusk
              ? 'bg-amber-950/70 border-amber-700/50'
              : isPlayerView
                ? 'bg-cyan-950/70 border-cyan-700/50'
                : 'bg-black/60 border-gray-700/50'
        }`}
      >
        <div className="flex items-center gap-4">
          <span className="text-amber-400 font-bold text-sm">🐺 Ma Sói 3D</span>
          <span
            className={`text-sm font-medium ${phase.color} ${isDusk ? 'voting-phase-pulse' : ''} ${isJudgement ? 'judgement-phase-pulse' : ''}`}
          >
            {phase.icon} {phase.label}
          </span>
          <span className="text-gray-400 text-xs">Vòng {gameState.round}</span>
          {isDay && <DiscussionCountdown />}
          {isPlayerView && playerViewState && (
            <span className="text-cyan-300 text-xs font-medium px-2 py-0.5 rounded bg-cyan-900/40 border border-cyan-700/30">
              👤 {playerViewState.playerName}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-green-400 text-xs">👥 {alive} sống sót</span>
          {spectatorMode === 'god' && <span className="text-red-400 text-xs">🐺 {wolves} sói</span>}
          <GameControls />
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex min-h-0">
        {/* Left sidebar */}
        <div
          className={`pointer-events-auto bg-black/40 backdrop-blur-sm border-r border-gray-700/30 flex flex-col overflow-hidden transition-all duration-300 ${
            isPlayerView ? 'w-72' : 'w-48'
          }`}
        >
          {isPlayerView ? (
            <>
              <PlayerViewPanel />
              <div className="border-t border-gray-700/30">
                <div
                  className="flex items-center justify-between px-3 py-1.5 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => setShowRoster(!showRoster)}
                >
                  <div className="text-[10px] text-gray-500 font-medium">NGƯỜI CHƠI</div>
                  <div className="text-[10px] text-gray-500">{showRoster ? '▼' : '▲'}</div>
                </div>
                <div
                  className={`overflow-y-auto px-2 transition-all duration-300 ${showRoster ? 'max-h-[200px] pb-2 opacity-100' : 'max-h-0 pb-0 opacity-0'}`}
                >
                  <PlayerRoster />
                </div>
              </div>
              <TokenUsagePanel />
            </>
          ) : (
            <>
              <div
                className="flex items-center justify-between p-2 px-3 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => setShowRoster(!showRoster)}
              >
                <div className="text-xs text-gray-500 font-medium">NGƯỜI CHƠI</div>
                <div className="text-[10px] text-gray-500">{showRoster ? '▼' : '▲'}</div>
              </div>
              <div
                className={`overflow-y-auto px-2 transition-all duration-300 ${showRoster ? 'flex-1 opacity-100' : 'h-0 opacity-0 overflow-hidden'}`}
              >
                <PlayerRoster />
              </div>
              <TokenUsagePanel />
            </>
          )}
        </div>

        {/* Center: 3D scene (transparent) */}
        <div className="flex-1" />

        {/* Right: Chat log */}
        <div className="pointer-events-auto w-80 bg-black/50 backdrop-blur-sm border-l border-gray-700/30 flex flex-col min-h-0">
          <div className="text-xs text-gray-500 font-medium p-2 px-3 border-b border-gray-700/30">
            {isPlayerView && playerViewState
              ? `📜 NHẬT KÝ — ${playerViewState.playerName}`
              : 'NHẬT KÝ'}
          </div>
          <ChatLog />
        </div>
      </div>

      {/* Phase overlay glows */}
      {isDusk && <div className="absolute inset-0 pointer-events-none voting-overlay-glow" />}
      {isJudgement && (
        <div className="absolute inset-0 pointer-events-none judgement-overlay-glow" />
      )}
    </div>
  );
}
