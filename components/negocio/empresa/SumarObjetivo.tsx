'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Loader2, Plus, Store, Target } from 'lucide-react';
import { cambiarObjetivo } from '@/lib/negocio/acciones';
import { useToastStore } from '@/stores/toast';

/**
 * The quiet door to the other kind of business account: a company that
 * improves can also open its store, and a store can join the programme.
 * Owner only — the server checks it again.
 */
export function SumarObjetivo({ negocioId, sumar }: { negocioId: string; sumar: 'vender' | 'mejorar' }) {
  const t = useTranslations('negocio.sumar');
  const router = useRouter();
  const [ocupado, setOcupado] = useState(false);
  const Icono = sumar === 'vender' ? Store : Target;

  async function hacer() {
    if (ocupado) return;
    setOcupado(true);
    const r = await cambiarObjetivo(negocioId, 'ambos');
    setOcupado(false);
    if (!r.ok) {
      useToastStore.getState().push({ variant: 'error', title: t('error') });
      return;
    }
    router.push(sumar === 'vender' ? '/negocio/listados' : '/negocio/mejora');
    router.refresh();
  }

  return (
    <div className="flex items-start gap-3 rounded-card border border-dashed border-border p-4">
      <Icono className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-small font-semibold">{t(`${sumar}Titulo`)}</p>
        <p className="mt-0.5 text-caption leading-relaxed text-muted-foreground">{t(`${sumar}Cuerpo`)}</p>
      </div>
      <button
        type="button"
        onClick={() => void hacer()}
        disabled={ocupado}
        className="press inline-flex shrink-0 items-center gap-1.5 rounded-pill border border-border bg-surface px-3 py-1.5 text-small font-semibold hover:border-primary/40 disabled:opacity-60"
      >
        {ocupado ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />}
        {t('sumar')}
      </button>
    </div>
  );
}
