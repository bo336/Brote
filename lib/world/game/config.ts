/**
 * Every number the game plays by, in one place (`01-RULES.md` §3.9).
 *
 * The balance targets live in `docs/MUNDO_JUEGO.md` §3.2 and the simulation in
 * `__tests__/game-sim.test.ts` checks them: thirty minutes a day never runs
 * dry, never finishes everything, and always moves something visible.
 */

export const PARCEL = {
  /** Grid spacing of the parcel seeds, metres. One parcel is roughly this wide. */
  spacingM: 9,
  /** How far a seed may wander from its grid point, as a fraction of the spacing. */
  jitter: 0.34,
  /** The grid reaches this far from the centre in each axis — enough for El Islote. */
  extentM: 86,
  /** Organic edges: how much noise bends the border between two parcels, metres. */
  edgeNoiseM: 1.6,
  /** Litter pieces a wild parcel starts with: base + one more from this region tier on. */
  litterBase: 3,
  litterExtraFromTier: 6,
  /** Chance a wild parcel also has an invasive plant to pull. */
  invasiveChance: 0.55,
  /** Compost (or stone, on the mountain) to go from limpia to suelo vivo. */
  soilBase: 3,
  soilPerTiers: 3,
  /** Seedlings to plant it. */
  plantBase: 3,
  plantPerTiers: 4,
  /** To flourish: this many distinct species planted, plus one fitting habitat item… */
  flourishSpecies: 3,
  /** …after it has been alive this many days. A meadow is not a meadow the day it greens. */
  flourishAfterDays: 3,
  /**
   * Frutos a ripe parcel gives: viva, floreciente, and one more from two stars.
   * A parcel is ripe every other day (its own rhythm), so harvesting is a walk
   * through what is ready, not a chore over everything you own.
   */
  fruitViva: 1,
  fruitFlor: 1,
  fruitStars: 2,
  /** A harvest also drops organics now and then. */
  harvestLeaves: 1,
} as const;

export const SPAWNS = {
  /** Litter the sea brings each day, spread along the beach. */
  beachLitter: 11,
  /** Organic piles (leaves, pruned grass) per day, near plants and trees. */
  leafPiles: 7,
  /** Organics a pile gives. */
  leavesPerPile: 2,
  /** Fallen dry branches per day. */
  branches: 8,
  /** Loose stones per day, on rocky ground and paths. */
  stones: 7,
  /** Nothing spawns closer than this to another spawn. */
  minSpacingM: 1.4,
} as const;

export const SEMILLAS = {
  /** A new game starts with a little, so the Tienda means something on day one. */
  start: 30,
  /**
   * The most one save may add in a local day. The server enforces the same
   * number (`world_game_save`), so a tampered save buys a nicer island for one
   * afternoon, never an economy.
   */
  dailyCap: 400,
  /** Per stage a parcel reaches: limpia, suelo vivo, plantada, viva, floreciente. */
  stage: [0, 2, 2, 3, 8, 15],
  /** Harvesting pays in fruit, not semillas: fruit is what the vivero runs on. */
  harvest: 0,
  /** A daily mission, and all three. */
  daily: 12,
  dailyBonus: 30,
  /** Logging a species in the Bitácora for the first time. */
  census: 5,
  /** Pulling an invasive. */
  pull: 2,
  /**
   * What Don Beto pays for surplus raw material, per piece. Low on purpose:
   * it is the valve that keeps a full backpack from ever being a dead end,
   * not a way to farm semillas. Litter cannot be sold — it gets sorted.
   */
  sell: { hojas: 0.25, ramas: 0.5, piedras: 0.5, frutos: 0.5 },
} as const;

export const GAME = {
  /** Autosave debounce, and the longest a change may wait before it is sent. */
  saveDebounceMs: 3000,
  saveMaxWaitMs: 15000,
  /** How close to a pad you have to stand for materials to fly onto it. */
  padRadiusM: 1.6,
  /** One piece every this often while standing on a pad. */
  padDropMs: 90,
  /** Below this speed (m/s) Pip counts as stopped on a pad, and the drain starts. */
  padStillSpeed: 0.5,
  /** Starting kit: enough to learn every verb in the first minutes. */
  startBag: { ramas: 0, piedras: 0, hojas: 0, frutos: 0, compost: 0, reciclado: 0 },
  startAgua: 0,
} as const;
