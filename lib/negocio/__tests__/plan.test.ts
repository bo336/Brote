import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import {
  LIMITES,
  PLANES,
  SIN_TOPE,
  diasHasta,
  planQueDestraba,
  puedeCrearObjetivo,
  puedeInvitar,
  puedePublicar,
  puedeReplanificar,
  situacion,
  textoTope,
  type EstadoPlan,
} from '../plan';

/**
 * Los topes de plan viven en dos lugares —TypeScript para la pantalla, SQL
 * para el gating de verdad— y este test existe para que no se separen nunca.
 */

const RAIZ = process.cwd();
const SQL = readFileSync(join(RAIZ, 'supabase/migrations/0108_negocios_cobro_e_integracion.sql'), 'utf8');

test('LIMITES es idéntico a brote_biz_limites() en la migración', () => {
  const cuerpo = SQL.slice(
    SQL.indexOf('create or replace function brote_biz_limites('),
    SQL.indexOf('$fn$;', SQL.indexOf('create or replace function brote_biz_limites(')),
  );
  assert.ok(cuerpo.length > 100, 'no se encontró brote_biz_limites');

  // Cada `'{...}'::jsonb` del case, en el orden semilla, raiz, bosque.
  const bloques = [...cuerpo.matchAll(/'(\{[^']*\})'::jsonb/g)].map((m) =>
    JSON.parse(m[1]!.replace(/\s+/g, ' ')),
  );
  assert.equal(bloques.length, 3, 'deberían ser tres planes');

  PLANES.forEach((plan, i) => {
    const sql = bloques[i]!;
    const ts = LIMITES[plan];
    assert.equal(sql.listados, ts.listados, `${plan}.listados`);
    assert.equal(sql.objetivos, ts.objetivos, `${plan}.objetivos`);
    assert.equal(sql.replanificaciones, ts.replanificaciones, `${plan}.replanificaciones`);
    assert.equal(sql.miembros, ts.miembros, `${plan}.miembros`);
    assert.equal(sql.analitica, ts.analitica, `${plan}.analitica`);
    assert.equal(sql.historial_publico, ts.historial_publico, `${plan}.historial_publico`);
    assert.equal(sql.destacados, ts.destacados, `${plan}.destacados`);
    assert.equal(sql.acelerada, ts.acelerada, `${plan}.acelerada`);
  });
});

test('los topes son los de 09 §5, sin interpretación', () => {
  assert.deepEqual(
    PLANES.map((p) => LIMITES[p].listados),
    [3, 15, SIN_TOPE],
  );
  assert.deepEqual(
    PLANES.map((p) => LIMITES[p].objetivos),
    [2, 3, 3],
  );
  assert.deepEqual(
    PLANES.map((p) => LIMITES[p].replanificaciones),
    [4, 8, 15],
  );
  assert.deepEqual(
    PLANES.map((p) => LIMITES[p].miembros),
    [1, 3, 10],
  );
});

test('los topes se aplican como "menor que", no "menor o igual"', () => {
  assert.equal(puedePublicar('semilla', 2), true);
  assert.equal(puedePublicar('semilla', 3), false);
  assert.equal(puedeCrearObjetivo('semilla', 2), false);
  assert.equal(puedeCrearObjetivo('raiz', 2), true);
  assert.equal(puedeReplanificar('raiz', 8), false);
  assert.equal(puedeInvitar('semilla', 1), false);
  assert.equal(puedeInvitar('bosque', 9), true);
});

test('la invitación nombra el plan que destraba cada cosa', () => {
  assert.equal(planQueDestraba('semilla', 'listados'), 'raiz');
  assert.equal(planQueDestraba('semilla', 'historial_publico'), 'raiz');
  assert.equal(planQueDestraba('raiz', 'listados'), 'bosque');
  assert.equal(planQueDestraba('bosque', 'listados'), null);
  assert.equal(planQueDestraba('semilla', 'analitica'), 'raiz');
});

test('el tope de Bosque no se escribe como número', () => {
  assert.equal(textoTope(LIMITES.bosque.listados), null);
  assert.equal(textoTope(3), '3');
});

test('ningún plan compra nivel ni posición: el ranking no tiene término de plan', () => {
  const ranking = readFileSync(join(RAIZ, 'lib/mercado/ranking.ts'), 'utf8');
  const formula = ranking.slice(ranking.indexOf('export function scoreMaterializado'));
  assert.ok(!/\bplan\b/i.test(formula.split('}')[0] ?? ''), 'la fórmula menciona el plan');
  const score = SQL.indexOf('create or replace function brote_listado_score(');
  const cuerpoSql = SQL.slice(score, SQL.indexOf('$fn$;', score));
  assert.ok(!/brote_biz_plan|brote_negocio_plan|biz_plan/.test(cuerpoSql), 'el puntaje SQL mira el plan');
});

function estado(p: Partial<EstadoPlan>): EstadoPlan {
  return {
    cobro_activo: true,
    plan: 'semilla',
    limites: LIMITES.semilla,
    uso: { listados: 0, objetivos: 0, miembros: 1, replanificaciones: 0 },
    escritura: true,
    fundador: false,
    prueba_fin: null,
    en_prueba: false,
    rol: 'owner',
    suscripcion: null,
    precios: { semilla: 0, raiz: 0, bosque: 0, moneda: 'ARS' },
    ...p,
  };
}

test('la situación que ve la empresa sale de un solo lugar', () => {
  assert.equal(situacion(estado({ cobro_activo: false })), 'fundador');
  assert.equal(situacion(estado({ en_prueba: true })), 'prueba');
  assert.equal(situacion(estado({})), 'sin_plan');
  assert.equal(
    situacion(
      estado({
        suscripcion: { plan: 'raiz', status: 'activa', monto: 1, moneda: 'ARS', precio_bloqueado: false, periodo_fin: null, gracia_fin: null, desde: '' },
      }),
    ),
    'activa',
  );
  // La gracia manda sobre la prueba: es lo que hay que resolver primero.
  assert.equal(
    situacion(
      estado({
        en_prueba: true,
        suscripcion: { plan: 'raiz', status: 'en_gracia', monto: 1, moneda: 'ARS', precio_bloqueado: false, periodo_fin: null, gracia_fin: null, desde: '' },
      }),
    ),
    'gracia',
  );
});

test('los días que faltan nunca son negativos', () => {
  const hoy = new Date('2026-09-20T12:00:00Z');
  assert.equal(diasHasta('2026-09-23T12:00:00Z', hoy), 3);
  assert.equal(diasHasta('2026-09-01T12:00:00Z', hoy), 0);
  assert.equal(diasHasta(null, hoy), 0);
});
