import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import { CATEGORIAS, CATEGORIAS_SENSIBLES } from '../categorias';
import {
  CLAIMS,
  CLAIM_KINDS,
  LISTA_NEGRA,
  SIN_E1,
  SIN_E2,
  SIN_E3,
  buscarProhibido,
  rangoMeses,
  validarAfirmacion,
  type Afirmacion,
  type CertInfo,
  type ClaimKind,
  type Datos,
} from '../claims';
import { nivelAfirmacion } from '../../negocio/niveles';

/**
 * Los tests de `claims.ts` (fase 3 §2): para cada una de las 16 afirmaciones,
 * un caso válido y uno que debe rechazarse. Son lo que sostiene todo el sistema
 * de evidencia. Más la paridad con lo que la base repite a propósito.
 */

const HOY = '2026-09-19';

const REGISTRO: CertInfo[] = [
  { slug: 'oia', nombre: 'Certificación orgánica OIA', emisor: 'OIA S.A.', claims: ['organico'], tiene_numero: true, vence: true },
  { slug: 'fsc', nombre: 'FSC', emisor: 'Forest Stewardship Council', claims: ['materiales_renovables', 'certificacion_tercero'], tiene_numero: true, vence: true },
  { slug: 'iso14001', nombre: 'ISO 14001', emisor: 'Organismos acreditados', claims: ['certificacion_tercero'], tiene_numero: true, vence: true },
  { slug: 'argencert', nombre: 'Argencert', emisor: 'Argencert', claims: ['organico'], tiene_numero: true, vence: true, activo: false },
];

function a(kind: ClaimKind, alcance: string, datos: Datos, extra: Partial<Afirmacion> = {}): Afirmacion {
  return { kind, alcance, datos, ...extra };
}

function codigos(x: Afirmacion, categoria: string | null = null): string[] {
  return validarAfirmacion(x, { categoria, certs: REGISTRO, hoy: HOY }).map((e) => e.codigo);
}

/** [kind, válida, rechazada, código esperado del rechazo, categoría] */
const CASOS: [ClaimKind, Afirmacion, Afirmacion, string, string | null][] = [
  ['organico',
    a('organico', 'Harina de trigo', {}),
    a('organico', '', {}), 'falta_alcance', null],
  ['reciclable',
    a('reciclable', 'Envase', { material: 'papel kraft', disponibilidad: 'recoleccion_diferenciada_amplia' }),
    a('reciclable', 'Envase', { material: 'papel kraft' }), 'campo_invalido', null],
  ['contenido_reciclado',
    a('contenido_reciclado', 'Envase', { porcentaje: 80, post_consumo: true }),
    a('contenido_reciclado', 'Envase', { post_consumo: true }), 'campo_invalido', null],
  ['compostable',
    a('compostable', 'Vaso', { tipo_compostaje: 'industrial', plazo_meses: 6 }),
    a('compostable', 'Vaso', { plazo_meses: 6 }), 'campo_invalido', null],
  ['biodegradable',
    a('biodegradable', 'Bolsa', { plazo_meses: 6, condiciones: 'suelo húmedo' }),
    a('biodegradable', 'Bolsa', { plazo_meses: 24, condiciones: 'suelo húmedo' }), 'plazo_mayor_12', null],
  ['libre_de',
    a('libre_de', 'Crema facial', { sustancia: 'parabenos', no_agregada_intencionalmente: true, sustituto: 'alcohol bencílico' }),
    a('libre_de', 'Crema facial', { sustancia: 'químicos', no_agregada_intencionalmente: true, sustituto: 'nada' }), 'sustancia_generica', 'cuidado-personal'],
  ['no_toxico',
    a('no_toxico', 'Detergente', { para_quien: 'ambos', respaldo: 'ficha_seguridad' }, { evidencia: true }),
    a('no_toxico', 'Detergente', { para_quien: 'ambos', respaldo: 'ficha_seguridad' }), 'falta_documento', null],
  ['energia_renovable',
    a('energia_renovable', 'x', { fuente: 'solar', porcentaje_procesos: 90, certificados: 'a_nombre_propio' }),
    a('energia_renovable', 'x', { fuente: 'solar', porcentaje_procesos: 60, certificados: 'a_nombre_propio' }), 'porcentaje_menor_80', null],
  ['materiales_renovables',
    a('materiales_renovables', 'Madera de pino', { material: 'Madera de pino de forestación', porcentaje: 95, por_que_renovable: 'Viene de plantaciones que se replantan' }),
    a('materiales_renovables', 'Madera', { porcentaje: 95, por_que_renovable: 'Viene de plantaciones que se replantan' }), 'campo_invalido', null],
  ['reduccion_origen',
    a('reduccion_origen', 'Plástico', { que_se_redujo: 'plástico', porcentaje: 25, comparado_con: 'producto_anterior' }),
    a('reduccion_origen', 'Plástico', { que_se_redujo: 'plástico', porcentaje: 25 }), 'campo_invalido', null],
  ['recargable',
    a('recargable', 'El envase', { mecanismo_recarga: 'Con repuesto a granel', donde_se_recarga: 'En nuestro local de Vicente López' }),
    a('recargable', 'El envase', { mecanismo_recarga: 'Con repuesto a granel' }), 'campo_invalido', null],
  ['huella_carbono',
    a('huella_carbono', 'Alcances 1 y 2', { tipo: 'medida', metodologia: 'GHG Protocol' }, { evidencia: true }),
    a('huella_carbono', 'Alcances 1 y 2', { tipo: 'compensada', metodologia: 'GHG Protocol', registro: 'Verra 1234', no_exigido_por_ley: true }, { evidencia: true }),
    'falta_verificador', null],
  ['bienestar_animal',
    a('bienestar_animal', 'Jabón', { tipo: 'sin_testeo', sin_testeo_alcance: 'producto_e_ingredientes' }),
    a('bienestar_animal', 'Jabón', { tipo: 'sin_testeo' }), 'campo_requerido', null],
  ['local_estacional',
    a('local_estacional', 'Mar del Plata', { origen: 'Mar del Plata', distancia_km: 400, de_estacion: true, meses: [3, 4, 5, 6, 7] }),
    a('local_estacional', 'Mar del Plata', { origen: 'Mar del Plata', de_estacion: true }), 'campo_requerido', null],
  ['comercio_justo',
    a('comercio_justo', 'Yerba', { tipo: 'cooperativa', organizacion: 'La Juanita', localidad: 'Oberá' }),
    a('comercio_justo', 'Yerba', { tipo: 'certificado' }), 'falta_certificacion', null],
  ['certificacion_tercero',
    a('certificacion_tercero', 'Sistema de gestión ambiental de la planta', {}, { cert_slug: 'iso14001', cert_numero: 'AR-123', cert_vence: '2027-03-31' }),
    a('certificacion_tercero', 'Sistema de gestión ambiental de la planta', {}, { cert_slug: 'iso14001', cert_numero: 'AR-123', cert_vence: '2025-03-31' }),
    'cert_vencida', null],
];

test('están las 16 afirmaciones, y ninguna más', () => {
  assert.equal(CLAIM_KINDS.length, 16);
  assert.deepEqual(Object.keys(CLAIMS).sort(), [...CLAIM_KINDS].sort());
  assert.equal(CASOS.length, 16);
  assert.deepEqual(CASOS.map((c) => c[0]).sort(), [...CLAIM_KINDS].sort());
});

for (const [kind, valida, rechazada, codigo, categoria] of CASOS) {
  test(`${kind} · el caso válido pasa`, () => {
    assert.deepEqual(codigos(valida, categoria), []);
  });
  test(`${kind} · el caso inválido se rechaza con "${codigo}"`, () => {
    assert.ok(codigos(rechazada, categoria).includes(codigo), `dio ${JSON.stringify(codigos(rechazada, categoria))}`);
  });
}

test('libre_de: sin sustituto no hay afirmación', () => {
  assert.ok(codigos(a('libre_de', 'Crema', { sustancia: 'parabenos', no_agregada_intencionalmente: true })).length > 0);
});

test('libre_de: sin la confirmación de "no agregada" no hay afirmación', () => {
  assert.ok(codigos(a('libre_de', 'Crema', { sustancia: 'parabenos', no_agregada_intencionalmente: false, sustituto: 'alcohol' })).includes('falta_no_agregada'));
});

test('libre_de: una sustancia que nunca se usa en la categoría se rechaza', () => {
  const sinGluten = a('libre_de', 'Detergente', { sustancia: 'gluten', no_agregada_intencionalmente: true, sustituto: 'nada' });
  assert.ok(codigos(sinGluten, 'limpieza-hogar').includes('sustancia_irrelevante'));
  const sinCfc = a('libre_de', 'Aerosol', { sustancia: 'CFC', no_agregada_intencionalmente: true, sustituto: 'propelente de aire' });
  assert.ok(codigos(sinCfc, 'cuidado-personal').includes('sustancia_irrelevante'), 'los CFC están prohibidos en todas partes');
});

test('un certificado FSC NO puede respaldar "libre de"', () => {
  const x = a('libre_de', 'Crema', { sustancia: 'parabenos', no_agregada_intencionalmente: true, sustituto: 'alcohol bencílico' },
    { cert_slug: 'fsc', cert_numero: '1', cert_vence: '2027-01-01' });
  assert.ok(codigos(x, 'cuidado-personal').includes('cert_no_habilita'));
  assert.equal(nivelAfirmacion(x, { aprobada: true, cert: REGISTRO[1]!, verificacionFuerte: true, hoy: HOY }), 'e1');
});

test('una certificadora desactivada del registro no respalda nada', () => {
  const x = a('organico', 'Harina', {}, { cert_slug: 'argencert', cert_numero: '1', cert_vence: '2027-01-01' });
  assert.ok(codigos(x).includes('cert_desconocida'));
});

test('certificacion_tercero sin certificación no existe', () => {
  assert.ok(codigos(a('certificacion_tercero', 'La planta', {})).includes('falta_certificacion'));
});

test('huella_carbono y no_toxico no tienen Nivel 1', () => {
  assert.deepEqual([...SIN_E1].sort(), ['certificacion_tercero', 'huella_carbono', 'no_toxico']);
  const x = a('huella_carbono', 'Alcances 1 y 2', { tipo: 'medida', metodologia: 'GHG' });
  assert.equal(nivelAfirmacion(x, { aprobada: true, cert: null, verificacionFuerte: true, hoy: HOY }), 'e0');
  assert.equal(nivelAfirmacion({ ...x, evidencia: true }, { aprobada: true, cert: null, verificacionFuerte: true, hoy: HOY }), 'e2');
});

test('la lista negra alcanza también a los calificadores', () => {
  const x = a('recargable', 'Crema que cura', { mecanismo_recarga: 'Con repuesto a granel', donde_se_recarga: 'En el local' });
  assert.ok(codigos(x).includes('texto_prohibido'));
});

// ── Textos públicos ─────────────────────────────────────────────────────────

test('orgánico sin certificación lo dice; con certificación, la nombra con número y vigencia', () => {
  const x = a('organico', 'harina de trigo', {});
  assert.match(CLAIMS.organico.textoPublico(x, 'e1'), /sin certificación orgánica/);
  const c = { ...x, cert: { nombre: 'Certificación orgánica OIA', emisor: 'OIA' }, cert_numero: '12345', cert_vence: '2027-03-31' };
  assert.equal(CLAIMS.organico.textoPublico(c, 'e3'),
    'Harina de trigo de producción orgánica · Certificado por Certificación orgánica OIA, Nº 12345, vigente hasta 03/2027');
});

test('certificacion_tercero muestra SIEMPRE el alcance', () => {
  const x = a('certificacion_tercero', 'Sistema de gestión ambiental', {}, {
    cert: { nombre: 'ISO 14001', emisor: 'IRAM' }, cert_numero: 'AR-1', cert_vence: '2027-01-31',
  });
  assert.equal(CLAIMS.certificacion_tercero.textoPublico(x, 'e3'),
    'ISO 14001 · IRAM · Nº AR-1 · vigente hasta 01/2027 · Alcance: Sistema de gestión ambiental');
});

test('los textos de la rúbrica', () => {
  assert.equal(CLAIMS.reciclable.textoPublico(a('reciclable', 'envase', { material: 'papel kraft', disponibilidad: 'recoleccion_diferenciada_amplia' }), 'e1'),
    'Envase de papel kraft, reciclable donde haya recolección diferenciada');
  assert.equal(CLAIMS.contenido_reciclado.textoPublico(a('contenido_reciclado', 'envase', { porcentaje: 80, post_consumo: true }), 'e1'),
    'Envase con 80% de contenido reciclado post-consumo');
  assert.equal(CLAIMS.energia_renovable.textoPublico(a('energia_renovable', 'x', { fuente: 'solar', porcentaje_procesos: 90 }), 'e1'),
    'Producido con energía solar (90% de los procesos)');
  assert.equal(CLAIMS.reduccion_origen.textoPublico(a('reduccion_origen', 'x', { que_se_redujo: 'Plástico', porcentaje: 25, comparado_con: 'producto_anterior' }), 'e1'),
    '25% menos plástico que nuestro producto anterior');
  assert.equal(CLAIMS.local_estacional.textoPublico(a('local_estacional', 'x', { origen: 'Mar del Plata', distancia_km: 400, de_estacion: true, meses: [3, 4, 5, 6, 7] }), 'e1'),
    'Producido en Mar del Plata, a 400 km · De estación: marzo a julio');
});

test('rango de meses', () => {
  assert.equal(rangoMeses([3, 4, 5]), 'marzo a mayo');
  assert.equal(rangoMeses([3, 5]), 'marzo y mayo');
  assert.equal(rangoMeses([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]), 'todo el año');
});

// ── Niveles ─────────────────────────────────────────────────────────────────

test('un certificado vencido baja la afirmación a E2 (con documento y dominio verificado)', () => {
  const x = a('organico', 'Harina', {}, { cert_slug: 'oia', cert_numero: 'N-1', cert_vence: '2026-09-18', evidencia: true });
  assert.equal(nivelAfirmacion(x, { aprobada: true, cert: REGISTRO[0]!, verificacionFuerte: true, hoy: HOY }), 'e2');
  assert.equal(nivelAfirmacion({ ...x, cert_vence: '2027-09-18' }, { aprobada: true, cert: REGISTRO[0]!, verificacionFuerte: true, hoy: HOY }), 'e3');
});

test('si la IA dice E3 y no hay número de certificado, es E2: la base gana siempre', () => {
  const x = a('organico', 'Harina', {}, { cert_slug: 'oia', cert_numero: null, cert_vence: '2027-01-01', evidencia: true });
  assert.equal(nivelAfirmacion(x, { aprobada: true, cert: REGISTRO[0]!, verificacionFuerte: true, hoy: HOY }), 'e2');
});

test('E2 exige identidad fuerte; sin aprobación no hay nivel', () => {
  const x = a('reciclable', 'Envase', { material: 'papel', disponibilidad: 'cooperativa_local' }, { evidencia: true });
  assert.equal(nivelAfirmacion(x, { aprobada: true, cert: null, verificacionFuerte: false, hoy: HOY }), 'e1');
  assert.equal(nivelAfirmacion(x, { aprobada: true, cert: null, verificacionFuerte: true, hoy: HOY }), 'e2');
  assert.equal(nivelAfirmacion(x, { aprobada: false, cert: null, verificacionFuerte: true, hoy: HOY }), 'e0');
});

test('reducción en origen y recargable se quedan en E2', () => {
  assert.deepEqual([...SIN_E3].sort(), ['recargable', 'reduccion_origen']);
  assert.deepEqual([...SIN_E2], ['certificacion_tercero']);
});

// ── Paridad con la base ─────────────────────────────────────────────────────

const SQL = readFileSync(join(process.cwd(), 'supabase/migrations/0107_mercado.sql'), 'utf8');

function arrayDeFuncion(nombre: string): string[] {
  const i = SQL.indexOf(`function ${nombre}(`);
  const cuerpo = SQL.slice(i, SQL.indexOf('$fn$;', i));
  return [...cuerpo.matchAll(/'([^']+)'/g)].map((m) => m[1]!);
}

test('las categorías y las sensibles son las mismas que en la base', () => {
  assert.deepEqual(arrayDeFuncion('brote_mercado_categorias'), [...CATEGORIAS]);
  assert.deepEqual(arrayDeFuncion('brote_mercado_sensibles'), [...CATEGORIAS_SENSIBLES]);
});

test('la lista negra es la misma que en la base', () => {
  const sql = arrayDeFuncion('brote_texto_prohibido').filter((t) => !t.includes('%') || t.includes(' '));
  for (const termino of [...LISTA_NEGRA.absolutos, ...LISTA_NEGRA.salud]) {
    assert.ok(SQL.includes(`'${termino}'`), `"${termino}" no está en brote_texto_prohibido`);
  }
  assert.ok(sql.length > 0);
});

test('los conjuntos SIN_E* son los mismos que usa brote_claim_nivel', () => {
  const i = SQL.indexOf('function brote_claim_nivel(');
  const cuerpo = SQL.slice(i, SQL.indexOf('$fn$;', i));
  assert.ok(cuerpo.includes(`c.kind not in (${SIN_E3.map((k) => `'${k}'`).join(',')})`));
  assert.ok(cuerpo.includes(`c.kind not in (${SIN_E1.map((k) => `'${k}'`).join(',')})`));
  assert.ok(cuerpo.includes(`c.kind <> '${SIN_E2[0]}'`));
});

test('la lista negra: palabra entera, sin acentos, y "se trata de" no es "trata"', () => {
  assert.equal(buscarProhibido('Este jabón CURA el acné'), 'cura');
  assert.equal(buscarProhibido('Jamón curado artesanal'), null);
  assert.equal(buscarProhibido('Se trata de un jabón de glicerina'), null);
  assert.equal(buscarProhibido('Producto 100% ecológico'), '100% ecologico');
  assert.equal(buscarProhibido('Una opción eco-friendly'), 'eco friendly');
});
