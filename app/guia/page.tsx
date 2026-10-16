import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, Clock } from 'lucide-react';
import { DOMAINS } from '@/lib/domains';
import { DomainIcon } from '@/components/icons/DomainIcon';
import { BRAND } from '@/lib/brand';
import { COSTO, leerGuia } from '@/lib/guia';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const n = (await leerGuia()).length;
  return {
    title: 'Guía de acciones para cuidar el ambiente',
    description: `${n} acciones concretas para cuidar el agua, la energía, el aire y la comunidad, con cuánto se ahorra y de dónde sale cada dato.`,
    alternates: { canonical: '/guia' },
  };
}

/**
 * `/guia` — las acciones de Brote, públicas y por tema (0135). Es contenido
 * propio y con fuentes: lo leen los buscadores y la revisión de AdSense, y le
 * muestra a quien llega qué hace Brote antes de pedirle una cuenta.
 */
export default async function GuiaPage() {
  const acciones = await leerGuia();
  const porTema = DOMAINS.map((d) => ({ d, items: acciones.filter((a) => a.tema === d.slug) })).filter((x) => x.items.length);

  if (acciones.length === 0) {
    return (
      <div className="py-16 text-center">
        <h1 className="font-display text-h1 font-extrabold">La guía se está actualizando</h1>
        <p className="mt-2 text-small text-muted-foreground">Volvé en unos minutos.</p>
      </div>
    );
  }

  return (
    <div>
      <header className="border-b border-hairline pb-6">
        <p className="eyebrow text-primary">Guía de acciones</p>
        <h1 className="mt-1 text-balance font-display text-display-l font-extrabold leading-tight">
          {acciones.length} cosas concretas para cuidar el ambiente
        </h1>
        <p className="mt-2 max-w-xl text-small leading-relaxed text-muted-foreground">
          Cada una dice por qué importa, cómo se hace, cuánto lleva y cuánto ahorra, con la fuente del dato. Todas se
          pueden hacer hoy. En {BRAND.name} las sumás a tu día, sostenés tu racha y ves crecer tu mundo.
        </p>
        <nav aria-label="Temas" className="mt-4 flex flex-wrap gap-1.5">
          {porTema.map(({ d, items }) => (
            <a
              key={d.slug}
              href={`#${d.slug}`}
              className="rounded-pill border border-border bg-surface px-3 py-1 text-caption font-medium transition-colors hover:border-primary/40"
            >
              {d.name_es} <span className="text-muted-foreground tnum">{items.length}</span>
            </a>
          ))}
        </nav>
      </header>

      {porTema.map(({ d, items }) => (
        <section key={d.slug} id={d.slug} className="scroll-mt-20 pt-8">
          <div className="mb-2 flex items-center gap-2.5">
            <DomainIcon domain={d.slug} size={32} />
            <h2 className="font-display text-h2 font-bold">{d.name_es}</h2>
          </div>
          <p className="mb-3 text-small text-muted-foreground">{d.description_es}</p>
          <ul className="divide-y divide-hairline overflow-hidden rounded-card border border-border bg-surface">
            {items.map((a) => (
              <li key={a.slug}>
                <Link href={`/guia/${a.slug}`} className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2">
                  <span className="min-w-0 flex-1">
                    <span className="block text-small font-semibold">{a.titulo}</span>
                    {a.resumen && <span className="line-clamp-1 text-caption text-muted-foreground">{a.resumen}</span>}
                  </span>
                  <span className="hidden shrink-0 items-center gap-1 text-caption text-muted-foreground sm:inline-flex">
                    <Clock className="h-3.5 w-3.5" /> {a.minutos ?? 5} min · {COSTO[a.costo ?? 'gratis'] ?? 'Gratis'}
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
