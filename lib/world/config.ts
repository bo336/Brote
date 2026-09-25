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

/**
 * How deep the open sea is, in metres.
 *
 * Not a measurement of anything — the sea has no bottom in this game. It is
 * "past every shelf and every foam line", so the shader's depth clamp lands on
 * the deepest colour and the surf stays where the sand is.
 */
export const SEA_DEPTH_M = 8;

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

/**
 * The worn paths from El Claro to every open region (`lib/world/paths.ts`).
 * OURS, judged from screenshots: wide enough to read from the default camera,
 * narrow enough to be a path and not a road.
 */
export const PATHS = {
  widthM: 1.3, // the worn middle
  edgeM: 0.9, // the soft edge into the grass
  samples: 16, // segments per path; a curve at this length needs no more
  bendFrac: 0.28, // how far sideways the S is pushed, as a fraction of the path's length
  arriveFrac: 0.3, // stop this fraction of the region's radius short of its centre
  minLengthM: 3, // a region closer than this to the spawn needs no path
} as const;

/**
 * Guidance: the objective beacon, the arrow at Pip's feet, the saplings planting
 * leaves behind (`components/mundo3d/scene/Guidance.tsx`). OURS, from screenshots.
 */
export const GUIDE = {
  trackEveryS: 0.4, // how often the next objective is re-picked
  beamRadiusM: 0.28,
  beamHeightM: 14, // tall enough to see over a hill
  beamOpacity: 0.85,
  beamFadeNearM: 3, // gone once you are standing at it…
  beamFadeFarM: 9, // …full strength from here out
  arrowMinM: 5, // no arrow when the target is right there
  arrowAheadM: 0.9, // how far in front of Pip the chevron sits
  // Over the grass, not in it: at 6 cm the blades hid it completely.
  arrowLiftM: 0.42,
  arrowScale: 1.6,
  arrowNudgeM: 0.12, // it nudges toward the target, a beckon
  saplingGrowMs: 1600,
  saplingScale: 0.55,
} as const;

// ── Movement, camera, input, interaction ────────────────────────────────────

// They live in `config.controls.ts` for the 400-line rule; this is still the door.
export {
  MOVE, VERB_MOTION, CAMERA, REDUCED_MOTION_DAMPING_SCALE, JOYSTICK, HAPTIC_MS, INTERACT, VERB_TIMING,
} from './config.controls';

// ── Placement and arrangement (`08-WORLD-AND-PROGRESSION.md` §8) ────────────

/**
 * Saved arrangements (`08-WORLD-AND-PROGRESSION.md` §8). The real cap is the
 * plan's, enforced by `world_save_layout`; these are what the bar draws.
 */
export const LAYOUTS = {
  /** Slots a free account gets, and therefore what everyone sees. */
  freeSlots: 3,
  /** The ceiling `world_save_layout` allows a paid plan. */
  maxSlots: 10,
  /** Stored names are `slot-1`… so saving over a slot overwrites it. */
  slotPrefix: 'slot-',
} as const;

export const PLACEMENT = {
  /**
   * How much wider than its footprint a placed prop is to tap.
   * OURS: a fingertip is about 9 mm across and a comedero's footprint is
   * 0.35 m, so an exact test makes picking one back up a game of skill.
   */
  pickUpReachScale: 1.6,
  capBase: 8, // cap = capBase + tier × capPerTier, so an island never becomes a junkyard
  capPerTier: 4, // (0115: raised with the shop — decor is bought, and bought things want a place)
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

/**
 * Los mojones de proyecto (`11-GAME-LOOP.md` §5 pillar 5). A line of stones for
 * the real projects the player went to, walked outward from the spawn.
 */
export const MARKERS = {
  /** How many the island will carry. OURS: a path, never a graveyard. */
  max: 12,
  /** Metres from the spawn to the first one. OURS. */
  firstM: 6,
  /** Metres between stones. Far enough apart to be separate memories. OURS. */
  spacingM: 3.4,
  /** Sideways wander, so the line reads as a path and not as a fence. OURS. */
  driftM: 1.2,
  /** How far out the line may reach, as a fraction of the island's radius. */
  reachFraction: 0.8,
} as const;

/**
 * Idle maturation (`11-GAME-LOOP.md` §3.6). Trees, ponds and flowers grow on
 * wall-clock time, independent of play, visible on return.
 *
 * **Supplementary, never the session.** These numbers are deliberately small:
 * enough that a week away is visible, never enough to be a reason to open the
 * app. "Log in, collect, log out" is a dead game.
 */
export const MATURATION = {
  /** Days to full growth. OURS: a week reads as "it kept going without me". */
  daysToFull: 7,
  /** How much bigger a fully matured thing is drawn. A tenth. OURS. */
  scaleGain: 0.1,
} as const;

/** Hidden traversal caches per region (`11-GAME-LOOP.md` §3.2). */
export const TRAVERSAL_CACHES_PER_REGION = { min: 6, max: 10 } as const;

// ── The impact mirror ───────────────────────────────────────────────────────

// It lives in `config.impact.ts` — see there for why.
export { IMPACT_CURVE, MIRROR_RANGE, MOJON, IMPACT_PROVENANCE } from './config.impact';

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

export { VISIT, GIFT, FIRST_RUN, FRIEND_STREAK } from './config.social';

export const LEARNING = {
  sessionShareMax: 0.1, // ≤10% of session time
  reviewItemsPerDay: 5,
  wiltingVisibleMax: 3, // however many are actually due
  wiltingSelfRecoverDays: 7, // recovers on its own, regardless of player action
  microFactMinWords: 12, // a micro-fact is 12-18 words…
  microFactMaxWords: 18,
  gameplayTextMaxWords: 25, // …and no gameplay text exceeds 25
} as const;

export * from './config.events';

// ── The render half of this file ────────────────────────────────────────────

/**
 * The art-direction, Pip and performance constants live in `config.render.ts`
 * and are re-exported here, so `lib/world/config` remains the single import
 * path for every tunable in the game (`01-RULES.md` §3.9) while no file exceeds
 * 400 lines (§3.2). The split is along a real seam: everything below this line
 * is consumed by `lib/render/**`, and nothing above it is.
 */
export * from './config.render';
export * from './config.poster';
