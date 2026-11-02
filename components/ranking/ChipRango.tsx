'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useNombreRango } from '@/hooks/use-rango';
import { fetchRangoDe } from '@/lib/api/rangos';
import { RANGO_POR_TIER } from '@/lib/rangos';
import { cn } from '@/lib/utils/cn';

/** El rango de este período de una persona: en su perfil, al lado de su nivel. */
export function ChipRango({ userId, className }: { userId: string; className?: string }) {
  const nombre = useNombreRango();
  const q = useQuery({
    queryKey: ['rango-de', userId],
    queryFn: () => fetchRangoDe(userId),
    staleTime: 300_000,
  });
  if (!q.data) return null;
  const color = RANGO_POR_TIER[q.data]?.color;
  return (
    <Link
      href="/ranking"
      className={cn('inline-flex items-center gap-1.5 rounded-pill border border-border bg-surface-2 px-2.5 py-1 text-caption font-semibold', className)}
    >
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} aria-hidden />
      {nombre(q.data)}
    </Link>
  );
}
