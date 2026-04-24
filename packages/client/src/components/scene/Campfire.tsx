import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ── Fire Flame (additive blended planes) ──
function FireFlame({ delay, height = 1.2 }: { delay: number; height?: number }) {
  const ref = useRef<THREE.Mesh>(null);
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
    (ref.current.material as THREE.MeshBasicMaterial).opacity = (1 - t) * 0.7;
  });
  return (
    <mesh ref={ref} rotation={[0, delay * 2, 0]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        color={color}
        transparent
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

// ── Ember (small rising dot) ──
function Ember({ delay }: { delay: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!ref.current) return;
    const t = ((Date.now() * 0.0008 + delay) % 2.5) / 2.5;
    ref.current.position.y = 0.3 + t * 2.5;
    ref.current.position.x = Math.sin(Date.now() * 0.002 + delay * 17) * (0.2 + t * 0.4);
    ref.current.position.z = Math.cos(Date.now() * 0.0025 + delay * 11) * (0.2 + t * 0.3);
    ref.current.scale.setScalar((1 - t) * 0.025);
    (ref.current.material as THREE.MeshBasicMaterial).opacity = (1 - t) * 0.9;
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial
        color="#ff6600"
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

// ── Smoke ──
function SmokeParticle({ delay }: { delay: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!ref.current) return;
    const t = ((Date.now() * 0.0005 + delay) % 4) / 4;
    ref.current.position.y = 1 + t * 3;
    ref.current.position.x = Math.sin(delay * 5) * t * 0.8;
    ref.current.position.z = Math.cos(delay * 7) * t * 0.5;
    const s = 0.1 + t * 0.4;
    ref.current.scale.setScalar(s);
    (ref.current.material as THREE.MeshBasicMaterial).opacity = (1 - t) * 0.12;
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color="#888888" transparent depthWrite={false} />
    </mesh>
  );
}

// ── Spark (fast upward) ──
function Spark({ delay }: { delay: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!ref.current) return;
    const t = ((Date.now() * 0.003 + delay) % 1.5) / 1.5;
    ref.current.position.y = 0.4 + t * 3;
    ref.current.position.x = Math.sin(delay * 23) * 0.3 * (1 - t);
    ref.current.position.z = Math.cos(delay * 19) * 0.3 * (1 - t);
    ref.current.scale.setScalar((1 - t) * 0.015);
    (ref.current.material as THREE.MeshBasicMaterial).opacity = 1 - t;
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[1, 3, 3]} />
      <meshBasicMaterial
        color="#ffee44"
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

export default function Campfire() {
  return (
    <group position={[0, 0, 0]}>
      {/* Logs with emissive tips */}
      {[0, 1, 2, 3].map((i) => {
        const a = i * 1.57;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 0.2, 0.08, Math.sin(a) * 0.2]}
            rotation={[0.3, a, 0.15]}
            castShadow
          >
            <cylinderGeometry args={[0.04, 0.055, 0.55, 6]} />
            <meshStandardMaterial
              color="#3d2817"
              roughness={1}
              emissive="#ff3300"
              emissiveIntensity={0.15}
            />
          </mesh>
        );
      })}
      {/* Stone ring */}
      {Array.from({ length: 10 }).map((_, i) => {
        const a = (i / 10) * Math.PI * 2;
        return (
          <mesh key={`s${i}`} position={[Math.cos(a) * 0.45, 0.06, Math.sin(a) * 0.45]} castShadow>
            <dodecahedronGeometry args={[0.07 + (i % 3) * 0.01, 0]} />
            <meshStandardMaterial color={i % 2 ? '#555' : '#666'} roughness={1} />
          </mesh>
        );
      })}
      {/* Fire flames */}
      {Array.from({ length: 8 }).map((_, i) => (
        <FireFlame key={i} delay={i * 0.13} />
      ))}
      {/* Embers */}
      {Array.from({ length: 10 }).map((_, i) => (
        <Ember key={`e${i}`} delay={i * 0.25} />
      ))}
      {/* Smoke */}
      {Array.from({ length: 5 }).map((_, i) => (
        <SmokeParticle key={`sm${i}`} delay={i * 0.8} />
      ))}
      {/* Sparks */}
      {Array.from({ length: 6 }).map((_, i) => (
        <Spark key={`sp${i}`} delay={i * 0.25} />
      ))}
      {/* Core glow */}
      <mesh position={[0, 0.2, 0]}>
        <sphereGeometry args={[0.25, 8, 8]} />
        <meshBasicMaterial
          color="#ff4400"
          transparent
          opacity={0.2}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {/* Heat haze glow */}
      <mesh position={[0, 0.8, 0]}>
        <sphereGeometry args={[0.4, 8, 8]} />
        <meshBasicMaterial
          color="#ff6622"
          transparent
          opacity={0.06}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
