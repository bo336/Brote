'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { BadgeCheck, Camera, ExternalLink, Store } from 'lucide-react';
import { PasoCompromiso } from '@/components/negocio/vendedor/PasoCompromiso';
import { PasoTienda } from '@/components/negocio/vendedor/PasoTienda';
import { buttonVariants } from '@/components/ui/button';
import { subirLogoTienda } from '@/lib/api/mercado';
import { urlLogo } from '@/lib/mercado/imagenes';
import { guardarTienda } from '@/lib/negocio/vendedor-acciones';
import type { EstadoVendedor } from '@/lib/negocio/vendedor';
import { useToastStore } from '@/stores/toast';
import { cn } from '@/lib/utils/cn';

/**
 * `/negocio/tienda` — el perfil de la tienda: el logo, los datos que ve quien
 * compra, el compromiso (con su foto y su estado de revisión) y la cuenta de
 * Mercado Pago vinculada. Son los mismos formularios del alta: lo que se cargó
 * al abrir la tienda se edita igual.
 */
export function PerfilTienda({ estado }: { estado: EstadoVendedor }) {
  const t = useTranslations('negocio.vendedor.perfil');
  const router = useRouter();
  const archivo = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [seccion, setSeccion] = useState<'datos' | 'compromiso'>('datos');
  const logo = urlLogo(estado.tienda.logo_url);

  async function subir(f: File | undefined) {
    if (!f) return;
    setSubiendo(true);
    const r = await subirLogoTienda(estado.id, f);
    if (!r.ok) {
      setSubiendo(false);
      useToastStore.getState().push({ variant: 'error', title: t('logoError') });
      return;
    }
    const g = await guardarTienda(estado.id, { logo_url: r.ruta });
    setSubiendo(false);
    if (archivo.current) archivo.current.value = '';
    if (!g.ok) {
      useToastStore.getState().push({ variant: 'error', title: t('logoError') });
      return;
    }
    router.refresh();
  }

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => archivo.current?.click()}
          disabled={subiendo}
          aria-label={t('cambiarLogo')}
          className="press group relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface-2"
        >
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="" className="h-20 w-20 object-cover" />
          ) : (
            <Store className="h-8 w-8 text-muted-foreground" />
          )}
          <span className="absolute inset-x-0 bottom-0 flex h-7 items-center justify-center bg-black/55 text-white">
            <Camera className="h-3.5 w-3.5" />
          </span>
        </button>
        <input ref={archivo} type="file" accept="image/*" className="sr-only" onChange={(e) => subir(e.target.files?.[0])} />
        <div className="min-w-0">
          <h1 className="truncate font-display text-h1 font-bold">{estado.tienda.nombre_comercial}</h1>
          <Link href={`/mercado/tienda/${estado.slug}`} className="mt-1 inline-flex items-center gap-1 text-small font-semibold text-primary">
            <span className="link-underline">{t('verComoCliente')}</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {estado.mp.vinculado && (
        <p className="mt-4 flex items-center gap-2 rounded-card border border-border bg-surface p-3 text-small">
          <BadgeCheck className="h-4 w-4 shrink-0 text-brote-aqua" />
          {t('mpVinculada', { cuenta: estado.mp.nickname ?? '' })}
        </p>
      )}

      <div className="mt-6 flex gap-1.5 border-b border-hairline">
        {(['datos', 'compromiso'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSeccion(s)}
            aria-pressed={seccion === s}
            className={cn(
              '-mb-px border-b-2 px-3 py-2 text-small font-semibold transition-colors duration-150',
              seccion === s ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t(`secciones.${s}`)}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {seccion === 'datos' ? (
          <PasoTienda estado={estado} alGuardar={() => useToastStore.getState().push({ variant: 'success', title: t('guardado') })} />
        ) : (
          <PasoCompromiso estado={estado} alGuardar={() => useToastStore.getState().push({ variant: 'success', title: t('guardado') })} />
        )}
      </div>

      <div className="mt-10 border-t border-hairline pt-5 text-small text-muted-foreground">
        <p>{t('verificacionSitio')}</p>
        <Link href="/negocio/verificacion" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'mt-2 -ml-3')}>
          {t('verificarSitio')}
        </Link>
      </div>
    </div>
  );
}
