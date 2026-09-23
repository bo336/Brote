'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { ChevronRight, TreeDeciduous } from 'lucide-react';
import { fetchEstadoAcademia } from '@/lib/api/academia';
import { esFallo } from '@/lib/academia/modelo';
import { SaviaMedidor } from '@/components/academia/SaviaMedidor';

/**
 * La puerta a la Academia desde Hoy.
 *
 * La barra de pestañas tiene cinco y va a seguir teniendo cinco, así que en un
 * teléfono esta fila es como se descubre la sección. Muestra el estado real
 * —cuánta savia queda hoy— y no una descripción genérica: una fila que dice lo
 * mismo todos los días deja de mirarse a la semana.
 *
 * Usa `academia_estado()`, la consulta barata: el árbol entero para pintar una
 * fila de 60 píxeles sería un derroche.
 */
export function EntradaAcademia() {
  const t = useTranslations('arbol');
  const q = useQuery({ queryKey: ['academia', 'estado'], queryFn: fetchEstadoAcademia, staleTime: 60_000 });
  const estado = q.data && !esFallo(q.data) ? q.data : null;
  if (estado && !estado.habilitada) return null;

  const bajada = estado && !estado.pro && estado.savia ? t('saviaRestante', { n: estado.savia.restante }) : t('homeSub');

  return (
    <Link
      href="/aprender"
      className="press group flex items-center gap-3 rounded-card border border-border bg-surface p-3.5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-primary/15 text-primary">
        <TreeDeciduous className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-small font-semibold">{t('homeTitulo')}</span>
        <span className="mt-0.5 block truncate text-caption text-muted-foreground">{bajada}</span>
      </span>
      {estado ? <SaviaMedidor savia={estado.savia} pro={estado.pro} className="shrink-0" /> : null}
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
    </Link>
  );
}
