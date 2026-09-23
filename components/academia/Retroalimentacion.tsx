'use client';

import { useTranslations } from 'next-intl';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Check, Minus, RotateCcw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Pip } from '@/components/pip/Pip';
import type { Correccion } from '@/lib/academia/modelo';
import { cn } from '@/lib/utils/cn';

/**
 * El panel que sube cuando se corrige un paso.
 *
 * LO QUE NO HACE, a propósito: no sacude la pantalla, no la tiñe de rojo, no
 * suena nada al errar. Equivocarse es la parte donde más se aprende, y
 * castigarla con una animación de fracaso enseña a no arriesgar. Verde cuando
 * salió bien, coral cuando no, y la explicación en los dos casos: la
 * explicación es el contenido, no un premio.
 *
 * Las fuentes ya NO se muestran acá. Viven en su propia página (Ajustes →
 * Fuentes de la Academia, o el pie de las páginas legales): dentro de la
 * lección competían con la explicación por la atención y casi nadie las abría
 * en el medio de una sesión.
 */
export function Retroalimentacion({
  correccion,
  ultima,
  mostrarPip,
  onSeguir,
  cargando,
}: {
  correccion: Correccion | null;
  ultima: boolean;
  mostrarPip: boolean;
  onSeguir: () => void;
  cargando?: boolean;
}) {
  const t = useTranslations('arbol');
  const quieto = useReducedMotion();

  const tono = !correccion
    ? null
    : correccion.correcto
      ? { texto: t('bien'), color: 'text-brote-green', borde: 'border-brote-green/50', fondo: 'bg-brote-green/[0.07]', Icono: Check }
      : correccion.parcial > 0
        ? { texto: t('casi', { n: Math.round(correccion.parcial * 100) }), color: 'text-brote-sun', borde: 'border-brote-sun/50', fondo: 'bg-brote-sun/[0.07]', Icono: Minus }
        : { texto: t('mal'), color: 'text-brote-coral', borde: 'border-brote-coral/50', fondo: 'bg-brote-coral/[0.06]', Icono: X };

  return (
    <AnimatePresence>
      {correccion && tono ? (
        <motion.div
          key="retro"
          initial={quieto ? false : { y: '100%' }}
          animate={{ y: 0 }}
          exit={quieto ? undefined : { y: '100%' }}
          transition={{ type: 'spring', stiffness: 320, damping: 34 }}
          className={cn('pb-safe absolute inset-x-0 bottom-0 z-10 border-t-2 bg-surface shadow-soft-lg', tono.borde)}
          role="status"
        >
          <div className={cn('px-4 pb-4 pt-3.5', tono.fondo)}>
            <div className="mx-auto w-full max-w-2xl">
              <div className="flex items-start gap-3">
                {mostrarPip ? (
                  <Pip size={48} mood="worried" className="shrink-0" />
                ) : (
                  <span
                    className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2', tono.borde, tono.color)}
                    aria-hidden
                  >
                    <tono.Icono className="h-4 w-4" />
                  </span>
                )}
                <div className="max-h-[38vh] min-w-0 flex-1 overflow-y-auto">
                  <p className={cn('font-display text-h2 font-bold leading-tight', tono.color)}>{tono.texto}</p>
                  {mostrarPip ? <p className="mt-1 text-small leading-relaxed">{t('recuperacion')}</p> : null}
                  {correccion.nota ? (
                    <p className="mt-1.5 border-l-2 border-brote-coral/50 pl-2.5 text-small leading-relaxed">{correccion.nota}</p>
                  ) : null}
                  {correccion.explicacion ? (
                    <p className="mt-1.5 text-small leading-relaxed text-foreground/90">{correccion.explicacion}</p>
                  ) : null}
                  {correccion.reencolada ? (
                    <p className="mt-2 inline-flex items-center gap-1.5 text-caption font-semibold text-muted-foreground">
                      <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                      {t('reencolada')}
                    </p>
                  ) : null}
                </div>
              </div>
              <Button block size="lg" className="mt-3" onClick={onSeguir} loading={cargando} autoFocus>
                {ultima ? t('terminar') : t('continuar')}
              </Button>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
