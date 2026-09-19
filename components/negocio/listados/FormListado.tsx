'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight, ImagePlus, Link2, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Select, Textarea } from '@/components/ui/input';
import { ProgressBar } from '@/components/ui/progress';
import { EditorAfirmaciones } from '@/components/negocio/listados/EditorAfirmaciones';
import { subirImagenListado } from '@/lib/api/mercado';
import { enviarListado, guardarImagenes, guardarListado, verificarDestino } from '@/lib/mercado/acciones';
import { CATEGORIAS } from '@/lib/mercado/categorias';
import { urlImagen } from '@/lib/mercado/imagenes';
import type { ErrorListado } from '@/lib/mercado/validador';
import { DOMAINS } from '@/lib/domains';
import { PROVINCES } from '@/lib/data/cities';
import type { AfirmacionFila, CertificacionFila, ListadoDetalle } from '@/lib/supabase/rows-mercado';
import { useToastStore } from '@/stores/toast';
import { cn } from '@/lib/utils/cn';

const PASOS = ['basicos', 'imagenes', 'destino', 'afirmaciones'] as const;

/**
 * El formulario de listado (fase 3 §5.1, 07 §4.6): básicos → imágenes →
 * destino → afirmaciones. El paso vive en la URL; los valores, en el servidor.
 * El listado se crea al terminar el primer paso, y de ahí en más cada paso se
 * guarda solo: nadie pierde lo cargado por cerrar una pestaña.
 *
 * "Cómodo, no policial": el formulario explica cada exigencia en el lugar
 * donde aparece, y el validador solo habla al enviar.
 */
export function FormListado({
  negocioId,
  listado,
  afirmaciones,
  disponibles,
  certs,
  verificacionFuerte,
  paso: pasoInicial,
}: {
  negocioId: string;
  listado: ListadoDetalle['listado'] | null;
  afirmaciones: AfirmacionFila[];
  disponibles: AfirmacionFila[];
  certs: CertificacionFila[];
  verificacionFuerte: boolean;
  paso: number;
}) {
  const t = useTranslations('mercado.form');
  const te = useTranslations('mercado.form.errores');
  const tc = useTranslations('mercado.categorias');
  const td = useTranslations('mercado.disponibilidad');
  const router = useRouter();
  const [paso, setPaso] = useState(listado ? Math.min(Math.max(pasoInicial, 0), 3) : 0);
  const [ocupado, setOcupado] = useState(false);
  const [errores, setErrores] = useState<ErrorListado[]>([]);

  // Paso 1
  const [tipo, setTipo] = useState<'producto' | 'servicio'>(listado?.tipo ?? 'producto');
  const [titulo, setTitulo] = useState(listado?.titulo ?? '');
  const [descripcion, setDescripcion] = useState(listado?.descripcion ?? '');
  const [categoria, setCategoria] = useState(listado?.categoria ?? '');
  const [dominios, setDominios] = useState<string[]>(listado?.dominios ?? []);
  const [precio, setPrecio] = useState(listado?.precio_referencia != null ? String(listado.precio_referencia) : '');
  // Paso 2
  const [imagenes, setImagenes] = useState<string[]>(listado?.imagenes ?? []);
  const [subiendo, setSubiendo] = useState(false);
  const archivo = useRef<HTMLInputElement>(null);
  // Paso 3
  const [url, setUrl] = useState(listado?.url_destino ?? '');
  const [urlEstado, setUrlEstado] = useState<'ok' | string | null>(null);
  const [probando, setProbando] = useState(false);
  const [disponibilidad, setDisponibilidad] = useState<'online' | 'local' | 'ambas'>(listado?.disponibilidad ?? 'online');
  const [zonas, setZonas] = useState<string[]>(listado?.zonas ?? []);

  const aviso = (codigo: string) =>
    useToastStore.getState().push({ variant: 'error', title: te.has(codigo) ? te(codigo) : te('error') });

  function ir(n: number, id = listado?.id) {
    setPaso(n);
    setErrores([]);
    if (id) router.replace(`/negocio/listados/${id}/editar?paso=${n + 1}`, { scroll: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function guardarBasicos(): Promise<string | null> {
    setOcupado(true);
    const r = await guardarListado(negocioId, listado?.id ?? null, {
      tipo,
      titulo,
      descripcion,
      categoria,
      dominios,
      precio_referencia: precio.trim() === '' ? null : Number(precio.replace(',', '.')),
    });
    setOcupado(false);
    if (!r.ok) {
      aviso(r.error);
      return null;
    }
    return r.id;
  }

  async function siguiente() {
    if (paso === 0) {
      const id = await guardarBasicos();
      if (!id) return;
      if (!listado) {
        // Recién creado: seguimos en la URL del listado, con el paso 2.
        router.replace(`/negocio/listados/${id}/editar?paso=2`);
        router.refresh();
        return;
      }
      ir(1);
    } else if (paso === 1) {
      ir(2);
    } else if (paso === 2) {
      setOcupado(true);
      const r = await guardarListado(negocioId, listado!.id, { url_destino: url, disponibilidad, zonas });
      setOcupado(false);
      if (!r.ok) return aviso(r.error);
      router.refresh();
      ir(3);
    }
  }

  async function subir(f: File) {
    if (!listado) return;
    setSubiendo(true);
    const r = await subirImagenListado(negocioId, listado.id, f);
    if (!r.ok) {
      setSubiendo(false);
      return aviso(r.error);
    }
    const nuevas = [...imagenes, r.ruta].slice(0, 4);
    const g = await guardarImagenes(listado.id, nuevas);
    setSubiendo(false);
    if (!g.ok) return aviso(g.error);
    setImagenes(nuevas);
  }

  async function reordenar(nuevas: string[]) {
    if (!listado) return;
    const previas = imagenes;
    setImagenes(nuevas);
    const g = await guardarImagenes(listado.id, nuevas);
    if (!g.ok) {
      setImagenes(previas);
      aviso(g.error);
    }
  }

  async function probar() {
    setProbando(true);
    setUrlEstado(null);
    const r = await verificarDestino(negocioId, url);
    setProbando(false);
    setUrlEstado(r.ok ? 'ok' : r.error);
  }

  async function enviar() {
    if (!listado) return;
    setOcupado(true);
    setErrores([]);
    const r = await enviarListado(listado.id);
    setOcupado(false);
    if (!r.ok) {
      if (r.errores) setErrores(r.errores);
      return aviso(r.error);
    }
    useToastStore.getState().push({ variant: 'success', title: r.status === 'publicado' ? t('publicado') : t('enviado') });
    router.push(`/negocio/listados/${listado.id}`);
    router.refresh();
  }

  const mensajeError = (e: ErrorListado) => {
    if (e.afirmacion !== undefined) return te('afirmacion_invalida');
    if (e.codigo === 'termino_sin_afirmacion') return te('termino_sin_afirmacion', { termino: (e.detalle ?? '').split('|')[0] ?? '' });
    if (e.codigo === 'texto_prohibido') return te('texto_prohibido', { termino: e.detalle ?? '' });
    return te.has(e.codigo) ? te(e.codigo) : te('error');
  };

  return (
    <div className="max-w-2xl">
      <header className="mb-5">
        <span className="eyebrow text-muted-foreground">{listado ? t('eyebrowEditar') : t('eyebrowNuevo')}</span>
        <h1 className="mt-1 font-display text-h1 font-bold">{listado?.titulo || t(`pasos.${PASOS[paso]}`)}</h1>
      </header>

      {/* Los pasos, con progreso. 0..1, nunca un porcentaje. */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="eyebrow text-muted-foreground tnum">{t('paso', { n: paso + 1 })}</span>
          <ol className="flex gap-3 text-caption">
            {PASOS.map((p, i) => (
              <li key={p}>
                <button
                  type="button"
                  disabled={!listado || i === paso}
                  onClick={() => ir(i)}
                  className={cn('transition-colors duration-150', i === paso ? 'font-semibold text-foreground' : 'text-muted-foreground enabled:hover:text-foreground')}
                >
                  {t(`pasos.${p}`)}
                </button>
              </li>
            ))}
          </ol>
        </div>
        <ProgressBar value={(paso + 1) / PASOS.length} height={4} />
      </div>

      <div key={paso} className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-right-2 motion-safe:duration-300">
        {paso === 0 && (
          <div className="space-y-4">
            <fieldset>
              <legend className="mb-1.5 text-small font-medium">{t('tipo')}</legend>
              <div className="flex gap-1.5">
                {(['producto', 'servicio'] as const).map((x) => (
                  <button
                    key={x}
                    type="button"
                    aria-pressed={tipo === x}
                    onClick={() => setTipo(x)}
                    className={cn(
                      'press rounded-pill border px-3.5 py-1.5 text-small font-medium transition-colors duration-150',
                      tipo === x ? 'border-primary bg-primary/12 text-primary' : 'border-border bg-surface-2 text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {t(x)}
                  </button>
                ))}
              </div>
            </fieldset>
            <Campo id="titulo" etiqueta={t('titulo')} ayuda={t('tituloAyuda')} contador={`${titulo.trim().length}/70`}>
              <Input id="titulo" value={titulo} maxLength={70} placeholder={t('tituloPh')} onChange={(e) => setTitulo(e.target.value)} />
            </Campo>
            <Campo id="descripcion" etiqueta={t('descripcion')} ayuda={t('descripcionAyuda')} contador={`${descripcion.trim().length}/2000`}>
              <Textarea id="descripcion" value={descripcion} maxLength={2000} className="min-h-32" placeholder={t('descripcionPh')} onChange={(e) => setDescripcion(e.target.value)} />
            </Campo>
            <Campo id="categoria" etiqueta={t('categoria')}>
              <Select id="categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                <option value="" disabled>
                  {t('elegir')}
                </option>
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>
                    {tc(c)}
                  </option>
                ))}
              </Select>
            </Campo>
            <fieldset>
              <legend className="mb-1 text-small font-medium">{t('dominios')}</legend>
              <p className="mb-2 text-caption text-muted-foreground">{t('dominiosAyuda')}</p>
              <div className="flex flex-wrap gap-1.5">
                {DOMAINS.map((d) => {
                  const on = dominios.includes(d.slug);
                  return (
                    <button
                      key={d.slug}
                      type="button"
                      aria-pressed={on}
                      disabled={!on && dominios.length >= 3}
                      onClick={() => setDominios(on ? dominios.filter((x) => x !== d.slug) : [...dominios, d.slug])}
                      className={cn(
                        'press inline-flex items-center gap-1.5 rounded-pill border px-3 py-1 text-caption font-medium transition-colors duration-150 disabled:opacity-40',
                        on ? 'border-transparent text-white' : 'border-border bg-surface-2 text-muted-foreground hover:text-foreground',
                      )}
                      style={on ? { backgroundColor: d.color } : undefined}
                    >
                      {!on && <span aria-hidden className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />}
                      {d.name_es}
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <Campo id="precio" etiqueta={t('precio')} ayuda={t('precioAyuda')}>
              <div className="flex items-center gap-2">
                <span className="text-small text-muted-foreground">$</span>
                <Input id="precio" inputMode="decimal" className="max-w-[12rem] tnum" value={precio} onChange={(e) => setPrecio(e.target.value.replace(/[^\d.,]/g, ''))} />
              </div>
            </Campo>
          </div>
        )}

        {paso === 1 && (
          <section>
            <span className="eyebrow text-muted-foreground">{t('imagenesTitulo')}</span>
            <p className="mt-1 text-small text-muted-foreground">{t('imagenesAyuda')}</p>
            <input
              ref={archivo}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                if (f) void subir(f);
              }}
            />
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {imagenes.map((ruta, i) => (
                <li key={ruta} className="group relative aspect-square overflow-hidden rounded-card bg-surface-2">
                  <Image src={urlImagen(ruta) ?? ''} alt="" fill sizes="(max-width: 640px) 50vw, 160px" className="object-cover" />
                  {i === 0 && (
                    <span className="absolute left-2 top-2 rounded-pill bg-brote-ink/80 px-2 py-0.5 text-[11px] font-semibold text-brote-cream">{t('principal')}</span>
                  )}
                  <span className="absolute inset-x-2 bottom-2 flex justify-between">
                    <span className="flex gap-1">
                      <BotonImagen disabled={i === 0} label={t('antes')} onClick={() => void reordenar(mover(imagenes, i, -1))}>
                        <ChevronLeft className="h-4 w-4" />
                      </BotonImagen>
                      <BotonImagen disabled={i === imagenes.length - 1} label={t('despues')} onClick={() => void reordenar(mover(imagenes, i, 1))}>
                        <ChevronRight className="h-4 w-4" />
                      </BotonImagen>
                    </span>
                    <BotonImagen label={t('quitar')} onClick={() => void reordenar(imagenes.filter((x) => x !== ruta))}>
                      <X className="h-4 w-4" />
                    </BotonImagen>
                  </span>
                </li>
              ))}
              {imagenes.length < 4 && (
                <li>
                  <button
                    type="button"
                    onClick={() => archivo.current?.click()}
                    disabled={subiendo}
                    className="press flex aspect-square w-full flex-col items-center justify-center gap-1.5 rounded-card border border-dashed border-border bg-surface text-caption font-medium text-muted-foreground transition-colors duration-150 hover:border-primary/50 hover:text-foreground"
                  >
                    <ImagePlus className="h-5 w-5" />
                    {subiendo ? t('subiendo') : t('subirImagen')}
                  </button>
                </li>
              )}
            </ul>
          </section>
        )}

        {paso === 2 && (
          <div className="space-y-4">
            <Campo id="url" etiqueta={t('url')} ayuda={t('urlAyuda')}>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id="url"
                  value={url}
                  placeholder={t('urlPh')}
                  inputMode="url"
                  className="flex-1"
                  invalid={!!urlEstado && urlEstado !== 'ok'}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setUrlEstado(null);
                  }}
                />
                <Button variant="secondary" loading={probando} disabled={!url.trim()} onClick={() => void probar()}>
                  <Link2 className="h-4 w-4" />
                  {probando ? t('verificando') : t('verificar')}
                </Button>
              </div>
              {urlEstado === 'ok' && (
                <p role="status" className="mt-1.5 inline-flex items-center gap-1 text-caption text-primary">
                  <Check className="h-3.5 w-3.5" />
                  {t('urlOk')}
                </p>
              )}
              {urlEstado && urlEstado !== 'ok' && (
                <p role="status" className="mt-1.5 text-caption text-brote-coral">
                  {t.has(`urlEstados.${urlEstado}`) ? t(`urlEstados.${urlEstado}`) : te('error')}
                </p>
              )}
            </Campo>
            <fieldset>
              <legend className="mb-1.5 text-small font-medium">{t('disponibilidad')}</legend>
              <div className="flex flex-wrap gap-1.5">
                {(['online', 'local', 'ambas'] as const).map((x) => (
                  <button
                    key={x}
                    type="button"
                    aria-pressed={disponibilidad === x}
                    onClick={() => setDisponibilidad(x)}
                    className={cn(
                      'press rounded-pill border px-3.5 py-1.5 text-small font-medium transition-colors duration-150',
                      disponibilidad === x ? 'border-primary bg-primary/12 text-primary' : 'border-border bg-surface-2 text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {td(x)}
                  </button>
                ))}
              </div>
            </fieldset>
            {disponibilidad !== 'online' && (
              <fieldset>
                <legend className="mb-1 text-small font-medium">{t('zonas')}</legend>
                <p className="mb-2 text-caption text-muted-foreground">{t('zonasAyuda')}</p>
                <div className="flex flex-wrap gap-1.5">
                  {PROVINCES.map((p) => {
                    const on = zonas.includes(p);
                    return (
                      <button
                        key={p}
                        type="button"
                        aria-pressed={on}
                        onClick={() => setZonas(on ? zonas.filter((x) => x !== p) : [...zonas, p])}
                        className={cn(
                          'press rounded-pill border px-3 py-1 text-caption font-medium transition-colors duration-150',
                          on ? 'border-primary bg-primary/12 text-primary' : 'border-border bg-surface-2 text-muted-foreground hover:text-foreground',
                        )}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            )}
          </div>
        )}

        {paso === 3 && listado && (
          <EditorAfirmaciones
            negocioId={negocioId}
            listingId={listado.id}
            categoria={listado.categoria}
            cargadas={afirmaciones}
            disponibles={disponibles}
            certs={certs}
            verificacionFuerte={verificacionFuerte}
            onCambio={() => router.refresh()}
          />
        )}
      </div>

      {errores.length > 0 && (
        <div role="alert" className="mt-6 border-l-2 border-brote-coral pl-3">
          <p className="text-small font-semibold">{te('validacion')}</p>
          <ul className="mt-1 space-y-0.5 text-small leading-relaxed text-muted-foreground">
            {[...new Map(errores.map((e) => [mensajeError(e), e])).keys()].map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-7 flex items-center justify-between gap-3 border-t border-hairline pt-5">
        {paso > 0 ? (
          <Button variant="ghost" size="sm" disabled={ocupado} onClick={() => ir(paso - 1)}>
            <ArrowLeft className="h-4 w-4" />
            {t('atras')}
          </Button>
        ) : (
          <span />
        )}
        {paso < 3 ? (
          <Button className="rounded-pill" loading={ocupado} onClick={() => void siguiente()}>
            {t('siguiente')}
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button className="rounded-pill" loading={ocupado} disabled={afirmaciones.length === 0} onClick={() => void enviar()}>
            <Send className="h-4 w-4" />
            {ocupado ? t('enviando') : t('enviar')}
          </Button>
        )}
      </div>
    </div>
  );
}

function mover<T>(xs: T[], i: number, d: number): T[] {
  const j = i + d;
  if (j < 0 || j >= xs.length) return xs;
  const out = [...xs];
  [out[i], out[j]] = [out[j]!, out[i]!];
  return out;
}

function BotonImagen({ children, label, onClick, disabled }: { children: React.ReactNode; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="press flex h-7 w-7 items-center justify-center rounded-full bg-brote-ink/75 text-brote-cream transition-opacity duration-150 hover:bg-brote-ink disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function Campo({ id, etiqueta, ayuda, contador, children }: { id: string; etiqueta: string; ayuda?: string; contador?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 flex items-baseline justify-between gap-2 text-small font-medium">
        {etiqueta}
        {contador && <span className="text-caption font-normal text-muted-foreground tnum">{contador}</span>}
      </label>
      {children}
      {ayuda && <p className="mt-1 text-caption leading-relaxed text-muted-foreground">{ayuda}</p>}
    </div>
  );
}
