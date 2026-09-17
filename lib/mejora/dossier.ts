import type { Dossier } from './tipos';

/**
 * El dossier vacío y su normalización.
 *
 * Vive acá y no en las server actions porque lo necesitan los tres lados: el
 * formulario (para arrancar), las acciones (para generar) y los tests. Un
 * archivo `'use server'` solo puede exportar funciones asíncronas, así que el
 * objeto no podía quedarse ahí.
 *
 * `null` en un campo numérico es "todavía no contestó". `'no_se'` es una
 * respuesta: la empresa dice que no lo sabe, y eso dispara objetivos de
 * medición en lugar de reducción. No son lo mismo y nunca se colapsan.
 */
export const DOSSIER_VACIO: Dossier = {
  operacion: { que_produce: '', volumen: '', estacionalidad: '' },
  energia: { suministro: null, tiene_factura: null, consumo_mensual: null, equipos: '' },
  residuos: { que_tiran: '', bolsas_semana: null, separa: null, retiro_reciclables: null },
  agua: { es_relevante: null, medicion: null, consumo_mensual: null },
  insumos: { principales: '', proveedores_clave: null, puede_cambiar_proveedores: null },
  logistica: { como_llega: '', flota: null, viajes_mes: null },
  ya_hecho: '',
  restricciones: { presupuesto: 'caso_por_caso', presupuesto_monto: null, horas_mes_disponibles: 6, local: null },
  completitud: 0,
};

/** El dossier guardado, completado con los valores por defecto que falten. */
export function normalizarDossier(d: Partial<Dossier> | null): Dossier {
  if (!d) return DOSSIER_VACIO;
  return {
    ...DOSSIER_VACIO,
    ...d,
    operacion: { ...DOSSIER_VACIO.operacion, ...(d.operacion ?? {}) },
    energia: { ...DOSSIER_VACIO.energia, ...(d.energia ?? {}) },
    residuos: { ...DOSSIER_VACIO.residuos, ...(d.residuos ?? {}) },
    agua: { ...DOSSIER_VACIO.agua, ...(d.agua ?? {}) },
    insumos: { ...DOSSIER_VACIO.insumos, ...(d.insumos ?? {}) },
    logistica: { ...DOSSIER_VACIO.logistica, ...(d.logistica ?? {}) },
    restricciones: { ...DOSSIER_VACIO.restricciones, ...(d.restricciones ?? {}) },
    ya_hecho: d.ya_hecho ?? '',
  };
}
