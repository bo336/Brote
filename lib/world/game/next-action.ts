/**
 * What a parcel's marker offers right now, and what its tag says.
 *
 * One pure function so the marker, the tag, the objective card and the tests
 * cannot disagree about what "the next thing to do here" is. Order matters:
 * care first (it is today's), then the harvest, then the parcel's own step.
 */
import { CARE, careOf, MAX_SPECIES, starsOf } from './care';
import { MATERIALS } from './materials';
import { fittingHabitats, fittingPlantines, parcelNext, ripe } from './parcel-actions';
import { parcelRegion, type ParcelField, type ParcelSpec } from './parcels';
import { PARCEL_TYPES, PLANTS } from './plants';
import type { GameAction } from './reduce';
import { bagFree } from './state';
import type { GameContext, GameState } from './types';
import { SHOP_BY_SLUG } from './shop';

export interface ParcelOffer {
  /** The button, when there is something to press. */
  action: GameAction | null;
  label: string | null;
  /** The tag: the parcel's name and state, and one line about what it needs. */
  title: string;
  line: string;
  /** Something is asked of the player today (care, ripe fruit, a watering due). */
  urgent: boolean;
}

const STAGE_NAME = ['Silvestre', 'Limpia', 'Suelo vivo', 'Plantada', 'Viva', 'Floreciente'];

export function parcelOffer(s: GameState, field: ParcelField, p: ParcelSpec, ctx: GameContext): ParcelOffer {
  const ps = s.parcels[p.id];
  const stage = ps?.s ?? 0;
  const region = parcelRegion(p, ps, ctx.tier);
  const type = PARCEL_TYPES[region];
  const stars = starsOf(ps);
  const title = `${type.name} · ${STAGE_NAME[stage]}${stars ? ' ' + '★'.repeat(stars) : ''}`;
  const offer = (action: GameAction | null, label: string | null, line: string, urgent = false): ParcelOffer =>
    ({ action, label, title, line, urgent });

  const care = stage >= 4 ? careOf(s, field, p.id, ctx) : null;
  if (care) {
    const c = CARE[care];
    if (care === 'sed' && s.agua < 1) return offer(null, null, `${c.name}: cargá la regadera`, true);
    return offer({ t: 'care', parcel: p.id }, `${c.verb}`, c.name, true);
  }
  if (stage >= 4 && ripe(p.id, ctx) && !s.today.harvested.includes(p.id)) {
    if (bagFree(s) < 1) return offer(null, null, 'Tiene frutos, pero la mochila está llena', true);
    return offer({ t: 'harvest', parcel: p.id }, 'Cosechar', 'Tiene frutos listos', true);
  }

  const next = parcelNext(s, p, ctx);
  switch (next.step) {
    case 'clean':
      return offer(null, null, `Juntá su basura${p.invasive && !ps?.inv ? ' y arrancá la invasora' : ''} (${next.left})`);
    case 'soil': {
      const m = next.material;
      const have = s.bag[m];
      const name = MATERIALS[m].short.toLowerCase();
      if (have > 0) return offer({ t: 'soil', parcel: p.id }, `Poner ${name}`, `Necesita ${next.left} de ${name} (tenés ${have})`);
      return offer(null, null, `Necesita ${next.left} de ${name}`);
    }
    case 'plant': {
      const have = fittingPlantines(s, p, ps!, ctx);
      const names = next.fits.slice(0, 3).map((f) => PLANTS[f]?.name ?? f).join(', ');
      if (have.length) return offer({ t: 'plant', parcel: p.id }, 'Plantar', `Faltan ${next.left} plantines · van: ${names}`);
      return offer(null, null, `Necesita ${next.left} plantines: ${names}`);
    }
    case 'water':
      if (next.left > 0 && !next.today) {
        if (s.agua < 1) return offer(null, null, 'Hoy necesita agua: cargá la regadera', true);
        return offer({ t: 'water', parcel: p.id }, 'Regar', 'Hoy necesita agua', true);
      }
      if (next.left > 0) return offer(null, null, 'Regada hoy. Mañana, otra vez');
      return offer(null, null, next.daysLeft > 1 ? `Crece: faltan ${next.daysLeft} días` : 'Crece: mañana está viva');
    case 'grow': {
      const fresh = fittingPlantines(s, p, ps!, ctx).find((pl) => !ps!.plants.includes(pl));
      if (next.species < next.need && fresh) return offer({ t: 'plant', parcel: p.id }, `Sumar ${PLANTS[fresh]!.name.toLowerCase()}`, `Especies: ${next.species} de ${next.need}`);
      if (next.species < next.need) return offer(null, null, `Para florecer: ${next.need - next.species} especie${next.need - next.species > 1 ? 's' : ''} más`);
      if (next.daysLeft > 0) return offer(null, null, `Florece en ${next.daysLeft} día${next.daysLeft > 1 ? 's' : ''}`);
      const hab = fittingHabitats(s, p, ps!, ctx)[0];
      if (hab) return offer({ t: 'flourish', parcel: p.id }, `Poner ${SHOP_BY_SLUG.get(hab)?.name.toLowerCase() ?? hab}`, 'Lista para florecer');
      const names = next.habitats.map((h) => SHOP_BY_SLUG.get(h)?.name.toLowerCase() ?? h).join(' o ');
      return offer(null, null, `Para florecer: un ${names}`);
    }
    case 'done': {
      if (next.species >= MAX_SPECIES) return offer(null, null, 'Reserva natural');
      const fresh = fittingPlantines(s, p, ps!, ctx).find((pl) => !ps!.plants.includes(pl));
      if (fresh) return offer({ t: 'plant', parcel: p.id }, `Sumar ${PLANTS[fresh]!.name.toLowerCase()}`, `${stars} de 3 estrellas`);
      return offer(null, null, `${stars} de 3 estrellas: más especies nativas la suman`);
    }
  }
}
