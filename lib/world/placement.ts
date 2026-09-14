/**
 * Placing things on the island.
 *
 * `08-WORLD-AND-PROGRESSION.md` §8 calls this "the single largest hours-sink in
 * the game", and it costs no content pipeline per hour — which is exactly why
 * it deserves a real editing model rather than a drop-and-hope.
 *
 * Everything here is pure so the rules can be tested: the cap, the 15° snap,
 * the soft nudge, and a validity check that mirrors `world_placements_reason`
 * statement for statement. **The server is still the authority.** This exists
 * so the UI can refuse gently — a nudge, a greyed button — instead of letting
 * somebody arrange a bench for ten seconds and then watching the save bounce.
 */
import { PLACEMENT, placementCap } from './config';
import { islandRadius, tierForRegion } from './progression';
import type { Placement, PropId, RegionId } from './types';

/** Why a placement was refused. The same vocabulary the RPC returns. */
export type PlaceRejection =
  | 'over_cap'
  | 'region_locked'
  | 'off_island'
  | 'not_owned'
  | 'no_ground';

/**
 * How many snap positions there are in a turn.
 *
 * The snap works on this **integer index**, not on the angle. Rounding the
 * angle and multiplying back gives a value that is a bit or two off the one it
 * started from, so re-snapping a saved rotation returns something fractionally
 * different — a bench that turns 1e-15 radians every time the island loads.
 * Nobody would see it, but "the saved value comes back as itself" is the kind
 * of property that is free to hold and annoying to debug once it does not.
 */
const STEPS = Math.round(360 / PLACEMENT.rotationStepDeg);
const FULL_TURN = Math.PI * 2;

/**
 * Free rotation, snapped to 15°.
 *
 * Free enough that a bench can face the water, coarse enough that two benches
 * placed a minute apart look deliberately parallel rather than nearly parallel.
 */
export function snapRotation(radians: number): number {
  const index = Math.round((radians / FULL_TURN) * STEPS);
  const wrapped = ((index % STEPS) + STEPS) % STEPS;
  return (wrapped * FULL_TURN) / STEPS;
}

/** How many more props this tier may place. */
export function remainingSlots(tier: number, placed: number): number {
  return Math.max(0, placementCap(tier) - placed);
}

/**
 * Push a placement clear of anything it overlaps.
 *
 * **Overlap is refused with a nudge, never an error message** (§8). The prop
 * slides out along the line away from whatever it hit, which reads as the world
 * making room rather than as the game saying no. It gives up after a few tries
 * rather than looping: in a corner surrounded by props there may be nowhere to
 * go, and at that point the honest answer is that this spot is taken.
 */
export function nudgeClear(
  x: number,
  z: number,
  radius: number,
  others: readonly { x: number; z: number; radius: number }[],
  tries = 4,
): { x: number; z: number; moved: boolean } | null {
  let px = x;
  let pz = z;
  let moved = false;

  for (let attempt = 0; attempt <= tries; attempt++) {
    const hit = others.find((o) => {
      const dx = px - o.x;
      const dz = pz - o.z;
      const min = radius + o.radius;
      return dx * dx + dz * dz < min * min;
    });
    if (!hit) return { x: px, z: pz, moved };

    const dx = px - hit.x;
    const dz = pz - hit.z;
    const d = Math.hypot(dx, dz);
    // Dead centre on top of another prop has no "away" — pick one, so the
    // nudge is deterministic rather than NaN.
    const ux = d < 0.0001 ? 1 : dx / d;
    const uz = d < 0.0001 ? 0 : dz / d;
    const need = radius + hit.radius - d + PLACEMENT.nudgeM;
    px += ux * need;
    pz += uz * need;
    moved = true;
  }
  return null;
}

/**
 * Is this one placement legal? Mirrors the server's checks, in the same order,
 * so the reason the UI shows is the reason the RPC would have given.
 */
export function checkPlacement(
  placement: Pick<Placement, 'prop_slug' | 'region' | 'x' | 'z'>,
  ctx: {
    tier: number;
    owned: readonly string[];
    placedCount: number;
    /** Whether the ground there can hold something. The renderer knows. */
    isGround?: (x: number, z: number) => boolean;
  },
): PlaceRejection | null {
  if (ctx.placedCount >= placementCap(ctx.tier)) return 'over_cap';
  if (!ctx.owned.includes(placement.prop_slug)) return 'not_owned';
  if (tierForRegion(placement.region) > ctx.tier) return 'region_locked';
  if (Math.hypot(placement.x, placement.z) > islandRadius(ctx.tier)) return 'off_island';
  if (ctx.isGround && !ctx.isGround(placement.x, placement.z)) return 'no_ground';
  return null;
}

/**
 * Check a whole batch before sending it.
 *
 * The RPC rejects the whole batch on any failure, so the client should never
 * send one it already knows is bad: a refused save with no local explanation is
 * how somebody loses ten minutes of arranging.
 */
export function checkBatch(
  placements: readonly Placement[],
  ctx: { tier: number; owned: readonly string[] },
): PlaceRejection | null {
  if (placements.length > placementCap(ctx.tier)) return 'over_cap';
  for (let i = 0; i < placements.length; i++) {
    const reason = checkPlacement(placements[i]!, {
      tier: ctx.tier,
      owned: ctx.owned,
      // The cap was checked against the whole batch above; per item, only the
      // items before it count, or the last one would always look over.
      placedCount: i,
    });
    if (reason) return reason;
  }
  return null;
}

/** Which region a point falls in, for the region a placement records. */
/**
 * Which placed prop is under this point, or -1.
 *
 * Nearest centre wins, so two things whose footprints overlap after a nudge
 * still resolve to exactly one — and the test is against a slightly generous
 * radius, because a finger on a phone is wider than a bench.
 */
export function propAt(
  x: number,
  z: number,
  placements: readonly Placement[],
  footprintOf: (slug: PropId) => number,
): number {
  let best = -1;
  let bestD = Infinity;
  for (let i = 0; i < placements.length; i++) {
    const p = placements[i]!;
    const reach = footprintOf(p.prop_slug) * PLACEMENT.pickUpReachScale;
    const d = (x - p.x) * (x - p.x) + (z - p.z) * (z - p.z);
    if (d < reach * reach && d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

export function regionOf(
  x: number,
  z: number,
  regions: readonly { id: RegionId; x: number; z: number; unlocked: boolean }[],
): RegionId {
  let best: RegionId = 'claro';
  let bestD = Infinity;
  for (const r of regions) {
    if (!r.unlocked) continue;
    const d = (x - r.x) ** 2 + (z - r.z) ** 2;
    if (d < bestD) {
      bestD = d;
      best = r.id;
    }
  }
  return best;
}

/** The props this tier has unlocked *and* the player owns, in ladder order. */
export function placeableProps(owned: readonly string[], unlocked: readonly PropId[]): PropId[] {
  return unlocked.filter((slug) => owned.includes(slug));
}
