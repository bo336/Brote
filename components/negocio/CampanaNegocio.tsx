'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import * as Menu from '@radix-ui/react-dropdown-menu';
import { Bell } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils/cn';

interface Aviso {
  id: string;
  title_es: string;
  body_es: string | null;
  data: { url?: string } | null;
  read: boolean;
  created_at: string;
}

/**
 * La campana del espacio de negocio (02 §7).
 *
 * Los avisos de empresa NUNCA aparecen en la campana personal y viceversa: la
 * consulta de allá filtra `business_id is null` y la de acá filtra por esta
 * empresa. Una persona que trabaja en dos negocios ve en cada espacio lo suyo.
 */
export function CampanaNegocio({ negocioId }: { negocioId: string }) {
  const t = useTranslations('negocio.avisos');
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [abierta, setAbierta] = useState(false);

  async function cargar() {
    const { data } = await createClient()
      .from('notifications')
      .select('id, title_es, body_es, data, read, created_at')
      .eq('business_id', negocioId)
      .order('created_at', { ascending: false })
      .limit(20);
    setAvisos((data ?? []) as Aviso[]);
  }

  useEffect(() => {
    void cargar();
    const id = setInterval(() => void cargar(), 120_000);
    const alVolver = () => void cargar();
    window.addEventListener('focus', alVolver);
    return () => {
      clearInterval(id);
      window.removeEventListener('focus', alVolver);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [negocioId]);

  const sinLeer = avisos.filter((a) => !a.read).length;

  async function marcarLeidos() {
    if (sinLeer === 0) return;
    setAvisos((prev) => prev.map((a) => ({ ...a, read: true })));
    await createClient()
      .from('notifications')
      .update({ read: true })
      .eq('business_id', negocioId)
      .eq('read', false);
  }

  return (
    <Menu.Root
      open={abierta}
      onOpenChange={(v) => {
        setAbierta(v);
        if (v) void marcarLeidos();
      }}
    >
      <Menu.Trigger asChild>
        <button
          type="button"
          aria-label={sinLeer > 0 ? `${t('titulo')} (${sinLeer})` : t('titulo')}
          className="press relative inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors duration-150 hover:bg-surface-2 hover:text-foreground data-[state=open]:bg-surface-2 data-[state=open]:text-foreground"
        >
          <Bell className="h-[18px] w-[18px]" />
          {sinLeer > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brote-coral px-1 text-[10px] font-bold leading-none text-white ring-2 ring-background tnum">
              {sinLeer > 9 ? '9+' : sinLeer}
            </span>
          )}
        </button>
      </Menu.Trigger>

      <Menu.Portal>
        <Menu.Content
          align="end"
          sideOffset={8}
          className="z-50 max-h-[70vh] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto rounded-card border border-border bg-surface p-1.5 shadow-soft-lg outline-none"
        >
          <Menu.Label className="eyebrow px-2.5 pb-1.5 pt-1 text-muted-foreground">{t('titulo')}</Menu.Label>
          {avisos.length === 0 ? (
            <p className="px-2.5 pb-2 text-small text-muted-foreground">{t('vacio')}</p>
          ) : (
            avisos.map((a) => (
              <Menu.Item key={a.id} asChild>
                <Link
                  href={a.data?.url ?? '/negocio'}
                  prefetch={false}
                  className={cn(
                    'block cursor-pointer rounded-button px-2.5 py-2 outline-none transition-colors duration-150 data-[highlighted]:bg-surface-2',
                    !a.read && 'bg-primary/5',
                  )}
                >
                  <p className="text-small font-semibold leading-snug">{a.title_es}</p>
                  {a.body_es && <p className="mt-0.5 text-caption leading-relaxed text-muted-foreground">{a.body_es}</p>}
                  <p className="mt-1 text-[11px] text-muted-foreground tnum">
                    {new Date(a.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
                  </p>
                </Link>
              </Menu.Item>
            ))
          )}
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  );
}
