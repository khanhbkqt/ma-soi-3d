import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
// ── Fire Flame (additive blended planes) ──
function FireFlame({ delay, height = 1.2 }) {
  const ref = useRef(null);
  const color = useMemo(
    () => new THREE.Color().setHSL(0.06 + Math.random() * 0.04, 1, 0.5 + Math.random() * 0.2),
    [],
  );
  useFrame(() => {
    if (!ref.current) return;
    const t = (Date.now() * 0.0015 + delay) % 1;
    ref.current.position.y = 0.2 + t * height;
    ref.current.position.x = Math.sin(Date.now() * 0.004 + delay * 13) * 0.1;
    ref.current.position.z = Math.cos(Date.now() * 0.003 + delay * 9) * 0.1;
    const s = (1 - t) * 0.2;
    ref.current.scale.set(s * 1.5, s * 2, 1);
    ref.current.material.opacity = (1 - t) * 0.7;
  });
  return _jsxs('mesh', {
    ref: ref,
    rotation: [0, delay * 2, 0],
    children: [
      _jsx('planeGeometry', { args: [1, 1] }),
      _jsx('meshBasicMaterial', {
        color: color,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    ],
  });
}
// ── Ember (small rising dot) ──
function Ember({ delay }) {
  const ref = useRef(null);
  useFrame(() => {
    if (!ref.current) return;
    const t = ((Date.now() * 0.0008 + delay) % 2.5) / 2.5;
    ref.current.position.y = 0.3 + t * 2.5;
    ref.current.position.x = Math.sin(Date.now() * 0.002 + delay * 17) * (0.2 + t * 0.4);
    ref.current.position.z = Math.cos(Date.now() * 0.0025 + delay * 11) * (0.2 + t * 0.3);
    ref.current.scale.setScalar((1 - t) * 0.025);
    ref.current.material.opacity = (1 - t) * 0.9;
  });
  return _jsxs('mesh', {
    ref: ref,
    children: [
      _jsx('sphereGeometry', { args: [1, 4, 4] }),
      _jsx('meshBasicMaterial', {
        color: '#ff6600',
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    ],
  });
}
// ── Smoke ──
function SmokeParticle({ delay }) {
  const ref = useRef(null);
  useFrame(() => {
    if (!ref.current) return;
    const t = ((Date.now() * 0.0005 + delay) % 4) / 4;
    ref.current.position.y = 1 + t * 3;
    ref.current.position.x = Math.sin(delay * 5) * t * 0.8;
    ref.current.position.z = Math.cos(delay * 7) * t * 0.5;
    const s = 0.1 + t * 0.4;
    ref.current.scale.setScalar(s);
    ref.current.material.opacity = (1 - t) * 0.12;
  });
  return _jsxs('mesh', {
    ref: ref,
    children: [
      _jsx('sphereGeometry', { args: [1, 6, 6] }),
      _jsx('meshBasicMaterial', { color: '#888888', transparent: true, depthWrite: false }),
    ],
  });
}
// ── Spark (fast upward) ──
function Spark({ delay }) {
  const ref = useRef(null);
  useFrame(() => {
    if (!ref.current) return;
    const t = ((Date.now() * 0.003 + delay) % 1.5) / 1.5;
    ref.current.position.y = 0.4 + t * 3;
    ref.current.position.x = Math.sin(delay * 23) * 0.3 * (1 - t);
    ref.current.position.z = Math.cos(delay * 19) * 0.3 * (1 - t);
    ref.current.scale.setScalar((1 - t) * 0.015);
    ref.current.material.opacity = 1 - t;
  });
  return _jsxs('mesh', {
    ref: ref,
    children: [
      _jsx('sphereGeometry', { args: [1, 3, 3] }),
      _jsx('meshBasicMaterial', {
        color: '#ffee44',
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    ],
  });
}
export default function Campfire() {
  return _jsxs('group', {
    position: [0, 0, 0],
    children: [
      [0, 1, 2, 3].map((i) => {
        const a = i * 1.57;
        return _jsxs(
          'mesh',
          {
            position: [Math.cos(a) * 0.2, 0.08, Math.sin(a) * 0.2],
            rotation: [0.3, a, 0.15],
            castShadow: true,
            children: [
              _jsx('cylinderGeometry', { args: [0.04, 0.055, 0.55, 6] }),
              _jsx('meshStandardMaterial', {
                color: '#3d2817',
                roughness: 1,
                emissive: '#ff3300',
                emissiveIntensity: 0.15,
              }),
            ],
          },
          i,
        );
      }),
      Array.from({ length: 10 }).map((_, i) => {
        const a = (i / 10) * Math.PI * 2;
        return _jsxs(
          'mesh',
          {
            position: [Math.cos(a) * 0.45, 0.06, Math.sin(a) * 0.45],
            castShadow: true,
            children: [
              _jsx('dodecahedronGeometry', { args: [0.07 + (i % 3) * 0.01, 0] }),
              _jsx('meshStandardMaterial', { color: i % 2 ? '#555' : '#666', roughness: 1 }),
            ],
          },
          `s${i}`,
        );
      }),
      Array.from({ length: 8 }).map((_, i) => _jsx(FireFlame, { delay: i * 0.13 }, i)),
      Array.from({ length: 10 }).map((_, i) => _jsx(Ember, { delay: i * 0.25 }, `e${i}`)),
      Array.from({ length: 5 }).map((_, i) => _jsx(SmokeParticle, { delay: i * 0.8 }, `sm${i}`)),
      Array.from({ length: 6 }).map((_, i) => _jsx(Spark, { delay: i * 0.25 }, `sp${i}`)),
      _jsxs('mesh', {
        position: [0, 0.2, 0],
        children: [
          _jsx('sphereGeometry', { args: [0.25, 8, 8] }),
          _jsx('meshBasicMaterial', {
            color: '#ff4400',
            transparent: true,
            opacity: 0.2,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          }),
        ],
      }),
      _jsxs('mesh', {
        position: [0, 0.8, 0],
        children: [
          _jsx('sphereGeometry', { args: [0.4, 8, 8] }),
          _jsx('meshBasicMaterial', {
            color: '#ff6622',
            transparent: true,
            opacity: 0.06,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          }),
        ],
      }),
    ],
  });
}
