'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Bell, Check } from 'lucide-react';
import { alternarSeguir } from '@/lib/mercado/acciones';
import { useToastStore } from '@/stores/toast';
import { cn } from '@/lib/utils/cn';

/**
 * Seguir una tienda: avisa cuando publica algo nuevo (como mucho un aviso por
 * día y por tienda). La tienda ve cuántas personas la siguen, nunca quiénes.
 */
export function BotonSeguir({
  negocioId,
  inicial,
  tamano = 'md',
  onCambio,
  className,
}: {
  negocioId: string;
  inicial: boolean;
  tamano?: 'sm' | 'md';
  onCambio?: (seguida: boolean, seguidores: number) => void;
  className?: string;
}) {
  const t = useTranslations('mercado.tienda');
  const [seguida, setSeguida] = useState(inicial);
  const [pendiente, startTransition] = useTransition();

  function alternar(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const siguiente = !seguida;
    setSeguida(siguiente);
    startTransition(async () => {
      const r = await alternarSeguir(negocioId, siguiente);
      if (!r.ok) {
        setSeguida(!siguiente);
        useToastStore.getState().push({ variant: 'error', title: t(r.error === 'propio' ? 'seguirPropia' : 'seguirError') });
        return;
      }
      onCambio?.(r.seguida, r.seguidores);
      if (siguiente) useToastStore.getState().push({ variant: 'default', title: t('seguirToast') });
    });
  }

  return (
    <button
      type="button"
      onClick={alternar}
      disabled={pendiente}
      aria-pressed={seguida}
      className={cn(
        'press inline-flex shrink-0 items-center justify-center gap-1.5 rounded-pill font-semibold transition-colors duration-150',
        tamano === 'sm' ? 'h-8 px-3 text-caption' : 'h-10 px-4 text-small',
        seguida ? 'border border-border bg-surface text-foreground hover:bg-surface-2' : 'bg-primary text-primary-foreground shadow-crisp hover:opacity-90',
        className,
      )}
    >
      {seguida ? <Check className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
      {seguida ? t('siguiendo') : t('seguir')}
    </button>
  );
}
