// ─────────────────────────────────────────────────────────────────────────────
// academia-generate — el motor infinito de la Academia.
//
// NINGUNA LLAMADA A UN MODELO OCURRE EN EL CAMINO DE PEDIDO. Nunca. Quien abre
// una hoja recibe su sesión en milisegundos desde SQL puro, y nunca ve una
// oración sin revisar. Esto corre aparte, contra la demanda medida.
//
// Cuatro acciones, encadenables por cron:
//
//   plan    → mira los pools flacos y encola solicitudes (con clave de
//             idempotencia, así que re-correrlo es un no-op)
//   submit  → arma los prompts y manda el lote a Gemini
//   poll    → consulta el lote, corre las compuertas, ingiere
//   propose → expansión de currículum para quien cerró un anillo
//
// DEGRADACIÓN: si Gemini no está, todo esto falla hacia afuera y la app se
// comporta EXACTAMENTE como sin el pipeline. El pipeline es una mejora, jamás
// una dependencia.
// ─────────────────────────────────────────────────────────────────────────────
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.46.1';
import { corsHeaders, json } from '../_shared/cors.ts';
import {
  GeminiUnavailable,
  MODELO_GEN,
  costoCentavos,
  geminiBatchPoll,
  geminiBatchSubmit,
  geminiEmbed,
  geminiJSON,
  parseJson,
} from '../_shared/gemini.ts';
import { validar, type Candidato } from './compuertas.ts';
import {
  CURRICULUM_VERSION,
  JUEZ_VERSION,
  PROMPT_VERSION,
  promptCurriculum,
  promptItems,
  promptJuez,
  type Contexto,
} from './prompts/registro.ts';

const N_POR_PEDIDO = 4;
/** Tope de la escalera de reintentos. Un tercero no sale nunca y quema plata. */
const MAX_INTENTOS = 2;

type Sb = ReturnType<typeof createClient>;

function admin(): Sb {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
}

async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** ¿Está encendido y hay plata? Se pregunta ANTES de gastar, nunca después. */
async function puedeGenerar(sb: Sb): Promise<{ ok: boolean; motivo?: string; estado?: unknown }> {
  const { data: enc } = await sb.from('app_settings').select('value').eq('key', 'academia_generacion_enabled').maybeSingle();
  if (enc?.value !== true) return { ok: false, motivo: 'academia_generacion_enabled = false' };
  const { data } = await sb.rpc('academia_presupuesto_estado');
  const e = data as { habilitado?: boolean; restante_centavos?: number } | null;
  if (!e?.habilitado) return { ok: false, motivo: 'presupuesto agotado', estado: e };
  return { ok: true, estado: e };
}

// ── plan ─────────────────────────────────────────────────────────────────────

/**
 * Encola lo que falta. La clave de idempotencia hace que correr esto dos veces
 * seguidas no duplique nada — que es la propiedad que vuelve seguro reintentar
 * a ciegas un lote que falló.
 */
async function plan(sb: Sb, limite: number) {
  const { data: pools } = await sb.rpc('academia_pool_hambriento', { p_limite: limite });
  const lista = (pools ?? []) as { concepto_id: string; slug: string; tipo: string; vivos: number }[];
  // Los tipos de presentación no se generan: microlectura y dato_vivo se
  // escriben, no se resuelven, y su calidad no la puede juzgar un juez.
  const generables = lista.filter((p) => p.tipo !== 'microlectura' && p.tipo !== 'dato_vivo');

  let nuevas = 0, repetidas = 0;
  for (const p of generables) {
    const key = await sha256([MODELO_GEN, PROMPT_VERSION, p.concepto_id, p.tipo, N_POR_PEDIDO, 0].join('|'));
    const { error } = await sb.from('ac_generacion_solicitudes').insert({
      idempotency_key: key,
      concepto_id: p.concepto_id,
      tipo: p.tipo,
      clase: 'item',
      n_pedidos: N_POR_PEDIDO,
      prompt_version: PROMPT_VERSION,
      model_version: MODELO_GEN,
    });
    if (error) repetidas++; else nuevas++;
  }
  return { pools: lista.length, generables: generables.length, nuevas, repetidas };
}

// ── submit ───────────────────────────────────────────────────────────────────

async function contextoDe(sb: Sb, conceptoId: string, tipo: string): Promise<Contexto | null> {
  const { data } = await sb.rpc('academia_gen_contexto', { p_concepto_id: conceptoId, p_tipo: tipo });
  const c = data as (Contexto & { ok?: boolean }) | null;
  return c?.ok ? c : null;
}

async function submit(sb: Sb, cuantas: number) {
  const permiso = await puedeGenerar(sb);
  if (!permiso.ok) return { enviado: false, ...permiso };

  const { data: pend } = await sb
    .from('ac_generacion_solicitudes')
    .select('id, concepto_id, tipo, n_pedidos, temperatura, intento')
    .eq('estado', 'pendiente')
    .lte('intento', MAX_INTENTOS)
    .order('created_at')
    .limit(cuantas);

  const solicitudes = (pend ?? []) as {
    id: string; concepto_id: string; tipo: string; n_pedidos: number; temperatura: number; intento: number;
  }[];
  if (solicitudes.length === 0) return { enviado: false, motivo: 'no hay nada pendiente' };

  const pedidos: { key: string; prompt: string; temperature: number }[] = [];
  for (const s of solicitudes) {
    const ctx = await contextoDe(sb, s.concepto_id, s.tipo);
    if (!ctx) {
      await sb.from('ac_generacion_solicitudes')
        .update({ estado: 'fallido', error: 'sin contexto' }).eq('id', s.id);
      continue;
    }
    // La escalera de reintentos sube la temperatura: reintentar idéntico da lo
    // mismo idéntico.
    pedidos.push({
      key: s.id,
      prompt: promptItems(ctx, s.tipo, s.n_pedidos),
      temperature: (s.temperatura ?? 0.6) + 0.2 * s.intento,
    });
  }
  if (pedidos.length === 0) return { enviado: false, motivo: 'ningún contexto utilizable' };

  const batchId = await geminiBatchSubmit(pedidos, { displayName: `academia-${PROMPT_VERSION}` });
  await sb.from('ac_generacion_solicitudes')
    .update({ estado: 'enviado', batch_id: batchId, submitted_at: new Date().toISOString() })
    .in('id', pedidos.map((p) => p.key));

  return { enviado: true, batch_id: batchId, solicitudes: pedidos.length };
}

// ── poll + ingesta ───────────────────────────────────────────────────────────

/** El juez. Llamada aparte, prompt distinto, y su fallo no bloquea: solo rutea. */
async function juzgar(c: Candidato, ctx: Contexto): Promise<Record<string, unknown> | null> {
  try {
    const j = await geminiJSON<Record<string, unknown>>(
      [{ text: promptJuez(c.payload_publico, c.solucion, ctx) }],
      { temperature: 0.1, timeoutMs: 25000 },
    );
    return { ...j, juez_version: JUEZ_VERSION };
  } catch {
    // Sin juez, el ítem va igual a revisión humana: es más estricto, no menos.
    return { problema_bloqueante: true, comentario: 'el juez no respondió', juez_version: JUEZ_VERSION };
  }
}

async function ingerirRespuesta(
  sb: Sb,
  solicitud: { id: string; concepto_id: string; tipo: string; intento: number; prompt_version: string },
  texto: string,
  tokensIn: number,
  tokensOut: number,
) {
  const ctx = await contextoDe(sb, solicitud.concepto_id, solicitud.tipo);
  const rechazos: Record<string, number> = {};
  let aceptados = 0, rechazados = 0;

  let crudo: { items?: unknown[] };
  try {
    crudo = parseJson<{ items?: unknown[] }>(texto);
  } catch {
    return { ok: false, motivo: 'json_invalido', aceptados: 0, rechazados: 0, rechazos: { json_invalido: 1 } };
  }
  const items = Array.isArray(crudo.items) ? crudo.items : [];

  // Una plantilla por solicitud: los ítems de esta tanda son isomorfos de la
  // misma forma, que es exactamente lo que una plantilla representa.
  const { data: pl } = await sb.from('ac_plantillas').insert({
    tipo: solicitud.tipo,
    titulo_interno: `gen ${ctx?.concepto.slug ?? solicitud.concepto_id} ${solicitud.tipo} ${solicitud.prompt_version}`,
    enunciado_tpl: '{{generado}}',
    generator_hash: solicitud.id,
    prompt_version: solicitud.prompt_version,
    status: 'aprobado',
    fuente_id: ctx?.fuentes?.[0]?.id ?? null,
  }).select('id').single();
  const plantillaId = (pl as { id: string } | null)?.id;
  if (!plantillaId) return { ok: false, motivo: 'no se pudo crear la plantilla', aceptados: 0, rechazados: items.length, rechazos };

  await sb.from('ac_plantilla_conceptos').insert({ plantilla_id: plantillaId, concepto_id: solicitud.concepto_id, peso: 1.0 });

  for (let i = 0; i < items.length; i++) {
    const v = validar(solicitud.tipo, items[i]);
    if (!v.ok) {
      rechazados++;
      for (const f of v.fallas) rechazos[f.slice(0, 60)] = (rechazos[f.slice(0, 60)] ?? 0) + 1;
      continue;
    }
    const c = v.candidato;

    // Embedding para el deduplicado. Si falla, se sigue: la compuerta se
    // saltea con el motivo escrito, no en silencio.
    let emb: number[] | null = null;
    try {
      const textoParaEmbed = JSON.stringify(c.payload_publico).slice(0, 4000);
      emb = (await geminiEmbed([textoParaEmbed]))[0] ?? null;
    } catch { /* sin embedding: academia_dedupe lo reporta como 'sin_embedding' */ }

    const juez = ctx ? await juzgar(c, ctx) : null;

    const { data: res } = await sb.rpc('academia_ingerir_item', {
      p_solicitud_id: solicitud.id,
      p_plantilla_id: plantillaId,
      p_seed: Date.now() * 1000 + i,
      p_payload_publico: c.payload_publico,
      p_solucion: c.solucion,
      p_afirmaciones: c.afirmaciones,
      p_age_groups: c.age_groups ?? ['teen', 'adult'],
      p_dificultad: c.dificultad_estimada ?? null,
      p_juez: juez,
      p_embedding: emb ? `[${emb.join(',')}]` : null,
    });
    const r = res as { ok?: boolean; motivo?: string } | null;
    if (r?.ok) aceptados++;
    else {
      rechazados++;
      const m = r?.motivo ?? 'desconocido';
      rechazos[m] = (rechazos[m] ?? 0) + 1;
    }
  }

  // Una plantilla que no produjo ni un ítem no queda dando vueltas.
  if (aceptados === 0) {
    await sb.from('ac_plantillas').update({ status: 'retirado' }).eq('id', plantillaId);
  }

  await sb.from('ac_generacion_solicitudes').update({
    estado: 'ingerido',
    aceptados, rechazados, rechazos,
    tokens_in: tokensIn, tokens_out: tokensOut,
    cost_cents: costoCentavos(tokensIn, tokensOut),
    completed_at: new Date().toISOString(),
  }).eq('id', solicitud.id);

  await sb.rpc('academia_presupuesto_gastar', { p_centavos: costoCentavos(tokensIn, tokensOut) });

  return { ok: true, aceptados, rechazados, rechazos };
}

async function poll(sb: Sb) {
  const { data: enviadas } = await sb
    .from('ac_generacion_solicitudes')
    .select('id, batch_id, concepto_id, tipo, intento, prompt_version')
    .eq('estado', 'enviado')
    .not('batch_id', 'is', null)
    .limit(200);

  const filas = (enviadas ?? []) as {
    id: string; batch_id: string; concepto_id: string; tipo: string; intento: number; prompt_version: string;
  }[];
  if (filas.length === 0) return { lotes: 0, motivo: 'no hay lotes enviados' };

  const lotes = [...new Set(filas.map((f) => f.batch_id))];
  const resumen: Record<string, unknown>[] = [];

  for (const lote of lotes) {
    const { listo, respuestas } = await geminiBatchPoll(lote);
    if (!listo) { resumen.push({ lote, listo: false }); continue; }

    let aceptados = 0, rechazados = 0;
    for (const r of respuestas) {
      const sol = filas.find((f) => f.id === r.key);
      if (!sol) continue;

      if (r.error || !r.text) {
        // Escalera: se reencola con un intento más hasta el tope, después
        // carta muerta CON la respuesta cruda guardada.
        const sig = sol.intento + 1;
        await sb.from('ac_generacion_solicitudes').update(
          sig > MAX_INTENTOS
            ? { estado: 'dead_letter', error: r.error ?? 'sin texto', respuesta_cruda: { text: r.text, error: r.error } }
            : { estado: 'pendiente', intento: sig, error: r.error ?? 'sin texto', batch_id: null },
        ).eq('id', sol.id);
        continue;
      }

      const out = await ingerirRespuesta(sb, sol, r.text, r.tokensIn, r.tokensOut);
      if (!out.ok) {
        const sig = sol.intento + 1;
        await sb.from('ac_generacion_solicitudes').update(
          sig > MAX_INTENTOS
            ? { estado: 'dead_letter', error: out.motivo, respuesta_cruda: { text: r.text.slice(0, 20000) } }
            : { estado: 'pendiente', intento: sig, error: out.motivo, batch_id: null },
        ).eq('id', sol.id);
        continue;
      }
      aceptados += out.aceptados ?? 0;
      rechazados += out.rechazados ?? 0;
    }
    resumen.push({ lote, listo: true, respuestas: respuestas.length, aceptados, rechazados });
  }
  return { lotes: lotes.length, resumen };
}

// ── propose: expansión de currículum ─────────────────────────────────────────

async function propose(sb: Sb, userId: string | null) {
  const permiso = await puedeGenerar(sb);
  if (!permiso.ok) return { propuesta: false, ...permiso };
  if (!userId) return { propuesta: false, motivo: 'falta el usuario' };

  const { data: nec } = await sb.rpc('academia_expansion_necesaria', { p_user: userId, p_k: 3 });
  const n = nec as { necesaria?: boolean; rama_slug?: string; anillo?: number } | null;
  if (!n?.necesaria || !n.rama_slug || !n.anillo) return { propuesta: false, motivo: 'no hace falta', detalle: n };

  const { data: rama } = await sb.from('ac_ramas').select('slug, nombre_es').eq('slug', n.rama_slug).single();
  const { data: gajos } = await sb.from('ac_gajos').select('slug, titulo_es, anillo')
    .eq('rama_slug', n.rama_slug).eq('status', 'aprobado').order('anillo');
  const { data: conceptos } = await sb.from('ac_conceptos').select('slug')
    .eq('rama_slug', n.rama_slug).eq('status', 'aprobado').limit(400);
  const { data: anillo } = await sb.from('ac_anillos').select('rubrica').eq('n', n.anillo).maybeSingle();

  const prompt = promptCurriculum({
    rama: n.rama_slug,
    ramaNombre: (rama as { nombre_es: string } | null)?.nombre_es ?? n.rama_slug,
    anillo: n.anillo,
    rubrica: (anillo as { rubrica: string } | null)?.rubrica ?? null,
    gajosExistentes: (gajos ?? []) as { slug: string; titulo_es: string; anillo: number }[],
    conceptosExistentes: ((conceptos ?? []) as { slug: string }[]).map((c) => c.slug),
  });

  const payload = await geminiJSON<Record<string, unknown>>([{ text: prompt }], { temperature: 0.7, timeoutMs: 40000 });

  const { data: guardada } = await sb.rpc('academia_guardar_propuesta', {
    p_rama: n.rama_slug,
    p_anillo: n.anillo,
    p_payload: payload,
    p_prompt_version: CURRICULUM_VERSION,
    p_model_version: MODELO_GEN,
    p_user: userId,
  });
  return { propuesta: true, resultado: guardada };
}

// ── entrada ──────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  let cuerpo: { accion?: string; limite?: number; cuantas?: number; user_id?: string } = {};
  try { cuerpo = await req.json(); } catch { /* sin cuerpo: se usa el default */ }
  const accion = cuerpo.accion ?? 'plan';
  const sb = admin();

  try {
    switch (accion) {
      case 'plan':    return json({ ok: true, accion, ...(await plan(sb, cuerpo.limite ?? 40)) });
      case 'submit':  return json({ ok: true, accion, ...(await submit(sb, cuerpo.cuantas ?? 10)) });
      case 'poll':    return json({ ok: true, accion, ...(await poll(sb)) });
      case 'propose': return json({ ok: true, accion, ...(await propose(sb, cuerpo.user_id ?? null)) });
      case 'estado': {
        const { data } = await sb.rpc('academia_presupuesto_estado');
        return json({ ok: true, accion, presupuesto: data, modelo: MODELO_GEN, prompt_version: PROMPT_VERSION });
      }
      default: return json({ ok: false, error: `acción desconocida: ${accion}` }, 400);
    }
  } catch (e) {
    // Gemini caído NO es un error de la app: es el pipeline que no corrió. La
    // Academia sigue funcionando exactamente igual que sin pipeline.
    if (e instanceof GeminiUnavailable) {
      return json({ ok: false, accion, error: 'gemini_no_disponible', detalle: e.message }, 200);
    }
    return json({ ok: false, accion, error: e instanceof Error ? e.message : 'falló' }, 500);
  }
});
