// verify-business (brote-negocios fase 1 §6.1)
//
// Chequea que quien dio de alta un negocio controla su sitio: etiqueta meta en
// la home, registro TXT (por DNS-over-HTTPS) o archivo en `.well-known`. El
// método de Instagram NO pasa por acá: la captura queda en revisión manual
// hasta la fase 2.
//
// También atiende dos pedidos del revisor desde `/panel/negocios/[id]`, con la
// contraseña del panel verificada en `admin_check`: probar si el sitio responde
// y firmar por 60 s la URL de una captura del bucket privado.
//
// NUNCA lanza. Toda falla técnica se traduce a un mensaje humano y accionable
// (fase 1 §6.2): la empresa jamás ve "fetch failed" ni un código HTTP.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.46.1';
import { corsHeaders, json } from '../_shared/cors.ts';

const UA = 'BroteVerify/1.0 (+https://brote-ft7m.vercel.app)';
const TIMEOUT_MS = 8000;
const MAX_REDIRECTS = 3;
const MAX_BYTES = 512_000;
const REINTENTO_MIN = 10;
const REINTENTOS_DIA = 20;
const AVISO_FALLIDOS = 3;

const METODOS = new Set(['dominio_meta', 'dominio_dns', 'dominio_archivo']);

// El mapa de la fase 1 §6.2, literal donde el documento lo da.
const MENSAJE = {
  sin_respuesta: 'No pudimos entrar a tu sitio. ¿Está andando? Probá abrirlo en otra pestaña.',
  sin_etiqueta:
    'Entramos a tu sitio pero no encontramos la etiqueta. Fijate que esté dentro del <head> y que hayas publicado los cambios.',
  no_existe: 'Esa dirección no existe. Revisá que el dominio esté bien escrito.',
  bloqueado: 'Tu sitio nos bloqueó el acceso. Probá con el método de DNS o con el archivo.',
  sin_txt: 'El registro TXT todavía no se ve. A veces tarda hasta 24 horas en propagarse.',
  archivo_distinto:
    'Encontramos el archivo, pero no tiene el código. Tiene que contener solo el código, sin nada más.',
  error_sitio: 'Tu sitio respondió con un error. Probá de nuevo en un rato, o usá el método de DNS.',
  limite: 'Llegaste al máximo de intentos de hoy. Mañana podés seguir.',
};

type Clave = keyof typeof MENSAJE;
type Chequeo = { ok: true } | { ok: false; clave: Clave; sitioCaido?: boolean };

class SinRespuesta extends Error {}

// ── Red, con cuidado ─────────────────────────────────────────────────────────

/**
 * Solo nombres de dominio públicos: nada de IPs literales, `localhost` ni
 * nombres internos. El destino lo escribe un usuario, así que sin esto la
 * función sería un proxy hacia adentro de la red donde corre.
 */
function hostSeguro(host: string): boolean {
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,63}$/.test(host)) return false;
  if (/(^|\.)(localhost|local|localdomain|internal|intranet|home\.arpa|lan)$/.test(host)) return false;
  return true;
}

/** Direcciones que no son internet: loopback, privadas, link-local, CGNAT, multicast, reservadas. */
function ipPrivada(ip: string): boolean {
  const v4 = ip.match(/^(?:::ffff:)?(\d+)\.(\d+)\.(\d+)\.(\d+)$/i);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    return (
      a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && (b === 168 || b === 0)) ||
      (a === 198 && (b === 18 || b === 19))
    );
  }
  const v6 = ip.toLowerCase();
  return v6 === '::' || v6 === '::1' || /^f[cd]/.test(v6) || /^fe[89ab]/.test(v6);
}

/**
 * Un dominio público que resuelve a una IP interna (`127.0.0.1.nip.io`) pasa
 * `hostSeguro`. Antes de cada salto se resuelve por DNS-over-HTTPS y se
 * rechaza si alguna respuesta es interna. No cierra un rebinding entre esta
 * consulta y el fetch, pero corta el caso fácil.
 */
async function resuelveAInternet(host: string): Promise<boolean> {
  for (const tipo of ['A', 'AAAA']) {
    try {
      const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(host)}&type=${tipo}`, {
        signal: AbortSignal.timeout(4000),
        headers: { Accept: 'application/dns-json' },
      });
      if (!res.ok) continue;
      const data = (await res.json()) as { Answer?: { type: number; data: string }[] };
      const ips = (data.Answer ?? []).filter((x) => x.type === 1 || x.type === 28).map((x) => x.data);
      if (ips.some(ipPrivada)) return false;
    } catch {
      // Sin DNS no hay a dónde ir: el fetch va a fallar solo y con su mensaje.
    }
  }
  return true;
}

async function leerLimitado(res: Response): Promise<string> {
  if (!res.body) return '';
  const reader = res.body.getReader();
  const partes: Uint8Array[] = [];
  let total = 0;
  while (total < MAX_BYTES) {
    const { done, value } = await reader.read();
    if (done || !value) break;
    partes.push(value);
    total += value.length;
  }
  await reader.cancel().catch(() => {});
  const buf = new Uint8Array(Math.min(total, MAX_BYTES));
  let off = 0;
  for (const p of partes) {
    const n = Math.min(p.length, buf.length - off);
    buf.set(p.subarray(0, n), off);
    off += n;
    if (off >= buf.length) break;
  }
  return new TextDecoder('utf-8', { fatal: false }).decode(buf);
}

/** GET siguiendo hasta 3 redirects, revalidando el host en cada salto. */
async function traer(url: string, opciones: { resolver?: boolean } = {}): Promise<{ status: number; cuerpo: string }> {
  const limite = AbortSignal.timeout(TIMEOUT_MS);
  let actual = new URL(url);
  for (let salto = 0; salto <= MAX_REDIRECTS; salto++) {
    if (!['https:', 'http:'].includes(actual.protocol) || !hostSeguro(actual.hostname)) throw new SinRespuesta('host');
    if (opciones.resolver !== false && !(await resuelveAInternet(actual.hostname))) throw new SinRespuesta('interna');
    let res: Response;
    try {
      res = await fetch(actual, {
        redirect: 'manual',
        signal: limite,
        headers: { 'User-Agent': UA, Accept: 'text/html,text/plain;q=0.9,*/*;q=0.5' },
      });
    } catch {
      throw new SinRespuesta('red');
    }
    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      await res.body?.cancel().catch(() => {});
      actual = new URL(res.headers.get('location')!, actual);
      continue;
    }
    const cuerpo = res.status === 200 ? await leerLimitado(res).catch(() => '') : '';
    if (res.status !== 200) await res.body?.cancel().catch(() => {});
    return { status: res.status, cuerpo };
  }
  throw new SinRespuesta('redirects');
}

/** Primero https; si no hay conexión, http (hay sitios chicos que todavía no tienen certificado). */
async function traerSitio(dominio: string, ruta: string): Promise<{ status: number; cuerpo: string }> {
  try {
    return await traer(`https://${dominio}${ruta}`);
  } catch (e) {
    if (!(e instanceof SinRespuesta)) throw e;
    return await traer(`http://${dominio}${ruta}`);
  }
}

function claveHttp(status: number, siNoExiste: Clave): Clave {
  if (status === 401 || status === 403 || status === 429) return 'bloqueado';
  if (status === 404 || status === 410) return siNoExiste;
  return 'error_sitio';
}

// ── Los tres métodos ─────────────────────────────────────────────────────────

/** `<meta name="brote-site-verification" content="TOKEN">`, comillas simples o dobles, atributos en cualquier orden. */
function tieneEtiqueta(html: string, token: string): boolean {
  const etiquetas = html.match(/<meta\b[^>]*>/gi) ?? [];
  return etiquetas.some((tag) => {
    const attrs: Record<string, string> = {};
    for (const m of tag.matchAll(/([a-z_:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/gi)) {
      attrs[m[1].toLowerCase()] = (m[2] ?? m[3] ?? m[4] ?? '').trim();
    }
    return (attrs.name ?? '').toLowerCase() === 'brote-site-verification' && attrs.content === token;
  });
}

async function chequearMeta(dominio: string, token: string): Promise<Chequeo> {
  try {
    const r = await traerSitio(dominio, '/');
    if (r.status !== 200) return { ok: false, clave: claveHttp(r.status, 'no_existe'), sitioCaido: r.status >= 500 };
    return tieneEtiqueta(r.cuerpo, token) ? { ok: true } : { ok: false, clave: 'sin_etiqueta' };
  } catch {
    return { ok: false, clave: 'sin_respuesta', sitioCaido: true };
  }
}

async function chequearArchivo(dominio: string, token: string): Promise<Chequeo> {
  try {
    const r = await traerSitio(dominio, '/.well-known/brote-verify.txt');
    if (r.status !== 200) return { ok: false, clave: claveHttp(r.status, 'no_existe'), sitioCaido: r.status >= 500 };
    const contenido = r.cuerpo.replace(/^﻿/, '').trim();
    return contenido === token || contenido.split(/\s+/).includes(token)
      ? { ok: true }
      : { ok: false, clave: 'archivo_distinto' };
  } catch {
    return { ok: false, clave: 'sin_respuesta', sitioCaido: true };
  }
}

async function chequearDns(dominio: string, token: string): Promise<Chequeo> {
  try {
    const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(dominio)}&type=TXT`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { Accept: 'application/dns-json' },
    });
    if (!res.ok) return { ok: false, clave: 'sin_txt' };
    const data = (await res.json()) as { Status?: number; Answer?: { type: number; data: string }[] };
    if (data.Status === 3) return { ok: false, clave: 'no_existe' };
    // Un TXT largo puede venir partido en varias cadenas entre comillas.
    const valores = (data.Answer ?? [])
      .filter((a) => a.type === 16)
      .map((a) => a.data.replace(/"\s*"/g, '').replace(/^"|"$/g, '').trim());
    return valores.includes(`brote-site-verification=${token}`) ? { ok: true } : { ok: false, clave: 'sin_txt' };
  } catch {
    return { ok: false, clave: 'sin_txt' };
  }
}

function hoyAR(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date());
}

// ── Handler ──────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const url = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const admin = createClient(url, serviceKey);

  try {
    const jwt = req.headers.get('Authorization')?.replace('Bearer ', '') ?? '';
    // La clave anon también es un JWT válido: acá hace falta una persona.
    const { data: userData } = await admin.auth.getUser(jwt);
    if (!userData?.user) return json({ ok: false, error: 'no_autenticado' });

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const negocioId = typeof body.business_id === 'string' ? body.business_id : '';
    if (!/^[0-9a-f-]{36}$/.test(negocioId)) return json({ ok: false, error: 'error' });

    // ── Pedidos del revisor ─────────────────────────────────────────────────
    if (body.action === 'sitio' || body.action === 'firmar') {
      const { data: autorizado } = await admin.rpc('admin_check', { p_pass: String(body.pass ?? '') });
      if (autorizado !== true) return json({ ok: false, error: 'no_autorizado' });

      if (body.action === 'firmar') {
        const ruta = String(body.path ?? '');
        if (!ruta.startsWith(`${negocioId}/`) || ruta.includes('..')) return json({ ok: false, error: 'error' });
        const { data } = await admin.storage.from('business-evidence').createSignedUrl(ruta, 60);
        return json({ ok: !!data?.signedUrl, url: data?.signedUrl ?? null });
      }

      const { data: b } = await admin.from('businesses').select('sitio_web').eq('id', negocioId).maybeSingle();
      const dominio = String(b?.sitio_web ?? '')
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/[/:?#].*$/, '');
      if (!dominio) return json({ ok: false, error: 'falta_sitio' });
      let estado: 'ok' | 'caido' = 'caido';
      try {
        const r = await traerSitio(dominio, '/');
        estado = r.status < 500 ? 'ok' : 'caido';
      } catch {
        estado = 'caido';
      }
      await admin
        .from('businesses')
        .update({ sitio_estado: estado, sitio_chequeado_at: new Date().toISOString() })
        .eq('id', negocioId);
      return json({ ok: true, sitio_estado: estado });
    }

    // ── Verificación pedida por el negocio ──────────────────────────────────
    const metodo = String(body.method ?? '');
    if (!METODOS.has(metodo)) return json({ ok: false, error: 'metodo_no_disponible' });

    // Con el JWT de la persona: `negocio_verificacion_preparar` chequea en
    // Postgres que sea owner o admin del negocio, y crea la fila si no existe.
    const comoPersona = createClient(url, anonKey, { global: { headers: { Authorization: `Bearer ${jwt}` } } });
    const { data: prep, error: prepError } = await comoPersona.rpc('negocio_verificacion_preparar', {
      p_business: negocioId,
      p_method: metodo,
    });
    if (prepError) return json({ ok: false, error: 'error' });
    const preparado = prep as { ok: boolean; error?: string; token?: string; target?: string };
    if (!preparado.ok || !preparado.token || !preparado.target) {
      return json({ ok: false, error: preparado.error ?? 'error' });
    }

    const { data: fila } = await admin
      .from('business_verifications')
      .select('id, status, intentos, intentos_dia, dia_intentos, ultimo_intento_at')
      .eq('business_id', negocioId)
      .eq('method', metodo)
      .single();
    if (!fila) return json({ ok: false, error: 'error' });
    if (fila.status === 'verificado') return json({ ok: true, status: 'verificado' });

    const hoy = hoyAR();
    const intentosHoy = fila.dia_intentos === hoy ? fila.intentos_dia : 0;
    if (intentosHoy >= REINTENTOS_DIA) return json({ ok: true, status: 'limite', mensaje: MENSAJE.limite });
    if (fila.ultimo_intento_at) {
      const pasaron = (Date.now() - new Date(fila.ultimo_intento_at).getTime()) / 60_000;
      if (pasaron < REINTENTO_MIN) {
        return json({ ok: true, status: 'esperar', reintentar_en_min: Math.ceil(REINTENTO_MIN - pasaron) });
      }
    }

    const dominio = preparado.target;
    const token = preparado.token;
    const resultado: Chequeo = !hostSeguro(dominio)
      ? { ok: false, clave: 'no_existe' }
      : metodo === 'dominio_meta'
        ? await chequearMeta(dominio, token)
        : metodo === 'dominio_dns'
          ? await chequearDns(dominio, token)
          : await chequearArchivo(dominio, token);

    const ahora = new Date().toISOString();
    const intentos = fila.intentos + 1;
    await admin
      .from('business_verifications')
      .update({
        status: resultado.ok ? 'verificado' : 'fallido',
        ultimo_error: resultado.ok ? null : MENSAJE[resultado.clave],
        verified_at: resultado.ok ? ahora : null,
        intentos,
        intentos_dia: intentosHoy + 1,
        dia_intentos: hoy,
        ultimo_intento_at: ahora,
      })
      .eq('id', fila.id);

    // Lo que se aprendió del sitio de paso alimenta el chip "sitio caído".
    if (metodo !== 'dominio_dns') {
      await admin
        .from('businesses')
        .update({ sitio_estado: !resultado.ok && resultado.sitioCaido ? 'caido' : 'ok', sitio_chequeado_at: ahora })
        .eq('id', negocioId);
    }

    const { data: negocio } = await admin.from('businesses').select('nombre_comercial').eq('id', negocioId).single();
    const nombre = negocio?.nombre_comercial ?? 'tu negocio';
    if (resultado.ok) {
      await admin.rpc('brote_negocio_notificar', {
        p_business: negocioId,
        p_titulo: `Verificamos ${nombre}`,
        p_cuerpo: `Confirmamos que controlás ${dominio}.`,
        p_url: '/negocio/verificacion',
      });
    } else if (intentos === AVISO_FALLIDOS) {
      await admin.rpc('brote_negocio_notificar', {
        p_business: negocioId,
        p_titulo: `La verificación de ${nombre} todavía no pasa`,
        p_cuerpo: MENSAJE[resultado.clave],
        p_url: '/negocio/verificacion',
      });
    }

    return resultado.ok
      ? json({ ok: true, status: 'verificado' })
      : json({ ok: true, status: 'fallido', mensaje: MENSAJE[resultado.clave] });
  } catch (e) {
    console.error('verify-business', e);
    return json({ ok: false, error: 'error' });
  }
});
