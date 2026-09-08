/**
 * `waterMaterial` — the one special surface.
 *
 * Ported from the old `Terrain.tsx`: a per-vertex `aDepth` attribute drives
 * colour, alpha and a shoreline foam line, with crossing sine swells. It was the
 * best-looking thing in the old scene (`02-AUDIT.md` §8) and the technique is
 * kept intact.
 *
 * What changed (`06-ART-DIRECTION.md` §4):
 *  - re-tuned to `clay.water` / `clay.waterDeep` / `clay.foam`;
 *  - **the foam edge is painted hard**, not a soft gradient — clay water has a
 *    drawn shoreline;
 *  - swell count, specular and caustics come from the quality tier as UNIFORMS,
 *    not defines, so changing tier costs three floats instead of a shader
 *    recompile — a tier change may never drop a frame
 *    (`07-RENDER-ARCHITECTURE.md` §4.3).
 *
 * Water is the only reflective surface in the game, and therefore the thing the
 * eye goes to. That is deliberate.
 */
import * as THREE from 'three';

import { revealModeIndex, type RevealState } from '../reveal';

import type { QualityTier } from '@/lib/world/types';
import { CLAY } from '../palette';

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uFlow;
  uniform float uSwells;
  attribute float aDepth;
  varying float vDepth;
  varying vec2 vWorld;
  varying vec3 vNormalW;
  varying float vFogDepth;
  void main(){
    vDepth = aDepth;
    vWorld = vec2(position.x, position.z);
    float t = uTime * uFlow;
    // Swell one is always present; swell two switches on from T2 up.
    float w1 = sin(position.x * 3.1 + t * 1.05) * cos(position.z * 2.6 - t * 0.8);
    float w2 = sin(position.x * 7.3 - t * 1.7 + position.z * 5.1) * 0.45;
    float amp = clamp(vDepth * 2.2, 0.05, 1.0) * 0.022;
    vec3 p = position;
    // uSwells is 0, 1 or 2 by quality tier. A uniform rather than a define,
    // because a tier change must never recompile a shader.
    p.y += (w1 * step(0.5, uSwells) + w2 * step(1.5, uSwells)) * amp;
    // Approximate the normal from the same wave field, for the specular.
    float dx = cos(position.x * 3.1 + t * 1.05) * 3.1;
    float dz = -sin(position.z * 2.6 - t * 0.8) * 2.6;
    vNormalW = normalize(vec3(-dx * amp, 1.0, -dz * amp));
    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    // The same view depth the clay carries, so the sea and the land agree
    // about where the horizon is. Without it the open sea met the sky at a
    // hard line and read as a painted backdrop.
    vFogDepth = -mvPosition.z;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uFlow;
  uniform vec3 uShallow;
  uniform vec3 uDeep;
  uniform vec3 uFoam;
  uniform vec3 uSun;
  uniform float uDepthScale;
  uniform float uFoamWidth;
  uniform vec3  uFogColor;
  uniform float uFogNear;
  uniform float uFogFar;
  uniform float uFogDensity;
  uniform float uSpecular;
  uniform float uCaustics;
  uniform vec3 uRevealCentre;
  uniform float uRevealRadius;
  uniform float uRevealAmount;
  uniform float uRevealMode;
  varying float vDepth;
  varying vec2 vWorld;
  varying vec3 vNormalW;
  varying float vFogDepth;

  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p){
    vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1,0)), u.x), mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x), u.y);
  }

  void main(){
    // The río arriving (08-WORLD-AND-PROGRESSION.md §5 beat 3): water breaks
    // through at the head and cuts down the channel. The front is a distance
    // from the head, so the water travels — it does not fade up in place.
    //
    // A discard rather than an alpha ramp, because water at 0.2 alpha is a
    // stain on the rock and not an empty channel. The leading edge keeps a
    // couple of metres of foam-width jitter so it reads as a wavefront.
    if (uRevealMode > 3.5) {
      float bhD = length(vWorld - uRevealCentre.xz);
      float bhFront = uRevealAmount * uRevealRadius;
      float bhJitter = noise(vWorld * 3.0 + vec2(uTime * 0.9, 0.0)) * 0.9;
      if (bhD > bhFront + bhJitter) discard;
    }

    // Depth drives colour: you can read the shelving bed through the water.
    float d = clamp(vDepth / uDepthScale, 0.0, 1.0);
    vec3 col = mix(uShallow, uDeep, pow(d, 0.7));

    if (uCaustics > 0.0) {
      vec2 q = vWorld * 5.0;
      float caus = noise(q + vec2(uTime * 0.35 * uFlow, -uTime * 0.28 * uFlow));
      caus = pow(caus, 3.0);
      col += vec3(0.85, 0.95, 0.8) * caus * (1.0 - d) * 0.35 * uCaustics;
    }

    // Water is the ONLY place a specular highlight is allowed, and only at T2+.
    if (uSpecular > 0.0) {
      float spec = pow(max(dot(normalize(vNormalW), normalize(uSun)), 0.0), 48.0);
      col += vec3(1.0) * spec * 0.55 * uSpecular;
    }

    // The shoreline foam. A HARD painted edge, not a soft gradient: clay water
    // has a drawn line where it meets the land.
    float foamN = noise(vWorld * 14.0 + vec2(uTime * 0.5, uTime * 0.35)) * 0.35;
    float foam = step(vDepth, uFoamWidth * (0.75 + foamN));
    col = mix(col, uFoam, foam);

    float alpha = mix(0.62, 0.93, d);
    alpha = mix(alpha, 0.9, foam);

    // Height fog, exactly as the clay applies it. This is what turns the open
    // sea from a blue plate into distance.
    float fogT = smoothstep(uFogNear, uFogFar, vFogDepth) * uFogDensity;
    col = mix(col, uFogColor, fogT);
    // …and it fades out as it fogs, so the last few metres before the horizon
    // hand over to the sky instead of stopping against it.
    alpha = mix(alpha, 1.0, fogT);

    gl_FragColor = vec4(col, alpha);
  }
`;

export interface WaterOptions {
  tier: QualityTier;
  /** Surface tint, usually the biome's chalked water colour. */
  color?: string;
  /** From `MirrorParams.riverFlow` — real litres, made visible as speed. */
  flow?: number;
  sunDirection?: THREE.Vector3;
  /** Basin depth the colour ramp is normalised against. */
  depthScale?: number;
  /** Metres of foam at the waterline. */
  foamWidth?: number;
}

export interface WaterMaterial extends THREE.ShaderMaterial {
  waterUniforms: Record<string, THREE.IUniform>;
}

/** Swells, caustics and specular all come from the tier — never a constant. */
export function waterTierUniforms(tier: QualityTier): { swells: number; specular: number; caustics: number } {
  return {
    swells: tier === 0 ? 0 : tier === 1 ? 1 : 2,
    specular: tier >= 2 ? 1 : 0,
    caustics: tier >= 3 ? 1 : 0,
  };
}

export function createWaterMaterial(opts: WaterOptions): WaterMaterial {
  const base = new THREE.Color(opts.color ?? CLAY.water);
  const tierUniforms = waterTierUniforms(opts.tier);
  const uniforms: Record<string, THREE.IUniform> = {
    uTime: { value: 0 },
    uFlow: { value: opts.flow ?? 1 },
    uSwells: { value: tierUniforms.swells },
    uSpecular: { value: tierUniforms.specular },
    uCaustics: { value: tierUniforms.caustics },
    uShallow: { value: base.clone().lerp(new THREE.Color(CLAY.foam), 0.45) },
    uDeep: { value: new THREE.Color(CLAY.waterDeep) },
    uFoam: { value: new THREE.Color(CLAY.foam) },
    uSun: { value: (opts.sunDirection ?? new THREE.Vector3(0.4, 0.8, 0.3)).clone().normalize() },
    uDepthScale: { value: opts.depthScale ?? 0.34 },
    uFoamWidth: { value: opts.foamWidth ?? 0.085 },
    // Zero until a mood says otherwise, for the same reason the clay defaults
    // this way: a material whose default paints the world solid white is a trap.
    uFogColor: { value: new THREE.Color('#F7F5EF') },
    uFogNear: { value: 1 },
    uFogFar: { value: 1000 },
    uFogDensity: { value: 0 },
    // The arrival, idle. See `../reveal.ts`; `uRevealMode 0` is the branch this
    // takes for all but ~14 seconds in the life of an island.
    uRevealCentre: { value: new THREE.Vector3() },
    uRevealRadius: { value: 1 },
    uRevealAmount: { value: 1 },
    uRevealMode: { value: 0 },
  };

  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  }) as WaterMaterial;
  mat.waterUniforms = uniforms;
  return mat;
}

/** Advance the surface. One number per frame — no allocation, no rebuild. */
export function tickWater(mat: WaterMaterial, timeS: number, flow?: number): void {
  mat.waterUniforms.uTime!.value = timeS;
  if (flow !== undefined) mat.waterUniforms.uFlow!.value = flow;
}

/** Push the arrival state in. Only `channel` touches the water. */
export function applyWaterReveal(mat: WaterMaterial, reveal: RevealState): void {
  const u = mat.waterUniforms;
  (u.uRevealCentre!.value as THREE.Vector3).set(...reveal.centre);
  u.uRevealRadius!.value = reveal.radius;
  u.uRevealAmount!.value = reveal.amount;
  u.uRevealMode!.value = revealModeIndex(reveal.mode);
}

/** Retune for a new quality tier. Three floats; no recompile, no dropped frame. */
/**
 * The fog half of the mood, on a water material.
 *
 * Water is not clay and does not take `applyMood`'s eleven uniforms — it has
 * no rim, no bands and no wobble. It does need the fog band, because the open
 * sea reaches the horizon and the horizon is made of fog.
 */
export function applyWaterMood(
  mat: WaterMaterial,
  mood: {
    fogColor: THREE.ColorRepresentation;
    fogNear: number;
    fogFar: number;
    fogDensity: number;
  },
): void {
  const u = mat.waterUniforms;
  (u.uFogColor!.value as THREE.Color).set(mood.fogColor);
  u.uFogNear!.value = mood.fogNear;
  u.uFogFar!.value = mood.fogFar;
  u.uFogDensity!.value = mood.fogDensity;
}

export function setWaterTier(mat: WaterMaterial, tier: QualityTier): void {
  const t = waterTierUniforms(tier);
  mat.waterUniforms.uSwells!.value = t.swells;
  mat.waterUniforms.uSpecular!.value = t.specular;
  mat.waterUniforms.uCaustics!.value = t.caustics;
}
