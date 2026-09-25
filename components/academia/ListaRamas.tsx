'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ChevronRight, Lock } from 'lucide-react';
import { Reveal } from '@/components/ui/reveal';
import type { RamaDelMapa } from '@/lib/academia/modelo';
import { getDomainColor } from '@/lib/domains';

const COLOR_TRONCO = '#1FB57A';

/**
 * Las ramas como lista: la alternativa sin dibujo al árbol, para lectores de
 * pantalla, para teclado y para quien prefiere una lista. Tiene todo lo que
 * tiene el dibujo —estado, avance, qué sigue— en filas con divisor de pelo.
 */
export function ListaRamas({ ramas }: { ramas: RamaDelMapa[] }) {
  const t = useTranslations('arbol');
  return (
    <ul className="divide-y divide-hairline border-y border-hairline">
      {ramas
        .filter((r) => r.unidades.length > 0)
        .map((r, i) => {
          const color = r.es_tronco ? COLOR_TRONCO : getDomainColor(r.slug);
          const completas = r.unidades.filter((u) => u.estado === 'completa' || u.estado === 'repasar').length;
          const cerrada = r.unidades.every((u) => u.estado === 'bloqueada');
          const actual = r.unidades.find((u) => u.estado === 'en_curso' || u.estado === 'disponible');
          return (
            <li key={r.slug}>
              <Reveal index={i}>
                <Link
                  href={`/aprender/${r.slug}`}
                  className="group flex items-center gap-3 py-3 transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="h-10 w-1.5 shrink-0 rounded-pill" style={{ backgroundColor: color }} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 truncate text-small font-semibold">
                      {r.nombre_es}
                      {cerrada ? <Lock className="h-3 w-3 text-muted-foreground" aria-label={t('estado_bloqueada')} /> : null}
                    </span>
                    <span className="block truncate text-caption text-muted-foreground">
                      {actual ? t('ramaSigue', { titulo: actual.titulo_es }) : r.bajada_es}
                    </span>
                  </span>
                  <span className="tnum shrink-0 text-caption font-semibold text-muted-foreground">
                    {completas}/{r.unidades.length}
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
                </Link>
              </Reveal>
            </li>
          );
        })}
    </ul>
  );
}
