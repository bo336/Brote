/**
 * Built surfaces: what a board, a stone, a nail and a rope are made of.
 *
 * The 2026-09-25 brief put the benches, the compost bin and the bridge "done in
 * Paint" next to the rest of the island. Their shapes already had the small
 * truths (`geometry/carpentry.ts`); what they did not have was a surface — every
 * plank one flat colour, every stone a lump of plasticine. This adds it in the
 * shader, with no texture: wood gets streaks that run **along each board** and
 * a tone that drifts from board to board, stone gets grain and pits, metal a
 * brushed sheen, rope and canvas a fine weave.
 *
 * The material and the grain direction travel per vertex in the `tangent`
 * attribute (`build.ts#surface`): `xyz` is the grain axis and `w` is
 * `SURFACE_BASE + class`. It is `tangent` on purpose — it is the one extra
 * attribute three's `applyMatrix4` rotates with the geometry, so a board built
 * along X and then turned into an armrest keeps its grain along its length.
 * Geometry without it reads the WebGL default `(0, 0, 0, 1)`, which is below
 * `SURFACE_BASE` and so means "no surface": the effect is strictly opt-in.
 *
 * Detail fades out where it would alias (a board a hundred metres away is
 * just its colour), so it costs nothing to the silhouette at distance.
 */
export const SURFACE_BASE = 10;
export const SURFACE = { wood: 1, stone: 2, metal: 3, cloth: 4, plastic: 5 } as const;
export type SurfaceKind = keyof typeof SURFACE;

export const BUILT_VERT_HEAD = /* glsl */ `
  #ifdef BH_BUILT
    #ifndef USE_TANGENT
      attribute vec4 tangent;
    #endif
    varying vec4 vSurf;
  #endif
`;

/** After `begin_vertex`: the grain axis into world space, the class as is. */
export const BUILT_VERT = /* glsl */ `
  #ifdef BH_BUILT
    mat3 bhSurfM = mat3(modelMatrix);
    #ifdef USE_INSTANCING
      bhSurfM = mat3(modelMatrix) * mat3(instanceMatrix);
    #endif
    vec3 bhAxis = bhSurfM * tangent.xyz;
    float bhAxisLen = length(bhAxis);
    vSurf = vec4(bhAxisLen > 1e-5 ? bhAxis / bhAxisLen : vec3(0.0), tangent.w - ${SURFACE_BASE.toFixed(1)});
  #endif
`;

export const BUILT_FRAG_HEAD = /* glsl */ `
  #ifdef BH_BUILT
    varying vec4 vSurf;
    float bhHash3(vec3 p) {
      p = fract(p * 0.3183099 + 0.1);
      p *= 17.0;
      return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
    }
    float bhNoise3(vec3 x) {
      vec3 i = floor(x);
      vec3 f = fract(x);
      f = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(mix(bhHash3(i), bhHash3(i + vec3(1.0, 0.0, 0.0)), f.x),
            mix(bhHash3(i + vec3(0.0, 1.0, 0.0)), bhHash3(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
        mix(mix(bhHash3(i + vec3(0.0, 0.0, 1.0)), bhHash3(i + vec3(1.0, 0.0, 1.0)), f.x),
            mix(bhHash3(i + vec3(0.0, 1.0, 1.0)), bhHash3(i + vec3(1.0, 1.0, 1.0)), f.x), f.y),
        f.z);
    }
  #endif
`;

/** After `color_fragment`: tint `diffuseColor` by the surface; set how much rougher or smoother it is. */
export const BUILT_FRAG = /* glsl */ `
  float bhRoughK = 1.0;
  #ifdef BH_BUILT
    float bhCls = vSurf.w;
    if (bhCls > 0.5 && bhCls < 5.5) {
      vec3 bhP = vClayWorld;
      vec3 bhN = normalize(cross(dFdx(bhP), dFdy(bhP)));
      // How many world metres one pixel covers here: the detail fades before it shimmers.
      float bhPix = length(fwidth(bhP));
      if (bhCls < 1.5) {
        // Wood. Streaks along the grain, a ring pattern across it, and a tone
        // that drifts so no two boards are the same board.
        vec3 bhAx = dot(vSurf.xyz, vSurf.xyz) > 0.5 ? vSurf.xyz : vec3(1.0, 0.0, 0.0);
        float bhAlong = dot(bhP, bhAx);
        vec3 bhAcross = cross(bhAx, bhN);
        bhAcross = dot(bhAcross, bhAcross) > 1e-4 ? normalize(bhAcross) : vec3(0.0, 1.0, 0.0);
        float bhW = dot(bhP, bhAcross);
        float bhWob = bhNoise3(vec3(bhAlong * 1.3, bhW * 4.0, 0.3));
        // Thin dark grain lines, bunched and spread by the wobble, running along the board.
        float bhRing = fract(bhW * 22.0 + bhWob * 2.2 + bhAlong * 0.12);
        float bhLine = smoothstep(0.0, 0.08, bhRing) * (1.0 - smoothstep(0.14, 0.3, bhRing));
        float bhStreak = bhNoise3(vec3(bhAlong * 2.2, bhW * 70.0, 1.7));
        float bhKnot = smoothstep(0.88, 0.97, bhNoise3(vec3(bhAlong * 3.0, bhW * 9.0, 4.2)));
        // Board to board: each piece its own shade (the tone field is coarse, a board is small).
        float bhTone = bhNoise3(bhP * 1.7 + 3.1);
        float bhFine = 1.0 - smoothstep(0.004, 0.02, bhPix);
        float k = 1.0
          + (-0.2 * bhLine + 0.1 * (bhStreak - 0.5) - 0.28 * bhKnot) * bhFine
          + 0.2 * (bhTone - 0.5);
        diffuseColor.rgb *= k;
        // Sun-bleached where it faces the sky: tops of boards are paler than their sides.
        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(1.12, 1.1, 1.05), clamp(bhN.y, 0.0, 1.0) * 0.6);
      } else if (bhCls < 2.5) {
        // Stone: grain, a few pits, lichen-pale where it faces the sky.
        float bhFine = 1.0 - smoothstep(0.006, 0.03, bhPix);
        float g = bhNoise3(bhP * 16.0) * 0.6 + bhNoise3(bhP * 43.0) * 0.4;
        float pits = smoothstep(0.78, 0.94, bhNoise3(bhP * 8.0 + 5.0));
        float lichen = smoothstep(0.6, 0.78, bhNoise3(bhP * 5.0 + 11.0)) * clamp(bhN.y, 0.0, 1.0);
        diffuseColor.rgb *= 1.0 + ((g - 0.5) * 0.36 - pits * 0.3) * bhFine;
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.74, 0.78, 0.56), lichen * 0.35);
      } else if (bhCls < 3.5) {
        // Metal: brushed along its length, and smoother, so the sun catches it.
        vec3 bhAx = dot(vSurf.xyz, vSurf.xyz) > 0.5 ? vSurf.xyz : vec3(0.0, 1.0, 0.0);
        float brush = bhNoise3(vec3(dot(bhP, bhAx) * 3.0, dot(bhP, cross(bhAx, bhN)) * 120.0, 0.0));
        diffuseColor.rgb *= 0.93 + 0.12 * brush;
        bhRoughK = 0.45;
      } else if (bhCls > 4.5) {
        // Recycled plastic lumber: the confetti of what it was made from, and a satin sheen.
        float bhFine = 1.0 - smoothstep(0.004, 0.02, bhPix);
        float fleck = smoothstep(0.82, 0.9, bhNoise3(bhP * 55.0));
        float fleck2 = smoothstep(0.84, 0.92, bhNoise3(bhP * 55.0 + 17.0));
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.93, 0.9, 0.82), fleck * 0.55 * bhFine);
        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 0.62, fleck2 * 0.6 * bhFine);
        bhRoughK = 0.7;
      } else {
        // Rope and canvas: a fine weave that only shows up close.
        float bhFine = 1.0 - smoothstep(0.002, 0.008, bhPix);
        float weave = sin(bhP.x * 260.0 + bhP.y * 140.0) * sin(bhP.z * 260.0 - bhP.y * 160.0);
        diffuseColor.rgb *= 1.0 + 0.05 * weave * bhFine;
      }
    }
  #endif
`;

/** After `roughnessmap_fragment`. */
export const BUILT_ROUGH_FRAG = /* glsl */ `
  roughnessFactor *= bhRoughK;
`;
