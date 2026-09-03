'use client';

import { useTranslations } from 'next-intl';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Check, Minus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Pip } from '@/components/pip/Pip';
import { FuenteChip } from '@/components/academia/FuenteChip';
import { FuerzaMedidor } from '@/components/academia/FuerzaMedidor';
import type { RespuestaCorregida } from '@/lib/academia/types';
import { cn } from '@/lib/utils/cn';

/**
 * El panel que sube cuando se corrige un paso.
 *
 * LO QUE NO HACE, y es deliberado (15-ui-motion.md §4): no sacude la pantalla,
 * no la tiñe de rojo, no suena nada al errar. Equivocarse es la parte del
 * aprendizaje donde más se aprende, y castigarla con una animación de fracaso
 * enseña a no arriesgar. Verde cuando salió bien, coral cuando no, y la
 * explicación en los dos casos.
 *
 * La fuente está SIEMPRE y siempre se puede tocar: la explicación sin su fuente
 * es una afirmación nuestra sobre el ambiente, y esta sección no hace eso.
 */
export function Retroalimentacion({
  correccion,
  ultima,
  mostrarPip,
  onSeguir,
  cargando,
}: {
  correccion: RespuestaCorregida | null;
  ultima: boolean;
  /** Pip aparece cuando el servidor dice `recuperacion`, y una sola vez. */
  mostrarPip: boolean;
  onSeguir: () => void;
  cargando?: boolean;
}) {
  const t = useTranslations('academia');
  const quieto = useReducedMotion();

  const tono = !correccion
    ? null
    : correccion.correcto
      ? { texto: t('bien'), color: 'text-brote-green', borde: 'border-brote-green/40', Icono: Check }
      : correccion.parcial > 0
        ? { texto: t('casi'), color: 'text-brote-sun', borde: 'border-brote-sun/40', Icono: Minus }
        : { texto: t('mal'), color: 'text-brote-coral', borde: 'border-brote-coral/40', Icono: X };

  return (
    <AnimatePresence>
      {correccion && tono ? (
        <motion.div
          key="retro"
          initial={quieto ? false : { y: '100%' }}
          animate={{ y: 0 }}
          exit={quieto ? undefined : { y: '100%' }}
          transition={{ type: 'spring', stiffness: 320, damping: 34 }}
          className={cn(
            'pb-safe absolute inset-x-0 bottom-0 z-10 border-t-2 bg-surface px-4 pb-4 pt-3 shadow-soft-lg',
            tono.borde,
          )}
          role="status"
        >
          <div className="mx-auto w-full max-w-2xl">
            <div className="flex items-start gap-2.5">
              {mostrarPip ? (
                <Pip size={44} mood="worried" className="shrink-0" />
              ) : (
                <span
                  className={cn(
                    'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2',
                    tono.borde,
                    tono.color,
                  )}
                  aria-hidden
                >
                  <tono.Icono className="h-4 w-4" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className={cn('font-display text-h3 font-bold leading-tight', tono.color)}>{tono.texto}</p>
                {correccion.explicacion ? (
                  <p className="mt-1 text-small leading-relaxed">{correccion.explicacion}</p>
                ) : null}
                {correccion.nota_opcion ? (
                  <p className="mt-1.5 border-l-2 border-hairline pl-2.5 text-small leading-relaxed text-muted-foreground">
                    {correccion.nota_opcion}
                  </p>
                ) : null}
                {correccion.reencolada ? (
                  <p className="mt-1.5 text-caption text-muted-foreground">{t('reencolada')}</p>
                ) : null}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {correccion.fuente ? <FuenteChip fuente={correccion.fuente} /> : null}
              {correccion.fuerza_concepto > 0 ? (
                <span className="min-w-[7rem] flex-1">
                  <FuerzaMedidor fuerza={correccion.fuerza_concepto} compacto />
                </span>
              ) : null}
            </div>

            <Button block className="mt-3" onClick={onSeguir} disabled={cargando} autoFocus>
              {cargando ? t('cargandoSesion') : ultima ? t('terminar') : t('continuar')}
            </Button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
