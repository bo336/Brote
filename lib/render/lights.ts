/**
 * The light rig: **four lights, forever** (`06-ART-DIRECTION.md` §6).
 *
 * No environment map. No HDRI. No area lights. One warm key and one cool fill,
 * and that single relationship does 80% of the work the old world's five
 * post-processing passes were attempting.
 *
 * Time of day is four **authored presets** cross-faded over ~2 s, not a
 * continuous sun simulation — so every frame of the game is a frame somebody
 * chose.
 */
import * as THREE from 'three';

import { LIGHT_PRESET_CROSSFADE_S, LIVELINESS } from '@/lib/world/config';
import type { TimeOfDay } from '@/lib/world/types';
import { PRESETS, type LightPreset } from './palette';

export interface LightRig {
  group: THREE.Group;
  /** Warm sun. Casts a real shadow only at T3. */
  key: THREE.DirectionalLight;
  /** Sky to ground. Does the ambient-occlusion-ish work for free. */
  fill: THREE.HemisphereLight;
  /** Cool, from behind-left. Separates silhouettes from the sky. */
  rim: THREE.DirectionalLight;
  /** Lifts the darkest band off pure black. */
  ambient: THREE.AmbientLight;
  /** The preset currently in force, for the cross-fade to read from. */
  current: LightPreset;
}

/** How far out the key and rim lights sit. Direction is all that matters. */
const LIGHT_DISTANCE = 14;

export function buildLightRig(initial: TimeOfDay = 'dia'): LightRig {
  const preset = PRESETS[initial];
  const group = new THREE.Group();
  group.name = 'lightRig';

  const key = new THREE.DirectionalLight(preset.keyColor, preset.keyIntensity);
  key.name = 'key';
  const fill = new THREE.HemisphereLight(preset.fillSky, preset.fillGround, preset.fillIntensity);
  fill.name = 'fill';
  const rim = new THREE.DirectionalLight(preset.rimColor, preset.rimIntensity);
  rim.name = 'rim';
  rim.position.set(-8, 5, -9);
  const ambient = new THREE.AmbientLight(preset.ambientColor, preset.ambientIntensity);
  ambient.name = 'ambient';

  group.add(key, fill, rim, ambient);
  const rig: LightRig = { group, key, fill, rim, ambient, current: { ...preset } };
  positionKey(rig, preset.keyElevationDeg);
  return rig;
}

function positionKey(rig: LightRig, elevationDeg: number): void {
  const e = (elevationDeg * Math.PI) / 180;
  rig.key.position.set(Math.cos(e) * LIGHT_DISTANCE, Math.sin(e) * LIGHT_DISTANCE, LIGHT_DISTANCE * 0.5);
}

/**
 * Blend the rig toward a preset. `t` is a **frame-rate-independent** weight —
 * the caller passes `1 - Math.exp(-lambda * dt)`, never a raw constant
 * (`01-RULES.md` §3.13). Pass `t = 1` to snap.
 */
export function applyPreset(rig: LightRig, preset: LightPreset, t: number): void {
  const k = Math.min(1, Math.max(0, t));
  const c = rig.current;

  rig.key.color.lerp(colorOf(preset.keyColor), k);
  c.keyIntensity = rig.key.intensity += (preset.keyIntensity - rig.key.intensity) * k;
  c.keyElevationDeg += (preset.keyElevationDeg - c.keyElevationDeg) * k;
  positionKey(rig, c.keyElevationDeg);

  rig.fill.color.lerp(colorOf(preset.fillSky), k);
  rig.fill.groundColor.lerp(colorOf(preset.fillGround), k);
  rig.fill.intensity += (preset.fillIntensity - rig.fill.intensity) * k;

  rig.rim.color.lerp(colorOf(preset.rimColor), k);
  rig.rim.intensity += (preset.rimIntensity - rig.rim.intensity) * k;

  rig.ambient.color.lerp(colorOf(preset.ambientColor), k);
  rig.ambient.intensity += (preset.ambientIntensity - rig.ambient.intensity) * k;
}

/** Scratch colour: `THREE.Color.lerp` needs one, and it must not be allocated. */
const scratchColor = new THREE.Color();
function colorOf(hex: string): THREE.Color {
  return scratchColor.set(hex);
}

/**
 * `liveliness` adds warmth and **only** warmth (`01-RULES.md` §4.2). A player
 * returning after two months finds their island exactly as they left it, just
 * quieter — never dimmer, never greyer, never smaller.
 */
export function applyLiveliness(rig: LightRig, liveliness: number): void {
  const warmth = Math.min(1, Math.max(0, (liveliness - LIVELINESS.min) / (LIVELINESS.max - LIVELINESS.min)));
  rig.key.intensity *= 1 + LIVELINESS.keyWarmthGain * warmth;
}

/** The cross-fade rate, as a lambda for the exponential damping form. */
export const PRESET_LAMBDA = 1 / LIGHT_PRESET_CROSSFADE_S;

export function disposeLightRig(rig: LightRig): void {
  rig.key.dispose();
  rig.fill.dispose();
  rig.rim.dispose();
  rig.ambient.dispose();
  rig.group.clear();
}
