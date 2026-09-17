'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFormatter, useTranslations } from 'next-intl';
import { ArrowLeft, Check, Paperclip, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { ProgressBar } from '@/components/ui/progress';
import { ChipAmbicion, ChipEsfuerzo, EyebrowObjetivo, avanceDe, useNumero } from '@/components/negocio/mejora/piezas';
import { subirEvidencia } from '@/lib/api/mejora';
import { cerrarObjetivo, enviarCheckin, guardarPasos } from '@/lib/negocio/mejora-acciones';
import { puede } from '@/lib/negocio/roles';
import type { TipoCheckin } from '@/lib/mejora/tipos';
import type { CheckinFila, DetalleObjetivo } from '@/lib/supabase/rows-negocio';
import { useToastStore } from '@/stores/toast';
import { cn } from '@/lib/utils/cn';

const ATAJOS: TipoCheckin[] = ['no_llego', 'ya_hecho', 'no_aplica', 'mas_tiempo'];

/**
 * `/negocio/mejora/[goalId]` — la ficha (07 §4.5).
 *
 * Izquierda el objetivo, derecha la conversación. El historial visible NO es un
 * adorno: es lo que convierte "una IA me tiró unas metas" en "tengo un programa
 * con seguimiento", y es lo que la empresa le muestra a un cliente que pregunta.
 */
export function FichaObjetivo({ detalle }: { detalle: DetalleObjetivo }) {
  const td = useTranslations('negocio.mejora.detalle');
  const te = useTranslations('negocio.mejora.errores');
  const f = useFormatter();
  const num = useNumero();
  const router = useRouter();

  const g = detalle.objetivo;
  const abierto = g.status === 'activo' || g.status === 'en_riesgo';
  const puedeEditar = puede(detalle.rol, 'gestionar_objetivos') && abierto;
  const { avance } = avanceDe(g);

  const error = (codigo: string) =>
    useToastStore.getState().push({ variant: 'error', title: te.has(codigo) ? te(codigo) : te('sin_objetivos') });

  // ── Pasos ────────────────────────────────────────────────────────────────
  const [hechos, setHechos] = useState<number[]>(g.pasos_hechos ?? []);
  async function tildar(i: number) {
    const previo = hechos;
    const siguiente = hechos.includes(i) ? hechos.filter((n) => n !== i) : [...hechos, i].sort((a, b) => a - b);
    setHechos(siguiente);
    const r = await guardarPasos(g.id, siguiente);
    if (!r.ok) {
      setHechos(previo);
      error(r.error);
    }
  }

  // ── Ajuste ───────────────────────────────────────────────────────────────
  const [tipo, setTipo] = useState<TipoCheckin | null>(null);
  const [mensaje, setMensaje] = useState('');
  const [valorSi, setValorSi] = useState('');
  const [conEvidencia, setConEvidencia] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [respuesta, setRespuesta] = useState<string | null>(null);

  function elegirAtajo(a: TipoCheckin) {
    setTipo(a);
    setMensaje(td(`plantilla.${a}`));
    setValorSi('');
    setConEvidencia(false);
  }

  async function enviar() {
    if (!mensaje.trim()) return error('mensaje_vacio');
    setEnviando(true);
    const r = await enviarCheckin(
      g.id,
      tipo ?? 'nota',
      mensaje.trim(),
      tipo === 'no_llego' && valorSi !== '' ? Number(valorSi) : null,
      tipo === 'ya_hecho' ? conEvidencia : false,
    );
    setEnviando(false);
    if (!r.ok) return error(r.error);
    setRespuesta(r.respuesta);
    setTipo(null);
    setMensaje('');
    setValorSi('');
    router.refresh();
  }

  // ── Cierre ───────────────────────────────────────────────────────────────
  const archivoRef = useRef<HTMLInputElement>(null);
  const [cerrando, setCerrando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [valorFinal, setValorFinal] = useState('');
  const [rutas, setRutas] = useState<string[]>([]);

  async function subir(archivo: File) {
    setSubiendo(true);
    const r = await subirEvidencia(detalle.negocio_id, archivo);
    setSubiendo(false);
    if (!r.ok) return error(r.error);
    setRutas((prev) => [...prev, r.ruta]);
  }

  async function cerrar() {
    setCerrando(true);
    const r = await cerrarObjetivo(g.id, valorFinal === '' ? null : Number(valorFinal), rutas);
    setCerrando(false);
    if (!r.ok) return error(r.error);
    router.refresh();
  }

  return (
    <div className="max-w-5xl">
      <Link
        href="/negocio/mejora"
        className="inline-flex items-center gap-1.5 text-small font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {td('volver')}
      </Link>

      <div className="mt-4 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12">
        {/* ── El objetivo ───────────────────────────────────────────────── */}
        <div>
          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5">
            <EyebrowObjetivo g={g} />
            <span className="flex shrink-0 items-center gap-1.5">
              <ChipAmbicion ambicion={g.ambicion} />
              <ChipEsfuerzo horas={Number(g.esfuerzo_horas_mes)} />
            </span>
          </div>
          <h1 className="mt-1.5 font-display text-h1 font-bold leading-tight sm:text-display-l">{g.titulo}</h1>
          {g.version > 1 && (
            <p className="mt-1 text-caption text-muted-foreground tnum">{td('version', { n: g.version })}</p>
          )}

          {g.observacion && (
            <p className="mt-4 border-l-2 border-brote-sun pl-3 text-small leading-relaxed">
              <span className="font-semibold">{td('observacion')}: </span>
              {g.observacion}
            </p>
          )}
          {g.status === 'en_revision' && (
            <p className="mt-4 text-small leading-relaxed text-muted-foreground">{td('enRevision')}</p>
          )}
          {g.status === 'logrado_parcial' && (
            <p className="mt-4 text-small leading-relaxed text-muted-foreground">{td('aprobadoParcial')}</p>
          )}

          <section className="mt-7">
            <span className="eyebrow text-muted-foreground">{td('porque')}</span>
            <p className="mt-1.5 max-w-prose text-body leading-relaxed">{g.porque}</p>
          </section>

          {/* Antes · ahora · meta. "Ahora" solo existe si la empresa informó un
              número: no se infiere ni se estima. */}
          <section className="mt-7 border-y border-hairline py-5">
            <span className="eyebrow text-muted-foreground">{td('metrica')}</span>
            <p className="mt-1 text-small text-muted-foreground">{g.metrica}</p>
            <div className="mt-3 flex flex-wrap gap-x-10 gap-y-3">
              <Dato etiqueta={td('base')} valor={num(g.linea_base, g.unidad)} />
              {g.ultimo_valor != null && g.valor_final == null && (
                <Dato etiqueta={td('ahora')} valor={num(g.ultimo_valor, g.unidad)} destacado />
              )}
              {g.valor_final != null ? (
                <Dato etiqueta={td('final')} valor={num(g.valor_final, g.unidad)} destacado />
              ) : (
                <Dato etiqueta={td('meta')} valor={num(g.objetivo, g.unidad)} />
              )}
            </div>
            {avance != null && <ProgressBar value={avance} height={6} className="mt-4 max-w-sm" />}
          </section>

          <section className="mt-7">
            <span className="eyebrow text-muted-foreground">{td('comoMedir')}</span>
            <p className="mt-1.5 max-w-prose text-body leading-relaxed">{g.como_medir}</p>
          </section>

          {g.pasos.length > 0 && (
            <section className="mt-7">
              <div className="flex items-baseline justify-between gap-3">
                <span className="eyebrow text-muted-foreground">{td('pasos')}</span>
                <span className="text-caption text-muted-foreground tnum">
                  {td('pasosHechos', { n: hechos.length, total: g.pasos.length })}
                </span>
              </div>
              <ul className="mt-2">
                {g.pasos.map((paso, i) => {
                  const hecho = hechos.includes(i);
                  return (
                    <li key={i}>
                      <label
                        className={cn(
                          'flex items-start gap-3 border-b border-hairline py-3 text-body leading-relaxed',
                          puedeEditar ? 'cursor-pointer' : 'cursor-default',
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={hecho}
                          disabled={!puedeEditar}
                          onChange={() => void tildar(i)}
                          className="sr-only"
                        />
                        <span
                          aria-hidden
                          className={cn(
                            'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border transition-colors duration-150',
                            hecho ? 'border-primary bg-primary text-white' : 'border-border bg-surface',
                          )}
                        >
                          {hecho && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                        </span>
                        <span className={cn(hecho && 'text-muted-foreground line-through decoration-hairline')}>
                          {paso}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
              {puedeEditar && <p className="mt-2 text-caption text-muted-foreground">{td('pasosAyuda')}</p>}
            </section>
          )}

          <section className="mt-7 grid gap-6 sm:grid-cols-2">
            <div>
              <span className="eyebrow text-muted-foreground">{td('evidencia')}</span>
              <p className="mt-1.5 text-small leading-relaxed">{g.evidencia_requerida}</p>
            </div>
            {g.si_no_llegas && (
              <div>
                <span className="eyebrow text-muted-foreground">{td('siNoLlegas')}</span>
                <p className="mt-1.5 text-small leading-relaxed text-muted-foreground">{g.si_no_llegas}</p>
              </div>
            )}
          </section>

          {puedeEditar && (
            <section className="mt-9 border-t border-hairline pt-6">
              <h2 className="font-display text-h2 font-bold">{td('cerrar')}</h2>
              <p className="mt-1 max-w-prose text-small leading-relaxed text-muted-foreground">{td('cerrarAyuda')}</p>

              <div className="mt-4 max-w-sm space-y-3">
                <div>
                  <label htmlFor="valor-final" className="mb-1.5 block text-small font-medium">
                    {td('valorFinalLabel', { metrica: g.metrica, unidad: g.unidad })}
                  </label>
                  <Input
                    id="valor-final"
                    type="number"
                    inputMode="decimal"
                    className="tnum"
                    value={valorFinal}
                    onChange={(e) => setValorFinal(e.target.value)}
                  />
                </div>

                <input
                  ref={archivoRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  className="sr-only"
                  onChange={(e) => {
                    const archivo = e.target.files?.[0];
                    e.target.value = '';
                    if (archivo) void subir(archivo);
                  }}
                />
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <Button size="sm" variant="secondary" loading={subiendo} onClick={() => archivoRef.current?.click()}>
                    <Upload className="h-4 w-4" />
                    {td('subir')}
                  </Button>
                  {rutas.length > 0 && (
                    <span className="flex items-center gap-1.5 text-caption text-muted-foreground">
                      <Paperclip className="h-3.5 w-3.5" />
                      {td('archivos', { n: rutas.length })}
                    </span>
                  )}
                </div>

                <Button
                  className="rounded-pill"
                  loading={cerrando}
                  disabled={rutas.length === 0 || valorFinal === ''}
                  onClick={() => void cerrar()}
                >
                  {td('confirmarCierre')}
                </Button>
              </div>
            </section>
          )}
        </div>

        {/* ── La conversación ───────────────────────────────────────────── */}
        <aside className="lg:border-l lg:border-hairline lg:pl-8">
          {puedeEditar && (
            <section>
              <span className="eyebrow text-muted-foreground">{td('ajustar')}</span>
              <p className="mt-1 text-small leading-relaxed text-muted-foreground">{td('invitacion')}</p>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {ATAJOS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    aria-pressed={tipo === a}
                    onClick={() => elegirAtajo(a)}
                    className={cn(
                      'press rounded-pill border px-3 py-1.5 text-caption font-medium transition-colors duration-150',
                      tipo === a
                        ? 'border-primary bg-primary/12 text-primary'
                        : 'border-border bg-surface-2 text-muted-foreground hover:border-primary/40 hover:text-foreground',
                    )}
                  >
                    {td(`atajos.${a}`)}
                  </button>
                ))}
              </div>

              {/* El número al que SÍ llega es lo que decide si se ajusta la meta
                  o se estira el plazo (fase 2 §7.1). */}
              {tipo === 'no_llego' && (
                <div className="mt-3">
                  <label htmlFor="cuanto-si" className="mb-1.5 block text-small font-medium">
                    {td('cuantoSi')}
                  </label>
                  <Input
                    id="cuanto-si"
                    type="number"
                    inputMode="decimal"
                    className="tnum"
                    value={valorSi}
                    onChange={(e) => setValorSi(e.target.value)}
                  />
                </div>
              )}

              {tipo === 'ya_hecho' && (
                <div className="mt-3 space-y-2">
                  <p className="text-small leading-relaxed text-muted-foreground">{td('desdeCuando')}</p>
                  <label className="flex cursor-pointer items-center gap-2 text-small">
                    <input
                      type="checkbox"
                      checked={conEvidencia}
                      onChange={(e) => setConEvidencia(e.target.checked)}
                      className="h-4 w-4 accent-[rgb(var(--primary))]"
                    />
                    {td('tengoEvidencia')}
                  </label>
                </div>
              )}

              <Textarea
                aria-label={td('ajustar')}
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                placeholder={td('mensajePh')}
                className="mt-3 min-h-24 text-small"
              />
              <div className="mt-2 flex justify-end">
                <Button size="sm" className="rounded-pill" loading={enviando} onClick={() => void enviar()}>
                  {td('enviar')}
                </Button>
              </div>

              {respuesta && (
                <p
                  role="status"
                  className="mt-3 border-l-2 border-primary pl-3 text-small leading-relaxed motion-safe:animate-in motion-safe:fade-in-0"
                >
                  {respuesta}
                </p>
              )}
            </section>
          )}

          <section className={cn(puedeEditar && 'mt-9')}>
            <span className="eyebrow text-muted-foreground">{td('historial')}</span>
            {detalle.checkins.length === 0 ? (
              <p className="mt-2 text-small leading-relaxed text-muted-foreground">{td('sinHistorial')}</p>
            ) : (
              <ul className="mt-2 divide-y divide-hairline border-y border-hairline">
                {detalle.checkins.map((c) => (
                  <Entrada key={c.id} c={c} />
                ))}
              </ul>
            )}

            {detalle.historial.length > 1 && (
              <ul className="mt-3 space-y-1">
                {detalle.historial
                  .filter((v) => v.id !== g.id)
                  .map((v) => (
                    <li key={v.id}>
                      <Link
                        href={`/negocio/mejora/${v.id}`}
                        className="text-caption font-medium text-muted-foreground transition-colors duration-150 hover:text-primary"
                      >
                        <span className="link-underline">{td('verVersion', { n: v.version })}</span>
                      </Link>
                    </li>
                  ))}
              </ul>
            )}
          </section>

          {g.cerrado_at && (
            <p className="mt-6 text-caption text-muted-foreground">
              {td('cerradoEl', { fecha: f.dateTime(new Date(g.cerrado_at), { dateStyle: 'long' }) })}
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}

function Dato({ etiqueta, valor, destacado = false }: { etiqueta: string; valor: string; destacado?: boolean }) {
  return (
    <span className="block">
      <span className="eyebrow block text-muted-foreground">{etiqueta}</span>
      <span className={cn('mt-0.5 block font-display text-h2 font-bold tnum', destacado && 'text-primary')}>
        {valor}
      </span>
    </span>
  );
}

/** Lo que dijo la empresa y lo que se ajustó. En ese orden, siempre. */
function Entrada({ c }: { c: CheckinFila }) {
  const td = useTranslations('negocio.mejora.detalle');
  const f = useFormatter();
  const ajuste = c.respuesta_ia?.respuesta ?? null;

  return (
    <li className="py-3.5">
      <p className="eyebrow flex flex-wrap items-center gap-x-1.5 text-muted-foreground">
        {c.genero_version != null && (
          <>
            <span className="text-foreground">{td('version', { n: c.genero_version })}</span>
            <span aria-hidden>·</span>
          </>
        )}
        <span>{f.dateTime(new Date(c.created_at), { day: 'numeric', month: 'long' })}</span>
      </p>
      <p className="mt-1.5 text-small leading-relaxed">
        <span className="font-semibold">{td('dijiste')} </span>
        {c.mensaje}
      </p>
      {ajuste && (
        <p className="mt-1.5 text-small leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">{td('ajuste')} </span>
          {ajuste}
        </p>
      )}
    </li>
  );
}
