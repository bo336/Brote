/**
 * Real-impact engine (PLAN F12.2).
 *
 * Turns raw saved quantities into comparisons a person can picture. Every
 * equivalence below is a published order-of-magnitude figure, rounded DOWN so
 * the app never overstates what someone achieved.
 */

export interface ImpactTotals {
  water_l: number;
  co2_kg: number;
  waste_kg: number;
  energy_kwh: number;
  actions?: number;
}

export const EMPTY_IMPACT: ImpactTotals = { water_l: 0, co2_kg: 0, waste_kg: 0, energy_kwh: 0, actions: 0 };

/** Parse the jsonb payload coming from the DB (numbers may arrive as strings). */
export function parseImpact(raw: unknown): ImpactTotals {
  if (!raw || typeof raw !== 'object') return { ...EMPTY_IMPACT };
  const r = raw as Record<string, unknown>;
  const n = (v: unknown) => (typeof v === 'number' ? v : Number(v ?? 0) || 0);
  return {
    water_l: n(r.water_l),
    co2_kg: n(r.co2_kg),
    waste_kg: n(r.waste_kg),
    energy_kwh: n(r.energy_kwh),
    actions: n(r.actions),
  };
}

const nf = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 });

/** Human-readable amount with unit, e.g. "1.240 L" / "3,4 kg". */
export function formatWater(l: number): string {
  if (l >= 1000) return `${nf1.format(l / 1000)} m³`;
  return `${nf.format(l)} L`;
}
export function formatCo2(kg: number): string {
  if (kg >= 1000) return `${nf1.format(kg / 1000)} t`;
  return kg < 10 ? `${nf1.format(kg)} kg` : `${nf.format(kg)} kg`;
}
export function formatWaste(kg: number): string {
  return kg < 10 ? `${nf1.format(kg)} kg` : `${nf.format(kg)} kg`;
}
export function formatEnergy(kwh: number): string {
  return kwh < 10 ? `${nf1.format(kwh)} kWh` : `${nf.format(kwh)} kWh`;
}

interface Equivalence {
  /** How many units of the saved resource one item costs. */
  per: number;
  /** Singular / plural label, used as "≈ 3 remeras". */
  one: string;
  many: string;
  emoji: string;
}

/*
 * Each table spans several orders of magnitude on purpose. A comparison is
 * only useful if the resulting COUNT is small enough to picture: "≈ 6 duchas"
 * lands, "≈ 10.400 duchas" is noise. The ladders below give the selector a
 * bigger unit to climb to as someone's totals grow.
 * Ordered from largest to smallest cost per item.
 */

/*
 * F15.16 — the units are deliberately SPECIFIC and local. "≈ 4 duchas" leaves
 * you wondering how long a shower is; "≈ 4 duchas de 8 minutos" is a picture.
 * Where possible the reference is something an Argentine actually does — a
 * mate, an asado, a trip to Mar del Plata — rather than a generic figure.
 */

// ── Water (litres) ──────────────────────────────────────────────────────────
const WATER_EQ: Equivalence[] = [
  { per: 2_500_000, one: 'pileta olímpica llena', many: 'piletas olímpicas llenas', emoji: '🏊' },
  { per: 15_000, one: 'kilo de carne vacuna producido', many: 'kilos de carne vacuna producidos', emoji: '🥩' },
  { per: 10_000, one: 'jean nuevo fabricado', many: 'jeans nuevos fabricados', emoji: '👖' },
  { per: 2_700, one: 'remera de algodón fabricada', many: 'remeras de algodón fabricadas', emoji: '👕' },
  { per: 2_400, one: 'hamburguesa completa', many: 'hamburguesas completas', emoji: '🍔' },
  { per: 1_100, one: 'lavarropas cargado', many: 'lavarropas cargados', emoji: '🌀' },
  { per: 130, one: 'café de cafetería', many: 'cafés de cafetería', emoji: '☕' },
  { per: 70, one: 'ducha de 8 minutos', many: 'duchas de 8 minutos', emoji: '🚿' },
  { per: 22, one: 'termo de mate', many: 'termos de mate', emoji: '🧉' },
  { per: 9, one: 'descarga de inodoro', many: 'descargas de inodoro', emoji: '🚽' },
  { per: 1, one: 'litro de agua', many: 'litros de agua', emoji: '💧' },
];

// ── CO₂ (kg) ────────────────────────────────────────────────────────────────
const CO2_EQ: Equivalence[] = [
  { per: 4_600, one: 'año entero de un auto naftero', many: 'años enteros de un auto naftero', emoji: '🚙' },
  { per: 1_800, one: 'vuelo ida y vuelta a Madrid', many: 'vuelos ida y vuelta a Madrid', emoji: '✈️' },
  { per: 200, one: 'vuelo ida y vuelta a Bariloche', many: 'vuelos ida y vuelta a Bariloche', emoji: '🛫' },
  { per: 55, one: 'viaje en auto a Mar del Plata', many: 'viajes en auto a Mar del Plata', emoji: '🛣️' },
  { per: 27, one: 'kilo de asado', many: 'kilos de asado', emoji: '🥩' },
  { per: 21, one: 'árbol absorbiendo todo un año', many: 'árboles absorbiendo todo un año', emoji: '🌳' },
  { per: 2.5, one: 'carga de celular por un año', many: 'cargas de celular por un año', emoji: '🔌' },
  { per: 0.12, one: 'kilómetro en auto', many: 'kilómetros en auto', emoji: '🚗' },
];

// ── Waste (kg) ──────────────────────────────────────────────────────────────
const WASTE_EQ: Equivalence[] = [
  { per: 5_000, one: 'camión de basura', many: 'camiones de basura', emoji: '🚛' },
  { per: 500, one: 'contenedor de basura', many: 'contenedores de basura', emoji: '🗑️' },
  { per: 5, one: 'bolsa de basura', many: 'bolsas de basura', emoji: '🛍️' },
  // Bridges the wide gap between a bag (5 kg) and a bottle (30 g) — without
  // this rung, a few kilos rendered as "≈ 100 botellas de plástico".
  { per: 1, one: 'kilo de residuos', many: 'kilos de residuos', emoji: '⚖️' },
  { per: 0.03, one: 'botella de plástico', many: 'botellas de plástico', emoji: '🧴' },
  { per: 0.008, one: 'bolsita de plástico', many: 'bolsitas de plástico', emoji: '🛒' },
];

// ── Energy (kWh) ────────────────────────────────────────────────────────────
const ENERGY_EQ: Equivalence[] = [
  { per: 3_000, one: 'año de luz de un hogar', many: 'años de luz de un hogar', emoji: '🏠' },
  { per: 300, one: 'mes de heladera', many: 'meses de heladera', emoji: '🧊' },
  { per: 50, one: 'mes de lavarropas', many: 'meses de lavarropas', emoji: '🌀' },
  { per: 8, one: 'día de luz de un hogar', many: 'días de luz de un hogar', emoji: '💡' },
  { per: 1, one: 'hora de aire acondicionado', many: 'horas de aire acondicionado', emoji: '❄️' },
  { per: 0.15, one: 'hora de notebook', many: 'horas de notebook', emoji: '💻' },
];

/**
 * Pick the unit whose resulting count is easiest to picture, at ANY scale.
 *
 * Rather than "first unit that yields at least 1" — which stays stuck on tiny
 * units and produces things like "10.400 duchas" — this scores every rung of
 * the ladder by how close its count sits to ~6 in log space, and takes the
 * best. Small savings land on showers and bottles; large ones automatically
 * climb to jeans, flights and swimming pools.
 */
const IDEAL_COUNT = 6;

function pickEquivalence(amount: number, table: Equivalence[]): { eq: Equivalence; count: number } | null {
  if (amount <= 0) return null;
  let best: { eq: Equivalence; count: number } | null = null;
  let bestScore = Infinity;
  for (const eq of table) {
    const count = amount / eq.per;
    // Below ~1 the phrase stops meaning anything ("0,4 duchas").
    if (count < 0.9) continue;
    const score = Math.abs(Math.log10(count) - Math.log10(IDEAL_COUNT));
    if (score < bestScore) {
      bestScore = score;
      best = { eq, count };
    }
  }
  if (best) return best;
  // Everything was below the threshold: fall back to the smallest unit.
  const last = table[table.length - 1]!;
  const count = amount / last.per;
  return count >= 0.1 ? { eq: last, count } : null;
}

function formatCount(count: number): string {
  if (count >= 100) return nf.format(Math.round(count));
  if (count >= 10) return nf.format(Math.round(count));
  return nf1.format(Math.round(count * 10) / 10);
}

function bestEquivalence(amount: number, table: Equivalence[]): string | null {
  const picked = pickEquivalence(amount, table);
  if (!picked) return null;
  const rounded = picked.count >= 10 ? Math.round(picked.count) : Math.round(picked.count * 10) / 10;
  const label = rounded === 1 ? picked.eq.one : picked.eq.many;
  return `${picked.eq.emoji} ≈ ${formatCount(picked.count)} ${label}`;
}

export function waterEquivalence(l: number): string | null {
  return bestEquivalence(l, WATER_EQ);
}
export function co2Equivalence(kg: number): string | null {
  return bestEquivalence(kg, CO2_EQ);
}
export function wasteEquivalence(kg: number): string | null {
  return bestEquivalence(kg, WASTE_EQ);
}
export function energyEquivalence(kwh: number): string | null {
  return bestEquivalence(kwh, ENERGY_EQ);
}

export interface ImpactLine {
  key: 'water' | 'co2' | 'waste' | 'energy';
  emoji: string;
  label: string;
  value: string;
  equivalence: string | null;
  color: string;
}

/** The 1-4 impact lines worth showing for a set of totals (skips zeros). */
export function impactLines(t: ImpactTotals): ImpactLine[] {
  const lines: ImpactLine[] = [];
  if (t.water_l > 0)
    lines.push({ key: 'water', emoji: '💧', label: 'Agua ahorrada', value: formatWater(t.water_l), equivalence: waterEquivalence(t.water_l), color: '#2DB4D4' });
  if (t.co2_kg > 0)
    lines.push({ key: 'co2', emoji: '☁️', label: 'CO₂ evitado', value: formatCo2(t.co2_kg), equivalence: co2Equivalence(t.co2_kg), color: '#6FBF73' });
  if (t.waste_kg > 0)
    lines.push({ key: 'waste', emoji: '♻️', label: 'Residuos evitados', value: formatWaste(t.waste_kg), equivalence: wasteEquivalence(t.waste_kg), color: '#C2703D' });
  if (t.energy_kwh > 0)
    lines.push({ key: 'energy', emoji: '⚡', label: 'Energía ahorrada', value: formatEnergy(t.energy_kwh), equivalence: energyEquivalence(t.energy_kwh), color: '#F4A62A' });
  return lines;
}

// ── "Vos vs. una persona promedio" ──────────────────────────────────────────

/**
 * Everyday consumption of one average person, per day. These are
 * order-of-magnitude reference figures for Argentina, deliberately rounded and
 * shown to users as estimates — never as precise measurements.
 *
 * water_l  ~180 L/day  · domestic water use per person
 * co2_kg   ~11 kg/day  · ≈4 t/year per-capita footprint
 * waste_kg ~1.1 kg/day · municipal solid waste generated per person
 * energy   ~3 kWh/day  · residential electricity per person
 *
 * If these are ever tuned, update the wording in `<ImpactBenchmark>` too so
 * the disclosure stays accurate.
 */
export interface Benchmark {
  key: ImpactLine['key'];
  label: string;
  emoji: string;
  color: string;
  /** Average consumption per person per day. */
  perDay: number;
  /** How the raw amount is rendered. */
  format: (n: number) => string;
  /** What a "day" of this resource looks like, for the plain-language line. */
  dayNoun: string;
}

export const BENCHMARKS: Benchmark[] = [
  { key: 'water', label: 'Agua', emoji: '💧', color: '#2DB4D4', perDay: 180, format: formatWater, dayNoun: 'de agua' },
  { key: 'co2', label: 'CO₂', emoji: '☁️', color: '#6FBF73', perDay: 11, format: formatCo2, dayNoun: 'de huella de carbono' },
  { key: 'waste', label: 'Residuos', emoji: '♻️', color: '#C2703D', perDay: 1.1, format: formatWaste, dayNoun: 'de basura' },
  { key: 'energy', label: 'Energía', emoji: '⚡', color: '#F4A62A', perDay: 3, format: formatEnergy, dayNoun: 'de electricidad' },
];

export interface BenchmarkComparison {
  key: ImpactLine['key'];
  label: string;
  emoji: string;
  color: string;
  /** What the user saved in the period. */
  saved: number;
  savedLabel: string;
  /** What an average person consumes over the same number of days. */
  average: number;
  averageLabel: string;
  /** saved / average — can exceed 1 for a very active user. */
  ratio: number;
  /** How many average-person days the saving covers. */
  days: number;
  /** Plain-language motivational line. */
  headline: string;
}

function daysPhrase(days: number, dayNoun: string): string {
  if (days >= 365) {
    // Spanish pluralises anything that is not exactly one — "1,4 años".
    const years = Math.round((days / 365) * 10) / 10;
    return `Cubriste ${nf1.format(years)} ${years === 1 ? 'año' : 'años'} ${dayNoun} de una persona`;
  }
  if (days >= 1) {
    const d = Math.round(days);
    return `Cubriste ${nf.format(d)} ${d === 1 ? 'día' : 'días'} ${dayNoun} de una persona`;
  }
  const hours = Math.round(days * 24);
  if (hours >= 1) return `Cubriste ${nf.format(hours)} ${hours === 1 ? 'hora' : 'horas'} ${dayNoun} de una persona`;
  return `Ya empezaste a ahorrar ${dayNoun}`;
}

/**
 * Compare what someone saved against what an average person simply consumes
 * over the same window. This is the motivational framing: not "you saved 40
 * litres" in a vacuum, but "that is 5 days of someone's water".
 */
export function benchmarkComparisons(t: ImpactTotals, periodDays: number): BenchmarkComparison[] {
  const days = Math.max(1, periodDays);
  const amounts: Record<ImpactLine['key'], number> = {
    water: t.water_l,
    co2: t.co2_kg,
    waste: t.waste_kg,
    energy: t.energy_kwh,
  };

  return BENCHMARKS.filter((b) => amounts[b.key] > 0).map((b) => {
    const saved = amounts[b.key];
    const average = b.perDay * days;
    return {
      key: b.key,
      label: b.label,
      emoji: b.emoji,
      color: b.color,
      saved,
      savedLabel: b.format(saved),
      average,
      averageLabel: b.format(average),
      ratio: average > 0 ? saved / average : 0,
      days: saved / b.perDay,
      headline: daysPhrase(saved / b.perDay, b.dayNoun),
    };
  });
}

/** Compact one-liner for a single completion toast, e.g. "💧 40 L ≈ 4 duchas". */
export function completionImpactLine(t: ImpactTotals): string | null {
  const lines = impactLines(t);
  if (lines.length === 0) return null;
  // Show the biggest "story": prefer the line that has an equivalence.
  const best = lines.find((l) => l.equivalence) ?? lines[0]!;
  return best.equivalence ? `${best.emoji} ${best.value} · ${best.equivalence.replace(/^\S+\s/, '')}` : `${best.emoji} ${best.value}`;
}
