import { strict as assert } from 'node:assert';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

/**
 * Los términos para empresas (08 §7 y §10).
 *
 * Lo que se acepta tiene que ser lo que está publicado: si la página dice una
 * versión y la base guarda otra, el registro de aceptación no prueba nada.
 */

const RAIZ = process.cwd();
const PAGINA = readFileSync(join(RAIZ, 'app/legal/negocios/page.tsx'), 'utf8');
const SQL = readFileSync(join(RAIZ, 'supabase/migrations/0109_negocios_endurecimiento.sql'), 'utf8');
// Todas las migraciones en orden: la versión vigente es la ÚLTIMA que se
// escribe (0114 la subió al sumar a las tiendas).
const DIR = join(RAIZ, 'supabase/migrations');
const TODAS = readdirSync(DIR)
  .filter((f) => f.endsWith('.sql'))
  .sort()
  .map((f) => readFileSync(join(DIR, f), 'utf8'))
  .join('\n');

/** El valor de la última coincidencia de cualquiera de los patrones, por posición. */
function ultima(...patrones: RegExp[]): string | undefined {
  let mejor: { i: number; v: string } | undefined;
  for (const re of patrones) {
    for (const m of TODAS.matchAll(re)) {
      if (!mejor || m.index! > mejor.i) mejor = { i: m.index!, v: m[1]! };
    }
  }
  return mejor?.v;
}

test('la versión de la página es la que guarda la base', () => {
  const enPagina = PAGINA.match(/const VERSION = '([^']+)'/)?.[1];
  // La fila: el insert de 0109, o un `update app_settings set value = …` posterior.
  const enSql = ultima(
    /'negocios_terminos_version', '"([^"]+)"'::jsonb/g,
    /set value = '"([^"]+)"'::jsonb\s+where key = 'negocios_terminos_version'/g,
  );
  const porDefecto = ultima(/where key = 'negocios_terminos_version'\), '([^']+)'\)/g);
  assert.ok(enPagina, 'la página no declara su versión');
  assert.equal(enSql, enPagina, 'la fila de app_settings no coincide con la página');
  assert.equal(porDefecto, enPagina, 'el valor por defecto de brote_terminos_version no coincide');
});

test('están las diez cláusulas mínimas de 08 §7', () => {
  const titulos = [...PAGINA.matchAll(/<Section n="\d+" title="([^"]+)"/g)].map((m) => m[1]!);
  assert.ok(titulos.length >= 10, `solo hay ${titulos.length} secciones`);
  const juntos = titulos.join(' | ').toLowerCase();
  for (const tema of [
    'qué es brote',        // 1. plataforma de difusión
    'veracidad',           // 2. declaración + indemnidad
    'certificación',       // 3. los niveles no son certificación
    'despublicar',         // 4. derecho a despublicar
    'garantía',            // 5. sin garantía de tráfico
    'contenido',           // 6. contenido de la empresa
    'confidencial',        // 7. dossier
    'pago',                // 8. cobro y falta de pago
    'baja',                // 9. baja y conservación
    'precio',              // 10. cambios de precio
    'jurisdicción',        // ley aplicable
  ]) {
    assert.ok(juntos.includes(tema), `falta la cláusula sobre "${tema}"`);
  }
});

test('el texto no promete lo que Brote no hace', () => {
  // Las tres separaciones que sostienen la defensa legal (08 §3).
  assert.match(PAGINA, /No somos vendedores/);
  assert.match(PAGINA, /No intermediamos pagos/);
  assert.match(PAGINA, /No somos certificadores/);
  // Y el dossier, por escrito.
  assert.match(PAGINA, /no se publica nunca/i);
});

test('sin aceptar los términos no se puede mandar la empresa a revisión', () => {
  // La casilla es la cortesía; la regla es el trigger.
  assert.match(SQL, /faltan_terminos/);
  assert.match(SQL, /create trigger trg_biz_terminos before update on businesses/);
  const alta = readFileSync(join(RAIZ, 'components/negocio/alta/AltaNegocio.tsx'), 'utf8');
  assert.match(alta, /type="checkbox"/, 'no hay casilla explícita');
  assert.match(alta, /disabled=\{!acepta\}/, 'el botón de enviar no depende de la casilla');
  assert.match(alta, /aceptarTerminos\(/, 'no se registra la aceptación');
});
