'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Pip } from '@/components/pip/Pip';
import { Jugador } from '@/components/academia/Jugador';
import { fetchPendientes } from '@/lib/api/academia';
import { esFallo, type Sesion } from '@/lib/academia/types';
import { useJugada } from '@/lib/academia/sesion-store';

/**
 * La ruta del jugador.
 *
 * Los pasos NO se piden acá en el caso normal: los trajo `academia_start_session`
 * cuando se apretó "empezar", y volver a llamarlo cobraría otra savia. Vienen
 * del store, que los guarda en `sessionStorage`.
 *
 * Si el store está vacío —se recargó la página, se llegó por link, se cerró la
 * pestaña y se volvió— se rescata con `academia_pendientes`, que relee una
 * sesión existente sin empezar nada y sin cobrar. Perder una hoja del día por
 * un F5 no es aceptable.
 */
export default function SesionPage() {
  const t = useTranslations('academia');
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const router = useRouter();

  const sesion = useJugada((s) => s.sesion);
  const restaurar = useJugada((s) => s.restaurar);
  const abrir = useJugada((s) => s.abrir);
  const [estado, setEstado] = useState<'buscando' | 'lista' | 'perdida'>('buscando');
  const [motivo, setMotivo] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let vivo = true;

    if (sesion?.sesion_id === id || restaurar(id)) {
      setEstado('lista');
      return;
    }

    void (async () => {
      const r = await fetchPendientes(id);
      if (!vivo) return;
      if (esFallo(r)) {
        setMotivo(r.mensaje ?? null);
        setEstado('perdida');
        return;
      }
      if (r.pasos.length === 0) {
        // Todo respondido y sin cerrar: no hay nada que jugar, pero la sesión
        // sigue abierta. El jugador la cierra en el primer "continuar".
        abrir(r as Sesion);
        setEstado('lista');
        return;
      }
      abrir(r as Sesion);
      setEstado('lista');
    })();

    return () => {
      vivo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (estado === 'buscando') {
    return (
      <div className="fixed inset-0 z-[45] flex flex-col items-center justify-center gap-3 bg-background">
        <Pip size={72} mood="happy" animate />
        <p className="text-small text-muted-foreground">{t('cargandoSesion')}</p>
      </div>
    );
  }

  if (estado === 'perdida' || !sesion) {
    return (
      <div className="fixed inset-0 z-[45] flex flex-col items-center justify-center bg-background px-6">
        <EmptyState
          pipMood="worried"
          title={t('sesionRota')}
          message={motivo ?? t('errorCuerpo')}
          action={
            <Button asChild variant="secondary" onClick={() => router.replace('/aprender')}>
              <Link href="/aprender">{t('volverAlBosque')}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return <Jugador sesion={sesion} />;
}
