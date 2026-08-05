'use client';

/**
 * "Tu Mundo" v7 — a real miniature landscape.
 *
 * Everything is driven by one heightmap (lib/mundo/terrain.ts): the ground
 * mesh, where lakes and rivers sit, and where every plant, rock and animal is
 * placed. Nothing floats, nothing intersects, and water lives inside carved
 * basins with visible depth. Vegetation is grown procedurally with real
 * branching (components/mundo/Vegetation.tsx).
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Float } from '@react-three/drei';
import { EffectComposer, N8AO, Bloom, DepthOfField, Vignette, HueSaturation } from '@react-three/postprocessing';
import * as THREE from 'three';
import { biomeFor, type MundoState } from '@/lib/mundo';
import {
  WATER_LEVEL,
  makeLayout,
  slopeAt,
  snapToLand,
  terrainHeight,
  terrainNormal,
  type WorldLayout,
} from '@/lib/mundo/terrain';
import { Ground, IslandBody, AllWater, type TerrainColors } from './Terrain';
import { Vegetation, type PlantInstance, type Species } from './Vegetation';
import { Reeds, LilyPads, Undergrowth, DeadWood, Footpath, Pollen } from './Details';

// ── Helpers ─────────────────────────────────────────────────────────────────

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

/** Grass tuft: hand-painted blades with alpha, so a tuft reads as many blades. */
function grassTuftTexture(): THREE.CanvasTexture {
  return makeTexture('grassTuft7', 128, (ctx, s, rng) => {
    ctx.clearRect(0, 0, s, s);
    ctx.lineCap = 'round';
    for (let i = 0; i < 11; i++) {
      const baseX = s * 0.5 + (rng() - 0.5) * s * 0.44;
      const tipX = baseX + (rng() - 0.5) * s * 0.52;
      const tipY = s * (0.03 + rng() * 0.3);
      const midX = (baseX + tipX) / 2 + (rng() - 0.5) * s * 0.16;
      const grad = ctx.createLinearGradient(0, s, 0, tipY);
      grad.addColorStop(0, 'rgba(96,108,86,0.95)');
      grad.addColorStop(0.55, 'rgba(178,192,158,0.95)');
      grad.addColorStop(1, 'rgba(238,244,214,0.92)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2.2 + rng() * 2.2;
      ctx.beginPath();
      ctx.moveTo(baseX, s);
      ctx.quadraticCurveTo(midX, s * 0.5, tipX, tipY);
      ctx.stroke();
    }
  });
}

function rockTexture(): THREE.CanvasTexture {
  return makeTexture(
    'rock7',
    256,
    (ctx, s, rng) => {
      ctx.fillStyle = 'rgb(200,200,200)';
      ctx.fillRect(0, 0, s, s);
      for (let i = 0; i < 1500; i++) {
        const v = Math.round(200 + (rng() - 0.5) * 60);
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        ctx.beginPath();
        ctx.arc(rng() * s, rng() * s, 1 + rng() * 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
      for (let i = 0; i < 24; i++) {
        const v = Math.round(140 + rng() * 50);
        ctx.strokeStyle = `rgba(${v},${v},${v},0.6)`;
        ctx.lineWidth = 0.8 + rng() * 1.5;
        ctx.beginPath();
        let x = rng() * s;
        let y = rng() * s;
        ctx.moveTo(x, y);
        for (let j = 0; j < 5; j++) {
          x += (rng() - 0.5) * 62;
          y += (rng() - 0.5) * 62;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    },
    [1.4, 1.4],
  );
}

// ── Ground detail: grass and scatter, terrain-aware ─────────────────────────

/** Crossed-quad tuft geometry. */
const tuftGeo = (() => {
  let cached: THREE.BufferGeometry | null = null;
  return () => {
    if (cached) return cached;
    const a = new THREE.PlaneGeometry(0.26, 0.2);
    a.translate(0, 0.1, 0);
    const b = a.clone();
    b.rotateY(Math.PI / 2);
    const g = new THREE.BufferGeometry();
    const pa = a.attributes.position!.array as Float32Array;
    const pb = b.attributes.position!.array as Float32Array;
    const ua = a.attributes.uv!.array as Float32Array;
    const ub = b.attributes.uv!.array as Float32Array;
    const na = a.attributes.normal!.array as Float32Array;
    const nb = b.attributes.normal!.array as Float32Array;
    const ia = Array.from(a.index!.array);
    const ib = Array.from(b.index!.array).map((i) => i + pa.length / 3);
    g.setAttribute('position', new THREE.Float32BufferAttribute([...pa, ...pb], 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute([...ua, ...ub], 2));
    g.setAttribute('normal', new THREE.Float32BufferAttribute([...na, ...nb], 3));
    g.setIndex([...ia, ...ib]);
    a.dispose();
    b.dispose();
    cached = g;
    return cached;
  };
})();

function GrassCover({
  layout,
  count,
  color,
  colorDry,
  wind,
}: {
  layout: WorldLayout;
  count: number;
  color: string;
  colorDry: string;
  wind: number;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const shaderRef = useRef<{ uniforms: { uTime: { value: number }; uWind: { value: number } } } | null>(null);

  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      map: grassTuftTexture(),
      alphaTest: 0.4,
      side: THREE.DoubleSide,
      roughness: 0.94,
      vertexColors: true,
    });
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = { value: 0 };
      shader.uniforms.uWind = { value: wind };
      shader.vertexShader = `uniform float uTime; uniform float uWind;\n${shader.vertexShader}`.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         {
           float hf = clamp(position.y / 0.2, 0.0, 1.0);
           vec3 ip = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
           float gust = sin(uTime * 0.6 + ip.x * 0.45 + ip.z * 0.4) * 0.5 + 0.5;
           float s = sin(uTime * 2.0 + ip.x * 2.2 + ip.z * 1.7) * (0.5 + gust * 0.5)
                   + sin(uTime * 3.4 + ip.z * 3.0) * 0.28;
           transformed.x += s * 0.05 * uWind * hf * hf;
           transformed.z += s * 0.032 * uWind * hf * hf;
         }`,
      );
      shaderRef.current = shader as never;
    };
    mat.customProgramCacheKey = () => 'v7-grass';
    return mat;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const rng = mulberry32(4242 + layout.seed);
    const dummy = new THREE.Object3D();
    const c = new THREE.Color();
    const cA = new THREE.Color(color);
    const cB = new THREE.Color(colorDry);
    let placed = 0;
    let guard = 0;
    while (placed < count && guard++ < count * 6) {
      const a = rng() * Math.PI * 2;
      const r = Math.sqrt(rng()) * (layout.R - 0.2);
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      const h = terrainHeight(x, z, layout);
      if (h < WATER_LEVEL + 0.05) continue; // never in the water
      if (slopeAt(x, z, layout) > 0.5) continue; // not on cliffs
      const n = terrainNormal(x, z, layout);
      dummy.position.set(x, h - 0.01, z);
      dummy.rotation.set(Math.atan2(n[2], 1) * 0.5, rng() * Math.PI, -Math.atan2(n[0], 1) * 0.5);
      const s = 0.7 + rng() * 0.8;
      dummy.scale.set(s, 0.75 + rng() * 0.8, s);
      dummy.updateMatrix();
      mesh.setMatrixAt(placed, dummy.matrix);
      // Greener in hollows, drier on high ground.
      c.copy(cA).lerp(cB, THREE.MathUtils.clamp(h * 1.5, 0, 1));
      c.copy(vary(`#${c.getHexString()}`, rng, 0.03, 0.12, 0.13));
      mesh.setColorAt(placed, c);
      placed++;
    }
    mesh.count = placed;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [layout, count, color, colorDry]);

  useFrame(({ clock }) => {
    if (shaderRef.current) {
      shaderRef.current.uniforms.uTime.value = clock.elapsedTime;
      shaderRef.current.uniforms.uWind.value = wind;
    }
  });

  return <instancedMesh ref={meshRef} args={[tuftGeo(), material, count]} frustumCulled={false} />;
}

/** Rocks and pebbles, sized by where they land (big ones on slopes). */
function Rocks({ layout, count, snow }: { layout: WorldLayout; count: number; snow: boolean }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const tex = useMemo(() => rockTexture(), []);
  const geo = useMemo(() => blobGeometry(1, 1, 0.34, 501), []);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const rng = mulberry32(909 + layout.seed);
    const dummy = new THREE.Object3D();
    const c = new THREE.Color();
    let placed = 0;
    let guard = 0;
    while (placed < count && guard++ < count * 6) {
      const a = rng() * Math.PI * 2;
      const r = Math.sqrt(rng()) * (layout.R - 0.15);
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      const h = terrainHeight(x, z, layout);
      if (h < WATER_LEVEL - 0.05) continue;
      const slope = slopeAt(x, z, layout);
      // Rocks cluster on slopes and shorelines, where erosion exposes them.
      const wantsRock = slope > 0.2 || Math.abs(h - WATER_LEVEL) < 0.09;
      if (!wantsRock && rng() > 0.25) continue;
      const n = terrainNormal(x, z, layout);
      const s = (0.05 + rng() * 0.13) * (slope > 0.3 ? 1.5 : 1);
      dummy.position.set(x, h + s * 0.32, z);
      dummy.rotation.set(rng() * 3, rng() * 3, rng() * 3);
      dummy.scale.set(s * (0.8 + rng() * 0.5), s * (0.6 + rng() * 0.4), s * (0.8 + rng() * 0.5));
      dummy.updateMatrix();
      mesh.setMatrixAt(placed, dummy.matrix);
      c.copy(vary(snow && h > 0.7 ? '#e8eef0' : '#9a9186', rng, 0.02, 0.06, 0.16));
      mesh.setColorAt(placed, c);
      void n;
      placed++;
    }
    mesh.count = placed;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [layout, count, snow]);

  return (
    <instancedMesh ref={meshRef} args={[geo, undefined, count]} castShadow receiveShadow frustumCulled={false}>
      <meshStandardMaterial map={tex} vertexColors roughness={1} flatShading />
    </instancedMesh>
  );
}

/** Wildflowers: a stem plus a few petals, scattered on gentle ground. */
function Flowers({ layout, count, accent }: { layout: WorldLayout; count: number; accent: string }) {
  const stemRef = useRef<THREE.InstancedMesh>(null);
  const headRef = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    const stems = stemRef.current;
    const heads = headRef.current;
    if (!stems || !heads) return;
    const rng = mulberry32(313 + layout.seed);
    const dummy = new THREE.Object3D();
    const c = new THREE.Color();
    const base = new THREE.Color(accent);
    let placed = 0;
    let guard = 0;
    while (placed < count && guard++ < count * 8) {
      const a = rng() * Math.PI * 2;
      const r = Math.sqrt(rng()) * (layout.R - 0.3);
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      const h = terrainHeight(x, z, layout);
      if (h < WATER_LEVEL + 0.06 || slopeAt(x, z, layout) > 0.35) continue;
      const s = 0.75 + rng() * 0.5;
      dummy.position.set(x, h + 0.05 * s, z);
      dummy.rotation.set((rng() - 0.5) * 0.3, rng() * 3, (rng() - 0.5) * 0.3);
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      stems.setMatrixAt(placed, dummy.matrix);
      dummy.position.set(x, h + 0.105 * s, z);
      dummy.updateMatrix();
      heads.setMatrixAt(placed, dummy.matrix);
      c.copy(base);
      const hsl = { h: 0, s: 0, l: 0 };
      c.getHSL(hsl);
      // A meadow has several flower colours, not one.
      c.setHSL((hsl.h + (rng() < 0.4 ? 0.12 : 0) + (rng() - 0.5) * 0.06 + 1) % 1, hsl.s, hsl.l + (rng() - 0.5) * 0.16);
      heads.setColorAt(placed, c);
      placed++;
    }
    stems.count = placed;
    heads.count = placed;
    stems.instanceMatrix.needsUpdate = true;
    heads.instanceMatrix.needsUpdate = true;
    if (heads.instanceColor) heads.instanceColor.needsUpdate = true;
  }, [layout, count, accent]);

  return (
    <group>
      <instancedMesh ref={stemRef} args={[undefined, undefined, count]} frustumCulled={false}>
        <cylinderGeometry args={[0.006, 0.008, 0.1, 4]} />
        <meshStandardMaterial color="#4a7a3e" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={headRef} args={[undefined, undefined, count]} castShadow frustumCulled={false}>
        <sphereGeometry args={[0.028, 7, 5]} />
        <meshStandardMaterial vertexColors roughness={0.6} />
      </instancedMesh>
    </group>
  );
}

// ── Waterfall where the river leaves the island ─────────────────────────────

function Waterfall({ layout, color }: { layout: WorldLayout; color: string }) {
  const river = layout.rivers[0];
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const mistTex = useMemo(() => softDiscTexture(), []);
  const mists = useRef<(THREE.Sprite | null)[]>([]);

  const geom = useMemo(() => {
    if (!river) return null;
    const dir = new THREE.Vector2(river.to[0], river.to[1]).normalize();
    const edgeX = dir.x * layout.R;
    const edgeZ = dir.y * layout.R;
    const topY = terrainHeight(edgeX * 0.985, edgeZ * 0.985, layout);
    return { dir, edgeX, edgeZ, topY, angle: Math.atan2(dir.y, dir.x) };
  }, [layout, river]);

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
    mists.current.forEach((m, i) => {
      if (!m || !geom) return;
      const t = (clock.elapsedTime * 0.7 + i * 0.9) % 2;
      m.position.y = geom.topY - 1.5 + (t / 2) * 0.7;
      (m.material as THREE.SpriteMaterial).opacity = 0.32 * (1 - t / 2);
    });
  });

  if (!geom || !river) return null;
  const width = river.width * 2.1;
  const fallH = 1.7;

  return (
    <group position={[geom.edgeX, 0, geom.edgeZ]} rotation={[0, -geom.angle, 0]}>
      {/* Falling sheet, curved out from the lip. */}
      <mesh position={[0.02, geom.topY - fallH / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[width, fallH, 1, 12]} />
        <shaderMaterial
          ref={matRef}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
          uniforms={uniforms}
          vertexShader={`
            uniform float uTime; varying vec2 vUv;
            void main(){
              vUv = uv;
              vec3 p = position;
              // Water bows outward as it falls and wobbles slightly.
              float fall = 1.0 - uv.y;
              p.z += fall * fall * 0.22;
              p.x += sin(uTime * 2.0 + uv.y * 8.0) * 0.012 * fall;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
            }`}
          fragmentShader={`
            uniform float uTime; uniform vec3 uColor; varying vec2 vUv;
            float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
            void main(){
              // Streaks racing downward.
              float streak = hash(vec2(floor(vUv.x * 26.0), 0.0));
              float flow = fract(vUv.y * 2.2 - uTime * (1.5 + streak * 0.9) - streak);
              float bright = smoothstep(0.0, 0.35, flow) * smoothstep(1.0, 0.55, flow);
              vec3 col = mix(uColor * 0.8, vec3(1.0), 0.45 + bright * 0.5);
              // Aerated white at the lip and where it hits the pool.
              col = mix(col, vec3(1.0), smoothstep(0.86, 1.0, vUv.y) * 0.75);
              col = mix(col, vec3(1.0), smoothstep(0.2, 0.0, vUv.y) * 0.6);
              float edge = smoothstep(0.0, 0.09, vUv.x) * smoothstep(1.0, 0.91, vUv.x);
              gl_FragColor = vec4(col, edge * (0.72 + bright * 0.28));
            }`}
        />
      </mesh>
      {/* Spray at the bottom. */}
      {[0, 1, 2, 3].map((i) => (
        <sprite
          key={i}
          ref={(el) => {
            mists.current[i] = el;
          }}
          position={[0.12, geom.topY - fallH, (i - 1.5) * width * 0.22]}
          scale={[width * 0.75, width * 0.55, 1]}
        >
          <spriteMaterial map={mistTex} color="#ffffff" transparent opacity={0.3} depthWrite={false} />
        </sprite>
      ))}
    </group>
  );
}

// ── Sky & atmosphere ────────────────────────────────────────────────────────

function SkyDome({ top, horizon, sunDir, night }: { top: string; horizon: string; sunDir: THREE.Vector3; night: boolean }) {
  const uniforms = useMemo(
    () => ({
      uTop: { value: new THREE.Color(top) },
      uHorizon: { value: new THREE.Color(horizon) },
      uSunDir: { value: sunDir.clone().normalize() },
      uSunColor: { value: new THREE.Color(night ? '#c3d2f0' : '#fff3c8') },
      uSunAmt: { value: night ? 0.3 : 1 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  useEffect(() => {
    uniforms.uTop.value.set(top);
    uniforms.uHorizon.value.set(horizon);
    uniforms.uSunDir.value.copy(sunDir).normalize();
    uniforms.uSunColor.value.set(night ? '#c3d2f0' : '#fff3c8');
    uniforms.uSunAmt.value = night ? 0.3 : 1;
  }, [top, horizon, sunDir, night, uniforms]);

  return (
    <mesh>
      <sphereGeometry args={[42, 32, 20]} />
      <shaderMaterial
        side={THREE.BackSide}
        depthWrite={false}
        uniforms={uniforms}
        vertexShader={`varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`}
        fragmentShader={`
          uniform vec3 uTop; uniform vec3 uHorizon; uniform vec3 uSunDir; uniform vec3 uSunColor; uniform float uSunAmt;
          varying vec3 vDir;
          void main(){
            float h = clamp(vDir.y, 0.0, 1.0);
            vec3 col = mix(uHorizon, uTop, pow(h, 0.5));
            float d = max(dot(normalize(vDir), normalize(uSunDir)), 0.0);
            col += uSunColor * (pow(d, 64.0) * 1.1 + pow(d, 7.0) * 0.2) * uSunAmt;
            gl_FragColor = vec4(col, 1.0);
          }`}
      />
    </mesh>
  );
}

function Clouds({ night }: { night: boolean }) {
  const tex = useMemo(() => softDiscTexture(), []);
  const groups = useRef<(THREE.Group | null)[]>([]);
  const defs = useMemo(
    () =>
      [0, 1, 2, 3, 4].map((i) => {
        const rng = mulberry32(60 + i);
        return {
          y: 3.4 + rng() * 2,
          z: (rng() - 0.5) * 9,
          sp: 0.035 + rng() * 0.04,
          off: rng() * 14,
          s: 1.1 + rng() * 1.1,
          puffs: Array.from({ length: 5 }).map(() => ({ x: (rng() - 0.5) * 1.5, y: (rng() - 0.5) * 0.26, r: 0.4 + rng() * 0.4 })),
        };
      }),
    [],
  );
  useFrame(({ clock }) => {
    defs.forEach((d, i) => {
      const g = groups.current[i];
      if (g) g.position.x = ((clock.elapsedTime * d.sp + d.off) % 18) - 9;
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
            <sprite key={j} position={[p.x, p.y, 0]} scale={[p.r * 2.6, p.r * 1.6, 1]}>
              <spriteMaterial map={tex} color="#ffffff" transparent opacity={night ? 0.1 : 0.46} depthWrite={false} />
            </sprite>
          ))}
        </group>
      ))}
    </group>
  );
}

// ── Fauna ───────────────────────────────────────────────────────────────────

function Bird({ seed, layout }: { seed: number; layout: WorldLayout }) {
  const ref = useRef<THREE.Group>(null);
  const wingL = useRef<THREE.Mesh>(null);
  const wingR = useRef<THREE.Mesh>(null);
  const rng = useMemo(() => mulberry32(seed), [seed]);
  const p = useMemo(
    () => ({ r: layout.R * (0.6 + rng() * 0.3), h: 1.6 + rng() * 0.8, sp: 0.3 + rng() * 0.18, ph: rng() * 6 }),
    [rng, layout.R],
  );
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * p.sp + p.ph;
    if (ref.current) {
      ref.current.position.set(Math.cos(t) * p.r, p.h + Math.sin(t * 2.3) * 0.16, Math.sin(t) * p.r);
      ref.current.rotation.y = -t + Math.PI / 2;
      ref.current.rotation.z = Math.sin(t * 2.3) * 0.18;
    }
    const flap = Math.sin(clock.elapsedTime * 9 + p.ph) * 0.75;
    if (wingL.current) wingL.current.rotation.z = flap;
    if (wingR.current) wingR.current.rotation.z = -flap;
  });
  return (
    <group ref={ref} scale={0.85}>
      <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.04, 0.13, 3, 6]} />
        <meshStandardMaterial color="#4a4f57" roughness={0.7} />
      </mesh>
      <mesh position={[0.12, 0.02, 0]}>
        <coneGeometry args={[0.026, 0.07, 4]} />
        <meshStandardMaterial color="#e8a33d" />
      </mesh>
      <mesh ref={wingL} position={[0, 0.02, 0.055]} rotation={[0.2, 0, 0]}>
        <boxGeometry args={[0.1, 0.008, 0.17]} />
        <meshStandardMaterial color="#5c626c" />
      </mesh>
      <mesh ref={wingR} position={[0, 0.02, -0.055]} rotation={[-0.2, 0, 0]}>
        <boxGeometry args={[0.1, 0.008, 0.17]} />
        <meshStandardMaterial color="#5c626c" />
      </mesh>
    </group>
  );
}

function Butterfly({ seed, accent, layout }: { seed: number; accent: string; layout: WorldLayout }) {
  const ref = useRef<THREE.Group>(null);
  const wL = useRef<THREE.Mesh>(null);
  const wR = useRef<THREE.Mesh>(null);
  const rng = useMemo(() => mulberry32(seed), [seed]);
  const base = useMemo(() => {
    const a = rng() * Math.PI * 2;
    const r = Math.sqrt(rng()) * layout.R * 0.6;
    return { x: Math.cos(a) * r, z: Math.sin(a) * r, p: rng() * 6 };
  }, [rng, layout.R]);
  const color = useMemo(() => vary(accent, rng, 0.12, 0.1, 0.12), [accent, rng]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime + base.p;
    if (ref.current) {
      const x = base.x + Math.cos(t * 0.7) * 0.5;
      const z = base.z + Math.sin(t * 0.7) * 0.5;
      const ground = terrainHeight(x, z, layout);
      ref.current.position.set(x, ground + 0.28 + Math.sin(t * 1.6) * 0.14, z);
      ref.current.rotation.y = -t * 0.7;
    }
    const flap = Math.abs(Math.sin(clock.elapsedTime * 12 + base.p)) * 1.2;
    if (wL.current) wL.current.rotation.x = flap;
    if (wR.current) wR.current.rotation.x = -flap;
  });
  return (
    <group ref={ref} scale={0.75}>
      <mesh ref={wL} position={[0, 0, 0.04]}>
        <planeGeometry args={[0.085, 0.1]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={0.6} />
      </mesh>
      <mesh ref={wR} position={[0, 0, -0.04]}>
        <planeGeometry args={[0.085, 0.1]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={0.6} />
      </mesh>
    </group>
  );
}

function Fireflies({ layout, count = 14 }: { layout: WorldLayout; count?: number }) {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const seeds = useMemo(() => Array.from({ length: count }).map((_, i) => mulberry32(500 + i)()), [count]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    refs.current.forEach((m, i) => {
      if (!m) return;
      const s = seeds[i]! * 6.28;
      const x = Math.cos(t * 0.25 + s * 3) * (layout.R * 0.55 * (0.4 + seeds[i]!));
      const z = Math.sin(t * 0.32 + s * 2) * (layout.R * 0.55 * (0.4 + seeds[i]!));
      m.position.set(x, terrainHeight(x, z, layout) + 0.22 + Math.sin(t * 0.7 + s) * 0.16, z);
      m.scale.setScalar((0.5 + (Math.sin(t * 2.4 + s * 7) * 0.5 + 0.5) * 0.9) * 0.03);
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

function Deer({ pos, layout, seed }: { pos: [number, number]; layout: WorldLayout; seed: number }) {
  const head = useRef<THREE.Group>(null);
  const rng = useMemo(() => mulberry32(seed), [seed]);
  const phase = useMemo(() => rng() * 6, [rng]);
  const y = useMemo(() => terrainHeight(pos[0], pos[1], layout), [pos, layout]);
  useFrame(({ clock }) => {
    if (head.current) head.current.rotation.x = 0.45 + Math.max(0, Math.sin(clock.elapsedTime * 0.45 + phase)) * 0.6;
  });
  const fur = '#a87a4e';
  return (
    <group position={[pos[0], y, pos[1]]} rotation={[0, rng() * 6, 0]} scale={0.5}>
      <mesh castShadow position={[0, 0.42, 0]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.12, 0.3, 4, 8]} />
        <meshStandardMaterial color={fur} roughness={0.92} />
      </mesh>
      {[
        [-0.13, 0.09],
        [0.13, 0.09],
        [-0.13, -0.09],
        [0.13, -0.09],
      ].map(([x, z], i) => (
        <mesh key={i} castShadow position={[x!, 0.18, z!]}>
          <cylinderGeometry args={[0.019, 0.015, 0.36, 5]} />
          <meshStandardMaterial color="#8e6339" roughness={0.92} />
        </mesh>
      ))}
      <group ref={head} position={[0.25, 0.52, 0]}>
        <mesh castShadow position={[0.05, 0.13, 0]} rotation={[0, 0, -0.5]}>
          <capsuleGeometry args={[0.042, 0.15, 4, 8]} />
          <meshStandardMaterial color={fur} roughness={0.92} />
        </mesh>
        <mesh castShadow position={[0.13, 0.23, 0]}>
          <capsuleGeometry args={[0.047, 0.08, 4, 8]} />
          <meshStandardMaterial color={fur} roughness={0.92} />
        </mesh>
        {[-0.045, 0.045].map((z, i) => (
          <mesh key={i} position={[0.1, 0.31, z]} rotation={[z * 6, 0, 0]}>
            <coneGeometry args={[0.018, 0.065, 4]} />
            <meshStandardMaterial color="#8e6339" />
          </mesh>
        ))}
      </group>
      <mesh position={[-0.27, 0.46, 0]} rotation={[0, 0, 0.7]}>
        <coneGeometry args={[0.023, 0.075, 4]} />
        <meshStandardMaterial color="#f5efe0" />
      </mesh>
    </group>
  );
}

function Duck({ seed, layout }: { seed: number; layout: WorldLayout }) {
  const ref = useRef<THREE.Group>(null);
  const lake = layout.lakes[0];
  const rng = useMemo(() => mulberry32(seed), [seed]);
  const p = useMemo(() => ({ r: (lake?.r ?? 0.4) * (0.3 + rng() * 0.4), sp: 0.2 + rng() * 0.2, ph: rng() * 6 }), [rng, lake]);
  useFrame(({ clock }) => {
    if (!ref.current || !lake) return;
    const t = clock.elapsedTime * p.sp + p.ph;
    ref.current.position.set(
      lake.x + Math.cos(t) * p.r,
      WATER_LEVEL + 0.028 + Math.sin(clock.elapsedTime * 1.8 + p.ph) * 0.006,
      lake.z + Math.sin(t) * p.r * 0.85,
    );
    ref.current.rotation.y = -t + Math.PI / 2;
  });
  if (!lake) return null;
  return (
    <group ref={ref} scale={0.5}>
      <mesh castShadow scale={[1.35, 0.72, 0.9]}>
        <sphereGeometry args={[0.085, 10, 8]} />
        <meshStandardMaterial color="#7a5a38" roughness={0.85} />
      </mesh>
      <mesh position={[0.085, 0.085, 0]}>
        <sphereGeometry args={[0.048, 10, 8]} />
        <meshStandardMaterial color="#2f5d3c" roughness={0.6} />
      </mesh>
      <mesh position={[0.14, 0.075, 0]} rotation={[0, 0, -1.35]}>
        <coneGeometry args={[0.017, 0.048, 4]} />
        <meshStandardMaterial color="#e8a33d" />
      </mesh>
    </group>
  );
}

// ── Props ───────────────────────────────────────────────────────────────────

function Campfire({ layout, pos }: { layout: WorldLayout; pos: [number, number] }) {
  const f1 = useRef<THREE.Mesh>(null);
  const f2 = useRef<THREE.Mesh>(null);
  const light = useRef<THREE.PointLight>(null);
  const y = useMemo(() => terrainHeight(pos[0], pos[1], layout), [pos, layout]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const n = Math.sin(t * 9.3) * 0.5 + Math.sin(t * 14.7 + 1.3) * 0.3 + Math.sin(t * 23.1 + 2.1) * 0.2;
    if (f1.current) {
      f1.current.scale.set(1 + n * 0.14, 1 + n * 0.32, 1 + n * 0.14);
      f1.current.rotation.y = t * 1.4;
    }
    if (f2.current) {
      f2.current.scale.setScalar(1 + n * 0.24);
      f2.current.position.y = 0.16 + n * 0.02;
    }
    if (light.current) light.current.intensity = 1.1 + n * 0.6;
  });
  return (
    <group position={[pos[0], y, pos[1]]}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} castShadow position={[0, 0.04, 0]} rotation={[0.35, (i / 3) * Math.PI * 2, Math.PI / 2.4]}>
          <cylinderGeometry args={[0.026, 0.03, 0.26, 5]} />
          <meshStandardMaterial color="#5d4229" roughness={1} />
        </mesh>
      ))}
      <mesh ref={f1} geometry={blobGeometry(0.1, 1, 0.22, 71)} position={[0, 0.13, 0]} scale={[1, 1.5, 1]}>
        <meshBasicMaterial color="#ff7a2f" toneMapped={false} transparent opacity={0.95} />
      </mesh>
      <mesh ref={f2} geometry={blobGeometry(0.06, 1, 0.22, 72)} position={[0, 0.16, 0]} scale={[1, 1.6, 1]}>
        <meshBasicMaterial color="#ffd88a" toneMapped={false} />
      </mesh>
      <pointLight ref={light} position={[0, 0.3, 0]} color="#ff9a45" intensity={1.1} distance={3} decay={2} />
    </group>
  );
}

function Cabin({ layout, pos }: { layout: WorldLayout; pos: [number, number] }) {
  const y = useMemo(() => terrainHeight(pos[0], pos[1], layout), [pos, layout]);
  const rockTex = useMemo(() => rockTexture(), []);
  return (
    <group position={[pos[0], y, pos[1]]} rotation={[0, 0.6, 0]} scale={0.9}>
      <mesh castShadow receiveShadow position={[0, 0.21, 0]}>
        <boxGeometry args={[0.6, 0.42, 0.48]} />
        <meshStandardMaterial color="#9c7449" roughness={0.95} />
      </mesh>
      {/* Pitched roof from two slabs — reads as a roof, not a rotated cube. */}
      {[-1, 1].map((s) => (
        <mesh key={s} castShadow position={[0, 0.52, s * 0.13]} rotation={[s * 0.72, 0, 0]}>
          <boxGeometry args={[0.68, 0.028, 0.36]} />
          <meshStandardMaterial color="#4f6b48" roughness={1} />
        </mesh>
      ))}
      <mesh position={[0.19, 0.66, 0.08]}>
        <boxGeometry args={[0.08, 0.26, 0.08]} />
        <meshStandardMaterial map={rockTex} color="#8d8175" roughness={1} />
      </mesh>
      <mesh position={[0, 0.18, 0.242]}>
        <boxGeometry args={[0.13, 0.25, 0.012]} />
        <meshStandardMaterial color="#4a3620" roughness={0.9} />
      </mesh>
      <mesh position={[0.2, 0.25, 0.242]}>
        <boxGeometry args={[0.11, 0.11, 0.01]} />
        <meshStandardMaterial color="#ffe9a8" emissive="#c99b3f" emissiveIntensity={0.7} />
      </mesh>
    </group>
  );
}

// ── FX ──────────────────────────────────────────────────────────────────────

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
      (s.material as THREE.SpriteMaterial).opacity = Math.max(0, 1 - t / 0.9);
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

function Rain({ active, layout }: { active: boolean; layout: WorldLayout }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const COUNT = 110;
  const drops = useMemo(() => {
    const rng = mulberry32(777);
    return Array.from({ length: COUNT }).map(() => {
      const a = rng() * Math.PI * 2;
      const r = Math.sqrt(rng()) * (layout.R - 0.2);
      return { x: Math.cos(a) * r, z: Math.sin(a) * r, phase: rng() * 3, speed: 2.6 + rng() * 1.8 };
    });
  }, [layout.R]);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    mesh.visible = active;
    if (!active) return;
    const t = clock.elapsedTime;
    drops.forEach((d, i) => {
      const ground = terrainHeight(d.x, d.z, layout);
      const y = ground + 2.6 - ((t * d.speed + d.phase) % 2.8);
      dummy.position.set(d.x, y, d.z);
      dummy.scale.set(1, 2, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]} frustumCulled={false}>
      <sphereGeometry args={[0.014, 5, 5]} />
      <meshBasicMaterial color="#9fdcf2" transparent opacity={0.75} toneMapped={false} />
    </instancedMesh>
  );
}

function Pip3D({ golden, aura, layout }: { golden: boolean; aura: boolean; layout: WorldLayout }) {
  const ref = useRef<THREE.Group>(null);
  const eyes = useRef<THREE.Group>(null);
  const groundY = useMemo(() => terrainHeight(0, 0, layout), [layout]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (ref.current) {
      ref.current.position.y = groundY + 0.3 + Math.sin(t * 1.5) * 0.045;
      const squash = 1 + Math.sin(t * 1.5 + Math.PI / 2) * 0.03;
      ref.current.scale.set(1 / squash, squash, 1 / squash);
    }
    if (eyes.current) eyes.current.scale.y = t % 3.7 > 3.55 ? 0.12 : 1;
  });
  const body = golden ? '#FFD27A' : '#9CC93B';
  return (
    <group ref={ref} position={[0, groundY + 0.3, 0]}>
      {aura && (
        <mesh>
          <sphereGeometry args={[0.42, 16, 16]} />
          <meshBasicMaterial color={golden ? '#FFB23E' : '#1FB57A'} transparent opacity={0.13} />
        </mesh>
      )}
      <mesh castShadow>
        <sphereGeometry args={[0.24, 24, 24]} />
        <meshStandardMaterial color={body} roughness={0.62} />
      </mesh>
      <mesh position={[0.09, 0.26, 0]} rotation={[0, 0, -0.6]}>
        <coneGeometry args={[0.09, 0.23, 5]} />
        <meshStandardMaterial color={golden ? '#FFB23E' : '#1FB57A'} roughness={0.6} />
      </mesh>
      <group ref={eyes}>
        <mesh position={[-0.075, 0.04, 0.21]}>
          <sphereGeometry args={[0.034, 12, 12]} />
          <meshStandardMaterial color="#0C1A13" />
        </mesh>
        <mesh position={[0.075, 0.04, 0.21]}>
          <sphereGeometry args={[0.034, 12, 12]} />
          <meshStandardMaterial color="#0C1A13" />
        </mesh>
      </group>
    </group>
  );
}

// ── Growth placement ────────────────────────────────────────────────────────

const GOLDEN_ANGLE = 2.399963;
const MAX_PLANTS = 130;

/** Turn completion count into terrain-valid plant positions. */
function buildPlants(layout: WorldLayout, growth: number, goal: number, biomeKind: string): PlantInstance[] {
  const out: PlantInstance[] = [];
  const rendered = Math.min(growth, MAX_PLANTS);
  const step = growth > MAX_PLANTS ? growth / MAX_PLANTS : 1;
  const speciesFor = (i: number, r: () => number): Species => {
    if (i % 11 === 0) return 'oak';
    const roll = r();
    if (biomeKind === 'tundra' || biomeKind === 'bosque') return roll < 0.62 ? 'pine' : roll < 0.85 ? 'bush' : 'birch';
    if (biomeKind === 'costa' || biomeKind === 'desierto') return roll < 0.5 ? 'bush' : roll < 0.8 ? 'oak' : 'birch';
    return roll < 0.4 ? 'bush' : roll < 0.68 ? 'oak' : roll < 0.88 ? 'birch' : 'pine';
  };

  for (let k = 0; k < rendered; k++) {
    const i = Math.floor(k * step);
    const rng = mulberry32(layout.seed + i * 97 + 13);
    const angle = i * GOLDEN_ANGLE + rng() * 0.35;
    const radius = 0.5 + (layout.R - 0.85) * Math.sqrt((i + 0.5) / Math.max(goal, 1));
    const spot = snapToLand(Math.cos(angle) * radius, Math.sin(angle) * radius, layout, rng, 0.28);
    if (!spot) continue;
    out.push({
      x: spot[0],
      z: spot[1],
      scale: 0.42 + rng() * 0.4,
      rotY: rng() * Math.PI * 2,
      species: speciesFor(i, rng),
      tint: rng(),
    });
  }
  return out;
}

/** The established forest that frames the island (grows with progress). */
function buildAmbientForest(layout: WorldLayout, pct: number, worldIndex: number, biomeKind: string): PlantInstance[] {
  const out: PlantInstance[] = [];
  const rng = mulberry32(layout.seed + 5150);
  const target = 26 + Math.round(pct * 30) + Math.min(10, worldIndex * 2);
  let guard = 0;
  while (out.length < target && guard++ < target * 12) {
    const a = rng() * Math.PI * 2;
    const r = layout.R * (0.68 + rng() * 0.28);
    const spot = snapToLand(Math.cos(a) * r, Math.sin(a) * r, layout, rng, 0.18);
    if (!spot) continue;
    if (out.some((p) => Math.hypot(p.x - spot[0], p.z - spot[1]) < 0.34)) continue;
    const roll = rng();
    const species: Species =
      biomeKind === 'tundra' || biomeKind === 'bosque'
        ? roll < 0.78
          ? 'pine'
          : 'birch'
        : roll < 0.45
          ? 'pine'
          : roll < 0.78
            ? 'oak'
            : 'birch';
    out.push({ x: spot[0], z: spot[1], scale: 0.55 + rng() * 0.55, rotY: rng() * 6.28, species, tint: rng() });
  }
  return out;
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
  const worldIndex = mundo.worldIndex ?? 1;
  const growth = mundo.worldGrowth ?? 0;
  const goal = mundo.worldGoal ?? 40;
  const pct = goal > 0 ? growth / goal : 0;

  const tint = (hex: string) =>
    golden ? `#${new THREE.Color(hex).lerp(new THREE.Color('#E8B54A'), 0.42).getHexString()}` : hex;

  // The island grows with progression.
  const R = useMemo(() => Math.min(4.6, 2.9 + (Math.min(worldIndex, 7) - 1) * 0.24 + pct * 0.3), [worldIndex, pct]);
  const layout = useMemo(() => makeLayout(worldIndex, R, biome.features.pond), [worldIndex, R, biome.features.pond]);

  const biomeKind = useMemo(() => {
    const n = biome.name.toLowerCase();
    if (n.includes('tundra')) return 'tundra';
    if (n.includes('bosque') || n.includes('selva')) return 'bosque';
    if (n.includes('costa')) return 'costa';
    if (n.includes('desierto')) return 'desierto';
    return 'pradera';
  }, [biome.name]);

  const colors: TerrainColors = useMemo(
    () => ({
      grass: tint(biome.grass),
      grassDry: tint(biome.ground),
      rock: '#7d7469',
      sand: biomeKind === 'costa' || biomeKind === 'desierto' ? '#e2cf9d' : '#c2a878',
      snow: '#eef4f7',
      water: tint(biome.water),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [biome, biomeKind, golden],
  );

  const plants = useMemo(() => buildPlants(layout, growth, goal, biomeKind), [layout, growth, goal, biomeKind]);
  const ambient = useMemo(() => buildAmbientForest(layout, pct, worldIndex, biomeKind), [layout, pct, worldIndex, biomeKind]);
  const allPlants = useMemo(() => [...ambient, ...plants], [ambient, plants]);

  // Pop-in for the newest element.
  const initialGrowth = useRef(growth);
  const isNew = growth > initialGrowth.current;

  const sunAngle = dayT * Math.PI * 2;
  const sunPos = useMemo(
    () => new THREE.Vector3(Math.cos(sunAngle) * 6, Math.max(2.6, Math.sin(sunAngle) * 6 + 3), 4),
    [sunAngle],
  );
  /** Golden hour when the sun is low; neutral at midday. */
  const sunWarmth = useMemo(() => {
    const elevation = THREE.MathUtils.clamp(sunPos.y / 8, 0, 1);
    return `#${new THREE.Color('#ffb761').lerp(new THREE.Color('#fff6e2'), elevation).getHexString()}`;
  }, [sunPos]);

  const [bursts, setBursts] = useState<{ id: number; at: THREE.Vector3; tone: 'spark' | 'heart' }[]>([]);
  const burstId = useRef(0);
  function onTap(e: ThreeEvent<PointerEvent>) {
    e.stopPropagation();
    const id = ++burstId.current;
    const heart = Math.random() < 0.35;
    setBursts((b) => [...b.slice(-3), { id, at: e.point.clone(), tone: heart ? 'heart' : 'spark' }]);
    if (heart) onCare?.();
  }

  const horizon = night ? '#38566b' : biome.skyHorizon;
  const flowerCount = Math.round(40 + pct * 130);

  // Spots for props, snapped to valid ground.
  const cabinSpot = useMemo(() => {
    const rng = mulberry32(layout.seed + 31);
    return snapToLand(-R * 0.34, -R * 0.52, layout, rng, 0.5);
  }, [layout, R]);
  const firePos = useMemo(() => {
    const rng = mulberry32(layout.seed + 77);
    return snapToLand(R * 0.12, R * 0.42, layout, rng, 0.4);
  }, [layout, R]);
  const deerSpots = useMemo(() => {
    const rng = mulberry32(layout.seed + 404);
    const lake = layout.lakes[0];
    const a: [number, number][] = [];
    for (let i = 0; i < 2; i++) {
      const bx = lake ? lake.x - lake.r * (1.5 + i * 0.5) : -R * 0.3;
      const bz = lake ? lake.z + lake.r * (0.9 + i * 0.6) : R * 0.3;
      const s = snapToLand(bx, bz, layout, rng, 0.3);
      if (s) a.push(s);
    }
    return a;
  }, [layout, R]);

  return (
    <>
      <fog attach="fog" args={[horizon, R * 3.4, R * 7]} />
      <SkyDome top={night ? '#132a4d' : biome.skyTop} horizon={horizon} sunDir={sunPos} night={night} />

      <ambientLight intensity={night ? 0.5 : 0.42} color={night ? '#b6c8e6' : '#fff4e6'} />
      {/* Key light: warm and low at the edges of the day, white at noon. */}
      <directionalLight
        castShadow
        position={sunPos.toArray()}
        intensity={night ? 0.75 : 1.75}
        color={night ? '#cddcf5' : sunWarmth}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
        shadow-camera-near={1}
        shadow-camera-far={26}
        shadow-camera-left={-R * 1.7}
        shadow-camera-right={R * 1.7}
        shadow-camera-top={R * 1.7}
        shadow-camera-bottom={-R * 1.7}
      />
      <directionalLight position={[-sunPos.x, 3.4, -sunPos.z]} intensity={night ? 0.2 : 0.3} color={night ? '#42598c' : '#c3e3ff'} />
      <hemisphereLight intensity={night ? 0.4 : 0.5} color={night ? '#3d5680' : biome.skyTop} groundColor={colors.grassDry} />

      {/* Tap surface follows the terrain silhouette. */}
      <mesh position={[0, 0.4, 0]} rotation={[-Math.PI / 2, 0, 0]} onPointerDown={onTap} visible={false}>
        <circleGeometry args={[R + 0.2, 28]} />
        <meshBasicMaterial />
      </mesh>

      <Ground layout={layout} colors={colors} snow={biome.features.snow} />
      <IslandBody layout={layout} rock="#6f5c46" />
      <AllWater layout={layout} color={colors.water} sunDir={sunPos} />
      <Waterfall layout={layout} color={colors.water} />

      <GrassCover layout={layout} count={1400} color={colors.grass} colorDry={colors.grassDry} wind={1} />
      <Rocks layout={layout} count={90} snow={biome.features.snow} />
      <Flowers layout={layout} count={flowerCount} accent={tint(biome.accent)} />

      {/* Landscape detail: shoreline, forest floor and history. */}
      <Footpath layout={layout} />
      <Reeds layout={layout} count={240} />
      <LilyPads layout={layout} count={26} />
      <Undergrowth layout={layout} count={Math.round(120 + pct * 130)} />
      <DeadWood layout={layout} count={Math.min(8, 3 + Math.round(pct * 6))} />
      {!night && <Pollen layout={layout} count={55} />}

      <Vegetation
        plants={allPlants}
        layout={layout}
        leafColor={tint(biome.leaf)}
        leafDeep={tint(biome.leafDeep)}
        barkColor="#7d5f3f"
        windStrength={1}
      />

      <Float speed={2} rotationIntensity={0} floatIntensity={0.18}>
        <Pip3D golden={golden} aura={mundo.unlockedCosmetics.includes('guardian_aura')} layout={layout} />
      </Float>

      {cabinSpot && pct >= 0.45 && <Cabin layout={layout} pos={cabinSpot} />}
      {firePos && pct >= 0.6 && <Campfire layout={layout} pos={firePos} />}
      {growth >= 12 && deerSpots[0] && <Deer pos={deerSpots[0]} layout={layout} seed={71} />}
      {growth >= 26 && deerSpots[1] && <Deer pos={deerSpots[1]} layout={layout} seed={72} />}
      {layout.lakes.length > 0 && <Duck seed={81} layout={layout} />}
      {layout.lakes.length > 0 && growth >= 10 && <Duck seed={82} layout={layout} />}

      <Clouds night={night} />
      {worldIndex >= 2 && <Bird seed={11} layout={layout} />}
      {worldIndex >= 4 && <Bird seed={12} layout={layout} />}
      {!night && pct > 0.1 && [0, 1, 2].map((i) => <Butterfly key={i} seed={i + 7} accent={tint(biome.accent)} layout={layout} />)}
      {night && <Fireflies layout={layout} />}

      <Rain active={watering} layout={layout} />
      {bursts.map((b) => (
        <SparkleBurst key={b.id} at={b.at} tone={b.tone} onDone={() => setBursts((all) => all.filter((x) => x.id !== b.id))} />
      ))}
      {isNew && null}

      <OrbitControls
        enablePan
        panSpeed={0.65}
        enableZoom
        minDistance={R * 0.9}
        maxDistance={R * 3.6}
        autoRotate
        autoRotateSpeed={0.3}
        enableDamping
        dampingFactor={0.075}
        minPolarAngle={Math.PI * 0.14}
        maxPolarAngle={Math.PI * 0.485}
        target={[0, 0.25, 0]}
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
  onCare?: () => void;
}) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 3.6, 9.2], fov: 34 }}
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: true }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.1;
      }}
    >
      <Scene mundo={mundo} night={night} dayT={dayT} watering={watering} onCare={onCare} />
      {/* Post: AO fuses the scene, a shallow focal plane gives the miniature
          "tilt-shift" read, plus gentle grade and vignette. */}
      <EffectComposer multisampling={0}>
        <N8AO aoRadius={0.5} intensity={4} distanceFalloff={0.7} quality="performance" halfRes />
        <DepthOfField focusDistance={0.012} focalLength={0.05} bokehScale={2.6} height={480} />
        <Bloom intensity={0.22} luminanceThreshold={0.82} mipmapBlur />
        <HueSaturation saturation={0.12} />
        <Vignette eskil={false} offset={0.28} darkness={0.42} />
      </EffectComposer>
    </Canvas>
  );
}
