'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Droplets, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Pip } from '@/components/pip/Pip';
import { useSession } from '@/stores/session';
import { BRAND } from '@/lib/brand';
import type { SaviaEstado } from '@/lib/academia/types';

/**
 * Cuando no queda savia.
 *
 * El orden de esta pantalla es una decisión, no un accidente (12-economy §3):
 *
 *   1. **Cuánto falta.** Un límite sin reloj se siente arbitrario.
 *   2. **Regar, que es gratis.** Lo que el límite nunca bloquea es repasar:
 *      la savia frena territorio nuevo, no la retención.
 *   3. **Una acción de verdad.** Es para lo que sirve todo esto. Si alguien se
 *      quedó sin hojas y hace algo en el mundo real, el día salió mejor.
 *   4. **Una línea de {plus}, calma y última.** Una, sin contador regresivo, sin
 *      "¡destrabá ahora!", sin botón más grande que los otros.
 *
 * No hay camino de anuncios acá, y en una cuenta `kid` tampoco hay línea de
 * suscripción: a un pibe no se le vende nada.
 */
export function SaviaVacia({ savia }: { savia: SaviaEstado | null }) {
  const t = useTranslations('academia');
  const perfil = useSession((s) => s.profile);
  const esPibe = perfil?.accountType === 'kid';
  const restante = useCuentaRegresiva(savia?.reset_at ?? null);

  return (
    <section className="rounded-card border border-hairline bg-surface-2 p-5">
      <div className="flex items-start gap-3">
        <Pip size={56} mood="sleepy" />
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-h3 font-bold leading-tight">{t('saviaVaciaTitulo')}</h2>
          <p className="mt-1 text-small leading-relaxed text-muted-foreground">{t('saviaVaciaCuerpo')}</p>
          {restante ? (
            <p className="tnum mt-2 text-small font-semibold text-brote-aqua">
              {t('saviaVuelve', { tiempo: restante })}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 space-y-3 border-t border-hairline pt-4">
        <div>
          <p className="text-small leading-relaxed">{t('saviaRegar')}</p>
          <Button asChild block variant="secondary" className="mt-2">
            <Link href="/aprender/riego">
              <Droplets className="h-4 w-4" aria-hidden />
              {t('regarCta')}
            </Link>
          </Button>
        </div>

        <div>
          <p className="text-small leading-relaxed">{t('saviaAccion')}</p>
          <Button asChild block className="mt-2">
            <Link href="/acciones">{t('saviaAccionCta')}</Link>
          </Button>
        </div>
      </div>

      {!esPibe ? (
        <p className="mt-4 flex flex-wrap items-center gap-x-1.5 gap-y-1 border-t border-hairline pt-3 text-caption text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-brote-sun" aria-hidden />
          {t('saviaPlus', { plus: `${BRAND.name}+` })}
          <Link
            href="/brote-plus"
            className="font-semibold text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {t('saviaPlusCta', { plus: `${BRAND.name}+` })}
          </Link>
        </p>
      ) : null}
    </section>
  );
}

/**
 * Cuenta regresiva hasta la medianoche local, en `Xh Ym`.
 *
 * Refresca cada 30 s y no cada segundo: un reloj de segundos en una pantalla
 * que dice "volvé mañana" es exactamente la tensión que no se quiere generar.
 */
function useCuentaRegresiva(resetAt: string | null): string | null {
  const [texto, setTexto] = useState<string | null>(null);

  useEffect(() => {
    if (!resetAt) {
      setTexto(null);
      return;
    }
    const calcular = () => {
      const ms = new Date(resetAt).getTime() - Date.now();
      if (!Number.isFinite(ms) || ms <= 0) return setTexto(null);
      const min = Math.floor(ms / 60_000);
      const h = Math.floor(min / 60);
      setTexto(h > 0 ? `${h} h ${min % 60} min` : `${min} min`);
    };
    calcular();
    const id = setInterval(calcular, 30_000);
    return () => clearInterval(id);
  }, [resetAt]);

  return texto;
}
