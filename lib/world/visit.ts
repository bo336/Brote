/**
 * Visiting somebody else's island.
 *
 * `18-DECISIONS.md` D8: the island is serialised as JSON and **the visitor's
 * own client renders it**. There is no second renderer, no authority problem
 * and no real-time anything — a visit is one `world_snapshot_for` call and then
 * the same world code, pointed at somebody else's seed.
 *
 * What a visitor may do is deliberately almost nothing (`11-GAME-LOOP.md` §8):
 * walk around, and leave **one of eight preset stickers** at a spot. No free
 * text, no impact figures, no census. That is not a stripped-down version of
 * the game — it is the whole moderation strategy. A world where the only thing
 * one player can send another is one of eight drawings has no abuse surface to
 * moderate, which is why the list is closed and lives here rather than in a
 * table somebody could add a row to.
 */
import { VISIT } from './config';
import type { WorldPayload } from './types';
import { REGION_IDS } from './types';
import type { PipCosmetics, Placement, RegionId } from './types';

/**
 * The eight. Ordered, and the order is the order they appear in the picker.
 *
 * Every one is a thing you would leave for somebody, and not one of them can be
 * read as a judgement — there is no thumbs-down, no clock, no question mark.
 * The copy for each lives at `mundo.visit.sticker.<id>`.
 */
export const STICKER_IDS = [
  'semilla', 'sol', 'agua', 'hoja', 'pajaro', 'estrella', 'corazon', 'mate',
] as const;

export type StickerId = (typeof STICKER_IDS)[number];

export interface Sticker {
  /** Who left it. Only ever used to say "vos" — no name is shown on an island. */
  byMe: boolean;
  sticker: StickerId;
  region: RegionId;
  x: number;
  z: number;
}

/** What a visited island is, once the RPC's blob has been checked. */
export interface VisitPayload {
  ok: boolean;
  /** `not_found` covers a block, a mute and a private profile alike. */
  reason: 'not_found' | 'no_world' | null;
  username: string;
  displayName: string;
  seed: number;
  tier: number;
  worldIndex: number;
  palette: string;
  pip: PipCosmetics;
  placements: Placement[];
  stickers: Sticker[];
  /** How many this visitor has left here today, against `VISIT.stickersPerDay`. */
  leftToday: number;
}

export function isStickerId(v: unknown): v is StickerId {
  return typeof v === 'string' && (STICKER_IDS as readonly string[]).includes(v);
}

/**
 * May this visitor leave another sticker here today?
 *
 * The rate limit is per host per day, and the server enforces the same number
 * — this is what makes the picker say so *before* the tap, rather than after a
 * round trip that failed.
 */
export function mayLeaveSticker(leftToday: number): boolean {
  return leftToday < VISIT.stickersPerDay;
}

/**
 * Where the sticker goes: **in front of the visitor, on the ground**, at a
 * fixed distance. Not under the cursor and not where they are standing — one
 * would need a raycast per frame and the other would bury it under their feet.
 */
export function stickerSpot(x: number, z: number, yaw: number): [number, number] {
  return [x + Math.sin(yaw) * VISIT.stickerAheadM, z + Math.cos(yaw) * VISIT.stickerAheadM];
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

function num(v: unknown, fallback: number): number {
  const n = typeof v === 'string' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : fallback;
}

function region(v: unknown): RegionId | null {
  return typeof v === 'string' && (REGION_IDS as readonly string[]).includes(v) ? (v as RegionId) : null;
}

function sticker(v: unknown): Sticker | null {
  if (!isObject(v)) return null;
  const where = region(v.region);
  if (!where || !isStickerId(v.sticker)) return null;
  return {
    byMe: v.by_me === true,
    sticker: v.sticker,
    region: where,
    x: num(v.x, 0),
    z: num(v.z, 0),
  };
}

function placement(v: unknown): Placement | null {
  if (!isObject(v)) return null;
  const where = region(v.region);
  if (typeof v.prop_slug !== 'string' || !where) return null;
  return {
    prop_slug: v.prop_slug as Placement['prop_slug'],
    region: where,
    x: num(v.x, 0),
    z: num(v.z, 0),
    rot_y: num(v.rot_y, 0),
    variant: Math.trunc(num(v.variant, 0)),
  };
}

/**
 * `world_snapshot_for`'s blob, checked.
 *
 * A refusal is a payload too: `ok: false` with a reason is what the page
 * renders, and it must never throw — the most likely reason to land here is a
 * username somebody typed wrong.
 *
 * **Nothing here reads an impact field, because the RPC does not send one.**
 * That is the point of D8: the figures are not hidden in the client, they never
 * leave Postgres.
 */
export function parseVisitPayload(raw: unknown, username: string): VisitPayload {
  const o = isObject(raw) ? raw : {};
  const empty: VisitPayload = {
    ok: false, reason: 'not_found', username, displayName: '', seed: 0, tier: 1,
    worldIndex: 1, palette: 'default', pip: {}, placements: [], stickers: [], leftToday: 0,
  };
  if (o.ok !== true) {
    return { ...empty, reason: o.reason === 'no_world' ? 'no_world' : 'not_found' };
  }
  return {
    ok: true,
    reason: null,
    username,
    displayName: typeof o.displayName === 'string' && o.displayName ? o.displayName : username,
    seed: Math.trunc(num(o.seed, 0)) >>> 0,
    tier: Math.min(11, Math.max(1, Math.trunc(num(o.tier, 1)))),
    worldIndex: Math.max(1, Math.trunc(num(o.worldIndex, 1))),
    palette: typeof o.palette === 'string' ? o.palette : 'default',
    pip: isObject(o.pipStyle) ? (o.pipStyle as PipCosmetics) : {},
    placements: (Array.isArray(o.placements) ? o.placements : [])
      .map(placement)
      .filter((p): p is Placement => p !== null),
    stickers: (Array.isArray(o.stickers) ? o.stickers : [])
      .map(sticker)
      .filter((s): s is Sticker => s !== null),
    leftToday: Math.max(0, Math.trunc(num(o.leftToday, 0))),
  };
}

export { VISIT };

/**
 * A visited island, in the shape the world already builds from.
 *
 * Every field the RPC does not send is its empty value, and that is the whole
 * privacy model made structural: there is no impact, no census, no balance and
 * no daily state here, because a visitor is never given any. Nothing had to be
 * hidden — it was never fetched.
 */
export function payloadForVisit(v: VisitPayload, myPip: unknown = null): WorldPayload {
  return {
    userId: v.username,
    seed: v.seed,
    tier: v.tier,
    worldIndex: v.worldIndex,
    worldGrowth: 0,
    worldGoal: 1,
    liveliness: 0.5,
    palette: v.palette,
    dominantDomain: null,
    pip: isObject(myPip) ? (myPip as PipCosmetics) : {},
    ownedCosmetics: [],
    semillas: 0,
    impact: { water_l: 0, co2_kg: 0, waste_kg: 0, energy_kwh: 0, actions: 0 },
    collectiveWaterL: 0,
    placements: v.placements,
    journal: [],
    dailyState: {
      chores_done: 0, forage_done: 0, event_done: false, event_slug: null, semillas_awarded: 0,
    },
    layouts: [],
    pendingCeremonies: [],
    createdAt: 0,
    onboardedAt: 1,
    celebratedTier: 0,
    celebratedWorld: 0,
    snapshotUrl: null,
    projectMarkers: [],
    dueReviews: 0,
  };
}
