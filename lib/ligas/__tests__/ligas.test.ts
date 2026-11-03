import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { LIGAS, REGLAS_LIGA, decidirLiga, estadoSemana } from '../../ligas';

const sql = fs.readFileSync(path.join(process.cwd(), 'supabase/migrations/0142_ligas_semanales.sql'), 'utf8');

test('the goals of each league are the same in TypeScript and in the migration', () => {
  const filas = [...sql.matchAll(/update public\.rangos set puntos_mantener = (\d+),\s+puntos_subir = (\d+|null)\s+where tier = (\d);/g)];
  assert.equal(filas.length, 7);
  for (const f of filas) {
    const l = LIGAS.find((x) => x.tier === Number(f[3]));
    assert.ok(l, `tier ${f[3]}`);
    assert.equal(l!.mantener, Number(f[1]));
    assert.equal(l!.subir, f[2] === 'null' ? null : Number(f[2]));
  }
});

test('the default rules are the same in TypeScript and in the migration', () => {
  const m = sql.match(/'\{"tope_diario": (\d+), "tamano_grupo": (\d+), "top_suben": (\d+), "grupo_minimo": (\d+)\}'/);
  assert.ok(m);
  assert.deepEqual(REGLAS_LIGA, {
    tope_diario: Number(m![1]),
    tamano_grupo: Number(m![2]),
    top_suben: Number(m![3]),
    grupo_minimo: Number(m![4]),
  });
});

test('every league can be held and climbed: holding is always cheaper than going up, and goals grow', () => {
  for (const [i, l] of LIGAS.entries()) {
    if (l.subir != null) assert.ok(l.subir > l.mantener, l.nombre);
    if (i > 0) assert.ok(l.mantener >= LIGAS[i - 1]!.mantener, l.nombre);
  }
  // Con 400 puntos por día como máximo, ninguna meta pide más de una semana entera.
  assert.ok(Math.max(...LIGAS.map((l) => l.subir ?? l.mantener)) <= REGLAS_LIGA.tope_diario * 7);
  // Y ninguna meta alta se logra en un solo día de empujón.
  const faro = LIGAS.at(-1)!;
  assert.ok(faro.mantener > REGLAS_LIGA.tope_diario * 2);
});

const regla = (tier: number, puntos: number, pos: number | null = null, tam = 1) => {
  const l = LIGAS[tier - 1]!;
  return decidirLiga(tier, puntos, pos, tam, l.mantener, l.subir, REGLAS_LIGA.top_suben, REGLAS_LIGA.grupo_minimo);
};

test('the weekly close: go up with the goal, down below the floor, stay in between', () => {
  assert.deepEqual(regla(4, 750), { nuevo: 5, resultado: 'sube' });
  assert.deepEqual(regla(4, 749), { nuevo: 4, resultado: 'mantiene' });
  assert.deepEqual(regla(4, 350), { nuevo: 4, resultado: 'mantiene' });
  assert.deepEqual(regla(4, 349), { nuevo: 3, resultado: 'baja' });
  assert.deepEqual(regla(4, 0), { nuevo: 3, resultado: 'baja' });
});

test('one league per week, the bottom never drops, the top never climbs', () => {
  assert.equal(regla(2, 50_000).nuevo, 3);
  assert.deepEqual(regla(1, 0), { nuevo: 1, resultado: 'mantiene' });
  assert.deepEqual(regla(7, 50_000), { nuevo: 7, resultado: 'mantiene' });
  assert.deepEqual(regla(7, 899), { nuevo: 6, resultado: 'baja' });
});

test('someone else going up never costs you anything: nobody is forced down by position', () => {
  // Último de un grupo de 30, pero llegó a su piso: se mantiene.
  assert.deepEqual(regla(4, 350, 30, 30), { nuevo: 4, resultado: 'mantiene' });
});

test('the top of a real group also goes up, if they reached the floor', () => {
  assert.equal(regla(4, 400, 3, 12).resultado, 'sube');
  assert.equal(regla(4, 400, 4, 12).resultado, 'mantiene');
  assert.equal(regla(4, 300, 1, 12).resultado, 'baja');
  // En un grupo chico ser primero no dice nada.
  assert.equal(regla(4, 400, 1, 5).resultado, 'mantiene');
  // Y en la primera liga, hay que haber sumado algo.
  assert.equal(regla(1, 0, 1, 12).resultado, 'mantiene');
});

test('what the week screen says', () => {
  const ref = LIGAS[3]!;
  assert.deepEqual(estadoSemana(ref, 100), { caso: 'por_mantener', faltan: 250 });
  assert.deepEqual(estadoSemana(ref, 400), { caso: 'por_subir', faltan: 350 });
  assert.deepEqual(estadoSemana(ref, 800), { caso: 'ya_sube', faltan: 0 });
  assert.deepEqual(estadoSemana(LIGAS[0]!, 0), { caso: 'por_subir', faltan: 150 });
  assert.deepEqual(estadoSemana(LIGAS[6]!, 950), { caso: 'tope', faltan: 0 });
  assert.deepEqual(estadoSemana(LIGAS[6]!, 100), { caso: 'por_mantener', faltan: 800 });
});
