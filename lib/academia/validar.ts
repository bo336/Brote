/**
 * La frontera: cada paso que llega del servidor pasa por acá antes de tocar un
 * renderer.
 *
 * Dos cosas, y las dos importan:
 *   1. Un payload mal formado se descarta en vez de romper la pantalla. El
 *      contenido lo valida `construir.mjs` antes de cargarse, pero la pantalla
 *      no puede depender de que eso siempre haya pasado.
 *   2. Un payload que trae algo con forma de solución se RECHAZA. Es la
 *      segunda cerradura de la regla "la respuesta no cruza el cable": si
 *      alguna vez el servidor se equivoca, el cliente no la usa.
 */

import { z } from 'zod';
import type { Payload } from '@/lib/academia/modelo';

const ficha = z.object({ id: z.string().min(1), texto: z.string().min(1) });
const fichas = z.array(ficha).min(1);

const datos = z.union([
  z.object({
    tipo: z.literal('barras'),
    titulo: z.string(),
    unidad: z.string(),
    filas: z.array(z.object({ etiqueta: z.string(), valor: z.number() })).min(1),
    nota: z.string().optional(),
  }),
  z.object({
    tipo: z.literal('tabla'),
    titulo: z.string(),
    columnas: z.array(z.string()).min(1),
    filas: z.array(z.array(z.string())).min(1),
    nota: z.string().optional(),
  }),
]);

const adjuntos = {
  contexto: z.string().optional(),
  datos: datos.optional(),
  ayuda: z.string().optional(),
};

const esquemas = {
  teoria: z.object({
    tipo: z.literal('teoria'),
    titulo: z.string(),
    cuerpo: z.array(z.string()).min(1),
    destacado: z.object({ valor: z.string(), texto: z.string() }).optional(),
    lista: z.array(z.string()).optional(),
    nota: z.string().optional(),
    datos: datos.optional(),
  }),
  ejemplo: z.object({
    tipo: z.literal('ejemplo'),
    titulo: z.string(),
    planteo: z.string(),
    pasos: z.array(z.string()).min(1),
    resultado: z.string(),
    datos: datos.optional(),
  }),
  opcion: z.object({ tipo: z.literal('opcion'), enunciado: z.string(), opciones: fichas, ...adjuntos }),
  multiple: z.object({ tipo: z.literal('multiple'), enunciado: z.string(), opciones: fichas, ...adjuntos }),
  vf: z.object({
    tipo: z.literal('vf'),
    enunciado: z.string(),
    afirmacion: z.string(),
    razones: fichas.optional(),
    ...adjuntos,
  }),
  ordenar: z.object({
    tipo: z.literal('ordenar'),
    enunciado: z.string(),
    items: fichas,
    extremos: z.tuple([z.string(), z.string()]).optional(),
    ...adjuntos,
  }),
  ranking: z.object({
    tipo: z.literal('ranking'),
    enunciado: z.string(),
    items: fichas,
    extremos: z.tuple([z.string(), z.string()]).optional(),
    ...adjuntos,
  }),
  cadena: z.object({
    tipo: z.literal('cadena'),
    enunciado: z.string(),
    items: fichas,
    largo: z.number().int().min(2),
    extremos: z.tuple([z.string(), z.string()]).optional(),
    ...adjuntos,
  }),
  clasificar: z.object({
    tipo: z.literal('clasificar'),
    enunciado: z.string(),
    grupos: z.array(z.object({ id: z.string(), nombre: z.string() })).min(2),
    items: fichas,
    ...adjuntos,
  }),
  emparejar: z.object({
    tipo: z.literal('emparejar'),
    enunciado: z.string(),
    izquierda: fichas,
    derecha: fichas,
    ...adjuntos,
  }),
  completar: z.object({
    tipo: z.literal('completar'),
    enunciado: z.string(),
    texto: z.string(),
    banco: fichas,
    ...adjuntos,
  }),
  numero: z.object({
    tipo: z.literal('numero'),
    enunciado: z.string(),
    unidad: z.string(),
    decimales: z.number().int().min(0).max(4),
    ...adjuntos,
  }),
  estimar: z.object({
    tipo: z.literal('estimar'),
    enunciado: z.string(),
    min: z.number(),
    max: z.number(),
    paso: z.number().positive(),
    unidad: z.string(),
    escala: z.enum(['lineal', 'log']),
    ...adjuntos,
  }),
  detectar: z.object({
    tipo: z.literal('detectar'),
    enunciado: z.string(),
    segmentos: fichas,
    ...adjuntos,
  }),
} as const;

/** Campos que solo pueden existir en una solución. */
const PROHIBIDOS = ['clave', 'solucion', 'explicacion', 'por_opcion', 'valores', 'correcta', 'tolerancia', 'banda'];

export function validarPayload(p: unknown): { ok: true; payload: Payload } | { ok: false; motivo: string } {
  if (!p || typeof p !== 'object') return { ok: false, motivo: 'payload vacío' };
  const tipo = (p as { tipo?: string }).tipo;
  if (!tipo || !(tipo in esquemas)) return { ok: false, motivo: `tipo desconocido ${String(tipo)}` };

  for (const k of PROHIBIDOS) {
    if (k in (p as Record<string, unknown>)) return { ok: false, motivo: `el payload trae «${k}»` };
  }
  if ((tipo === 'numero' || tipo === 'estimar') && 'valor' in (p as Record<string, unknown>)) {
    return { ok: false, motivo: 'el payload trae el valor' };
  }

  const r = esquemas[tipo as keyof typeof esquemas].safeParse(p);
  if (!r.success) return { ok: false, motivo: r.error.issues[0]?.message ?? 'forma inválida' };
  return { ok: true, payload: r.data as Payload };
}
