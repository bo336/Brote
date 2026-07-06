'use client';

/**
 * "Tu Mundo" v3 — professional-game-grade procedural world (PLAN §F8).
 *
 * Everything is generated at runtime — zero downloaded assets:
 *  - Procedural TEXTURES (canvas-painted grass field, bark, foliage, rock,
 *    soft sprites) used as color+bump maps and tinted per biome.
 *  - ATMOSPHERE: sky-dome shader with sun glow, scene fog, sun/moon sprite.
 *  - TERRAIN: sculpted island cap with radial lush→dirt blend, mounds,
 *    displaced rocky MOUNTAINS with snow caps, blob shadows everywhere.
 *  - WATER: fresnel-ish rippling pond, a RIVER feeding a WATERFALL over the
 *    island edge with foam + drifting mist.
 *  - FLORA: instanced curved-blade grass with a gusting wind shader, trees
 *    with curved textured trunks and fluttering canopies.
 *  - LIFE: birds, butterflies, fireflies, campfire, and a KAYAK gliding on
 *    the pond from world 3.
 *  - INTERACTION: tap anywhere → sparkle burst; watering rain animation for
 *    the "Regá tu mundo" daily action; pinch/scroll zoom enabled.
 *
 * Determinism: placement/variation seeded from (worldIndex, element index) —
 * the same state renders the same world on every device.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Float } from '@react-three/drei';
import { EffectComposer, N8AO, Bloom } from '@react-three/postprocessing';
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

// ── Procedural textures (canvas-painted, grayscale → tinted by material) ────

const texCache = new Map<string, THREE.CanvasTexture>();
function makeTexture(
  key: string,
  size: number,
  paint: (ctx: CanvasRenderingContext2D, s: number, rng: () => number) => void,
  repeat: [number, number] = [1, 1],
): THREE.CanvasTexture {
  const hit = texCache.get(key);
  if (hit) return hit;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  paint(ctx, size, mulberry32(1337));
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat[0], repeat[1]);
  tex.anisotropy = 4;
  texCache.set(key, tex);
  return tex;
}

/** Speckled organic noise — base of most surfaces. */
function speckle(ctx: CanvasRenderingContext2D, s: number, rng: () => number, base: number, spread: number, dots: number, dotSize: number) {
  ctx.fillStyle = `rgb(${base},${base},${base})`;
  ctx.fillRect(0, 0, s, s);
  for (let i = 0; i < dots; i++) {
    const v = Math.round(base + (rng() - 0.5) * 2 * spread);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.beginPath();
    ctx.arc(rng() * s, rng() * s, dotSize * (0.5 + rng()), 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Island cap: lush center → worn dirt edge, with grass strokes. */
function grassFieldTexture(): THREE.CanvasTexture {
  return makeTexture('grassField', 512, (ctx, s, rng) => {
    speckle(ctx, s, rng, 215, 26, 2600, 2.2);
    // Short directional strokes = mowed-meadow feel.
    for (let i = 0; i < 1500; i++) {
      const v = Math.round(205 + (rng() - 0.5) * 60);
      ctx.strokeStyle = `rgba(${v},${v},${v},0.5)`;
      ctx.lineWidth = 1;
      const x = rng() * s;
      const y = rng() * s;
      const a = rng() * Math.PI;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a) * 5, y + Math.sin(a) * 5);
      ctx.stroke();
    }
    // Radial dirt ring toward the rim (texture is used on a polar-UV cap).
    const g = ctx.createRadialGradient(s / 2, s / 2, s * 0.3, s / 2, s / 2, s * 0.5);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(0.82, 'rgba(120,96,64,0.28)');
    g.addColorStop(1, 'rgba(105,82,52,0.55)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
  });
}

function barkTexture(): THREE.CanvasTexture {
  return makeTexture('bark', 256, (ctx, s, rng) => {
    speckle(ctx, s, rng, 190, 22, 500, 2);
    for (let i = 0; i < 46; i++) {
      const v = Math.round(150 + rng() * 70);
      ctx.strokeStyle = `rgba(${v},${v},${v},0.75)`;
      ctx.lineWidth = 1 + rng() * 2.4;
      const x = rng() * s;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.bezierCurveTo(x + (rng() - 0.5) * 16, s * 0.33, x + (rng() - 0.5) * 16, s * 0.66, x + (rng() - 0.5) * 10, s);
      ctx.stroke();
    }
  }, [1.5, 1]);
}

function foliageTexture(): THREE.CanvasTexture {
  return makeTexture('foliage', 256, (ctx, s, rng) => {
    speckle(ctx, s, rng, 205, 34, 2200, 3.2);
    // Leaf clumps: overlapping darker/lighter arcs.
    for (let i = 0; i < 260; i++) {
      const v = Math.round(200 + (rng() - 0.5) * 90);
      ctx.fillStyle = `rgba(${v},${v},${v},0.35)`;
      ctx.beginPath();
      ctx.ellipse(rng() * s, rng() * s, 3 + rng() * 6, 2 + rng() * 3, rng() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [2, 2]);
}

function rockTexture(): THREE.CanvasTexture {
  return makeTexture('rock', 256, (ctx, s, rng) => {
    speckle(ctx, s, rng, 200, 26, 1400, 2.6);
    for (let i = 0; i < 26; i++) {
      const v = Math.round(140 + rng() * 50);
      ctx.strokeStyle = `rgba(${v},${v},${v},0.6)`;
      ctx.lineWidth = 0.8 + rng() * 1.4;
      ctx.beginPath();
      let x = rng() * s;
      let y = rng() * s;
      ctx.moveTo(x, y);
      for (let j = 0; j < 5; j++) {
        x += (rng() - 0.5) * 60;
        y += (rng() - 0.5) * 60;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }, [1.4, 1.4]);
}

/**
 * Grass TUFT with alpha — 8 painted blades per quad. Instanced criss-cross
 * quads with this texture read as a continuous meadow instead of separate
 * blade blocks (the v4.5 "no more lego" fix).
 */
function grassTuftTexture(): THREE.CanvasTexture {
  return makeTexture('grassTuft', 128, (ctx, s, rng) => {
    ctx.clearRect(0, 0, s, s);
    ctx.lineCap = 'round';
    for (let i = 0; i < 9; i++) {
      const baseX = s * 0.5 + (rng() - 0.5) * s * 0.42;
      const tipX = baseX + (rng() - 0.5) * s * 0.5;
      const tipY = s * (0.04 + rng() * 0.3);
      const midX = (baseX + tipX) / 2 + (rng() - 0.5) * s * 0.16;
      const grad = ctx.createLinearGradient(0, s, 0, tipY);
      grad.addColorStop(0, 'rgba(105,115,95,0.95)');
      grad.addColorStop(0.6, 'rgba(190,200,170,0.95)');
      grad.addColorStop(1, 'rgba(235,240,215,0.9)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2.6 + rng() * 2.2;
      ctx.beginPath();
      ctx.moveTo(baseX, s);
      ctx.quadraticCurveTo(midX, s * 0.55, tipX, tipY);
      ctx.stroke();
    }
  });
}

/**
 * Foliage CARD (v5): an alpha texture of overlapping leaf clumps. Dozens of
 * these small quads per canopy replace smooth cones/blobs with the foam-like
 * miniature-diorama silhouette of the reference art.
 */
function foliageCardTexture(): THREE.CanvasTexture {
  return makeTexture('folCard', 128, (ctx, s, rng) => {
    ctx.clearRect(0, 0, s, s);
    for (let i = 0; i < 46; i++) {
      const cx = s * 0.5 + (rng() - 0.5) * s * 0.72;
      const cy = s * 0.5 + (rng() - 0.5) * s * 0.72;
      if (Math.hypot(cx - s / 2, cy - s / 2) > s * 0.44) continue;
      const v = Math.round(150 + rng() * 105);
      ctx.fillStyle = `rgba(${v},${v},${v},${0.75 + rng() * 0.25})`;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 5 + rng() * 9, 4 + rng() * 7, rng() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

/** Soft radial disc — sprites: shadows, mist, sun, clouds, sparkles. */
function softDiscTexture(): THREE.CanvasTexture {
  return makeTexture('soft', 128, (ctx, s) => {
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.55, 'rgba(255,255,255,0.45)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
  });
}

// ── Small shared components ─────────────────────────────────────────────────

/** Fake contact shadow under an element — grounds it instantly. */
function BlobShadow({ x = 0, z = 0, r = 0.3, opacity = 0.26 }: { x?: number; z?: number; r?: number; opacity?: number }) {
  const tex = useMemo(() => softDiscTexture(), []);
  return (
    <mesh position={[x, 0.012, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[r, 16]} />
      <meshBasicMaterial map={tex} color="#03140a" transparent opacity={opacity} depthWrite={false} />
    </mesh>
  );
}

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
    const s = t >= 1.2 ? 1 : Math.max(0.0001, 1 - Math.exp(-6 * t) * Math.cos(9 * t));
    ref.current.scale.setScalar(s);
  });
  return <group ref={ref}>{children}</group>;
}

// ── Atmosphere ──────────────────────────────────────────────────────────────

function SkyDome({ top, horizon, sunDir, night }: { top: string; horizon: string; sunDir: THREE.Vector3; night: boolean }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTop: { value: new THREE.Color(top) },
      uHorizon: { value: new THREE.Color(horizon) },
      uSunDir: { value: sunDir.clone() },
      uSunColor: { value: new THREE.Color(night ? '#b9c8ea' : '#fff2c4') },
      uSunAmt: { value: night ? 0.25 : 1 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  useEffect(() => {
    uniforms.uTop.value.set(top);
    uniforms.uHorizon.value.set(horizon);
    uniforms.uSunDir.value.copy(sunDir).normalize();
    uniforms.uSunColor.value.set(night ? '#b9c8ea' : '#fff2c4');
    uniforms.uSunAmt.value = night ? 0.25 : 1;
  }, [top, horizon, sunDir, night, uniforms]);
  return (
    <mesh scale={[1, 1, 1]}>
      <sphereGeometry args={[34, 24, 16]} />
      <shaderMaterial
        ref={matRef}
        side={THREE.BackSide}
        depthWrite={false}
        uniforms={uniforms}
        vertexShader={`varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`}
        fragmentShader={`
          uniform vec3 uTop; uniform vec3 uHorizon; uniform vec3 uSunDir; uniform vec3 uSunColor; uniform float uSunAmt;
          varying vec3 vDir;
          void main(){
            float h = clamp(vDir.y, 0.0, 1.0);
            vec3 col = mix(uHorizon, uTop, pow(h, 0.55));
            float sun = pow(max(dot(normalize(vDir), normalize(uSunDir)), 0.0), 42.0);
            float halo = pow(max(dot(normalize(vDir), normalize(uSunDir)), 0.0), 6.0);
            col += uSunColor * (sun * 0.9 + halo * 0.16) * uSunAmt;
            gl_FragColor = vec4(col, 1.0);
          }`}
      />
    </mesh>
  );
}

function CloudPuffs({ night }: { night: boolean }) {
  const tex = useMemo(() => softDiscTexture(), []);
  const groups = useRef<(THREE.Group | null)[]>([]);
  const defs = useMemo(
    () =>
      [0, 1, 2, 3].map((i) => {
        const rng = mulberry32(60 + i);
        return {
          y: 2.6 + rng() * 1.3,
          z: (rng() - 0.5) * 5,
          sp: 0.04 + rng() * 0.05,
          off: rng() * 10,
          s: 0.9 + rng() * 0.8,
          puffs: Array.from({ length: 4 }).map(() => ({ x: (rng() - 0.5) * 1.2, y: (rng() - 0.5) * 0.24, r: 0.35 + rng() * 0.35 })),
        };
      }),
    [],
  );
  useFrame(({ clock }) => {
    defs.forEach((d, i) => {
      const g = groups.current[i];
      if (g) g.position.x = ((clock.elapsedTime * d.sp + d.off) % 12) - 6;
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
          {d.puffs.map((p, j) => (
            <sprite key={j} position={[p.x, p.y, 0]} scale={[p.r * 2.4, p.r * 1.5, 1]}>
              <spriteMaterial map={tex} color="#ffffff" transparent opacity={night ? 0.1 : 0.5} depthWrite={false} />
            </sprite>
          ))}
        </group>
      ))}
    </group>
  );
}

function SunSprite({ pos, night }: { pos: [number, number, number]; night: boolean }) {
  const tex = useMemo(() => softDiscTexture(), []);
  return (
    <sprite position={pos} scale={night ? [1.1, 1.1, 1] : [2.4, 2.4, 1]}>
      <spriteMaterial map={tex} color={night ? '#e8eefb' : '#fff0b8'} transparent opacity={night ? 0.85 : 0.9} depthWrite={false} toneMapped={false} />
    </sprite>
  );
}

// ── Terrain ─────────────────────────────────────────────────────────────────

function Island({ ground, night, R }: { ground: string; night: boolean; R: number }) {
  const capTex = useMemo(() => grassFieldTexture(), []);
  const rockTex = useMemo(() => rockTexture(), []);
  const sideGeo = useMemo(() => {
    const geo = new THREE.CylinderGeometry(R + 0.02, R + 0.14, 0.4, 56, 1, true);
    const rng = mulberry32(42);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const m = 1 + (rng() - 0.5) * 0.06;
      pos.setX(i, v.x * m);
      pos.setZ(i, v.z * m);
    }
    geo.computeVertexNormals();
    return geo;
  }, [R]);
  // Ground with real RELIEF: gentle interior undulation, never a flat disc.
  const capGeo = useMemo(() => {
    const geo = new THREE.CircleGeometry(R + 0.04, 56, 0, Math.PI * 2);
    // CircleGeometry is flat in XY (rotated later); displace Z as "height".
    const g2 = new THREE.CircleGeometry(R + 0.04, 72);
    const pos = g2.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const d = Math.hypot(x, y);
      if (d < R - 0.35) {
        const h =
          Math.sin(x * 1.7 + 1.3) * Math.cos(y * 1.4 + 0.6) * 0.045 +
          Math.sin(x * 3.7) * Math.sin(y * 3.1) * 0.02;
        pos.setZ(i, h * Math.min(1, (R - 0.35 - d) * 2));
      }
    }
    g2.computeVertexNormals();
    geo.dispose();
    return g2;
  }, [R]);
  const soilGeo = useMemo(() => blobGeometry(1, 1, 0.18, 7), []);
  const soilS = R / 3.4;

  return (
    <group>
      {/* Grass cap with radial lush→dirt texture + relief. */}
      <mesh receiveShadow geometry={capGeo} position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <meshStandardMaterial map={capTex} bumpMap={capTex} bumpScale={0.035} color={ground} roughness={0.95} />
      </mesh>
      {/* Gentle interior mounds for relief. */}
      {[
        [-1.3, -0.5, 0.8],
        [1.0, 1.3, 0.65],
        [-0.3, 1.9, 0.55],
        [2.1, 0.4, 0.5],
      ].map(([x, z, r], i) => (
        <mesh key={i} receiveShadow geometry={blobGeometry(1, 1, 0.12, 90 + i)} position={[x!, -0.02, z!]} scale={[r!, r! * 0.22, r!]}>
          <meshStandardMaterial map={capTex} bumpMap={capTex} bumpScale={0.03} color={ground} roughness={0.95} />
        </mesh>
      ))}
      {/* Dirt side wall + soil mass below. */}
      <mesh geometry={sideGeo} position={[0, -0.19, 0]}>
        <meshStandardMaterial map={rockTex} bumpMap={rockTex} bumpScale={0.05} color="#7a5a39" roughness={1} />
      </mesh>
      <mesh geometry={soilGeo} position={[0, -1.3 * soilS, 0]} scale={[3.3 * soilS, 1.4 * soilS, 3.3 * soilS]}>
        <meshStandardMaterial map={rockTex} bumpMap={rockTex} bumpScale={0.06} color="#6e4f33" roughness={1} />
      </mesh>
      <mesh geometry={soilGeo} position={[0.3, -2.4 * soilS, -0.15]} scale={[1.6 * soilS, 1.0 * soilS, 1.6 * soilS]}>
        <meshStandardMaterial map={rockTex} color="#5d4229" roughness={1} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <FloatingRock key={i} index={i} night={night} />
      ))}
    </group>
  );
}

function FloatingRock({ index, night }: { index: number; night: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  const tex = useMemo(() => rockTexture(), []);
  const rng = useMemo(() => mulberry32(900 + index), [index]);
  const base = useMemo(
    () => ({ x: (rng() - 0.5) * 3.6, y: -2.1 - rng() * 0.9, z: (rng() - 0.5) * 3.6, s: 0.13 + rng() * 0.17, p: rng() * 6 }),
    [rng],
  );
  const geo = useMemo(() => blobGeometry(1, 0, 0.3, 300 + index), [index]);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.y = base.y + Math.sin(clock.elapsedTime * 0.6 + base.p) * 0.08;
  });
  return (
    <mesh ref={ref} geometry={geo} position={[base.x, base.y, base.z]} scale={base.s}>
      <meshStandardMaterial map={tex} color={night ? '#5a5048' : '#7e6b54'} roughness={1} />
    </mesh>
  );
}

/** Displaced rocky mountain with optional snow cap. From world 2. */
function Mountain({
  position,
  scale = 1,
  seed,
  snow,
}: {
  position: [number, number, number];
  scale?: number;
  seed: number;
  snow: boolean;
}) {
  const tex = useMemo(() => rockTexture(), []);
  const geo = useMemo(() => {
    const g = new THREE.ConeGeometry(1.15, 2.1, 9, 5);
    const rng = mulberry32(seed);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      if (v.y < 0.9) {
        pos.setX(i, v.x * (1 + (rng() - 0.5) * 0.4));
        pos.setZ(i, v.z * (1 + (rng() - 0.5) * 0.4));
        pos.setY(i, v.y + (rng() - 0.5) * 0.14);
      }
    }
    g.computeVertexNormals();
    return g;
  }, [seed]);
  return (
    <group position={position} scale={scale}>
      <mesh castShadow receiveShadow geometry={geo} position={[0, 1.04, 0]}>
        <meshStandardMaterial map={tex} bumpMap={tex} bumpScale={0.08} color="#8d8175" roughness={1} flatShading />
      </mesh>
      {snow && (
        <mesh geometry={blobGeometry(0.42, 1, 0.3, seed + 5)} position={[0, 1.88, 0]} scale={[1, 0.55, 1]}>
          <meshStandardMaterial color="#f4f8fa" roughness={0.6} />
        </mesh>
      )}
      <BlobShadow r={1.2 * scale} opacity={0.3} />
    </group>
  );
}

/**
 * Dense conifer forest ring (the diorama backbone) — 4 instanced draws total.
 * Density grows with world progress so a young world is a clearing and a
 * finished one is a forest.
 */
function ConiferForest({
  leafDeep,
  pct,
  worldIndex,
  snow,
  ringR = ISLAND_R * 0.93,
}: {
  leafDeep: string;
  pct: number;
  worldIndex: number;
  snow: boolean;
  ringR?: number;
}) {
  const trunkRef = useRef<THREE.InstancedMesh>(null);
  const cardRef = useRef<THREE.InstancedMesh>(null);
  const snowRef = useRef<THREE.InstancedMesh>(null);
  const MAXN = 48;
  const CARDS_PER = 26;
  const count = Math.min(MAXN, 12 + Math.round(pct * 30) + Math.min(6, worldIndex));

  useEffect(() => {
    const rng = mulberry32(4000 + worldIndex * 17);
    const dummy = new THREE.Object3D();
    const c = new THREE.Color();
    const base = new THREE.Color(leafDeep);
    const placed: { x: number; z: number; s: number }[] = [];
    let guard = 0;
    while (placed.length < count && guard++ < 400) {
      const a = rng() * Math.PI * 2;
      const r = ringR * 0.76 + rng() * ringR * 0.25;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      if (Math.hypot(x - POND_POS[0], z - POND_POS[1]) < POND_R + 0.5) continue;
      if (MOUNTAIN_POS.some(([mx, mz]) => Math.hypot(x - mx, z - mz) < 1.1)) continue;
      if (placed.some((p) => Math.hypot(x - p.x, z - p.z) < 0.42)) continue;
      placed.push({ x, z, s: 0.8 + rng() * 0.75 });
    }
    const cRng = mulberry32(999);
    placed.forEach((p, i) => {
      if (trunkRef.current) {
        dummy.position.set(p.x, 0.3 * p.s, p.z);
        dummy.scale.setScalar(p.s);
        dummy.rotation.set(0, cRng() * Math.PI, 0);
        dummy.updateMatrix();
        trunkRef.current.setMatrixAt(i, dummy.matrix);
      }
      // Foliage: a cloud of leaf-cluster cards filling a cone volume —
      // jagged organic silhouette instead of smooth "straight line" cones.
      for (let k = 0; k < CARDS_PER; k++) {
        const idx = i * CARDS_PER + k;
        const hf = k / CARDS_PER; // 0 bottom → 1 top
        const y = (0.45 + hf * 1.25) * p.s;
        const maxR = 0.62 * (1 - hf * 0.82) * p.s;
        const aa = cRng() * Math.PI * 2;
        const rr = Math.sqrt(cRng()) * maxR;
        dummy.position.set(p.x + Math.cos(aa) * rr, y, p.z + Math.sin(aa) * rr);
        const cs = (0.34 + cRng() * 0.3) * p.s;
        dummy.scale.set(cs, cs * (0.75 + cRng() * 0.4), cs);
        dummy.rotation.set((cRng() - 0.5) * 0.9, cRng() * Math.PI * 2, (cRng() - 0.5) * 0.9);
        dummy.updateMatrix();
        cardRef.current?.setMatrixAt(idx, dummy.matrix);
        // Height-graded color: dark shaded base → sunlit top, plus jitter.
        c.copy(base);
        const hsl = { h: 0, s: 0, l: 0 };
        c.getHSL(hsl);
        c.setHSL(
          (hsl.h + (cRng() - 0.5) * 0.03 + 1) % 1,
          THREE.MathUtils.clamp(hsl.s + (cRng() - 0.5) * 0.1, 0, 1),
          THREE.MathUtils.clamp(hsl.l * (0.72 + hf * 0.55) + (cRng() - 0.5) * 0.05, 0, 1),
        );
        cardRef.current?.setColorAt(idx, c);
      }
      if (snowRef.current) {
        dummy.position.set(p.x, 1.72 * p.s, p.z);
        dummy.scale.setScalar(snow ? p.s * 0.28 : 0.0001);
        dummy.updateMatrix();
        snowRef.current.setMatrixAt(i, dummy.matrix);
      }
    });
    // Hide unused instances.
    for (let i = placed.length; i < MAXN; i++) {
      dummy.position.set(0, -50, 0);
      dummy.scale.setScalar(0.0001);
      dummy.updateMatrix();
      trunkRef.current?.setMatrixAt(i, dummy.matrix);
      snowRef.current?.setMatrixAt(i, dummy.matrix);
      for (let k = 0; k < CARDS_PER; k++) cardRef.current?.setMatrixAt(i * CARDS_PER + k, dummy.matrix);
    }
    [trunkRef, cardRef, snowRef].forEach((ref) => {
      if (ref.current) {
        ref.current.instanceMatrix.needsUpdate = true;
        if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, leafDeep, worldIndex, snow, ringR]);

  const barkTex = useMemo(() => barkTexture(), []);
  const cardTex = useMemo(() => foliageCardTexture(), []);
  return (
    <group>
      <instancedMesh ref={trunkRef} args={[undefined, undefined, MAXN]} castShadow frustumCulled={false}>
        <cylinderGeometry args={[0.045, 0.1, 0.7, 6]} />
        <meshStandardMaterial map={barkTex} color="#7a5a3c" roughness={1} />
      </instancedMesh>
      <instancedMesh ref={cardRef} args={[undefined, undefined, MAXN * CARDS_PER]} castShadow frustumCulled={false}>
        <planeGeometry args={[1, 1]} />
        <meshStandardMaterial map={cardTex} alphaTest={0.42} side={THREE.DoubleSide} roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={snowRef} args={[undefined, undefined, MAXN]} frustumCulled={false}>
        <coneGeometry args={[0.5, 0.4, 8]} />
        <meshStandardMaterial color="#f2f7f9" roughness={0.6} />
      </instancedMesh>
    </group>
  );
}

/** Wooden plank bridge over the river. */
function Bridge({ R = ISLAND_R }: { R?: number }) {
  const barkTex = useMemo(() => barkTexture(), []);
  const dir = useMemo(() => new THREE.Vector2(POND_POS[0], POND_POS[1]).normalize(), []);
  const angle = Math.atan2(dir.y, dir.x);
  const mid = R - 0.34; // over the river, near the (growing) rim
  return (
    <group rotation={[0, -angle, 0]} position={[0, 0, 0]}>
      <group position={[mid, 0.05, 0]}>
        {[-2, -1, 0, 1, 2].map((i) => (
          <mesh key={i} castShadow position={[i * 0.085, 0.02 + Math.cos(i * 0.6) * 0.035, 0]} rotation={[0, 0, i * 0.09]}>
            <boxGeometry args={[0.085, 0.025, 0.52]} />
            <meshStandardMaterial map={barkTex} color="#9a7448" roughness={0.95} />
          </mesh>
        ))}
        {[-0.22, 0.22].map((z, i) => (
          <mesh key={i} castShadow position={[0, 0.1, z]}>
            <boxGeometry args={[0.46, 0.02, 0.03]} />
            <meshStandardMaterial map={barkTex} color="#8a6840" roughness={0.95} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** Grazing deer — body, legs, neck/head with a gentle head-bob. */
function Deer({ position, rotY = 0, seed }: { position: [number, number, number]; rotY?: number; seed: number }) {
  const head = useRef<THREE.Group>(null);
  const rng = useMemo(() => mulberry32(seed), [seed]);
  const phase = useMemo(() => rng() * 6, [rng]);
  useFrame(({ clock }) => {
    if (head.current) head.current.rotation.x = 0.5 + Math.max(0, Math.sin(clock.elapsedTime * 0.5 + phase)) * 0.55;
  });
  const fur = '#b07a4a';
  return (
    <group position={position} rotation={[0, rotY, 0]} scale={0.62}>
      <mesh castShadow position={[0, 0.42, 0]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.13, 0.3, 4, 8]} />
        <meshStandardMaterial color={fur} roughness={0.9} />
      </mesh>
      {[[-0.14, 0.1], [0.14, 0.1], [-0.14, -0.1], [0.14, -0.1]].map(([x, z], i) => (
        <mesh key={i} castShadow position={[x!, 0.17, z!]}>
          <cylinderGeometry args={[0.022, 0.018, 0.34, 5]} />
          <meshStandardMaterial color="#96633a" roughness={0.9} />
        </mesh>
      ))}
      <group ref={head} position={[0.26, 0.52, 0]}>
        <mesh castShadow position={[0.05, 0.14, 0]} rotation={[0, 0, -0.5]}>
          <capsuleGeometry args={[0.045, 0.16, 4, 8]} />
          <meshStandardMaterial color={fur} roughness={0.9} />
        </mesh>
        <mesh castShadow position={[0.13, 0.24, 0]}>
          <capsuleGeometry args={[0.05, 0.08, 4, 8]} />
          <meshStandardMaterial color={fur} roughness={0.9} />
        </mesh>
        {[-0.05, 0.05].map((z, i) => (
          <mesh key={i} position={[0.1, 0.32, z]} rotation={[z * 6, 0, 0]}>
            <coneGeometry args={[0.02, 0.07, 4]} />
            <meshStandardMaterial color="#96633a" />
          </mesh>
        ))}
      </group>
      <mesh position={[-0.28, 0.46, 0]} rotation={[0, 0, 0.7]}>
        <coneGeometry args={[0.025, 0.08, 4]} />
        <meshStandardMaterial color="#f5efe0" />
      </mesh>
      <BlobShadow r={0.32} opacity={0.25} />
    </group>
  );
}

/** Duck drifting on the pond. */
function Duck({ seed }: { seed: number }) {
  const ref = useRef<THREE.Group>(null);
  const rng = useMemo(() => mulberry32(seed), [seed]);
  const p = useMemo(() => ({ r: 0.2 + rng() * 0.35, sp: 0.25 + rng() * 0.2, ph: rng() * 6 }), [rng]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * p.sp + p.ph;
    if (ref.current) {
      ref.current.position.set(POND_POS[0] + Math.cos(t) * p.r, 0.035 + Math.sin(clock.elapsedTime * 2 + p.ph) * 0.006, POND_POS[1] + Math.sin(t) * p.r * 0.8);
      ref.current.rotation.y = -t + Math.PI / 2;
    }
  });
  return (
    <group ref={ref} scale={0.5}>
      <mesh castShadow scale={[1.35, 0.75, 0.9]}>
        <sphereGeometry args={[0.09, 10, 8]} />
        <meshStandardMaterial color="#7d5a36" roughness={0.8} />
      </mesh>
      <mesh position={[0.09, 0.09, 0]}>
        <sphereGeometry args={[0.05, 10, 8]} />
        <meshStandardMaterial color="#2e5d3a" roughness={0.6} />
      </mesh>
      <mesh position={[0.15, 0.08, 0]} rotation={[0, 0, -1.35]}>
        <coneGeometry args={[0.018, 0.05, 4]} />
        <meshStandardMaterial color="#e8a33d" />
      </mesh>
    </group>
  );
}

/** Winding dirt path: cabin → centre → bridge (organizes the composition). */
function DirtPath() {
  const tex = useMemo(() => rockTexture(), []);
  const geo = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.55, 0.03, -1.95),
      new THREE.Vector3(-0.45, 0.03, -0.7),
      new THREE.Vector3(0.35, 0.03, 0.35),
      new THREE.Vector3(1.35, 0.03, -0.6),
      new THREE.Vector3(2.3, 0.03, -1.72),
    ]);
    const g = new THREE.TubeGeometry(curve, 40, 0.15, 6, false);
    g.scale(1, 0.16, 1);
    return g;
  }, []);
  return (
    <mesh geometry={geo} receiveShadow>
      <meshStandardMaterial map={tex} bumpMap={tex} bumpScale={0.03} color="#b28d5e" roughness={1} />
    </mesh>
  );
}

/** Tree stump with growth rings. */
function Stump({ position }: { position: [number, number, number] }) {
  const bark = useMemo(() => barkTexture(), []);
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.09, 0.11, 0.12, 8]} />
        <meshStandardMaterial map={bark} color="#8a6844" roughness={1} />
      </mesh>
      <mesh position={[0, 0.121, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.085, 12]} />
        <meshStandardMaterial color="#c9a879" roughness={0.9} />
      </mesh>
      <BlobShadow r={0.13} opacity={0.22} />
    </group>
  );
}

/** Mossy fallen log. */
function FallenLog({ position, rotY = 0.8 }: { position: [number, number, number]; rotY?: number }) {
  const bark = useMemo(() => barkTexture(), []);
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <mesh castShadow position={[0, 0.07, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.09, 0.7, 8]} />
        <meshStandardMaterial map={bark} color="#7a5a3c" roughness={1} />
      </mesh>
      <mesh geometry={blobGeometry(0.09, 1, 0.3, 55)} position={[0.12, 0.14, 0]} scale={[1.4, 0.5, 1]}>
        <meshStandardMaterial color="#4d7a3a" roughness={1} />
      </mesh>
      <BlobShadow r={0.3} opacity={0.22} />
    </group>
  );
}

/** Little red mushroom cluster. */
function Mushrooms({ position }: { position: [number, number, number] }) {
  const rng = useMemo(() => mulberry32(303), []);
  const shrooms = useMemo(
    () =>
      [0, 1, 2].map(() => ({
        x: (rng() - 0.5) * 0.16,
        z: (rng() - 0.5) * 0.16,
        s: 0.5 + rng() * 0.6,
      })),
    [rng],
  );
  return (
    <group position={position}>
      {shrooms.map((m, i) => (
        <group key={i} position={[m.x, 0, m.z]} scale={m.s}>
          <mesh castShadow position={[0, 0.035, 0]}>
            <cylinderGeometry args={[0.016, 0.022, 0.07, 6]} />
            <meshStandardMaterial color="#f0e6d2" roughness={0.8} />
          </mesh>
          <mesh castShadow position={[0, 0.075, 0]} scale={[1, 0.62, 1]}>
            <sphereGeometry args={[0.045, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#d0543a" roughness={0.6} />
          </mesh>
        </group>
      ))}
      <BlobShadow r={0.1} opacity={0.18} />
    </group>
  );
}

/** Rustic fence run near the cabin. */
function Fence({ position, rotY = 0 }: { position: [number, number, number]; rotY?: number }) {
  const bark = useMemo(() => barkTexture(), []);
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} castShadow position={[i * 0.28, 0.1, 0]}>
          <cylinderGeometry args={[0.016, 0.02, 0.2, 5]} />
          <meshStandardMaterial map={bark} color="#8a6a44" roughness={1} />
        </mesh>
      ))}
      {[0.14, 0.06].map((y, i) => (
        <mesh key={i} castShadow position={[0.42, y, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.011, 0.011, 0.9, 4]} />
          <meshStandardMaterial map={bark} color="#96744c" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

/** Cozy cabin — appears once the world is half grown. */
function Cabin({ position, rotY = 0.6 }: { position: [number, number, number]; rotY?: number }) {
  const barkTex = useMemo(() => barkTexture(), []);
  const rockTex = useMemo(() => rockTexture(), []);
  return (
    <group position={position} rotation={[0, rotY, 0]} scale={0.85}>
      <mesh castShadow position={[0, 0.22, 0]}>
        <boxGeometry args={[0.62, 0.44, 0.5]} />
        <meshStandardMaterial map={barkTex} bumpMap={barkTex} bumpScale={0.04} color="#a07a4e" roughness={0.95} />
      </mesh>
      <mesh castShadow position={[0, 0.55, 0]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.5, 0.5, 0.58]} />
        <meshStandardMaterial map={foliageTexture()} color="#4d7a4a" roughness={1} />
      </mesh>
      <mesh position={[0.18, 0.68, 0.1]}>
        <boxGeometry args={[0.09, 0.3, 0.09]} />
        <meshStandardMaterial map={rockTex} color="#8d8175" roughness={1} />
      </mesh>
      <mesh position={[0, 0.2, 0.253]}>
        <boxGeometry args={[0.14, 0.26, 0.01]} />
        <meshStandardMaterial color="#4a3620" roughness={0.9} />
      </mesh>
      <mesh position={[0.2, 0.26, 0.253]}>
        <boxGeometry args={[0.12, 0.12, 0.008]} />
        <meshStandardMaterial color="#ffe9a8" emissive="#c99b3f" emissiveIntensity={0.6} />
      </mesh>
      <BlobShadow r={0.5} opacity={0.3} />
    </group>
  );
}

// ── Water: pond + river + waterfall ─────────────────────────────────────────

function usePondShader(color: string) {
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
  return { matRef, uniforms };
}

/**
 * World scale (v6): the island physically GROWS with progression. World 1
 * starts small; every world (and growth within it) extends the land, pushes
 * the forest ring outward and unlocks more water/mountains/animals.
 */
export const ISLAND_R = 3.4; // max footprint reference
export function worldSizeFactor(worldIndex: number, pct: number): number {
  return Math.min(1.32, 0.78 + (Math.min(worldIndex, 7) - 1) * 0.085 + pct * 0.085);
}
const POND_POS: [number, number] = [1.72, -1.34];
const POND_R = 0.85;

function Pond({
  color,
  center = POND_POS,
  r = POND_R,
  lilies = true,
}: {
  color: string;
  center?: [number, number];
  r?: number;
  lilies?: boolean;
}) {
  const { matRef, uniforms } = usePondShader(color);
  return (
    <group position={[center[0], 0.02, center[1]]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[r, 48]} />
        <shaderMaterial
          ref={matRef}
          transparent
          uniforms={uniforms}
          vertexShader={`
            uniform float uTime; varying vec2 vUv;
            void main(){
              vUv = uv;
              vec3 p = position;
              float d = length(uv - 0.5);
              // Real moving surface: two crossing wave trains.
              p.z += sin(d * 30.0 - uTime * 2.4) * 0.012 + sin(uv.x * 22.0 + uTime * 1.6) * 0.008;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
            }`}
          fragmentShader={`
            uniform float uTime; uniform vec3 uColor; varying vec2 vUv;
            void main(){
              vec2 c = vUv - 0.5;
              float d = length(c);
              // Distorted UVs make highlights wander like real water.
              vec2 w = c + vec2(sin(c.y * 18.0 + uTime * 1.1), cos(c.x * 16.0 - uTime * 0.9)) * 0.02;
              float rip = sin(length(w) * 44.0 - uTime * 2.6) * 0.5 + 0.5;
              float rip2 = sin(length(w) * 21.0 - uTime * 1.4 + 1.7) * 0.5 + 0.5;
              float glint = pow(max(sin(w.x * 34.0 + uTime * 2.2) * sin(w.y * 30.0 - uTime * 1.6), 0.0), 3.0);
              float glint2 = pow(max(sin(w.x * 52.0 - uTime * 3.1 + 2.0) * sin(w.y * 47.0 + uTime * 2.4), 0.0), 5.0);
              vec3 deep = uColor * 0.5;
              vec3 shallow = uColor * 1.55;
              vec3 col = mix(shallow, deep, clamp(d * 1.6 + rip * 0.25, 0.0, 1.0));
              col += vec3(1.0) * (rip2 * 0.07 + glint * 0.28 + glint2 * 0.35);
              float edge = smoothstep(0.5, 0.36, d);
              float foam = smoothstep(0.455, 0.5, d) * (0.5 + 0.5 * sin(uTime * 2.0 + d * 40.0));
              col = mix(col, vec3(0.96), foam * 0.55);
              gl_FragColor = vec4(col, edge * 0.94);
            }`}
        />
      </mesh>
      {lilies &&
        [0, 1].map((i) => (
          <mesh key={i} rotation={[-Math.PI / 2, 0, i * 2.1]} position={[i === 0 ? r * 0.28 : -r * 0.3, 0.02, i === 0 ? -r * 0.14 : r * 0.21]}>
            <circleGeometry args={[0.07, 8]} />
            <meshStandardMaterial color="#3f9e63" roughness={0.7} />
          </mesh>
        ))}
    </group>
  );
}

/** Little rabbit hopping between two points (world 2+). */
function Rabbit({ a, b, seed }: { a: [number, number]; b: [number, number]; seed: number }) {
  const ref = useRef<THREE.Group>(null);
  const rng = useMemo(() => mulberry32(seed), [seed]);
  const ph = useMemo(() => rng() * 6, [rng]);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime * 0.14 + ph;
    const k = t % 2;
    const u = k < 1 ? k : 2 - k; // ping-pong 0..1..0
    const x = a[0] + (b[0] - a[0]) * u;
    const z = a[1] + (b[1] - a[1]) * u;
    const hop = Math.abs(Math.sin(u * Math.PI * 6)) * 0.09;
    ref.current.position.set(x, hop, z);
    ref.current.rotation.y = Math.atan2((k < 1 ? 1 : -1) * (b[0] - a[0]), (k < 1 ? 1 : -1) * (b[1] - a[1]));
  });
  return (
    <group ref={ref} scale={0.5}>
      <mesh castShadow position={[0, 0.09, 0]} scale={[0.8, 0.75, 1.15]}>
        <sphereGeometry args={[0.11, 10, 8]} />
        <meshStandardMaterial color="#cbb59a" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0, 0.18, 0.1]}>
        <sphereGeometry args={[0.065, 10, 8]} />
        <meshStandardMaterial color="#d6c2a8" roughness={0.9} />
      </mesh>
      {[-0.03, 0.03].map((x, i) => (
        <mesh key={i} castShadow position={[x, 0.28, 0.08]} rotation={[0.25, 0, x * 3]}>
          <capsuleGeometry args={[0.014, 0.08, 3, 6]} />
          <meshStandardMaterial color="#d6c2a8" roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[0, 0.1, -0.12]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color="#f2ead9" />
      </mesh>
      <BlobShadow r={0.13} opacity={0.2} />
    </group>
  );
}

/** River from the pond over the rim + waterfall down the island side + mist. */
function Waterfall({ color, R = ISLAND_R }: { color: string; R?: number }) {
  const dir = useMemo(() => {
    const v = new THREE.Vector2(POND_POS[0], POND_POS[1]).normalize();
    return v;
  }, []);
  const angle = Math.atan2(dir.y, dir.x);
  const end = R + 0.06; // island rim (grows with the world)
  const start = Math.min(2.85, end - 0.3); // just past the pond edge
  const mid = (start + end) / 2;
  const riverLen = end - start;
  const { matRef: riverMat, uniforms: riverU } = usePondShader(color);
  const { matRef: fallMat, uniforms: fallU } = usePondShader(color);
  const mistTex = useMemo(() => softDiscTexture(), []);
  const mists = useRef<(THREE.Sprite | null)[]>([]);
  useFrame(({ clock }) => {
    mists.current.forEach((m, i) => {
      if (!m) return;
      const t = clock.elapsedTime * 0.7 + i * 2.1;
      m.position.y = -1.65 + ((t % 2) / 2) * 0.55;
      const mat = m.material as THREE.SpriteMaterial;
      mat.opacity = 0.34 * (1 - (t % 2) / 2);
    });
  });

  const flowShader = {
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform float uTime; uniform vec3 uColor; varying vec2 vUv;
      void main(){
        float stripes = sin(vUv.y * 22.0 + uTime * 4.2 + sin(vUv.x * 14.0) * 0.8) * 0.5 + 0.5;
        float stripes2 = sin(vUv.y * 9.0 + uTime * 2.1 + 2.0) * 0.5 + 0.5;
        vec3 col = mix(uColor * 0.85, uColor * 1.55, stripes * 0.5 + stripes2 * 0.2);
        float foamA = smoothstep(0.86, 1.0, vUv.y);
        float foamB = smoothstep(0.12, 0.0, vUv.y);
        float side = smoothstep(0.0, 0.12, vUv.x) * smoothstep(1.0, 0.88, vUv.x);
        col = mix(col, vec3(0.97), (foamA + foamB) * 0.65);
        gl_FragColor = vec4(col, (0.82 + (foamA + foamB) * 0.15) * side);
      }`,
  };

  return (
    <group rotation={[0, -angle, 0]}>
      {/* River strip (lies flat, flows outward along +x after rotation). */}
      <mesh position={[mid, 0.028, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
        <planeGeometry args={[0.34, riverLen]} />
        <shaderMaterial ref={riverMat} transparent uniforms={riverU} {...flowShader} />
      </mesh>
      {/* Waterfall sheet hanging over the rim. */}
      <mesh position={[end + 0.03, -0.85, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.36, 1.85]} />
        <shaderMaterial ref={fallMat} transparent side={THREE.DoubleSide} uniforms={fallU} {...flowShader} />
      </mesh>
      {/* Mist at the base. */}
      {[0, 1, 2].map((i) => (
        <sprite
          key={i}
          ref={(el) => {
            mists.current[i] = el;
          }}
          position={[end + 0.05, -1.65, (i - 1) * 0.16]}
          scale={[0.5, 0.35, 1]}
        >
          <spriteMaterial map={mistTex} color="#ffffff" transparent opacity={0.3} depthWrite={false} />
        </sprite>
      ))}
    </group>
  );
}

/** Kayak gliding across the pond (world 3+). */
function Kayak({ accent }: { accent: string }) {
  const ref = useRef<THREE.Group>(null);
  const paddle = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 0.45;
    if (ref.current) {
      const r = 0.48;
      ref.current.position.set(POND_POS[0] + Math.cos(t) * r, 0.045 + Math.sin(clock.elapsedTime * 2.2) * 0.008, POND_POS[1] + Math.sin(t) * r * 0.75);
      ref.current.rotation.y = -t + Math.PI / 2;
    }
    if (paddle.current) paddle.current.rotation.z = Math.sin(clock.elapsedTime * 3.2) * 0.7;
  });
  return (
    <group ref={ref} scale={0.8}>
      <mesh castShadow scale={[1.9, 0.5, 0.62]}>
        <sphereGeometry args={[0.11, 10, 8]} />
        <meshStandardMaterial color={accent} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.09, 0]}>
        <sphereGeometry args={[0.055, 10, 10]} />
        <meshStandardMaterial color="#e9c89a" roughness={0.8} />
      </mesh>
      <mesh ref={paddle} position={[0, 0.11, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.4, 5]} />
        <meshStandardMaterial color="#8a6a44" />
      </mesh>
    </group>
  );
}

// ── Flora ───────────────────────────────────────────────────────────────────

/** Crossed-quad tuft geometry (two planes at 90°, base at y=0). */
const tuftGeo = (() => {
  let cached: THREE.BufferGeometry | null = null;
  return () => {
    if (cached) return cached;
    const a = new THREE.PlaneGeometry(0.3, 0.22);
    a.translate(0, 0.11, 0);
    const b = a.clone();
    b.rotateY(Math.PI / 2);
    // Manual merge (avoid pulling BufferGeometryUtils).
    const g = new THREE.BufferGeometry();
    const posA = a.attributes.position!.array as Float32Array;
    const posB = b.attributes.position!.array as Float32Array;
    const uvA = a.attributes.uv!.array as Float32Array;
    const uvB = b.attributes.uv!.array as Float32Array;
    const norA = a.attributes.normal!.array as Float32Array;
    const norB = b.attributes.normal!.array as Float32Array;
    const idxA = Array.from(a.index!.array);
    const idxB = Array.from(b.index!.array).map((i) => i + posA.length / 3);
    g.setAttribute('position', new THREE.Float32BufferAttribute([...posA, ...posB], 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute([...uvA, ...uvB], 2));
    g.setAttribute('normal', new THREE.Float32BufferAttribute([...norA, ...norB], 3));
    g.setIndex([...idxA, ...idxB]);
    cached = g;
    return cached;
  };
})();

function GrassField({ count, color, liveliness, boundary = ISLAND_R - 0.18 }: { count: number; color: string; liveliness: number; boundary?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const shaderRef = useRef<{ uniforms: { uTime: { value: number } } } | null>(null);

  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      map: grassTuftTexture(),
      alphaTest: 0.35,
      side: THREE.DoubleSide,
      roughness: 0.92,
    });
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = { value: 0 };
      shader.vertexShader = `uniform float uTime;\n${shader.vertexShader}`.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        {
          float hf = clamp(position.y / 0.22, 0.0, 1.0); // 0 base → 1 tip
          vec3 ipos = vec3(0.0);
          #ifdef USE_INSTANCING
            ipos = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
          #endif
          float gust = sin(uTime * 0.7 + ipos.x * 0.5 + ipos.z * 0.4) * 0.5 + 0.5;
          float sway = sin(uTime * 1.9 + ipos.x * 2.1 + ipos.z * 1.6) * (0.55 + gust * 0.45)
                     + sin(uTime * 3.1 + ipos.z * 2.9) * 0.3;
          transformed.x += sway * 0.06 * hf * hf;
          transformed.z += sway * 0.04 * hf * hf;
        }`,
      );
      shaderRef.current = shader as never;
    };
    mat.customProgramCacheKey = () => 'brote-grass';
    return mat;
  }, []);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const rng = mulberry32(1234);
    const dummy = new THREE.Object3D();
    const c = new THREE.Color();
    // Patchy clusters read more natural than uniform scatter.
    const clusters = Array.from({ length: 24 }).map(() => {
      const a = rng() * Math.PI * 2;
      const r = Math.sqrt(rng()) * 2.9;
      return { x: Math.cos(a) * r, z: Math.sin(a) * r };
    });
    for (let i = 0; i < count; i++) {
      const cl = clusters[i % clusters.length]!;
      const a = rng() * Math.PI * 2;
      const rr = rng() * rng() * 0.6;
      const x = cl.x + Math.cos(a) * rr;
      const z = cl.z + Math.sin(a) * rr;
      if (Math.hypot(x, z) > boundary) continue;
      dummy.position.set(x, 0, z);
      const s = 0.72 + rng() * 0.75;
      dummy.scale.set(s, 0.7 + rng() * 0.8, s);
      dummy.rotation.y = rng() * Math.PI;
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      c.copy(vary(color, rng, 0.03, 0.12, 0.14));
      mesh.setColorAt(i, c);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [count, color, boundary]);

  useFrame(({ clock }) => {
    if (shaderRef.current) shaderRef.current.uniforms.uTime.value = clock.elapsedTime * (0.6 + liveliness * 0.7);
  });

  return <instancedMesh ref={meshRef} args={[tuftGeo(), material, count]} frustumCulled={false} />;
}

/** Root skirt: a flattened dark mound that blends a trunk into the soil. */
function RootSkirt({ r = 0.16, seed = 1 }: { r?: number; seed?: number }) {
  const tex = useMemo(() => grassFieldTexture(), []);
  return (
    <mesh receiveShadow geometry={blobGeometry(1, 1, 0.2, 600 + seed)} position={[0, 0.005, 0]} scale={[r, r * 0.28, r]}>
      <meshStandardMaterial map={tex} color="#5d7a4a" roughness={1} />
    </mesh>
  );
}

/** Ground cover: pebbles + moss patches that break the "placed on top" look. */
function GroundCover({ ground, leafDeep }: { ground: string; leafDeep: string }) {
  const pebbleRef = useRef<THREE.InstancedMesh>(null);
  const mossRef = useRef<THREE.InstancedMesh>(null);
  const rockTex = useMemo(() => rockTexture(), []);
  const folTex = useMemo(() => foliageTexture(), []);
  const P = 110;
  const M = 46;
  useEffect(() => {
    const dummy = new THREE.Object3D();
    const c = new THREE.Color();
    const rng = mulberry32(8080);
    for (let i = 0; i < P; i++) {
      const a = rng() * Math.PI * 2;
      const r = Math.sqrt(rng()) * (ISLAND_R - 0.25);
      const s = 0.02 + rng() * 0.045;
      dummy.position.set(Math.cos(a) * r, s * 0.4, Math.sin(a) * r);
      dummy.scale.set(s, s * 0.7, s);
      dummy.rotation.set(rng() * 3, rng() * 3, 0);
      dummy.updateMatrix();
      pebbleRef.current?.setMatrixAt(i, dummy.matrix);
      c.copy(vary('#8f8578', rng, 0.02, 0.06, 0.14));
      pebbleRef.current?.setColorAt(i, c);
    }
    for (let i = 0; i < M; i++) {
      const a = rng() * Math.PI * 2;
      const r = Math.sqrt(rng()) * (ISLAND_R - 0.4);
      const s = 0.12 + rng() * 0.22;
      dummy.position.set(Math.cos(a) * r, 0.012 + rng() * 0.004, Math.sin(a) * r);
      dummy.scale.set(s, 1, s * (0.7 + rng() * 0.5));
      dummy.rotation.set(-Math.PI / 2, 0, rng() * Math.PI);
      dummy.updateMatrix();
      mossRef.current?.setMatrixAt(i, dummy.matrix);
      c.copy(vary(leafDeep, rng, 0.03, 0.1, 0.12));
      mossRef.current?.setColorAt(i, c);
    }
    [pebbleRef, mossRef].forEach((ref) => {
      if (ref.current) {
        ref.current.instanceMatrix.needsUpdate = true;
        if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
      }
    });
  }, [ground, leafDeep]);
  return (
    <group>
      <instancedMesh ref={pebbleRef} args={[undefined, undefined, P]} frustumCulled={false} receiveShadow>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial map={rockTex} roughness={1} />
      </instancedMesh>
      <instancedMesh ref={mossRef} args={[undefined, undefined, M]} frustumCulled={false} receiveShadow>
        <circleGeometry args={[1, 10]} />
        <meshStandardMaterial map={folTex} transparent opacity={0.85} roughness={1} depthWrite={false} />
      </instancedMesh>
    </group>
  );
}

/** Canopy material with high-frequency leaf flutter. One per color per tree. */
function useCanopyMaterial(color: THREE.Color | string) {
  const shaderRef = useRef<{ uniforms: { uTime: { value: number } } } | null>(null);
  const material = useMemo(() => {
    const tex = foliageTexture();
    const mat = new THREE.MeshStandardMaterial({ color, map: tex, bumpMap: tex, bumpScale: 0.03, roughness: 0.85 });
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = { value: 0 };
      shader.vertexShader = `uniform float uTime;\n${shader.vertexShader}`.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        transformed += normal * (sin(uTime * 2.8 + position.x * 9.0 + position.y * 7.0) * 0.5 + 0.5) * 0.016;`,
      );
      shaderRef.current = shader as never;
    };
    // CRITICAL: share ONE compiled program across all canopy materials —
    // without this every tree/bush/sapling triggers a full shader compile
    // and the main thread freezes for seconds.
    mat.customProgramCacheKey = () => 'brote-canopy';
    return mat;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    (material as THREE.MeshStandardMaterial).color.set(color as string);
  }, [color, material]);
  useFrame(({ clock }) => {
    if (shaderRef.current) shaderRef.current.uniforms.uTime.value = clock.elapsedTime;
  });
  return material;
}

function Trunk({ h, seed }: { h: number; seed: number }) {
  const tex = useMemo(() => barkTexture(), []);
  const rng = useMemo(() => mulberry32(seed), [seed]);
  const bends = useMemo(() => [(rng() - 0.5) * 0.24, (rng() - 0.5) * 0.3], [rng]);
  const seg = h / 2;
  return (
    <group>
      <mesh castShadow position={[0, seg / 2, 0]}>
        <cylinderGeometry args={[0.075 + h * 0.045, 0.1 + h * 0.075, seg, 7]} />
        <meshStandardMaterial map={tex} bumpMap={tex} bumpScale={0.05} color="#8a6844" roughness={1} />
      </mesh>
      <group position={[0, seg, 0]} rotation={[bends[1]!, 0, bends[0]!]}>
        <mesh castShadow position={[0, seg / 2, 0]}>
          <cylinderGeometry args={[0.05 + h * 0.03, 0.075 + h * 0.045, seg, 7]} />
          <meshStandardMaterial map={tex} bumpMap={tex} bumpScale={0.05} color="#8a6844" roughness={1} />
        </mesh>
      </group>
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
  const leafColor = useMemo(() => vary(leaf, mulberry32(seed + 1)), [leaf, seed]);
  const deepColor = useMemo(() => vary(leafDeep, mulberry32(seed + 2)), [leafDeep, seed]);
  const matA = useCanopyMaterial(leafColor);
  const matB = useCanopyMaterial(deepColor);
  const blobs = useMemo(() => {
    const n = 3 + Math.floor(rng() * 2);
    return Array.from({ length: n }).map((_, i) => ({
      x: (rng() - 0.5) * 0.5,
      y: 0.85 + rng() * 0.45,
      z: (rng() - 0.5) * 0.5,
      r: 0.24 + rng() * 0.24,
      deep: i % 2 === 1,
      geoSeed: seed * 7 + i,
    }));
  }, [rng, seed]);

  // v5 foliage-card shell: leaf-cluster quads over the blob core give the
  // foam-like miniature silhouette (no more smooth "block" canopies).
  const cardRef = useRef<THREE.InstancedMesh>(null);
  const CARDS = 20;
  const cardTex = useMemo(() => foliageCardTexture(), []);
  useEffect(() => {
    const mesh = cardRef.current;
    if (!mesh) return;
    const cRng = mulberry32(seed * 13 + 5);
    const dummy = new THREE.Object3D();
    const c = new THREE.Color();
    const baseA = new THREE.Color(leafColor);
    const baseB = new THREE.Color(deepColor);
    for (let k = 0; k < CARDS; k++) {
      // Sample a point on a squashed sphere shell around the canopy centre.
      const theta = cRng() * Math.PI * 2;
      const phi = Math.acos(2 * cRng() - 1);
      const R = 0.42 + cRng() * 0.16;
      dummy.position.set(
        Math.sin(phi) * Math.cos(theta) * R,
        1.02 + Math.cos(phi) * R * 0.75,
        Math.sin(phi) * Math.sin(theta) * R,
      );
      const cs = 0.3 + cRng() * 0.26;
      dummy.scale.set(cs, cs * (0.8 + cRng() * 0.35), cs);
      dummy.rotation.set((cRng() - 0.5) * 1.1, cRng() * Math.PI * 2, (cRng() - 0.5) * 1.1);
      dummy.updateMatrix();
      mesh.setMatrixAt(k, dummy.matrix);
      c.copy(cRng() > 0.5 ? baseA : baseB);
      const hsl = { h: 0, s: 0, l: 0 };
      c.getHSL(hsl);
      c.setHSL(hsl.h, hsl.s, THREE.MathUtils.clamp(hsl.l * (0.8 + (dummy.position.y - 0.6) * 0.45), 0, 1));
      mesh.setColorAt(k, c);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [seed, leafColor, deepColor]);

  return (
    <SwayGroup position={position} scale={scale} phase={seed % 7} amp={0.016} speed={0.85}>
      <Trunk h={0.8} seed={seed} />
      {blobs.map((b, i) => (
        <mesh key={i} castShadow geometry={blobGeometry(b.r, 2, 0.2, b.geoSeed)} position={[b.x, b.y, b.z]} material={b.deep ? matB : matA} />
      ))}
      <instancedMesh ref={cardRef} args={[undefined, undefined, CARDS]} castShadow frustumCulled={false}>
        <planeGeometry args={[1, 1]} />
        <meshStandardMaterial map={cardTex} alphaTest={0.42} side={THREE.DoubleSide} roughness={0.9} />
      </instancedMesh>
      {snow && (
        <mesh geometry={blobGeometry(0.32, 1, 0.25, seed + 999)} position={[0, 1.42, 0]} scale={[1, 0.45, 1]}>
          <meshStandardMaterial color="#f2f6f8" roughness={0.7} />
        </mesh>
      )}
      <RootSkirt r={0.22} seed={seed} />
      <BlobShadow r={0.42 * scale} />
    </SwayGroup>
  );
}

function Sapling({ position, leaf, seed }: { position: [number, number, number]; leaf: string; seed: number }) {
  const mat = useCanopyMaterial(useMemo(() => vary(leaf, mulberry32(seed)), [leaf, seed]));
  return (
    <SwayGroup position={position} phase={seed % 5} amp={0.05} speed={1.4}>
      <Trunk h={0.32} seed={seed} />
      <mesh castShadow geometry={blobGeometry(0.15, 2, 0.22, seed + 3)} position={[0, 0.42, 0]} material={mat} />
      <RootSkirt r={0.1} seed={seed} />
      <BlobShadow r={0.14} opacity={0.2} />
    </SwayGroup>
  );
}

function Bush({ position, leafDeep, seed }: { position: [number, number, number]; leafDeep: string; seed: number }) {
  const rng = useMemo(() => mulberry32(seed), [seed]);
  const mat = useCanopyMaterial(useMemo(() => vary(leafDeep, mulberry32(seed + 4)), [leafDeep, seed]));
  return (
    <group position={position}>
      <mesh castShadow geometry={blobGeometry(0.25, 2, 0.22, seed)} position={[0, 0.17, 0]} material={mat} />
      <mesh castShadow geometry={blobGeometry(0.17, 2, 0.22, seed + 11)} position={[0.17, 0.11, 0.08]} material={mat} />
      <BlobShadow r={0.26} opacity={0.22} />
      {rng() > 0.5 && (
        <mesh position={[0.05, 0.3, 0.12]}>
          <sphereGeometry args={[0.025, 6, 6]} />
          <meshStandardMaterial color="#ff5f6b" roughness={0.4} />
        </mesh>
      )}
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
            <meshStandardMaterial color={color} roughness={0.55} />
          </mesh>
        ))}
        <mesh>
          <sphereGeometry args={[0.032, 8, 8]} />
          <meshStandardMaterial color="#FFD87A" roughness={0.4} emissive="#8a6a20" emissiveIntensity={0.25} />
        </mesh>
      </group>
    </SwayGroup>
  );
}

function Rock({ position, seed, snow }: { position: [number, number, number]; seed: number; snow?: boolean }) {
  const tex = useMemo(() => rockTexture(), []);
  const rng = useMemo(() => mulberry32(seed), [seed]);
  const s = useMemo(() => 0.12 + rng() * 0.14, [rng]);
  return (
    <group position={position}>
      <mesh castShadow geometry={blobGeometry(1, 1, 0.3, seed)} position={[0, s * 0.55, 0]} scale={s}>
        <meshStandardMaterial map={tex} bumpMap={tex} bumpScale={0.05} color={vary('#96897b', rng, 0.02, 0.05, 0.12)} roughness={1} />
      </mesh>
      {snow && (
        <mesh geometry={blobGeometry(1, 0, 0.3, seed + 5)} position={[0, s * 0.95, 0]} scale={[s * 0.8, s * 0.3, s * 0.8]}>
          <meshStandardMaterial color="#eef4f6" roughness={0.6} />
        </mesh>
      )}
      <BlobShadow r={s * 1.15} opacity={0.22} />
    </group>
  );
}

function Palm({ position, leaf, seed }: { position: [number, number, number]; leaf: string; seed: number }) {
  const barkTex = useMemo(() => barkTexture(), []);
  const mat = useCanopyMaterial(useMemo(() => vary(leaf, mulberry32(seed)), [leaf, seed]));
  const fronds = useMemo(() => Array.from({ length: 6 }).map((_, i) => ({ a: (i / 6) * Math.PI * 2 })), []);
  return (
    <SwayGroup position={position} phase={seed % 6} amp={0.03} speed={0.8}>
      <mesh castShadow position={[0.04, 0.55, 0]} rotation={[0, 0, -0.12]}>
        <cylinderGeometry args={[0.05, 0.09, 1.1, 6]} />
        <meshStandardMaterial map={barkTex} bumpMap={barkTex} bumpScale={0.04} color="#9a7a50" roughness={1} />
      </mesh>
      <group position={[0.1, 1.12, 0]}>
        {fronds.map((f, i) => (
          <mesh key={i} rotation={[0.55, f.a, 0]} position={[Math.cos(f.a) * 0.12, 0, Math.sin(f.a) * 0.12]} material={mat}>
            <coneGeometry args={[0.09, 0.74, 4]} />
          </mesh>
        ))}
      </group>
      <BlobShadow r={0.3} />
    </SwayGroup>
  );
}

function Dune({ position, ground, seed }: { position: [number, number, number]; ground: string; seed: number }) {
  const tex = useMemo(() => grassFieldTexture(), []);
  const rng = useMemo(() => mulberry32(seed), [seed]);
  return (
    <mesh receiveShadow geometry={blobGeometry(1, 1, 0.12, seed)} position={position} scale={[0.5 + rng() * 0.3, 0.14, 0.4 + rng() * 0.25]}>
      <meshStandardMaterial map={tex} color={vary(ground, rng, 0.01, 0.05, 0.1)} roughness={1} />
    </mesh>
  );
}

// ── Fauna & FX ──────────────────────────────────────────────────────────────

function Bird({ seed }: { seed: number }) {
  const ref = useRef<THREE.Group>(null);
  const wingL = useRef<THREE.Mesh>(null);
  const wingR = useRef<THREE.Mesh>(null);
  const rng = useMemo(() => mulberry32(seed), [seed]);
  const p = useMemo(() => ({ r: 2.3 + rng() * 0.9, h: 2.2 + rng() * 0.6, sp: 0.32 + rng() * 0.18, ph: rng() * 6 }), [rng]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * p.sp + p.ph;
    if (ref.current) {
      ref.current.position.set(Math.cos(t) * p.r, p.h + Math.sin(t * 2.3) * 0.14, Math.sin(t) * p.r);
      ref.current.rotation.y = -t + Math.PI / 2;
      ref.current.rotation.z = Math.sin(t * 2.3) * 0.15;
    }
    const flap = Math.sin(clock.elapsedTime * 9 + p.ph) * 0.7;
    if (wingL.current) wingL.current.rotation.z = flap;
    if (wingR.current) wingR.current.rotation.z = -flap;
  });
  return (
    <group ref={ref}>
      <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.045, 0.14, 3, 6]} />
        <meshStandardMaterial color="#FF8A3D" roughness={0.6} />
      </mesh>
      <mesh position={[0.13, 0.02, 0]}>
        <coneGeometry args={[0.03, 0.08, 4]} />
        <meshStandardMaterial color="#FFD27A" />
      </mesh>
      <mesh ref={wingL} position={[0, 0.02, 0.06]}>
        <boxGeometry args={[0.1, 0.012, 0.15]} />
        <meshStandardMaterial color="#e2712a" />
      </mesh>
      <mesh ref={wingR} position={[0, 0.02, -0.06]}>
        <boxGeometry args={[0.1, 0.012, 0.15]} />
        <meshStandardMaterial color="#e2712a" />
      </mesh>
    </group>
  );
}

function Butterfly({ seed, accent }: { seed: number; accent: string }) {
  const ref = useRef<THREE.Group>(null);
  const wL = useRef<THREE.Mesh>(null);
  const wR = useRef<THREE.Mesh>(null);
  const rng = useMemo(() => mulberry32(seed), [seed]);
  const base = useMemo(() => ({ x: (rng() - 0.5) * 4.4, z: (rng() - 0.5) * 4.4, p: rng() * 6 }), [rng]);
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
  const barkTex = useMemo(() => barkTexture(), []);
  return (
    <group position={position}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} castShadow position={[0, 0.045, 0]} rotation={[0.35, (i / 3) * Math.PI * 2, Math.PI / 2.4]}>
          <cylinderGeometry args={[0.03, 0.035, 0.3, 5]} />
          <meshStandardMaterial map={barkTex} color="#5d4229" roughness={1} />
        </mesh>
      ))}
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
      <BlobShadow r={0.3} opacity={0.3} />
    </group>
  );
}

/** Tap feedback: a short-lived burst of rising sparkles. */
function SparkleBurst({ at, onDone, tone = 'spark' }: { at: THREE.Vector3; onDone: () => void; tone?: 'spark' | 'heart' }) {
  const tex = useMemo(() => softDiscTexture(), []);
  const refs = useRef<(THREE.Sprite | null)[]>([]);
  const start = useRef<number | null>(null);
  const seeds = useMemo(() => Array.from({ length: 9 }).map((_, i) => mulberry32(i + 1)()), []);
  useFrame(({ clock }) => {
    if (start.current === null) start.current = clock.elapsedTime;
    const t = clock.elapsedTime - start.current;
    if (t > 0.95) {
      onDone();
      return;
    }
    refs.current.forEach((s, i) => {
      if (!s) return;
      const a = seeds[i]! * Math.PI * 2;
      const sp = 0.35 + seeds[i]! * 0.5;
      s.position.set(at.x + Math.cos(a) * t * sp, at.y + t * (0.8 + seeds[i]! * 0.5), at.z + Math.sin(a) * t * sp);
      const mat = s.material as THREE.SpriteMaterial;
      mat.opacity = Math.max(0, 1 - t / 0.9);
      s.scale.setScalar(0.07 * (1 - t * 0.5));
    });
  });
  return (
    <group>
      {seeds.map((_, i) => (
        <sprite
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          position={[at.x, at.y, at.z]}
        >
          <spriteMaterial
            map={tex}
            color={tone === 'heart' ? (i % 2 === 0 ? '#ff8fb3' : '#ff5f8a') : i % 3 === 0 ? '#FFE9A0' : '#b8ffd9'}
            transparent
            depthWrite={false}
            toneMapped={false}
          />
        </sprite>
      ))}
    </group>
  );
}

/** Watering rain — plays while the "Regá tu mundo" action animates. */
function Rain({ active, worldR = ISLAND_R }: { active: boolean; worldR?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const COUNT = 80;
  const drops = useMemo(() => {
    const rng = mulberry32(777);
    return Array.from({ length: COUNT }).map(() => {
      const a = rng() * Math.PI * 2;
      const r = Math.sqrt(rng()) * (worldR - 0.3);
      return { x: Math.cos(a) * r, z: Math.sin(a) * r, phase: rng() * 3, speed: 2.6 + rng() * 1.6 };
    });
  }, [worldR]);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    mesh.visible = active;
    if (!active) return;
    const t = clock.elapsedTime;
    drops.forEach((d, i) => {
      const y = 2.8 - ((t * d.speed + d.phase) % 3);
      dummy.position.set(d.x, y, d.z);
      dummy.scale.set(1, 1.8, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]} frustumCulled={false}>
      <sphereGeometry args={[0.016, 5, 5]} />
      <meshBasicMaterial color="#9fdcf2" transparent opacity={0.75} toneMapped={false} />
    </instancedMesh>
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
      const squash = 1 + Math.sin(t * 1.5 + Math.PI / 2) * 0.03;
      ref.current.scale.set(1 / squash, squash, 1 / squash);
    }
    if (eyes.current) {
      const blink = (t % 3.7) > 3.55 ? 0.12 : 1;
      eyes.current.scale.y = blink;
    }
  });
  const body = golden ? '#FFD27A' : '#9CC93B';
  return (
    <group>
      <group ref={ref} position={[0, 0.45, 0]}>
        {aura && (
          <mesh>
            <sphereGeometry args={[0.55, 16, 16]} />
            <meshBasicMaterial color={golden ? '#FFB23E' : '#1FB57A'} transparent opacity={0.12} />
          </mesh>
        )}
        <mesh castShadow>
          <sphereGeometry args={[0.32, 24, 24]} />
          <meshStandardMaterial color={body} roughness={0.6} />
        </mesh>
        <mesh position={[0.12, 0.34, 0]} rotation={[0, 0, -0.6]}>
          <coneGeometry args={[0.12, 0.3, 5]} />
          <meshStandardMaterial color={golden ? '#FFB23E' : '#1FB57A'} roughness={0.6} />
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
      <BlobShadow r={0.3} opacity={0.3} />
    </group>
  );
}

// ── Growth spiral ───────────────────────────────────────────────────────────

type GrowthKind = 'flower' | 'bush' | 'rock' | 'sapling' | 'tree';

interface GrowthItem {
  kind: GrowthKind;
  x: number;
  z: number;
  seed: number;
  index: number;
}

const GOLDEN_ANGLE = 2.399963;
const MAX_RENDERED = 110;
const MOUNTAIN_POS: [number, number][] = [
  [-2.15, -1.8],
  [-1.2, -2.55],
];

function growthItems(worldIndex: number, growth: number, goal: number, hasPond: boolean, hasMountain: boolean, maxR = ISLAND_R - 0.3): GrowthItem[] {
  const items: GrowthItem[] = [];
  const rendered = Math.min(growth, MAX_RENDERED);
  const step = growth > MAX_RENDERED ? growth / MAX_RENDERED : 1;
  for (let k = 0; k < rendered; k++) {
    const i = Math.floor(k * step);
    const rng = mulberry32(worldIndex * 100003 + i * 97 + 13);
    let angle = i * GOLDEN_ANGLE + rng() * 0.3;
    const radius = 0.85 + (maxR - 0.95) * Math.sqrt((i + 0.5) / goal);
    let x = Math.cos(angle) * radius;
    let z = Math.sin(angle) * radius;
    const blocked = () =>
      (hasPond && Math.hypot(x - POND_POS[0], z - POND_POS[1]) < POND_R + 0.28) ||
      (hasMountain && MOUNTAIN_POS.some(([mx, mz]) => Math.hypot(x - mx, z - mz) < 1.05));
    for (let tries = 0; tries < 3 && blocked(); tries++) {
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

function Scene({
  mundo,
  night,
  dayT,
  watering,
  onCare,
}: {
  mundo: MundoState;
  night: boolean;
  dayT: number;
  watering: boolean;
  onCare?: () => void;
}) {
  const biome = biomeFor(mundo.worldIndex ?? 1);
  const golden = mundo.palette === 'golden';
  const tint = (hex: string) => (golden ? `#${new THREE.Color(hex).lerp(new THREE.Color('#E8B54A'), 0.45).getHexString()}` : hex);
  const ground = tint(biome.ground);
  const grass = tint(biome.grass);
  const leaf = tint(biome.leaf);
  const leafDeep = tint(biome.leafDeep);
  const accent = tint(biome.accent);

  const worldIndex = mundo.worldIndex ?? 1;
  const growth = mundo.worldGrowth ?? 0;
  const goal = mundo.worldGoal ?? 40;
  const pct = goal > 0 ? growth / goal : 0;
  const showPond = biome.features.pond;
  const showMountain = worldIndex >= 2;

  // v6: the land itself grows with progression.
  const sizeF = worldSizeFactor(worldIndex, pct);
  const R = ISLAND_R * sizeF;

  const items = useMemo(
    () => growthItems(worldIndex, growth, goal, showPond, showMountain, R - 0.3),
    [worldIndex, growth, goal, showPond, showMountain, R],
  );

  const initialGrowth = useRef(growth);
  const newestIndex = growth > initialGrowth.current ? growth - 1 : -1;

  // Tuft count (each tuft ≈ 9 painted blades → reads as a continuous meadow).
  const grassCount = Math.round(1150 + mundo.liveliness * 650);
  const flowersPlaced = items.filter((it) => it.kind === 'flower').length;

  const sunAngle = dayT * Math.PI * 2;
  const sunPos = useMemo(
    () => new THREE.Vector3(Math.cos(sunAngle) * 5, Math.max(2, Math.sin(sunAngle) * 5 + 2.4), 3.2),
    [sunAngle],
  );

  // Tap sparkles + care hearts.
  const [bursts, setBursts] = useState<{ id: number; at: THREE.Vector3; tone: 'spark' | 'heart' }[]>([]);
  const burstId = useRef(0);
  function onTap(e: ThreeEvent<PointerEvent>) {
    e.stopPropagation();
    const id = ++burstId.current;
    setBursts((b) => [...b.slice(-3), { id, at: e.point.clone(), tone: 'spark' }]);
  }
  function onCareTap(e: ThreeEvent<PointerEvent>) {
    e.stopPropagation();
    const id = ++burstId.current;
    setBursts((b) => [...b.slice(-3), { id, at: e.point.clone(), tone: 'heart' }]);
    onCare?.();
  }

  // Night is MOONLIT, never a black blob: cool tint but everything readable.
  const horizon = night ? '#31514a' : biome.skyHorizon;

  return (
    <>
      <fog attach="fog" args={[horizon, 11, 22]} />
      <SkyDome top={night ? '#17335c' : biome.skyTop} horizon={horizon} sunDir={sunPos} night={night} />
      <SunSprite pos={[sunPos.x * 1.6, sunPos.y * 1.6, sunPos.z * 1.6]} night={night} />

      <ambientLight intensity={night ? 0.62 : 0.55} color={night ? '#b8cbe8' : '#fff6e8'} />
      <directionalLight
        castShadow
        position={sunPos.toArray()}
        intensity={night ? 0.7 : 1.5}
        color={night ? '#cfdcf5' : '#ffedc9'}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-camera-near={1}
        shadow-camera-far={18}
        shadow-camera-left={-5.5}
        shadow-camera-right={5.5}
        shadow-camera-top={5.5}
        shadow-camera-bottom={-5.5}
      />
      <directionalLight position={[-sunPos.x, 3, -sunPos.z]} intensity={night ? 0.18 : 0.24} color={night ? '#41598a' : '#bfe0ff'} />
      <hemisphereLight intensity={night ? 0.42 : 0.55} color={night ? '#3c5580' : biome.skyTop} groundColor={ground} />

      {/* Tap target: invisible disc over the island. */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} onPointerDown={onTap} visible={false}>
        <circleGeometry args={[R + 0.1, 24]} />
        <meshBasicMaterial />
      </mesh>

      <Island ground={ground} night={night} R={R} />
      <GrassField count={grassCount} color={grass} liveliness={mundo.liveliness} boundary={R - 0.18} />
      <GroundCover ground={ground} leafDeep={leafDeep} />
      <ConiferForest leafDeep={leafDeep} pct={pct} worldIndex={worldIndex} snow={biome.features.snow} ringR={R * 0.93} />

      <group scale={0.78}>
        <Float speed={2} rotationIntensity={0} floatIntensity={0.2}>
          <Pip3D golden={golden} aura={mundo.unlockedCosmetics.includes('guardian_aura')} />
        </Float>
      </group>

      {/* Terrain features */}
      {showMountain && <Mountain position={[MOUNTAIN_POS[0]![0]!, 0, MOUNTAIN_POS[0]![1]!]} seed={41} snow={biome.features.snow || worldIndex >= 5} />}
      {worldIndex >= 4 && <Mountain position={[MOUNTAIN_POS[1]![0]!, 0, MOUNTAIN_POS[1]![1]!]} scale={0.65} seed={43} snow={biome.features.snow || worldIndex >= 6} />}
      {showPond && (
        <>
          <Pond color={tint(biome.water)} />
          <Waterfall color={tint(biome.water)} R={R} />
          <Bridge R={R} />
          <Duck seed={81} />
          {growth >= 8 && <Duck seed={82} />}
          {growth >= 12 && <Deer position={[POND_POS[0] - 1.15, 0, POND_POS[1] + 0.55]} rotY={0.7} seed={71} />}
          {growth >= 24 && <Deer position={[POND_POS[0] - 0.7, 0, POND_POS[1] + 1.15]} rotY={-0.4} seed={72} />}
          {worldIndex >= 3 && <Kayak accent={accent} />}
        </>
      )}
      {/* Second lake from world 4 — more water as the world grows. */}
      {worldIndex >= 4 && <Pond color={tint(biome.water)} center={[-1.85, 1.5]} r={0.55} lilies={false} />}
      {/* Rabbits from world 2 — more life as the world grows. */}
      {worldIndex >= 2 && <Rabbit a={[-0.9, 1.6]} b={[0.7, 2.1]} seed={61} />}
      {worldIndex >= 3 && growth >= 10 && <Rabbit a={[1.9, 0.6]} b={[0.9, 1.6]} seed={62} />}
      <DirtPath />
      <Stump position={[0.95, 0, 1.95]} />
      <FallenLog position={[-2.0, 0, 0.7]} rotY={0.9} />
      {growth >= 6 && <Mushrooms position={[1.5, 0, 1.1]} />}
      {growth >= 14 && <Mushrooms position={[-0.7, 0, -1.4]} />}
      {pct >= 0.5 && (
        <>
          <Cabin position={[-0.4, 0, -2.3]} />
          <Fence position={[-1.15, 0, -1.95]} rotY={0.35} />
        </>
      )}
      {biome.features.palms && (
        <>
          <Palm position={[-2.2, 0, 1.35]} leaf={leaf} seed={21} />
          <Palm position={[2.45, 0, 0.8]} leaf={leaf} seed={22} />
        </>
      )}
      {biome.features.dunes && (
        <>
          <Dune position={[-1.7, 0.02, -1.7]} ground={ground} seed={31} />
          <Dune position={[0.85, 0.02, 2.2]} ground={ground} seed={32} />
        </>
      )}

      {/* Growth: one element per completion. Trees/bushes accept care taps. */}
      {items.map((it) => {
        const pos: [number, number, number] = [it.x, 0, it.z];
        const careable = it.kind === 'tree' || it.kind === 'bush' || it.kind === 'sapling';
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
            <Tree position={pos} scale={1.15 + (it.seed % 5) * 0.09} leaf={leaf} leafDeep={leafDeep} seed={it.seed} snow={biome.features.snow} />
          );
        return (
          <PopIn key={`${worldIndex}-${it.index}`} active={it.index === newestIndex}>
            {careable ? <group onPointerDown={onCareTap}>{el}</group> : el}
          </PopIn>
        );
      })}

      {pct >= 0.6 && <Campfire position={[-1.35, 0, -0.8]} />}

      {/* Fauna & atmosphere */}
      <CloudPuffs night={night} />
      {worldIndex >= 2 && <Bird seed={11} />}
      {worldIndex >= 4 && <Bird seed={12} />}
      {flowersPlaced >= 5 && !night && [0, 1, 2].map((i) => <Butterfly key={i} seed={i + 7} accent={accent} />)}
      {night && <Fireflies count={10} />}

      {/* FX */}
      <Rain active={watering} worldR={R} />
      {bursts.map((b) => (
        <SparkleBurst key={b.id} at={b.at} tone={b.tone} onDone={() => setBursts((all) => all.filter((x) => x.id !== b.id))} />
      ))}

      <ContactShadows position={[0, 0.005, 0]} opacity={0.35} scale={R * 3.1} blur={2.4} far={3.6} />
      {/* Free videogame-style camera: orbit + pan + zoom (gently clamped). */}
      <OrbitControls
        enablePan
        panSpeed={0.7}
        enableZoom
        minDistance={3.4}
        maxDistance={13}
        autoRotate
        autoRotateSpeed={0.35}
        enableDamping
        dampingFactor={0.08}
        minPolarAngle={Math.PI * 0.16}
        maxPolarAngle={Math.PI * 0.49}
        target={[0, 0.5, 0]}
      />
    </>
  );
}

export default function MundoCanvas({
  mundo,
  night,
  dayT,
  watering = false,
  onCare,
}: {
  mundo: MundoState;
  night: boolean;
  dayT: number;
  watering?: boolean;
  /** Called when the user taps a tree/bush (care touch — server grants slow growth). */
  onCare?: () => void;
}) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 3.3, 8.6], fov: 35 }}
      // preserveDrawingBuffer → the world can be captured for share cards.
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: true }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.14;
      }}
    >
      <Scene mundo={mundo} night={night} dayT={dayT} watering={watering} onCare={onCare} />
      {/* AO fuses separate meshes into ONE cohesive scene (contact darkening),
          bloom lifts fire/fireflies/sun. */}
      <EffectComposer multisampling={0}>
        <N8AO aoRadius={0.6} intensity={3.5} distanceFalloff={0.8} quality="performance" halfRes />
        <Bloom intensity={0.22} luminanceThreshold={0.82} mipmapBlur />
      </EffectComposer>
    </Canvas>
  );
}
