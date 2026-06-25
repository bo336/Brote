/**
 * "Tu Mundo" state model (BUILD_SPEC §9.5).
 *
 * The render of the living 3D world is DETERMINISTIC from `mundo_state`, so it
 * is identical across devices and cheap to load. This module is shared by the
 * server (which writes `profiles.mundo_state` inside `complete_activity` and
 * the nightly job) and the client (which reads + renders it).
 *
 * Rank drives the STRUCTURAL tier (which big elements exist). Streak drives
 * LIVELINESS (lushness/brightness). Domain balance themes micro-details.
 */
import { getRank } from './ranks';
import type { DomainSlug } from './domains';

export type StructuralElement =
  | 'soil'
  | 'grass'
  | 'sprout'
  | 'flowers'
  | 'small_tree'
  | 'shrubs'
  | 'bird'
  | 'full_tree'
  | 'pond'
  | 'grove'
  | 'butterflies'
  | 'guardian_aura'
  | 'rich_biome'
  | 'globe'
  | 'golden';

export type PipStage = 'seed' | 'sprout' | 'leafy' | 'guardian' | 'radiant';

export interface MundoState {
  /** Structural tier == rank tier (1..11). */
  rankTier: number;
  /** Ordered list of structural elements present at this tier. */
  structuralElements: StructuralElement[];
  /** 0..1 — lushness/brightness from recent activity + streak. */
  liveliness: number;
  /** Dominant domain slug (themes micro-details), or null. */
  dominantDomain: DomainSlug | null;
  /** Cosmetic palette key. */
  palette: 'default' | 'lush' | 'aqua' | 'golden';
  /** Unlocked cosmetics (auras, etc.). */
  unlockedCosmetics: string[];
  /** Pip's visual evolution stage. */
  pipStage: PipStage;
  /** ISO timestamp when this state was last computed (server-side). */
  lastComputed: string;
}

/** Cumulative structural elements unlocked by reaching each rank tier (§5.1). */
const TIER_ELEMENTS: Record<number, StructuralElement[]> = {
  1: ['soil'],
  2: ['grass', 'sprout'],
  3: ['flowers'],
  4: ['small_tree'],
  5: ['shrubs', 'bird'],
  6: ['full_tree'],
  7: ['grove', 'pond', 'butterflies'],
  8: ['guardian_aura'],
  9: ['rich_biome'],
  10: ['globe'],
  11: ['golden'],
};

function pipStageForTier(tier: number): PipStage {
  if (tier >= 11) return 'radiant';
  if (tier >= 8) return 'guardian';
  if (tier >= 4) return 'leafy';
  if (tier >= 2) return 'sprout';
  return 'seed';
}

function paletteFor(tier: number, dominant: DomainSlug | null): MundoState['palette'] {
  if (tier >= 11) return 'golden';
  if (dominant === 'agua' || dominant === 'agua_azul') return 'aqua';
  if (tier >= 5) return 'lush';
  return 'default';
}

export interface ComputeMundoInput {
  totalXp: number;
  currentStreak: number;
  /** Map of domain slug -> points, used to pick the dominant domain. */
  domainPoints?: Partial<Record<DomainSlug, number>>;
}

/**
 * Compute the deterministic world state. Pure — safe on server and client.
 */
export function computeMundoState(input: ComputeMundoInput): MundoState {
  const tier = getRank(input.totalXp).tier;

  const elements: StructuralElement[] = [];
  for (let t = 1; t <= tier; t++) {
    for (const el of TIER_ELEMENTS[t] ?? []) elements.push(el);
  }

  // Liveliness: streak drives most of it, with a small floor so a broken streak
  // dims but never "kills" the world (§9.3).
  const streak = Math.max(0, input.currentStreak);
  const streakComponent = Math.min(1, streak / 30); // saturates at a 30-day streak
  const liveliness = Number((0.35 + 0.65 * streakComponent).toFixed(3));

  // Dominant domain from domain points.
  let dominantDomain: DomainSlug | null = null;
  let best = -1;
  if (input.domainPoints) {
    for (const [slug, pts] of Object.entries(input.domainPoints)) {
      if ((pts ?? 0) > best) {
        best = pts ?? 0;
        dominantDomain = slug as DomainSlug;
      }
    }
  }
  if (best <= 0) dominantDomain = null;

  const unlockedCosmetics: string[] = [];
  if (tier >= 8) unlockedCosmetics.push('guardian_aura');
  if (tier >= 10) unlockedCosmetics.push('globe_form');
  if (tier >= 11) unlockedCosmetics.push('golden_world');

  return {
    rankTier: tier,
    structuralElements: elements,
    liveliness,
    dominantDomain,
    palette: paletteFor(tier, dominantDomain),
    unlockedCosmetics,
    pipStage: pipStageForTier(tier),
    lastComputed: new Date().toISOString(),
  };
}

/** Safe parse of a stored mundo_state jsonb (with a sensible default). */
export function parseMundoState(raw: unknown): MundoState {
  const fallback = computeMundoState({ totalXp: 0, currentStreak: 0 });
  if (!raw || typeof raw !== 'object') return fallback;
  const r = raw as Partial<MundoState>;
  if (typeof r.rankTier !== 'number' || !Array.isArray(r.structuralElements)) return fallback;
  return { ...fallback, ...r } as MundoState;
}
