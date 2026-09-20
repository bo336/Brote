'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Globe2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { marcarObjetivoPublico } from '@/lib/negocio/plan-acciones';
import { toast } from '@/stores/toast';

/**
 * El historial público de mejora, objetivo por objetivo (fase 4 §8).
 *
 * Se muestra en la ficha pública del negocio: el título, la métrica y la
 * fecha. **El dossier no sale nunca**, ni entero ni en pedazos: de ahí salió el
 * objetivo, y esa información es confidencial (08 §7.1).
 *
 * Es de los planes Raíz y Bosque. Cuando no corresponde, no se esconde el
 * control: se explica, con el nombre del plan que lo destraba.
 */
export function HistorialPublico({
  goalId,
  inicial,
  permitido,
  slugNegocio,
}: {
  goalId: string;
  inicial: boolean;
  permitido: boolean;
  slugNegocio: string;
}) {
  const t = useTranslations('negocio.mejora.publico');
  const [valor, setValor] = useState(inicial);
  const [ocupado, setOcupado] = useState(false);

  async function cambiar(v: boolean) {
    setOcupado(true);
    setValor(v);
    const r = await marcarObjetivoPublico(goalId, v);
    setOcupado(false);
    if (!r.ok) {
      setValor(!v);
      toast.error(t('errorTitulo'), r.error === 'plan' ? t('errorPlan') : t('errorCuerpo'));
    }
  }

  return (
    <section className="rounded-card border border-border bg-surface p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-primary/15 text-primary">
          <Globe2 className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-small font-semibold">{t('titulo')}</p>
          <p className="mt-0.5 text-caption leading-relaxed text-muted-foreground">
            {permitido ? t('ayuda') : t('ayudaPlan')}
          </p>
          {permitido && valor && (
            <Link
              href={`/mercado/negocio/${slugNegocio}`}
              prefetch={false}
              className="press mt-1.5 inline-block text-caption font-semibold text-primary"
            >
              {t('verFicha')}
            </Link>
          )}
          {!permitido && (
            <Link href="/negocio/plan" prefetch={false} className="press mt-1.5 inline-block text-caption font-semibold text-primary">
              {t('verPlanes')}
            </Link>
          )}
        </div>
        <Switch
          checked={valor}
          disabled={!permitido || ocupado}
          onCheckedChange={(v) => void cambiar(v)}
          aria-label={t('titulo')}
        />
      </div>
    </section>
  );
}
