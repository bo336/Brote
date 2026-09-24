'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft, ArrowRight, Check, ChevronDown, Globe, ImagePlus, Instagram, Loader2, MessageCircle, Star, Trash2 } from 'lucide-react';
import { EditorAfirmaciones } from '@/components/negocio/listados/EditorAfirmaciones';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/input';
import { subirImagenListado } from '@/lib/api/mercado';
import { enviarListado, guardarImagenes, guardarListado, verificarDestino } from '@/lib/mercado/acciones';
import { CATEGORIAS, CONDICIONES, SUBCATEGORIAS, esCategoria, type Condicion, type Contacto } from '@/lib/mercado/categorias';
import { urlImagen } from '@/lib/mercado/imagenes';
import { MAX_IMAGENES, MIN_DESCRIPCION_VENDEDOR, type ErrorListado } from '@/lib/mercado/validador';
import { DOMAINS } from '@/lib/domains';
import { PROVINCES } from '@/lib/data/cities';
import type { AfirmacionFila, CertificacionFila, ListadoDetalle } from '@/lib/supabase/rows-mercado';
import { useToastStore } from '@/stores/toast';
import { cn } from '@/lib/utils/cn';

type Canales = NonNullable<ListadoDetalle['negocio']>;

/**
 * El formulario de un producto para una tienda (Mercado v2): una sola página,
 * en el orden en que alguien piensa su publicación —las fotos, qué es, cuánto
 * sale, cómo llega, por dónde lo contactan— y la afirmación ambiental al
 * final, opcional.
 *
 * - Se publica EN EL ACTO si el validador no marca nada y no hay afirmaciones
 *   esperando revisión (las que sí, van a la cola y el producto espera).
 * - Un producto publicado se EDITA EN VIVO: el precio, las fotos o el texto
 *   cambian sin sacarlo del Mercado, con el mismo control que al publicarlo.
 * - Las fotos necesitan que el producto exista (van en su carpeta): la
 *   primera que se sube lo guarda como borrador.
 */
export function FormProducto({
  negocioId,
  listado,
  afirmaciones,
  disponibles,
  certs,
  verificacionFuerte,
  canales,
}: {
  negocioId: string;
  listado: ListadoDetalle['listado'] | null;
  afirmaciones: AfirmacionFila[];
  disponibles: AfirmacionFila[];
  certs: CertificacionFila[];
  verificacionFuerte: boolean;
  canales: Canales;
}) {
  const t = useTranslations('negocio.vendedor.producto');
  const te = useTranslations('mercado.form.errores');
  const tc = useTranslations('mercado.categorias');
  const tm = useTranslations('mercado');
  const tco = useTranslations('mercado.condicion');
  const router = useRouter();
  const archivo = useRef<HTMLInputElement>(null);

  const [id, setId] = useState<string | null>(listado?.id ?? null);
  const status = listado?.status ?? 'draft';
  const publicado = status === 'publicado';
  const [tipo, setTipo] = useState<'producto' | 'servicio'>(listado?.tipo ?? 'producto');
  const [titulo, setTitulo] = useState(listado?.titulo ?? '');
  const [categoria, setCategoria] = useState(listado?.categoria ?? '');
  const [sub, setSub] = useState(listado?.subcategoria ?? '');
  const [condicion, setCondicion] = useState<Condicion>(listado?.condicion ?? 'nuevo');
  const [precio, setPrecio] = useState(listado?.precio_referencia != null ? String(Math.round(Number(listado.precio_referencia))) : '');
  const [descripcion, setDescripcion] = useState(listado?.descripcion ?? '');
  const [disponibilidad, setDisponibilidad] = useState<'online' | 'local' | 'ambas'>(listado?.disponibilidad ?? 'online');
  const [zonas, setZonas] = useState<string[]>(listado?.zonas ?? []);
  const disponiblesCanal: Contacto[] = [
    ...(canales.whatsapp ? (['whatsapp'] as const) : []),
    ...(canales.instagram ? (['instagram'] as const) : []),
    'web',
  ];
  const [contacto, setContacto] = useState<Contacto>(listado?.contacto ?? canales.contacto_preferido ?? disponiblesCanal[0]!);
  const [url, setUrl] = useState(listado?.url_destino ?? '');
  const [urlEstado, setUrlEstado] = useState<'ok' | string | null>(null);
  const [probando, setProbando] = useState(false);
  const [dominios, setDominios] = useState<string[]>(listado?.dominios ?? []);
  const [imagenes, setImagenes] = useState<string[]>(listado?.imagenes ?? []);
  const [subiendo, setSubiendo] = useState(false);
  const [ocupado, setOcupado] = useState<'guardar' | 'publicar' | null>(null);
  const [errores, setErrores] = useState<ErrorListado[]>([]);
  const [verAfirmaciones, setVerAfirmaciones] = useState(afirmaciones.length > 0);

  const aviso = (codigo: string, detalle?: string) =>
    useToastStore.getState().push({
      variant: 'error',
      title:
        codigo === 'termino_sin_afirmacion'
          ? te('termino_sin_afirmacion', { termino: (detalle ?? '').split('|')[0] ?? '' })
          : codigo === 'texto_prohibido'
            ? te('texto_prohibido', { termino: detalle ?? '' })
            : te.has(codigo)
              ? te(codigo)
              : te('error'),
    });

  function datos() {
    return {
      tipo,
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      categoria,
      subcategoria: sub || null,
      condicion,
      precio_referencia: precio.trim() === '' ? null : Number(precio.replace(/\./g, '').replace(',', '.')),
      disponibilidad,
      zonas,
      contacto,
      url_destino: contacto === 'web' ? url : listado?.url_destino ?? '',
      dominios,
    };
  }

  /** El producto existe en la base (hace falta para subir fotos y afirmaciones). */
  async function asegurar(): Promise<string | null> {
    if (id) return id;
    if (titulo.trim().length < 3 || !esCategoria(categoria)) {
      useToastStore.getState().push({ variant: 'error', title: t('primeroTitulo') });
      return null;
    }
    const r = await guardarListado(negocioId, null, datos());
    if (!r.ok) {
      aviso(r.error);
      return null;
    }
    setId(r.id);
    // Sin remontar el formulario: lo escrito sigue ahí.
    window.history.replaceState(null, '', `/negocio/listados/${r.id}/editar`);
    return r.id;
  }

  async function subir(archivos: FileList | null) {
    if (!archivos?.length) return;
    const lid = await asegurar();
    if (!lid) return;
    setSubiendo(true);
    let nuevas = [...imagenes];
    for (const f of Array.from(archivos).slice(0, MAX_IMAGENES - nuevas.length)) {
      const r = await subirImagenListado(negocioId, lid, f);
      if (!r.ok) {
        aviso(r.error);
        continue;
      }
      nuevas = [...nuevas, r.ruta];
    }
    const g = await guardarImagenes(lid, nuevas);
    setSubiendo(false);
    if (archivo.current) archivo.current.value = '';
    if (!g.ok) return aviso(g.error);
    setImagenes(nuevas);
  }

  async function ordenar(nuevas: string[]) {
    const previas = imagenes;
    setImagenes(nuevas);
    if (!id) return;
    const g = await guardarImagenes(id, nuevas);
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

  async function guardar(): Promise<string | null> {
    const lid = id ?? (await asegurar());
    if (!lid) return null;
    const r = await guardarListado(negocioId, lid, datos());
    if (!r.ok) {
      if (r.errores) setErrores(r.errores);
      aviso(r.error, r.errores?.[0]?.detalle);
      return null;
    }
    return lid;
  }

  async function soloGuardar() {
    setOcupado('guardar');
    setErrores([]);
    const lid = await guardar();
    setOcupado(null);
    if (!lid) return;
    useToastStore.getState().push({ variant: 'success', title: publicado ? t('cambiosPublicados') : t('borradorGuardado') });
    router.refresh();
  }

  async function publicar() {
    setOcupado('publicar');
    setErrores([]);
    const lid = await guardar();
    if (!lid) return setOcupado(null);
    const r = await enviarListado(lid);
    setOcupado(null);
    if (!r.ok) {
      if (r.errores) {
        setErrores(r.errores);
        document.getElementById('errores-producto')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return aviso(r.error, r.errores?.[0]?.detalle);
    }
    useToastStore.getState().push({ variant: 'success', title: r.status === 'publicado' ? t('publicadoToast') : t('enRevisionToast') });
    router.push(`/negocio/listados/${lid}`);
    router.refresh();
  }

  const mensajeError = (e: ErrorListado) => {
    if (e.afirmacion !== undefined) return te('afirmacion_invalida');
    if (e.codigo === 'termino_sin_afirmacion') return te('termino_sin_afirmacion', { termino: (e.detalle ?? '').split('|')[0] ?? '' });
    if (e.codigo === 'texto_prohibido') return te('texto_prohibido', { termino: e.detalle ?? '' });
    return te.has(e.codigo) ? te(e.codigo) : te('error');
  };

  const subcats = esCategoria(categoria) ? SUBCATEGORIAS[categoria] : [];
  const largoDesc = descripcion.trim().length;

  return (
    <div className="max-w-2xl pb-28 sm:pb-8">
      <header>
        <span className="eyebrow text-muted-foreground">{listado ? (publicado ? t('eyebrowEnVivo') : t('eyebrowEditar')) : t('eyebrowNuevo')}</span>
        <h1 className="mt-1 font-display text-h1 font-bold">{listado?.titulo || t('tituloNuevo')}</h1>
        {publicado && <p className="mt-1 text-small text-muted-foreground">{t('enVivoAyuda')}</p>}
      </header>

      {errores.length > 0 && (
        <div id="errores-producto" role="alert" className="mt-5 rounded-card border border-brote-coral/40 bg-brote-coral/10 p-4 text-small">
          <p className="font-semibold">{t('corregir')}</p>
          <ul className="mt-1.5 list-disc space-y-0.5 pl-5">
            {errores.map((e, i) => (
              <li key={i}>{mensajeError(e)}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Fotos */}
      <Seccion titulo={t('fotos')} ayuda={t('fotosAyuda', { n: MAX_IMAGENES })}>
        <input ref={archivo} type="file" accept="image/*" multiple className="sr-only" onChange={(e) => subir(e.target.files)} />
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {imagenes.map((ruta, i) => {
            const src = urlImagen(ruta);
            return (
              <li key={ruta} className="group relative aspect-square overflow-hidden rounded-[14px] bg-surface-2">
                {src && <Image src={src} alt="" fill sizes="160px" className="object-cover" />}
                {i === 0 && (
                  <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-pill bg-background/90 px-2 py-0.5 text-[10px] font-bold">
                    <Star className="h-3 w-3" />
                    {t('portada')}
                  </span>
                )}
                <div className="absolute inset-x-1.5 bottom-1.5 flex justify-between">
                  <div className="flex gap-1">
                    <BotonFoto disabled={i === 0} etiqueta={t('moverIzq')} onClick={() => ordenar(mover(imagenes, i, -1))}>
                      <ArrowLeft className="h-3.5 w-3.5" />
                    </BotonFoto>
                    <BotonFoto disabled={i === imagenes.length - 1} etiqueta={t('moverDer')} onClick={() => ordenar(mover(imagenes, i, 1))}>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </BotonFoto>
                  </div>
                  <BotonFoto
                    disabled={publicado && imagenes.length === 1}
                    etiqueta={t('quitarFoto')}
                    onClick={() => ordenar(imagenes.filter((_, j) => j !== i))}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </BotonFoto>
                </div>
              </li>
            );
          })}
          {imagenes.length < MAX_IMAGENES && (
            <li>
              <button
                type="button"
                onClick={() => archivo.current?.click()}
                disabled={subiendo}
                className="press flex aspect-square w-full flex-col items-center justify-center gap-1.5 rounded-[14px] border-2 border-dashed border-border bg-surface text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
              >
                {subiendo ? <Loader2 className="h-6 w-6 animate-spin" /> : <ImagePlus className="h-6 w-6" />}
                <span className="text-caption font-semibold">{subiendo ? t('subiendo') : t('agregarFoto')}</span>
              </button>
            </li>
          )}
        </ul>
      </Seccion>

      {/* Qué es */}
      <Seccion titulo={t('queEs')}>
        <div className="flex gap-1.5">
          {(['producto', 'servicio'] as const).map((x) => (
            <Chip key={x} activo={tipo === x} onClick={() => setTipo(x)}>
              {t(x)}
            </Chip>
          ))}
        </div>
        <Field label={t('titulo')} htmlFor="p-titulo" help={`${t('tituloAyuda')} · ${titulo.trim().length}/70`}>
          <Input id="p-titulo" value={titulo} maxLength={70} onChange={(e) => setTitulo(e.target.value)} placeholder={t('tituloPh')} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('categoria')} htmlFor="p-categoria">
            <Select
              id="p-categoria"
              value={categoria}
              onChange={(e) => {
                setCategoria(e.target.value);
                setSub('');
              }}
            >
              <option value="" disabled>
                {t('elegir')}
              </option>
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>
                  {tc(c)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('subcategoria')} htmlFor="p-sub">
            <Select id="p-sub" value={sub} onChange={(e) => setSub(e.target.value)} disabled={!subcats.length}>
              <option value="">{t('sinSubcategoria')}</option>
              {subcats.map((s) => (
                <option key={s} value={s}>
                  {tm(`subcategorias.${categoria}.${s}`)}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <fieldset className="min-w-0">
          <legend className="mb-1.5 text-small font-medium">{t('condicion')}</legend>
          <div className="flex flex-wrap gap-1.5">
            {CONDICIONES.map((c) => (
              <Chip key={c} activo={condicion === c} onClick={() => setCondicion(c)}>
                {tco(c)}
              </Chip>
            ))}
          </div>
        </fieldset>
      </Seccion>

      {/* Precio de referencia */}
      <Seccion titulo={t('precio')} ayuda={t('precioAyuda')}>
        <div className="relative max-w-xs">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
          <Input
            inputMode="numeric"
            value={precio}
            onChange={(e) => setPrecio(e.target.value.replace(/[^\d.,]/g, '').slice(0, 12))}
            placeholder={tipo === 'servicio' ? t('precioOpcional') : '0'}
            className="pl-8 font-display text-h3 font-bold tnum"
            aria-label={t('precio')}
          />
        </div>
      </Seccion>

      {/* Descripción */}
      <Seccion titulo={t('descripcion')} ayuda={t('descripcionAyuda')}>
        <Textarea
          value={descripcion}
          maxLength={4000}
          onChange={(e) => setDescripcion(e.target.value)}
          className="min-h-36"
          placeholder={t('descripcionPh')}
          aria-label={t('descripcion')}
        />
        <p className={cn('text-caption', largoDesc > 0 && largoDesc < MIN_DESCRIPCION_VENDEDOR ? 'text-brote-coral' : 'text-muted-foreground')}>
          {largoDesc < MIN_DESCRIPCION_VENDEDOR ? t('faltanCaracteres', { n: MIN_DESCRIPCION_VENDEDOR - largoDesc }) : t('caracteres', { n: largoDesc })}
        </p>
      </Seccion>

      {/* Cómo se consigue */}
      <Seccion titulo={t('entrega')}>
        <div className="flex flex-wrap gap-1.5">
          {(['online', 'local', 'ambas'] as const).map((d) => (
            <Chip key={d} activo={disponibilidad === d} onClick={() => setDisponibilidad(d)}>
              {t(`disponibilidad.${d}`)}
            </Chip>
          ))}
        </div>
        {disponibilidad !== 'local' && (
          <details className="rounded-button border border-border bg-surface">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3.5 py-3 text-small [&::-webkit-details-marker]:hidden">
              <span>{zonas.length ? t('zonasN', { n: zonas.length }) : t('todoElPais')}</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </summary>
            <div className="flex flex-wrap gap-1.5 border-t border-hairline p-3">
              {PROVINCES.map((p) => {
                const on = zonas.includes(p);
                return (
                  <Chip key={p} activo={on} pequeno onClick={() => setZonas((z) => (on ? z.filter((x) => x !== p) : [...z, p]))}>
                    {p}
                  </Chip>
                );
              })}
            </div>
          </details>
        )}
        {disponibilidad !== 'online' && !canales.provincia && <p className="text-caption text-muted-foreground">{t('sinProvincia')}</p>}
      </Seccion>

      {/* Por dónde te contactan */}
      <Seccion titulo={t('contacto')} ayuda={t('contactoAyuda')}>
        <div className="grid gap-2 sm:grid-cols-3">
          {disponiblesCanal.map((c) => {
            const Icono = c === 'whatsapp' ? MessageCircle : c === 'instagram' ? Instagram : Globe;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setContacto(c)}
                aria-pressed={contacto === c}
                className={cn(
                  'press flex items-center gap-2 rounded-button border px-3 py-2.5 text-small transition-colors duration-150',
                  contacto === c ? 'border-primary bg-primary/10 font-semibold' : 'border-border bg-surface hover:bg-surface-2',
                )}
              >
                <Icono className="h-4 w-4" />
                {t(`canal.${c}`)}
                {contacto === c && <Check className="ml-auto h-4 w-4 text-primary" />}
              </button>
            );
          })}
        </div>
        {contacto === 'web' && (
          <div>
            <div className="flex gap-2">
              <Input
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setUrlEstado(null);
                }}
                inputMode="url"
                autoCapitalize="none"
                placeholder={t('urlPh')}
                aria-label={t('url')}
              />
              <Button type="button" variant="secondary" onClick={probar} loading={probando} disabled={!url.trim()}>
                {t('probar')}
              </Button>
            </div>
            {urlEstado && (
              <p className={cn('mt-1.5 text-caption', urlEstado === 'ok' ? 'text-brote-green' : 'text-brote-coral')}>
                {urlEstado === 'ok' ? t('urlOk') : te.has(urlEstado) ? te(urlEstado) : te('url_invalida')}
              </p>
            )}
          </div>
        )}
      </Seccion>

      {/* Temas de Brote */}
      <Seccion titulo={t('temas')} ayuda={t('temasAyuda')}>
        <div className="flex flex-wrap gap-1.5">
          {DOMAINS.map((d) => {
            const on = dominios.includes(d.slug);
            return (
              <Chip
                key={d.slug}
                activo={on}
                pequeno
                onClick={() => setDominios((xs) => (on ? xs.filter((x) => x !== d.slug) : xs.length >= 3 ? xs : [...xs, d.slug]))}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} aria-hidden />
                {d.name_es}
              </Chip>
            );
          })}
        </div>
      </Seccion>

      {/* Afirmaciones ambientales: opcionales */}
      <section className="mt-8 rounded-card border border-border bg-surface">
        <button
          type="button"
          onClick={() => setVerAfirmaciones((v) => !v)}
          aria-expanded={verAfirmaciones}
          className="flex w-full items-start justify-between gap-3 p-4 text-left"
        >
          <span>
            <span className="block text-small font-semibold">{t('afirmaciones')}</span>
            <span className="mt-0.5 block text-caption leading-relaxed text-muted-foreground">{t('afirmacionesAyuda')}</span>
          </span>
          <ChevronDown className={cn('mt-0.5 h-5 w-5 shrink-0 transition-transform duration-200', verAfirmaciones && 'rotate-180')} />
        </button>
        {verAfirmaciones && (
          <div className="border-t border-hairline p-4">
            {publicado ? (
              <ul className="space-y-1 text-small">
                {afirmaciones.length === 0 && <li className="text-muted-foreground">{t('sinAfirmaciones')}</li>}
                {afirmaciones.map((a) => (
                  <li key={a.id}>· {a.enunciado || a.alcance}</li>
                ))}
              </ul>
            ) : id ? (
              <EditorAfirmaciones
                negocioId={negocioId}
                listingId={id}
                categoria={categoria}
                cargadas={afirmaciones}
                disponibles={disponibles}
                certs={certs}
                verificacionFuerte={verificacionFuerte}
                onCambio={() => router.refresh()}
              />
            ) : (
              <div className="text-small text-muted-foreground">
                <p>{t('afirmacionesPrimero')}</p>
                <Button type="button" variant="secondary" size="sm" className="mt-3" onClick={() => void asegurar()}>
                  {t('guardarParaSeguir')}
                </Button>
              </div>
            )}
            {publicado && <p className="mt-3 text-caption text-muted-foreground">{t('afirmacionesEnVivo')}</p>}
          </div>
        )}
      </section>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-lg sm:static sm:mt-8 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
        <div className="mx-auto flex max-w-2xl gap-2">
          {publicado ? (
            <Button onClick={soloGuardar} loading={ocupado === 'guardar'} disabled={!!ocupado} size="lg" block className="rounded-pill">
              {t('guardarCambios')}
            </Button>
          ) : (
            <>
              <Button variant="secondary" onClick={soloGuardar} loading={ocupado === 'guardar'} disabled={!!ocupado} size="lg" className="shrink-0 whitespace-nowrap rounded-pill px-4">
                {t('guardarBorrador')}
              </Button>
              <Button onClick={publicar} loading={ocupado === 'publicar'} disabled={!!ocupado} size="lg" block className="rounded-pill">
                {status === 'despublicado' ? t('republicar') : t('publicar')}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function mover<T>(xs: T[], i: number, d: -1 | 1): T[] {
  const j = i + d;
  if (j < 0 || j >= xs.length) return xs;
  const out = [...xs];
  [out[i], out[j]] = [out[j]!, out[i]!];
  return out;
}

function Seccion({ titulo, ayuda, children }: { titulo: string; ayuda?: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-body font-semibold">{titulo}</h2>
      {ayuda && <p className="mt-0.5 text-caption leading-relaxed text-muted-foreground">{ayuda}</p>}
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

function Chip({ activo, onClick, pequeno = false, children }: { activo: boolean; onClick: () => void; pequeno?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={cn(
        'press inline-flex items-center gap-1.5 rounded-pill border font-medium transition-colors duration-150',
        pequeno ? 'h-8 px-3 text-caption' : 'h-9 px-3.5 text-small',
        activo ? 'border-primary bg-primary/10 text-foreground' : 'border-border bg-surface text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}

function BotonFoto({ disabled, etiqueta, onClick, children }: { disabled?: boolean; etiqueta: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={etiqueta}
      title={etiqueta}
      className="flex h-7 w-7 items-center justify-center rounded-full bg-background/90 shadow-soft transition-opacity disabled:opacity-0"
    >
      {children}
    </button>
  );
}
