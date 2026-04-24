import { Canvas } from '@react-three/fiber';
import VillageScene from '../scene/VillageScene';
import HUD from '../hud/HUD';
import { useGameStore } from '../../store/gameStore';
import { Phase } from '@ma-soi/shared';

export default function GameView() {
  const gameState = useGameStore(s => s.gameState);
  const phase = gameState?.phase;

  return (
    <div className="w-full h-full relative bg-[#0a0e1a]">
      <Canvas shadows camera={{ position: [0, 8, 12], fov: 50 }} gl={{ antialias: true, alpha: false }}>
        <VillageScene />
      </Canvas>
      <HUD />

      {/* Loading overlay when no game state */}
      {!gameState && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center">
            <div className="text-4xl mb-4 animate-pulse">🐺</div>
            <p className="text-gray-400">Đang dựng ngôi làng...</p>
          </div>
        </div>
      )}

      {/* Phase transition overlays */}
      {phase === Phase.Night && (
        <div className="absolute inset-0 pointer-events-none bg-blue-900/10 transition-all duration-1000" />
      )}
      {phase === Phase.Dawn && (
        <div className="absolute inset-0 pointer-events-none transition-all duration-1000"
          style={{ background: 'linear-gradient(to top, rgba(251, 146, 60, 0.08), rgba(251, 191, 36, 0.04), transparent)' }}
        />
      )}
      {phase === Phase.Dusk && (
        <div className="absolute inset-0 pointer-events-none transition-all duration-1000"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 40%, rgba(120, 53, 15, 0.12) 100%)',
            borderTop: '2px solid rgba(245, 158, 11, 0.15)',
            borderBottom: '2px solid rgba(245, 158, 11, 0.15)',
          }}
        />
      )}
      {phase === Phase.Judgement && (
        <div className="absolute inset-0 pointer-events-none transition-all duration-1000"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 30%, rgba(220, 38, 38, 0.1) 100%)',
            border: '2px solid rgba(239, 68, 68, 0.2)',
          }}
        />
      )}
    </div>
  );
}
