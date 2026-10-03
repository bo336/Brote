import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { LIGA, puntajeLiga, TOPE_TOTAL, type EntradaLiga } from '../liga';
import { normalizarObjetivo, seccionesDe } from '../objetivo';

const base: EntradaLiga = { cierres: [], enCurso: [], semanas: 13, semanasActivas: 0 };

test('the same plan, kept the same way, scores the same — whatever the company size', () => {
  // A three-person café and a 200-person plant, each closing its own two goals
  // and reporting 10 of 13 weeks. Nothing about size or volume is an input.
  const plan: EntradaLiga = {
    cierres: [
      { estado: 'logrado', ambicion: 'intermedio', aprobado: true },
      { estado: 'logrado_parcial', ambicion: 'basico', aprobado: true },
    ],
    enCurso: [{ pasos: 5, hechos: 3 }],
    semanas: 13,
    semanasActivas: 10,
  };
  const cafe = puntajeLiga(plan);
  const planta = puntajeLiga(structuredClone(plan));
  assert.deepEqual(cafe, planta);
  assert.equal(cafe.logros, Math.round(150 * 1.2 + 150 * 0.5));
});

test('a big team does not win by doing more: only the best 4 closures count', () => {
  const muchos: EntradaLiga = {
    ...base,
    cierres: Array.from({ length: 10 }, () => ({ estado: 'logrado' as const, ambicion: 'basico' as const, aprobado: true })),
  };
  assert.equal(puntajeLiga(muchos).logros, 4 * 150);
});

test('ambition counts, unapproved closures do not', () => {
  const s = puntajeLiga({
    ...base,
    cierres: [
      { estado: 'logrado', ambicion: 'avanzado', aprobado: true },
      { estado: 'logrado', ambicion: 'avanzado', aprobado: false },
    ],
  });
  assert.equal(s.logros, 225);
});

test('every part is capped and the total never exceeds 1000', () => {
  const max = puntajeLiga({
    cierres: Array.from({ length: 6 }, () => ({ estado: 'logrado' as const, ambicion: 'avanzado' as const, aprobado: true })),
    enCurso: [{ pasos: 4, hechos: 9 }],
    semanas: 13,
    semanasActivas: 40,
  });
  assert.equal(max.logros, LIGA.topeLogros);
  assert.equal(max.constancia, LIGA.topeConstancia);
  assert.equal(max.avance, LIGA.topeAvance);
  assert.equal(TOPE_TOTAL, 1000);
});

test('the SQL scores with the same constants', () => {
  let dir = __dirname;
  while (!fs.existsSync(path.join(dir, 'package.json'))) dir = path.dirname(dir);
  const sql = fs.readFileSync(path.join(dir, 'supabase/migrations/0121_negocios_objetivo_y_liga.sql'), 'utf8');
  const ini = sql.indexOf('create or replace function public.brote_liga_puntaje');
  const fn = sql.slice(ini, sql.indexOf('create or replace function', ini + 10));
  assert.match(fn, /select 150\s*\n\s*\* case g\.status when 'logrado' then 1\.0 else 0\.5 end/);
  assert.match(fn, /when 'avanzado' then 1\.5 when 'intermedio' then 1\.2 else 1\.0/);
  assert.match(fn, /limit 4\) x;/);
  assert.match(fn, /least\(600, v_logros\)/);
  assert.match(fn, /round\(150 \* v_avance\)/);
  assert.match(fn, /round\(250 \* least\(1\.0, v_activas::numeric \/ v_semanas\)\)/);
  assert.match(fn, /g\.aprobado_por is not null/);
  // And size is not an input anywhere in the score.
  assert.doesNotMatch(fn, /tamano|empleados|kg|litros/);
});

test('each business sees the sections of what it came to do', () => {
  assert.deepEqual(seccionesDe('vender', 'vendedor'), ['resumen', 'productos', 'preguntas', 'tienda', 'analitica', 'plan']);
  assert.deepEqual(seccionesDe('mejorar', 'empresa'), ['resumen', 'mejora', 'liga', 'verificacion']);
  const ambos = seccionesDe('ambos', 'legacy');
  assert.ok(ambos.includes('mejora') && ambos.includes('productos') && ambos.includes('liga'));
  assert.ok(!seccionesDe('vender', 'vendedor').includes('liga'));
  assert.equal(normalizarObjetivo(undefined, 'legacy'), 'ambos');
  assert.equal(normalizarObjetivo(undefined, 'vendedor'), 'vender');
  assert.equal(normalizarObjetivo('mejorar', 'vendedor'), 'mejorar');
});
