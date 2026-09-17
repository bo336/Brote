'use client';

import { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useToastStore } from '@/stores/toast';

/**
 * El toast para quien escribió `/negocio/…` a mano desde una cuenta de menor
 * y fue devuelto a Hoy con `?aviso=negocios` (fase 1 §3.3). Muestra el aviso
 * una vez y limpia la URL, así un refresco no lo repite.
 */
export function AvisoNegocioMenor() {
  const t = useTranslations('negocio.avisoMenores');
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const aviso = params.get('aviso');

  useEffect(() => {
    if (aviso !== 'negocios') return;
    useToastStore.getState().push({ variant: 'warning', title: t('titulo'), description: t('cuerpo') });
    const resto = new URLSearchParams(params.toString());
    resto.delete('aviso');
    const qs = resto.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aviso]);

  return null;
}
