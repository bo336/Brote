/**
 * Quality tiers, and the monitor that moves between them.
 *
 * **Every count in the scene reads from this table. No scene file may contain a
 * hard-coded instance count** (`07-RENDER-ARCHITECTURE.md` §4).
 *
 * Tier changes are cheap and non-destructive: they change instance counts and
 * uniform values on pools that already exist. They never re-create geometry or
 * materials, and a tier change must not drop a frame.
 *
 * We do not classify the device from static hints — `deviceMemory` is
 * Chromium-only and `WEBGL_debug_renderer_info` is increasingly masked
 * (`03-RESEARCH-TECH.md` §7). We start conservative and measure.
 */
import { QUALITY_MONITOR } from '@/lib/world/config';
import type { QualityTier } from '@/lib/world/types';

export interface TierParams {
  name: string;
  dprCap: number;
  antialias: boolean;
  postProcessing: boolean;
  realShadows: boolean;
  blobShadows: boolean;
  terrainGrid: number;
  grassTufts: number;
  flowers: number;
  trees: number;
  treeLods: number;
  rocks: number;
  groundDetail: number;
  fauna: number;
  particles: number;
  /** 0 flat colour + foam line, 1 one swell, 2 two swells, 3 + specular + caustics. */
  water: 0 | 1 | 2 | 3;
  wobble: boolean;
  wind: boolean;
  heightFog: boolean;
  renderDistanceM: number;
  targetFps: number;
}

/** The table from `07-RENDER-ARCHITECTURE.md` §4, as data. */
export const TIERS: Record<QualityTier, TierParams> = {
  0: {
    name: 'mínimo', dprCap: 0.75, antialias: false, postProcessing: false, realShadows: false,
    blobShadows: true, terrainGrid: 64, grassTufts: 0, flowers: 20, trees: 30, treeLods: 1,
    rocks: 12, groundDetail: 0, fauna: 2, particles: 30, water: 0, wobble: false, wind: false,
    heightFog: false, renderDistanceM: 45, targetFps: 30,
  },
  1: {
    name: 'bajo', dprCap: 1.0, antialias: false, postProcessing: false, realShadows: false,
    blobShadows: true, terrainGrid: 96, grassTufts: 250, flowers: 60, trees: 60, treeLods: 2,
    rocks: 30, groundDetail: 60, fauna: 4, particles: 80, water: 1, wobble: true, wind: true,
    heightFog: false, renderDistanceM: 60, targetFps: 30,
  },
  2: {
    name: 'medio', dprCap: 1.25, antialias: true, postProcessing: false, realShadows: false,
    blobShadows: true, terrainGrid: 128, grassTufts: 700, flowers: 140, trees: 110, treeLods: 2,
    rocks: 60, groundDetail: 180, fauna: 8, particles: 200, water: 2, wobble: true, wind: true,
    heightFog: false, renderDistanceM: 80, targetFps: 45,
  },
  3: {
    name: 'alto', dprCap: 1.75, antialias: true, postProcessing: true, realShadows: true,
    blobShadows: true, terrainGrid: 160, grassTufts: 1500, flowers: 260, trees: 180, treeLods: 3,
    rocks: 90, groundDetail: 350, fauna: 14, particles: 400, water: 3, wobble: true, wind: true,
    heightFog: true, renderDistanceM: 110, targetFps: 60,
  },
};

export const TIER_ORDER: QualityTier[] = [0, 1, 2, 3];

export interface TierHints {
  hardwareConcurrency?: number;
  prefersReducedMotion?: boolean;
  /** The user's saved `detailMode`, which always wins. */
  detailMode?: 'auto' | 'high' | 'low';
  /** `?mundoTier=0..3`, for testing. Overrides everything. */
  forced?: number | null;
}

/**
 * The starting tier. **Start at T1.** Static hints may only LOWER it, never
 * raise it — a manual setting is the one thing allowed to raise it, because the
 * user can see the result and we cannot.
 */
export function initialTier(hints: TierHints = {}): QualityTier {
  if (hints.forced != null && hints.forced >= 0 && hints.forced <= 3) return Math.floor(hints.forced) as QualityTier;
  if (hints.detailMode === 'low') return 0;
  if (hints.detailMode === 'high') return 3;
  let tier: QualityTier = 1;
  if ((hints.hardwareConcurrency ?? 4) < 4) tier = 0;
  if (hints.prefersReducedMotion) tier = 0;
  return tier;
}

export interface QualityMonitor {
  /** Feed it every frame's delta in milliseconds. Returns a new tier, or null. */
  sample(frameMs: number, nowMs: number): QualityTier | null;
  current(): QualityTier;
  /** The rolling median, for the perf overlay. */
  medianMs(): number;
  /** A manual setting disables the monitor entirely. */
  setManual(tier: QualityTier | null): void;
  reset(tier: QualityTier): void;
}

export interface MonitorOptions {
  start?: QualityTier;
  manual?: QualityTier | null;
}

/**
 * The promote/demote hysteresis. Below target for 3 s demotes immediately; 35%
 * of headroom sustained for 20 s promotes once, then waits 60 s; a demotion
 * locks out promotion for 60 s. **Never oscillate.**
 */
export function createQualityMonitor(opts: MonitorOptions = {}): QualityMonitor {
  const window = QUALITY_MONITOR.medianWindowFrames;
  const ring = new Float32Array(window);
  const sorted = new Float32Array(window);
  let filled = 0;
  let head = 0;
  let tier: QualityTier = opts.start ?? 1;
  let manual: QualityTier | null = opts.manual ?? null;
  let belowSinceMs: number | null = null;
  let aboveSinceMs: number | null = null;
  let lockedUntilMs = 0;

  function median(): number {
    if (filled === 0) return 0;
    sorted.set(ring.subarray(0, filled));
    const slice = sorted.subarray(0, filled);
    slice.sort();
    return slice[filled >> 1]!;
  }

  return {
    sample(frameMs, nowMs) {
      ring[head] = frameMs;
      head = (head + 1) % window;
      if (filled < window) filled++;
      if (manual !== null || filled < window) return null;

      const target = 1000 / TIERS[tier].targetFps;
      const med = median();

      if (med > target) {
        aboveSinceMs = null;
        belowSinceMs ??= nowMs;
        if (tier > 0 && nowMs - belowSinceMs >= QUALITY_MONITOR.demoteAfterS * 1000) {
          tier = (tier - 1) as QualityTier;
          belowSinceMs = null;
          lockedUntilMs = nowMs + QUALITY_MONITOR.demoteLockoutS * 1000;
          filled = 0; // a fresh window, so the new tier is judged on its own frames
          return tier;
        }
        return null;
      }

      belowSinceMs = null;
      if (nowMs < lockedUntilMs || tier >= 3) {
        aboveSinceMs = null;
        return null;
      }
      const headroom = med <= target * (1 - QUALITY_MONITOR.promoteMargin);
      if (!headroom) {
        aboveSinceMs = null;
        return null;
      }
      aboveSinceMs ??= nowMs;
      if (nowMs - aboveSinceMs >= QUALITY_MONITOR.promoteAfterS * 1000) {
        tier = (tier + 1) as QualityTier;
        aboveSinceMs = null;
        lockedUntilMs = nowMs + QUALITY_MONITOR.promoteCooldownS * 1000;
        filled = 0;
        return tier;
      }
      return null;
    },
    current: () => manual ?? tier,
    medianMs: median,
    setManual(next) {
      manual = next;
      if (next !== null) tier = next;
    },
    reset(next) {
      tier = next;
      filled = 0;
      head = 0;
      belowSinceMs = null;
      aboveSinceMs = null;
      lockedUntilMs = 0;
    },
  };
}
