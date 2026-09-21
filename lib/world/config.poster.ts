/**
 * El póster — the still image every other screen in the app shows instead of a
 * second WebGL context (`07-RENDER-ARCHITECTURE.md` §1). Split out of
 * `config.render.ts` for the 400-line rule; **import it through `./config`**.
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
   * camera to settle in behind Pip and the world to finish building; short
   * enough that a player who bounces straight back out still gets one. OURS.
   */
  settleS: 4,
  /** The most posters one visit may upload. A souvenir, not a stream. */
  maxPerVisit: 2,
  /**
   * The poster's own framing: a little higher and farther than play, so the card
   * shows the island around Pip rather than the back of his head. The yaw is
   * whatever the player was looking at.
   */
  distanceM: 8.5,
  pitchDeg: 26, // degrees above Pip, looking down
  lookHeightM: 0.7, // what the lens centres on, above Pip's feet
  portraitDistanceScale: 1.35, // a phone's tall frame is cropped to a wide card: step back
  clearanceM: 0.8, // never lower than this above the ground under the lens
  /**
   * A frame this dark is not a picture of an island. The first posters were
   * black — read from a buffer the browser had already cleared — and a black
   * card is worse than the drawn fallback. Mean luma, 0-255.
   */
  minLuma: 14,
  /**
   * The card is wide; a phone's frame is tall, and cropped into the card it kept
   * a thin strip of path around Pip. Below this aspect the poster is drawn as its
   * own wide band through a lens of `bandAspect`, instead of cropped from the screen.
   */
  bandBelowAspect: 1.2,
  bandAspect: 2,
  // …drawn at this pixel ratio at least: a phone at T1 draws at 1, and a 390 px band
  // blown up to a card on a 3x screen was soft.
  bandPixelRatio: 2.5,
  retryS: 2, // a blank frame is tried again this much later…
  maxTries: 3, // …this many times
} as const;
