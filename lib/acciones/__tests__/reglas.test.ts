import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import {
  apta,
  armarDia,
  CONTEXTO,
  CONTEXTO_CLAVES,
  contextoEfectivo,
  efemerideDe,
  EFEMERIDES,
  estacionDe,
  mezclarReglas,
  PUNTOS,
  puntaje,
  razon,
  REGION_DE_PROVINCIA,
  REGLAS,
  type AccionReglas,
  type Candidata,
  type PerfilReglas,
} from '../reglas';
import { PROVINCES } from '../../data/cities';

function sql(nombre: string): string {
  let dir = __dirname;
  while (!fs.existsSync(path.join(dir, 'package.json'))) dir = path.dirname(dir);
  return fs.readFileSync(path.join(dir, 'supabase/migrations', nombre), 'utf8');
}
const S = sql('0123_acciones_v2.sql');

const accion = (o: Partial<AccionReglas> = {}): AccionReglas => ({
  id: 'a',
  type: 'daily',
  domain_slug: 'agua',
  impact: 'low',
  age_groups: ['kid', 'teen', 'adult'],
  minutos: 2,
  requiere: [],
  estaciones: [],
  regiones: [],
  dias: null,
  tags: [],
  ...o,
});
const perfil = (o: Partial<PerfilReglas> = {}): PerfilReglas => ({
  cuenta: 'adult',
  tier: 1,
  ctx: {},
  region: 'centro',
  estacion: 'primavera',
  dow: 2,
  intereses: [],
  ...o,
});

// ── Parity with the database ────────────────────────────────────────────────

test('the default rules are the same object in TypeScript and in SQL', () => {
  const m = /with d as \(\s*select '(\{[^']+\})'::jsonb as j/.exec(S);
  assert.ok(m, 'defaults not found in brote_acciones_reglas');
  assert.deepEqual(JSON.parse(m![1]!), REGLAS);
});

test('the context vocabulary is the one the database accepts', () => {
  const m = /activities_requiere_chk check \(requiere <@ array\[([\s\S]*?)\]::text\[\]\)/.exec(S);
  assert.ok(m);
  const sqlKeys = m![1]!.match(/'([a-z_]+)'/g)!.map((x) => x.slice(1, -1));
  assert.deepEqual(sqlKeys, [...CONTEXTO_CLAVES]);
  assert.deepEqual(CONTEXTO.map((c) => c.clave), [...CONTEXTO_CLAVES]);
});

test('every province maps to the same region in TypeScript and SQL', () => {
  const fn = S.slice(S.indexOf('function public.brote_region'), S.indexOf('function public.brote_estacion'));
  for (const prov of PROVINCES) {
    const region = REGION_DE_PROVINCIA[prov];
    assert.ok(region, `${prov} has no region`);
    const linea = fn.split('\n').find((l) => l.includes(`'${prov}'`));
    assert.ok(linea, `${prov} missing in brote_region`);
    assert.ok(linea!.includes(`then '${region}'`), `${prov}: SQL says ${linea}`);
  }
});

test('the efemérides are the same list in TypeScript and SQL', () => {
  const fn = S.slice(S.indexOf('function public.brote_efemeride'), S.indexOf('function public.brote_acciones_reglas'));
  const filas = [...fn.matchAll(/\((\d+), (\d+), '([a-z-]+)', '([^']+)'/g)].map((m) => [Number(m[1]), Number(m[2]), m[3], m[4]]);
  assert.deepEqual(filas, EFEMERIDES.map((e) => [e.mes, e.dia, e.slug, e.nombre]));
});

test('internal helpers are not callable by the app; the RPCs are', () => {
  for (const f of ['brote_perfil_accion', 'brote_candidatas', 'brote_armar_dia', 'brote_dia_asegurar', 'brote_acciones_fuera', 'ac_accion_para']) {
    assert.match(S, new RegExp(`revoke all on function public\\.${f}\\([^)]*\\) from public, anon, authenticated;`), f);
  }
  for (const f of ['acciones_de_hoy', 'acciones_cambiar', 'acciones_sugeridas', 'acciones_ocultar', 'mis_acciones_ocultas', 'acciones_mostrar_de_nuevo', 'mis_caminos', 'complete_activity']) {
    assert.match(S, new RegExp(`grant execute on function public\\.${f}\\([^)]*\\) to authenticated;`), f);
  }
});

test('new tables are read-only for the client', () => {
  for (const t of ['caminos', 'user_caminos', 'acciones_feedback']) {
    assert.match(S, new RegExp(`revoke all on public\\.${t} from anon, authenticated;`), t);
    assert.match(S, new RegExp(`alter table public\\.${t} enable row level security;`), t);
  }
});

test('past impact is frozen before the catalogue changes', () => {
  const backfill = S.indexOf('update public.activity_completions ac');
  const impacto = S.indexOf('create or replace function public.brote_user_impact(');
  assert.ok(backfill > 0 && backfill < impacto);
  assert.match(S, /coalesce\(ac\.impact_water_l, a\.impact_water_l\)/);
});

// ── Vocabulary ──────────────────────────────────────────────────────────────

test('seasons are southern-hemisphere', () => {
  assert.equal(estacionDe('2026-01-15'), 'verano');
  assert.equal(estacionDe('2026-04-10'), 'otono');
  assert.equal(estacionDe('2026-07-09'), 'invierno');
  assert.equal(estacionDe('2026-10-06'), 'primavera');
  assert.equal(estacionDe('2026-12-01'), 'verano');
});

test('an efeméride pushes its theme two days either side, the closest wins', () => {
  assert.equal(efemerideDe('2026-08-29')?.slug, 'arbol');
  assert.equal(efemerideDe('2026-08-27')?.dias, 2);
  assert.equal(efemerideDe('2026-09-01'), null);
  assert.equal(efemerideDe('2026-09-28')?.slug, 'conciencia-ambiental'); // tie with 29/9: the earlier one
  assert.equal(efemerideDe('2027-01-24')?.slug, 'educacion-ambiental');
});

test('kids and teens go to school unless they say otherwise', () => {
  assert.equal(contextoEfectivo({}, 'kid').estudio, true);
  assert.equal(contextoEfectivo({ estudio: false }, 'teen').estudio, false);
  assert.equal(contextoEfectivo({}, 'adult').estudio, undefined);
});

test('points follow one table, and a day action never out-earns a catalogue one of the same weight', () => {
  for (const e of ['easy', 'medium', 'hard'] as const) {
    for (const i of ['low', 'medium', 'high'] as const) {
      assert.ok(PUNTOS.daily[e][i] < PUNTOS.catalog[e][i], `${e}/${i}`);
    }
    assert.ok(PUNTOS.daily[e].low <= PUNTOS.daily[e].medium && PUNTOS.daily[e].medium <= PUNTOS.daily[e].high);
  }
});

// ── apta ────────────────────────────────────────────────────────────────────

test('apta: age, rank, context, season, region and weekday', () => {
  assert.deepEqual(apta(accion({ age_groups: ['adult'] }), perfil({ cuenta: 'kid' })), { ok: false, motivo: 'edad' });
  assert.deepEqual(apta(accion({ min_rank_tier: 3 }), perfil({ tier: 2 })), { ok: false, motivo: 'rango' });
  assert.deepEqual(apta(accion({ requiere: ['auto'] }), perfil()), { ok: false, motivo: 'contexto' });
  assert.deepEqual(apta(accion({ requiere: ['auto'] }), perfil({ ctx: { auto: 'true' } })), { ok: false, motivo: 'contexto' });
  assert.deepEqual(apta(accion({ requiere: ['auto'] }), perfil({ ctx: { auto: true } })), { ok: true });
  assert.deepEqual(apta(accion({ estaciones: ['invierno'] }), perfil()), { ok: false, motivo: 'estacion' });
  assert.deepEqual(apta(accion({ regiones: ['cuyo'] }), perfil({ region: null })), { ok: false, motivo: 'region' });
  assert.deepEqual(apta(accion({ regiones: ['cuyo'] }), perfil({ region: 'cuyo' })), { ok: true });
  assert.deepEqual(apta(accion({ dias: 'habil' }), perfil({ dow: 0 })), { ok: false, motivo: 'dia' });
  assert.deepEqual(apta(accion({ dias: 'finde' }), perfil({ dow: 6 })), { ok: true });
});

// ── puntaje / razón ─────────────────────────────────────────────────────────

const nunca = { hecha: false, diasDesdeUltima: null, ofrecida: false, hoyNo: false };
const sinSenales = { afinidad: 0, efemeride: null, azar: 0 };

test('score: each signal moves it by its weight', () => {
  const w = REGLAS.pesos;
  const base = puntaje(accion(), perfil(), { ...nunca, hecha: true }, sinSenales);
  assert.equal(base, 0);
  assert.equal(puntaje(accion(), perfil({ intereses: ['agua'] }), { ...nunca, hecha: true }, sinSenales), w.interes);
  assert.equal(puntaje(accion(), perfil(), nunca, sinSenales), w.nueva);
  assert.equal(puntaje(accion({ estaciones: ['primavera'] }), perfil(), { ...nunca, hecha: true }, sinSenales), w.temporada);
  assert.equal(puntaje(accion({ impact: 'high' }), perfil(), { ...nunca, hecha: true }, sinSenales), w.impacto_alto);
  assert.equal(puntaje(accion(), perfil(), { hecha: true, diasDesdeUltima: 2, ofrecida: true, hoyNo: true }, sinSenales), -w.ofrecida - w.hoy_no - w.hecha_reciente);
  assert.equal(puntaje(accion(), perfil(), { ...nunca, hecha: true }, { ...sinSenales, afinidad: 0.5 }), w.afinidad);
  const efe = EFEMERIDES.find((e) => e.slug === 'arbol')!;
  assert.equal(puntaje(accion({ domain_slug: 'plantas' }), perfil(), { ...nunca, hecha: true }, { ...sinSenales, efemeride: efe }), w.efemeride);
});

test('the reason is the strongest signal, in a fixed order', () => {
  const efe = EFEMERIDES.find((e) => e.slug === 'agua')!;
  assert.deepEqual(razon(accion(), perfil(), nunca, { ...sinSenales, efemeride: efe }), { r: 'efemeride' });
  assert.deepEqual(razon(accion({ estaciones: ['primavera'], requiere: ['bici'] }), perfil(), nunca, sinSenales), { r: 'temporada', e: 'primavera' });
  assert.deepEqual(razon(accion({ requiere: ['bici'] }), perfil({ intereses: ['agua'] }), nunca, sinSenales), { r: 'contexto', k: 'bici' });
  assert.deepEqual(razon(accion(), perfil({ intereses: ['agua'] }), nunca, sinSenales), { r: 'interes', d: 'agua' });
  assert.deepEqual(razon(accion(), perfil(), nunca, sinSenales), { r: 'nueva' });
  assert.deepEqual(razon(accion({ impact: 'high' }), perfil(), { ...nunca, hecha: true }, sinSenales), { r: 'impacto' });
});

// ── armarDia ────────────────────────────────────────────────────────────────

const c = (id: string, d: string, m: number, s: number, n = false): Candidata => ({ id, d, m, s, n });

test('one topic per day while there is variety', () => {
  const cands = [c('a1', 'agua', 2, 90), c('a2', 'agua', 2, 89), c('a3', 'agua', 2, 88), c('e1', 'energia', 2, 50), c('r1', 'residuos', 2, 40), c('m1', 'movilidad', 2, 30), c('p1', 'plantas', 2, 20)];
  const dia = armarDia(cands);
  assert.deepEqual(dia, ['a1', 'e1', 'r1', 'm1', 'p1']);
});

test('at least three quick ones and at most one long one', () => {
  const cands = [c('l1', 'agua', 30, 99), c('l2', 'energia', 30, 98), c('m1', 'residuos', 10, 97), c('m2', 'movilidad', 10, 96), c('q1', 'plantas', 2, 10), c('q2', 'animales', 3, 9), c('q3', 'consumo', 5, 8), c('q4', 'digital', 5, 7)];
  const dia = armarDia(cands);
  const minutos = dia.map((id) => cands.find((x) => x.id === id)!.m);
  assert.equal(minutos.filter((m) => m <= REGLAS.rapida_minutos).length, 3);
  assert.equal(minutos.filter((m) => m > REGLAS.larga_minutos).length, 1);
  assert.deepEqual(dia, ['l1', 'm1', 'q1', 'q2', 'q3']);
});

test('a new action is guaranteed when one exists (and is not long)', () => {
  const cands = [c('x1', 'agua', 2, 90), c('x2', 'energia', 2, 80), c('x3', 'residuos', 2, 70), c('x4', 'plantas', 2, 60), c('x5', 'consumo', 2, 50), c('n1', 'digital', 2, 1, true)];
  assert.ok(armarDia(cands).includes('n1'));
  const larga = [...cands.slice(0, 5), c('n2', 'digital', 30, 1, true)];
  assert.ok(!armarDia(larga).includes('n2'));
});

test('the limits relax in order when there is not enough variety', () => {
  const soloAgua = [c('a1', 'agua', 2, 5), c('a2', 'agua', 2, 4), c('a3', 'agua', 30, 3), c('a4', 'agua', 30, 2), c('a5', 'agua', 2, 1)];
  assert.equal(armarDia(soloAgua).length, 5);
  assert.equal(armarDia([]).length, 0);
});

test('a swap keeps the rest and their limits count', () => {
  const mantener = [c('a1', 'agua', 30, 0), c('e1', 'energia', 2, 0), c('r1', 'residuos', 2, 0), c('m1', 'movilidad', 2, 0)];
  const cands = [c('a2', 'agua', 2, 99), c('l2', 'plantas', 30, 98), c('q1', 'consumo', 2, 1)];
  assert.deepEqual(armarDia(cands, REGLAS, mantener), ['a1', 'e1', 'r1', 'm1', 'q1']);
});

test('panel overrides merge one level deep', () => {
  const r = mezclarReglas({ tamano: 3, pesos: { interes: 0 } as never });
  assert.equal(r.tamano, 3);
  assert.equal(r.pesos.interes, 0);
  assert.equal(r.pesos.nueva, REGLAS.pesos.nueva);
});
