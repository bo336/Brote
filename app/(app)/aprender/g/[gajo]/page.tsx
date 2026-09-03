'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Check, Play, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Reveal } from '@/components/ui/reveal';
import { SectionHeader } from '@/components/ui/section';
import { Skeleton } from '@/components/ui/skeleton';
import { FuenteChip } from '@/components/academia/FuenteChip';
import { FuerzaMedidor } from '@/components/academia/FuerzaMedidor';
import { SaviaMedidor } from '@/components/academia/SaviaMedidor';
import { SaviaVacia } from '@/components/academia/SaviaVacia';
import { empezarHoja, fetchArbol, fetchGajo } from '@/lib/api/academia';
import { esFallo, type HojaDelGajo } from '@/lib/academia/types';
import { useJugada } from '@/lib/academia/sesion-store';
import { getDomainColor } from '@/lib/domains';
import { haptic } from '@/lib/utils/haptics';
import { toast } from '@/stores/toast';
import { cn } from '@/lib/utils/cn';

/**
 * Un gajo por dentro: sus hojas y la fuerza real de cada concepto que enseña.
 *
 * Es la pantalla donde se aprieta "empezar", así que es también donde se cobra
 * la savia — y donde se explica cuando no queda. El árbol viene del caché de
 * `/aprender` y solo aporta el estado de la savia; el detalle es una llamada a
 * `academia_gajo(slug)`.
 */
export default function GajoPage() {
  const t = useTranslations('academia');
  const params = useParams<{ gajo: string }>();
  const slug = params?.gajo ?? '';
  const router = useRouter();
  const qc = useQueryClient();
  const abrirJugada = useJugada((s) => s.abrir);
  const [arrancando, setArrancando] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ['academia', 'gajo', slug],
    queryFn: () => fetchGajo(slug),
    enabled: slug.length > 0,
    staleTime: 15_000,
  });
  const arbol = useQuery({ queryKey: ['academia', 'arbol'], queryFn: fetchArbol, staleTime: 30_000 });

  const estadoSavia = arbol.data && !esFallo(arbol.data) ? arbol.data : null;
  const sinSavia = !!estadoSavia && !estadoSavia.pro && (estadoSavia.savia?.restante ?? 1) <= 0;

  async function empezar(hoja: HojaDelGajo) {
    if (arrancando) return;
    setArrancando(hoja.id);
    const r = await empezarHoja(hoja.id);
    setArrancando(null);

    if (esFallo(r)) {
      // `sin_savia` no es un error que se grite: es un estado de la pantalla, y
      // ya está explicado arriba. Se refresca el árbol para que se vea.
      if (r.error === 'sin_savia') {
        qc.invalidateQueries({ queryKey: ['academia', 'arbol'] });
        haptic('warning');
        return;
      }
      toast.show({ title: r.mensaje ?? r.error, variant: 'error' });
      haptic('warning');
      return;
    }

    if (r.pasos.length === 0) {
      toast.show({ title: t('sinPasos'), variant: 'warning' });
      return;
    }

    abrirJugada(r);
    // La savia cambió y las hojas hechas también: que la próxima vuelta al
    // bosque no muestre el número viejo.
    qc.invalidateQueries({ queryKey: ['academia', 'arbol'] });
    haptic('medium');
    router.push(`/aprender/sesion/${r.sesion_id}`);
  }

  if (q.isLoading) {
    return (
      <div className="space-y-4 pb-6">
        <Skeleton className="h-24 w-full" />
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (q.isError || !q.data || esFallo(q.data)) {
    const mensaje = q.data && esFallo(q.data) ? (q.data.mensaje ?? q.data.error) : t('errorCuerpo');
    return (
      <EmptyState
        pipMood="worried"
        title={t('gajoNoEncontrado')}
        message={mensaje}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => q.refetch()}>
              <RotateCw className="h-4 w-4" aria-hidden />
              {t('reintentar')}
            </Button>
            <Button asChild variant="ghost">
              <Link href="/aprender">{t('volverAlBosque')}</Link>
            </Button>
          </div>
        }
      />
    );
  }

  const { gajo, hojas, conceptos } = q.data;
  const color = getDomainColor(gajo.rama_slug);

  return (
    <div className="space-y-5 pb-6">
      <Link
        href={`/aprender/${gajo.rama_slug}`}
        className="inline-flex items-center gap-1.5 text-small text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {t('verRama')}
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow" style={{ color }}>
            {t('anillo', { n: gajo.anillo })}
          </p>
          <h1 className="mt-1 text-balance font-display text-display-s font-extrabold leading-tight">
            {gajo.titulo_es}
          </h1>
          <p className="mt-1.5 text-small leading-relaxed text-muted-foreground">{gajo.bajada_es}</p>
        </div>
        {estadoSavia ? (
          <SaviaMedidor savia={estadoSavia.savia} pro={estadoSavia.pro} className="mt-1 shrink-0" />
        ) : null}
      </header>

      {sinSavia ? <SaviaVacia savia={estadoSavia?.savia ?? null} /> : null}

      <section>
        <SectionHeader title={t('gajoHojas', { n: hojas.length })} eyebrow={t('eyebrow')} eyebrowColor={color} />
        {hojas.length === 0 ? (
          <EmptyState pipMood="sleepy" title={t('vacioTitulo')} message={t('sinPasos')} />
        ) : (
          <ul className="divide-y divide-hairline border-y border-hairline">
            {hojas.map((h, i) => (
              <li key={h.id}>
                <Reveal index={i}>
                  <div className="flex items-center gap-3 py-3">
                    <span
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border',
                        h.completada ? 'border-transparent text-white' : 'border-hairline text-muted-foreground',
                      )}
                      style={h.completada ? { backgroundColor: color } : undefined}
                      aria-hidden
                    >
                      {h.completada ? <Check className="h-4 w-4" /> : <Play className="h-3.5 w-3.5" />}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-small font-semibold">{h.titulo_es}</p>
                      <p className="mt-0.5 truncate text-caption text-muted-foreground">
                        {h.intentos > 0 ? t('hechaVeces', { n: h.intentos }) : t('nuncaHecha')}
                        {h.mejor_score > 0 ? ` · ${h.mejor_score}%` : ''}
                      </p>
                    </div>

                    <Button
                      size="sm"
                      variant={h.completada ? 'secondary' : 'primary'}
                      disabled={arrancando !== null || sinSavia}
                      onClick={() => empezar(h)}
                    >
                      {arrancando === h.id ? t('cargandoSesion') : h.completada ? t('repasar') : t('empezar')}
                    </Button>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        )}
      </section>

      {conceptos.length > 0 ? (
        <section>
          <SectionHeader title={t('conceptosDeLaHoja')} subtitle={t('subtitle')} />
          <ul className="divide-y divide-hairline border-y border-hairline">
            {conceptos.map((c, i) => (
              <li key={c.slug} className="py-3">
                <Reveal index={i}>
                  <FuerzaMedidor fuerza={c.fuerza} titulo={c.titulo_es} />
                  <p className="mt-1.5 text-caption leading-relaxed text-muted-foreground">{c.enunciado_es}</p>
                  {c.fuente ? <FuenteChip fuente={c.fuente} className="mt-2" /> : null}
                </Reveal>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
