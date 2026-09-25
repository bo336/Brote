'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Pip } from '@/components/pip/Pip';
import { Jugador } from '@/components/academia/Jugador';
import { retomarSesion } from '@/lib/api/academia';
import { esFallo } from '@/lib/academia/modelo';
import { useJugada } from '@/lib/academia/jugada';

/**
 * La ruta del jugador.
 *
 * Los pasos NO se piden acá en el caso normal: los trajo `academia_empezar`
 * y volver a pedirlos empezando cobraría otra savia. Vienen del store, que
 * los guarda en `sessionStorage`.
 *
 * Si el store está vacío —F5, link, pestaña cerrada y vuelta— se rescata con
 * `academia_retomar`, que relee la sesión sin empezar nada, con las
 * correcciones de lo ya respondido. Perder una sesión por un F5 no es
 * aceptable.
 */
export default function SesionPage() {
  const t = useTranslations('arbol');
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const sesion = useJugada((s) => s.sesion);
  const restaurar = useJugada((s) => s.restaurar);
  const abrir = useJugada((s) => s.abrir);
  const [estado, setEstado] = useState<'buscando' | 'lista' | 'perdida'>('buscando');
  const [motivo, setMotivo] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let vivo = true;
    if (useJugada.getState().sesion?.intento_id === id || restaurar(id)) {
      setEstado('lista');
      return;
    }
    void (async () => {
      const r = await retomarSesion(id);
      if (!vivo) return;
      if (esFallo(r)) {
        setMotivo(r.mensaje ?? null);
        setEstado('perdida');
        return;
      }
      abrir(r);
      setEstado('lista');
    })();
    return () => {
      vivo = false;
    };
  }, [id, restaurar, abrir]);

  if (estado === 'buscando') {
    return (
      <div className="fixed inset-0 z-[45] flex flex-col items-center justify-center gap-3 bg-background">
        <Pip size={72} mood="happy" />
        <p className="text-small text-muted-foreground">{t('cargandoSesion')}</p>
      </div>
    );
  }

  if (estado === 'perdida' || !sesion || sesion.intento_id !== id) {
    return (
      <div className="fixed inset-0 z-[45] flex flex-col items-center justify-center bg-background px-6">
        <EmptyState
          pipMood="worried"
          title={t('sesionPerdida')}
          message={motivo ?? t('errorCuerpo')}
          action={
            <Button asChild variant="secondary">
              <Link href="/aprender">{t('volverAlArbol')}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return <Jugador sesion={sesion} />;
}
