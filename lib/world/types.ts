/**
 * Types only. No runtime code lives in this file — importing it must never pull
 * a byte into a bundle (`17-FILE-MANIFEST.md`).
 */
import type { DomainSlug } from '../domains';

// ── Identity unions ─────────────────────────────────────────────────────────

/** The nine named regions of the island (`08-WORLD-AND-PROGRESSION.md` §1). */
export type RegionId =
  | 'claro'
  | 'pradera'
  | 'jardin'
  | 'arboleda'
  | 'rio'
  | 'monte'
  | 'cumbre'
  | 'islote'
  | 'monumento';

/** Structural features a tier can switch on. */
export type FeatureId =
  | 'river'
  | 'pond'
  | 'puddle'
  | 'bridge'
  | 'waterfall'
  | 'mountain'
  | 'cave'
  | 'snow'
  | 'treehouse'
  | 'hammock'
  | 'boat'
  | 'telescope'
  | 'monument'
  | 'aurora'
  | 'nest'
  | 'bench'
  | 'mojon'
  | 'compost'
  | 'islet';

/** The sixteen verbs. Every tier grants at least one (`05-VISION.md` pillar 3). */
export type VerbId =
  | 'walk'
  | 'plant'
  | 'water'
  | 'log'
  | 'climb'
  | 'forage'
  | 'glide'
  | 'rest'
  | 'swim'
  | 'fish'
  | 'scale'
  | 'cave'
  | 'track'
  | 'sail'
  | 'observe'
  | 'mentor';

/** The movement/verb state machine's states (`10-CONTROLS-AND-CAMERA.md` §2.8). */
export type PlayerState =
  | 'idle'
  | 'walk'
  | 'run'
  | 'swim'
  | 'climb'
  | 'glide'
  | 'rest'
  | 'interact'
  | 'cutscene';

export type SpeciesId = string;
export type PropId = string;
export type ChoreId = string;
export type EventId = 'incendio' | 'creciente' | 'nido' | 'residuos' | 'sequia' | 'visitante';

export type TimeOfDay = 'amanecer' | 'dia' | 'atardecer' | 'noche';
export type SeasonId = 'verano' | 'otono' | 'invierno' | 'primavera';
export type QualityTier = 0 | 1 | 2 | 3;
export type BiomeKind = 'pradera' | 'bosque' | 'costa' | 'desierto' | 'selva' | 'tundra';

// ── World configuration ─────────────────────────────────────────────────────

/** Everything unlocked *at* one tier — the delta, not the total. */
export interface TierUnlock {
  tier: number;
  regions: RegionId[];
  features: FeatureId[];
  verbs: VerbId[];
  species: SpeciesId[];
  props: PropId[];
  /** i18n key for the ceremony line, e.g. `mundo.tierup.t7`. */
  copyKey: string;
}

/**
 * The cumulative state at a tier. Together with `(userId, seed)` this is the
 * ONLY input to world generation — which is what makes progression testable
 * without a renderer.
 */
export interface WorldConfig {
  tier: number;
  radius: number;
  regions: RegionId[];
  features: FeatureId[];
  verbs: VerbId[];
  species: SpeciesId[];
  props: PropId[];
}

// ── Species ─────────────────────────────────────────────────────────────────

export type SpeciesKind =
  | 'planta'
  | 'arbol'
  | 'arbusto'
  | 'insecto'
  | 'ave'
  | 'pez'
  | 'anfibio'
  | 'mamifero'
  | 'reptil'
  | 'hongo'
  | 'mineral'
  | 'alga'
  | 'crustaceo'
  | 'fenomeno'
  | 'estructura'
  | 'rastro'
  | 'astro';

/** One row of the catalogue. Maps 1:1 to `world_species` (`15-DATA-MODEL.md` §3). */
export interface SpeciesRow {
  slug: SpeciesId;
  name_es: string;
  blurb_es: string;
  kind: SpeciesKind;
  region: RegionId;
  min_tier: number;
  time_of_day: TimeOfDay[];
  rarity: 1 | 2 | 3 | 4;
  domain_slug: DomainSlug;
}

// ── Placement, journal, cosmetics ───────────────────────────────────────────

export interface Placement {
  id?: string;
  prop_slug: PropId;
  region: RegionId;
  x: number;
  z: number;
  rot_y: number;
  variant: number;
}

export interface JournalEntry {
  species_slug: SpeciesId;
  first_seen_at: string;
  region: RegionId;
  time_of_day: TimeOfDay;
  count: number;
}

export interface PipCosmetics {
  body?: string;
  hat?: string;
  glasses?: string;
  pattern?: string;
}

// ── Impact mirror ───────────────────────────────────────────────────────────

export interface ImpactTotals {
  water_l: number;
  co2_kg: number;
  waste_kg: number;
  energy_kwh: number;
  actions?: number;
}

/**
 * The scene reads these as uniforms and instance counts. It does not know what
 * an impact metric is (`13-IMPACT-MIRROR.md` §6).
 */
export interface MirrorParams {
  riverWidth: number;
  riverFlow: number;
  waterfallGain: number;
  pondArea: number;
  fogDensity: number;
  fogFar: number;
  skySaturation: number;
  debrisCount: number;
  compostScale: number;
  lanternCount: number;
  fireflyCount: number;
  auroraIntensity: number;
  windmillRPM: number;
}

// ── Runtime plumbing ────────────────────────────────────────────────────────

export interface Interactable {
  id: string;
  position: [number, number, number];
  radius: number;
  /** i18n key, never a literal string. */
  labelKey: string;
  verb: VerbId;
  enabled: boolean;
}

export interface ProjectMarker {
  id: string;
  title: string;
  place: string | null;
  date: string;
  x: number;
  z: number;
}

/** Everything `/mundo` needs, fetched in one RPC round trip. */
export interface WorldPayload {
  userId: string;
  seed: number;
  pip: PipCosmetics;
  ownedCosmetics: string[];
  semillas: number;
  impact: ImpactTotals;
  collectiveWaterL: number;
  placements: Placement[];
  journal: JournalEntry[];
  pendingCeremonies: number[];
  projectMarkers: ProjectMarker[];
  dueReviews: number;
}
