'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Heart } from 'lucide-react';
import { alternarFavorito } from '@/lib/mercado/acciones';
import { useToastStore } from '@/stores/toast';
import { cn } from '@/lib/utils/cn';

/**
 * Guardar un producto. Optimista: el corazón se llena al toque y, si la base
 * dice que no, vuelve atrás con un aviso. Guardar no suma puntos: sirve para
 * encontrarlo después y para enterarse si baja su precio de referencia.
 */
export function BotonGuardar({
  listingId,
  inicial,
  variante = 'flotante',
  onCambio,
  className,
}: {
  listingId: string;
  inicial: boolean;
  /** `flotante`: sobre la foto de una tarjeta. `boton`: en la ficha, con texto. */
  variante?: 'flotante' | 'boton';
  onCambio?: (guardado: boolean, total: number) => void;
  className?: string;
}) {
  const t = useTranslations('mercado.tarjeta');
  const [guardado, setGuardado] = useState(inicial);
  const [pendiente, startTransition] = useTransition();

  function alternar(e: React.MouseEvent) {
    // Vive dentro de una tarjeta que es un enlace: el toque no navega.
    e.preventDefault();
    e.stopPropagation();
    const siguiente = !guardado;
    setGuardado(siguiente);
    startTransition(async () => {
      const r = await alternarFavorito(listingId, siguiente);
      if (!r.ok) {
        setGuardado(!siguiente);
        useToastStore.getState().push({ variant: 'error', title: t(r.error === 'demasiados' ? 'guardarTope' : 'guardarError') });
        return;
      }
      onCambio?.(r.favorito, r.favoritos);
      if (siguiente) useToastStore.getState().push({ variant: 'default', title: t('guardadoToast') });
    });
  }

  const etiqueta = guardado ? t('quitar') : t('guardar');

  if (variante === 'boton') {
    return (
      <button
        type="button"
        onClick={alternar}
        aria-pressed={guardado}
        disabled={pendiente}
        className={cn(
          'press inline-flex h-11 items-center justify-center gap-2 rounded-pill border px-4 text-small font-semibold transition-colors duration-150',
          guardado ? 'border-brote-coral/50 bg-brote-coral/10 text-foreground' : 'border-border bg-surface hover:bg-surface-2',
          className,
        )}
      >
        <Heart className={cn('h-4.5 w-4.5', guardado && 'fill-brote-coral text-brote-coral')} strokeWidth={2.2} />
        {guardado ? t('guardadoCorto') : t('guardarCorto')}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={alternar}
      aria-pressed={guardado}
      aria-label={etiqueta}
      title={etiqueta}
      className={cn(
        'press flex h-9 w-9 items-center justify-center rounded-full bg-background/85 shadow-soft backdrop-blur-sm transition-transform duration-150 hover:scale-105',
        className,
      )}
    >
      <Heart
        className={cn('h-[18px] w-[18px] transition-colors duration-150', guardado ? 'fill-brote-coral text-brote-coral' : 'text-foreground')}
        strokeWidth={2.2}
      />
    </button>
  );
}
