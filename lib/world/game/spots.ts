/**
 * Where the game's things stand: the station pads and the four characters.
 *
 * **A pad never moves and is never taken by a later tier.** Each spot is
 * checked against the island at the tier the station arrives *and* at tier
 * 11, and kept off the tier-11 path network — so the river of tier 7 never
 * runs through a compostera built on day one, and no path ever ends in a wall.
 */
import { buildLayout, type IslandLayout } from '../layout';
import { pathDistance, pathsFor } from '../paths';
import { cumulativeState } from '../progression';
import { regionCentre } from '../regions';
import { hashInt, mulberry32 } from '../rng';
import { isPlantable, isRockable, snapToLand, terrainHeight, type WorldLayout } from '../terrain';
import { terrainForTier } from '../layout';
import { WATER_LEVEL } from '../config';
import { STATIONS } from './stations';
import type { StationId } from './types';

export interface Spot {
  x: number;
  z: number;
  /** Facing, radians: a pad's front looks toward the island's centre. */
  rotY: number;
}

export interface GameSpots {
  stations: Partial<Record<StationId, Spot>>;
  /** Home spot of each character. */
  cast: Record<string, Spot>;
  /** Where the Ceibo of real impact grows. */
  ceibo: Spot;
}

/** Near El Claro, at a preferred bearing and distance from the spawn. */
const CLARO_STATIONS: [StationId, number, number][] = [
  ['punto_limpio', 3.75, 7.2],
  ['compostera', 2.35, 7.4],
  ['tanque', 0.95, 6.6],
  ['vivero', 5.3, 7.6],
];

const PAD_CLEAR_M = 4.2;
const PATH_CLEAR_M = 2.1;

const cache = new Map<string, GameSpots>();

function facing(x: number, z: number, tx: number, tz: number): number {
  return Math.atan2(tx - x, tz - z);
}

export function gameSpots(userId: string, layout: IslandLayout): GameSpots {
  const key = `${userId}:${layout.radius}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const final = buildLayout(userId, cumulativeState(11));
  const paths = pathsFor(final);
  const seed = layout.seed;
  const [sx, sz] = layout.spawn;
  const ceibo: Spot = { x: sx + 2.6, z: sz - 2.2, rotY: 0 };
  const taken: { x: number; z: number }[] = [{ x: sx, z: sz }, { x: ceibo.x, z: ceibo.z }];
  for (const a of final.anchors) taken.push({ x: a.x, z: a.z });

  const ground = (x: number, z: number, early: WorldLayout, steep = false) =>
    (steep ? isRockable(x, z, early) && isRockable(x, z, final.terrain) : isPlantable(x, z, early) && isPlantable(x, z, final.terrain));

  const free = (x: number, z: number) =>
    taken.every((t) => (t.x - x) ** 2 + (t.z - z) ** 2 >= PAD_CLEAR_M * PAD_CLEAR_M) &&
    pathDistance(x, z, paths) >= PATH_CLEAR_M;

  /** Spiral out from a wish until the ground and the neighbours agree. */
  const place = (wx: number, wz: number, tier: number, steep = false): Spot => {
    const early = terrainForTier(seed, tier);
    const rng = mulberry32(hashInt(`spot:${seed}:${wx.toFixed(1)}:${wz.toFixed(1)}`));
    for (let ring = 0; ring < 14; ring++) {
      const tries = ring === 0 ? 1 : 10;
      for (let k = 0; k < tries; k++) {
        const a = rng() * Math.PI * 2;
        const x = wx + Math.cos(a) * ring * 0.9;
        const z = wz + Math.sin(a) * ring * 0.9;
        if (ground(x, z, early, steep) && free(x, z)) {
          taken.push({ x, z });
          return { x, z, rotY: facing(x, z, sx, sz) };
        }
      }
    }
    const snapped = snapToLand(wx, wz, early, rng) ?? [wx, wz];
    taken.push({ x: snapped[0], z: snapped[1] });
    return { x: snapped[0], z: snapped[1], rotY: facing(snapped[0], snapped[1], sx, sz) };
  };

  const stations: Partial<Record<StationId, Spot>> = {};
  for (const [id, bearing, dist] of CLARO_STATIONS) {
    stations[id] = place(sx + Math.cos(bearing) * dist, sz + Math.sin(bearing) * dist, STATIONS[id].tier);
  }
  const [jx, jz] = regionCentre('jardin');
  stations.hotel_insectos = place(jx * 0.82, jz * 0.82, 3);

  // The bridge pad stands on the bank of the crossing nearest home.
  const bridge = final.anchors.find((a) => a.feature === 'bridge');
  if (bridge) {
    const half = (bridge.span ?? 6) / 2 + 1.4;
    const ax = Math.sin(bridge.rotY);
    const az = Math.cos(bridge.rotY);
    const ends = [
      [bridge.x + ax * half, bridge.z + az * half],
      [bridge.x - ax * half, bridge.z - az * half],
    ].sort((a, b) => Math.hypot(a[0]! - sx, a[1]! - sz) - Math.hypot(b[0]! - sx, b[1]! - sz));
    stations.puente = place(ends[0]![0]!, ends[0]![1]!, 7);
  }
  // The dock: the lagoon's shore on the side facing home.
  const [rx, rz] = regionCentre('rio');
  const lagoonEdge = shoreToward(rx, rz, sx, sz, final.terrain);
  stations.muelle = place(lagoonEdge[0], lagoonEdge[1], 7);
  const [mx, mz] = regionCentre('monte');
  stations.refugio = place(mx * 0.78, mz * 0.78, 8, true);
  const [ix, iz] = regionCentre('islote');
  const toward = Math.atan2(iz, ix);
  stations.faro = place(Math.cos(toward) * 50, Math.sin(toward) * 50, 10);

  // The cast stand beside what they care about.
  const near = (s: Spot | undefined, dx: number, dz: number, tier: number): Spot =>
    s ? place(s.x + dx, s.z + dz, tier) : place(sx + dx, sz + dz, tier);
  const cast: Record<string, Spot> = {
    don_beto: near(stations.punto_limpio, 2.2, 1.6, 1),
    // Far enough from the vivero's pad that walking up to her never steps on it.
    ines: near(stations.vivero, -2.6, 2.3, 1),
    mila: place(...regionCentre('pradera').map((v) => v * 0.9) as [number, number], 2),
    tuco: place(lagoonEdge[0] + 2.5, lagoonEdge[1] - 1.5, 7),
  };

  const out = { stations, cast, ceibo };
  cache.set(key, out);
  return out;
}

/** Walk from a lake's centre toward a point until the ground is dry. */
function shoreToward(cx: number, cz: number, tx: number, tz: number, L: WorldLayout): [number, number] {
  const dx = tx - cx;
  const dz = tz - cz;
  const len = Math.hypot(dx, dz) || 1;
  for (let d = 0; d < len; d += 0.5) {
    const x = cx + (dx / len) * d;
    const z = cz + (dz / len) * d;
    if (terrainHeight(x, z, L) > WATER_LEVEL + 0.15) return [x + (dx / len) * 1.5, z + (dz / len) * 1.5];
  }
  return [tx, tz];
}
