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
  leafLength: 0.19,
  leafWidth: 0.1,
  eyeRadius: 0.036,
  eyeSpread: 0.082, // half the distance between the eyes
  eyeHeight: 0.045, // above the body centre
  eyeDepth: 0.9, // fraction of the body radius the eyes sit forward at
  cheekRadius: 0.028,
  cheekSpread: 0.145,
  mouthWidth: 0.05,
  auraRadius: 0.42, // the guardian sphere, from tier 8
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
  rimPower: 2.5, // pow(1 - dot(N, V), rimPower)
  rimStrength: 0.35, // added, never multiplied
  aoStrength: 0.45, // baked vertical AO — this replaces SSAO entirely
  aoHeightM: 0.6, // smoothstep distance up from an object's base
  chalkAmount: 0.12, // desaturation toward the palette cream; the spec says 8-15%
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
  maxOpacity: 0.32,
  fadeHeightM: 3, // fully faded once the caster is this far above the ground
} as const;

// ── Share card and poster (`07-RENDER-ARCHITECTURE.md` §1) ──────────────────

export const SHARE_CARD = {
  width: 1080, // the 9:16-ish portrait card…
  height: 1350,
  squareSize: 1080, // …and the 1:1 variant of the same composition
  shotHeightPct: 0.76, // the world shot covers the top of the card
  bandFadeStartPx: 140, // where the brand band's gradient begins
} as const;

// ── Performance ceilings (`07-RENDER-ARCHITECTURE.md` §6), indexed by tier ──

/** OURS, not an industry budget: hypotheses, validated on the reference device. */
export const PERF_CEILINGS = [
  { drawCalls: 25, triangles: 35_000, geometries: 25, textures: 6, textureMB: 8, frameMs: 33 },
  { drawCalls: 45, triangles: 70_000, geometries: 40, textures: 8, textureMB: 12, frameMs: 33 },
  { drawCalls: 90, triangles: 160_000, geometries: 70, textures: 12, textureMB: 24, frameMs: 22 },
  { drawCalls: 160, triangles: 400_000, geometries: 120, textures: 20, textureMB: 48, frameMs: 16 },
] as const;

/** Light presets cross-fade over this; it is not a continuous sun sim (`06` §6). */
export const LIGHT_PRESET_CROSSFADE_S = 2;
