import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import type { Afirmacion, Nivel } from '../claims';
import {
  actividad,
  credibilidad,
  exploracion,
  fit,
  reordenarPorDiversidad,
  salud,
  scoreEnVivo,
  scoreMaterializado,
  type EntradaListado,
} from '../ranking';
import { validarListado, type ListadoParaValidar } from '../validador';

/**
 * El orden del catálogo (05 §4) y el validador determinista (fase 3 §3),
 * contra los criterios de aceptación de la fase 3 §11 y la tabla de 05 §7.
 */

function entrada(over: Partial<EntradaListado> = {}): EntradaListado {
  return {
    tierEfectivo: 'e1',
    tierEmpresa: 'e1',
    afirmacionesDeclaradas: 1,
    afirmacionesAprobadas: 1,
    diasDesdeRevision: 0,
    diasDesdeActualizacion: 0,
    diasDesdePublicacion: 0,
    progresoMejora: 0,
    reportesRespuesta: { total: 0, aTiempo: 0 },
    linkFallos: 0,
    clics90: 0,
    impresiones90: 0,
    medianaCtrCategoria: null,
    reportesConfirmados90: 0,
    reportesAfirmacionAbiertos: 0,
    certVencidaHaceDias: null,
    enGracia: false,
    ...over,
  };
}

// ── Paridad con la base ─────────────────────────────────────────────────────

test('el mismo puntaje que dio brote_listado_score() en la QA contra la base', () => {
  // Recién publicado, dos afirmaciones aprobadas, una en E3: la base dio 65.500.
  assert.equal(scoreMaterializado(entrada({ tierEfectivo: 'e3', afirmacionesDeclaradas: 2, afirmacionesAprobadas: 2 })), 65.5);
  // Y con la certificación vencida ayer (baja a E2, −5): la base dio 50.500.
  assert.equal(
    scoreMaterializado(entrada({ tierEfectivo: 'e2', afirmacionesDeclaradas: 2, afirmacionesAprobadas: 2, certVencidaHaceDias: 1 })),
    50.5,
  );
});

test('la advertencia sobre el plan está arriba de la fórmula, literal', () => {
  const src = readFileSync(join(process.cwd(), 'lib/mercado/ranking.ts'), 'utf8');
  assert.ok(src.includes(
    '// El plan de la empresa NO entra en esta fórmula, nunca.\n' +
    '// Si algún día se agrega un término de plan acá, el catálogo pierde lo único\n' +
    '// que lo hace distinto de un directorio pago. Ver 09_MONETIZACION.md §2.1.',
  ));
  assert.ok(!/\bplan\b/i.test(src.slice(src.indexOf('export function scoreMaterializado'))
    .split('\n').filter((l) => !l.trim().startsWith('//')).join('\n')), 'la fórmula no puede leer el plan');
});

// ── Las piezas ──────────────────────────────────────────────────────────────

test('credibilidad: E1 0.35, E2 0.65, E3 0.90, E4 de empresa +0.10 con tope', () => {
  assert.equal(credibilidad(entrada({ tierEfectivo: 'e1' })), 0.35);
  assert.equal(credibilidad(entrada({ tierEfectivo: 'e2' })), 0.65);
  assert.equal(credibilidad(entrada({ tierEfectivo: 'e3' })), 0.9);
  assert.equal(credibilidad(entrada({ tierEfectivo: 'e3', tierEmpresa: 'e4' })), 1);
});

test('cobertura: declarar cinco y probar una castiga, pero nunca baja de 0.7', () => {
  const c = credibilidad(entrada({ tierEfectivo: 'e3', afirmacionesDeclaradas: 5, afirmacionesAprobadas: 1 }));
  assert.ok(Math.abs(c - 0.9 * (0.7 + 0.3 / 5)) < 1e-9);
  assert.ok(credibilidad(entrada({ afirmacionesDeclaradas: 5, afirmacionesAprobadas: 0 })) >= 0.35 * 0.7);
});

test('frescura de la evidencia: 1.0 / 0.9 / 0.8', () => {
  assert.equal(credibilidad(entrada({ diasDesdeRevision: 400 })), 0.35 * 0.9);
  assert.equal(credibilidad(entrada({ diasDesdeRevision: 800 })), 0.35 * 0.8);
});

test('exploración: 1 el día 0, 0.37 el día 7, 0 desde el 21', () => {
  assert.equal(exploracion(entrada({ diasDesdePublicacion: 0 })), 1);
  assert.ok(Math.abs(exploracion(entrada({ diasDesdePublicacion: 7 })) - Math.exp(-1)) < 1e-9);
  assert.ok(exploracion(entrada({ diasDesdePublicacion: 20 })) > 0);
  assert.equal(exploracion(entrada({ diasDesdePublicacion: 21 })), 0);
});

test('el CTR necesita 50 impresiones: por debajo, neutro', () => {
  const base = salud(entrada());
  assert.equal(salud(entrada({ impresiones90: 49, clics90: 49, medianaCtrCategoria: 0.02 })), base);
  assert.ok(salud(entrada({ impresiones90: 100, clics90: 10, medianaCtrCategoria: 0.02 })) > base);
  assert.ok(salud(entrada({ impresiones90: 100, clics90: 0, medianaCtrCategoria: 0.02 })) < base);
});

test('mejorar te hace visible: el Progreso de Mejora suma en actividad', () => {
  assert.ok(actividad(entrada({ progresoMejora: 80 })) > actividad(entrada({ progresoMejora: 0 })));
});

test('las penalizaciones restan directo', () => {
  const sano = scoreMaterializado(entrada());
  assert.equal(Math.round(sano - scoreMaterializado(entrada({ reportesAfirmacionAbiertos: 1 }))), 20);
  assert.ok(sano - scoreMaterializado(entrada({ linkFallos: 2 })) > 25, 'enlace caído: −25 y además cae la salud');
});

// ── Aceptación (fase 3 §11 y 05 §7) ─────────────────────────────────────────

const PERSONA = { intereses: ['alimentacion', 'residuos'], provincia: 'Buenos Aires' };
const TARJETA = {
  dominios: ['alimentacion'], disponibilidad: 'online', zonas: [], categoria: 'alimentos-frescos',
  negocio: { provincia: 'Buenos Aires' }, tieneImagen: true, descripcionLargo: 300, tienePrecio: true,
};
const F = fit(TARJETA, PERSONA);

function vivo(e: EntradaListado): number {
  return scoreEnVivo(scoreMaterializado(e), F);
}

test('un listado E1 nuevo aparece en la primera pantalla el día 1', () => {
  // Un catálogo de 60 listados establecidos (E1, E2 y E3 de entre 2 meses y 2 años), mismo fit.
  const establecidos: number[] = [];
  const niveles: Nivel[] = ['e1', 'e1', 'e2', 'e2', 'e3'];
  for (let i = 0; i < 60; i++) {
    const dias = 60 + ((i * 37) % 660);
    establecidos.push(vivo(entrada({
      tierEfectivo: niveles[i % niveles.length]!, diasDesdeRevision: dias, diasDesdeActualizacion: dias,
      diasDesdePublicacion: dias, progresoMejora: (i * 13) % 60,
    })));
  }
  const nuevo = vivo(entrada({ tierEfectivo: 'e1', diasDesdeActualizacion: 1, diasDesdePublicacion: 1, diasDesdeRevision: 1 }));
  const puesto = establecidos.filter((s) => s > nuevo).length + 1;
  assert.ok(puesto <= 24, `quedó en el puesto ${puesto}`);
});

test('a los 10 días, un E3 de un año con fit similar le gana', () => {
  const e3 = vivo(entrada({ tierEfectivo: 'e3', diasDesdeRevision: 300, diasDesdeActualizacion: 300, diasDesdePublicacion: 365 }));
  for (let dia = 10; dia <= 60; dia++) {
    const e1 = vivo(entrada({ tierEfectivo: 'e1', diasDesdeActualizacion: dia, diasDesdePublicacion: dia, diasDesdeRevision: dia }));
    assert.ok(e3 > e1, `el día ${dia} el E1 (${e1}) le gana al E3 (${e3})`);
  }
});

test('una empresa con 8 listados no muestra más de 2 seguidos', () => {
  const items = [
    // La empresa A domina el puntaje: sin la segunda pasada habría rachas de 3+.
    ...Array.from({ length: 8 }, (_, i) => ({ score: 90 - i, negocio: { slug: 'a' }, id: `a${i}` })),
    ...Array.from({ length: 16 }, (_, i) => ({ score: 40 - i, negocio: { slug: `n${i % 5}` }, id: `n${i}` })),
  ];
  const orden = reordenarPorDiversidad(items);
  assert.equal(orden.length, items.length);
  for (let i = 2; i < orden.length; i++) {
    const tres = new Set([orden[i]!.negocio.slug, orden[i - 1]!.negocio.slug, orden[i - 2]!.negocio.slug]);
    assert.ok(tres.size > 1, `racha de 3 de "${orden[i]!.negocio.slug}" en ${i - 2}..${i}`);
  }
});

test('con poca oferta la diversidad no deja huecos', () => {
  const items = Array.from({ length: 5 }, (_, i) => ({ score: 50 - i, negocio: { slug: 'solo' }, id: `${i}` }));
  assert.equal(reordenarPorDiversidad(items).length, 5);
});

test('fit: sin sesión es neutro en afinidad; local lejos pesa menos', () => {
  const sin = fit(TARJETA, null);
  assert.ok(Math.abs(sin - (0.45 * 0.5 + 0.25 + 0.2 * 0.6 + 0.1)) < 1e-9);
  const local = { ...TARJETA, disponibilidad: 'local', negocio: { provincia: 'Mendoza' } };
  assert.ok(fit(local, PERSONA) < fit(TARJETA, PERSONA));
});

// ── El validador ────────────────────────────────────────────────────────────

const ORGANICA: Afirmacion = {
  kind: 'organico', alcance: 'Harina de trigo', datos: {},
  cert_slug: 'oia', cert_numero: 'N-1', cert_vence: '2027-01-01', evidencia: true,
};
const CERTS = [{ slug: 'oia', nombre: 'OIA', emisor: 'OIA', claims: ['organico' as const], tiene_numero: true, vence: true }];

function listado(over: Partial<ListadoParaValidar> = {}): ListadoParaValidar {
  return {
    titulo: 'Harina orgánica de trigo, 1 kg',
    descripcion: 'Harina de trigo molida en piedra en nuestro molino de Tandil, con trigo de productores de la zona. Bolsa de papel.',
    categoria: 'alimentos-frescos',
    dominios: ['alimentacion'],
    precio_referencia: 4200,
    url_destino: 'https://molino.com.ar/harina',
    imagenes: 1,
    afirmaciones: [ORGANICA],
    ...over,
  };
}

function codigosListado(l: ListadoParaValidar): string[] {
  return validarListado(l, { certs: CERTS, hoy: '2026-09-19' }).errores.map((e) => e.codigo);
}

test('un listado correcto pasa', () => {
  assert.deepEqual(codigosListado(listado()), []);
});

test('"100% ecológico" en la descripción se rechaza', () => {
  assert.ok(codigosListado(listado({ descripcion: listado().descripcion + ' Producto 100% ecológico.' })).includes('texto_prohibido'));
});

test('"Cura el estrés" se rechaza aunque tenga certificación', () => {
  assert.ok(codigosListado(listado({ descripcion: listado().descripcion + ' Cura el estrés.' })).includes('texto_prohibido'));
});

test('"orgánico" en el título sin la afirmación cargada se rechaza', () => {
  const r = codigosListado(listado({
    afirmaciones: [{ kind: 'reciclable', alcance: 'Bolsa', datos: { material: 'papel', disponibilidad: 'cooperativa_local' } }],
  }));
  assert.ok(r.includes('termino_sin_afirmacion'));
});

test('un término vago se marca, no se rechaza', () => {
  const r = validarListado(listado({ descripcion: listado().descripcion + ' Sabor natural.' }), { certs: CERTS });
  assert.ok(r.ok);
  assert.ok(r.banderas.some((b) => b.termino === 'natural'));
});

test('rubros incompatibles, largos, imágenes, precio y URL', () => {
  assert.ok(codigosListado(listado({ descripcion: listado().descripcion + ' Ideal para tu vapeador.' })).includes('rubro_incompatible'));
  assert.ok(codigosListado(listado({ titulo: 'Harina' })).includes('titulo_largo'));
  assert.ok(codigosListado(listado({ descripcion: 'Muy buena.' })).includes('descripcion_largo'));
  assert.ok(codigosListado(listado({ imagenes: 0 })).includes('faltan_imagenes'));
  assert.ok(codigosListado(listado({ imagenes: 5 })).includes('max_imagenes'));
  assert.ok(codigosListado(listado({ precio_referencia: 0 })).includes('precio_invalido'));
  assert.ok(codigosListado(listado({ url_destino: 'http://molino.com.ar' })).includes('url_invalida'));
  assert.ok(codigosListado(listado({ afirmaciones: [] })).includes('sin_afirmaciones'));
});
