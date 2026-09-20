import { type ReactNode } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Logo } from '@/components/brand/Logo';
import { Avatar } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { ContextSwitcher } from '@/components/negocio/ContextSwitcher';
import { NavChips, NavLateral } from '@/components/negocio/NavNegocio';
import { NivelChip } from '@/components/negocio/NivelChip';
import { CampanaNegocio } from '@/components/negocio/CampanaNegocio';
import type { MiNegocio } from '@/lib/supabase/rows-negocio';

/**
 * La estructura del shell de negocio (07 §3.2): barra superior de 56 px,
 * lateral de 220 px en escritorio, chips en móvil, nivel al pie. Sin datos
 * propios: quién entra lo decide `app/(business)/layout.tsx`.
 */
export function ShellNegocio({
  perfil,
  negocios,
  activo,
  enfocado,
  children,
}: {
  perfil: { id: string; displayName: string | null; username: string | null; avatarUrl: string | null };
  negocios: MiNegocio[];
  activo: MiNegocio | null;
  /** El alta: sin lateral, una columna angosta. */
  enfocado: boolean;
  children: ReactNode;
}) {
  const t = useTranslations('negocio');

  return (
    <div className="min-h-dvh bg-background">
      <header className="pt-safe sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 lg:px-6">
          <Link
            href={activo ? '/negocio' : '/'}
            className="flex shrink-0 items-center gap-2 rounded-button pr-1 transition-opacity duration-150 hover:opacity-80"
          >
            <Logo size={24} showName={false} />
            <span className="hidden font-display text-h3 font-extrabold tracking-tight sm:inline">{t('marca')}</span>
          </Link>
          <span aria-hidden className="h-5 w-px shrink-0 bg-border" />
          <ContextSwitcher
            variante="negocio"
            userId={perfil.id}
            activoId={activo?.id ?? null}
            activoNombre={activo?.nombre}
            negociosIniciales={negocios}
          />
          <div className="ml-auto flex shrink-0 items-center gap-1">
            {/* La campana de la empresa. La personal vive en la otra app y no
                se cruzan nunca (02 §7). */}
            {activo && <CampanaNegocio negocioId={activo.id} />}
            <ThemeToggle />
            <Avatar src={perfil.avatarUrl} name={perfil.displayName ?? perfil.username} size={32} />
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl">
        {!enfocado && activo && (
          <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-[220px] shrink-0 flex-col justify-between border-r border-border px-3 py-6 lg:flex">
            <NavLateral />
            <NivelChip tier={activo.tier} apilado />
          </aside>
        )}
        <main
          className={
            enfocado
              ? 'mx-auto w-full max-w-xl px-4 pb-10 pt-5 sm:pb-16 sm:pt-8'
              : 'min-w-0 flex-1 px-4 pb-16 pt-5 lg:px-10 lg:pt-8'
          }
        >
          {!enfocado && activo && <NavChips />}
          {children}
        </main>
      </div>
    </div>
  );
}
