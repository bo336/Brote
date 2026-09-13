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
import {
  applyMood, applyReveal, applySun, createClayMaterial,
  type ClayMaterial, type ClayOptions, type WorldMood,
} from './clay';
import { createFlatMaterial, type FlatOptions } from './flat';
import { applyWaterMood, applyWaterReveal, createWaterMaterial, type WaterMaterial, type WaterOptions } from './water';
import { REVEAL_OFF, type RevealState } from '../reveal';

const clayCache = new Map<string, ClayMaterial>();
const waterCache = new Map<string, WaterMaterial>();
const flatCache = new Map<string, THREE.MeshBasicMaterial>();
const textureCache = new Map<string, THREE.Texture>();

let lastMood: WorldMood | null = null;
/**
 * The arrival in force. Held here for the same reason the mood is: a material
 * built mid-session — a prop placed during a ceremony, say — has to arrive
 * matching the ones around it rather than at its finished state.
 */
let lastReveal: RevealState = REVEAL_OFF;

/** The sun in force, so a material built mid-session is lit like the rest. */
const lastSunDir = new THREE.Vector3(0.4, 0.8, 0.3).normalize();
const lastSunColor = new THREE.Color(1, 0.9, 0.75);

/** The sun, every frame: its direction and its colour times intensity. Allocates nothing. */
export function updateSun(dirW: THREE.Vector3, color: THREE.Color): void {
  lastSunDir.copy(dirW);
  lastSunColor.copy(color);
  for (const mat of clayCache.values()) applySun(mat, dirW, color);
}

/** The grass mask in force, for the ground to darken under the blades. */
let groundGrass: { tex: THREE.Texture; info: THREE.Vector4 } | null = null;

function applyGroundGrass(mat: ClayMaterial): void {
  const u = mat.clayUniforms;
  if (!groundGrass || !u.uGrassMask) return;
  u.uGrassMask.value = groundGrass.tex;
  (u.uGrassMaskInfo!.value as THREE.Vector4).copy(groundGrass.info);
}

/** The grass's density mask and where it sits, handed to every world material that is ground. */
export function setGroundGrass(tex: THREE.Texture, res: number, step: number, extent: number): void {
  groundGrass = { tex, info: new THREE.Vector4(res, step, extent, 1) };
  for (const mat of clayCache.values()) applyGroundGrass(mat);
}

/** The mood in force, read back — the grass takes its fog from it. */
export function currentMood(): WorldMood | null {
  return lastMood;
}

/** The same sun, read back — the sky and the water need it too. */
export function currentSun(): { dir: THREE.Vector3; color: THREE.Color } {
  return { dir: lastSunDir, color: lastSunColor };
}

function clayKey(o: ClayOptions): string {
  return [
    o.wind ? 'w' : '-',
    o.wobble === false ? '-' : 'b',
    o.heightFog === false ? '-' : 'f',
    o.ao === false ? '-' : 'a',
    o.rim === false ? '-' : 'r',
    o.vertexColors === false ? '-' : 'c',
    o.ground ? 'g' : '-',
    o.transparent ? 't' : '-',
    o.side ?? THREE.FrontSide,
    o.wobbleScale ?? 1,
    String(o.color ?? ''),
    o.alphaMap?.uuid ?? '-',
    o.rimBoost ?? 1,
    o.roughness ?? '-',
    o.map?.uuid ?? '-',
    o.alphaTest ?? 0,
    o.translucent ? 'sss' : '-',
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
  applySun(mat, lastSunDir, lastSunColor);
  applyGroundGrass(mat);
  applyReveal(mat, lastReveal);
  clayCache.set(key, mat);
  return mat;
}

export function getWaterMaterial(opts: WaterOptions): WaterMaterial {
  const key = `${opts.tier}:${opts.color ?? ''}:${opts.depthScale ?? ''}:${opts.foamWidth ?? ''}`;
  const hit = waterCache.get(key);
  if (hit) return hit;
  const mat = createWaterMaterial(opts);
  if (lastMood) applyWaterMood(mat, lastMood);
  applyWaterReveal(mat, lastReveal);
  waterCache.set(key, mat);
  return mat;
}

export function getFlatMaterial(opts: FlatOptions = {}): THREE.MeshBasicMaterial {
  const key = [
    String(opts.color ?? ''), opts.map?.uuid ?? '', opts.opacity ?? 1,
    opts.side ?? '', opts.depthWrite ?? '', opts.vertexColors ? 'vc' : '-',
    opts.polygonOffset ?? '',
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
  // The sea takes the fog band too. It is the only surface that reaches the
  // horizon, so it is the only one where leaving fog out is visible as a hard
  // line between the water and the sky.
  for (const mat of waterCache.values()) applyWaterMood(mat, mood);
}

/**
 * The tier-up ceremony's beat 3, pushed to every live material at once.
 *
 * Called every frame for the ~8-15 seconds an arrival runs and once on either
 * side of it. Six numbers per material, no allocation, no recompile — see
 * `lib/render/reveal.ts` for why it can afford to be in every shader.
 */
export function updateReveal(reveal: RevealState): void {
  lastReveal = reveal;
  for (const mat of clayCache.values()) applyReveal(mat, reveal);
  for (const mat of waterCache.values()) applyWaterReveal(mat, reveal);
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
  lastReveal = REVEAL_OFF;
  groundGrass = null;
}

export type { ClayMaterial, ClayOptions, WaterMaterial, WaterOptions, WorldMood, QualityTier };
