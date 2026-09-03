/**
 * Placement validation and serialisation.
 *
 * The checks here are **the same checks `world_save_placements` runs**
 * (`15-DATA-MODEL.md` §4), so the client can pre-check and give instant feedback
 * — a soft nudge rather than a round trip and an error message. The server still
 * validates: this is a mirror, never a substitute.
 */
import { PLACEMENT, placementCap } from './config';
import { isPlantable, type WorldLayout } from './terrain';
import type { Placement, RegionId, WorldConfig } from './types';

/** Why a placement was refused. The UI maps these to copy; it never invents any. */
export type PlacementRejection =
  | 'not_owned' // the prop is not in `user_cosmetics`
  | 'region_locked' // that region is still behind the mist wall
  | 'over_cap' // 4 + tier × 3 placed props already
  | 'off_island' // outside `islandRadius(tier)`
  | 'not_plantable' // in the water, on a cliff, or on the shoreline margin
  | 'overlaps'; // inside another prop's footprint

export type PlacementResult = { ok: true } | { ok: false; reason: PlacementRejection };

const OK: PlacementResult = { ok: true };

export interface ValidateOptions {
  /** How many props are already placed, excluding the one being validated. */
  existingCount?: number;
  /** Other placements, for the footprint test. */
  others?: readonly Placement[];
  /** Pass the terrain layout to also check the ground. The RPC cannot. */
  terrain?: WorldLayout;
}

/**
 * One placement, against the world the player actually has. Order matters: the
 * cheapest and most explicable failure is reported first, because that is the
 * one worth telling the player about.
 */
export function validatePlacement(
  p: Placement,
  cfg: WorldConfig,
  owned: readonly string[],
  opts: ValidateOptions = {},
): PlacementResult {
  if (!owned.includes(p.prop_slug)) return { ok: false, reason: 'not_owned' };
  if (!cfg.regions.includes(p.region)) return { ok: false, reason: 'region_locked' };
  if ((opts.existingCount ?? 0) >= placementCap(cfg.tier)) return { ok: false, reason: 'over_cap' };

  if (!Number.isFinite(p.x) || !Number.isFinite(p.z)) return { ok: false, reason: 'off_island' };
  if (Math.hypot(p.x, p.z) > cfg.radius) return { ok: false, reason: 'off_island' };

  if (opts.terrain && !isPlantable(p.x, p.z, opts.terrain)) return { ok: false, reason: 'not_plantable' };

  if (opts.others) {
    const minSq = (PLACEMENT.defaultFootprintM * 2) ** 2;
    for (const o of opts.others) {
      if (o.id && o.id === p.id) continue;
      if ((o.x - p.x) ** 2 + (o.z - p.z) ** 2 < minSq) return { ok: false, reason: 'overlaps' };
    }
  }
  return OK;
}

/** A whole batch, the way the RPC sees it: any failure rejects the batch. */
export function validateBatch(
  placements: readonly Placement[],
  cfg: WorldConfig,
  owned: readonly string[],
  terrain?: WorldLayout,
): PlacementResult {
  if (placements.length > placementCap(cfg.tier)) return { ok: false, reason: 'over_cap' };
  for (let i = 0; i < placements.length; i++) {
    const r = validatePlacement(placements[i]!, cfg, owned, {
      existingCount: i,
      others: placements.slice(0, i),
      terrain,
    });
    if (!r.ok) return r;
  }
  return OK;
}

/** Snap a free rotation to the placement grid. Free rotation, in 15° steps. */
export function snapRotation(rotY: number): number {
  const step = (PLACEMENT.rotationStepDeg * Math.PI) / 180;
  return Math.round(rotY / step) * step;
}

// ── Wire format ─────────────────────────────────────────────────────────────

/** Coordinates go over the wire rounded — 1 mm is far below what anyone can see. */
function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

/** To the jsonb array `world_save_placements` expects. */
export function serializePlacements(placements: readonly Placement[]): unknown[] {
  return placements.map((p) => ({
    prop_slug: p.prop_slug,
    region: p.region,
    x: round3(p.x),
    z: round3(p.z),
    rot_y: round3(snapRotation(p.rot_y)),
    variant: Math.max(0, Math.floor(p.variant) || 0),
  }));
}

/**
 * From whatever the database returned. Defensive on every field: a placement
 * saved by an older `spec_version` must never crash the world, and a player's
 * placement is never deleted — the worst case is that it is dropped from this
 * render and re-snapped later (`15-DATA-MODEL.md` §8.2).
 */
export function deserializePlacements(raw: unknown): Placement[] {
  if (!Array.isArray(raw)) return [];
  const out: Placement[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const r = item as Record<string, unknown>;
    const slug = typeof r.prop_slug === 'string' ? r.prop_slug : null;
    const region = typeof r.region === 'string' ? (r.region as RegionId) : null;
    const x = Number(r.x);
    const z = Number(r.z);
    if (!slug || !region || !Number.isFinite(x) || !Number.isFinite(z)) continue;
    out.push({
      id: typeof r.id === 'string' ? r.id : undefined,
      prop_slug: slug,
      region,
      x,
      z,
      rot_y: Number.isFinite(Number(r.rot_y)) ? Number(r.rot_y) : 0,
      variant: Number.isFinite(Number(r.variant)) ? Math.floor(Number(r.variant)) : 0,
    });
  }
  return out;
}
