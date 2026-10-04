import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { PUEDE, puede, puedeCrearProyecto, RANGO_MIN_PROYECTOS, type Capacidad } from '../reglas';

function sql(nombre: string): string {
  let dir = __dirname;
  while (!fs.existsSync(path.join(dir, 'package.json'))) dir = path.dirname(dir);
  return fs.readFileSync(path.join(dir, 'supabase/migrations', nombre), 'utf8');
}

test('a kid account is never exposed: nothing social, no market, no meetups, no payments', () => {
  const cerradas: Capacidad[] = ['publicar', 'seguir', 'buscar_personas', 'mercado', 'mercado_precios', 'proyectos_sumarse', 'proyectos_crear', 'brote_plus', 'negocios'];
  for (const c of cerradas) assert.equal(puede('kid', c), false, c);
  for (const c of ['acciones', 'academia', 'mundo', 'noticias'] as Capacidad[]) assert.equal(puede('kid', c), true, c);
});

test('a teen takes part but does not organise, buy or sell', () => {
  assert.equal(puede('teen', 'publicar'), true);
  assert.equal(puede('teen', 'proyectos_sumarse'), true);
  for (const c of ['proyectos_crear', 'brote_plus', 'negocios', 'mercado_precios'] as Capacidad[]) assert.equal(puede('teen', c), false, c);
});

test('an adult can do everything; a project still needs the minimum rank', () => {
  for (const c of Object.keys(PUEDE.adult) as Capacidad[]) assert.equal(puede('adult', c), true, c);
  assert.deepEqual(puedeCrearProyecto('adult', RANGO_MIN_PROYECTOS), { ok: true });
  assert.deepEqual(puedeCrearProyecto('adult', RANGO_MIN_PROYECTOS - 1), { ok: false, motivo: 'rango' });
  assert.deepEqual(puedeCrearProyecto('teen', 11), { ok: false, motivo: 'edad' });
  assert.deepEqual(puedeCrearProyecto('kid', 11), { ok: false, motivo: 'edad' });
});

test('every capability is a monotone ladder: kid ⊆ teen ⊆ adult', () => {
  for (const c of Object.keys(PUEDE.adult) as Capacidad[]) {
    if (c === 'competencias_crear') continue; // kids create kid-only ones: same capability, narrower scope
    if (PUEDE.kid[c]) assert.ok(PUEDE.teen[c], `kid can ${c} but teen cannot`);
    if (PUEDE.teen[c]) assert.ok(PUEDE.adult[c], `teen can ${c} but adult cannot`);
  }
});

test('the database enforces the project rules the screens show', () => {
  const s = sql('0120_proyectos_por_rango_y_edad.sql');
  const crear = s.slice(s.indexOf('create or replace function public.create_project'), s.indexOf('create or replace function public.join_project'));
  assert.match(crear, /if v_tipo <> 'adult' then/);
  assert.match(crear, /coalesce\(\(value #>> '\{\}'\)::int, 5\)/);
  const unirse = s.slice(s.indexOf('create or replace function public.join_project'), s.indexOf('── 3'));
  assert.match(unirse, /if v_tipo = 'kid' then/);
  assert.match(s, /set value = '5'::jsonb/);
  assert.equal(RANGO_MIN_PROYECTOS, 5);
  // No direct writes to participants, and the contact is not a public column.
  assert.match(s, /drop policy if exists "participants owner insert"/);
  assert.match(s, /revoke select on public\.projects from anon, authenticated;/);
  const grant = /grant select \(([^)]*)\) on public\.projects/.exec(s)?.[1] ?? '';
  assert.ok(grant.length > 0 && !grant.includes('contact_info') && !grant.includes('contact_kind'));
});

test('only adults open a store or a company', () => {
  const s = sql('0121_negocios_objetivo_y_liga.sql');
  const empresa = s.slice(s.indexOf('create or replace function public.empresa_crear'));
  assert.match(empresa, /account_type is distinct from 'adult'/);
});
