'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Trophy } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchDailyChallenge } from '@/lib/api/home';
import { getDomainColor } from '@/lib/domains';

/**
 * The day's challenge as a slim sun-toned banner: a goal with a bar, not
 * another card in the list. It lives between the doors to the rest of the app
 * and the suggestions, because it is what turns "one more action" into
 * something with a finish line.
 */
export function RetoDelDia() {
  const t = useTranslations('inicio.reto');
  const q = useQuery({ queryKey: ['daily-challenge'], queryFn: fetchDailyChallenge, staleTime: 5 * 60_000 });

  if (q.isLoading) return <Skeleton className="h-[76px] w-full rounded-card" />;
  if (!q.data) return null;

  const { challenge, progress } = q.data;
  const meta = Math.max(1, challenge.target_value);
  const p = Math.min(1, progress / meta);
  const listo = progress >= meta;
  const color = challenge.domain_slug ? getDomainColor(challenge.domain_slug) : '#FFB23E';

  return (
    <Link
      href={challenge.domain_slug ? `/acciones?dominio=${challenge.domain_slug}` : '/acciones'}
      className="press group relative flex items-center gap-3 overflow-hidden rounded-card border border-brote-sun/35 bg-brote-sun/[0.08] p-3.5 hover:border-brote-sun/60 hover:shadow-sun-glow"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brote-sun/20 text-brote-sun">
        <Trophy className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="eyebrow text-brote-sun">{t('eyebrow')}</span>
          <span className="text-caption font-bold text-brote-sun tnum">+{challenge.reward_points} pts</span>
        </span>
        <span className="mt-0.5 block truncate text-small font-semibold">{challenge.title_es}</span>
        <span className="mt-1.5 flex items-center gap-2">
          <span className="h-1.5 flex-1 overflow-hidden rounded-pill bg-brote-sun/20">
            <span
              className="block h-full rounded-pill transition-[width] duration-500"
              style={{ width: `${Math.round(p * 100)}%`, background: listo ? '#1FB57A' : color }}
            />
          </span>
          <span className="shrink-0 text-caption font-semibold text-muted-foreground tnum">
            {listo ? t('listo') : `${progress}/${meta}`}
          </span>
        </span>
      </span>
    </Link>
  );
}
