import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ChevronRight, Clock, Droplets, ExternalLink, Leaf, MapPin, Recycle, Users, Wallet, Zap } from 'lucide-react';
import { DomainIcon } from '@/components/icons/DomainIcon';
import { AdSlot } from '@/components/ads/AdSlot';
import { buttonVariants } from '@/components/ui/button-variants';
import { getDomain } from '@/lib/domains';
import { BRAND } from '@/lib/brand';
import { formatCo2, formatEnergy, formatWaste, formatWater } from '@/lib/impact';
import { lugarTexto, minutosTexto } from '@/lib/acciones/presentar';
import { COSTO, leerAccionGuia } from '@/lib/guia';

export const revalidate = 3600;

const ESFUERZO: Record<string, string> = { easy: 'Fácil', medium: 'Esfuerzo medio', hard: 'Lleva trabajo' };

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const a = await leerAccionGuia(params.slug);
  if (!a) return { title: 'Acción no encontrada', robots: { index: false } };
  const tema = getDomain(a.tema)?.name_es;
  return {
    title: a.titulo,
    description: a.resumen ?? a.descripcion?.slice(0, 155) ?? `${a.titulo}: cómo se hace y cuánto ahorra.`,
    alternates: { canonical: `/guia/${a.slug}` },
    openGraph: { title: a.titulo, description: a.resumen ?? undefined, type: 'article', section: tema },
  };
}

/**
 * Una acción de la guía pública: por qué, cómo, cuánto ahorra y de dónde sale
 * el dato. Es la única pantalla sin cuenta que puede llevar un anuncio
 * (`guia`), y va DESPUÉS del contenido, nunca en medio de los pasos.
 */
export default async function AccionGuiaPage({ params }: { params: { slug: string } }) {
  const a = await leerAccionGuia(params.slug);
  if (!a) notFound();

  const dom = getDomain(a.tema);
  const pasos = (a.pasos ?? '')
    .split('\n')
    .map((p) => p.trim())
    .filter(Boolean);
  const impacto = [
    { valor: Number(a.agua_l), Icono: Droplets, texto: (n: number) => `${formatWater(n)} de agua` },
    { valor: Number(a.co2_kg), Icono: Leaf, texto: (n: number) => `${formatCo2(n)} de CO₂` },
    { valor: Number(a.residuos_kg), Icono: Recycle, texto: (n: number) => `${formatWaste(n)} de residuos` },
    { valor: Number(a.energia_kwh), Icono: Zap, texto: (n: number) => formatEnergy(n) },
  ].filter((x) => x.valor > 0);
  const datos = [
    minutosTexto(a.minutos) && { Icono: Clock, texto: minutosTexto(a.minutos)! },
    lugarTexto(a.lugar) && { Icono: MapPin, texto: lugarTexto(a.lugar)! },
    { Icono: Wallet, texto: a.ahorra ? 'Te ahorra plata' : (COSTO[a.costo ?? 'gratis'] ?? 'Gratis') },
    a.con_adulto && { Icono: Users, texto: 'Con un adulto' },
  ].filter(Boolean) as { Icono: typeof Clock; texto: string }[];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: a.titulo,
    description: a.resumen ?? a.descripcion ?? undefined,
    totalTime: a.minutos ? `PT${a.minutos}M` : undefined,
    step: pasos.map((p, i) => ({ '@type': 'HowToStep', position: i + 1, text: p })),
    publisher: { '@type': 'Organization', name: BRAND.name },
  };

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />

      <nav aria-label="Ruta" className="flex items-center gap-1 text-caption text-muted-foreground">
        <Link href="/guia" className="inline-flex items-center gap-1 hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Guía
        </Link>
        {dom && (
          <>
            <ChevronRight className="h-3 w-3" />
            <Link href={`/guia#${dom.slug}`} className="hover:text-foreground">
              {dom.name_es}
            </Link>
          </>
        )}
      </nav>

      <header className="mt-4 flex items-start gap-3">
        <DomainIcon domain={a.tema} size={48} />
        <div className="min-w-0">
          <h1 className="text-balance font-display text-h1 font-extrabold leading-tight">{a.titulo}</h1>
          {a.resumen && <p className="mt-1 text-small leading-relaxed text-muted-foreground">{a.resumen}</p>}
        </div>
      </header>

      <ul className="mt-4 flex flex-wrap gap-1.5">
        {datos.map(({ Icono, texto }) => (
          <li key={texto} className="inline-flex items-center gap-1 rounded-pill bg-surface-2 px-2.5 py-1 text-caption font-medium">
            <Icono className="h-3.5 w-3.5 text-muted-foreground" /> {texto}
          </li>
        ))}
        {a.esfuerzo && ESFUERZO[a.esfuerzo] && (
          <li className="inline-flex items-center rounded-pill bg-surface-2 px-2.5 py-1 text-caption font-medium">{ESFUERZO[a.esfuerzo]}</li>
        )}
      </ul>

      {impacto.length > 0 && (
        <section className="mt-6 rounded-card border border-border bg-surface p-4">
          <h2 className="eyebrow text-muted-foreground">Cada vez que la hacés</h2>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {impacto.map(({ valor, Icono, texto }) => (
              <li key={texto(valor)} className="flex items-center gap-2 text-small font-semibold">
                <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-primary/10 text-primary">
                  <Icono className="h-4 w-4" />
                </span>
                {texto(valor)}
              </li>
            ))}
          </ul>
          {a.equivalencia && <p className="mt-3 text-caption text-muted-foreground">{a.equivalencia}</p>}
        </section>
      )}

      {a.descripcion && (
        <section className="mt-6">
          <h2 className="font-display text-h3 font-bold">Por qué importa</h2>
          <p className="mt-1.5 whitespace-pre-line text-body leading-relaxed">{a.descripcion}</p>
        </section>
      )}

      {pasos.length > 0 && (
        <section className="mt-6">
          <h2 className="font-display text-h3 font-bold">Cómo se hace</h2>
          <ol className="mt-2 space-y-2">
            {pasos.map((p, i) => (
              <li key={i} className="flex gap-3 text-body leading-relaxed">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-2 text-caption font-bold tnum">
                  {i + 1}
                </span>
                <span>{p}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {a.fuente && (
        <p className="mt-6 text-caption text-muted-foreground">
          Fuente del dato:{' '}
          {a.fuente_url ? (
            <a href={a.fuente_url} target="_blank" rel="noopener nofollow" className="inline-flex items-center gap-0.5 underline-offset-2 hover:underline">
              {a.fuente} <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            a.fuente
          )}
        </p>
      )}

      <section className="mt-8 rounded-card border border-primary/30 bg-primary/5 p-5">
        <p className="font-display text-h3 font-bold">Hacela parte de tu día</p>
        <p className="mt-1 text-small leading-relaxed text-muted-foreground">
          En {BRAND.name} marcás lo que hacés, sostenés una racha, ves cuánto ahorraste de verdad y tu mundo crece con
          vos. Es gratis.
        </p>
        <Link
          href={`/auth/login?modo=crear&next=${encodeURIComponent(`/acciones/${a.slug}`)}`}
          className={buttonVariants({ variant: 'primary', className: 'mt-3 rounded-pill' })}
        >
          Crear mi cuenta
        </Link>
      </section>

      <AdSlot placement="guia" className="mt-8 border-t border-hairline pt-6" />

      {a.relacionadas.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-h3 font-bold">Otras de {dom?.name_es ?? 'este tema'}</h2>
          <ul className="mt-2 divide-y divide-hairline overflow-hidden rounded-card border border-border bg-surface">
            {a.relacionadas.map((r) => (
              <li key={r.slug}>
                <Link href={`/guia/${r.slug}`} className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2">
                  <span className="min-w-0 flex-1">
                    <span className="block text-small font-semibold">{r.titulo}</span>
                    {r.resumen && <span className="line-clamp-1 text-caption text-muted-foreground">{r.resumen}</span>}
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
