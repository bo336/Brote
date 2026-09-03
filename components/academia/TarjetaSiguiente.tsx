'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/ui/progress';
import type { GajoDelArbol } from '@/lib/academia/types';
import { getDomainColor } from '@/lib/domains';

/**
 * La única recomendación de la pantalla, con su motivo.
 *
 * Es UNA. Una lista de seis "sugerencias" no es una recomendación, es un menú
 * con otro nombre, y lo que hace es devolverle la decisión a la persona justo
 * cuando vino a que se la saquen de encima. El motivo lo escribe el servidor
 * (`academia_arbol().siguiente.razon`) porque depende de datos que solo el
 * servidor tiene: qué está marchito, qué quedó a medias, qué le interesa.
 */
export function TarjetaSiguiente({
  gajo,
  razon,
  ramaSlug,
}: {
  gajo: GajoDelArbol;
  razon: string;
  ramaSlug: string;
}) {
  const t = useTranslations('academia');
  const color = getDomainColor(ramaSlug);
  const etiqueta =
    gajo.estado === 'marchito' ? t('repasar') : gajo.estado === 'en_curso' ? t('seguir') : t('empezar');

  return (
    <div className="rounded-card border border-hairline bg-surface p-4 shadow-crisp">
      <p className="eyebrow" style={{ color }}>
        {t('siguienteTitulo')}
      </p>
      <h2 className="mt-1 font-display text-h3 font-bold leading-tight">{gajo.titulo_es}</h2>
      <p className="mt-1 text-small leading-relaxed text-muted-foreground">{razon}</p>

      {gajo.hojas_total > 0 ? (
        <div className="mt-3 flex items-center gap-3">
          <ProgressBar value={gajo.hojas_hechas / gajo.hojas_total} color={color} height={6} />
          <span className="tnum shrink-0 text-caption text-muted-foreground">
            {gajo.hojas_hechas}/{gajo.hojas_total}
          </span>
        </div>
      ) : null}

      <Button asChild block className="mt-4">
        <Link href={`/aprender/g/${gajo.slug}`}>
          {etiqueta}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </Button>
    </div>
  );
}
