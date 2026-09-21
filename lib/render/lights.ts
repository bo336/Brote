/**
 * The light rig: a sun, a sky, a rim, an ambient lift.
 *
 * **v2 (`23-ART-DIRECTION-V2.md`): the sun casts a real, soft shadow** at T2
 * and up, from a shadow camera that follows Pip so its resolution is spent where
 * the player is looking. Time of day is still four authored presets cross-faded
 * over ~2 s — every frame is one somebody chose — but the presets are now
 * written for physically based materials under AgX.
 */
import * as THREE from 'three';

import { LIGHT_PRESET_CROSSFADE_S, LIVELINESS, LOOK, TREE_LOD } from '@/lib/world/config';
import type { TimeOfDay } from '@/lib/world/types';
import { PRESETS, type LightPreset } from './palette';
import { warmerBy } from '@/lib/world/liveliness';

export interface LightRig {
  group: THREE.Group;
  /** The sun. Casts the shadow at T2+. */
  key: THREE.DirectionalLight;
  /** Sky to ground. Fills the shade blue and bounces the ground warm. */
  fill: THREE.HemisphereLight;
  /** Cool, from behind-left. Separates silhouettes from the sky. */
  rim: THREE.DirectionalLight;
  /** Lifts the darkest shadow off pure black. */
  ambient: THREE.AmbientLight;
  /** What the sun aims at: Pip, snapped to shadow texels. */
  target: THREE.Object3D;
  /** Unit vector from the ground toward the sun. Read by materials, sky and water. */
  sunDir: THREE.Vector3;
  /** The preset currently in force, for the cross-fade to read from. */
  current: LightPreset;
}

/** The sun's azimuth, fixed: the island's good side faces it. */
const SUN_AZIMUTH_Z = 0.5;

export function buildLightRig(initial: TimeOfDay = 'dia'): LightRig {
  const preset = PRESETS[initial];
  const group = new THREE.Group();
  group.name = 'lightRig';

  const key = new THREE.DirectionalLight(preset.keyColor, preset.keyIntensity);
  key.name = 'key';
  key.castShadow = false;
  key.shadow.bias = LOOK.shadowBias;
  key.shadow.normalBias = LOOK.shadowNormalBias;
  // The trees' shadow-only copies live on their own layer (`useTreeLod.ts`).
  key.shadow.camera.layers.enable(TREE_LOD.shadowLayer);
  const target = new THREE.Object3D();
  target.name = 'sunTarget';
  key.target = target;

  const fill = new THREE.HemisphereLight(preset.fillSky, preset.fillGround, preset.fillIntensity);
  fill.name = 'fill';
  const rim = new THREE.DirectionalLight(preset.rimColor, preset.rimIntensity);
  rim.name = 'rim';
  rim.position.set(-8, 5, -9);
  const ambient = new THREE.AmbientLight(preset.ambientColor, preset.ambientIntensity);
  ambient.name = 'ambient';

  group.add(key, target, fill, rim, ambient);
  const rig: LightRig = {
    group, key, fill, rim, ambient, target, sunDir: new THREE.Vector3(), current: { ...preset },
  };
  aimSun(rig, preset.keyElevationDeg);
  return rig;
}

function aimSun(rig: LightRig, elevationDeg: number): void {
  const e = (elevationDeg * Math.PI) / 180;
  rig.sunDir.set(Math.cos(e), Math.sin(e), SUN_AZIMUTH_Z).normalize();
}

/**
 * Shadows on or off, and at what resolution over how much ground. Called when
 * the tier changes — rarely, and a shadow map is the one thing that has to be
 * re-allocated when it does.
 */
export function configureShadows(rig: LightRig, enabled: boolean, mapSize: number, extentM: number): void {
  const key = rig.key;
  key.castShadow = enabled;
  if (key.shadow.mapSize.x !== mapSize) {
    key.shadow.mapSize.set(mapSize, mapSize);
    key.shadow.map?.dispose();
    key.shadow.map = null;
  }
  const cam = key.shadow.camera;
  cam.left = -extentM;
  cam.right = extentM;
  cam.top = extentM;
  cam.bottom = -extentM;
  cam.near = LOOK.shadowNearM;
  cam.far = LOOK.shadowFarM;
  cam.updateProjectionMatrix();
}

/**
 * Put the sun above Pip. The target is snapped to the shadow map's texel size,
 * so walking does not make every shadow edge on the island crawl.
 */
export function followTarget(rig: LightRig, x: number, y: number, z: number, texelM: number): void {
  const snap = Math.max(1e-3, texelM);
  const tx = Math.round(x / snap) * snap;
  const tz = Math.round(z / snap) * snap;
  rig.target.position.set(tx, y, tz);
  rig.key.position.set(
    tx + rig.sunDir.x * LOOK.sunDistanceM,
    y + rig.sunDir.y * LOOK.sunDistanceM,
    tz + rig.sunDir.z * LOOK.sunDistanceM,
  );
  rig.target.updateMatrixWorld();
}

/**
 * Blend the rig toward a preset. `t` is a **frame-rate-independent** weight —
 * the caller passes `1 - Math.exp(-lambda * dt)`. Pass `t = 1` to snap.
 */
export function applyPreset(rig: LightRig, preset: LightPreset, t: number): void {
  const k = Math.min(1, Math.max(0, t));
  const c = rig.current;

  rig.key.color.lerp(colorOf(preset.keyColor), k);
  // The cross-fade moves the BASE intensity; liveliness warms on top of it.
  c.keyIntensity += (preset.keyIntensity - c.keyIntensity) * k;
  rig.key.intensity = c.keyIntensity;
  c.keyElevationDeg += (preset.keyElevationDeg - c.keyElevationDeg) * k;
  aimSun(rig, c.keyElevationDeg);

  rig.fill.color.lerp(colorOf(preset.fillSky), k);
  rig.fill.groundColor.lerp(colorOf(preset.fillGround), k);
  rig.fill.intensity += (preset.fillIntensity - rig.fill.intensity) * k;

  rig.rim.color.lerp(colorOf(preset.rimColor), k);
  rig.rim.intensity += (preset.rimIntensity - rig.rim.intensity) * k;

  rig.ambient.color.lerp(colorOf(preset.ambientColor), k);
  rig.ambient.intensity += (preset.ambientIntensity - rig.ambient.intensity) * k;
}

const scratchColor = new THREE.Color();
function colorOf(hex: string): THREE.Color {
  return scratchColor.set(hex);
}

/**
 * `liveliness` adds warmth and **only** warmth. **Assigned from the base, never
 * multiplied into the live value** — `intensity *= warmth` every frame grew the
 * sun past the float limit in seconds, and every lit surface went black.
 */
export function applyLiveliness(rig: LightRig, liveliness: number): void {
  rig.key.intensity = rig.current.keyIntensity * warmerBy(LIVELINESS.keyWarmthGain, liveliness);
}

/** The cross-fade rate, as a lambda for the exponential damping form. */
export const PRESET_LAMBDA = 1 / LIGHT_PRESET_CROSSFADE_S;

export function disposeLightRig(rig: LightRig): void {
  rig.key.shadow.map?.dispose();
  rig.key.dispose();
  rig.fill.dispose();
  rig.rim.dispose();
  rig.ambient.dispose();
  rig.group.clear();
}
