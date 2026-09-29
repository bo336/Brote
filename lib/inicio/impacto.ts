/**
 * Inicio · el impacto real, en piezas que la pantalla puede mostrar.
 *
 * Todo sale de los números de `activities` (lo que ahorra UNA vez hacer esa
 * acción) y de `brote_user_impact` / `brote_user_impact_since`, que suman
 * sólo `activity_completions` válidas. Nada de acá inventa ni redondea hacia
 * arriba: si una acción no tiene un número, la fila no muestra ninguno.
 */
import {
  BENCHMARKS,
  EMPTY_IMPACT,
  formatCo2,
  formatEnergy,
  formatWaste,
  formatWater,
  type ImpactTotals,
} from '../impact';

export type Metrica = 'water' | 'co2' | 'waste' | 'energy';

export const METRICAS: {
  key: Metrica;
  campo: keyof Pick<ImpactTotals, 'water_l' | 'co2_kg' | 'waste_kg' | 'energy_kwh'>;
  /** "Agua ahorrada" — the label under the big number. */
  label: string;
  /** "de agua" — for a sentence ("≈ 70 L de agua"). */
  de: string;
  color: string;
  formato: (n: number) => string;
}[] = [
  { key: 'water', campo: 'water_l', label: 'Agua ahorrada', de: 'de agua', color: '#2DB4D4', formato: formatWater },
  { key: 'co2', campo: 'co2_kg', label: 'CO₂ evitado', de: 'de CO₂', color: '#6FBF73', formato: formatCo2 },
  { key: 'waste', campo: 'waste_kg', label: 'Residuos evitados', de: 'de residuos', color: '#C2703D', formato: formatWaste },
  { key: 'energy', campo: 'energy_kwh', label: 'Energía ahorrada', de: 'de energía', color: '#F4A62A', formato: formatEnergy },
];

/** The impact columns an activity row may carry (`select *` / `ensure_daily_set`). */
export interface ConImpacto {
  impact_water_l?: number | string | null;
  impact_co2_kg?: number | string | null;
  impact_waste_kg?: number | string | null;
  impact_energy_kwh?: number | string | null;
}

function num(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v ?? 0);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** What doing this action once adds to the totals. */
export function impactoDeAccion(a: ConImpacto | null | undefined): ImpactTotals {
  if (!a) return { ...EMPTY_IMPACT };
  return {
    water_l: num(a.impact_water_l),
    co2_kg: num(a.impact_co2_kg),
    waste_kg: num(a.impact_waste_kg),
    energy_kwh: num(a.impact_energy_kwh),
    actions: 1,
  };
}

const PER_DAY: Record<Metrica, number> = Object.fromEntries(BENCHMARKS.map((b) => [b.key, b.perDay])) as Record<
  Metrica,
  number
>;

export interface Pista {
  key: Metrica;
  /** "70 L de agua" */
  texto: string;
  /** Just the amount: "70 L". */
  valor: string;
  color: string;
}

/** The metric a topic is naturally about: a shower is water, a bike ride is CO₂. */
const METRICA_DEL_TEMA: Record<string, Metrica> = {
  agua: 'water',
  agua_azul: 'water',
  energia: 'energy',
  digital: 'energy',
  residuos: 'waste',
  consumo: 'waste',
  movilidad: 'co2',
  alimentacion: 'co2',
  aire_suelo: 'co2',
  plantas: 'co2',
};

function pista(m: (typeof METRICAS)[number], t: ImpactTotals): Pista {
  const valor = m.formato(t[m.campo]);
  return { key: m.key, valor, texto: `${valor} ${m.de}`, color: m.color };
}

/**
 * The one number worth putting on a row. With the action's topic, the metric
 * that topic is about when the action has it (a 5-minute shower says "50 L",
 * not the 0,9 kWh of hot water it also saves). Otherwise the metric where it
 * weighs most against what one person uses in a day (70 L of 180 beats 0,1 kg
 * of CO₂ of 11). Null when the action carries no measured impact.
 */
export function pistaDeImpacto(t: ImpactTotals, dominio?: string | null): Pista | null {
  const propia = dominio ? METRICAS.find((m) => m.key === METRICA_DEL_TEMA[dominio]) : undefined;
  if (propia && t[propia.campo] > 0) return pista(propia, t);
  let mejor: { m: (typeof METRICAS)[number]; peso: number } | null = null;
  for (const m of METRICAS) {
    const v = t[m.campo];
    if (!(v > 0)) continue;
    const peso = v / PER_DAY[m.key];
    if (!mejor || peso > mejor.peso) mejor = { m, peso };
  }
  return mejor ? pista(mejor.m, t) : null;
}

/** Every metric that moved, in the fixed order — for "hoy sumaste…". */
export function pistasDeImpacto(t: ImpactTotals): Pista[] {
  return METRICAS.filter((m) => t[m.campo] > 0).map((m) => pista(m, t));
}

/** Sum of two totals (e.g. what is left to do today). */
export function sumar(a: ImpactTotals, b: ImpactTotals): ImpactTotals {
  return {
    water_l: a.water_l + b.water_l,
    co2_kg: a.co2_kg + b.co2_kg,
    waste_kg: a.waste_kg + b.waste_kg,
    energy_kwh: a.energy_kwh + b.energy_kwh,
    actions: (a.actions ?? 0) + (b.actions ?? 0),
  };
}

export function esCero(t: ImpactTotals): boolean {
  return !(t.water_l > 0 || t.co2_kg > 0 || t.waste_kg > 0 || t.energy_kwh > 0);
}
