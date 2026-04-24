import * as THREE from 'three';

export default function Ground() {
  return (
    <group>
      {/* Main ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.01, 0]}>
        <circleGeometry args={[20, 32]} />
        <meshStandardMaterial color="#2d5016" roughness={1} />
      </mesh>
      {/* Inner clearing */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <circleGeometry args={[6, 32]} />
        <meshStandardMaterial color="#3d6022" roughness={1} />
      </mesh>
      {/* Dirt path around campfire */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <ringGeometry args={[0.8, 5, 32]} />
        <meshStandardMaterial color="#5c4a2e" roughness={1} />
      </mesh>
    </group>
  );
}
