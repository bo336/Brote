/**
 * Events and ceremonies — the two kinds of bounded, scripted moment.
 *
 * Split out of `config.ts` when it crossed the 400-line rule (`01-RULES.md`
 * §2). Same rule as always: every magic number in the world lives in one of
 * these files and nowhere else. `config.ts` re-exports all of it, so nothing
 * that already imported from there had to change.
 */
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
  /** Beat 1 of the world completion. OURS: a smaller moment, a shorter lift. */
  worldCameraS: 0.8,
  /** Its title card, inside the 8 s. OURS. */
  worldTitleS: 2.4,
} as const;

/**
 * Beat 3, per arrival, inside the 8-15 s window above. OURS: the spec gives the
 * window, not the split. Longer for the events that travel across the island
 * (the river cutting it, the mountain rising), shorter for the ones that happen
 * in one place you are already standing in.
 */
export const CEREMONY_ARRIVAL_S = {
  flores: 9,
  arbol: 11,
  rio: 14,
  monte: 13,
  nieve: 10,
  islote: 12,
} as const;
