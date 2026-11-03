import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

const leer = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8');
const sql = leer('supabase/migrations/0143_solicitudes_empresas.sql');

/** El cuerpo de una función de la migración. */
function funcion(nombre: string): string {
  const i = sql.indexOf(`function public.${nombre}(`);
  const j = i >= 0 ? i : sql.indexOf(`function ${nombre}(`);
  assert.ok(j >= 0, nombre);
  const fin = sql.indexOf('\nend ', j);
  return sql.slice(j, fin);
}

test('a new business starts as a request waiting for approval, whichever plan', () => {
  const f = funcion('negocio_solicitud_enviar');
  assert.match(f, /p_objetivo not in \('vender', 'mejorar'\)/);
  assert.match(f, /p_objetivo, 'submitted'/);
  assert.doesNotMatch(f, /'approved'/);
});

test('the two old shortcuts no longer create anything', () => {
  for (const nombre of ['vendedor_crear', 'empresa_crear']) {
    const i = sql.indexOf(`create or replace function public.${nombre}(`);
    assert.ok(i >= 0, nombre);
    assert.match(sql.slice(i, sql.indexOf('$fn$;', sql.indexOf('$fn$', i) + 4)), /usar_solicitud/);
  }
});

test('nothing of either plan starts before the approval', () => {
  for (const nombre of ['vendedor_guardar', 'vendedor_compromisos', 'vendedor_prueba_empezar', 'vendedor_mp_vincular']) {
    assert.match(funcion(nombre), /no_aprobada/, nombre);
  }
  assert.match(funcion('dossier_guardar'), /negocio_no_aprobado/);
  assert.match(funcion('negocio_set_objetivo'), /no_aprobada/);
  assert.match(funcion('brote_vendedor_faltantes'), /array\['revision'\]/);
  // Y guardar la tienda ya no la devuelve a borrador.
  assert.doesNotMatch(funcion('vendedor_guardar'), /'draft'::business_status/);
});

test('for a shop, open is not the same as approved', () => {
  assert.match(funcion('vendedor_estado'), /'abierta', b\.status = 'approved' and b\.activa_at is not null/);
  assert.match(funcion('brote_vendedor_activar'), /b\.activa_at is not null then return jsonb_build_object\('ok', true, 'ya_abierta', true\)/);
  assert.match(funcion('brote_listado_exige_vender'), /b\.modelo = 'vendedor' and b\.activa_at is null/);
});

test('the owner hears about new requests and corrections, and not about their own clicks', () => {
  const f = funcion('brote_equipo_negocio');
  assert.match(f, /new\.status = 'submitted' and new\.revision_note is null/);
  assert.match(f, /brote_avisar_admins/);
  assert.match(f, /'\/panel\/negocios\/' \|\| new\.id/);
});

test('approval sends each plan to its own setup', () => {
  const f = funcion('admin_negocio_revisar');
  assert.match(f, /b\.modelo = 'vendedor'[\s\S]*'\/negocio\/alta'/);
  assert.match(f, /b\.modelo = 'empresa'[\s\S]*'\/negocio\/mejora\/dossier'/);
});

test('without approval the business shell shows only the request', () => {
  const layout = leer('app/(business)/layout.tsx');
  assert.match(layout, /activo\.status !== 'approved' && activo\.modelo !== 'legacy'/);
  assert.match(layout, /if \(sinAprobar && !enfocado\) redirect\('\/negocio\/alta'\)/);
  const alta = leer('app/(business)/negocio/alta/page.tsx');
  assert.match(alta, /<EstadoSolicitud/);
  assert.match(alta, /<NuevaSolicitud/);
  assert.doesNotMatch(alta, /AltaEmpresa \/>/);
});

test('a centered window is centered by framer-motion, whose transform overrides Tailwind', () => {
  const sheet = leer('components/ui/sheet.tsx');
  assert.match(sheet, /x: '-50%', y: '-50%'/);
  assert.doesNotMatch(sheet, /-translate-x-1\/2/);
});

test('the demo switch moves everything that is not real, and deletes nothing', () => {
  const demo = leer('supabase/migrations/0141_demo_bajo_interruptor.sql');
  assert.match(demo, /when \(new\.key = 'simulated_players_enabled'\)/);
  assert.match(demo, /slug like 'demo-%' and status = 'approved'/);
  assert.match(demo, /where es_demo and pausado_at is null/);
  const cuerpo = demo.slice(demo.indexOf('function public.brote_demo_aplicar'), demo.indexOf('function public.brote_demo_interruptor'));
  assert.doesNotMatch(cuerpo, /\bdelete\b/i);
});
