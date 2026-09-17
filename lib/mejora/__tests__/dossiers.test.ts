import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { DOSSIER_VACIO } from '../dossier';
import { objetivosPorReglas } from '../generador';
import { palanca } from '../palancas';
import { MAX_ESFUERZO_OBJETIVO, solapaConYaHecho, validarObjetivo } from '../realismo';
import type { ContextoValidacion, Dossier, NegocioParaMejora, ObjetivoPropuesto } from '../tipos';

/**
 * El set de evaluación de la fase 2 §10.1: diez dossiers ficticios escritos a
 * mano, cinco de ellos incompletos a propósito.
 *
 * El documento lo pide para medir la calidad de los PROMPTS. Acá se corre sobre
 * el camino determinista, que es el que existe hoy —el proyecto todavía no
 * tiene `GEMINI_API_KEY`— y que además es el piso de calidad del otro: lo que
 * devuelve Gemini pasa por el mismo `validarObjetivo` antes de guardarse, así
 * que un objetivo que no pasaría acá tampoco llega a una empresa por esa vía.
 *
 * Los criterios son los de §10.1, sin aflojarlos:
 *   ≥80% pasan el validador sin arreglos  → acá da 100%
 *   0 objetivos con número inventado
 *   0 objetivos que repitan algo de "ya hecho"
 */

const CASOS: { nombre: string; negocio: NegocioParaMejora; dossier: Dossier; incompleto: boolean }[] = [];

function negocio(over: Partial<NegocioParaMejora> & { rubro: string }): NegocioParaMejora {
  return {
    id: '00000000-0000-0000-0000-00000000000f',
    nombre_comercial: 'Negocio',
    tamano: '2-10',
    ciudad: 'CABA',
    provincia: 'Buenos Aires',
    descripcion: null,
    ...over,
  };
}

function dossier(over: Partial<Dossier>): Dossier {
  return {
    ...DOSSIER_VACIO,
    ...over,
    operacion: { ...DOSSIER_VACIO.operacion, ...(over.operacion ?? {}) },
    energia: { ...DOSSIER_VACIO.energia, ...(over.energia ?? {}) },
    residuos: { ...DOSSIER_VACIO.residuos, ...(over.residuos ?? {}) },
    agua: { ...DOSSIER_VACIO.agua, ...(over.agua ?? {}) },
    insumos: { ...DOSSIER_VACIO.insumos, ...(over.insumos ?? {}) },
    logistica: { ...DOSSIER_VACIO.logistica, ...(over.logistica ?? {}) },
    restricciones: { ...DOSSIER_VACIO.restricciones, ...(over.restricciones ?? {}) },
  };
}

// ── Los cinco completos ─────────────────────────────────────────────────────

CASOS.push({
  nombre: 'panadería de barrio con facturas a mano',
  incompleto: false,
  negocio: negocio({ rubro: 'gastronomia', nombre_comercial: 'Panadería del Sur', descripcion: 'Masa madre y facturas.' }),
  dossier: dossier({
    operacion: { que_produce: 'pan de masa madre, facturas y sándwiches', volumen: '200 kg de harina por semana', estacionalidad: 'baja en enero' },
    energia: { suministro: 'electrico_gas', tiene_factura: true, consumo_mensual: 1240, equipos: 'horno rotativo, dos heladeras' },
    residuos: { que_tiran: 'bolsas de harina, cartón, restos de cocina', bolsas_semana: 6, separa: false, retiro_reciclables: false },
    agua: { es_relevante: true, medicion: 'canilla_libre', consumo_mensual: null },
    insumos: { principales: 'harina, levadura, manteca', proveedores_clave: 3, puede_cambiar_proveedores: true },
    logistica: { como_llega: 'retiran en el local', flota: 'retiran', viajes_mes: null },
    ya_hecho: 'Cambiamos las luces a LED en 2024.',
    restricciones: { presupuesto: 'hasta_x', presupuesto_monto: 300000, horas_mes_disponibles: 6, local: 'alquilado' },
  }),
});

CASOS.push({
  nombre: 'almacén a granel sin presupuesto',
  incompleto: false,
  negocio: negocio({ rubro: 'comercio-minorista', nombre_comercial: 'El Granel', tamano: '1' }),
  dossier: dossier({
    operacion: { que_produce: 'venta de secos a granel', volumen: '1,2 toneladas por mes', estacionalidad: 'estable' },
    energia: { suministro: 'electrico', tiene_factura: true, consumo_mensual: 380, equipos: 'heladera exhibidora' },
    residuos: { que_tiran: 'bolsones de polipropileno, cartón', bolsas_semana: 2, separa: true, retiro_reciclables: true },
    agua: { es_relevante: false, medicion: null, consumo_mensual: null },
    insumos: { principales: 'legumbres, frutos secos, harinas', proveedores_clave: 6, puede_cambiar_proveedores: true },
    logistica: { como_llega: 'reparto propio dos veces por semana', flota: 'propia', viajes_mes: 8 },
    ya_hecho: 'Ya vendemos todo a granel y aceptamos envases del cliente.',
    // Sin un peso para invertir: nada de lo que se proponga puede costar plata.
    restricciones: { presupuesto: 'ninguno', presupuesto_monto: null, horas_mes_disponibles: 4, local: 'alquilado' },
  }),
});

CASOS.push({
  nombre: 'taller textil con tintorería',
  incompleto: false,
  negocio: negocio({ rubro: 'indumentaria-textil', nombre_comercial: 'Taller Norte', tamano: '11-50' }),
  dossier: dossier({
    operacion: { que_produce: 'remeras y buzos de algodón', volumen: '3000 prendas por mes', estacionalidad: 'pico en otoño' },
    energia: { suministro: 'electrico', tiene_factura: true, consumo_mensual: 4200, equipos: 'rectas, overlock, plancha industrial' },
    residuos: { que_tiran: 'retazos de tela, conos de hilo', bolsas_semana: 12, separa: false, retiro_reciclables: false },
    agua: { es_relevante: true, medicion: 'medidor', consumo_mensual: 18000 },
    insumos: { principales: 'algodón, hilo, tintas', proveedores_clave: 4, puede_cambiar_proveedores: true },
    logistica: { como_llega: 'despacho por correo y flete', flota: 'tercerizada', viajes_mes: 20 },
    ya_hecho: '',
    restricciones: { presupuesto: 'caso_por_caso', presupuesto_monto: null, horas_mes_disponibles: 6, local: 'propio' },
  }),
});

CASOS.push({
  nombre: 'peluquería chica',
  incompleto: false,
  negocio: negocio({ rubro: 'belleza-cuidado-personal', nombre_comercial: 'Estudio Marta', tamano: '2-10' }),
  dossier: dossier({
    operacion: { que_produce: 'cortes, color y tratamientos', volumen: '180 servicios por mes', estacionalidad: 'pico en diciembre' },
    energia: { suministro: 'electrico', tiene_factura: true, consumo_mensual: 620, equipos: 'secadores, planchitas, vapor' },
    residuos: { que_tiran: 'pelo, papel aluminio, envases de color', bolsas_semana: 3, separa: false, retiro_reciclables: false },
    agua: { es_relevante: true, medicion: 'canilla_libre', consumo_mensual: null },
    insumos: { principales: 'tintura, shampoo, toallas', proveedores_clave: 2, puede_cambiar_proveedores: false },
    logistica: { como_llega: 'los clientes vienen al local', flota: 'no_aplica', viajes_mes: null },
    ya_hecho: 'Pusimos cabezales de ducha de bajo caudal el año pasado.',
    restricciones: { presupuesto: 'hasta_x', presupuesto_monto: 120000, horas_mes_disponibles: 3, local: 'alquilado' },
  }),
});

CASOS.push({
  nombre: 'estudio de servicios profesionales',
  incompleto: false,
  negocio: negocio({ rubro: 'servicios-profesionales', nombre_comercial: 'Estudio Ramos', tamano: '11-50' }),
  dossier: dossier({
    operacion: { que_produce: 'asesoría contable e impositiva', volumen: '90 clientes activos', estacionalidad: 'pico en mayo' },
    energia: { suministro: 'electrico', tiene_factura: true, consumo_mensual: 900, equipos: 'servidores chicos, aire acondicionado' },
    residuos: { que_tiran: 'papel, tóner', bolsas_semana: 2, separa: true, retiro_reciclables: false },
    agua: { es_relevante: false, medicion: null, consumo_mensual: null },
    insumos: { principales: 'papel, insumos de impresión', proveedores_clave: 2, puede_cambiar_proveedores: true },
    logistica: { como_llega: 'todo digital', flota: 'no_aplica', viajes_mes: null },
    ya_hecho: '',
    restricciones: { presupuesto: 'caso_por_caso', presupuesto_monto: null, horas_mes_disponibles: 5, local: 'alquilado' },
  }),
});

// ── Los cinco incompletos a propósito ───────────────────────────────────────

CASOS.push({
  nombre: 'todo "No sé"',
  incompleto: true,
  negocio: negocio({ rubro: 'gastronomia', nombre_comercial: 'Bar sin datos' }),
  dossier: dossier({
    operacion: { que_produce: 'comida y bebida', volumen: '', estacionalidad: '' },
    energia: { suministro: 'no_se', tiene_factura: null, consumo_mensual: 'no_se', equipos: '' },
    residuos: { que_tiran: '', bolsas_semana: 'no_se', separa: null, retiro_reciclables: null },
    agua: { es_relevante: null, medicion: 'no_se', consumo_mensual: 'no_se' },
    insumos: { principales: '', proveedores_clave: 'no_se', puede_cambiar_proveedores: null },
    logistica: { como_llega: '', flota: 'no_se', viajes_mes: 'no_se' },
    ya_hecho: '',
    restricciones: { presupuesto: 'caso_por_caso', presupuesto_monto: null, horas_mes_disponibles: 6, local: null },
  }),
});

CASOS.push({
  nombre: 'solo el bloque de operación',
  incompleto: true,
  negocio: negocio({ rubro: 'produccion-alimentos', nombre_comercial: 'Conservas Luna' }),
  dossier: dossier({
    operacion: { que_produce: 'dulces y conservas en frascos', volumen: '4000 frascos por mes', estacionalidad: 'pico en verano' },
  }),
});

CASOS.push({
  nombre: 'sin energía ni agua, con residuos a medias',
  incompleto: true,
  negocio: negocio({ rubro: 'limpieza-higiene', nombre_comercial: 'Limpieza Sur', tamano: '11-50' }),
  dossier: dossier({
    operacion: { que_produce: 'servicio de limpieza de oficinas', volumen: '25 edificios', estacionalidad: 'estable' },
    residuos: { que_tiran: 'bidones de producto', bolsas_semana: 'no_se', separa: null, retiro_reciclables: null },
    insumos: { principales: 'detergentes, lavandina, trapos', proveedores_clave: null, puede_cambiar_proveedores: true },
    restricciones: { presupuesto: 'ninguno', presupuesto_monto: null, horas_mes_disponibles: 2, local: 'no_aplica' },
  }),
});

CASOS.push({
  nombre: 'una hora por mes y nada más',
  incompleto: true,
  negocio: negocio({ rubro: 'reparacion-reuso', nombre_comercial: 'Arreglos Pepe', tamano: '1' }),
  dossier: dossier({
    operacion: { que_produce: 'reparación de electrodomésticos', volumen: '', estacionalidad: '' },
    restricciones: { presupuesto: 'ninguno', presupuesto_monto: null, horas_mes_disponibles: 1, local: 'alquilado' },
  }),
});

CASOS.push({
  nombre: 'mucho ya hecho y casi ningún dato',
  incompleto: true,
  negocio: negocio({ rubro: 'hoteleria-turismo', nombre_comercial: 'Hostel Verde', tamano: '11-50' }),
  dossier: dossier({
    operacion: { que_produce: 'hostel de 40 camas', volumen: '600 noches por mes', estacionalidad: 'pico en enero' },
    energia: { suministro: 'electrico_gas', tiene_factura: null, consumo_mensual: 'no_se', equipos: 'termotanques, lavarropas' },
    residuos: { que_tiran: 'residuo mixto de habitaciones', bolsas_semana: 'no_se', separa: true, retiro_reciclables: true },
    ya_hecho:
      'Separamos reciclables desde 2023, cambiamos todas las luces a LED, pusimos cabezales de ducha de bajo caudal y dejamos de comprar amenities en sachet.',
    restricciones: { presupuesto: 'caso_por_caso', presupuesto_monto: null, horas_mes_disponibles: 6, local: 'propio' },
  }),
});

// ── La corrida ──────────────────────────────────────────────────────────────

/** Todos los números que el dossier declaró. Nada fuera de acá puede aparecer como línea de base. */
function numerosDeclarados(d: Dossier): number[] {
  const crudos = [
    d.energia.consumo_mensual,
    d.residuos.bolsas_semana,
    d.agua.consumo_mensual,
    d.insumos.proveedores_clave,
    d.logistica.viajes_mes,
  ];
  return crudos.filter((v): v is number => typeof v === 'number');
}

function generar(caso: (typeof CASOS)[number]): ObjetivoPropuesto[] {
  return objetivosPorReglas(caso.dossier, caso.negocio, { cantidad: 3 });
}

test('el set de evaluación: los diez dossiers generan objetivos', () => {
  for (const caso of CASOS) {
    const objetivos = generar(caso);
    assert.ok(objetivos.length > 0, `${caso.nombre}: no generó ningún objetivo`);
    assert.ok(objetivos.length <= 3, `${caso.nombre}: generó de más`);
  }
});

test('el set de evaluación: el 100% pasa el validador sin arreglos (§10.1 pide 80%)', () => {
  let total = 0;
  let validos = 0;
  for (const caso of CASOS) {
    const ctx: ContextoValidacion = { dossier: caso.dossier, activos: [] };
    for (const g of generar(caso)) {
      total += 1;
      const r = validarObjetivo(g, ctx, { claves: palanca(g.palanca_slug)?.claves });
      if (r.valido) validos += 1;
      else assert.fail(`${caso.nombre} · "${g.titulo}": ${r.fallos.join(', ')}`);
    }
  }
  assert.ok(total >= 20, `se esperaban al menos 20 objetivos en total, hubo ${total}`);
  assert.equal(validos, total);
});

test('el set de evaluación: cero números inventados', () => {
  for (const caso of CASOS) {
    const declarados = numerosDeclarados(caso.dossier);
    for (const g of generar(caso)) {
      if (g.metrica_tipo === 'medicion') {
        assert.equal(g.linea_base, null, `${caso.nombre} · "${g.titulo}": medición con línea de base`);
        assert.equal(g.origen_base, 'a_medir');
        continue;
      }
      if (g.metrica_tipo === 'sustitucion') {
        // Arranca en cero y la meta es la porción que se mueve: no hay nada que inventar.
        assert.equal(g.linea_base, 0);
        continue;
      }
      assert.ok(g.linea_base != null, `${caso.nombre} · "${g.titulo}": reducción sin línea de base`);
      assert.ok(
        declarados.includes(g.linea_base as number),
        `${caso.nombre} · "${g.titulo}": línea de base ${g.linea_base} no salió del dossier`,
      );
    }
  }
});

test('el set de evaluación: cero objetivos que repitan algo de "ya hecho"', () => {
  for (const caso of CASOS) {
    for (const g of generar(caso)) {
      const claves = palanca(g.palanca_slug)?.claves ?? [];
      assert.equal(
        solapaConYaHecho(g, caso.dossier.ya_hecho, claves),
        false,
        `${caso.nombre} · "${g.titulo}": ya lo hacían`,
      );
    }
  }
});

test('el set de evaluación: nadie pide más horas ni más plata de las declaradas', () => {
  for (const caso of CASOS) {
    for (const g of generar(caso)) {
      assert.ok(g.esfuerzo_horas_mes <= MAX_ESFUERZO_OBJETIVO, `${caso.nombre} · "${g.titulo}": pasa las 6 h/mes`);
      assert.ok(
        g.esfuerzo_horas_mes <= caso.dossier.restricciones.horas_mes_disponibles,
        `${caso.nombre} · "${g.titulo}": pide más horas de las que tienen`,
      );
      if (caso.dossier.restricciones.presupuesto === 'ninguno') {
        assert.equal(g.inversion, 'ninguna', `${caso.nombre} · "${g.titulo}": pide invertir sin presupuesto`);
      }
    }
  }
});

test('el set de evaluación: un dossier sin números propone medir, no reducir', () => {
  const todoNoSe = CASOS.find((c) => c.nombre === 'todo "No sé"')!;
  const objetivos = generar(todoNoSe);
  assert.ok(objetivos.length > 0);
  assert.ok(
    objetivos.every((g) => g.metrica_tipo !== 'reduccion' || g.linea_base != null),
    'con "No sé" en todo no puede salir una reducción con número',
  );
  assert.ok(
    objetivos.some((g) => g.metrica_tipo === 'medicion'),
    'con "No sé" en todo tiene que aparecer al menos un objetivo de medición',
  );
});

test('el set de evaluación: los cinco incompletos siguen dando algo que hacer', () => {
  for (const caso of CASOS.filter((c) => c.incompleto)) {
    const objetivos = generar(caso);
    assert.ok(objetivos.length > 0, `${caso.nombre}: un dossier incompleto no puede dejar a nadie sin programa`);
  }
});
