import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { NIVEL_PALABRA, escaparXml, snippetSello, svgSello, textoSugerido } from '../sello';

/**
 * El sello va a vivir en sitios que no controlamos. Ahí es donde más importa
 * que no diga de más (08 §2.3).
 */

test('el sello dice el nivel con las palabras de 08 §4.2', () => {
  const svg = svgSello('Molino del Valle', 'e3');
  assert.match(svg, /Nivel 3 · Certificación de tercero/);
  assert.match(svg, /PROGRAMA BROTE/);
  assert.match(svg, /Molino del Valle/);
});

test('el sello NUNCA dice verificado, garantizado ni aprobado', () => {
  for (const nivel of ['e1', 'e2', 'e3', 'e4'] as const) {
    const svg = svgSello('Comercio', nivel);
    assert.ok(!/verificad|garantizad|aprobad/i.test(svg), `el sello de ${nivel} promete de más`);
  }
  for (const palabra of Object.values(NIVEL_PALABRA)) {
    assert.ok(!/verificad|garantizad|aprobad/i.test(palabra), `"${palabra}" describe el producto`);
  }
});

test('un nombre con comillas o < no rompe el SVG', () => {
  const svg = svgSello('Pan & "Café" <script>', 'e1');
  assert.ok(!svg.includes('<script>'));
  assert.match(svg, /&amp;/);
  assert.equal(escaparXml(`<a href="x">'`), '&lt;a href=&quot;x&quot;&gt;&#39;');
});

test('un nombre largo se corta, no desborda', () => {
  const svg = svgSello('Cooperativa de Trabajo Agropecuaria del Valle de Tandil Limitada', 'e2');
  const texto = svg.match(/font-size="11" fill="#8A8F98">([^<]*)</)?.[1] ?? '';
  assert.ok(texto.length <= 28, texto);
  assert.match(texto, /…$/);
});

test('el snippet linkea a la ficha y trae la imagen del sello', () => {
  const s = snippetSello('https://brote.app', 'molino', 'Molino');
  assert.match(s, /href="https:\/\/brote\.app\/mercado\/negocio\/molino\?ref=sello"/);
  assert.match(s, /src="https:\/\/brote\.app\/api\/sello\/molino\.svg"/);
  assert.match(s, /rel="noopener"/);
});

test('el texto sugerido no promete nada sobre los productos', () => {
  const con = textoSugerido('Molino', 'e3', 2);
  const sin = textoSugerido('Molino', 'e1', 0);
  assert.match(con, /2 objetivos ambientales/);
  assert.match(sin, /Estamos trabajando/);
  for (const t of [con, sin]) {
    assert.ok(!/el mejor|garantiz|100%|el más/i.test(t), t);
  }
});

test('el route handler usa la función pura y cachea una hora', () => {
  const src = readFileSync(join(process.cwd(), 'app/api/sello/[slug]/route.ts'), 'utf8');
  assert.match(src, /svgSello\(/);
  assert.match(src, /max-age=3600/);
});
