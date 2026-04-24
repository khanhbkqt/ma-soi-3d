import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GameState, Phase } from '@ma-soi/shared';

// ── Fence ──
function FenceSection({
  position,
  rotation = 0,
}: {
  position: [number, number, number];
  rotation?: number;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Posts */}
      {[-0.5, 0.5].map((x, i) => (
        <mesh key={i} position={[x, 0.3, 0]} castShadow>
          <cylinderGeometry args={[0.03, 0.04, 0.6, 5]} />
          <meshStandardMaterial color="#5a4020" roughness={1} />
        </mesh>
      ))}
      {/* Rails */}
      {[0.2, 0.4].map((y, i) => (
        <mesh key={`r${i}`} position={[0, y, 0]} castShadow>
          <boxGeometry args={[1.1, 0.04, 0.03]} />
          <meshStandardMaterial color="#6a5030" roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

function FenceRing() {
  const sections = useMemo(() => {
    const items: { pos: [number, number, number]; rot: number }[] = [];
    const count = 14;
    // Arc from -120° to 120° (leaving gap for entrance)
    for (let i = 0; i < count; i++) {
      const a = -2.1 + (i / (count - 1)) * 4.2;
      const r = 6.5;
      items.push({ pos: [Math.cos(a) * r, 0, Math.sin(a) * r], rot: a + Math.PI / 2 });
    }
    return items;
  }, []);
  return (
    <>
      {sections.map((s, i) => (
        <FenceSection key={i} position={s.pos} rotation={s.rot} />
      ))}
    </>
  );
}

// ── Well ──
function Well({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Base */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <cylinderGeometry args={[0.35, 0.4, 0.5, 8]} />
        <meshStandardMaterial color="#7a7068" roughness={1} />
      </mesh>
      {/* Posts */}
      {[-0.25, 0.25].map((x, i) => (
        <mesh key={i} position={[x, 0.7, 0]} castShadow>
          <cylinderGeometry args={[0.025, 0.03, 0.9, 4]} />
          <meshStandardMaterial color="#4a3520" roughness={1} />
        </mesh>
      ))}
      {/* Roof beam */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <boxGeometry args={[0.7, 0.04, 0.15]} />
        <meshStandardMaterial color="#5a3a20" roughness={0.95} />
      </mesh>
      {/* Roof */}
      <mesh position={[0, 1.35, 0]} castShadow rotation={[0, 0, 0]}>
        <coneGeometry args={[0.45, 0.3, 4]} />
        <meshStandardMaterial color="#6B3A2A" roughness={0.9} />
      </mesh>
      {/* Bucket */}
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 0.1, 6]} />
        <meshStandardMaterial color="#5a4a30" roughness={0.9} />
      </mesh>
    </group>
  );
}

// ── Lantern ──
function Lantern({ position, isNight }: { position: [number, number, number]; isNight: boolean }) {
  const glowRef = useRef<THREE.PointLight>(null);
  useFrame(() => {
    if (glowRef.current) {
      glowRef.current.intensity = isNight ? 1.5 + Math.sin(Date.now() * 0.005) * 0.3 : 0.1;
    }
  });
  return (
    <group position={position}>
      {/* Pole */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.035, 1.2, 5]} />
        <meshStandardMaterial color="#4a3a28" roughness={1} />
      </mesh>
      {/* Lantern head */}
      <mesh position={[0, 1.3, 0]}>
        <boxGeometry args={[0.12, 0.16, 0.12]} />
        <meshStandardMaterial
          color="#8a7040"
          emissive={isNight ? '#ff9933' : '#000'}
          emissiveIntensity={isNight ? 0.6 : 0}
          roughness={0.7}
        />
      </mesh>
      {/* Top cap */}
      <mesh position={[0, 1.42, 0]}>
        <coneGeometry args={[0.09, 0.08, 4]} />
        <meshStandardMaterial color="#5a4a30" roughness={0.9} />
      </mesh>
      <pointLight
        ref={glowRef}
        position={[0, 1.3, 0]}
        color="#ff9933"
        distance={4}
        decay={2}
        intensity={isNight ? 1.5 : 0.1}
      />
    </group>
  );
}

// ── Wooden Sign ──
function WoodenSign({
  position,
  rotation = 0,
}: {
  position: [number, number, number];
  rotation?: number;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.03, 0.8, 4]} />
        <meshStandardMaterial color="#4a3520" roughness={1} />
      </mesh>
      <mesh position={[0, 0.7, 0]} castShadow>
        <boxGeometry args={[0.5, 0.25, 0.03]} />
        <meshStandardMaterial color="#6a5530" roughness={0.9} />
      </mesh>
    </group>
  );
}

// ── Gravestone ──
function Gravestone({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[0.25, 0.4, 0.06]} />
        <meshStandardMaterial color="#6a6a6a" roughness={0.95} />
      </mesh>
      {/* Cross on top */}
      <mesh position={[0, 0.45, 0.01]}>
        <boxGeometry args={[0.15, 0.03, 0.02]} />
        <meshStandardMaterial color="#5a5a5a" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.45, 0.01]}>
        <boxGeometry args={[0.03, 0.15, 0.02]} />
        <meshStandardMaterial color="#5a5a5a" roughness={0.95} />
      </mesh>
    </group>
  );
}

// ── Main ──
export default function WorldProps({ gameState }: { gameState: GameState | null }) {
  const phase = gameState?.phase;
  const isNight = phase === Phase.Night || phase === Phase.Dusk || phase === Phase.Judgement;

  const deadPlayers = useMemo(() => {
    if (!gameState) return [];
    return gameState.players.map((p, i) => ({ ...p, index: i })).filter((p) => !p.alive);
  }, [gameState?.players.map((p) => p.alive).join(',')]);

  // Gravestone positions — near the village edge
  const gravestonePositions = useMemo(
    () =>
      deadPlayers.map((p, i) => {
        const a = -1.8 + i * 0.5;
        const r = 7.2;
        return [Math.cos(a) * r, 0, Math.sin(a) * r] as [number, number, number];
      }),
    [deadPlayers.length],
  );

  return (
    <group>
      <FenceRing />
      <Well position={[5.5, 0, 3]} />
      <Lantern position={[-3, 0, 5.8]} isNight={isNight} />
      <Lantern position={[3, 0, -5.8]} isNight={isNight} />
      <Lantern position={[-5.5, 0, -2]} isNight={isNight} />
      <WoodenSign position={[0, 0, 6.8]} rotation={Math.PI} />
      {gravestonePositions.map((pos, i) => (
        <Gravestone key={deadPlayers[i].id} position={pos} />
      ))}
    </group>
  );
}
