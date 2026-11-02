'use client';

/**
 * One advertising space (PLAN F13.3, Publicidad v2 — 0134).
 *
 * What it does, in order:
 *   1. Asks the policy: may this person see an ad on this route and in this
 *      placement, is the placement on, and are they under today's caps?
 *      If not, it renders NOTHING — no empty box, no network call.
 *   2. Picks the provider for the placement: a direct sponsor (our own,
 *      `anuncio_elegir`), AdSense, or none.
 *   3. Waits until the space is about to scroll into view. Only then does it
 *      load AdSense (once for the whole app) and ask for the ad. An ad nobody
 *      scrolls to costs nothing and does not drag down viewability.
 *   4. If AdSense has nothing to show (`data-ad-status="unfilled"`) the whole
 *      space folds away, label included.
 *
 * Every ad says "Publicidad" (AdSense allows "Anuncios"/"Publicidad"-type
 * labels and forbids anything that invites a click) and offers Brote+ to
 * remove ads, set apart from the ad itself.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useAds } from './AdsProvider';
import { AnuncioDirecto, type AnuncioDirectoDatos } from './AnuncioDirecto';
import { dentroDeTopes, proveedorPara, type Placement } from '@/lib/ads/policy';
import {
  ADSENSE_CLIENT,
  SLOT_IDS,
  adsenseListo,
  cargarAdsense,
  contarAnuncio,
  leerContadores,
  registrarAnuncio,
} from '@/lib/ads/runtime';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils/cn';

/** Reserved heights while an AdSense unit loads (no layout jump). */
const MIN_HEIGHT: Record<Placement, number> = {
  'news-feed': 120,
  'news-article': 250,
  'ranking-footer': 120,
  'catalog-footer': 120,
  guia: 250,
  moment: 0,
};

async function elegirDirecto(placement: Placement): Promise<AnuncioDirectoDatos | null> {
  const { data, error } = await createClient().rpc('anuncio_elegir', { p_ubicacion: placement });
  if (error || !data) return null;
  return data as AnuncioDirectoDatos;
}

export function AdSlot({
  placement,
  className,
  label = true,
}: {
  placement: Placement;
  className?: string;
  /** Ads must be labelled so they are never mistaken for our own content. */
  label?: boolean;
}) {
  const { canRenderHere, decision, estado, anonymous } = useAds();
  const contenedor = useRef<HTMLDivElement>(null);
  const [cerca, setCerca] = useState(false);
  const [plegado, setPlegado] = useState(false);
  // Caps are read once per mount: an ad that already got its turn keeps it.
  const [cupo] = useState(() => (typeof window === 'undefined' ? false : dentroDeTopes(leerContadores(), estado.config)));

  const proveedor = canRenderHere
    ? proveedorPara(placement, estado.config, { hayDirecto: estado.directos, adsenseListo: adsenseListo(placement), anonymous })
    : null;
  const activo = !!proveedor && cupo && !plegado;
  const plegar = useCallback(() => setPlegado(true), []);

  const directo = useQuery({
    queryKey: ['anuncio-directo', placement],
    queryFn: () => elegirDirecto(placement),
    enabled: activo && proveedor === 'directo' && cerca,
    staleTime: 5 * 60_000,
  });

  // 1. Wait until it is about to be seen.
  useEffect(() => {
    if (!activo || cerca) return;
    const el = contenedor.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setCerca(true);
      return;
    }
    const io = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) {
          setCerca(true);
          io.disconnect();
        }
      },
      { rootMargin: '400px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [activo, cerca]);

  // A direct slot with no sponsor for this person folds away.
  useEffect(() => {
    if (proveedor === 'directo' && directo.isFetched && !directo.data) setPlegado(true);
  }, [proveedor, directo.isFetched, directo.data]);

  if (!activo) return null;

  return (
    <div ref={contenedor} className={cn('brote-ad w-full', className)} data-ubicacion={placement}>
      {label && (
        <div className="mb-1.5 flex items-center justify-between px-0.5">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {proveedor === 'directo' ? 'Patrocinado' : 'Publicidad'}
          </span>
          {!anonymous && (
            <Link href="/brote-plus" className="text-[10px] font-medium text-muted-foreground underline-offset-2 hover:text-primary hover:underline">
              Quitar anuncios
            </Link>
          )}
        </div>
      )}
      {proveedor === 'adsense' ? (
        <UnidadAdsense placement={placement} cerca={cerca} personalizado={decision.personalized} onVacio={plegar} />
      ) : directo.data ? (
        <AnuncioDirecto anuncio={directo.data} placement={placement} />
      ) : (
        <div className="skeleton h-24 rounded-card" aria-hidden />
      )}
    </div>
  );
}

function UnidadAdsense({
  placement,
  cerca,
  personalizado,
  onVacio,
}: {
  placement: Placement;
  cerca: boolean;
  personalizado: boolean;
  onVacio: () => void;
}) {
  const ins = useRef<HTMLModElement>(null);
  const pedido = useRef(false);

  useEffect(() => {
    if (!cerca || pedido.current) return;
    let vivo = true;
    void cargarAdsense(personalizado).then((ok) => {
      const el = ins.current;
      if (!vivo || !el) return;
      if (!ok) return onVacio(); // script blocked: fold quietly
      if (el.getAttribute('data-adsbygoogle-status')) return; // strict-mode double run
      try {
        const w = window as unknown as { adsbygoogle?: unknown[] };
        (w.adsbygoogle = w.adsbygoogle || []).push({});
        pedido.current = true;
        contarAnuncio();
        registrarAnuncio({ u: placement, p: 'adsense', e: 'pedido' });
      } catch {
        onVacio();
      }
    });
    return () => {
      vivo = false;
    };
  }, [cerca, personalizado, placement, onVacio]);

  // AdSense marks the unit `data-ad-status="filled" | "unfilled"`.
  useEffect(() => {
    const el = ins.current;
    if (!el) return;
    const mo = new MutationObserver(() => {
      const st = el.getAttribute('data-ad-status');
      if (st === 'filled') {
        registrarAnuncio({ u: placement, p: 'adsense', e: 'lleno' });
        mo.disconnect();
      } else if (st === 'unfilled') {
        registrarAnuncio({ u: placement, p: 'adsense', e: 'vacio' });
        mo.disconnect();
        onVacio();
      }
    });
    mo.observe(el, { attributes: true, attributeFilter: ['data-ad-status'] });
    return () => mo.disconnect();
  }, [placement, onVacio]);

  return (
    <ins
      ref={ins}
      className="adsbygoogle block"
      style={{ display: 'block', minHeight: MIN_HEIGHT[placement] }}
      data-ad-client={ADSENSE_CLIENT}
      data-ad-slot={SLOT_IDS[placement]}
      data-ad-format={placement === 'news-feed' ? 'fluid' : 'auto'}
      {...(placement === 'news-feed' && process.env.NEXT_PUBLIC_ADSLOT_NEWS_FEED_LAYOUT_KEY
        ? { 'data-ad-layout-key': process.env.NEXT_PUBLIC_ADSLOT_NEWS_FEED_LAYOUT_KEY }
        : {})}
      data-full-width-responsive="true"
    />
  );
}

/**
 * The "moment" card: a calm, dismissible card at a natural stopping point,
 * with a DIRECT sponsor only. Never a blocking pop-over: interstitials that
 * hijack navigation annoy people, and AdSense forbids Google ads in windows
 * the person did not open. If no sponsor matches this person, it never opens.
 */
export function MomentAd() {
  const { momentOpen, dismissMoment, canRenderHere, estado } = useAds();
  const habilitada = momentOpen && canRenderHere && !!estado.config.ubicaciones.moment?.activa;
  const q = useQuery({
    queryKey: ['anuncio-directo', 'moment', momentOpen],
    queryFn: () => elegirDirecto('moment'),
    enabled: habilitada,
    staleTime: 0,
  });

  useEffect(() => {
    if (habilitada && q.isFetched && !q.data) dismissMoment();
  }, [habilitada, q.isFetched, q.data, dismissMoment]);

  if (!habilitada || !q.data) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] px-3 pb-24 lg:pb-4">
      <div className="mx-auto max-w-md rounded-sheet border border-border bg-surface p-3 shadow-soft-lg">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Patrocinado</span>
          <button
            onClick={dismissMoment}
            className="rounded-full px-2 py-1 text-caption font-medium text-muted-foreground hover:text-foreground"
            aria-label="Cerrar anuncio"
          >
            Cerrar
          </button>
        </div>
        <AnuncioDirecto anuncio={q.data} placement="moment" />
        <Link href="/brote-plus" className="mt-3 block text-center text-caption font-medium text-primary" onClick={dismissMoment}>
          Con Brote+ no ves más anuncios
        </Link>
      </div>
    </div>
  );
}
