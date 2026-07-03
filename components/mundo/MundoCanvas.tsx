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
      <sphereGeometry args={[11, 24, 16]} />
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

function Island({ ground, night }: { ground: string; night: boolean }) {
  const capTex = useMemo(() => grassFieldTexture(), []);
  const rockTex = useMemo(() => rockTexture(), []);
  const sideGeo = useMemo(() => {
    const geo = new THREE.CylinderGeometry(2.42, 2.52, 0.36, 48, 1, true);
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
  }, []);
  const soilGeo = useMemo(() => blobGeometry(1, 1, 0.18, 7), []);

  return (
    <group>
      {/* Grass cap with radial lush→dirt texture. */}
      <mesh receiveShadow position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.44, 48]} />
        <meshStandardMaterial map={capTex} bumpMap={capTex} bumpScale={0.035} color={ground} roughness={0.95} />
      </mesh>
      {/* Gentle interior mounds for relief. */}
      {[
        [-0.9, -0.35, 0.55],
        [0.7, 0.9, 0.45],
        [-0.2, 1.3, 0.38],
      ].map(([x, z, r], i) => (
        <mesh key={i} receiveShadow geometry={blobGeometry(1, 1, 0.12, 90 + i)} position={[x!, -0.02, z!]} scale={[r!, r! * 0.22, r!]}>
          <meshStandardMaterial map={capTex} bumpMap={capTex} bumpScale={0.03} color={ground} roughness={0.95} />
        </mesh>
      ))}
      {/* Dirt side wall + soil mass below. */}
      <mesh geometry={sideGeo} position={[0, -0.17, 0]}>
        <meshStandardMaterial map={rockTex} bumpMap={rockTex} bumpScale={0.05} color="#7a5a39" roughness={1} />
      </mesh>
      <mesh geometry={soilGeo} position={[0, -0.98, 0]} scale={[2.35, 1.05, 2.35]}>
        <meshStandardMaterial map={rockTex} bumpMap={rockTex} bumpScale={0.06} color="#6e4f33" roughness={1} />
      </mesh>
      <mesh geometry={soilGeo} position={[0.2, -1.8, -0.1]} scale={[1.15, 0.75, 1.15]}>
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
    const g = new THREE.ConeGeometry(0.8, 1.45, 8, 4);
    const rng = mulberry32(seed);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      if (v.y < 0.6) {
        pos.setX(i, v.x * (1 + (rng() - 0.5) * 0.4));
        pos.setZ(i, v.z * (1 + (rng() - 0.5) * 0.4));
        pos.setY(i, v.y + (rng() - 0.5) * 0.1);
      }
    }
    g.computeVertexNormals();
    return g;
  }, [seed]);
  return (
    <group position={position} scale={scale}>
      <mesh castShadow receiveShadow geometry={geo} position={[0, 0.72, 0]}>
        <meshStandardMaterial map={tex} bumpMap={tex} bumpScale={0.08} color="#8d8175" roughness={1} flatShading />
      </mesh>
      {snow && (
        <mesh geometry={blobGeometry(0.3, 1, 0.3, seed + 5)} position={[0, 1.28, 0]} scale={[1, 0.55, 1]}>
          <meshStandardMaterial color="#f4f8fa" roughness={0.6} />
        </mesh>
      )}
      <BlobShadow r={0.85 * scale} opacity={0.3} />
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

const POND_POS: [number, number] = [1.18, -0.92];

function Pond({ color }: { color: string }) {
  const { matRef, uniforms } = usePondShader(color);
  return (
    <group position={[POND_POS[0], 0.02, POND_POS[1]]}>
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
              vec2 c = vUv - 0.5;
              float d = length(c);
              float rip = sin(d * 44.0 - uTime * 2.6) * 0.5 + 0.5;
              float rip2 = sin(d * 21.0 - uTime * 1.4 + 1.7) * 0.5 + 0.5;
              float glint = pow(max(sin(c.x * 30.0 + uTime * 1.8) * sin(c.y * 26.0 - uTime * 1.2), 0.0), 3.0);
              vec3 deep = uColor * 0.55;
              vec3 shallow = uColor * 1.5;
              vec3 col = mix(shallow, deep, clamp(d * 1.6 + rip * 0.25, 0.0, 1.0));
              col += vec3(1.0) * (rip2 * 0.06 + glint * 0.25);
              float edge = smoothstep(0.5, 0.36, d);
              float foam = smoothstep(0.46, 0.5, d) * (0.5 + 0.5 * sin(uTime * 2.0 + d * 40.0));
              col = mix(col, vec3(0.95), foam * 0.5);
              gl_FragColor = vec4(col, edge * 0.94);
            }`}
        />
      </mesh>
      {[0, 1].map((i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, i * 2.1]} position={[i === 0 ? 0.24 : -0.26, 0.006, i === 0 ? -0.12 : 0.18]}>
          <circleGeometry args={[0.07, 8]} />
          <meshStandardMaterial color="#3f9e63" roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

/** River from the pond over the rim + waterfall down the island side + mist. */
function Waterfall({ color }: { color: string }) {
  const dir = useMemo(() => {
    const v = new THREE.Vector2(POND_POS[0], POND_POS[1]).normalize();
    return v;
  }, []);
  const angle = Math.atan2(dir.y, dir.x);
  const start = 1.42; // just past the pond edge along dir
  const end = 2.46; // island rim
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
      const r = 0.34;
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

/** Curved grass blade geometry (base at y=0, unit height, vertex-darkened base). */
const bladeGeo = (() => {
  let cached: THREE.BufferGeometry | null = null;
  return () => {
    if (cached) return cached;
    const g = new THREE.PlaneGeometry(0.05, 1, 1, 4);
    g.translate(0, 0.5, 0);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const colors: number[] = [];
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      pos.setX(i, pos.getX(i) * (1 - y * 0.7)); // taper to a point
      pos.setZ(i, y * y * 0.22); // bend
      const shade = 0.5 + y * 0.55;
      colors.push(shade, shade, shade);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    g.computeVertexNormals();
    cached = g;
    return cached;
  };
})();

function GrassField({ count, color, liveliness }: { count: number; color: string; liveliness: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const shaderRef = useRef<{ uniforms: { uTime: { value: number } } } | null>(null);

  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.9 });
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = { value: 0 };
      shader.vertexShader = `uniform float uTime;\n${shader.vertexShader}`.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        {
          float hf = position.y; // 0 at base → 1 at tip
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
    const clusters = Array.from({ length: 14 }).map(() => {
      const a = rng() * Math.PI * 2;
      const r = Math.sqrt(rng()) * 1.9;
      return { x: Math.cos(a) * r, z: Math.sin(a) * r };
    });
    for (let i = 0; i < count; i++) {
      const cl = clusters[i % clusters.length]!;
      const a = rng() * Math.PI * 2;
      const rr = rng() * rng() * 0.55;
      const x = cl.x + Math.cos(a) * rr;
      const z = cl.z + Math.sin(a) * rr;
      if (Math.hypot(x, z) > 2.25) continue;
      const h = 0.16 + rng() * 0.2;
      dummy.position.set(x, 0, z);
      dummy.scale.set(0.8 + rng() * 0.5, h, 0.8 + rng() * 0.5);
      dummy.rotation.y = rng() * Math.PI;
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      c.copy(vary(color, rng, 0.03, 0.12, 0.14));
      mesh.setColorAt(i, c);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [count, color]);

  useFrame(({ clock }) => {
    if (shaderRef.current) shaderRef.current.uniforms.uTime.value = clock.elapsedTime * (0.6 + liveliness * 0.7);
  });

  return <instancedMesh ref={meshRef} args={[bladeGeo(), material, count]} frustumCulled={false} />;
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
    const n = 4 + Math.floor(rng() * 3);
    return Array.from({ length: n }).map((_, i) => ({
      x: (rng() - 0.5) * 0.56,
      y: 0.85 + rng() * 0.5,
      z: (rng() - 0.5) * 0.56,
      r: 0.26 + rng() * 0.28,
      deep: i % 2 === 1,
      geoSeed: seed * 7 + i,
    }));
  }, [rng, seed]);

  return (
    <SwayGroup position={position} scale={scale} phase={seed % 7} amp={0.016} speed={0.85}>
      <Trunk h={0.8} seed={seed} />
      {blobs.map((b, i) => (
        <mesh key={i} castShadow geometry={blobGeometry(b.r, 2, 0.2, b.geoSeed)} position={[b.x, b.y, b.z]} material={b.deep ? matB : matA} />
      ))}
      {snow && (
        <mesh geometry={blobGeometry(0.32, 1, 0.25, seed + 999)} position={[0, 1.42, 0]} scale={[1, 0.45, 1]}>
          <meshStandardMaterial color="#f2f6f8" roughness={0.7} />
        </mesh>
      )}
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
  const p = useMemo(() => ({ r: 1.6 + rng() * 0.6, h: 1.7 + rng() * 0.5, sp: 0.32 + rng() * 0.18, ph: rng() * 6 }), [rng]);
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
function SparkleBurst({ at, onDone }: { at: THREE.Vector3; onDone: () => void }) {
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
          <spriteMaterial map={tex} color={i % 3 === 0 ? '#FFE9A0' : '#b8ffd9'} transparent depthWrite={false} toneMapped={false} />
        </sprite>
      ))}
    </group>
  );
}

/** Watering rain — plays while the "Regá tu mundo" action animates. */
function Rain({ active }: { active: boolean }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const COUNT = 80;
  const drops = useMemo(() => {
    const rng = mulberry32(777);
    return Array.from({ length: COUNT }).map(() => {
      const a = rng() * Math.PI * 2;
      const r = Math.sqrt(rng()) * 2.1;
      return { x: Math.cos(a) * r, z: Math.sin(a) * r, phase: rng() * 3, speed: 2.6 + rng() * 1.6 };
    });
  }, []);
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
  [-1.5, -1.25],
  [-0.85, -1.8],
];

function growthItems(worldIndex: number, growth: number, goal: number, hasPond: boolean, hasMountain: boolean): GrowthItem[] {
  const items: GrowthItem[] = [];
  const rendered = Math.min(growth, MAX_RENDERED);
  const step = growth > MAX_RENDERED ? growth / MAX_RENDERED : 1;
  for (let k = 0; k < rendered; k++) {
    const i = Math.floor(k * step);
    const rng = mulberry32(worldIndex * 100003 + i * 97 + 13);
    let angle = i * GOLDEN_ANGLE + rng() * 0.3;
    const radius = 0.62 + 1.5 * Math.sqrt((i + 0.5) / goal);
    let x = Math.cos(angle) * radius;
    let z = Math.sin(angle) * radius;
    const blocked = () =>
      (hasPond && Math.hypot(x - POND_POS[0], z - POND_POS[1]) < 0.85) ||
      (hasMountain && MOUNTAIN_POS.some(([mx, mz]) => Math.hypot(x - mx, z - mz) < 0.8));
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

function Scene({ mundo, night, dayT, watering }: { mundo: MundoState; night: boolean; dayT: number; watering: boolean }) {
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

  const items = useMemo(
    () => growthItems(worldIndex, growth, goal, showPond, showMountain),
    [worldIndex, growth, goal, showPond, showMountain],
  );

  const initialGrowth = useRef(growth);
  const newestIndex = growth > initialGrowth.current ? growth - 1 : -1;

  const grassCount = Math.round(240 + mundo.liveliness * 220);
  const flowersPlaced = items.filter((it) => it.kind === 'flower').length;

  const sunAngle = dayT * Math.PI * 2;
  const sunPos = useMemo(
    () => new THREE.Vector3(Math.cos(sunAngle) * 5, Math.max(2, Math.sin(sunAngle) * 5 + 2.4), 3.2),
    [sunAngle],
  );

  // Tap sparkles.
  const [bursts, setBursts] = useState<{ id: number; at: THREE.Vector3 }[]>([]);
  const burstId = useRef(0);
  function onTap(e: ThreeEvent<PointerEvent>) {
    e.stopPropagation();
    const id = ++burstId.current;
    setBursts((b) => [...b.slice(-3), { id, at: e.point.clone() }]);
  }

  const horizon = night ? '#16261D' : biome.skyHorizon;

  return (
    <>
      <fog attach="fog" args={[horizon, 8.5, 15]} />
      <SkyDome top={night ? '#0b1f3a' : biome.skyTop} horizon={horizon} sunDir={sunPos} night={night} />
      <SunSprite pos={[sunPos.x * 1.6, sunPos.y * 1.6, sunPos.z * 1.6]} night={night} />

      <ambientLight intensity={night ? 0.38 : 0.5} color={night ? '#9fb0d6' : '#fff6e8'} />
      <directionalLight
        castShadow
        position={sunPos.toArray()}
        intensity={night ? 0.25 : 1.45}
        color={night ? '#aebfe0' : '#ffedc9'}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-camera-near={1}
        shadow-camera-far={14}
        shadow-camera-left={-4.5}
        shadow-camera-right={4.5}
        shadow-camera-top={4.5}
        shadow-camera-bottom={-4.5}
      />
      <directionalLight position={[-sunPos.x, 2.4, -sunPos.z]} intensity={night ? 0.08 : 0.22} color={night ? '#31456e' : '#bfe0ff'} />
      <hemisphereLight intensity={night ? 0.26 : 0.5} color={night ? '#2a3a5a' : biome.skyTop} groundColor={ground} />

      {/* Tap target: invisible disc over the island. */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} onPointerDown={onTap} visible={false}>
        <circleGeometry args={[2.5, 24]} />
        <meshBasicMaterial />
      </mesh>

      <Island ground={ground} night={night} />
      <GrassField count={grassCount} color={grass} liveliness={mundo.liveliness} />

      <Float speed={2} rotationIntensity={0} floatIntensity={0.2}>
        <Pip3D golden={golden} aura={mundo.unlockedCosmetics.includes('guardian_aura')} />
      </Float>

      {/* Terrain features */}
      {showMountain && <Mountain position={[MOUNTAIN_POS[0]![0]!, 0, MOUNTAIN_POS[0]![1]!]} seed={41} snow={biome.features.snow || worldIndex >= 5} />}
      {worldIndex >= 4 && <Mountain position={[MOUNTAIN_POS[1]![0]!, 0, MOUNTAIN_POS[1]![1]!]} scale={0.65} seed={43} snow={biome.features.snow || worldIndex >= 6} />}
      {showPond && (
        <>
          <Pond color={tint(biome.water)} />
          <Waterfall color={tint(biome.water)} />
          {worldIndex >= 3 && <Kayak accent={accent} />}
        </>
      )}
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

      {/* Growth: one element per completion */}
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
          <PopIn key={`${worldIndex}-${it.index}`} active={it.index === newestIndex}>
            {el}
          </PopIn>
        );
      })}

      {pct >= 0.6 && <Campfire position={[-0.95, 0, -0.55]} />}

      {/* Fauna & atmosphere */}
      <CloudPuffs night={night} />
      {worldIndex >= 2 && <Bird seed={11} />}
      {worldIndex >= 4 && <Bird seed={12} />}
      {flowersPlaced >= 5 && !night && [0, 1, 2].map((i) => <Butterfly key={i} seed={i + 7} accent={accent} />)}
      {night && <Fireflies count={10} />}

      {/* FX */}
      <Rain active={watering} />
      {bursts.map((b) => (
        <SparkleBurst key={b.id} at={b.at} onDone={() => setBursts((all) => all.filter((x) => x.id !== b.id))} />
      ))}

      <ContactShadows position={[0, 0.005, 0]} opacity={0.35} scale={7.5} blur={2.4} far={3.2} />
      <OrbitControls
        enablePan={false}
        enableZoom
        minDistance={4.2}
        maxDistance={8.5}
        autoRotate
        autoRotateSpeed={0.4}
        minPolarAngle={Math.PI * 0.24}
        maxPolarAngle={Math.PI * 0.47}
        target={[0, 0.45, 0]}
      />
    </>
  );
}

export default function MundoCanvas({
  mundo,
  night,
  dayT,
  watering = false,
}: {
  mundo: MundoState;
  night: boolean;
  dayT: number;
  watering?: boolean;
}) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 2.5, 6.2], fov: 34 }}
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.08;
      }}
    >
      <Scene mundo={mundo} night={night} dayT={dayT} watering={watering} />
    </Canvas>
  );
}
