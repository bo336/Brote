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
import { LAYOUT, SCALE_REFERENCE, TERRAIN } from './config';
import { CACHE_SPOTS, REGION_SPECS, regionCentre, regionRadius } from './regions';
import { islandRadius, tierForRegion } from './progression';
import { hashInt, mulberry32 } from './rng';
import {
  fbm, isPlantable, isRockable, snapToLand, terrainHeight,
  type IsletSpec, type LakeSpec, type MountainSpec, type RiverSpec, type WorldLayout,
} from './terrain';
import type { FeatureId, RegionId, VerbId, WorldConfig } from './types';

export { regionCentre } from './regions';

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
  /**
   * Ground too steep to plant, where only rock belongs. Marked rather than
   * re-derived, so the renderer never has to sample the slope to find out.
   */
  steep?: boolean;
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
 * The rim radius at an angle, interpolated between coastline samples. The
 * ground mesh builds its outer ring from this, and the character controller
 * pushes back against it — so the land you can see is exactly the land you can
 * walk on.
 */
export function coastRadiusAt(coastline: Float32Array, angleRad: number): number {
  const n = coastline.length;
  const t = (((angleRad / (Math.PI * 2)) % 1) + 1) % 1;
  const f = t * n;
  const i = Math.floor(f);
  const a = coastline[i % n]!;
  const b = coastline[(i + 1) % n]!;
  return a + (b - a) * (f - i);
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

/**
 * Build the height-function layout from the FEATURES the tier granted, placing
 * each one **at its region's anchor**.
 *
 * The ported `makeLayout` is still exported from `terrain.ts` and still tested,
 * but it gates its content on a world index and puts everything at fixed
 * fractions of the radius — which has nothing to do with where El Río and El
 * Monte actually are. This builds the same `WorldLayout` shape from the region
 * table instead, so the river runs through La Laguna and the mountain rises
 * under La Cumbre.
 */
function buildTerrainLayout(R: number, seed: number, features: readonly FeatureId[]): WorldLayout {
  const lakes: LakeSpec[] = [];
  const rivers: RiverSpec[] = [];
  const mountains: MountainSpec[] = [];
  let islet: IsletSpec | null = null;

  // La Pradera's puddle. Carving it through the SAME height function means
  // `isWater`, `isPlantable` and the water mesh all understand it without a
  // single line of special-casing.
  if (features.includes('puddle')) {
    const [px, pz] = regionCentre('pradera');
    lakes.push({
      x: px * LAYOUT.puddleOffsetFrac,
      z: pz * LAYOUT.puddleOffsetFrac,
      r: islandRadius(2) * LAYOUT.puddleRadiusFrac,
      depth: LAYOUT.puddleDepthM,
    });
  }

  // El Monte, and above it La Cumbre. One mass: the snow line is a height mask
  // on the same mountain, not a second mountain (`08` §1).
  const [mx, mz] = regionCentre('monte');
  if (features.includes('mountain')) {
    mountains.push({
      x: mx,
      z: mz,
      r: islandRadius(8) * LAYOUT.mountainRadiusFrac,
      h: SCALE_REFERENCE.summitM,
    });
    // A shoulder, so the massif is not one cone.
    mountains.push({
      x: mx * LAYOUT.shoulderOffsetFrac,
      z: mz * LAYOUT.shoulderOffsetFrac,
      r: islandRadius(8) * LAYOUT.mountainRadiusFrac * 0.55,
      h: SCALE_REFERENCE.summitM * LAYOUT.shoulderHeightFrac,
    });
  }

  // La Laguna, and the river that leaves it for the sea.
  if (features.includes('pond')) {
    const [rx, rz] = regionCentre('rio');
    lakes.push({ x: rx, z: rz, r: islandRadius(7) * LAYOUT.lagoonRadiusFrac, depth: LAYOUT.lagoonDepthM });
    if (features.includes('river')) {
      // The water breaks out of the rock at the mountain's foot and runs past
      // the lagoon to the coast — which is the shape the tier-7 ceremony
      // animates (`08-WORLD-AND-PROGRESSION.md` §5).
      const source: [number, number] = features.includes('mountain')
        ? [mx * LAYOUT.riverSourceFrac, mz * LAYOUT.riverSourceFrac]
        : [rx * LAYOUT.riverSourceFrac, rz * LAYOUT.riverSourceFrac];
      const dir = Math.atan2(rz, rx);
      rivers.push({
        from: source,
        to: [Math.cos(dir) * (R + 1), Math.sin(dir) * (R + 1)],
        width: LAYOUT.riverWidthM,
        depth: LAYOUT.riverDepthM,
      });
    }
  }

  if (features.includes('islet')) {
    const [ix, iz] = regionCentre('islote');
    islet = { x: ix, z: iz, r: islandRadius(10) * LAYOUT.isletRadiusFrac, h: LAYOUT.isletHeightM };
  }

  return { R, lakes, rivers, mountains, islet, seed };
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

  // **Rock on steep ground.** `snapToLand` rejects everything above the
  // plantable slope, which is all of El Monte and most of La Cumbre — so the
  // spiral above never puts a single thing on the mountain, however much rock
  // the region asks for. This second pass walks the same spiral accepting the
  // steeper limit, and forces each point's roll into the rock band so only the
  // rock pools can ever claim it. Nothing grows up there; it just stops being
  // a bare cone.
  const rockBandStart =
    LAYOUT.shareSprouts + LAYOUT.shareGrass + LAYOUT.shareFlowers + LAYOUT.shareTrees;
  let steep = 0;
  for (let i = 0; i < LAYOUT.steepScatter * 6 && steep < LAYOUT.steepScatter; i++) {
    const a = i * LAYOUT.goldenAngle;
    const r = terrain.R * LAYOUT.scatterRadiusBias * Math.sqrt(i / (LAYOUT.steepScatter * 6));
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    // Only ground the first pass could NOT use, so the two never compete.
    if (isPlantable(x, z, terrain) || !isRockable(x, z, terrain)) continue;
    let tooClose = false;
    for (const p of out) {
      if ((p.x - x) * (p.x - x) + (p.z - z) * (p.z - z) < minSq) {
        tooClose = true;
        break;
      }
    }
    if (tooClose) continue;
    out.push({
      x, z,
      region: regionAt(x, z, regions),
      roll: rockBandStart + rng() * (1 - rockBandStart),
      steep: true,
    });
    steep++;
  }

  // El Islote sits outside the main spiral, and an island you sail to had
  // better have something growing on it. Its own small spiral, same rules.
  const islet = terrain.islet;
  if (islet) {
    for (let i = 0; i < LAYOUT.isletScatter * 3 && out.length < LAYOUT.scatterPoolMax + LAYOUT.isletScatter; i++) {
      const a = i * LAYOUT.goldenAngle;
      const r = islet.r * LAYOUT.scatterRadiusBias * Math.sqrt(i / (LAYOUT.isletScatter * 3));
      const x = islet.x + Math.cos(a) * r;
      const z = islet.z + Math.sin(a) * r;
      if (!isPlantable(x, z, terrain)) continue;
      out.push({ x, z, region: 'islote', roll: rng() });
    }
  }
  return out;
}

/** Fixed structures. One per feature, placed relative to its region's anchor. */
function buildAnchors(regions: RegionAnchor[], terrain: WorldLayout, features: readonly FeatureId[]): AnchorPoint[] {
  const out: AnchorPoint[] = [];
  const at = (id: RegionId): [number, number] => regionCentre(id);
  const push = (id: string, feature: FeatureId, x: number, z: number, rotY: number) => {
    if (!features.includes(feature)) return;
    out.push({ id, feature, x, z, rotY });
  };
  // El Mojón sits on the path between El Claro and La Pradera, from tier 1.
  const [px, pz] = at('pradera');
  push('mojon', 'mojon', px * 0.42, pz * 0.42, Math.atan2(-pz, -px));
  push('charco', 'puddle', px * LAYOUT.puddleOffsetFrac, pz * LAYOUT.puddleOffsetFrac, 0);
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
 * Traversal caches from the authored table above. A cache the player cannot yet
 * reach is simply not generated — the verbs they hold are the point, and an
 * unreachable marker on the map is a nag, not a promise.
 */
function buildCaches(regions: RegionAnchor[], verbs: readonly VerbId[]): TraversalCache[] {
  const out: TraversalCache[] = [];
  for (const region of regions) {
    if (!region.unlocked) continue;
    const spec = REGION_SPECS[region.id];
    for (const [dist, offset, verb] of CACHE_SPOTS[region.id]) {
      if (!verbs.includes(verb)) continue;
      const angle = spec.angle + offset;
      out.push({
        x: region.x + Math.cos(angle) * region.radius * dist,
        z: region.z + Math.sin(angle) * region.radius * dist,
        region: region.id,
        verb,
      });
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
    const [x, z] = regionCentre(id);
    return { id, x, z, radius: regionRadius(id), unlocked: cfg.regions.includes(id) };
  });

  const terrain = buildTerrainLayout(R, seed, cfg.features);
  const coastline = buildCoastline(R, seed);
  const scatter = buildScatter(terrain, regions, seed);
  const anchors = buildAnchors(regions, terrain, cfg.features);
  const caches = buildCaches(regions, cfg.verbs);

  const river = terrain.rivers[0];
  const riverPath: [number, number][] | null = river ? [river.from, river.to] : null;

  // The snow line is a world height, taken from the tallest mountain mass.
  const peak = terrain.mountains.reduce((h, m) => Math.max(h, terrainHeight(m.x, m.z, terrain)), 0);
  const snowLine = cfg.features.includes('snow') ? peak * LAYOUT.snowLineFrac : null;

  // The spawn is always El Claro, on plantable ground, at the centre.
  const claro = regionCentre('claro');
  const spawn = isPlantable(claro[0], claro[1], terrain)
    ? claro
    : (snapToLand(claro[0], claro[1], terrain, mulberry32(seed)) ?? claro);

  return { seed, radius: R, terrain, regions, coastline, riverPath, snowLine, scatter, anchors, caches, spawn };
}
