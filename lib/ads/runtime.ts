'use client';

import { createClient } from '@/lib/supabase/client';
import type { Placement } from './policy';

/**
 * Lo que la publicidad necesita del navegador (Publicidad v2, 0134):
 * cargar AdSense una sola vez y recién cuando hace falta, contar cuántos
 * anuncios vio la persona (hoy y en esta sesión) y reportar las métricas en
 * tandas. Nada de esto puede romper una pantalla: todo falla en silencio.
 */

export const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? '';

/** Ids de los bloques de anuncios de AdSense, uno por ubicación (variables de Vercel). */
export const SLOT_IDS: Record<Placement, string | undefined> = {
  'news-feed': process.env.NEXT_PUBLIC_ADSLOT_NEWS_FEED,
  'news-article': process.env.NEXT_PUBLIC_ADSLOT_NEWS_ARTICLE,
  'ranking-footer': process.env.NEXT_PUBLIC_ADSLOT_RANKING,
  'catalog-footer': process.env.NEXT_PUBLIC_ADSLOT_CATALOG,
  guia: process.env.NEXT_PUBLIC_ADSLOT_GUIA ?? process.env.NEXT_PUBLIC_ADSLOT_NEWS_ARTICLE,
  moment: undefined, // nunca AdSense (política de anuncios flotantes)
};

export function adsenseListo(p: Placement): boolean {
  return !!ADSENSE_CLIENT && !!SLOT_IDS[p];
}

// ── Cargar AdSense una vez ──────────────────────────────────────────────────

type VentanaAds = Window & { adsbygoogle?: unknown[] & { requestNonPersonalizedAds?: number; pauseAdRequests?: number } };

let promesa: Promise<boolean> | null = null;

/**
 * Inserta el script de AdSense la primera vez que un espacio está por verse.
 * Quien nunca llega a un espacio con anuncio (Brote+, chicos, quien sólo usa
 * Inicio y Tu mundo) nunca descarga el script.
 */
export function cargarAdsense(personalizado: boolean): Promise<boolean> {
  if (typeof window === 'undefined' || !ADSENSE_CLIENT) return Promise.resolve(false);
  const w = window as VentanaAds;
  w.adsbygoogle = w.adsbygoogle || ([] as unknown as VentanaAds['adsbygoogle']);
  // Pedir no personalizados ANTES de cargar, salvo consentimiento explícito.
  if (!personalizado) w.adsbygoogle!.requestNonPersonalizedAds = 1;
  if (promesa) return promesa;
  promesa = new Promise<boolean>((resolve) => {
    if (document.querySelector('script[data-brote-adsense]')) return resolve(true);
    const s = document.createElement('script');
    s.async = true;
    s.crossOrigin = 'anonymous';
    s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
    s.setAttribute('data-brote-adsense', '1');
    s.onload = () => resolve(true);
    // Bloqueador de anuncios o sin red: los espacios se pliegan solos.
    s.onerror = () => resolve(false);
    document.head.appendChild(s);
  });
  return promesa;
}

// ── Contadores para los topes ───────────────────────────────────────────────

const CLAVE_DIA = 'brote.ads.dia.v2';
const CLAVE_SESION = 'brote.ads.sesion.v2';

function hoy(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
}

export function leerContadores(): { hoy: number; sesion: number } {
  try {
    const d = JSON.parse(localStorage.getItem(CLAVE_DIA) ?? '{}') as { dia?: string; n?: number };
    const s = Number(sessionStorage.getItem(CLAVE_SESION) ?? 0);
    return { hoy: d.dia === hoy() ? (d.n ?? 0) : 0, sesion: Number.isFinite(s) ? s : 0 };
  } catch {
    // Sin almacenamiento: se cuenta como "ya vio muchos" para no pasarse nunca.
    return { hoy: 999, sesion: 999 };
  }
}

/** Suma un anuncio mostrado. Devuelve los contadores nuevos. */
export function contarAnuncio(): { hoy: number; sesion: number } {
  const c = leerContadores();
  try {
    localStorage.setItem(CLAVE_DIA, JSON.stringify({ dia: hoy(), n: c.hoy + 1 }));
    sessionStorage.setItem(CLAVE_SESION, String(c.sesion + 1));
  } catch {
    /* nada */
  }
  return { hoy: c.hoy + 1, sesion: c.sesion + 1 };
}

// ── Métricas, en tandas ─────────────────────────────────────────────────────

type Evento = { u: Placement; p: 'adsense' | 'directo'; e: 'pedido' | 'lleno' | 'vacio' | 'impresion'; a?: string };

const cola: Evento[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;

/** Anota un evento; sale con los demás cada 30 s o al ocultar la pestaña. */
export function registrarAnuncio(ev: Evento) {
  if (cola.length >= 60) return;
  cola.push(ev);
  if (!timer && typeof window !== 'undefined') timer = setTimeout(() => void enviarMetricas(), 30_000);
}

export async function enviarMetricas() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  if (cola.length === 0) return;
  const lote = cola.splice(0, 30);
  try {
    await createClient().rpc('publicidad_registrar', { p_eventos: lote });
  } catch {
    /* se pierde la tanda: son métricas, no plata */
  }
  if (cola.length) timer = setTimeout(() => void enviarMetricas(), 5_000);
}
