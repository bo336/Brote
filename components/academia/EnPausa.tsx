'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

/**
 * La Academia apagada por bandera (`app_settings.academia_enabled = false`).
 *
 * Es el interruptor de emergencia de la sección, y tiene que verse como una
 * pausa y no como una app rota: sin botón de reintentar —reintentar no la va a
 * encender— y con una salida a algo que sí funciona.
 *
 * NO cae a la pantalla vieja de lecciones: esa se retiró en la fase 2 junto con
 * su reproductor. Lo que queda intacto del camino viejo son las tablas y los
 * RPC (`lessons`, `learning_path()`, `lesson_detail()`, `complete_lesson()`),
 * que es lo que no se puede recuperar con un `git revert`.
 */
export function EnPausa({ mensaje }: { mensaje?: string | null }) {
  const t = useTranslations('academia');
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
