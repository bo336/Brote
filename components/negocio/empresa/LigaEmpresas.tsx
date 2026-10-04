import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Medal, Scale, ShieldCheck, Trophy } from 'lucide-react';
import { BarrasPuntaje } from './BarrasPuntaje';
import { RUBROS, claveTamano } from '@/lib/negocio/catalogo';
import { LIGA } from '@/lib/negocio/liga';
import type { LigaEmpresas as Liga, MiPuestoLiga } from '@/lib/supabase/rows-negocio';
import { cn } from '@/lib/utils/cn';

const MEDALLA = ['#FFB23E', '#B9C2CC', '#C2703D'];

/**
 * La Liga de empresas (0121): quién está cumpliendo su plan esta temporada.
 *
 * Lo primero que se lee es por qué es justa —el tamaño no cuenta— porque es
 * lo primero que pregunta una PyME al ver una tabla con una empresa grande.
 * El tamaño se MUESTRA en cada fila a propósito: que se vea que una de cinco
 * personas puede estar arriba de una de doscientas.
 */
export function LigaEmpresas({
  liga,
  mio,
  miId,
  rubro,
}: {
  liga: Liga | null;
  mio: MiPuestoLiga | null;
  miId: string | null;
  rubro: string | null;
}) {
  const t = useTranslations('negocio.liga');
  const tn = useTranslations('negocio');

  return (
    <div className="max-w-3xl space-y-6">
      <header>
        <span className="eyebrow text-brote-sun">{liga?.temporada.nombre ?? t('eyebrow')}</span>
        <h1 className="mt-1.5 flex items-center gap-2 font-display text-display-l font-bold leading-tight">
          <Trophy className="h-7 w-7 text-brote-sun" aria-hidden />
          {t('titulo')}
        </h1>
        <p className="mt-1.5 max-w-prose text-small leading-relaxed text-muted-foreground">{t('bajada')}</p>
      </header>

      <section className="grid gap-3 rounded-card border border-border bg-surface p-4 shadow-soft sm:grid-cols-[auto_1fr]">
        <Scale className="h-6 w-6 text-primary" aria-hidden />
        <div>
          <h2 className="font-display text-h3 font-bold">{t('justaTitulo')}</h2>
          <p className="mt-1 text-small leading-relaxed text-muted-foreground">{t('justaCuerpo')}</p>
          <ul className="mt-2 grid gap-1.5 text-small sm:grid-cols-3">
            <li><span className="font-semibold">{t('logros')}</span> · {t('logrosDetalle', { max: LIGA.topeLogros, n: LIGA.maxLogros })}</li>
            <li><span className="font-semibold">{t('constancia')}</span> · {t('constanciaDetalle', { max: LIGA.topeConstancia })}</li>
            <li><span className="font-semibold">{t('avance')}</span> · {t('avanceDetalle', { max: LIGA.topeAvance })}</li>
          </ul>
        </div>
      </section>

      {mio && mio.participa && (
        <section className="rounded-card bg-brote-ink p-4 text-brote-cream shadow-soft-lg">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow text-brote-cream/60">{t('tuEmpresa')}</p>
              <p className="mt-1 font-display text-display-l font-extrabold leading-none tnum">
                {mio.puntaje.total}
                <span className="ml-1 text-small font-normal text-brote-cream/60">/ 1000</span>
              </p>
            </div>
            <p className="text-small text-brote-cream/80">
              {mio.verificada && mio.puesto ? t('puesto', { puesto: mio.puesto, total: mio.empresas }) : t('sinPuesto')}
            </p>
          </div>
          <BarrasPuntaje puntaje={mio.puntaje} oscuro className="mt-3" />
          {!mio.verificada && (
            <Link href="/negocio/verificacion" className="mt-3 inline-flex items-center gap-1.5 text-small font-semibold text-brote-lime">
              <ShieldCheck className="h-4 w-4" aria-hidden />
              {t('verificar')}
            </Link>
          )}
        </section>
      )}

      <nav aria-label={t('filtro')} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar">
        <Chip href="/negocio/liga" activo={!rubro}>
          {t('todos')}
        </Chip>
        {RUBROS.map((r) => (
          <Chip key={r} href={`/negocio/liga?rubro=${r}`} activo={rubro === r}>
            {tn(`rubros.${r}`)}
          </Chip>
        ))}
      </nav>

      {!liga ? (
        <p className="text-small text-muted-foreground">{t('pronto')}</p>
      ) : liga.filas.length === 0 ? (
        <p className="rounded-card border border-dashed border-border p-5 text-center text-small text-muted-foreground">
          {t('vacia')}
        </p>
      ) : (
        <ol className="divide-y divide-hairline overflow-hidden rounded-card border border-border bg-surface shadow-soft">
          {liga.filas.map((f, i) => (
            <li key={f.id} className={cn('flex items-center gap-3 px-4 py-3', f.id === miId && 'bg-primary/[0.06]')}>
              <span className="flex w-7 shrink-0 justify-center font-display text-body font-bold tnum">
                {i < 3 ? <Medal className="h-5 w-5" style={{ color: MEDALLA[i] }} aria-label={`${i + 1}`} /> : i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-small font-semibold">{f.nombre}</span>
                <span className="block truncate text-caption text-muted-foreground">
                  {tn(`rubros.${f.rubro}`)} · {tn(`tamanosCorto.${claveTamano(f.tamano)}`)}
                  {f.provincia ? ` · ${f.provincia}` : ''}
                </span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block font-display text-h3 font-bold tnum">{f.total}</span>
                <span className="block text-caption text-muted-foreground tnum">
                  {t('cerrados', { n: f.cerrados })}
                </span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function Chip({ href, activo, children }: { href: string; activo: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={activo ? 'page' : undefined}
      className={cn(
        'shrink-0 rounded-pill border px-3 py-1.5 text-caption font-medium transition-colors',
        activo ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-surface hover:border-primary/40',
      )}
    >
      {children}
    </Link>
  );
}
