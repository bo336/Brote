'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowRight, ChevronRight, FileText, Sparkles } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { ProgressBar } from '@/components/ui/progress';
import { CountUp } from '@/components/ui/count-up';
import { Textarea } from '@/components/ui/input';
import { CerradoEl, ChipAmbicion, ChipEsfuerzo, EyebrowObjetivo, MetricaObjetivo } from '@/components/negocio/mejora/piezas';
import { aceptarObjetivo, descartarObjetivo, generarObjetivos, proponerUnoMas } from '@/lib/negocio/mejora-acciones';
import { puede } from '@/lib/negocio/roles';
import type { MejoraEstado, ObjetivoFila } from '@/lib/supabase/rows-negocio';
import { useToastStore } from '@/stores/toast';
import { cn } from '@/lib/utils/cn';

/**
 * `/negocio/mejora` — el programa (07 §4.4).
 *
 * Sin puntos, sin insignias, sin celebración. Un tilde y una fecha. El
 * contraste con la app de personas es intencional: es lo que le dice al usuario,
 * sin palabras, que está en otro lugar.
 */
export function ProgramaMejora({ estado }: { estado: MejoraEstado }) {
  const t = useTranslations('negocio.mejora');
  const te = useTranslations('negocio.mejora.errores');
  const router = useRouter();
  const [generando, setGenerando] = useState(false);
  const [descartando, setDescartando] = useState<string | null>(null);
  const [motivo, setMotivo] = useState('');
  const [ocupado, setOcupado] = useState<string | null>(null);

  const puedeEditar = puede(estado.rol, 'gestionar_objetivos');
  const propuestos = estado.objetivos.filter((g) => g.status === 'propuesto');
  const activos = estado.objetivos.filter((g) => g.status === 'activo' || g.status === 'en_riesgo');
  const enRevision = estado.objetivos.filter((g) => g.status === 'en_revision');
  const cerrados = estado.objetivos.filter((g) =>
    ['logrado', 'logrado_parcial', 'incumplido'].includes(g.status),
  );
  const cargaActual = activos.reduce((a, g) => a + Number(g.esfuerzo_horas_mes), 0);
  const dossierListo = !!estado.dossier;
  const completitud = estado.dossier?.completitud ?? 0;

  const aviso = (variant: 'success' | 'error', title: string, description?: string) =>
    useToastStore.getState().push({ variant, title, description });

  function traducir(codigo: string): string {
    return te.has(codigo) ? te(codigo) : te('sin_objetivos');
  }

  async function generar() {
    setGenerando(true);
    const r = await generarObjetivos(estado.negocio.id);
    setGenerando(false);
    if (!r.ok) return aviso('error', traducir(r.error));
    aviso('success', t('generado', { n: r.cantidad }));
    router.refresh();
  }

  async function otro() {
    setGenerando(true);
    const r = await proponerUnoMas(estado.negocio.id);
    setGenerando(false);
    if (!r.ok) return aviso('error', traducir(r.error));
    router.refresh();
  }

  async function aceptar(g: ObjetivoFila) {
    setOcupado(g.id);
    const r = await aceptarObjetivo(g.id);
    setOcupado(null);
    if (!r.ok) return aviso('error', traducir(r.error));
    router.refresh();
  }

  async function descartar(g: ObjetivoFila) {
    setOcupado(g.id);
    const r = await descartarObjetivo(g.id, motivo);
    setOcupado(null);
    if (!r.ok) return aviso('error', traducir(r.error));
    setDescartando(null);
    setMotivo('');
    router.refresh();
  }

  // Sin dossier no hay programa: ese es el orden, y decirlo es más honesto que
  // proponer objetivos genéricos.
  if (!dossierListo) {
    return (
      <div className="max-w-2xl">
        <span className="eyebrow text-muted-foreground">{t('sinDossier.eyebrow')}</span>
        <h1 className="mt-1.5 font-display text-display-l font-bold">{t('sinDossier.titulo')}</h1>
        <p className="mt-2 max-w-prose text-body leading-relaxed text-muted-foreground">{t('sinDossier.cuerpo')}</p>
        <Link
          href="/negocio/mejora/dossier"
          className={cn(buttonVariants({ variant: 'primary' }), 'mt-6 rounded-pill')}
        >
          {t('sinDossier.boton')}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-9">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="eyebrow text-muted-foreground">{t('eyebrow')}</span>
          <h1 className="mt-1.5 font-display text-display-l font-bold">{t('titulo')}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/negocio/mejora/dossier" className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }))}>
            <FileText className="h-4 w-4" />
            {t('verDossier')}
          </Link>
          {puedeEditar && (
            <Button
              size="sm"
              className="rounded-pill"
              loading={generando}
              onClick={() => void (propuestos.length > 0 ? otro() : generar())}
            >
              <Sparkles className="h-4 w-4" />
              {propuestos.length > 0 ? t('otroMas') : t('generar')}
            </Button>
          )}
        </div>
      </header>

      {completitud < 100 && (
        <p className="text-small text-muted-foreground">
          {t('dossierParcial', { n: completitud })}{' '}
          <Link href="/negocio/mejora/dossier" className="font-medium text-primary">
            <span className="link-underline">{t('sinDossier.boton')}</span>
          </Link>
        </p>
      )}

      {/* Progreso de Mejora. `ProgressBar` toma 0..1. */}
      <section className="border-y border-hairline py-5">
        <span className="eyebrow text-muted-foreground">{t('progreso.eyebrow')}</span>
        <p className="mt-1 font-display text-h1 font-bold tnum">
          <CountUp value={estado.progreso} /> / 100
        </p>
        <ProgressBar value={estado.progreso / 100} height={8} className="mt-2 max-w-md" />
        <p className="mt-2 text-small leading-relaxed text-muted-foreground">
          {t('progreso.ciclos', { n: estado.ciclos_cerrados })}{' '}
          {estado.ciclos_cerrados >= 2 ? t('progreso.escalera') : t('progreso.faltanCiclos', { n: 2 - estado.ciclos_cerrados })}
        </p>
      </section>

      {propuestos.length > 0 && (
        <section>
          <span className="eyebrow text-muted-foreground">{t('secciones.propuestos')}</span>
          <ul className="mt-2 border-y border-hairline divide-hairline">
            {propuestos.map((g, i) => (
              <li
                key={g.id}
                className="py-4 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:fill-mode-both"
                style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
              >
                <FilaObjetivo g={g} />
                {puedeEditar && (
                  <div className="mt-3">
                    {descartando === g.id ? (
                      <div className="space-y-2">
                        <label htmlFor={`motivo-${g.id}`} className="block text-small font-medium">
                          {t('descartarTitulo')}
                        </label>
                        <Textarea
                          id={`motivo-${g.id}`}
                          value={motivo}
                          onChange={(e) => setMotivo(e.target.value)}
                          placeholder={t('descartarPh')}
                          className="min-h-16 text-small"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" variant="secondary" loading={ocupado === g.id} onClick={() => void descartar(g)}>
                            {t('descartar')}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setDescartando(null)}>
                            {t('dossier.atras')}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          className="rounded-pill"
                          loading={ocupado === g.id}
                          disabled={activos.length >= 3 || cargaActual + Number(g.esfuerzo_horas_mes) > 12}
                          onClick={() => void aceptar(g)}
                        >
                          {t('aceptar')}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setDescartando(g.id)}>
                          {t('descartar')}
                        </Button>
                        {activos.length >= 3 ? (
                          <span className="text-caption text-muted-foreground">{t('topeActivos')}</span>
                        ) : cargaActual + Number(g.esfuerzo_horas_mes) > 12 ? (
                          <span className="text-caption text-muted-foreground">{t('topeCarga')}</span>
                        ) : null}
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <span className="eyebrow text-muted-foreground">{t('secciones.activos', { n: activos.length })}</span>
        {activos.length === 0 && enRevision.length === 0 ? (
          <div className="mt-2 border-y border-hairline py-6">
            <p className="text-small font-semibold">{t('vacio.titulo')}</p>
            <p className="mt-1 max-w-prose text-small leading-relaxed text-muted-foreground">{t('vacio.cuerpo')}</p>
          </div>
        ) : (
          <ul className="mt-2 border-y border-hairline divide-hairline">
            {[...activos, ...enRevision].map((g) => (
              <li key={g.id}>
                <Link href={`/negocio/mejora/${g.id}`} className="group flex items-start gap-3 py-4">
                  <span className="min-w-0 flex-1">
                    <FilaObjetivo g={g} enlace />
                  </span>
                  <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {cerrados.length > 0 && (
        <section>
          <span className="eyebrow text-muted-foreground">{t('secciones.cerrados')}</span>
          <ul className="mt-2 border-y border-hairline divide-hairline">
            {cerrados.map((g) => (
              <li key={g.id}>
                <Link href={`/negocio/mejora/${g.id}`} className="group flex items-center gap-3 py-3">
                  <span className="min-w-0 flex-1">
                    <span className="block text-small font-medium">
                      <span className="link-underline">{g.titulo}</span>
                    </span>
                    <CerradoEl g={g} />
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function FilaObjetivo({ g, enlace = false }: { g: ObjetivoFila; enlace?: boolean }) {
  const t = useTranslations('negocio.mejora');
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
        <EyebrowObjetivo g={g} />
        <span className="flex shrink-0 items-center gap-1.5">
          <ChipAmbicion ambicion={g.ambicion} />
          <ChipEsfuerzo horas={Number(g.esfuerzo_horas_mes)} />
        </span>
      </div>
      <p className="mt-1 text-body font-semibold leading-snug">
        {enlace ? <span className="link-underline">{g.titulo}</span> : g.titulo}
      </p>
      <MetricaObjetivo g={g} />
      {g.status === 'en_revision' && (
        <p className="mt-1.5 text-caption text-muted-foreground">{t('detalle.enRevision')}</p>
      )}
      {g.observacion && g.status === 'activo' && (
        <p className="mt-1.5 text-caption text-brote-sun">{g.observacion}</p>
      )}
    </>
  );
}
