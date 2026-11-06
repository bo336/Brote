import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { CONTEXTO } from '../../acciones/reglas';
import { DOMAINS } from '../../domains';
import {
  EDADES,
  MAX_TEMAS,
  NOMBRE,
  PREGUNTAS_CASA,
  RITMOS,
  TEMAS_CHICOS,
  VINCULOS,
  clavesDe,
  contextoDeRespuestas,
  marcadasDeEntrada,
  opcionesVisibles,
  pasosPara,
  preguntaProvincia,
  type Edad,
} from '../preguntas';

function raiz(): string {
  let dir = __dirname;
  while (!fs.existsSync(path.join(dir, 'package.json'))) dir = path.dirname(dir);
  return dir;
}
const leer = (rel: string) => fs.readFileSync(path.join(raiz(), rel), 'utf8');
const SQL = () => leer('supabase/migrations/0145_menores_y_onboarding.sql');
const EDADES_TODAS: Edad[] = ['kid', 'teen', 'adult'];

test('each age gets its own path: a kid has the adult authorization and no time or follow steps', () => {
  const kid = pasosPara('kid');
  assert.ok(kid.includes('adulto'));
  assert.ok(!kid.includes('tiempo') && !kid.includes('seguir'));
  for (const e of ['teen', 'adult'] as Edad[]) {
    const p = pasosPara(e);
    assert.ok(p.includes('tiempo') && p.includes('seguir'), e);
    assert.ok(!p.includes('adulto'), e);
  }
  for (const e of EDADES_TODAS) {
    const p = pasosPara(e);
    assert.equal(p[0], 'bienvenida');
    assert.equal(p[p.length - 1], 'dia');
    assert.equal(new Set(p).size, p.length, `${e}: no step twice`);
  }
  // The authorization comes before anything is asked about the kid's home.
  assert.ok(kid.indexOf('adulto') < kid.indexOf('casa'));
});

test('a minor is never asked for a real name, and a kid is not asked for the province', () => {
  assert.match(NOMBRE.kid.ayuda, /apellido/);
  assert.equal(preguntaProvincia('kid'), false);
  assert.equal(preguntaProvincia('teen'), true);
  assert.equal(preguntaProvincia('adult'), true);
  assert.deepEqual(EDADES.map((e) => e.key), EDADES_TODAS);
});

test('every home question is a key the database accepts and some action asks for', () => {
  const s = SQL();
  const lista = /if k in \(([^)]*)\)/.exec(s)?.[1] ?? '';
  const aceptadas = new Set(Array.from(lista.matchAll(/'([a-z_]+)'/g), (m) => m[1]));
  assert.ok(aceptadas.size > 10);
  const conocidas = new Map(CONTEXTO.map((c) => [c.clave, c]));
  for (const e of EDADES_TODAS) {
    const claves = clavesDe(e);
    assert.equal(new Set(claves).size, claves.length, `${e}: no key twice`);
    for (const k of claves) {
      assert.ok(aceptadas.has(k), `${e}: ${k} is accepted by acciones_guardar_contexto`);
      const c = conocidas.get(k);
      assert.ok(c && !c.derivada, `${e}: ${k} is a real, non-derived key`);
      if (e === 'kid') assert.ok(!c.adultos, `kid is not asked about ${k}`);
    }
  }
});

test('the useless shopping question is gone, and the time question maps to the day builder', () => {
  const s = SQL();
  assert.ok(!clavesDe('adult').includes('compra' as never));
  assert.match(s, /context = context - 'compra'/);
  const enSql = /k = 'ritmo' and v #>> '\{\}' in \(([^)]*)\)/.exec(s)?.[1] ?? '';
  assert.deepEqual(
    Array.from(enSql.matchAll(/'([a-z]+)'/g), (m) => m[1]),
    RITMOS.map((r) => r.v),
  );
  assert.match(s, /v_ritmo text := coalesce\(\(select context ->> 'ritmo'/);
});

test('answers become context: marked true, asked and unmarked false, nothing outside the age', () => {
  const adulto = contextoDeRespuestas('adult', new Set(['auto', 'balcon']), 'corto');
  assert.equal(adulto.respondido, true);
  assert.equal(adulto.auto, true);
  assert.equal(adulto.balcon, true);
  assert.equal(adulto.jardin, false);
  assert.equal(adulto.ritmo, 'corto');

  const chico = contextoDeRespuestas('kid', new Set(['perro']), null);
  assert.equal(chico.perro, true);
  assert.ok(!('auto' in chico), 'a kid is not asked about cars');
  assert.ok(!('ritmo' in chico), 'a kid does not choose a pace');
  for (const k of Object.keys(chico)) assert.ok(k === 'respondido' || clavesDe('kid').includes(k as never), k);
});

test('options with no action for that age are hidden, and school starts marked for minors', () => {
  const p = PREGUNTAS_CASA.kid[0]!;
  assert.deepEqual(opcionesVisibles(p, null), p.opciones);
  const vis = opcionesVisibles(p, { balcon: 7, jardin: 0 });
  assert.deepEqual(vis.map((o) => o.clave), ['balcon']);
  assert.deepEqual([...marcadasDeEntrada('kid')], ['estudio']);
  assert.deepEqual([...marcadasDeEntrada('adult')], []);
  for (const e of EDADES_TODAS) for (const k of marcadasDeEntrada(e)) assert.ok(clavesDe(e).includes(k as never), `${e}: ${k}`);
});

test('kid topics are real domains and the cap is small', () => {
  const slugs = new Set<string>(DOMAINS.map((d) => d.slug));
  for (const t of TEMAS_CHICOS) assert.ok(slugs.has(t.slug), t.slug);
  assert.ok(MAX_TEMAS >= 1 && MAX_TEMAS <= 3);
});

test('the adult authorization matches the table and the onboarding cannot finish without it', () => {
  const s = SQL();
  const check = /vinculo in \(([^)]*)\)/.exec(s)?.[1] ?? '';
  assert.deepEqual(
    Array.from(check.matchAll(/'([a-z_]+)'/g), (m) => m[1]),
    VINCULOS.map((v) => v.v),
  );
  const fin = s.slice(s.indexOf('create or replace function public.brote_finish_onboarding'));
  assert.match(fin.slice(0, 2500), /falta_autorizacion/);
  assert.match(s, /grant execute on function public\.cuenta_autorizacion_adulta\(text, text\) to authenticated/);
});

test('AI features stay with adults: the chat and AI recommendations refuse minors', () => {
  const chat = leer('supabase/functions/pip-chat/index.ts');
  assert.match(chat, /account_type/);
  assert.match(chat, /solo_adultos/);
  const rec = leer('supabase/functions/recommend-activities/index.ts');
  assert.match(rec, /account_type/);
  assert.match(rec, /motivo: 'menor'/);
  const flujo = leer('components/onboarding/OnboardingFlow.tsx');
  assert.match(flujo, /if \(edad === 'adult'\) void triggerRecommendations\(\)/);
});

test('teen ads carry Google age treatment; kid news stays inside the app', () => {
  const ad = leer('components/ads/AdSlot.tsx');
  assert.match(ad, /'data-tag-for-age-treatment': '2'/);
  const noticia = leer('app/(app)/feed/n/[id]/page.tsx');
  assert.match(noticia, /esChico \?/);
  const s = SQL();
  assert.match(s, /create trigger news_al_guardar/);
  // 0146: "ministr" missed "ministerio" and "accidente" missed "accidentado"; money and death words are out.
  const finas = leer('supabase/migrations/0146_noticias_chicos_mas_finas.sql');
  for (const w of ['minister', 'accident', 'presupuest', 'dinero', 'cementerio', 'obituario', 'fracking']) {
    assert.match(finas, new RegExp(`\\|${w}`), w);
  }
  assert.match(finas, /select public\.brote_tag_kid_safe_news\(\);/);
});
