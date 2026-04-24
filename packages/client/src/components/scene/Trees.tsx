import { useMemo } from 'react';

function Tree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      {/* Trunk */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.15, 1.2, 6]} />
        <meshStandardMaterial color="#4a3520" roughness={1} />
      </mesh>
      {/* Foliage layers */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <coneGeometry args={[0.6, 1.2, 6]} />
        <meshStandardMaterial color="#1a5c1a" roughness={0.9} />
      </mesh>
      <mesh position={[0, 2.1, 0]} castShadow>
        <coneGeometry args={[0.45, 0.9, 6]} />
        <meshStandardMaterial color="#227722" roughness={0.9} />
      </mesh>
      <mesh position={[0, 2.6, 0]} castShadow>
        <coneGeometry args={[0.3, 0.7, 6]} />
        <meshStandardMaterial color="#2a8a2a" roughness={0.9} />
      </mesh>
    </group>
  );
}

function House({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
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
    </group>
  );
}

export default function Trees() {
  const trees = useMemo(() => {
    const items: { pos: [number, number, number]; scale: number }[] = [];
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 8 + Math.random() * 10;
      items.push({ pos: [Math.cos(angle) * dist, 0, Math.sin(angle) * dist], scale: 0.8 + Math.random() * 0.8 });
    }
    return items;
  }, []);

  return (
    <group>
      {trees.map((t, i) => <Tree key={i} position={t.pos} scale={t.scale} />)}
      <House position={[-8, 0, -6]} rotation={0.3} />
      <House position={[7, 0, -8]} rotation={-0.5} />
      <House position={[-6, 0, 8]} rotation={1.2} />
    </group>
  );
}
