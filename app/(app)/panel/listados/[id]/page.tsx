'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { AlertTriangle, ArrowLeft, ExternalLink, FileText, Sparkles, Unlink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { CandadoPanel, usePanelPass } from '@/components/panel/PanelPass';
import { FichaListado } from '@/components/mercado/FichaListado';
import { NivelBadge } from '@/components/mercado/NivelBadge';
import { firmarEvidencia } from '@/lib/api/negocios';
import {
  afirmacionDesenganchar,
  listadoAuditar,
  listadoDespublicar,
  listadoRevisar,
  listadoRevision,
  listadosCola,
  notaCorreccion,
} from '@/lib/api/mercado';
import { CLAIMS } from '@/lib/mercado/claims';
import type { FichaMercado, RevisionListado } from '@/lib/supabase/rows-mercado';
import { useToastStore } from '@/stores/toast';
import { cn } from '@/lib/utils/cn';

type Decision = 'aprobar' | 'rechazar';

/**
 * `/panel/listados/[id]` — la revisión de un listado (fase 3 §6.2).
 *
 * A la izquierda, el listado RENDERIZADO como lo vería una persona: ver el
 * resultado real es lo que evita aprobar algo que se lee mal. A la derecha,
 * cada afirmación con el nivel que tendría si se aprueba (lo calcula la base),
 * lo que sugiere la IA al lado —sugerencia, nunca decisión— y la alerta de
 * halo. Atajos A · C · R · J/K, que no disparan con el foco en un campo.
 */
export default function RevisionListadoPage() {
  const t = useTranslations('mercado.panel');
  const tn = useTranslations('mercado.nivel');
  const tc = useTranslations('mercado.categorias');
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { pass, setPass } = usePanelPass();
  const [d, setD] = useState<RevisionListado | null>(null);
  const [noExiste, setNoExiste] = useState(false);
  const [nota, setNota] = useState('');
  const [decisiones, setDecisiones] = useState<Record<string, { decision: Decision; nota: string }>>({});
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [correccion, setCorreccion] = useState('');
  const notaRef = useRef<HTMLTextAreaElement>(null);

  const aviso = (variant: 'success' | 'error', title: string) => useToastStore.getState().push({ variant, title });

  const cargar = useCallback(async () => {
    if (!pass || !id) return;
    const r = await listadoRevision(pass, id);
    if (!r.ok) {
      if (/autorizado/i.test(r.error ?? '')) setPass('');
      else setNoExiste(true);
      return;
    }
    setD(r as RevisionListado);
  }, [pass, id, setPass]);

  useEffect(() => {
    setD(null);
    setNoExiste(false);
    setNota('');
    setDecisiones({});
    void cargar();
  }, [cargar]);

  const pendiente = d?.listado.status === 'pendiente';
  const pendientes = d?.afirmaciones.filter((a) => a.status === 'pendiente') ?? [];

  const revisar = useCallback(
    async (accion: 'publicar' | 'cambios' | 'rechazar') => {
      if (!d || !pass || ocupado || !pendiente) return;
      if (accion !== 'publicar' && nota.trim().length < 5) {
        aviso('error', t('notaFalta'));
        notaRef.current?.focus();
        return;
      }
      if (accion === 'publicar' && pendientes.some((a) => !decisiones[a.id])) {
        aviso('error', t('faltaDecidir'));
        return;
      }
      setOcupado(accion);
      const r = await listadoRevisar(
        pass,
        d.listado.id,
        accion,
        nota.trim(),
        Object.entries(decisiones).map(([cid, v]) => ({ id: cid, decision: v.decision, nota: v.nota })),
      );
      setOcupado(null);
      if (!r.ok) return aviso('error', r.error ?? t('error'));
      aviso('success', t('hecho'));
      const siguiente = d.siguiente ?? (await listadosCola(pass, 'pendientes')).items[0]?.id ?? null;
      router.push(siguiente && siguiente !== d.listado.id ? `/panel/listados/${siguiente}` : '/panel/listados');
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [d, pass, ocupado, pendiente, nota, decisiones, router, t],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || el.closest('input, textarea, select, [contenteditable="true"]'))) return;
      const k = e.key.toLowerCase();
      if (k === 'a') void revisar('publicar');
      else if (k === 'c') void revisar('cambios');
      else if (k === 'r') void revisar('rechazar');
      else if (k === 'j' && d?.siguiente) router.push(`/panel/listados/${d.siguiente}`);
      else if (k === 'k' && d?.anterior) router.push(`/panel/listados/${d.anterior}`);
      else return;
      e.preventDefault();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [revisar, d, router]);

  async function verDocumento(ruta: string) {
    if (!d || !pass) return;
    const url = await firmarEvidencia(pass, d.negocio.id, ruta);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
    else aviso('error', t('error'));
  }

  async function accionSimple(clave: string, fn: () => Promise<{ ok: boolean; error?: string } | { ok: false; error: string }>) {
    setOcupado(clave);
    const r = await fn();
    setOcupado(null);
    if (!r.ok) return aviso('error', ('error' in r && r.error) || t('error'));
    aviso('success', t('hecho'));
    await cargar();
  }

  if (!pass) return <CandadoPanel verificar={async (p) => (await listadosCola(p, 'pendientes')).ok} />;

  const volver = (
    <Link href="/panel/listados" className="inline-flex items-center gap-1.5 text-small text-muted-foreground transition-colors duration-150 hover:text-foreground">
      <ArrowLeft className="h-4 w-4" /> {t('titulo')}
    </Link>
  );
  if (noExiste) return <div className="py-6">{volver}</div>;
  if (!d) {
    return (
      <div className="space-y-3 py-6">
        {volver}
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const l = d.listado;
  const s = l.screening_ia;
  // El listado como lo vería una persona, con cada afirmación en el nivel que tendría aprobada.
  const vista: FichaMercado = {
    id: l.id, slug: l.slug, titulo: l.titulo, tipo: l.tipo, imagen: l.imagenes[0] ?? null, imagenes: l.imagenes,
    categoria: l.categoria, dominios: l.dominios, precio: l.precio_referencia, moneda: l.moneda, tier: l.tier_efectivo,
    score: l.score, disponibilidad: l.disponibilidad, zonas: l.zonas, tiene_precio: l.precio_referencia !== null,
    descripcion_largo: l.descripcion.length, updated_at: l.updated_at, descripcion: l.descripcion, status: l.status,
    vista_previa: true, dominio_destino: l.url_destino, publicado_at: l.publicado_at, ya_reportado: false,
    negocio: { id: d.negocio.id, slug: d.negocio.slug, nombre: d.negocio.nombre, logo: null, tier: d.negocio.tier,
      provincia: d.negocio.provincia, ciudad: d.negocio.ciudad, verificacion: d.negocio.verificacion, nota_correccion: null },
    afirmaciones: d.afirmaciones
      .filter((a) => a.nivel_si_aprueba !== 'e0' && (a.status === 'aprobada' || decisiones[a.id]?.decision !== 'rechazar'))
      .map((a) => ({ id: a.id, kind: a.kind, alcance: a.alcance, datos: a.datos, tier: a.status === 'aprobada' ? a.tier : a.nivel_si_aprueba,
        cert_numero: a.cert_numero, cert_vence: a.cert_vence, cert: a.cert ? { nombre: a.cert.nombre, emisor: a.cert.emisor } : null })),
  };

  return (
    <div className="space-y-5 py-4 pb-16">
      {volver}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_26rem]">
        <section aria-label={t('comoLoVe')} className="rounded-card border border-border p-4">
          <span className="eyebrow text-muted-foreground">{t('comoLoVe')}</span>
          <div className="mt-3">
            <FichaListado f={vista} />
          </div>
        </section>

        <aside className="space-y-6">
          {/* La IA, o que no hubo IA. Primero, porque es lo que se lee primero. */}
          <section className="rounded-card border border-border bg-surface p-4">
            {s?.por === 'ia' ? (
              <>
                <p className="eyebrow inline-flex items-center gap-1.5 text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5" />
                  {t('ia', { puntaje: s.puntaje ?? 0, recomendacion: t.has(`recomendaciones.${s.recomendacion}`) ? t(`recomendaciones.${s.recomendacion}`) : (s.recomendacion ?? '') })}
                </p>
                {s.resumen && <p className="mt-1.5 text-small leading-relaxed">&ldquo;{s.resumen}&rdquo;</p>}
                {s.riesgo_greenwashing && <p className="mt-1.5 text-caption text-muted-foreground">{t('riesgo', { riesgo: s.riesgo_greenwashing })}</p>}
                {s.nota_al_revisor && <p className="mt-1.5 text-caption text-muted-foreground">{s.nota_al_revisor}</p>}
                {(s.banderas_texto?.length ?? 0) > 0 && (
                  <p className="mt-2 text-caption">
                    <span className="font-semibold">{t('banderas')}: </span>
                    {s.banderas_texto!.join(' · ')}
                  </p>
                )}
              </>
            ) : (
              <p className="text-small font-medium text-brote-sun">{t('soloReglas')}</p>
            )}
            {(l.validacion?.banderas?.length ?? 0) > 0 && (
              <p className="mt-2 text-caption text-muted-foreground">
                {t('banderas')}: {l.validacion!.banderas!.map((b) => b.termino).join(', ')}
              </p>
            )}
          </section>

          <section>
            <span className="eyebrow text-muted-foreground">{t('negocio')}</span>
            <p className="mt-1 text-small font-semibold">
              {d.negocio.nombre} · {d.negocio.rubro}
            </p>
            <p className="text-caption text-muted-foreground">
              {t(`verificacion.${d.negocio.verificacion ?? 'ninguna'}`)} · {t('reportesConfirmados', { n: d.negocio.reportes_confirmados })}
            </p>
            <NivelBadge nivel={d.negocio.tier} tamano="sm" className="mt-1.5" />
            <p className="mt-1.5 text-caption text-muted-foreground">
              {tc(l.categoria)} · {l.url_destino}
            </p>
          </section>

          <section>
            <span className="eyebrow text-muted-foreground">{t('afirmaciones')}</span>
            <ul className="mt-2 space-y-3">
              {d.afirmaciones.map((a) => {
                const ia = s?.afirmaciones?.find((x) => x.claim_id === a.id);
                const dec = decisiones[a.id];
                return (
                  <li key={a.id} className={cn('rounded-card border bg-surface p-3.5', a.alerta_halo ? 'border-brote-coral/60' : 'border-border')}>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-small font-semibold">{CLAIMS[a.kind].nombre}</span>
                      <NivelBadge nivel={a.status === 'aprobada' ? a.tier : a.nivel_si_aprueba} tamano="sm" enlace={false} />
                    </div>
                    <p className="mt-1 text-small leading-relaxed">{a.enunciado}</p>
                    {a.status !== 'aprobada' && (
                      <p className="mt-1 text-caption text-muted-foreground">{t('nivelSiAprueba', { nivel: tn(`${a.nivel_si_aprueba}.corto`) })}</p>
                    )}
                    {ia && (
                      <div className="mt-2 rounded-[12px] bg-surface-2 px-3 py-2 text-caption leading-relaxed">
                        <p className="font-semibold">{t('nivelIA', { nivel: ia.nivel_sugerido })}</p>
                        {ia.problemas.length > 0 && <p className="mt-0.5">{t('problemas')}: {ia.problemas.join(' · ')}</p>}
                        {ia.texto_sugerido && <p className="mt-0.5">{t('textoSugerido')}: &ldquo;{ia.texto_sugerido}&rdquo;</p>}
                        {ia.alcance_real && <p className="mt-0.5">{t('alcanceReal')}: {ia.alcance_real}</p>}
                      </div>
                    )}
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-caption">
                      {a.evidencia_path && (
                        <button type="button" onClick={() => void verDocumento(a.evidencia_path!)} className="inline-flex items-center gap-1 font-medium text-primary">
                          <FileText className="h-3.5 w-3.5" />
                          {t('verDocumento')}
                        </button>
                      )}
                      {a.cert && (
                        <span className="text-muted-foreground">
                          {a.cert.nombre} · Nº {a.cert_numero ?? '—'} · {a.cert_vence ?? '—'}
                        </span>
                      )}
                      {a.cert_url && (
                        <a href={a.cert_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-primary">
                          <ExternalLink className="h-3.5 w-3.5" />
                          {t('registro')}
                        </a>
                      )}
                    </div>
                    {a.cert_nota && <p className="mt-1 text-caption text-muted-foreground">{a.cert_nota}</p>}
                    {a.cert_desconocida && <p className="mt-1 text-caption text-brote-sun">{t('certDesconocida', { nombre: a.cert_desconocida })}</p>}
                    {a.alerta_halo && (
                      <p className="mt-2 flex items-start gap-1.5 text-caption font-medium text-brote-coral">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        {t('halo', { categoria: tc(a.categoria_origen ?? '') })}
                      </p>
                    )}
                    {a.enganchada_en.length > 0 && (
                      <p className="mt-1 text-caption text-muted-foreground">
                        {t('enganchadaEn')} {a.enganchada_en.map((o) => o.titulo).join(', ')}
                      </p>
                    )}

                    {a.status === 'pendiente' && pendiente ? (
                      <div className="mt-2.5 space-y-2">
                        <div className="flex gap-1.5">
                          {(['aprobar', 'rechazar'] as const).map((x) => (
                            <button
                              key={x}
                              type="button"
                              aria-pressed={dec?.decision === x}
                              onClick={() => setDecisiones({ ...decisiones, [a.id]: { decision: x, nota: dec?.nota ?? '' } })}
                              className={cn(
                                'press rounded-pill border px-3 py-1 text-caption font-semibold transition-colors duration-150',
                                dec?.decision === x
                                  ? x === 'aprobar'
                                    ? 'border-primary bg-primary/12 text-primary'
                                    : 'border-brote-coral bg-brote-coral/10 text-brote-coral'
                                  : 'border-border text-muted-foreground hover:text-foreground',
                              )}
                            >
                              {x === 'aprobar' ? t('aprobar') : t('rechazarAfirmacion')}
                            </button>
                          ))}
                        </div>
                        {dec?.decision === 'rechazar' && (
                          <Textarea
                            aria-label={t('notaAfirmacion')}
                            placeholder={t('notaAfirmacion')}
                            value={dec.nota}
                            onChange={(e) => setDecisiones({ ...decisiones, [a.id]: { decision: 'rechazar', nota: e.target.value } })}
                            className="min-h-14 text-caption"
                          />
                        )}
                      </div>
                    ) : (
                      a.status === 'aprobada' && (
                        <p className="mt-2 text-caption text-muted-foreground">{a.auto_aprobada ? t('autoAprobada') : t('yaAprobada')}</p>
                      )
                    )}

                    {a.status === 'aprobada' && l.status !== 'pendiente' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="mt-1.5"
                        loading={ocupado === `des-${a.id}`}
                        onClick={() => void accionSimple(`des-${a.id}`, () => afirmacionDesenganchar(pass, l.id, a.id))}
                      >
                        <Unlink className="h-4 w-4" />
                        {t('desenganchar')}
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>

          {pendiente && (
            <section className="space-y-2.5">
              <label htmlFor="nota" className="block text-small font-medium">
                {t('nota')}
              </label>
              <Textarea id="nota" ref={notaRef} value={nota} onChange={(e) => setNota(e.target.value)} placeholder={t('notaPh')} className="min-h-20 text-small" />
              <div className="flex flex-wrap gap-2">
                <Button className="rounded-pill" loading={ocupado === 'publicar'} onClick={() => void revisar('publicar')}>
                  {t('publicar')}
                </Button>
                <Button variant="secondary" loading={ocupado === 'cambios'} onClick={() => void revisar('cambios')}>
                  {t('cambios')}
                </Button>
                <Button variant="ghost" loading={ocupado === 'rechazar'} onClick={() => void revisar('rechazar')}>
                  {t('rechazar')}
                </Button>
              </div>
              <p className="text-caption text-muted-foreground">{t('atajos')}</p>
            </section>
          )}

          {l.status === 'publicado' && (
            <section className="space-y-2.5 border-t border-hairline pt-4">
              {l.acelerada && !l.auditado_at && (
                <Button variant="secondary" loading={ocupado === 'auditar'} onClick={() => void accionSimple('auditar', () => listadoAuditar(pass, l.id))}>
                  {t('auditar')}
                </Button>
              )}
              <Textarea aria-label={t('nota')} value={nota} onChange={(e) => setNota(e.target.value)} placeholder={t('notaPh')} className="min-h-16 text-small" />
              {/* "Despublicar ahora", sin confirmación en cadena (08 §5.2). */}
              <Button variant="ghost" className="text-brote-coral" loading={ocupado === 'despublicar'} onClick={() => void accionSimple('despublicar', () => listadoDespublicar(pass, l.id, nota))}>
                {t('despublicar')}
              </Button>
            </section>
          )}

          <section className="space-y-2 border-t border-hairline pt-4">
            <label htmlFor="correccion" className="block text-small font-medium">
              {t('correccion')}
            </label>
            <Textarea id="correccion" value={correccion} onChange={(e) => setCorreccion(e.target.value)} placeholder={t('correccionPh')} className="min-h-14 text-small" />
            <Button size="sm" variant="secondary" loading={ocupado === 'correccion'} onClick={() => void accionSimple('correccion', () => notaCorreccion(pass, d.negocio.id, correccion))}>
              {t('guardarCorreccion')}
            </Button>
          </section>
        </aside>
      </div>
    </div>
  );
}
