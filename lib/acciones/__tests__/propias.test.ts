import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import {
  REGLAS_PROPIAS,
  motivoTituloPropio,
  normalizarPropia,
  puntosDeLaProxima,
  raices,
  sugerirDelCatalogo,
} from '../propias';

/**
 * Acciones propias (0150): las reglas de TypeScript son las de la base, los
 * filtros fáciles hacen lo que dicen y la propia nunca toca el impacto real.
 */

function raiz(): string {
  let dir = __dirname;
  while (!fs.existsSync(path.join(dir, 'package.json'))) dir = path.dirname(dir);
  return dir;
}
const SQL = fs.readFileSync(path.join(raiz(), 'supabase/migrations/0150_acciones_propias_y_baja_de_negocio.sql'), 'utf8');

test('las reglas son las mismas que en brote_propias_reglas()', () => {
  const bloque = /function public\.brote_propias_reglas\(\)[\s\S]*?jsonb_build_object\(([\s\S]*?)\);/.exec(SQL);
  assert.ok(bloque, 'no encontré brote_propias_reglas');
  const pares = [...bloque![1]!.matchAll(/'([a-z_]+)',\s*(\d+)/g)].map((m) => [m[1]!, Number(m[2])] as const);
  assert.deepEqual(Object.fromEntries(pares), { ...REGLAS_PROPIAS });
});

test('los checks de la tabla usan los mismos largos', () => {
  assert.match(SQL, new RegExp(`char_length\\(titulo\\) between ${REGLAS_PROPIAS.min_largo} and ${REGLAS_PROPIAS.max_largo}`));
  assert.match(SQL, new RegExp(`char_length\\(nota\\) <= ${REGLAS_PROPIAS.max_nota}`));
});

test('una acción propia no escribe activity_completions (no mueve el impacto real)', () => {
  const sinComentarios = SQL.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
  assert.doesNotMatch(sinComentarios, /insert\s+into\s+(public\.)?activity_completions/i);
  assert.doesNotMatch(sinComentarios, /current_streak\s*=/i, 'tampoco toca la racha');
});

test('títulos que sirven', () => {
  for (const t of ['Llevé bolsas al súper', 'Arreglé una canilla que goteaba', 'Junté tapitas para el hospital', '  Separé   vidrio  ']) {
    assert.equal(motivoTituloPropio(t), null, t);
  }
});

test('títulos que no sirven, cada uno por su motivo', () => {
  assert.equal(motivoTituloPropio('hola'), 'corto');
  assert.equal(motivoTituloPropio('x'.repeat(91)), 'largo');
  assert.equal(motivoTituloPropio('Compostaje'), 'palabras');
  assert.equal(motivoTituloPropio('aaaaaaa bbbbb'), 'texto');
  assert.equal(motivoTituloPropio('12 34 56'), 'texto');
});

test('normalizar compara como la base', () => {
  assert.equal(normalizarPropia('Llevé  las BOLSAS al súper!!'), 'lleve las bolsas al super');
  assert.equal(normalizarPropia('Año nuevo, cañería'), 'ano nuevo caneria');
});

test('sólo las primeras del día suman, siempre lo mismo', () => {
  assert.equal(puntosDeLaProxima(3), REGLAS_PROPIAS.puntos);
  assert.equal(puntosDeLaProxima(1), REGLAS_PROPIAS.puntos);
  assert.equal(puntosDeLaProxima(0), 0);
});

test('ofrece la acción del catálogo que se parece', () => {
  const cat = [
    { id: '1', slug: 'bolsa', title_es: 'Llevá tu bolsa reutilizable al súper', domain_slug: 'residuos' },
    { id: '2', slug: 'ducha', title_es: 'Ducha de 5 minutos', domain_slug: 'agua' },
    { id: '3', slug: 'canilla', title_es: 'Cerrá la canilla mientras te cepillás', domain_slug: 'agua' },
  ];
  assert.deepEqual(sugerirDelCatalogo('Llevé bolsas reutilizables al super', cat).map((a) => a.slug), ['bolsa']);
  assert.deepEqual(sugerirDelCatalogo('me di una ducha de 5 minutos', cat).map((a) => a.slug), ['ducha']);
  assert.deepEqual(sugerirDelCatalogo('Planté un árbol en la vereda', cat), []);
  assert.ok(raices('de la en con').length === 0);
});

test('con el catálogo real: sugiere lo que es y no sugiere lo que no es', () => {
  const cat = (JSON.parse(fs.readFileSync(path.join(raiz(), 'scripts/acciones/catalogo.json'), 'utf8')) as { acciones: { slug: string; title_es: string; domain_slug: string }[] }).acciones.map((a, i) => ({ ...a, id: String(i) }));
  const titulos = (t: string) => sugerirDelCatalogo(t, cat, 2).map((a) => a.title_es);
  assert.ok(titulos('Llevé bolsas reutilizables al súper').some((t) => /bolsa/i.test(t)));
  assert.ok(titulos('Arreglé la canilla que goteaba').some((t) => /Arreglá una canilla/.test(t)));
  assert.ok(titulos('Junté tapitas para el hospital').some((t) => /tapitas/i.test(t)));
  assert.deepEqual(titulos('Planté tomates en el balcón'), []);
});
