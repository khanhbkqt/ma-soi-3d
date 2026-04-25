import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
function makeGrassTexture(size = 512, dark = false) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  // Base
  ctx.fillStyle = dark ? '#1a3a0e' : '#2a5a18';
  ctx.fillRect(0, 0, size, size);
  // Noise blades
  for (let i = 0; i < 8000; i++) {
    const x = Math.random() * size,
      y = Math.random() * size;
    const g = dark ? Math.random() * 30 + 20 : Math.random() * 50 + 40;
    ctx.fillStyle = `rgb(${g * 0.4},${g + (dark ? 30 : 60)},${g * 0.3})`;
    ctx.fillRect(x, y, 1 + Math.random() * 2, 1 + Math.random() * 3);
  }
  // Patches
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * size,
      y = Math.random() * size,
      r = 10 + Math.random() * 30;
    ctx.fillStyle = dark ? `rgba(15,40,10,0.3)` : `rgba(30,70,20,0.25)`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(dark ? 4 : 3, dark ? 4 : 3);
  return tex;
}
function makeDirtTexture(size = 256) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#5c4a2e';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 3000; i++) {
    const x = Math.random() * size,
      y = Math.random() * size;
    const b = Math.random() * 40 + 60;
    ctx.fillStyle = `rgb(${b},${b * 0.8},${b * 0.5})`;
    ctx.fillRect(x, y, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}
function PathStones() {
  const ref = useRef(null);
  const COUNT = 24;
  const stones = useMemo(
    () =>
      Array.from({ length: COUNT }, (_, i) => {
        const a = (i / COUNT) * Math.PI * 2 + Math.random() * 0.2;
        const r = 2.5 + Math.random() * 2;
        return {
          pos: [Math.cos(a) * r, 0.02 + Math.random() * 0.03, Math.sin(a) * r],
          s: 0.04 + Math.random() * 0.06,
          rx: Math.random() * 0.3,
          ry: Math.random() * Math.PI,
        };
      }),
    [],
  );
  useEffect(() => {
    if (!ref.current) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const euler = new THREE.Euler();
    stones.forEach((s, i) => {
      euler.set(s.rx, s.ry, 0);
      q.setFromEuler(euler);
      m.compose(
        new THREE.Vector3(...s.pos),
        q,
        new THREE.Vector3(s.s / 0.06, s.s / 0.06, s.s / 0.06),
      );
      ref.current.setMatrixAt(i, m);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  }, [stones]);
  return _jsxs('instancedMesh', {
    ref: ref,
    args: [undefined, undefined, COUNT],
    receiveShadow: true,
    children: [
      _jsx('dodecahedronGeometry', { args: [0.06, 0] }),
      _jsx('meshStandardMaterial', { color: '#7a7060', roughness: 0.95 }),
    ],
  });
}
export default function Ground() {
  const grassTex = useMemo(() => makeGrassTexture(), []);
  const dirtTex = useMemo(() => makeDirtTexture(), []);
  const outerTex = useMemo(() => makeGrassTexture(512, true), []);
  // Displace vertices for inner clearing
  const innerGeo = useMemo(() => {
    const g = new THREE.CircleGeometry(6, 48);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i),
        y = pos.getY(i);
      const d = Math.sqrt(x * x + y * y);
      pos.setZ(i, Math.sin(x * 2.3) * Math.cos(y * 1.7) * 0.06 * (d / 6));
    }
    pos.needsUpdate = true;
    g.computeVertexNormals();
    return g;
  }, []);
  return _jsxs('group', {
    children: [
      _jsxs('mesh', {
        rotation: [-Math.PI / 2, 0, 0],
        position: [0, -0.03, 0],
        receiveShadow: true,
        children: [
          _jsx('circleGeometry', { args: [22, 48] }),
          _jsx('meshStandardMaterial', { map: outerTex, roughness: 1 }),
        ],
      }),
      _jsx('mesh', {
        rotation: [-Math.PI / 2, 0, 0],
        position: [0, 0, 0],
        receiveShadow: true,
        geometry: innerGeo,
        children: _jsx('meshStandardMaterial', { map: grassTex, roughness: 0.9 }),
      }),
      _jsxs('mesh', {
        rotation: [-Math.PI / 2, 0, 0],
        position: [0, 0.01, 0],
        receiveShadow: true,
        children: [
          _jsx('ringGeometry', { args: [2, 5.2, 48] }),
          _jsx('meshStandardMaterial', { map: dirtTex, roughness: 1 }),
        ],
      }),
      _jsx(PathStones, {}),
    ],
  });
}
