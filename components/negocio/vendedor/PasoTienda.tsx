'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Globe, Instagram, MessageCircle } from 'lucide-react';
import { visualCategoria } from '@/components/mercado/categoria-visual';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/input';
import { CATEGORIAS, type Categoria } from '@/lib/mercado/categorias';
import { crearTienda, guardarTienda, type DatosTienda } from '@/lib/negocio/vendedor-acciones';
import { formatearWhatsapp, normalizarWhatsappAR, type EstadoVendedor } from '@/lib/negocio/vendedor';
import { normalizarInstagram, normalizarSitio } from '@/lib/negocio/normalizar';
import { PROVINCES } from '@/lib/data/cities';
import { useToastStore } from '@/stores/toast';
import { cn } from '@/lib/utils/cn';

type Canal = 'whatsapp' | 'instagram' | 'web';

/**
 * Paso 1: la tienda. Lo justo para que alguien la encuentre y la contacte:
 * nombre, qué vende, dónde está, y al menos un canal (WhatsApp, Instagram o
 * un sitio). Nada de CUIT obligatorio ni de descripciones largas: quien vende
 * como empresa puede cargar sus datos, quien vende por su cuenta no los necesita.
 */
export function PasoTienda({ estado, alGuardar }: { estado: EstadoVendedor | null; alGuardar?: () => void }) {
  const t = useTranslations('negocio.vendedor.tienda');
  const te = useTranslations('negocio.vendedor.errores');
  const tc = useTranslations('mercado.categorias');
  const router = useRouter();
  const d = estado?.tienda;
  const [nombre, setNombre] = useState(d?.nombre_comercial ?? '');
  const [tipo, setTipo] = useState<'persona' | 'empresa'>(d?.tipo_vendedor ?? 'persona');
  const [categoria, setCategoria] = useState<Categoria | null>(d?.categoria_principal ?? null);
  const [provincia, setProvincia] = useState(d?.provincia ?? '');
  const [ciudad, setCiudad] = useState(d?.ciudad ?? '');
  const [whatsapp, setWhatsapp] = useState(d?.whatsapp ? formatearWhatsapp(d.whatsapp) : '');
  const [instagram, setInstagram] = useState(d?.instagram ? `@${d.instagram}` : '');
  const [sitio, setSitio] = useState(d?.sitio_web ?? '');
  const [preferido, setPreferido] = useState<Canal | null>(d?.contacto_preferido ?? null);
  const [descripcion, setDescripcion] = useState(d?.descripcion ?? '');
  const [cuit, setCuit] = useState(d?.cuit ?? '');
  const [razon, setRazon] = useState(d?.razon_social ?? '');
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [ocupado, setOcupado] = useState(false);

  // Los canales que tienen algo escrito con forma válida.
  const canales: Canal[] = [
    ...(normalizarWhatsappAR(whatsapp) ? (['whatsapp'] as const) : []),
    ...(normalizarInstagram(instagram) ? (['instagram'] as const) : []),
    ...(normalizarSitio(sitio) ? (['web'] as const) : []),
  ];
  const canalElegido = preferido && canales.includes(preferido) ? preferido : canales[0] ?? null;

  function validar(): Record<string, string> {
    const e: Record<string, string> = {};
    if (nombre.trim().length < 2) e.nombre_comercial = 'nombre';
    if (!categoria) e.categoria_principal = 'categoria';
    if (!provincia) e.provincia = 'provincia';
    if (whatsapp.trim() && !normalizarWhatsappAR(whatsapp)) e.whatsapp = 'whatsapp';
    if (instagram.trim() && !normalizarInstagram(instagram)) e.instagram = 'instagram';
    if (sitio.trim() && !normalizarSitio(sitio)) e.sitio_web = 'sitio_web';
    if (!e.whatsapp && !e.instagram && !e.sitio_web && canales.length === 0) e.contacto = 'contacto';
    return e;
  }

  async function guardar(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validar();
    setErrores(e);
    if (Object.keys(e).length > 0) {
      document.getElementById(`campo-${Object.keys(e)[0]}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setOcupado(true);
    let id = estado?.id ?? null;
    if (!id) {
      const r = await crearTienda(nombre);
      if (!r.ok) {
        setOcupado(false);
        useToastStore.getState().push({ variant: 'error', title: te.has(r.error) ? te(r.error) : te('error') });
        return;
      }
      id = r.id;
    }
    const datos: DatosTienda = {
      nombre_comercial: nombre.trim(),
      tipo_vendedor: tipo,
      categoria_principal: categoria!,
      provincia,
      ciudad: ciudad.trim(),
      whatsapp: whatsapp.trim(),
      instagram: instagram.trim(),
      sitio_web: sitio.trim(),
      contacto_preferido: canalElegido,
      descripcion: descripcion.trim(),
      ...(tipo === 'empresa' ? { cuit: cuit.trim(), razon_social: razon.trim() } : {}),
    };
    const r = await guardarTienda(id, datos);
    setOcupado(false);
    if (!r.ok) {
      if (r.campo) setErrores({ [r.campo]: r.error === 'termino_sin_afirmacion' ? 'descripcion_verde' : r.campo });
      useToastStore.getState().push({
        variant: 'error',
        title:
          r.error === 'termino_sin_afirmacion'
            ? te('descripcion_verde_termino', { termino: (r.termino ?? '').split('|')[0] ?? '' })
            : te.has(r.campo ?? r.error)
              ? te(r.campo ?? r.error)
              : te('error'),
      });
      return;
    }
    alGuardar?.();
    router.refresh();
  }

  const err = (campo: string) => (errores[campo] ? te(errores[campo]!) : undefined);

  return (
    <form onSubmit={guardar} noValidate className="space-y-7">
      <Field label={t('nombre')} htmlFor="campo-nombre_comercial" help={errores.nombre_comercial ? err('nombre_comercial') : t('nombreAyuda')}>
        <Input
          id="campo-nombre_comercial"
          value={nombre}
          onChange={(e) => setNombre(e.target.value.slice(0, 80))}
          invalid={!!errores.nombre_comercial}
          autoComplete="organization"
          placeholder={t('nombrePlaceholder')}
        />
      </Field>

      <fieldset id="campo-categoria_principal" className="min-w-0">
        <legend className="mb-1.5 text-small font-medium">{t('queVendes')}</legend>
        {errores.categoria_principal && <p className="mb-2 text-caption text-brote-coral">{err('categoria_principal')}</p>}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {CATEGORIAS.map((c) => {
            const v = visualCategoria(c);
            const Icono = v.icono;
            const activa = categoria === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCategoria(c)}
                aria-pressed={activa}
                className={cn(
                  'press flex items-center gap-2 rounded-button border px-2.5 py-2.5 text-left text-small transition-colors duration-150',
                  activa ? 'border-primary bg-primary/10 font-semibold' : 'border-border bg-surface hover:bg-surface-2',
                )}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: `${v.color}26` }}>
                  <Icono className="h-4 w-4" style={{ color: v.color }} />
                </span>
                <span className="min-w-0 leading-tight">{tc(c)}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="min-w-0">
        <legend className="mb-1.5 text-small font-medium">{t('comoVendes')}</legend>
        <div className="grid grid-cols-2 gap-2">
          {(['persona', 'empresa'] as const).map((x) => (
            <button
              key={x}
              type="button"
              onClick={() => setTipo(x)}
              aria-pressed={tipo === x}
              className={cn(
                'press rounded-button border px-3 py-2.5 text-left transition-colors duration-150',
                tipo === x ? 'border-primary bg-primary/10' : 'border-border bg-surface hover:bg-surface-2',
              )}
            >
              <span className="block text-small font-semibold">{t(`tipo.${x}`)}</span>
              <span className="block text-caption text-muted-foreground">{t(`tipo.${x}Ayuda`)}</span>
            </button>
          ))}
        </div>
      </fieldset>

      {tipo === 'empresa' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('razonSocial')} htmlFor="campo-razon_social" help={t('opcional')}>
            <Input id="campo-razon_social" value={razon} onChange={(e) => setRazon(e.target.value.slice(0, 120))} autoComplete="organization" />
          </Field>
          <Field label={t('cuit')} htmlFor="campo-cuit" help={errores.cuit ? err('cuit') : t('cuitAyuda')}>
            <Input id="campo-cuit" value={cuit} onChange={(e) => setCuit(e.target.value.slice(0, 13))} inputMode="numeric" invalid={!!errores.cuit} placeholder="30-12345678-9" />
          </Field>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('provincia')} htmlFor="campo-provincia" help={errores.provincia ? err('provincia') : undefined}>
          <Select id="campo-provincia" value={provincia} onChange={(e) => setProvincia(e.target.value)} aria-invalid={!!errores.provincia || undefined}>
            <option value="">{t('elegir')}</option>
            {PROVINCES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t('ciudad')} htmlFor="campo-ciudad" help={t('opcional')}>
          <Input id="campo-ciudad" value={ciudad} onChange={(e) => setCiudad(e.target.value.slice(0, 80))} autoComplete="address-level2" />
        </Field>
      </div>

      <fieldset id="campo-contacto" className="min-w-0 space-y-3">
        <legend className="text-small font-medium">{t('contacto')}</legend>
        <p className={cn('-mt-1 text-caption', errores.contacto ? 'text-brote-coral' : 'text-muted-foreground')}>
          {errores.contacto ? err('contacto') : t('contactoAyuda')}
        </p>
        <Canal icono={MessageCircle} etiqueta="WhatsApp" id="whatsapp" error={err('whatsapp')}>
          <Input
            id="campo-whatsapp"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value.slice(0, 24))}
            onBlur={() => {
              const n = normalizarWhatsappAR(whatsapp);
              if (n) setWhatsapp(formatearWhatsapp(n));
            }}
            inputMode="tel"
            autoComplete="tel"
            placeholder={t('whatsappPlaceholder')}
            invalid={!!errores.whatsapp}
          />
        </Canal>
        <Canal icono={Instagram} etiqueta="Instagram" id="instagram" error={err('instagram')}>
          <Input
            id="campo-instagram"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value.slice(0, 60))}
            placeholder="@tutienda"
            autoCapitalize="none"
            invalid={!!errores.instagram}
          />
        </Canal>
        <Canal icono={Globe} etiqueta={t('sitio')} id="sitio_web" error={err('sitio_web')}>
          <Input
            id="campo-sitio_web"
            value={sitio}
            onChange={(e) => setSitio(e.target.value.slice(0, 200))}
            inputMode="url"
            placeholder="tutienda.com.ar"
            autoCapitalize="none"
            invalid={!!errores.sitio_web}
          />
        </Canal>
        {canales.length > 1 && (
          <div>
            <span className="mb-1.5 block text-caption font-medium">{t('preferido')}</span>
            <div className="flex flex-wrap gap-2">
              {canales.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setPreferido(c)}
                  aria-pressed={canalElegido === c}
                  className={cn(
                    'press h-9 rounded-pill border px-3.5 text-small transition-colors duration-150',
                    canalElegido === c ? 'border-primary bg-primary/10 font-semibold' : 'border-border bg-surface',
                  )}
                >
                  {c === 'web' ? t('sitio') : c === 'whatsapp' ? 'WhatsApp' : 'Instagram'}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-caption text-muted-foreground">{t('preferidoAyuda')}</p>
          </div>
        )}
      </fieldset>

      <Field
        label={t('descripcion')}
        htmlFor="campo-descripcion"
        help={errores.descripcion ? te(errores.descripcion) : t('descripcionAyuda')}
      >
        <Textarea
          id="campo-descripcion"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value.slice(0, 600))}
          rows={3}
          placeholder={t('descripcionPlaceholder')}
          aria-invalid={!!errores.descripcion || undefined}
        />
      </Field>

      <div className="sticky bottom-0 -mx-4 border-t border-hairline bg-background/95 px-4 py-3 backdrop-blur-md sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
        <Button type="submit" block size="lg" loading={ocupado} className="rounded-pill">
          {t('guardar')}
        </Button>
      </div>
    </form>
  );
}

function Canal({
  icono: Icono,
  etiqueta,
  id,
  error,
  children,
}: {
  icono: React.ComponentType<{ className?: string }>;
  etiqueta: string;
  id: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={`campo-${id}`} className="mb-1 flex items-center gap-1.5 text-caption font-semibold text-muted-foreground">
        <Icono className="h-3.5 w-3.5" />
        {etiqueta}
      </label>
      {children}
      {error && <p className="mt-1 text-caption text-brote-coral">{error}</p>}
    </div>
  );
}
