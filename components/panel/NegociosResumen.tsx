'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ChevronRight, Store } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { CountUp } from '@/components/ui/count-up';
import { negociosPendientes } from '@/lib/api/negocios';
import { cn } from '@/lib/utils/cn';

/** El contador de solicitudes de negocios pendientes en `/panel` (fase 1 §7.1). */
export function NegociosResumen({ pass }: { pass: string }) {
  const t = useTranslations('negocio.panel');
  const [pendientes, setPendientes] = useState<number | null | undefined>(undefined);

  useEffect(() => {
    let vivo = true;
    void negociosPendientes(pass).then((n) => vivo && setPendientes(n));
    return () => {
      vivo = false;
    };
  }, [pass]);

  return (
    <section>
      <span className="eyebrow text-muted-foreground">{t('resumenEyebrow')}</span>
      <Link
        href="/panel/negocios"
        className="press group mt-1.5 flex items-center gap-3 rounded-card border border-border bg-surface p-4 shadow-soft hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lift"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-primary/15 text-primary">
          <Store className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-h3 font-bold">
            <span className="link-underline">{t('resumenTitulo')}</span>
          </span>
          {pendientes === undefined ? (
            <Skeleton className="mt-1 h-4 w-24 rounded-button" />
          ) : (
            <span
              className={cn(
                'mt-0.5 block text-small tnum',
                pendientes ? 'font-semibold text-foreground' : 'text-muted-foreground',
              )}
            >
              {!!pendientes && (
                <span aria-hidden className="mr-1.5 inline-block h-2 w-2 rounded-full bg-brote-sun align-middle" />
              )}
              {!!pendientes && <CountUp value={pendientes} />} {t('pendientes', { n: pendientes ?? 0 })}
            </span>
          )}
        </span>
        <span className="hidden text-small font-medium text-muted-foreground sm:inline">{t('abrir')}</span>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary" />
      </Link>
    </section>
  );
}
