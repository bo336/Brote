import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { test } from 'node:test';
import { LUGARES, RUTAS_LUGAR, lugarDe, scriptLugar } from '../../lugares';

/**
 * Los lugares de Brote (docs/REESTRUCTURA.md D1): cada ruta cae en su lugar,
 * el script de antes del primer cuadro dice lo mismo que `lugarDe`, y ningún
 * lugar vive en una dirección que el sitio redirige (pasó: `/explorar` era un
 * 308 permanente a la Plaza, y los navegadores guardan esos para siempre).
 */

function raiz(): string {
  let dir = __dirname;
  while (!fs.existsSync(path.join(dir, 'package.json'))) dir = path.dirname(dir);
  return dir;
}

const RUTAS = [
  '/',
  '/lugares',
  '/acciones',
  '/acciones/ducha-corta',
  '/competencias/abc',
  '/feed',
  '/feed/p/123',
  '/buscar',
  '/ranking',
  '/ranking/agua',
  '/aprender/u/agua',
  '/mundo',
  '/mercado/tienda/x',
  '/proyectos/1',
  '/impacto',
  '/perfil',
  '/perfil/ajustes',
  '/perfil/logros',
  '/perfil/vale',
  '/auth/login',
  '/onboarding',
  '/panel',
  '/negocio',
  '/legal/terminos',
  '/feeder',
];

test('cada ruta cae en su lugar', () => {
  assert.equal(lugarDe('/'), 'hoy');
  assert.equal(lugarDe('/lugares'), 'explorar');
  assert.equal(lugarDe('/feed/p/123'), 'plaza');
  assert.equal(lugarDe('/ranking'), 'liga');
  assert.equal(lugarDe('/aprender/u/agua'), 'academia');
  assert.equal(lugarDe('/perfil'), 'vos');
  assert.equal(lugarDe('/perfil/ajustes'), 'vos');
  assert.equal(lugarDe('/perfil/vale'), 'plaza', 'el perfil de otra persona es de la Plaza');
  assert.equal(lugarDe('/feeder'), null, 'un prefijo sólo vale entero');
  assert.equal(lugarDe('/panel'), null);
  assert.equal(lugarDe('/negocio'), null);
});

test('el script de antes del primer cuadro dice lo mismo que lugarDe', () => {
  const src = scriptLugar();
  for (const ruta of RUTAS) {
    const attrs: Record<string, string> = {};
    const sandbox = {
      location: { pathname: ruta },
      document: { documentElement: { setAttribute: (k: string, v: string) => (attrs[k] = v) } },
    };
    vm.runInNewContext(src, sandbox);
    assert.equal(attrs['data-lugar'] ?? null, lugarDe(ruta), ruta);
  }
});

test('cada lugar con color tiene su regla en globals.css', () => {
  const css = fs.readFileSync(path.join(raiz(), 'app/globals.css'), 'utf8');
  const conColor = Object.values(LUGARES).filter((l) => !['hoy', 'explorar', 'impacto', 'vos'].includes(l.key));
  for (const l of conColor) {
    assert.match(css, new RegExp(`html\\[data-lugar='${l.key}'\\]`), l.key);
  }
});

test('ningún lugar vive en una dirección que se redirige', () => {
  const cfg = fs.readFileSync(path.join(raiz(), 'next.config.mjs'), 'utf8');
  const origenes = [...cfg.matchAll(/source:\s*'([^']+)'/g)].map((m) => m[1]!);
  const nav = fs.readFileSync(path.join(raiz(), 'components/nav/nav-items.ts'), 'utf8');
  const hrefs = [...nav.matchAll(/href:\s*'([^'#?]+)/g)].map((m) => m[1]!);
  for (const ruta of [...RUTAS_LUGAR.map(([r]) => r), ...hrefs]) {
    assert.ok(!origenes.includes(ruta), `${ruta} es el origen de un redirect en next.config.mjs`);
  }
});
