import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Html, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';
import { Phase, Role } from '@ma-soi/shared';
import Character from './Character';
import Campfire from './Campfire';
import Ground from './Ground';
import Trees from './Trees';

export default function VillageScene() {
  const gameState = useGameStore(s => s.gameState);
  const phase = gameState?.phase;
  const isNight = phase === Phase.Night;
  const isDawn = phase === Phase.Dawn;
  const isDusk = phase === Phase.Dusk;
  const isJudgement = phase === Phase.Judgement;

  // Lighting params based on phase
  const ambientIntensity = isNight ? 0.15 : isDawn ? 0.4 : isDusk ? 0.35 : isJudgement ? 0.25 : 0.6;
  const ambientColor = isNight ? '#4466aa' : isDawn ? '#ffcc88' : isDusk ? '#cc8844' : isJudgement ? '#aa4444' : '#ffffff';
  const dirIntensity = isNight ? 0.1 : isDawn ? 0.8 : isDusk ? 0.5 : isJudgement ? 0.3 : 1.2;
  const dirColor = isNight ? '#6688cc' : isDawn ? '#ffddaa' : isDusk ? '#dd9944' : isJudgement ? '#cc6666' : '#fff5e0';
  const bgColor = isNight ? '#070b15' : isDawn ? '#2a1a10' : isDusk ? '#1a1008' : isJudgement ? '#150808' : '#87CEEB';
  const campfireIntensity = isNight ? 3 : isJudgement ? 4 : isDusk ? 2 : 0.5;

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={ambientIntensity} color={ambientColor} />
      <directionalLight
        position={[10, 15, 5]}
        intensity={dirIntensity}
        color={dirColor}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      {/* Campfire light */}
      <pointLight position={[0, 1.5, 0]} intensity={campfireIntensity} color={isJudgement ? '#ff2200' : '#ff6622'} distance={15} decay={2} />
      <pointLight position={[0, 0.5, 0]} intensity={campfireIntensity * 0.5} color="#ff4400" distance={8} decay={2} />

      {/* Sky */}
      <color attach="background" args={[bgColor]} />
      {(isNight || isJudgement) && <Stars radius={50} depth={50} count={2000} factor={3} fade speed={1} />}
      {(!isNight && !isDawn && !isDusk && !isJudgement) && <fog attach="fog" args={['#87CEEB', 20, 50]} />}

      {/* Ground */}
      <Ground />

      {/* Campfire */}
      <Campfire />

      {/* Trees */}
      <Trees />

      {/* Characters */}
      {gameState?.players.map((player, i) => (
        <Character key={player.id} player={player} index={i} total={gameState.players.length} gameState={gameState} />
      ))}

      {/* Camera */}
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
