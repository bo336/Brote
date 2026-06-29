'use client';

import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Float } from '@react-three/drei';
import * as THREE from 'three';
import type { MundoState } from '@/lib/mundo';

/** Tiny seeded RNG so scatter is deterministic per world. */
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface PaletteColors {
  ground: string;
  grass: string;
  leaf: string;
  leafDeep: string;
}
function palette(p: MundoState['palette']): PaletteColors {
  switch (p) {
    case 'golden':
      return { ground: '#C9A24B', grass: '#E8C766', leaf: '#FFB23E', leafDeep: '#E8950E' };
    case 'aqua':
      return { ground: '#5CB6A6', grass: '#7FD0BC', leaf: '#3CB371', leafDeep: '#1FB57A' };
    case 'lush':
      return { ground: '#3CB371', grass: '#57C98A', leaf: '#2f9c5f', leafDeep: '#0E7A52' };
    default:
      return { ground: '#6FBF73', grass: '#86CF8C', leaf: '#3CB371', leafDeep: '#2f7d4f' };
  }
}

function has(m: MundoState, el: string) {
  return m.structuralElements.includes(el as never);
}

function Island({ colors }: { colors: PaletteColors }) {
  return (
    <group>
      <mesh receiveShadow position={[0, -0.15, 0]}>
        <cylinderGeometry args={[2.4, 2.4, 0.3, 32]} />
        <meshStandardMaterial color={colors.ground} flatShading />
      </mesh>
      <mesh position={[0, -0.9, 0]}>
        <cylinderGeometry args={[2.4, 1.5, 1.3, 32]} />
        <meshStandardMaterial color="#7c5a3a" flatShading />
      </mesh>
    </group>
  );
}

function Grass({ count, colors }: { count: number; colors: PaletteColors }) {
  const rng = useMemo(() => mulberry32(1234), []);
  const blades = useMemo(
    () =>
      Array.from({ length: count }).map(() => {
        const a = rng() * Math.PI * 2;
        const r = Math.sqrt(rng()) * 2.1;
        return { x: Math.cos(a) * r, z: Math.sin(a) * r, h: 0.18 + rng() * 0.16, s: 0.7 + rng() * 0.6 };
      }),
    [count, rng],
  );
  return (
    <group position={[0, 0.02, 0]}>
      {blades.map((b, i) => (
        <mesh key={i} position={[b.x, b.h / 2, b.z]} scale={[b.s, 1, b.s]}>
          <coneGeometry args={[0.05, b.h, 4]} />
          <meshStandardMaterial color={colors.grass} flatShading />
        </mesh>
      ))}
    </group>
  );
}

function Tree({ position, scale = 1, colors }: { position: [number, number, number]; scale?: number; colors: PaletteColors }) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.09, 0.13, 0.7, 6]} />
        <meshStandardMaterial color="#7c5a3a" flatShading />
      </mesh>
      <mesh castShadow position={[0, 0.95, 0]}>
        <icosahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial color={colors.leaf} flatShading />
      </mesh>
      <mesh castShadow position={[-0.28, 0.7, 0.1]}>
        <icosahedronGeometry args={[0.32, 0]} />
        <meshStandardMaterial color={colors.leafDeep} flatShading />
      </mesh>
      <mesh castShadow position={[0.3, 0.78, -0.05]}>
        <icosahedronGeometry args={[0.34, 0]} />
        <meshStandardMaterial color={colors.leaf} flatShading />
      </mesh>
    </group>
  );
}

function Bush({ position, colors }: { position: [number, number, number]; colors: PaletteColors }) {
  return (
    <mesh castShadow position={position}>
      <icosahedronGeometry args={[0.28, 0]} />
      <meshStandardMaterial color={colors.leafDeep} flatShading />
    </mesh>
  );
}

function Flower({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.24, 4]} />
        <meshStandardMaterial color="#2f7d4f" />
      </mesh>
      <mesh position={[0, 0.26, 0]}>
        <icosahedronGeometry args={[0.07, 0]} />
        <meshStandardMaterial color={color} flatShading />
      </mesh>
    </group>
  );
}

function Pond() {
  return (
    <mesh position={[1.1, 0.02, -0.9]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.7, 24]} />
      <meshStandardMaterial color="#2DB4D4" transparent opacity={0.8} metalness={0.3} roughness={0.2} />
    </mesh>
  );
}

function Bird() {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime * 0.5;
    ref.current.position.set(Math.cos(t) * 1.6, 1.6 + Math.sin(t * 2) * 0.1, Math.sin(t) * 1.6);
    ref.current.rotation.y = -t + Math.PI / 2;
  });
  return (
    <group ref={ref}>
      <mesh>
        <coneGeometry args={[0.08, 0.24, 4]} />
        <meshStandardMaterial color="#FF8A3D" flatShading />
      </mesh>
    </group>
  );
}

function Butterfly({ seed }: { seed: number }) {
  const ref = useRef<THREE.Group>(null);
  const rng = useMemo(() => mulberry32(seed), [seed]);
  const base = useMemo(() => ({ x: (rng() - 0.5) * 3, z: (rng() - 0.5) * 3, p: rng() * 6 }), [rng]);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime + base.p;
    ref.current.position.set(base.x + Math.cos(t) * 0.4, 0.6 + Math.sin(t * 1.5) * 0.25, base.z + Math.sin(t) * 0.4);
  });
  return (
    <group ref={ref}>
      <mesh>
        <boxGeometry args={[0.12, 0.01, 0.08]} />
        <meshStandardMaterial color="#E8638C" />
      </mesh>
    </group>
  );
}

function Pip3D({ golden, aura }: { golden: boolean; aura: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.y = 0.45 + Math.sin(clock.elapsedTime * 1.5) * 0.05;
  });
  const body = golden ? '#FFD27A' : '#9CC93B';
  return (
    <group ref={ref} position={[0, 0.45, 0]}>
      {aura && (
        <mesh>
          <sphereGeometry args={[0.55, 16, 16]} />
          <meshBasicMaterial color={golden ? '#FFB23E' : '#1FB57A'} transparent opacity={0.12} />
        </mesh>
      )}
      <mesh castShadow>
        <sphereGeometry args={[0.32, 24, 24]} />
        <meshStandardMaterial color={body} flatShading />
      </mesh>
      {/* leaf */}
      <mesh position={[0.12, 0.34, 0]} rotation={[0, 0, -0.6]}>
        <coneGeometry args={[0.12, 0.3, 5]} />
        <meshStandardMaterial color={golden ? '#FFB23E' : '#1FB57A'} flatShading />
      </mesh>
      {/* eyes */}
      <mesh position={[-0.1, 0.05, 0.28]}>
        <sphereGeometry args={[0.045, 12, 12]} />
        <meshStandardMaterial color="#0C1A13" />
      </mesh>
      <mesh position={[0.1, 0.05, 0.28]}>
        <sphereGeometry args={[0.045, 12, 12]} />
        <meshStandardMaterial color="#0C1A13" />
      </mesh>
    </group>
  );
}

function Scene({ mundo, night, dayT }: { mundo: MundoState; night: boolean; dayT: number }) {
  const colors = palette(mundo.palette);
  const grassCount = Math.round(10 + mundo.liveliness * 36);
  const flowerColors = ['#E8638C', '#FFB23E', '#B07CD6', '#FF6B5E'];

  const sunAngle = dayT * Math.PI * 2;
  const sunPos: [number, number, number] = [Math.cos(sunAngle) * 5, Math.max(1.5, Math.sin(sunAngle) * 5 + 2), 3];

  return (
    <>
      <ambientLight intensity={night ? 0.45 : 0.75} color={night ? '#9fb0d6' : '#ffffff'} />
      <directionalLight
        castShadow
        position={sunPos}
        intensity={night ? 0.25 : 1.3}
        color={night ? '#aebfe0' : '#fff4d6'}
        shadow-mapSize={[1024, 1024]}
      />
      <hemisphereLight intensity={0.3} color={night ? '#2a3a5a' : '#bfe8ff'} groundColor={colors.ground} />

      <Island colors={colors} />
      {has(mundo, 'grass') && <Grass count={grassCount} colors={colors} />}

      <Float speed={2} rotationIntensity={0} floatIntensity={0.2}>
        <Pip3D golden={mundo.palette === 'golden'} aura={mundo.unlockedCosmetics.includes('guardian_aura')} />
      </Float>

      {has(mundo, 'flowers') &&
        flowerColors.map((c, i) => {
          const a = (i / flowerColors.length) * Math.PI * 2 + 0.5;
          return <Flower key={i} position={[Math.cos(a) * 1.4, 0, Math.sin(a) * 1.4]} color={c} />;
        })}

      {has(mundo, 'small_tree') && <Tree position={[-1.2, 0, 0.6]} scale={0.7} colors={colors} />}
      {has(mundo, 'shrubs') && (
        <>
          <Bush position={[1.4, 0.18, 0.7]} colors={colors} />
          <Bush position={[-0.4, 0.18, -1.4]} colors={colors} />
          <Bush position={[0.9, 0.18, 1.3]} colors={colors} />
        </>
      )}
      {has(mundo, 'full_tree') && <Tree position={[1.1, 0, -0.2]} scale={1.1} colors={colors} />}
      {has(mundo, 'grove') && (
        <>
          <Tree position={[-1.4, 0, -0.9]} scale={0.9} colors={colors} />
          <Tree position={[0.2, 0, -1.5]} scale={0.8} colors={colors} />
        </>
      )}
      {has(mundo, 'pond') && <Pond />}
      {has(mundo, 'bird') && <Bird />}
      {has(mundo, 'butterflies') && [0, 1, 2].map((i) => <Butterfly key={i} seed={i + 7} />)}

      <ContactShadows position={[0, 0.01, 0]} opacity={0.35} scale={7} blur={2.4} far={3} />
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        autoRotate
        autoRotateSpeed={0.6}
        minPolarAngle={Math.PI * 0.28}
        maxPolarAngle={Math.PI * 0.46}
        target={[0, 0.4, 0]}
      />
    </>
  );
}

export default function MundoCanvas({ mundo, night, dayT }: { mundo: MundoState; night: boolean; dayT: number }) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 2.6, 6], fov: 35 }}
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
    >
      <Scene mundo={mundo} night={night} dayT={dayT} />
    </Canvas>
  );
}
