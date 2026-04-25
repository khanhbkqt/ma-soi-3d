import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from 'react/jsx-runtime';
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';
import { Phase } from '@ma-soi/shared';
import Character from './Character';
import Campfire from './Campfire';
import Ground from './Ground';
import Trees from './Trees';
import WorldProps from './WorldProps';
import Atmosphere from './Atmosphere';
// ── Phase lighting targets ──
const PHASE_LIGHTING = {
  [Phase.Night]: {
    ambient: 0.15,
    ambientCol: '#4466aa',
    dir: 0.1,
    dirCol: '#6688cc',
    bg: '#070b15',
    campfire: 3,
    campfireCol: '#ff6622',
    sunPos: [0, -8, -15],
    moonPos: [0, 18, -5],
    sunCol: '#ff6633',
    sunScale: 0,
    moonScale: 1.5,
    starsOpacity: 1,
    fogNear: 20,
    fogFar: 50,
    fogOn: false,
  },
  [Phase.Dawn]: {
    ambient: 0.4,
    ambientCol: '#ffcc88',
    dir: 0.8,
    dirCol: '#ffddaa',
    bg: '#2a1a10',
    campfire: 0.8,
    campfireCol: '#ff6622',
    sunPos: [-18, 3, -10],
    moonPos: [10, -5, -5],
    sunCol: '#ff6633',
    sunScale: 3,
    moonScale: 0,
    starsOpacity: 0.2,
    fogNear: 20,
    fogFar: 50,
    fogOn: false,
  },
  [Phase.Day]: {
    ambient: 0.6,
    ambientCol: '#ffffff',
    dir: 1.2,
    dirCol: '#fff5e0',
    bg: '#87CEEB',
    campfire: 0.5,
    campfireCol: '#ff6622',
    sunPos: [0, 22, -8],
    moonPos: [0, -8, -5],
    sunCol: '#ffee44',
    sunScale: 2.5,
    moonScale: 0,
    starsOpacity: 0,
    fogNear: 20,
    fogFar: 50,
    fogOn: true,
  },
  [Phase.Dusk]: {
    ambient: 0.35,
    ambientCol: '#cc8844',
    dir: 0.5,
    dirCol: '#dd9944',
    bg: '#1a1008',
    campfire: 2,
    campfireCol: '#ff6622',
    sunPos: [18, 3, -10],
    moonPos: [-10, -5, -5],
    sunCol: '#ff4411',
    sunScale: 3.2,
    moonScale: 0,
    starsOpacity: 0.3,
    fogNear: 20,
    fogFar: 50,
    fogOn: false,
  },
  [Phase.Judgement]: {
    ambient: 0.25,
    ambientCol: '#aa4444',
    dir: 0.3,
    dirCol: '#cc6666',
    bg: '#150808',
    campfire: 4,
    campfireCol: '#ff2200',
    sunPos: [18, -2, -10],
    moonPos: [0, 15, -5],
    sunCol: '#ff2200',
    sunScale: 0,
    moonScale: 1.2,
    starsOpacity: 0.8,
    fogNear: 20,
    fogFar: 50,
    fogOn: false,
  },
};
const DEFAULT_LIGHTING = PHASE_LIGHTING[Phase.Day];
// ── Sun/Moon ──
function CelestialBodies({ sunPos, moonPos, sunCol, sunScale, moonScale }) {
  const sunRef = useRef(null);
  const moonRef = useRef(null);
  const curSunPos = useRef(sunPos.clone());
  const curMoonPos = useRef(moonPos.clone());
  const curSunScale = useRef(sunScale);
  const curMoonScale = useRef(moonScale);
  const curSunCol = useRef(sunCol.clone());
  useFrame((_, dt) => {
    const spd = 2 * dt;
    curSunPos.current.lerp(sunPos, spd);
    curMoonPos.current.lerp(moonPos, spd);
    curSunScale.current = THREE.MathUtils.lerp(curSunScale.current, sunScale, spd);
    curMoonScale.current = THREE.MathUtils.lerp(curMoonScale.current, moonScale, spd);
    curSunCol.current.lerp(sunCol, spd);
    if (sunRef.current) {
      sunRef.current.position.copy(curSunPos.current);
      sunRef.current.scale.setScalar(Math.max(0.01, curSunScale.current));
      const pulse = 1 + Math.sin(Date.now() * 0.002) * 0.08;
      sunRef.current.children[1]?.scale.setScalar(pulse * 2);
    }
    if (moonRef.current) {
      moonRef.current.position.copy(curMoonPos.current);
      moonRef.current.scale.setScalar(Math.max(0.01, curMoonScale.current));
    }
  });
  return _jsxs(_Fragment, {
    children: [
      _jsxs('group', {
        ref: sunRef,
        children: [
          _jsxs('mesh', {
            children: [
              _jsx('sphereGeometry', { args: [1, 16, 16] }),
              _jsx('meshBasicMaterial', { color: curSunCol.current }),
            ],
          }),
          _jsxs('mesh', {
            children: [
              _jsx('sphereGeometry', { args: [1, 16, 16] }),
              _jsx('meshBasicMaterial', {
                color: curSunCol.current,
                transparent: true,
                opacity: 0.15,
              }),
            ],
          }),
        ],
      }),
      _jsxs('group', {
        ref: moonRef,
        children: [
          _jsxs('mesh', {
            children: [
              _jsx('sphereGeometry', { args: [0.8, 16, 16] }),
              _jsx('meshBasicMaterial', { color: '#ddeeff' }),
            ],
          }),
          _jsxs('mesh', {
            children: [
              _jsx('sphereGeometry', { args: [1.2, 16, 16] }),
              _jsx('meshBasicMaterial', { color: '#aaccff', transparent: true, opacity: 0.1 }),
            ],
          }),
        ],
      }),
    ],
  });
}
// ── Clouds ──
function Clouds() {
  const ref = useRef(null);
  const clouds = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        x: (Math.random() - 0.5) * 30,
        y: 12 + Math.random() * 5,
        z: -8 + (Math.random() - 0.5) * 15,
        scale: 1.5 + Math.random() * 2,
        speed: 0.1 + Math.random() * 0.15,
        offset: Math.random() * 100,
      })),
    [],
  );
  useFrame(() => {
    if (!ref.current) return;
    const t = Date.now() * 0.001;
    ref.current.children.forEach((g, i) => {
      const c = clouds[i];
      g.position.x = c.x + Math.sin(t * c.speed + c.offset) * 3;
    });
  });
  return _jsx('group', {
    ref: ref,
    children: clouds.map((c, i) =>
      _jsx(
        'group',
        {
          position: [c.x, c.y, c.z],
          scale: c.scale,
          children: [
            [-0.5, 0, 0],
            [0.3, 0.15, 0.2],
            [0, 0.1, -0.3],
          ].map((p, j) =>
            _jsxs(
              'mesh',
              {
                position: p,
                children: [
                  _jsx('sphereGeometry', { args: [0.6 + j * 0.1, 8, 6] }),
                  _jsx('meshBasicMaterial', {
                    color: '#ffffff',
                    transparent: true,
                    opacity: 0.15,
                    depthWrite: false,
                  }),
                ],
              },
              j,
            ),
          ),
        },
        i,
      ),
    ),
  });
}
export default function VillageScene() {
  const gameState = useGameStore((s) => s.gameState);
  const phase = gameState?.phase;
  const target = PHASE_LIGHTING[phase ?? ''] ?? DEFAULT_LIGHTING;
  const cur = useRef({
    ambient: target.ambient,
    ambientCol: new THREE.Color(target.ambientCol),
    dir: target.dir,
    dirCol: new THREE.Color(target.dirCol),
    bg: new THREE.Color(target.bg),
    campfire: target.campfire,
    campfireCol: new THREE.Color(target.campfireCol),
    starsOpacity: target.starsOpacity,
  });
  const ambientRef = useRef(null);
  const dirRef = useRef(null);
  const rimRef = useRef(null);
  const campfireRef1 = useRef(null);
  const campfireRef2 = useRef(null);
  const starsRef = useRef(null);
  const fogRef = useRef(null);
  const sunPosTarget = useMemo(
    () => new THREE.Vector3(...target.sunPos),
    [target.sunPos[0], target.sunPos[1], target.sunPos[2]],
  );
  const moonPosTarget = useMemo(
    () => new THREE.Vector3(...target.moonPos),
    [target.moonPos[0], target.moonPos[1], target.moonPos[2]],
  );
  const sunColTarget = useMemo(() => new THREE.Color(target.sunCol), [target.sunCol]);
  const targetColors = useMemo(
    () => ({
      ambientCol: new THREE.Color(target.ambientCol),
      dirCol: new THREE.Color(target.dirCol),
      bg: new THREE.Color(target.bg),
      campfireCol: new THREE.Color(target.campfireCol),
    }),
    [target.ambientCol, target.dirCol, target.bg, target.campfireCol],
  );
  useFrame((state, dt) => {
    const spd = 2 * dt;
    const c = cur.current;
    c.ambient = THREE.MathUtils.lerp(c.ambient, target.ambient, spd);
    c.dir = THREE.MathUtils.lerp(c.dir, target.dir, spd);
    c.campfire = THREE.MathUtils.lerp(c.campfire, target.campfire, spd);
    c.starsOpacity = THREE.MathUtils.lerp(c.starsOpacity, target.starsOpacity, spd);
    c.ambientCol.lerp(targetColors.ambientCol, spd);
    c.dirCol.lerp(targetColors.dirCol, spd);
    c.bg.lerp(targetColors.bg, spd);
    c.campfireCol.lerp(targetColors.campfireCol, spd);
    if (ambientRef.current) {
      ambientRef.current.intensity = c.ambient;
      ambientRef.current.color.copy(c.ambientCol);
    }
    if (dirRef.current) {
      dirRef.current.intensity = c.dir;
      dirRef.current.color.copy(c.dirCol);
    }
    if (rimRef.current) {
      rimRef.current.intensity = c.dir * 0.3;
      rimRef.current.color.copy(c.dirCol);
    }
    if (campfireRef1.current) {
      campfireRef1.current.intensity = c.campfire;
      campfireRef1.current.color.copy(c.campfireCol);
    }
    if (campfireRef2.current) {
      campfireRef2.current.intensity = c.campfire * 0.5;
    }
    state.scene.background = c.bg;
    if (starsRef.current) {
      starsRef.current.visible = c.starsOpacity > 0.01;
      starsRef.current.children.forEach((child) => {
        if (child.material) child.material.opacity = c.starsOpacity;
      });
    }
    if (fogRef.current) {
      if (target.fogOn) {
        fogRef.current.near = THREE.MathUtils.lerp(fogRef.current.near, 20, spd);
        fogRef.current.far = THREE.MathUtils.lerp(fogRef.current.far, 50, spd);
      } else {
        fogRef.current.near = THREE.MathUtils.lerp(fogRef.current.near, 200, spd);
        fogRef.current.far = THREE.MathUtils.lerp(fogRef.current.far, 300, spd);
      }
      fogRef.current.color.copy(c.bg);
    }
  });
  return _jsxs(_Fragment, {
    children: [
      _jsx('ambientLight', {
        ref: ambientRef,
        intensity: cur.current.ambient,
        color: cur.current.ambientCol,
      }),
      _jsx('directionalLight', {
        ref: dirRef,
        position: [10, 15, 5],
        intensity: cur.current.dir,
        color: cur.current.dirCol,
        castShadow: true,
        'shadow-mapSize': [1024, 1024],
      }),
      _jsx('directionalLight', {
        ref: rimRef,
        position: [-8, 10, -10],
        intensity: cur.current.dir * 0.3,
        color: cur.current.dirCol,
      }),
      _jsx('pointLight', {
        ref: campfireRef1,
        position: [0, 1.5, 0],
        intensity: cur.current.campfire,
        color: cur.current.campfireCol,
        distance: 15,
        decay: 2,
      }),
      _jsx('pointLight', {
        ref: campfireRef2,
        position: [0, 0.5, 0],
        intensity: cur.current.campfire * 0.5,
        color: '#ff4400',
        distance: 8,
        decay: 2,
      }),
      _jsx('color', { attach: 'background', args: [cur.current.bg] }),
      _jsx('fog', {
        ref: fogRef,
        attach: 'fog',
        args: [cur.current.bg, target.fogOn ? 20 : 200, target.fogOn ? 50 : 300],
      }),
      _jsx('group', {
        ref: starsRef,
        children: _jsx(Stars, {
          radius: 50,
          depth: 50,
          count: 2000,
          factor: 3,
          fade: true,
          speed: 1,
        }),
      }),
      _jsx(CelestialBodies, {
        sunPos: sunPosTarget,
        moonPos: moonPosTarget,
        sunCol: sunColTarget,
        sunScale: target.sunScale,
        moonScale: target.moonScale,
      }),
      _jsx(Clouds, {}),
      _jsx(Ground, {}),
      _jsx(Campfire, {}),
      _jsx(Trees, {}),
      _jsx(WorldProps, { gameState: gameState }),
      _jsx(Atmosphere, { phase: phase }),
      gameState?.players.map((player, i) =>
        _jsx(
          Character,
          { player: player, index: i, total: gameState.players.length, gameState: gameState },
          player.id,
        ),
      ),
      _jsx(OrbitControls, {
        makeDefault: true,
        minDistance: 5,
        maxDistance: 25,
        maxPolarAngle: Math.PI / 2.2,
        target: [0, 1, 0],
        enableDamping: true,
      }),
    ],
  });
}
