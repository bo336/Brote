/**
 * Where the day's three chores actually happen.
 *
 * `chores.ts` decides *which* three (deterministically, from the day and the
 * player); this decides *where*, and the two are separate because the draw has
 * to agree with the server and the placement only has to agree with the island.
 *
 * **A chore is a place, not a list entry.** `16-UI-AUDIO-A11Y.md` §1 bans quest
 * lists from the HUD, and §3.4 calls caretaking "the backbone of the 90-second
 * session" — so a chore is something you walk past and notice, in the region it
 * belongs to, with the ordinary action button. The Bitácora is where you can
 * check what today's three were if you want to; it is not where you do them.
 */
import { CHORES_BY_ID, choreAvailable, choresForDay, type ChoreDef } from './chores';
import { INTERACT } from './config';
import { hashInt, mulberry32 } from './rng';
import { regionCentre, regionRadius } from './regions';
import type { ChoreId, Placement, RegionId } from './types';

/** How many offsets to try before falling back to the region's centre. */
const GROUND_TRIES = 8;

export interface ChoreSpot {
  id: ChoreId;
  def: ChoreDef;
  /** World metres. `y` is the caller's to sample — this module has no terrain. */
  x: number;
  z: number;
  radius: number;
  region: RegionId;
  /** Already done today. Still shown, greyed: a finished chore is a small win. */
  done: boolean;
}

/**
 * Today's three, placed.
 *
 * A chore that needs a prop happens **at that prop**, because "llenar el
 * comedero" anywhere else is nonsense. Everything else lands at a stable
 * offset inside its region, drawn from the same day seed — so it is in the same
 * spot all day on every device, and walking back to where you saw it works.
 */
export function choreSpotsFor({
  userId,
  localDate,
  unlockedRegions,
  placements,
  choresDone,
  anchors = [],
  isGround,
}: {
  userId: string;
  /** The BA-local `YYYY-MM-DD` the server computes. Never derived here. */
  localDate: string;
  unlockedRegions: readonly RegionId[];
  placements: readonly Placement[];
  /** How many of today's three are already done, from `world_daily`. */
  choresDone: number;
  /**
   * Can somebody stand here? The renderer's own test.
   *
   * Without it a region's offset can land in the lagoon or off the shelf — the
   * first run put "ajustar la soga del puente" at y = -0.56, underwater, which
   * is a chore nobody can reach and no message explains.
   */
  isGround?: (x: number, z: number) => boolean;
  /** The island's own anchors, for the chores that name a thing. */
  anchors?: readonly { feature: string; x: number; z: number }[];
}): ChoreSpot[] {
  const placed = placements.map((p) => p.prop_slug);
  const ids = choresForDay(userId, localDate);
  const spots: ChoreSpot[] = [];

  ids.forEach((id, index) => {
    const def = CHORES_BY_ID.get(id);
    if (!def) return;
    // A chore whose region is still behind the mist, or whose prop is not
    // placed, is simply not there. Never shown as a failure, never as a nag.
    if (!choreAvailable(def, unlockedRegions, placed)) return;

    const region: RegionId = def.region ?? 'claro';
    let x: number;
    let z: number;

    const prop = def.requiresProp
      ? placements.find((p) => p.prop_slug === def.requiresProp)
      : undefined;
    const anchor = def.anchor ? anchors.find((a) => a.feature === def.anchor) : undefined;
    if (prop) {
      x = prop.x;
      z = prop.z;
    } else if (anchor) {
      x = anchor.x;
      z = anchor.z;
    } else {
      const [cx, cz] = regionCentre(region);
      // Stable per day, per chore: the same seed gives the same spot, so the
      // chore does not wander while somebody is walking toward it.
      const rng = mulberry32(hashInt(`chore:${userId}:${localDate}:${id}`));
      let found = false;
      x = cx;
      z = cz;
      // A handful of tries from the same seeded stream, then the centre. Still
      // deterministic — the sequence is fixed, so the accepted candidate is the
      // same one on every device.
      for (let attempt = 0; attempt < GROUND_TRIES; attempt++) {
        const angle = rng() * Math.PI * 2;
        const reach = regionRadius(region) * (0.35 + rng() * 0.4);
        const tx = cx + Math.cos(angle) * reach;
        const tz = cz + Math.sin(angle) * reach;
        if (!isGround || isGround(tx, tz)) {
          x = tx;
          z = tz;
          found = true;
          break;
        }
      }
      // **Nowhere to stand means no chore.** Falling back to the region centre
      // is how "ajustar la soga del puente" ended up in the middle of the
      // lagoon; a chore that cannot be reached is worse than one not offered,
      // and `choreAvailable` already establishes that absent is the answer.
      if (isGround && !found) return;
    }

    spots.push({
      id,
      def,
      x,
      z,
      radius: INTERACT.defaultRadiusM,
      region,
      // The server counts chores, not which ones, so the first `choresDone`
      // of the day's list read as finished. Order is the draw's order, which
      // is stable — so a completed chore stays completed on a reload.
      done: index < choresDone,
    });
  });

  return spots;
}

/** How many of today's three are left. Counted up in copy, never down. */
export function choresRemaining(spots: readonly ChoreSpot[]): number {
  return spots.filter((s) => !s.done).length;
}
