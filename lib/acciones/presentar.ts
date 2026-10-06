/**
 * Cómo se dice cada cosa de una acción en pantalla. Puro: lo usan Inicio, el
 * catálogo, el detalle y la hoja de acción, y lo fijan los tests.
 */
import {
  CONTEXTO_POR_CLAVE,
  ESTACION_ES,
  FORMATO_ES,
  LUGAR_ES,
  type ContextoClave,
  type Estacion,
  type Formato,
  type Lugar,
  type Razon,
} from './reglas';

/** "2 min", "1 h", "1 h 30 min". */
export function minutosTexto(min: number | null | undefined): string | null {
  if (!min || min <= 0) return null;
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export interface EfemerideHoy {
  nombre: string;
  /** Días hasta la fecha: 0 hoy, >0 falta, <0 ya pasó. */
  dias: number;
}

/** "Hoy es el Día del Árbol", "Se viene el Día…", "Semana del Día…". */
export function efemerideTexto(e: EfemerideHoy): string {
  if (e.dias === 0) return `Hoy: ${e.nombre}`;
  if (e.dias > 0) return `Se viene el ${e.nombre}`;
  return `Semana del ${e.nombre}`;
}

/**
 * Por qué una acción está en tu día, en pocas palabras. `dominio` nombra el
 * tema para el motivo "interés".
 */
export function razonTexto(
  r: Razon | null | undefined,
  opts: { efemeride?: EfemerideHoy | null; dominio?: (slug: string) => string | undefined } = {},
): string | null {
  if (!r) return null;
  switch (r.r) {
    case 'efemeride':
      return opts.efemeride ? efemerideTexto(opts.efemeride) : 'Fecha especial';
    case 'temporada':
      return `Ideal en ${ESTACION_ES[r.e as Estacion] ?? 'esta época'}`;
    case 'contexto':
      return CONTEXTO_POR_CLAVE[r.k as ContextoClave]?.porque ?? 'Para vos';
    case 'interes': {
      const nombre = opts.dominio?.(r.d);
      return nombre ? `Te interesa ${nombre}` : 'Por tus intereses';
    }
    case 'nueva':
      return 'Nueva para vos';
    case 'impacto':
      return 'De mucho impacto';
    case 'variedad':
      return 'Para variar';
    default:
      return null;
  }
}

export function formatoTexto(f: string | null | undefined): string | null {
  return f && f in FORMATO_ES ? FORMATO_ES[f as Formato] : null;
}

export function lugarTexto(l: string | null | undefined): string | null {
  return l && l in LUGAR_ES ? LUGAR_ES[l as Lugar] : null;
}

/** "Ideal en otoño e invierno". */
export function estacionesTexto(est: readonly string[] | null | undefined): string | null {
  if (!est || est.length === 0) return null;
  const nombres = est.map((e) => ESTACION_ES[e as Estacion] ?? e);
  if (nombres.length === 1) return `Ideal en ${nombres[0]}`;
  return `Ideal en ${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`;
}

/** "Necesitás: bici, parrilla" — lo que la acción pide, en palabras. */
export function requiereTexto(req: readonly string[] | null | undefined): string | null {
  if (!req || req.length === 0) return null;
  const nombres = req.map((k) => CONTEXTO_POR_CLAVE[k as ContextoClave]?.label.toLowerCase() ?? k);
  return `Para quien tiene ${nombres.join(' y ')}`;
}

export interface Medida {
  pregunta: string;
  unidad: string;
  unidades: string;
  min: number;
  max: number;
  def: number;
  paso: number;
  por: Partial<Record<'water_l' | 'co2_kg' | 'waste_kg' | 'energy_kwh', number>>;
}

/** Acota una cantidad a lo que la acción acepta (igual que el servidor). */
export function acotar(m: Medida, n: number): number {
  if (!Number.isFinite(n)) return m.def;
  return Math.min(m.max, Math.max(m.min, n));
}

/** "10 cuadras" / "1 cuadra". */
export function cantidadTexto(m: Medida, n: number): string {
  return `${new Intl.NumberFormat('es-AR').format(n)} ${n === 1 ? m.unidad : m.unidades}`;
}

/** El impacto de esta cantidad, en las cuatro métricas. */
export function impactoDeCantidad(m: Medida, n: number) {
  const c = acotar(m, n);
  const r3 = (x: number) => Math.round(x * 1000) / 1000;
  return {
    water_l: r3((m.por.water_l ?? 0) * c),
    co2_kg: r3((m.por.co2_kg ?? 0) * c),
    waste_kg: r3((m.por.waste_kg ?? 0) * c),
    energy_kwh: r3((m.por.energy_kwh ?? 0) * c),
  };
}
