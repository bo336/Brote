import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { RANGOS, decidir, requisitosPara } from '../../rangos';

const sql = fs.readFileSync(path.join(process.cwd(), 'supabase/migrations/0133_rangos.sql'), 'utf8');

test('the seven ranks are the same in TypeScript and in the migration', () => {
  const filas = [...sql.matchAll(/\((\d), '([a-z]+)', '([^']+)', '([^']+)', '(#[0-9A-F]{6})',\s*'(\{[^']*\})', (\d|null)\)/g)];
  assert.equal(filas.length, 7);
  for (const f of filas) {
    const r = RANGOS.find((x) => x.tier === Number(f[1]));
    assert.ok(r, `tier ${f[1]}`);
    assert.equal(r!.slug, f[2]);
    assert.equal(r!.nombre, f[3]);
    assert.equal(r!.descripcion, f[4]);
    assert.equal(r!.color, f[5]);
    assert.deepEqual(r!.requisitos, JSON.parse(f[6]!));
    assert.equal(r!.previo, f[7] === 'null' ? null : Number(f[7]));
  }
});

test('requirements grow with the period, except topics (breadth, max 13)', () => {
  const referente = RANGOS[3]!.requisitos;
  assert.deepEqual(requisitosPara(referente, 7), { dias: 5, acciones: 12, temas: 4, medidas: 3, aprendizaje: 1 });
  assert.deepEqual(requisitosPara(referente, 19), { dias: 14, acciones: 33, temas: 4, medidas: 9, aprendizaje: 3 });
  assert.deepEqual(requisitosPara(referente, 31), { dias: 23, acciones: 54, temas: 4, medidas: 14, aprendizaje: 5 });
  // A short period (a month that starts on a Saturday after a weekly one) shrinks everything.
  assert.deepEqual(requisitosPara(RANGOS[6]!.requisitos, 2), { dias: 2, acciones: 8, temas: 2, medidas: 3, comunidad: 1, aprendizaje: 1 });
  assert.match(sql, /when k = 'temas' then least\(ceil\(v::numeric \* least\(1\.0, p_dias \/ 7\.0\)\), 13\)/);
});

test('closing a period: keep it once by a small margin, never drop more than two', () => {
  const casos: [number, number, boolean, number, string][] = [
    [1, 1, false, 1, 'mantiene'],
    [2, 4, false, 4, 'sube'],
    [4, 3, false, 4, 'margen'],
    [4, 3, true, 3, 'baja'],
    [5, 1, false, 3, 'baja'],
    [7, 6, false, 7, 'margen'],
    [3, 3, true, 3, 'mantiene'],
    [2, 0, false, 1, 'baja'],
  ];
  for (const [p, c, m, nuevo, res] of casos) {
    const d = decidir(p, c, m);
    assert.equal(d.nuevo, nuevo, `${p},${c},${m}`);
    assert.equal(d.resultado, res, `${p},${c},${m}`);
  }
  assert.match(sql, /else greatest\(p_calificado, p_previo - 2, 1\)::smallint end/);
});
