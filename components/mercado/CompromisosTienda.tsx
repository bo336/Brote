import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Camera, ShieldCheck } from 'lucide-react';
import { urlImagen } from '@/lib/mercado/imagenes';
import type { CompromisoPublico } from '@/lib/supabase/rows-mercado';
import { cn } from '@/lib/utils/cn';

/**
 * El compromiso de una tienda: las prácticas que dice hacer, cada una como lo
 * que es. "Con foto" si la tienda subió una foto que la muestra; "revisado por
 * Brote" cuando alguien del equipo miró esa foto. Nunca un nivel —los niveles
 * son de las afirmaciones de cada producto— y nunca un sello de calidad.
 */
export function CompromisosTienda({
  compromisos,
  variante = 'chips',
  className,
}: {
  compromisos: CompromisoPublico[];
  /** `chips`: una fila corta (la ficha de un producto). `fotos`: la vidriera de la tienda. */
  variante?: 'chips' | 'fotos';
  className?: string;
}) {
  const t = useTranslations('mercado.practicas');
  const tt = useTranslations('mercado.tienda');
  if (compromisos.length === 0) return null;

  if (variante === 'chips') {
    return (
      <ul className={cn('flex flex-wrap gap-1.5', className)}>
        {compromisos.map((c) => (
          <li
            key={c.practica}
            className="inline-flex items-center gap-1 rounded-pill border border-border bg-surface px-2.5 py-1 text-caption font-medium"
            title={c.revisado ? tt('revisado') : c.foto ? tt('conFoto') : tt('declarado')}
          >
            {c.revisado ? (
              <ShieldCheck className="h-3.5 w-3.5 text-brote-green" aria-hidden />
            ) : c.foto ? (
              <Camera className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
            ) : null}
            {t(`${c.practica}.titulo`)}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className={cn('grid gap-3 sm:grid-cols-2', className)}>
      {compromisos.map((c) => {
        const foto = urlImagen(c.foto);
        return (
          <li key={c.practica} className="flex gap-3 rounded-card border border-border bg-surface p-3">
            {foto ? (
              <span className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[14px] bg-surface-2">
                <Image src={foto} alt={t(`${c.practica}.titulo`)} fill sizes="80px" className="object-cover" />
              </span>
            ) : null}
            <span className="min-w-0">
              <span className="block text-small font-semibold">{t(`${c.practica}.titulo`)}</span>
              <span className="mt-0.5 block text-caption leading-relaxed text-muted-foreground">{t(`${c.practica}.ayuda`)}</span>
              <span
                className={cn(
                  'mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold',
                  c.revisado ? 'text-brote-green' : 'text-muted-foreground',
                )}
              >
                {c.revisado ? <ShieldCheck className="h-3.5 w-3.5" /> : c.foto ? <Camera className="h-3.5 w-3.5" /> : null}
                {c.revisado ? tt('revisado') : c.foto ? tt('conFoto') : tt('declarado')}
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
