// business-goals (brote-negocios fase 2 §5.2 y §7.3)
//
// La capa de IA del programa de Mejora, en dos modos: `generar` (3 a 5
// objetivos a partir del dossier) y `replanificar` (una versión ajustada a
// partir de un check-in). Los prompts son los de `06_PROMPTS_IA.md` §2 y §3,
// literales.
//
// LO QUE ESTA FUNCIÓN NO HACE, A PROPÓSITO
//
// No valida ni guarda nada. Devuelve el JSON crudo de Gemini y el server action
// lo pasa por `lib/mejora/realismo.ts` antes de que exista en la base. El
// validador vive en un solo lugar (TypeScript), no en dos: si la regla de
// ambición viviera también acá, tarde o temprano una de las dos copias se
// quedaría vieja y un objetivo malo llegaría a una empresa que paga.
//
// Los HECHOS del prompt los lee esta función de la base con `mejora_estado`
// (que además comprueba la membresía con el JWT de la persona). Del cliente
// solo acepta el menú de palancas, que es una sugerencia: lo que vuelva se
// valida igual.
//
// Si no hay clave, si Gemini falla, si el JSON no parsea tras un reintento o si
// la empresa llegó a su límite semanal, responde `status: 'fallback'` o
// `'limite'` y NUNCA un error: el camino determinista da el mismo resultado.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.46.1';
import { corsHeaders, json } from '../_shared/cors.ts';
import { GeminiUnavailable, geminiJSON } from '../_shared/gemini.ts';

const MODELO = 'gemini-2.5-flash';
const LIMITE_SEMANAL = { objetivos: 4, replan: 8 } as const;

const PREAMBULO = `Sos el motor de análisis de Brote, una plataforma argentina de acción ambiental.
Tu salida la lee un profesional que dirige una PyME real y una persona que revisa
antes de publicar. Todo lo que escribís tiene que sostenerse frente a alguien que
sabe del rubro.

REGLAS QUE NO PODÉS ROMPER:
1. Respondés SOLO con el JSON del esquema. Sin markdown, sin explicación previa.
2. No inventás números. Si un dato no está en la entrada, lo marcás como faltante
   o proponés medirlo. Un número inventado es el peor error posible acá.
3. No usás lenguaje de coaching, ni motivacional, ni emojis, ni signos de exclamación.
   Esto es un informe técnico, no una arenga.
4. Si no estás seguro, lo declarás en el campo de confianza. La incertidumbre
   declarada vale más que la falsa precisión.
5. Escribís en español rioplatense, tratando de "vos". Frases cortas. Sin adjetivos
   de más. Sin "sustentable" ni "eco-friendly" como muletillas.
6. No hacés afirmaciones legales, ni prometés resultados, ni garantizás nada.`;

const ESQUEMA_OBJETIVO = {
  type: 'object',
  properties: {
    titulo: { type: 'string' },
    porque: { type: 'string' },
    dominio: { type: 'string' },
    palanca_slug: { type: 'string', nullable: true },
    metrica: { type: 'string' },
    unidad: { type: 'string' },
    linea_base: { type: 'number', nullable: true },
    origen_base: { type: 'string', enum: ['factura', 'medicion', 'estimado', 'a_medir'] },
    objetivo: { type: 'number', nullable: true },
    horizonte: { type: 'string', enum: ['trimestral', 'semestral', 'anual'] },
    ambicion: { type: 'string', enum: ['basico', 'intermedio', 'avanzado'] },
    esfuerzo_horas_mes: { type: 'number' },
    inversion: { type: 'string', enum: ['ninguna', 'baja', 'media'] },
    es_evento_unico: { type: 'boolean' },
    metrica_tipo: { type: 'string', enum: ['reduccion', 'medicion', 'sustitucion'] },
    metodo_tipo: { type: 'string', enum: ['factura', 'conteo', 'pesaje', 'remito', 'planilla', 'foto_fechada'] },
    alcance: { type: 'integer' },
    como_medir: { type: 'string' },
    pasos: { type: 'array', items: { type: 'string' } },
    evidencia_requerida: { type: 'string' },
    si_no_llegas: { type: 'string' },
    confianza: { type: 'string', enum: ['alta', 'media', 'baja'] },
    supuestos: { type: 'array', items: { type: 'string' } },
  },
  required: [
    'titulo', 'porque', 'dominio', 'metrica', 'unidad', 'origen_base', 'horizonte', 'ambicion',
    'esfuerzo_horas_mes', 'inversion', 'metrica_tipo', 'metodo_tipo', 'alcance', 'como_medir',
    'pasos', 'evidencia_requerida', 'si_no_llegas', 'confianza',
  ],
};

const ESQUEMA_GENERAR = {
  type: 'object',
  properties: {
    objetivos: { type: 'array', items: ESQUEMA_OBJETIVO },
    lectura_del_negocio: { type: 'string' },
    datos_que_faltan: { type: 'array', items: { type: 'string' } },
  },
  required: ['objetivos'],
};

const ESQUEMA_REPLAN = {
  type: 'object',
  properties: {
    accion: {
      type: 'string',
      enum: ['ajustar_meta', 'extender_horizonte', 'reemplazar', 'retirar', 'sin_cambios', 'pedir_evidencia'],
    },
    logrado_retroactivo: { type: 'boolean' },
    retirar: { type: 'boolean' },
    objetivo_nuevo: { ...ESQUEMA_OBJETIVO, nullable: true },
    respuesta: { type: 'string' },
    confianza: { type: 'string', enum: ['alta', 'media', 'baja'] },
  },
  required: ['accion', 'respuesta', 'confianza'],
};

function promptGenerar(negocio: Record<string, unknown>, dossier: Record<string, unknown>, palancas: unknown): string {
  const j = (v: unknown) => JSON.stringify(v ?? {}, null, 0);
  return `${PREAMBULO}

TU TAREA
Proponer entre 3 y 5 objetivos ambientales de mediano plazo para el negocio descrito.

QUÉ HACE QUE UN OBJETIVO SEA BUENO ACÁ
- Es de mediano o largo plazo: trimestral, semestral o anual. NUNCA diario ni semanal.
- Se puede medir con algo que el negocio YA TIENE: una factura, una balanza, un conteo,
  un remito, una planilla propia. Si no se puede medir con eso, no sirve.
- Cuesta poco tiempo: como máximo 6 horas de trabajo por mes. El objetivo es una mejora
  de fondo, NO la tarea principal del negocio. Si al leerlo alguien piensa "esto me
  cambia la operación", está mal dimensionado.
- Está dentro del control del negocio. No propongas nada que dependa del municipio, del
  gobierno, de los clientes ni de proveedores que no elige.
- Es específico de su rubro. Una panadería, una peluquería y un estudio de software no
  reciben los mismos objetivos.

CALIBRACIÓN DE AMBICIÓN (esto es lo más importante)
Las metas se anclan en la ruta para PyMEs de la Science Based Targets initiative:
4,2% de reducción por año. De ahí salen estas bandas para métricas continuas
(energía, agua, residuos, combustible):

  trimestral  → entre 1% y 2%     (máximo absoluto 8%)
  semestral   → entre 2% y 4%     (máximo absoluto 12%)
  anual       → entre 4% y 8%     (máximo absoluto 20%)

Los máximos solo se usan si el cambio es un evento único que el negocio declaró
factible: cambiar de proveedor, reemplazar luminaria, cambiar el envase.

Para objetivos de sustitución (qué porcentaje de compras, productos o envíos cambia),
la banda es 10% a 25% por ciclo.

REGLA DE LÍNEA DE BASE
Si el negocio no informó el dato de una métrica, NO inventes un valor y NO propongas
una reducción. El objetivo de ese ciclo es MEDIR: establecer la línea de base.
Es lo que haría un consultor serio y es preferible a un número falso.

ALCANCE 3
Las emisiones de proveedores y clientes se MIDEN, no se ponen como meta de reducción.

EJEMPLOS DE CONTRASTE
Mal: "Ser carbono neutral este año."
     Fuera de banda, sin línea de base, sin método, fuera de control.
Bien: "Medir el consumo eléctrico mensual del local durante 3 meses usando las
      facturas, para tener una línea de base."

Mal: "Reducí un 5% tu basura."
     Sin base, sin unidad, sin método, sin pasos.
Bien: "Bajar de 6 a 5 bolsas de residuo mixto por semana separando cartón y vidrio,
      contando bolsas los viernes."

Mal: "Concientizá a tus clientes sobre el ambiente."
     Inmedible y fuera de control.
Bien: "Ofrecer descuento por traer envase propio y registrar cuántos lo usan; meta:
      15% de las ventas del mostrador en 3 meses."

Mal: "Instalá paneles solares."
     Exige inversión que el negocio no declaró tener.
Bien: "Pedir tres presupuestos de eficiencia energética y elegir uno para evaluar el
      año que viene." (2 h de trabajo, sin inversión)

Mal: "Reducí 50% las emisiones en 3 meses."
     Seis veces fuera de banda.
Bien: "Bajar 2% el consumo de gas del horno ajustando el precalentado, comparando
      facturas de dos bimestres."

NEGOCIO
  Nombre: ${negocio.nombre_comercial}
  Rubro: ${negocio.rubro}
  Tamaño: ${negocio.tamano} personas
  Ubicación: ${negocio.ciudad ?? '—'}, ${negocio.provincia ?? '—'}
  En sus palabras: ${negocio.descripcion ?? '—'}

DOSSIER
  Operación: ${j(dossier.operacion)}
  Energía: ${j(dossier.energia)}
  Residuos: ${j(dossier.residuos)}
  Agua: ${j(dossier.agua)}
  Insumos y proveedores: ${j(dossier.insumos)}
  Logística: ${j(dossier.logistica)}
  Restricciones: ${j(dossier.restricciones)}

YA HECHO EN LOS ÚLTIMOS 2 AÑOS — NO PROPONGAS NADA DE ESTO
  ${dossier.ya_hecho ?? '(no informó)'}

PALANCAS DISPONIBLES PARA ESTE RUBRO
Podés usarlas, adaptarlas o proponer otra cosa si conocés algo mejor para este caso.
  ${j(palancas)}

Devolvé el JSON del esquema. En "pasos", entre 3 y 6 pasos concretos. En "titulo",
máximo 70 caracteres empezando con un verbo en infinitivo.`;
}

function promptReplan(
  objetivo: Record<string, unknown>,
  checkins: unknown,
  nuevo: Record<string, unknown>,
  dossier: Record<string, unknown>,
): string {
  const j = (v: unknown) => JSON.stringify(v ?? {}, null, 0);
  return `${PREAMBULO}

TU TAREA
Un negocio dio feedback sobre un objetivo suyo. Devolvé una versión ajustada.

CÓMO AJUSTAR SEGÚN EL TIPO DE FEEDBACK

"no_llego" — dice que no alcanza el número.
  Si informó un valor que sí puede alcanzar y ese valor sigue dentro de la banda
  mínima del horizonte, usalo como nueva meta.
  Si el valor queda POR DEBAJO de la banda mínima, NO bajes la meta:
  EXTENDÉ EL HORIZONTE un escalón (trimestral→semestral→anual) y mantené el número.
  Esta preferencia es deliberada: bajar la meta enseña que las metas se negocian;
  extender el plazo enseña que se cumplen más lento.

"ya_hecho" — dice que ya lo hace.
  Si describió evidencia concreta, marcá logrado_retroactivo en true y proponé el
  ESCALÓN SIGUIENTE de la misma palanca, más ambicioso.
  Si no hay evidencia concreta, no marques nada: pedí específicamente qué documento
  o foto lo demostraría.

"no_aplica" — dice que no aplica a su negocio.
  Marcá retirar en true y proponé una alternativa del MISMO dominio ambiental,
  distinta en mecanismo.

"mas_tiempo" — pide más plazo.
  Subí el horizonte un escalón. La meta queda INTACTA. Recalculá la ambición.

"avance" — está reportando progreso.
  No cambies nada. Devolvé el objetivo igual y escribí una nota breve y sobria.

REGLAS QUE SIGUEN VALIENDO
- Esfuerzo máximo 6 h/mes.
- No proponer nada que exija inversión si el negocio declaró que no tiene presupuesto.
- No inventar números.
- Sin lenguaje motivacional. Un párrafo de análisis, no de aliento.

OBJETIVO ACTUAL (versión ${objetivo.version})
  ${j(objetivo)}

HISTORIAL DE FEEDBACK (del más viejo al más nuevo)
  ${j(checkins)}

FEEDBACK NUEVO
  Tipo: ${nuevo.tipo}
  Dijo: "${nuevo.mensaje}"
  Valor informado: ${nuevo.valor_reportado ?? '(no informó)'}

CONTEXTO DEL NEGOCIO
  ${j(dossier)}

Devolvé el JSON del esquema. En "respuesta", 2 o 3 frases dirigidas al negocio
explicando qué cambiaste y por qué: directo, sin adular, sin felicitar.`;
}

async function hash(valor: unknown): Promise<string> {
  const datos = new TextEncoder().encode(JSON.stringify(valor));
  const buf = await crypto.subtle.digest('SHA-256', datos);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const url = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const admin = createClient(url, serviceKey);

  try {
    const jwt = req.headers.get('Authorization')?.replace('Bearer ', '') ?? '';
    const { data: userData } = await admin.auth.getUser(jwt);
    if (!userData?.user) return json({ ok: false, error: 'no_autenticado' });

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const negocioId = typeof body.business_id === 'string' ? body.business_id : '';
    const modo = String(body.modo ?? 'generar');
    if (!/^[0-9a-f-]{36}$/.test(negocioId)) return json({ ok: false, error: 'error' });
    if (modo !== 'generar' && modo !== 'replanificar') return json({ ok: false, error: 'error' });

    // Con el JWT de la persona: `mejora_estado` comprueba la membresía en
    // Postgres y de paso trae los hechos del prompt.
    const comoPersona = createClient(url, anonKey, { global: { headers: { Authorization: `Bearer ${jwt}` } } });
    const { data: estado } = await comoPersona.rpc('mejora_estado', { p_business: negocioId });
    if (!estado) return json({ ok: false, error: 'sin_permiso' });

    const negocio = (estado as Record<string, unknown>).negocio as Record<string, unknown>;
    const dossier = (estado as Record<string, unknown>).dossier as Record<string, unknown> | null;
    if (!dossier) return json({ ok: false, error: 'sin_dossier' });

    const kind = modo === 'generar' ? 'objetivos' : 'replan';

    // Límite semanal por empresa (06 §1.3). Al llegar, la vía determinista
    // sigue disponible: por eso esto no es un error.
    const desde = new Date(Date.now() - 7 * 86_400_000).toISOString();
    const { count } = await admin
      .from('ai_jobs')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', negocioId)
      .eq('kind', kind)
      .eq('status', 'ok')
      .gte('created_at', desde);
    if ((count ?? 0) >= LIMITE_SEMANAL[kind]) return json({ ok: true, status: 'limite' });

    let prompt: string;
    let esquema: unknown;
    let entrada: unknown;

    if (modo === 'generar') {
      const palancas = Array.isArray(body.palancas) ? body.palancas : [];
      entrada = { negocio, dossier, palancas };
      prompt = promptGenerar(negocio, dossier, palancas);
      esquema = ESQUEMA_GENERAR;
    } else {
      const goalId = typeof body.goal_id === 'string' ? body.goal_id : '';
      const { data: detalle } = await comoPersona.rpc('objetivo_detalle', { p_goal: goalId });
      if (!detalle) return json({ ok: false, error: 'sin_permiso' });
      const d = detalle as Record<string, unknown>;
      const checkins = (d.checkins ?? []) as Record<string, unknown>[];
      const nuevo = checkins[checkins.length - 1] ?? {};
      entrada = { objetivo: d.objetivo, checkins, nuevo };
      prompt = promptReplan(d.objetivo as Record<string, unknown>, checkins.slice(0, -1), nuevo, dossier);
      esquema = ESQUEMA_REPLAN;
    }

    // Cache por hash del payload normalizado (06 §1.2, regla 1).
    const input_hash = await hash({ kind, negocioId, entrada });
    const { data: cacheado } = await admin
      .from('ai_jobs')
      .select('response, status')
      .eq('kind', kind)
      .eq('input_hash', input_hash)
      .maybeSingle();
    if (cacheado?.status === 'ok' && cacheado.response) {
      return json({ ok: true, status: 'cache', datos: cacheado.response });
    }

    try {
      const salida = await geminiJSON<Record<string, unknown>>([{ text: prompt }], {
        model: MODELO,
        timeoutMs: 25000,
        temperature: 0.3,
        responseSchema: esquema,
      });
      // upsert y no insert: `ai_jobs` tiene único (kind, input_hash), así que un
      // intento fallido anterior con el mismo payload ya dejó una fila.
      await admin.from('ai_jobs').upsert({
        kind,
        business_id: negocioId,
        input_hash,
        status: 'ok',
        modelo: MODELO,
        request: { prompt: prompt.slice(0, 8000) },
        response: salida,
      }, { onConflict: 'kind,input_hash' });
      return json({ ok: true, status: 'ok', datos: salida });
    } catch (e) {
      // Sin clave, sin respuesta o con JSON roto: el camino determinista da el
      // mismo resultado y la empresa no ve ningún error.
      await admin.from('ai_jobs').upsert({
        kind,
        business_id: negocioId,
        input_hash,
        status: e instanceof GeminiUnavailable ? 'fallback' : 'error',
        modelo: MODELO,
        request: { prompt: prompt.slice(0, 2000) },
        response: { motivo: e instanceof Error ? e.message : 'desconocido' },
      }, { onConflict: 'kind,input_hash' });
      return json({ ok: true, status: 'fallback' });
    }
  } catch (e) {
    console.error('business-goals', e);
    return json({ ok: true, status: 'fallback' });
  }
});
