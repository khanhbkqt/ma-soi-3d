import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';
import { Phase } from '@ma-soi/shared';
import Character from './Character';
import Campfire from './Campfire';
import Ground from './Ground';
import Trees from './Trees';
import WorldProps from './WorldProps';
import Atmosphere from './Atmosphere';

// ── Phase lighting targets ──
const PHASE_LIGHTING: Record<
  string,
  {
    ambient: number;
    ambientCol: string;
    dir: number;
    dirCol: string;
    bg: string;
    campfire: number;
    campfireCol: string;
    sunPos: [number, number, number];
    moonPos: [number, number, number];
    sunCol: string;
    sunScale: number;
    moonScale: number;
    starsOpacity: number;
    fogNear: number;
    fogFar: number;
    fogOn: boolean;
  }
> = {
  [Phase.Night]: {
    ambient: 0.15,
    ambientCol: '#4466aa',
    dir: 0.1,
    dirCol: '#6688cc',
    bg: '#070b15',
    campfire: 3,
    campfireCol: '#ff6622',
    sunPos: [0, -8, -15],
    moonPos: [0, 18, -5],
    sunCol: '#ff6633',
    sunScale: 0,
    moonScale: 1.5,
    starsOpacity: 1,
    fogNear: 20,
    fogFar: 50,
    fogOn: false,
  },
  [Phase.Dawn]: {
    ambient: 0.4,
    ambientCol: '#ffcc88',
    dir: 0.8,
    dirCol: '#ffddaa',
    bg: '#2a1a10',
    campfire: 0.8,
    campfireCol: '#ff6622',
    sunPos: [-18, 3, -10],
    moonPos: [10, -5, -5],
    sunCol: '#ff6633',
    sunScale: 3,
    moonScale: 0,
    starsOpacity: 0.2,
    fogNear: 20,
    fogFar: 50,
    fogOn: false,
  },
  [Phase.Day]: {
    ambient: 0.6,
    ambientCol: '#ffffff',
    dir: 1.2,
    dirCol: '#fff5e0',
    bg: '#87CEEB',
    campfire: 0.5,
    campfireCol: '#ff6622',
    sunPos: [0, 22, -8],
    moonPos: [0, -8, -5],
    sunCol: '#ffee44',
    sunScale: 2.5,
    moonScale: 0,
    starsOpacity: 0,
    fogNear: 20,
    fogFar: 50,
    fogOn: true,
  },
  [Phase.Dusk]: {
    ambient: 0.35,
    ambientCol: '#cc8844',
    dir: 0.5,
    dirCol: '#dd9944',
    bg: '#1a1008',
    campfire: 2,
    campfireCol: '#ff6622',
    sunPos: [18, 3, -10],
    moonPos: [-10, -5, -5],
    sunCol: '#ff4411',
    sunScale: 3.2,
    moonScale: 0,
    starsOpacity: 0.3,
    fogNear: 20,
    fogFar: 50,
    fogOn: false,
  },
  [Phase.Judgement]: {
    ambient: 0.25,
    ambientCol: '#aa4444',
    dir: 0.3,
    dirCol: '#cc6666',
    bg: '#150808',
    campfire: 4,
    campfireCol: '#ff2200',
    sunPos: [18, -2, -10],
    moonPos: [0, 15, -5],
    sunCol: '#ff2200',
    sunScale: 0,
    moonScale: 1.2,
    starsOpacity: 0.8,
    fogNear: 20,
    fogFar: 50,
    fogOn: false,
  },
};
const DEFAULT_LIGHTING = PHASE_LIGHTING[Phase.Day];

// ── Sun/Moon ──
function CelestialBodies({
  sunPos,
  moonPos,
  sunCol,
  sunScale,
  moonScale,
}: {
  sunPos: THREE.Vector3;
  moonPos: THREE.Vector3;
  sunCol: THREE.Color;
  sunScale: number;
  moonScale: number;
}) {
  const sunRef = useRef<THREE.Group>(null);
  const moonRef = useRef<THREE.Group>(null);
  const curSunPos = useRef(sunPos.clone());
  const curMoonPos = useRef(moonPos.clone());
  const curSunScale = useRef(sunScale);
  const curMoonScale = useRef(moonScale);
  const curSunCol = useRef(sunCol.clone());

  useFrame((_, dt) => {
    const spd = 2 * dt;
    curSunPos.current.lerp(sunPos, spd);
    curMoonPos.current.lerp(moonPos, spd);
    curSunScale.current = THREE.MathUtils.lerp(curSunScale.current, sunScale, spd);
    curMoonScale.current = THREE.MathUtils.lerp(curMoonScale.current, moonScale, spd);
    curSunCol.current.lerp(sunCol, spd);
    if (sunRef.current) {
      sunRef.current.position.copy(curSunPos.current);
      sunRef.current.scale.setScalar(Math.max(0.01, curSunScale.current));
      const pulse = 1 + Math.sin(Date.now() * 0.002) * 0.08;
      sunRef.current.children[1]?.scale.setScalar(pulse * 2);
    }
    if (moonRef.current) {
      moonRef.current.position.copy(curMoonPos.current);
      moonRef.current.scale.setScalar(Math.max(0.01, curMoonScale.current));
    }
  });

  return (
    <>
      <group ref={sunRef}>
        <mesh>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial color={curSunCol.current} />
        </mesh>
        <mesh>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial color={curSunCol.current} transparent opacity={0.15} />
        </mesh>
      </group>
      <group ref={moonRef}>
        <mesh>
          <sphereGeometry args={[0.8, 16, 16]} />
          <meshBasicMaterial color="#ddeeff" />
        </mesh>
        <mesh>
          <sphereGeometry args={[1.2, 16, 16]} />
          <meshBasicMaterial color="#aaccff" transparent opacity={0.1} />
        </mesh>
      </group>
    </>
  );
}

// ── Clouds ──
function Clouds() {
  const ref = useRef<THREE.Group>(null);
  const clouds = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        x: (Math.random() - 0.5) * 30,
        y: 12 + Math.random() * 5,
        z: -8 + (Math.random() - 0.5) * 15,
        scale: 1.5 + Math.random() * 2,
        speed: 0.1 + Math.random() * 0.15,
        offset: Math.random() * 100,
      })),
    [],
  );

  useFrame(() => {
    if (!ref.current) return;
    const t = Date.now() * 0.001;
    ref.current.children.forEach((g, i) => {
      const c = clouds[i];
      g.position.x = c.x + Math.sin(t * c.speed + c.offset) * 3;
    });
  });

  return (
    <group ref={ref}>
      {clouds.map((c, i) => (
        <group key={i} position={[c.x, c.y, c.z]} scale={c.scale}>
          {[
            [-0.5, 0, 0],
            [0.3, 0.15, 0.2],
            [0, 0.1, -0.3],
          ].map((p, j) => (
            <mesh key={j} position={p as [number, number, number]}>
              <sphereGeometry args={[0.6 + j * 0.1, 8, 6]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.15} depthWrite={false} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

export default function VillageScene() {
  const gameState = useGameStore((s) => s.gameState);
  const phase = gameState?.phase;
  const target = PHASE_LIGHTING[phase ?? ''] ?? DEFAULT_LIGHTING;

  const cur = useRef({
    ambient: target.ambient,
    ambientCol: new THREE.Color(target.ambientCol),
    dir: target.dir,
    dirCol: new THREE.Color(target.dirCol),
    bg: new THREE.Color(target.bg),
    campfire: target.campfire,
    campfireCol: new THREE.Color(target.campfireCol),
    starsOpacity: target.starsOpacity,
  });

  const ambientRef = useRef<THREE.AmbientLight>(null);
  const dirRef = useRef<THREE.DirectionalLight>(null);
  const rimRef = useRef<THREE.DirectionalLight>(null);
  const campfireRef1 = useRef<THREE.PointLight>(null);
  const campfireRef2 = useRef<THREE.PointLight>(null);
  const starsRef = useRef<THREE.Group>(null);
  const fogRef = useRef<THREE.Fog>(null);

  const sunPosTarget = useMemo(
    () => new THREE.Vector3(...target.sunPos),
    [target.sunPos[0], target.sunPos[1], target.sunPos[2]],
  );
  const moonPosTarget = useMemo(
    () => new THREE.Vector3(...target.moonPos),
    [target.moonPos[0], target.moonPos[1], target.moonPos[2]],
  );
  const sunColTarget = useMemo(() => new THREE.Color(target.sunCol), [target.sunCol]);
  const targetColors = useMemo(
    () => ({
      ambientCol: new THREE.Color(target.ambientCol),
      dirCol: new THREE.Color(target.dirCol),
      bg: new THREE.Color(target.bg),
      campfireCol: new THREE.Color(target.campfireCol),
    }),
    [target.ambientCol, target.dirCol, target.bg, target.campfireCol],
  );

  useFrame((state, dt) => {
    const spd = 2 * dt;
    const c = cur.current;
    c.ambient = THREE.MathUtils.lerp(c.ambient, target.ambient, spd);
    c.dir = THREE.MathUtils.lerp(c.dir, target.dir, spd);
    c.campfire = THREE.MathUtils.lerp(c.campfire, target.campfire, spd);
    c.starsOpacity = THREE.MathUtils.lerp(c.starsOpacity, target.starsOpacity, spd);
    c.ambientCol.lerp(targetColors.ambientCol, spd);
    c.dirCol.lerp(targetColors.dirCol, spd);
    c.bg.lerp(targetColors.bg, spd);
    c.campfireCol.lerp(targetColors.campfireCol, spd);

    if (ambientRef.current) {
      ambientRef.current.intensity = c.ambient;
      ambientRef.current.color.copy(c.ambientCol);
    }
    if (dirRef.current) {
      dirRef.current.intensity = c.dir;
      dirRef.current.color.copy(c.dirCol);
    }
    if (rimRef.current) {
      rimRef.current.intensity = c.dir * 0.3;
      rimRef.current.color.copy(c.dirCol);
    }
    if (campfireRef1.current) {
      campfireRef1.current.intensity = c.campfire;
      campfireRef1.current.color.copy(c.campfireCol);
    }
    if (campfireRef2.current) {
      campfireRef2.current.intensity = c.campfire * 0.5;
    }
    state.scene.background = c.bg;
    if (starsRef.current) {
      starsRef.current.visible = c.starsOpacity > 0.01;
      starsRef.current.children.forEach((child) => {
        if ((child as any).material) (child as any).material.opacity = c.starsOpacity;
      });
    }
    if (fogRef.current) {
      if (target.fogOn) {
        fogRef.current.near = THREE.MathUtils.lerp(fogRef.current.near, 20, spd);
        fogRef.current.far = THREE.MathUtils.lerp(fogRef.current.far, 50, spd);
      } else {
        fogRef.current.near = THREE.MathUtils.lerp(fogRef.current.near, 200, spd);
        fogRef.current.far = THREE.MathUtils.lerp(fogRef.current.far, 300, spd);
      }
      fogRef.current.color.copy(c.bg);
    }
  });

  return (
    <>
      {/* Lighting */}
      <ambientLight
        ref={ambientRef}
        intensity={cur.current.ambient}
        color={cur.current.ambientCol}
      />
      <directionalLight
        ref={dirRef}
        position={[10, 15, 5]}
        intensity={cur.current.dir}
        color={cur.current.dirCol}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      {/* Rim light — backlight for characters */}
      <directionalLight
        ref={rimRef}
        position={[-8, 10, -10]}
        intensity={cur.current.dir * 0.3}
        color={cur.current.dirCol}
      />
      <pointLight
        ref={campfireRef1}
        position={[0, 1.5, 0]}
        intensity={cur.current.campfire}
        color={cur.current.campfireCol}
        distance={15}
        decay={2}
      />
      <pointLight
        ref={campfireRef2}
        position={[0, 0.5, 0]}
        intensity={cur.current.campfire * 0.5}
        color="#ff4400"
        distance={8}
        decay={2}
      />

      {/* Sky */}
      <color attach="background" args={[cur.current.bg]} />
      <fog
        ref={fogRef}
        attach="fog"
        args={[cur.current.bg, target.fogOn ? 20 : 200, target.fogOn ? 50 : 300]}
      />
      <group ref={starsRef}>
        <Stars radius={50} depth={50} count={2000} factor={3} fade speed={1} />
      </group>
      <CelestialBodies
        sunPos={sunPosTarget}
        moonPos={moonPosTarget}
        sunCol={sunColTarget}
        sunScale={target.sunScale}
        moonScale={target.moonScale}
      />
      <Clouds />

      {/* World */}
      <Ground />
      <Campfire />
      <Trees />
      <WorldProps gameState={gameState} />
      <Atmosphere phase={phase} />

      {/* Characters */}
      {gameState?.players.map((player, i) => (
        <Character
          key={player.id}
          player={player}
          index={i}
          total={gameState.players.length}
          gameState={gameState}
        />
      ))}

      <OrbitControls
        makeDefault
        minDistance={5}
        maxDistance={25}
        maxPolarAngle={Math.PI / 2.2}
        target={[0, 1, 0]}
        enableDamping
      />
    </>
  );
}
