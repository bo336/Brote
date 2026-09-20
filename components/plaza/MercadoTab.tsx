'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { TarjetaListado } from '@/components/mercado/TarjetaListado';
import { Skeleton } from '@/components/ui/skeleton';
import { getMercadoDestacado, marcarVistas } from '@/lib/mercado/acciones';
import type { TarjetaMercado } from '@/lib/supabase/rows-mercado';

/**
 * La pestaña Mercado de la Plaza (02 §6.2): una vista compacta de lo mejor del
 * momento y la puerta al catálogo entero. No es el catálogo —no tiene filtros
 * ni scroll infinito— porque la Plaza es para leer, no para comprar.
 *
 * Se renderiza visible: sin animación de entrada, como el resto del puente.
 */
export function MercadoTab() {
  const t = useTranslations('mercado.plaza');
  const [items, setItems] = useState<TarjetaMercado[] | null>(null);

  useEffect(() => {
    let vivo = true;
    void getMercadoDestacado(6).then((x) => {
      if (vivo) setItems(x);
    });
    return () => {
      vivo = false;
    };
  }, []);

  useEffect(() => {
    if (!items?.length) return;
    void marcarVistas(
      items.map((i) => i.id),
      'plaza',
    );
  }, [items]);

  if (items === null) {
    return (
      <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="aspect-[3/4] w-full rounded-card" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-card border border-border bg-surface p-5">
        <p className="text-small font-semibold">{t('vacioTitulo')}</p>
        <p className="mt-1 text-small leading-relaxed text-muted-foreground">{t('vacioTexto')}</p>
        <Link href="/negocio/alta" prefetch={false} className="press mt-3 inline-flex items-center gap-1.5 text-small font-semibold text-primary">
          {t('sumarNegocio')}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <section aria-labelledby="mercado-plaza">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <span className="eyebrow block text-muted-foreground" id="mercado-plaza">
            {t('eyebrow')}
          </span>
          <p className="mt-1 text-small leading-relaxed text-muted-foreground">{t('ayuda')}</p>
        </div>
        <Link href="/mercado" prefetch={false} className="press shrink-0 text-small font-semibold text-primary">
          {t('ver')}
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3">
        {items.map((i) => (
          <TarjetaListado key={i.id} t={i} origen="catalogo" />
        ))}
      </div>
    </section>
  );
}
