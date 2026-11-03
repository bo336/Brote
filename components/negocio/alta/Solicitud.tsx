'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFormatter, useTranslations } from 'next-intl';
import { ArrowRight, Check, Clock, FileSearch, Loader2, MessageCircleWarning, Rocket, ShieldAlert } from 'lucide-react';
import { Field, Input, Select, Textarea } from '@/components/ui/input';
import { mandarSolicitud, type DatosSolicitud } from '@/lib/negocio/acciones';
import { RUBROS, TAMANOS, claveTamano } from '@/lib/negocio/catalogo';
import { limpiarCuit, normalizarInstagram, normalizarSitio } from '@/lib/negocio/normalizar';
import { normalizarWhatsappAR } from '@/lib/negocio/vendedor';
import { PROVINCES } from '@/lib/data/cities';
import type { SolicitudNegocio } from '@/lib/supabase/rows-negocio';
import { cn } from '@/lib/utils/cn';

type Objetivo = 'vender' | 'mejorar';
const ROLES = ['dueno', 'socio', 'empleado', 'otro'] as const;
const DESC_MIN = 30;
const DESC_MAX = 800;

/**
 * El primer paso de cualquier negocio, sea tienda o empresa que mejora (0143):
 * un formulario corto con lo necesario para ver que es real. Hasta que el equipo
 * lo aprueba no se arma nada: ni la tienda, ni el plan.
 */
export function FormSolicitud({
  objetivo,
  negocioId,
  inicial,
}: {
  objetivo: Objetivo;
  /** Al corregir una solicitud ya enviada. */
  negocioId?: string;
  inicial?: SolicitudNegocio['datos'];
}) {
  const t = useTranslations('negocio.solicitud');
  const tn = useTranslations('negocio');
  const router = useRouter();
  const [v, setV] = useState<DatosSolicitud>({
    nombre_comercial: inicial?.nombre_comercial ?? '',
    tipo_vendedor: inicial?.tipo_vendedor ?? 'persona',
    rubro: inicial?.rubro ?? '',
    tamano: inicial?.tamano ?? '2-10',
    provincia: inicial?.provincia ?? '',
    ciudad: inicial?.ciudad ?? '',
    descripcion: inicial?.descripcion ?? '',
    instagram: inicial?.instagram ? `@${inicial.instagram}` : '',
    sitio_web: inicial?.sitio_web ?? '',
    whatsapp: inicial?.whatsapp ?? '',
    cuit: inicial?.cuit ?? '',
    rol: inicial?.rol ?? '',
    extra: inicial?.extra ?? '',
    acepta: false,
  });
  const [mal, setMal] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const set = (k: keyof DatosSolicitud) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setV((x) => ({ ...x, [k]: e.target.value }));

  function validar(): Set<string> {
    const e = new Set<string>();
    if (v.nombre_comercial.trim().length < 2) e.add('nombre_comercial');
    if (!v.rubro) e.add('rubro');
    if (!v.provincia) e.add('provincia');
    if (v.descripcion.trim().length < DESC_MIN) e.add('descripcion');
    if (v.instagram.trim() && !normalizarInstagram(v.instagram)) e.add('instagram');
    if (v.sitio_web.trim() && !normalizarSitio(v.sitio_web)) e.add('sitio_web');
    if (v.whatsapp.trim() && !normalizarWhatsappAR(v.whatsapp)) e.add('whatsapp');
    if (!v.instagram.trim() && !v.sitio_web.trim() && !v.whatsapp.trim()) e.add('contacto');
    if (v.cuit.trim() && !limpiarCuit(v.cuit)) e.add('cuit');
    if (!v.rol) e.add('rol');
    if (!v.acepta) e.add('acepta');
    return e;
  }

  async function enviar(ev: React.FormEvent) {
    ev.preventDefault();
    if (enviando) return;
    setError(null);
    const e = validar();
    setMal(e);
    if (e.size > 0) {
      document.getElementById(`sol-${[...e][0]}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setEnviando(true);
    const r = await mandarSolicitud(negocioId ?? null, objetivo, v);
    if (!r.ok) {
      setEnviando(false);
      if (r.campo) setMal(new Set([r.campo]));
      setError(tn.has(`errores.${r.error}`) ? tn(`errores.${r.error}`) : t('errorGeneral'));
      return;
    }
    router.push('/negocio/alta');
    router.refresh();
  }

  const aviso = (k: string, texto: string) => (mal.has(k) ? texto : undefined);

  return (
    <form onSubmit={enviar} noValidate className="space-y-5 pb-16">
      <Field label={t('nombre')} htmlFor="sol-nombre_comercial" help={aviso('nombre_comercial', t('faltaNombre'))}>
        <Input id="sol-nombre_comercial" autoComplete="organization" value={v.nombre_comercial} onChange={set('nombre_comercial')} invalid={mal.has('nombre_comercial')} maxLength={80} />
      </Field>

      <fieldset>
        <legend className="mb-1.5 text-small font-medium">{t('tipo')}</legend>
        <div className="grid grid-cols-2 gap-2">
          {(['persona', 'empresa'] as const).map((x) => (
            <button
              key={x}
              type="button"
              aria-pressed={v.tipo_vendedor === x}
              onClick={() => setV((a) => ({ ...a, tipo_vendedor: x }))}
              className={cn(
                'press rounded-button border px-3 py-2.5 text-left text-small transition-colors',
                v.tipo_vendedor === x ? 'border-primary bg-primary/10 font-semibold' : 'border-border bg-surface hover:bg-surface-2',
              )}
            >
              {t(`tipo_${x}`)}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={tn('alta.paso1.rubro')} htmlFor="sol-rubro" help={aviso('rubro', t('faltaElegir'))}>
          <Select id="sol-rubro" value={v.rubro} onChange={set('rubro')} className={cn(mal.has('rubro') && 'border-brote-coral')}>
            <option value="" disabled>
              {tn('alta.paso1.elegir')}
            </option>
            {RUBROS.map((r) => (
              <option key={r} value={r}>
                {tn(`rubros.${r}`)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={tn('alta.paso1.tamano')} htmlFor="sol-tamano">
          <Select id="sol-tamano" value={v.tamano} onChange={set('tamano')}>
            {TAMANOS.map((s) => (
              <option key={s} value={s}>
                {tn(`tamanosCorto.${claveTamano(s)}`)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={tn('alta.paso1.provincia')} htmlFor="sol-provincia" help={aviso('provincia', t('faltaElegir'))}>
          <Select id="sol-provincia" value={v.provincia} onChange={set('provincia')} className={cn(mal.has('provincia') && 'border-brote-coral')}>
            <option value="" disabled>
              {tn('alta.paso1.elegir')}
            </option>
            {PROVINCES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={tn('alta.paso1.ciudad')} htmlFor="sol-ciudad">
          <Input id="sol-ciudad" autoComplete="address-level2" value={v.ciudad} onChange={set('ciudad')} maxLength={80} />
        </Field>
      </div>

      <Field
        label={objetivo === 'vender' ? t('descVender') : t('descMejorar')}
        htmlFor="sol-descripcion"
        help={mal.has('descripcion') ? aviso('descripcion', t('faltaDesc', { n: DESC_MIN })) : t('descAyuda', { n: v.descripcion.trim().length, max: DESC_MAX })}
      >
        <Textarea id="sol-descripcion" value={v.descripcion} onChange={set('descripcion')} maxLength={DESC_MAX} className={cn('min-h-24', mal.has('descripcion') && 'border-brote-coral')} />
      </Field>

      <fieldset id="sol-contacto">
        <legend className="text-small font-medium">{t('dondeTitulo')}</legend>
        <p className={cn('mb-2 mt-0.5 text-caption', mal.has('contacto') ? 'text-brote-coral' : 'text-muted-foreground')}>{t('dondeAyuda')}</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Instagram" htmlFor="sol-instagram">
            <Input id="sol-instagram" placeholder="@tunegocio" value={v.instagram} onChange={set('instagram')} invalid={mal.has('instagram')} />
          </Field>
          <Field label={t('sitio')} htmlFor="sol-sitio_web">
            <Input id="sol-sitio_web" inputMode="url" placeholder="tunegocio.com.ar" value={v.sitio_web} onChange={set('sitio_web')} invalid={mal.has('sitio_web')} />
          </Field>
          <Field label="WhatsApp" htmlFor="sol-whatsapp">
            <Input id="sol-whatsapp" inputMode="tel" placeholder="11 5555 5555" value={v.whatsapp} onChange={set('whatsapp')} invalid={mal.has('whatsapp')} />
          </Field>
        </div>
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t('rol')} htmlFor="sol-rol" help={aviso('rol', t('faltaElegir'))}>
          <Select id="sol-rol" value={v.rol} onChange={set('rol')} className={cn(mal.has('rol') && 'border-brote-coral')}>
            <option value="" disabled>
              {tn('alta.paso1.elegir')}
            </option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {t(`rol_${r}`)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t('cuit')} htmlFor="sol-cuit" help={mal.has('cuit') ? aviso('cuit', t('cuitMal')) : t('cuitAyuda')}>
          <Input id="sol-cuit" inputMode="numeric" value={v.cuit} onChange={set('cuit')} invalid={mal.has('cuit')} />
        </Field>
      </div>

      <Field label={t('extra')} htmlFor="sol-extra" help={t('extraAyuda')}>
        <Textarea id="sol-extra" value={v.extra} onChange={set('extra')} maxLength={500} className="min-h-20" />
      </Field>

      <label id="sol-acepta" className={cn('flex items-start gap-2.5 rounded-button border p-3 text-small', mal.has('acepta') ? 'border-brote-coral' : 'border-border')}>
        <input type="checkbox" checked={v.acepta} onChange={(e) => setV((a) => ({ ...a, acepta: e.target.checked }))} className="mt-0.5 h-4 w-4 shrink-0 accent-[rgb(var(--primary))]" />
        <span>
          {t('acepta')}{' '}
          <Link href="/legal/negocios" target="_blank" className="font-semibold text-primary underline underline-offset-2">
            {t('terminos')}
          </Link>
          .
        </span>
      </label>

      {error && (
        <p role="alert" className="text-small font-medium text-brote-coral">
          {error}
        </p>
      )}
      {!error && mal.size > 0 && (
        <p role="alert" className="text-small font-medium text-brote-coral">
          {t('revisar')}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="press inline-flex h-12 w-full items-center justify-center gap-2 rounded-pill bg-primary px-6 text-body font-semibold text-primary-foreground shadow-crisp disabled:opacity-60 sm:w-auto"
      >
        {enviando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
        {negocioId ? t('reenviar') : t('enviar')}
        {!enviando && <ArrowRight className="h-4 w-4" aria-hidden />}
      </button>
    </form>
  );
}

/** La pantalla del formulario, para quien todavía no mandó nada. */
export function NuevaSolicitud({ objetivo }: { objetivo: Objetivo }) {
  const t = useTranslations('negocio.solicitud');
  return (
    <div className="mx-auto max-w-xl pt-2">
      <span className="eyebrow text-primary">{objetivo === 'vender' ? t('eyebrowVender') : t('eyebrowMejorar')}</span>
      <h1 className="mt-1.5 font-display text-display-l font-bold leading-tight">{t('titulo')}</h1>
      <p className="mt-2 max-w-prose text-body leading-relaxed text-muted-foreground">{t('bajada')}</p>
      <Linea paso={1} objetivo={objetivo} className="mt-5" />
      <div className="mt-6">
        <FormSolicitud objetivo={objetivo} />
      </div>
    </div>
  );
}

function Linea({ paso, objetivo, className }: { paso: 1 | 2; objetivo: Objetivo; className?: string }) {
  const t = useTranslations('negocio.solicitud');
  const pasos = [
    { i: <FileSearch className="h-4 w-4" />, txt: t('linea1') },
    { i: <Clock className="h-4 w-4" />, txt: t('linea2') },
    { i: <Rocket className="h-4 w-4" />, txt: objetivo === 'vender' ? t('linea3Vender') : t('linea3Mejorar') },
  ];
  return (
    <ol className={cn('grid gap-2 sm:grid-cols-3', className)}>
      {pasos.map((p, n) => {
        const hecho = n + 1 < paso;
        const actual = n + 1 === paso;
        return (
          <li
            key={n}
            aria-current={actual ? 'step' : undefined}
            className={cn(
              'flex items-start gap-2 rounded-card border p-3 text-caption leading-relaxed',
              actual ? 'border-primary/40 bg-primary/5' : 'border-border bg-surface-2',
            )}
          >
            <span className={cn('mt-0.5', hecho || actual ? 'text-primary' : 'text-muted-foreground')}>{hecho ? <Check className="h-4 w-4" /> : p.i}</span>
            {p.txt}
          </li>
        );
      })}
    </ol>
  );
}

/** En qué está una solicitud ya enviada: esperando, con algo para corregir, o rechazada. */
export function EstadoSolicitud({ s, nombre }: { s: SolicitudNegocio; nombre: string }) {
  const t = useTranslations('negocio.solicitud');
  const f = useFormatter();
  const objetivo: Objetivo = s.objetivo === 'vender' ? 'vender' : 'mejorar';
  const fecha = (iso: string) => f.dateTime(new Date(iso), { day: 'numeric', month: 'long' });

  if (s.status === 'suspended' || s.status === 'closed') {
    return (
      <Marco icono={<ShieldAlert className="h-6 w-6" />} eyebrow={nombre} titulo={t(s.status === 'closed' ? 'cerradaTitulo' : 'suspendidaTitulo')} cuerpo={t('suspendidaCuerpo')}>
        <Nota nota={s.revision_note} titulo={t('notaEquipo')} />
      </Marco>
    );
  }

  if (s.status === 'rejected') {
    const desde = s.puede_reenviar_desde;
    const puede = !desde || new Date(desde).getTime() <= Date.now();
    return (
      <Marco icono={<ShieldAlert className="h-6 w-6" />} eyebrow={nombre} titulo={t('rechazadaTitulo')} cuerpo={puede ? t('rechazadaPuede') : t('rechazadaEspera', { fecha: fecha(desde!) })}>
        <Nota nota={s.revision_note} titulo={t('notaEquipo')} />
        {puede && (
          <div className="mt-6">
            <FormSolicitud objetivo={objetivo} negocioId={s.id} inicial={s.datos} />
          </div>
        )}
      </Marco>
    );
  }

  // Le pedimos algo, o quedó un borrador de antes: se completa y se manda.
  if (s.status === 'draft' || s.revision_note) {
    return (
      <Marco
        icono={<MessageCircleWarning className="h-6 w-6" />}
        eyebrow={nombre}
        titulo={s.status === 'draft' ? t('borradorTitulo') : t('corregirTitulo')}
        cuerpo={s.status === 'draft' ? t('borradorCuerpo') : t('corregirCuerpo')}
      >
        <Nota nota={s.revision_note} titulo={t('notaEquipo')} />
        <div className="mt-6">
          <FormSolicitud objetivo={objetivo} negocioId={s.id} inicial={s.datos} />
        </div>
      </Marco>
    );
  }

  return (
    <Marco
      icono={<Clock className="h-6 w-6" />}
      eyebrow={nombre}
      titulo={t(s.status === 'in_review' ? 'revisandoTitulo' : 'esperaTitulo')}
      cuerpo={objetivo === 'vender' ? t('esperaVender') : t('esperaMejorar')}
    >
      <Linea paso={2} objetivo={objetivo} className="mt-5" />
      <dl className="mt-6 divide-y divide-hairline border-y border-hairline text-small">
        <Dato k={t('resumenEnviada')} v={s.enviado_at ? fecha(s.enviado_at) : '—'} />
        <Dato k={t('resumenPlan')} v={objetivo === 'vender' ? t('eyebrowVender') : t('eyebrowMejorar')} />
        <Dato k={t('resumenDonde')} v={[s.datos.instagram && `@${s.datos.instagram}`, s.datos.sitio_web?.replace(/^https:\/\//, ''), s.datos.whatsapp].filter(Boolean).join(' · ') || '—'} />
      </dl>
      <p className="mt-4 text-caption leading-relaxed text-muted-foreground">{t('esperaAviso')}</p>
      <Link href="/" className="press mt-5 inline-flex h-11 items-center justify-center rounded-pill border border-border px-5 text-small font-semibold">
        {t('volver')}
      </Link>
    </Marco>
  );
}

function Marco({ icono, eyebrow, titulo, cuerpo, children }: { icono: React.ReactNode; eyebrow: string; titulo: string; cuerpo: string; children?: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-xl pt-2">
      <span className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-primary/10 text-primary">{icono}</span>
      <span className="eyebrow mt-4 block text-muted-foreground">{eyebrow}</span>
      <h1 className="mt-1 font-display text-display-l font-bold leading-tight">{titulo}</h1>
      <p className="mt-2 max-w-prose text-body leading-relaxed text-muted-foreground">{cuerpo}</p>
      {children}
    </div>
  );
}

function Nota({ nota, titulo }: { nota: string | null; titulo: string }) {
  if (!nota) return null;
  return (
    <figure className="mt-4 rounded-card border border-brote-sun/40 bg-brote-sun/10 p-4">
      <figcaption className="eyebrow text-muted-foreground">{titulo}</figcaption>
      <blockquote className="mt-1 whitespace-pre-line text-small leading-relaxed">{nota}</blockquote>
    </figure>
  );
}

function Dato({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="min-w-0 break-words text-right font-medium">{v}</dd>
    </div>
  );
}
