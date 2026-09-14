/**
 * The boundary between Postgres and the world.
 *
 * `world_bootstrap()` returns one `jsonb` blob and this turns it into a
 * `WorldPayload`. Every field is checked and every missing field has a default,
 * because the alternative is a `NaN` island: a bad `rankTier` does not throw at
 * the boundary, it produces a world of radius `NaN` twenty frames later, and by
 * then nothing points at the cause.
 *
 * **The world reads this and never writes it** (`15-DATA-MODEL.md` §1).
 * `mundo_state` belongs to Postgres, which recomputes it whenever a real
 * action is verified in the app. Nothing here sends anything back — and
 * nothing here names the functions that do, because `no-xp.test.ts` greps this
 * directory for them and a grep cannot tell a comment from a call. That the
 * guard is dumb is the point.
 */
// Relative, not `@/lib/mundo`: the test build compiles to plain CommonJS and
// nothing resolves the path alias at runtime.
import { parseMundoState } from '../mundo';
// One implementation of the queue, shared with the ceremony that drains it.
import { pendingCeremonies as pendingFrom } from './ceremony';
import type { RawMarker } from './markers';
import { MAX_TIER, MIN_TIER, PROP_IDS } from './progression';
import { REGION_IDS, TIME_OF_DAY_IDS } from './types';
import type {
  ImpactTotals, JournalEntry, Placement, PropId, RegionId, SpeciesId, TimeOfDay,
  WorldDailyState, WorldLayout, WorldPayload,
} from './types';

type Json = Record<string, unknown>;

/**
 * A timestamp as epoch ms, or 0.
 *
 * Zero means "the server did not say", and every consumer reads that as
 * "nothing has happened yet" rather than as 1970 — which would make a
 * brand-new island look fifty years matured.
 */
/**
 * One project marker from `world_project_markers`.
 *
 * A marker with no title is not a memory, so it is dropped rather than shown
 * as a blank stone. The place is genuinely optional — a project can have no
 * neighbourhood and no city — and the copy has a variant for that.
 */
function rawMarker(v: unknown): RawMarker | null {
  if (!isObject(v)) return null;
  const title = str(v.title, '');
  const id = str(v.id, '');
  if (!title || !id) return null;
  return {
    id,
    title,
    place: typeof v.place === 'string' && v.place.trim() !== '' ? v.place : null,
    date: str(v.date, ''),
  };
}

function epochMs(v: unknown): number {
  if (typeof v !== 'string') return 0;
  const t = Date.parse(v);
  return Number.isFinite(t) ? t : 0;
}

const isObject = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v);
const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

/** A finite number, or the fallback. `NaN` and `Infinity` are not numbers here. */
function num(v: unknown, fallback: number): number {
  const n = typeof v === 'string' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : fallback;
}

function int(v: unknown, fallback: number): number {
  return Math.trunc(num(v, fallback));
}

function str(v: unknown, fallback: string): string {
  return typeof v === 'string' && v.length > 0 ? v : fallback;
}

function bool(v: unknown): boolean {
  return v === true;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/** Only the nine real regions. Anything else is data we do not understand. */
function region(v: unknown): RegionId | null {
  return typeof v === 'string' && (REGION_IDS as readonly string[]).includes(v) ? (v as RegionId) : null;
}

function prop(v: unknown): PropId | null {
  return typeof v === 'string' && (PROP_IDS as readonly string[]).includes(v) ? (v as PropId) : null;
}

function timeOfDay(v: unknown): TimeOfDay {
  return typeof v === 'string' && (TIME_OF_DAY_IDS as readonly string[]).includes(v)
    ? (v as TimeOfDay)
    : 'dia';
}

/**
 * A placement is dropped, not repaired, when its prop or region is unknown.
 *
 * The server already validated it; if something arrives that this build does
 * not recognise, the honest reading is that the client is older than the data,
 * and guessing a region would move somebody's bench.
 */
function placement(v: unknown): Placement | null {
  if (!isObject(v)) return null;
  const slug = prop(v.prop_slug);
  const where = region(v.region);
  if (!slug || !where) return null;
  return {
    id: typeof v.id === 'string' ? v.id : undefined,
    prop_slug: slug,
    region: where,
    x: num(v.x, 0),
    z: num(v.z, 0),
    rot_y: num(v.rot_y, 0),
    variant: int(v.variant, 0),
  };
}

function journalEntry(v: unknown): JournalEntry | null {
  if (!isObject(v)) return null;
  const where = region(v.region);
  if (typeof v.species_slug !== 'string' || !where) return null;
  return {
    species_slug: v.species_slug as SpeciesId,
    first_seen_at: str(v.first_seen_at, ''),
    region: where,
    time_of_day: timeOfDay(v.time_of_day),
    count: Math.max(1, int(v.count, 1)),
  };
}

function impact(v: unknown): ImpactTotals {
  const o = isObject(v) ? v : {};
  return {
    water_l: Math.max(0, num(o.water_l, 0)),
    co2_kg: Math.max(0, num(o.co2_kg, 0)),
    waste_kg: Math.max(0, num(o.waste_kg, 0)),
    energy_kwh: Math.max(0, num(o.energy_kwh, 0)),
    actions: Math.max(0, int(o.actions, 0)),
  };
}

function dailyState(v: unknown): WorldDailyState {
  const o = isObject(v) ? v : {};
  return {
    chores_done: Math.max(0, int(o.chores_done, 0)),
    forage_done: Math.max(0, int(o.forage_done, 0)),
    event_done: bool(o.event_done),
    event_slug: typeof o.event_slug === 'string' ? o.event_slug : null,
    semillas_awarded: Math.max(0, int(o.semillas_awarded, 0)),
  };
}

function layout(v: unknown): WorldLayout | null {
  if (!isObject(v) || typeof v.name !== 'string') return null;
  return {
    name: v.name,
    placements: asArray(v.placements).map(placement).filter((p): p is Placement => p !== null),
    saved_at: typeof v.saved_at === 'string' ? v.saved_at : undefined,
  };
}

/**
 * Turn `world_bootstrap()`'s blob into a payload the world can build from.
 *
 * `fallbackUserId` is the signed-in id the server already knows. It is used
 * when the RPC's own `userId` is missing, so a world is never built for the
 * empty string — the seed comes from the id, and a wrong id is a wrong island.
 */
export function parseWorldPayload(raw: unknown, fallbackUserId: string): WorldPayload {
  const o = isObject(raw) ? raw : {};
  const mundo = parseMundoState(o.mundo);
  const world = isObject(o.world) ? o.world : {};

  // **The seed comes pre-reduced, and that matters.**
  //
  // `user_world.seed` is 60 bits. A JavaScript number holds 53, so reading the
  // raw value and taking its low 32 bits keeps exactly the seven that rounding
  // destroyed — every island would have had 25 useful bits of seed and no way
  // to notice. `world_bootstrap` now sends a top-level `seed` already reduced
  // in Postgres, where the precision still exists. The raw one is still inside
  // `world` for anything that wants it in its original form.
  const seed = (int(o.seed, int(world.seed, 0)) >>> 0);

  const tier = clamp(int(mundo.rankTier, MIN_TIER), MIN_TIER, MAX_TIER);
  const celebratedTier = clamp(int(world.celebrated_tier, 0), 0, MAX_TIER);

  return {
    userId: str(o.userId, fallbackUserId),
    seed,
    tier,
    worldIndex: Math.max(1, int(mundo.worldIndex, 1)),
    worldGrowth: Math.max(0, int(mundo.worldGrowth, 0)),
    worldGoal: Math.max(1, int(mundo.worldGoal, 1)),
    liveliness: clamp(num(mundo.liveliness, 0.5), 0, 1),
    palette: str(mundo.palette, 'default'),
    dominantDomain: typeof mundo.dominantDomain === 'string' ? mundo.dominantDomain : null,
    pip: isObject(o.pip) ? (o.pip as WorldPayload['pip']) : {},
    ownedCosmetics: asArray(o.ownedCosmetics).filter((s): s is string => typeof s === 'string'),
    semillas: Math.max(0, int(o.semillas, 0)),
    impact: impact(o.impact),
    // The collective counter is its own RPC; the bootstrap does not carry it.
    collectiveWaterL: Math.max(0, num(o.collectiveWaterL, 0)),
    placements: asArray(o.placements).map(placement).filter((p): p is Placement => p !== null),
    journal: asArray(o.journal).map(journalEntry).filter((j): j is JournalEntry => j !== null),
    dailyState: dailyState(o.dailyState),
    layouts: asArray(world.layouts).map(layout).filter((l): l is WorldLayout => l !== null),
    // Trust the server's list when it sends one, and derive it otherwise, so a
    // ceremony is never silently lost to a payload shape change.
    pendingCeremonies: asArray(o.pendingCeremonies).length > 0
      ? asArray(o.pendingCeremonies).map((t) => int(t, 0)).filter((t) => t > 0)
      : pendingFrom(celebratedTier, tier),
    createdAt: epochMs(world.created_at),
    onboardedAt: epochMs(world.onboarded_at),
    celebratedTier,
    celebratedWorld: Math.max(0, int(world.celebrated_world, 0)),
    snapshotUrl: typeof world.last_snapshot_url === 'string' ? world.last_snapshot_url : null,
    // Phase 5 fills these; the shape exists now so nothing has to change later.
    projectMarkers: asArray(o.projectMarkers).map(rawMarker).filter((m): m is RawMarker => m !== null),
    // Overdue Academia reviews, which manifest as wilting plants
    // (`12-LEARNING.md` §3.3). Zero until the bootstrap supplies it.
    dueReviews: Math.max(0, int(o.dueReviews, 0)),
  };
}


