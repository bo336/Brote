/**
 * The one material and texture cache, with a working `disposeAll()`.
 *
 * The old world had **three** `texCache` copies, all module-level, none of them
 * ever cleared — they leaked for the app's lifetime across route changes
 * (`02-AUDIT.md` §7). This is the single cache that replaces them, and the
 * dispose path is written here, now, rather than promised for later.
 *
 * Budget: **≤ 8 distinct live material instances** (`06-ART-DIRECTION.md` §4).
 * Colour variation comes from vertex colours and instance colours, never from a
 * new material — every new material is a shader compile and a visible hitch on
 * cheap Android.
 */
import * as THREE from 'three';

import type { QualityTier } from '@/lib/world/types';
import { applyMood, createClayMaterial, type ClayMaterial, type ClayOptions, type WorldMood } from './clay';
import { createFlatMaterial, type FlatOptions } from './flat';
import { createWaterMaterial, type WaterMaterial, type WaterOptions } from './water';

const clayCache = new Map<string, ClayMaterial>();
const waterCache = new Map<string, WaterMaterial>();
const flatCache = new Map<string, THREE.MeshBasicMaterial>();
const textureCache = new Map<string, THREE.Texture>();

let lastMood: WorldMood | null = null;

function clayKey(o: ClayOptions): string {
  return [
    o.wind ? 'w' : '-',
    o.wobble === false ? '-' : 'b',
    o.heightFog === false ? '-' : 'f',
    o.ao === false ? '-' : 'a',
    o.rim === false ? '-' : 'r',
    o.vertexColors === false ? '-' : 'c',
    o.transparent ? 't' : '-',
    o.side ?? THREE.FrontSide,
    o.wobbleScale ?? 1,
    String(o.color ?? ''),
    o.alphaMap?.uuid ?? '-',
  ].join(':');
}

/**
 * A clay material for these options, created once. The mood in force is applied
 * immediately, so a material created mid-session matches the ones around it.
 */
export function getClayMaterial(opts: ClayOptions = {}): ClayMaterial {
  const key = clayKey(opts);
  const hit = clayCache.get(key);
  if (hit) return hit;
  const mat = createClayMaterial(opts);
  if (lastMood) applyMood(mat, lastMood);
  clayCache.set(key, mat);
  return mat;
}

export function getWaterMaterial(opts: WaterOptions): WaterMaterial {
  const key = `${opts.tier}:${opts.color ?? ''}:${opts.depthScale ?? ''}:${opts.foamWidth ?? ''}`;
  const hit = waterCache.get(key);
  if (hit) return hit;
  const mat = createWaterMaterial(opts);
  waterCache.set(key, mat);
  return mat;
}

export function getFlatMaterial(opts: FlatOptions = {}): THREE.MeshBasicMaterial {
  const key = [
    String(opts.color ?? ''), opts.map?.uuid ?? '', opts.opacity ?? 1,
    opts.side ?? '', opts.depthWrite ?? '', opts.vertexColors ? 'vc' : '-',
  ].join(':');
  const hit = flatCache.get(key);
  if (hit) return hit;
  const mat = createFlatMaterial(opts);
  flatCache.set(key, mat);
  return mat;
}

/**
 * The one flat, vertex-coloured, transparent material.
 *
 * The sky dome, the mist wall, the ghosted silhouette behind it and the
 * interaction cue all use it. They look nothing alike, but they are all
 * unlit surfaces whose colour and opacity live in `attributes.color` — and the
 * budget of eight live materials (`06-ART-DIRECTION.md` §4) has no room for
 * four separate ones.
 */
export function getOverlayMaterial(): THREE.MeshBasicMaterial {
  return getFlatMaterial({ vertexColors: true, transparent: true, depthWrite: false, opacity: 1 });
}

/**
 * One texture cache for the whole game. `build` runs at most once per key, so a
 * canvas-painted texture is generated once and disposed exactly once.
 */
export function getTexture(key: string, build: () => THREE.Texture): THREE.Texture {
  const hit = textureCache.get(key);
  if (hit) return hit;
  const tex = build();
  textureCache.set(key, tex);
  return tex;
}

/**
 * Time of day and biome shift the whole scene by changing ~11 uniforms on the
 * live materials. Never by re-creating them.
 */
export function updateMood(mood: WorldMood): void {
  lastMood = mood;
  for (const mat of clayCache.values()) applyMood(mat, mood);
}

/** How many materials are live — the perf overlay watches this against the 8. */
export function liveMaterialCount(): number {
  return clayCache.size + waterCache.size + flatCache.size;
}

/** Water needs its own tick because only it is animated by time. */
export function tickWaterMaterials(timeS: number, flow?: number): void {
  for (const mat of waterCache.values()) {
    mat.waterUniforms.uTime!.value = timeS;
    if (flow !== undefined) mat.waterUniforms.uFlow!.value = flow;
  }
}

/**
 * Drop everything. Called from `MundoGame`'s unmount effect; a dev assertion
 * then checks `renderer.info.memory` reads `{geometries: 0, textures: 0}`.
 */
export function disposeAll(): void {
  for (const mat of clayCache.values()) mat.dispose();
  for (const mat of waterCache.values()) mat.dispose();
  for (const mat of flatCache.values()) mat.dispose();
  for (const tex of textureCache.values()) tex.dispose();
  clayCache.clear();
  waterCache.clear();
  flatCache.clear();
  textureCache.clear();
  lastMood = null;
}

export type { ClayMaterial, ClayOptions, WaterMaterial, WaterOptions, WorldMood, QualityTier };
