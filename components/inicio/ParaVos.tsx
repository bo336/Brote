'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { DomainIcon } from '@/components/icons/DomainIcon';
import { ICONO_METRICA } from './AccionesDeHoy';
import { useCatalog, useCatalogCompletions, useDomainPoints } from '@/hooks/use-catalog';
import { fetchMyRecommendations } from '@/lib/api/catalog';
import { scoreActivities } from '@/lib/recommendations';
import { impactoDeAccion, pistaDeImpacto, type ConImpacto } from '@/lib/inicio/impacto';
import { getDomain } from '@/lib/domains';
import { useSession } from '@/stores/session';

/**
 * "Para vos": bigger actions from the catalogue, picked for this person — as
 * a sideways rail of tall cards with their topic colour on top. The old block
 * was a card that said "acciones elegidas para vos" and showed none.
 *
 * The catalogue is large, so nothing is fetched until the rail is about to
 * scroll into view; the queries share their keys with `/acciones`, so by the
 * time someone taps "Ver todas" the section is already loaded. These are
 * actions from the Acciones section: doing one moves the impact panel.
 */
export function ParaVos() {
  const t = useTranslations('inicio.paraVos');
  const profile = useSession((s) => s.profile);
  const ref = useRef<HTMLElement>(null);
  const [cerca, setCerca] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || cerca) return;
    if (typeof IntersectionObserver === 'undefined') {
      setCerca(true);
      return;
    }
    const io = new IntersectionObserver((e) => e.some((x) => x.isIntersecting) && setCerca(true), {
      rootMargin: '600px 0px',
    });
    io.observe(el);
    return () => io.disconnect();
  }, [cerca]);

  const catalog = useCatalog(profile?.accountType ?? 'adult', cerca);
  const completions = useCatalogCompletions(profile?.id, cerca);
  const domainPoints = useDomainPoints(profile?.id, cerca);
  const recs = useQuery({
    queryKey: ['ai-recs', profile?.id],
    queryFn: fetchMyRecommendations,
    enabled: cerca && !!profile?.id,
    staleTime: 30 * 60_000,
  });

  const lista = useMemo(() => {
    if (!catalog.data) return [];
    const hechas = new Set<string>();
    completions.data?.forEach((info, id) => {
      if (info.status === 'honor' || info.status === 'verified') hechas.add(id);
    });
    const base = scoreActivities(
      // The daily set already has its own card; this is for the bigger ones.
      catalog.data.filter((a) => a.type === 'catalog'),
      {
        interests: profile?.interests ?? [],
        totalXp: profile?.totalXp ?? 0,
        domainPoints: domainPoints.data ?? {},
        completedIds: hechas,
        personal: profile?.context ?? null,
      },
    );
    const ai = new Map((recs.data ?? []).map((r, i) => [r.slug, { rank: i, reason: r.reason }]));
    return base
      .map((s) => {
        const r = ai.get(s.activity.slug);
        return r && !hechas.has(s.activity.id) ? { ...s, score: s.score + 1000 - r.rank, reason: r.reason || s.reason } : s;
      })
      .filter((s) => !s.locked && !hechas.has(s.activity.id))
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  }, [catalog.data, completions.data, domainPoints.data, recs.data, profile?.interests, profile?.totalXp, profile?.context]);

  return (
    <section ref={ref} aria-labelledby="para-vos">
      <div className="mb-2.5 flex items-end justify-between gap-2">
        <div className="min-w-0">
          <span className="eyebrow flex items-center gap-1.5 text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-brote-sun" aria-hidden />
            {t('eyebrow')}
          </span>
          <h2 id="para-vos" className="mt-0.5 font-display text-h3 font-bold leading-tight">
            {t('titulo')}
          </h2>
        </div>
        <Link
          href="/acciones"
          className="group inline-flex shrink-0 items-center gap-1 rounded-pill px-2.5 py-1 text-small font-semibold text-primary transition-colors duration-150 hover:bg-primary/[0.06]"
        >
          {t('verTodas')}
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
        </Link>
      </div>

      {!cerca || catalog.isPending ? (
        <div className="-mx-4 flex gap-3 overflow-hidden px-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-[168px] w-[62%] shrink-0 rounded-card sm:w-[38%]" />
          ))}
        </div>
      ) : lista.length === 0 ? null : (
        <ul className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 no-scrollbar">
          {lista.map(({ activity: a, reason }) => {
            const dom = getDomain(a.domain_slug);
            const pista = pistaDeImpacto(impactoDeAccion(a as typeof a & ConImpacto), a.domain_slug);
            const Icono = pista ? ICONO_METRICA[pista.key] : null;
            return (
              <li key={a.id} className="w-[62%] shrink-0 snap-start sm:w-[38%]">
                <Link
                  href={`/acciones/${a.slug}`}
                  className="press group flex h-full min-h-[168px] flex-col overflow-hidden rounded-card border border-border bg-surface shadow-soft hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lift"
                >
                  <span className="h-1.5 w-full shrink-0" style={{ background: dom?.color ?? '#1FB57A' }} aria-hidden />
                  <span className="flex flex-1 flex-col p-3">
                    <span className="flex items-center justify-between gap-2">
                      <DomainIcon domain={a.domain_slug} size={34} />
                      <span className="text-caption font-bold text-brote-sun tnum">+{a.base_points}</span>
                    </span>
                    <span className="mt-2 line-clamp-3 text-small font-semibold leading-snug">{a.title_es}</span>
                    {reason && <span className="mt-1 line-clamp-2 text-caption leading-snug text-muted-foreground">{reason}</span>}
                    {pista && Icono && (
                      <span className="mt-auto inline-flex items-center gap-1 pt-2 text-caption font-semibold tnum" style={{ color: pista.color }}>
                        <Icono className="h-3.5 w-3.5" aria-hidden />
                        {pista.texto}
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
