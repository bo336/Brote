'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useNombreLiga } from '@/hooks/use-liga';
import { fetchLigaDe } from '@/lib/api/ligas';
import { LIGA_POR_TIER } from '@/lib/ligas';
import { cn } from '@/lib/utils/cn';

/** La liga de esta semana de una persona: en su perfil, al lado de su rango. */
export function ChipLiga({ userId, className }: { userId: string; className?: string }) {
  const nombre = useNombreLiga();
  const q = useQuery({
    queryKey: ['liga-de', userId],
    queryFn: () => fetchLigaDe(userId),
    staleTime: 300_000,
  });
  if (!q.data) return null;
  const color = LIGA_POR_TIER[q.data]?.color;
  return (
    <Link
      href="/ranking"
      className={cn('inline-flex items-center gap-1.5 rounded-pill border border-border bg-surface-2 px-2.5 py-1 text-caption font-semibold', className)}
    >
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} aria-hidden />
      Liga {nombre(q.data)}
    </Link>
  );
}
