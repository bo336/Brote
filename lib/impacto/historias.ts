/**
 * El impacto contado como una historia (docs/REESTRUCTURA.md D5).
 *
 * "1.639 L" no le dice nada a nadie, y "≈ 0,0007 piletas olímpicas" menos: una
 * pileta parece mucho, pero nadie sabe cuánto es. Lo que sí se entiende a
 * cualquier escala es CUÁNTO DURA un hábito de todos los días:
 *
 *   "Alcanza para ducharte todos los días durante casi 3 semanas."
 *   "Es el agua que toma una persona en más de 2 años."
 *
 * Cada métrica tiene un par de hábitos diarios (la frase) y, debajo, la
 * escalera de cosas de la casa de `lib/impact.ts` (los ejemplos). Reglas, las
 * de 13-IMPACT-MIRROR §4: nada de árboles ni de "compensar", nada que achique
 * a la persona (ni países ni el planeta), cada cifra dice de dónde sale, y
 * siempre se redondea PARA ABAJO: "casi 3 semanas" es menos de 3.
 */
import {
  CO2_EQ,
  ENERGY_EQ,
  WASTE_EQ,
  WATER_EQ,
  decirCosa,
  formatCo2,
  formatEnergy,
  formatWaste,
  formatWater,
  rankEquivalences,
  type Equivalence,
  type IconoImpacto,
  type ImpactTotals,
} from '../impact';

export type Metrica = 'water' | 'co2' | 'waste' | 'energy';

/** La versión de las cifras: cambia cuando cambia un coeficiente (13-IMPACT-MIRROR §3). */
export const VERSION_CIFRAS = '2026.11';

/** Un hábito de todos los días, para contar cuánto dura lo ahorrado. */
export interface Habito {
  id: string;
  /** Cuánto de la métrica usa el hábito por día. */
  porDia: number;
  /** La frase, con `{d}` donde va la duración ("casi 3 semanas"). */
  frase: string;
  icono: IconoImpacto;
  /** De dónde sale la cifra, en palabras. */
  base: string;
}

/*
 * Cada cifra por día está en el extremo ALTO de su rango: así la duración que
 * resulta peca de corta, nunca de larga.
 */
export const HABITOS: Record<Metrica, Habito[]> = {
  water: [
    { id: 'tomar', porDia: 2, frase: 'Es el agua que toma una persona en {d}.', icono: 'vaso', base: 'una persona toma unos 2 L de agua por día' },
    { id: 'ducha', porDia: 80, frase: 'Alcanza para ducharte todos los días durante {d}.', icono: 'ducha', base: 'una ducha de 8 minutos gasta unos 80 L' },
    { id: 'casa', porDia: 180, frase: 'Es lo que usa una persona en su casa durante {d}.', icono: 'casa', base: 'unos 180 L por día entre cocina, baño y limpieza' },
  ],
  co2: [
    { id: 'celular', porDia: 0.007, frase: 'Es lo que emite cargar el celular todos los días durante {d}.', icono: 'celular', base: 'una carga completa por día, con la red eléctrica argentina' },
    { id: 'auto', porDia: 3, frase: 'Es como dejar el auto en casa durante {d}.', icono: 'auto', base: 'un auto naftero que hace 20 km por día emite unos 3 kg' },
    { id: 'persona', porDia: 11, frase: 'Es la huella de una persona promedio durante {d}.', icono: 'persona', base: 'en Argentina, unos 11 kg de CO₂ por persona por día' },
  ],
  waste: [
    { id: 'persona', porDia: 1.2, frase: 'Es la basura que tira una persona en {d}.', icono: 'persona', base: 'en Argentina, una persona tira unos 1,2 kg por día' },
    { id: 'familia', porDia: 4.8, frase: 'Es la basura de una familia de cuatro durante {d}.', icono: 'basura', base: 'cuatro personas a 1,2 kg por día' },
  ],
  energy: [
    { id: 'led', porDia: 0.24, frase: 'Alcanza para una lamparita LED prendida día y noche durante {d}.', icono: 'lampara', base: 'una lamparita de 10 W las 24 horas' },
    { id: 'heladera', porDia: 1.5, frase: 'Alcanza para tener la heladera andando {d}.', icono: 'heladera', base: 'una heladera gasta unos 1,5 kWh por día' },
    { id: 'casa', porDia: 8, frase: 'Es la luz de una casa durante {d}.', icono: 'casa', base: 'una casa promedio usa unos 8 kWh por día' },
  ],
};

const ESCALERA: Record<Metrica, Equivalence[]> = { water: WATER_EQ, co2: CO2_EQ, waste: WASTE_EQ, energy: ENERGY_EQ };

const CAMPO: Record<Metrica, keyof Pick<ImpactTotals, 'water_l' | 'co2_kg' | 'waste_kg' | 'energy_kwh'>> = {
  water: 'water_l',
  co2: 'co2_kg',
  waste: 'waste_kg',
  energy: 'energy_kwh',
};

const FORMATO: Record<Metrica, (n: number) => string> = {
  water: formatWater,
  co2: formatCo2,
  waste: formatWaste,
  energy: formatEnergy,
};

export const NOMBRE_METRICA: Record<Metrica, { titulo: string; de: string; color: string }> = {
  water: { titulo: 'Agua', de: 'de agua', color: '#2DB4D4' },
  co2: { titulo: 'CO₂', de: 'de CO₂', color: '#6FBF73' },
  waste: { titulo: 'Residuos', de: 'de residuos', color: '#C2703D' },
  energy: { titulo: 'Energía', de: 'de energía', color: '#F4A62A' },
};

/** Cuánto pesa cada métrica contra lo que usa una persona en un día (para elegir la principal). */
const USO_DIARIO: Record<Metrica, number> = { water: 180, co2: 11, waste: 1.2, energy: 3 };

// ── La duración, dicha como la diría una persona ────────────────────────────

const UNIDADES: { dias: number; uno: string; varios: string }[] = [
  { dias: 365, uno: 'un año', varios: 'años' },
  { dias: 30, uno: 'un mes', varios: 'meses' },
  { dias: 7, uno: 'una semana', varios: 'semanas' },
  { dias: 1, uno: 'un día', varios: 'días' },
];

function cantidad(n: number, u: (typeof UNIDADES)[number]): string {
  return n === 1 ? u.uno : `${n} ${u.varios}`;
}

/**
 * Días → "casi 3 semanas", "más de un mes", "5 días". Nunca dice más de lo
 * que es: "casi N" es menos que N, "más de N" es más que N y menos que N+1.
 * Null por debajo de un día (ahí la frase no tiene sentido).
 */
export function duracion(dias: number): string | null {
  if (!(dias >= 1)) return null;
  const u = UNIDADES.find((x) => dias >= x.dias)!;
  if (u.dias === 1) {
    const n = Math.floor(dias);
    return n === 1 ? 'un día' : `${n} días`;
  }
  const x = dias / u.dias;
  const entero = Math.floor(x);
  const resto = x - entero;
  // "casi" sólo si de verdad falta poco, y nunca para pasar a la unidad
  // siguiente ("casi 12 meses" se queda en "más de 11 meses").
  const siguiente = UNIDADES[UNIDADES.indexOf(u) - 1];
  const casi = entero + 1;
  if (resto >= 0.75 && !(siguiente && casi * u.dias >= siguiente.dias)) return `casi ${cantidad(casi, u)}`;
  if (resto >= 0.2) return `más de ${cantidad(entero, u)}`;
  return cantidad(entero, u);
}

// ── La historia de una métrica ──────────────────────────────────────────────

export interface Ejemplo {
  /** "3 bañaderas llenas" */
  texto: string;
  icono: IconoImpacto;
  base: string;
}

export interface Historia {
  metrica: Metrica;
  /** La cifra con su unidad: "1.639 L". */
  valor: string;
  /** La frase principal: "Alcanza para ducharte todos los días durante casi 3 semanas." */
  frase: string;
  /** La parte de la frase que se destaca ("casi 3 semanas"), tal cual aparece en ella. */
  destacado: string;
  icono: IconoImpacto;
  /** De dónde sale la frase. */
  base: string;
  /** Otras formas de decirlo (cosas de la casa), de la más fácil de imaginar a la menos. */
  ejemplos: Ejemplo[];
  /** Las otras frases que también valen (otros hábitos), para "en otras palabras". */
  otrasFrases: { frase: string; icono: IconoImpacto; base: string }[];
}

/** Lo ideal para una duración: un par de semanas a unos meses, en escala log. */
const IDEAL_DIAS = 30;

/** Las frases de hábito que valen para esta cantidad, la más fácil de imaginar primero. */
export function frasesDeHabito(
  metrica: Metrica,
  cant: number,
): { frase: string; destacado: string; icono: IconoImpacto; base: string; dias: number }[] {
  if (!(cant > 0)) return [];
  return HABITOS[metrica]
    .map((h) => {
      const dias = cant / h.porDia;
      const d = duracion(dias);
      // Más de 30 años deja de ser una imagen ("la huella de 40 años").
      if (!d || dias > 365 * 30) return null;
      return { frase: h.frase.replace('{d}', d), destacado: d, icono: h.icono, base: h.base, dias };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => Math.abs(Math.log10(a.dias / IDEAL_DIAS)) - Math.abs(Math.log10(b.dias / IDEAL_DIAS)));
}

/** La historia completa de una métrica, o null si no hay nada que contar. */
export function historiaDe(metrica: Metrica, cant: number): Historia | null {
  if (!(cant > 0)) return null;
  const frases = frasesDeHabito(metrica, cant);
  const cosas = rankEquivalences(cant, ESCALERA[metrica], 3).map(({ eq, count }) => ({
    texto: decirCosa(eq, count),
    icono: eq.icono,
    base: eq.base,
  }));
  const principal = frases[0];
  if (!principal && cosas.length === 0) return null;
  return {
    metrica,
    valor: FORMATO[metrica](cant),
    // Sin un hábito que dure un día entero, la frase es la cosa más fácil de imaginar.
    frase: principal ? principal.frase : `Es como ${cosas[0]!.texto}.`,
    destacado: principal ? principal.destacado : cosas[0]!.texto,
    icono: principal ? principal.icono : cosas[0]!.icono,
    base: principal ? principal.base : cosas[0]!.base,
    ejemplos: principal ? cosas : cosas.slice(1),
    otrasFrases: frases.slice(1).map(({ frase, icono, base }) => ({ frase, icono, base })),
  };
}

/** Las historias de todo lo que se movió, en el orden fijo agua → CO₂ → residuos → energía. */
export function historias(t: ImpactTotals): Historia[] {
  return (['water', 'co2', 'waste', 'energy'] as Metrica[])
    .map((m) => historiaDe(m, t[CAMPO[m]]))
    .filter((h): h is Historia => h !== null);
}

/**
 * La historia que va arriba: la métrica donde la persona pesa más contra lo
 * que usa alguien en un día (50 L de 180 pesa más que 0,2 kg de CO₂ de 11).
 */
export function historiaPrincipal(t: ImpactTotals): Historia | null {
  let mejor: { m: Metrica; peso: number } | null = null;
  for (const m of ['water', 'co2', 'waste', 'energy'] as Metrica[]) {
    const v = t[CAMPO[m]];
    if (!(v > 0)) continue;
    const peso = v / USO_DIARIO[m];
    if (!mejor || peso > mejor.peso) mejor = { m, peso };
  }
  return mejor ? historiaDe(mejor.m, t[CAMPO[mejor.m]]) : null;
}

/** Una línea para compartir: la cifra y la frase, sin emojis ni promesas. */
export function textoParaCompartir(h: Historia, quien: 'yo' | 'todos' = 'yo'): string {
  const sujeto = quien === 'yo' ? 'Con lo que hice en Brote ahorré' : 'Entre todos en Brote ahorramos';
  return `${sujeto} ${h.valor} ${NOMBRE_METRICA[h.metrica].de}. ${h.frase}`;
}
