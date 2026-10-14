'use client';

import { createClient } from '@/lib/supabase/client';
import { registrarEvento } from '@/lib/analitica';

/**
 * Web Push del lado de la app (docs/LANZAMIENTO.md F3).
 *
 * La clave pública VAPID sale de la base (`brote_push_clave_publica`, que
 * escribe `send-push`): así la app se suscribe SIEMPRE con la misma clave con
 * la que después se manda, haya o no secretos configurados. La variable de
 * entorno queda como respaldo para el primer minuto de un proyecto nuevo.
 *
 * El dispositivo se registra con `registrar_dispositivo`, que lo pasa a la
 * cuenta que lo usa ahora (un teléfono que cambió de cuenta seguía avisándole a
 * la anterior).
 */

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function igualesBytes(a: ArrayBuffer | null | undefined, b: Uint8Array): boolean {
  if (!a) return false;
  const x = new Uint8Array(a);
  if (x.length !== b.length) return false;
  for (let i = 0; i < x.length; i++) if (x[i] !== b[i]) return false;
  return true;
}

async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null;
  try {
    // `ready` nunca resuelve si no hay service worker (en desarrollo no se
    // registra): no esperar para siempre.
    return await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<null>((r) => setTimeout(() => r(null), 4000)),
    ]);
  } catch {
    return null;
  }
}

let claveCache: string | null = null;
async function clavePublica(): Promise<string | null> {
  if (claveCache) return claveCache;
  try {
    const { data } = await createClient().rpc('brote_push_clave_publica');
    if (typeof data === 'string' && data.length > 40) {
      claveCache = data;
      return data;
    }
  } catch {
    /* respaldo abajo */
  }
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null;
}

export function pushSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

/** iPhone/iPad fuera de la app instalada: Safari sólo deja avisar a apps en la pantalla de inicio. */
export function iosSinInstalar(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (/macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
  const instalada =
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return ios && !instalada;
}

export function permisoAvisos(): NotificationPermission | 'no_soportado' {
  if (!pushSupported()) return 'no_soportado';
  return Notification.permission;
}

export async function isPushSubscribed(): Promise<boolean> {
  const reg = await getRegistration();
  return !!(await reg?.pushManager.getSubscription());
}

async function guardar(sub: PushSubscription): Promise<{ ok: boolean; error?: string }> {
  const json = sub.toJSON();
  const { data, error } = await createClient().rpc('registrar_dispositivo', {
    p_endpoint: sub.endpoint,
    p_p256dh: json.keys?.p256dh ?? '',
    p_auth: json.keys?.auth ?? '',
  });
  if (error) return { ok: false, error: error.message };
  const r = data as { ok?: boolean; error?: string } | null;
  return r?.ok ? { ok: true } : { ok: false, error: r?.error ?? 'No se pudo guardar el dispositivo.' };
}

/** Suscribe este dispositivo (pide permiso si hace falta). */
export async function subscribeToPush(_userId?: string): Promise<{ ok: boolean; error?: string }> {
  if (!pushSupported()) {
    return {
      ok: false,
      error: iosSinInstalar()
        ? 'En iPhone los avisos funcionan con Brote instalado en la pantalla de inicio.'
        : 'Este navegador no permite avisos.',
    };
  }
  const key = await clavePublica();
  if (!key) return { ok: false, error: 'Los avisos se están preparando. Probá de nuevo en un minuto.' };
  const reg = await getRegistration();
  if (!reg) return { ok: false, error: 'Recargá la página y probá de nuevo.' };

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    registrarEvento('avisos_rechazados');
    return {
      ok: false,
      error:
        permission === 'denied'
          ? 'Los avisos están bloqueados para Brote en este navegador. Habilitalos desde el candado de la barra de direcciones.'
          : 'No diste permiso para los avisos.',
    };
  }

  const llave = urlBase64ToUint8Array(key);
  let sub = await reg.pushManager.getSubscription();
  // Suscripto con otra clave (se generó una nueva): hay que rehacerla.
  if (sub && !igualesBytes(sub.options?.applicationServerKey, llave)) {
    await sub.unsubscribe().catch(() => null);
    sub = null;
  }
  if (!sub) {
    try {
      sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: llave as BufferSource });
    } catch {
      return { ok: false, error: 'El navegador no aceptó la suscripción. Probá de nuevo.' };
    }
  }
  const r = await guardar(sub);
  if (r.ok) registrarEvento('avisos_activados');
  return r;
}

/**
 * Al abrir la app, sin preguntar nada: si ya hay permiso, que la suscripción
 * exista, use la clave vigente y esté a nombre de esta cuenta. Repara solo lo
 * que rompen un cambio de clave, un navegador que la dio de baja o un cambio
 * de cuenta en el mismo teléfono.
 */
export async function asegurarAvisos(): Promise<void> {
  try {
    if (!pushSupported() || Notification.permission !== 'granted') return;
    const ultima = Number(localStorage.getItem('brote-avisos-sync') ?? 0);
    if (Date.now() - ultima < 6 * 60 * 60 * 1000) return;
    const r = await subscribeToPush();
    if (r.ok) localStorage.setItem('brote-avisos-sync', String(Date.now()));
  } catch {
    /* nunca rompe la carga */
  }
}

export async function unsubscribeFromPush(): Promise<void> {
  const reg = await getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (sub) {
    await createClient().from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
    await sub.unsubscribe();
  }
  try {
    localStorage.removeItem('brote-avisos-sync');
  } catch {
    /* nada */
  }
}

/** Manda un aviso de prueba a esta cuenta (sale en menos de un minuto). */
export async function probarAviso(): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await createClient().rpc('mis_avisos_probar');
  if (error) return { ok: false, error: error.message };
  return data as { ok: boolean; error?: string };
}
