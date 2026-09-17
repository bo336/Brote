import type { useTranslations } from 'next-intl';
import { METODOS_VERIFICACION } from '@/lib/negocio/catalogo';
import type { VerificationMethod, VerificationStatus } from '@/lib/supabase/rows-negocio';

type T = ReturnType<typeof useTranslations<'negocio'>>;

/** "hace 6 h", con las claves que ya usa la verificación. */
export function hace(t: T, iso: string | null, ahora: number): string {
  if (!iso) return '—';
  const min = Math.max(0, Math.floor((ahora - new Date(iso).getTime()) / 60_000));
  if (min < 1) return t('verificacion.hace.recien');
  if (min < 60) return t('verificacion.hace.min', { n: min });
  const h = Math.floor(min / 60);
  if (h < 48) return t('verificacion.hace.h', { n: h });
  return t('verificacion.hace.d', { n: Math.floor(h / 24) });
}

/** El estado de verificación como lo lee el revisor: método y fuerza, o qué falta. */
export function etiquetaVerificacion(
  t: T,
  v: { method: VerificationMethod; status: VerificationStatus; evidencia_url?: string | null } | null,
): { texto: string; tono: 'ok' | 'espera' | 'nada' | 'mal' } {
  if (!v) return { texto: t('panel.verif.ninguna'), tono: 'nada' };
  const metodo = t(`verificacion.metodos.${v.method}.nombre`);
  const fuerza = METODOS_VERIFICACION.find((m) => m.method === v.method)?.fuerza ?? 'media';
  if (v.status === 'verificado') {
    return { texto: t('panel.verif.verificado', { metodo, fuerza: t(`verificacion.${fuerza}`) }), tono: 'ok' };
  }
  if (v.method === 'social_token') return { texto: t('panel.verif.enRevision'), tono: 'espera' };
  if (v.status === 'fallido') return { texto: t('panel.verif.fallido', { metodo }), tono: 'mal' };
  return { texto: t('panel.verif.pendiente', { metodo }), tono: 'nada' };
}
