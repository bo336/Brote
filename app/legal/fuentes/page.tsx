import type { Metadata } from 'next';
import { ExternalLink, Sparkles } from 'lucide-react';
import { Section } from '@/components/legal/LegalDoc';
import { FUENTES_ACADEMIA, RAMAS_FUENTES } from '@/lib/academia/fuentes-academia';
import { BRAND } from '@/lib/brand';
import { getDomainColor } from '@/lib/domains';

// El layout raíz ya agrega "· Brote" con su plantilla de título.
export const metadata: Metadata = {
  title: 'Fuentes de la Academia',
  description: 'De dónde sale lo que enseña la Academia: organismos, normas y estudios, ordenados por rama y por unidad.',
};

const ACTUALIZADO = '22 de septiembre de 2026';
const COLOR_TRONCO = '#1FB57A';

/**
 * `/legal/fuentes`: las fuentes del currículum de la Academia.
 *
 * Vivían dentro de cada ejercicio, como un chip al pie de la explicación. Se
 * sacaron de la lección porque competían con la explicación por la atención
 * justo en el momento de aprender, y casi nadie las abría en medio de una
 * sesión. Acá están todas juntas, ordenadas por rama y por unidad, para quien
 * quiera ir al original. Se llega desde Ajustes y desde el pie de las páginas
 * legales: es una página de consulta, no una parada del recorrido.
 *
 * Pública y sin cuenta (el prefijo `/legal` ya es público en el middleware),
 * y estática: se genera desde `lib/academia/fuentes-academia.ts`, que a su vez
 * genera el constructor del currículum. No lleva ninguna respuesta de ningún
 * ejercicio, solo títulos, organismos y links.
 */
export default function FuentesPage() {
  const porSlug = new Map(FUENTES_ACADEMIA.map((f) => [f.slug, f]));
  const unidades = RAMAS_FUENTES.reduce((a, r) => a + r.unidades.length, 0);

  return (
    <article>
      <div className="mb-8 border-b border-border pb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">La Academia</p>
        <h1 className="mt-2 font-display text-display-l font-extrabold leading-tight">Fuentes de la Academia</h1>
        <p className="mt-2 text-caption text-muted-foreground">Última actualización: {ACTUALIZADO}</p>
        <p className="mt-4 text-body leading-relaxed text-muted-foreground">
          Lo que enseña la Academia de {BRAND.name} se apoya en {FUENTES_ACADEMIA.length} fuentes: organismos públicos,
          agencias de Naciones Unidas, normas argentinas y estudios revisados por pares. Acá están ordenadas por rama y por
          unidad, cada una con su link al original.
        </p>
      </div>

      {/* El aviso, arriba y a la vista: no en letra chica al final. */}
      <div className="mb-10 rounded-card border border-brote-sun/40 bg-brote-sun/10 p-5" role="note">
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-brote-sun">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          Aviso importante
        </p>
        <p className="mt-2 font-display text-h3 font-bold leading-snug">
          Todas las fuentes de esta página fueron seleccionadas y organizadas por un modelo de inteligencia artificial.
        </p>
        <div className="mt-2 space-y-2 text-small leading-relaxed">
          <p>
            Un modelo de IA eligió estas fuentes al escribir el currículum y las asoció a cada unidad. Comprobamos que cada link
            funcione, pero la selección no reemplaza la revisión de una persona especialista, y una fuente puede no respaldar
            cada detalle de cada ejercicio de su unidad.
          </p>
          <p>
            Si encontrás un dato que no coincide con su fuente, o una fuente que ya no dice lo que decía, escribinos a{' '}
            <a href={`mailto:${BRAND.contactEmail}`} className="font-semibold text-primary underline underline-offset-2">
              {BRAND.contactEmail}
            </a>{' '}
            y lo corregimos.
          </p>
        </div>
      </div>

      <nav aria-label="Ramas" className="mb-10 flex flex-wrap gap-2">
        {RAMAS_FUENTES.map((r) => (
          <a
            key={r.slug}
            href={`#${r.slug}`}
            className="inline-flex items-center gap-1.5 rounded-pill border border-border px-3 py-1.5 text-caption font-semibold transition-colors hover:border-primary/40 hover:text-foreground"
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: r.slug === 'tronco' ? COLOR_TRONCO : getDomainColor(r.slug) }}
              aria-hidden
            />
            {r.nombre}
          </a>
        ))}
      </nav>

      {RAMAS_FUENTES.map((r, i) => {
        const color = r.slug === 'tronco' ? COLOR_TRONCO : getDomainColor(r.slug);
        return (
          <div key={r.slug} id={r.slug} className="scroll-mt-20">
            <Section n={String(i + 1)} title={r.nombre}>
              <div className="space-y-6">
                {r.unidades.map((u) => (
                  <div key={u.slug}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color }}>
                      {u.titulo}
                    </p>
                    <ul className="mt-2 divide-y divide-border border-y border-border">
                      {u.fuentes.map((slug) => {
                        const f = porSlug.get(slug);
                        if (!f) return null;
                        return (
                          <li key={slug}>
                            <a
                              href={f.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group flex items-start gap-3 py-2.5 !no-underline"
                            >
                              <span className="min-w-0 flex-1">
                                <span className="block text-small font-semibold text-foreground group-hover:text-primary">
                                  {f.titulo}
                                </span>
                                <span className="block text-caption text-muted-foreground">
                                  {f.organizacion}
                                  {f.publicado ? ` · ${f.publicado}` : ''}
                                </span>
                              </span>
                              <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-primary" aria-hidden />
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </Section>
          </div>
        );
      })}

      <p className="mt-10 border-t border-border pt-6 text-caption text-muted-foreground">
        {FUENTES_ACADEMIA.length} fuentes · {unidades} unidades · seleccionadas por un modelo de IA y verificadas en su
        disponibilidad el {ACTUALIZADO}.
      </p>
    </article>
  );
}
