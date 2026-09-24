'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { ChevronRight, Store } from 'lucide-react';
import { getMercadoDestacado } from '@/lib/mercado/acciones';
import { urlImagen } from '@/lib/mercado/imagenes';
import { useSession } from '@/stores/session';

/**
 * La puerta al Mercado desde Hoy. Como la Academia, no entra en la barra de
 * pestañas del teléfono, así que esta fila es como se descubre. Muestra cuatro
 * productos de verdad —los que el Mercado le recomendaría a esta persona—, no
 * una descripción: una fila que dice lo mismo todos los días deja de mirarse.
 *
 * Kid no ve el Mercado (08 §9). Sin productos, la fila no aparece.
 */
export function EntradaMercado() {
  const t = useTranslations('mercado.entrada');
  const tipo = useSession((s) => s.profile?.accountType);
  const q = useQuery({
    queryKey: ['mercado', 'destacados'],
    queryFn: () => getMercadoDestacado(4),
    staleTime: 5 * 60_000,
    enabled: !!tipo && tipo !== 'kid',
  });
  if (!tipo || tipo === 'kid' || !q.data || q.data.length < 2) return null;

  return (
    <Link
      href="/mercado"
      className="press group flex items-center gap-3 rounded-card border border-border bg-surface p-3.5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-brote-sun/20 text-brote-sun">
        <Store className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-small font-semibold">{t('titulo')}</span>
        <span className="mt-0.5 block truncate text-caption text-muted-foreground">{t('bajada')}</span>
      </span>
      <span className="flex shrink-0 -space-x-2.5" aria-hidden>
        {q.data.slice(0, 3).map((p) => {
          const src = urlImagen(p.imagen);
          return (
            <span key={p.id} className="relative h-9 w-9 overflow-hidden rounded-full border-2 border-surface bg-surface-2">
              {src && <Image src={src} alt="" fill sizes="36px" className="object-cover" />}
            </span>
          );
        })}
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary" />
    </Link>
  );
}
