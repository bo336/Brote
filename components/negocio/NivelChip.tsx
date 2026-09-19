import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { COLOR_NIVEL, numeroNivel } from '@/lib/negocio/catalogo';
import type { EvidenceTier } from '@/lib/supabase/rows-negocio';
import { cn } from '@/lib/utils/cn';

/**
 * El nivel de evidencia de un negocio: "Nivel 1 · Declarado".
 *
 * Nunca solo color (07 §7): siempre el número y la palabra. El Nivel 4 no
 * tiene color propio — lleva la gradiente de marca en el borde, nunca en el
 * relleno (07 §5). Sirve igual en Server y Client Components.
 */
export function NivelChip({
  tier,
  apilado = false,
  className,
}: {
  tier: EvidenceTier;
  /** Número arriba y nombre abajo, para el pie de la barra lateral. */
  apilado?: boolean;
  className?: string;
}) {
  const t = useTranslations('negocio.nivel');
  const color = COLOR_NIVEL[tier];
  const etiqueta = t('etiqueta', { n: numeroNivel(tier) });

  const cuerpo = (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-pill bg-surface text-foreground',
        apilado ? 'px-3 py-2' : 'px-2.5 py-1',
        tier !== 'e4' && 'border border-border',
      )}
    >
      <span
        aria-hidden
        className={cn('h-2 w-2 shrink-0 rounded-full', !color && tier !== 'e4' && 'bg-muted-foreground/40')}
        style={color ? { backgroundColor: color } : tier === 'e4' ? { backgroundImage: 'linear-gradient(115deg,#0E7A52,#1FB57A 45%,#FFB23E)' } : undefined}
      />
      {apilado ? (
        <span className="flex flex-col leading-tight">
          <span className="eyebrow text-muted-foreground">{etiqueta}</span>
          <span className="text-small font-semibold">{t(tier)}</span>
        </span>
      ) : (
        <span className="text-caption font-semibold tnum">
          {etiqueta} · {t(tier)}
        </span>
      )}
    </span>
  );

  // Linkeado a `/legal/niveles` como cada badge de nivel de la app (fase 3 §10).
  const envuelto = tier !== 'e4' ? cuerpo : <span className="inline-flex rounded-pill bg-brand-gradient p-px">{cuerpo}</span>;
  return (
    <Link href="/legal/niveles" className={cn('press inline-flex transition-opacity duration-150 hover:opacity-80', className)}>
      {envuelto}
    </Link>
  );
}
