'use client';

/**
 * "Tu Mundo" — the living, procedural 3D world (IMPROVEMENT_PLAN §B1/§B2).
 *
 * 100% procedural three.js — no external models. Every scoring completion
 * places one element on a golden-angle spiral; the island visibly fills as the
 * world progresses, themed by the current biome (infinite ladder). Motion:
 * wind-shader grass, swaying trees, animated pond, drifting clouds, birds,
 * butterflies, fireflies at night, a flickering campfire near completion, and
 * a spring pop-in for the newest element.
 *
 * Determinism: all placement/variation is seeded from (worldIndex, element
 * index), so the same state renders the same world on every device.
 */
import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Float } from '@react-three/drei';
import * as THREE from 'three';
import { biomeFor, type MundoState } from '@/lib/mundo';

// ── Deterministic helpers ───────────────────────────────────────────────────

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic HSL jitter around a base color. */
function vary(base: string, rng: () => number, dh = 0.02, ds = 0.08, dl = 0.08): THREE.Color {
  const c = new THREE.Color(base);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  c.setHSL(
    (hsl.h + (rng() - 0.5) * dh + 1) % 1,
    THREE.MathUtils.clamp(hsl.s + (rng() - 0.5) * ds, 0, 1),
    THREE.MathUtils.clamp(hsl.l + (rng() - 0.5) * dl, 0, 1),
  );
  return c;
}

/** Icosahedron with jittered vertices → organic blob. Cached per key. */
const blobCache = new Map<string, THREE.BufferGeometry>();
function blobGeometry(radius: number, detail: number, jitter: number, seed: number): THREE.BufferGeometry {
  const key = `${radius}:${detail}:${jitter}:${seed}`;
  const hit = blobCache.get(key);
  if (hit) return hit;
  const geo = new THREE.IcosahedronGeometry(radius, detail);
  const rng = mulberry32(seed);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const m = 1 + (rng() - 0.5) * 2 * jitter;
    pos.setXYZ(i, v.x * m, v.y * m, v.z * m);
  }
  geo.computeVertexNormals();
  blobCache.set(key, geo);
  return geo;
}

/** Gentle whole-group sway (trees, flowers) — cheap and organic. */
function SwayGroup({
  children,
  phase = 0,
  amp = 0.02,
  speed = 1.1,
  ...props
}: React.ComponentProps<'group'> & { phase?: number; amp?: number; speed?: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime * speed + phase;
    ref.current.rotation.z = Math.sin(t) * amp;
    ref.current.rotation.x = Math.cos(t * 0.7) * amp * 0.6;
  });
  return (
    <group ref={ref} {...props}>
      {children}
    </group>
  );
}

/** Spring pop-in: scale 0 → overshoot → settle. Used for the newest element. */
function PopIn({ active, children }: { active: boolean; children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  const start = useRef<number | null>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    if (!active) {
      ref.current.scale.setScalar(1);
      return;
    }
    if (start.current === null) start.current = clock.elapsedTime;
    const t = clock.elapsedTime - start.current;
    // Damped spring: fast rise, one bounce, settle at 1.
    const s = t >= 1.2 ? 1 : Math.max(0.0001, 1 - Math.exp(-6 * t) * Math.cos(9 * t));
    ref.current.scale.setScalar(s);
  });
  return <group ref={ref}>{children}</group>;
}

// ── Terrain ─────────────────────────────────────────────────────────────────

function Island({ ground, night }: { ground: string; night: boolean }) {
  const topGeo = useMemo(() => {
    const geo = new THREE.CylinderGeometry(2.42, 2.52, 0.34, 48, 1);
    const rng = mulberry32(42);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const r = Math.hypot(v.x, v.z);
      if (r > 2.2) {
        const m = 1 + (rng() - 0.5) * 0.07;
        pos.setX(i, v.x * m);
        pos.setZ(i, v.z * m);
        if (v.y > 0) pos.setY(i, v.y + (rng() - 0.5) * 0.05);
      }
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  const soilGeo = useMemo(() => blobGeometry(1, 1, 0.18, 7), []);

  return (
    <group>
      <mesh receiveShadow geometry={topGeo} position={[0, -0.17, 0]}>
        <meshStandardMaterial color={ground} flatShading roughness={0.95} />
      </mesh>
      {/* Soil mass below, tapering — classic floating island silhouette. */}
      <mesh geometry={soilGeo} position={[0, -0.95, 0]} scale={[2.35, 1.05, 2.35]}>
        <meshStandardMaterial color="#6e4f33" flatShading roughness={1} />
      </mesh>
      <mesh geometry={soilGeo} position={[0.2, -1.75, -0.1]} scale={[1.15, 0.75, 1.15]}>
        <meshStandardMaterial color="#5d4229" flatShading roughness={1} />
      </mesh>
      {/* Drifting root-rocks under the island. */}
      {[0, 1, 2].map((i) => (
        <FloatingRock key={i} index={i} night={night} />
      ))}
    </group>
  );
}

function FloatingRock({ index, night }: { index: number; night: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  const rng = useMemo(() => mulberry32(900 + index), [index]);
  const base = useMemo(
    () => ({
      x: (rng() - 0.5) * 3.4,
      y: -2 - rng() * 0.9,
      z: (rng() - 0.5) * 3.4,
      s: 0.12 + rng() * 0.16,
      p: rng() * 6,
    }),
    [rng],
  );
  const geo = useMemo(() => blobGeometry(1, 0, 0.3, 300 + index), [index]);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.y = base.y + Math.sin(clock.elapsedTime * 0.6 + base.p) * 0.08;
  });
  return (
    <mesh ref={ref} geometry={geo} position={[base.x, base.y, base.z]} scale={base.s}>
      <meshStandardMaterial color={night ? '#4a4038' : '#6e5b46'} flatShading roughness={1} />
    </mesh>
  );
}

// ── Wind-shader grass (single InstancedMesh) ────────────────────────────────

function Grass({ count, color, liveliness }: { count: number; color: string; liveliness: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const shaderRef = useRef<{ uniforms: { uTime: { value: number } } } | null>(null);

  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.9 });
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = { value: 0 };
      shader.vertexShader = `uniform float uTime;\n${shader.vertexShader}`.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        {
          float hf = smoothstep(-0.15, 0.18, position.y);
          vec3 ipos = vec3(0.0);
          #ifdef USE_INSTANCING
            ipos = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
          #endif
          float sway = sin(uTime * 1.7 + ipos.x * 1.9 + ipos.z * 1.4) * 0.6
                     + sin(uTime * 2.9 + ipos.z * 2.6 + ipos.x * 0.8) * 0.4;
          transformed.x += sway * 0.045 * hf * hf;
          transformed.z += sway * 0.028 * hf * hf;
        }`,
      );
      shaderRef.current = shader as never;
    };
    return mat;
  }, []);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const rng = mulberry32(1234);
    const dummy = new THREE.Object3D();
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const a = rng() * Math.PI * 2;
      const r = Math.sqrt(rng()) * 2.15;
      const h = 0.16 + rng() * 0.18;
      dummy.position.set(Math.cos(a) * r, h / 2 - 0.01, Math.sin(a) * r);
      dummy.scale.set(0.6 + rng() * 0.6, h / 0.3, 0.6 + rng() * 0.6);
      dummy.rotation.y = rng() * Math.PI;
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      c.copy(vary(color, rng, 0.03, 0.12, 0.12));
      mesh.setColorAt(i, c);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [count, color]);

  useFrame(({ clock }) => {
    if (shaderRef.current) shaderRef.current.uniforms.uTime.value = clock.elapsedTime * (0.6 + liveliness * 0.7);
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} material={material} frustumCulled={false}>
      <coneGeometry args={[0.035, 0.3, 4]} />
    </instancedMesh>
  );
}

// ── Flora & set dressing ────────────────────────────────────────────────────

function Trunk({ h, lean, seed }: { h: number; lean: number; seed: number }) {
  const rng = useMemo(() => mulberry32(seed), [seed]);
  const bend = useMemo(() => (rng() - 0.5) * lean, [rng, lean]);
  return (
    <group rotation={[0, 0, bend]}>
      <mesh castShadow position={[0, h / 2, 0]}>
        <cylinderGeometry args={[0.05 + h * 0.05, 0.08 + h * 0.08, h, 7]} />
        <meshStandardMaterial color="#7c5a3a" flatShading roughness={1} />
      </mesh>
    </group>
  );
}

function Tree({
  position,
  scale = 1,
  leaf,
  leafDeep,
  seed,
  snow,
}: {
  position: [number, number, number];
  scale?: number;
  leaf: string;
  leafDeep: string;
  seed: number;
  snow?: boolean;
}) {
  const rng = useMemo(() => mulberry32(seed), [seed]);
  const blobs = useMemo(() => {
    const n = 3 + Math.floor(rng() * 3);
    return Array.from({ length: n }).map((_, i) => ({
      x: (rng() - 0.5) * 0.5,
      y: 0.82 + rng() * 0.45,
      z: (rng() - 0.5) * 0.5,
      r: 0.26 + rng() * 0.26,
      deep: rng() > 0.55,
      geoSeed: seed * 7 + i,
    }));
  }, [rng, seed]);

  return (
    <SwayGroup position={position} scale={scale} phase={seed % 7} amp={0.018} speed={0.9}>
      <Trunk h={0.75} lean={0.25} seed={seed} />
      {blobs.map((b, i) => (
        <mesh key={i} castShadow geometry={blobGeometry(b.r, 1, 0.22, b.geoSeed)} position={[b.x, b.y, b.z]}>
          <meshStandardMaterial color={vary(b.deep ? leafDeep : leaf, mulberry32(b.geoSeed))} flatShading roughness={0.85} />
        </mesh>
      ))}
      {snow && (
        <mesh geometry={blobGeometry(0.3, 1, 0.25, seed + 999)} position={[0, 1.32, 0]} scale={[1, 0.45, 1]}>
          <meshStandardMaterial color="#f2f6f8" flatShading roughness={0.7} />
        </mesh>
      )}
    </SwayGroup>
  );
}

function Sapling({ position, leaf, seed }: { position: [number, number, number]; leaf: string; seed: number }) {
  return (
    <SwayGroup position={position} phase={seed % 5} amp={0.05} speed={1.4}>
      <Trunk h={0.3} lean={0.35} seed={seed} />
      <mesh castShadow geometry={blobGeometry(0.14, 1, 0.25, seed + 3)} position={[0, 0.4, 0]}>
        <meshStandardMaterial color={vary(leaf, mulberry32(seed))} flatShading />
      </mesh>
    </SwayGroup>
  );
}

function Bush({ position, leafDeep, seed }: { position: [number, number, number]; leafDeep: string; seed: number }) {
  const rng = useMemo(() => mulberry32(seed), [seed]);
  return (
    <group position={position}>
      <mesh castShadow geometry={blobGeometry(0.24, 1, 0.24, seed)} position={[0, 0.16, 0]}>
        <meshStandardMaterial color={vary(leafDeep, rng)} flatShading roughness={0.9} />
      </mesh>
      <mesh castShadow geometry={blobGeometry(0.16, 1, 0.24, seed + 11)} position={[0.16, 0.1, 0.08]}>
        <meshStandardMaterial color={vary(leafDeep, rng)} flatShading roughness={0.9} />
      </mesh>
    </group>
  );
}

function Flower({ position, accent, seed }: { position: [number, number, number]; accent: string; seed: number }) {
  const rng = useMemo(() => mulberry32(seed), [seed]);
  const color = useMemo(() => vary(accent, rng, 0.08, 0.15, 0.12), [accent, rng]);
  const h = useMemo(() => 0.2 + rng() * 0.14, [rng]);
  const petals = useMemo(
    () =>
      Array.from({ length: 5 }).map((_, i) => {
        const a = (i / 5) * Math.PI * 2;
        return { x: Math.cos(a) * 0.055, z: Math.sin(a) * 0.055, a };
      }),
    [],
  );
  return (
    <SwayGroup position={position} phase={seed % 9} amp={0.06} speed={1.6}>
      <mesh position={[0, h / 2, 0]}>
        <cylinderGeometry args={[0.013, 0.016, h, 4]} />
        <meshStandardMaterial color="#2f7d4f" />
      </mesh>
      <group position={[0, h + 0.02, 0]}>
        {petals.map((p, i) => (
          <mesh key={i} position={[p.x, 0, p.z]} rotation={[0, -p.a, 0]} scale={[1, 0.4, 0.62]}>
            <sphereGeometry args={[0.05, 8, 6]} />
            <meshStandardMaterial color={color} roughness={0.6} />
          </mesh>
        ))}
        <mesh>
          <sphereGeometry args={[0.032, 8, 8]} />
          <meshStandardMaterial color="#FFD87A" roughness={0.5} />
        </mesh>
      </group>
    </SwayGroup>
  );
}

function Rock({ position, seed, snow }: { position: [number, number, number]; seed: number; snow?: boolean }) {
  const rng = useMemo(() => mulberry32(seed), [seed]);
  const s = useMemo(() => 0.12 + rng() * 0.14, [rng]);
  return (
    <group position={position}>
      <mesh castShadow geometry={blobGeometry(1, 0, 0.32, seed)} position={[0, s * 0.55, 0]} scale={s}>
        <meshStandardMaterial color={vary('#8a8177', rng, 0.02, 0.05, 0.12)} flatShading roughness={1} />
      </mesh>
      {snow && (
        <mesh geometry={blobGeometry(1, 0, 0.3, seed + 5)} position={[0, s * 0.95, 0]} scale={[s * 0.8, s * 0.3, s * 0.8]}>
          <meshStandardMaterial color="#eef4f6" flatShading />
        </mesh>
      )}
    </group>
  );
}

function Palm({ position, leaf, seed }: { position: [number, number, number]; leaf: string; seed: number }) {
  const fronds = useMemo(
    () =>
      Array.from({ length: 6 }).map((_, i) => {
        const a = (i / 6) * Math.PI * 2;
        return { a };
      }),
    [],
  );
  return (
    <SwayGroup position={position} phase={seed % 6} amp={0.03} speed={0.8}>
      <mesh castShadow position={[0.04, 0.55, 0]} rotation={[0, 0, -0.12]}>
        <cylinderGeometry args={[0.05, 0.09, 1.1, 6]} />
        <meshStandardMaterial color="#8a6a44" flatShading roughness={1} />
      </mesh>
      <group position={[0.1, 1.12, 0]}>
        {fronds.map((f, i) => (
          <mesh key={i} rotation={[0.55, f.a, 0]} position={[Math.cos(f.a) * 0.12, 0, Math.sin(f.a) * 0.12]}>
            <coneGeometry args={[0.09, 0.72, 4]} />
            <meshStandardMaterial color={vary(leaf, mulberry32(seed + i))} flatShading />
          </mesh>
        ))}
      </group>
    </SwayGroup>
  );
}

function Dune({ position, ground, seed }: { position: [number, number, number]; ground: string; seed: number }) {
  const rng = useMemo(() => mulberry32(seed), [seed]);
  return (
    <mesh receiveShadow geometry={blobGeometry(1, 1, 0.12, seed)} position={position} scale={[0.5 + rng() * 0.3, 0.14, 0.4 + rng() * 0.25]}>
      <meshStandardMaterial color={vary(ground, rng, 0.01, 0.05, 0.08)} flatShading roughness={1} />
    </mesh>
  );
}

// ── Water ───────────────────────────────────────────────────────────────────

function Pond({ color }: { color: string }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uColor: { value: new THREE.Color(color) } }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  useEffect(() => {
    uniforms.uColor.value.set(color);
  }, [color, uniforms]);
  useFrame(({ clock }) => {
    const u = matRef.current?.uniforms.uTime;
    if (u) u.value = clock.elapsedTime;
  });
  return (
    <group position={[1.18, 0.015, -0.92]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.66, 32]} />
        <shaderMaterial
          ref={matRef}
          transparent
          uniforms={uniforms}
          vertexShader={`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`}
          fragmentShader={`
            uniform float uTime; uniform vec3 uColor; varying vec2 vUv;
            void main(){
              float d = distance(vUv, vec2(0.5));
              float rip = sin(d * 42.0 - uTime * 2.4) * 0.5 + 0.5;
              float rip2 = sin(d * 23.0 - uTime * 1.3 + 1.7) * 0.5 + 0.5;
              vec3 col = mix(uColor * 1.35, uColor * 0.8, clamp(rip * 0.45 + rip2 * 0.3 + d * 0.6, 0.0, 1.0));
              float edge = smoothstep(0.5, 0.34, d);
              gl_FragColor = vec4(col, edge * 0.92);
            }`}
        />
      </mesh>
      {/* Lily pads */}
      {[0, 1].map((i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, i * 2.1]} position={[i === 0 ? 0.22 : -0.25, 0.005, i === 0 ? -0.1 : 0.18]}>
          <circleGeometry args={[0.07, 8]} />
          <meshStandardMaterial color="#3f9e63" roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

// ── Fauna & atmosphere ──────────────────────────────────────────────────────

function Bird({ seed }: { seed: number }) {
  const ref = useRef<THREE.Group>(null);
  const wingL = useRef<THREE.Mesh>(null);
  const wingR = useRef<THREE.Mesh>(null);
  const rng = useMemo(() => mulberry32(seed), [seed]);
  const p = useMemo(() => ({ r: 1.5 + rng() * 0.5, h: 1.55 + rng() * 0.4, sp: 0.35 + rng() * 0.2, ph: rng() * 6 }), [rng]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * p.sp + p.ph;
    if (ref.current) {
      ref.current.position.set(Math.cos(t) * p.r, p.h + Math.sin(t * 2.3) * 0.12, Math.sin(t) * p.r);
      ref.current.rotation.y = -t + Math.PI / 2;
    }
    const flap = Math.sin(clock.elapsedTime * 9 + p.ph) * 0.7;
    if (wingL.current) wingL.current.rotation.z = flap;
    if (wingR.current) wingR.current.rotation.z = -flap;
  });
  return (
    <group ref={ref}>
      <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.045, 0.14, 3, 6]} />
        <meshStandardMaterial color="#FF8A3D" flatShading />
      </mesh>
      <mesh position={[0.13, 0.02, 0]}>
        <coneGeometry args={[0.03, 0.08, 4]} />
        <meshStandardMaterial color="#FFD27A" flatShading />
      </mesh>
      <mesh ref={wingL} position={[0, 0.02, 0.06]}>
        <boxGeometry args={[0.1, 0.012, 0.14]} />
        <meshStandardMaterial color="#e2712a" flatShading />
      </mesh>
      <mesh ref={wingR} position={[0, 0.02, -0.06]}>
        <boxGeometry args={[0.1, 0.012, 0.14]} />
        <meshStandardMaterial color="#e2712a" flatShading />
      </mesh>
    </group>
  );
}

function Butterfly({ seed, accent }: { seed: number; accent: string }) {
  const ref = useRef<THREE.Group>(null);
  const wL = useRef<THREE.Mesh>(null);
  const wR = useRef<THREE.Mesh>(null);
  const rng = useMemo(() => mulberry32(seed), [seed]);
  const base = useMemo(() => ({ x: (rng() - 0.5) * 3, z: (rng() - 0.5) * 3, p: rng() * 6 }), [rng]);
  const color = useMemo(() => vary(accent, rng, 0.1, 0.1, 0.1), [accent, rng]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime + base.p;
    if (ref.current) {
      ref.current.position.set(base.x + Math.cos(t * 0.8) * 0.45, 0.55 + Math.sin(t * 1.4) * 0.22, base.z + Math.sin(t * 0.8) * 0.45);
      ref.current.rotation.y = -t * 0.8;
    }
    const flap = Math.abs(Math.sin(clock.elapsedTime * 11 + base.p)) * 1.1;
    if (wL.current) wL.current.rotation.x = flap;
    if (wR.current) wR.current.rotation.x = -flap;
  });
  return (
    <group ref={ref} scale={0.8}>
      <mesh ref={wL} position={[0, 0, 0.045]}>
        <planeGeometry args={[0.09, 0.11]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={wR} position={[0, 0, -0.045]}>
        <planeGeometry args={[0.09, 0.11]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function Fireflies({ count = 10 }: { count?: number }) {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const seeds = useMemo(() => Array.from({ length: count }).map((_, i) => mulberry32(500 + i)()), [count]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    refs.current.forEach((m, i) => {
      if (!m) return;
      const s = seeds[i]! * 6.28;
      m.position.set(
        Math.cos(t * 0.3 + s * 3) * (1 + seeds[i]! * 1.3),
        0.5 + Math.sin(t * 0.7 + s) * 0.35 + seeds[i]! * 0.5,
        Math.sin(t * 0.4 + s * 2) * (1 + seeds[i]! * 1.3),
      );
      const pulse = 0.5 + (Math.sin(t * 2.4 + s * 7) * 0.5 + 0.5) * 0.9;
      m.scale.setScalar(pulse * 0.028);
    });
  });
  return (
    <group>
      {Array.from({ length: count }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
        >
          <sphereGeometry args={[1, 6, 6]} />
          <meshBasicMaterial color="#FFE9A0" toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function Clouds({ night }: { night: boolean }) {
  const groups = useRef<(THREE.Group | null)[]>([]);
  const defs = useMemo(
    () =>
      [0, 1, 2].map((i) => {
        const rng = mulberry32(60 + i);
        return { y: 2.3 + rng() * 0.8, z: (rng() - 0.5) * 3, sp: 0.05 + rng() * 0.05, off: rng() * 8, s: 0.7 + rng() * 0.5 };
      }),
    [],
  );
  useFrame(({ clock }) => {
    defs.forEach((d, i) => {
      const g = groups.current[i];
      if (!g) return;
      g.position.x = ((clock.elapsedTime * d.sp + d.off) % 9) - 4.5;
    });
  });
  return (
    <group>
      {defs.map((d, i) => (
        <group
          key={i}
          ref={(el) => {
            groups.current[i] = el;
          }}
          position={[0, d.y, d.z]}
          scale={d.s}
        >
          {[0, 1, 2].map((j) => (
            <mesh key={j} position={[j * 0.32 - 0.32, j === 1 ? 0.1 : 0, 0]}>
              <sphereGeometry args={[j === 1 ? 0.3 : 0.22, 10, 10]} />
              <meshStandardMaterial color="#ffffff" transparent opacity={night ? 0.12 : 0.5} roughness={1} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

/** Campfire — appears when the world is ≥60% grown. Flickering flame + light. */
function Campfire({ position }: { position: [number, number, number] }) {
  const flame1 = useRef<THREE.Mesh>(null);
  const flame2 = useRef<THREE.Mesh>(null);
  const flame3 = useRef<THREE.Mesh>(null);
  const light = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const n = Math.sin(t * 9.3) * 0.5 + Math.sin(t * 14.7 + 1.3) * 0.3 + Math.sin(t * 23.1 + 2.1) * 0.2;
    if (flame1.current) {
      flame1.current.scale.set(1 + n * 0.12, 1 + n * 0.3, 1 + n * 0.12);
      flame1.current.rotation.y = t * 1.5;
    }
    if (flame2.current) {
      flame2.current.scale.setScalar(1 + n * 0.2);
      flame2.current.position.y = 0.16 + n * 0.02;
      flame2.current.rotation.y = -t * 2.1;
    }
    if (flame3.current) {
      flame3.current.scale.setScalar(1 + n * 0.28);
      flame3.current.position.y = 0.2 + n * 0.03;
    }
    if (light.current) light.current.intensity = 0.9 + n * 0.5;
  });
  return (
    <group position={position}>
      {/* Logs */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} castShadow position={[0, 0.045, 0]} rotation={[0.35, (i / 3) * Math.PI * 2, Math.PI / 2.4]}>
          <cylinderGeometry args={[0.03, 0.035, 0.3, 5]} />
          <meshStandardMaterial color="#5d4229" flatShading roughness={1} />
        </mesh>
      ))}
      {/* Stylized layered flame */}
      <mesh ref={flame1} geometry={blobGeometry(0.11, 1, 0.2, 71)} position={[0, 0.14, 0]} scale={[1, 1.5, 1]}>
        <meshBasicMaterial color="#ff7a2f" toneMapped={false} transparent opacity={0.95} />
      </mesh>
      <mesh ref={flame2} geometry={blobGeometry(0.07, 1, 0.2, 72)} position={[0, 0.16, 0]} scale={[1, 1.6, 1]}>
        <meshBasicMaterial color="#ffb23e" toneMapped={false} transparent opacity={0.95} />
      </mesh>
      <mesh ref={flame3} geometry={blobGeometry(0.035, 1, 0.2, 73)} position={[0, 0.2, 0]} scale={[1, 1.7, 1]}>
        <meshBasicMaterial color="#fff3c9" toneMapped={false} />
      </mesh>
      <pointLight ref={light} position={[0, 0.35, 0]} color="#ff9a45" intensity={0.9} distance={2.6} decay={2} />
    </group>
  );
}

// ── Pip ─────────────────────────────────────────────────────────────────────

function Pip3D({ golden, aura }: { golden: boolean; aura: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const eyes = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (ref.current) {
      ref.current.position.y = 0.45 + Math.sin(t * 1.5) * 0.05;
      // Subtle squash & stretch with the bob.
      const squash = 1 + Math.sin(t * 1.5 + Math.PI / 2) * 0.03;
      ref.current.scale.set(1 / squash, squash, 1 / squash);
    }
    // Blink every ~3.7s.
    if (eyes.current) {
      const blink = (t % 3.7) > 3.55 ? 0.12 : 1;
      eyes.current.scale.y = blink;
    }
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
      <mesh position={[0.12, 0.34, 0]} rotation={[0, 0, -0.6]}>
        <coneGeometry args={[0.12, 0.3, 5]} />
        <meshStandardMaterial color={golden ? '#FFB23E' : '#1FB57A'} flatShading />
      </mesh>
      <group ref={eyes}>
        <mesh position={[-0.1, 0.05, 0.28]}>
          <sphereGeometry args={[0.045, 12, 12]} />
          <meshStandardMaterial color="#0C1A13" />
        </mesh>
        <mesh position={[0.1, 0.05, 0.28]}>
          <sphereGeometry args={[0.045, 12, 12]} />
          <meshStandardMaterial color="#0C1A13" />
        </mesh>
      </group>
    </group>
  );
}

// ── Growth: one element per completion, golden-angle spiral ─────────────────

type GrowthKind = 'flower' | 'bush' | 'rock' | 'sapling' | 'tree';

interface GrowthItem {
  kind: GrowthKind;
  x: number;
  z: number;
  seed: number;
  index: number;
}

const GOLDEN_ANGLE = 2.399963;
const MAX_RENDERED = 120;

function growthItems(worldIndex: number, growth: number, goal: number, hasPond: boolean): GrowthItem[] {
  const items: GrowthItem[] = [];
  const rendered = Math.min(growth, MAX_RENDERED);
  const step = growth > MAX_RENDERED ? growth / MAX_RENDERED : 1;
  for (let k = 0; k < rendered; k++) {
    const i = Math.floor(k * step);
    const rng = mulberry32(worldIndex * 100003 + i * 97 + 13);
    let angle = i * GOLDEN_ANGLE + rng() * 0.3;
    // The world fills from the center out as it approaches completion.
    const radius = 0.62 + 1.5 * Math.sqrt((i + 0.5) / goal);
    let x = Math.cos(angle) * radius;
    let z = Math.sin(angle) * radius;
    // Keep the pond clear.
    if (hasPond && Math.hypot(x - 1.18, z + 0.92) < 0.85) {
      angle += 1.1;
      x = Math.cos(angle) * radius;
      z = Math.sin(angle) * radius;
    }
    const roll = rng();
    const kind: GrowthKind =
      i > 0 && i % 12 === 0
        ? 'tree'
        : roll < 0.42
          ? 'flower'
          : roll < 0.62
            ? 'bush'
            : roll < 0.72
              ? 'rock'
              : roll < 0.9
                ? 'sapling'
                : 'tree';
    items.push({ kind, x, z, seed: worldIndex * 7919 + i * 31, index: i });
  }
  return items;
}

// ── Scene ───────────────────────────────────────────────────────────────────

function Scene({ mundo, night, dayT }: { mundo: MundoState; night: boolean; dayT: number }) {
  const biome = biomeFor(mundo.worldIndex ?? 1);
  const golden = mundo.palette === 'golden';

  // Golden (Gaia) tints the biome toward gold without losing its identity.
  const tint = (hex: string) => (golden ? `#${new THREE.Color(hex).lerp(new THREE.Color('#E8B54A'), 0.45).getHexString()}` : hex);
  const ground = tint(biome.ground);
  const grass = tint(biome.grass);
  const leaf = tint(biome.leaf);
  const leafDeep = tint(biome.leafDeep);
  const accent = tint(biome.accent);

  const growth = mundo.worldGrowth ?? 0;
  const goal = mundo.worldGoal ?? 40;
  const pct = goal > 0 ? growth / goal : 0;
  const showPond = biome.features.pond;

  const items = useMemo(
    () => growthItems(mundo.worldIndex ?? 1, growth, goal, showPond),
    [mundo.worldIndex, growth, goal, showPond],
  );

  // Pop-in only for an element that appeared during this session.
  const initialGrowth = useRef(growth);
  const newestIndex = growth > initialGrowth.current ? growth - 1 : -1;

  const grassCount = Math.round(90 + mundo.liveliness * 150);
  const flowersPlaced = items.filter((it) => it.kind === 'flower').length;

  const sunAngle = dayT * Math.PI * 2;
  const sunPos: [number, number, number] = [Math.cos(sunAngle) * 5, Math.max(1.8, Math.sin(sunAngle) * 5 + 2), 3];

  return (
    <>
      <ambientLight intensity={night ? 0.4 : 0.65} color={night ? '#9fb0d6' : '#ffffff'} />
      <directionalLight
        castShadow
        position={sunPos}
        intensity={night ? 0.22 : 1.25}
        color={night ? '#aebfe0' : '#fff2d0'}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={1}
        shadow-camera-far={12}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
      />
      <hemisphereLight intensity={night ? 0.25 : 0.45} color={night ? '#2a3a5a' : biome.skyTop} groundColor={ground} />

      <Island ground={ground} night={night} />
      <Grass count={grassCount} color={grass} liveliness={mundo.liveliness} />

      <Float speed={2} rotationIntensity={0} floatIntensity={0.2}>
        <Pip3D golden={golden} aura={mundo.unlockedCosmetics.includes('guardian_aura')} />
      </Float>

      {/* Biome set dressing */}
      {showPond && <Pond color={tint(biome.water)} />}
      {biome.features.palms && (
        <>
          <Palm position={[-1.55, 0, 0.95]} leaf={leaf} seed={21} />
          <Palm position={[1.75, 0, 0.55]} leaf={leaf} seed={22} />
        </>
      )}
      {biome.features.dunes && (
        <>
          <Dune position={[-1.2, 0.02, -1.2]} ground={ground} seed={31} />
          <Dune position={[0.6, 0.02, 1.55]} ground={ground} seed={32} />
        </>
      )}

      {/* Mundo Infinito: one element per completion */}
      {items.map((it) => {
        const pos: [number, number, number] = [it.x, 0, it.z];
        const el =
          it.kind === 'flower' ? (
            <Flower position={pos} accent={accent} seed={it.seed} />
          ) : it.kind === 'bush' ? (
            <Bush position={pos} leafDeep={leafDeep} seed={it.seed} />
          ) : it.kind === 'rock' ? (
            <Rock position={pos} seed={it.seed} snow={biome.features.snow} />
          ) : it.kind === 'sapling' ? (
            <Sapling position={pos} leaf={leaf} seed={it.seed} />
          ) : (
            <Tree position={pos} scale={0.78 + (it.seed % 5) * 0.07} leaf={leaf} leafDeep={leafDeep} seed={it.seed} snow={biome.features.snow} />
          );
        return (
          <PopIn key={`${mundo.worldIndex}-${it.index}`} active={it.index === newestIndex}>
            {el}
          </PopIn>
        );
      })}

      {/* Campfire milestone at 60% */}
      {pct >= 0.6 && <Campfire position={[-0.95, 0, -0.75]} />}

      {/* Fauna & atmosphere */}
      <Clouds night={night} />
      {(mundo.worldIndex ?? 1) >= 2 && <Bird seed={11} />}
      {(mundo.worldIndex ?? 1) >= 4 && <Bird seed={12} />}
      {flowersPlaced >= 5 &&
        !night &&
        [0, 1, 2].map((i) => <Butterfly key={i} seed={i + 7} accent={accent} />)}
      {night && <Fireflies count={10} />}

      <ContactShadows position={[0, 0.005, 0]} opacity={0.32} scale={7} blur={2.6} far={3} />
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        autoRotate
        autoRotateSpeed={0.55}
        minPolarAngle={Math.PI * 0.26}
        maxPolarAngle={Math.PI * 0.47}
        target={[0, 0.35, 0]}
      />
    </>
  );
}

export default function MundoCanvas({ mundo, night, dayT }: { mundo: MundoState; night: boolean; dayT: number }) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 2.7, 6.1], fov: 35 }}
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
    >
      <Scene mundo={mundo} night={night} dayT={dayT} />
    </Canvas>
  );
}
