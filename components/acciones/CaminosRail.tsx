'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, ChevronRight, Compass } from 'lucide-react';
import { Sheet } from '@/components/ui/sheet';
import { DomainIcon } from '@/components/icons/DomainIcon';
import { Skeleton } from '@/components/ui/skeleton';
import { useMisCaminos } from '@/hooks/use-acciones';
import { getDomainColor } from '@/lib/domains';
import type { Camino } from '@/lib/api/acciones';
import { cn } from '@/lib/utils/cn';

/**
 * Caminos (docs/ACCIONES.md §4.3): recorridos de lo más fácil a lo más
 * comprometido. Primero los empezados, después los nuevos, al final los
 * terminados. Tocar uno muestra todos sus pasos.
 */
export function CaminosRail() {
  const q = useMisCaminos();
  const [abierto, setAbierto] = useState<Camino | null>(null);

  if (q.isLoading) {
    return (
      <div className="-mx-4 flex gap-3 overflow-hidden px-4">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-[132px] w-[70%] shrink-0 rounded-card sm:w-[40%]" />
        ))}
      </div>
    );
  }
  const caminos = q.data ?? [];
  if (caminos.length === 0) return null;

  const hechos = (c: Camino) => c.pasos.filter((p) => p.hecho).length;
  const orden = [...caminos].sort((a, b) => {
    const ea = a.completado ? 2 : hechos(a) > 0 ? 0 : 1;
    const eb = b.completado ? 2 : hechos(b) > 0 ? 0 : 1;
    return ea - eb;
  });

  return (
    <section aria-labelledby="caminos">
      <div className="mb-2.5">
        <span className="eyebrow flex items-center gap-1.5 text-muted-foreground">
          <Compass className="h-3.5 w-3.5 text-primary" aria-hidden />
          De a un paso
        </span>
        <h2 id="caminos" className="mt-0.5 font-display text-h3 font-bold leading-tight">
          Caminos
        </h2>
        <p className="mt-0.5 text-small text-muted-foreground">De lo más fácil a lo más comprometido. Terminar uno suma un premio.</p>
      </div>
      <ul className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 no-scrollbar">
        {orden.map((c) => {
          const n = hechos(c);
          const total = c.pasos.length;
          const color = getDomainColor(c.domain_slug);
          const siguiente = c.pasos.find((p) => !p.hecho);
          return (
            <li key={c.slug} className="w-[70%] shrink-0 snap-start sm:w-[40%]">
              <button
                type="button"
                onClick={() => setAbierto(c)}
                className="press flex h-full min-h-[132px] w-full flex-col rounded-card border border-border bg-surface p-3.5 text-left shadow-soft hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lift"
              >
                <span className="flex items-center justify-between gap-2">
                  <DomainIcon domain={c.domain_slug} size={34} />
                  {c.completado ? (
                    <span className="inline-flex items-center gap-1 rounded-pill bg-primary/15 px-2 py-0.5 text-caption font-bold text-primary">
                      <Check className="h-3 w-3" strokeWidth={3} aria-hidden /> Hecho
                    </span>
                  ) : (
                    <span className="text-caption font-bold text-brote-sun tnum">+{c.recompensa_puntos}</span>
                  )}
                </span>
                <span className="mt-2 font-display text-small font-bold leading-snug">{c.titulo_es}</span>
                {/* Un segmento por paso: se ve de un vistazo cuánto falta. */}
                <span className="mt-2 flex gap-1" aria-label={`${n} de ${total} pasos`}>
                  {c.pasos.map((p) => (
                    <span
                      key={p.id}
                      className={cn('h-1.5 flex-1 rounded-pill', !p.hecho && 'bg-border')}
                      style={p.hecho ? { background: color } : undefined}
                    />
                  ))}
                </span>
                <span className="mt-auto pt-2 text-caption leading-snug text-muted-foreground">
                  {c.completado ? 'Lo terminaste' : siguiente ? `Sigue: ${siguiente.title_es}` : ''}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <Sheet open={!!abierto} onOpenChange={(v) => !v && setAbierto(null)} title={abierto?.titulo_es}>
        {abierto && (
          <div className="space-y-3">
            <p className="text-small leading-relaxed text-muted-foreground">{abierto.descripcion_es}</p>
            <ol className="overflow-hidden rounded-card border border-border">
              {abierto.pasos.map((p) => (
                <li key={p.id} className="border-b border-hairline last:border-b-0">
                  <Link
                    href={`/acciones/${p.slug}`}
                    className="flex items-center gap-3 bg-surface p-3 transition-colors hover:bg-surface-2"
                  >
                    <span
                      className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-caption font-bold tnum',
                        p.hecho ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground',
                      )}
                    >
                      {p.hecho ? <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden /> : p.paso}
                    </span>
                    <span className={cn('min-w-0 flex-1 text-small', p.hecho && 'text-muted-foreground line-through')}>{p.title_es}</span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  </Link>
                </li>
              ))}
            </ol>
            <p className="text-caption text-muted-foreground">
              Al completar todos los pasos sumás +{abierto.recompensa_puntos} pts. Cada paso cuenta también como una acción.
            </p>
          </div>
        )}
      </Sheet>
    </section>
  );
}
