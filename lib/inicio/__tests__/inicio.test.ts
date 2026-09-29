import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { impactoDeAccion, pistaDeImpacto, pistasDeImpacto, sumar, esCero } from '../impacto';
import { elegirPuentes, type ContextoPuentes } from '../puentes';
import { EMPTY_IMPACT } from '../../impact';

// ── impacto ────────────────────────────────────────────────────────────────

test('an action with no measured impact shows no number', () => {
  assert.equal(pistaDeImpacto(impactoDeAccion({})), null);
  assert.equal(pistaDeImpacto(impactoDeAccion(null)), null);
  assert.ok(esCero(impactoDeAccion({ impact_water_l: 0, impact_co2_kg: null })));
});

test('numbers that arrive as strings (numeric columns) are read', () => {
  const t = impactoDeAccion({ impact_water_l: '70', impact_co2_kg: '0.2' });
  assert.equal(t.water_l, 70);
  assert.equal(t.co2_kg, 0.2);
  assert.equal(t.actions, 1);
});

test('the row shows the metric that weighs most against a day of use', () => {
  // 70 L of ~180 L/day (0.39) beats 0,5 kg CO₂ of ~11 kg/day (0.05).
  const p = pistaDeImpacto({ ...EMPTY_IMPACT, water_l: 70, co2_kg: 0.5 });
  assert.equal(p?.key, 'water');
  assert.equal(p?.valor, '70 L');
  assert.equal(p?.texto, '70 L de agua');
  // 3 kWh is a whole day of electricity: it wins over 10 L of water.
  assert.equal(pistaDeImpacto({ ...EMPTY_IMPACT, water_l: 10, energy_kwh: 3 })?.key, 'energy');
});

test("with a topic, the row speaks that topic's metric when it has one", () => {
  const ducha = impactoDeAccion({ impact_water_l: 50, impact_energy_kwh: 0.9 });
  assert.equal(pistaDeImpacto(ducha)?.key, 'energy'); // 0.9/3 outweighs 50/180
  assert.equal(pistaDeImpacto(ducha, 'agua')?.texto, '50 L de agua');
  // A topic whose metric the action lacks falls back to the heaviest.
  assert.equal(pistaDeImpacto(impactoDeAccion({ impact_co2_kg: 1.2 }), 'agua')?.key, 'co2');
});

test('under a kilo reads in grams, never "0 kg"', () => {
  assert.equal(pistaDeImpacto(impactoDeAccion({ impact_waste_kg: 0.03 }))?.valor, '30 g');
  assert.equal(pistaDeImpacto(impactoDeAccion({ impact_co2_kg: 1.2 }))?.valor, '1,2 kg');
});

test('every metric that moved, in fixed order, and sums add up', () => {
  const a = impactoDeAccion({ impact_water_l: 70, impact_waste_kg: 0.1 });
  const b = impactoDeAccion({ impact_water_l: 30, impact_co2_kg: 1 });
  const s = sumar(a, b);
  assert.equal(s.water_l, 100);
  assert.equal(s.actions, 2);
  assert.deepEqual(
    pistasDeImpacto(s).map((p) => p.key),
    ['water', 'co2', 'waste'],
  );
});

// ── puentes ────────────────────────────────────────────────────────────────

const base: ContextoPuentes = {
  academiaEnTema: false,
  academiaSiguiente: false,
  saviaRestante: 3,
  mercadoEnTema: 0,
  mercadoDisponible: false,
  mundoAbierto: false,
  visitadosHoy: [],
};

test('a lesson in the same topic comes first', () => {
  const o = elegirPuentes({ ...base, academiaEnTema: true, mercadoEnTema: 4, mundoAbierto: true });
  assert.deepEqual(o, ['academia', 'mercado', 'mundo', 'plaza']);
});

test('no sap left: the Academia is not offered first', () => {
  const o = elegirPuentes({ ...base, academiaEnTema: true, academiaSiguiente: true, saviaRestante: 0, mundoAbierto: true });
  assert.ok(!o.includes('academia'));
  assert.equal(o[0], 'mundo');
});

test('Brote+ (unlimited sap) still gets the lesson', () => {
  assert.equal(elegirPuentes({ ...base, academiaEnTema: true, saviaRestante: null })[0], 'academia');
});

test('the Plaza is always there, and a closed world never is', () => {
  const o = elegirPuentes(base);
  assert.deepEqual(o, ['plaza']);
});

test('what was already visited today goes to the end', () => {
  const o = elegirPuentes({
    ...base,
    academiaEnTema: true,
    mundoAbierto: true,
    mercadoDisponible: true,
    visitadosHoy: ['academia'],
  });
  assert.deepEqual(o, ['mundo', 'plaza', 'mercado', 'academia']);
});

test('no duplicates when a door qualifies twice', () => {
  const o = elegirPuentes({ ...base, academiaEnTema: true, academiaSiguiente: true, mercadoEnTema: 2, mercadoDisponible: true });
  assert.equal(new Set(o).size, o.length);
});
