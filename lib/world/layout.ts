/**
 * The island generator. Fully deterministic.
 *
 * `layout(userId, cfg)` produces a byte-identical island on every device and
 * every load. Seeded from `hash(userId)`, so *your* island differs from a
 * friend's in coastline wobble, tree positions and scatter — but the **region
 * structure and every unlock beat are identical for everyone**
 * (`08-WORLD-AND-PROGRESSION.md` §2). That is why the region table below is
 * constant and only the wobble and the scatter are seeded.
 *
 * `Math.random()` is banned here (`01-RULES.md` §3.11).
 */
import { LAYOUT, TERRAIN } from './config';
import { hashInt, mulberry32 } from './rng';
import { fbm, isPlantable, makeLayout, snapToLand, terrainHeight, type WorldLayout } from './terrain';
import type { FeatureId, RegionId, VerbId, WorldConfig } from './types';

/** Where a region sits, in fractions of the island radius. Constant for everyone. */
interface RegionSpec {
  /** Direction from the island centre, radians. */
  angle: number;
  /** Distance from centre as a fraction of R. */
  dist: number;
  /** Influence radius as a fraction of R. */
  radiusFrac: number;
}

const REGION_SPECS: Record<RegionId, RegionSpec> = {
  claro: { angle: 0, dist: 0, radiusFrac: LAYOUT.claroRadiusFrac }, // always the spawn
  pradera: { angle: 0.35, dist: 0.52, radiusFrac: LAYOUT.regionRadiusFrac },
  jardin: { angle: 2.05, dist: 0.5, radiusFrac: LAYOUT.regionRadiusFrac },
  arboleda: { angle: 3.6, dist: 0.55, radiusFrac: LAYOUT.regionRadiusFrac },
  rio: { angle: 1.15, dist: 0.66, radiusFrac: LAYOUT.regionRadiusFrac },
  monte: { angle: -1.75, dist: 0.6, radiusFrac: LAYOUT.regionRadiusFrac },
  cumbre: { angle: -1.75, dist: 0.72, radiusFrac: LAYOUT.regionRadiusFrac * 0.7 },
  islote: { angle: 0.9, dist: LAYOUT.isletDistanceFrac, radiusFrac: LAYOUT.regionRadiusFrac * 0.6 },
  monumento: { angle: -1.75, dist: 0.72, radiusFrac: LAYOUT.regionRadiusFrac * 0.35 },
};

export interface RegionAnchor {
  id: RegionId;
  x: number;
  z: number;
  radius: number;
  /** Locked regions are generated as a ghosted silhouette behind the mist wall. */
  unlocked: boolean;
}

export interface ScatterPoint {
  x: number;
  z: number;
  region: RegionId;
  /** 0..1, stable per point — drives species pick, scale jitter and tint. */
  roll: number;
}

export interface AnchorPoint {
  id: string;
  feature: FeatureId;
  x: number;
  z: number;
  /** Rotation in radians, so a bench faces the water rather than the bushes. */
  rotY: number;
}

export interface TraversalCache {
  x: number;
  z: number;
  region: RegionId;
  /** The verb that makes it reachable. Solvable only with the verbs you hold. */
  verb: VerbId;
}

export interface IslandLayout {
  seed: number;
  radius: number;
  /** The height-function layout — the one input `terrainHeight` takes. */
  terrain: WorldLayout;
  regions: RegionAnchor[];
  /** Rim radius per segment, `LAYOUT.coastlineSegments` long, starting at angle 0. */
  coastline: Float32Array;
  /** The river's centre line, or `null` before tier 7. */
  riverPath: [number, number][] | null;
  /** World Y above which snow lies, or `null` before tier 9. */
  snowLine: number | null;
  scatter: ScatterPoint[];
  anchors: AnchorPoint[];
  caches: TraversalCache[];
  spawn: [number, number];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/** A region's centre in world units. */
function regionCentre(id: RegionId, R: number): [number, number] {
  const spec = REGION_SPECS[id];
  return [Math.cos(spec.angle) * spec.dist * R, Math.sin(spec.angle) * spec.dist * R];
}

/** Which region a point belongs to — nearest unlocked anchor wins. */
export function regionAt(x: number, z: number, regions: readonly RegionAnchor[]): RegionId {
  let best: RegionId = 'claro';
  let bestD = Infinity;
  for (const r of regions) {
    if (!r.unlocked) continue;
    const d = (x - r.x) * (x - r.x) + (z - r.z) * (z - r.z);
    if (d < bestD) {
      bestD = d;
      best = r.id;
    }
  }
  return best;
}

/**
 * The coastline. A circle plus one headland, one bay and a seeded low-frequency
 * wobble — an irregular disc, never a perfect one.
 */
function buildCoastline(R: number, seed: number): Float32Array {
  const n = LAYOUT.coastlineSegments;
  const out = new Float32Array(n);
  const s = (seed % 1000) * 0.013;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const wob = (fbm(Math.cos(a) * LAYOUT.coastWobbleFreq + s, Math.sin(a) * LAYOUT.coastWobbleFreq - s, 2) - 0.5) * 2;
    // Angular distance to the headland and the bay, wrapped to [-π, π].
    const dh = Math.atan2(Math.sin(a - LAYOUT.headlandAngleRad), Math.cos(a - LAYOUT.headlandAngleRad));
    const db = Math.atan2(Math.sin(a - LAYOUT.bayAngleRad), Math.cos(a - LAYOUT.bayAngleRad));
    const head = Math.exp(-(dh * dh) * 6) * LAYOUT.headlandAmp;
    const bay = -Math.exp(-(db * db) * 8) * LAYOUT.bayAmp;
    out[i] = R * (1 + wob * LAYOUT.coastWobbleAmp + head + bay);
  }
  return out;
}

/** Build the height-function layout from the FEATURES the tier actually granted. */
function buildTerrainLayout(R: number, seed: number, features: readonly FeatureId[]): WorldLayout {
  const hasPond = features.includes('pond');
  const hasMountain = features.includes('mountain');
  // `makeLayout` gates its own content on a world index; feed it the index that
  // corresponds to what this tier unlocked, so the ported maths stays untouched.
  const index = hasMountain ? 6 : hasPond ? 2 : 1;
  const base = makeLayout(index, R, hasPond);
  base.seed = seed;
  if (!features.includes('river')) base.rivers = [];
  if (!hasMountain) base.mountains = [];
  return base;
}

/**
 * The scatter pool: a golden-angle spiral, snapped to plantable ground and
 * thinned by a minimum spacing. Quality tiers take a PREFIX of this pool, so
 * changing quality never moves a plant (`07-RENDER-ARCHITECTURE.md` §4.3).
 */
function buildScatter(terrain: WorldLayout, regions: RegionAnchor[], seed: number): ScatterPoint[] {
  const rng = mulberry32(seed ^ 0x5ca77e5);
  const out: ScatterPoint[] = [];
  const minSq = LAYOUT.scatterMinSpacingM * LAYOUT.scatterMinSpacingM;
  for (let i = 0; i < LAYOUT.scatterPoolMax * 3 && out.length < LAYOUT.scatterPoolMax; i++) {
    const a = i * LAYOUT.goldenAngle;
    const r = terrain.R * LAYOUT.scatterRadiusBias * Math.sqrt(i / (LAYOUT.scatterPoolMax * 3));
    const snapped = snapToLand(Math.cos(a) * r, Math.sin(a) * r, terrain, rng);
    if (!snapped) continue;
    const [x, z] = snapped;
    let tooClose = false;
    for (const p of out) {
      if ((p.x - x) * (p.x - x) + (p.z - z) * (p.z - z) < minSq) {
        tooClose = true;
        break;
      }
    }
    if (tooClose) continue;
    out.push({ x, z, region: regionAt(x, z, regions), roll: rng() });
  }
  return out;
}

/** Fixed structures. One per feature, placed relative to its region's anchor. */
function buildAnchors(regions: RegionAnchor[], terrain: WorldLayout, features: readonly FeatureId[]): AnchorPoint[] {
  const out: AnchorPoint[] = [];
  const at = (id: RegionId): [number, number] => regionCentre(id, terrain.R);
  const push = (id: string, feature: FeatureId, x: number, z: number, rotY: number) => {
    if (!features.includes(feature)) return;
    out.push({ id, feature, x, z, rotY });
  };
  // El Mojón sits on the path between El Claro and La Pradera, from tier 1.
  const [px, pz] = at('pradera');
  push('mojon', 'mojon', px * 0.42, pz * 0.42, Math.atan2(-pz, -px));
  const [jx, jz] = at('jardin');
  push('banco', 'bench', jx * 1.05, jz * 1.05, Math.atan2(-jz, -jx));
  push('compostera', 'compost', jx * 0.78, jz * 1.18, 0);
  const [ax, az] = at('arboleda');
  push('casa_arbol', 'treehouse', ax, az, 0);
  push('hamaca', 'hammock', ax * 0.82, az * 1.12, Math.PI / 2);
  const [rx, rz] = at('rio');
  push('puente', 'bridge', rx * 0.7, rz * 0.7, Math.atan2(rz, rx) + Math.PI / 2);
  push('cascada', 'waterfall', rx * 1.25, rz * 1.25, 0);
  const [mx, mz] = at('monte');
  push('cueva', 'cave', mx * 0.86, mz * 0.86, Math.atan2(-mz, -mx));
  const [cx, cz] = at('cumbre');
  push('telescopio', 'telescope', cx * 1.02, cz * 0.94, 0);
  push('monumento', 'monument', cx, cz, 0);
  const [ix, iz] = at('islote');
  push('bote', 'boat', ix * 0.7, iz * 0.7, Math.atan2(iz, ix));
  return out;
}

/**
 * Traversal caches: 6-10 hidden spots per unlocked region, each reachable only
 * with a verb the player might hold. Movement itself is the reward, so these are
 * small — a semillas cache or a rare sighting, never progression.
 */
function buildCaches(regions: RegionAnchor[], terrain: WorldLayout, verbs: readonly VerbId[]): TraversalCache[] {
  const out: TraversalCache[] = [];
  const reach: VerbId[] = ['walk', 'climb', 'glide', 'swim', 'scale', 'sail'];
  const usable = reach.filter((v) => verbs.includes(v));
  for (const region of regions) {
    if (!region.unlocked) continue;
    const rng = mulberry32(hashInt(`cache:${region.id}`) ^ terrain.seed);
    const count = Math.floor(rng() * 5) + 6; // 6..10
    for (let i = 0; i < count; i++) {
      const a = rng() * Math.PI * 2;
      const d = region.radius * (0.35 + rng() * 0.6);
      const x = region.x + Math.cos(a) * d;
      const z = region.z + Math.sin(a) * d;
      if (Math.hypot(x, z) > terrain.R - TERRAIN.plantableMargin) continue;
      out.push({ x, z, region: region.id, verb: usable[Math.floor(rng() * usable.length)] ?? 'walk' });
    }
  }
  return out;
}

// ── The entry point ─────────────────────────────────────────────────────────

/** Generate the island. Pure: same `(userId, cfg)` in, same island out. */
export function buildLayout(userId: string, cfg: WorldConfig): IslandLayout {
  const seed = hashInt(userId);
  const R = cfg.radius;

  const regions: RegionAnchor[] = (Object.keys(REGION_SPECS) as RegionId[]).map((id) => {
    const [x, z] = regionCentre(id, R);
    return { id, x, z, radius: REGION_SPECS[id].radiusFrac * R, unlocked: cfg.regions.includes(id) };
  });

  const terrain = buildTerrainLayout(R, seed, cfg.features);
  const coastline = buildCoastline(R, seed);
  const scatter = buildScatter(terrain, regions, seed);
  const anchors = buildAnchors(regions, terrain, cfg.features);
  const caches = buildCaches(regions, terrain, cfg.verbs);

  const river = terrain.rivers[0];
  const riverPath: [number, number][] | null = river ? [river.from, river.to] : null;

  // The snow line is a world height, taken from the tallest mountain mass.
  const peak = terrain.mountains.reduce((h, m) => Math.max(h, terrainHeight(m.x, m.z, terrain)), 0);
  const snowLine = cfg.features.includes('snow') ? peak * LAYOUT.snowLineFrac : null;

  // The spawn is always El Claro, on plantable ground, at the centre.
  const claro = regionCentre('claro', R);
  const spawn = isPlantable(claro[0], claro[1], terrain)
    ? claro
    : (snapToLand(claro[0], claro[1], terrain, mulberry32(seed)) ?? claro);

  return { seed, radius: R, terrain, regions, coastline, riverPath, snowLine, scatter, anchors, caches, spawn };
}
