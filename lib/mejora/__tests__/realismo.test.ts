import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { PALANCAS, palancasPara } from '../palancas';
import { completarConPalancas, objetivosPorReglas, puntuarPalanca, rellenarPlantilla } from '../generador';
import { progresoDeCiclos } from '../progreso';
import { replanificarPorReglas } from '../replanificar';
import {
  BANDAS,
  MAX_ESFUERZO_OBJETIVO,
  MAX_ESFUERZO_TOTAL,
  asignarAmbicion,
  solapaConYaHecho,
  validarObjetivo,
} from '../realismo';
import type { ContextoValidacion, Dossier, NegocioParaMejora, ObjetivoPropuesto } from '../tipos';

/**
 * Los tests del validador de realismo (fase 2 §3.2).
 *
 * Es el único módulo del proyecto donde un test unitario es obligatorio: es lo
 * que impide que un objetivo malo llegue a un cliente que paga. Cubre las diez
 * reglas de `05_ALGORITMOS.md` §5.2, los casos de su tabla de §7 y los
 * criterios de aceptación de la fase 2 §10.
 */

const NEGOCIO: NegocioParaMejora = {
  id: '00000000-0000-0000-0000-000000000001',
  nombre_comercial: 'Panadería del Sur',
  rubro: 'gastronomia',
  tamano: '2-10',
  ciudad: 'Vicente López',
  provincia: 'Buenos Aires',
  descripcion: 'Panadería de barrio, masa madre.',
};

function dossier(over: Partial<Dossier> = {}): Dossier {
  return {
    operacion: { que_produce: 'pan de masa madre y facturas', volumen: '200 kg por semana', estacionalidad: 'estable' },
    energia: { suministro: 'electrico_gas', tiene_factura: true, consumo_mensual: 1240, equipos: 'horno, heladeras' },
    residuos: { que_tiran: 'cartón y bolsas de harina', bolsas_semana: 6, separa: false, retiro_reciclables: null },
    agua: { es_relevante: false, medicion: 'canilla_libre', consumo_mensual: null },
    insumos: { principales: 'harina', proveedores_clave: 3, puede_cambiar_proveedores: true },
    logistica: { como_llega: 'retiran en el local', flota: 'no_aplica', viajes_mes: null },
    ya_hecho: '',
    restricciones: { presupuesto: 'caso_por_caso', presupuesto_monto: null, horas_mes_disponibles: 6, local: 'alquilado' },
    completitud: 100,
    ...over,
  };
}

function ctx(d: Dossier = dossier(), activos: { esfuerzo_horas_mes: number }[] = []): ContextoValidacion {
  return { dossier: d, activos };
}

function objetivo(over: Partial<ObjetivoPropuesto> = {}): ObjetivoPropuesto {
  return {
    titulo: 'Bajar 2% el consumo eléctrico del salón',
    porque: 'La iluminación y las heladeras son el grueso del consumo del local.',
    dominio: 'energia',
    palanca_slug: null,
    metrica: 'consumo eléctrico',
    unidad: 'kWh/mes',
    linea_base: 1240,
    objetivo: 1215,
    origen_base: 'factura',
    horizonte: 'trimestral',
    ambicion: 'basico',
    esfuerzo_horas_mes: 2,
    inversion: 'ninguna',
    es_evento_unico: false,
    metrica_tipo: 'reduccion',
    metodo_tipo: 'factura',
    alcance: 2,
    como_medir: 'Comparar la factura de marzo con la de diciembre',
    pasos: ['Juntar las facturas', 'Anotar los kWh', 'Comparar el bimestre'],
    evidencia_requerida: 'Foto de las dos facturas',
    si_no_llegas: 'Cerralo con lo logrado: cuenta como avance parcial.',
    confianza: 'alta',
    supuestos: [],
    ...over,
  };
}

// ── Las diez reglas ─────────────────────────────────────────────────────────

test('R0 · un objetivo bien armado pasa', () => {
  assert.deepEqual(validarObjetivo(objetivo(), ctx()).fallos, []);
});

test('R1 · esfuerzo mayor a 6 h/mes se rechaza', () => {
  const r = validarObjetivo(objetivo({ esfuerzo_horas_mes: 20 }), ctx());
  assert.ok(r.fallos.includes('esfuerzo_excede_6h'));
  assert.equal(r.valido, false);
});

test('R1 · la suma de los activos no puede pasar de 12 h/mes al aceptar', () => {
  const activos = [{ esfuerzo_horas_mes: 5 }, { esfuerzo_horas_mes: 5 }];
  const g = objetivo({ esfuerzo_horas_mes: 4 });
  assert.ok(
    validarObjetivo(g, ctx(dossier(), activos), { momento: 'aceptacion' }).fallos.includes('carga_total_excede_12h'),
  );
  // Como propuesta se puede mostrar: lo que no se puede es aceptarla.
  assert.equal(validarObjetivo(g, ctx(dossier(), activos)).valido, true);
});

test('R2 · con 3 activos no se acepta un cuarto', () => {
  const activos = [{ esfuerzo_horas_mes: 1 }, { esfuerzo_horas_mes: 1 }, { esfuerzo_horas_mes: 1 }];
  const r = validarObjetivo(objetivo(), ctx(dossier(), activos), { momento: 'aceptacion' });
  assert.ok(r.fallos.includes('demasiados_activos'));
});

test('R3 · "reducir 40% en un trimestre" se rechaza por irreal', () => {
  const r = validarObjetivo(objetivo({ objetivo: 744 }), ctx()); // 1240 → 744 = 40%
  assert.ok(r.fallos.includes('ambicion_irreal'));
});

test('R3 · un evento único sí puede pasarse del techo de la banda', () => {
  const r = validarObjetivo(objetivo({ objetivo: 744, es_evento_unico: true }), ctx());
  assert.equal(r.valido, true);
});

test('R3 · una ambición insignificante también se rechaza', () => {
  const r = validarObjetivo(objetivo({ objetivo: 1239 }), ctx()); // 0,08%
  assert.ok(r.fallos.includes('ambicion_insignificante'));
});

test('R3 · sustitución en porcentaje mide puntos, no cambio relativo', () => {
  const g = objetivo({
    metrica_tipo: 'sustitucion',
    unidad: '% de compras',
    linea_base: 0,
    objetivo: 15,
    metodo_tipo: 'remito',
    alcance: 1,
    origen_base: 'estimado',
  });
  assert.equal(validarObjetivo(g, ctx()).valido, true);
  // 40 puntos se pasa de la banda de sustitución (10-25).
  assert.ok(validarObjetivo({ ...g, objetivo: 40 }, ctx()).fallos.includes('ambicion_irreal'));
});

test('R4 · sin línea de base no se puede proponer una reducción', () => {
  const r = validarObjetivo(objetivo({ origen_base: 'a_medir', linea_base: null, objetivo: null }), ctx());
  assert.ok(r.fallos.includes('reduccion_sin_base'));
});

test('R4 · el mismo caso como objetivo de medición es válido', () => {
  const r = validarObjetivo(
    objetivo({ origen_base: 'a_medir', linea_base: null, objetivo: null, metrica_tipo: 'medicion' }),
    ctx(),
  );
  assert.equal(r.valido, true);
});

test('R5 · con presupuesto "ninguno" no pasa nada que exija inversión', () => {
  const d = dossier({
    restricciones: { presupuesto: 'ninguno', presupuesto_monto: null, horas_mes_disponibles: 6, local: 'alquilado' },
  });
  const r = validarObjetivo(objetivo({ inversion: 'baja' }), ctx(d));
  assert.ok(r.fallos.includes('requiere_inversion_no_declarada'));
});

test('R6 · nada que dependa de terceros que el negocio no elige', () => {
  const r = validarObjetivo(objetivo({ titulo: 'Lograr que la gente recicle en el barrio' }), ctx());
  assert.ok(r.fallos.includes('fuera_de_control'));
});

test('R7 · no se propone algo que ya está en "ya hecho"', () => {
  const d = dossier({ ya_hecho: 'El año pasado cambiamos todas las luces del local a LED.' });
  const r = validarObjetivo(objetivo({ titulo: 'Cambiar la iluminación de el local a LED' }), ctx(d), {
    claves: ['led', 'cambiamos las luces'],
  });
  assert.ok(r.fallos.includes('ya_realizado'));
});

test('R7 · "ya hecho" vacío no bloquea nada', () => {
  assert.equal(solapaConYaHecho({ titulo: 'Separar cartón y vidrio', metrica: 'residuo mixto' }, ''), false);
});

test('R8 · el método de medición tiene que ser uno que ya tengan', () => {
  const r = validarObjetivo(
    objetivo({ metodo_tipo: 'sensor_iot' as unknown as ObjetivoPropuesto['metodo_tipo'] }),
    ctx(),
  );
  assert.ok(r.fallos.includes('medicion_no_disponible'));
});

test('R9 · alcance 3 se mide, no se pone como meta de reducción', () => {
  const r = validarObjetivo(objetivo({ alcance: 3 }), ctx());
  assert.ok(r.fallos.includes('alcance3_como_meta'));
});

test('R10 · faltan campos obligatorios', () => {
  const r = validarObjetivo(objetivo({ como_medir: '', evidencia_requerida: '' }), ctx());
  assert.ok(r.fallos.includes('falta_como_medir'));
  assert.ok(r.fallos.includes('falta_evidencia_requerida'));
});

test('R10 · menos de 3 pasos no es un objetivo ejecutable', () => {
  assert.ok(validarObjetivo(objetivo({ pasos: ['uno'] }), ctx()).fallos.includes('falta_pasos'));
});

// ── Ambición ────────────────────────────────────────────────────────────────

test('un avanzado con confianza baja se degrada y baja la meta al centro de la banda', () => {
  const g = objetivo({ ambicion: 'avanzado', confianza: 'baja', inversion: 'media', objetivo: 1140 });
  const r = asignarAmbicion(g);
  assert.equal(r.ambicion, 'intermedio');
  const [min, max] = BANDAS.trimestral;
  const delta = (1240 - (r.objetivo ?? 0)) / 1240;
  assert.ok(delta > min && delta < max);
});

test('sin línea de base la ambición es básica', () => {
  const r = asignarAmbicion(objetivo({ origen_base: 'a_medir', linea_base: null, objetivo: null }));
  assert.equal(r.ambicion, 'basico');
});

// ── El catálogo ─────────────────────────────────────────────────────────────

test('el catálogo cumple sus propias reglas', () => {
  const slugs = new Set<string>();
  for (const p of PALANCAS) {
    assert.ok(!slugs.has(p.slug), `slug repetido: ${p.slug}`);
    slugs.add(p.slug);
    assert.ok(p.esfuerzo_horas_mes <= MAX_ESFUERZO_OBJETIVO, `${p.slug} pide más de 6 h/mes`);
    assert.ok(p.pasos.length >= 3, `${p.slug} tiene menos de 3 pasos`);
    assert.ok(p.porque.length > 60, `${p.slug} no explica el porqué`);
    assert.ok(!/!/.test(p.porque), `${p.slug} usa signos de exclamación`);
    assert.ok(p.si_no_llegas.length > 20, `${p.slug} no dice qué pasa si no llega`);
    assert.ok(p.efecto_min <= p.efecto_max, `${p.slug} tiene un rango invertido`);
  }
  for (const p of PALANCAS) {
    if (p.escalon_siguiente) assert.ok(slugs.has(p.escalon_siguiente), `${p.slug} apunta a un escalón inexistente`);
  }
});

test('cada rubro tiene al menos 4 palancas propias y 6 transversales', () => {
  const rubros = [
    'gastronomia',
    'comercio-minorista',
    'produccion-alimentos',
    'indumentaria-textil',
    'belleza-cuidado-personal',
    'servicios-profesionales',
    'logistica-transporte',
    'hoteleria-turismo',
    'agro-vivero-huerta',
    'limpieza-higiene',
    'hogar-construccion',
    'reparacion-reuso',
  ];
  assert.ok(PALANCAS.filter((p) => p.rubros.includes('*')).length >= 6);
  for (const r of rubros) {
    const propias = PALANCAS.filter((p) => p.rubros.includes(r)).length;
    assert.ok(propias >= 4, `${r} tiene solo ${propias} palancas propias`);
    assert.ok(palancasPara(r).length >= 10, `${r} ve pocas palancas en total`);
  }
});

test('toda palanca puntuable produce un objetivo que valida', () => {
  const d = dossier();
  for (const p of PALANCAS) {
    if (puntuarPalanca(p, d) <= -900) continue;
    const g = rellenarPlantilla(p, d, NEGOCIO);
    if (!g) continue; // reducción sin línea de base: no se propone
    const r = validarObjetivo(g, ctx(d), { claves: p.claves });
    assert.equal(r.valido, true, `${p.slug}: ${r.fallos.join(', ')}`);
  }
});

// ── Generación por reglas ───────────────────────────────────────────────────

test('un dossier completo genera 3 objetivos válidos sin IA', () => {
  const d = dossier();
  const objetivos = objetivosPorReglas(d, NEGOCIO);
  assert.equal(objetivos.length, 3);
  for (const g of objetivos) assert.equal(validarObjetivo(g, ctx(d)).valido, true);
  assert.ok(objetivos.some((g) => g.ambicion === 'basico'));
  assert.ok(new Set(objetivos.map((g) => g.palanca_slug)).size === 3);
});

test('un dossier con "no sé" en todo genera objetivos de medición, ambición básica', () => {
  const d = dossier({
    energia: { suministro: 'no_se', tiene_factura: null, consumo_mensual: 'no_se', equipos: '' },
    residuos: { que_tiran: '', bolsas_semana: 'no_se', separa: null, retiro_reciclables: null },
    agua: { es_relevante: null, medicion: 'no_se', consumo_mensual: 'no_se' },
    insumos: { principales: '', proveedores_clave: 'no_se', puede_cambiar_proveedores: null },
    logistica: { como_llega: '', flota: 'no_se', viajes_mes: 'no_se' },
  });
  const objetivos = objetivosPorReglas(d, NEGOCIO);
  assert.ok(objetivos.length >= 1);
  assert.ok(objetivos.some((g) => g.metrica_tipo === 'medicion' && g.ambicion === 'basico'));
  // Ninguna reducción puede colarse sin línea de base.
  for (const g of objetivos) {
    assert.ok(!(g.metrica_tipo === 'reduccion' && g.origen_base === 'a_medir'));
    assert.equal(validarObjetivo(g, ctx(d)).valido, true);
  }
});

test('con presupuesto "ninguno" ningún objetivo exige inversión', () => {
  const d = dossier({
    restricciones: { presupuesto: 'ninguno', presupuesto_monto: null, horas_mes_disponibles: 6, local: 'alquilado' },
  });
  const objetivos = objetivosPorReglas(d, NEGOCIO);
  assert.ok(objetivos.length >= 1);
  for (const g of objetivos) assert.equal(g.inversion, 'ninguna');
});

test('lo que ya hicieron no se propone', () => {
  const d = dossier({ ya_hecho: 'Ya separamos cartón y vidrio con una cooperativa del barrio desde 2024.' });
  const objetivos = objetivosPorReglas(d, NEGOCIO);
  assert.ok(!objetivos.some((g) => g.palanca_slug === 'separacion-residuos'));
});

test('ningún objetivo generado supera las 6 h/mes y la tanda entra en 12', () => {
  for (const rubro of ['gastronomia', 'servicios-profesionales', 'logistica-transporte', 'agro-vivero-huerta']) {
    const objetivos = objetivosPorReglas(dossier(), { ...NEGOCIO, rubro });
    const total = objetivos.reduce((a, g) => a + g.esfuerzo_horas_mes, 0);
    for (const g of objetivos) assert.ok(g.esfuerzo_horas_mes <= MAX_ESFUERZO_OBJETIVO);
    assert.ok(total <= MAX_ESFUERZO_TOTAL, `${rubro} propone ${total} h/mes`);
  }
});

test('una tanda corta se completa con palancas hasta 3', () => {
  const d = dossier();
  const completada = completarConPalancas([objetivo()], d, NEGOCIO, 3);
  assert.equal(completada.length, 3);
});

// ── Replanificación ─────────────────────────────────────────────────────────

test('"no llego" con un valor en banda ajusta la meta y deja el plazo', () => {
  const r = replanificarPorReglas({
    objetivo: objetivo({ objetivo: 1140 }),
    checkin: { tipo: 'no_llego', mensaje: 'No llego a 1140, con suerte 1180', valor_reportado: 1180 },
    dossier: dossier(),
    negocio: NEGOCIO,
  });
  assert.equal(r.accion, 'ajustar_meta');
  assert.equal(r.nueva_version?.objetivo, 1180);
  assert.equal(r.nueva_version?.horizonte, 'trimestral');
});

test('"no llego" con un valor fuera de banda extiende el plazo y mantiene el número', () => {
  const r = replanificarPorReglas({
    objetivo: objetivo({ objetivo: 1140 }),
    checkin: { tipo: 'no_llego', mensaje: 'Apenas 1239', valor_reportado: 1239 },
    dossier: dossier(),
    negocio: NEGOCIO,
  });
  assert.equal(r.accion, 'extender_horizonte');
  assert.equal(r.nueva_version?.horizonte, 'semestral');
  assert.equal(r.nueva_version?.objetivo, 1140);
});

test('"necesito más tiempo" sube el horizonte y no toca la meta', () => {
  const r = replanificarPorReglas({
    objetivo: objetivo({ objetivo: 1140 }),
    checkin: { tipo: 'mas_tiempo', mensaje: 'Necesito más tiempo', valor_reportado: null },
    dossier: dossier(),
    negocio: NEGOCIO,
  });
  assert.equal(r.accion, 'extender_horizonte');
  assert.equal(r.nueva_version?.objetivo, 1140);
  assert.equal(r.nueva_version?.horizonte, 'semestral');
});

test('"ya lo hacemos" con evidencia cierra y propone el escalón siguiente', () => {
  const r = replanificarPorReglas({
    objetivo: objetivo({ palanca_slug: 'separacion-residuos', dominio: 'residuos' }),
    checkin: { tipo: 'ya_hecho', mensaje: 'Ya separamos', valor_reportado: null, tiene_evidencia: true },
    dossier: dossier(),
    negocio: NEGOCIO,
  });
  assert.equal(r.logrado_retroactivo, true);
  assert.equal(r.alternativa?.palanca_slug, 'residuo-organico');
});

test('"ya lo hacemos" sin evidencia pide la evidencia y no cierra nada', () => {
  const r = replanificarPorReglas({
    objetivo: objetivo({ palanca_slug: 'separacion-residuos' }),
    checkin: { tipo: 'ya_hecho', mensaje: 'Ya lo hacemos', valor_reportado: null, tiene_evidencia: false },
    dossier: dossier(),
    negocio: NEGOCIO,
  });
  assert.equal(r.accion, 'pedir_evidencia');
  assert.equal(r.logrado_retroactivo, false);
  assert.equal(r.nueva_version, null);
});

test('"no aplica" retira el objetivo y ofrece otro del mismo dominio', () => {
  const r = replanificarPorReglas({
    objetivo: objetivo({ palanca_slug: 'separacion-residuos', dominio: 'residuos' }),
    checkin: { tipo: 'no_aplica', mensaje: 'No aplica', valor_reportado: null },
    dossier: dossier(),
    negocio: NEGOCIO,
  });
  assert.equal(r.retirar, true);
  assert.ok(r.alternativa);
  assert.notEqual(r.alternativa?.palanca_slug, 'separacion-residuos');
});

test('"avance" no cambia nada', () => {
  const r = replanificarPorReglas({
    objetivo: objetivo(),
    checkin: { tipo: 'avance', mensaje: 'Vamos bien', valor_reportado: null },
    dossier: dossier(),
    negocio: NEGOCIO,
  });
  assert.equal(r.accion, 'sin_cambios');
  assert.equal(r.nueva_version, null);
});

test('toda respuesta de replanificación es sobria: sin felicitaciones ni signos de admiración', () => {
  const tipos = ['no_llego', 'mas_tiempo', 'no_aplica', 'ya_hecho', 'avance'] as const;
  for (const tipo of tipos) {
    const r = replanificarPorReglas({
      objetivo: objetivo(),
      checkin: { tipo, mensaje: 'x', valor_reportado: 1180, tiene_evidencia: true },
      dossier: dossier(),
      negocio: NEGOCIO,
    });
    assert.ok(!/!|felicit|genial|excelente|bravo/i.test(r.respuesta), `${tipo}: ${r.respuesta}`);
  }
});

// ── Progreso ────────────────────────────────────────────────────────────────

test('6 ciclos cerrados recién llegan a 100', () => {
  const hoy = new Date('2026-09-17T12:00:00Z');
  const ciclos = Array.from({ length: 6 }, () => ({
    status: 'logrado' as const,
    ambicion: 'basico' as const,
    cerrado_at: hoy,
  }));
  assert.equal(progresoDeCiclos(ciclos, hoy), 100);
});

test('6 ciclos cerrados hace 3 años quedan por debajo de 30', () => {
  const hoy = new Date('2026-09-17T12:00:00Z');
  const viejo = new Date('2023-09-17T12:00:00Z');
  const ciclos = Array.from({ length: 6 }, () => ({
    status: 'logrado' as const,
    ambicion: 'basico' as const,
    cerrado_at: viejo,
  }));
  const p = progresoDeCiclos(ciclos, hoy);
  assert.ok(p < 30, `progreso ${p}`);
  assert.ok(p > 0);
});

test('un parcial cuenta la mitad', () => {
  const hoy = new Date('2026-09-17T12:00:00Z');
  const entero = progresoDeCiclos([{ status: 'logrado', ambicion: 'basico', cerrado_at: hoy }], hoy);
  const parcial = progresoDeCiclos([{ status: 'logrado_parcial', ambicion: 'basico', cerrado_at: hoy }], hoy);
  assert.equal(parcial, Math.round(entero / 2));
});
