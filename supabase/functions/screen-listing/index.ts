// screen-listing (brote-negocios fase 3 §6.1)
//
// El screener de IA de un listado, con el prompt de `06_PROMPTS_IA.md` §4
// literal. Corre DESPUÉS del validador determinista (`lib/mercado/validador.ts`),
// nunca en lugar de él, y NO DECIDE NADA: puntúa, sugiere y explica. El nivel
// real lo calcula la base desde la evidencia efectiva (`brote_claim_nivel`); si
// la IA dice E3 y no hay número de certificado, es E2. La base gana siempre.
//
// Guarda el resultado en `listings.screening_ia`. Sin clave, con Gemini caído,
// con JSON roto o con el límite diario alcanzado, guarda `por: 'reglas'` y el
// revisor ve "Revisado solo por reglas — sin análisis automático.": nunca un
// error. Lo que sugiere para la empresa (`texto_sugerido`) no pisa el texto
// comercial: lo publicado es lo que la empresa aprobó (08 §6).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.46.1';
import { corsHeaders, json } from '../_shared/cors.ts';
import { GeminiUnavailable, geminiJSON } from '../_shared/gemini.ts';

const MODELO = 'gemini-2.5-flash';
const LIMITE_DIA = 20;
const SOLO_REGLAS = 'Revisado solo por reglas — sin análisis automático.';

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

const ESQUEMA = {
  type: 'object',
  properties: {
    puntaje: { type: 'number' },
    recomendacion: { type: 'string', enum: ['publicar', 'publicar_con_cambios', 'pedir_correccion', 'rechazar'] },
    resumen: { type: 'string' },
    afirmaciones: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          claim_id: { type: 'string' },
          nivel_sugerido: { type: 'string', enum: ['e1', 'e2', 'e3', 'rechazar'] },
          problemas: { type: 'array', items: { type: 'string' } },
          calificador_faltante: { type: 'string', nullable: true },
          texto_sugerido: { type: 'string' },
          alcance_real: { type: 'string' },
        },
        required: ['claim_id', 'nivel_sugerido', 'problemas', 'texto_sugerido', 'alcance_real'],
      },
    },
    banderas_texto: { type: 'array', items: { type: 'string' } },
    riesgo_greenwashing: { type: 'string', enum: ['bajo', 'medio', 'alto'] },
    nota_al_revisor: { type: 'string' },
  },
  required: ['puntaje', 'recomendacion', 'resumen', 'afirmaciones', 'banderas_texto', 'riesgo_greenwashing', 'nota_al_revisor'],
};

interface Entrada {
  titulo: string;
  tipo: string;
  descripcion: string;
  categoria: string;
  url_destino: string;
  afirmaciones: unknown[];
  nombre: string;
  rubro: string;
  tier: string;
  metodo: string;
  fuerza: string;
}

function prompt(e: Entrada): string {
  return `${PREAMBULO}

TU TAREA
Revisar un listado de producto o servicio antes de que se publique, y evaluar cada
afirmación ambiental que trae.

EL MARCO DE EVALUACIÓN
Usás los criterios de los FTC Green Guides y de la norma ISO 14021 sobre
autodeclaraciones ambientales. Lo esencial:

- Una afirmación ambiental general y sin calificar ("eco", "verde", "sustentable",
  "amigable con el ambiente", "natural") NO ES ACEPTABLE. Tiene que ser específica.
- "Reciclable" necesita decir DÓNDE se recicla si no hay recolección diferenciada
  disponible para la mayoría de la gente en esa zona.
- "Biodegradable" exige descomposición completa en un plazo declarado, y ese plazo
  tiene que ser razonable (referencia: un año).
- "Contenido reciclado" exige el PORCENTAJE.
- "Libre de X" solo vale si X está en trazas, si no fue agregado a propósito, y si no
  hay otra sustancia de riesgo equivalente ocupando su lugar.
- "Compostable" exige aclarar si es compostaje domiciliario o industrial.
- "Energía renovable" exige que casi toda la producción la use, y decir cuál.
- "Reducción" exige decir contra qué se compara.
- Una certificación de tercero necesita quién certifica, número y vigencia. Un sello
  sin eso no vale más que una autodeclaración.
- Una certificación que cubre un insumo NO cubre todo el producto, y NO cubre otros
  productos de la misma marca. Esto es lo que más se abusa: marcalo siempre.

QUÉ NO TENÉS QUE HACER
- No juzgues si el producto es bueno o si el precio es razonable.
- No inventes lo que la evidencia diría. Evaluás lo que ESTÁ, no lo que podría estar.
- No rechaces por ser un negocio chico o sin certificaciones. La falta de certificación
  significa nivel declarado, no rechazo.

LISTADO
  Título: ${e.titulo}
  Tipo: ${e.tipo}
  Descripción: ${e.descripcion}
  Categoría: ${e.categoria}
  Destino: ${e.url_destino}

AFIRMACIONES DECLARADAS
  ${JSON.stringify(e.afirmaciones)}

CONTEXTO DEL NEGOCIO
  Nombre: ${e.nombre} · Rubro: ${e.rubro} · Nivel actual: ${e.tier}
  Verificación de identidad: ${e.metodo} (${e.fuerza})

DEVOLVÉ ESTE JSON
{
  "puntaje": número de 0 a 100,
  "recomendacion": "publicar|publicar_con_cambios|pedir_correccion|rechazar",
  "resumen": "una sola frase para el revisor, la que lee primero",
  "afirmaciones": [{
    "claim_id": "el id que vino en la entrada",
    "nivel_sugerido": "e1|e2|e3|rechazar",
    "problemas": ["qué falta o qué está mal, concreto"],
    "calificador_faltante": "el texto exacto que habría que agregar, o null",
    "texto_sugerido": "cómo debería quedar redactada la afirmación",
    "alcance_real": "a qué parte del producto aplica de verdad esta afirmación"
  }],
  "banderas_texto": ["frases del título o la descripción que son afirmaciones vagas o absolutas"],
  "riesgo_greenwashing": "bajo|medio|alto",
  "nota_al_revisor": "lo único que mirarías si tuvieras 20 segundos"
}`;
}

async function hash(valor: unknown): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(valor)));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

const texto = (v: unknown, max = 600) => (typeof v === 'string' ? v.slice(0, max) : '');
const lista = (v: unknown, max = 8) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string').slice(0, max).map((x) => x.slice(0, 300)) : []);

/**
 * La forma de la respuesta, validada antes de guardarla (06 §1.2, regla 5):
 * enums conocidos, números en rango, y solo afirmaciones que ESTÁN en el
 * listado. Lo que no cierra se descarta.
 */
function sanear(s: Record<string, unknown>, ids: Set<string>) {
  const recomendaciones = ['publicar', 'publicar_con_cambios', 'pedir_correccion', 'rechazar'];
  const riesgos = ['bajo', 'medio', 'alto'];
  const niveles = ['e1', 'e2', 'e3', 'rechazar'];
  const puntaje = Number(s.puntaje);
  const afirmaciones = (Array.isArray(s.afirmaciones) ? s.afirmaciones : [])
    .filter((a): a is Record<string, unknown> => !!a && typeof a === 'object' && ids.has(String((a as Record<string, unknown>).claim_id)))
    .map((a) => ({
      claim_id: String(a.claim_id),
      nivel_sugerido: niveles.includes(String(a.nivel_sugerido)) ? String(a.nivel_sugerido) : 'rechazar',
      problemas: lista(a.problemas),
      calificador_faltante: typeof a.calificador_faltante === 'string' ? a.calificador_faltante.slice(0, 300) : null,
      texto_sugerido: texto(a.texto_sugerido, 400),
      alcance_real: texto(a.alcance_real, 200),
    }));
  return {
    por: 'ia' as const,
    puntaje: Number.isFinite(puntaje) ? Math.max(0, Math.min(100, Math.round(puntaje))) : 0,
    recomendacion: recomendaciones.includes(String(s.recomendacion)) ? String(s.recomendacion) : 'pedir_correccion',
    resumen: texto(s.resumen, 300),
    afirmaciones,
    banderas_texto: lista(s.banderas_texto, 12),
    riesgo_greenwashing: riesgos.includes(String(s.riesgo_greenwashing)) ? String(s.riesgo_greenwashing) : 'alto',
    nota_al_revisor: texto(s.nota_al_revisor, 400),
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const url = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const admin = createClient(url, serviceKey);

  let listingId = '';
  const soloReglas = async (motivo: string) => {
    if (listingId) {
      await admin.from('listings')
        .update({ screening_ia: { por: 'reglas', nota: SOLO_REGLAS, motivo, at: new Date().toISOString() } })
        .eq('id', listingId);
    }
    return json({ ok: true, status: 'reglas' });
  };

  try {
    const jwt = req.headers.get('Authorization')?.replace('Bearer ', '') ?? '';
    const { data: userData } = await admin.auth.getUser(jwt);
    if (!userData?.user) return json({ ok: false, error: 'no_autenticado' });

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const id = typeof body.listing_id === 'string' ? body.listing_id : '';
    if (!/^[0-9a-f-]{36}$/.test(id)) return json({ ok: false, error: 'error' });

    // Con el JWT de la persona: `listado_detalle` comprueba la membresía en
    // Postgres y devuelve el listado con sus afirmaciones.
    const comoPersona = createClient(url, anonKey, { global: { headers: { Authorization: `Bearer ${jwt}` } } });
    const { data: detalle } = await comoPersona.rpc('listado_detalle', { p_listing: id });
    if (!detalle) return json({ ok: false, error: 'sin_permiso' });
    listingId = id;

    const d = detalle as Record<string, any>;
    const l = d.listado as Record<string, any>;
    if (!['draft', 'despublicado'].includes(l.status)) return json({ ok: false, error: 'no_enviable' });

    const { data: negocio } = await admin.from('businesses').select('id, nombre_comercial, rubro, tier').eq('id', l.business_id).single();
    if (!negocio) return json({ ok: false, error: 'error' });
    const { data: verif } = await admin.from('business_verifications')
      .select('method').eq('business_id', l.business_id).eq('status', 'verificado');
    const metodos = (verif ?? []).map((v: { method: string }) => v.method);
    const fuerte = metodos.some((m: string) => ['dominio_meta', 'dominio_dns', 'dominio_archivo', 'email_dominio'].includes(m));

    const afirmaciones = (d.afirmaciones as Record<string, any>[]).map((c) => ({
      claim_id: c.id, tipo: c.kind, alcance: c.alcance, datos: c.datos, texto: c.enunciado,
      certificacion: c.cert ? { nombre: c.cert.nombre, emisor: c.cert.emisor, numero: c.cert_numero, vence: c.cert_vence } : null,
      tiene_documento: !!c.evidencia, estado: c.status,
    }));
    const entrada: Entrada = {
      titulo: l.titulo, tipo: l.tipo, descripcion: l.descripcion, categoria: l.categoria, url_destino: l.url_destino,
      afirmaciones, nombre: negocio.nombre_comercial, rubro: negocio.rubro, tier: negocio.tier,
      metodo: metodos.join(', ') || 'ninguna', fuerza: fuerte ? 'fuerte' : metodos.length ? 'media' : 'sin verificar',
    };

    // Cache por hash del payload normalizado (06 §1.2, regla 1).
    const input_hash = await hash({ kind: 'listado', entrada });
    const { data: cacheado } = await admin.from('ai_jobs').select('response, status')
      .eq('kind', 'listado').eq('input_hash', input_hash).maybeSingle();
    const ids = new Set(afirmaciones.map((a) => String(a.claim_id)));
    if (cacheado?.status === 'ok' && cacheado.response) {
      const s = sanear(cacheado.response as Record<string, unknown>, ids);
      await admin.from('listings').update({ screening_ia: { ...s, modelo: MODELO, at: new Date().toISOString(), cache: true } }).eq('id', id);
      return json({ ok: true, status: 'cache' });
    }

    // Límite diario por empresa (06 §1.3). Al llegar, sigue el camino de reglas.
    const desde = new Date(Date.now() - 86_400_000).toISOString();
    const { count } = await admin.from('ai_jobs').select('id', { count: 'exact', head: true })
      .eq('business_id', l.business_id).eq('kind', 'listado').eq('status', 'ok').gte('created_at', desde);
    if ((count ?? 0) >= LIMITE_DIA) return await soloReglas('limite');

    const p = prompt(entrada);
    try {
      const salida = await geminiJSON<Record<string, unknown>>([{ text: p }], {
        model: MODELO, timeoutMs: 25000, temperature: 0.2, responseSchema: ESQUEMA,
      });
      const s = sanear(salida, ids);
      await admin.from('ai_jobs').upsert({
        kind: 'listado', business_id: l.business_id, input_hash, status: 'ok', modelo: MODELO,
        request: { prompt: p.slice(0, 8000) }, response: salida,
      }, { onConflict: 'kind,input_hash' });
      await admin.from('listings').update({ screening_ia: { ...s, modelo: MODELO, at: new Date().toISOString() } }).eq('id', id);
      return json({ ok: true, status: 'ok' });
    } catch (e) {
      await admin.from('ai_jobs').upsert({
        kind: 'listado', business_id: l.business_id, input_hash,
        status: e instanceof GeminiUnavailable ? 'fallback' : 'error', modelo: MODELO,
        request: { prompt: p.slice(0, 2000) }, response: { motivo: e instanceof Error ? e.message : 'desconocido' },
      }, { onConflict: 'kind,input_hash' });
      return await soloReglas(e instanceof GeminiUnavailable ? e.message : 'error');
    }
  } catch (e) {
    console.error('screen-listing', e);
    return await soloReglas('error');
  }
});
