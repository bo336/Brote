'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowUp, CircleCheck, Clock } from 'lucide-react';
import { etiquetaVerificacion, hace } from '@/components/panel/negocios/etiquetas';
import { claveTamano } from '@/lib/negocio/catalogo';
import type { FilaColaNegocio, FiltroCola } from '@/lib/supabase/rows-negocio';
import { cn } from '@/lib/utils/cn';

/**
 * Las filas de la cola: tabla estilada en escritorio, filas apiladas en un
 * teléfono. Toda la fila es el enlace (07 §3.3, §8).
 */
export function TablaCola({ items, filtro, ahora }: { items: FilaColaNegocio[]; filtro: FiltroCola; ahora: number }) {
  const t = useTranslations('negocio');
  return (
    <table className="w-full border-collapse text-left">
      <caption className="sr-only">{t('panel.cola.caption')}</caption>
      <thead className="hidden sm:table-header-group">
        <tr className="border-b border-border">
          <th scope="col" className="eyebrow py-2 pr-3 font-semibold text-muted-foreground">
            {t('panel.cola.col.negocio')}
          </th>
          <th
            scope="col"
            aria-sort={filtro === 'pendientes' ? 'ascending' : 'descending'}
            className="eyebrow whitespace-nowrap py-2 pr-3 font-semibold text-foreground"
          >
            {t('panel.cola.col.antiguedad')}
            <ArrowUp
              className={cn('ml-1 inline h-3 w-3 align-[-1px] transition-transform', filtro !== 'pendientes' && 'rotate-180')}
              aria-hidden
            />
          </th>
          <th scope="col" className="eyebrow py-2 pr-3 font-semibold text-muted-foreground">
            {t('panel.cola.col.verificacion')}
          </th>
          <th scope="col" className="eyebrow py-2 font-semibold text-muted-foreground">
            {t('panel.cola.col.riesgos')}
          </th>
        </tr>
      </thead>
      <tbody>
        {items.map((f, i) => {
          const verif = etiquetaVerificacion(t, f.verificacion);
          return (
            <tr
              key={f.id}
              className="group relative block border-b border-hairline py-3 transition-colors duration-150 hover:bg-surface-2/60 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:fill-mode-both sm:table-row sm:py-0"
              style={{ animationDelay: `${Math.min(i, 10) * 60}ms` }}
            >
              <td className="block py-0 pr-3 align-top sm:table-cell sm:py-3">
                {/* El enlace cubre la fila entera: toda la fila es el control. */}
                <Link
                  href={`/panel/negocios/${f.id}`}
                  className="font-semibold after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:rounded-button focus-visible:after:ring-2 focus-visible:after:ring-ring"
                >
                  <span className="link-underline">{f.nombre}</span>
                </Link>
                <span className="mt-0.5 block text-caption text-muted-foreground">
                  {t(`rubros.${f.rubro}`)} · {f.provincia ?? '—'} · {t(`tamanos.${claveTamano(f.tamano)}`)}
                </span>
                {f.observada && (
                  <span className="mt-1 inline-block rounded-pill bg-brote-sun/15 px-2 py-px text-[11px] font-semibold text-foreground">
                    {t('estado.observada')}
                  </span>
                )}
              </td>
              <td className="block py-0 pr-3 align-top text-caption text-muted-foreground tnum sm:table-cell sm:whitespace-nowrap sm:py-3 sm:text-small">
                <Clock className="mr-1 inline h-3.5 w-3.5 align-[-2px] sm:hidden" />
                {hace(t, f.enviado_at, ahora)}
              </td>
              <td className="block py-0 pr-3 align-top sm:table-cell sm:py-3">
                <span
                  className={cn(
                    'inline-flex items-start gap-1 text-caption sm:text-small',
                    verif.tono === 'ok' && 'text-primary',
                    verif.tono === 'mal' && 'text-brote-coral',
                    (verif.tono === 'nada' || verif.tono === 'espera') && 'text-muted-foreground',
                  )}
                >
                  {verif.tono === 'ok' && <CircleCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
                  {verif.texto}
                </span>
              </td>
              <td className="block py-0 align-top sm:table-cell sm:py-3">
                <span className="mt-1 flex flex-wrap gap-1 sm:mt-0">
                  {f.riesgos.map((r) => (
                    <span
                      key={r}
                      className="rounded-pill border border-brote-coral/30 bg-brote-coral/10 px-2 py-px text-[11px] font-medium text-foreground"
                    >
                      {t(`panel.riesgos.${r}`)}
                    </span>
                  ))}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
