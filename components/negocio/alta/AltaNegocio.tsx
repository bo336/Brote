'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowRight, Check, ChevronRight, Plus } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { ProgressBar } from '@/components/ui/progress';
import { VerificacionMetodos } from '@/components/negocio/VerificacionMetodos';
import { Paso1, Paso2, Paso3, Paso4, PieDePaso, avisarGuardado, guardadoReciente } from '@/components/negocio/alta/Pasos';
import { enviarSolicitud, setActiveContext } from '@/lib/negocio/acciones';
import type { MiNegocio, NegocioDetalle } from '@/lib/supabase/rows-negocio';
import { useToastStore } from '@/stores/toast';
import { cn } from '@/lib/utils/cn';

const PASO_DE_FALTANTE: Record<string, number> = {
  provincia: 1,
  sitio_o_instagram: 2,
  email_contacto: 2,
  descripcion: 3,
  intereses: 4,
};

/** El alta: un paso por pantalla, con su barra `N de 5` (fase 1 §5.1). */
export function AltaNegocio({ negocio, paso }: { negocio: NegocioDetalle | null; paso: number }) {
  const t = useTranslations('negocio.alta');
  const router = useRouter();

  const irA = (p: number, extra = '') => {
    router.replace(`/negocio/alta?paso=${p}${extra}`, { scroll: true });
    router.refresh();
  };

  return (
    <div>
      {!negocio && (
        <header className="mb-5 sm:mb-7">
          <span className="eyebrow text-muted-foreground">{t('eyebrowNuevo')}</span>
          <h1 className="mt-1 font-display text-h1 font-bold sm:mt-1.5 sm:text-display-l">{t('tituloNuevo')}</h1>
          <p className="mt-2 text-small leading-relaxed text-muted-foreground">{t('introNuevo')}</p>
        </header>
      )}

      <Progreso paso={paso} />

      <div key={paso} className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-right-2 motion-safe:duration-300">
        <h2 className={cn('font-display font-bold', negocio ? 'text-h1' : 'text-h2 sm:text-h1')}>
          {t(`paso${paso}.titulo`)}
        </h2>
        {/* En un negocio nuevo la intro de arriba ya dice qué es esto: el subtítulo del paso 1 sobra en un teléfono. */}
        <p
          className={cn(
            'mb-4 mt-1 text-small leading-relaxed text-muted-foreground sm:mb-5',
            !negocio && 'hidden sm:block',
          )}
        >
          {t(`paso${paso}.subtitulo`)}
        </p>
        {!negocio && <div className="mb-4 sm:hidden" />}

        {paso === 1 && <Paso1 negocio={negocio} onListo={(p, extra) => irA(p, extra)} />}
        {negocio && paso === 2 && <Paso2 negocio={negocio} onListo={irA} />}
        {negocio && paso === 3 && <Paso3 negocio={negocio} onListo={irA} />}
        {negocio && paso === 4 && <Paso4 negocio={negocio} onListo={irA} />}
        {negocio && paso === 5 && <Paso5 negocio={negocio} onVolver={() => irA(4)} />}
      </div>
    </div>
  );
}

function Progreso({ paso }: { paso: number }) {
  const t = useTranslations('negocio.alta');
  // Se decide al montar: la página se vuelve a montar en cada paso, y lo que
  // se acaba de guardar es el paso anterior.
  const [guardado, setGuardado] = useState(false);
  useEffect(() => {
    if (!guardadoReciente()) return;
    setGuardado(true);
    const id = setTimeout(() => setGuardado(false), 2600);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className="mb-4 sm:mb-6">
      <div className="mb-2 flex items-center justify-between">
        <span className="eyebrow text-muted-foreground tnum">{t('progreso', { n: paso })}</span>
        <span
          aria-live="polite"
          className={cn(
            'inline-flex items-center gap-1 text-caption text-muted-foreground transition-opacity duration-500',
            guardado ? 'opacity-100' : 'opacity-0',
          )}
        >
          <Check className="h-3.5 w-3.5 text-primary" />
          {t('guardado')}
        </span>
      </div>
      {/* `ProgressBar` toma 0..1, no un porcentaje (07 §2.1, trampa 3). */}
      <ProgressBar value={paso / 5} height={4} />
    </div>
  );
}

function Paso5({ negocio, onVolver }: { negocio: NegocioDetalle; onVolver: () => void }) {
  const t = useTranslations('negocio');
  const router = useRouter();
  const [despues, setDespues] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [faltan, setFaltan] = useState<string[]>([]);
  const verificada = negocio.verificaciones.some((v) => v.status === 'verificado');

  async function enviar() {
    setEnviando(true);
    setFaltan([]);
    const r = await enviarSolicitud(negocio.id);
    if (r.ok) {
      avisarGuardado();
      router.replace('/negocio/alta?enviado=1', { scroll: true });
      router.refresh();
      return;
    }
    setEnviando(false);
    if (r.error.startsWith('incompleta:')) {
      setFaltan(r.error.slice('incompleta:'.length).split(',').filter(Boolean));
      return;
    }
    useToastStore.getState().push({
      variant: 'error',
      title: t.has(`errores.${r.error}`) ? t(`errores.${r.error}`) : t('errores.error'),
    });
    if (r.error === 'ya_enviada' || r.error === 'no_editable') router.push('/negocio');
  }

  const primerFaltante = faltan.map((f) => PASO_DE_FALTANTE[f]).filter(Boolean).sort()[0];

  return (
    <div>
      {verificada || !despues ? (
        <>
          <VerificacionMetodos negocio={negocio} puedeEditar />
          {!verificada && (
            <button
              type="button"
              onClick={() => setDespues(true)}
              className="mt-4 text-small font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground"
            >
              <span className="link-underline">{t('alta.paso5.despues')}</span>
            </button>
          )}
        </>
      ) : (
        <div className="flex items-start justify-between gap-3 border-y border-hairline py-4">
          <p className="text-small leading-relaxed text-muted-foreground">{t('alta.paso5.despuesNota')}</p>
          <button
            type="button"
            onClick={() => setDespues(false)}
            className="shrink-0 text-small font-medium text-primary"
          >
            <span className="link-underline">{t('alta.paso5.verAhora')}</span>
          </button>
        </div>
      )}

      {faltan.length > 0 && (
        <div role="alert" className="mt-5 border-l-2 border-brote-coral pl-3 text-small leading-relaxed">
          <p>{t('errores.incompleta', { campos: faltan.map((f) => t(`faltan.${f}`)).join(', ') })}</p>
          {primerFaltante && (
            <Link
              href={`/negocio/alta?paso=${primerFaltante}`}
              className="mt-1 inline-flex items-center gap-1 font-medium text-primary"
            >
              <span className="link-underline">{t('alta.progreso', { n: primerFaltante })}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      )}

      <PieDePaso onAtras={onVolver} ocupado={enviando} fijo>
        <Button type="button" className="rounded-pill" loading={enviando} onClick={() => void enviar()}>
          {t('alta.enviar')}
        </Button>
      </PieDePaso>
    </div>
  );
}

/** La pantalla de espera honesta después de enviar (07 §4.2). */
export function AltaEnviada({ negocio }: { negocio: NegocioDetalle }) {
  const t = useTranslations('negocio.alta.enviado');
  const verificada = negocio.verificaciones.some((v) => v.status === 'verificado');

  return (
    <div className="pt-4">
      <TildeDibujado />
      <h1 className="mt-5 font-display text-display-l font-bold">{t('titulo')}</h1>
      <p className="mt-3 text-body leading-relaxed text-muted-foreground">{t('cuerpo')}</p>
      <div className="mt-7 flex flex-wrap gap-2.5">
        {!verificada && (
          <Link href="/negocio/verificacion" className={cn(buttonVariants({ variant: 'primary' }), 'rounded-pill')}>
            {t('verificar')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
        <Link
          href="/negocio"
          className={cn(buttonVariants({ variant: verificada ? 'primary' : 'secondary' }), verificada && 'rounded-pill')}
        >
          {t('irNegocio')}
        </Link>
      </div>
    </div>
  );
}

/** Una confirmación, no una fiesta: un tilde que se dibuja (07 §6). */
function TildeDibujado() {
  return (
    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden>
        <path
          d="M5 12.5l4.5 4.5L19 7.5"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          className="motion-safe:[animation:tilde_300ms_ease-out_150ms_both] [stroke-dasharray:1]"
        />
      </svg>
      <style>{'@keyframes tilde{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}'}</style>
    </span>
  );
}

/** Tiene negocios pero ninguno elegido: primero elegir, después crear. */
export function ElegirNegocio({ negocios, puedeCrear }: { negocios: MiNegocio[]; puedeCrear: boolean }) {
  const t = useTranslations('negocio');
  const router = useRouter();
  const [eligiendo, setEligiendo] = useState<string | null>(null);

  async function elegir(id: string) {
    setEligiendo(id);
    const r = await setActiveContext(id);
    if (!r.ok) {
      setEligiendo(null);
      useToastStore.getState().push({ variant: 'error', title: t('contexto.error') });
      return;
    }
    router.push('/negocio');
    router.refresh();
  }

  return (
    <div className="pt-2">
      <span className="eyebrow text-muted-foreground">{t('alta.elegir.eyebrow')}</span>
      <h1 className="mt-1.5 font-display text-display-l font-bold">{t('alta.elegir.titulo')}</h1>

      {negocios.length > 0 && (
        <ul className="mt-6 border-y border-hairline divide-hairline">
          {negocios.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                disabled={!!eligiendo}
                onClick={() => void elegir(n.id)}
                className="group flex w-full items-center gap-3 py-3.5 text-left transition-opacity duration-150 disabled:opacity-60"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-body font-semibold">
                    <span className="link-underline">{n.nombre}</span>
                  </span>
                  <span className="block text-caption text-muted-foreground">
                    {t(`estado.${n.status}`)} · {t(`nivel.${n.tier}`)}
                  </span>
                </span>
                <ChevronRight
                  className={cn(
                    'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary',
                    eligiendo === n.id && 'animate-pulse text-primary',
                  )}
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      {puedeCrear ? (
        <Link
          href="/negocio/alta?nuevo=1"
          className="mt-5 inline-flex items-center gap-2 text-small font-semibold text-primary"
        >
          <Plus className="h-4 w-4" />
          <span className="link-underline">{t('alta.elegir.nuevo')}</span>
        </Link>
      ) : (
        <p className="mt-5 text-small text-muted-foreground">{t('alta.elegir.limite')}</p>
      )}
    </div>
  );
}
