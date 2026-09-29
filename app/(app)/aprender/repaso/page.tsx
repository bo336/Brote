'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Pip } from '@/components/pip/Pip';
import { empezarRepaso } from '@/lib/api/academia';
import { esFallo } from '@/lib/academia/modelo';
import { useJugada } from '@/lib/academia/jugada';

/**
 * Arranca un repaso y se va al jugador. Gratis siempre: el límite frena
 * territorio nuevo, nunca la memoria.
 *
 * Es una ruta y no solo un botón porque los avisos de repaso y los links
 * guardados necesitan un lugar adonde ir.
 */
export default function RepasoPage() {
  const t = useTranslations('arbol');
  const router = useRouter();
  const qc = useQueryClient();
  const abrir = useJugada((s) => s.abrir);
  const [vacio, setVacio] = useState<string | null>(null);
  const pedido = useRef(false);

  useEffect(() => {
    if (pedido.current) return;
    pedido.current = true;
    void (async () => {
      const r = await empezarRepaso();
      if (esFallo(r)) {
        setVacio(r.mensaje ?? t('repasoVacioCuerpo'));
        return;
      }
      abrir(r);
      qc.invalidateQueries({ queryKey: ['academia'] });
      router.replace(`/aprender/sesion/${r.intento_id}`);
    })();
  }, [abrir, qc, router, t]);

  if (vacio) {
    return (
      <EmptyState
        pipMood="sleepy"
        title={t('repasoVacioTitulo')}
        message={vacio}
        action={
          <Button asChild variant="secondary">
            <Link href="/aprender">{t('volverAlArbol')}</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
      <Pip size={72} mood="happy" />
      <p className="text-small text-muted-foreground">{t('armandoRepaso')}</p>
    </div>
  );
}
