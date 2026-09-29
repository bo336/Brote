'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Menu from '@radix-ui/react-dropdown-menu';
import { Check, ChevronDown, Loader2, Plus, Store, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { setActiveContext } from '@/lib/negocio/acciones';
import type { MiNegocio } from '@/lib/supabase/rows-negocio';
import { Skeleton } from '@/components/ui/skeleton';
import { useToastStore } from '@/stores/toast';
import { cn } from '@/lib/utils/cn';

/** El tope de `create_business` cuando `app_settings` no dice otra cosa. */
const MAX_NEGOCIOS_OWNER = 3;

/**
 * "Estás viendo": tu cuenta personal o uno de tus negocios (03 §3.4).
 *
 * Cambiar escribe la cookie en un server action y después navega o refresca
 * con el router — nunca `window.location`, que tira el estado de React Query
 * sin necesidad. El servidor ya sabe el contexto antes de pintar, así que no
 * hay parpadeo. Solo se monta para cuentas de adulto: a un menor ni se le
 * ofrece la puerta.
 */
export function ContextSwitcher({
  variante,
  userId,
  activoId = null,
  activoNombre,
  negociosIniciales,
}: {
  /** `persona`: botón de ícono en la barra de la app. `negocio`: el nombre del negocio activo. */
  variante: 'persona' | 'negocio';
  userId: string;
  activoId?: string | null;
  activoNombre?: string;
  negociosIniciales?: MiNegocio[];
}) {
  const t = useTranslations('negocio');
  const router = useRouter();
  const qc = useQueryClient();
  const [abierto, setAbierto] = useState(false);
  const [cambiando, setCambiando] = useState<string | null>(null);

  // En la app de personas la lista se pide recién al abrir: nadie paga una
  // consulta de negocios por cargar Hoy.
  const q = useQuery({
    queryKey: ['biz', 'mis-negocios', userId],
    queryFn: async () => {
      const { data, error } = await createClient().rpc('my_businesses');
      if (error) throw error;
      return (data ?? []) as MiNegocio[];
    },
    initialData: negociosIniciales,
    enabled: abierto || !!negociosIniciales,
    staleTime: 60_000,
  });

  const negocios = q.data ?? [];
  const propios = negocios.filter((n) => n.role === 'owner').length;

  async function elegir(destino: 'personal' | string) {
    if (cambiando) return;
    const actual = variante === 'persona' ? 'personal' : activoId;
    if (destino === actual) return;
    setCambiando(destino);
    const r = await setActiveContext(destino);
    if (!r.ok) {
      setCambiando(null);
      useToastStore.getState().push({ variant: 'error', title: t('contexto.error') });
      return;
    }
    // Todo lo cacheado de un negocio cuelga de ['biz', id, …] (03 §3.5).
    qc.removeQueries({ queryKey: ['biz'], predicate: (x) => x.queryKey[1] !== 'mis-negocios' });
    router.push(destino === 'personal' ? '/' : '/negocio');
    router.refresh();
    setAbierto(false);
    setCambiando(null);
  }

  return (
    <Menu.Root open={abierto} onOpenChange={setAbierto}>
      <Menu.Trigger asChild>
        {/* The trigger shows the account you are IN, with the same icon the
            menu uses for it: a person in the personal app, a store inside a
            business. It used to show a store in the personal app — which read
            as "you are in a business" exactly when you were not. */}
        {variante === 'persona' ? (
          <button
            type="button"
            aria-label={`${t('contexto.estasViendo')}: ${t('contexto.personal')}. ${t('contexto.abrir')}`}
            className="group inline-flex h-11 items-center gap-0.5 rounded-full pl-1.5 pr-1 text-muted-foreground transition-colors duration-150 hover:bg-surface-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-surface-2 data-[state=open]:text-foreground"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary">
              <User className="h-4 w-4" strokeWidth={2.4} aria-hidden />
            </span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" aria-hidden />
          </button>
        ) : (
          <button
            type="button"
            aria-label={`${t('contexto.estasViendo')}: ${activoNombre ?? t('contexto.personal')}. ${t('contexto.abrir')}`}
            className="group inline-flex h-10 min-w-0 max-w-[14rem] items-center gap-1.5 rounded-button px-2 text-small font-semibold text-foreground transition-colors duration-150 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-surface-2 sm:max-w-[20rem]"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
              {activoId ? <Store className="h-4 w-4" aria-hidden /> : <User className="h-4 w-4" aria-hidden />}
            </span>
            <span className="truncate">{activoNombre ?? t('contexto.personal')}</span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </button>
        )}
      </Menu.Trigger>

      <Menu.Portal>
        <Menu.Content
          align={variante === 'persona' ? 'end' : 'start'}
          sideOffset={8}
          className="z-50 w-[min(18rem,calc(100vw-2rem))] rounded-card border border-border bg-surface p-1.5 shadow-soft-lg outline-none data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          <Menu.Label className="eyebrow px-2.5 pb-1.5 pt-1 text-muted-foreground">
            {t('contexto.estasViendo')}
          </Menu.Label>

          <Opcion
            icono={<User className="h-4 w-4" />}
            titulo={t('contexto.personal')}
            activa={variante === 'persona'}
            cargando={cambiando === 'personal'}
            onSelect={() => void elegir('personal')}
          />

          {q.isLoading && !negocios.length ? (
            <div className="space-y-1.5 px-2.5 py-2">
              <Skeleton className="h-8 w-full rounded-button" />
            </div>
          ) : (
            negocios.map((n) => (
              <Opcion
                key={n.id}
                icono={<Store className="h-4 w-4" />}
                titulo={n.nombre}
                detalle={t(`estado.${n.status}`)}
                activa={variante === 'negocio' && n.id === activoId}
                cargando={cambiando === n.id}
                onSelect={() => void elegir(n.id)}
              />
            ))
          )}

          {q.isSuccess && propios < MAX_NEGOCIOS_OWNER && (
            <>
              <Menu.Separator className="my-1.5 h-px bg-border" />
              <Menu.Item asChild>
                <Link
                  href="/negocio/alta?nuevo=1"
                  prefetch={false}
                  className="flex cursor-pointer items-center gap-2.5 rounded-button px-2.5 py-2 text-small font-medium text-primary outline-none transition-colors duration-150 data-[highlighted]:bg-primary/10"
                >
                  <Plus className="h-4 w-4" />
                  {t('contexto.crear')}
                </Link>
              </Menu.Item>
            </>
          )}
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  );
}

function Opcion({
  icono,
  titulo,
  detalle,
  activa,
  cargando,
  onSelect,
}: {
  icono: React.ReactNode;
  titulo: string;
  detalle?: string;
  activa: boolean;
  cargando: boolean;
  onSelect: () => void;
}) {
  return (
    <Menu.Item
      onSelect={(e) => {
        // Se cierra cuando el cambio terminó, no antes: así se ve que está pasando.
        e.preventDefault();
        onSelect();
      }}
      className={cn(
        'flex cursor-pointer items-center gap-2.5 rounded-button px-2.5 py-2 text-small outline-none transition-colors duration-150 data-[highlighted]:bg-surface-2',
        activa && 'bg-primary/10',
      )}
    >
      <span
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
          activa ? 'bg-primary/15 text-primary' : 'bg-surface-2 text-muted-foreground',
        )}
      >
        {icono}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{titulo}</span>
        {detalle && <span className="block truncate text-caption text-muted-foreground">{detalle}</span>}
      </span>
      {cargando ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" aria-hidden />
      ) : (
        activa && <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden />
      )}
    </Menu.Item>
  );
}
