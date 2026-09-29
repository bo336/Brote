'use client';

import { useTranslations } from 'next-intl';
import { Share2 } from 'lucide-react';
import { useToastStore } from '@/stores/toast';
import { cn } from '@/lib/utils/cn';

/**
 * Compartir un producto: la hoja del sistema en el teléfono (WhatsApp está a
 * un toque), y copiar el enlace donde no la hay.
 */
export function BotonCompartir({ titulo, ruta, className }: { titulo: string; ruta: string; className?: string }) {
  const t = useTranslations('mercado.ficha2');

  async function compartir(e: React.MouseEvent) {
    e.preventDefault();
    const url = `${window.location.origin}${ruta}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: titulo, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      useToastStore.getState().push({ variant: 'default', title: t('copiado') });
    } catch {
      /* compartir cancelado: no es un error */
    }
  }

  return (
    <button
      type="button"
      onClick={compartir}
      aria-label={t('compartir')}
      title={t('compartir')}
      className={cn(
        'press flex h-9 w-9 items-center justify-center rounded-full bg-background/85 shadow-soft backdrop-blur-sm transition-transform duration-150 hover:scale-105',
        className,
      )}
    >
      <Share2 className="h-[17px] w-[17px]" strokeWidth={2.2} />
    </button>
  );
}
