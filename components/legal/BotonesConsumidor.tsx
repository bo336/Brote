import Link from 'next/link';
import { RotateCcw, XCircle } from 'lucide-react';
import { DEFENSA_CONSUMIDOR, ETIQUETA, RUTA } from '@/lib/consumidor/reglas';
import { cn } from '@/lib/utils/cn';

/**
 * Los dos links que pide la Disposición 954/2025 (art. 1 y 4) "a simple vista,
 * en lugar destacado y en el primer acceso", más el de reclamos de la Res. SCI
 * 274/2021. Van en la pantalla de entrada, en Inicio, en Perfil, en Brote+, en
 * las páginas públicas y al pie de los textos legales. Los dos botones abren
 * páginas que se usan sin cuenta.
 */
export function BotonesConsumidor({ className, centrado = false }: { className?: string; centrado?: boolean }) {
  const boton =
    'press inline-flex min-h-[36px] items-center gap-1.5 rounded-pill border border-border bg-surface px-3 py-1.5 text-caption font-semibold text-foreground transition-colors hover:border-primary/50 hover:text-primary';
  return (
    <nav aria-label="Derechos del consumidor" className={cn('space-y-2', className)}>
      <div className={cn('flex flex-wrap gap-2', centrado && 'justify-center')}>
        <Link href={RUTA.arrepentimiento} className={boton}>
          <RotateCcw className="h-3.5 w-3.5" aria-hidden /> {ETIQUETA.arrepentimiento}
        </Link>
        <Link href={RUTA.baja} className={boton}>
          <XCircle className="h-3.5 w-3.5" aria-hidden /> {ETIQUETA.baja}
        </Link>
      </div>
      <p className={cn('text-[11px] leading-snug text-muted-foreground', centrado && 'text-center')}>
        <a href={DEFENSA_CONSUMIDOR.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
          {DEFENSA_CONSUMIDOR.texto}
        </a>
        {' · '}
        <Link href="/legal/atencion" className="underline underline-offset-2 hover:text-foreground">
          Atención al cliente
        </Link>
      </p>
    </nav>
  );
}
