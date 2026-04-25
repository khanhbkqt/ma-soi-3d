import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';
import { Phase } from '@ma-soi/shared';
// ── Seeded random ──
function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
// ── Tree Types (no castShadow on distant trees) ──
function PineTree({ position, scale = 1 }) {
  return _jsxs('group', {
    position: position,
    scale: scale,
    children: [
      _jsxs('mesh', {
        position: [0, 0.6, 0],
        children: [
          _jsx('cylinderGeometry', { args: [0.08, 0.14, 1.2, 6] }),
          _jsx('meshStandardMaterial', { color: '#3d2a15', roughness: 1 }),
        ],
      }),
      [
        { y: 1.4, r: 0.65, h: 1.1 },
        { y: 2.0, r: 0.48, h: 0.85 },
        { y: 2.5, r: 0.3, h: 0.65 },
      ].map((l, i) =>
        _jsxs(
          'mesh',
          {
            position: [0, l.y, 0],
            children: [
              _jsx('coneGeometry', { args: [l.r, l.h, 7] }),
              _jsx('meshStandardMaterial', {
                color: `hsl(130, ${55 + i * 8}%, ${18 + i * 5}%)`,
                roughness: 0.9,
              }),
            ],
          },
          i,
        ),
      ),
    ],
  });
}
function OakTree({ position, scale = 1 }) {
  const rng = useMemo(() => seeded(position[0] * 1000 + position[2] * 100), []);
  const clusters = useMemo(
    () =>
      Array.from({ length: 4 }, () => ({
        x: (rng() - 0.5) * 0.6,
        y: 1.6 + rng() * 0.5,
        z: (rng() - 0.5) * 0.6,
        r: 0.3 + rng() * 0.25,
      })),
    [],
  );
  return _jsxs('group', {
    position: position,
    scale: scale,
    children: [
      _jsxs('mesh', {
        position: [0, 0.7, 0],
        children: [
          _jsx('cylinderGeometry', { args: [0.1, 0.16, 1.4, 6] }),
          _jsx('meshStandardMaterial', { color: '#4a3018', roughness: 1 }),
        ],
      }),
      clusters.map((c, i) =>
        _jsxs(
          'mesh',
          {
            position: [c.x, c.y, c.z],
            children: [
              _jsx('sphereGeometry', { args: [c.r, 8, 8] }),
              _jsx('meshStandardMaterial', {
                color: `hsl(110, ${45 + i * 5}%, ${22 + i * 3}%)`,
                roughness: 0.85,
              }),
            ],
          },
          i,
        ),
      ),
    ],
  });
}
function DeadTree({ position, scale = 1 }) {
  const rng = useMemo(() => seeded(position[0] * 999 + position[2] * 77), []);
  const branches = useMemo(
    () =>
      Array.from({ length: 4 }, () => ({
        y: 0.8 + rng() * 0.8,
        rx: (rng() - 0.5) * 1.5,
        rz: (rng() - 0.5) * 1.5,
        len: 0.3 + rng() * 0.4,
      })),
    [],
  );
  return _jsxs('group', {
    position: position,
    scale: scale,
    children: [
      _jsxs('mesh', {
        position: [0, 0.8, 0],
        children: [
          _jsx('cylinderGeometry', { args: [0.06, 0.12, 1.6, 5] }),
          _jsx('meshStandardMaterial', { color: '#3a2a1a', roughness: 1 }),
        ],
      }),
      branches.map((b, i) =>
        _jsxs(
          'mesh',
          {
            position: [0, b.y, 0],
            rotation: [b.rx, 0, b.rz],
            children: [
              _jsx('cylinderGeometry', { args: [0.02, 0.04, b.len, 4] }),
              _jsx('meshStandardMaterial', { color: '#4a3a28', roughness: 1 }),
            ],
          },
          i,
        ),
      ),
    ],
  });
}
// ── Small Props (InstancedMesh for rocks) ──
function Mushroom({ position }) {
  return _jsxs('group', {
    position: position,
    children: [
      _jsxs('mesh', {
        position: [0, 0.06, 0],
        children: [
          _jsx('cylinderGeometry', { args: [0.02, 0.025, 0.12, 5] }),
          _jsx('meshStandardMaterial', { color: '#e8dcc8', roughness: 0.8 }),
        ],
      }),
      _jsxs('mesh', {
        position: [0, 0.14, 0],
        children: [
          _jsx('sphereGeometry', { args: [0.05, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2] }),
          _jsx('meshStandardMaterial', { color: '#cc3322', roughness: 0.7 }),
        ],
      }),
    ],
  });
}
function InstancedRocks({ rocks }) {
  const ref = useRef(null);
  const count = rocks.length;
  useEffect(() => {
    if (!ref.current || count === 0) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const euler = new THREE.Euler();
    rocks.forEach((r, i) => {
      const rng = seeded(r.seed);
      euler.set(rng() * 0.5, rng() * Math.PI, 0);
      q.setFromEuler(euler);
      m.compose(new THREE.Vector3(...r.pos), q, new THREE.Vector3(r.scale, r.scale, r.scale));
      ref.current.setMatrixAt(i, m);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  }, [rocks, count]);
  if (count === 0) return null;
  return _jsxs('instancedMesh', {
    ref: ref,
    args: [undefined, undefined, count],
    children: [
      _jsx('dodecahedronGeometry', { args: [0.15, 0] }),
      _jsx('meshStandardMaterial', { color: '#6a6a60', roughness: 0.95 }),
    ],
  });
}
function Bush({ position, scale = 1 }) {
  return _jsx('group', {
    position: position,
    scale: scale,
    children: [
      [-0.08, 0.1, 0],
      [0.08, 0.12, 0.05],
      [0, 0.15, -0.06],
    ].map((p, i) =>
      _jsxs(
        'mesh',
        {
          position: p,
          children: [
            _jsx('sphereGeometry', { args: [0.12 + i * 0.02, 6, 6] }),
            _jsx('meshStandardMaterial', {
              color: `hsl(125, 50%, ${16 + i * 3}%)`,
              roughness: 0.9,
            }),
          ],
        },
        i,
      ),
    ),
  });
}
// ── House ──
function House({ position, rotation = 0 }) {
  const phase = useGameStore((s) => s.gameState?.phase);
  const isNight = phase === Phase.Night || phase === Phase.Dusk || phase === Phase.Judgement;
  const windowEmissive = isNight ? '#ffaa44' : '#000000';
  const windowIntensity = isNight ? 0.8 : 0;
  return _jsxs('group', {
    position: position,
    rotation: [0, rotation, 0],
    children: [
      _jsxs('mesh', {
        position: [0, 0.6, 0],
        castShadow: true,
        children: [
          _jsx('boxGeometry', { args: [1.2, 1.2, 1] }),
          _jsx('meshStandardMaterial', { color: '#8B7355', roughness: 0.9 }),
        ],
      }),
      _jsxs('mesh', {
        position: [0, 1.5, 0],
        rotation: [0, Math.PI / 4, 0],
        children: [
          _jsx('coneGeometry', { args: [1, 0.8, 4] }),
          _jsx('meshStandardMaterial', { color: '#6B3A2A', roughness: 0.9 }),
        ],
      }),
      _jsxs('mesh', {
        position: [0, 0.35, 0.51],
        children: [
          _jsx('boxGeometry', { args: [0.3, 0.6, 0.02] }),
          _jsx('meshStandardMaterial', { color: '#3d2817' }),
        ],
      }),
      [
        [-0.35, 0.7, 0.51],
        [0.35, 0.7, 0.51],
      ].map((p, i) =>
        _jsxs(
          'mesh',
          {
            position: p,
            children: [
              _jsx('boxGeometry', { args: [0.18, 0.18, 0.02] }),
              _jsx('meshStandardMaterial', {
                color: '#2a1a0a',
                emissive: windowEmissive,
                emissiveIntensity: windowIntensity,
              }),
            ],
          },
          i,
        ),
      ),
      _jsxs('mesh', {
        position: [0.35, 1.8, -0.2],
        children: [
          _jsx('cylinderGeometry', { args: [0.08, 0.1, 0.5, 6] }),
          _jsx('meshStandardMaterial', { color: '#5a4a3a', roughness: 1 }),
        ],
      }),
    ],
  });
}
// ── Main ──
export default function Trees() {
  const items = useMemo(() => {
    const rng = seeded(42);
    const trees = [];
    const mushrooms = [];
    const rocks = [];
    const bushes = [];
    for (let i = 0; i < 35; i++) {
      const a = rng() * Math.PI * 2;
      const d = 8 + rng() * 10;
      const pos = [Math.cos(a) * d, 0, Math.sin(a) * d];
      const r = rng();
      const type = r < 0.5 ? 'pine' : r < 0.8 ? 'oak' : 'dead';
      trees.push({ type, pos, scale: 0.8 + rng() * 0.7 });
      if (rng() < 0.3)
        mushrooms.push({
          pos: [pos[0] + (rng() - 0.5) * 1.5, 0, pos[2] + (rng() - 0.5) * 1.5],
        });
      if (rng() < 0.3)
        rocks.push({
          pos: [pos[0] + (rng() - 0.5) * 2, 0, pos[2] + (rng() - 0.5) * 2],
          scale: 0.5 + rng() * 0.8,
          seed: i * 7919,
        });
      if (rng() < 0.2)
        bushes.push({
          pos: [pos[0] + (rng() - 0.5) * 2, 0, pos[2] + (rng() - 0.5) * 2],
          scale: 0.7 + rng() * 0.6,
        });
    }
    return { trees, mushrooms, rocks, bushes };
  }, []);
  return _jsxs('group', {
    children: [
      items.trees.map((t, i) => {
        const C = t.type === 'pine' ? PineTree : t.type === 'oak' ? OakTree : DeadTree;
        return _jsx(C, { position: t.pos, scale: t.scale }, i);
      }),
      items.mushrooms.map((m, i) => _jsx(Mushroom, { position: m.pos }, `m${i}`)),
      _jsx(InstancedRocks, { rocks: items.rocks }),
      items.bushes.map((b, i) => _jsx(Bush, { position: b.pos, scale: b.scale }, `b${i}`)),
      _jsx(House, { position: [-8, 0, -6], rotation: 0.3 }),
      _jsx(House, { position: [7, 0, -8], rotation: -0.5 }),
      _jsx(House, { position: [-6, 0, 8], rotation: 1.2 }),
    ],
  });
}
