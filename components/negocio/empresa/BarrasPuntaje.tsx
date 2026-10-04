import { useTranslations } from 'next-intl';
import { LIGA } from '@/lib/negocio/liga';
import type { PuntajeLiga } from '@/lib/supabase/rows-negocio';
import { cn } from '@/lib/utils/cn';

/** The three parts of a league score, each against its own cap. */
export function BarrasPuntaje({
  puntaje,
  oscuro = false,
  className,
}: {
  puntaje: Pick<PuntajeLiga, 'logros' | 'constancia' | 'avance'>;
  oscuro?: boolean;
  className?: string;
}) {
  const t = useTranslations('negocio.liga');
  const filas = [
    { k: 'logros', v: puntaje.logros, max: LIGA.topeLogros, color: '#FFB23E' },
    { k: 'constancia', v: puntaje.constancia, max: LIGA.topeConstancia, color: '#1FB57A' },
    { k: 'avance', v: puntaje.avance, max: LIGA.topeAvance, color: '#2DB4D4' },
  ] as const;
  return (
    <ul className={cn('space-y-2', className)}>
      {filas.map((f) => (
        <li key={f.k}>
          <div className={cn('flex justify-between text-caption', oscuro ? 'text-brote-cream/70' : 'text-muted-foreground')}>
            <span>{t(f.k)}</span>
            <span className="tnum">
              {f.v} / {f.max}
            </span>
          </div>
          <div className={cn('mt-1 h-1.5 overflow-hidden rounded-pill', oscuro ? 'bg-white/10' : 'bg-surface-2')}>
            <div className="h-full rounded-pill" style={{ width: `${Math.min(100, (f.v / f.max) * 100)}%`, background: f.color }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
