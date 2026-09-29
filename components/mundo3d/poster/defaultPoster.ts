/**
 * A real capture of the game, for a player who has no poster of their own yet.
 *
 * Shot from the game itself in headless Chrome (the same renderer, the same
 * light), one per stage of the island, and committed under `public/mundo/`.
 * The card shows the nearest stage at or below the player's level, so what they
 * see is what they will walk into — not a drawing of an island nobody owns.
 */
const STAGES = [1, 3, 5, 7, 9, 11] as const;

export function defaultPosterFor(tier: number): string {
  let pick: number = STAGES[0];
  for (const s of STAGES) if (tier >= s) pick = s;
  return `/mundo/poster-t${pick}.jpg`;
}
