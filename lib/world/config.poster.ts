/**
 * The poster's constants, out of `config.render.ts` for the 400-line rule.
 * `config.ts` re-exports them: it is still the one door to every tunable.
 */
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
  /**
   * The card is wide (Hoy and Perfil show it ~2:1), so the poster is drawn as a
   * wide band of its own rather than cropped out of a portrait phone frame —
   * which was a thin strip of path. OURS.
   */
  aspect: 2,
  /** Output width in pixels. Enough for a 2× phone card, small enough to upload on data. */
  width: 1200,
  /** Where the lens goes for the picture: behind Pip, higher and farther than play. OURS. */
  backM: 5.6,
  upM: 2.3,
  lookUpM: 1.1,
  /** The lens looks this far past Pip, so the picture is the island with Pip in it. */
  lookAheadM: 5,
  fovDeg: 50,
  /**
   * A frame whose mean brightness (0..255) is under this, or whose spread is
   * under `minSpread`, is not a picture of an island — it is a cleared buffer —
   * and is never uploaded. Tried again `retryS` later, at most `maxTries` times.
   */
  minMean: 18,
  minSpread: 10,
  retryS: 1.5,
  maxTries: 4,
} as const;
