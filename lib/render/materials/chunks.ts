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
    // **The darkest band is not black.** Quantising straight to (lower + f) /
    // steps sends everything under about a tenth of full light to exactly
    // zero — and a steep face turned away from the key gets there easily. El
    // Monte's whole flank rendered as a hole in the world at midday, which is
    // how a mountain that was drawing correctly kept reading as "not drawn".
    // Clay in shadow is still clay (06-ART-DIRECTION section 2), so the ramp
    // starts at a floor instead of at nothing. No backticks in here: this is a
    // template literal, and one would end it.
    return mix(uBandFloor, 1.0, (lower + f) / steps);
  }
`;

/**
 * Aerial perspective. Distance fades toward the horizon colour, and the side of
 * the sky the sun is on fades warmer — the air in front of a low sun glows.
 */
export const HEIGHT_FOG_FRAG = /* glsl */ `
  #ifdef BH_HEIGHT_FOG
    float bhFog = smoothstep(uFogNear, uFogFar, vFogDepth);
    vec3 bhFogDir = normalize(vClayWorld - cameraPosition);
    float bhSunward = pow(clamp(dot(bhFogDir, uSunDirW), 0.0, 1.0), 6.0);
    vec3 bhFogCol = mix(uFogColor, uFogColor * 0.6 + uSunColor * 0.25, bhSunward);
    gl_FragColor.rgb = mix(gl_FragColor.rgb, bhFogCol, bhFog * uFogDensity);
  #endif
`;

/**
 * The occluder fade (`10-CONTROLS-AND-CAMERA.md` §4).
 *
 * A tree between the lens and Pip loses its alpha rather than shoving the
 * camera around — "cheaper, calmer, and it looks deliberate in a stylized
 * style". Because the clay material is opaque, the fade is a **dither cutout**
 * (which the same line explicitly allows): an ordered 4x4 Bayer threshold on
 * screen position, discarding fragments below it. No blending, no sorting, no
 * second render pass, and it reads as a stipple rather than a ghost.
 *
 * Guarded by `USE_INSTANCING` because that is what makes it free: three keys
 * its program cache on that define, so an instanced clay mesh already compiles
 * a different program from a plain one. The attribute lives only in the
 * instanced program; the plain one never sees it, and no material is spent.
 */
export const FADE_VERT = /* glsl */ `
  vFade = 1.0;
  #ifdef USE_INSTANCING
    vFade = aFade;
  #endif
`;

export const FADE_FRAG = /* glsl */ `
  #ifdef USE_INSTANCING
    if (vFade < 0.999) {
      // Ordered 4x4 Bayer matrix, indexed by pixel. Cheaper than a hash and it
      // does not crawl when the camera moves.
      int bx = int(mod(gl_FragCoord.x, 4.0));
      int by = int(mod(gl_FragCoord.y, 4.0));
      int bi = bx + by * 4;
      float bayer = 0.0;
      if (bi == 0) bayer = 0.0;      else if (bi == 1) bayer = 8.0;
      else if (bi == 2) bayer = 2.0;  else if (bi == 3) bayer = 10.0;
      else if (bi == 4) bayer = 12.0; else if (bi == 5) bayer = 4.0;
      else if (bi == 6) bayer = 14.0; else if (bi == 7) bayer = 6.0;
      else if (bi == 8) bayer = 3.0;  else if (bi == 9) bayer = 11.0;
      else if (bi == 10) bayer = 1.0; else if (bi == 11) bayer = 9.0;
      else if (bi == 12) bayer = 15.0;else if (bi == 13) bayer = 7.0;
      else if (bi == 14) bayer = 13.0;else bayer = 5.0;
      if (vFade < (bayer + 0.5) / 16.0) discard;
    }
  #endif
`;

/**
 * The arrival (`08-WORLD-AND-PROGRESSION.md` §5 beat 3, and `lib/render/reveal.ts`).
 *
 * Two of the four modes are geometry and live here. `uplift` scales the ground
 * back toward a flat plate and lets it push out again, so the mountain *rises*
 * instead of appearing; `grow` scales each instance about its own base as a
 * front passes it, so a wave of blooming races outward.
 *
 * The split on `USE_INSTANCING` is what keeps them apart: the ground is a plain
 * mesh and every scatter is instanced, so neither mode can reach the other's
 * geometry and no mesh needs to be told which it is. Both branches are on a
 * uniform, so a draw either takes them all or takes none — the coherent case a
 * GPU is fastest at, and the reason this compiles into every clay material
 * rather than into a ninth one bought out of a budget of eight.
 */
export const REVEAL_VERT = /* glsl */ `
  if (uRevealMode > 0.5) {
    // Where this vertex belongs, as far as the arrival is concerned. Three
    // cases, and the difference between them is the whole design:
    //
    //  - the GROUND deforms, so every vertex answers for itself;
    //  - an INSTANCE (a tree, a rock, a tuft) answers for the copy it is part
    //    of, so the copy moves as one solid thing;
    //  - anything else answers for its object origin, for the same reason.
    //
    // Getting this wrong is not subtle: sampling per-vertex on a mesh whose
    // origin is not the world origin stretches it toward the event instead of
    // moving it, which turns Pip into a smear the moment a mountain rises
    // anywhere near him.
    #ifdef USE_INSTANCING
      vec3 bhBase = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
      float bhLocalScale = length(modelMatrix[1].xyz) * length(instanceMatrix[1].xyz);
    #else
      #ifdef BH_REVEAL_GROUND
        vec3 bhBase = bhWorld;
        float bhLocalScale = 1.0;
      #else
        vec3 bhBase = modelMatrix[3].xyz;
        float bhLocalScale = length(modelMatrix[1].xyz);
      #endif
    #endif

    // ── uplift: the ground buckles and the mountain pushes up out of itself.
    if (uRevealMode < 1.5) {
      float bhNorm = length(bhBase.xz - uRevealCentre.xz) / max(0.001, uRevealRadius);
      // Outside the event nothing moves, so the rest of the island — and
      // whoever is standing on it — is not dragged along with the part rising.
      float bhInside = 1.0 - smoothstep(0.75, 1.0, bhNorm);
      // The middle leads and the skirt follows: a bulge pushing up, rather
      // than a plate being raised.
      float bhLead = clamp(uRevealAmount * 1.45 - bhNorm * 0.45, 0.0, 1.0);
      float bhK = mix(1.0, mix(0.04, 1.0, bhLead * bhLead * (3.0 - 2.0 * bhLead)), bhInside);
      float bhDelta = (uRevealCentre.y - bhBase.y) * (1.0 - bhK);
      transformed.y += bhDelta / max(0.0001, bhLocalScale);
      #ifdef BH_REVEAL_GROUND
        // The world position every later chunk reads has to be the one the
        // vertex actually ends up at, or the fog and the snow line would both
        // be measuring the mountain that used to be there.
        bhWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;
        vClayWorld = bhWorld;
      #endif
    }

    // ── grow: a front races outward and everything it passes stands up.
    #ifdef USE_INSTANCING
      if (uRevealMode > 2.5 && uRevealMode < 3.5) {
        float bhD = length(bhBase.xz - uRevealCentre.xz);
        float bhFront = uRevealAmount * uRevealRadius;
        // A band, not a step: the wave has a width, so a whole ring is
        // mid-bloom at once instead of the island switching on row by row.
        float bhG = clamp((bhFront - bhD) / max(0.001, uRevealRadius * 0.22), 0.0, 1.0);
        // Overshoot and settle. A bloom springs; it does not inflate.
        transformed *= bhG * (1.0 + 0.30 * sin(bhG * 3.14159));
      }
    #endif
  }
`;


/**
 * `snowline` — the one arrival that is paint rather than geometry.
 *
 * The baked ground already carries its snow, because tomorrow's island is the
 * one that was generated. So the animation runs the other way: bare rock is
 * painted back over everything below a line, and the line falls. It reaches the
 * baked colour exactly, which is the point — a ceremony that leaves the world a
 * shade off from where it will be tomorrow is a ceremony that lied.
 */
export const REVEAL_FRAG = /* glsl */ `
  // The world completing: the new palette washes outward and the old one is
  // what is left ahead of the front. A hue shift that keeps the shading it
  // found — tinting flat would turn a lit island into a sticker, and the whole
  // clay read is in that shading.
  if (uRevealMode > 4.5) {
    float bhD = length(vClayWorld.xz - uRevealCentre.xz);
    float bhFront = uRevealAmount * uRevealRadius;
    float bhAhead = smoothstep(bhFront - uRevealRadius * 0.06, bhFront + uRevealRadius * 0.02, bhD);
    float bhLum = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
    vec3 bhWas = uRevealBare * (0.35 + 1.1 * bhLum);
    diffuseColor.rgb = mix(diffuseColor.rgb, bhWas, bhAhead * 0.85);
  }
  if (uRevealMode > 1.5 && uRevealMode < 2.5) {
    float bhLine = uRevealCentre.y + uRevealRadius * (1.0 - uRevealAmount);
    // Softened by a few centimetres so the line reads as settling snow rather
    // than as a clipping plane.
    float bhSnow = smoothstep(bhLine - 0.12, bhLine + 0.12, vClayWorld.y);
    diffuseColor.rgb = mix(uRevealBare, diffuseColor.rgb, bhSnow);
  }
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
  uniform vec3 uRevealCentre;
  uniform float uRevealRadius;
  uniform float uRevealAmount;
  uniform float uRevealMode;
  varying vec3 vClayWorld;
  varying float vFogDepth;
  varying float vFade;
  #ifdef USE_INSTANCING
    attribute float aFade;
  #endif
  ${NOISE3}
`;

/** Cheap 2D value noise for the fragment stage — the ground's detail. */
export const NOISE2 = /* glsl */ `
  float bh_hash2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float bh_noise2(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(bh_hash2(i), bh_hash2(i + vec2(1.0, 0.0)), u.x),
               mix(bh_hash2(i + vec2(0.0, 1.0)), bh_hash2(i + vec2(1.0, 1.0)), u.x), u.y);
  }
`;

/**
 * **The ground has detail at every scale** (`23-ART-DIRECTION-V2.md` rule 2).
 *
 * The baked vertex colour carries the island's layout — damp and dry, paths,
 * sand, snow. This adds what a vertex every metre cannot: broad golden stretches
 * of dry pampa through the green, patches a few metres across, a fine grain at
 * your feet, and rock wherever the ground stands up, with strata you can read.
 */
export const GROUND_DETAIL_FRAG = /* glsl */ `
  vec2 bhG = vClayWorld.xz;
  float bhMacro = bh_noise2(bhG * 0.045);
  float bhMid = bh_noise2(bhG * 0.32 + 7.1);
  // The detail map, at two scales so its repeat never lines up.
  vec4 bhDetA = texture2D(uGroundDetail, bhG * uGroundScales.x);
  vec4 bhDetB = texture2D(uGroundDetail, bhG * uGroundScales.y + vec2(0.37, 0.71));
  float bhFine = mix(bhDetA.r, bhDetB.r, 0.35);
  // The interpolated normal, not the triangle's: rock and moss decided per face
  // painted every hillside in visible facets.
  vec3 bhFaceN = normalize((vec4(vNormal, 0.0) * viewMatrix).xyz);
  float bhUp = abs(bhFaceN.y);
  vec3 bhBase = diffuseColor.rgb;
  float bhSat = max(bhBase.r, max(bhBase.g, bhBase.b)) - min(bhBase.r, min(bhBase.g, bhBase.b));
  bhBase = mix(vec3(dot(bhBase, vec3(0.2126, 0.7152, 0.0722))), bhBase, 1.2);
  // Dry patches and grain, both centred near one: on pale sand a 1.24× dry tint
  // times a 1.45× grain blew the beach out to white.
  vec3 bhDry = bhBase * vec3(1.12, 1.02, 0.72);
  bhBase = mix(bhBase, bhDry, smoothstep(0.5, 0.78, bhMacro) * 0.6);
  bhBase *= 0.84 + 0.32 * bhMid;
  bhBase *= 0.68 + 0.6 * bhFine;
  // A green floor is turf, not pastel paint: short grass, dark and olive, with
  // the grain showing through. Only where the baked colour is green.
  float bhGreen = smoothstep(1.02, 1.3, bhBase.g / max(max(bhBase.r, bhBase.b), 0.001));
  vec3 bhTurf = vec3(0.05, 0.11, 0.022) * (0.55 + 0.9 * bhFine) * (0.8 + 0.4 * bhMid);
  bhBase = mix(bhBase, bhTurf, bhGreen * 0.85);
  // The worn paths, cut from their distance map: a crisp edge that wanders in
  // and out of the grass, a trodden rim just outside it, and a paler middle.
  vec4 bhPathTex = texture2D(uPathMap, (bhG + uPathInfo.x) / (2.0 * uPathInfo.x));
  float bhPathD = bhPathTex.r * uPathInfo.y;
  // Toward where it arrives a path narrows, frays, and gives out into the grass.
  float bhHalf = uPathInfo.z * mix(0.3, 1.0, bhPathTex.g);
  float bhRag = ((bhDetA.r - 0.5) * 0.9 + (bhDetB.r - 0.5) * 0.9 + (bhMid - 0.5)) * uPathInfo.w * mix(2.2, 1.0, bhPathTex.g);
  // Not under the water, and not on the sand of a ford.
  float bhAbove = smoothstep(uPathFloor, uPathFloor + 0.06, vClayWorld.y);
  float bhPath = (1.0 - smoothstep(bhHalf - 0.05, bhHalf + 0.05, bhPathD + bhRag)) * bhAbove * smoothstep(0.0, 0.35, bhPathTex.g);
  float bhTrod = (1.0 - smoothstep(bhHalf, bhHalf + 0.45, bhPathD + bhRag)) * (1.0 - bhPath) * bhAbove;
  bhBase = mix(bhBase, bhBase * vec3(1.15, 1.0, 0.55), bhTrod * 0.55);
  float bhWorn = (1.0 - smoothstep(0.0, bhHalf, bhPathD + bhRag * 0.5)) * (0.4 + 0.6 * bhMid);
  vec3 bhPathCol = mix(uPathColor, uPathWorn, bhWorn) * (0.62 + 0.76 * bhFine);
  bhPathCol = mix(vec3(dot(bhPathCol, vec3(0.2126, 0.7152, 0.0722))), bhPathCol, 0.8);
  // Packed earth is never one colour: browner where it is compacted, darker
  // where it stays damp, and shaded just inside the lip of turf along its edge.
  bhPathCol = mix(bhPathCol, vec3(0.17, 0.1, 0.055), 0.22 + 0.2 * bhMacro);
  bhPathCol *= mix(1.0, 0.68, smoothstep(0.55, 0.85, bhMid) * 0.6);
  bhPathCol *= mix(1.0, 0.72, smoothstep(bhHalf - 0.22, bhHalf, bhPathD + bhRag));
  bhBase = mix(bhBase, bhPathCol, bhPath);
  // Stones grey the ground toward stone — on bare earth and paths, seldom in
  // turf, where they read as sprinkles. Litter browns it.
  float bhPebble = bhDetA.g * (1.0 - bhGreen * 0.75 * (1.0 - bhPath));
  bhBase = mix(bhBase, vec3(0.17, 0.15, 0.13) * (0.7 + 0.6 * bhDetA.r), bhPebble * 0.85);
  bhBase = mix(bhBase, bhBase * vec3(0.6, 0.46, 0.28), bhDetA.b * 0.6);
  // Under dense grass the ground is the grass's own root shade, so the gaps
  // between blades read as depth instead of bare floor.
  vec2 bhGrassUV = ((bhG + uGrassMaskInfo.z) / uGrassMaskInfo.y + 0.5) / uGrassMaskInfo.x;
  float bhGrass = smoothstep(0.02, 0.4, texture2D(uGrassMask, bhGrassUV).a) * uGrassMaskInfo.w * (1.0 - bhPath);
  vec3 bhRootShade = vec3(0.05, 0.1, 0.025) * (0.8 + 0.5 * bhFine);
  bhBase = mix(bhBase, bhRootShade, bhGrass * uGroundScales.z);
  // Grey stone that faces the sky grows moss and grass in patches.
  vec3 bhMoss = vec3(0.16, 0.24, 0.1) * (0.8 + 0.4 * bhMid);
  bhBase = mix(bhBase, bhMoss, (1.0 - smoothstep(0.02, 0.07, bhSat)) * smoothstep(0.72, 0.92, bhUp) * smoothstep(0.45, 0.7, bhMacro + bhFine * 0.3));
  // Rock where the ground stands up: strata you can read, and cracks.
  float bhRock = 1.0 - smoothstep(0.5, 0.78, bhUp);
  float bhStrata = bh_noise2(vec2((bhG.x + bhG.y) * 0.35, vClayWorld.y * 1.8));
  float bhCrack = 1.0 - smoothstep(0.0, 0.08, abs(bh_noise2(bhG * 0.8 + vec2(vClayWorld.y * 0.9)) - 0.5));
  vec3 bhRockCol = mix(vec3(0.2, 0.19, 0.17), vec3(0.5, 0.47, 0.42), bhStrata) * (0.8 + 0.4 * bhFine);
  bhRockCol *= 1.0 - 0.45 * bhCrack;
  // Ground under the water, and the band just above it, is wet: darker, its
  // stones no longer speckling through — which is also what makes water read deep.
  float bhWet = 1.0 - smoothstep(uPathFloor - 0.02, uPathFloor + 0.08, vClayWorld.y);
  bhBase = mix(bhBase, bhBase * vec3(0.5, 0.52, 0.5), bhWet);
  diffuseColor.rgb = mix(bhBase, bhRockCol, bhRock);
`;

/** Declarations every clay fragment shader needs. */
export const CLAY_FRAG_HEAD = /* glsl */ `
  uniform float uBandCount;
  uniform float uBandSoftness;
  uniform float uBandFloor;
  uniform vec3 uRimColor;
  uniform float uRimStrength;
  uniform float uRimPower;
  uniform float uAOStrength;
  uniform float uAOHeight;
  uniform vec3 uFogColor;
  uniform float uFogNear;
  uniform float uFogFar;
  uniform float uFogDensity;
  uniform vec3 uSunDirW;
  uniform vec3 uSunColor;
  uniform float uTranslucency;
  uniform vec3 uRevealCentre;
  uniform vec3 uRevealBare;
  uniform float uRevealRadius;
  uniform float uRevealAmount;
  uniform float uRevealMode;
  varying vec3 vClayWorld;
  varying float vFogDepth;
  varying float vFade;
  #ifdef BH_REVEAL_GROUND
    uniform sampler2D uGroundDetail;
    uniform sampler2D uGroundNormal;
    uniform sampler2D uGrassMask;
    uniform vec4 uGrassMaskInfo;
    uniform vec4 uGroundScales;
    uniform sampler2D uPathMap;
    uniform vec4 uPathInfo;
    uniform vec3 uPathColor;
    uniform vec3 uPathWorn;
    uniform float uPathFloor;
  #endif
  ${CLAY_FRAG}
  ${NOISE2}
`;

/** Pebbles and grain tilt the light: the detail map's bump, in world space, on the ground only. */
export const GROUND_NORMAL_FRAG = /* glsl */ `
  #ifdef BH_REVEAL_GROUND
    vec2 bhBump = texture2D(uGroundNormal, vClayWorld.xz * uGroundScales.x).xy * 2.0 - 1.0;
    vec3 bhWorldN = normalize((vec4(normal, 0.0) * viewMatrix).xyz);
    bhWorldN = normalize(bhWorldN + vec3(bhBump.x, 0.0, bhBump.y) * uGroundScales.w);
    normal = normalize((viewMatrix * vec4(bhWorldN, 0.0)).xyz);
  #endif
`;
