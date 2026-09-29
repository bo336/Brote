'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/**
 * Las fotos de un producto. En el teléfono se deslizan con el dedo (scroll
 * nativo con snap) y unos puntos dicen cuántas hay; en escritorio, además,
 * miniaturas y flechas. Nada de librerías de carrusel: el scroll del sistema
 * ya tiene la inercia y la accesibilidad resueltas.
 */
export function GaleriaFotos({ fotos, titulo, children }: { fotos: string[]; titulo: string; children?: React.ReactNode }) {
  const t = useTranslations('mercado.ficha2');
  const pista = useRef<HTMLDivElement>(null);
  const [actual, setActual] = useState(0);

  useEffect(() => {
    const el = pista.current;
    if (!el) return;
    const alMover = () => setActual(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
    el.addEventListener('scroll', alMover, { passive: true });
    return () => el.removeEventListener('scroll', alMover);
  }, []);

  function ir(i: number) {
    const el = pista.current;
    if (!el) return;
    const n = Math.max(0, Math.min(fotos.length - 1, i));
    el.scrollTo({ left: n * el.clientWidth, behavior: 'smooth' });
  }

  if (fotos.length === 0) {
    return (
      <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-card bg-surface-2 text-muted-foreground">
        <ImageOff className="h-8 w-8" />
        {children}
      </div>
    );
  }

  return (
    <div>
      <div className="relative overflow-hidden rounded-card bg-surface-2">
        <div
          ref={pista}
          className="no-scrollbar flex aspect-square snap-x snap-mandatory overflow-x-auto"
          tabIndex={0}
          aria-roledescription={t('galeria')}
          aria-label={t('fotoDe', { i: actual + 1, n: fotos.length })}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') ir(actual + 1);
            if (e.key === 'ArrowLeft') ir(actual - 1);
          }}
        >
          {fotos.map((src, i) => (
            <div key={src} className="relative h-full w-full shrink-0 snap-center">
              <Image
                src={src}
                alt={i === 0 ? titulo : ''}
                fill
                priority={i === 0}
                sizes="(max-width: 1024px) 100vw, 640px"
                className="object-cover"
              />
            </div>
          ))}
        </div>
        {children}
        {fotos.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => ir(actual - 1)}
              disabled={actual === 0}
              aria-label={t('anterior')}
              className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/85 shadow-soft backdrop-blur-sm transition-opacity disabled:opacity-0 lg:flex"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => ir(actual + 1)}
              disabled={actual === fotos.length - 1}
              aria-label={t('siguiente')}
              className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/85 shadow-soft backdrop-blur-sm transition-opacity disabled:opacity-0 lg:flex"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-pill bg-background/70 px-2 py-1 backdrop-blur-sm lg:hidden" aria-hidden>
              {fotos.map((src, i) => (
                <span key={src} className={cn('h-1.5 rounded-full transition-all duration-200', i === actual ? 'w-4 bg-foreground' : 'w-1.5 bg-foreground/40')} />
              ))}
            </div>
            <span className="absolute bottom-3 right-3 rounded-pill bg-background/80 px-2 py-0.5 text-[11px] font-semibold tnum backdrop-blur-sm lg:hidden" aria-hidden>
              {actual + 1}/{fotos.length}
            </span>
          </>
        )}
      </div>
      {fotos.length > 1 && (
        <ul className="mt-2 hidden gap-2 lg:flex">
          {fotos.map((src, i) => (
            <li key={src}>
              <button
                type="button"
                onClick={() => ir(i)}
                aria-label={t('verFoto', { i: i + 1 })}
                aria-current={i === actual}
                className={cn(
                  'relative h-16 w-16 overflow-hidden rounded-[12px] border-2 bg-surface-2 transition-colors duration-150',
                  i === actual ? 'border-primary' : 'border-transparent opacity-80 hover:opacity-100',
                )}
              >
                <Image src={src} alt="" fill sizes="64px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
