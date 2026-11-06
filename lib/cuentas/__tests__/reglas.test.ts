import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { EXPLICACION, LIGA_MIN_PROYECTOS, PUEDE, puede, puedeCrearProyecto, type Capacidad } from '../reglas';

function sql(nombre: string): string {
  let dir = __dirname;
  while (!fs.existsSync(path.join(dir, 'package.json'))) dir = path.dirname(dir);
  return fs.readFileSync(path.join(dir, 'supabase/migrations', nombre), 'utf8');
}

test('a kid account is never exposed: nothing social, no market, no meetups, no payments', () => {
  const cerradas: Capacidad[] = ['publicar', 'seguir', 'buscar_personas', 'mercado', 'mercado_precios', 'mercado_contactar', 'proyectos_sumarse', 'proyectos_crear', 'brote_plus', 'negocios', 'charla_ia', 'noticias_afuera'];
  for (const c of cerradas) assert.equal(puede('kid', c), false, c);
  for (const c of ['acciones', 'academia', 'mundo', 'noticias'] as Capacidad[]) assert.equal(puede('kid', c), true, c);
});

test('a teen takes part but does not organise, buy or sell', () => {
  assert.equal(puede('teen', 'publicar'), true);
  assert.equal(puede('teen', 'proyectos_sumarse'), true);
  for (const c of ['proyectos_crear', 'brote_plus', 'negocios', 'mercado_precios', 'mercado_contactar', 'charla_ia'] as Capacidad[]) assert.equal(puede('teen', c), false, c);
});

test('an adult can do everything; a project still needs the minimum weekly league', () => {
  for (const c of Object.keys(PUEDE.adult) as Capacidad[]) assert.equal(puede('adult', c), true, c);
  assert.deepEqual(puedeCrearProyecto('adult', LIGA_MIN_PROYECTOS), { ok: true });
  assert.deepEqual(puedeCrearProyecto('adult', LIGA_MIN_PROYECTOS - 1), { ok: false, motivo: 'liga' });
  assert.deepEqual(puedeCrearProyecto('teen', 7), { ok: false, motivo: 'edad' });
  assert.deepEqual(puedeCrearProyecto('kid', 7), { ok: false, motivo: 'edad' });
});

test('the minimum league mirrors the default quotas, and no text still talks about ranks for projects', () => {
  const cupos = /'\{"cupos": (\{[^}]*\})/.exec(sql('0137_proyectos_por_liga.sql'))?.[1];
  assert.ok(cupos, 'default quotas in 0137');
  const conCupo = Object.entries(JSON.parse(cupos) as Record<string, number>).filter(([, v]) => v > 0);
  assert.equal(Math.min(...conCupo.map(([k]) => Number(k))), LIGA_MIN_PROYECTOS);
  const todo = JSON.stringify(EXPLICACION);
  assert.doesNotMatch(todo, /rango Arbusto/);
  assert.match(todo, /liga Referente/);
});

test('0145 enforces what the teen and kid screens say', () => {
  const s = sql('0145_menores_y_onboarding.sql');
  // Teens look at the Mercado but never reach a store.
  for (const f of ['mercado_salir', 'mercado_preguntar']) {
    const cuerpo = s.slice(s.indexOf(`create or replace function public.${f}(`));
    assert.match(cuerpo.slice(0, 2500), /solo_adultos/, f);
  }
  // A kid account cannot finish onboarding without an adult's authorization.
  const fin = s.slice(s.indexOf('create or replace function public.brote_finish_onboarding'));
  assert.match(fin.slice(0, 2500), /falta_autorizacion/);
  // Kids only read news tagged for them, by RLS, not just by the screen.
  assert.match(s, /create policy "read news"[\s\S]*'kid' = any \(age_groups\)/);
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
  const unirse = s.slice(s.indexOf('create or replace function public.join_project'), s.indexOf('── 3'));
  assert.match(unirse, /if v_tipo = 'kid' then/);
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
