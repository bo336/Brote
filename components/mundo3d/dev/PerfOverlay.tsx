'use client';

import { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import type * as THREE from 'three';

import { PERF_CEILINGS, QUALITY_MONITOR } from '@/lib/world/config';
import { liveMaterialCount } from '@/lib/render/materials';
import type { QualityTier } from '@/lib/world/types';

/**
 * The measurement harness, behind `?perf=1`.
 *
 * `03-RESEARCH-TECH.md` §6 is blunt: there is no credible published budget for
 * WebGL2 on low-end Android, so the ceilings in `lib/world/config.ts` are OURS —
 * hypotheses. This is the instrument that validates them, and every number it
 * shows goes into `21-PERF-LOG.md`.
 *
 * It is two pieces on purpose: a probe INSIDE the canvas that samples
 * `renderer.info` without allocating, and a DOM readout OUTSIDE it. drei's
 * `<Html>` costs a layout every frame on cheap Android — exactly the kind of
 * thing this overlay exists to catch.
 *
 * Tree-shaken in production: `MundoGame` only reaches for this module when
 * `process.env.NODE_ENV !== 'production'`, a branch the bundler folds away.
 */
export interface PerfStats {
  fps: number;
  medianMs: number;
  p95Ms: number;
  calls: number;
  triangles: number;
  geometries: number;
  textures: number;
  materials: number;
  tier: QualityTier;
  heapMB: number | null;
  /** Meshes in the scene, and how many of them the renderer actually drew. */
  meshes: number;
  instances: number;
}

const WINDOW = QUALITY_MONITOR.medianWindowFrames;
/** Anything slower than this was an idle gap, not a frame. */
const GAP_MS = 1000;

/** Module-scope so nothing is allocated per frame (`01-RULES.md` §3.7). */
const samples = new Float32Array(WINDOW);
const scratch = new Float32Array(WINDOW);
const stats: PerfStats = {
  fps: 0, medianMs: 0, p95Ms: 0, calls: 0, triangles: 0,
  geometries: 0, textures: 0, materials: 0, tier: 1, heapMB: null,
  meshes: 0, instances: 0,
};
let head = 0;
let filled = 0;

interface MemoryInfo {
  usedJSHeapSize: number;
}

function readHeapMB(): number | null {
  const perf = performance as Performance & { memory?: MemoryInfo };
  if (!perf.memory) return null;
  return Math.round((perf.memory.usedJSHeapSize / 1048576) * 10) / 10;
}

/** Lives inside `<Canvas>`. Samples only — it renders nothing. */
export function PerfProbe({ tier }: { tier: QualityTier }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const lastHeapAtRef = useRef(0);
  const lastSceneAtRef = useRef(0);

  useFrame((_, delta) => {
    const ms = delta * 1000;
    // A `frameloop="demand"` gap is not a slow frame — it is the absence of one.
    // Recording it would put a 38-second sample in the p95 and make the number
    // meaningless, which is the opposite of what this overlay is for.
    if (ms > GAP_MS) return;
    samples[head] = ms;
    head = (head + 1) % WINDOW;
    if (filled < WINDOW) filled++;

    scratch.set(samples.subarray(0, filled));
    const slice = scratch.subarray(0, filled);
    slice.sort();
    stats.medianMs = slice[filled >> 1] ?? 0;
    stats.p95Ms = slice[Math.min(filled - 1, Math.floor(filled * 0.95))] ?? 0;
    stats.fps = ms > 0 ? Math.round(1000 / ms) : 0;
    stats.calls = gl.info.render.calls;
    stats.triangles = gl.info.render.triangles;
    stats.geometries = gl.info.memory.geometries;
    stats.textures = gl.info.memory.textures;
    stats.materials = liveMaterialCount();
    stats.tier = tier;

    // The heap read is not free, so it happens about once a second.
    const now = performance.now();
    if (now - lastHeapAtRef.current > 1000) {
      lastHeapAtRef.current = now;
      stats.heapMB = readHeapMB();
    }
    // Walking the graph is not free either. Once a second is enough to notice
    // that a pool exists but is never drawn, which is the failure this catches.
    if (now - lastSceneAtRef.current > 1000) {
      lastSceneAtRef.current = now;
      let meshes = 0;
      let instances = 0;
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh & { isInstancedMesh?: boolean; count?: number };
        if (!mesh.isMesh) return;
        meshes++;
        if (mesh.isInstancedMesh) instances += mesh.count ?? 0;
      });
      stats.meshes = meshes;
      stats.instances = instances;
    }
  });

  return null;
}

function Row({ label, value, ceiling }: { label: string; value: number | string; ceiling?: number }) {
  const over = typeof value === 'number' && ceiling !== undefined && value > ceiling;
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="opacity-60">{label}</span>
      <span className={over ? 'font-bold text-brote-coral' : ''}>
        {typeof value === 'number' ? Math.round(value * 10) / 10 : value}
        {ceiling !== undefined && <span className="opacity-40"> / {ceiling}</span>}
      </span>
    </div>
  );
}

/** Lives outside `<Canvas>`, in the DOM. Reads the probe's numbers at 4 Hz. */
export function PerfOverlay() {
  const [snap, setSnap] = useState<PerfStats>(stats);
  useEffect(() => {
    const id = setInterval(() => setSnap({ ...stats }), 250);
    return () => clearInterval(id);
  }, []);

  const ceil = PERF_CEILINGS[snap.tier] ?? PERF_CEILINGS[1]!;
  return (
    <div
      className="pointer-events-none absolute right-2 top-2 z-50 w-52 rounded-card bg-brote-ink/85 p-3 font-mono text-[11px] leading-relaxed text-brote-cream backdrop-blur-sm"
      aria-hidden
    >
      <div className="mb-1 font-bold">T{snap.tier} · {snap.fps} fps</div>
      <Row label="median ms" value={snap.medianMs} />
      <Row label="p95 ms" value={snap.p95Ms} ceiling={ceil.frameMs} />
      <Row label="draw calls" value={snap.calls} ceiling={ceil.drawCalls} />
      <Row label="triangles" value={snap.triangles} ceiling={ceil.triangles} />
      <Row label="geometries" value={snap.geometries} ceiling={ceil.geometries} />
      <Row label="textures" value={snap.textures} ceiling={ceil.textures} />
      <Row label="materials" value={snap.materials} ceiling={8} />
      <Row label="meshes" value={snap.meshes} />
      <Row label="instances" value={snap.instances} />
      <Row label="heap MB" value={snap.heapMB ?? 'n/d'} />
    </div>
  );
}
