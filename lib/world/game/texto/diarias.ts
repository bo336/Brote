/**
 * The daily pool. Three are drawn each local day from the ones this island can
 * actually do today (`can`), so a daily is never a dead end — "regá dos
 * parcelas" is only offered when something is planted or about to be.
 *
 * Counts grow a little with the rank tier: a bigger island has more lying
 * around, and the same thirty minutes cover the same share of it.
 */
import type { DailyDef, MissionWorld } from '../missions';
import type { GameContext, GameState } from '../types';

const built = (s: GameState, id: keyof GameState['stations']) => (s.stations[id]?.lvl ?? 0) >= 1;
const anyStage = (s: GameState, stage: number) => Object.values(s.parcels).some((p) => p.s === stage);
const anyAtLeast = (s: GameState, stage: number, n = 1) => Object.values(s.parcels).filter((p) => p.s >= stage).length >= n;
/** Wild parcels this rank can work, optionally only the ones with an invasive still standing. */
const wild = (s: GameState, ctx: GameContext, w: MissionWorld, invasive = false) =>
  w.field.parcels.some((p) => p.tier <= ctx.tier && (s.parcels[p.id]?.s ?? 0) === 0 && (!invasive || (p.invasive && !s.parcels[p.id]?.inv)));
const grow = (base: number, per: number, cap: number) => (tier: number) => Math.min(cap, base + Math.floor((tier - 1) * per));

export const DAILIES: DailyDef[] = [
  { id: 'd.residuos', title: 'Juntá {n} residuos', match: { type: 'pickup', material: 'residuos' }, n: grow(8, 0.6, 14), target: { to: 'spawn', kind: 'residuos' }, minTier: 1 },
  { id: 'd.hojas', title: 'Juntá {n} orgánicos', match: { type: 'pickup', material: 'hojas' }, n: grow(8, 0.5, 14), target: { to: 'spawn', kind: 'hojas' }, minTier: 1 },
  { id: 'd.ramas', title: 'Juntá {n} ramas secas', match: { type: 'pickup', material: 'ramas' }, n: grow(6, 0.4, 10), target: { to: 'spawn', kind: 'ramas' }, minTier: 1 },
  { id: 'd.piedras', title: 'Juntá {n} piedras', match: { type: 'pickup', material: 'piedras' }, n: grow(5, 0.4, 9), target: { to: 'spawn', kind: 'piedras' }, minTier: 1 },
  {
    id: 'd.separar', title: 'Separá {n} residuos sin errores', match: { type: 'sorted', right: true }, n: grow(6, 0.4, 10),
    target: { to: 'station', id: 'punto_limpio' }, minTier: 1, can: (s) => built(s, 'punto_limpio'),
  },
  {
    id: 'd.reciclables', title: 'Separá {n} reciclables', match: { type: 'sorted', bin: 'reciclable', right: true }, n: grow(5, 0.3, 8),
    target: { to: 'station', id: 'punto_limpio' }, minTier: 1, can: (s) => built(s, 'punto_limpio'),
  },
  {
    id: 'd.organicos', title: 'Separá {n} orgánicos para compostar', match: { type: 'sorted', bin: 'organico', right: true }, n: grow(3, 0.2, 5),
    target: { to: 'station', id: 'punto_limpio' }, minTier: 1, can: (s) => built(s, 'punto_limpio'),
  },
  {
    id: 'd.compostera', title: 'Cargá la compostera con {n} orgánicos', match: { type: 'deposited', station: 'compostera' }, n: grow(6, 0.5, 12),
    target: { to: 'station', id: 'compostera' }, minTier: 1, can: (s) => built(s, 'compostera'),
  },
  {
    id: 'd.compost', title: 'Retirá {n} de compost', match: { type: 'collected', station: 'compostera' }, n: grow(2, 0.3, 5),
    target: { to: 'station', id: 'compostera' }, minTier: 1, can: (s) => built(s, 'compostera'),
  },
  {
    id: 'd.plantines', title: 'Criá {n} plantines en el vivero', match: { type: 'collected', station: 'vivero' }, n: grow(2, 0.2, 4),
    target: { to: 'station', id: 'vivero' }, minTier: 1, can: (s) => built(s, 'vivero') && anyAtLeast(s, 4),
  },
  {
    id: 'd.agua', title: 'Cargá {n} de agua en la regadera', match: { type: 'collected', station: 'tanque' }, n: grow(3, 0.2, 6),
    target: { to: 'station', id: 'tanque' }, minTier: 1, can: (s) => built(s, 'tanque'),
  },
  {
    id: 'd.regar', title: 'Regá {n} parcelas', match: { type: 'watered' }, n: () => 1,
    target: { to: 'parcel', stage: 3 }, minTier: 1, can: (s) => built(s, 'tanque') && (anyStage(s, 3) || anyStage(s, 2)),
  },
  {
    id: 'd.plantar', title: 'Plantá {n} plantines', match: { type: 'planted' }, n: grow(2, 0.2, 4),
    target: { to: 'parcel', stage: 2 }, minTier: 1, can: (s) => anyStage(s, 2) || anyStage(s, 1) || anyStage(s, 4),
  },
  {
    id: 'd.cosechar', title: 'Cosechá {n} parcelas vivas', match: { type: 'harvested' }, n: grow(2, 0.3, 5),
    target: { to: 'parcel', stage: 4 }, minTier: 1, can: (s) => anyAtLeast(s, 4, 2),
  },
  {
    id: 'd.limpiar', title: 'Limpiá una parcela silvestre', match: { type: 'stage', stage: 1 }, n: () => 1,
    target: { to: 'parcel', stage: 0 }, minTier: 1, can: (s, ctx, w) => wild(s, ctx, w),
  },
  {
    id: 'd.arrancar', title: 'Arrancá {n} invasoras', match: { type: 'pulled' }, n: () => 1,
    target: { to: 'parcel', stage: 0 }, minTier: 1, can: (s, ctx, w) => wild(s, ctx, w, true),
  },
  {
    id: 'd.suelo', title: 'Dejá {n} parcela con suelo vivo', match: { type: 'stage', stage: 2 }, n: () => 1,
    target: { to: 'parcel', stage: 1 }, minTier: 1, can: (s) => built(s, 'compostera'),
  },
  {
    id: 'd.florecer', title: 'Hacé florecer una parcela', match: { type: 'stage', stage: 5 }, n: () => 1,
    target: { to: 'parcel', stage: 4 }, minTier: 2, can: (s) => anyStage(s, 4),
  },
  { id: 'd.registrar', title: 'Registrá {n} especies en la Bitácora', match: { type: 'logged' }, n: grow(1, 0.15, 3), target: { to: 'none' }, minTier: 2 },
  { id: 'd.pescar', title: 'Pescá {n} veces', match: { type: 'fished' }, n: grow(1, 0.1, 2), target: { to: 'region', id: 'rio' }, minTier: 7 },
  {
    id: 'd.obra', title: 'Llevá {n} materiales a una obra', match: { type: 'delivered' }, n: grow(8, 0.5, 14),
    target: { to: 'none' }, minTier: 1,
  },
  { id: 'd.charla', title: 'Hablá con alguien de la isla', match: { type: 'talked' }, n: () => 1, target: { to: 'none' }, minTier: 1 },
  { id: 'd.frutos', title: 'Juntá {n} frutos', match: { type: 'pickup', material: 'frutos' }, n: grow(3, 0.3, 6), target: { to: 'parcel', stage: 4 }, minTier: 1, can: (s) => anyAtLeast(s, 4, 2) },
  { id: 'd.pradera', title: 'Pasá por La Pradera', match: { type: 'visited', region: 'pradera' }, n: () => 1, target: { to: 'region', id: 'pradera' }, minTier: 2 },
  { id: 'd.jardin', title: 'Pasá por El Jardín', match: { type: 'visited', region: 'jardin' }, n: () => 1, target: { to: 'region', id: 'jardin' }, minTier: 3 },
  { id: 'd.arboleda', title: 'Pasá por La Arboleda', match: { type: 'visited', region: 'arboleda' }, n: () => 1, target: { to: 'region', id: 'arboleda' }, minTier: 4 },
  { id: 'd.tienda', title: 'Comprá algo en la Tienda', match: { type: 'bought' }, n: () => 1, target: { to: 'none' }, minTier: 1 },
  {
    id: 'd.cuidar', title: 'Cuidá {n} parcelas que lo necesitan', match: { type: 'cared' }, n: grow(2, 0.2, 4),
    target: { to: 'parcel', stage: 4 }, minTier: 1, can: (s) => anyAtLeast(s, 4, 4),
  },
  {
    id: 'd.estrella', title: 'Sumá una especie a una parcela floreciente', match: { type: 'star' }, n: () => 1,
    target: { to: 'parcel', stage: 5 }, minTier: 2, can: (s) => anyStage(s, 5),
  },
  {
    id: 'd.avanzar', title: 'Hacé avanzar {n} parcelas una etapa', match: { type: 'stage' }, n: grow(2, 0.2, 4),
    target: { to: 'parcel', stage: 0 }, minTier: 1, can: (s, ctx, w) => wild(s, ctx, w) || anyStage(s, 1) || anyStage(s, 2),
  },
];
