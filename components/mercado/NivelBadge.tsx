import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { Nivel } from '@/lib/mercado/claims';
import { cn } from '@/lib/utils/cn';

/**
 * El nivel de evidencia de una afirmación o de un listado.
 *
 * Tres reglas que no se negocian:
 * 1. Nunca solo color: color + número + palabra (07 §7). Con daltonismo el
 *    catálogo tiene que seguir siendo legible.
 * 2. La palabra describe NUESTRO PROCESO y el nivel de prueba, nunca la calidad
 *    del producto (08 §2.3): "Certificación de tercero", jamás "verificado".
 * 3. Linkea a `/legal/niveles`, desde cada badge de toda la app (fase 3 §10):
 *    que la escalera sea pública es parte de la defensa.
 */

const PUNTO: Record<Nivel, string> = {
  e0: 'bg-muted-foreground/40',
  e1: 'bg-nivel-1',
  e2: 'bg-nivel-2',
  e3: 'bg-nivel-3',
  e4: 'bg-brand-gradient',
};

// El color va en el punto y en el borde; el texto, en el color de lectura. El
// verde profundo del Nivel 3 sobre el fondo oscuro no llega al contraste AA
// (07 §7): como texto, el nivel más alto sería el que peor se lee.
const BORDE: Record<Nivel, string> = {
  e0: 'border-border',
  e1: 'border-nivel-1/50',
  e2: 'border-nivel-2/50',
  e3: 'border-nivel-3/70',
  e4: '',
};

export function NivelBadge({
  nivel,
  tamano = 'md',
  enlace = true,
  className,
}: {
  nivel: Nivel;
  /** `sm`: la tarjeta del catálogo. `md`: fichas y filas. */
  tamano?: 'sm' | 'md';
  /** Dentro de otro enlace (una tarjeta entera clickeable) no se puede anidar un `<a>`. */
  enlace?: boolean;
  className?: string;
}) {
  const t = useTranslations('mercado.nivel');
  const numero = Number(nivel.slice(1));
  const completa = `${t('etiqueta', { n: numero })} · ${t(`${nivel}.corto`)}`;
  // En la tarjeta, solo "Nivel 2": la frase entera partía el sello en dos
  // renglones en un teléfono. Lo que quiere decir queda en el title y en la ficha.
  const etiqueta = tamano === 'sm' ? t('etiqueta', { n: numero }) : completa;

  const cuerpo = (
    <span
      title={tamano === 'sm' ? completa : undefined}
      className={cn(
        'whitespace-nowrap',
        'inline-flex items-center gap-1.5 rounded-pill bg-surface font-semibold',
        tamano === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-caption',
        nivel !== 'e4' && cn('border', BORDE[nivel]),
      )}
    >
      <span aria-hidden className={cn('shrink-0 rounded-full', tamano === 'sm' ? 'h-2 w-2' : 'h-2.5 w-2.5', PUNTO[nivel])} />
      <span className="tnum text-foreground">{etiqueta}</span>
    </span>
  );

  // Nivel 4: la gradiente en el BORDE, nunca en el relleno (07 §5).
  const envuelto =
    nivel === 'e4' ? <span className="inline-flex rounded-pill bg-brand-gradient p-px">{cuerpo}</span> : cuerpo;

  if (!enlace) return <span className={cn('inline-flex', className)}>{envuelto}</span>;
  return (
    <Link
      href="/legal/niveles"
      title={t(`${nivel}.explicacion`)}
      className={cn('press inline-flex transition-opacity duration-150 hover:opacity-80', className)}
    >
      {envuelto}
    </Link>
  );
}
