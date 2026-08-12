'use client';

import { cn } from '@/lib/utils/cn';

export type AccountType = 'kid' | 'teen' | 'adult';

/**
 * What each account type actually changes. Shown to the user because the type
 * silently gates actions, news, competitions and advertising — leaving it
 * invisible meant nobody could tell which rules applied to them (F14.3).
 */
export const ACCOUNT_TYPES: Record<
  AccountType,
  { label: string; short: string; color: string; detail: string }
> = {
  kid: {
    label: 'Cuenta de chicos',
    short: 'Chicos',
    color: '#9CC93B',
    detail: 'Acciones seguras y supervisadas, noticias adaptadas y cero publicidad.',
  },
  teen: {
    label: 'Cuenta adolescente',
    short: 'Adolescente',
    color: '#2DB4D4',
    detail: 'Acciones para hacer con autonomía y publicidad siempre genérica.',
  },
  adult: {
    label: 'Cuenta adulta',
    short: 'Adulta',
    color: '#1FB57A',
    detail: 'Todas las acciones, competencias y funciones disponibles.',
  },
};

export function AccountTypeBadge({
  type,
  className,
  showDetail = false,
}: {
  type: AccountType | undefined;
  className?: string;
  showDetail?: boolean;
}) {
  const meta = ACCOUNT_TYPES[type ?? 'adult'];
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <span
        className="inline-flex w-fit items-center gap-1.5 rounded-pill border px-2.5 py-0.5 text-caption font-semibold"
        style={{ background: `${meta.color}1f`, color: meta.color, borderColor: `${meta.color}40` }}
      >
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} aria-hidden />
        {meta.label}
      </span>
      {showDetail && <p className="text-caption text-muted-foreground">{meta.detail}</p>}
    </div>
  );
}
