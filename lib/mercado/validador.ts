import { esCategoria } from './categorias';
import {
  MAX_AFIRMACIONES,
  buscarProhibido,
  buscarVagos,
  terminosSinAfirmacion,
  validarAfirmacion,
  type Afirmacion,
  type CertInfo,
} from './claims';

/**
 * El validador determinista de un listado (fase 3 §3).
 *
 * Corre SIEMPRE, con o sin IA, y antes del screener: la IA puede mirar lo que
 * esto deja pasar, nunca en lugar de esto. La base vuelve a chequear lo que
 * tiene consecuencia legal (`listado_enviar`), para que una llamada directa no
 * se saltee nada.
 *
 * Pura y sin red: la URL viva la chequea `url.ts` en el servidor.
 */

export interface ListadoParaValidar {
  titulo: string;
  descripcion: string;
  categoria: string;
  dominios: string[];
  precio_referencia: number | null;
  url_destino: string;
  imagenes: number;
  afirmaciones: Afirmacion[];
}

export interface ErrorListado {
  campo: string;
  codigo: string;
  detalle?: string;
  /** Índice de la afirmación, cuando el error es de una. */
  afirmacion?: number;
}

export interface Bandera {
  campo: 'titulo' | 'descripcion';
  termino: string;
}

export interface ResultadoListado {
  ok: boolean;
  errores: ErrorListado[];
  /** Términos vagos: no bloquean, los decide el revisor. */
  banderas: Bandera[];
}

/**
 * Rubros que no entran al catálogo (08 §8.3): apuestas, tabaco y vapeo, armas,
 * cripto, venta bajo receta, suplementos con afirmaciones de salud. Se buscan
 * en el texto del listado; el alta los frena por rubro.
 */
export const RUBROS_INCOMPATIBLES: { tema: string; re: RegExp }[] = [
  { tema: 'apuestas', re: /\b(apuestas?|casino|timba|loter[ií]a)\b/i },
  { tema: 'tabaco', re: /\b(tabaco|cigarrill[oa]s?|cigarros?|vapeador(es)?|vapers?|vapes?|pods? de nicotina|nicotina)\b/i },
  { tema: 'armas', re: /\b(armas? de fuego|pistolas?|rev[oó]lver(es)?|municiones?|escopetas?)\b/i },
  { tema: 'cripto', re: /\b(criptomonedas?|bitcoin|btc|ethereum|miner[ií]a de cripto)\b/i },
  { tema: 'receta', re: /\b(bajo receta|venta con receta|requiere receta)\b/i },
  { tema: 'suplementos', re: /\bsuplementos? (diet[eé]ticos?|vitam[ií]nicos?)\b/i },
];

export function temaIncompatible(texto: string): string | null {
  return RUBROS_INCOMPATIBLES.find((r) => r.re.test(texto))?.tema ?? null;
}

export function validarListado(
  l: ListadoParaValidar,
  opciones: { certs?: readonly CertInfo[]; hoy?: string } = {},
): ResultadoListado {
  const errores: ErrorListado[] = [];
  const banderas: Bandera[] = [];
  const titulo = l.titulo.trim();
  const descripcion = l.descripcion.trim();

  if (titulo.length < 10 || titulo.length > 70) errores.push({ campo: 'titulo', codigo: 'titulo_largo' });
  if (descripcion.length < 80 || descripcion.length > 2000) errores.push({ campo: 'descripcion', codigo: 'descripcion_largo' });
  if (!esCategoria(l.categoria)) errores.push({ campo: 'categoria', codigo: 'categoria_invalida' });
  if (l.dominios.length > 3) errores.push({ campo: 'dominios', codigo: 'dominios_invalidos' });
  if (l.imagenes < 1) errores.push({ campo: 'imagenes', codigo: 'faltan_imagenes' });
  if (l.imagenes > 4) errores.push({ campo: 'imagenes', codigo: 'max_imagenes' });
  if (l.precio_referencia !== null && !(Number.isFinite(l.precio_referencia) && l.precio_referencia > 0)) {
    errores.push({ campo: 'precio_referencia', codigo: 'precio_invalido' });
  }
  if (!/^https:\/\/[^\s/]+\.[^\s/]+/i.test(l.url_destino.trim())) errores.push({ campo: 'url_destino', codigo: 'url_invalida' });

  // Absolutos y salud: rechazo duro, en el título Y en la descripción. Las
  // afirmaciones de salud se rechazan tenga la certificación que tenga.
  for (const campo of ['titulo', 'descripcion'] as const) {
    const termino = buscarProhibido(campo === 'titulo' ? titulo : descripcion);
    if (termino) errores.push({ campo, codigo: 'texto_prohibido', detalle: termino });
    for (const v of buscarVagos(campo === 'titulo' ? titulo : descripcion)) banderas.push({ campo, termino: v });
  }

  const tema = temaIncompatible(`${titulo} ${descripcion}`);
  if (tema) errores.push({ campo: 'descripcion', codigo: 'rubro_incompatible', detalle: tema });

  // Las afirmaciones: 1 a 5, cada una válida.
  if (l.afirmaciones.length === 0) errores.push({ campo: 'afirmaciones', codigo: 'sin_afirmaciones' });
  if (l.afirmaciones.length > MAX_AFIRMACIONES) errores.push({ campo: 'afirmaciones', codigo: 'max_afirmaciones' });
  l.afirmaciones.forEach((a, i) => {
    for (const e of validarAfirmacion(a, { categoria: l.categoria, certs: opciones.certs, hoy: opciones.hoy })) {
      errores.push({ campo: e.campo, codigo: e.codigo, afirmacion: i });
    }
  });

  // Una afirmación ambiental en el texto libre sin la afirmación tipificada
  // cargada: "orgánico" en el título sin la afirmación "orgánico" no existe
  // (RUBRICA §1). Es el mecanismo entero: la afirmación solo se hace tipificada.
  for (const f of terminosSinAfirmacion(`${titulo} ${descripcion}`, l.afirmaciones)) {
    errores.push({ campo: 'descripcion', codigo: 'termino_sin_afirmacion', detalle: `${f.termino}|${f.kind}` });
  }

  return { ok: errores.length === 0, errores, banderas };
}
