import type {
  Ambicion,
  ContextoValidacion,
  Horizonte,
  MetodoTipo,
  MetricaTipo,
  ObjetivoPropuesto,
  ResultadoValidacion,
} from './tipos';

/**
 * El validador de realismo (`05_ALGORITMOS.md` §5).
 *
 * Corre SIEMPRE: sobre lo que devuelve Gemini y sobre lo que sale del catálogo
 * de palancas. Un objetivo que no lo pasa nunca se le muestra a la empresa —
 * se descarta en silencio y se reemplaza por una palanca que sí valide.
 *
 * Es el único módulo con tests unitarios obligatorios (fase 2 §3.2): es lo que
 * impide que un objetivo malo llegue a un cliente que paga.
 */

/** Bandas de contracción por horizonte: [mínimo esperado, máximo permitido]. */
export const BANDAS: Record<Horizonte, [number, number]> = {
  trimestral: [0.01, 0.08],
  semestral: [0.02, 0.12],
  anual: [0.04, 0.2],
};

/**
 * Sustitución (qué porcentaje de compras, productos o envíos cambia): son
 * escalones, no curvas, así que la banda es la misma en los tres horizontes.
 */
export const BANDA_SUSTITUCION: [number, number] = [0.1, 0.25];

export const FUERA_DE_CONTROL = [
  'que el municipio',
  'que tus clientes',
  'que el gobierno',
  'que tus proveedores decidan',
  'lograr que la gente',
  'convencer a la ciudad',
  'cambiar la legislación',
];

export const METODOS_VALIDOS: MetodoTipo[] = [
  'factura',
  'conteo',
  'pesaje',
  'remito',
  'planilla',
  'foto_fechada',
];

export const CAMPOS_OBLIGATORIOS: (keyof ObjetivoPropuesto)[] = [
  'titulo',
  'porque',
  'dominio',
  'metrica',
  'unidad',
  'origen_base',
  'horizonte',
  'ambicion',
  'esfuerzo_horas_mes',
  'inversion',
  'como_medir',
  'evidencia_requerida',
];

export const MAX_ESFUERZO_OBJETIVO = 6;
export const MAX_ESFUERZO_TOTAL = 12;
export const MAX_ACTIVOS = 3;

/** La banda que le corresponde a un objetivo según qué clase de métrica mueve. */
export function bandaDe(g: Pick<ObjetivoPropuesto, 'horizonte' | 'metrica_tipo'>): [number, number] {
  return g.metrica_tipo === 'sustitucion' ? BANDA_SUSTITUCION : BANDAS[g.horizonte];
}

/**
 * El cambio que propone el objetivo, como fracción.
 *
 * En sustitución medida en porcentaje ("pasar 15% de las compras"), el cambio
 * son los PUNTOS que se mueven: de 0 a 15 es 0,15. Tomarlo como cambio
 * relativo daría una división por cero o un número sin sentido.
 */
export function deltaDe(
  g: Pick<ObjetivoPropuesto, 'linea_base' | 'objetivo'> & Partial<Pick<ObjetivoPropuesto, 'unidad' | 'metrica_tipo'>>,
): number | null {
  if (g.linea_base == null || g.objetivo == null) return null;
  if (g.metrica_tipo === 'sustitucion' && (g.unidad ?? '').trim().startsWith('%')) {
    return Math.abs(g.objetivo - g.linea_base) / 100;
  }
  if (g.linea_base === 0) return null;
  return Math.abs((g.linea_base - g.objetivo) / g.linea_base);
}

const VACIAS = new Set([
  'de',
  'del',
  'la',
  'las',
  'el',
  'los',
  'un',
  'una',
  'unos',
  'unas',
  'para',
  'por',
  'con',
  'sin',
  'que',
  'como',
  'más',
  'mas',
  'menos',
  'todo',
  'toda',
  'todos',
  'todas',
  'nuestro',
  'nuestra',
  'nuestros',
  'nuestras',
  'ya',
  'hace',
  'hacemos',
  'tenemos',
  'usamos',
  'cada',
  'mes',
  'año',
  'ano',
  'anos',
  'años',
  'este',
  'esta',
  'desde',
  'hasta',
  'entre',
  'sus',
  'sobre',
]);

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(texto: string): string[] {
  return normalizar(texto)
    .split(' ')
    .filter((w) => w.length >= 4 && !VACIAS.has(w));
}

/**
 * Si el objetivo es algo que la empresa ya hizo (05 §5.2, R7).
 *
 * Dos caminos: las `claves` de la palanca (frases que significan "esto ya
 * está"), y — para lo que propone la IA, que puede no traer palanca — el
 * solapamiento de palabras distintivas entre el título y el campo "ya hecho".
 */
export function solapaConYaHecho(
  g: Pick<ObjetivoPropuesto, 'titulo' | 'metrica'>,
  yaHecho: string,
  claves: string[] = [],
): boolean {
  const hecho = normalizar(yaHecho ?? '');
  if (hecho.length < 8) return false;
  for (const c of claves) {
    if (hecho.includes(normalizar(c))) return true;
  }
  const delHecho = new Set(tokens(hecho));
  const delObjetivo = tokens(`${g.titulo} ${g.metrica}`);
  if (delObjetivo.length === 0) return false;
  const comunes = delObjetivo.filter((w) => delHecho.has(w));
  // Dos palabras distintivas compartidas, o la mitad del título, ya es la
  // misma idea dicha de otra forma.
  return comunes.length >= 2 || comunes.length / delObjetivo.length >= 0.5;
}

export interface OpcionesValidacion {
  /**
   * `propuesta`: lo que se le puede mostrar a la empresa.
   * `aceptacion`: lo que puede pasar a activo — suma las reglas de carga (R1
   * total y R2), que son del programa y no del objetivo. Una empresa con 3
   * activos igual puede RECIBIR propuestas; lo que no puede es aceptarlas
   * (fase 2 §5.3).
   */
  momento?: 'propuesta' | 'aceptacion';
  /** Las `claves` de la palanca de la que salió, para R7. */
  claves?: string[];
}

export function validarObjetivo(
  g: ObjetivoPropuesto,
  ctx: ContextoValidacion,
  opciones: OpcionesValidacion = {},
): ResultadoValidacion {
  const momento = opciones.momento ?? 'propuesta';
  const fallos: string[] = [];

  // R1 · Esfuerzo acotado. La regla que evita que sea la tarea principal.
  if (g.esfuerzo_horas_mes > MAX_ESFUERZO_OBJETIVO) fallos.push('esfuerzo_excede_6h');
  if (momento === 'aceptacion') {
    const suma = ctx.activos.reduce((a, x) => a + x.esfuerzo_horas_mes, 0);
    if (suma + g.esfuerzo_horas_mes > MAX_ESFUERZO_TOTAL) fallos.push('carga_total_excede_12h');

    // R2 · Máximo 3 activos.
    if (ctx.activos.length >= MAX_ACTIVOS) fallos.push('demasiados_activos');
  }

  // R3 · Ambición dentro de banda.
  const delta = deltaDe(g);
  const [min, max] = bandaDe(g);
  if (g.origen_base !== 'a_medir' && g.metrica_tipo !== 'medicion') {
    if (delta == null) fallos.push('sin_numeros');
    else {
      if (delta < min) fallos.push('ambicion_insignificante');
      if (delta > max && !g.es_evento_unico) fallos.push('ambicion_irreal');
    }
  }

  // R4 · Sin línea de base, el objetivo es medir.
  if (g.origen_base === 'a_medir' && g.metrica_tipo === 'reduccion') fallos.push('reduccion_sin_base');

  // R5 · Respeta la restricción de inversión declarada.
  if (ctx.dossier.restricciones.presupuesto === 'ninguno' && g.inversion !== 'ninguna')
    fallos.push('requiere_inversion_no_declarada');

  // R6 · Nada fuera de control del negocio.
  const titulo = normalizar(g.titulo);
  if (FUERA_DE_CONTROL.some((p) => titulo.includes(normalizar(p)))) fallos.push('fuera_de_control');

  // R7 · Nada que ya hicieron.
  if (solapaConYaHecho(g, ctx.dossier.ya_hecho, opciones.claves)) fallos.push('ya_realizado');

  // R8 · Método de medición con un instrumento que ya tienen.
  if (!METODOS_VALIDOS.includes(g.metodo_tipo)) fallos.push('medicion_no_disponible');

  // R9 · Alcance 3 se mide, no se pone como meta.
  if (g.alcance === 3 && g.metrica_tipo === 'reduccion') fallos.push('alcance3_como_meta');

  // R10 · Campos completos. Sin excepciones.
  for (const campo of CAMPOS_OBLIGATORIOS) {
    const v = g[campo];
    if (v == null || v === '') fallos.push(`falta_${campo}`);
  }
  if (!Array.isArray(g.pasos) || g.pasos.length < 3) fallos.push('falta_pasos');

  return { valido: fallos.length === 0, fallos };
}

/**
 * Ambición según el tamaño real del cambio (05 §5.3).
 *
 * `avanzado` con `confianza: baja` es una promesa vacía: se degrada a
 * `intermedio` y la meta baja al centro de la banda. Por eso devuelve también
 * el objetivo, que puede no ser el que entró.
 */
export function asignarAmbicion(
  g: Pick<
    ObjetivoPropuesto,
    | 'linea_base'
    | 'objetivo'
    | 'origen_base'
    | 'horizonte'
    | 'esfuerzo_horas_mes'
    | 'confianza'
    | 'metrica_tipo'
    | 'inversion'
  > &
    Partial<Pick<ObjetivoPropuesto, 'unidad'>>,
): { ambicion: Ambicion; objetivo: number | null } {
  const [min, max] = bandaDe(g);
  const delta = deltaDe(g);
  let ambicion: Ambicion;

  // El orden va de lo más específico a lo más general. La confianza NO entra
  // acá: primero se clasifica el cambio por lo que es, y recién después se
  // degrada si la confianza no lo sostiene. Mezclarlo hacía que un objetivo
  // avanzado con confianza baja cayera en "básico" y nunca se degradara.
  if (g.origen_base === 'a_medir' || g.metrica_tipo === 'medicion' || delta == null) {
    ambicion = 'basico';
  } else if (delta >= max * 0.7 && g.inversion !== 'ninguna') {
    // Cambio estructural: mueve casi todo lo que la banda permite y necesita
    // plata (proveedor, equipo, proceso).
    ambicion = 'avanzado';
  } else if (delta <= min * 1.5 || g.esfuerzo_horas_mes <= 2) {
    ambicion = 'basico';
  } else {
    ambicion = 'intermedio';
  }

  // Un avanzado con confianza baja es una promesa vacía (05 §5.3).
  if (ambicion === 'avanzado' && g.confianza === 'baja' && g.linea_base != null) {
    const centro = (min + max) / 2;
    // La meta baja al centro de la banda. En sustitución medida en porcentaje
    // eso son PUNTOS que se suman a la base (de 0 a 18), no una fracción de la
    // base: con la fórmula de reducción, una meta que arranca en 0 daba 0.
    const objetivo =
      g.metrica_tipo === 'sustitucion' && (g.unidad ?? '').trim().startsWith('%')
        ? redondear(g.linea_base + centro * 100)
        : redondear(g.linea_base * (1 - centro));
    return { ambicion: 'intermedio', objetivo };
  }
  return { ambicion, objetivo: g.objetivo };
}

/** Un objetivo se lee mejor sin decimales largos: 1.240 → 1.141, no 1.140,8. */
export function redondear(n: number): number {
  if (Math.abs(n) >= 100) return Math.round(n);
  if (Math.abs(n) >= 10) return Math.round(n * 10) / 10;
  return Math.round(n * 100) / 100;
}

/** El horizonte que sigue. El anual ya no sube: es el techo. */
export function subirHorizonte(h: Horizonte): Horizonte {
  return h === 'trimestral' ? 'semestral' : 'anual';
}

export const MESES_HORIZONTE: Record<Horizonte, number> = { trimestral: 3, semestral: 6, anual: 12 };

/** El vencimiento de un objetivo que arranca hoy. */
export function vencimiento(inicio: Date, h: Horizonte): Date {
  const d = new Date(inicio);
  d.setMonth(d.getMonth() + MESES_HORIZONTE[h]);
  return d;
}

/** Etiqueta de la clase de métrica, para las reglas que dependen de ella. */
export function esReduccion(t: MetricaTipo): boolean {
  return t === 'reduccion';
}
