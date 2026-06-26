'use client';

import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/** Place N points evenly on a sphere (Fibonacci sphere). */
function fibSphere(n: number, radius: number): [number, number, number][] {
  const pts: [number, number, number][] = [];
  const phi = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / Math.max(1, n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = phi * i;
    pts.push([Math.cos(theta) * r * radius, y * radius, Math.sin(theta) * r * radius]);
  }
  return pts;
}

function Globe({ markerCount }: { markerCount: number }) {
  const group = useRef<THREE.Group>(null);
  const markers = useMemo(() => fibSphere(Math.min(40, markerCount), 1.02), [markerCount]);
  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.25;
  });
  return (
    <group ref={group}>
      <mesh>
        <sphereGeometry args={[1, 48, 48]} />
        <meshStandardMaterial color="#1E88A8" roughness={0.6} metalness={0.1} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.005, 32, 32]} />
        <meshStandardMaterial color="#1FB57A" wireframe transparent opacity={0.18} />
      </mesh>
      {markers.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshBasicMaterial color="#FFB23E" />
        </mesh>
      ))}
    </group>
  );
}

export default function ImpactGlobe({ markerCount = 8 }: { markerCount?: number }) {
  return (
    <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 3.2], fov: 38 }} gl={{ alpha: true }}>
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 2, 4]} intensity={1.1} />
      <Globe markerCount={markerCount} />
    </Canvas>
  );
}
