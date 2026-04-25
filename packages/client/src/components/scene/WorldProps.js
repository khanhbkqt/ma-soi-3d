import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from 'react/jsx-runtime';
import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Phase } from '@ma-soi/shared';
// ── Instanced Fence ──
function InstancedFenceRing() {
  const postsRef = useRef(null);
  const railsRef = useRef(null);
  const sections = useMemo(() => {
    const items = [];
    const count = 14;
    for (let i = 0; i < count; i++) {
      const a = -2.1 + (i / (count - 1)) * 4.2;
      const r = 6.5;
      items.push({ pos: [Math.cos(a) * r, 0, Math.sin(a) * r], rot: a + Math.PI / 2 });
    }
    return items;
  }, []);
  useEffect(() => {
    if (!postsRef.current || !railsRef.current) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const euler = new THREE.Euler();
    const pos = new THREE.Vector3();
    const scale = new THREE.Vector3(1, 1, 1);
    // 2 posts per section
    sections.forEach((s, si) => {
      euler.set(0, s.rot, 0);
      q.setFromEuler(euler);
      [-0.5, 0.5].forEach((x, pi) => {
        // Transform local post position by section rotation
        pos
          .set(x, 0.3, 0)
          .applyQuaternion(q)
          .add(new THREE.Vector3(...s.pos));
        m.compose(pos, q, scale);
        postsRef.current.setMatrixAt(si * 2 + pi, m);
      });
      // 2 rails per section
      [0.2, 0.4].forEach((y, ri) => {
        pos
          .set(0, y, 0)
          .applyQuaternion(q)
          .add(new THREE.Vector3(...s.pos));
        m.compose(pos, q, scale);
        railsRef.current.setMatrixAt(si * 2 + ri, m);
      });
    });
    postsRef.current.instanceMatrix.needsUpdate = true;
    railsRef.current.instanceMatrix.needsUpdate = true;
  }, [sections]);
  const postCount = sections.length * 2;
  const railCount = sections.length * 2;
  return _jsxs(_Fragment, {
    children: [
      _jsxs('instancedMesh', {
        ref: postsRef,
        args: [undefined, undefined, postCount],
        children: [
          _jsx('cylinderGeometry', { args: [0.03, 0.04, 0.6, 5] }),
          _jsx('meshStandardMaterial', { color: '#5a4020', roughness: 1 }),
        ],
      }),
      _jsxs('instancedMesh', {
        ref: railsRef,
        args: [undefined, undefined, railCount],
        children: [
          _jsx('boxGeometry', { args: [1.1, 0.04, 0.03] }),
          _jsx('meshStandardMaterial', { color: '#6a5030', roughness: 0.95 }),
        ],
      }),
    ],
  });
}
// ── Well ──
function Well({ position }) {
  return _jsxs('group', {
    position: position,
    children: [
      _jsxs('mesh', {
        position: [0, 0.25, 0],
        children: [
          _jsx('cylinderGeometry', { args: [0.35, 0.4, 0.5, 8] }),
          _jsx('meshStandardMaterial', { color: '#7a7068', roughness: 1 }),
        ],
      }),
      [-0.25, 0.25].map((x, i) =>
        _jsxs(
          'mesh',
          {
            position: [x, 0.7, 0],
            children: [
              _jsx('cylinderGeometry', { args: [0.025, 0.03, 0.9, 4] }),
              _jsx('meshStandardMaterial', { color: '#4a3520', roughness: 1 }),
            ],
          },
          i,
        ),
      ),
      _jsxs('mesh', {
        position: [0, 1.2, 0],
        children: [
          _jsx('boxGeometry', { args: [0.7, 0.04, 0.15] }),
          _jsx('meshStandardMaterial', { color: '#5a3a20', roughness: 0.95 }),
        ],
      }),
      _jsxs('mesh', {
        position: [0, 1.35, 0],
        children: [
          _jsx('coneGeometry', { args: [0.45, 0.3, 4] }),
          _jsx('meshStandardMaterial', { color: '#6B3A2A', roughness: 0.9 }),
        ],
      }),
      _jsxs('mesh', {
        position: [0, 0.6, 0],
        children: [
          _jsx('cylinderGeometry', { args: [0.06, 0.08, 0.1, 6] }),
          _jsx('meshStandardMaterial', { color: '#5a4a30', roughness: 0.9 }),
        ],
      }),
    ],
  });
}
// ── Lantern ──
function Lantern({ position, isNight }) {
  const glowRef = useRef(null);
  useFrame(() => {
    if (glowRef.current) {
      glowRef.current.intensity = isNight ? 1.5 + Math.sin(Date.now() * 0.005) * 0.3 : 0.1;
    }
  });
  return _jsxs('group', {
    position: position,
    children: [
      _jsxs('mesh', {
        position: [0, 0.6, 0],
        children: [
          _jsx('cylinderGeometry', { args: [0.025, 0.035, 1.2, 5] }),
          _jsx('meshStandardMaterial', { color: '#4a3a28', roughness: 1 }),
        ],
      }),
      _jsxs('mesh', {
        position: [0, 1.3, 0],
        children: [
          _jsx('boxGeometry', { args: [0.12, 0.16, 0.12] }),
          _jsx('meshStandardMaterial', {
            color: '#8a7040',
            emissive: isNight ? '#ff9933' : '#000',
            emissiveIntensity: isNight ? 0.6 : 0,
            roughness: 0.7,
          }),
        ],
      }),
      _jsxs('mesh', {
        position: [0, 1.42, 0],
        children: [
          _jsx('coneGeometry', { args: [0.09, 0.08, 4] }),
          _jsx('meshStandardMaterial', { color: '#5a4a30', roughness: 0.9 }),
        ],
      }),
      _jsx('pointLight', {
        ref: glowRef,
        position: [0, 1.3, 0],
        color: '#ff9933',
        distance: 4,
        decay: 2,
        intensity: isNight ? 1.5 : 0.1,
      }),
    ],
  });
}
// ── Wooden Sign ──
function WoodenSign({ position, rotation = 0 }) {
  return _jsxs('group', {
    position: position,
    rotation: [0, rotation, 0],
    children: [
      _jsxs('mesh', {
        position: [0, 0.4, 0],
        children: [
          _jsx('cylinderGeometry', { args: [0.025, 0.03, 0.8, 4] }),
          _jsx('meshStandardMaterial', { color: '#4a3520', roughness: 1 }),
        ],
      }),
      _jsxs('mesh', {
        position: [0, 0.7, 0],
        children: [
          _jsx('boxGeometry', { args: [0.5, 0.25, 0.03] }),
          _jsx('meshStandardMaterial', { color: '#6a5530', roughness: 0.9 }),
        ],
      }),
    ],
  });
}
// ── Gravestone ──
function Gravestone({ position }) {
  return _jsxs('group', {
    position: position,
    children: [
      _jsxs('mesh', {
        position: [0, 0.2, 0],
        children: [
          _jsx('boxGeometry', { args: [0.25, 0.4, 0.06] }),
          _jsx('meshStandardMaterial', { color: '#6a6a6a', roughness: 0.95 }),
        ],
      }),
      _jsxs('mesh', {
        position: [0, 0.45, 0.01],
        children: [
          _jsx('boxGeometry', { args: [0.15, 0.03, 0.02] }),
          _jsx('meshStandardMaterial', { color: '#5a5a5a', roughness: 0.95 }),
        ],
      }),
      _jsxs('mesh', {
        position: [0, 0.45, 0.01],
        children: [
          _jsx('boxGeometry', { args: [0.03, 0.15, 0.02] }),
          _jsx('meshStandardMaterial', { color: '#5a5a5a', roughness: 0.95 }),
        ],
      }),
    ],
  });
}
// ── Main ──
export default function WorldProps({ gameState }) {
  const phase = gameState?.phase;
  const isNight = phase === Phase.Night || phase === Phase.Dusk || phase === Phase.Judgement;
  const deadPlayers = useMemo(() => {
    if (!gameState) return [];
    return gameState.players.map((p, i) => ({ ...p, index: i })).filter((p) => !p.alive);
  }, [gameState?.players.map((p) => p.alive).join(',')]);
  const gravestonePositions = useMemo(
    () =>
      deadPlayers.map((p, i) => {
        const a = -1.8 + i * 0.5;
        const r = 7.2;
        return [Math.cos(a) * r, 0, Math.sin(a) * r];
      }),
    [deadPlayers.length],
  );
  return _jsxs('group', {
    children: [
      _jsx(InstancedFenceRing, {}),
      _jsx(Well, { position: [5.5, 0, 3] }),
      _jsx(Lantern, { position: [-3, 0, 5.8], isNight: isNight }),
      _jsx(Lantern, { position: [3, 0, -5.8], isNight: isNight }),
      _jsx(Lantern, { position: [-5.5, 0, -2], isNight: isNight }),
      _jsx(WoodenSign, { position: [0, 0, 6.8], rotation: Math.PI }),
      gravestonePositions.map((pos, i) => _jsx(Gravestone, { position: pos }, deadPlayers[i].id)),
    ],
  });
}
