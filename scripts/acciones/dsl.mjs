// ─────────────────────────────────────────────────────────────────────────────
// El catálogo de acciones, como datos (docs/ACCIONES.md §3).
//
// Cada archivo de `catalogo/` exporta una lista hecha con `d()` (acciones del
// día: gestos que se pueden hacer hoy) y `c()` (catálogo: tareas, salidas,
// cosas con otros, observaciones, retos). `generar.mjs` las valida, les pone
// los puntos por regla y escribe la migración.
//
// IMPACTO. Los números salen de los factores de abajo, cada uno con su origen,
// y se escriben con los ayudantes (`elec(0.2)`, `aguaCaliente(40)`, `km(1.5)`)
// para que cada cifra se pueda rastrear. Criterio (docs/ACCIONES.md §6):
//   · Una vez = lo que esa vez ahorra. Lo que dura (arreglar una pérdida,
//     cambiar una lámpara) cuenta 30 días de ahorro, no la vida útil.
//   · "Agua" es agua de tu canilla o tu manguera. La huella hídrica de la
//     comida o la ropa (riego, fábrica) no se suma: no la ahorraste vos.
//   · "Residuos" es lo que no fue a la basura común: lo que no se generó, se
//     reusó, se recicló o se compostó. Juntar basura de la calle es muy bueno,
//     pero eso va a la basura: no suma ahí.
//   · Aprender, observar, avisar, organizar: cero. La pantalla no inventa.
//   · Sin el aparato no hay ahorro: lo que ahorra aire acondicionado o
//     secarropas pide ese contexto.
// ─────────────────────────────────────────────────────────────────────────────

/** Factores. Ver docs/ACCIONES.md §6 y las fuentes citadas. */
export const K = {
  /** kg CO₂ por kWh de la red argentina (factor de emisión de la Secretaría de Energía, ~0,31 en 2021). */
  CO2_KWH_ELEC: 0.31,
  /** kWh térmicos por m³ de gas natural (9.300 kcal/m³). */
  KWH_POR_M3_GAS: 10.8,
  /** kg CO₂ por m³ de gas natural quemado. */
  CO2_M3_GAS: 1.95,
  /** kg CO₂ por km de auto a nafta (~7 L/100 km × 2,3 kg/L; EPA lo da en ~0,25 para EE. UU.). */
  CO2_KM_AUTO: 0.17,
  /**
   * kWh térmicos por litro de agua de ducha o pileta: agua mezclada a ~38 °C
   * desde ~17 °C (21 °C × 1,163 Wh) con un calefón de ~70% de rendimiento.
   */
  KWH_LITRO_CALIENTE: 0.035,
  /** Comida tirada: kg CO₂e por kg (FAO, huella del desperdicio ≈ 3,3 Gt / 1,3 Gt). */
  CO2_KG_COMIDA: 2.5,
  /** Orgánico que no va al relleno: kg CO₂e evitado por kg (metano evitado, prudente). */
  CO2_KG_ORGANICO: 0.5,
  /** Plástico que no se fabrica: kg CO₂e por kg. */
  CO2_KG_PLASTICO: 2.5,
  /** Plástico/papel/vidrio/lata que se recicla en vez de enterrarse (promedio prudente). */
  CO2_KG_RECICLABLE: 0.8,
  /**
   * Una prenda que no se fabrica: una remera de algodón ronda 4 kg CO₂e, pero
   * comprar usada (o heredar, o cambiar) reemplaza una nueva más o menos la
   * mitad de las veces (WRAP). Contamos 2 kg y 0,1 kg de textil que no se tira.
   */
  CO2_PRENDA: 2,
  RESIDUO_PRENDA: 0.1,
};

const r3 = (n) => Math.round(n * 1000) / 1000;

/** Suma de impactos { w, c, r, e }. */
export function suma(...xs) {
  const o = { w: 0, c: 0, r: 0, e: 0 };
  for (const x of xs) for (const k of Object.keys(o)) o[k] += x?.[k] ?? 0;
  for (const k of Object.keys(o)) o[k] = r3(o[k]);
  return o;
}
/** Litros de agua fría. */
export const agua = (l) => ({ w: l });
/** Litros de agua caliente: el agua y el gas para calentarla. */
export const aguaCaliente = (l) => suma(agua(l), gasKwh(l * K.KWH_LITRO_CALIENTE));
/** kWh eléctricos. */
export const elec = (kwh) => ({ e: r3(kwh), c: r3(kwh * K.CO2_KWH_ELEC) });
/** kWh térmicos de gas. */
export const gasKwh = (kwh) => ({ e: r3(kwh), c: r3((kwh / K.KWH_POR_M3_GAS) * K.CO2_M3_GAS) });
/** m³ de gas. */
export const gasM3 = (m3) => gasKwh(m3 * K.KWH_POR_M3_GAS);
/** km de auto que no se hicieron. */
export const km = (n) => ({ c: r3(n * K.CO2_KM_AUTO) });
/** kg de comida que no se tiró (sin el agua de riego: no salió de tu canilla). */
export const comida = (kg) => ({ r: r3(kg), c: r3(kg * K.CO2_KG_COMIDA) });
/** kg de orgánico fuera del relleno. */
export const organico = (kg) => ({ r: r3(kg), c: r3(kg * K.CO2_KG_ORGANICO) });
/** kg de plástico que no se usó. */
export const plastico = (kg) => ({ r: r3(kg), c: r3(kg * K.CO2_KG_PLASTICO) });
/** kg de reciclables que vuelven al circuito. */
export const reciclable = (kg) => ({ r: r3(kg), c: r3(kg * K.CO2_KG_RECICLABLE) });
/** Prendas que no se fabricaron (equivalente remera, con el reemplazo real). */
export const prendas = (n) => ({ c: r3(n * K.CO2_PRENDA), r: r3(n * K.RESIDUO_PRENDA) });
/** Nada medible: aprender, observar, organizar. */
export const nada = () => ({});

// ── Constructores ────────────────────────────────────────────────────────────

const EDAD = { k: 'kid', t: 'teen', a: 'adult' };

function base(tipo, slug, titulo, o) {
  const edad = (o.edad ?? 'kta').split('').map((x) => EDAD[x]);
  return {
    slug,
    tipo,
    dom: o.dom,
    titulo,
    corto: o.corto,
    desc: o.desc,
    pasos: o.pasos ?? [],
    esf: o.e ?? 'easy',
    imp: o.i ?? 'low',
    min: o.min ?? (tipo === 'daily' ? 2 : 20),
    formato: o.formato ?? (tipo === 'daily' ? 'gesto' : 'tarea'),
    frec: o.frec ?? (tipo === 'daily' ? 'daily' : 'recurring'),
    cool: o.cool ?? null,
    edad,
    req: o.req ?? [],
    lugar: o.lugar ?? 'casa',
    est: o.est ?? [],
    dias: o.dias ?? null,
    reg: o.reg ?? [],
    adulto: !!o.adulto,
    costo: o.costo ?? 'gratis',
    ahorra: !!o.ahorra,
    rutina: !!o.rut,
    medida: o.medida ?? null,
    ef: suma(o.ef ?? {}),
    equiv: o.equiv ?? null,
    fuente: o.fuente ?? null,
    tags: o.tags ?? [],
    rango: o.rango ?? 'semilla',
    hereda: o.hereda ?? [],
    otorga: o.otorga ?? null,
    // [categoría, subcategoría | null, texto]: la acción necesita un producto
    // y el Mercado lo tiene (02 §6.1). Sólo acciones de sustitución.
    mercado: o.mercado ?? null,
  };
}

/** Acción del día: un gesto que se hace hoy, en minutos. */
export const d = (slug, titulo, o) => base('daily', slug, titulo, o);
/** Acción del catálogo: tarea, salida, con otros, observar, averiguar, reto. */
export const c = (slug, titulo, o) => base('catalog', slug, titulo, o);

/**
 * Pregunta de una acción medible. `por` es el impacto de UNA unidad
 * ({ co2_kg, water_l, waste_kg, energy_kwh }); el total se calcula con lo que
 * la persona dice, con tope en `max`.
 */
export function medida(pregunta, unidad, unidades, { min = 1, max, def, paso = 1, por }) {
  return { pregunta, unidad, unidades, min, max, def, paso, por };
}
/** `por` a partir de un impacto { w, c, r, e }. */
export const por = (x) => {
  const s = suma(x);
  const o = {};
  if (s.w) o.water_l = s.w;
  if (s.c) o.co2_kg = s.c;
  if (s.r) o.waste_kg = s.r;
  if (s.e) o.energy_kwh = s.e;
  return o;
};
