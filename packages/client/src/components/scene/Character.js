import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from 'react/jsx-runtime';
import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { Phase, Role, GameEventType, isWolfRole } from '@ma-soi/shared';
import { useGameStore } from '../../store/gameStore';
const ROLE_COLORS = {
  [Role.Werewolf]: '#cc2222',
  [Role.AlphaWolf]: '#aa1111',
  [Role.WolfCub]: '#ee4444',
  [Role.Villager]: '#44aa44',
  [Role.Seer]: '#9933cc',
  [Role.ApprenticeSeer]: '#bb66dd',
  [Role.Witch]: '#22aa66',
  [Role.Hunter]: '#ee6600',
  [Role.Guard]: '#2266cc',
  [Role.Cupid]: '#ee66aa',
  [Role.Fool]: '#ddaa22',
};
const ROLE_NAMES_VI = {
  [Role.Werewolf]: 'Sói',
  [Role.AlphaWolf]: 'Sói Đầu Đàn',
  [Role.WolfCub]: 'Sói Con',
  [Role.Villager]: 'Dân',
  [Role.Seer]: 'Tiên Tri',
  [Role.ApprenticeSeer]: 'TT Tập Sự',
  [Role.Witch]: 'Phù Thủy',
  [Role.Hunter]: 'Thợ Săn',
  [Role.Guard]: 'Bảo Vệ',
  [Role.Cupid]: 'Cupid',
  [Role.Fool]: 'Kẻ Ngốc',
};
// Cached vectors to avoid allocations in useFrame
const VEC_ONE = new THREE.Vector3(1, 1, 1);
const VEC_DIMMED = new THREE.Vector3(0.9, 0.9, 0.9);
const SKIN_COLORS = [
  '#e8b89d',
  '#d4956b',
  '#c68642',
  '#8d5524',
  '#f5d0a9',
  '#e0ac69',
  '#c49a6c',
  '#a0785a',
  '#f3c9a8',
  '#d9a87c',
  '#b8865e',
  '#9c6e4a',
  '#deb887',
  '#cd853f',
  '#d2a679',
  '#b5916b',
];
// ── Outfit System ──
const HAT_COLORS = [
  '#4a2a6a',
  '#2a4a2a',
  '#6a2a2a',
  '#2a3a5a',
  '#5a4a1a',
  '#3a5a5a',
  '#5a2a4a',
  '#4a4a2a',
];
const CLOAK_COLORS = [
  '#3a1a5a',
  '#1a3a1a',
  '#5a1a1a',
  '#1a2a4a',
  '#4a3a0a',
  '#2a4a4a',
  '#4a1a3a',
  '#3a3a1a',
];
function seededRng(seed) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
function getOutfit(index) {
  const rng = seededRng(index * 7919 + 31);
  return {
    hatType: Math.floor(rng() * 5), // wizard, farmer, hood, bandana, crown
    hatColor: HAT_COLORS[Math.floor(rng() * HAT_COLORS.length)],
    hasCloak: rng() > 0.3,
    cloakColor: CLOAK_COLORS[Math.floor(rng() * CLOAK_COLORS.length)],
    hasBelt: rng() > 0.5,
    beltColor: `hsl(${Math.floor(rng() * 360)}, 30%, 25%)`,
  };
}
// Hat components
function WizardHat({ color }) {
  return _jsxs('group', {
    position: [0, 0.65, 0],
    children: [
      _jsxs('mesh', {
        children: [
          _jsx('coneGeometry', { args: [0.12, 0.35, 8] }),
          _jsx('meshStandardMaterial', { color: color, roughness: 0.8 }),
        ],
      }),
      _jsxs('mesh', {
        position: [0, -0.12, 0],
        children: [
          _jsx('cylinderGeometry', { args: [0.18, 0.18, 0.03, 12] }),
          _jsx('meshStandardMaterial', { color: color, roughness: 0.8 }),
        ],
      }),
    ],
  });
}
function FarmerHat({ color }) {
  return _jsxs('group', {
    position: [0, 0.65, 0],
    children: [
      _jsxs('mesh', {
        children: [
          _jsx('cylinderGeometry', { args: [0.12, 0.13, 0.1, 8] }),
          _jsx('meshStandardMaterial', { color: color, roughness: 0.9 }),
        ],
      }),
      _jsxs('mesh', {
        position: [0, -0.03, 0],
        children: [
          _jsx('cylinderGeometry', { args: [0.22, 0.22, 0.02, 12] }),
          _jsx('meshStandardMaterial', { color: color, roughness: 0.9 }),
        ],
      }),
    ],
  });
}
function Hood({ color }) {
  return _jsxs('mesh', {
    position: [0, 0.55, -0.05],
    children: [
      _jsx('sphereGeometry', { args: [0.2, 8, 8, 0, Math.PI * 2, 0, Math.PI * 0.6] }),
      _jsx('meshStandardMaterial', { color: color, roughness: 0.85, side: THREE.DoubleSide }),
    ],
  });
}
function Bandana({ color }) {
  return _jsxs('mesh', {
    position: [0, 0.58, 0.02],
    children: [
      _jsx('boxGeometry', { args: [0.3, 0.06, 0.25] }),
      _jsx('meshStandardMaterial', { color: color, roughness: 0.8 }),
    ],
  });
}
function Crown() {
  return _jsxs('group', {
    position: [0, 0.65, 0],
    children: [
      _jsxs('mesh', {
        children: [
          _jsx('cylinderGeometry', { args: [0.14, 0.16, 0.08, 8] }),
          _jsx('meshStandardMaterial', { color: '#c8a820', metalness: 0.6, roughness: 0.3 }),
        ],
      }),
      [0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2;
        return _jsxs(
          'mesh',
          {
            position: [Math.cos(a) * 0.13, 0.06, Math.sin(a) * 0.13],
            children: [
              _jsx('coneGeometry', { args: [0.02, 0.06, 4] }),
              _jsx('meshStandardMaterial', { color: '#dab830', metalness: 0.6, roughness: 0.3 }),
            ],
          },
          i,
        );
      }),
    ],
  });
}
function Hat({ type, color }) {
  switch (type) {
    case 0:
      return _jsx(WizardHat, { color: color });
    case 1:
      return _jsx(FarmerHat, { color: color });
    case 2:
      return _jsx(Hood, { color: color });
    case 3:
      return _jsx(Bandana, { color: color });
    case 4:
      return _jsx(Crown, {});
    default:
      return null;
  }
}
function Cloak({ color }) {
  return _jsxs('mesh', {
    position: [0, 0.05, -0.18],
    rotation: [0.15, 0, 0],
    castShadow: true,
    children: [
      _jsx('boxGeometry', { args: [0.35, 0.55, 0.04] }),
      _jsx('meshStandardMaterial', { color: color, roughness: 0.85 }),
    ],
  });
}
function WolfEyes() {
  return _jsxs(_Fragment, {
    children: [
      _jsxs('mesh', {
        position: [-0.06, 0.52, 0.16],
        children: [
          _jsx('sphereGeometry', { args: [0.03, 6, 6] }),
          _jsx('meshBasicMaterial', { color: '#ff2200' }),
        ],
      }),
      _jsxs('mesh', {
        position: [0.06, 0.52, 0.16],
        children: [
          _jsx('sphereGeometry', { args: [0.03, 6, 6] }),
          _jsx('meshBasicMaterial', { color: '#ff2200' }),
        ],
      }),
      _jsxs('mesh', {
        position: [-0.06, 0.52, 0.16],
        children: [
          _jsx('sphereGeometry', { args: [0.05, 6, 6] }),
          _jsx('meshBasicMaterial', { color: '#ff4400', transparent: true, opacity: 0.3 }),
        ],
      }),
      _jsxs('mesh', {
        position: [0.06, 0.52, 0.16],
        children: [
          _jsx('sphereGeometry', { args: [0.05, 6, 6] }),
          _jsx('meshBasicMaterial', { color: '#ff4400', transparent: true, opacity: 0.3 }),
        ],
      }),
    ],
  });
}
// ── VFX Components ──
function ThinkingDots() {
  const ref = useRef(null);
  useFrame(() => {
    if (!ref.current) return;
    const t = Date.now() * 0.003;
    ref.current.children.forEach((c, i) => {
      c.position.y = Math.sin(t + i * 1.2) * 0.06;
      c.scale.setScalar(0.04 + Math.sin(t + i * 1.2) * 0.015);
    });
  });
  return _jsx('group', {
    ref: ref,
    position: [0, 0.85, 0.2],
    children: [0, 1, 2].map((i) =>
      _jsxs(
        'mesh',
        {
          position: [(i - 1) * 0.08, 0, 0],
          children: [
            _jsx('sphereGeometry', { args: [1, 8, 8] }),
            _jsx('meshBasicMaterial', { color: '#66bbff', transparent: true, opacity: 0.8 }),
          ],
        },
        i,
      ),
    ),
  });
}
function ZzzParticles() {
  const ref = useRef(null);
  useFrame(() => {
    if (!ref.current) return;
    ref.current.children.forEach((c, i) => {
      const t = ((Date.now() * 0.001 + i * 0.5) % 3) / 3;
      c.position.y = 0.5 + t * 1;
      c.position.x = Math.sin(t * 3 + i) * 0.3;
      c.scale.setScalar((1 - t) * 0.15);
    });
  });
  return _jsx('group', {
    ref: ref,
    position: [0.3, 1.2, 0],
    children: [0, 1, 2].map((i) =>
      _jsxs(
        'mesh',
        {
          children: [
            _jsx('sphereGeometry', { args: [1, 4, 4] }),
            _jsx('meshBasicMaterial', { color: '#aaccff', transparent: true, opacity: 0.6 }),
          ],
        },
        i,
      ),
    ),
  });
}
function WolfSlash({ active }) {
  const matRef = useRef(null);
  const opacityRef = useRef(0);
  const visibleRef = useRef(false);
  const groupRef = useRef(null);
  useEffect(() => {
    if (active) {
      opacityRef.current = 1;
      visibleRef.current = true;
      if (groupRef.current) groupRef.current.visible = true;
    }
  }, [active]);
  useFrame((_, dt) => {
    if (!visibleRef.current) return;
    opacityRef.current = Math.max(0, opacityRef.current - dt * 2);
    if (matRef.current) matRef.current.opacity = opacityRef.current;
    if (opacityRef.current <= 0) {
      visibleRef.current = false;
      if (groupRef.current) groupRef.current.visible = false;
    }
  });
  return _jsxs('mesh', {
    ref: groupRef,
    position: [0, 1, 0.3],
    rotation: [0, 0, -0.5],
    visible: false,
    children: [
      _jsx('planeGeometry', { args: [0.8, 0.15] }),
      _jsx('meshBasicMaterial', {
        ref: matRef,
        color: '#ff0000',
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
      }),
    ],
  });
}
function ShieldBubble() {
  const ref = useRef(null);
  useFrame(() => {
    if (!ref.current) return;
    ref.current.rotation.y += 0.02;
    ref.current.material.opacity = 0.15 + Math.sin(Date.now() * 0.003) * 0.05;
  });
  return _jsxs('mesh', {
    ref: ref,
    position: [0, 0.8, 0],
    children: [
      _jsx('sphereGeometry', { args: [0.6, 16, 16] }),
      _jsx('meshBasicMaterial', {
        color: '#4488ff',
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide,
      }),
    ],
  });
}
function SeerGlow() {
  const ref = useRef(null);
  useFrame(() => {
    if (!ref.current) return;
    const s = 0.15 + Math.sin(Date.now() * 0.005) * 0.05;
    ref.current.scale.setScalar(s);
  });
  return _jsxs('mesh', {
    ref: ref,
    position: [0, 1.4, 0.15],
    children: [
      _jsx('sphereGeometry', { args: [1, 8, 8] }),
      _jsx('meshBasicMaterial', { color: '#cc66ff', transparent: true, opacity: 0.4 }),
    ],
  });
}
function PotionBurst({ color }) {
  const groupRef = useRef(null);
  const lifeRef = useRef(1);
  useFrame((_, dt) => {
    lifeRef.current = Math.max(0, lifeRef.current - dt * 0.8);
    const life = lifeRef.current;
    if (!groupRef.current) return;
    if (life <= 0) {
      groupRef.current.visible = false;
      return;
    }
    groupRef.current.children.forEach((c, i) => {
      const a = (i / 5) * Math.PI * 2;
      const r = (1 - life) * 0.8;
      c.position.set(Math.cos(a) * r, Math.sin(a) * r * 0.5, 0);
      c.scale.setScalar(life * 0.1);
      c.material.opacity = life * 0.7;
    });
  });
  return _jsx('group', {
    ref: groupRef,
    position: [0, 1, 0],
    children: [0, 1, 2, 3, 4].map((i) =>
      _jsxs(
        'mesh',
        {
          children: [
            _jsx('sphereGeometry', { args: [1, 6, 6] }),
            _jsx('meshBasicMaterial', { color: color, transparent: true, opacity: 0.7 }),
          ],
        },
        i,
      ),
    ),
  });
}
function LoveParticles() {
  const ref = useRef(null);
  const lifeRef = useRef(1);
  useFrame((_, dt) => {
    lifeRef.current = Math.max(0, lifeRef.current - dt * 0.2);
    if (!ref.current) return;
    const life = lifeRef.current;
    if (life <= 0) {
      ref.current.visible = false;
      return;
    }
    ref.current.children.forEach((c, i) => {
      const t = ((Date.now() * 0.001 + i * 0.3) % 2) / 2;
      c.position.y = t * 3;
      c.position.x = Math.sin(t * 8 + i) * 0.5;
      c.scale.setScalar((1 - t) * 0.25 * life);
      c.material.opacity = 0.6 * life;
    });
  });
  return _jsx('group', {
    ref: ref,
    position: [0, 1.5, 0],
    children: Array.from({ length: 8 }).map((_, i) =>
      _jsxs(
        'mesh',
        {
          children: [
            _jsx('sphereGeometry', { args: [1, 6, 6] }),
            _jsx('meshBasicMaterial', { color: '#ff66b2', transparent: true, opacity: 0.6 }),
          ],
        },
        i,
      ),
    ),
  });
}
const NIGHT_ROLE_COLORS = {
  wolf: '#cc2222',
  guard: '#2266cc',
  seer: '#9933cc',
  witch: '#22aa66',
};
const NIGHT_ROLE_ICONS = {
  wolf: '🐾',
  guard: '🛡️',
  seer: '👁️',
  witch: '🧪',
};
function NightActiveGlow({ role }) {
  const ringRef = useRef(null);
  const col = NIGHT_ROLE_COLORS[role] || '#ffffff';
  useFrame(() => {
    if (!ringRef.current) return;
    const t = Date.now() * 0.003;
    ringRef.current.material.opacity = 0.2 + Math.sin(t) * 0.1;
    ringRef.current.rotation.z += 0.01;
  });
  return _jsxs('group', {
    children: [
      _jsxs('mesh', {
        ref: ringRef,
        position: [0, 0.04, 0],
        rotation: [Math.PI / 2, 0, 0],
        children: [
          _jsx('ringGeometry', { args: [0.45, 0.7, 24] }),
          _jsx('meshBasicMaterial', {
            color: col,
            transparent: true,
            opacity: 0.25,
            side: THREE.DoubleSide,
          }),
        ],
      }),
      _jsx('pointLight', {
        position: [0, 0.5, 0],
        color: col,
        intensity: 2,
        distance: 3,
        decay: 2,
      }),
    ],
  });
}
function DefenseSpotlight({ isDefending }) {
  const coneRef = useRef(null);
  const ringRef = useRef(null);
  const fireRef = useRef(null);
  useFrame(() => {
    const t = Date.now() * 0.004;
    if (coneRef.current) coneRef.current.material.opacity = 0.06 + Math.sin(t) * 0.03;
    if (ringRef.current) {
      ringRef.current.material.opacity = 0.2 + Math.sin(t) * 0.1;
      ringRef.current.rotation.z += 0.02;
    }
    if (fireRef.current) {
      fireRef.current.children.forEach((c, i) => {
        const ft = ((Date.now() * 0.003 + i * 0.8) % 2) / 2;
        const a = (i / 8) * Math.PI * 2 + Date.now() * 0.001;
        c.position.set(Math.cos(a) * 0.6, ft * 0.8, Math.sin(a) * 0.6);
        c.scale.setScalar((1 - ft) * 0.06);
      });
    }
  });
  return _jsxs('group', {
    children: [
      _jsxs('mesh', {
        ref: ringRef,
        position: [0, 0.05, 0],
        rotation: [Math.PI / 2, 0, 0],
        children: [
          _jsx('ringGeometry', { args: [0.5, 0.75, 32] }),
          _jsx('meshBasicMaterial', {
            color: '#ff2222',
            transparent: true,
            opacity: 0.25,
            side: THREE.DoubleSide,
          }),
        ],
      }),
      _jsxs('mesh', {
        ref: coneRef,
        position: [0, 2.5, 0],
        children: [
          _jsx('coneGeometry', { args: [0.8, 5, 16, 1, true] }),
          _jsx('meshBasicMaterial', {
            color: isDefending ? '#ffaa44' : '#ff4444',
            transparent: true,
            opacity: 0.08,
            side: THREE.DoubleSide,
          }),
        ],
      }),
      isDefending &&
        _jsx('group', {
          ref: fireRef,
          position: [0, 0.1, 0],
          children: Array.from({ length: 8 }).map((_, i) =>
            _jsxs(
              'mesh',
              {
                children: [
                  _jsx('sphereGeometry', { args: [1, 4, 4] }),
                  _jsx('meshBasicMaterial', { color: '#ff6622', transparent: true, opacity: 0.5 }),
                ],
              },
              i,
            ),
          ),
        }),
    ],
  });
}
// ── Execution Animation ──
function ExecutionEffect({ progressRef, phaseRef }) {
  const ropeRef = useRef(null);
  const burstRef = useRef(null);
  const groupRef = useRef(null);
  useFrame(() => {
    const phase = phaseRef.current;
    const progress = progressRef.current;
    if (!groupRef.current) return;
    groupRef.current.visible = phase !== 'none' && phase !== 'done';
    if (ropeRef.current) {
      ropeRef.current.visible = phase === 'rising' || phase === 'hanging';
      if (ropeRef.current.visible) {
        const ropeLen = Math.min(progress * 4, 3.5);
        ropeRef.current.scale.set(1, Math.max(0.01, ropeLen), 1);
        ropeRef.current.position.y = 1.4 + ropeLen / 2 + 1;
      }
    }
    if (burstRef.current) {
      burstRef.current.visible = phase === 'falling';
      if (phase === 'falling') {
        burstRef.current.children.forEach((c, i) => {
          const t = Math.min(1, progress * 2);
          const a = (i / 6) * Math.PI * 2;
          c.position.set(Math.cos(a) * t * 1.5, (1 - t) * 2, Math.sin(a) * t * 1.5);
          c.scale.setScalar((1 - t) * 0.08);
        });
      }
    }
  });
  return _jsxs('group', {
    ref: groupRef,
    visible: false,
    children: [
      _jsxs('mesh', {
        ref: ropeRef,
        position: [0, 3, 0],
        children: [
          _jsx('cylinderGeometry', { args: [0.015, 0.015, 1, 4] }),
          _jsx('meshBasicMaterial', { color: '#8B7355' }),
        ],
      }),
      _jsx('group', {
        ref: burstRef,
        position: [0, 1, 0],
        children: Array.from({ length: 6 }).map((_, i) =>
          _jsxs(
            'mesh',
            {
              children: [
                _jsx('sphereGeometry', { args: [1, 4, 4] }),
                _jsx('meshBasicMaterial', { color: '#ff4444', transparent: true, opacity: 0.6 }),
              ],
            },
            i,
          ),
        ),
      }),
    ],
  });
}
// ── Vote Visual Effects ──
function VoteArrow({ from, to }) {
  const points = useMemo(
    () => [
      new THREE.Vector3(...from),
      new THREE.Vector3(from[0], 2.2, from[2]),
      new THREE.Vector3(to[0], 2.2, to[2]),
      new THREE.Vector3(...to),
    ],
    [from, to],
  );
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points), [points]);
  const progressRef = useRef(0);
  const trailRef = useRef(null);
  const tubeRef = useRef(null);
  const headRef = useRef(null);
  const prevGeom = useRef(null);
  const UP = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  useFrame((_, dt) => {
    if (progressRef.current < 1) progressRef.current = Math.min(1, progressRef.current + dt * 2);
    const progress = progressRef.current;
    // Update tube geometry at discrete steps
    if (tubeRef.current) {
      const step = Math.floor(progress * 10);
      const prevStep = prevGeom.current ? prevGeom.current._step : -1;
      if (step !== prevStep) {
        const n = Math.max(2, Math.floor(30 * progress));
        const partial = new THREE.CatmullRomCurve3(curve.getPoints(n).slice(0, n));
        const newGeom = new THREE.TubeGeometry(partial, 20, 0.04, 8, false);
        newGeom._step = step;
        if (prevGeom.current) prevGeom.current.dispose();
        tubeRef.current.geometry = newGeom;
        prevGeom.current = newGeom;
      }
    }
    // Arrowhead
    if (headRef.current) {
      headRef.current.visible = progress > 0.1;
      if (progress > 0.1) {
        const pt = curve.getPoint(progress);
        const dir = curve.getTangent(progress).normalize();
        headRef.current.position.copy(pt);
        const q = new THREE.Quaternion();
        q.setFromUnitVectors(UP, dir);
        headRef.current.quaternion.copy(q);
      }
    }
    // Trail particles
    if (trailRef.current) {
      trailRef.current.children.forEach((c, i) => {
        const t = Math.max(0, progress - i * 0.08);
        const pt = curve.getPoint(Math.max(0, t));
        c.position.copy(pt);
        c.scale.setScalar(0.03 * (1 - i * 0.15));
      });
    }
  });
  return _jsxs('group', {
    children: [
      _jsx('mesh', {
        ref: tubeRef,
        children: _jsx('meshBasicMaterial', { color: '#ffaa00', transparent: true, opacity: 0.7 }),
      }),
      _jsxs('mesh', {
        ref: headRef,
        visible: false,
        children: [
          _jsx('coneGeometry', { args: [0.08, 0.2, 6] }),
          _jsx('meshBasicMaterial', { color: '#ff6600' }),
        ],
      }),
      _jsx('group', {
        ref: trailRef,
        children: [0, 1, 2, 3].map((i) =>
          _jsxs(
            'mesh',
            {
              children: [
                _jsx('sphereGeometry', { args: [1, 4, 4] }),
                _jsx('meshBasicMaterial', { color: '#ffcc44', transparent: true, opacity: 0.4 }),
              ],
            },
            i,
          ),
        ),
      }),
    ],
  });
}
function VoterGlow() {
  const ref = useRef(null);
  useFrame(() => {
    if (ref.current) ref.current.material.opacity = 0.12 + Math.sin(Date.now() * 0.003) * 0.05;
  });
  return _jsxs('mesh', {
    ref: ref,
    position: [0, 0.03, 0],
    rotation: [-Math.PI / 2, 0, 0],
    children: [
      _jsx('circleGeometry', { args: [0.5, 16] }),
      _jsx('meshBasicMaterial', { color: '#ffaa00', transparent: true, opacity: 0.15 }),
    ],
  });
}
function VoteTargetRing({ voteCount }) {
  const ref = useRef(null);
  useFrame(() => {
    if (!ref.current) return;
    ref.current.rotation.y += 0.02;
    const s = 1 + Math.sin(Date.now() * 0.004) * 0.08;
    ref.current.scale.setScalar(s);
  });
  const ringColor = voteCount >= 3 ? '#ff3333' : voteCount >= 2 ? '#ff8800' : '#ffcc00';
  return _jsxs('group', {
    ref: ref,
    position: [0, 0.05, 0],
    children: [
      _jsxs('mesh', {
        rotation: [Math.PI / 2, 0, 0],
        children: [
          _jsx('ringGeometry', { args: [0.55, 0.75, 32] }),
          _jsx('meshBasicMaterial', {
            color: ringColor,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide,
          }),
        ],
      }),
      _jsxs('mesh', {
        rotation: [Math.PI / 2, 0, 0],
        children: [
          _jsx('ringGeometry', { args: [0.8, 0.85, 32] }),
          _jsx('meshBasicMaterial', {
            color: ringColor,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide,
          }),
        ],
      }),
    ],
  });
}
function VoteParticles() {
  const ref = useRef(null);
  useFrame(() => {
    if (!ref.current) return;
    ref.current.children.forEach((c, i) => {
      const t = ((Date.now() * 0.002 + i * 1.2) % 4) / 4;
      const angle = (i / 6) * Math.PI * 2 + Date.now() * 0.001;
      const radius = 0.4 + t * 0.3;
      c.position.x = Math.cos(angle) * radius;
      c.position.z = Math.sin(angle) * radius;
      c.position.y = t * 1.5;
      c.scale.setScalar((1 - t) * 0.04);
    });
  });
  return _jsx('group', {
    ref: ref,
    position: [0, 0.2, 0],
    children: [0, 1, 2, 3, 4, 5].map((i) =>
      _jsxs(
        'mesh',
        {
          children: [
            _jsx('sphereGeometry', { args: [1, 4, 4] }),
            _jsx('meshBasicMaterial', { color: '#ffcc44', transparent: true, opacity: 0.5 }),
          ],
        },
        i,
      ),
    ),
  });
}
// ── Hover Glow ──
function HoverGlow() {
  const ref = useRef(null);
  useFrame(() => {
    if (!ref.current) return;
    const t = Date.now() * 0.003;
    ref.current.material.opacity = 0.12 + Math.sin(t) * 0.06;
    ref.current.rotation.y += 0.015;
  });
  return _jsxs('mesh', {
    ref: ref,
    position: [0, 0.05, 0],
    rotation: [Math.PI / 2, 0, 0],
    children: [
      _jsx('ringGeometry', { args: [0.5, 0.8, 32] }),
      _jsx('meshBasicMaterial', {
        color: '#66ccff',
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide,
      }),
    ],
  });
}
// ── Main Character ──
export default function Character({ player, index, total, gameState }) {
  const groupRef = useRef(null);
  const bodyRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const spectatorMode = useGameStore((s) => s.spectatorMode);
  const setPlayerView = useGameStore((s) => s.setPlayerView);
  const events = useGameStore((s) => s.events);
  const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
  const radius = 4;
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  const lookAngle = Math.atan2(-z, -x);
  const skinColor = SKIN_COLORS[index % SKIN_COLORS.length];
  const roleColor = ROLE_COLORS[player.role];
  const showRole = spectatorMode === 'god' || !player.alive;
  const isNight = gameState.phase === Phase.Night;
  const isDusk = gameState.phase === Phase.Dusk;
  const isJudgement = gameState.phase === Phase.Judgement;
  const isAccused = isJudgement && gameState.accusedId === player.id;
  const outfit = useMemo(() => getOutfit(index), [index]);
  const showWolfEyes =
    isNight && player.alive && isWolfRole(player.role) && spectatorMode === 'god';
  // ── Night actor detection (god mode only) ──
  const nightActive = useMemo(() => {
    if (!isNight || !player.alive || spectatorMode !== 'god') return null;
    const recent = events.slice(-10);
    const now = Date.now();
    const WINDOW = 6000;
    // Check in reverse night-action order so the latest actor wins
    for (let i = recent.length - 1; i >= 0; i--) {
      const e = recent[i];
      if (now - e.timestamp > WINDOW) continue;
      if (
        e.type === GameEventType.SeerResult &&
        (e.data.seerId === player.id || e.data.targetName === player.name)
      )
        return 'seer';
      if (e.type === GameEventType.WitchAction && player.role === Role.Witch) return 'witch';
      if (
        (e.type === GameEventType.WolfDiscussMessage ||
          (e.type === GameEventType.NightActionPerformed &&
            (e.data.action === 'wolf_kill' || e.data.action === 'wolf_double_kill'))) &&
        isWolfRole(player.role)
      )
        return 'wolf';
      if (e.type === GameEventType.GuardProtect && e.data.guardId === player.id) return 'guard';
    }
    return null;
  }, [isNight, player.alive, player.id, player.role, spectatorMode, events.length]);
  // Active effects from recent events — memoized to avoid recomputing on every render
  const eventState = useMemo(() => {
    const recentEvents = events.slice(-20);
    const now = Date.now();
    return {
      isSpeaking:
        recentEvents.some(
          (e) =>
            e.type === GameEventType.DayMessage &&
            e.data.playerId === player.id &&
            now - e.timestamp < 3000,
        ) && gameState.phase === Phase.Day,
      isDefending: recentEvents.some(
        (e) =>
          e.type === GameEventType.DefenseSpeech &&
          e.data.playerId === player.id &&
          now - e.timestamp < 5000,
      ),
      lastSpeech: [...events]
        .reverse()
        .find(
          (e) =>
            (e.type === GameEventType.DayMessage || e.type === GameEventType.DefenseSpeech) &&
            e.data.playerId === player.id,
        ),
      wasAttacked: recentEvents.some(
        (e) =>
          e.type === GameEventType.NightActionPerformed &&
          e.data.action === 'wolf_kill' &&
          e.data.targetName === player.name &&
          now - e.timestamp < 4000,
      ),
      isGuarded: recentEvents.some(
        (e) =>
          e.type === GameEventType.GuardProtect &&
          e.data.targetName === player.name &&
          now - e.timestamp < 5000,
      ),
      isSeerTarget: recentEvents.some(
        (e) =>
          e.type === GameEventType.SeerResult &&
          e.data.targetName === player.name &&
          now - e.timestamp < 4000,
      ),
      isSeer:
        (player.role === Role.Seer ||
          (player.role === Role.ApprenticeSeer && gameState.apprenticeSeerActivated)) &&
        recentEvents.some(
          (e) =>
            e.type === GameEventType.SeerResult &&
            e.data.seerId === player.id &&
            now - e.timestamp < 4000,
        ),
      witchHeal: recentEvents.some(
        (e) =>
          e.type === GameEventType.WitchAction &&
          e.data.action === 'heal' &&
          e.data.targetName === player.name &&
          now - e.timestamp < 4000,
      ),
      witchKill: recentEvents.some(
        (e) =>
          e.type === GameEventType.WitchAction &&
          e.data.action === 'kill' &&
          e.data.targetName === player.name &&
          now - e.timestamp < 4000,
      ),
      isCupidPair: recentEvents.some(
        (e) =>
          e.type === GameEventType.CupidPair &&
          (e.data.player1Name === player.name || e.data.player2Name === player.name) &&
          now - e.timestamp < 6000,
      ),
      wasExecuted: recentEvents.some(
        (e) =>
          e.type === GameEventType.JudgementResult &&
          e.data.accusedId === player.id &&
          e.data.executed &&
          now - e.timestamp < 8000,
      ),
      someoneDefending:
        isJudgement &&
        recentEvents.some(
          (e) => e.type === GameEventType.DefenseSpeech && now - e.timestamp < 5000,
        ),
      lastVote: [...events]
        .reverse()
        .find(
          (e) =>
            e.type === GameEventType.VoteCast &&
            e.data.voterName === player.name &&
            now - e.timestamp < 5000,
        ),
      votesReceived: isDusk
        ? recentEvents.filter(
            (e) =>
              e.type === GameEventType.VoteCast &&
              e.data.targetName === player.name &&
              now - e.timestamp < 10000,
          ).length
        : 0,
      hasVoted:
        isDusk &&
        recentEvents.some(
          (e) =>
            e.type === GameEventType.VoteCast &&
            e.data.voterName === player.name &&
            now - e.timestamp < 10000,
        ),
      isThinking: (() => {
        const last = [...events]
          .reverse()
          .find((e) => e.type === GameEventType.PlayerThinking && e.data.playerId === player.id);
        return !!last && last.data.thinking === true;
      })(),
    };
  }, [
    events.length,
    player.id,
    player.name,
    player.role,
    gameState.phase,
    isJudgement,
    isDusk,
    gameState.apprenticeSeerActivated,
  ]);
  const {
    isSpeaking,
    isDefending,
    lastSpeech,
    wasAttacked,
    isGuarded,
    isSeerTarget,
    isSeer,
    witchHeal,
    witchKill,
    isCupidPair,
    wasExecuted,
    someoneDefending,
    lastVote,
    votesReceived,
    hasVoted,
    isThinking,
  } = eventState;
  const voteTarget = lastVote
    ? gameState.players.find((p) => p.name === lastVote.data.targetName)
    : null;
  const voteTargetIndex = voteTarget ? gameState.players.indexOf(voteTarget) : -1;
  const isDimmed = someoneDefending && !isAccused && player.alive;
  // Death animation
  const deathProgressRef = useRef(player.alive ? 0 : 1);
  useEffect(() => {
    if (!player.alive) deathProgressRef.current = 0;
  }, [player.alive]);
  // Execution (treo cổ) animation
  const execPhaseRef = useRef('none');
  const execProgressRef = useRef(0);
  useEffect(() => {
    if (wasExecuted && execPhaseRef.current === 'none') {
      execPhaseRef.current = 'rising';
      execProgressRef.current = 0;
    }
  }, [wasExecuted]);
  useFrame((_, dt) => {
    if (!groupRef.current || !bodyRef.current) return;
    const execPhase = execPhaseRef.current;
    const execProgress = execProgressRef.current;
    // Execution animation phases
    if (execPhase === 'rising') {
      execProgressRef.current = execProgress + dt * 1.2;
      if (execProgressRef.current >= 1) {
        execPhaseRef.current = 'hanging';
        execProgressRef.current = 0;
      }
      bodyRef.current.position.y = execProgressRef.current * 2.5;
    } else if (execPhase === 'hanging') {
      execProgressRef.current = execProgress + dt * 2;
      if (execProgressRef.current >= 1) {
        execPhaseRef.current = 'falling';
        execProgressRef.current = 0;
      }
      bodyRef.current.position.y = 2.5 + Math.sin(Date.now() * 0.01) * 0.05;
    } else if (execPhase === 'falling') {
      execProgressRef.current = execProgress + dt * 3;
      if (execProgressRef.current >= 1) {
        execPhaseRef.current = 'done';
        execProgressRef.current = 1;
      }
      bodyRef.current.position.y = 2.5 * (1 - execProgressRef.current);
      bodyRef.current.rotation.z = execProgressRef.current * (Math.PI / 2);
    } else if (execPhase !== 'none') {
      // done — stay dead
    } else {
      // Normal animations (only when not executing)
      // Speaking/defending bob
      if (isDefending) {
        bodyRef.current.position.y = Math.sin(Date.now() * 0.008) * 0.08;
        bodyRef.current.scale.setScalar(1.08 + Math.sin(Date.now() * 0.006) * 0.04);
      } else if (isSpeaking) {
        bodyRef.current.position.y = Math.sin(Date.now() * 0.008) * 0.06;
        bodyRef.current.scale.setScalar(1 + Math.sin(Date.now() * 0.006) * 0.03);
      } else if (isDimmed) {
        bodyRef.current.scale.lerp(VEC_DIMMED, 0.05);
        bodyRef.current.position.y *= 0.9;
      } else {
        bodyRef.current.position.y *= 0.9;
        bodyRef.current.scale.lerp(VEC_ONE, 0.1);
      }
      // Death fall
      if (!player.alive && deathProgressRef.current < 1) {
        deathProgressRef.current = Math.min(1, deathProgressRef.current + dt * 1.5);
        bodyRef.current.rotation.z = deathProgressRef.current * (Math.PI / 3);
        bodyRef.current.position.y = -deathProgressRef.current * 0.3;
      }
      // Night head droop (sleeping) vs wake-up (active)
      if (isNight && player.alive) {
        if (nightActive) {
          bodyRef.current.rotation.x *= 0.85; // snap upright
          bodyRef.current.position.y = Math.sin(Date.now() * 0.004) * 0.03; // subtle breathing
        } else {
          bodyRef.current.rotation.x = Math.sin(Date.now() * 0.001) * 0.05 + 0.1;
        }
      } else if (player.alive) {
        bodyRef.current.rotation.x *= 0.95;
      }
    }
  });
  return _jsxs('group', {
    ref: groupRef,
    position: [x, 0, z],
    rotation: [0, lookAngle + Math.PI, 0],
    onPointerOver: (e) => {
      e.stopPropagation();
      setHovered(true);
      document.body.style.cursor = 'pointer';
    },
    onPointerOut: () => {
      setHovered(false);
      document.body.style.cursor = 'auto';
    },
    onClick: (e) => {
      e.stopPropagation();
      setPlayerView(player.id);
    },
    children: [
      _jsxs('mesh', {
        position: [0, 0.2, 0],
        castShadow: true,
        children: [
          _jsx('cylinderGeometry', { args: [0.35, 0.4, 0.4, 8] }),
          _jsx('meshStandardMaterial', { color: '#5c3a1e', roughness: 0.9 }),
        ],
      }),
      hovered && _jsx(HoverGlow, {}),
      hovered &&
        _jsx(Html, {
          position: [0, 2.4, 0],
          center: true,
          distanceFactor: 10,
          style: { pointerEvents: 'none' },
          children: _jsxs('div', {
            className:
              'bg-gray-900/95 backdrop-blur-sm border border-cyan-500/40 rounded-lg px-3 py-2 shadow-xl whitespace-nowrap',
            style: { boxShadow: '0 0 15px rgba(100,200,255,0.15)' },
            children: [
              _jsxs('div', {
                className: 'flex items-center gap-2 mb-1',
                children: [
                  _jsx('span', { className: 'text-base', children: player.personality.emoji }),
                  _jsx('span', {
                    className: 'text-sm font-bold text-cyan-200',
                    children: player.name,
                  }),
                  !player.alive &&
                    _jsx('span', {
                      className: 'text-[9px] px-1 py-0.5 rounded bg-red-900/60 text-red-400',
                      children: '\uD83D\uDC80',
                    }),
                ],
              }),
              showRole &&
                _jsx('div', {
                  className: 'text-[11px] font-medium',
                  style: { color: roleColor },
                  children: ROLE_NAMES_VI[player.role],
                }),
              _jsx('div', {
                className: 'text-[10px] text-gray-400 mt-0.5',
                children: player.personality.name,
              }),
              _jsx('div', {
                className: 'text-[9px] text-cyan-500/60 mt-1',
                children: 'Click \u0111\u1EC3 xem g\u00F3c nh\u00ECn',
              }),
            ],
          }),
        }),
      isAccused && _jsx(DefenseSpotlight, { isDefending: isDefending }),
      _jsx(ExecutionEffect, { progressRef: execProgressRef, phaseRef: execPhaseRef }),
      votesReceived > 0 && player.alive && _jsx(VoteTargetRing, { voteCount: votesReceived }),
      votesReceived > 0 && player.alive && _jsx(VoteParticles, {}),
      hasVoted && player.alive && _jsx(VoterGlow, {}),
      _jsxs('group', {
        ref: bodyRef,
        position: [0, 0.9, 0],
        children: [
          _jsxs('mesh', {
            position: [-0.1, -0.45, 0],
            castShadow: true,
            children: [
              _jsx('capsuleGeometry', { args: [0.055, 0.25, 4, 8] }),
              _jsx('meshStandardMaterial', {
                color: player.alive ? '#3a3a3a' : '#222',
                roughness: 0.8,
                transparent: true,
                opacity: player.alive ? 1 : 0.4,
              }),
            ],
          }),
          _jsxs('mesh', {
            position: [0.1, -0.45, 0],
            castShadow: true,
            children: [
              _jsx('capsuleGeometry', { args: [0.055, 0.25, 4, 8] }),
              _jsx('meshStandardMaterial', {
                color: player.alive ? '#3a3a3a' : '#222',
                roughness: 0.8,
                transparent: true,
                opacity: player.alive ? 1 : 0.4,
              }),
            ],
          }),
          _jsxs('mesh', {
            castShadow: true,
            children: [
              _jsx('capsuleGeometry', { args: [0.22, 0.4, 8, 16] }),
              _jsx('meshStandardMaterial', {
                color: player.alive ? (showRole ? roleColor : '#666666') : '#333333',
                roughness: 0.7,
                transparent: true,
                opacity: player.alive ? (isDimmed ? 0.4 : 1) : 0.4,
              }),
            ],
          }),
          outfit.hasBelt &&
            player.alive &&
            _jsxs('mesh', {
              position: [0, -0.15, 0],
              children: [
                _jsx('cylinderGeometry', { args: [0.23, 0.23, 0.04, 12] }),
                _jsx('meshStandardMaterial', { color: outfit.beltColor, roughness: 0.7 }),
              ],
            }),
          outfit.hasCloak && player.alive && _jsx(Cloak, { color: outfit.cloakColor }),
          _jsxs('mesh', {
            position: [0, 0.35, 0],
            children: [
              _jsx('cylinderGeometry', { args: [0.06, 0.08, 0.1, 8] }),
              _jsx('meshStandardMaterial', {
                color: player.alive ? skinColor : '#555',
                roughness: 0.6,
                transparent: true,
                opacity: player.alive ? 1 : 0.4,
              }),
            ],
          }),
          _jsxs('mesh', {
            position: [0, 0.5, 0],
            castShadow: true,
            children: [
              _jsx('sphereGeometry', { args: [0.18, 16, 16] }),
              _jsx('meshStandardMaterial', {
                color: player.alive ? skinColor : '#555',
                roughness: 0.6,
                transparent: true,
                opacity: player.alive ? 1 : 0.4,
              }),
            ],
          }),
          player.alive && _jsx(Hat, { type: outfit.hatType, color: outfit.hatColor }),
          player.alive &&
            !isNight &&
            !showWolfEyes &&
            _jsxs(_Fragment, {
              children: [
                _jsxs('mesh', {
                  position: [-0.06, 0.52, 0.15],
                  children: [
                    _jsx('sphereGeometry', { args: [0.03, 8, 8] }),
                    _jsx('meshBasicMaterial', {
                      color: isSpeaking || isDefending ? '#ffffff' : '#222',
                    }),
                  ],
                }),
                _jsxs('mesh', {
                  position: [0.06, 0.52, 0.15],
                  children: [
                    _jsx('sphereGeometry', { args: [0.03, 8, 8] }),
                    _jsx('meshBasicMaterial', {
                      color: isSpeaking || isDefending ? '#ffffff' : '#222',
                    }),
                  ],
                }),
              ],
            }),
          player.alive &&
            isNight &&
            !showWolfEyes &&
            _jsxs(_Fragment, {
              children: [
                _jsxs('mesh', {
                  position: [-0.06, 0.52, 0.16],
                  rotation: [0, 0, Math.PI / 6],
                  children: [
                    _jsx('boxGeometry', { args: [0.06, 0.01, 0.01] }),
                    _jsx('meshBasicMaterial', { color: '#222' }),
                  ],
                }),
                _jsxs('mesh', {
                  position: [0.06, 0.52, 0.16],
                  rotation: [0, 0, -Math.PI / 6],
                  children: [
                    _jsx('boxGeometry', { args: [0.06, 0.01, 0.01] }),
                    _jsx('meshBasicMaterial', { color: '#222' }),
                  ],
                }),
              ],
            }),
          showWolfEyes && _jsx(WolfEyes, {}),
          _jsxs('mesh', {
            position: [-0.3, -0.05, 0],
            rotation: [0, 0, isSpeaking || isDefending ? -0.6 : hasVoted ? -0.8 : -0.3],
            castShadow: true,
            children: [
              _jsx('capsuleGeometry', { args: [0.06, 0.3, 4, 8] }),
              _jsx('meshStandardMaterial', {
                color: skinColor,
                transparent: true,
                opacity: player.alive ? 1 : 0.4,
              }),
            ],
          }),
          _jsxs('mesh', {
            position: [0.3, -0.05, 0],
            rotation: [0, 0, isSpeaking || isDefending ? 0.6 : hasVoted ? 0.8 : 0.3],
            castShadow: true,
            children: [
              _jsx('capsuleGeometry', { args: [0.06, 0.3, 4, 8] }),
              _jsx('meshStandardMaterial', {
                color: skinColor,
                transparent: true,
                opacity: player.alive ? 1 : 0.4,
              }),
            ],
          }),
          isThinking && player.alive && _jsx(ThinkingDots, {}),
          isNight && player.alive && !nightActive && _jsx(ZzzParticles, {}),
          wasAttacked && spectatorMode === 'god' && _jsx(WolfSlash, { active: true }),
          isGuarded && spectatorMode === 'god' && _jsx(ShieldBubble, {}),
          isSeer && spectatorMode === 'god' && _jsx(SeerGlow, {}),
          isSeerTarget && spectatorMode === 'god' && _jsx(SeerGlow, {}),
          witchHeal && spectatorMode === 'god' && _jsx(PotionBurst, { color: '#44ff44' }),
          witchKill && spectatorMode === 'god' && _jsx(PotionBurst, { color: '#aa00ff' }),
          isCupidPair && spectatorMode === 'god' && _jsx(LoveParticles, {}),
        ],
      }),
      nightActive && _jsx(NightActiveGlow, { role: nightActive }),
      nightActive &&
        _jsx(Html, {
          position: [0, 2.1, 0],
          center: true,
          distanceFactor: 10,
          style: { pointerEvents: 'none' },
          children: _jsx('div', {
            className: 'text-2xl animate-bounce',
            style: { filter: `drop-shadow(0 0 6px ${NIGHT_ROLE_COLORS[nightActive]})` },
            children: NIGHT_ROLE_ICONS[nightActive],
          }),
        }),
      isThinking &&
        player.alive &&
        _jsx(Html, {
          position: [0, 2.1, 0],
          center: true,
          distanceFactor: 10,
          style: { pointerEvents: 'none' },
          children: _jsx('div', {
            className: 'text-lg animate-pulse',
            style: { filter: 'drop-shadow(0 0 4px #66bbff)' },
            children: '\uD83D\uDCAD',
          }),
        }),
      (player.alive || hovered) &&
        _jsx(Html, {
          position: [0, 1.7, 0],
          center: true,
          distanceFactor: 10,
          style: { pointerEvents: 'none' },
          children: _jsxs('div', {
            className: 'text-center whitespace-nowrap',
            children: [
              _jsxs('div', {
                className: `text-xs font-bold px-2 py-0.5 rounded-full ${
                  isAccused
                    ? 'bg-red-900/90 text-red-200 border border-red-500/50'
                    : player.alive
                      ? 'bg-black/70 text-white'
                      : 'bg-black/40 text-gray-500 line-through'
                }`,
                children: [!player.alive && '💀 ', player.personality.emoji, ' ', player.name],
              }),
              showRole &&
                _jsx('div', {
                  className: 'text-[10px] mt-0.5 px-2 py-0.5 rounded-full bg-black/60',
                  style: { color: roleColor },
                  children: ROLE_NAMES_VI[player.role],
                }),
            ],
          }),
        }),
      isDusk &&
        votesReceived > 0 &&
        player.alive &&
        _jsx(Html, {
          position: [0.4, 2.0, 0],
          center: true,
          distanceFactor: 10,
          style: { pointerEvents: 'none' },
          children: _jsx('div', {
            className:
              'vote-badge-3d flex items-center justify-center w-7 h-7 rounded-full font-bold text-sm text-white shadow-lg',
            style: {
              background:
                votesReceived >= 3
                  ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                  : votesReceived >= 2
                    ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                    : 'linear-gradient(135deg, #eab308, #ca8a04)',
              boxShadow: `0 0 12px ${votesReceived >= 3 ? '#ef4444' : '#f59e0b'}88`,
            },
            children: votesReceived,
          }),
        }),
      isAccused &&
        _jsx(Html, {
          position: [0, 2.2, 0],
          center: true,
          distanceFactor: 10,
          style: { pointerEvents: 'none' },
          children: _jsx('div', {
            className:
              'judgement-phase-pulse text-sm px-3 py-1 rounded-full bg-red-600/90 text-white font-bold whitespace-nowrap shadow-lg',
            style: { boxShadow: '0 0 20px #ef444466' },
            children: '\u2696\uFE0F \u0110ang b\u1ECB ph\u00E1n x\u00E9t',
          }),
        }),
      isDusk &&
        hasVoted &&
        player.alive &&
        _jsx(Html, {
          position: [0, 2.1, 0],
          center: true,
          distanceFactor: 10,
          style: { pointerEvents: 'none' },
          children: _jsx('div', {
            className:
              'text-[10px] px-2 py-0.5 rounded-full bg-amber-600/90 text-white font-medium whitespace-nowrap shadow-md',
            children: '\uD83D\uDDF3\uFE0F \u0110\u00E3 b\u1ECF phi\u1EBFu',
          }),
        }),
      (isSpeaking || isDefending) &&
        lastSpeech &&
        _jsx(Html, {
          position: [0, 2.3, 0],
          center: true,
          distanceFactor: 10,
          style: { pointerEvents: 'none' },
          children: _jsxs('div', {
            className: `text-sm px-4 py-2.5 rounded-xl max-w-[480px] min-w-[280px] shadow-lg animate-pulse ${
              isDefending
                ? 'bg-red-50/95 text-red-900 border-2 border-red-400/50'
                : 'bg-white/95 text-black'
            }`,
            children: [
              isDefending &&
                _jsx('span', {
                  className: 'text-xs font-bold text-red-600 block mb-1',
                  children: '\u2696\uFE0F Bi\u1EC7n h\u1ED9:',
                }),
              lastSpeech.data.message?.slice(0, 150),
              lastSpeech.data.message?.length > 150 ? '...' : '',
              _jsx('div', {
                className: `absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 ${isDefending ? 'bg-red-50/95' : 'bg-white/95'}`,
              }),
            ],
          }),
        }),
      voteTarget &&
        voteTargetIndex >= 0 &&
        (() => {
          const ta = (voteTargetIndex / total) * Math.PI * 2 - Math.PI / 2;
          const tx = Math.cos(ta) * radius;
          const tz = Math.sin(ta) * radius;
          return _jsx('group', {
            rotation: [0, -(lookAngle + Math.PI), 0],
            children: _jsx(VoteArrow, { from: [0, 1.5, 0], to: [tx - x, 1.5, tz - z] }),
          });
        })(),
    ],
  });
}
