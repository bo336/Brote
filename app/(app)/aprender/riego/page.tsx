'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Pip } from '@/components/pip/Pip';
import { empezarRiego } from '@/lib/api/academia';
import { esFallo } from '@/lib/academia/types';
import { useJugada } from '@/lib/academia/sesion-store';
import { haptic } from '@/lib/utils/haptics';

/**
 * El riego: un repaso corto de lo que se está apagando.
 *
 * GRATIS, siempre, y por una razón de diseño y no de generosidad: el limitador
 * de la Academia frena territorio NUEVO, nunca la retención. Cobrar por repasar
 * sería castigar exactamente lo que hace que aprender sirva de algo.
 *
 * Esta ruta no dibuja nada propio: arranca la sesión y se va al jugador. Es un
 * botón con URL, y existe para que la lista de marchitos del bosque y la
 * pantalla de savia vacía tengan a dónde apuntar.
 */
export default function RiegoPage() {
  const t = useTranslations('academia');
  const router = useRouter();
  const qc = useQueryClient();
  const abrir = useJugada((s) => s.abrir);
  const arrancado = useRef(false);
  const [vacio, setVacio] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (arrancado.current) return;
    arrancado.current = true;

    void (async () => {
      const r = await empezarRiego();
      if (esFallo(r)) {
        // `sin_contenido` no es una falla: es que no hay nada por regar, que es
        // una buena noticia y se cuenta como tal.
        if (r.error === 'sin_contenido') return setVacio(true);
        setError(r.mensaje ?? r.error);
        return;
      }
      if (r.pasos.length === 0) return setVacio(true);

      abrir(r);
      qc.invalidateQueries({ queryKey: ['academia'] });
      haptic('medium');
      router.replace(`/aprender/sesion/${r.sesion_id}`);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (vacio) {
    return (
      <EmptyState
        pipMood="happy"
        title={t('riegoVacioTitulo')}
        message={t('riegoVacioCuerpo')}
        action={
          <Button asChild variant="secondary">
            <Link href="/aprender">{t('volverAlBosque')}</Link>
          </Button>
        }
      />
    );
  }

  if (error) {
    return (
      <EmptyState
        pipMood="worried"
        title={t('errorTitulo')}
        message={error}
        action={
          <Button asChild variant="secondary">
            <Link href="/aprender">{t('volverAlBosque')}</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <Pip size={72} mood="happy" animate />
      <p className="text-small text-muted-foreground">{t('riegoSub')}</p>
    </div>
  );
}
