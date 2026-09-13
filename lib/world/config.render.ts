/**
 * The render half of `lib/world/config.ts` — art direction, Pip, and the
 * performance ceilings.
 *
 * It is a separate file only because no file may exceed 400 lines
 * (`01-RULES.md` §3.2). **Import it through `./config`, never directly**: there
 * is one place to look for a tunable, and it is `lib/world/config`.
 *
 * These constants stay in the pure layer even though `lib/render` is their only
 * consumer, because §3.9 is what stops `focusDistance={0.012}` and
 * `aoRadius={0.5}` from reappearing inline in a component.
 */

/**
 * The palette cream. Every world colour is desaturated toward it by 8-15%, which
 * is what makes six different biomes share one material feel. It lives here, in
 * the pure layer, because chalking is colour maths and `lib/world/biome.ts` runs
 * it — `lib/render/palette.ts` re-exports the same function, so there is one
 * implementation and one target colour, not two.
 */

/**
 * Pip's proportions (`09-PIP.md` §2). A rounded seed: body, stem, leaf, two eyes,
 * a mouth, cheeks. No legs, no arms — and every one of these is a fraction of
 * the 0.55 m total, so the whole character scales from one number.
 */
export const PIP = {
  bodyRadius: 0.22, // the sphere everything else hangs off
  bodyScaleY: 1.12, // squashed vertically…
  bodyScaleZ: 0.95, // …and slightly flattened front to back
  bodyTaper: 0.88, // the crown narrows; clay has no cylinders
  bodyCentreY: 0.25, // so Pip's feet land on y = 0
  stemRadius: 0.014,
  stemHeight: 0.07,
  // A bigger leaf and bigger eyes (`23-ART-DIRECTION-V2.md`): at 0.55 m under a
  // six-metre camera, the old face read as two dots and the sprout as a twig.
  leafLength: 0.24,
  leafWidth: 0.125,
  eyeRadius: 0.045,
  eyeSpread: 0.086, // half the distance between the eyes
  eyeHeight: 0.045, // above the body centre
  eyeDepth: 0.9, // fraction of the body radius the eyes sit forward at
  cheekRadius: 0.032,
  bodyRoughness: 0.5, // a soft vinyl sheen
  eyeRoughness: 0.12, // wet and bright
  cheekSpread: 0.145,
  mouthWidth: 0.05,
  /** How much harder Pip's silhouette catches the key light than anything else. */
  rimBoost: 2.4,
  auraRadius: 0.42, // the guardian sphere, from tier 8
  // …and it is a halo, so you can still see Pip inside it. Low: at 0.22 over a
  // character 80 px tall, his own colours diffused through it and the whole thing
  // read as a soap bubble rather than a glow.
  auraOpacity: 0.2,
  blinkMs: 90, // one blink, squashing the eyes on the Y axis
  blinkMinS: 2.4, // …at a random interval between these
  blinkMaxS: 6.5,
} as const;

/**
 * Pip's procedural animation (`09-PIP.md` §3). 100% procedural: no SkinnedMesh,
 * no AnimationMixer, no glTF clips. For a rounded mascot, squash-and-stretch IS
 * the native language — a handful of `Math.sin` calls and zero asset bytes.
 */
export const PIP_RIG = {
  hopHeightM: 0.055, // apex of the hop above the ground
  hopHzPerSpeed: 1.15, // hop frequency scales with speed, so it never desyncs
  hopHzMin: 1.6, // …but never crawls
  squashContact: 1.15, // (x, z) at contact; y is derived to preserve volume
  stretchApex: 0.92, // (x, z) at the apex, same rule
  leanMaxDeg: 12, // tilt toward movement…
  leanPerSpeed: 5, // …proportional to speed, clamped
  leanLambda: 9, // damped, with counter-lean overshoot on stop
  counterLean: 0.45, // how much of the lean is thrown the other way when stopping
  anticipationMs: 100, // a squash BEFORE the first hop, when starting to move
  breathHz: 0.4, // idle breathing on the y scale…
  breathAmp: 0.02, // …±2%
  lookAroundEveryS: 5.5, // an occasional idle yaw offset — idle life sells a mascot
  lookAroundDeg: 22,
  lookLambda: 2.5, // how fast the idle glance eases in and out
  leafIdleHz: 0.9, // the leaf keeps breathing even when Pip is standing still…
  leafIdleAmp: 0.05, // …by this much
  leafLagMs: 80, // the leaf trails the body's rotation…
  leafOvershoot: 1.35, // …and overshoots. Secondary motion is most of the charm.
  airStretchPerMps: 0.045, // a jump stretches Pip along their vertical speed…
  airStretchMax: 0.2, // …by at most a fifth
  landSquash: 1.24, // and the landing squashes them this wide…
  landSquashMs: 150, // …for this long
  celebrateMs: 720, // a job done: a hop and a full turn…
  celebrateHopM: 0.34, // …this high
} as const;

// ── Render loop and the quality monitor (`07-RENDER-ARCHITECTURE.md` §4) ────

export const RENDER_LOOP = {
  idleDemandDelayS: 4, // drop to frameloop="demand" after this much idle
} as const;

export const QUALITY_MONITOR = {
  medianWindowFrames: 90, // a rolling median, not an instantaneous reading
  demoteAfterS: 3, // below the tier's target for this long → demote immediately
  promoteMargin: 0.35, // need +35% headroom above target…
  promoteAfterS: 20, // …sustained for this long, to promote once
  promoteCooldownS: 60, // then wait this long before promoting again
  demoteLockoutS: 60, // a demotion locks out promotion for this long. Never oscillate.
} as const;

// ── Art direction (`06-ART-DIRECTION.md` §4-7) ──────────────────────────────

export const CHALK_TARGET = '#F7F5EF';


/** The clay material's uniform defaults. One material system, one look. */
export const CLAY = {
  bandCount: 3, // light quantised into shadow / mid / lit
  bandSoftness: 0.06, // transition width between bands
  /**
   * How dark the darkest band is allowed to be.
   *
   * Not zero. Three bands quantised straight to `floor(l·3)/3` send anything
   * under a tenth of full light to pure black, and a steep face turned away
   * from the key light is under it — so El Monte's flank rendered as a hole in
   * the world at midday. Clay in shadow is still clay.
   */
  bandFloor: 0.2,
  /**
   * `pow(1 - dot(N, V), rimPower)`.
   *
   * **5, not 2.5.** A rim is a silhouette, and at 2.5 it was not one: the term
   * only asks how far a surface faces away from the lens, and the two largest
   * things in every frame — the ground under a 24-degree camera, and a grass
   * blade seen edge-on — both face away almost completely. So both received
   * nearly the full warm add. The ground washed out to a flat cream-green that
   * swallowed its own vertex colours and its baked AO, and the grass rendered
   * as pale straw over it. Narrowing the falloff leaves the true silhouettes
   * lit and takes the wash off everything else.
   */
  rimPower: 5,
  rimStrength: 0.35, // added, never multiplied
  aoStrength: 0.45, // baked vertical AO — this replaces SSAO entirely
  aoHeightM: 0.6, // smoothstep distance up from an object's base
  // 0.04, not the clay spec's 12%: under AgX and real light, chalking on top of the
  // tone curve's own roll-off left every biome pastel (`23-ART-DIRECTION-V2.md`).
  chalkAmount: 0.04,
} as const;

/**
 * The look, v2 (`23-ART-DIRECTION-V2.md`): a real sun, real soft shadows, AgX
 * tone mapping, and leaves the light comes through.
 */
export const LOOK = {
  exposure: 1.0, // AgX exposure; the presets are authored against 1
  roughness: 0.9, // most of the world is matte, not chalk: a little sheen reads as material
  translucency: 0.55, // how much sun a back-lit leaf or blade passes
  sunDistanceM: 60, // how far up the sun's shadow camera sits from Pip
  shadowBias: -0.0004,
  shadowNormalBias: 0.04,
  shadowNearM: 1,
  shadowFarM: 140,
} as const;

/**
 * The grass field (`lib/render/grass.ts`): blades generated on the GPU in a
 * window that follows Pip, anchored to the world so they never slide.
 * `spacing` is metres between blades; `radius` how far the field reaches.
 */
export const GRASS = {
  bladeHeightM: 0.32, // knee-high on Pip, who is 0.55 m
  // Wider than a real blade: at this density a true blade is a spike, and the
  // playtest-era frames read as a field of needles.
  bladeWidthM: 0.09,
  segments: 4, // bends per blade; four is enough for a curve to read
  pushRadiusM: 0.6, // how far the grass parts around Pip
  maxSlope: 0.45, // steeper than this is rock, and nothing grows
  windAmp: 0.34,
  windDir: [0.8, 0.6] as [number, number],
  coastClearM: 0.6, // sand, not grass, this close to the sea
  clearingFreq: 0.07, // how big the natural clearings are
  byTier: [
    { spacing: 0.3, radius: 8 },
    { spacing: 0.22, radius: 11 },
    { spacing: 0.16, radius: 14 },
    { spacing: 0.12, radius: 18 },
  ],
} as const;

/** The water (`lib/render/materials/water.ts`). Colours are the look; the rest is feel. */
export const WATER = {
  shallow: '#57CFC4', // turquoise over sand
  deep: '#135F82', // the blue past the shelf
  foam: '#F4FBFA',
  // Depth the foam lip covers. Small: the puddle is 16 cm deep, and at 14 cm the
  // whole of it was lip — a white disc on the pradera.
  foamWidthM: 0.03,
  ripple: 0.32, // how strongly the ripples tilt the surface
  rippleLow: 0.18, // …at T0, where fewer pixels resolve them
} as const;

/** The post stack at T2+ (`components/mundo3d/scene/PostFx.tsx`). */
export const POST = {
  // A contact term, not murk. At 1.4 m and then 0.5 m the ground under Pip — a
  // 22 cm sphere — occluded three quarters of him, and a darkened saturated green
  // comes out of AgX as grey: the protagonist rendered as a stone.
  aoRadiusM: 0.22,
  aoFalloff: 1.5,
  aoIntensity: 0.9,
  bloomIntensity: 0.5,
  bloomThreshold: 0.9, // only what is genuinely bright glows: sun on water, not grass
  shadowTint: [-0.012, 0.01, 0.008] as [number, number, number], // shadows toward canopy green-teal
  highlightTint: [0.03, 0.012, -0.02] as [number, number, number], // highlights toward dawn amber
  saturation: 1.08,
  vignetteOffset: 0.32,
  vignetteDarkness: 0.42,
  msaaSamples: 4,
} as const;

/** The static, world-position-driven handmade wobble. Off at T0, off on movers. */
export const WOBBLE = { freq: 0.35, amp: 0.022 } as const;

/** Wind animates foliage only — one implementation, not three (`06` §5). */
export const WIND = { amp: 0.06, hz: 0.35, gustHz: 0.11, heightBias: 1.6 } as const;

/** Fog is the depth cue in this game; there is no depth of field (`06` §4). */
export const FOG = { nearFraction: 0.35 } as const;

/** Blob shadows: one InstancedMesh for every shadow in the game (`06` §7). */
export const BLOB_SHADOW = {
  textureSize: 64, // one generated radial-gradient canvas texture
  // 0.32 was too faint to ground anything once the decal stopped being eaten by
  // the terrain; 0.85 read as a hole. Judged from screenshots at seven metres.
  maxOpacity: 0.45,
  fadeHeightM: 3, // fully faded once the caster is this far above the ground
} as const;

// ── Share card and poster (`07-RENDER-ARCHITECTURE.md` §1) ──────────────────

export const SHARE_CARD = {
  /**
   * JPEG quality for the ceremony's before-shot. It is held in memory as a
   * data URL for under a minute and then drawn at a fraction of the card's
   * height, so PNG would be several megabytes of string for nothing. OURS.
   */
  captureQuality: 0.82,
  width: 1080, // the 9:16-ish portrait card…
  height: 1350,
  squareSize: 1080, // …and the 1:1 variant of the same composition
  shotHeightPct: 0.76, // the world shot covers the top of the card
  bandFadeStartPx: 140, // where the brand band's gradient begins
} as const;

// ── Performance ceilings (`07-RENDER-ARCHITECTURE.md` §6), indexed by tier ──

/**
 * OURS, not an industry budget: hypotheses, validated on the reference device.
 *
 * **`triangles` and `drawCalls` are content caps** — they stand for frame time
 * on a cheap phone, and going over them means trimming what is drawn, never
 * moving the number. `geometries` and `textures` are **leak detectors**: they
 * exist to catch a shape or a canvas being built twice, or a cache that is
 * never cleared. A richer island legitimately has more distinct shapes, so
 * those two move when content justifies it — with the measurement that
 * justified it written down.
 *
 * These were raised to 48 and 78 mid-phase-4, on a tier-11 measurement of 41
 * live geometries. **They are back where they started.** The open-ended grass
 * blade and the tuft-count trim took the tier-11 figure down to 36 at T1 and 41
 * at T2, both inside the original budget, so the headroom was never needed —
 * and `20-ACCEPTANCE.md` 5E asks for ≤40 in as many words. A ceiling raised to
 * fit a measurement that no longer holds is not a ceiling.
 */
export const PERF_CEILINGS = [
  { drawCalls: 25, triangles: 35_000, geometries: 25, textures: 6, textureMB: 8, frameMs: 33 },
  { drawCalls: 45, triangles: 70_000, geometries: 40, textures: 8, textureMB: 12, frameMs: 33 },
  { drawCalls: 90, triangles: 160_000, geometries: 70, textures: 12, textureMB: 24, frameMs: 22 },
  { drawCalls: 160, triangles: 400_000, geometries: 120, textures: 20, textureMB: 48, frameMs: 16 },
] as const;

/** Light presets cross-fade over this; it is not a continuous sun sim (`06` §6). */
export const LIGHT_PRESET_CROSSFADE_S = 2;

/**
 * El póster — the still image every other screen in the app shows instead of a
 * second WebGL context (`07-RENDER-ARCHITECTURE.md` §1).
 */
export const SNAPSHOT = {
  bucket: 'world-snapshots',
  /**
   * JPEG rather than PNG: the card is at most 320 px tall and this is uploaded
   * from a phone, often on mobile data. OURS.
   */
  quality: 0.78,
  /**
   * Seconds after arriving before the shot is taken. Long enough for the
   * camera to damp in behind Pip and the world to finish building; short
   * enough that a player who bounces straight back out still gets one. OURS.
   */
  settleS: 4,
  /** The most posters one visit may upload. A souvenir, not a stream. */
  maxPerVisit: 2,
} as const;
