import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { Player, GameState, Phase, Role, GameEventType, isWolfRole } from '@ma-soi/shared';
import { useGameStore } from '../../store/gameStore';

const ROLE_COLORS: Record<Role, string> = {
  [Role.Werewolf]: '#cc2222', [Role.AlphaWolf]: '#aa1111', [Role.WolfCub]: '#ee4444',
  [Role.Villager]: '#44aa44', [Role.Seer]: '#9933cc', [Role.ApprenticeSeer]: '#bb66dd',
  [Role.Witch]: '#22aa66', [Role.Hunter]: '#ee6600', [Role.Guard]: '#2266cc',
  [Role.Cupid]: '#ee66aa', [Role.Fool]: '#ddaa22',
};
const ROLE_NAMES_VI: Record<Role, string> = {
  [Role.Werewolf]: 'Sói', [Role.AlphaWolf]: 'Sói Đầu Đàn', [Role.WolfCub]: 'Sói Con',
  [Role.Villager]: 'Dân', [Role.Seer]: 'Tiên Tri', [Role.ApprenticeSeer]: 'TT Tập Sự',
  [Role.Witch]: 'Phù Thủy', [Role.Hunter]: 'Thợ Săn', [Role.Guard]: 'Bảo Vệ',
  [Role.Cupid]: 'Cupid', [Role.Fool]: 'Kẻ Ngốc',
};
const SKIN_COLORS = ['#e8b89d', '#d4956b', '#c68642', '#8d5524', '#f5d0a9', '#e0ac69', '#c49a6c', '#a0785a',
  '#f3c9a8', '#d9a87c', '#b8865e', '#9c6e4a', '#deb887', '#cd853f', '#d2a679', '#b5916b'];

// ── VFX Components ──

function ZzzParticles() {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!ref.current) return;
    ref.current.children.forEach((c, i) => {
      const t = ((Date.now() * 0.001 + i * 0.5) % 3) / 3;
      c.position.y = 0.5 + t * 1;
      c.position.x = Math.sin(t * 3 + i) * 0.3;
      (c as THREE.Mesh).scale.setScalar((1 - t) * 0.15);
    });
  });
  return (
    <group ref={ref} position={[0.3, 1.2, 0]}>
      {[0, 1, 2].map(i => (
        <mesh key={i}><sphereGeometry args={[1, 4, 4]} /><meshBasicMaterial color="#aaccff" transparent opacity={0.6} /></mesh>
      ))}
    </group>
  );
}

function WolfSlash({ active }: { active: boolean }) {
  const [opacity, setOpacity] = useState(0);
  useEffect(() => { if (active) setOpacity(1); }, [active]);
  useFrame((_, dt) => { if (opacity > 0) setOpacity(o => Math.max(0, o - dt * 2)); });
  if (opacity <= 0) return null;
  return (
    <mesh position={[0, 1, 0.3]} rotation={[0, 0, -0.5]}>
      <planeGeometry args={[0.8, 0.15]} />
      <meshBasicMaterial color="#ff0000" transparent opacity={opacity} side={THREE.DoubleSide} />
    </mesh>
  );
}

function ShieldBubble() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!ref.current) return;
    ref.current.rotation.y += 0.02;
    (ref.current.material as THREE.MeshBasicMaterial).opacity = 0.15 + Math.sin(Date.now() * 0.003) * 0.05;
  });
  return (
    <mesh ref={ref} position={[0, 0.8, 0]}>
      <sphereGeometry args={[0.6, 16, 16]} />
      <meshBasicMaterial color="#4488ff" transparent opacity={0.2} side={THREE.DoubleSide} />
    </mesh>
  );
}

function SeerGlow() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!ref.current) return;
    const s = 0.15 + Math.sin(Date.now() * 0.005) * 0.05;
    ref.current.scale.setScalar(s);
  });
  return (
    <mesh ref={ref} position={[0, 1.4, 0.15]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color="#cc66ff" transparent opacity={0.4} />
    </mesh>
  );
}

function PotionBurst({ color }: { color: string }) {
  const [life, setLife] = useState(1);
  useFrame((_, dt) => { setLife(l => Math.max(0, l - dt * 0.8)); });
  if (life <= 0) return null;
  return (
    <group position={[0, 1, 0]}>
      {[0, 1, 2, 3, 4].map(i => {
        const a = (i / 5) * Math.PI * 2;
        const r = (1 - life) * 0.8;
        return (
          <mesh key={i} position={[Math.cos(a) * r, Math.sin(a) * r * 0.5, 0]} scale={life * 0.1}>
            <sphereGeometry args={[1, 6, 6]} />
            <meshBasicMaterial color={color} transparent opacity={life * 0.7} />
          </mesh>
        );
      })}
    </group>
  );
}

function LoveParticles() {
  const ref = useRef<THREE.Group>(null);
  const [life, setLife] = useState(1);
  useFrame((_, dt) => {
    setLife(l => Math.max(0, l - dt * 0.2));
    if (!ref.current) return;
    ref.current.children.forEach((c, i) => {
      const t = ((Date.now() * 0.001 + i * 0.3) % 2) / 2;
      c.position.y = t * 3;
      c.position.x = Math.sin(t * 8 + i) * 0.5;
      (c as THREE.Mesh).scale.setScalar((1 - t) * 0.25 * life);
    });
  });
  if (life <= 0) return null;
  return (
    <group ref={ref} position={[0, 1.5, 0]}>
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[1, 6, 6]} />
          <meshBasicMaterial color="#ff66b2" transparent opacity={0.6 * life} />
        </mesh>
      ))}
    </group>
  );
}

function DefenseSpotlight({ isDefending }: { isDefending: boolean }) {
  const coneRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const fireRef = useRef<THREE.Group>(null);
  useFrame(() => {
    const t = Date.now() * 0.004;
    if (coneRef.current) (coneRef.current.material as THREE.MeshBasicMaterial).opacity = 0.06 + Math.sin(t) * 0.03;
    if (ringRef.current) {
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity = 0.2 + Math.sin(t) * 0.1;
      ringRef.current.rotation.z += 0.02;
    }
    if (fireRef.current) {
      fireRef.current.children.forEach((c, i) => {
        const ft = ((Date.now() * 0.003 + i * 0.8) % 2) / 2;
        const a = (i / 8) * Math.PI * 2 + Date.now() * 0.001;
        c.position.set(Math.cos(a) * 0.6, ft * 0.8, Math.sin(a) * 0.6);
        (c as THREE.Mesh).scale.setScalar((1 - ft) * 0.06);
      });
    }
  });
  return (
    <group>
      {/* Ground ring */}
      <mesh ref={ringRef} position={[0, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.5, 0.75, 32]} />
        <meshBasicMaterial color="#ff2222" transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>
      {/* Volumetric cone light */}
      <mesh ref={coneRef} position={[0, 2.5, 0]}>
        <coneGeometry args={[0.8, 5, 16, 1, true]} />
        <meshBasicMaterial color={isDefending ? '#ffaa44' : '#ff4444'} transparent opacity={0.08} side={THREE.DoubleSide} />
      </mesh>
      {/* Fire ring particles when defending */}
      {isDefending && (
        <group ref={fireRef} position={[0, 0.1, 0]}>
          {Array.from({ length: 8 }).map((_, i) => (
            <mesh key={i}><sphereGeometry args={[1, 4, 4]} /><meshBasicMaterial color="#ff6622" transparent opacity={0.5} /></mesh>
          ))}
        </group>
      )}
    </group>
  );
}

// ── Execution Animation ──
function ExecutionEffect({ progress, phase }: { progress: number; phase: 'rising' | 'hanging' | 'falling' | 'done' }) {
  const ropeRef = useRef<THREE.Mesh>(null);
  const burstRef = useRef<THREE.Group>(null);
  useFrame(() => {
    if (ropeRef.current) {
      const ropeLen = phase === 'falling' ? 0 : Math.min(progress * 4, 3.5);
      ropeRef.current.scale.set(1, Math.max(0.01, ropeLen), 1);
      ropeRef.current.position.y = 1.4 + ropeLen / 2 + 1;
    }
    if (burstRef.current && phase === 'falling') {
      burstRef.current.children.forEach((c, i) => {
        const t = Math.min(1, progress * 2);
        const a = (i / 6) * Math.PI * 2;
        c.position.set(Math.cos(a) * t * 1.5, (1 - t) * 2, Math.sin(a) * t * 1.5);
        (c as THREE.Mesh).scale.setScalar((1 - t) * 0.08);
      });
    }
  });
  if (phase === 'done') return null;
  return (
    <group>
      {/* Rope */}
      {(phase === 'rising' || phase === 'hanging') && (
        <mesh ref={ropeRef} position={[0, 3, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 1, 4]} />
          <meshBasicMaterial color="#8B7355" />
        </mesh>
      )}
      {/* Death burst particles */}
      {phase === 'falling' && (
        <group ref={burstRef} position={[0, 1, 0]}>
          {Array.from({ length: 6 }).map((_, i) => (
            <mesh key={i}><sphereGeometry args={[1, 4, 4]} /><meshBasicMaterial color="#ff4444" transparent opacity={0.6} /></mesh>
          ))}
        </group>
      )}
    </group>
  );
}

// ── Vote Visual Effects ──

function VoteArrow({ from, to }: { from: [number, number, number]; to: [number, number, number] }) {
  const points = useMemo(() => [new THREE.Vector3(...from), new THREE.Vector3(from[0], 2.2, from[2]), new THREE.Vector3(to[0], 2.2, to[2]), new THREE.Vector3(...to)], [from, to]);
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points), [points]);
  const [progress, setProgress] = useState(0);
  const trailRef = useRef<THREE.Group>(null);

  const geom = useMemo(() => {
    const partial = new THREE.CatmullRomCurve3(curve.getPoints(Math.max(2, Math.floor(30 * progress))).slice(0, Math.max(2, Math.floor(30 * progress))));
    return new THREE.TubeGeometry(partial, 20, 0.04, 8, false);
  }, [curve, Math.floor(progress * 10)]);

  useFrame((_, dt) => {
    if (progress < 1) setProgress(p => Math.min(1, p + dt * 2));
    // Trail particles
    if (trailRef.current) {
      const headPt = curve.getPoint(progress);
      trailRef.current.children.forEach((c, i) => {
        const t = Math.max(0, progress - i * 0.08);
        const pt = curve.getPoint(Math.max(0, t));
        c.position.copy(pt).sub(new THREE.Vector3(...from));
        (c as THREE.Mesh).scale.setScalar(0.03 * (1 - i * 0.15));
      });
    }
  });

  // Arrowhead position
  const headPt = curve.getPoint(progress);
  const headDir = curve.getTangent(progress);
  const arrowRot = useMemo(() => {
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), headDir.normalize());
    return new THREE.Euler().setFromQuaternion(q);
  }, [headDir]);

  return (
    <group>
      <mesh geometry={geom}>
        <meshBasicMaterial color="#ffaa00" transparent opacity={0.7} />
      </mesh>
      {/* Arrowhead */}
      {progress > 0.1 && (
        <mesh position={[headPt.x - from[0], headPt.y - from[1], headPt.z - from[2]]} rotation={arrowRot}>
          <coneGeometry args={[0.08, 0.2, 6]} />
          <meshBasicMaterial color="#ff6600" />
        </mesh>
      )}
      {/* Trail particles */}
      <group ref={trailRef}>
        {[0, 1, 2, 3].map(i => (
          <mesh key={i}><sphereGeometry args={[1, 4, 4]} /><meshBasicMaterial color="#ffcc44" transparent opacity={0.4} /></mesh>
        ))}
      </group>
    </group>
  );
}

function VoterGlow() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (ref.current) (ref.current.material as THREE.MeshBasicMaterial).opacity = 0.12 + Math.sin(Date.now() * 0.003) * 0.05;
  });
  return (
    <mesh ref={ref} position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.5, 16]} />
      <meshBasicMaterial color="#ffaa00" transparent opacity={0.15} />
    </mesh>
  );
}

function VoteTargetRing({ voteCount }: { voteCount: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!ref.current) return;
    ref.current.rotation.y += 0.02;
    const s = 1 + Math.sin(Date.now() * 0.004) * 0.08;
    ref.current.scale.setScalar(s);
  });
  const ringColor = voteCount >= 3 ? '#ff3333' : voteCount >= 2 ? '#ff8800' : '#ffcc00';
  return (
    <group ref={ref} position={[0, 0.05, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.55, 0.75, 32]} />
        <meshBasicMaterial color={ringColor} transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.8, 0.85, 32]} />
        <meshBasicMaterial color={ringColor} transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function VoteParticles() {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!ref.current) return;
    ref.current.children.forEach((c, i) => {
      const t = ((Date.now() * 0.002 + i * 1.2) % 4) / 4;
      const angle = (i / 6) * Math.PI * 2 + Date.now() * 0.001;
      const radius = 0.4 + t * 0.3;
      c.position.x = Math.cos(angle) * radius;
      c.position.z = Math.sin(angle) * radius;
      c.position.y = t * 1.5;
      (c as THREE.Mesh).scale.setScalar((1 - t) * 0.04);
    });
  });
  return (
    <group ref={ref} position={[0, 0.2, 0]}>
      {[0, 1, 2, 3, 4, 5].map(i => (
        <mesh key={i}>
          <sphereGeometry args={[1, 4, 4]} />
          <meshBasicMaterial color="#ffcc44" transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  );
}

// ── Main Character ──

export default function Character({ player, index, total, gameState }: { player: Player; index: number; total: number; gameState: GameState }) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const spectatorMode = useGameStore(s => s.spectatorMode);
  const events = useGameStore(s => s.events);

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

  // Active effects from recent events
  const recentEvents = events.slice(-20);
  const isSpeaking = recentEvents.some(e => e.type === GameEventType.DayMessage && e.data.playerId === player.id && Date.now() - e.timestamp < 3000) && gameState.phase === Phase.Day;
  const isDefending = recentEvents.some(e => e.type === GameEventType.DefenseSpeech && e.data.playerId === player.id && Date.now() - e.timestamp < 5000);
  const lastSpeech = [...events].reverse().find(e => (e.type === GameEventType.DayMessage || e.type === GameEventType.DefenseSpeech) && e.data.playerId === player.id);
  const wasAttacked = recentEvents.some(e => e.type === GameEventType.NightActionPerformed && e.data.action === 'wolf_kill' && e.data.targetName === player.name && Date.now() - e.timestamp < 4000);
  const isGuarded = recentEvents.some(e => e.type === GameEventType.GuardProtect && e.data.targetName === player.name && Date.now() - e.timestamp < 5000);
  const isSeerTarget = recentEvents.some(e => e.type === GameEventType.SeerResult && e.data.targetName === player.name && Date.now() - e.timestamp < 4000);
  const isSeer = (player.role === Role.Seer || (player.role === Role.ApprenticeSeer && gameState.apprenticeSeerActivated)) && recentEvents.some(e => e.type === GameEventType.SeerResult && e.data.seerId === player.id && Date.now() - e.timestamp < 4000);
  const witchHeal = recentEvents.some(e => e.type === GameEventType.WitchAction && e.data.action === 'heal' && e.data.targetName === player.name && Date.now() - e.timestamp < 4000);
  const witchKill = recentEvents.some(e => e.type === GameEventType.WitchAction && e.data.action === 'kill' && e.data.targetName === player.name && Date.now() - e.timestamp < 4000);
  const isCupidPair = recentEvents.some(e => e.type === GameEventType.CupidPair && (e.data.player1Name === player.name || e.data.player2Name === player.name) && Date.now() - e.timestamp < 6000);

  // Vote tracking
  const lastVote = [...events].reverse().find(e => e.type === GameEventType.VoteCast && e.data.voterName === player.name && Date.now() - e.timestamp < 5000);
  const voteTarget = lastVote ? gameState.players.find(p => p.name === lastVote.data.targetName) : null;
  const voteTargetIndex = voteTarget ? gameState.players.indexOf(voteTarget) : -1;

  const votesReceived = isDusk ? recentEvents.filter(e => e.type === GameEventType.VoteCast && e.data.targetName === player.name && Date.now() - e.timestamp < 10000).length : 0;
  const hasVoted = isDusk && recentEvents.some(e => e.type === GameEventType.VoteCast && e.data.voterName === player.name && Date.now() - e.timestamp < 10000);

  // Death animation
  const [deathProgress, setDeathProgress] = useState(player.alive ? 0 : 1);
  useEffect(() => { if (!player.alive) setDeathProgress(0); }, [player.alive]);

  // Execution (treo cổ) animation
  const [execPhase, setExecPhase] = useState<'none' | 'rising' | 'hanging' | 'falling' | 'done'>('none');
  const [execProgress, setExecProgress] = useState(0);
  const wasExecuted = recentEvents.some(e => e.type === GameEventType.JudgementResult && e.data.accusedId === player.id && e.data.executed && Date.now() - e.timestamp < 8000);
  useEffect(() => {
    if (wasExecuted && execPhase === 'none') {
      setExecPhase('rising');
      setExecProgress(0);
    }
  }, [wasExecuted]);

  // Dim other players when someone is defending
  const someoneDefending = isJudgement && recentEvents.some(e => e.type === GameEventType.DefenseSpeech && Date.now() - e.timestamp < 5000);
  const isDimmed = someoneDefending && !isAccused && player.alive;

  useFrame((_, dt) => {
    if (!groupRef.current || !bodyRef.current) return;

    // Execution animation phases
    if (execPhase === 'rising') {
      setExecProgress(p => {
        const next = p + dt * 1.2;
        if (next >= 1) { setExecPhase('hanging'); return 0; }
        return next;
      });
      bodyRef.current.position.y = execProgress * 2.5;
    } else if (execPhase === 'hanging') {
      setExecProgress(p => {
        const next = p + dt * 2;
        if (next >= 1) { setExecPhase('falling'); return 0; }
        return next;
      });
      bodyRef.current.position.y = 2.5 + Math.sin(Date.now() * 0.01) * 0.05;
    } else if (execPhase === 'falling') {
      setExecProgress(p => {
        const next = p + dt * 3;
        if (next >= 1) { setExecPhase('done'); return 1; }
        return next;
      });
      bodyRef.current.position.y = 2.5 * (1 - execProgress);
      bodyRef.current.rotation.z = execProgress * (Math.PI / 2);
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
        bodyRef.current.scale.lerp(new THREE.Vector3(0.9, 0.9, 0.9), 0.05);
        bodyRef.current.position.y *= 0.9;
      } else {
        bodyRef.current.position.y *= 0.9;
        bodyRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
      }

      // Death fall
      if (!player.alive && deathProgress < 1) {
        setDeathProgress(p => Math.min(1, p + dt * 1.5));
        bodyRef.current.rotation.z = deathProgress * (Math.PI / 3);
        bodyRef.current.position.y = -deathProgress * 0.3;
      }

      // Night head droop
      if (isNight && player.alive) {
        bodyRef.current.rotation.x = Math.sin(Date.now() * 0.001) * 0.05 + 0.1;
      } else if (player.alive) {
        bodyRef.current.rotation.x *= 0.95;
      }
    }
  });

  return (
    <group ref={groupRef} position={[x, 0, z]} rotation={[0, lookAngle + Math.PI, 0]}>
      {/* Seat */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.35, 0.4, 0.4, 8]} />
        <meshStandardMaterial color="#5c3a1e" roughness={0.9} />
      </mesh>

      {/* Defense spotlight */}
      {isAccused && <DefenseSpotlight isDefending={isDefending} />}

      {/* Execution effect */}
      {execPhase !== 'none' && <ExecutionEffect progress={execProgress} phase={execPhase} />}

      {/* Vote target ring */}
      {votesReceived > 0 && player.alive && <VoteTargetRing voteCount={votesReceived} />}
      {votesReceived > 0 && player.alive && <VoteParticles />}

      {/* Voter ground glow */}
      {hasVoted && player.alive && <VoterGlow />}

      <group ref={bodyRef} position={[0, 0.9, 0]}>
        {/* Torso */}
        <mesh castShadow>
          <capsuleGeometry args={[0.22, 0.4, 8, 16]} />
          <meshStandardMaterial
            color={player.alive ? (showRole ? roleColor : '#666666') : '#333333'}
            roughness={0.7} transparent opacity={player.alive ? (isDimmed ? 0.4 : 1) : Math.max(0.2, 1 - deathProgress * 0.6)}
          />
        </mesh>

        {/* Head */}
        <mesh position={[0, 0.5, 0]} castShadow>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshStandardMaterial color={player.alive ? skinColor : '#555'} roughness={0.6} transparent opacity={player.alive ? 1 : 0.4} />
        </mesh>

        {/* Eyes */}
        {player.alive && !isNight && <>
          <mesh position={[-0.06, 0.52, 0.15]}><sphereGeometry args={[0.03, 8, 8]} /><meshBasicMaterial color={(isSpeaking || isDefending) ? '#ffffff' : '#222'} /></mesh>
          <mesh position={[0.06, 0.52, 0.15]}><sphereGeometry args={[0.03, 8, 8]} /><meshBasicMaterial color={(isSpeaking || isDefending) ? '#ffffff' : '#222'} /></mesh>
        </>}
        {player.alive && isNight && <>
          <mesh position={[-0.06, 0.52, 0.16]} rotation={[0, 0, Math.PI / 6]}><boxGeometry args={[0.06, 0.01, 0.01]} /><meshBasicMaterial color="#222" /></mesh>
          <mesh position={[0.06, 0.52, 0.16]} rotation={[0, 0, -Math.PI / 6]}><boxGeometry args={[0.06, 0.01, 0.01]} /><meshBasicMaterial color="#222" /></mesh>
        </>}

        {/* Arms */}
        <mesh position={[-0.3, -0.05, 0]} rotation={[0, 0, (isSpeaking || isDefending) ? -0.6 : hasVoted ? -0.8 : -0.3]} castShadow>
          <capsuleGeometry args={[0.06, 0.3, 4, 8]} /><meshStandardMaterial color={skinColor} transparent opacity={player.alive ? 1 : 0.4} />
        </mesh>
        <mesh position={[0.3, -0.05, 0]} rotation={[0, 0, (isSpeaking || isDefending) ? 0.6 : hasVoted ? 0.8 : 0.3]} castShadow>
          <capsuleGeometry args={[0.06, 0.3, 4, 8]} /><meshStandardMaterial color={skinColor} transparent opacity={player.alive ? 1 : 0.4} />
        </mesh>

        {/* VFX */}
        {isNight && player.alive && <ZzzParticles />}
        {wasAttacked && spectatorMode === 'god' && <WolfSlash active />}
        {isGuarded && spectatorMode === 'god' && <ShieldBubble />}
        {isSeer && spectatorMode === 'god' && <SeerGlow />}
        {isSeerTarget && spectatorMode === 'god' && <SeerGlow />}
        {witchHeal && spectatorMode === 'god' && <PotionBurst color="#44ff44" />}
        {witchKill && spectatorMode === 'god' && <PotionBurst color="#aa00ff" />}
        {isCupidPair && spectatorMode === 'god' && <LoveParticles />}
      </group>

      {/* Name label */}
      <Html position={[0, 2.1, 0]} center distanceFactor={10} style={{ pointerEvents: 'none' }}>
        <div className="text-center whitespace-nowrap">
          <div className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            isAccused ? 'bg-red-900/90 text-red-200 border border-red-500/50' :
            player.alive ? 'bg-black/70 text-white' : 'bg-black/40 text-gray-500 line-through'
          }`}>
            {player.personality.emoji} {player.name}
          </div>
          {showRole && <div className="text-[10px] mt-0.5 px-2 py-0.5 rounded-full bg-black/60" style={{ color: roleColor }}>{ROLE_NAMES_VI[player.role]}</div>}
        </div>
      </Html>

      {/* Vote count badge */}
      {isDusk && votesReceived > 0 && player.alive && (
        <Html position={[0.4, 2.4, 0]} center distanceFactor={10} style={{ pointerEvents: 'none' }}>
          <div className="vote-badge-3d flex items-center justify-center w-7 h-7 rounded-full font-bold text-sm text-white shadow-lg"
            style={{
              background: votesReceived >= 3 ? 'linear-gradient(135deg, #ef4444, #dc2626)' : votesReceived >= 2 ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #eab308, #ca8a04)',
              boxShadow: `0 0 12px ${votesReceived >= 3 ? '#ef4444' : '#f59e0b'}88`,
            }}>
            {votesReceived}
          </div>
        </Html>
      )}

      {/* Accused badge during Judgement */}
      {isAccused && (
        <Html position={[0, 2.6, 0]} center distanceFactor={10} style={{ pointerEvents: 'none' }}>
          <div className="judgement-phase-pulse text-sm px-3 py-1 rounded-full bg-red-600/90 text-white font-bold whitespace-nowrap shadow-lg" style={{ boxShadow: '0 0 20px #ef444466' }}>
            ⚖️ Đang bị phán xét
          </div>
        </Html>
      )}

      {/* "Đã bỏ phiếu" indicator */}
      {isDusk && hasVoted && player.alive && (
        <Html position={[0, 2.5, 0]} center distanceFactor={10} style={{ pointerEvents: 'none' }}>
          <div className="text-[10px] px-2 py-0.5 rounded-full bg-amber-600/90 text-white font-medium whitespace-nowrap shadow-md">
            🗳️ Đã bỏ phiếu
          </div>
        </Html>
      )}

      {/* Speech bubble */}
      {(isSpeaking || isDefending) && lastSpeech && (
        <Html position={[0, 2.7, 0]} center distanceFactor={10} style={{ pointerEvents: 'none' }}>
          <div className={`text-sm px-4 py-2.5 rounded-xl max-w-[480px] min-w-[280px] shadow-lg animate-pulse ${
            isDefending ? 'bg-red-50/95 text-red-900 border-2 border-red-400/50' : 'bg-white/95 text-black'
          }`}>
            {isDefending && <span className="text-xs font-bold text-red-600 block mb-1">⚖️ Biện hộ:</span>}
            {lastSpeech.data.message?.slice(0, 150)}{lastSpeech.data.message?.length > 150 ? '...' : ''}
            <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 ${isDefending ? 'bg-red-50/95' : 'bg-white/95'}`} />
          </div>
        </Html>
      )}

      {/* Death marker */}
      {!player.alive && (
        <Html position={[0, 1.8, 0]} center distanceFactor={10} style={{ pointerEvents: 'none' }}>
          <div className="text-3xl drop-shadow-lg">💀</div>
        </Html>
      )}

      {/* Vote arrow */}
      {voteTarget && voteTargetIndex >= 0 && (() => {
        const ta = (voteTargetIndex / total) * Math.PI * 2 - Math.PI / 2;
        const tx = Math.cos(ta) * radius;
        const tz = Math.sin(ta) * radius;
        return <VoteArrow from={[0, 1.5, 0]} to={[tx - x, 1.5, tz - z]} />;
      })()}
    </group>
  );
}
