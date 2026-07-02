/**
 * "Tu Mundo" state model v2 — MUNDO INFINITO (BUILD_SPEC §9.5 + IMPROVEMENT_PLAN §B2).
 *
 * The render of the living 3D world is DETERMINISTIC from `mundo_state`, so it
 * is identical across devices and cheap to load. This module is shared by the
 * server (which writes `profiles.mundo_state` inside `complete_activity` and
 * the nightly job) and the client (which reads + renders it).
 *
 * v2 core idea: EVERY completion visibly grows the world. Progression is a pure
 * function of the lifetime scoring-completion count — stateless and
 * corruption-proof:
 *   - Each completion adds one visible element to the current world.
 *   - A world "completes" when its growth goal is met (goals grow ~1.55× per
 *     world), then the next BIOME unlocks. Completed worlds remain visitable.
 *   - Biomes 1..6 are hand-designed; beyond that they are procedurally themed
 *     from the index → the loop is infinite.
 *
 * Rank still drives Pip's evolution + cosmetics. Streak drives LIVELINESS.
 * Domain balance themes micro-details.
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

// ── Mundo Infinito: growth math ─────────────────────────────────────────────

/** Completions needed to finish world N (1-indexed). 40, 62, 96, 149, 231, 358… */
export function worldGoal(worldIndex: number): number {
  return Math.round(40 * Math.pow(1.55, Math.max(0, worldIndex - 1)));
}

export interface WorldProgress {
  /** Current world (1-indexed, unbounded). */
  worldIndex: number;
  /** Completions invested in the current world. */
  worldGrowth: number;
  /** Completions needed to complete the current world. */
  worldGoal: number;
  /** 0..1 progress of the current world. */
  worldPct: number;
  /** How many worlds are fully complete (== worldIndex - 1). */
  worldsCompleted: number;
}

/** Pure derivation of world progression from lifetime scoring completions. */
export function worldProgressFromCompletions(totalCompletions: number): WorldProgress {
  let n = Math.max(0, Math.floor(totalCompletions));
  let idx = 1;
  // 1.55^k growth → the loop runs O(log n) times; safe for any realistic n.
  while (n >= worldGoal(idx)) {
    n -= worldGoal(idx);
    idx += 1;
  }
  const goal = worldGoal(idx);
  return {
    worldIndex: idx,
    worldGrowth: n,
    worldGoal: goal,
    worldPct: Math.min(1, n / goal),
    worldsCompleted: idx - 1,
  };
}

// ── Biomes ──────────────────────────────────────────────────────────────────

export interface BiomeTheme {
  /** Display name (es). */
  name: string;
  /** Ground / grass / foliage / deep foliage / accent (flowers) hex colors. */
  ground: string;
  grass: string;
  leaf: string;
  leafDeep: string;
  accent: string;
  /** Sky gradient (top, horizon). */
  skyTop: string;
  skyHorizon: string;
  /** Water tint. */
  water: string;
  /** Feature flags for special set-dressing. */
  features: { pond: boolean; rocks: boolean; palms: boolean; snow: boolean; dunes: boolean };
}

const BIOMES: BiomeTheme[] = [
  {
    name: 'Pradera',
    ground: '#7fbf6e', grass: '#8fd07f', leaf: '#3CB371', leafDeep: '#2f7d4f', accent: '#F4A62A',
    skyTop: '#7ec8e3', skyHorizon: '#eaf6df', water: '#5fb7d4',
    features: { pond: false, rocks: true, palms: false, snow: false, dunes: false },
  },
  {
    name: 'Bosque Nuboso',
    ground: '#4e8d5b', grass: '#5ea36b', leaf: '#2e8b57', leafDeep: '#1c5e3c', accent: '#E8638C',
    skyTop: '#9db8c9', skyHorizon: '#dfe9e2', water: '#4f9cae',
    features: { pond: true, rocks: true, palms: false, snow: false, dunes: false },
  },
  {
    name: 'Costa Esmeralda',
    ground: '#e6d29a', grass: '#b9d178', leaf: '#4fae7e', leafDeep: '#2c8a63', accent: '#2DB4D4',
    skyTop: '#6fc3df', skyHorizon: '#fdf3d8', water: '#1E88A8',
    features: { pond: true, rocks: true, palms: true, snow: false, dunes: true },
  },
  {
    name: 'Desierto Florecido',
    ground: '#d9a95f', grass: '#c9b36a', leaf: '#7ba05b', leafDeep: '#5c7d44', accent: '#E8638C',
    skyTop: '#f3b76c', skyHorizon: '#fde8c8', water: '#63a8a0',
    features: { pond: false, rocks: true, palms: false, snow: false, dunes: true },
  },
  {
    name: 'Selva Nublada',
    ground: '#3e7d4f', grass: '#4c9159', leaf: '#237a4e', leafDeep: '#155238', accent: '#B07CD6',
    skyTop: '#87a8a4', skyHorizon: '#d8e6d5', water: '#3f8f96',
    features: { pond: true, rocks: false, palms: true, snow: false, dunes: false },
  },
  {
    name: 'Tundra Aurora',
    ground: '#b9c7c4', grass: '#a5c9b5', leaf: '#6fa98c', leafDeep: '#4b7f68', accent: '#5B6CF0',
    skyTop: '#4b5f8e', skyHorizon: '#cfd9e6', water: '#7fb2c9',
    features: { pond: true, rocks: true, palms: false, snow: true, dunes: false },
  },
];

/** Tiny deterministic hash → 0..1 for procedural biome generation. */
function hash01(n: number): number {
  let x = (n * 374761393 + 668265263) | 0;
  x = ((x ^ (x >>> 13)) * 1274126177) | 0;
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
}

function hsl(h: number, s: number, l: number): string {
  return `hsl(${Math.round(((h % 360) + 360) % 360)}, ${Math.round(s)}%, ${Math.round(l)}%)`;
}

/**
 * Theme for any world index. 1..6 hand-designed; beyond → procedurally
 * generated (hue-rotated, feature-mixed) so the ladder never ends.
 */
export function biomeFor(worldIndex: number): BiomeTheme {
  if (worldIndex <= BIOMES.length) return BIOMES[worldIndex - 1]!;
  const i = worldIndex;
  const h = hash01(i) * 360;
  const NAMES_A = ['Valle', 'Archipiélago', 'Meseta', 'Jardín', 'Cañadón', 'Estepa', 'Laguna', 'Monte'];
  const NAMES_B = ['Aurora', 'Esmeralda', 'Lunar', 'de Cristal', 'Dorado', 'Celeste', 'del Viento', 'Estelar'];
  return {
    name: `${NAMES_A[Math.floor(hash01(i * 7) * NAMES_A.length)]} ${NAMES_B[Math.floor(hash01(i * 13) * NAMES_B.length)]}`,
    ground: hsl(h + 90, 35, 55), grass: hsl(h + 100, 42, 62), leaf: hsl(h + 130, 45, 45),
    leafDeep: hsl(h + 135, 48, 32), accent: hsl(h + 320, 65, 62),
    skyTop: hsl(h + 200, 45, 62), skyHorizon: hsl(h + 60, 40, 90), water: hsl(h + 190, 50, 50),
    features: {
      pond: hash01(i * 3) > 0.35,
      rocks: hash01(i * 5) > 0.3,
      palms: hash01(i * 11) > 0.6,
      snow: hash01(i * 17) > 0.8,
      dunes: hash01(i * 19) > 0.7,
    },
  };
}

// ── Mundo state ─────────────────────────────────────────────────────────────

export interface MundoState {
  /** Structural tier == rank tier (1..11) — drives Pip + cosmetics. */
  rankTier: number;
  /** Ordered list of structural elements present at this tier (legacy render). */
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
  // ── Mundo Infinito (v2) ──
  /** Lifetime scoring completions this state was computed from. */
  completions: number;
  /** Current world index (1-indexed, unbounded). */
  worldIndex: number;
  /** Completions invested in the current world. */
  worldGrowth: number;
  /** Completions needed to complete the current world. */
  worldGoal: number;
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
  /** Lifetime scoring completions (drives Mundo Infinito growth). */
  completionsCount?: number;
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

  const completions = Math.max(0, Math.floor(input.completionsCount ?? 0));
  const wp = worldProgressFromCompletions(completions);

  return {
    rankTier: tier,
    structuralElements: elements,
    liveliness,
    dominantDomain,
    palette: paletteFor(tier, dominantDomain),
    unlockedCosmetics,
    pipStage: pipStageForTier(tier),
    lastComputed: new Date().toISOString(),
    completions,
    worldIndex: wp.worldIndex,
    worldGrowth: wp.worldGrowth,
    worldGoal: wp.worldGoal,
  };
}

/** Safe parse of a stored mundo_state jsonb (with a sensible default). */
export function parseMundoState(raw: unknown): MundoState {
  const fallback = computeMundoState({ totalXp: 0, currentStreak: 0, completionsCount: 0 });
  if (!raw || typeof raw !== 'object') return fallback;
  const r = raw as Partial<MundoState>;
  if (typeof r.rankTier !== 'number' || !Array.isArray(r.structuralElements)) return fallback;
  const merged = { ...fallback, ...r } as MundoState;
  // v1 states have no world fields — derive them from completions (0 if unknown).
  if (typeof (r as Partial<MundoState>).worldIndex !== 'number') {
    const wp = worldProgressFromCompletions(merged.completions ?? 0);
    merged.worldIndex = wp.worldIndex;
    merged.worldGrowth = wp.worldGrowth;
    merged.worldGoal = wp.worldGoal;
  }
  return merged;
}
