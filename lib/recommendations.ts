/**
 * Orden del catálogo para una persona (BUILD_SPEC §10.2, docs/ACCIONES.md §5).
 *
 * El set del día lo arma la base; esto ordena la biblioteca entera en el
 * cliente con las MISMAS reglas (lib/acciones/reglas.ts): qué le sirve a esta
 * persona hoy (edad, contexto, estación, región, día) y con qué señales
 * (interés, temas poco explorados, nueva, de temporada, pide algo que tiene,
 * impacto). Lo que no le sirve no desaparece: queda abajo y marcado, para
 * quien quiera explorar todo. Puro y determinista.
 */
import type { ActivityRow } from '@/lib/supabase/rows';
import { meetsRank, getRank, RANK_BY_SLUG } from '@/lib/ranks';
import { getDomainName, type DomainSlug } from '@/lib/domains';
import {
  apta,
  contextoEfectivo,
  estacionDe,
  regionDe,
  CONTEXTO_POR_CLAVE,
  ESTACION_ES,
  type AccionReglas,
  type ContextoClave,
  type MotivoNoApta,
  type PerfilReglas,
  type TipoCuenta,
} from '@/lib/acciones/reglas';

export interface ScoreContext {
  interests: string[];
  totalXp: number;
  /** domain slug -> points (under-explored domains get a variety boost). */
  domainPoints: Partial<Record<DomainSlug, number>>;
  /** activity ids the user has already completed (honor/verified). */
  completedIds: Set<string>;
  /** Contexto de la persona (profiles.context): balcón, bici, auto… */
  personal?: Record<string, unknown> | null;
  cuenta?: TipoCuenta;
  /** profiles.city: la provincia, para la región. */
  provincia?: string | null;
  /** Para estación y día de la semana (por omisión, ahora). */
  hoy?: Date;
}

export interface ScoredActivity {
  activity: ActivityRow;
  score: number;
  reason: string;
  locked: boolean;
  /** Le sirve hoy a esta persona (contexto, estación, región, día). */
  apta: boolean;
  motivoNoApta?: MotivoNoApta;
}

const IMPACT_WEIGHT = { low: 1, medium: 2, high: 3 } as const;

/** Lo que reglas.apta necesita de una fila de `activities`. */
export function comoReglas(a: ActivityRow): AccionReglas {
  return {
    id: a.id,
    type: a.type,
    domain_slug: a.domain_slug,
    impact: a.impact,
    min_rank_tier: RANK_BY_SLUG[a.min_rank_slug]?.tier ?? 1,
    age_groups: a.age_groups ?? ['kid', 'teen', 'adult'],
    minutos: a.minutos ?? 5,
    requiere: a.requiere ?? [],
    estaciones: a.estaciones ?? [],
    regiones: a.regiones ?? [],
    dias: a.dias ?? null,
    tags: a.tags ?? [],
  };
}

export function perfilReglas(ctx: ScoreContext): PerfilReglas {
  const hoy = ctx.hoy ?? new Date();
  const cuenta = ctx.cuenta ?? 'adult';
  return {
    cuenta,
    tier: getRank(ctx.totalXp).tier,
    ctx: contextoEfectivo(ctx.personal ?? {}, cuenta),
    region: regionDe(ctx.provincia),
    estacion: estacionDe(hoy),
    dow: hoy.getDay(),
    intereses: ctx.interests,
  };
}

/** Score one activity. Higher = better fit. */
function scoreOne(a: ActivityRow, ctx: ScoreContext, p: PerfilReglas) {
  const locked = !meetsRank(ctx.totalXp, a.min_rank_slug);
  const r = comoReglas(a);
  const ap = apta({ ...r, min_rank_tier: 1 }, p); // el rango se muestra como candado, no se esconde
  let score = 0;
  let reason = '';

  if (ctx.interests.includes(a.domain_slug)) {
    score += 40;
    reason = `Porque te interesa ${getDomainName(a.domain_slug)}`;
  }
  const dp = ctx.domainPoints[a.domain_slug] ?? 0;
  if (dp < 500) score += 12;
  if (ctx.completedIds.has(a.id)) score -= 30;
  else score += 8;

  // Pide algo que tenés: "porque tenés bici" le gana a cualquier señal genérica.
  if (ap.ok && r.requiere.length > 0) {
    score += 30;
    reason = CONTEXTO_POR_CLAVE[r.requiere[0] as ContextoClave]?.porque ?? reason;
  } else if (ap.ok && r.estaciones.length > 0) {
    score += 15;
    if (!reason) reason = `Ideal en ${ESTACION_ES[p.estacion]}`;
  }

  score += IMPACT_WEIGHT[a.impact] * 5;

  // Rampa de esfuerzo por progreso: al principio lo fácil, después lo que cuesta más.
  const tier = p.tier;
  if (tier <= 2) {
    if (a.effort === 'easy') score += 8;
    else if (a.effort === 'medium') score += 2;
    else score -= 6;
  } else if (tier <= 5) {
    if (a.effort === 'easy') score += 4;
    else if (a.effort === 'medium') score += 6;
  } else {
    if (a.effort === 'medium') score += 4;
    else if (a.effort === 'hard') score += 8;
  }

  if (a.is_featured) {
    score += 20;
    if (!reason) reason = 'Nueva esta semana';
  }
  if (locked) score -= 50;
  // Lo que hoy no te sirve queda al final, nunca arriba.
  if (!ap.ok) score -= 200;

  if (!reason) {
    if (a.impact === 'high') reason = 'Alto impacto';
    else if (dp < 500) reason = 'Algo nuevo para explorar';
    else reason = 'Recomendado para vos';
  }
  score -= a.sort_order * 0.01;
  return { score, reason, locked, apta: ap.ok, motivoNoApta: ap.ok ? undefined : ap.motivo };
}

export function scoreActivities(activities: ActivityRow[], ctx: ScoreContext): ScoredActivity[] {
  const p = perfilReglas(ctx);
  return activities
    .filter((a) => !(a.tags ?? []).includes('interno'))
    .map((activity) => ({ activity, ...scoreOne(activity, ctx, p) }))
    .sort((a, b) => b.score - a.score);
}

/** Label for an activity's required rank (used by lock badges). */
export function lockLabel(minRankSlug: string): string {
  return RANK_BY_SLUG[minRankSlug]?.name_es ?? minRankSlug;
}

/** Por qué una acción no aparece para vos, en palabras. */
export function motivoNoAptaTexto(m: MotivoNoApta | undefined, a: ActivityRow): string | null {
  switch (m) {
    case 'contexto': {
      const k = (a.requiere ?? [])[0] as ContextoClave | undefined;
      return k && CONTEXTO_POR_CLAVE[k] ? `Para quien tiene ${CONTEXTO_POR_CLAVE[k].label.toLowerCase()}` : 'Pide algo que no marcaste';
    }
    case 'estacion':
      return 'Es de otra época del año';
    case 'region':
      return 'Es de otra región';
    case 'dia':
      return a.dias === 'finde' ? 'Es para el fin de semana' : 'Es para un día de semana';
    case 'edad':
      return 'No es para tu tipo de cuenta';
    default:
      return null;
  }
}
