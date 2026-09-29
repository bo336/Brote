'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

/**
 * La Academia apagada por bandera (`app_settings.academia_enabled = false`).
 *
 * Es el interruptor de emergencia de la sección y tiene que verse como una
 * pausa, no como una app rota: sin botón de reintentar —reintentar no la va a
 * encender— y con una salida a algo que sí funciona.
 */
export function EnPausa({ mensaje }: { mensaje?: string | null }) {
  const t = useTranslations('arbol');
  return (
    <EmptyState
      pipMood="sleepy"
      title={t('pausaTitulo')}
      message={mensaje ?? t('pausaCuerpo')}
      action={
        <Button asChild variant="secondary">
          <Link href="/acciones">{t('saviaAccionCta')}</Link>
        </Button>
      }
    />
  );
}
