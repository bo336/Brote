/**
 * The impact mirror's numbers (`13-IMPACT-MIRROR.md`).
 *
 * Split out of `config.ts` for the 400-line rule (`01-RULES.md` §3.2), on the
 * seam the file already had: everything here is about turning what somebody
 * actually did into what their island looks like, and none of it is read by
 * anything that does not care about impact.
 *
 * `config.ts` re-exports all of it, so no caller has to know it moved.
 */

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
  // **The dirty end of the air is hazy, not a whiteout.**
  //
  // `13-IMPACT-MIRROR.md` §2 is explicit that the debris field on the beach is
  // "the one place the world begins in a worse state". Fog at density 1.0 and a
  // 45 m far plane was a second one, and a louder one: with the camera seven
  // metres out, everything past the next rise washed to flat cream. A brand-new
  // player — and, until phase 4 wires the real totals, *every* player — saw the
  // ugliest frame the renderer can produce. The mirror still more than halves
  // the haze and nearly doubles the view; it just no longer starts by hiding
  // the world it is meant to be showing off.
  fogDensity: [0.55, 0.15], // inverse: more impact, less haze
  fogFar: [70, 130], // metres — clean air is literally how far you can see
  skySaturation: [0.85, 1.0],
  debrisCount: [40, 0], // instances; only ever shrinks, never added to
  compostScale: [0.2, 1.0],
  lanternCount: [0, 14], // instances lit at night
  fireflyCount: [0, 30],
  auroraIntensity: [0.0, 1.0], // tier 10+
  windmillRPM: [2, 14], // `mundo_molino` promises it turns faster when it blows
} as const;

/**
 * El Mojón — the one place a number appears in the world (`13` §3).
 */
export const MOJON = {
  /**
   * How wide an `estimado` band is, either side of the figure.
   *
   * An estimate that shows a decimal is claiming a precision it does not have.
   * A quarter either way is honest about a modelled proxy and still narrow
   * enough to mean something.
   */
  estimateSpread: 0.25,
  /**
   * The coefficient set these figures were computed with.
   *
   * Argentine grid factors change, and a number computed with last year's
   * factor is not wrong — it is from last year. The panel says which one it
   * used so that "¿Cómo lo calculamos?" has something to answer with.
   */
  coefficientVersion: '2026.1',
} as const;

/**
 * Where each impact channel's number comes from (`13` §3).
 *
 * All four are `medido` today: `brote_user_impact` sums per-activity
 * coefficients, and there is no modelled proxy in the schema to label
 * otherwise. This is a table rather than a constant so that adding one later is
 * a data change; what it must never become is a decorative `estimado` on a
 * figure that was actually measured.
 */
export const IMPACT_PROVENANCE: Record<
  'water' | 'co2' | 'waste' | 'energy',
  'medido' | 'estimado'
> = {
  water: 'medido',
  co2: 'medido',
  waste: 'medido',
  energy: 'medido',
};
