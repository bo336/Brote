/**
 * The game's own state — what playing builds (`docs/MUNDO_JUEGO.md` §3).
 *
 * Types only, no runtime. Everything here is **the Cultivar axis**: nothing in
 * this file is ever read by the app, and nothing the app owns (XP, points,
 * `profiles.semillas`) is ever written from it. The Descubrir axis — the rank
 * tier — comes in as a read-only number and decides what this state may contain.
 */
import type { RegionId } from '../types';

// ── Materials ──────────────────────────────────────────────────────────────

/** What goes in the backpack. `agua` lives in the watering can instead. */
export type MaterialId =
  | 'residuos'
  | 'hojas'
  | 'ramas'
  | 'piedras'
  | 'frutos'
  | 'compost'
  | 'plantines'
  | 'reciclado';

/** A piece of litter keeps what it is until it is sorted. */
export type WasteKind =
  | 'botella'
  | 'lata'
  | 'papel'
  | 'carton'
  | 'tetra'
  | 'vidrio'
  | 'bolsa'
  | 'yerba'
  | 'cascara'
  | 'colilla'
  | 'telgopor'
  | 'pila';

/** The three bins of the Punto Limpio (and the fourth, special, for batteries). */
export type BinId = 'reciclable' | 'organico' | 'resto' | 'especial';

// ── Tools ──────────────────────────────────────────────────────────────────

export type ToolId = 'mochila' | 'regadera' | 'guantes';

// ── Stations ───────────────────────────────────────────────────────────────

export type StationId =
  | 'punto_limpio'
  | 'compostera'
  | 'tanque'
  | 'vivero'
  | 'hotel_insectos'
  | 'puente'
  | 'muelle'
  | 'refugio'
  | 'faro';

export interface StationState {
  /** 0 = only a pad; 1..3 built at that level. */
  lvl: number;
  /** Materials already delivered toward the next build or upgrade. */
  paid: Partial<Record<MaterialId, number>>;
  /** Inputs waiting to be processed (hojas for the compostera, frutos for the vivero). */
  queue: number;
  /** Epoch ms the current cycle started; 0 when idle. */
  since: number;
  /** Finished outputs waiting to be collected. */
  out: number;
  /** The vivero raises one species at a time: the one the player picked. */
  pick?: string;
}

// ── Parcels ────────────────────────────────────────────────────────────────

/**
 * 0 silvestre · 1 limpia · 2 suelo vivo · 3 plantada · 4 viva · 5 floreciente.
 * Only ever goes up. Absence never moves it back (`11-GAME-LOOP.md` §6).
 */
export type ParcelStage = 0 | 1 | 2 | 3 | 4 | 5;

export interface ParcelState {
  s: ParcelStage;
  /** Litter pieces of this parcel already picked, as a bitmask. */
  lit: number;
  /** The invasive plant has been pulled (only meaningful where there is one). */
  inv: boolean;
  /** How much of the current stage's input has been delivered. */
  n: number;
  /** Plants set in this parcel, by plant id (for diversity and for the look). */
  plants: string[];
  /** Local days (`dayIndex`) it was watered while planted. */
  wet: number[];
  /** Epoch ms of the last stage change, for the growth wave and "new" cues. */
  at: number;
  /** Local day index the current stage began — plants grow in days, not in clicks. */
  d?: number;
  /** The habitat item set here when it flourished. */
  hab?: string;
  /**
   * The region it was first worked as. Fixed from then on, so discovering a
   * new region next door never turns your restored meadow into something else.
   */
  r?: RegionId;
}

// ── Missions ───────────────────────────────────────────────────────────────

export interface DailyState {
  /** Local date `YYYY-MM-DD` these belong to. */
  day: string;
  ids: string[];
  prog: number[];
  claimed: boolean[];
  bonus: boolean;
}

export interface MissionState {
  /** Per chain: index of the current (unfinished) mission. */
  chain: Record<string, number>;
  /** Progress counters of the current mission of each chain. */
  prog: Record<string, number>;
  /** Chains whose opening talk has happened (the "!" over the character is gone). */
  met: string[];
  daily: DailyState;
}

// ── Today's world ──────────────────────────────────────────────────────────

/** What resets every local day. */
export interface TodayState {
  day: string;
  /** Daily spawns already picked, by spawn id. */
  picked: string[];
  /** Plants harvested today, by parcel id. */
  harvested: string[];
  /** Semillas earned today — capped, here and on the server. */
  earned: number;
  /** Parcels looked after today (their daily care is done). */
  cared?: string[];
}

// ── The whole save ─────────────────────────────────────────────────────────

export const GAME_STATE_VERSION = 1;

/** Plain counts for the bulk materials. */
export type BulkMaterial = Exclude<MaterialId, 'residuos' | 'plantines'>;

export type Bag = Record<BulkMaterial, number> & {
  residuos: WasteKind[];
  /** Seedlings by plant id. */
  plantines: Record<string, number>;
};

export interface GameState {
  v: number;
  /** Semillas of the WORLD. Balance = earned − spent. Never the app's. */
  sem: { earned: number; spent: number };
  /**
   * The backpack. Litter keeps its kind until it is sorted, and a seedling
   * keeps its species until it is planted — a parcel wants the right plants.
   */
  bag: Bag;
  /** Water in the watering can. */
  agua: number;
  tools: Record<ToolId, number>;
  stations: Partial<Record<StationId, StationState>>;
  parcels: Record<string, ParcelState>;
  missions: MissionState;
  today: TodayState;
  /** Decor and habitat items owned but not necessarily placed. */
  inv: Record<string, number>;
  /** Knowledge cards learned, by id. */
  know: string[];
  /** Lifetime counters — for missions, the Guide and the collection rewards. */
  stats: Record<string, number>;
  /** The highest rank tier and division whose discoveries were shown. */
  seen: { tier: number; div: number };
  /** Species logged in the Bitácora, for the census rewards the world pays. */
  census: string[];
  /** Epoch ms of the last save, for offline production. */
  savedAt: number;
}

// ── What the world hands the reducer ───────────────────────────────────────

/** The read-only facts the reducer needs and must never invent. */
export interface GameContext {
  /** Epoch ms. The reducer never reads a clock. */
  now: number;
  /** Local date `YYYY-MM-DD` (America/Argentina/Buenos_Aires). */
  day: string;
  /** The rank tier, 1..11 — the Descubrir axis. */
  tier: number;
  /** The division inside the tier, 1..5. */
  div: number;
  /** Whose island — seeds the daily draws, so every device sees the same day. */
  who: string;
}

/** Everything that happened, for missions, feedback and the Guide. */
export type GameEvent =
  | { type: 'pickup'; material: MaterialId; waste?: WasteKind; n: number }
  | { type: 'sorted'; waste: WasteKind; bin: BinId; right: boolean }
  | { type: 'deposited'; station: StationId; material: MaterialId; n: number }
  | { type: 'built'; station: StationId; lvl: number }
  | { type: 'collected'; station: StationId; material: MaterialId | 'agua'; n: number }
  | { type: 'stage'; parcel: string; region: RegionId; stage: ParcelStage }
  | { type: 'planted'; parcel: string; plant: string; n: number }
  | { type: 'watered'; parcel: string }
  | { type: 'harvested'; parcel: string; n: number }
  | { type: 'pulled'; parcel: string }
  | { type: 'bought'; item: string }
  | { type: 'earned'; n: number; why: string }
  | { type: 'mission'; id: string; chain: string | null }
  | { type: 'learned'; card: string }
  | { type: 'logged'; species: string }
  | { type: 'fished'; species: string }
  | { type: 'filled'; n: number }
  | { type: 'visited'; region: RegionId }
  | { type: 'talked'; who: string }
  | { type: 'delivered'; station: StationId; material: MaterialId }
  | { type: 'gift'; from: string; what: string }
  | { type: 'cared'; parcel: string; kind: string }
  | { type: 'star'; parcel: string; stars: number }
  | { type: 'refused'; why: RefusalReason; need?: Partial<Record<MaterialId | 'agua' | 'semillas', number>> };

/** Why an action did nothing. The UI turns each into one short line. */
export type RefusalReason =
  | 'bag_full'
  | 'missing'
  | 'not_now'
  /** A build the story has not asked for yet. */
  | 'later'
  | 'locked'
  | 'nothing_ready'
  | 'already_today'
  | 'poor';
