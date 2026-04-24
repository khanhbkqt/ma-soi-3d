import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';
import { Phase } from '@ma-soi/shared';

// ── Seeded random ──
function seeded(seed: number) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
}

// ── Tree Types ──

function PineTree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.14, 1.2, 6]} />
        <meshStandardMaterial color="#3d2a15" roughness={1} />
      </mesh>
      {[{ y: 1.4, r: 0.65, h: 1.1 }, { y: 2.0, r: 0.48, h: 0.85 }, { y: 2.5, r: 0.3, h: 0.65 }].map((l, i) => (
        <mesh key={i} position={[0, l.y, 0]} castShadow>
          <coneGeometry args={[l.r, l.h, 7]} />
          <meshStandardMaterial color={`hsl(130, ${55 + i * 8}%, ${18 + i * 5}%)`} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function OakTree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const rng = useMemo(() => seeded(position[0] * 1000 + position[2] * 100), []);
  const clusters = useMemo(() => Array.from({ length: 4 }, () => ({
    x: (rng() - 0.5) * 0.6, y: 1.6 + rng() * 0.5, z: (rng() - 0.5) * 0.6, r: 0.3 + rng() * 0.25,
  })), []);
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.7, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.16, 1.4, 6]} />
        <meshStandardMaterial color="#4a3018" roughness={1} />
      </mesh>
      {clusters.map((c, i) => (
        <mesh key={i} position={[c.x, c.y, c.z]} castShadow>
          <sphereGeometry args={[c.r, 8, 8]} />
          <meshStandardMaterial color={`hsl(110, ${45 + i * 5}%, ${22 + i * 3}%)`} roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}

function DeadTree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const rng = useMemo(() => seeded(position[0] * 999 + position[2] * 77), []);
  const branches = useMemo(() => Array.from({ length: 4 }, () => ({
    y: 0.8 + rng() * 0.8, rx: (rng() - 0.5) * 1.5, rz: (rng() - 0.5) * 1.5, len: 0.3 + rng() * 0.4,
  })), []);
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.8, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.12, 1.6, 5]} />
        <meshStandardMaterial color="#3a2a1a" roughness={1} />
      </mesh>
      {branches.map((b, i) => (
        <mesh key={i} position={[0, b.y, 0]} rotation={[b.rx, 0, b.rz]} castShadow>
          <cylinderGeometry args={[0.02, 0.04, b.len, 4]} />
          <meshStandardMaterial color="#4a3a28" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

// ── Small Props ──

function Mushroom({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.02, 0.025, 0.12, 5]} />
        <meshStandardMaterial color="#e8dcc8" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.14, 0]}>
        <sphereGeometry args={[0.05, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#cc3322" roughness={0.7} />
      </mesh>
    </group>
  );
}

function Rock({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <mesh position={position} scale={scale} rotation={[Math.random() * 0.5, Math.random() * Math.PI, 0]} castShadow>
      <dodecahedronGeometry args={[0.15, 0]} />
      <meshStandardMaterial color="#6a6a60" roughness={0.95} />
    </mesh>
  );
}

function Bush({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      {[[-0.08, 0.1, 0], [0.08, 0.12, 0.05], [0, 0.15, -0.06]].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]} castShadow>
          <sphereGeometry args={[0.12 + i * 0.02, 6, 6]} />
          <meshStandardMaterial color={`hsl(125, 50%, ${16 + i * 3}%)`} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

// ── House ──

function House({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  const phase = useGameStore(s => s.gameState?.phase);
  const isNight = phase === Phase.Night || phase === Phase.Dusk || phase === Phase.Judgement;
  const windowEmissive = isNight ? '#ffaa44' : '#000000';
  const windowIntensity = isNight ? 0.8 : 0;

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Walls */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[1.2, 1.2, 1]} />
        <meshStandardMaterial color="#8B7355" roughness={0.9} />
      </mesh>
      {/* Roof */}
      <mesh position={[0, 1.5, 0]} castShadow rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[1, 0.8, 4]} />
        <meshStandardMaterial color="#6B3A2A" roughness={0.9} />
      </mesh>
      {/* Door */}
      <mesh position={[0, 0.35, 0.51]}>
        <boxGeometry args={[0.3, 0.6, 0.02]} />
        <meshStandardMaterial color="#3d2817" />
      </mesh>
      {/* Windows */}
      {[[-0.35, 0.7, 0.51], [0.35, 0.7, 0.51]].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]}>
          <boxGeometry args={[0.18, 0.18, 0.02]} />
          <meshStandardMaterial color="#2a1a0a" emissive={windowEmissive} emissiveIntensity={windowIntensity} />
        </mesh>
      ))}
      {/* Chimney */}
      <mesh position={[0.35, 1.8, -0.2]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 0.5, 6]} />
        <meshStandardMaterial color="#5a4a3a" roughness={1} />
      </mesh>
    </group>
  );
}

// ── Main ──

export default function Trees() {
  const items = useMemo(() => {
    const rng = seeded(42);
    const trees: { type: 'pine' | 'oak' | 'dead'; pos: [number, number, number]; scale: number }[] = [];
    const props: { type: 'mushroom' | 'rock' | 'bush'; pos: [number, number, number]; scale: number }[] = [];

    for (let i = 0; i < 35; i++) {
      const a = rng() * Math.PI * 2;
      const d = 8 + rng() * 10;
      const pos: [number, number, number] = [Math.cos(a) * d, 0, Math.sin(a) * d];
      const r = rng();
      const type = r < 0.5 ? 'pine' : r < 0.8 ? 'oak' : 'dead';
      trees.push({ type, pos, scale: 0.8 + rng() * 0.7 });

      // Scatter props near trees
      if (rng() < 0.3) props.push({ type: 'mushroom', pos: [pos[0] + (rng() - 0.5) * 1.5, 0, pos[2] + (rng() - 0.5) * 1.5], scale: 0.8 + rng() * 0.5 });
      if (rng() < 0.3) props.push({ type: 'rock', pos: [pos[0] + (rng() - 0.5) * 2, 0, pos[2] + (rng() - 0.5) * 2], scale: 0.5 + rng() * 0.8 });
      if (rng() < 0.2) props.push({ type: 'bush', pos: [pos[0] + (rng() - 0.5) * 2, 0, pos[2] + (rng() - 0.5) * 2], scale: 0.7 + rng() * 0.6 });
    }
    return { trees, props };
  }, []);

  return (
    <group>
      {items.trees.map((t, i) => {
        const C = t.type === 'pine' ? PineTree : t.type === 'oak' ? OakTree : DeadTree;
        return <C key={i} position={t.pos} scale={t.scale} />;
      })}
      {items.props.map((p, i) => {
        const C = p.type === 'mushroom' ? Mushroom : p.type === 'rock' ? Rock : Bush;
        return <C key={`p${i}`} position={p.pos} scale={p.scale} />;
      })}
      <House position={[-8, 0, -6]} rotation={0.3} />
      <House position={[7, 0, -8]} rotation={-0.5} />
      <House position={[-6, 0, 8]} rotation={1.2} />
    </group>
  );
}
