import type { Nivel } from './claims';

/**
 * El orden del catálogo (05_ALGORITMOS §4).
 *
 *   score = 100 × (0.40·C + 0.25·F + 0.15·A + 0.10·S + 0.10·X) − P
 *
 * Lo MATERIALIZADO en `listings.score` es `100 × (0.40·C + 0.15·A + 0.10·S +
 * 0.10·X) − P`, calculado en la base por `brote_listado_score()` (espejo exacto
 * de las funciones de abajo). El `0.25·F` es por persona y se suma en vivo en
 * el servidor de Next, sobre la página que devolvió el cursor.
 *
 * Relativo y sin alias: lo compila también el runner de tests.
 */

export const PESOS = { C: 0.4, F: 0.25, A: 0.15, S: 0.1, X: 0.1 } as const;

/** Todo lo que el puntaje materializado necesita de un listado publicado. */
export interface EntradaListado {
  tierEfectivo: Nivel;
  tierEmpresa: Nivel;
  afirmacionesDeclaradas: number;
  afirmacionesAprobadas: number;
  /** Días desde la última revisión de su evidencia. */
  diasDesdeRevision: number;
  /** Días desde la última vez que la empresa cambió el contenido. */
  diasDesdeActualizacion: number;
  diasDesdePublicacion: number;
  progresoMejora: number;
  /** Reportes de "no responde" / "enlace roto" de 90 días, y cuántos se respondieron a tiempo. */
  reportesRespuesta: { total: number; aTiempo: number };
  linkFallos: number;
  clics90: number;
  impresiones90: number;
  medianaCtrCategoria: number | null;
  reportesConfirmados90: number;
  reportesAfirmacionAbiertos: number;
  /** Hace cuántos días venció la certificación más vieja vencida, o null. */
  certVencidaHaceDias: number | null;
  sinActualizarMas12Meses?: boolean;
  enGracia: boolean;
}

// ── C — credibilidad (§3.4) ─────────────────────────────────────────────────

/** Cuánto pesa cada nivel en la credibilidad. Exportado: `lib/negocio/sugerencias.ts` compara dos niveles con esto. */
export const BASE_CREDIBILIDAD: Record<Nivel, number> = { e0: 0, e1: 0.35, e2: 0.65, e3: 0.9, e4: 0.9 };
const BASE = BASE_CREDIBILIDAD;

export function credibilidad(e: EntradaListado): number {
  // E4 es de la empresa: +0.10 al listado, tope 1.0.
  const base = e.tierEmpresa === 'e4' ? Math.min(1, BASE[e.tierEfectivo] + 0.1) : BASE[e.tierEfectivo];
  // Declarar más nunca puede ser peor que declarar menos: el piso es 0.7.
  const cobertura = 0.7 + 0.3 * (e.afirmacionesDeclaradas === 0 ? 0 : e.afirmacionesAprobadas / e.afirmacionesDeclaradas);
  const frescura = e.diasDesdeRevision < 365 ? 1 : e.diasDesdeRevision < 730 ? 0.9 : 0.8;
  return base * cobertura * frescura;
}

// ── A — actividad (§4.3) ────────────────────────────────────────────────────

export function actividad(e: EntradaListado): number {
  const frescura = Math.exp(-e.diasDesdeActualizacion / 120);
  // Acá el programa de objetivos se convierte en visibilidad: mejorar te hace visible.
  const mejora = Math.min(100, Math.max(0, e.progresoMejora)) / 100;
  const respuesta = e.reportesRespuesta.total === 0 ? 1 : e.reportesRespuesta.aTiempo / e.reportesRespuesta.total;
  return 0.4 * frescura + 0.3 * mejora + 0.3 * respuesta;
}

// ── S — salud de servicio (§4.4) ────────────────────────────────────────────

export const PISO_IMPRESIONES = 50;

export function salud(e: EntradaListado): number {
  const enlace = e.linkFallos <= 0 ? 1 : e.linkFallos === 1 ? 0.5 : 0;
  const tasa = e.clics90 === 0 ? (e.reportesConfirmados90 > 0 ? 1 : 0) : Math.min(1, e.reportesConfirmados90 / e.clics90);
  // Sin el piso de 50 impresiones, el ruido de los primeros días decidiría el
  // ranking. Por debajo, 0.5: neutro. Contra la mediana de la categoría, la
  // mediana vale 0.5 y el doble de la mediana, 1.
  let senal = 0.5;
  if (e.impresiones90 >= PISO_IMPRESIONES && e.medianaCtrCategoria) {
    senal = Math.min(1, (0.5 * (e.clics90 / e.impresiones90)) / e.medianaCtrCategoria);
  }
  return 0.5 * enlace + 0.3 * (1 - tasa) + 0.2 * senal;
}

// ── X — exploración (§4.5) ──────────────────────────────────────────────────

export function exploracion(e: EntradaListado): number {
  return e.diasDesdePublicacion < 21 ? Math.exp(-e.diasDesdePublicacion / 7) : 0;
}

// ── P — penalizaciones (§4.6) ───────────────────────────────────────────────

export function penalizaciones(e: EntradaListado): number {
  let p = 0;
  if (e.certVencidaHaceDias !== null) p += e.certVencidaHaceDias <= 30 ? 5 : 15;
  if (e.reportesAfirmacionAbiertos > 0) p += 20;
  if (e.reportesConfirmados90 > 0) p += 30;
  if (e.linkFallos >= 2) p += 25;
  if (e.sinActualizarMas12Meses ?? e.diasDesdeActualizacion > 365) p += 10;
  if (e.enGracia) p += 15;
  return p;
}

// ── El puntaje ──────────────────────────────────────────────────────────────

// El plan de la empresa NO entra en esta fórmula, nunca.
// Si algún día se agrega un término de plan acá, el catálogo pierde lo único
// que lo hace distinto de un directorio pago. Ver 09_MONETIZACION.md §2.1.
export function scoreMaterializado(e: EntradaListado): number {
  const s =
    100 * (PESOS.C * credibilidad(e) + PESOS.A * actividad(e) + PESOS.S * salud(e) + PESOS.X * exploracion(e)) -
    penalizaciones(e);
  return Math.round(s * 1000) / 1000;
}

// ── F — fit, en vivo (§4.2) ─────────────────────────────────────────────────

export interface TarjetaParaFit {
  dominios: string[];
  disponibilidad: 'online' | 'local' | 'ambas' | string;
  zonas: string[];
  categoria: string;
  negocio: { provincia: string | null };
  tieneImagen: boolean;
  descripcionLargo: number;
  tienePrecio: boolean;
}

export interface Persona {
  intereses: string[];
  /** `profiles.city`, que guarda la PROVINCIA (F15.4): se usa la columna, no el nombre. */
  provincia: string | null;
}

export function fit(t: TarjetaParaFit, persona: Persona | null, categoriaFiltrada: string | null = null): number {
  // Sin sesión o sin intereses, afinidad neutra.
  let afinidad = 0.5;
  if (persona && persona.intereses.length > 0 && t.dominios.length > 0) {
    const comunes = t.dominios.filter((d) => persona.intereses.includes(d)).length;
    afinidad = comunes / t.dominios.length;
  }

  // Online llega a todos. Local: la persona guarda provincia, no ciudad, así que
  // "misma provincia" es 0.7; si el comercio declara que llega a su provincia, 1.
  let cercania = 1;
  if (t.disponibilidad === 'local') {
    if (!persona?.provincia) cercania = 0.5;
    else if (t.zonas.includes(persona.provincia)) cercania = 1;
    else cercania = t.negocio.provincia === persona.provincia ? 0.7 : 0.3;
  }

  const relevancia = categoriaFiltrada && categoriaFiltrada === t.categoria ? 1 : 0.6;
  const completitud = ((t.tieneImagen ? 1 : 0) + (t.descripcionLargo > 200 ? 1 : 0) + (t.tienePrecio ? 1 : 0)) / 3;

  return 0.45 * afinidad + 0.25 * cercania + 0.2 * relevancia + 0.1 * completitud;
}

/** Materializado + 0.25·F, en puntos. */
export function scoreEnVivo(materializado: number, f: number): number {
  return materializado + 100 * PESOS.F * f;
}

// ── Diversidad (§4.7) ───────────────────────────────────────────────────────

/**
 * Re-ordena una página: cada aparición de la misma empresa vale 0.7× la
 * anterior (mismo patrón que el re-rank de fuentes de noticias).
 *
 * El factor solo no GARANTIZA "máximo 2 seguidos" (02 §5.7): si una empresa
 * domina el puntaje, su tercero todavía puede ganarle a todos los demás. Por
 * eso hay una segunda pasada: si van dos seguidos de la misma empresa, el
 * siguiente se toma de otra — siempre que haya otra. Con poca oferta no deja
 * huecos: si no hay alternativa, sigue.
 */
export function reordenarPorDiversidad<T extends { score: number; negocio: { slug: string } }>(items: readonly T[]): T[] {
  const vistos = new Map<string, number>();
  const ajustados = [...items]
    .sort((a, b) => b.score - a.score)
    .map((item) => {
      const n = vistos.get(item.negocio.slug) ?? 0;
      vistos.set(item.negocio.slug, n + 1);
      return { item, ajustado: item.score * Math.pow(0.7, n) };
    })
    .sort((a, b) => b.ajustado - a.ajustado)
    .map((x) => x.item);

  const salida: T[] = [];
  const pendientes = [...ajustados];
  while (pendientes.length > 0) {
    const [a, b] = [salida[salida.length - 1], salida[salida.length - 2]];
    const racha = a && b && a.negocio.slug === b.negocio.slug ? a.negocio.slug : null;
    let i = 0;
    if (racha) {
      const otro = pendientes.findIndex((p) => p.negocio.slug !== racha);
      if (otro >= 0) i = otro;
    }
    salida.push(pendientes.splice(i, 1)[0]!);
  }
  return salida;
}
