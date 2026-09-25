'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';
import { PasoCompromiso } from '@/components/negocio/vendedor/PasoCompromiso';
import { PasoMercadoPago } from '@/components/negocio/vendedor/PasoMercadoPago';
import { PasoPrueba } from '@/components/negocio/vendedor/PasoPrueba';
import { PasoTienda } from '@/components/negocio/vendedor/PasoTienda';
import { TiendaAbierta } from '@/components/negocio/vendedor/TiendaAbierta';
import { PASOS_ALTA, pasoActual, type EstadoVendedor, type PasoAlta } from '@/lib/negocio/vendedor';
import { cn } from '@/lib/utils/cn';

/**
 * El alta de una tienda: cuatro pasos cortos, y en cada uno se guarda lo hecho
 * (se puede cerrar la pestaña y volver otro día desde otro teléfono).
 *
 *   1. Tu tienda — nombre, qué vendés, dónde, por dónde te contactan.
 *   2. Tu compromiso — dos prácticas concretas que ya hacés, y una foto.
 *   3. La prueba verde — cinco respuestas sobre cómo hablar de ambiente.
 *   4. Mercado Pago — vincular la cuenta y, recién ahí, suscribirse.
 *
 * El estado lo manda el servidor (`vendedor_estado`): esto solo decide qué
 * paso mostrar. Los pasos hechos se pueden volver a abrir; los de adelante,
 * no, hasta completar los anteriores.
 */
export function AltaVendedor({
  estado,
  mp,
  aviso,
}: {
  estado: EstadoVendedor | null;
  mp: { vincular: boolean; cobrar: boolean };
  aviso: { mp: string | null; motivo: string | null };
}) {
  const t = useTranslations('negocio.vendedor');
  const siguiente = estado ? pasoActual(estado) : 'tienda';
  const [paso, setPaso] = useState<PasoAlta>(aviso.mp ? 'mercado_pago' : siguiente);

  // Cuando el servidor dice que se completó un paso, avanzar al que sigue.
  useEffect(() => {
    if (!aviso.mp) setPaso(siguiente);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siguiente]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [paso]);

  if (estado?.abierta) return <TiendaAbierta estado={estado} />;

  const indiceSiguiente = PASOS_ALTA.indexOf(siguiente);

  return (
    <div className="mx-auto max-w-xl pb-16">
      <header>
        <span className="eyebrow text-muted-foreground">{t('eyebrow')}</span>
        <h1 className="mt-1 font-display text-display-l font-bold leading-tight">{t(`pasos.${paso}.titulo`)}</h1>
        <p className="mt-1.5 text-small leading-relaxed text-muted-foreground">{t(`pasos.${paso}.bajada`)}</p>
      </header>

      <ol className="mt-5 grid grid-cols-4 gap-1.5" aria-label={t('progreso')}>
        {PASOS_ALTA.map((p, i) => {
          const hecho = i < indiceSiguiente;
          const actual = p === paso;
          const alcanzable = i <= indiceSiguiente;
          return (
            <li key={p}>
              <button
                type="button"
                disabled={!alcanzable}
                onClick={() => setPaso(p)}
                aria-current={actual ? 'step' : undefined}
                className="group flex w-full flex-col gap-1.5 text-left disabled:cursor-not-allowed"
              >
                <span
                  className={cn(
                    'h-1.5 w-full rounded-full transition-colors duration-300',
                    hecho ? 'bg-primary' : actual ? 'bg-primary/60' : 'bg-border',
                  )}
                />
                <span
                  className={cn(
                    'flex items-center gap-1 text-[11px] font-semibold leading-tight',
                    actual ? 'text-foreground' : alcanzable ? 'text-muted-foreground group-hover:text-foreground' : 'text-muted-foreground/60',
                  )}
                >
                  {hecho && <Check className="h-3 w-3 shrink-0 text-primary" />}
                  <span className="truncate">{t(`pasos.${p}.corto`)}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="mt-7">
        {paso === 'tienda' && <PasoTienda estado={estado} />}
        {paso === 'compromiso' && estado && <PasoCompromiso estado={estado} />}
        {paso === 'prueba' && estado && <PasoPrueba estado={estado} />}
        {paso === 'mercado_pago' && estado && <PasoMercadoPago estado={estado} mp={mp} aviso={aviso} />}
      </div>
    </div>
  );
}
