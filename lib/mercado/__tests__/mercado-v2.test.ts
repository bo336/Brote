import { strict as assert } from 'node:assert';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import { CATEGORIAS, SUBCATEGORIAS, esSubcategoria } from '../categorias';
import { CLAIM_KINDS, terminosSinAfirmacion } from '../claims';
import { PRACTICAS, PRACTICAS_SUGERIDAS, practicasOrdenadas } from '../practicas';
import { FILTROS_VACIOS, cuantosFiltros, leerFiltros, urlBusqueda } from '../busqueda';
import { validarListado, type ListadoParaValidar } from '../validador';

/**
 * El Mercado v2 (0113 + 0114): lo que se repite a propósito entre TypeScript y
 * la base tiene que ser lo mismo, y lo que vive en la URL tiene que ida y
 * vuelta sin perder nada.
 */

const DIR = join(process.cwd(), 'supabase/migrations');
const SQL = readdirSync(DIR)
  .filter((f) => f.endsWith('.sql'))
  .sort()
  .map((f) => readFileSync(join(DIR, f), 'utf8'))
  .join('\n');

/** El cuerpo de la ÚLTIMA definición (no un `revoke … on function`). */
function cuerpo(nombre: string): string {
  let i = -1;
  for (const m of SQL.matchAll(new RegExp(`create (or replace )?function ${nombre}\\(`, 'g'))) i = m.index ?? i;
  assert.ok(i >= 0, `no se encontró ${nombre}`);
  return SQL.slice(i, SQL.indexOf('$fn$;', i));
}

test('las subcategorías son las mismas que en la base', () => {
  const c = cuerpo('brote_mercado_subcategorias');
  const json = JSON.parse(c.slice(c.indexOf("'{") + 1, c.lastIndexOf("}'") + 1)) as Record<string, string[]>;
  assert.deepEqual(Object.keys(json).sort(), [...CATEGORIAS].sort());
  for (const cat of CATEGORIAS) assert.deepEqual(json[cat], [...SUBCATEGORIAS[cat]], cat);
});

test('una subcategoría vale solo dentro de su categoría', () => {
  assert.equal(esSubcategoria('alimentos-frescos', 'bolsones'), true);
  assert.equal(esSubcategoria('bebidas', 'bolsones'), false);
  assert.equal(esSubcategoria('no-existe', 'bolsones'), false);
  // "accesorios" existe en tres categorías: la clave es por categoría.
  assert.equal(esSubcategoria('mascotas', 'accesorios'), true);
  assert.equal(esSubcategoria('movilidad', 'accesorios'), true);
});

test('las prácticas del compromiso son las mismas que en la base', () => {
  const c = cuerpo('brote_practicas');
  const sql = [...c.matchAll(/'([a-z-]+)'/g)].map((m) => m[1]!);
  assert.deepEqual(sql, [...PRACTICAS]);
});

test('las prácticas sugeridas existen y van primero', () => {
  for (const cat of CATEGORIAS) {
    for (const p of PRACTICAS_SUGERIDAS[cat]) assert.ok((PRACTICAS as readonly string[]).includes(p), `${cat}: ${p}`);
    const orden = practicasOrdenadas(cat);
    assert.equal(orden.length, PRACTICAS.length, 'no se pierde ninguna');
    assert.deepEqual(orden.slice(0, PRACTICAS_SUGERIDAS[cat].length), [...PRACTICAS_SUGERIDAS[cat]]);
  }
  assert.deepEqual(practicasOrdenadas(null), [...PRACTICAS]);
});

test('la base mira las mismas palabras ambientales que el validador', () => {
  // Cada tipo de afirmación con palabras en TypeScript tiene su patrón en
  // brote_termino_sin_afirmacion (0114): publicar en el acto no abre un hueco.
  const c = cuerpo('brote_termino_sin_afirmacion');
  const enSql = new Set([...c.matchAll(/\('([a-z_]+)',\s+'/g)].map((m) => m[1]!));
  for (const kind of CLAIM_KINDS) {
    if (kind === 'certificacion_tercero') continue;
    assert.ok(enSql.has(kind), `falta ${kind} en la base`);
  }
  assert.ok(c.includes('certificad'), 'falta "certificado"');
  // Y lo que cada lado detecta en frases de verdad.
  assert.equal(terminosSinAfirmacion('Harina orgánica de trigo', [])[0]?.kind, 'organico');
  assert.equal(terminosSinAfirmacion('Galletitas sin TACC', [])[0]?.kind, 'libre_de');
  assert.equal(terminosSinAfirmacion('Frasco de vidrio de 1 litro', []).length, 0);
});

test('la búsqueda en la URL: ida y vuelta', () => {
  const provincias = ['Buenos Aires', 'Córdoba'];
  const f = {
    ...FILTROS_VACIOS,
    q: 'jabón sólido',
    categoria: 'cuidado-personal',
    subcategoria: 'solidos',
    condicion: 'nuevo' as const,
    modalidad: 'online' as const,
    zona: 'Córdoba',
    nivel: 'e2' as const,
    precioMin: 1000,
    precioMax: 5000,
    orden: 'precio_asc' as const,
  };
  const url = urlBusqueda(f);
  const vuelta = leerFiltros(new URL(`https://x.invalid${url}`).searchParams, provincias);
  assert.deepEqual(vuelta, f);
  assert.equal(cuantosFiltros(vuelta), 7);
});

test('la búsqueda en la URL: lo inválido se ignora, nunca rompe', () => {
  const f = leerFiltros(
    { categoria: 'armas', sub: 'bolsones', nivel: 'e9', zona: 'Marte', modalidad: 'teletransporte', condicion: 'roto', orden: 'azar', desde: 'abc' },
    ['Buenos Aires'],
  );
  assert.deepEqual(f, FILTROS_VACIOS);
  // Una subcategoría de otra categoría no se cuela.
  assert.equal(leerFiltros({ categoria: 'bebidas', sub: 'bolsones' }, []).subcategoria, null);
  // Desde mayor que hasta: se dan vuelta.
  const p = leerFiltros({ desde: '9000', hasta: '100' }, []);
  assert.equal(p.precioMin, 100);
  assert.equal(p.precioMax, 9000);
  assert.equal(urlBusqueda({}), '/mercado/buscar');
});

function listado(extra: Partial<ListadoParaValidar> = {}): ListadoParaValidar {
  return {
    titulo: 'Bolsón de verduras de la huerta 5 kg',
    descripcion: 'Verduras cosechadas el día anterior, en cajón retornable.',
    categoria: 'alimentos-frescos',
    dominios: [],
    precio_referencia: 9000,
    url_destino: '',
    imagenes: 3,
    afirmaciones: [],
    tipo: 'producto',
    contacto: 'whatsapp',
    ...extra,
  };
}

test('una tienda nueva publica sin afirmación, con WhatsApp y sin sitio', () => {
  const r = validarListado(listado(), { modelo: 'vendedor' });
  assert.deepEqual(r.errores, []);
  // El flujo anterior sigue pidiendo afirmación, URL y descripción larga.
  const legacy = validarListado(listado(), { modelo: 'legacy' });
  const codigos = legacy.errores.map((e) => e.codigo);
  assert.ok(codigos.includes('sin_afirmaciones'));
  assert.ok(codigos.includes('url_invalida'));
  assert.ok(codigos.includes('descripcion_largo'));
});

test('una tienda nueva: precio de referencia obligatorio para un producto, hasta 8 fotos', () => {
  const sinPrecio = validarListado(listado({ precio_referencia: null }), { modelo: 'vendedor' });
  assert.ok(sinPrecio.errores.some((e) => e.codigo === 'falta_precio'));
  const servicio = validarListado(listado({ precio_referencia: null, tipo: 'servicio' }), { modelo: 'vendedor' });
  assert.ok(!servicio.errores.some((e) => e.codigo === 'falta_precio'));
  assert.ok(validarListado(listado({ imagenes: 8 }), { modelo: 'vendedor' }).ok);
  assert.ok(!validarListado(listado({ imagenes: 9 }), { modelo: 'vendedor' }).ok);
  // Con contacto web sí hace falta la URL.
  assert.ok(validarListado(listado({ contacto: 'web' }), { modelo: 'vendedor' }).errores.some((e) => e.codigo === 'url_invalida'));
});

test('una tienda nueva: sin afirmación, las palabras ambientales siguen sin pasar', () => {
  const r = validarListado(listado({ titulo: 'Bolsón de verduras orgánicas 5 kg' }), { modelo: 'vendedor' });
  assert.ok(r.errores.some((e) => e.codigo === 'termino_sin_afirmacion'));
  const salud = validarListado(listado({ descripcion: 'Verduras que curan el estrés y previenen todo, en cajón.' }), { modelo: 'vendedor' });
  assert.ok(salud.errores.some((e) => e.codigo === 'texto_prohibido'));
});
