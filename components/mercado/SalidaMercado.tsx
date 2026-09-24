'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ExternalLink, Instagram, LogOut, MessageCircle } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { registrarSalida } from '@/lib/mercado/acciones';
import { urlLogo } from '@/lib/mercado/imagenes';
import type { Salida } from '@/lib/supabase/rows-mercado';
import { useToastStore } from '@/stores/toast';
import { cn } from '@/lib/utils/cn';

const CLAVE = 'brote:salida-sin-aviso';

function sinAviso(dominio: string): boolean {
  try {
    return (JSON.parse(localStorage.getItem(CLAVE) ?? '[]') as string[]).includes(dominio);
  } catch {
    return false;
  }
}

function recordarSinAviso(dominio: string) {
  try {
    const lista = new Set(JSON.parse(localStorage.getItem(CLAVE) ?? '[]') as string[]);
    lista.add(dominio);
    localStorage.setItem(CLAVE, JSON.stringify([...lista].slice(-50)));
  } catch {
    // Una preferencia de este navegador: si no se puede guardar, se vuelve a ver el aviso.
  }
}

/**
 * La salida (08 §4.1, 07 §4.9): una hoja modal, medio segundo de lectura.
 *
 * El clic se registra ANTES de tener la dirección: la URL de destino recién
 * llega del servidor cuando `mercado_salir` guardó el clic con su origen. No
 * hay otra forma de salir del Mercado hacia un comercio.
 *
 * A partir de la tercera vez en 30 días con el mismo comercio —o si la persona
 * pidió no verlo más— se reduce a un toast y la redirección es inmediata: la
 * fricción tiene que enseñar una vez, no molestar siempre.
 */
export function SalidaMercado({ listingId, salida, origen }: { listingId: string; salida: Salida; origen: string }) {
  const t = useTranslations('mercado.salida');
  const router = useRouter();
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [abierto, setAbierto] = useState(true);
  const [noMostrar, setNoMostrar] = useState(false);
  const registrado = useRef(false);
  const dominio = salida.dominio ?? '';
  // Mercado v2: WhatsApp e Instagram comparten dominio entre todas las
  // tiendas (wa.me, instagram.com); "no mostrar más" tiene que ser por tienda.
  const canal = salida.canal ?? 'web';
  const clave = canal === 'web' ? dominio : `${canal}:${salida.comercio}`;
  const destino = canal === 'whatsapp' ? 'WhatsApp' : canal === 'instagram' ? 'Instagram' : dominio;

  useEffect(() => {
    if (registrado.current) return;
    registrado.current = true;
    void registrarSalida(listingId, origen).then((r) => {
      if (!r.ok) return setError(true);
      setUrl(r.url);
      if (salida.vistas_30d >= 2 || sinAviso(clave)) {
        useToastStore.getState().push({ variant: 'default', title: t('toast', { dominio: destino }) });
        window.location.assign(r.url);
      }
    });
  }, [listingId, origen, salida.vistas_30d, clave, destino, t]);

  function volver() {
    setAbierto(false);
    router.push(`/mercado/${salida.slug}`);
  }

  return (
    <Sheet open={abierto} onOpenChange={(o) => (o ? setAbierto(true) : volver())} side="center" title={t('titulo')}>
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-surface-2">
          {urlLogo(salida.logo) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={urlLogo(salida.logo)!} alt="" className="h-11 w-11 rounded-[14px] object-cover" />
          ) : (
            <LogOut className="h-5 w-5 text-muted-foreground" />
          )}
        </span>
        <p className="text-body">
          {canal === 'whatsapp'
            ? t('vasAWhatsapp', { comercio: salida.comercio })
            : canal === 'instagram'
              ? t('vasAInstagram', { comercio: salida.comercio })
              : t('vasA', { dominio })}
        </p>
      </div>
      <p className="mt-3 text-small leading-relaxed text-muted-foreground">{t('responsabilidad', { comercio: salida.comercio })}</p>

      {error ? (
        <p role="alert" className="mt-4 text-small text-brote-coral">
          {t('error')}
        </p>
      ) : (
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          {url ? (
            <a
              href={url}
              rel="noopener noreferrer nofollow"
              onClick={() => noMostrar && recordarSinAviso(clave)}
              className={cn(buttonVariants({ variant: 'primary' }), 'rounded-pill')}
            >
              {canal === 'whatsapp' ? <MessageCircle className="h-4 w-4" /> : canal === 'instagram' ? <Instagram className="h-4 w-4" /> : null}
              {canal === 'whatsapp' ? t('irWhatsapp') : canal === 'instagram' ? t('irInstagram') : t('ir')}
              {canal === 'web' && <ExternalLink className="h-4 w-4" />}
            </a>
          ) : (
            <Skeleton className="h-11 w-full rounded-pill sm:w-36" aria-label={t('preparando')} />
          )}
          <Button variant="secondary" onClick={volver}>
            {t('volver')}
          </Button>
        </div>
      )}

      <label className="mt-4 flex cursor-pointer items-center gap-2 text-caption text-muted-foreground">
        <input type="checkbox" checked={noMostrar} onChange={(e) => setNoMostrar(e.target.checked)} className="accent-[rgb(var(--primary))]" />
        {t('noMostrar')}
      </label>
    </Sheet>
  );
}
