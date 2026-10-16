'use client';

import { useEffect, useRef } from 'react';
import { ExternalLink } from 'lucide-react';
import type { Placement } from '@/lib/ads/policy';
import { contarAnuncio, registrarAnuncio } from '@/lib/ads/runtime';

export interface AnuncioDirectoDatos {
  id: string;
  anunciante: string;
  titulo: string;
  texto: string | null;
  imagen_url: string | null;
  cta: string;
}

/**
 * Un anuncio DIRECTO (un sponsor cargado desde /panel/publicidad, 0134).
 *
 * Se ve como lo que es: una tarjeta marcada "Patrocinado · <anunciante>",
 * con el estilo de Brote pero separada del contenido. La impresión se cuenta
 * cuando al menos la mitad estuvo a la vista un segundo; el clic pasa por
 * `/api/anuncio/<id>`, que lo cuenta y redirige (el destino nunca viaja al
 * navegador antes del clic).
 */
export function AnuncioDirecto({ anuncio, placement }: { anuncio: AnuncioDirectoDatos; placement: Placement }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const contado = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || contado.current || typeof IntersectionObserver === 'undefined') return;
    let t: ReturnType<typeof setTimeout> | null = null;
    const io = new IntersectionObserver(
      (es) => {
        const visible = es.some((e) => e.intersectionRatio >= 0.5);
        if (visible && !t) {
          t = setTimeout(() => {
            if (contado.current) return;
            contado.current = true;
            contarAnuncio();
            registrarAnuncio({ u: placement, p: 'directo', e: 'impresion', a: anuncio.id });
            io.disconnect();
          }, 1000);
        } else if (!visible && t) {
          clearTimeout(t);
          t = null;
        }
      },
      { threshold: [0, 0.5, 1] },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      if (t) clearTimeout(t);
    };
  }, [anuncio.id, placement]);

  return (
    <a
      ref={ref}
      href={`/api/anuncio/${anuncio.id}?u=${placement}`}
      target="_blank"
      rel="sponsored noopener"
      className={CLASE_TARJETA}
    >
      <ContenidoAnuncio anuncio={anuncio} />
    </a>
  );
}

export const CLASE_TARJETA =
  'group flex overflow-hidden rounded-card border border-border bg-surface transition-[border-color,box-shadow] duration-150 hover:border-primary/30 hover:shadow-soft';

/** El interior de la tarjeta, sin conteo ni enlace: lo usa la vista previa del panel. */
export function ContenidoAnuncio({ anuncio }: { anuncio: Omit<AnuncioDirectoDatos, 'id'> }) {
  return (
    <>
      {anuncio.imagen_url && (
        // eslint-disable-next-line @next/next/no-img-element -- remote sponsor image, sized by CSS
        <img src={anuncio.imagen_url} alt="" loading="lazy" className="h-auto w-28 shrink-0 object-cover sm:w-36" />
      )}
      <span className="flex min-w-0 flex-1 flex-col justify-center gap-1 p-3.5">
        <span className="text-caption text-muted-foreground">{anuncio.anunciante}</span>
        <span className="text-small font-semibold leading-snug">{anuncio.titulo}</span>
        {anuncio.texto && <span className="text-caption leading-relaxed text-muted-foreground">{anuncio.texto}</span>}
        <span className="mt-1 inline-flex items-center gap-1 text-caption font-semibold text-primary">
          {anuncio.cta} <ExternalLink className="h-3 w-3" />
        </span>
      </span>
    </>
  );
}
