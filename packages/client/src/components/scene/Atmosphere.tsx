import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Phase } from '@ma-soi/shared';

function Firefly({ seed }: { seed: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const offset = useMemo(
    () => ({
      x: (Math.random() - 0.5) * 14,
      z: (Math.random() - 0.5) * 14,
      speed: 0.3 + Math.random() * 0.5,
      phase: Math.random() * Math.PI * 2,
    }),
    [],
  );
  useFrame(() => {
    if (!ref.current) return;
    const t = Date.now() * 0.001 * offset.speed;
    ref.current.position.x = offset.x + Math.sin(t + seed * 3) * 2;
    ref.current.position.y = 0.5 + Math.sin(t * 0.7 + seed * 5) * 0.8 + 0.8;
    ref.current.position.z = offset.z + Math.cos(t * 0.8 + seed * 2) * 2;
    // Blink
    const blink = Math.sin(t * 2 + offset.phase) * 0.5 + 0.5;
    ref.current.scale.setScalar(0.03 + blink * 0.03);
    (ref.current.material as THREE.MeshBasicMaterial).opacity = 0.3 + blink * 0.7;
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial
        color="#aaff44"
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

function MistCloud({ seed }: { seed: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const offset = useMemo(
    () => ({
      x: (Math.random() - 0.5) * 16,
      z: (Math.random() - 0.5) * 16,
      speed: 0.05 + Math.random() * 0.1,
    }),
    [],
  );
  useFrame(() => {
    if (!ref.current) return;
    const t = Date.now() * 0.001 * offset.speed;
    ref.current.position.x = offset.x + Math.sin(t + seed) * 3;
    ref.current.position.z = offset.z + Math.cos(t * 0.7 + seed * 2) * 2;
  });
  return (
    <mesh ref={ref} position={[offset.x, 0.3, offset.z]}>
      <sphereGeometry args={[1.5 + Math.random(), 8, 6]} />
      <meshBasicMaterial color="#8899bb" transparent opacity={0.04} depthWrite={false} />
    </mesh>
  );
}

function DustMote({ seed }: { seed: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const offset = useMemo(
    () => ({
      x: (Math.random() - 0.5) * 12,
      z: (Math.random() - 0.5) * 12,
      y: 1 + Math.random() * 3,
      speed: 0.2 + Math.random() * 0.3,
    }),
    [],
  );
  useFrame(() => {
    if (!ref.current) return;
    const t = Date.now() * 0.001 * offset.speed;
    ref.current.position.x = offset.x + Math.sin(t + seed * 4) * 1;
    ref.current.position.y = offset.y + Math.sin(t * 0.5 + seed) * 0.5;
    ref.current.position.z = offset.z + Math.cos(t * 0.6 + seed * 3) * 1;
    const shimmer = Math.sin(t * 3 + seed * 7) * 0.5 + 0.5;
    (ref.current.material as THREE.MeshBasicMaterial).opacity = 0.2 + shimmer * 0.4;
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.015, 3, 3]} />
      <meshBasicMaterial
        color="#ffeecc"
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

export default function Atmosphere({ phase }: { phase?: Phase }) {
  const isNight = phase === Phase.Night;
  const isDawn = phase === Phase.Dawn;
  const isDay = phase === Phase.Day;
  const isDusk = phase === Phase.Dusk;
  const isJudgement = phase === Phase.Judgement;

  const showFireflies = isNight || isDusk || isJudgement;
  const showMist = isNight || isDawn || isDusk;
  const showDust = isDay || isDawn;

  return (
    <group>
      {showFireflies &&
        Array.from({ length: 20 }).map((_, i) => <Firefly key={`f${i}`} seed={i} />)}
      {showMist && Array.from({ length: 8 }).map((_, i) => <MistCloud key={`m${i}`} seed={i} />)}
      {showDust && Array.from({ length: 15 }).map((_, i) => <DustMote key={`d${i}`} seed={i} />)}
    </group>
  );
}
