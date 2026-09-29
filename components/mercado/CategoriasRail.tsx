import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { visualCategoria } from '@/components/mercado/categoria-visual';
import { urlBusqueda } from '@/lib/mercado/busqueda';
import { CATEGORIAS, CATEGORIAS_SENSIBLES } from '@/lib/mercado/categorias';
import { cn } from '@/lib/utils/cn';

/**
 * Las categorías como accesos: un ícono con su color y el nombre. En el
 * teléfono es una fila que se desliza; en escritorio, una grilla de seis.
 * Las que no tienen nada publicado no se muestran — un acceso a una pantalla
 * vacía es una promesa rota —, salvo que el Mercado entero esté vacío.
 */
export function CategoriasRail({
  conteos,
  esTeen,
  className,
}: {
  conteos: Record<string, number>;
  esTeen: boolean;
  className?: string;
}) {
  const t = useTranslations('mercado.categorias');
  const tt = useTranslations('mercado.inicio');
  const hayAlgo = Object.values(conteos).some((n) => n > 0);
  const lista = CATEGORIAS.filter((c) => !esTeen || !CATEGORIAS_SENSIBLES.includes(c)).filter(
    (c) => !hayAlgo || (conteos[c] ?? 0) > 0,
  );

  return (
    <nav aria-label={tt('categorias')} className={className}>
      <ul className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:grid lg:grid-cols-6 lg:gap-2.5 lg:px-0">
        {lista.map((c) => {
          const v = visualCategoria(c);
          const Icono = v.icono;
          const n = conteos[c] ?? 0;
          return (
            <li key={c} className="w-[88px] shrink-0 lg:w-auto">
              <Link
                href={urlBusqueda({ categoria: c })}
                className={cn(
                  'press group flex h-full flex-col items-center gap-2 rounded-card px-1.5 py-3 text-center transition-colors duration-150 hover:bg-surface-2',
                  'lg:flex-row lg:border lg:border-border lg:bg-surface lg:px-3 lg:py-2.5 lg:text-left',
                )}
              >
                <span
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-105 lg:h-10 lg:w-10"
                  style={{ backgroundColor: `${v.color}26` }}
                >
                  <Icono className="h-6 w-6 lg:h-5 lg:w-5" style={{ color: v.color }} strokeWidth={2} />
                </span>
                <span className="min-w-0">
                  <span className="line-clamp-2 text-[12px] font-semibold leading-tight lg:text-small">{t(c)}</span>
                  {hayAlgo && <span className="mt-0.5 hidden text-caption text-muted-foreground lg:block">{tt('productosN', { n })}</span>}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
