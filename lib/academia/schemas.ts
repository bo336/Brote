/**
 * Esquemas Zod de la Academia: uno por `payload_publico` y uno por respuesta.
 *
 * PARA QUÉ SIRVEN. El servidor arma los payloads y es la autoridad, así que
 * esto no es "validación de entrada". Es un contrato ejecutable en el borde:
 *
 *   1. La fase 3 va a generar ítems con un modelo. Conformidad de esquema no es
 *      corrección semántica, pero un payload mal formado tiene que morir acá y
 *      no tres capas más adentro, dentro de un renderer, delante de una persona.
 *   2. Si un tipo nuevo se agrega mal, `parsearPaso` lo rechaza en el acto en
 *      vez de romper la pantalla.
 *   3. `SinRespuesta` es la red de seguridad de la regla más importante de la
 *      sección: verifica que un payload NO traiga la solución. Es la única
 *      comprobación de este archivo que protege algo, y no un tipo.
 *
 * Agregar un tipo nuevo es: un esquema acá, un renderer, y una rama en el
 * corrector SQL. Nada más (11-exercise-types.md §6).
 */

import { z } from 'zod';

// ── Piezas ───────────────────────────────────────────────────────────────────

const Opcion = z.object({
  id: z.string(),
  texto: z.string(),
  dominio: z.string().optional(),
});

const Cesto = z.object({
  id: z.string(),
  nombre: z.string(),
  color: z.string().nullable(),
});

const base = {
  enunciado: z.string(),
  ayuda: z.string().nullable(),
};

// ── Presentación ─────────────────────────────────────────────────────────────

export const MicrolecturaSchema = z.object({
  ...base,
  tipo: z.literal('microlectura'),
  cuerpo: z.string(),
  destacado: z.string().nullable(),
});

export const DatoVivoSchema = z.object({
  ...base,
  tipo: z.literal('dato_vivo'),
  valor: z.number(),
  unidad: z.string(),
  que_significa: z.string(),
});

// ── Los doce que se corrigen ─────────────────────────────────────────────────

export const OpcionMultipleSchema = z.object({
  ...base,
  tipo: z.literal('opcion_multiple'),
  opciones: z.array(Opcion).min(2),
});

export const ElegirLaAccionSchema = z.object({
  ...base,
  tipo: z.literal('elegir_la_accion'),
  escenario: z.string(),
  opciones: z.array(Opcion).min(2),
});

export const MitoODatoSchema = z.object({
  ...base,
  tipo: z.literal('mito_o_dato'),
  afirmacion: z.string(),
});

export const OrdenarSecuenciaSchema = z.object({
  ...base,
  tipo: z.literal('ordenar_secuencia'),
  consigna: z.string(),
  fragmentos: z.array(Opcion).min(3),
});

export const RankingImpactoSchema = z.object({
  ...base,
  tipo: z.literal('ranking_impacto'),
  consigna: z.string(),
  opciones: z.array(Opcion).min(3),
});

export const CadenaCausalSchema = z.object({
  ...base,
  tipo: z.literal('cadena_causal'),
  fragmentos: z.array(Opcion).min(3),
  largo_cadena: z.number().int().min(2),
});

export const ClasificarEnCestosSchema = z.object({
  ...base,
  tipo: z.literal('clasificar_en_cestos'),
  cestos: z.array(Cesto).min(2),
  fichas: z.array(Opcion).min(2),
});

// Sin `.refine()`: `z.discriminatedUnion` solo acepta objetos, y un
// `ZodEffects` no lo es. Las invariantes que cruzan campos se comprueban en
// `parsearPaso`, después de discriminar por tipo.
export const EmparejarSchema = z.object({
  ...base,
  tipo: z.literal('emparejar'),
  izquierda: z.array(Opcion).min(2),
  derecha: z.array(Opcion).min(2),
});

export const EstimacionNumericaSchema = z.object({
  ...base,
  tipo: z.literal('estimacion_numerica'),
  min: z.number(),
  max: z.number(),
  paso: z.number().positive(),
  unidad: z.string(),
  escala: z.enum(['lineal', 'log']),
});

export const DetectarGreenwashingSchema = z.object({
  ...base,
  tipo: z.literal('detectar_greenwashing'),
  claim: z.string(),
  spans: z.array(Opcion).min(2),
});

export const MapaLocalizarSchema = z.object({
  ...base,
  tipo: z.literal('mapa_localizar'),
  centro: z.tuple([z.number(), z.number()]),
  zoom: z.number(),
  capa: z.string(),
  // Obligatorio: es la versión sin mapa. Un tipo que no se puede completar con
  // teclado y lector de pantalla no se publica (11-exercise-types.md §5).
  alternativas: z.array(Opcion).min(2),
});

export const CompletarFraseSchema = z.object({
  ...base,
  tipo: z.literal('completar_frase'),
  frase: z.string(),
  banco: z.array(Opcion).min(3),
});

export const PayloadSchema = z.discriminatedUnion('tipo', [
  MicrolecturaSchema,
  DatoVivoSchema,
  OpcionMultipleSchema,
  ElegirLaAccionSchema,
  MitoODatoSchema,
  OrdenarSecuenciaSchema,
  RankingImpactoSchema,
  CadenaCausalSchema,
  ClasificarEnCestosSchema,
  EmparejarSchema,
  EstimacionNumericaSchema,
  DetectarGreenwashingSchema,
  MapaLocalizarSchema,
  CompletarFraseSchema,
]);

export type PayloadValidado = z.infer<typeof PayloadSchema>;

/**
 * Ningún campo de solución puede viajar en un payload de ejercicio.
 *
 * Es la regla de AGENT-RULES §3 escrita como código en vez de como comentario.
 * `clave` no está en ningún esquema de arriba, así que Zod ya la ignoraría en
 * silencio: esto la CAZA. Se corre sobre el objeto crudo, antes de parsear.
 */
const CAMPOS_PROHIBIDOS = [
  'clave',
  'solucion',
  'explicacion',
  'es_dato',
  'por_opcion',
  'fuente_id',
  'fuente',
  'correcto',
  'valores',
  'region',
] as const;

export function sinRespuesta(payload: unknown): { ok: true } | { ok: false; campo: string } {
  if (payload == null || typeof payload !== 'object') return { ok: true };
  const visto = new Set<object>();
  const stack: unknown[] = [payload];
  while (stack.length) {
    const nodo = stack.pop();
    if (nodo == null || typeof nodo !== 'object') continue;
    if (visto.has(nodo)) continue;
    visto.add(nodo);
    if (Array.isArray(nodo)) {
      stack.push(...nodo);
      continue;
    }
    for (const [k, v] of Object.entries(nodo)) {
      // `valor` es legítimo en dato_vivo (el número que se muestra) pero sería
      // la respuesta en estimacion_numerica. El tipo decide.
      if (k === 'valor' && (nodo as { tipo?: string }).tipo === 'dato_vivo') continue;
      if ((CAMPOS_PROHIBIDOS as readonly string[]).includes(k)) return { ok: false, campo: k };
      stack.push(v);
    }
  }
  return { ok: true };
}

/**
 * Valida un paso recibido del servidor. Devuelve el payload tipado o el motivo
 * del rechazo — nunca tira, porque la pantalla tiene que poder saltear un paso
 * roto sin tumbar la sesión entera.
 */
export function parsearPaso(payload: unknown):
  | { ok: true; payload: PayloadValidado }
  | { ok: false; motivo: string } {
  const fuga = sinRespuesta(payload);
  if (!fuga.ok) {
    return { ok: false, motivo: `el payload traía "${fuga.campo}", que es parte de la solución` };
  }
  const r = PayloadSchema.safeParse(payload);
  if (!r.success) return { ok: false, motivo: r.error.issues[0]?.message ?? 'payload inválido' };

  // Invariantes que cruzan campos: no caben en el union discriminado.
  const p = r.data;
  if (p.tipo === 'emparejar' && p.izquierda.length !== p.derecha.length) {
    return { ok: false, motivo: 'emparejar: las dos columnas tienen que medir lo mismo' };
  }
  if (p.tipo === 'estimacion_numerica' && p.max <= p.min) {
    return { ok: false, motivo: 'estimacion_numerica: max tiene que ser mayor que min' };
  }
  if (p.tipo === 'cadena_causal' && p.largo_cadena > p.fragmentos.length) {
    return { ok: false, motivo: 'cadena_causal: la cadena no puede ser más larga que los fragmentos' };
  }
  return { ok: true, payload: p };
}

// ── La respuesta corregida ───────────────────────────────────────────────────

const FuenteSchema = z.object({
  titulo: z.string(),
  organizacion: z.string(),
  url: z.string(),
  publicado: z.string().nullable(),
});

export const RespuestaCorregidaSchema = z.object({
  ok: z.literal(true),
  correcto: z.boolean(),
  parcial: z.coerce.number(),
  explicacion: z.string().nullable(),
  clave: z.union([z.array(z.string()), z.record(z.string()), z.null()]),
  clave_cruda: z.unknown().nullable(),
  nota_opcion: z.string().nullable(),
  misconception: z.string().nullable(),
  fuerza_concepto: z.coerce.number(),
  fuente: FuenteSchema.nullable(),
  reencolada: z.boolean(),
  recuperacion: z.boolean(),
});

/** Lo que el cliente manda, por tipo. El servidor vuelve a validar todo. */
export const RespuestaEnviadaSchema = z.union([
  z.object({ elegido: z.string() }),
  z.object({ es_dato: z.boolean() }),
  z.object({ orden: z.array(z.string()) }),
  z.object({ cadena: z.array(z.string()) }),
  z.object({ asignacion: z.record(z.string()) }),
  z.object({ pares: z.record(z.string()) }),
  z.object({ valor: z.number() }),
  z.object({ marcados: z.array(z.string()) }),
  z.object({ region: z.string() }),
  z.object({ huecos: z.array(z.string()) }),
]);
