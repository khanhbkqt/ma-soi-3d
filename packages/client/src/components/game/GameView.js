import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import VillageScene from '../scene/VillageScene';
import NarratorOverlay from '../hud/NarratorOverlay';
import HUD from '../hud/HUD';
import { useGameStore } from '../../store/gameStore';
import { Phase } from '@ma-soi/shared';
function PostProcessing() {
  const phase = useGameStore((s) => s.gameState?.phase);
  const isNight = phase === Phase.Night;
  const isJudgement = phase === Phase.Judgement;
  return _jsxs(EffectComposer, {
    children: [
      _jsx(Bloom, {
        luminanceThreshold: isNight ? 0.4 : 0.7,
        luminanceSmoothing: 0.3,
        intensity: isNight ? 0.8 : isJudgement ? 0.5 : 0.25,
      }),
      _jsx(Vignette, {
        eskil: false,
        offset: isJudgement ? 0.2 : 0.3,
        darkness: isJudgement ? 0.8 : isNight ? 0.6 : 0.4,
      }),
    ],
  });
}
export default function GameView() {
  const gameState = useGameStore((s) => s.gameState);
  const phase = gameState?.phase;
  return _jsxs('div', {
    className: 'w-full h-full relative bg-[#0a0e1a]',
    children: [
      _jsxs(Canvas, {
        shadows: true,
        camera: { position: [0, 8, 12], fov: 50 },
        gl: {
          antialias: true,
          alpha: false,
          toneMapping: THREE.ACESFilmicToneMapping,
          outputColorSpace: THREE.SRGBColorSpace,
        },
        children: [_jsx(VillageScene, {}), _jsx(PostProcessing, {})],
      }),
      _jsx(NarratorOverlay, {}),
      _jsx(HUD, {}),
      !gameState &&
        _jsx('div', {
          className: 'absolute inset-0 flex items-center justify-center bg-black/80',
          children: _jsxs('div', {
            className: 'text-center',
            children: [
              _jsx('div', { className: 'text-4xl mb-4 animate-pulse', children: '\uD83D\uDC3A' }),
              _jsx('p', {
                className: 'text-gray-400',
                children: '\u0110ang d\u1EF1ng ng\u00F4i l\u00E0ng...',
              }),
            ],
          }),
        }),
    ],
  });
}
