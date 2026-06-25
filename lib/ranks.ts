/**
 * The rank ladder (BUILD_SPEC §5): 11 ranks × 5 divisions = 55 progression steps.
 * Themed on growth from a seed to a living planet. XP only ever increases, so a
 * rank never drops. Division V is the highest within a rank.
 *
 * This module is shared by the server (the `complete_activity` RPC recomputes
 * rank/division on every XP change) and the client (display). Keep the math
 * identical on both sides.
 */
export interface RankDef {
  tier: number;
  slug: string;
  name_es: string;
  name_en: string;
  /** Cumulative XP required to ENTER this rank (reach division I). */
  enterAt: number;
  color: string;
  unlock_es: string;
}

export const RANKS: RankDef[] = [
  {
    tier: 1,
    slug: 'semilla',
    name_es: 'Semilla',
    name_en: 'Seed',
    enterAt: 0,
    color: '#A38B6D',
    unlock_es: 'Tu mundo arranca: tierra desnuda y Pip.',
  },
  {
    tier: 2,
    slug: 'brote',
    name_es: 'Brote',
    name_en: 'Sprout',
    enterAt: 1_000,
    color: '#9CC93B',
    unlock_es: 'Aparece el primer pasto y un brote. Primer espacio para un título.',
  },
  {
    tier: 3,
    slug: 'plantula',
    name_es: 'Plántula',
    name_en: 'Seedling',
    enterAt: 3_000,
    color: '#6FBF73',
    unlock_es: 'Aparecen flores. Podés crear proyectos comunitarios.',
  },
  {
    tier: 4,
    slug: 'retono',
    name_es: 'Retoño',
    name_en: 'Shoot',
    enterAt: 7_000,
    color: '#3CB371',
    unlock_es: 'Tu primer arbolito. Se habilitan funciones de amigos.',
  },
  {
    tier: 5,
    slug: 'arbusto',
    name_es: 'Arbusto',
    name_en: 'Shrub',
    enterAt: 15_000,
    color: '#1FB57A',
    unlock_es: 'Arbustos y la primera ave visita tu mundo.',
  },
  {
    tier: 6,
    slug: 'arbol',
    name_es: 'Árbol',
    name_en: 'Tree',
    enterAt: 30_000,
    color: '#0E7A52',
    unlock_es: 'Un árbol completo. Acceso a desafíos exclusivos (rango ≥6).',
  },
  {
    tier: 7,
    slug: 'bosque',
    name_es: 'Bosque',
    name_en: 'Grove',
    enterAt: 60_000,
    color: '#2DB4D4',
    unlock_es: 'Un pequeño bosque, un estanque y más fauna.',
  },
  {
    tier: 8,
    slug: 'guardian',
    name_es: 'Guardián',
    name_en: 'Guardian',
    enterAt: 120_000,
    color: '#1E88A8',
    unlock_es: 'Aura de Guardián para Pip. Proyectos exclusivos (rango ≥8).',
  },
  {
    tier: 9,
    slug: 'ecosistema',
    name_es: 'Ecosistema',
    name_en: 'Ecosystem',
    enterAt: 250_000,
    color: '#5B6CF0',
    unlock_es: 'Un bioma rico: varios animales, agua y estructuras.',
  },
  {
    tier: 10,
    slug: 'planeta',
    name_es: 'Planeta',
    name_en: 'Planet',
    enterAt: 500_000,
    color: '#B07CD6',
    unlock_es: 'Tu mundo se vuelve un pequeño planeta vivo (vista globo).',
  },
  {
    tier: 11,
    slug: 'gaia',
    name_es: 'Gaia',
    name_en: 'Gaia',
    enterAt: 1_000_000,
    color: '#FFB23E',
    unlock_es: 'Estatus legendario, mundo dorado y un título legendario exclusivo.',
  },
];

export const RANK_BY_SLUG: Record<string, RankDef> = Object.fromEntries(
  RANKS.map((r) => [r.slug, r]),
);

export const RANK_BY_TIER: Record<number, RankDef> = Object.fromEntries(
  RANKS.map((r) => [r.tier, r]),
);

/** Divisions per rank. Display uses roman numerals I..V (V is highest). */
export const DIVISIONS_PER_RANK = 5;
/** For Gaia (no next rank) divisions advance every this-many XP, cosmetic only. */
const GAIA_DIVISION_STEP = 250_000;

export interface RankProgress {
  rankSlug: string;
  rankName: string;
  rankColor: string;
  tier: number;
  /** 1..5 (1 = just entered the rank, 5 = top division). */
  division: number;
  /** XP accumulated since entering the current division. */
  xpIntoDivision: number;
  /** Total XP the current division spans. */
  xpForDivision: number;
  /** XP accumulated since entering the current rank. */
  xpIntoRank: number;
  /** 0..1 progress to the next rank (across all 5 divisions). */
  progressToNextRankPct: number;
  /** 0..1 progress to the next division. */
  progressToNextDivisionPct: number;
  /** Slug of the next rank, or null if at Gaia. */
  nextRankSlug: string | null;
  /** XP needed to reach the next division boundary (0 if maxed cosmetic). */
  xpToNextDivision: number;
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V'];

/** Format like "Brote III". */
export function formatRank(rankName: string, division: number): string {
  const roman = ROMAN[Math.min(Math.max(division - 1, 0), 4)] ?? 'I';
  return `${rankName} ${roman}`;
}

export function divisionRoman(division: number): string {
  return ROMAN[Math.min(Math.max(division - 1, 0), 4)] ?? 'I';
}

/**
 * Division boundaries within a rank span [enter, nextEnter):
 *   enter + floor((nextEnter - enter) * d / 5) for d in 0..4.
 * Division d (1-indexed) starts at offset d-1.
 */
export function getRank(totalXp: number): RankProgress {
  const xp = Math.max(0, Math.floor(totalXp));

  // Find the current rank: highest rank whose enterAt <= xp.
  let current = RANKS[0]!;
  for (const r of RANKS) {
    if (xp >= r.enterAt) current = r;
    else break;
  }

  const next = RANK_BY_TIER[current.tier + 1] ?? null;

  if (!next) {
    // Gaia (or beyond): cosmetic divisions every GAIA_DIVISION_STEP.
    const beyond = xp - current.enterAt;
    const div = Math.min(5, 1 + Math.floor(beyond / GAIA_DIVISION_STEP));
    const xpIntoDivision = beyond % GAIA_DIVISION_STEP;
    return {
      rankSlug: current.slug,
      rankName: current.name_es,
      rankColor: current.color,
      tier: current.tier,
      division: div,
      xpIntoDivision,
      xpForDivision: GAIA_DIVISION_STEP,
      xpIntoRank: beyond,
      progressToNextRankPct: 1,
      progressToNextDivisionPct: Math.min(1, xpIntoDivision / GAIA_DIVISION_STEP),
      nextRankSlug: null,
      xpToNextDivision: div >= 5 ? 0 : GAIA_DIVISION_STEP - xpIntoDivision,
    };
  }

  const span = next.enterAt - current.enterAt;
  const xpIntoRank = xp - current.enterAt;

  // Division boundaries (offsets from rank entry).
  const boundaries: number[] = [];
  for (let d = 0; d < DIVISIONS_PER_RANK; d++) {
    boundaries.push(Math.floor((span * d) / DIVISIONS_PER_RANK));
  }
  boundaries.push(span); // upper bound (= next rank entry)

  // Find division: largest d with boundaries[d] <= xpIntoRank.
  let division = 1;
  for (let d = 0; d < DIVISIONS_PER_RANK; d++) {
    if (xpIntoRank >= boundaries[d]!) division = d + 1;
  }

  const divStart = boundaries[division - 1]!;
  const divEnd = boundaries[division]!;
  const xpForDivision = Math.max(1, divEnd - divStart);
  const xpIntoDivision = xpIntoRank - divStart;

  return {
    rankSlug: current.slug,
    rankName: current.name_es,
    rankColor: current.color,
    tier: current.tier,
    division,
    xpIntoDivision,
    xpForDivision,
    xpIntoRank,
    progressToNextRankPct: Math.min(1, xpIntoRank / span),
    progressToNextDivisionPct: Math.min(1, xpIntoDivision / xpForDivision),
    nextRankSlug: next.slug,
    xpToNextDivision: Math.max(0, divEnd - xpIntoRank),
  };
}

/** True if a user with `totalXp` meets the `min_rank_slug` gate. */
export function meetsRank(totalXp: number, minRankSlug: string | null | undefined): boolean {
  if (!minRankSlug || minRankSlug === 'semilla') return true;
  const need = RANK_BY_SLUG[minRankSlug];
  if (!need) return true;
  return getRank(totalXp).tier >= need.tier;
}
