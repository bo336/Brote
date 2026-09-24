/**
 * Los planes y sus topes (09_MONETIZACION.md §5).
 *
 * ESPEJO EXACTO de `brote_biz_limites()` en `0108_negocios_cobro_e_integracion.sql`.
 * Un test lee la migración y compara los dos: si alguien cambia uno solo, falla.
 *
 * Lo único que el plan compra es CAPACIDAD (cuántos listados, cuántos
 * objetivos, cuántas replanificaciones con IA) y CONVENIENCIA (analítica,
 * publicación acelerada, equipo). Nunca nivel de evidencia, nunca posición en
 * el catálogo: el puntaje de `lib/mercado/ranking.ts` no tiene —y no puede
 * tener— un término de plan (09 §2.1).
 *
 * El gating de verdad está en el servidor, en los triggers de la migración.
 * Esto es para que la pantalla diga el número correcto antes de que alguien
 * choque contra él.
 */

export const PLANES = ['semilla', 'raiz', 'bosque', 'vendedor'] as const;
/** Los tres planes del flujo de empresas (0108). Las tiendas nuevas tienen uno solo: 'vendedor'. */
export const PLANES_LEGACY = ['semilla', 'raiz', 'bosque'] as const;
export type BizPlan = (typeof PLANES)[number];

export type EstadoSuscripcion =
  | 'pendiente'
  | 'activa'
  | 'en_gracia'
  | 'pausada'
  | 'cancelada'
  | 'vencida';

export interface Limites {
  listados: number;
  objetivos: number;
  replanificaciones: number;
  miembros: number;
  analitica: 'basica' | 'completa';
  historial_publico: boolean;
  destacados: number;
  acelerada: boolean;
}

/** El tope de Bosque es "ilimitado"; en la base es este mismo número. */
export const SIN_TOPE = 999999;

export const LIMITES: Record<BizPlan, Limites> = {
  semilla: {
    listados: 3,
    objetivos: 2,
    replanificaciones: 4,
    miembros: 1,
    analitica: 'basica',
    historial_publico: false,
    destacados: 0,
    acelerada: false,
  },
  raiz: {
    listados: 15,
    objetivos: 3,
    replanificaciones: 8,
    miembros: 3,
    analitica: 'completa',
    historial_publico: true,
    destacados: 0,
    acelerada: true,
  },
  bosque: {
    listados: SIN_TOPE,
    objetivos: 3,
    replanificaciones: 15,
    miembros: 10,
    analitica: 'completa',
    historial_publico: true,
    destacados: 1,
    acelerada: true,
  },
  // Mercado v2 (0114): el único plan de las tiendas nuevas. USD 5 por mes.
  vendedor: {
    listados: 300,
    objetivos: 3,
    replanificaciones: 8,
    miembros: 3,
    analitica: 'completa',
    historial_publico: true,
    destacados: 0,
    acelerada: true,
  },
};

export function puedePublicar(plan: BizPlan, publicados: number): boolean {
  return publicados < LIMITES[plan].listados;
}

export function puedeCrearObjetivo(plan: BizPlan, activos: number): boolean {
  return activos < LIMITES[plan].objetivos;
}

export function puedeReplanificar(plan: BizPlan, usadas: number): boolean {
  return usadas < LIMITES[plan].replanificaciones;
}

export function puedeInvitar(plan: BizPlan, miembros: number): boolean {
  return miembros < LIMITES[plan].miembros;
}

/** El plan siguiente que destraba `clave`, o null si ya está en el mejor. */
export function planQueDestraba(actual: BizPlan, clave: keyof Limites): BizPlan | null {
  // Las tiendas nuevas tienen un solo plan: no hay "el siguiente".
  if (actual === 'vendedor') return null;
  const orden: BizPlan[] = ['semilla', 'raiz', 'bosque'];
  const desde = orden.indexOf(actual);
  for (const p of orden.slice(desde + 1)) {
    const a = LIMITES[actual][clave];
    const b = LIMITES[p][clave];
    if (typeof a === 'number' && typeof b === 'number' && b > a) return p;
    if (typeof a === 'boolean' && b === true && a === false) return p;
    if (clave === 'analitica' && b === 'completa' && a === 'basica') return p;
  }
  return null;
}

/** `Infinity` no se muestra: el tope de Bosque se dice con palabras. */
export function textoTope(n: number): string | null {
  return n >= SIN_TOPE ? null : String(n);
}

/**
 * Lo que devuelve `negocio_plan_estado`. `cobro_activo = false` es el MODO
 * FUNDADOR: todo funciona, sin tarjeta y sin prueba, con los topes de Raíz.
 */
export interface EstadoPlan {
  /** Mercado v2: 'vendedor' es el alta nueva; 'legacy', el flujo de empresas de 0105. */
  modelo?: 'vendedor' | 'legacy';
  mp?: { vinculado: boolean; nickname: string | null };
  precio_vendedor?: { usd: number; ars: number | null; tipo_cambio: number | null; fecha: string | null; fuente: string | null };
  cobro_activo: boolean;
  plan: BizPlan;
  limites: Limites;
  uso: { listados: number; objetivos: number; miembros: number; replanificaciones: number };
  escritura: boolean;
  fundador: boolean;
  prueba_fin: string | null;
  en_prueba: boolean;
  rol: 'owner' | 'admin' | 'editor' | null;
  suscripcion: {
    plan: BizPlan;
    status: EstadoSuscripcion;
    monto: number | null;
    moneda: string | null;
    precio_bloqueado: boolean;
    periodo_fin: string | null;
    gracia_fin: string | null;
    desde: string;
  } | null;
  precios: { semilla: number; raiz: number; bosque: number; moneda: string };
}

/** Días que faltan para una fecha, hacia arriba. Nunca negativo. */
export function diasHasta(fecha: string | null, hoy: Date = new Date()): number {
  if (!fecha) return 0;
  const ms = new Date(fecha).getTime() - hoy.getTime();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

/**
 * En qué estado está la empresa para la interfaz. Un solo lugar para decidir
 * qué banda se muestra arriba de la pantalla, y qué dice.
 */
export type SituacionPlan = 'fundador' | 'prueba' | 'activa' | 'gracia' | 'sin_plan' | 'sin_cobro';

export function situacion(e: EstadoPlan): SituacionPlan {
  // Una tienda nueva con el cobro apagado no es "fundadora": es gratis por
  // ahora, y se dice así.
  if (!e.cobro_activo) return e.modelo === 'vendedor' ? 'sin_cobro' : 'fundador';
  if (e.suscripcion?.status === 'en_gracia') return 'gracia';
  if (e.suscripcion?.status === 'activa') return 'activa';
  if (e.en_prueba) return 'prueba';
  return 'sin_plan';
}
