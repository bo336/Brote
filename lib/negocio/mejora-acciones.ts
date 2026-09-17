'use server';

import { createClient } from '@/lib/supabase/server';
import { normalizarDossier } from '@/lib/mejora/dossier';
import {
  completarConPalancas,
  objetivosPorReglas,
  ordenarPorAmbicion,
  palancasParaPrompt,
} from '@/lib/mejora/generador';
import { palanca } from '@/lib/mejora/palancas';
import { validarObjetivo } from '@/lib/mejora/realismo';
import { replanificarPorReglas } from '@/lib/mejora/replanificar';
import type {
  ContextoValidacion,
  NegocioParaMejora,
  ObjetivoPropuesto,
  TipoCheckin,
} from '@/lib/mejora/tipos';
import type { MejoraEstado, ObjetivoFila } from '@/lib/supabase/rows-negocio';

/**
 * Server actions de Mejora.
 *
 * Acá vive el post-proceso obligatorio de la IA (06 §2): lo que devuelve
 * Gemini pasa por `validarObjetivo`, lo inválido se descarta EN SILENCIO, y lo
 * que falta se completa con palancas del catálogo. La empresa nunca ve un
 * objetivo descartado ni un error de la IA — si la IA no está, el resultado es
 * el mismo por el camino determinista.
 */

export type Resultado<T = object> = ({ ok: true } & T) | { ok: false; error: string };

function negocioDe(estado: MejoraEstado): NegocioParaMejora {
  return {
    id: estado.negocio.id,
    nombre_comercial: estado.negocio.nombre_comercial,
    rubro: estado.negocio.rubro,
    tamano: estado.negocio.tamano,
    ciudad: estado.negocio.ciudad,
    provincia: estado.negocio.provincia,
    descripcion: estado.negocio.descripcion,
  };
}

/** Una fila guardada, vista como propuesta: para validar y para replanificar. */
function comoPropuesta(g: ObjetivoFila): ObjetivoPropuesto {
  return {
    titulo: g.titulo,
    porque: g.porque,
    dominio: (g.dominio ?? 'consumo') as ObjetivoPropuesto['dominio'],
    palanca_slug: g.palanca_slug,
    metrica: g.metrica,
    unidad: g.unidad,
    linea_base: g.linea_base,
    objetivo: g.objetivo,
    origen_base: g.origen_base,
    horizonte: g.horizonte,
    ambicion: g.ambicion,
    esfuerzo_horas_mes: Number(g.esfuerzo_horas_mes),
    inversion: g.inversion,
    es_evento_unico: g.es_evento_unico,
    metrica_tipo: g.metrica_tipo,
    metodo_tipo: g.metodo_tipo,
    alcance: g.alcance,
    como_medir: g.como_medir,
    pasos: Array.isArray(g.pasos) ? g.pasos : [],
    evidencia_requerida: g.evidencia_requerida,
    si_no_llegas: g.si_no_llegas ?? '',
    confianza: g.confianza,
    supuestos: [],
  };
}

async function leerEstado(negocioId: string): Promise<MejoraEstado | null> {
  const { data } = await createClient().rpc('mejora_estado', { p_business: negocioId });
  return (data ?? null) as MejoraEstado | null;
}

// ── Dossier ─────────────────────────────────────────────────────────────────

export async function guardarBloqueDossier(
  negocioId: string,
  bloque: string,
  datos: unknown,
): Promise<Resultado<{ completitud: number }>> {
  const { data, error } = await createClient().rpc('dossier_guardar', {
    p_business: negocioId,
    p_bloque: bloque,
    p_datos: datos as Record<string, unknown>,
  });
  if (error) return { ok: false, error: 'error' };
  const r = data as { ok: boolean; error?: string; completitud?: number };
  return r.ok ? { ok: true, completitud: r.completitud ?? 0 } : { ok: false, error: r.error ?? 'error' };
}

// ── Generación ──────────────────────────────────────────────────────────────

export async function generarObjetivos(
  negocioId: string,
): Promise<Resultado<{ cantidad: number; por: 'ia' | 'reglas'; limite?: boolean }>> {
  const supabase = createClient();
  const estado = await leerEstado(negocioId);
  if (!estado) return { ok: false, error: 'sin_permiso' };
  if (estado.negocio.status !== 'approved') return { ok: false, error: 'negocio_no_aprobado' };
  if (!estado.dossier) return { ok: false, error: 'sin_dossier' };

  const dossier = normalizarDossier(estado.dossier);
  const negocio = negocioDe(estado);
  const vivos = estado.objetivos.filter((g) => g.status !== 'descartado');
  const excluir = vivos.map((g) => g.palanca_slug).filter((s): s is string => !!s);
  const propuestos = estado.objetivos.filter((g) => g.status === 'propuesto');
  if (propuestos.length >= 5) return { ok: false, error: 'ya_hay_propuestas' };

  const ctx: ContextoValidacion = {
    dossier,
    activos: estado.objetivos
      .filter((g) => g.status === 'activo' || g.status === 'en_riesgo')
      .map((g) => ({ esfuerzo_horas_mes: Number(g.esfuerzo_horas_mes) })),
  };

  // 1. La IA, si está. Nunca decide: propone.
  let validos: ObjetivoPropuesto[] = [];
  let por: 'ia' | 'reglas' = 'reglas';
  let limite = false;
  try {
    const { data } = await supabase.functions.invoke('business-goals', {
      body: { business_id: negocioId, modo: 'generar', palancas: palancasParaPrompt(negocio, dossier) },
    });
    const r = data as { ok?: boolean; status?: string; datos?: { objetivos?: unknown[] } } | null;
    if (r?.status === 'limite') limite = true;
    if ((r?.status === 'ok' || r?.status === 'cache') && Array.isArray(r.datos?.objetivos)) {
      // 2. Post-proceso obligatorio: validar y descartar en silencio.
      validos = (r.datos.objetivos as ObjetivoPropuesto[])
        .map((o) => ({ ...o, supuestos: Array.isArray(o.supuestos) ? o.supuestos : [] }))
        .filter((o) => {
          const claves = palanca(o.palanca_slug)?.claves;
          return validarObjetivo(o, ctx, { claves }).valido;
        })
        .filter((o) => !o.palanca_slug || !excluir.includes(o.palanca_slug));
      if (validos.length > 0) por = 'ia';
    }
  } catch {
    // La IA es una mejora de calidad, nunca una dependencia dura.
  }

  // 3. Completar con palancas hasta 3, y ordenar por ambición ascendente.
  const objetivos = ordenarPorAmbicion(
    completarConPalancas(validos, dossier, negocio, 3, excluir).slice(0, 5),
  );
  if (objetivos.length === 0) return { ok: false, error: 'sin_objetivos' };

  const { data, error } = await supabase.rpc('objetivos_proponer', {
    p_business: negocioId,
    p_objetivos: objetivos,
    p_generated_by: por,
  });
  if (error) return { ok: false, error: 'error' };
  const res = data as { ok: boolean; error?: string; cantidad?: number };
  if (!res.ok) return { ok: false, error: res.error ?? 'error' };
  return { ok: true, cantidad: res.cantidad ?? 0, por, limite };
}

// ── Ciclo de vida ───────────────────────────────────────────────────────────

export async function aceptarObjetivo(goalId: string): Promise<Resultado> {
  const { data, error } = await createClient().rpc('objetivo_aceptar', { p_goal: goalId });
  if (error) return { ok: false, error: 'error' };
  const r = data as { ok: boolean; error?: string };
  return r.ok ? { ok: true } : { ok: false, error: r.error ?? 'error' };
}

export async function descartarObjetivo(goalId: string, motivo: string): Promise<Resultado> {
  const { data, error } = await createClient().rpc('objetivo_descartar', {
    p_goal: goalId,
    p_motivo: motivo.slice(0, 500),
  });
  if (error) return { ok: false, error: 'error' };
  const r = data as { ok: boolean; error?: string };
  return r.ok ? { ok: true } : { ok: false, error: r.error ?? 'error' };
}

export async function guardarPasos(goalId: string, hechos: number[]): Promise<Resultado> {
  const { data, error } = await createClient().rpc('objetivo_pasos', {
    p_goal: goalId,
    p_hechos: hechos.filter((n) => Number.isInteger(n) && n >= 0 && n < 20),
  });
  if (error) return { ok: false, error: 'error' };
  const r = data as { ok: boolean; error?: string };
  return r.ok ? { ok: true } : { ok: false, error: r.error ?? 'error' };
}

export async function cerrarObjetivo(
  goalId: string,
  valorFinal: number | null,
  rutas: string[],
): Promise<Resultado> {
  const { data, error } = await createClient().rpc('objetivo_cerrar', {
    p_goal: goalId,
    p_valor_final: valorFinal,
    p_rutas: rutas,
  });
  if (error) return { ok: false, error: 'error' };
  const r = data as { ok: boolean; error?: string };
  return r.ok ? { ok: true } : { ok: false, error: r.error ?? 'error' };
}

// ── Feedback y replanificación ──────────────────────────────────────────────

export async function enviarCheckin(
  goalId: string,
  tipo: TipoCheckin,
  mensaje: string,
  valor: number | null,
  tieneEvidencia = false,
): Promise<Resultado<{ respuesta: string; por: 'ia' | 'reglas' | null; accion: string }>> {
  const supabase = createClient();

  // 1. El check-in se guarda SIEMPRE, pase lo que pase después: es la voz de
  //    la empresa y es lo que se audita.
  const { data: dChk, error: eChk } = await supabase.rpc('objetivo_checkin', {
    p_goal: goalId,
    p_tipo: tipo,
    p_mensaje: mensaje,
    p_valor: valor,
    p_tiene_evidencia: tieneEvidencia,
  });
  if (eChk) return { ok: false, error: 'error' };
  const chk = dChk as { ok: boolean; error?: string; checkin_id?: string };
  if (!chk.ok || !chk.checkin_id) return { ok: false, error: chk.error ?? 'error' };

  const { data: dDet } = await supabase.rpc('objetivo_detalle', { p_goal: goalId });
  const detalle = dDet as { objetivo: ObjetivoFila; negocio_id: string } | null;
  if (!detalle) return { ok: false, error: 'error' };
  const estado = await leerEstado(detalle.negocio_id);
  if (!estado) return { ok: false, error: 'sin_permiso' };
  const dossier = normalizarDossier(estado.dossier);
  const negocio = negocioDe(estado);
  const actual = comoPropuesta(detalle.objetivo);
  const ctx: ContextoValidacion = { dossier, activos: [] };
  const excluir = estado.objetivos
    .filter((g) => g.status !== 'descartado')
    .map((g) => g.palanca_slug)
    .filter((s): s is string => !!s);

  // 2. Un avance o una nota no replanifican nada.
  if (tipo === 'avance' || tipo === 'nota') {
    await supabase.rpc('objetivo_replanificar', {
      p_goal: goalId,
      p_checkin: chk.checkin_id,
      p_accion: 'sin_cambios',
      p_respuesta: { respuesta: 'Registrado. El objetivo queda como está.', accion: 'sin_cambios', por: 'reglas' },
    });
    return { ok: true, respuesta: 'Registrado. El objetivo queda como está.', por: 'reglas', accion: 'sin_cambios' };
  }

  // 3. La IA, si está y si lo que devuelve valida. Si no, las reglas.
  let plan = replanificarPorReglas({
    objetivo: actual,
    checkin: { tipo, mensaje, valor_reportado: valor, tiene_evidencia: tieneEvidencia },
    dossier,
    negocio,
    excluir,
  });
  let por: 'ia' | 'reglas' = 'reglas';

  try {
    const { data } = await supabase.functions.invoke('business-goals', {
      body: { business_id: detalle.negocio_id, modo: 'replanificar', goal_id: goalId },
    });
    const r = data as
      | { status?: string; datos?: { accion?: string; objetivo_nuevo?: ObjetivoPropuesto | null; respuesta?: string; logrado_retroactivo?: boolean; retirar?: boolean } }
      | null;
    if ((r?.status === 'ok' || r?.status === 'cache') && r.datos?.accion) {
      const ia = r.datos;
      const nuevo = ia.objetivo_nuevo ?? null;
      const nuevoValida =
        !nuevo ||
        validarObjetivo({ ...nuevo, supuestos: nuevo.supuestos ?? [] }, ctx, {
          claves: palanca(nuevo.palanca_slug)?.claves,
        }).valido;
      if (nuevoValida) {
        por = 'ia';
        plan = {
          accion: ia.accion as typeof plan.accion,
          nueva_version: ia.retirar || ia.logrado_retroactivo ? null : nuevo,
          alternativa: ia.retirar || ia.logrado_retroactivo ? nuevo : null,
          logrado_retroactivo: !!ia.logrado_retroactivo,
          retirar: !!ia.retirar,
          respuesta: ia.respuesta ?? plan.respuesta,
        };
      }
    }
  } catch {
    // Silencio: el plan determinista ya está calculado.
  }

  const { data, error } = await supabase.rpc('objetivo_replanificar', {
    p_goal: goalId,
    p_checkin: chk.checkin_id,
    p_accion: plan.accion,
    p_nuevo: plan.nueva_version,
    p_alternativa: plan.alternativa,
    p_logrado_retroactivo: plan.logrado_retroactivo,
    p_retirar: plan.retirar,
    p_respuesta: { respuesta: plan.respuesta, accion: plan.accion, por },
  });
  if (error) return { ok: false, error: 'error' };
  const res = data as { ok: boolean; error?: string };
  if (!res.ok) return { ok: false, error: res.error ?? 'error' };

  return { ok: true, respuesta: plan.respuesta, por, accion: plan.accion };
}

/** Genera un objetivo suelto por reglas, para el botón "proponer otro". */
export async function proponerUnoMas(negocioId: string): Promise<Resultado<{ cantidad: number }>> {
  const estado = await leerEstado(negocioId);
  if (!estado) return { ok: false, error: 'sin_permiso' };
  if (!estado.dossier) return { ok: false, error: 'sin_dossier' };
  const dossier = normalizarDossier(estado.dossier);
  const excluir = estado.objetivos
    .filter((g) => g.status !== 'descartado')
    .map((g) => g.palanca_slug)
    .filter((s): s is string => !!s);
  const objetivos = objetivosPorReglas(dossier, negocioDe(estado), { excluir, cantidad: 1 });
  if (objetivos.length === 0) return { ok: false, error: 'sin_objetivos' };

  const { data, error } = await createClient().rpc('objetivos_proponer', {
    p_business: negocioId,
    p_objetivos: objetivos,
    p_generated_by: 'reglas',
  });
  if (error) return { ok: false, error: 'error' };
  const res = data as { ok: boolean; error?: string; cantidad?: number };
  return res.ok ? { ok: true, cantidad: res.cantidad ?? 0 } : { ok: false, error: res.error ?? 'error' };
}
