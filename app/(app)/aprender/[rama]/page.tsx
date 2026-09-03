'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { ArrowLeft, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChipRail } from '@/components/ui/chip-rail';
import { CountUp } from '@/components/ui/count-up';
import { EmptyState } from '@/components/ui/empty-state';
import { Reveal } from '@/components/ui/reveal';
import { Skeleton } from '@/components/ui/skeleton';
import { FilaGajo } from '@/components/academia/FilaGajo';
import { fetchArbol } from '@/lib/api/academia';
import { esFallo } from '@/lib/academia/types';
import { getDomainColor } from '@/lib/domains';
import { cn } from '@/lib/utils/cn';

/**
 * Una rama por dentro: sus gajos, agrupados por anillo.
 *
 * NO hace una llamada nueva. `academia_arbol()` ya trajo el árbol entero y
 * react-query lo tiene cacheado bajo la misma clave que usa `/aprender`, así
 * que entrar a una rama desde el bosque no toca la red. Si se llega por link
 * directo, la trae una vez y la comparte con el bosque después.
 *
 * Es la pantalla operativa de la sección: densa, con filas y divisores, sin
 * héroe y sin gradiente. El momento de marca ya lo gastó el bosque.
 */
export default function RamaPage() {
  const t = useTranslations('academia');
  const tc = useTranslations('common');
  const params = useParams<{ rama: string }>();
  const slug = params?.rama ?? '';
  const q = useQuery({ queryKey: ['academia', 'arbol'], queryFn: fetchArbol, staleTime: 30_000 });

  const [anillo, setAnillo] = useState<string>('todos');

  const rama = q.data && !esFallo(q.data) ? q.data.ramas.find((r) => r.slug === slug) : undefined;

  const anillos = useMemo(() => {
    if (!rama) return [];
    return [...new Set(rama.gajos.map((g) => g.anillo))].sort((a, b) => a - b);
  }, [rama]);

  if (q.isLoading) {
    return (
      <div className="space-y-4 pb-6">
        <Skeleton className="h-20 w-full" />
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (q.isError || !q.data || esFallo(q.data)) {
    return (
      <EmptyState
        pipMood="worried"
        title={t('errorTitulo')}
        message={q.data && esFallo(q.data) ? (q.data.mensaje ?? q.data.error) : t('errorCuerpo')}
        action={
          <Button variant="secondary" onClick={() => q.refetch()}>
            <RotateCw className="h-4 w-4" aria-hidden />
            {t('reintentar')}
          </Button>
        }
      />
    );
  }

  if (!rama) {
    return (
      <EmptyState
        pipMood="sleepy"
        title={t('gajoNoEncontrado')}
        message={t('vacioCuerpo')}
        action={
          <Button asChild variant="secondary">
            <Link href="/aprender">{t('volverAlBosque')}</Link>
          </Button>
        }
      />
    );
  }

  const color = getDomainColor(rama.slug);
  const visibles = anillo === 'todos' ? rama.gajos : rama.gajos.filter((g) => String(g.anillo) === anillo);
  const frondosos = rama.gajos.filter((g) => g.estado === 'frondoso').length;
  const conceptos = rama.gajos.reduce((n, g) => n + g.conceptos, 0);

  return (
    <div className="space-y-4 pb-6">
      <Link
        href="/aprender"
        className="inline-flex items-center gap-1.5 text-small text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {t('volverAlBosque')}
      </Link>

      <header>
        <p className="eyebrow" style={{ color }}>
          {t('eyebrow')}
        </p>
        <h1 className="mt-1 text-balance font-display text-display-s font-extrabold leading-tight">
          {rama.nombre_es}
        </h1>
        <p className="mt-1.5 text-small leading-relaxed text-muted-foreground">{rama.bajada_es}</p>
      </header>

      {/* Las tres cifras de la rama. Todas salen del árbol; ninguna es un promedio inventado. */}
      <dl className="grid grid-cols-3 overflow-hidden rounded-card border border-hairline">
        {[
          { k: t('statGajos'), v: rama.gajos.length },
          { k: t('statFrondosos'), v: frondosos },
          { k: t('statConceptos'), v: conceptos },
        ].map((c, i) => (
          <div key={c.k} className={cn('bg-surface px-3 py-2.5', i > 0 && 'border-l border-hairline')}>
            <dd className="font-display text-h3 font-bold">
              <CountUp value={c.v} className="tnum" />
            </dd>
            <dt className="mt-0.5 truncate text-caption text-muted-foreground">{c.k}</dt>
          </div>
        ))}
      </dl>

      {anillos.length > 1 ? (
        <ChipRail
          layoutId="academia-anillos"
          value={anillo}
          onChange={setAnillo}
          options={[
            { value: 'todos', label: tc('all'), color },
            ...anillos.map((n) => ({ value: String(n), label: t('anillo', { n }), color })),
          ]}
        />
      ) : null}

      {visibles.length === 0 ? (
        <EmptyState pipMood="sleepy" title={t('vacioTitulo')} message={t('vacioCuerpo')} />
      ) : (
        <ul className="divide-y divide-hairline border-y border-hairline">
          {visibles.map((g, i) => (
            <li key={g.slug}>
              <Reveal index={i}>
                <FilaGajo gajo={g} color={color} />
              </Reveal>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
