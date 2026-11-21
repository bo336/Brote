import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { duracion, frasesDeHabito, historiaDe, historiaPrincipal, historias, HABITOS, textoParaCompartir } from '../historias';
import { CO2_EQ, ENERGY_EQ, WASTE_EQ, WATER_EQ, formatCount, rankEquivalences } from '../../impact';

/**
 * El impacto contado como historia (docs/REESTRUCTURA.md D5): se entiende,
 * nunca agranda, y respeta las reglas de lenguaje de 13-IMPACT-MIRROR §4.
 */

test('la duración nunca dice más de lo que es', () => {
  assert.equal(duracion(0.5), null);
  assert.equal(duracion(1), 'un día');
  assert.equal(duracion(1.9), 'un día');
  assert.equal(duracion(5.99), '5 días');
  assert.equal(duracion(7), 'una semana');
  assert.equal(duracion(9), 'más de una semana');
  assert.equal(duracion(13), 'casi 2 semanas'); // 13 < 14
  assert.equal(duracion(20.5), 'casi 3 semanas'); // 20,5 < 21
  assert.equal(duracion(29), '4 semanas'); // 4,1 semanas; "casi 5 semanas" pasaría a un mes
  assert.equal(duracion(27), 'casi 4 semanas');
  assert.equal(duracion(30), 'un mes');
  assert.equal(duracion(45), 'más de un mes');
  assert.equal(duracion(350), 'más de 11 meses'); // nunca "casi 12 meses"
  assert.equal(duracion(365), 'un año');
  assert.equal(duracion(819), 'más de 2 años');
});

test('casi N siempre es menos que N, y más de N siempre es más que N', () => {
  const dias = { día: 1, días: 1, semana: 7, semanas: 7, mes: 30, meses: 30, año: 365, años: 365 } as Record<string, number>;
  for (let d = 1; d < 3000; d += 0.37) {
    const s = duracion(d)!;
    const m = /^(casi |más de )?(un|una|\d+) (\S+)$/.exec(s);
    assert.ok(m, s);
    const n = m[2] === 'un' || m[2] === 'una' ? 1 : Number(m[2]);
    const u = dias[m[3]!]!;
    if (m[1] === 'casi ') assert.ok(d < n * u, `${d} → ${s}`);
    else assert.ok(d >= n * u, `${d} → ${s}`);
  }
});

test('las cosas se cuentan para abajo', () => {
  assert.equal(formatCount(9.96), '9,9');
  assert.equal(formatCount(10.9), '10');
  assert.equal(formatCount(1234.9), '1.234');
});

test('un litro y medio no dice nada raro: vasos, no piletas', () => {
  const h = historiaDe('water', 1.5)!;
  assert.ok(h);
  assert.match(h.frase, /vaso/);
});

test('el total de la comunidad (1.639 L) se cuenta en tiempo de vida', () => {
  const h = historiaDe('water', 1639)!;
  assert.equal(h.valor, '1,6 m³');
  // 1.639 / 80 = 20,5 días de ducha → "casi 3 semanas"
  const frases = [h.frase, ...h.otrasFrases.map((f) => f.frase)];
  assert.ok(frases.includes('Alcanza para ducharte todos los días durante casi 3 semanas.'), frases.join(' | '));
  assert.ok(h.ejemplos.length >= 2);
  assert.ok(h.ejemplos.every((e) => !/olímpic|pileta|camión/i.test(e.texto)));
});

test('la principal es la métrica que más pesa contra un día de una persona', () => {
  const h = historiaPrincipal({ water_l: 50, co2_kg: 0.2, waste_kg: 0, energy_kwh: 0 })!;
  assert.equal(h.metrica, 'water');
  assert.equal(historiaPrincipal({ water_l: 0, co2_kg: 0, waste_kg: 0, energy_kwh: 0 }), null);
  assert.equal(historias({ water_l: 10, co2_kg: 0, waste_kg: 0.5, energy_kwh: 0 }).length, 2);
});

test('ninguna frase cuenta árboles, compensa o achica a la persona', () => {
  const textos: string[] = [];
  for (const m of ['water', 'co2', 'waste', 'energy'] as const) {
    for (const cant of [0.01, 0.5, 3, 40, 900, 25_000, 1_000_000]) {
      const h = historiaDe(m, cant);
      if (!h) continue;
      textos.push(h.frase, ...h.ejemplos.map((e) => e.texto), ...h.otrasFrases.map((f) => f.frase));
    }
  }
  for (const eq of [...WATER_EQ, ...CO2_EQ, ...WASTE_EQ, ...ENERGY_EQ]) textos.push(eq.one, eq.many, eq.base);
  for (const hs of Object.values(HABITOS)) for (const h of hs) textos.push(h.frase, h.base);
  const todo = textos.join(' ').toLowerCase();
  for (const prohibido of ['árbol', 'arbol', 'compens', 'neutral', 'planeta', 'olímpic', 'camión', 'vuelo', 'país']) {
    assert.ok(!todo.includes(prohibido), `dice "${prohibido}"`);
  }
});

test('cada cifra dice de dónde sale', () => {
  for (const eq of [...WATER_EQ, ...CO2_EQ, ...WASTE_EQ, ...ENERGY_EQ]) assert.ok(eq.base.length > 5, eq.one);
  for (const hs of Object.values(HABITOS)) for (const h of hs) assert.ok(h.base.length > 5, h.id);
});

test('los ejemplos son cosas distintas, de la más fácil de imaginar a la menos', () => {
  const r = rankEquivalences(1639, WATER_EQ, 3);
  assert.equal(new Set(r.map((x) => x.eq.one)).size, r.length);
  assert.ok(r.every((x) => x.count >= 0.95));
});

test('más de 30 años deja de ser una imagen', () => {
  assert.ok(frasesDeHabito('water', 1_000_000).every((f) => !/\d{2,} años/.test(f.frase) || Number(/(\d+) años/.exec(f.frase)![1]) <= 30));
});

test('compartir dice la cifra y la frase', () => {
  const h = historiaDe('waste', 3)!;
  const s = textoParaCompartir(h);
  assert.match(s, /^Con lo que hice en Brote ahorré 3 kg de residuos\. /);
});
