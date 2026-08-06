'use client';

/**
 * Landscape detail (v7 round 3).
 *
 * The things that make a place feel inhabited rather than modelled: reeds
 * standing in the shallows, lily pads floating on the lake, ferns filling the
 * forest floor, fallen logs and stumps telling a small story, and a footpath
 * that follows the ground instead of hovering over it. Everything is placed
 * from the same heightmap and drawn instanced.
 */

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  WATER_LEVEL,
  slopeAt,
  terrainHeight,
  terrainNormal,
  type WorldLayout,
} from '@/lib/mundo/terrain';

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const texCache = new Map<string, THREE.CanvasTexture>();
function tex(key: string, size: number, paint: (c: CanvasRenderingContext2D, s: number, rng: () => number) => void) {
  const hit = texCache.get(key);
  if (hit) return hit;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  paint(canvas.getContext('2d')!, size, mulberry32(4242));
  const t = new THREE.CanvasTexture(canvas);
  t.anisotropy = 4;
  texCache.set(key, t);
  return t;
}

/** Vertical reed blades with alpha — for shorelines. */
function reedTexture() {
  return tex('reeds', 128, (ctx, s, rng) => {
    ctx.clearRect(0, 0, s, s);
    ctx.lineCap = 'round';
    for (let i = 0; i < 8; i++) {
      const x = s * 0.5 + (rng() - 0.5) * s * 0.6;
      const topY = s * (0.02 + rng() * 0.18);
      const g = ctx.createLinearGradient(0, s, 0, topY);
      g.addColorStop(0, 'rgba(92,104,74,0.95)');
      g.addColorStop(1, 'rgba(206,216,168,0.9)');
      ctx.strokeStyle = g;
      ctx.lineWidth = 2.4 + rng() * 2;
      ctx.beginPath();
      ctx.moveTo(x, s);
      ctx.quadraticCurveTo(x + (rng() - 0.5) * s * 0.2, s * 0.45, x + (rng() - 0.5) * s * 0.4, topY);
      ctx.stroke();
      // A few cattail heads.
      if (rng() > 0.65) {
        ctx.fillStyle = 'rgba(120,84,52,0.95)';
        ctx.beginPath();
        ctx.ellipse(x + (rng() - 0.5) * s * 0.3, topY + s * 0.09, s * 0.028, s * 0.075, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  });
}

/** Fern frond: a stem with paired leaflets. */
function fernTexture() {
  return tex('fern', 128, (ctx, s, rng) => {
    ctx.clearRect(0, 0, s, s);
    for (let f = 0; f < 5; f++) {
      const bx = s * 0.5 + (rng() - 0.5) * s * 0.4;
      const by = s;
      const ang = -Math.PI / 2 + (rng() - 0.5) * 1.5;
      const len = s * (0.5 + rng() * 0.35);
      ctx.strokeStyle = 'rgba(90,120,70,0.95)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      const ex = bx + Math.cos(ang) * len;
      const ey = by + Math.sin(ang) * len;
      ctx.quadraticCurveTo(bx + Math.cos(ang) * len * 0.5, by + Math.sin(ang) * len * 0.45, ex, ey);
      ctx.stroke();
      // Leaflets along the stem, shrinking toward the tip.
      for (let i = 1; i < 11; i++) {
        const t = i / 11;
        const px = bx + (ex - bx) * t;
        const py = by + (ey - by) * t;
        const ll = s * 0.14 * (1 - t * 0.75);
        const shade = Math.round(110 + rng() * 70);
        ctx.strokeStyle = `rgba(${shade - 30},${shade + 30},${shade - 40},0.95)`;
        ctx.lineWidth = 3.2 * (1 - t * 0.5);
        for (const side of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px + Math.cos(ang + side * 1.15) * ll, py + Math.sin(ang + side * 1.15) * ll);
          ctx.stroke();
        }
      }
    }
  });
}

const crossQuad = (() => {
  let cached: THREE.BufferGeometry | null = null;
  return () => {
    if (cached) return cached;
    const a = new THREE.PlaneGeometry(1, 1);
    a.translate(0, 0.5, 0);
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

/** Shared swaying alpha-card material (reeds, ferns). */
function useSwayMaterial(map: THREE.Texture, cacheKey: string, amount: number) {
  const shaderRef = useRef<{ uniforms: { uTime: { value: number } } } | null>(null);
  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      map,
      alphaTest: 0.42,
      side: THREE.DoubleSide,
      roughness: 0.92,
      vertexColors: true,
    });
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = { value: 0 };
      shader.vertexShader = `uniform float uTime;\n${shader.vertexShader}`.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         {
           float hf = clamp(position.y, 0.0, 1.0);
           vec3 ip = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
           float gust = sin(uTime * 0.5 + ip.x * 0.4 + ip.z * 0.36) * 0.5 + 0.5;
           float s = sin(uTime * 1.6 + ip.x * 1.9 + ip.z * 1.5) * (0.5 + gust * 0.5);
           transformed.x += s * ${amount.toFixed(3)} * hf * hf;
           transformed.z += s * ${(amount * 0.6).toFixed(3)} * hf * hf;
         }`,
      );
      shaderRef.current = shader as never;
    };
    mat.customProgramCacheKey = () => cacheKey;
    return mat;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);
  useFrame(({ clock }) => {
    if (shaderRef.current) shaderRef.current.uniforms.uTime.value = clock.elapsedTime;
  });
  return material;
}

/** Reeds standing in the shallows around every water body. */
export function Reeds({ layout, count = 240 }: { layout: WorldLayout; count?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const material = useSwayMaterial(useMemo(() => reedTexture(), []), 'v7-reeds', 0.07);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || layout.lakes.length === 0) return;
    const rng = mulberry32(1717 + layout.seed);
    const dummy = new THREE.Object3D();
    const c = new THREE.Color();
    let placed = 0;
    let guard = 0;
    while (placed < count && guard++ < count * 14) {
      // Ring the lakes: reeds grow where it is shallow, not in deep water.
      const lake = layout.lakes[Math.floor(rng() * layout.lakes.length)]!;
      const a = rng() * Math.PI * 2;
      const r = lake.r * (0.82 + rng() * 0.45);
      const x = lake.x + Math.cos(a) * r;
      const z = lake.z + Math.sin(a) * r;
      const h = terrainHeight(x, z, layout);
      const depth = WATER_LEVEL - h;
      if (depth < -0.06 || depth > 0.16) continue; // just around the waterline
      dummy.position.set(x, Math.min(h, WATER_LEVEL) - 0.02, z);
      dummy.rotation.set(0, rng() * Math.PI, 0);
      const s = 0.22 + rng() * 0.24;
      dummy.scale.set(s, s * (1.1 + rng() * 0.7), s);
      dummy.updateMatrix();
      mesh.setMatrixAt(placed, dummy.matrix);
      c.setHSL(0.24 + rng() * 0.06, 0.34 + rng() * 0.2, 0.42 + rng() * 0.2);
      mesh.setColorAt(placed, c);
      placed++;
    }
    mesh.count = placed;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [layout, count]);

  if (layout.lakes.length === 0) return null;
  return <instancedMesh ref={meshRef} args={[crossQuad(), material, count]} castShadow frustumCulled={false} />;
}

/** Lily pads drifting on the surface, with the odd flower. */
export function LilyPads({ layout, count = 26 }: { layout: WorldLayout; count?: number }) {
  const padRef = useRef<THREE.InstancedMesh>(null);
  const flowerRef = useRef<THREE.InstancedMesh>(null);

  const padGeo = useMemo(() => {
    // A pad with the classic notch cut out of it.
    const shape = new THREE.Shape();
    const R = 1;
    const notch = 0.42;
    shape.absarc(0, 0, R, notch, Math.PI * 2 - notch, false);
    shape.lineTo(0, 0);
    const g = new THREE.ShapeGeometry(shape, 18);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);

  useEffect(() => {
    const pads = padRef.current;
    const flowers = flowerRef.current;
    if (!pads || layout.lakes.length === 0) return;
    const rng = mulberry32(808 + layout.seed);
    const dummy = new THREE.Object3D();
    const c = new THREE.Color();
    let placed = 0;
    let flowerCount = 0;
    let guard = 0;
    while (placed < count && guard++ < count * 14) {
      const lake = layout.lakes[Math.floor(rng() * layout.lakes.length)]!;
      const a = rng() * Math.PI * 2;
      const r = lake.r * Math.sqrt(rng()) * 0.85;
      const x = lake.x + Math.cos(a) * r;
      const z = lake.z + Math.sin(a) * r;
      const depth = WATER_LEVEL - terrainHeight(x, z, layout);
      if (depth < 0.06) continue; // needs actual water under it
      const s = 0.07 + rng() * 0.075;
      dummy.position.set(x, WATER_LEVEL + 0.012, z);
      dummy.rotation.set(0, rng() * Math.PI * 2, 0);
      dummy.scale.set(s, 1, s);
      dummy.updateMatrix();
      pads.setMatrixAt(placed, dummy.matrix);
      c.setHSL(0.28 + rng() * 0.05, 0.42 + rng() * 0.18, 0.3 + rng() * 0.14);
      pads.setColorAt(placed, c);
      if (flowers && rng() > 0.72 && flowerCount < count) {
        dummy.position.set(x + s * 0.4, WATER_LEVEL + 0.035, z + s * 0.3);
        dummy.scale.setScalar(0.9 + rng() * 0.5);
        dummy.updateMatrix();
        flowers.setMatrixAt(flowerCount, dummy.matrix);
        flowerCount++;
      }
      placed++;
    }
    pads.count = placed;
    pads.instanceMatrix.needsUpdate = true;
    if (pads.instanceColor) pads.instanceColor.needsUpdate = true;
    if (flowers) {
      flowers.count = flowerCount;
      flowers.instanceMatrix.needsUpdate = true;
    }
  }, [layout, count]);

  if (layout.lakes.length === 0) return null;
  return (
    <group>
      <instancedMesh ref={padRef} args={[padGeo, undefined, count]} frustumCulled={false} renderOrder={3}>
        <meshStandardMaterial vertexColors roughness={0.55} side={THREE.DoubleSide} />
      </instancedMesh>
      <instancedMesh ref={flowerRef} args={[undefined, undefined, count]} frustumCulled={false} renderOrder={3}>
        <sphereGeometry args={[0.022, 8, 6]} />
        <meshStandardMaterial color="#f8dff0" roughness={0.5} />
      </instancedMesh>
    </group>
  );
}

/** Ferns and undergrowth on the forest floor. */
export function Undergrowth({ layout, count = 200 }: { layout: WorldLayout; count?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const material = useSwayMaterial(useMemo(() => fernTexture(), []), 'v7-fern', 0.045);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const rng = mulberry32(2626 + layout.seed);
    const dummy = new THREE.Object3D();
    const c = new THREE.Color();
    let placed = 0;
    let guard = 0;
    while (placed < count && guard++ < count * 8) {
      // Ferns like the shadier outer ring where the forest stands.
      const a = rng() * Math.PI * 2;
      const r = layout.R * (0.5 + rng() * 0.42);
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      const h = terrainHeight(x, z, layout);
      if (h < WATER_LEVEL + 0.05) continue;
      if (slopeAt(x, z, layout) > 0.45) continue;
      const n = terrainNormal(x, z, layout);
      dummy.position.set(x, h - 0.01, z);
      dummy.rotation.set(Math.atan2(n[2], 1) * 0.5, rng() * Math.PI, -Math.atan2(n[0], 1) * 0.5);
      const s = 0.16 + rng() * 0.16;
      dummy.scale.set(s, s * (0.85 + rng() * 0.5), s);
      dummy.updateMatrix();
      mesh.setMatrixAt(placed, dummy.matrix);
      c.setHSL(0.27 + rng() * 0.05, 0.36 + rng() * 0.2, 0.26 + rng() * 0.18);
      mesh.setColorAt(placed, c);
      placed++;
    }
    mesh.count = placed;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [layout, count]);

  return <instancedMesh ref={meshRef} args={[crossQuad(), material, count]} castShadow frustumCulled={false} />;
}

/** Fallen logs and stumps — the forest has a history. */
export function DeadWood({ layout, count = 7 }: { layout: WorldLayout; count?: number }) {
  const items = useMemo(() => {
    const rng = mulberry32(555 + layout.seed);
    const out: { x: number; z: number; y: number; rot: number; kind: 'log' | 'stump'; s: number; tiltX: number; tiltZ: number }[] = [];
    let guard = 0;
    while (out.length < count && guard++ < count * 20) {
      const a = rng() * Math.PI * 2;
      const r = layout.R * (0.35 + rng() * 0.5);
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      const h = terrainHeight(x, z, layout);
      if (h < WATER_LEVEL + 0.06 || slopeAt(x, z, layout) > 0.3) continue;
      if (out.some((o) => Math.hypot(o.x - x, o.z - z) < 0.7)) continue;
      const n = terrainNormal(x, z, layout);
      out.push({
        x,
        z,
        y: h,
        rot: rng() * Math.PI * 2,
        kind: rng() > 0.45 ? 'log' : 'stump',
        s: 0.8 + rng() * 0.6,
        tiltX: Math.atan2(n[2], 1) * 0.6,
        tiltZ: -Math.atan2(n[0], 1) * 0.6,
      });
    }
    return out;
  }, [layout, count]);

  return (
    <group>
      {items.map((it, i) => (
        <group key={i} position={[it.x, it.y, it.z]} rotation={[it.tiltX, it.rot, it.tiltZ]} scale={it.s}>
          {it.kind === 'log' ? (
            <>
              <mesh castShadow receiveShadow position={[0, 0.055, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.055, 0.065, 0.62, 8]} />
                <meshStandardMaterial color="#6d5236" roughness={1} />
              </mesh>
              {/* Moss growing along the top. */}
              <mesh position={[0.03, 0.1, 0]} rotation={[0, 0, Math.PI / 2]} scale={[1, 0.92, 0.55]}>
                <cylinderGeometry args={[0.056, 0.056, 0.4, 8, 1, false, 0, Math.PI]} />
                <meshStandardMaterial color="#4f7a3c" roughness={1} />
              </mesh>
              {/* Broken end shows pale inner wood. */}
              <mesh position={[0.31, 0.055, 0]} rotation={[0, 0, Math.PI / 2]}>
                <circleGeometry args={[0.055, 8]} />
                <meshStandardMaterial color="#c4a678" roughness={0.9} side={THREE.DoubleSide} />
              </mesh>
            </>
          ) : (
            <>
              <mesh castShadow receiveShadow position={[0, 0.055, 0]}>
                <cylinderGeometry args={[0.075, 0.095, 0.11, 9]} />
                <meshStandardMaterial color="#75593a" roughness={1} />
              </mesh>
              <mesh position={[0, 0.111, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.072, 12]} />
                <meshStandardMaterial color="#c9a879" roughness={0.85} />
              </mesh>
              {/* A couple of mushrooms at the base. */}
              <mesh castShadow position={[0.085, 0.025, 0.03]}>
                <cylinderGeometry args={[0.008, 0.011, 0.035, 6]} />
                <meshStandardMaterial color="#efe6d2" roughness={0.8} />
              </mesh>
              <mesh castShadow position={[0.085, 0.045, 0.03]} scale={[1, 0.6, 1]}>
                <sphereGeometry args={[0.022, 9, 7, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial color="#c9563c" roughness={0.6} />
              </mesh>
            </>
          )}
        </group>
      ))}
    </group>
  );
}

/**
 * A worn footpath that follows the terrain: a ribbon of segments laid along a
 * curve, each sitting on the ground and tilted to match the slope.
 */
export function Footpath({ layout }: { layout: WorldLayout }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const COUNT = 90;

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const rng = mulberry32(3131 + layout.seed);
    const dummy = new THREE.Object3D();
    const c = new THREE.Color();
    const lake = layout.lakes[0];
    // A gentle S-curve across the island, ending near the water if there is one.
    const p0 = new THREE.Vector2(-layout.R * 0.42, -layout.R * 0.55);
    const p1 = new THREE.Vector2(-layout.R * 0.1, -layout.R * 0.05);
    const p2 = new THREE.Vector2(layout.R * 0.2, layout.R * 0.2);
    const p3 = lake ? new THREE.Vector2(lake.x - lake.r * 1.25, lake.z + lake.r * 0.5) : new THREE.Vector2(layout.R * 0.5, layout.R * 0.45);
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(p0.x, 0, p0.y),
      new THREE.Vector3(p1.x, 0, p1.y),
      new THREE.Vector3(p2.x, 0, p2.y),
      new THREE.Vector3(p3.x, 0, p3.y),
    ]);
    let placed = 0;
    for (let i = 0; i < COUNT; i++) {
      const t = i / (COUNT - 1);
      const pt = curve.getPoint(t);
      const tan = curve.getTangent(t);
      const h = terrainHeight(pt.x, pt.z, layout);
      if (h < WATER_LEVEL + 0.03) continue;
      if (slopeAt(pt.x, pt.z, layout) > 0.5) continue;
      const n = terrainNormal(pt.x, pt.z, layout);
      dummy.position.set(pt.x, h + 0.012, pt.z);
      dummy.rotation.set(
        -Math.PI / 2 + Math.atan2(n[2], 1) * 0.85,
        Math.atan2(tan.x, tan.z),
        Math.atan2(n[0], 1) * 0.85,
      );
      const w = 0.2 + rng() * 0.07;
      dummy.scale.set(w, w * (1.1 + rng() * 0.4), 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(placed, dummy.matrix);
      c.setHSL(0.09, 0.24 + rng() * 0.1, 0.42 + rng() * 0.1);
      mesh.setColorAt(placed, c);
      placed++;
    }
    mesh.count = placed;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [layout]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]} renderOrder={1} frustumCulled={false}>
      <circleGeometry args={[0.5, 10]} />
      <meshStandardMaterial vertexColors roughness={1} transparent opacity={0.92} depthWrite={false} polygonOffset polygonOffsetFactor={-2} />
    </instancedMesh>
  );
}

/**
 * Lake-bed life: submerged stones and swaying weed. Only worth drawing now
 * that the water is genuinely transparent — you can see straight down to it.
 */
export function Underwater({ layout, stones = 70, weeds = 90 }: { layout: WorldLayout; stones?: number; weeds?: number }) {
  const stoneRef = useRef<THREE.InstancedMesh>(null);
  const weedRef = useRef<THREE.InstancedMesh>(null);
  const weedMat = useSwayMaterial(useMemo(() => reedTexture(), []), 'v7-weed', 0.05);

  useEffect(() => {
    const sm = stoneRef.current;
    const wm = weedRef.current;
    if (!sm || !wm || layout.lakes.length === 0) return;
    const rng = mulberry32(6161 + layout.seed);
    const dummy = new THREE.Object3D();
    const c = new THREE.Color();

    let s = 0;
    let guard = 0;
    while (s < stones && guard++ < stones * 12) {
      const lake = layout.lakes[Math.floor(rng() * layout.lakes.length)]!;
      const a = rng() * Math.PI * 2;
      const r = lake.r * Math.sqrt(rng()) * 1.1;
      const x = lake.x + Math.cos(a) * r;
      const z = lake.z + Math.sin(a) * r;
      const h = terrainHeight(x, z, layout);
      if (h >= WATER_LEVEL) continue;
      const size = 0.03 + rng() * 0.07;
      dummy.position.set(x, h + size * 0.3, z);
      dummy.rotation.set(rng() * 3, rng() * 3, rng() * 3);
      dummy.scale.set(size, size * 0.7, size);
      dummy.updateMatrix();
      sm.setMatrixAt(s, dummy.matrix);
      // Wet stones are darker and slightly green from algae.
      c.setHSL(0.24 + rng() * 0.08, 0.1 + rng() * 0.14, 0.24 + rng() * 0.16);
      sm.setColorAt(s, c);
      s++;
    }

    let w = 0;
    guard = 0;
    while (w < weeds && guard++ < weeds * 12) {
      const lake = layout.lakes[Math.floor(rng() * layout.lakes.length)]!;
      const a = rng() * Math.PI * 2;
      const r = lake.r * Math.sqrt(rng());
      const x = lake.x + Math.cos(a) * r;
      const z = lake.z + Math.sin(a) * r;
      const h = terrainHeight(x, z, layout);
      const depth = WATER_LEVEL - h;
      if (depth < 0.05) continue;
      dummy.position.set(x, h, z);
      dummy.rotation.set(0, rng() * Math.PI, 0);
      const sc = 0.1 + rng() * 0.12;
      // Weed reaches up but never breaks the surface.
      dummy.scale.set(sc, Math.min(depth * 0.85, 0.1 + rng() * 0.2), sc);
      dummy.updateMatrix();
      wm.setMatrixAt(w, dummy.matrix);
      c.setHSL(0.3 + rng() * 0.06, 0.4 + rng() * 0.2, 0.2 + rng() * 0.12);
      wm.setColorAt(w, c);
      w++;
    }

    sm.count = s;
    wm.count = w;
    sm.instanceMatrix.needsUpdate = true;
    wm.instanceMatrix.needsUpdate = true;
    if (sm.instanceColor) sm.instanceColor.needsUpdate = true;
    if (wm.instanceColor) wm.instanceColor.needsUpdate = true;
  }, [layout, stones, weeds]);

  if (layout.lakes.length === 0) return null;
  return (
    <group>
      <instancedMesh ref={stoneRef} args={[undefined, undefined, stones]} receiveShadow frustumCulled={false}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial vertexColors roughness={0.75} flatShading />
      </instancedMesh>
      <instancedMesh ref={weedRef} args={[crossQuad(), weedMat, weeds]} frustumCulled={false} />
    </group>
  );
}

/** Dust motes / pollen drifting in sunlight — cheap, huge atmosphere payoff. */
export function Pollen({ layout, count = 60 }: { layout: WorldLayout; count?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const seeds = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => {
        const rng = mulberry32(9000 + i);
        return { a: rng() * Math.PI * 2, r: Math.sqrt(rng()) * layout.R * 0.85, y: rng(), sp: 0.15 + rng() * 0.3, ph: rng() * 6 };
      }),
    [count, layout.R],
  );
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const t = clock.elapsedTime;
    seeds.forEach((s, i) => {
      const x = Math.cos(s.a + t * 0.04) * s.r + Math.sin(t * s.sp + s.ph) * 0.16;
      const z = Math.sin(s.a + t * 0.04) * s.r + Math.cos(t * s.sp * 0.8 + s.ph) * 0.16;
      const ground = terrainHeight(x, z, layout);
      const y = ground + 0.22 + s.y * 0.7 + Math.sin(t * 0.5 + s.ph) * 0.1;
      dummy.position.set(x, y, z);
      dummy.scale.setScalar(0.009 + Math.sin(t * 2 + s.ph) * 0.003);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
      <sphereGeometry args={[1, 5, 4]} />
      <meshBasicMaterial color="#fff6cf" transparent opacity={0.55} toneMapped={false} depthWrite={false} />
    </instancedMesh>
  );
}
