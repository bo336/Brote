'use client';

import { useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useForm, type FieldValues, type Path, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Check, CircleAlert, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Select, Textarea } from '@/components/ui/input';
import { PROVINCES } from '@/lib/data/cities';
import { RUBROS, TAMANOS, claveTamano } from '@/lib/negocio/catalogo';
import {
  DESCRIPCION_POBRE,
  MIN_DESCRIPCION,
  esquemaPaso1,
  esquemaPaso2,
  esquemaPaso3,
  esquemaPaso4,
  type Paso1 as Valores1,
  type Paso2 as Valores2,
  type Paso3 as Valores3,
  type Paso4 as Valores4,
} from '@/lib/negocio/esquemas';
import { crearNegocio, guardarPasoAlta } from '@/lib/negocio/acciones';
import { formatearCuit } from '@/lib/negocio/normalizar';
import type { NegocioDetalle } from '@/lib/supabase/rows-negocio';
import { useToastStore } from '@/stores/toast';
import { cn } from '@/lib/utils/cn';

// ── "Guardado" ───────────────────────────────────────────────────────────────
// La página se vuelve a montar en cada paso, así que el aviso discreto de
// guardado vive a nivel de módulo: sobrevive al montaje y a nada más.
let ultimoGuardado = 0;
export function avisarGuardado() {
  ultimoGuardado = Date.now();
}
export function guardadoReciente(): boolean {
  return Date.now() - ultimoGuardado < 6000;
}

/** Nombre de campo que devuelve la base → clave de `negocio.alta.errores`. */
const ERROR_DE_CAMPO: Record<string, string> = {
  nombre_comercial: 'nombre',
  razon_social: 'largo',
  cuit: 'cuit',
  rubro: 'rubro',
  tamano: 'tamano',
  provincia: 'provincia',
  ciudad: 'largo',
  sitio_web: 'sitio',
  instagram: 'instagram',
  whatsapp: 'whatsapp',
  email_contacto: 'email',
  descripcion: 'descripcion',
  intereses: 'intereses',
};

type OnListo = (paso: number, extra?: string) => void;

/**
 * Lo común de guardar un paso: llama al server action, marca en el campo lo
 * que la base rechazó, y si el negocio dejó de ser editable (alguien lo envió
 * desde otra pestaña) vuelve al resumen.
 */
function useGuardar<T extends FieldValues>(form: UseFormReturn<T>) {
  const t = useTranslations('negocio');
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function guardar(accion: () => ReturnType<typeof guardarPasoAlta>): Promise<boolean> {
    setError(null);
    const r = await accion();
    if (r.ok) {
      avisarGuardado();
      return true;
    }
    if (r.campo && ERROR_DE_CAMPO[r.campo]) {
      form.setError(r.campo as Path<T>, { message: ERROR_DE_CAMPO[r.campo] });
      return false;
    }
    if (r.error === 'no_editable' || r.error === 'sin_permiso') {
      useToastStore.getState().push({ variant: 'error', title: t(`errores.${r.error}`) });
      router.push('/negocio');
      return false;
    }
    setError(t.has(`errores.${r.error}`) ? t(`errores.${r.error}`) : t('errores.error'));
    return false;
  }

  return { guardar, error };
}

// ── Piezas ───────────────────────────────────────────────────────────────────

function Campo({
  id,
  etiqueta,
  error,
  ayuda,
  children,
  className,
}: {
  id: string;
  etiqueta: string;
  error?: string;
  ayuda?: string;
  children: ReactNode;
  className?: string;
}) {
  const t = useTranslations('negocio.alta.errores');
  return (
    <div className={cn('min-w-0', className)}>
      <label htmlFor={id} className="mb-1.5 block text-small font-medium text-foreground">
        {etiqueta}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 flex items-start gap-1.5 text-caption leading-relaxed text-brote-coral">
          <CircleAlert className="mt-px h-3.5 w-3.5 shrink-0" />
          {t.has(error) ? t(error) : error}
        </p>
      ) : (
        ayuda && <p className="mt-1.5 text-caption leading-relaxed text-muted-foreground">{ayuda}</p>
      )}
    </div>
  );
}

export function PieDePaso({
  onAtras,
  ocupado,
  error,
  fijo = false,
  children,
}: {
  onAtras?: () => void;
  ocupado?: boolean;
  error?: string | null;
  /** Pegado abajo en un teléfono, para pasos más largos que la pantalla. */
  fijo?: boolean;
  children: ReactNode;
}) {
  const t = useTranslations('negocio.alta');
  return (
    <div
      className={cn(
        'mt-5 sm:mt-7',
        fijo && 'pb-safe sticky bottom-0 -mx-4 bg-background/90 px-4 pb-3 backdrop-blur-lg sm:static sm:mx-0 sm:bg-transparent sm:px-0 sm:pb-0 sm:backdrop-blur-none',
      )}
    >
      {error && (
        <p role="alert" className="mb-3 flex items-start gap-2 text-small leading-relaxed text-brote-coral">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}
      <div className="flex items-center justify-between gap-3 border-t border-hairline pt-4 sm:pt-5">
        {onAtras ? (
          <Button type="button" variant="ghost" size="sm" onClick={onAtras} disabled={ocupado}>
            <ArrowLeft className="h-4 w-4" />
            {t('atras')}
          </Button>
        ) : (
          <span />
        )}
        {children}
      </div>
    </div>
  );
}

function Siguiente({ ocupado }: { ocupado: boolean }) {
  const t = useTranslations('negocio.alta');
  return (
    <Button type="submit" className="rounded-pill" loading={ocupado}>
      {t('siguiente')}
    </Button>
  );
}

/**
 * "Atrás" también guarda si lo cambiado es válido (autoguardado al cambiar de
 * paso). Si no es válido, vuelve igual: lo que ya estaba guardado sigue ahí.
 */
async function volverGuardando<T extends FieldValues>(
  form: UseFormReturn<T>,
  guardar: (valores: T) => Promise<boolean>,
  volver: () => void,
) {
  if (form.formState.isDirty && (await form.trigger())) {
    await guardar(form.getValues());
  }
  volver();
}

// ── Paso 1 · Quiénes son ─────────────────────────────────────────────────────

export function Paso1({ negocio, onListo }: { negocio: NegocioDetalle | null; onListo: OnListo }) {
  const t = useTranslations('negocio');
  const form = useForm<Valores1>({
    resolver: zodResolver(esquemaPaso1),
    mode: 'onTouched',
    defaultValues: {
      nombre_comercial: negocio?.nombre_comercial ?? '',
      razon_social: negocio?.razon_social ?? '',
      cuit: formatearCuit(negocio?.cuit),
      rubro: (negocio?.rubro as Valores1['rubro']) ?? ('' as Valores1['rubro']),
      tamano: negocio?.tamano ?? '1',
      provincia: (negocio?.provincia as Valores1['provincia']) ?? ('' as Valores1['provincia']),
      ciudad: negocio?.ciudad ?? '',
    },
  });
  const { guardar, error } = useGuardar(form);
  const [creando, setCreando] = useState(false);
  const [errorAlta, setErrorAlta] = useState<string | null>(null);
  const e = form.formState.errors;

  async function onSubmit(v: Valores1) {
    if (negocio) {
      if (await guardar(() => guardarPasoAlta(negocio.id, 1, v))) onListo(2);
      return;
    }
    // Negocio nuevo: el primer paso lo crea.
    setCreando(true);
    setErrorAlta(null);
    const r = await crearNegocio(v);
    if (!r.ok) {
      setCreando(false);
      if (r.campo && ERROR_DE_CAMPO[r.campo]) form.setError(r.campo as Path<Valores1>, { message: ERROR_DE_CAMPO[r.campo] });
      else setErrorAlta(t.has(`errores.${r.error}`) ? t(`errores.${r.error}`) : t('errores.error'));
      return;
    }
    avisarGuardado();
    // Si lo creó pero algo del resto no entró, se queda en el paso 1 ya en modo edición.
    onListo(r.aviso ? 1 : 2);
    if (r.aviso) useToastStore.getState().push({ variant: 'error', title: t('errores.campo_invalido') });
  }

  const ocupado = form.formState.isSubmitting || creando;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-3">
      <Campo id="nombre_comercial" etiqueta={t('alta.paso1.nombre')} error={e.nombre_comercial?.message}>
        <Input
          id="nombre_comercial"
          autoComplete="organization"
          placeholder={t('alta.paso1.nombrePh')}
          invalid={!!e.nombre_comercial}
          {...form.register('nombre_comercial')}
        />
      </Campo>

      <div className="grid grid-cols-2 gap-x-3 gap-y-3">
        <Campo id="razon_social" etiqueta={t('alta.paso1.razonSocial')} error={e.razon_social?.message}>
          <Input id="razon_social" placeholder={t('alta.paso1.razonSocialPh')} {...form.register('razon_social')} />
        </Campo>
        <Campo id="cuit" etiqueta={t('alta.paso1.cuit')} error={e.cuit?.message}>
          <Input
            id="cuit"
            inputMode="numeric"
            placeholder={t('alta.paso1.cuitPh')}
            invalid={!!e.cuit}
            {...form.register('cuit')}
          />
        </Campo>
        <Campo id="rubro" etiqueta={t('alta.paso1.rubro')} error={e.rubro?.message}>
          <Select id="rubro" aria-invalid={!!e.rubro || undefined} className={cn(e.rubro && 'border-brote-coral')} {...form.register('rubro')}>
            <option value="" disabled>
              {t('alta.paso1.elegir')}
            </option>
            {RUBROS.map((r) => (
              <option key={r} value={r}>
                {t(`rubros.${r}`)}
              </option>
            ))}
          </Select>
        </Campo>
        <Campo id="tamano" etiqueta={t('alta.paso1.tamano')} error={e.tamano?.message}>
          <Select id="tamano" {...form.register('tamano')}>
            {TAMANOS.map((s) => (
              <option key={s} value={s}>
                {t(`tamanosCorto.${claveTamano(s)}`)}
              </option>
            ))}
          </Select>
        </Campo>
        <Campo id="provincia" etiqueta={t('alta.paso1.provincia')} error={e.provincia?.message}>
          <Select id="provincia" aria-invalid={!!e.provincia || undefined} className={cn(e.provincia && 'border-brote-coral')} {...form.register('provincia')}>
            <option value="" disabled>
              {t('alta.paso1.elegir')}
            </option>
            {PROVINCES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
        </Campo>
        <Campo id="ciudad" etiqueta={t('alta.paso1.ciudad')} error={e.ciudad?.message}>
          <Input id="ciudad" autoComplete="address-level2" placeholder={t('alta.paso1.ciudadPh')} {...form.register('ciudad')} />
        </Campo>
      </div>
      {/* El aviso de "declarado" aparece cuando hay un CUIT: es el momento en que importa. */}
      {!e.cuit && !!form.watch('cuit') && (
        <p className="-mt-1 text-caption text-muted-foreground">{t('alta.paso1.cuitAyuda')}</p>
      )}

      <PieDePaso ocupado={ocupado} error={error ?? errorAlta}>
        <Siguiente ocupado={ocupado} />
      </PieDePaso>
    </form>
  );
}

// ── Paso 2 · Dónde encontrarlos ──────────────────────────────────────────────

export function Paso2({ negocio, onListo }: { negocio: NegocioDetalle; onListo: OnListo }) {
  const t = useTranslations('negocio.alta');
  const form = useForm<Valores2>({
    resolver: zodResolver(esquemaPaso2),
    mode: 'onTouched',
    defaultValues: {
      sitio_web: negocio.sitio_web?.replace(/^https:\/\//, '') ?? '',
      instagram: negocio.instagram ? `@${negocio.instagram}` : '',
      whatsapp: negocio.whatsapp ?? '',
      email_contacto: negocio.email_contacto ?? '',
    },
  });
  const { guardar, error } = useGuardar(form);
  const e = form.formState.errors;
  const guardarValores = (v: Valores2) => guardar(() => guardarPasoAlta(negocio.id, 2, v));

  return (
    <form
      onSubmit={form.handleSubmit(async (v) => {
        if (await guardarValores(v)) onListo(3);
      })}
      noValidate
      className="grid gap-x-3 gap-y-3.5 sm:grid-cols-2"
    >
      <Campo id="sitio_web" etiqueta={t('paso2.sitio')} error={e.sitio_web?.message}>
        <Input
          id="sitio_web"
          type="url"
          inputMode="url"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder={t('paso2.sitioPh')}
          invalid={!!e.sitio_web}
          {...form.register('sitio_web', { deps: ['instagram'] })}
        />
      </Campo>
      <Campo id="instagram" etiqueta={t('paso2.instagram')} error={e.instagram?.message}>
        <Input
          id="instagram"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder={t('paso2.instagramPh')}
          invalid={!!e.instagram}
          {...form.register('instagram', { deps: ['sitio_web'] })}
        />
      </Campo>
      <Campo id="whatsapp" etiqueta={t('paso2.whatsapp')} error={e.whatsapp?.message}>
        <Input
          id="whatsapp"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder={t('paso2.whatsappPh')}
          invalid={!!e.whatsapp}
          {...form.register('whatsapp')}
        />
      </Campo>
      <Campo id="email_contacto" etiqueta={t('paso2.email')} error={e.email_contacto?.message}>
        <Input
          id="email_contacto"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          placeholder={t('paso2.emailPh')}
          invalid={!!e.email_contacto}
          {...form.register('email_contacto')}
        />
      </Campo>

      <div className="sm:col-span-2">
        <PieDePaso
          ocupado={form.formState.isSubmitting}
          error={error}
          onAtras={() => void volverGuardando(form, guardarValores, () => onListo(1))}
        >
          <Siguiente ocupado={form.formState.isSubmitting} />
        </PieDePaso>
      </div>
    </form>
  );
}

// ── Paso 3 · Qué hacen ───────────────────────────────────────────────────────

const PREGUNTAS = ['pregInsumos', 'pregResiduos', 'pregLogistica'] as const;

export function Paso3({ negocio, onListo }: { negocio: NegocioDetalle; onListo: OnListo }) {
  const t = useTranslations('negocio.alta');
  const form = useForm<Valores3>({
    resolver: zodResolver(esquemaPaso3),
    mode: 'onTouched',
    defaultValues: { descripcion: negocio.descripcion ?? '' },
  });
  const { guardar, error } = useGuardar(form);
  const areaRef = useRef<HTMLTextAreaElement | null>(null);
  const texto = form.watch('descripcion') ?? '';
  const largo = texto.trim().length;
  const e = form.formState.errors;
  const guardarValores = (v: Valores3) => guardar(() => guardarPasoAlta(negocio.id, 3, v));
  const { ref: registrarRef, ...registro } = form.register('descripcion');

  /** Suma la pregunta al final y deja el cursor listo para responderla. */
  function inyectar(pregunta: string) {
    const base = texto.trimEnd();
    const nuevo = `${base}${base ? '\n\n' : ''}${pregunta} `;
    form.setValue('descripcion', nuevo, { shouldDirty: true });
    requestAnimationFrame(() => {
      const el = areaRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(nuevo.length, nuevo.length);
      el.scrollTop = el.scrollHeight;
    });
  }

  const pendientes = PREGUNTAS.filter((p) => !texto.includes(t(`paso3.${p}`)));

  return (
    <form
      onSubmit={form.handleSubmit(async (v) => {
        if (await guardarValores(v)) onListo(4);
      })}
      noValidate
    >
      <label htmlFor="descripcion" className="sr-only">
        {t('paso3.titulo')}
      </label>
      <Textarea
        id="descripcion"
        rows={6}
        placeholder={t('paso3.placeholder')}
        aria-invalid={!!e.descripcion || undefined}
        aria-describedby="descripcion-contador"
        className={cn('min-h-36 text-body sm:min-h-44', e.descripcion && 'border-brote-coral')}
        {...registro}
        ref={(el) => {
          registrarRef(el);
          areaRef.current = el;
        }}
      />
      <div className="mt-1.5 flex items-start justify-between gap-3">
        <p className="text-caption leading-relaxed text-brote-coral">
          {e.descripcion?.message && t(`errores.${e.descripcion.message}`)}
        </p>
        <p
          id="descripcion-contador"
          className={cn(
            'shrink-0 text-caption tnum transition-colors duration-150',
            largo >= MIN_DESCRIPCION ? 'text-primary' : 'text-muted-foreground',
          )}
        >
          {largo >= MIN_DESCRIPCION && <Check className="mr-0.5 inline h-3.5 w-3.5 align-[-2px]" />}
          {largo >= MIN_DESCRIPCION
            ? t('paso3.contador', { n: largo })
            : t('paso3.contadorFalta', { n: largo, faltan: MIN_DESCRIPCION - largo })}
        </p>
      </div>

      {largo < DESCRIPCION_POBRE && pendientes.length > 0 && (
        <div className="mt-3 motion-safe:animate-in motion-safe:fade-in-0 sm:mt-4">
          <span className="eyebrow text-muted-foreground">{t('paso3.sugerencias')}</span>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {pendientes.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => inyectar(t(`paso3.${p}`))}
                className="press inline-flex items-center gap-1 rounded-pill border border-border bg-surface-2 px-3 py-1.5 text-caption font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground"
              >
                <Plus className="h-3.5 w-3.5" />
                {t(`paso3.${p}`)}
              </button>
            ))}
          </div>
        </div>
      )}

      <PieDePaso
        ocupado={form.formState.isSubmitting}
        error={error}
        onAtras={() => void volverGuardando(form, guardarValores, () => onListo(2))}
      >
        <Siguiente ocupado={form.formState.isSubmitting} />
      </PieDePaso>
    </form>
  );
}

// ── Paso 4 · Qué querés hacer acá ────────────────────────────────────────────

export function Paso4({ negocio, onListo }: { negocio: NegocioDetalle; onListo: OnListo }) {
  const t = useTranslations('negocio.alta');
  const form = useForm<Valores4>({
    resolver: zodResolver(esquemaPaso4),
    defaultValues: { intereses: negocio.intereses ?? [] },
  });
  const { guardar, error } = useGuardar(form);
  const elegidos = form.watch('intereses') ?? [];
  const e = form.formState.errors;
  const guardarValores = (v: Valores4) => guardar(() => guardarPasoAlta(negocio.id, 4, v));

  const poner = (lista: Valores4['intereses']) =>
    form.setValue('intereses', lista, { shouldDirty: true, shouldValidate: form.formState.isSubmitted });
  const alternar = (i: 'mejora' | 'mercado') =>
    poner(elegidos.includes(i) ? elegidos.filter((x) => x !== i) : [...elegidos, i]);
  const ambas = elegidos.includes('mejora') && elegidos.includes('mercado');

  const opciones: { clave: string; titulo: string; ayuda?: string; marcada: boolean; onChange: () => void }[] = [
    { clave: 'mejora', titulo: t('paso4.mejora'), ayuda: t('paso4.mejoraAyuda'), marcada: elegidos.includes('mejora'), onChange: () => alternar('mejora') },
    { clave: 'mercado', titulo: t('paso4.mercado'), ayuda: t('paso4.mercadoAyuda'), marcada: elegidos.includes('mercado'), onChange: () => alternar('mercado') },
    { clave: 'ambas', titulo: t('paso4.ambas'), marcada: ambas, onChange: () => poner(ambas ? [] : ['mejora', 'mercado']) },
  ];

  return (
    <form
      onSubmit={form.handleSubmit(async (v) => {
        if (await guardarValores(v)) onListo(5);
      })}
      noValidate
    >
      <fieldset aria-invalid={!!e.intereses || undefined}>
        <legend className="sr-only">{t('paso4.titulo')}</legend>
        <div className="border-y border-hairline divide-hairline">
          {opciones.map((o) => (
            <label
              key={o.clave}
              htmlFor={`interes-${o.clave}`}
              className="group flex cursor-pointer items-start gap-3 py-3.5 transition-colors duration-150"
            >
              <input
                id={`interes-${o.clave}`}
                type="checkbox"
                checked={o.marcada}
                onChange={o.onChange}
                className="peer sr-only"
              />
              <span
                aria-hidden
                className={cn(
                  'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border transition-colors duration-150 peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background',
                  o.marcada ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-surface group-hover:border-primary/50',
                )}
              >
                <Check className={cn('h-3.5 w-3.5 transition-transform duration-150', o.marcada ? 'scale-100' : 'scale-0')} />
              </span>
              <span className="min-w-0">
                <span className="block text-small font-semibold">{o.titulo}</span>
                {o.ayuda && <span className="mt-0.5 block text-caption leading-relaxed text-muted-foreground">{o.ayuda}</span>}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      {e.intereses?.message && (
        <p role="alert" className="mt-2 text-caption text-brote-coral">
          {t(`errores.${e.intereses.message}`)}
        </p>
      )}

      <PieDePaso
        ocupado={form.formState.isSubmitting}
        error={error}
        onAtras={() => void volverGuardando(form, guardarValores, () => onListo(3))}
      >
        <Siguiente ocupado={form.formState.isSubmitting} />
      </PieDePaso>
    </form>
  );
}
