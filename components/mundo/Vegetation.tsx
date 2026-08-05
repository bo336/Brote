'use client';

/**
 * Vegetation (v7) — plants built like plants.
 *
 * Trees are grown procedurally: a tapered trunk splits into branches, branches
 * split again, and leaf clusters sit at the tips. Each species gets its own
 * growth rules, so a pine, an oak and a birch are genuinely different shapes
 * instead of recoloured blobs. Every variant is baked once into a merged
 * geometry and drawn with InstancedMesh, so a whole forest costs a handful of
 * draw calls.
 */

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { terrainHeight, terrainNormal, type WorldLayout } from '@/lib/mundo/terrain';

// ── Small geometry utilities ────────────────────────────────────────────────

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Piece {
  geo: THREE.BufferGeometry;
  matrix: THREE.Matrix4;
}

/** Merge transformed geometries into one (position/normal/uv only). */
function mergePieces(pieces: Piece[]): THREE.BufferGeometry {
  const pos: number[] = [];
  const nor: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const nm = new THREE.Matrix3();
  const v = new THREE.Vector3();
  const n = new THREE.Vector3();

  for (const p of pieces) {
    const g = p.geo.index ? p.geo.toNonIndexed() : p.geo;
    const gp = g.attributes.position as THREE.BufferAttribute;
    const gn = g.attributes.normal as THREE.BufferAttribute | undefined;
    const gu = g.attributes.uv as THREE.BufferAttribute | undefined;
    nm.getNormalMatrix(p.matrix);
    const base = pos.length / 3;
    for (let i = 0; i < gp.count; i++) {
      v.fromBufferAttribute(gp, i).applyMatrix4(p.matrix);
      pos.push(v.x, v.y, v.z);
      if (gn) {
        n.fromBufferAttribute(gn, i).applyMatrix3(nm).normalize();
        nor.push(n.x, n.y, n.z);
      } else nor.push(0, 1, 0);
      if (gu) uv.push(gu.getX(i), gu.getY(i));
      else uv.push(0, 0);
      idx.push(base + i);
    }
    if (g !== p.geo) g.dispose();
  }

  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  out.setIndex(idx);
  return out;
}

// ── Procedural leaf texture (alpha cut-outs) ────────────────────────────────

const texCache = new Map<string, THREE.CanvasTexture>();

/** A cluster of individual leaves with alpha — the key to a foam-like canopy. */
function leafClusterTexture(kind: 'broad' | 'needle'): THREE.CanvasTexture {
  const key = `leafcluster-${kind}`;
  const hit = texCache.get(key);
  if (hit) return hit;
  const s = 256;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d')!;
  ctx.clearRect(0, 0, s, s);
  const rng = mulberry32(kind === 'broad' ? 11 : 22);

  if (kind === 'broad') {
    for (let i = 0; i < 34; i++) {
      const cx = s / 2 + (rng() - 0.5) * s * 0.78;
      const cy = s / 2 + (rng() - 0.5) * s * 0.78;
      if (Math.hypot(cx - s / 2, cy - s / 2) > s * 0.46) continue;
      const rot = rng() * Math.PI * 2;
      const len = s * (0.1 + rng() * 0.1);
      const wid = len * (0.5 + rng() * 0.28);
      const shade = Math.round(120 + rng() * 130);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);
      // Leaf: two arcs meeting at a tip.
      ctx.beginPath();
      ctx.moveTo(0, -len / 2);
      ctx.quadraticCurveTo(wid, 0, 0, len / 2);
      ctx.quadraticCurveTo(-wid, 0, 0, -len / 2);
      ctx.fillStyle = `rgba(${shade},${shade},${shade},0.96)`;
      ctx.fill();
      // Midrib for a bit of internal detail.
      ctx.strokeStyle = `rgba(${Math.max(0, shade - 45)},${Math.max(0, shade - 45)},${Math.max(0, shade - 45)},0.7)`;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(0, -len / 2);
      ctx.lineTo(0, len / 2);
      ctx.stroke();
      ctx.restore();
    }
  } else {
    // Needle sprays radiating from a central stem.
    for (let b = 0; b < 7; b++) {
      const bx = s / 2 + (rng() - 0.5) * s * 0.5;
      const by = s / 2 + (rng() - 0.5) * s * 0.5;
      const dir = rng() * Math.PI * 2;
      for (let i = 0; i < 26; i++) {
        const t = i / 26;
        const px = bx + Math.cos(dir) * t * s * 0.3;
        const py = by + Math.sin(dir) * t * s * 0.3;
        const side = i % 2 === 0 ? 1 : -1;
        const nlen = s * 0.05 * (1 - t * 0.4);
        const shade = Math.round(110 + rng() * 120);
        ctx.strokeStyle = `rgba(${shade},${shade},${shade},0.95)`;
        ctx.lineWidth = 2.1;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + Math.cos(dir + side * 1.05) * nlen, py + Math.sin(dir + side * 1.05) * nlen);
        ctx.stroke();
      }
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  texCache.set(key, tex);
  return tex;
}

/** Bark: vertical fibres + knots. */
function barkTexture(): THREE.CanvasTexture {
  const key = 'bark-v7';
  const hit = texCache.get(key);
  if (hit) return hit;
  const s = 256;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d')!;
  const rng = mulberry32(77);
  ctx.fillStyle = 'rgb(190,190,190)';
  ctx.fillRect(0, 0, s, s);
  for (let i = 0; i < 90; i++) {
    const v = Math.round(120 + rng() * 110);
    ctx.strokeStyle = `rgba(${v},${v},${v},0.55)`;
    ctx.lineWidth = 1 + rng() * 3.2;
    const x = rng() * s;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.bezierCurveTo(x + (rng() - 0.5) * 22, s * 0.35, x + (rng() - 0.5) * 22, s * 0.7, x + (rng() - 0.5) * 14, s);
    ctx.stroke();
  }
  for (let i = 0; i < 5; i++) {
    const kx = rng() * s;
    const ky = rng() * s;
    ctx.strokeStyle = 'rgba(105,105,105,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(kx, ky, 6 + rng() * 7, 3 + rng() * 5, rng() * 3, 0, Math.PI * 2);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1.6, 2.2);
  texCache.set(key, tex);
  return tex;
}

// ── Tree growth ─────────────────────────────────────────────────────────────

export type Species = 'pine' | 'oak' | 'birch' | 'bush';

interface TreeBuild {
  wood: THREE.BufferGeometry;
  leaves: THREE.BufferGeometry;
  /** Height of the finished tree, for shadow sizing. */
  height: number;
}

/**
 * Recursive growth: each branch spawns thinner children at diverging angles.
 * Leaf clusters (crossed alpha quads) attach at the tips.
 */
function growTree(species: Species, seed: number): TreeBuild {
  const rng = mulberry32(seed);
  const wood: Piece[] = [];
  const leaves: Piece[] = [];
  let maxY = 0;

  const cyl = new THREE.CylinderGeometry(1, 1, 1, 7, 1, true);
  const quad = new THREE.PlaneGeometry(1, 1);

  const params = {
    pine: { trunkH: 1.5, trunkR: 0.075, levels: 4, kids: [3, 3, 2], spread: 0.62, drop: 0.66, leafSize: 0.42, leafPer: 3 },
    oak: { trunkH: 0.95, trunkR: 0.1, levels: 4, kids: [3, 3, 2], spread: 1.02, drop: 0.72, leafSize: 0.52, leafPer: 4 },
    birch: { trunkH: 1.35, trunkR: 0.055, levels: 3, kids: [2, 3], spread: 0.78, drop: 0.7, leafSize: 0.4, leafPer: 3 },
    bush: { trunkH: 0.24, trunkR: 0.045, levels: 3, kids: [4, 3], spread: 1.25, drop: 0.74, leafSize: 0.34, leafPer: 3 },
  }[species];

  function branch(origin: THREE.Vector3, dir: THREE.Vector3, len: number, radius: number, depth: number) {
    const end = origin.clone().addScaledVector(dir, len);
    maxY = Math.max(maxY, end.y);

    // Wood segment oriented along `dir`.
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    m.compose(origin.clone().addScaledVector(dir, len / 2), q, new THREE.Vector3(radius, len, radius));
    wood.push({ geo: cyl, matrix: m });

    if (depth >= params.levels - 1 || len < 0.12) {
      // Tip: a small cluster of crossed leaf cards.
      const n = params.leafPer;
      for (let i = 0; i < n; i++) {
        const size = params.leafSize * (0.75 + rng() * 0.5);
        const off = new THREE.Vector3((rng() - 0.5) * 0.16, (rng() - 0.5) * 0.16, (rng() - 0.5) * 0.16);
        const lm = new THREE.Matrix4();
        const lq = new THREE.Quaternion().setFromEuler(
          new THREE.Euler((rng() - 0.5) * 1.4, rng() * Math.PI * 2, (rng() - 0.5) * 1.4),
        );
        lm.compose(end.clone().add(off), lq, new THREE.Vector3(size, size, size));
        leaves.push({ geo: quad, matrix: lm });
      }
      return;
    }

    const kidCount = params.kids[Math.min(depth, params.kids.length - 1)]!;
    for (let i = 0; i < kidCount; i++) {
      // Diverge around the parent direction, biased upward.
      const ang = (i / kidCount) * Math.PI * 2 + rng() * 0.9;
      const tilt = params.spread * (0.55 + rng() * 0.6);
      const side = new THREE.Vector3(Math.cos(ang), 0, Math.sin(ang));
      const kidDir = dir.clone().multiplyScalar(1.1).addScaledVector(side, tilt).normalize();
      // Pines keep branches nearly horizontal; oaks reach outward and up.
      if (species === 'pine') kidDir.y = Math.max(-0.15, kidDir.y * 0.42);
      branch(end, kidDir, len * params.drop * (0.85 + rng() * 0.3), radius * 0.63, depth + 1);
    }

    // Pines also carry foliage along the trunk, not only at tips.
    if (species === 'pine' && depth <= 1) {
      for (let i = 0; i < 4; i++) {
        const t = 0.25 + rng() * 0.7;
        const p = origin.clone().addScaledVector(dir, len * t);
        const size = params.leafSize * (0.8 + rng() * 0.5);
        const lm = new THREE.Matrix4();
        const lq = new THREE.Quaternion().setFromEuler(new THREE.Euler((rng() - 0.5) * 1.2, rng() * 6.28, (rng() - 0.5) * 1.2));
        lm.compose(p, lq, new THREE.Vector3(size, size, size));
        leaves.push({ geo: quad, matrix: lm });
      }
    }
  }

  const up = new THREE.Vector3(0, 1, 0);
  // Trunks lean a little; nothing in nature is perfectly plumb.
  const lean = new THREE.Vector3((rng() - 0.5) * 0.12, 1, (rng() - 0.5) * 0.12).normalize();
  branch(new THREE.Vector3(0, 0, 0), species === 'bush' ? up : lean, params.trunkH, params.trunkR, 0);

  const woodGeo = mergePieces(wood);
  const leavesGeo = mergePieces(leaves);
  cyl.dispose();
  quad.dispose();
  return { wood: woodGeo, leaves: leavesGeo, height: maxY };
}

// ── Rendering ───────────────────────────────────────────────────────────────

export interface PlantInstance {
  x: number;
  z: number;
  scale: number;
  rotY: number;
  species: Species;
  /** 0..1 colour jitter for this individual. */
  tint: number;
}

const VARIANTS_PER_SPECIES = 3;

/**
 * Draws every plant of one species using a handful of baked variants, each
 * instanced. Wood and leaves are separate materials so bark and foliage light
 * differently — and the leaves sway in the wind.
 */
function SpeciesForest({
  species,
  plants,
  layout,
  leafColor,
  leafDeep,
  barkColor,
  windStrength,
}: {
  species: Species;
  plants: PlantInstance[];
  layout: WorldLayout;
  leafColor: string;
  leafDeep: string;
  barkColor: string;
  windStrength: number;
}) {
  const builds = useMemo(
    () => Array.from({ length: VARIANTS_PER_SPECIES }, (_, i) => growTree(species, 1000 + i * 137 + species.length * 31)),
    [species],
  );
  useEffect(
    () => () => {
      builds.forEach((b) => {
        b.wood.dispose();
        b.leaves.dispose();
      });
    },
    [builds],
  );

  const bark = useMemo(() => barkTexture(), []);
  const leafTex = useMemo(() => leafClusterTexture(species === 'pine' ? 'needle' : 'broad'), [species]);

  // Bucket plants by variant so each InstancedMesh gets its own list.
  const buckets = useMemo(() => {
    const b: PlantInstance[][] = Array.from({ length: VARIANTS_PER_SPECIES }, () => []);
    plants.forEach((p, i) => b[i % VARIANTS_PER_SPECIES]!.push(p));
    return b;
  }, [plants]);

  const woodRefs = useRef<(THREE.InstancedMesh | null)[]>([]);
  const leafRefs = useRef<(THREE.InstancedMesh | null)[]>([]);
  const leafShader = useRef<{ uniforms: { uTime: { value: number }; uWind: { value: number } } } | null>(null);

  // Leaves get a wind vertex shader; higher parts of the tree move more.
  const leafMaterial = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      map: leafTex,
      alphaTest: 0.45,
      side: THREE.DoubleSide,
      roughness: 0.88,
      vertexColors: true,
    });
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = { value: 0 };
      shader.uniforms.uWind = { value: windStrength };
      shader.vertexShader = `uniform float uTime; uniform float uWind;\n${shader.vertexShader}`.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         {
           vec3 ip = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
           float h = max(0.0, transformed.y);
           float gust = sin(uTime * 0.55 + ip.x * 0.4 + ip.z * 0.35) * 0.5 + 0.5;
           float s = sin(uTime * 1.9 + ip.x * 1.7 + ip.z * 1.3) * (0.45 + gust * 0.55)
                   + sin(uTime * 3.3 + ip.z * 2.4) * 0.25;
           transformed.x += s * 0.035 * uWind * (0.35 + h);
           transformed.z += s * 0.022 * uWind * (0.35 + h);
         }`,
      );
      leafShader.current = shader as never;
    };
    mat.customProgramCacheKey = () => 'v7-leaf';
    return mat;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leafTex]);

  const woodMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ map: bark, color: barkColor, roughness: 1 }),
    [bark, barkColor],
  );
  useEffect(() => {
    woodMaterial.color.set(barkColor);
  }, [barkColor, woodMaterial]);

  useEffect(() => {
    const dummy = new THREE.Object3D();
    const col = new THREE.Color();
    const cLeaf = new THREE.Color(leafColor);
    const cDeep = new THREE.Color(leafDeep);

    buckets.forEach((list, vi) => {
      const woodMesh = woodRefs.current[vi];
      const leafMesh = leafRefs.current[vi];
      list.forEach((p, i) => {
        const y = terrainHeight(p.x, p.z, layout);
        const n = terrainNormal(p.x, p.z, layout);
        // Tilt slightly with the ground so trunks meet the slope naturally.
        dummy.position.set(p.x, y - 0.02, p.z);
        dummy.rotation.set(Math.atan2(n[2], 1) * 0.35, p.rotY, -Math.atan2(n[0], 1) * 0.35);
        dummy.scale.setScalar(p.scale);
        dummy.updateMatrix();
        woodMesh?.setMatrixAt(i, dummy.matrix);
        leafMesh?.setMatrixAt(i, dummy.matrix);
        col.copy(cLeaf).lerp(cDeep, p.tint * 0.75);
        // Slight per-tree brightness variation reads as sun and shade.
        col.multiplyScalar(0.88 + p.tint * 0.24);
        leafMesh?.setColorAt(i, col);
      });
      if (woodMesh) {
        woodMesh.count = list.length;
        woodMesh.instanceMatrix.needsUpdate = true;
      }
      if (leafMesh) {
        leafMesh.count = list.length;
        leafMesh.instanceMatrix.needsUpdate = true;
        if (leafMesh.instanceColor) leafMesh.instanceColor.needsUpdate = true;
      }
    });
  }, [buckets, layout, leafColor, leafDeep]);

  useFrame(({ clock }) => {
    if (leafShader.current) {
      leafShader.current.uniforms.uTime.value = clock.elapsedTime;
      leafShader.current.uniforms.uWind.value = windStrength;
    }
  });

  return (
    <group>
      {buckets.map((list, vi) => (
        <group key={vi}>
          <instancedMesh
            ref={(el) => {
              woodRefs.current[vi] = el;
            }}
            args={[builds[vi]!.wood, woodMaterial, Math.max(1, list.length)]}
            castShadow
            receiveShadow
            frustumCulled={false}
          />
          <instancedMesh
            ref={(el) => {
              leafRefs.current[vi] = el;
            }}
            args={[builds[vi]!.leaves, leafMaterial, Math.max(1, list.length)]}
            castShadow
            frustumCulled={false}
          />
        </group>
      ))}
    </group>
  );
}

/** All vegetation for the world, grouped by species. */
export function Vegetation({
  plants,
  layout,
  leafColor,
  leafDeep,
  barkColor,
  windStrength = 1,
}: {
  plants: PlantInstance[];
  layout: WorldLayout;
  leafColor: string;
  leafDeep: string;
  barkColor: string;
  windStrength?: number;
}) {
  const bySpecies = useMemo(() => {
    const m = new Map<Species, PlantInstance[]>();
    for (const p of plants) {
      const list = m.get(p.species) ?? [];
      list.push(p);
      m.set(p.species, list);
    }
    return m;
  }, [plants]);

  return (
    <group>
      {[...bySpecies.entries()].map(([species, list]) => (
        <SpeciesForest
          key={species}
          species={species}
          plants={list}
          layout={layout}
          leafColor={leafColor}
          leafDeep={leafDeep}
          barkColor={barkColor}
          windStrength={windStrength}
        />
      ))}
    </group>
  );
}
