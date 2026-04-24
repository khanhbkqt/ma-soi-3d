import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function FireParticle({ delay }: { delay: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!ref.current) return;
    const t = ((Date.now() * 0.001 + delay) % 2) / 2;
    ref.current.position.y = 0.3 + t * 1.5;
    ref.current.position.x = Math.sin(Date.now() * 0.003 + delay * 10) * 0.15;
    ref.current.position.z = Math.cos(Date.now() * 0.004 + delay * 7) * 0.15;
    const scale = (1 - t) * 0.12;
    ref.current.scale.setScalar(scale);
    (ref.current.material as THREE.MeshBasicMaterial).opacity = (1 - t) * 0.8;
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color={Math.random() > 0.5 ? '#ff4400' : '#ffaa00'} transparent />
    </mesh>
  );
}

export default function Campfire() {
  return (
    <group position={[0, 0, 0]}>
      {/* Fire base / logs */}
      {[0, 1, 2].map(i => (
        <mesh key={i} position={[Math.cos(i * 2.1) * 0.25, 0.1, Math.sin(i * 2.1) * 0.25]} rotation={[0.3, i * 1.2, 0.2]} castShadow>
          <cylinderGeometry args={[0.05, 0.06, 0.6, 6]} />
          <meshStandardMaterial color="#3d2817" roughness={1} />
        </mesh>
      ))}
      {/* Stones */}
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.45, 0.08, Math.sin(a) * 0.45]} castShadow>
            <dodecahedronGeometry args={[0.08, 0]} />
            <meshStandardMaterial color="#555555" roughness={1} />
          </mesh>
        );
      })}
      {/* Fire particles */}
      {Array.from({ length: 12 }).map((_, i) => <FireParticle key={i} delay={i * 0.17} />)}
      {/* Ember glow */}
      <mesh position={[0, 0.15, 0]}>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshBasicMaterial color="#ff3300" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}
