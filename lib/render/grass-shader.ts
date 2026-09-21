/**
 * The grass blade, as shader code. Split from `grass.ts` so the placement and
 * the look can each be read on their own.
 *
 * **What makes a blade read as grass rather than as paper** (the 2026-09-13
 * review): it is thin and tapers to a point; it curves and twists; its normal
 * rolls across its width so light falls off it the way it does off a rounded
 * leaf; its root sits in shade and its tip catches the sun; one field holds
 * several greens and some straw; and the wind does not sway every blade alike
 * but rolls across the field in fronts that bend a patch and show its lighter side.
 */

export const GRASS_VERT_HEAD = /* glsl */ `
  uniform sampler2D uHeightTex;
  uniform sampler2D uMaskTex;
  uniform float uRes;
  uniform float uStep;
  uniform float uExtent;
  uniform vec2 uCenter;
  uniform float uSpacing;
  uniform float uGrid;
  uniform float uInner;
  uniform float uOuter;
  uniform float uRingFade;
  uniform float uBladeH;
  uniform float uBladeW;
  uniform float uTime;
  uniform vec3 uPip;
  uniform float uPushR;
  uniform float uWindAmp;
  uniform vec2 uWindDir;
  uniform sampler2D uPathMap;
  uniform vec4 uPathInfo;
  varying float vGrassT;
  varying float vGrassGust;
  varying vec3 vGrassTone;
  varying vec3 vGrassBase;
  varying vec3 vGrassWorld;
  float bhHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float bhNoise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(bhHash(i), bhHash(i + vec2(1.0, 0.0)), u.x), mix(bhHash(i + vec2(0.0, 1.0)), bhHash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
`;

/** Runs at `beginnormal_vertex`: where the blade is, how it bends, what normal it has. */
export const GRASS_VERT_BLADE = /* glsl */ `
  float bhId = float(gl_InstanceID);
  vec2 bhCell = floor(uCenter / uSpacing) - floor(uGrid * 0.5) + vec2(mod(bhId, uGrid), floor(bhId / uGrid));
  vec4 bhR = vec4(bhHash(bhCell), bhHash(bhCell + 17.31), bhHash(bhCell + 41.7), bhHash(bhCell + 5.13));
  vec2 bhRoot = (bhCell + bhR.xy) * uSpacing;
  vec2 bhUV = ((bhRoot + uExtent) / uStep + 0.5) / uRes;
  float bhDist = length(bhRoot - uCenter);
  // Each ring owns an annulus and fades its blades down at both edges, so the
  // next ring's blades rise through the same ground and no line shows.
  float bhRing = smoothstep(uInner - uRingFade, uInner, bhDist) * (1.0 - smoothstep(uOuter - uRingFade, uOuter, bhDist));
  /**
   * **A blade nobody can see does no work.** Every ring is a full square around
   * Pip, so most of its blades are behind the camera, off to the side, or inside
   * the next ring in — and each used to pay three texture fetches and all the wind
   * maths anyway: well over a million vertices a frame at T3. The root is projected
   * once; outside the ring, behind the lens or clear of the frame's sides, the
   * blade collapses to a point and skips the rest. Height is taken at Pip's level:
   * the camera never rolls, so it moves a root up or down the frame, never sideways.
   */
  vec4 bhClip = projectionMatrix * viewMatrix * vec4(bhRoot.x, uPip.y, bhRoot.y, 1.0);
  bool bhLive = bhRing > 0.0 && bhClip.w > -1.0 && abs(bhClip.x) < bhClip.w * 1.15 + 1.2;
  float bhGroundY = 0.0;
  vec4 bhMask = vec4(0.0);
  vec4 bhPathTex = vec4(1.0);
  if (bhLive) {
    bhGroundY = texture2D(uHeightTex, bhUV).r;
    bhMask = texture2D(uMaskTex, bhUV);
    bhPathTex = texture2D(uPathMap, (bhRoot + uPathInfo.x) / (2.0 * uPathInfo.x));
  }
  // The mask's density is a likelihood; a meadow at half of it should still be a
  // full meadow, and only a clearing's edge should thin out.
  float bhDensity = smoothstep(0.0, 0.45, bhMask.a);
  // …and stops at the worn edge of a path, the same line the ground draws.
  float bhPathHalf = uPathInfo.z * mix(0.3, 1.0, bhPathTex.g) * smoothstep(0.0, 0.35, bhPathTex.g);
  float bhKeep = step(bhR.z, bhDensity) * bhRing
    * smoothstep(bhPathHalf - 0.02, bhPathHalf + 0.3, bhPathTex.r * uPathInfo.y + (bhR.x - 0.5) * 0.25);
  // Lush patches grow tall; clearings stay short and dry.
  float bhPatch = bhLive ? bhNoise(bhRoot * 0.09) : 0.0;
  float bhH = uBladeH * (0.55 + 0.8 * bhR.w) * mix(0.55, 1.3, bhPatch) * (0.45 + 0.55 * bhDensity) * bhKeep;
  float bhAng = bhHash(bhCell + 9.7) * 6.2831853;
  vec2 bhFacing = vec2(cos(bhAng), sin(bhAng));
  vec2 bhSide = vec2(-bhFacing.y, bhFacing.x);
  // Wind: gust fronts rolling downwind across the field, and a quick flutter.
  float bhGust = bhLive ? smoothstep(0.35, 0.85, bhNoise(bhRoot * 0.055 - uWindDir * uTime * 0.6)) : 0.0;
  float bhFlutter = sin(uTime * 3.1 + bhR.x * 12.0 + bhRoot.x * 0.7) * 0.08;
  vec2 bhBend = bhFacing * (0.12 + 0.38 * bhR.z) + uWindDir * (bhGust * 0.9 + 0.15) * uWindAmp + bhSide * bhFlutter;
  vec2 bhAway = bhRoot - uPip.xz;
  float bhPD = length(bhAway);
  float bhPush = (1.0 - smoothstep(0.05, uPushR, bhPD)) * (1.0 - step(1.2, abs(uPip.y - bhGroundY)));
  bhBend += (bhAway / max(bhPD, 0.001)) * bhPush * 1.6;
  float bhT = position.y;
  vGrassT = bhT;
  vGrassGust = bhGust * step(0.01, uWindAmp);
  vGrassTone = vec3(bhR.y, bhPatch, bhHash(bhCell + 23.9));
  vGrassBase = bhMask.rgb;
  // Mostly the ground's own up, so a field is lit as one surface instead of as
  // a speckle of ribbons each facing its own way; a little roll across the width
  // and a lean with the bend keep each blade round.
  objectNormal = normalize(vec3(0.0, 1.0, 0.0) + vec3(bhFacing.x, 0.0, bhFacing.y) * 0.25
    + vec3(bhSide.x, 0.0, bhSide.y) * position.x * 0.55 + vec3(bhBend.x, 0.0, bhBend.y) * 0.3);
`;

/** Replaces `begin_vertex`: the blade's world position. */
export const GRASS_VERT_POSITION = /* glsl */ `
  vec3 transformed = vec3(0.0);
  float bhCurve = bhT * bhT;
  float bhBendLen = min(length(bhBend), 1.4);
  float bhTaper = 1.0 - pow(bhT, 1.4);
  float bhTwist = (bhR.x - 0.5) * 1.3 * bhT;
  vec2 bhSideT = bhSide * cos(bhTwist) - bhFacing * sin(bhTwist);
  transformed.xz = bhRoot + bhSideT * position.x * uBladeW * (0.3 + 0.7 * bhTaper) * (0.7 + 0.6 * bhR.w)
    + bhBend * bhCurve * bhH;
  transformed.y = bhGroundY + bhT * bhH * (1.0 - 0.4 * bhBendLen * bhCurve);
  vGrassWorld = transformed;
`;

export const GRASS_FRAG_HEAD = /* glsl */ `
  uniform vec3 uSunDirW;
  uniform vec3 uSunColor;
  uniform float uTranslucency;
  uniform vec3 uFogColor;
  uniform float uFogNear;
  uniform float uFogFar;
  uniform float uFogDensity;
  varying float vGrassT;
  varying float vGrassGust;
  varying vec3 vGrassTone;
  varying vec3 vGrassBase;
  varying vec3 vGrassWorld;
`;

/** After `color_fragment`: several greens, some straw, the biome's tint, and shade at the root. */
export const GRASS_FRAG_COLOR = /* glsl */ `
  vec3 bhLush = vec3(0.055, 0.17, 0.03);
  vec3 bhFresh = vec3(0.19, 0.34, 0.055);
  vec3 bhStraw = vec3(0.34, 0.28, 0.1);
  vec3 bhC = mix(bhLush, bhFresh, clamp(smoothstep(0.25, 0.85, vGrassTone.y) * 0.8 + vGrassTone.x * 0.25, 0.0, 1.0));
  bhC = mix(bhC, bhStraw, clamp(step(0.94, vGrassTone.z) * 0.7 + smoothstep(0.8, 1.0, vGrassTone.y) * 0.25, 0.0, 1.0));
  // The biome still owns the hue: the ground colour under the blade tints it.
  float bhL = max(dot(vGrassBase, vec3(0.2126, 0.7152, 0.0722)), 0.05);
  bhC *= mix(vec3(1.0), vGrassBase / bhL * 0.75 + 0.25, 0.35);
  // A gust bends a patch over and shows the lighter side of its blades.
  bhC *= 1.0 + vGrassGust * 0.22;
  // Tips dry toward a warm light green; roots sink into the ground's root shade.
  bhC = mix(bhC, bhC * vec3(1.3, 1.15, 0.6) + vec3(0.02, 0.012, 0.0), smoothstep(0.6, 1.0, vGrassT) * 0.55);
  float bhRootShade = mix(0.42, 1.0, smoothstep(0.0, 0.7, vGrassT));
  diffuseColor.rgb = bhC * bhRootShade;
`;

/** After `lights_fragment_end`: the sun through the blade, strongest at the tips. */
export const GRASS_FRAG_LIGHT = /* glsl */ `
  vec3 bhV = normalize(cameraPosition - vGrassWorld);
  float bhBack = pow(clamp(dot(bhV, -uSunDirW), 0.0, 1.0), 3.0);
  reflectedLight.directDiffuse += diffuseColor.rgb * uSunColor * bhBack * uTranslucency * smoothstep(0.2, 1.0, vGrassT);
  reflectedLight.indirectDiffuse *= mix(0.6, 1.0, vGrassT);
`;

export const GRASS_FRAG_FOG = /* glsl */ `
  float bhFog = smoothstep(uFogNear, uFogFar, length(vGrassWorld - cameraPosition));
  gl_FragColor.rgb = mix(gl_FragColor.rgb, uFogColor, bhFog * uFogDensity);
`;
