/**
 * El Mojón — **the one place a number appears in the world**.
 *
 * `13-IMPACT-MIRROR.md` §3 is unambiguous: numbers never float over the island.
 * They live on one stone marker on the path between El Claro and La Pradera,
 * and nowhere else except the ceremony's title card. Everything else the impact
 * data does, it does by changing what the world *looks* like.
 *
 * This module is the panel's content, with no React in it, so the rules below
 * can be tested rather than reviewed:
 *
 *  - **Every figure carries `medido` or `estimado`**, and the two are never
 *    blended into one total.
 *  - **`estimado` figures show a range**, never a decimal of false precision.
 *    "≈ 2,4 kg (rango 1,8 – 3,1)" reads as science; "2,437 kg" reads as
 *    marketing.
 *  - **No offsetting, no neutrality, no "salvaste N árboles."** Say what
 *    happened, never what it cancels.
 *  - Equivalences come from `lib/impact.ts` and its existing ladders. **No new
 *    ladder is invented here** — that file is already the app's answer to
 *    "what does this number feel like".
 */
// Relative, not `@/lib/impact`: the test build is plain CommonJS and nothing
// resolves the path alias at runtime.
import { impactLines, type ImpactLine, type ImpactTotals } from '../impact';
import { IMPACT_PROVENANCE, MOJON } from './config';
import { tierForRegion } from './progression';

/**
 * Where a figure comes from.
 *
 * `medido` is a logged action with a known coefficient. `estimado` is a
 * modelled proxy. **Today every channel is `medido`** — `brote_user_impact`
 * sums per-activity coefficients and there is no modelled figure in the schema
 * to label otherwise. The machinery is here rather than the label hard-coded,
 * so that adding a proxy later is a data change and not a rewrite; inventing an
 * `estimado` split now, with a fabricated range, would be exactly the false
 * precision the rule exists to prevent.
 */
export type Provenance = 'medido' | 'estimado';

export interface MojonRow extends ImpactLine {
  provenance: Provenance;
  /** Only ever set on an `estimado` row. `[low, high]`, already formatted. */
  range: [string, string] | null;
}

export interface MojonPanel {
  rows: MojonRow[];
  /**
   * What grew out of it — "De esto nació: tu río, el aire claro". Only systems
   * the player's tier has actually revealed: promising somebody a river six
   * tiers before they get one is the kind of copy that teaches them to stop
   * reading.
   */
  born: string[];
  /** The community aggregate, already formatted, or null when it is zero. */
  collective: string | null;
  /** Argentine grid factors move. The panel says which version it used. */
  coefficientVersion: string;
}

/** Which world system each channel drives, and the tier that reveals it. */
const BORN: Record<ImpactLine['key'], { text: string; region: Parameters<typeof tierForRegion>[0] }> = {
  water: { text: 'tu río', region: 'rio' },
  co2: { text: 'el aire claro', region: 'claro' },
  waste: { text: 'la playa limpia', region: 'claro' },
  energy: { text: 'las luces de la noche', region: 'pradera' },
};

/** A number, rounded the way the rest of the app rounds it. */
function band(value: number, format: (n: number) => string): [string, string] {
  const spread = MOJON.estimateSpread;
  return [format(value * (1 - spread)), format(value * (1 + spread))];
}

/**
 * The panel for a set of totals.
 *
 * `formatFor` is passed in rather than imported per channel so the caller keeps
 * one formatting vocabulary; `impactLines` already produced the display value,
 * and the range has to be formatted the same way or the three numbers on a row
 * will not look like they belong together.
 */
export function buildMojon(
  totals: ImpactTotals,
  opts: {
    tier: number;
    collectiveWaterL: number;
    formatWater: (l: number) => string;
  },
): MojonPanel {
  const rows: MojonRow[] = impactLines(totals).map((line) => {
    const provenance = IMPACT_PROVENANCE[line.key];
    const raw = rawValue(totals, line.key);
    return {
      ...line,
      provenance,
      // A range belongs to an estimate and only to an estimate. Putting one on
      // a measured figure would suggest a doubt that is not there.
      range: provenance === 'estimado' ? band(raw, (n) => formatLike(line.key, n, opts)) : null,
    };
  });

  const born = rows
    .filter((r) => tierForRegion(BORN[r.key].region) <= opts.tier)
    .map((r) => BORN[r.key].text);

  return {
    rows,
    born,
    collective: opts.collectiveWaterL > 0 ? opts.formatWater(opts.collectiveWaterL) : null,
    coefficientVersion: MOJON.coefficientVersion,
  };
}

function rawValue(t: ImpactTotals, key: ImpactLine['key']): number {
  switch (key) {
    case 'water': return t.water_l;
    case 'co2': return t.co2_kg;
    case 'waste': return t.waste_kg;
    case 'energy': return t.energy_kwh;
  }
}

/** Format a bound of a range in the same units as the row it sits on. */
function formatLike(
  key: ImpactLine['key'],
  n: number,
  opts: { formatWater: (l: number) => string },
): string {
  if (key === 'water') return opts.formatWater(n);
  // The other three are kilogram/kWh scales where one decimal is the honest
  // resolution; `lib/impact.ts` rounds the headline figure the same way.
  return (Math.round(n * 10) / 10).toLocaleString('es-AR');
}
