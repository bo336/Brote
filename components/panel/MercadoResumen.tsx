'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ChevronRight, Flag, ShoppingBag } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { CountUp } from '@/components/ui/count-up';
import { listadosCola } from '@/lib/api/mercado';
import { cn } from '@/lib/utils/cn';

/**
 * Los contadores del Mercado en `/panel`: listados esperando revisión y
 * reportes abiertos. Del otro lado, igual que en la moderación, hay alguien
 * esperando una respuesta.
 */
export function MercadoResumen({ pass }: { pass: string }) {
  const t = useTranslations('mercado.panel');
  const tv = useTranslations('negocio.panel');
  const [c, setC] = useState<{ pendientes: number; auditoria: number; reportes: number } | null | undefined>(undefined);

  useEffect(() => {
    let vivo = true;
    void listadosCola(pass, 'pendientes').then((r) => vivo && setC(r.ok ? r.contadores : null));
    return () => {
      vivo = false;
    };
  }, [pass]);

  const filas = [
    { href: '/panel/listados', icono: ShoppingBag, titulo: t('resumenTitulo'), n: c ? c.pendientes + c.auditoria : null, texto: (n: number) => t('pendientes', { n }) },
    { href: '/panel/reportes', icono: Flag, titulo: t('resumenReportes'), n: c ? c.reportes : null, texto: (n: number) => t('abiertos', { n }) },
  ];

  return (
    <section>
      <span className="eyebrow text-muted-foreground">{t('resumenEyebrow')}</span>
      <div className="mt-1.5 space-y-2">
        {filas.map((f) => {
          const Icono = f.icono;
          return (
            <Link
              key={f.href}
              href={f.href}
              className="press group flex items-center gap-3 rounded-card border border-border bg-surface p-4 shadow-soft hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lift"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-primary/15 text-primary">
                <Icono className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-h3 font-bold">
                  <span className="link-underline">{f.titulo}</span>
                </span>
                {c === undefined ? (
                  <Skeleton className="mt-1 h-4 w-24 rounded-button" />
                ) : (
                  <span className={cn('mt-0.5 block text-small tnum', f.n ? 'font-semibold text-foreground' : 'text-muted-foreground')}>
                    {!!f.n && <span aria-hidden className="mr-1.5 inline-block h-2 w-2 rounded-full bg-brote-sun align-middle" />}
                    {!!f.n && <CountUp value={f.n} />} {f.texto(f.n ?? 0)}
                  </span>
                )}
              </span>
              <span className="hidden text-small font-medium text-muted-foreground sm:inline">{tv('abrir')}</span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
