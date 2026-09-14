/**
 * `waterMaterial` — the sea, the lagoon, the river and the puddle.
 *
 * **v2 (`23-ART-DIRECTION-V2.md`): "water must feel real."** The first version
 * was a flat depth tint with a painted foam line, and the playtest frames showed
 * it as milky grey plates. Real water is almost entirely *other things*: the sky
 * reflected more strongly the flatter you look across it, the sun broken into
 * glints by ripples, the sand showing through the shallows, and foam that comes
 * in and goes out. That is what this draws — all from the surface's own depth
 * attribute and its world position, with no reflection pass and no texture.
 *
 *  - **Ripples**: two directional swells and two scrolling noise octaves, turned
 *    into a per-pixel normal by finite differences.
 *  - **Reflection**: the sky gradient read along the reflected ray, weighted by
 *    Fresnel, plus a sharp sun glint and a broad sheen.
 *  - **Body**: turquoise over sand, deepening to blue, and transparent enough in
 *    the shallows to see the bottom.
 *  - **Foam**: a solid edge where water meets sand, and bands that roll in.
 *
 * Tier still decides the cost through uniforms, never defines, so a tier change
 * is three floats and no recompile.
 */
import * as THREE from 'three';

import { WATER } from '@/lib/world/config';
import type { QualityTier } from '@/lib/world/types';
import { revealModeIndex, type RevealState } from '../reveal';
import { CLAY } from '../palette';

const vertexShader = /* glsl */ `
  attribute float aDepth;
  varying float vDepth;
  varying vec3 vWorld;
  varying float vFogDepth;
  void main() {
    vDepth = aDepth;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    vec4 mvPosition = viewMatrix * world;
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
  uniform vec3 uZenith;
  uniform vec3 uHorizon;
  uniform vec3 uSunDir;
  uniform vec3 uSunColor;
  uniform float uDepthScale;
  uniform float uFoamWidth;
  uniform float uRipple;
  uniform float uSpecular;
  uniform float uCaustics;
  uniform vec3 uFogColor;
  uniform float uFogNear;
  uniform float uFogFar;
  uniform float uFogDensity;
  uniform vec3 uRevealCentre;
  uniform float uRevealRadius;
  uniform float uRevealAmount;
  uniform float uRevealMode;
  uniform sampler2D uHeightTex;
  uniform vec4 uHeightInfo;
  varying float vDepth;
  varying vec3 vWorld;
  varying float vFogDepth;

  float bhHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float bhNoise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(bhHash(i), bhHash(i + vec2(1.0, 0.0)), u.x), mix(bhHash(i + vec2(0.0, 1.0)), bhHash(i + vec2(1.0, 1.0)), u.x), u.y);
  }

  float bhWaves(vec2 q, float t) {
    return sin(dot(q, vec2(0.61, 0.79)) * 0.8 + t * 0.9) * 0.34
         + sin(dot(q, vec2(-0.83, 0.55)) * 1.45 + t * 1.3) * 0.17
         + (bhNoise(q * 1.3 + t * vec2(0.26, 0.15)) - 0.5) * 0.26
         + (bhNoise(q * 3.7 - t * vec2(0.18, 0.33)) - 0.5) * 0.09;
  }

  // Cubic B-spline height from four bilinear taps. With plain bilinear filtering
  // a puddle a few texels across came out a polygon.
  float bhHeightSmooth(vec2 uv, float res) {
    vec2 st = uv * res - 0.5;
    vec2 i = floor(st);
    vec2 f = st - i;
    vec2 w0 = (1.0 - f) * (1.0 - f) * (1.0 - f) / 6.0;
    vec2 w1 = (4.0 - 6.0 * f * f + 3.0 * f * f * f) / 6.0;
    vec2 w2 = (1.0 + 3.0 * f + 3.0 * f * f - 3.0 * f * f * f) / 6.0;
    vec2 w3 = f * f * f / 6.0;
    vec2 g0 = w0 + w1;
    vec2 g1 = w2 + w3;
    vec2 h0 = (i - 0.5 + w1 / g0) / res;
    vec2 h1 = (i + 1.5 + w3 / g1) / res;
    return g0.y * (g0.x * texture2D(uHeightTex, h0).r + g1.x * texture2D(uHeightTex, vec2(h1.x, h0.y)).r)
         + g1.y * (g0.x * texture2D(uHeightTex, vec2(h0.x, h1.y)).r + g1.x * texture2D(uHeightTex, h1).r);
  }

  void main() {
    if (uRevealMode > 3.5) {
      float bhD = length(vWorld.xz - uRevealCentre.xz);
      float bhFront = uRevealAmount * uRevealRadius;
      if (bhD > bhFront + bhNoise(vWorld.xz * 3.0 + vec2(uTime * 0.9, 0.0)) * 0.9) discard;
    }

    // True depth, per pixel, against the ground itself — and how steep the ground
    // is here, which turns depth into distance from the shore. Depth interpolated
    // across the mesh's vertices drew the grid: sawtooth banks, square shores.
    float depthM = vDepth;
    float shoreSlope = 0.1;
    if (uHeightInfo.w > 0.5) {
      vec2 huv = ((vWorld.xz + uHeightInfo.z) / uHeightInfo.y + 0.5) / uHeightInfo.x;
      if (huv.x > 0.0 && huv.x < 1.0 && huv.y > 0.0 && huv.y < 1.0) {
        float tx = 1.0 / uHeightInfo.x;
        float gxH = texture2D(uHeightTex, huv + vec2(tx, 0.0)).r - texture2D(uHeightTex, huv - vec2(tx, 0.0)).r;
        float gzH = texture2D(uHeightTex, huv + vec2(0.0, tx)).r - texture2D(uHeightTex, huv - vec2(0.0, tx)).r;
        depthM = vWorld.y - bhHeightSmooth(huv, uHeightInfo.x);
        shoreSlope = length(vec2(gxH, gzH)) / (2.0 * uHeightInfo.y);
      }
    }
    if (depthM <= 0.0) discard;

    float t = uTime * uFlow;
    vec2 p = vWorld.xz;
    float e = 0.08;
    float gx = (bhWaves(p + vec2(e, 0.0), t) - bhWaves(p - vec2(e, 0.0), t)) / (2.0 * e);
    float gz = (bhWaves(p + vec2(0.0, e), t) - bhWaves(p - vec2(0.0, e), t)) / (2.0 * e);
    vec3 n = normalize(vec3(-gx * uRipple, 1.0, -gz * uRipple));

    vec3 toEye = cameraPosition - vWorld;
    float dist = length(toEye);
    vec3 v = toEye / max(dist, 0.0001);
    // Distant ripples average out: flatten the normal with distance, or the far sea sparkles like static.
    n = normalize(mix(n, vec3(0.0, 1.0, 0.0), smoothstep(25.0, 140.0, dist)));

    float cosV = clamp(dot(n, v), 0.0, 1.0);
    float fresnel = 0.02 + 0.98 * pow(1.0 - cosV, 5.0);

    vec3 r = reflect(-v, n);
    // The reflected sky, a little darker than the sky itself: water absorbs, and a
    // mirror-bright surface read as white stripes rather than as the sea.
    // The pale horizon is what a low view reflects most, and it washed rivers milky.
    vec3 sky = mix(uHorizon * 0.8, uZenith, pow(clamp(r.y, 0.0, 1.0), 0.3)) * 0.66;
    float glint = pow(max(dot(r, uSunDir), 0.0), 700.0) * 14.0 + pow(max(dot(r, uSunDir), 0.0), 60.0) * 0.35;
    vec3 reflection = sky + uSunColor * glint * uSpecular;

    // Coloured by real metres as well as against the deepest basin: a river a few
    // decimetres deep was all "shallow" next to the lagoon, and read milky.
    float d = clamp(max(depthM / uDepthScale, 1.0 - exp(-depthM / 0.6)), 0.0, 1.0);
    vec3 body = mix(uShallow, uDeep, pow(d, 0.75));
    if (uCaustics > 0.0) {
      float c = bhNoise(p * 3.2 + vec2(t * 0.3, -t * 0.25)) * bhNoise(p * 2.7 - vec2(t * 0.22, t * 0.31));
      // Faint and sun-tinted: at half strength over a shallow puddle they summed to white.
      body += uSunColor * vec3(0.85, 1.0, 0.9) * pow(c, 3.0) * (1.0 - d) * 0.22 * uCaustics;
    }

    // A few centimetres of water over sand is mostly sand: the sky it reflects is
    // faint there. At full strength a puddle seen from Pip's height was a white disc.
    fresnel *= mix(0.35, 1.0, smoothstep(0.0, 0.35, depthM));
    vec3 col = mix(body, reflection, fresnel);
    float alpha = mix(mix(0.35, 0.95, smoothstep(0.0, 0.5, d)), 1.0, fresnel);

    // Foam: a thin broken lip right at the shore, and bands that roll in toward
    // it — both measured in metres from the shore, not in depth.
    float shoreM = depthM / max(shoreSlope, 0.02);
    float breakup = bhNoise(p * 4.0 + vec2(t * 0.4, t * 0.25));
    float lip = 1.0 - smoothstep(0.04, uFoamWidth, shoreM + (breakup - 0.5) * uFoamWidth * 0.9);
    // Broken along its length: an unbroken lip read as a sticker's outline.
    lip *= 0.45 + 0.55 * smoothstep(0.3, 0.7, bhNoise(p * 1.7 - vec2(t * 0.2, 0.0)));
    // Bands only where there is a shore to roll toward, and in patches: a
    // continuous band along a river drew white stripes down its length.
    float bands = smoothstep(0.72, 1.0, sin(shoreM * 5.0 - t * 1.8 + breakup * 1.5))
      * (1.0 - smoothstep(0.4, 2.2, shoreM)) * smoothstep(0.3, 1.0, uDepthScale)
      * smoothstep(0.45, 0.8, bhNoise(p * 0.5 + vec2(t * 0.12, 0.0)));
    float foam = clamp(lip * 0.7 + bands * 0.3, 0.0, 1.0) * smoothstep(0.0, 0.004, depthM);
    col = mix(col, uFoam * (0.8 + 0.25 * max(uSunDir.y, 0.0)), foam);
    // The surface itself thins to nothing at the waterline, so the edge is soft.
    alpha = max(alpha * smoothstep(0.0, 0.02, depthM), foam * 0.9);

    float fogT = smoothstep(uFogNear, uFogFar, vFogDepth) * uFogDensity;
    col = mix(col, uFogColor, fogT);
    alpha = mix(alpha, 1.0, fogT);

    gl_FragColor = vec4(col, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export interface WaterOptions {
  tier: QualityTier;
  /** Surface tint, usually the biome's water colour. */
  color?: string;
  /** From `MirrorParams.riverFlow` — real litres, made visible as speed. */
  flow?: number;
  /** Basin depth the colour ramp is normalised against. */
  depthScale?: number;
  /** Metres of depth the foam lip covers. */
  foamWidth?: number;
}

export interface WaterMaterial extends THREE.ShaderMaterial {
  waterUniforms: Record<string, THREE.IUniform>;
}

/** Ripple strength, glints and caustics by tier — uniforms, never defines. */
export function waterTierUniforms(tier: QualityTier): { swells: number; specular: number; caustics: number } {
  return {
    swells: tier === 0 ? WATER.rippleLow : WATER.ripple,
    specular: tier >= 1 ? 1 : 0.4,
    caustics: tier >= 2 ? 1 : 0,
  };
}

export function createWaterMaterial(opts: WaterOptions): WaterMaterial {
  const tierUniforms = waterTierUniforms(opts.tier);
  const shallow = new THREE.Color(WATER.shallow).lerp(new THREE.Color(opts.color ?? CLAY.water), 0.25);
  const uniforms: Record<string, THREE.IUniform> = {
    uTime: { value: 0 },
    uFlow: { value: opts.flow ?? 1 },
    uRipple: { value: tierUniforms.swells },
    uSpecular: { value: tierUniforms.specular },
    uCaustics: { value: tierUniforms.caustics },
    uShallow: { value: shallow },
    uDeep: { value: new THREE.Color(WATER.deep) },
    uFoam: { value: new THREE.Color(WATER.foam) },
    uZenith: { value: new THREE.Color('#4C8ED6') },
    uHorizon: { value: new THREE.Color('#E2EEF2') },
    uSunDir: { value: new THREE.Vector3(0.4, 0.8, 0.3).normalize() },
    uSunColor: { value: new THREE.Color(1, 0.9, 0.75) },
    uDepthScale: { value: opts.depthScale ?? 1 },
    uFoamWidth: { value: opts.foamWidth ?? WATER.foamWidthM },
    uFogColor: { value: new THREE.Color('#F7F5EF') },
    uFogNear: { value: 1 },
    uFogFar: { value: 1000 },
    uFogDensity: { value: 0 },
    uRevealCentre: { value: new THREE.Vector3() },
    uRevealRadius: { value: 1 },
    uRevealAmount: { value: 1 },
    uRevealMode: { value: 0 },
    // The ground's height (`height-texture.ts`), set once the island is built; w = 0 until then.
    uHeightTex: { value: null },
    uHeightInfo: { value: new THREE.Vector4(1, 1, 1, 0) },
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

export function tickWater(mat: WaterMaterial, timeS: number, flow?: number): void {
  mat.waterUniforms.uTime!.value = timeS;
  if (flow !== undefined) mat.waterUniforms.uFlow!.value = flow;
}

/** The sun and the sky the surface reflects. Called every frame; allocates nothing. */
export function applyWaterLight(
  mat: WaterMaterial, sunDir: THREE.Vector3, sunColor: THREE.Color, zenith: THREE.Color, horizon: THREE.Color,
): void {
  const u = mat.waterUniforms;
  (u.uSunDir!.value as THREE.Vector3).copy(sunDir);
  (u.uSunColor!.value as THREE.Color).copy(sunColor);
  (u.uZenith!.value as THREE.Color).copy(zenith);
  (u.uHorizon!.value as THREE.Color).copy(horizon);
}

export function applyWaterReveal(mat: WaterMaterial, reveal: RevealState): void {
  const u = mat.waterUniforms;
  (u.uRevealCentre!.value as THREE.Vector3).set(...reveal.centre);
  u.uRevealRadius!.value = reveal.radius;
  u.uRevealAmount!.value = reveal.amount;
  u.uRevealMode!.value = revealModeIndex(reveal.mode);
}

/** The fog half of the mood. The sea reaches the horizon, and the horizon is made of fog. */
export function applyWaterMood(
  mat: WaterMaterial,
  mood: { fogColor: THREE.ColorRepresentation; fogNear: number; fogFar: number; fogDensity: number },
): void {
  const u = mat.waterUniforms;
  (u.uFogColor!.value as THREE.Color).set(mood.fogColor);
  u.uFogNear!.value = mood.fogNear;
  u.uFogFar!.value = mood.fogFar;
  u.uFogDensity!.value = mood.fogDensity;
}

export function setWaterTier(mat: WaterMaterial, tier: QualityTier): void {
  const t = waterTierUniforms(tier);
  mat.waterUniforms.uRipple!.value = t.swells;
  mat.waterUniforms.uSpecular!.value = t.specular;
  mat.waterUniforms.uCaustics!.value = t.caustics;
}
