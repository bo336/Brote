'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Droplets, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Reveal } from '@/components/ui/reveal';
import { Skeleton } from '@/components/ui/skeleton';
import { ArbolBosque } from '@/components/academia/ArbolBosque';
import { SaviaMedidor } from '@/components/academia/SaviaMedidor';
import { TarjetaSiguiente } from '@/components/academia/TarjetaSiguiente';
import { TiraBosque } from '@/components/academia/TiraBosque';
import { EnPausa } from '@/components/academia/EnPausa';
import { fetchArbol, fetchEstadoAcademia } from '@/lib/api/academia';
import { esFallo } from '@/lib/academia/types';
import { getDomainColor } from '@/lib/domains';

/**
 * El Bosque — la pantalla identitaria de la Academia.
 *
 * UNA sola llamada a `academia_arbol()`. Todo lo que se ve acá —el árbol, la
 * savia, la racha, la tira de cifras, la recomendación y la lista de riego—
 * sale de ese único objeto. Cuando la cabecera necesitó la racha, lo que se
 * arregló fue el RPC (migración 0080), no la pantalla.
 */
export default function BosquePage() {
  const t = useTranslations('academia');
  const router = useRouter();
  const q = useQuery({ queryKey: ['academia', 'arbol'], queryFn: fetchArbol, staleTime: 30_000 });

  // El arbol falla con un mensaje, no con un codigo, cuando la seccion esta
  // apagada por bandera. Distinguir "en pausa" de "se cayo la red" importa —
  // una tiene boton de reintentar y la otra no— asi que se pregunta, pero SOLO
  // cuando ya falló: en el camino feliz sigue siendo una sola llamada.
  const fallo = q.isError || (q.data != null && esFallo(q.data));
  const estado = useQuery({
    queryKey: ['academia', 'estado'],
    queryFn: fetchEstadoAcademia,
    enabled: fallo,
    staleTime: 60_000,
  });

  if (q.isLoading) return <EsqueletoBosque />;

  if (fallo || !q.data || esFallo(q.data)) {
    const mensaje = q.data && esFallo(q.data) ? (q.data.mensaje ?? q.data.error) : t('errorCuerpo');
    const pausada = estado.data && !esFallo(estado.data) && !estado.data.habilitada;
    return (
      <div data-shell="wide">
        {pausada ? (
          <EnPausa mensaje={mensaje} />
        ) : (
          <EmptyState
            pipMood="worried"
            title={t('errorTitulo')}
            message={mensaje}
            action={
              <Button variant="secondary" onClick={() => q.refetch()}>
                <RotateCw className="h-4 w-4" aria-hidden />
                {t('reintentar')}
              </Button>
            }
          />
        )}
      </div>
    );
  }

  const arbol = q.data;
  const conGajos = arbol.ramas.some((r) => r.gajos.length > 0);
  // `marchitos` y `siguiente` llegan como gajos sueltos, sin su rama: el color
  // de dominio sale de este índice y no de adivinarlo desde el slug.
  const ramaDe = new Map(arbol.ramas.flatMap((r) => r.gajos.map((g) => [g.slug, r.slug] as const)));
  const ramaDeSiguiente = arbol.siguiente ? (ramaDe.get(arbol.siguiente.gajo.slug) ?? 'tronco') : null;

  return (
    <div data-shell="wide" className="space-y-5 pb-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow text-primary">{t('eyebrow')}</p>
          {/* El único momento de gradiente de marca de la pantalla. */}
          <h1 className="mt-1 text-balance font-display text-display-l font-extrabold leading-tight">
            <span className="bg-brand-gradient bg-clip-text text-transparent">{t('title')}</span>
          </h1>
          <p className="mt-1.5 max-w-md text-small leading-relaxed text-muted-foreground">{t('subtitle')}</p>
        </div>
        <SaviaMedidor savia={arbol.savia} pro={arbol.pro} className="mt-1 shrink-0" />
      </header>

      <TiraBosque stats={arbol.stats} racha={arbol.racha} />

      {!conGajos ? (
        <EmptyState pipMood="sleepy" title={t('vacioTitulo')} message={t('vacioCuerpo')} />
      ) : (
        <>
          <Reveal>
            <ArbolBosque
              ramas={arbol.ramas}
              anillo={arbol.anillo}
              destacado={arbol.siguiente?.gajo.slug ?? null}
              onAbrir={(g) => router.push(`/aprender/g/${g.gajo.slug}`)}
              className="h-[62vh] min-h-[380px] lg:h-[68vh]"
            />
          </Reveal>

          {arbol.siguiente ? (
            <Reveal index={1}>
              <TarjetaSiguiente
                gajo={arbol.siguiente.gajo}
                razon={arbol.siguiente.razon}
                ramaSlug={ramaDeSiguiente ?? 'tronco'}
              />
            </Reveal>
          ) : null}

          {arbol.marchitos.length > 0 ? (
            <Reveal index={2}>
              <section className="rounded-card border border-brote-coral/25 bg-brote-coral/5 p-4">
                <h2 className="flex items-center gap-2 font-display text-h3 font-bold leading-tight">
                  <Droplets className="h-5 w-5 text-brote-coral" aria-hidden />
                  {t('regarTitulo', { n: arbol.marchitos.length })}
                </h2>
                <p className="mt-1 text-small leading-relaxed text-muted-foreground">{t('regarCuerpo')}</p>
                <ul className="mt-3 divide-y divide-hairline border-y border-hairline">
                  {arbol.marchitos.slice(0, 5).map((g) => (
                    <li key={g.slug}>
                      <Link
                        href={`/aprender/g/${g.slug}`}
                        className="flex items-center gap-3 py-2.5 text-small transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: getDomainColor(ramaDe.get(g.slug) ?? '') }}
                          aria-hidden
                        />
                        <span className="min-w-0 flex-1 truncate">{g.titulo_es}</span>
                        <span className="tnum shrink-0 text-caption text-muted-foreground">
                          {Math.round(g.progreso * 100)}%
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Button asChild block variant="secondary" className="mt-3">
                  <Link href="/aprender/riego">{t('regarCta')}</Link>
                </Button>
              </section>
            </Reveal>
          ) : null}

          <Reveal index={3}>
            <ul className="divide-y divide-hairline border-y border-hairline">
              {arbol.ramas
                .filter((r) => r.gajos.length > 0)
                .map((r) => {
                  const frondosos = r.gajos.filter((g) => g.estado === 'frondoso').length;
                  return (
                    <li key={r.slug}>
                      <Link
                        href={`/aprender/${r.slug}`}
                        className="flex items-center gap-3 py-3 transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span
                          className="h-8 w-1 shrink-0 rounded-pill"
                          style={{ backgroundColor: getDomainColor(r.slug) }}
                          aria-hidden
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-small font-semibold">{r.nombre_es}</span>
                          <span className="block truncate text-caption text-muted-foreground">
                            {t('ramaGajos', { n: r.gajos.length })} · {frondosos} {t('statFrondosos').toLowerCase()}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
            </ul>
          </Reveal>
        </>
      )}
    </div>
  );
}

function EsqueletoBosque() {
  return (
    <div data-shell="wide" className="space-y-5 pb-6">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="-mx-4 h-11 rounded-none lg:mx-0 lg:rounded-card" />
      <Skeleton className="h-[62vh] min-h-[380px] w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}
