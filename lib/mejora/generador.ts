// Relativos, no `@/lib/mejora/*`: el build de tests compila a CommonJS plano y
// ahí el alias no existe (mismo motivo que `lib/world/mojon.ts`).
import {
  ORDEN_INVERSION,
  PALANCAS,
  cumpleRequisitos,
  palancasPara,
  type Palanca,
} from './palancas';
import {
  BANDA_SUSTITUCION,
  BANDAS,
  asignarAmbicion,
  redondear,
  solapaConYaHecho,
  validarObjetivo,
} from './realismo';
import type {
  ContextoValidacion,
  Dossier,
  NegocioParaMejora,
  NumeroODesconocido,
  ObjetivoPropuesto,
} from './tipos';

/**
 * Generación de objetivos sin IA (`06_PROMPTS_IA.md` §7.1).
 *
 * No es un plan de contingencia: es el camino que corre hoy, porque el
 * proyecto no tiene `GEMINI_API_KEY`. También es el reemplazo de cualquier
 * objetivo que la IA proponga y el validador descarte.
 *
 * La empresa no percibe diferencia de calidad: las palancas ya vienen escritas
 * en voz de producto. Lo que se pierde es la adaptación fina al caso.
 */

const KM_LOCAL = 50;

function numero(v: NumeroODesconocido): number | null {
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null;
}

/** La línea de base que el dossier puede dar para la unidad de una palanca. */
export function lineaBaseDe(p: Palanca, d: Dossier): { valor: number | null; origen: 'factura' | 'estimado' } {
  if (p.unidad === 'kWh/mes' || p.unidad === 'kWh/noche') {
    const v = numero(d.energia.consumo_mensual);
    return { valor: v, origen: d.energia.tiene_factura === true ? 'factura' : 'estimado' };
  }
  if (p.unidad === 'bolsas/semana') return { valor: numero(d.residuos.bolsas_semana), origen: 'estimado' };
  if (p.unidad === 'litros/mes') return { valor: numero(d.agua.consumo_mensual), origen: 'estimado' };
  return { valor: null, origen: 'estimado' };
}

/** ¿Tienen con qué medir esto? Es lo que más define si el objetivo va a funcionar. */
export function tieneInstrumento(p: Palanca, d: Dossier): boolean {
  if (p.metodo_tipo === 'factura') {
    return d.energia.tiene_factura === true || numero(d.energia.consumo_mensual) !== null;
  }
  // Conteo, pesaje, remito, planilla y foto fechada no necesitan nada que no
  // tengan: una balanza común, los remitos del proveedor o una hoja.
  return true;
}

/** El puntaje de una palanca contra un dossier (`CATALOGO_PALANCAS.md` §final). */
export function puntuarPalanca(p: Palanca, d: Dossier): number {
  // 4. Restricciones declaradas: no negociables.
  if (d.restricciones.presupuesto === 'ninguno' && p.inversion !== 'ninguna') return -999;
  if (p.esfuerzo_horas_mes > d.restricciones.horas_mes_disponibles) return -999;
  // 5. Ya hecho.
  if (solapaConYaHecho({ titulo: p.titulo_plantilla, metrica: p.metrica }, d.ya_hecho, p.claves)) return -999;
  if (!cumpleRequisitos(p, d)) return -999;

  // 1. Impacto potencial.
  let s = ((p.efecto_min + p.efecto_max) / 2) * 100;

  // 2. ¿Tienen con qué medirlo?
  if (tieneInstrumento(p, d)) s += 25;
  else if (p.ambicion === 'basico') s += 15;
  else s -= 20;

  // 3. Huecos evidentes del dossier.
  if (p.dominio === 'residuos' && d.residuos.separa === false) s += 25;
  if (p.dominio === 'energia' && d.energia.tiene_factura === true) s += 15;
  if (p.dominio === 'agua' && d.agua.es_relevante === true) s += 15;

  // 6. Empezar barato es empezar.
  if (p.esfuerzo_horas_mes <= 2) s += 10;

  return s;
}

function variables(p: Palanca, d: Dossier, pct: number): Record<string, string> {
  const material = d.residuos.que_tiran?.trim();
  const producto = d.operacion.que_produce?.trim();
  return {
    espacio: 'el local',
    materiales: material ? primeraFrase(material) : 'cartón y vidrio',
    producto: producto ? primeraFrase(producto) : 'lo que más vendés',
    porcentaje: String(Math.round(pct * 100)),
    pct: String(Math.round(pct * 100)),
    km: String(KM_LOCAL),
  };
}

/** Lo primero que nombraron, sin la lista entera: cabe en un título. */
function primeraFrase(texto: string): string {
  const limpio = texto.replace(/\s+/g, ' ').trim();
  const corte = limpio.split(/[,.;]| y /)[0]?.trim() ?? limpio;
  return (corte.length > 34 ? corte.slice(0, 34).trim() : corte).toLowerCase();
}

function sustituir(plantilla: string, vars: Record<string, string>): string {
  return plantilla.replace(/\{\{(\w+)\}\}/g, (_, k: string) => vars[k] ?? '');
}

/**
 * Una palanca convertida en objetivo concreto para este negocio.
 *
 * El número sale de la banda que le corresponde, no del rango de la palanca:
 * el rango orienta, la banda manda (05 §5.1). Un cambio discreto
 * (`es_evento_unico`) sí puede pasarse del techo, que es lo que permite
 * "de 6 a 5 bolsas por semana" en un trimestre.
 */
export function rellenarPlantilla(p: Palanca, d: Dossier, negocio: NegocioParaMejora): ObjetivoPropuesto | null {
  const [minB, maxB] = p.metrica_tipo === 'sustitucion' ? BANDA_SUSTITUCION : BANDAS[p.horizonte];
  const medio = (p.efecto_min + p.efecto_max) / 2;
  const delta = p.es_evento_unico ? Math.max(medio, minB) : Math.min(Math.max(medio, minB), maxB);

  const base = lineaBaseDe(p, d);
  let linea_base: number | null = null;
  let objetivo: number | null = null;
  let unidad = p.unidad;
  let origen_base: ObjetivoPropuesto['origen_base'] = 'a_medir';

  if (p.metrica_tipo === 'medicion') {
    origen_base = 'a_medir';
  } else if (p.metrica_tipo === 'sustitucion') {
    // Sustitución: qué porcentaje cambia. Arranca en 0 y la meta es la porción
    // que se mueve este ciclo.
    unidad = p.unidad.trim().startsWith('%') ? p.unidad : `% de ${p.metrica}`;
    linea_base = 0;
    objetivo = Math.round(delta * 100);
    origen_base = 'estimado';
  } else {
    // Reducción sin línea de base: el objetivo de este ciclo es MEDIR, no
    // reducir (06 §2, regla de línea de base). No se descarta la palanca: se
    // convierte en su paso previo.
    if (base.valor == null) return comoMedicion(p, d, negocio);
    linea_base = base.valor;
    objetivo = redondear(base.valor * (1 - delta));
    origen_base = base.origen;
  }

  const vars = variables(p, d, delta);
  const propuesto: ObjetivoPropuesto = {
    titulo: sustituir(p.titulo_plantilla, vars),
    porque: p.porque,
    dominio: p.dominio,
    palanca_slug: p.slug,
    metrica: p.metrica,
    unidad,
    linea_base,
    objetivo,
    origen_base,
    horizonte: p.horizonte,
    ambicion: p.ambicion,
    esfuerzo_horas_mes: p.esfuerzo_horas_mes,
    inversion: p.inversion,
    es_evento_unico: p.es_evento_unico ?? false,
    metrica_tipo: p.metrica_tipo,
    metodo_tipo: p.metodo_tipo,
    alcance: p.alcance,
    como_medir: p.como_medir,
    pasos: p.pasos.map((x) => sustituir(x, vars)),
    evidencia_requerida: p.evidencia_requerida,
    si_no_llegas: p.si_no_llegas,
    confianza: p.confianza,
    supuestos: [],
  };

  // §5.3: lo único que se corrige acá es el `avanzado` con confianza baja, que
  // es una promesa vacía. El resto de la escalera la define el catálogo.
  const ajuste = asignarAmbicion(propuesto);
  if (propuesto.ambicion === 'avanzado' && propuesto.confianza === 'baja') {
    propuesto.ambicion = ajuste.ambicion;
    propuesto.objetivo = ajuste.objetivo;
  }

  return propuesto;
}

/**
 * La versión "medir primero" de una palanca de reducción, para cuando el
 * dossier no tiene el dato. Ambición básica y esfuerzo acotado a 2 h/mes, como
 * pide 02 §4.4: medir es el primer escalón, no un objetivo caro.
 */
function comoMedicion(p: Palanca, d: Dossier, negocio: NegocioParaMejora): ObjetivoPropuesto {
  const vars = variables(p, d, 0);
  return {
    titulo: `Medir ${p.metrica} para tener una línea de base`,
    porque: `Sin el dato de ${p.metrica} cualquier meta sería un número inventado. Tres registros seguidos alcanzan para saber de dónde partís, y recién ahí el objetivo de bajarlo tiene sentido.`,
    dominio: p.dominio,
    palanca_slug: p.slug,
    metrica: p.metrica,
    unidad: p.unidad,
    linea_base: null,
    objetivo: null,
    origen_base: 'a_medir',
    horizonte: 'trimestral',
    ambicion: 'basico',
    esfuerzo_horas_mes: Math.min(p.esfuerzo_horas_mes, 2),
    inversion: 'ninguna',
    es_evento_unico: false,
    metrica_tipo: 'medicion',
    metodo_tipo: p.metodo_tipo,
    alcance: p.alcance,
    como_medir: p.como_medir,
    pasos: [
      'Definir quién anota el dato y cada cuánto',
      `Registrar ${p.metrica} durante 3 períodos seguidos`,
      sustituir(p.pasos[0] ?? 'Ordenar el registro en una planilla', vars),
      'Marcar el período más alto y anotar qué pasó',
    ],
    evidencia_requerida: 'Planilla o fotos del registro de los 3 períodos',
    si_no_llegas: 'Con dos períodos registrados ya tenés con qué empezar. Cerralo con lo que juntaste.',
    confianza: 'alta',
    supuestos: [],
  };
}

export interface OpcionesGenerador {
  /** Slugs que no se vuelven a proponer: ya están propuestos, activos o cerrados. */
  excluir?: string[];
  cantidad?: number;
}

/**
 * Tres objetivos: uno básico, uno intermedio y el mejor puntuado que quede.
 * Una escalera, no tres cosas sueltas — y el primero que ve la empresa es
 * siempre el fácil, porque cerrar el primero es lo que hace que haya un segundo.
 */
export function objetivosPorReglas(
  dossier: Dossier,
  negocio: NegocioParaMejora,
  opciones: OpcionesGenerador = {},
): ObjetivoPropuesto[] {
  const excluir = new Set(opciones.excluir ?? []);
  const cantidad = opciones.cantidad ?? 3;
  const ctx: ContextoValidacion = { dossier, activos: [] };

  const candidatas = palancasPara(negocio.rubro, negocio.tamano)
    .filter((p) => !excluir.has(p.slug))
    .map((p) => ({ p, puntaje: puntuarPalanca(p, dossier) }))
    .filter((x) => x.puntaje > -900)
    .sort((a, b) => b.puntaje - a.puntaje || ORDEN_INVERSION[a.p.inversion] - ORDEN_INVERSION[b.p.inversion]);

  const elegidas: ObjetivoPropuesto[] = [];
  const usadas = new Set<string>();

  const tomar = (filtro: (p: Palanca) => boolean): void => {
    if (elegidas.length >= cantidad) return;
    for (const { p } of candidatas) {
      if (usadas.has(p.slug) || !filtro(p)) continue;
      const g = rellenarPlantilla(p, dossier, negocio);
      if (!g) continue;
      if (!validarObjetivo(g, ctx, { claves: p.claves }).valido) continue;
      elegidas.push(g);
      usadas.add(p.slug);
      return;
    }
  };

  tomar((p) => p.ambicion === 'basico');
  tomar((p) => p.ambicion === 'intermedio');
  while (elegidas.length < cantidad) {
    const antes = elegidas.length;
    tomar(() => true);
    if (elegidas.length === antes) break; // no queda nada que valide
  }

  return elegidas;
}

/**
 * Completa una tanda de objetivos (de IA o de reglas) con palancas hasta
 * llegar a `minimo` (06 §2, post-proceso 3).
 */
export function completarConPalancas(
  objetivos: ObjetivoPropuesto[],
  dossier: Dossier,
  negocio: NegocioParaMejora,
  minimo = 3,
  excluir: string[] = [],
): ObjetivoPropuesto[] {
  if (objetivos.length >= minimo) return objetivos;
  const yaUsados = [
    ...excluir,
    ...objetivos.map((o) => o.palanca_slug).filter((x): x is string => typeof x === 'string'),
  ];
  const extra = objetivosPorReglas(dossier, negocio, {
    excluir: yaUsados,
    cantidad: minimo - objetivos.length,
  });
  return [...objetivos, ...extra];
}

/** Ordena por ambición ascendente: el primero que ve la empresa es el fácil. */
export function ordenarPorAmbicion(objetivos: ObjetivoPropuesto[]): ObjetivoPropuesto[] {
  const peso = { basico: 0, intermedio: 1, avanzado: 2 };
  return [...objetivos].sort((a, b) => peso[a.ambicion] - peso[b.ambicion]);
}

/** Las palancas que se le pasan a Gemini para que no invente (06 §2). */
export function palancasParaPrompt(negocio: NegocioParaMejora, dossier: Dossier, tope = 12) {
  return palancasPara(negocio.rubro, negocio.tamano)
    .map((p) => ({ p, puntaje: puntuarPalanca(p, dossier) }))
    .filter((x) => x.puntaje > -900)
    .sort((a, b) => b.puntaje - a.puntaje)
    .slice(0, tope)
    .map(({ p }) => ({
      slug: p.slug,
      titulo: p.titulo_plantilla,
      dominio: p.dominio,
      metrica: p.metrica,
      unidad: p.unidad,
      horizonte: p.horizonte,
      ambicion: p.ambicion,
      esfuerzo_horas_mes: p.esfuerzo_horas_mes,
      inversion: p.inversion,
      efecto: `${Math.round(p.efecto_min * 100)}-${Math.round(p.efecto_max * 100)}%`,
      como_medir: p.como_medir,
    }));
}

export { PALANCAS };
