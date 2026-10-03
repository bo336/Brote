import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowRight, CheckCircle2, ClipboardList, ShieldCheck, Sparkles, Target, Trophy } from 'lucide-react';
import { SumarObjetivo } from './SumarObjetivo';
import { BarrasPuntaje } from './BarrasPuntaje';
import type { MejoraEstado, MiPuestoLiga, ObjetivoFila } from '@/lib/supabase/rows-negocio';

const EN_CURSO = ['activo', 'en_riesgo', 'en_revision'];

/** The next thing to do on a goal: its first step not yet ticked. */
function proximoPaso(g: ObjetivoFila): string | null {
  const hechos = new Set(g.pasos_hechos ?? []);
  const i = (g.pasos ?? []).findIndex((_, n) => !hechos.has(n));
  return i >= 0 ? g.pasos[i]! : null;
}

/**
 * El inicio de una EMPRESA QUE MEJORA (0121).
 *
 * Una sola pregunta: qué hacemos esta semana. Por eso, de arriba abajo: el
 * próximo paso del programa (contar cómo trabajan, pedir objetivos, o seguir),
 * las acciones de la semana —el primer paso sin hacer de cada objetivo en
 * curso—, y el lugar en la Liga, que es lo que hace volver.
 */
export function InicioEmpresa({
  estado,
  liga,
  esOwner,
}: {
  estado: MejoraEstado;
  liga: MiPuestoLiga | null;
  esOwner: boolean;
}) {
  const t = useTranslations('negocio.inicioEmpresa');
  const n = estado.negocio;
  const enCurso = estado.objetivos.filter((g) => EN_CURSO.includes(g.status));
  const propuestos = estado.objetivos.filter((g) => g.status === 'propuesto');
  const completitud = Math.round(estado.dossier?.completitud ?? 0);
  const dossierListo = !!estado.dossier && completitud >= 60;
  const acciones = enCurso
    .map((g) => ({ g, paso: proximoPaso(g) }))
    .filter((x): x is { g: ObjetivoFila; paso: string } => !!x.paso)
    .slice(0, 4);

  const siguiente = !dossierListo
    ? { href: '/negocio/mejora/dossier', icono: ClipboardList, titulo: t('dossierTitulo'), cuerpo: t('dossierCuerpo', { n: completitud }), cta: t('dossierCta') }
    : enCurso.length === 0
      ? {
          href: '/negocio/mejora',
          icono: Sparkles,
          titulo: propuestos.length ? t('propuestosTitulo', { n: propuestos.length }) : t('generarTitulo'),
          cuerpo: t('generarCuerpo'),
          cta: propuestos.length ? t('propuestosCta') : t('generarCta'),
        }
      : null;

  return (
    <div className="max-w-3xl space-y-6">
      <header>
        <span className="eyebrow text-primary">{t('eyebrow')}</span>
        <h1 className="mt-1.5 font-display text-display-l font-bold leading-tight">{n.nombre_comercial}</h1>
        <p className="mt-1.5 max-w-prose text-small leading-relaxed text-muted-foreground">{t('bajada')}</p>
      </header>

      {siguiente && (
        <Link
          href={siguiente.href}
          className="press group flex items-start gap-3 rounded-card border border-primary/30 bg-primary/[0.06] p-4 hover:shadow-lift"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-primary/15 text-primary">
            <siguiente.icono className="h-5 w-5" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-h3 font-bold leading-snug">{siguiente.titulo}</span>
            <span className="mt-0.5 block text-small leading-relaxed text-muted-foreground">{siguiente.cuerpo}</span>
            <span className="mt-2 inline-flex items-center gap-1 text-small font-semibold text-primary">
              {siguiente.cta}
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
            </span>
          </span>
        </Link>
      )}

      <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
        <section aria-labelledby="acciones-semana" className="rounded-card border border-border bg-surface p-4 shadow-soft">
          <div className="flex items-center justify-between gap-2">
            <h2 id="acciones-semana" className="flex items-center gap-2 font-display text-h3 font-bold">
              <Target className="h-4 w-4 text-primary" aria-hidden />
              {t('accionesTitulo')}
            </h2>
            <Link href="/negocio/mejora" className="text-small font-semibold text-primary">
              {t('verPrograma')}
            </Link>
          </div>
          {acciones.length === 0 ? (
            <p className="mt-3 text-small leading-relaxed text-muted-foreground">
              {enCurso.length > 0 ? t('accionesListas') : t('accionesVacio')}
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-hairline">
              {acciones.map(({ g, paso }) => (
                <li key={g.id}>
                  <Link href={`/negocio/mejora/${g.id}`} className="group flex items-start gap-3 py-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block text-small font-medium leading-snug">{paso}</span>
                      <span className="mt-0.5 block truncate text-caption text-muted-foreground">
                        {g.titulo} · {t('pasosDe', { hechos: g.pasos_hechos?.length ?? 0, total: g.pasos?.length ?? 0 })}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 border-t border-hairline pt-3 text-caption leading-relaxed text-muted-foreground">
            {t('progreso', { n: n.progreso_mejora })}
          </p>
        </section>

        <section aria-labelledby="liga-resumen" className="rounded-card bg-brote-ink p-4 text-brote-cream shadow-soft-lg">
          <h2 id="liga-resumen" className="flex items-center gap-2 font-display text-h3 font-bold">
            <Trophy className="h-4 w-4 text-brote-sun" aria-hidden />
            {t('ligaTitulo')}
          </h2>
          {liga ? (
            <>
              <p className="mt-1 text-caption text-brote-cream/60">{liga.temporada.nombre}</p>
              <p className="mt-2 font-display text-display-l font-extrabold leading-none tnum">
                {liga.puntaje.total}
                <span className="ml-1 text-small font-normal text-brote-cream/60">/ 1000</span>
              </p>
              <p className="mt-1 text-small text-brote-cream/80">
                {liga.verificada && liga.puesto
                  ? t('puesto', { puesto: liga.puesto, total: liga.empresas })
                  : t('sinPuesto')}
              </p>
              <BarrasPuntaje puntaje={liga.puntaje} oscuro className="mt-3" />
              {!liga.verificada && (
                <Link href="/negocio/verificacion" className="mt-3 inline-flex items-center gap-1.5 text-small font-semibold text-brote-lime">
                  <ShieldCheck className="h-4 w-4" aria-hidden />
                  {t('verificar')}
                </Link>
              )}
              <Link href="/negocio/liga" className="mt-3 flex items-center gap-1 text-small font-semibold text-brote-cream">
                {t('verLiga')} <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </>
          ) : (
            <p className="mt-2 text-small text-brote-cream/70">{t('ligaPronto')}</p>
          )}
        </section>
      </div>

      {esOwner && <SumarObjetivo negocioId={n.id} sumar="vender" />}
    </div>
  );
}
