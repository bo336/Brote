import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import {
  DEFENSA_CONSUMIDOR,
  DIAS_ARREPENTIMIENTO,
  ETIQUETA,
  RUTA,
  SERVICIOS,
  codigoValido,
  dentroDelPlazo,
  diasDesde,
  tipoDeCodigo,
} from '../reglas';
import { elegirUrlApp, esUrlDeApp } from '../../url-app';

function raiz(): string {
  let dir = __dirname;
  while (!fs.existsSync(path.join(dir, 'package.json'))) dir = path.dirname(dir);
  return dir;
}
const leer = (rel: string) => fs.readFileSync(path.join(raiz(), rel), 'utf8');

test('the two links carry the exact names Disposición 954/2025 requires', () => {
  assert.equal(ETIQUETA.arrepentimiento.toLocaleUpperCase('es'), 'BOTÓN DE ARREPENTIMIENTO');
  assert.equal(ETIQUETA.baja.toLocaleUpperCase('es'), 'BOTÓN DE BAJA DE SERVICIO');
  assert.match(DEFENSA_CONSUMIDOR.texto, /^Defensa de las y los Consumidores\. Para reclamos ingrese aquí$/);
  assert.match(DEFENSA_CONSUMIDOR.url, /^https:\/\/www\.argentina\.gob\.ar\//);
});

test('both buttons work without an account: public routes, short redirects, no session needed', () => {
  for (const r of Object.values(RUTA)) assert.ok(r.startsWith('/legal/'), r);
  assert.match(leer('lib/supabase/middleware.ts'), /'\/legal',/);
  const cfg = leer('next.config.mjs');
  assert.match(cfg, /source: '\/arrepentimiento', destination: '\/legal\/arrepentimiento'/);
  assert.match(cfg, /source: '\/baja', destination: '\/legal\/baja'/);
  for (const p of ['app/legal/arrepentimiento/page.tsx', 'app/legal/baja/page.tsx', 'app/legal/atencion/page.tsx']) {
    assert.ok(fs.existsSync(path.join(raiz(), p)), p);
  }
});

test('the links are on every first screen: sign-in, Inicio, Perfil, Brote+, legal and public pages', () => {
  for (const p of [
    'components/auth/PantallaAcceso.tsx',
    'app/(app)/page.tsx',
    'app/(app)/perfil/page.tsx',
    'app/(app)/brote-plus/page.tsx',
    'app/legal/layout.tsx',
    'app/guia/layout.tsx',
    'app/negocios/page.tsx',
    'app/vender/page.tsx',
    'components/negocio/plan/PlanNegocio.tsx',
    'components/negocio/vendedor/PlanVendedor.tsx',
  ]) {
    assert.match(leer(p), /<BotonesConsumidor\b/, p);
  }
});

test('ten calendar days to change your mind, counted from when you signed up', () => {
  assert.equal(DIAS_ARREPENTIMIENTO, 10);
  const alta = new Date('2026-11-01T12:00:00Z');
  assert.equal(dentroDelPlazo(alta, new Date('2026-11-11T12:00:00Z')), true);
  assert.equal(dentroDelPlazo(alta, new Date('2026-11-11T12:00:01Z')), false);
  assert.equal(dentroDelPlazo(null), false);
  assert.equal(dentroDelPlazo('no es fecha'), false);
  assert.equal(diasDesde(alta, new Date('2026-11-04T13:00:00Z')), 3);
});

test('request codes look like the database makes them, without ambiguous letters', () => {
  assert.equal(codigoValido('ARR-7Z5X-99M7'), true);
  assert.equal(codigoValido('baj-dakr-raz2'), true);
  assert.equal(codigoValido('ARR-7Z5X-99M0'), false); // 0 no
  assert.equal(codigoValido('ARR-I234-5678'), false); // I no
  assert.equal(codigoValido('XYZ-AAAA-BBBB'), false);
  assert.equal(tipoDeCodigo('BAJ-AAAA-BBBB'), 'baja');
  assert.equal(tipoDeCodigo('arr-aaaa-bbbb'), 'arrepentimiento');
  const sql = leer('supabase/migrations/0147_botones_consumidor.sql');
  assert.match(sql, /alfabeto constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'/);
  assert.match(sql, /'BAJ-' else 'ARR-'/);
});

test('0147: anyone can ask and check; only the server and the owner can act', () => {
  const s = leer('supabase/migrations/0147_botones_consumidor.sql');
  assert.match(s, /grant execute on function public\.consumidor_solicitar\(text, text, text, text, text, text\) to anon, authenticated;/);
  assert.match(s, /grant execute on function public\.consumidor_consultar\(text, text\) to anon, authenticated;/);
  assert.match(s, /revoke all on function public\.consumidor_mis_servicios\(\) from public, anon;/);
  for (const f of ['consumidor_marcar(text, text, text, jsonb)', 'consumidor_datos_cobro(text)', 'plus_revocar(uuid)']) {
    assert.match(s, new RegExp(`revoke all on function public\\.${f.replace(/[()]/g, '\\$&')} from public, anon, authenticated;`), f);
  }
  assert.match(s, /revoke all on public\.consumidor_solicitudes from public, anon, authenticated;/);
  // The service list matches the database check.
  const check = /servicio in \(([^)]*)\)/.exec(s)?.[1] ?? '';
  assert.deepEqual(Array.from(check.matchAll(/'([a-z_]+)'/g), (m) => m[1]), SERVICIOS.map((x) => x.v));
  // The owner is told, and the panel counts open requests.
  assert.match(s, /perform brote_avisar_admins\('consumidor:' \|\| v_codigo/);
  assert.match(s, /'consumidor',\s+\(select count\(\*\) from consumidor_solicitudes where estado in \('recibida', 'en_proceso'\)\)/);
});

test('refunds are idempotent and only the approved charges of that subscription go back', () => {
  const mp = leer('lib/pagos/mp-servidor.ts');
  assert.match(mp, /'X-Idempotency-Key': `brote-reembolso-\$\{pagoId\}`/);
  assert.match(mp, /\/authorized_payments\/search\?preapproval_id=/);
  const ej = leer('lib/consumidor/ejecutar.ts');
  assert.match(ej, /pagos\.filter\(\(x\) => x\.estado === 'approved'\)/);
  assert.match(ej, /rpc\('plus_revocar'/);
  const acc = leer('lib/consumidor/acciones.ts');
  assert.match(acc, /ms\.reembolso_auto && ms\.brote_plus\?\.en_plazo && d && !d\.ya_reembolsada/);
});

test('0148: Brote never runs gambling, alcohol, tobacco or adult ads', () => {
  const s = leer('supabase/migrations/0148_anuncios_rubros.sql');
  assert.match(s, /create trigger anuncio_rubro\s+before insert or update/);
  for (const r of ['apuestas o juegos de azar', 'alcohol', 'tabaco, vapeo o cannabis', 'citas o contenido para adultos']) assert.ok(s.includes(`'${r}'`), r);
});

test('the app address never trusts a Supabase or localhost value in production', () => {
  assert.equal(esUrlDeApp('https://swdwulouasdnyorfhrjt.supabase.co', true), false);
  assert.equal(esUrlDeApp('http://localhost:3000', true), false);
  assert.equal(esUrlDeApp('http://localhost:3000', false), true);
  assert.equal(
    elegirUrlApp({ env: 'https://swdwulouasdnyorfhrjt.supabase.co', vercelProduccion: 'brote-ft7m.vercel.app', produccion: true }),
    'https://brote-ft7m.vercel.app',
  );
  assert.equal(elegirUrlApp({ env: 'https://brote.com.ar/', produccion: true }), 'https://brote.com.ar');
  assert.equal(elegirUrlApp({ env: null, vercelProduccion: null, pedido: 'https://x.vercel.app', produccion: true }), 'https://x.vercel.app');
  for (const p of ['app/robots.ts', 'app/sitemap.ts', 'lib/pagos/mp-servidor.ts']) assert.match(leer(p), /urlAppEntorno\(/, p);
  assert.doesNotMatch(leer('app/sitemap.ts'), /brote\.vercel\.app/);
});
