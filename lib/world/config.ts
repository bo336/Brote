/**
 * Every tunable number in the world, named, in one place.
 *
 * `01-RULES.md` §3.9: after this file exists, **no magic number may appear
 * anywhere else in the new code**. The old world had `2.9 + …*0.24 + pct*0.3`
 * and `focusDistance={0.012}` inline; that is how it became unreviewable.
 *
 * Sources are cited per block. Where the spec gives no number the comment says
 * so and the value is marked OURS — a hypothesis to measure, not a fact.
 *
 * Units: 1 world unit = 1 metre. Angles in degrees unless the name says rad.
 */

// ── The island ──────────────────────────────────────────────────────────────

/** Water plane height. Land is above it, lake beds below (ported verbatim). */
export const WATER_LEVEL = 0;

/** Island radius per rank tier, in metres (`08-WORLD-AND-PROGRESSION.md` §3). */
export const ISLAND_RADIUS_BY_TIER = [18, 24, 30, 34, 38, 42, 48, 54, 57, 60, 60] as const;

/** Pip is 0.55 m tall; every other size in the game is judged against it (`06` §9). */
export const PIP_HEIGHT_M = 0.55;


/** The three heights the art direction fixes (`06-ART-DIRECTION.md` §9). */
export const SCALE_REFERENCE = {
  firstTreeM: 3, // a tier-4 sapling, grown
  fullTreeM: 7, // the tier-6 canopy
  summitM: 22, // the tier-8 peak above the shore
} as const;

/** Terrain baking. Nothing may call `terrainHeight()` per frame — bake, then sample. */
export const TERRAIN = {
  bakeBudgetMs: 150, // over this, chunk across frames or use a worker (`01-RULES` §3.8)
  bakeStepM: 0.45, // target metres between collision samples, whatever the tier
  bakeResolutionMin: 96, // …clamped, so a small island is not over-sampled…
  bakeResolutionMax: 224, // …and a tier-11 island still bakes inside the budget
  frameClampS: 0.05, // the longest step the controller will integrate in one go
  normalEpsilon: 0.06, // finite-difference step for `terrainNormal` (ported verbatim)
  plantableMargin: 0.25, // metres of shoreline kept clear of props (ported verbatim)
  plantableMinHeight: 0.04, // clearance above WATER_LEVEL before a spot is land (ported)
  plantableMaxSlope: 0.55, // 0 flat … 1 vertical; cliffs stay bare (ported)
  rockMaxSlope: 0.92, // …but a rock sits where nothing grows; only a wall is bare
  snapRings: 14, // spiral search rings used by `snapToLand` (ported)
  snapAnglesPerRing: 6, // angles tried per ring (ported)
  snapStep: 0.16, // metres added per ring of the spiral (ported)
} as const;

// ── Island layout (`08-WORLD-AND-PROGRESSION.md` §1-2) ──────────────────────

/**
 * The island is an irregular disc with a headland and a bay, not a circle — the
 * old world's perfect disc is part of why it read as a UI widget. The region
 * STRUCTURE is identical for everyone; only the wobble, the scatter and the
 * species mix are seeded per user.
 */
export const LAYOUT = {
  coastlineSegments: 96, // points around the rim, for the island body and the push-back
  coastWobbleAmp: 0.09, // fraction of R the seeded coastline noise moves the rim
  coastWobbleFreq: 2.6, // how many lobes that noise makes around the circle
  headlandAngleRad: -0.6, // where the headland juts out…
  headlandAmp: 0.16, // …and by how much, as a fraction of R
  bayAngleRad: 2.35, // where the bay cuts in…
  bayAmp: 0.14, // …and by how much
  goldenAngle: 2.399963, // the spiral that spreads scatter points without clumping
  scatterPoolMax: 2000, // the deterministic pool; quality tiers take a prefix of it
  // How the pool is divided by the stable `roll` value. The shares are sized to
  // the T3 budgets in `lib/render/quality.ts` — a 3.5% band for trees left a
  // tier-11 island with fifteen of them against a budget of a hundred and
  // eighty, which read as an empty field.
  shareGrass: 0.58,
  shareFlowers: 0.16,
  shareTrees: 0.14,
  shareRocks: 0.08,
  shareSprouts: 0.04,
  scatterMinSpacingM: 0.34, // rejection distance between two scatter points
  scatterRadiusBias: 0.85, // <1 pulls the spiral inward, away from the shoreline
  regionRadiusFrac: 0.34, // a region's influence radius as a fraction of R
  claroRadiusFrac: 0.3, // El Claro sits at the centre and is a little tighter
  isletDistanceFrac: 1.18, // El Islote sits this far out, across the water
  snowLineFrac: 0.62, // snow starts this far up the summit, before season modifiers
  puddleOffsetFrac: 1.15, // the tier-2 puddle sits just past La Pradera's centre
  puddleRadiusFrac: 0.11, // its surface radius, as a fraction of R
  puddleDepthM: 0.16, // shallow on purpose — you fill a can from it, you do not swim
  mountainRadiusFrac: 0.42, // El Monte's footprint, as a fraction of its tier's radius
  shoulderOffsetFrac: 0.72, // a second, lower mass so the massif is not one cone
  shoulderHeightFrac: 0.55, // …at this fraction of the summit height
  lagoonRadiusFrac: 0.3, // La Laguna's surface
  lagoonDepthM: 1.4, // deep enough to swim in, which is the tier-7 verb
  riverSourceFrac: 0.72, // the water breaks out of the rock this far up the mountain
  riverWidthM: 1.6, // the channel at rest; the impact mirror widens it 0.8 → 3.2
  riverDepthM: 1.1, // carved deep enough to read as a river, not a damp stripe
  isletRadiusFrac: 0.15, // El Islote — a SMALL islet, not a second island
  isletHeightM: 2.6, // …and how far its crown stands above the water line
  isletScatter: 48, // scatter points on the islet, which the main spiral misses
  steepScatter: 260, // rock-only points on ground too steep to plant (El Monte, La Cumbre)
} as const;

// ── Movement (`10-CONTROLS-AND-CAMERA.md` §2) ───────────────────────────────

export const MOVE = {
  walkSpeed: 2.4, // m/s
  runSpeed: 4.0, // m/s, past the joystick run threshold
  accel: 14, // m/s² toward the desired direction
  friction: 10, // per second, ground drag once input is released
  turnLambda: 10, // yaw damping rate; never snap
  slopeLimitDeg: 38, // above this the up-slope component is zeroed
  slopeWallDeg: 55, // above this it is a wall unless `scale` is unlocked
  coastPushback: 1.2, // m/s of soft radial push at the coastline — never a wall
  coastMarginM: 0.8, // how far inside the radius the push begins
} as const;

/** Speeds and limits owned by individual verbs (`10-CONTROLS-AND-CAMERA.md` §3). */
export const VERB_MOTION = {
  swimSpeed: 1.6, // m/s
  climbSpeed: 1.2, // m/s vertical on a marked face
  mantleMaxHeightM: 2, // ledges below this auto-mantle on contact
  glideMinLedgeM: 4, // gliding needs a drop of at least this
  glideFallSpeed: 1.8, // m/s, clamped
  glideHorizontalSpeed: 3.2, // m/s of air control
  sailSpeed: 3, // m/s in the boat
  caveLanternRadiusM: 6, // lit radius inside the cave
} as const;

// ── Camera (`10-CONTROLS-AND-CAMERA.md` §4) ─────────────────────────────────

export const CAMERA = {
  fov: 38, // vertical degrees — NEVER varied per device; that would change the art
  pitchDeg: -28, // looking down into the diorama
  distanceM: 7, // default follow distance
  posLambda: 6, // position damping rate
  lookLambda: 12, // look-at damping — 2× the position rate is the "attentive" trick
  targetAspect: 390 / 844, // the reference portrait phone (`18-DECISIONS.md` D5)
  aspectDistanceMin: 1.0, // distance multiplier clamp, low end
  aspectDistanceMax: 1.6, // distance multiplier clamp, high end
  portraitLookLiftM: 0.35, // raise the look-at in portrait so the joystick misses Pip
  recentreDelayS: 2.5, // auto-recentre behind Pip after this much idle camera input
  recentreLambdaScale: 0.35, // …and eases round at a fraction of the follow rate
  lookAheadM: 0.4, // the look-at sits this far ahead of Pip, along their facing
  lookHeightFrac: 0.6, // …and this far up Pip's own height
  occlusionMarginM: 0.4, // pull in to the hit point minus this
  occlusionInLambda: 14, // fast in…
  occlusionOutLambda: 3, // …slow out
  occlusionSamples: 6, // height probes along the boom; 6 is enough for a hillside
  occlusionClearanceM: 0.5, // keep the boom this far above the ground it passes over
  occlusionMinM: 2.2, // never pull closer than this, however steep the slope
  pinchMinM: 4, // pinch distance clamp, near
  pinchMaxM: 11, // pinch distance clamp, far
} as const;

/** Reduced motion halves every camera damping rate and kills auto-recentring (`16` §3). */
export const REDUCED_MOTION_DAMPING_SCALE = 0.5;

// ── Input (`10-CONTROLS-AND-CAMERA.md` §1) ──────────────────────────────────

export const JOYSTICK = {
  deadZone: 0.1, // below 0.08 you get thumb tremor; above 0.15 the first mm feels dead
  maxRadiusPx: 48, // beyond this needs wrist movement
  runThreshold: 0.85, // fraction of max radius that switches walk to run
  zoneWidthPct: 0.45, // activation zone: the bottom-left 45% of viewport width…
  zoneHeightPct: 0.55, // …and the bottom 55% of its height
  releaseDampMs: 150, // damp input to zero on release; no return animation
  safeAreaMinPx: 16, // floor for the `env(safe-area-inset-bottom)` padding
} as const;

/** Every verb completion fires sound + motion + this haptic (`10` §6). */
export const HAPTIC_MS = 12;

// ── Interaction (`10-CONTROLS-AND-CAMERA.md` §5) ────────────────────────────

export const INTERACT = {
  scanEveryNFrames: 3, // proximity scan cadence; one active interactable at a time
  defaultRadiusM: 2.4, // OURS — the spec says "generous" and gives no figure
  facingWeight: 0.6, // 0 = nearest wins, 1 = facing angle wins; ties break by angle
  buttonMinPx: 48, // touch-target floor (`16-UI-AUDIO-A11Y.md` §3)
  cueBobAmplitudeM: 0.06, // world-space affordance bob; disabled under reduced motion
  cueBobHz: 0.6, // and its rate
} as const;

/** Hold and timing windows per verb (`10-CONTROLS-AND-CAMERA.md` §3). */
export const VERB_TIMING = {
  plantHoldMs: 800, // hold to plant, then the sapling scales up
  logHoldMs: 600, // the census framing reticle converge time
  forageSquashMs: 400, // the node empties and starts its respawn timer
  waterCanUses: 3, // capacity, shown as a small world-space pip on Pip
  fishWaitMinS: 3, // cast, then wait…
  fishWaitMaxS: 10, // …up to this long for the tug
  fishTugWindowMs: 900, // tap inside this to land it
  restAdvanceS: 6, // resting advances time of day one preset over this
  poseCrossfadeMs: 250, // verb pose blend (`09-PIP.md` §3)
} as const;

// ── Placement and arrangement (`08-WORLD-AND-PROGRESSION.md` §8) ────────────

export const PLACEMENT = {
  capBase: 4, // cap = capBase + tier × capPerTier, so an island never becomes a junkyard
  capPerTier: 3,
  rotationStepDeg: 15, // free rotation, snapped
  defaultFootprintM: 0.6, // OURS — reserved radius when a prop declares none
  nudgeM: 0.35, // overlap is refused with a soft nudge, never an error message
  savedLayoutsFree: 3, // more with Brote+
  autosaveDebounceMs: 2000, // optimistic local write; never block interaction on the network
} as const;

/** The placed-prop cap for a tier. */
export function placementCap(tier: number): number {
  return PLACEMENT.capBase + Math.max(0, tier) * PLACEMENT.capPerTier;
}

// ── The semillas economy (`11-GAME-LOOP.md` §4) ─────────────────────────────

export const SEMILLAS = {
  chore: 5, // per chore
  choreSet: 15, // completing the day's three
  censusFirst: 5, // first sighting of a species, once ever
  censusRegion: 60, // completing a region's census, once each
  forageMin: 2, // per foraging node…
  forageMax: 4, // …up to this
  traversalCache: 10, // once each
  eventMin: 25, // event completion pays between…
  eventMax: 50, // …these two
} as const;

/** Daily caps. The RPC enforces these; the client only pre-checks. */
export const DAILY_CAPS = {
  chores: 3, // three rotating chores per day…
  chorePool: 10, // …drawn deterministically from a pool of ten
  forage: 8,
  events: 1,
} as const;

/** Foraging is the appointment loop: one real action, two app opens (`11` §3.5). */
export const FORAGE_RESPAWN = { minHours: 4, maxHours: 8 } as const;

/** Hidden traversal caches per region (`11-GAME-LOOP.md` §3.2). */
export const TRAVERSAL_CACHES_PER_REGION = { min: 6, max: 10 } as const;

// ── The impact mirror (`13-IMPACT-MIRROR.md` §2) ────────────────────────────

/**
 * Log-curve reference and saturation points. Impact totals span orders of
 * magnitude, so a linear map would be invisible for a year and then saturate.
 * Starting points — tune against real user data and record any change here.
 */
export const IMPACT_CURVE = {
  water_l: { ref: 200, max: 500_000 },
  co2_kg: { ref: 5, max: 5_000 },
  waste_kg: { ref: 2, max: 2_000 },
  energy_kwh: { ref: 10, max: 20_000 },
} as const;

/** Each `MirrorParams` field as `[value at zero impact, value at max impact]`. */
export const MIRROR_RANGE = {
  riverWidth: [0.8, 3.2], // metres of channel width
  riverFlow: [0.2, 1.0], // shader swell speed
  waterfallGain: [0.0, 1.0], // sheet width, particle count and audio gain together
  pondArea: [0.3, 1.0], // scale factor
  fogDensity: [1.0, 0.25], // inverse: more impact, less haze
  fogFar: [45, 110], // metres — clean air is literally how far you can see
  skySaturation: [0.7, 1.0],
  debrisCount: [40, 0], // instances; only ever shrinks, never added to
  compostScale: [0.2, 1.0],
  lanternCount: [0, 14], // instances lit at night
  fireflyCount: [0, 30],
  auroraIntensity: [0.0, 1.0], // tier 10+
  windmillRPM: [2, 14], // `mundo_molino` promises it turns faster when it blows
} as const;

// ── Events (`14-CONTENT.md` §5) ─────────────────────────────────────────────

/** At most one per two days, never two in a row (`11-GAME-LOOP.md` §3.7). */
export const EVENT_MIN_GAP_DAYS = 2;

export const INCENDIO = {
  durationS: 90, // the in-game clock
  frontSpeedMs: 0.4, // m/s of burn-front advance
  canUses: 3, // watering can, refillable at the river or the puddle
  rakeUses: 4, // firebreak rake
  rakeStripM: 2, // width of undergrowth it clears
  wrongChoiceCostS: 12, // each wrong decision costs this much time…
  wrongChoiceBurnM2: 3, // …and burns this much more ground, which regrows next day
  payout: 40, // semillas…
  payoutImperfect: 25, // …or this with any wrong choice. Never zero.
} as const;

export const CRECIENTE = {
  riseM: 0.6, // the river rises this much…
  durationS: 180, // …over three minutes
  sandbagSpots: 4,
  strandedAnimals: 3,
  payout: 30,
} as const;

export const NIDO = { candidateTrees: 3, payout: 25 } as const;
export const RESIDUOS = { items: 12, bins: 4, payout: 35 } as const;
export const SEQUIA = { days: 3, payout: 30 } as const;
export const VISITANTE = { payout: 20 } as const;

// ── Ceremonies (`08-WORLD-AND-PROGRESSION.md` §5) ───────────────────────────

export const CEREMONY = {
  takeCameraS: 2, // beat 1 — input suspends, the camera lifts
  featureMinS: 8, // beat 3 — the physical event, never a fade-in
  featureMaxS: 15,
  titleCardS: 4, // beat 4 — the rank name and the line tying it to the real cause
  newVerbS: 4, // beat 5 — the new verb, taught in one sentence, in-world
  shareCardS: 2, // beat 6 — no upsell, no interstitial
  worldCompleteS: 8, // the biome cross-fade when `worldIndex` increments
} as const;

// ── Time of day, seasons, liveliness ────────────────────────────────────────

/** Southern-hemisphere season starts as `[month 1-12, day]` (`08` §9). */
export const SEASON_STARTS = {
  verano: [12, 21],
  otono: [3, 21],
  invierno: [6, 21],
  primavera: [9, 21],
} as const;

/** The world's clock. Everything date-derived uses it, never the device zone. */
export const WORLD_TIMEZONE = 'America/Argentina/Buenos_Aires';

/**
 * `liveliness` (0.35..1) adds warmth ONLY: fauna within the tier cap, key-light
 * warmth, motes, idle animation density. It never removes anything (`01` §4.2).
 */
export const LIVELINESS = {
  min: 0.35, // matches `lib/mundo.ts` — a broken streak dims, it never kills
  max: 1,
  faunaFloor: 0.4, // fraction of the tier's fauna cap present at minimum liveliness
  moteFloor: 0.25, // the same, for ambient pollen and motes
  keyWarmthGain: 0.15, // extra key-light warmth at full liveliness
} as const;

// ── Learning (`12-LEARNING.md` §2) ──────────────────────────────────────────

export const LEARNING = {
  sessionShareMax: 0.1, // ≤10% of session time
  reviewItemsPerDay: 5,
  wiltingVisibleMax: 3, // however many are actually due
  wiltingSelfRecoverDays: 7, // recovers on its own, regardless of player action
  microFactMinWords: 12, // a micro-fact is 12-18 words…
  microFactMaxWords: 18,
  gameplayTextMaxWords: 25, // …and no gameplay text exceeds 25
} as const;

// ── The render half of this file ────────────────────────────────────────────

/**
 * The art-direction, Pip and performance constants live in `config.render.ts`
 * and are re-exported here, so `lib/world/config` remains the single import
 * path for every tunable in the game (`01-RULES.md` §3.9) while no file exceeds
 * 400 lines (§3.2). The split is along a real seam: everything below this line
 * is consumed by `lib/render/**`, and nothing above it is.
 */
export * from './config.render';
