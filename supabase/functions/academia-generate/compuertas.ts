// ─────────────────────────────────────────────────────────────────────────────
// Compuertas 2 y 3: Zod y las determinísticas.
//
// Van acá y no en SQL porque necesitan la semántica de cada tipo de ejercicio.
// Las que protegen algo —grounding, deduplicado, ruteo a revisión— viven en
// Postgres, donde ningún deploy las puede saltear.
//
// Estas son las baratas, y son las que atajan la mayoría: conformidad de
// esquema no es corrección semántica, pero un ítem con dos respuestas correctas
// o con un `{{slot}}` sin llenar se detecta contando, sin gastar un token.
// ─────────────────────────────────────────────────────────────────────────────

import { z } from 'https://esm.sh/zod@3.23.8';

const Opcion = z.object({ id: z.string().min(1), texto: z.string().min(1), dominio: z.string().optional() });
const base = { enunciado: z.string().min(10), ayuda: z.string().nullable().optional() };

/**
 * Los mismos doce esquemas que `lib/academia/schemas.ts`, con los ids todavía
 * sin barajar (o1, f1, t1…). El barajado lo hace `ac_barajar` al entregar.
 */
export const ESQUEMAS: Record<string, z.ZodTypeAny> = {
  opcion_multiple: z.object({ ...base, opciones: z.array(Opcion).min(3).max(5) }),
  elegir_la_accion: z.object({ ...base, escenario: z.string().min(10), opciones: z.array(Opcion).min(2).max(5) }),
  mito_o_dato: z.object({ ...base, afirmacion: z.string().min(10) }),
  ordenar_secuencia: z.object({ ...base, consigna: z.string().min(5), fragmentos: z.array(Opcion).min(3).max(6) }),
  ranking_impacto: z.object({ ...base, consigna: z.string().min(5), opciones: z.array(Opcion).min(3).max(5) }),
  cadena_causal: z.object({ ...base, fragmentos: z.array(Opcion).min(3).max(7), largo_cadena: z.number().int().min(2) }),
  clasificar_en_cestos: z.object({
    ...base,
    cestos: z.array(z.object({ id: z.string(), nombre: z.string(), color: z.string().nullable() })).min(2).max(4),
    fichas: z.array(Opcion).min(3).max(10),
  }),
  emparejar: z.object({ ...base, izquierda: z.array(Opcion).min(2).max(6), derecha: z.array(Opcion).min(2).max(6) }),
  estimacion_numerica: z.object({
    ...base,
    min: z.number(), max: z.number(), paso: z.number().positive(),
    unidad: z.string().min(1), escala: z.enum(['lineal', 'log']),
  }),
  detectar_greenwashing: z.object({ ...base, claim: z.string().min(20), spans: z.array(Opcion).min(2).max(8) }),
  mapa_localizar: z.object({
    ...base,
    centro: z.tuple([z.number(), z.number()]), zoom: z.number(), capa: z.string(),
    alternativas: z.array(Opcion).min(2).max(6),
  }),
  completar_frase: z.object({ ...base, frase: z.string().min(15), banco: z.array(Opcion).min(3).max(8) }),
};

export const CandidatoSchema = z.object({
  payload_publico: z.record(z.unknown()),
  solucion: z.record(z.unknown()),
  afirmaciones: z.array(z.object({
    claim: z.string().min(5),
    fuente_id: z.string().uuid(),
    cita: z.string().min(12),
  })).min(1),
  dificultad_estimada: z.number().optional(),
  age_groups: z.array(z.enum(['kid', 'teen', 'adult'])).optional(),
});

export type Candidato = z.infer<typeof CandidatoSchema>;

/** Colección que porta la respuesta, por tipo. Espeja `ac_token_key` en SQL. */
const COLECCION: Record<string, string | null> = {
  opcion_multiple: 'opciones', elegir_la_accion: 'opciones', ranking_impacto: 'opciones',
  ordenar_secuencia: 'fragmentos', cadena_causal: 'fragmentos',
  clasificar_en_cestos: 'fichas', emparejar: 'derecha',
  detectar_greenwashing: 'spans', completar_frase: 'banco',
  mapa_localizar: 'alternativas', mito_o_dato: null, estimacion_numerica: null,
};

function normalizar(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
}

export interface Veredicto {
  ok: boolean;
  fallas: string[];
}

/**
 * Las comprobaciones determinísticas. Gratis, y atajan la mayoría de lo que
 * sale mal.
 */
export function determinísticas(tipo: string, c: Candidato): Veredicto {
  const fallas: string[] = [];
  const p = c.payload_publico as Record<string, unknown>;
  const sol = c.solucion as Record<string, unknown>;

  // Ningún `{{slot}}` sin llenar, en ningún string del payload.
  const crudo = JSON.stringify(p);
  if (/\{\{[^}]+\}\}/.test(crudo.replace(/\{\{\d+\}\}/g, ''))) {
    fallas.push('quedó un {{slot}} sin llenar');
  }

  // Nada de razonamiento filtrado en el enunciado.
  const enunciado = String(p.enunciado ?? '');
  if (/\b(la respuesta correcta es|obviamente|claramente la opci)/i.test(enunciado)) {
    fallas.push('el enunciado filtra la respuesta');
  }
  // Nada de reto en segunda persona ni catástrofe.
  const todoTexto = crudo + JSON.stringify(sol);
  if (/\b(deberías sentirte|es tu culpa|estás destruyendo|el planeta se muere)\b/i.test(todoTexto)) {
    fallas.push('tono de culpa o catástrofe');
  }

  const col = COLECCION[tipo];
  if (col) {
    const arr = p[col] as { id: string; texto: string }[] | undefined;
    if (!Array.isArray(arr) || arr.length === 0) {
      fallas.push(`falta la colección "${col}"`);
    } else {
      // Ids únicos.
      const ids = arr.map((o) => o.id);
      if (new Set(ids).size !== ids.length) fallas.push('ids repetidos');
      // Textos distintos después de normalizar.
      const norms = arr.map((o) => normalizar(o.texto));
      if (new Set(norms).size !== norms.length) fallas.push('dos opciones dicen lo mismo');
      // Ninguna vacía.
      if (norms.some((n) => n.length < 2)) fallas.push('hay una opción vacía');
    }
  }

  // Exactamente una clave donde tiene que haber exactamente una.
  if (tipo === 'opcion_multiple' || tipo === 'elegir_la_accion' || tipo === 'mapa_localizar') {
    const clave = sol.clave as string[] | undefined;
    if (!Array.isArray(clave) || clave.length !== 1) {
      fallas.push('tiene que haber exactamente una respuesta correcta');
    } else {
      const arr = (p[COLECCION[tipo]!] ?? []) as { id: string; texto: string }[];
      const correcta = arr.find((o) => o.id === clave[0]);
      if (!correcta) {
        fallas.push('la clave no apunta a ninguna opción');
      } else if (arr.length > 1) {
        // La correcta no puede ser sistemáticamente la más larga: es la pista
        // más vieja del mundo y se detecta contando caracteres.
        const largos = arr.map((o) => o.texto.length);
        const maxOtros = Math.max(...arr.filter((o) => o.id !== clave[0]).map((o) => o.texto.length));
        if (correcta.texto.length > maxOtros * 1.6) fallas.push('la correcta es mucho más larga que el resto');
      }
    }
  }

  if (tipo === 'mito_o_dato' && typeof sol.es_dato !== 'boolean') {
    fallas.push('falta es_dato');
  }

  if (tipo === 'ordenar_secuencia' || tipo === 'ranking_impacto') {
    const clave = sol.clave as string[] | undefined;
    const arr = (p[COLECCION[tipo]!] ?? []) as { id: string }[];
    if (!Array.isArray(clave) || clave.length !== arr.length) {
      fallas.push('la clave tiene que ordenar TODOS los elementos');
    } else if (new Set(clave).size !== clave.length) {
      fallas.push('la clave repite un elemento');
    }
  }

  if (tipo === 'cadena_causal') {
    const clave = sol.clave as string[] | undefined;
    const largo = p.largo_cadena as number;
    if (!Array.isArray(clave) || clave.length !== largo) fallas.push('la cadena no mide largo_cadena');
  }

  if (tipo === 'emparejar') {
    const izq = (p.izquierda ?? []) as { id: string }[];
    const der = (p.derecha ?? []) as { id: string }[];
    const clave = sol.clave as Record<string, string> | undefined;
    if (izq.length !== der.length) fallas.push('las dos columnas tienen que medir lo mismo');
    if (!clave || Object.keys(clave).length !== izq.length) fallas.push('falta emparejar alguna');
    else if (new Set(Object.values(clave)).size !== izq.length) fallas.push('un mismo par usado dos veces');
  }

  if (tipo === 'clasificar_en_cestos') {
    const fichas = (p.fichas ?? []) as { id: string }[];
    const cestos = (p.cestos ?? []) as { id: string }[];
    const clave = sol.clave as Record<string, string> | undefined;
    if (!clave || Object.keys(clave).length !== fichas.length) fallas.push('hay fichas sin cesto');
    else {
      const ids = new Set(cestos.map((c) => c.id));
      if (Object.values(clave).some((v) => !ids.has(v))) fallas.push('una ficha va a un cesto inexistente');
      // Ningún cesto puede quedar vacío: un cesto sin fichas es decorado.
      if (new Set(Object.values(clave)).size < cestos.length) fallas.push('hay un cesto que queda vacío');
    }
  }

  if (tipo === 'estimacion_numerica') {
    const min = p.min as number, max = p.max as number;
    const valor = sol.valor as number;
    if (!(max > min)) fallas.push('max tiene que ser mayor que min');
    if (typeof valor !== 'number') fallas.push('falta el valor verdadero');
    else if (valor < min || valor > max) fallas.push('el valor verdadero cae fuera del rango');
    if (p.escala === 'log' && min <= 0) fallas.push('escala log con min <= 0');
  }

  if (tipo === 'completar_frase') {
    const frase = String(p.frase ?? '');
    const huecos = (frase.match(/\{\{\d+\}\}/g) ?? []).length;
    const clave = sol.clave as string[] | undefined;
    if (huecos === 0) fallas.push('la frase no tiene huecos');
    if (!Array.isArray(clave) || clave.length !== huecos) fallas.push('la clave no cubre todos los huecos');
    const banco = (p.banco ?? []) as { id: string }[];
    if (banco.length <= huecos) fallas.push('el banco no tiene distractores');
  }

  if (tipo === 'detectar_greenwashing') {
    const claim = String(p.claim ?? '');
    const spans = (p.spans ?? []) as { texto: string }[];
    const fuera = spans.filter((s) => !claim.includes(s.texto));
    if (fuera.length) fallas.push(`hay ${fuera.length} span que no aparece literal en el claim`);
    const clave = sol.clave as string[] | undefined;
    if (!Array.isArray(clave) || clave.length === 0) fallas.push('no marca ningún span sin respaldo');
    if (Array.isArray(clave) && clave.length === spans.length) fallas.push('marca TODOS los spans: no enseña a distinguir');
  }

  // La explicación es el contenido del ejercicio, no un adorno.
  if (typeof sol.explicacion !== 'string' || (sol.explicacion as string).length < 30) {
    fallas.push('falta la explicación, o es demasiado corta');
  }

  return { ok: fallas.length === 0, fallas };
}

/** Compuerta 2 completa: Zod del sobre, Zod del payload por tipo, y las determinísticas. */
export function validar(tipo: string, crudo: unknown): { ok: true; candidato: Candidato } | { ok: false; fallas: string[] } {
  const sobre = CandidatoSchema.safeParse(crudo);
  if (!sobre.success) {
    return { ok: false, fallas: sobre.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`) };
  }
  const esquema = ESQUEMAS[tipo];
  if (!esquema) return { ok: false, fallas: [`tipo desconocido: ${tipo}`] };
  const payload = esquema.safeParse(sobre.data.payload_publico);
  if (!payload.success) {
    return { ok: false, fallas: payload.error.issues.map((i) => `payload.${i.path.join('.')}: ${i.message}`) };
  }
  const det = determinísticas(tipo, sobre.data);
  if (!det.ok) return { ok: false, fallas: det.fallas };
  return { ok: true, candidato: sobre.data };
}
