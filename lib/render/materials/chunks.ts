/**
 * The shared GLSL chunks — **one implementation each**.
 *
 * The old world injected three separate wind shaders and hand-rolled the same
 * noise in four places (`02-AUDIT.md` §7). Everything the clay material does is
 * assembled from the strings below, so there is exactly one wobble, one wind and
 * one fog in the game.
 */

/** Value noise in 3D, matching the CPU-side `fbm` closely enough to blend. */
export const NOISE3 = /* glsl */ `
  float bh_hash3(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float bh_noise3(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(bh_hash3(i + vec3(0,0,0)), bh_hash3(i + vec3(1,0,0)), f.x),
          mix(bh_hash3(i + vec3(0,1,0)), bh_hash3(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(bh_hash3(i + vec3(0,0,1)), bh_hash3(i + vec3(1,0,1)), f.x),
          mix(bh_hash3(i + vec3(0,1,1)), bh_hash3(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
`;

/**
 * The handmade wobble. Static and world-position-driven, so an object never
 * shimmers when it moves — and therefore disabled on anything that does
 * (`06-ART-DIRECTION.md` §5). This is what makes low-poly read as clay rather
 * than as cheap.
 */
export const WOBBLE_VERT = /* glsl */ `
  #ifdef BH_WOBBLE
    float bhW = bh_noise3(bhWorld * uWobbleFreq) - 0.5;
    transformed += normal * bhW * uWobbleAmp * uWobbleScale;
  #endif
`;

/**
 * Wind. Foliage only, amplitude scaled by height above the object's base, so
 * trunks stay still and canopies sway.
 */
export const WIND_VERT = /* glsl */ `
  #ifdef BH_WIND
    float bhH = max(0.0, position.y) * uWindHeightBias;
    float bhGust = 0.65 + 0.35 * sin(uTime * uWindGustHz * 6.2831 + bhWorld.x * 0.12);
    float bhSway = sin(uTime * uWindHz * 6.2831 + bhWorld.x * 0.8 + bhWorld.z * 0.6);
    transformed.x += bhSway * uWindAmp * bhH * bhGust;
    transformed.z += cos(uTime * uWindHz * 5.1 + bhWorld.z * 0.7) * uWindAmp * 0.6 * bhH * bhGust;
  #endif
`;

/**
 * The clay read: light quantised into three bands with a soft transition, plus
 * a Fresnel rim ADDED (never multiplied), plus baked vertical AO. Together these
 * replace SSAO, DoF, bloom and the rest of the old post stack — and they cost
 * nothing per pixel that the lighting was not already paying.
 */
export const CLAY_FRAG = /* glsl */ `
  float bh_bands(float l) {
    float steps = max(1.0, uBandCount);
    float scaled = l * steps;
    float lower = floor(scaled);
    float f = smoothstep(0.5 - uBandSoftness * steps, 0.5 + uBandSoftness * steps, fract(scaled));
    return (lower + f) / steps;
  }
`;

/** Height fog. Fog is the depth cue in this game; there is no depth of field. */
export const HEIGHT_FOG_FRAG = /* glsl */ `
  #ifdef BH_HEIGHT_FOG
    float bhFog = smoothstep(uFogNear, uFogFar, vFogDepth);
    gl_FragColor.rgb = mix(gl_FragColor.rgb, uFogColor, bhFog * uFogDensity);
  #endif
`;

/** Declarations every clay vertex shader needs, injected once at the top. */
export const CLAY_VERT_HEAD = /* glsl */ `
  uniform float uTime;
  uniform float uWobbleFreq;
  uniform float uWobbleAmp;
  uniform float uWobbleScale;
  uniform float uWindAmp;
  uniform float uWindHz;
  uniform float uWindGustHz;
  uniform float uWindHeightBias;
  varying vec3 vClayWorld;
  varying float vFogDepth;
  ${NOISE3}
`;

/** Declarations every clay fragment shader needs. */
export const CLAY_FRAG_HEAD = /* glsl */ `
  uniform float uBandCount;
  uniform float uBandSoftness;
  uniform vec3 uRimColor;
  uniform float uRimStrength;
  uniform float uRimPower;
  uniform float uAOStrength;
  uniform float uAOHeight;
  uniform vec3 uFogColor;
  uniform float uFogNear;
  uniform float uFogFar;
  uniform float uFogDensity;
  varying vec3 vClayWorld;
  varying float vFogDepth;
  ${CLAY_FRAG}
`;
