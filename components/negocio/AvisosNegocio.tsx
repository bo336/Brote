'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Switch } from '@/components/ui/switch';
import { createClient } from '@/lib/supabase/client';
import { guardarAvisos } from '@/lib/negocio/plan-acciones';
import { useSession } from '@/stores/session';
import { toast } from '@/stores/toast';

type Clave = 'listados' | 'mejora' | 'cuenta';
const CLAVES: Clave[] = ['listados', 'mejora', 'cuenta'];

/**
 * Qué avisos quiere recibir esta persona de esta empresa (fase 4 §6).
 *
 * Los avisos de PAGO no se pueden apagar y la pantalla lo dice: perderse uno
 * termina con los listados despublicados, y eso no puede depender de un
 * interruptor que alguien tocó hace tres meses.
 *
 * Esto apaga el push; el aviso queda igual en la campana de la empresa.
 */
export function AvisosNegocio({ negocioId }: { negocioId: string }) {
  const t = useTranslations('negocio.avisos');
  const userId = useSession((s) => s.profile?.id);
  const [prefs, setPrefs] = useState<Record<Clave, boolean>>({ listados: true, mejora: true, cuenta: true });
  const [listo, setListo] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let vivo = true;
    void createClient()
      .from('business_members')
      .select('avisos')
      .eq('business_id', negocioId)
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (!vivo) return;
        const a = (data?.avisos ?? {}) as Partial<Record<Clave, boolean>>;
        setPrefs({ listados: a.listados ?? true, mejora: a.mejora ?? true, cuenta: a.cuenta ?? true });
        setListo(true);
      });
    return () => {
      vivo = false;
    };
  }, [negocioId, userId]);

  async function cambiar(clave: Clave, valor: boolean) {
    const siguiente = { ...prefs, [clave]: valor };
    setPrefs(siguiente);
    const r = await guardarAvisos(negocioId, siguiente);
    if (!r.ok) {
      setPrefs(prefs);
      toast.error(t('errorTitulo'), t('errorCuerpo'));
    }
  }

  if (!listo) return null;

  return (
    <section className="rounded-card border border-border bg-surface p-5">
      <h2 className="font-display text-h3 font-bold">{t('prefsTitulo')}</h2>
      <p className="mt-1 text-small leading-relaxed text-muted-foreground">{t('prefsTexto')}</p>
      <ul className="mt-3 divide-y divide-hairline">
        {CLAVES.map((c) => (
          <li key={c} className="flex items-center gap-3 py-2.5">
            <span className="min-w-0 flex-1 text-small">{t(`tipos.${c}`)}</span>
            <Switch checked={prefs[c]} onCheckedChange={(v) => void cambiar(c, v)} aria-label={t(`tipos.${c}`)} />
          </li>
        ))}
        <li className="flex items-center gap-3 py-2.5">
          <span className="min-w-0 flex-1 text-small">{t('tipos.pagos')}</span>
          <span className="text-caption text-muted-foreground">{t('siempre')}</span>
        </li>
      </ul>
    </section>
  );
}
