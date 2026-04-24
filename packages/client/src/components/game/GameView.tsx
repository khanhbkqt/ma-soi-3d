import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette, N8AO } from '@react-three/postprocessing';
import * as THREE from 'three';
import VillageScene from '../scene/VillageScene';
import SceneOverlay from '../scene/SceneOverlay';
import NarratorOverlay from '../hud/NarratorOverlay';
import HUD from '../hud/HUD';
import { useGameStore } from '../../store/gameStore';
import { Phase } from '@ma-soi/shared';

function PostProcessing() {
  const phase = useGameStore((s) => s.gameState?.phase);
  const isNight = phase === Phase.Night;
  const isJudgement = phase === Phase.Judgement;

  return (
    <EffectComposer>
      <Bloom
        luminanceThreshold={isNight ? 0.3 : 0.6}
        luminanceSmoothing={0.4}
        intensity={isNight ? 1.2 : isJudgement ? 0.8 : 0.4}
        mipmapBlur
      />
      <N8AO aoRadius={0.5} intensity={1} distanceFalloff={0.5} />
      <Vignette
        eskil={false}
        offset={isJudgement ? 0.2 : 0.3}
        darkness={isJudgement ? 0.8 : isNight ? 0.6 : 0.4}
      />
    </EffectComposer>
  );
}

export default function GameView() {
  const gameState = useGameStore((s) => s.gameState);
  const phase = gameState?.phase;

  return (
    <div className="w-full h-full relative bg-[#0a0e1a]">
      <Canvas
        shadows
        camera={{ position: [0, 8, 12], fov: 50 }}
        gl={{
          antialias: true,
          alpha: false,
          toneMapping: THREE.ACESFilmicToneMapping,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
      >
        <VillageScene />
        <PostProcessing />
      </Canvas>
      <SceneOverlay />
      <NarratorOverlay />
      <HUD />

      {!gameState && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center">
            <div className="text-4xl mb-4 animate-pulse">🐺</div>
            <p className="text-gray-400">Đang dựng ngôi làng...</p>
          </div>
        </div>
      )}
    </div>
  );
}
