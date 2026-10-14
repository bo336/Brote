'use client';

import { createClient } from '@/lib/supabase/client';

/**
 * Lo que la app cuenta de su propio uso (docs/LANZAMIENTO.md D9).
 *
 * Nada viaja por cada toque: las claves se juntan en memoria y salen de a un
 * envío cada 20 segundos, o cuando la pestaña se va a segundo plano. Cada envío
 * es UNA llamada a `registrar_uso`, que suma en `uso_diario` (persona × día ×
 * clave). No hay hora, ni página exacta, ni nada que alguien haya escrito.
 *
 * Claves:
 *   · `sec:<seccion>` — abrió esa parte de la app (una por vista).
 *   · `ev:<evento>`   — hizo algo que importa medir (activó avisos, instaló la
 *     app, llegó a tal paso del onboarding…). La base las ignora si la cuenta es
 *     de un chico.
 */

const SECCIONES: [RegExp, string][] = [
  [/^\/$/, 'inicio'],
  [/^\/acciones/, 'acciones'],
  [/^\/mundo/, 'mundo'],
  [/^\/aprender/, 'academia'],
  [/^\/feed/, 'plaza'],
  [/^\/buscar/, 'buscar'],
  [/^\/mercado/, 'mercado'],
  [/^\/ranking/, 'ranking'],
  [/^\/perfil\/ajustes/, 'ajustes'],
  [/^\/perfil/, 'perfil'],
  [/^\/proyectos/, 'proyectos'],
  [/^\/competencias/, 'competencias'],
  [/^\/notificaciones/, 'notificaciones'],
  [/^\/brote-plus/, 'brote_plus'],
  [/^\/negocio/, 'negocio'],
  [/^\/onboarding/, 'onboarding'],
];

export function seccionDe(pathname: string): string | null {
  // El panel no se mide: es del equipo, y mezclaría su uso con el de la gente.
  if (pathname.startsWith('/panel')) return null;
  for (const [re, s] of SECCIONES) if (re.test(pathname)) return s;
  return null;
}

const cola = new Map<string, number>();
let timer: ReturnType<typeof setTimeout> | null = null;
let enviando = false;

function sumar(clave: string, n = 1) {
  if (!/^(sec|ev):[a-z0-9_]{1,40}$/.test(clave)) return;
  cola.set(clave, (cola.get(clave) ?? 0) + n);
  if (!timer && typeof window !== 'undefined') timer = setTimeout(() => void enviar(), 20_000);
}

export function registrarSeccion(pathname: string) {
  const s = seccionDe(pathname);
  if (s) sumar(`sec:${s}`);
}

/** Un evento que importa medir. Nombre en minúsculas y guiones bajos. */
export function registrarEvento(nombre: string) {
  sumar(`ev:${nombre}`);
}

export function metaDispositivo(): Record<string, string | boolean> {
  if (typeof navigator === 'undefined') return {};
  const ua = navigator.userAgent;
  const sistema = /android/i.test(ua)
    ? 'android'
    : /iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1)
      ? 'ios'
      : /windows/i.test(ua)
        ? 'windows'
        : /macintosh|mac os/i.test(ua)
          ? 'mac'
          : /linux/i.test(ua)
            ? 'linux'
            : 'otro';
  const tablet = /ipad|tablet/i.test(ua) || (sistema === 'ios' && !/iphone|ipod/i.test(ua));
  const telefono = !tablet && /mobi|iphone|android/i.test(ua);
  const navegador = /samsungbrowser/i.test(ua)
    ? 'samsung'
    : /edg\//i.test(ua)
      ? 'edge'
      : /firefox|fxios/i.test(ua)
        ? 'firefox'
        : /chrome|crios/i.test(ua)
          ? 'chrome'
          : /safari/i.test(ua)
            ? 'safari'
            : 'otro';
  const instalada =
    typeof window !== 'undefined' &&
    (window.matchMedia?.('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true);
  return { plataforma: tablet ? 'tablet' : telefono ? 'telefono' : 'compu', sistema, navegador, instalada };
}

/**
 * Manda lo juntado. Con `alSalir` usa `fetch(..., { keepalive: true })` directo
 * contra PostgREST: es lo único que sobrevive a cerrar la pestaña, y el cliente
 * de Supabase no lo expone.
 */
export async function enviar(alSalir = false) {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  if (enviando || cola.size === 0) return;
  const claves = Object.fromEntries(cola);
  cola.clear();
  enviando = true;
  try {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;
    const cuerpo = { p_claves: claves, p_meta: metaDispositivo() };
    if (alSalir) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!url || !key) return;
      await fetch(`${url}/rest/v1/rpc/registrar_uso`, {
        method: 'POST',
        keepalive: true,
        headers: {
          'Content-Type': 'application/json',
          apikey: key,
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(cuerpo),
      });
    } else {
      await supabase.rpc('registrar_uso', cuerpo);
    }
  } catch {
    // La analítica nunca rompe nada: si falla, esa tanda se pierde.
  } finally {
    enviando = false;
  }
}
