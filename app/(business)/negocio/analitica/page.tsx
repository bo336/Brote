import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ArrowRight, TrendingUp } from 'lucide-react';
import { FranjaAnalitica } from '@/components/negocio/analitica/FranjaAnalitica';
import { SerieSalidas } from '@/components/negocio/analitica/SerieSalidas';
import { getActiveBusiness } from '@/lib/negocio/context';
import { getAnalitica, getDatosSugerencias, getEstadoPlan } from '@/lib/negocio/plan-servidor';
import { sugerencias } from '@/lib/negocio/sugerencias';

export const metadata: Metadata = { title: 'Analítica' };

const ORIGENES = ['catalogo', 'accion', 'ficha', 'perfil_negocio', 'busqueda'] as const;

/**
 * `/negocio/analitica` (09 §6): honestidad primero, porque es la pantalla
 * donde se decide la renovación.
 *
 * Todos los números salen de lo que de verdad pasó, y el aviso del pie dice
 * con todas las letras hasta dónde medimos: lo que ocurre en el sitio del
 * comercio no lo vemos, y prometerlo sería mentir.
 */
export default async function AnaliticaPage() {
  const activo = await getActiveBusiness();
  if (!activo) redirect('/negocio/alta');

  const t = await getTranslations('negocio.analitica');
  const [datos, plan, crudo] = await Promise.all([
    getAnalitica(activo.id, 30),
    getEstadoPlan(activo.id),
    getDatosSugerencias(activo.id),
  ]);

  const pasos = crudo ? sugerencias(crudo) : [];
  const hayDatos = !!datos && (datos.totales.impresiones > 0 || datos.totales.salidas > 0);

  return (
    <div className="space-y-7 pb-10">
      <header>
        <span className="eyebrow text-muted-foreground">{t('eyebrow')}</span>
        <h1 className="mt-1 font-display text-h1 font-bold">{t('titulo')}</h1>
      </header>

      {hayDatos && datos ? (
        <FranjaAnalitica
          impresiones={datos.totales.impresiones}
          salidas={datos.totales.salidas}
          tasa={datos.totales.tasa}
          reportes={datos.totales.reportes_resueltos}
          dias={datos.dias}
        />
      ) : (
        <div className="rounded-card border border-border bg-surface p-6">
          <p className="font-display text-h3 font-bold">{t('vacioTitulo')}</p>
          <p className="mt-1.5 text-small leading-relaxed text-muted-foreground">{t('vacioTexto')}</p>
          <Link href="/negocio/listados" className="press mt-3 inline-flex items-center gap-1.5 text-small font-semibold text-primary">
            {t('vacioAccion')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* Qué te haría subir: el motor de retención (fase 4 §3.3). Reglas
          deterministas sobre el estado real, nunca más de tres. */}
      {pasos.length > 0 && (
        <section>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h2 className="font-display text-h3 font-bold">{t('subirTitulo')}</h2>
          </div>
          <ul className="mt-3 divide-y divide-border rounded-card border border-border bg-surface">
            {pasos.map((s) => (
              <li key={s.clave} className="p-4">
                <Link href={s.href} className="press block">
                  <p className="text-small font-semibold leading-snug">{s.texto}</p>
                  <p className="mt-1 text-caption leading-relaxed text-muted-foreground">{s.porque}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {datos && datos.listados.length > 0 && (
        <section>
          <h2 className="font-display text-h3 font-bold">{t('tusListados')}</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[30rem] border-collapse text-small">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="eyebrow pb-2 font-semibold text-muted-foreground">{t('listado')}</th>
                  <th className="eyebrow pb-2 text-right font-semibold text-muted-foreground">{t('impresiones')}</th>
                  <th className="eyebrow pb-2 text-right font-semibold text-muted-foreground">{t('salidas')}</th>
                  <th className="eyebrow pb-2 text-right font-semibold text-muted-foreground">{t('tasa')}</th>
                </tr>
              </thead>
              <tbody>
                {datos.listados.map((l) => {
                  const tasa = l.impresiones > 0 ? Math.round((l.salidas * 1000) / l.impresiones) / 10 : null;
                  return (
                    <tr key={l.id} className="border-b border-hairline last:border-0 hover:bg-surface-2">
                      <td className="py-2.5 pr-3">
                        <Link href={`/negocio/listados/${l.id}`} className="press font-medium">
                          <span className="link-underline">{l.titulo}</span>
                        </Link>
                        {l.status !== 'publicado' && (
                          <span className="ml-2 text-caption text-muted-foreground">{t(`estado.${l.status}`)}</span>
                        )}
                      </td>
                      <td className="py-2.5 text-right tnum">{l.impresiones.toLocaleString('es-AR')}</td>
                      <td className="py-2.5 text-right tnum">{l.salidas.toLocaleString('es-AR')}</td>
                      <td className="py-2.5 text-right tnum">{tasa === null ? '—' : `${tasa}%`}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {datos?.completa && datos.origenes && Object.keys(datos.origenes).length > 0 && (
        <section>
          <h2 className="font-display text-h3 font-bold">{t('origenTitulo')}</h2>
          <ul className="mt-3 space-y-2">
            {ORIGENES.filter((o) => (datos.origenes?.[o] ?? 0) > 0).map((o) => {
              const n = datos.origenes![o]!;
              const total = Object.values(datos.origenes!).reduce((a, b) => a + b, 0);
              const pct = Math.round((n * 100) / total);
              return (
                <li key={o} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 text-small">{t(`origen.${o}`)}</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                    <span className="block h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </span>
                  <span className="w-12 shrink-0 text-right text-small tnum text-muted-foreground">{pct}%</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {datos?.completa && datos.serie && datos.serie.length > 0 && (
        <section>
          <h2 className="font-display text-h3 font-bold">{t('serieTitulo')}</h2>
          <div className="mt-3 rounded-card border border-border bg-surface p-3">
            <SerieSalidas serie={datos.serie} />
          </div>
        </section>
      )}

      {/* La analítica completa es del plan Raíz en adelante. Nunca un muro:
          una invitación con el número a la vista (09 §5.1). */}
      {datos && !datos.completa && (
        <section className="rounded-card border border-border bg-surface p-5">
          <p className="text-small font-semibold">{t('completaTitulo')}</p>
          <p className="mt-1 text-small leading-relaxed text-muted-foreground">{t('completaTexto')}</p>
          <Link href="/negocio/plan" className="press mt-3 inline-flex items-center gap-1.5 text-small font-semibold text-primary">
            {t('verPlanes')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      )}

      {/* El aviso de honestidad, siempre visible (09 §6). */}
      <footer className="rounded-card border border-hairline bg-surface-2 p-4">
        <p className="text-caption leading-relaxed text-muted-foreground">{t('honestidad')}</p>
        <p className="mt-2 text-caption leading-relaxed text-muted-foreground">{t('honestidadRef')}</p>
      </footer>

      {plan && !plan.cobro_activo && (
        <p className="text-caption text-muted-foreground">{t('modoFundador')}</p>
      )}
    </div>
  );
}
