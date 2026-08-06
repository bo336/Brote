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

// ── Water (litres) ──────────────────────────────────────────────────────────
const WATER_EQ: Equivalence[] = [
  { per: 10_000, one: 'jean nuevo', many: 'jeans nuevos', emoji: '👖' },
  { per: 2_400, one: 'hamburguesa', many: 'hamburguesas', emoji: '🍔' },
  { per: 1_000, one: 'remera de algodón', many: 'remeras de algodón', emoji: '👕' },
  { per: 130, one: 'café', many: 'cafés', emoji: '☕' },
  { per: 60, one: 'ducha', many: 'duchas', emoji: '🚿' },
  { per: 10, one: 'descarga de inodoro', many: 'descargas de inodoro', emoji: '🚽' },
  { per: 1, one: 'litro de agua', many: 'litros de agua', emoji: '💧' },
];

// ── CO₂ (kg) ────────────────────────────────────────────────────────────────
const CO2_EQ: Equivalence[] = [
  { per: 2_000, one: 'vuelo Buenos Aires–Madrid', many: 'vuelos Buenos Aires–Madrid', emoji: '✈️' },
  { per: 200, one: 'vuelo a Bariloche', many: 'vuelos a Bariloche', emoji: '🛫' },
  { per: 21, one: 'árbol absorbiendo un año', many: 'árboles absorbiendo un año', emoji: '🌳' },
  { per: 8, one: 'carga de celular por un año', many: 'cargas de celular por un año', emoji: '🔌' },
  { per: 0.12, one: 'km en auto', many: 'km en auto', emoji: '🚗' },
];

// ── Waste (kg) ──────────────────────────────────────────────────────────────
const WASTE_EQ: Equivalence[] = [
  { per: 500, one: 'contenedor de basura', many: 'contenedores de basura', emoji: '🗑️' },
  { per: 5, one: 'bolsa de basura', many: 'bolsas de basura', emoji: '🛍️' },
  { per: 0.03, one: 'botella de plástico', many: 'botellas de plástico', emoji: '🧴' },
];

// ── Energy (kWh) ────────────────────────────────────────────────────────────
const ENERGY_EQ: Equivalence[] = [
  { per: 300, one: 'mes de heladera', many: 'meses de heladera', emoji: '🧊' },
  { per: 50, one: 'lavarropas por un mes', many: 'lavarropas por un mes', emoji: '🌀' },
  { per: 1, one: 'hora de aire acondicionado', many: 'horas de aire acondicionado', emoji: '❄️' },
  { per: 0.15, one: 'hora de notebook', many: 'horas de notebook', emoji: '💻' },
];

function bestEquivalence(amount: number, table: Equivalence[]): string | null {
  if (amount <= 0) return null;
  // Pick the largest unit that yields at least 1 (so it reads naturally).
  for (const eq of table) {
    const count = amount / eq.per;
    if (count >= 1) {
      const rounded = count >= 10 ? Math.round(count) : Math.round(count * 10) / 10;
      const label = rounded === 1 ? eq.one : eq.many;
      return `${eq.emoji} ≈ ${nf1.format(rounded)} ${label}`;
    }
  }
  const last = table[table.length - 1]!;
  const count = amount / last.per;
  if (count < 0.1) return null;
  return `${last.emoji} ≈ ${nf1.format(Math.round(count * 10) / 10)} ${last.many}`;
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

/** Compact one-liner for a single completion toast, e.g. "💧 40 L ≈ 4 duchas". */
export function completionImpactLine(t: ImpactTotals): string | null {
  const lines = impactLines(t);
  if (lines.length === 0) return null;
  // Show the biggest "story": prefer the line that has an equivalence.
  const best = lines.find((l) => l.equivalence) ?? lines[0]!;
  return best.equivalence ? `${best.emoji} ${best.value} · ${best.equivalence.replace(/^\S+\s/, '')}` : `${best.emoji} ${best.value}`;
}
