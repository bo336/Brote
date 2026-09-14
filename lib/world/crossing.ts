/**
 * Where the bridge goes: across the river, where the river is a river.
 *
 * It was placed at seven tenths of El Río's centre and turned sideways — which
 * is in the lagoon, so the 2026-09-13 playtest found a jetty standing in open
 * water and asked what it was for. A bridge belongs where a channel runs between
 * two dry banks. This walks each river, keeps the points whose banks are dry and
 * which are clear of every lake and of the coast, and picks the crossing nearest
 * home — preferring banks at the same height, so the deck does not tilt.
 *
 * Pure and deterministic, like the rest of the layout.
 */
import { BRIDGE, WATER_LEVEL } from './config';
import { terrainHeight, type WorldLayout } from './terrain';

export interface Crossing {
  x: number;
  z: number;
  /** Rotation about Y that lays the bridge's span (its local X) across the flow. */
  rotY: number;
  /** Bank to bank, metres. */
  span: number;
}

export function bridgeCrossing(terrain: WorldLayout, home: readonly [number, number]): Crossing | null {
  let best: Crossing | null = null;
  let bestScore = Infinity;
  for (const river of terrain.rivers) {
    const [ax, az] = river.from;
    const dx = river.to[0] - ax;
    const dz = river.to[1] - az;
    const len = Math.hypot(dx, dz);
    if (len < 1) continue;
    // Across the flow.
    const nx = -dz / len;
    const nz = dx / len;
    const span = river.width * BRIDGE.carveHalfWidth * 2 + BRIDGE.bankOverlapM * 2;
    const half = span / 2;
    for (let i = 1; i < BRIDGE.samples; i++) {
      const t = i / BRIDGE.samples;
      const x = ax + dx * t;
      const z = az + dz * t;
      const radius = Math.hypot(x, z);
      let lakeGap = Infinity;
      for (const lake of terrain.lakes) lakeGap = Math.min(lakeGap, Math.hypot(x - lake.x, z - lake.z) - lake.r);
      const bankA = terrainHeight(x + nx * half, z + nz * half, terrain);
      const bankB = terrainHeight(x - nx * half, z - nz * half, terrain);
      const dry = Math.min(bankA, bankB) > WATER_LEVEL + BRIDGE.bankAboveWaterM
        && radius <= terrain.R - BRIDGE.coastClearM
        && lakeGap >= half + BRIDGE.lakeClearM;
      /**
       * Some rivers have no dry crossing at all: at tier 7 El Río runs from inside
       * the lagoon straight to the sea through ground at sea level. Its bridge
       * still belongs across the river — outside the lagoon, inside the coast,
       * over the shallowest banks — and `decks.ts` lifts its deck clear of the water.
       */
      const wet = !dry && radius <= terrain.R - BRIDGE.wetCoastClearM && lakeGap >= BRIDGE.wetLakeClearM;
      if (!dry && !wet) continue;
      const wetness = Math.max(0, WATER_LEVEL + BRIDGE.bankAboveWaterM - Math.min(bankA, bankB));
      const score = (dry ? 0 : 1e4 + wetness * 1e3)
        + Math.hypot(x - home[0], z - home[1])
        + Math.abs(bankA - bankB) * BRIDGE.levelWeight;
      if (score < bestScore) {
        bestScore = score;
        // three's rotation.y takes local X to (cos θ, 0, −sin θ); that has to be (nx, nz).
        best = { x, z, rotY: Math.atan2(-nz, nx), span };
      }
    }
  }
  return best;
}
