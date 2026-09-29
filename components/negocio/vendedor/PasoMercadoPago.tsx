'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFormatter, useTranslations } from 'next-intl';
import { AlertTriangle, BadgeCheck, CheckCircle2, Loader2, Lock, ShieldCheck } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { formatoPrecio } from '@/lib/mercado/imagenes';
import {
  abrirTienda,
  aceptarTerminosVendedor,
  getEstadoVendedor,
  suscribirVendedor,
} from '@/lib/negocio/vendedor-acciones';
import type { EstadoVendedor } from '@/lib/negocio/vendedor';
import { useToastStore } from '@/stores/toast';
import { cn } from '@/lib/utils/cn';

/**
 * Paso 4: Mercado Pago. En este orden, y es el que pide el negocio:
 *
 *   1. Aceptar los términos para tiendas.
 *   2. VINCULAR la cuenta de Mercado Pago. Brote confirma con Mercado Pago que
 *      es una cuenta activa de Argentina con la identidad cargada. Esta es la
 *      verificación de la tienda.
 *   3. RECIÉN AHÍ, suscribirse: USD 5 por mes en pesos, al dólar oficial del
 *      día, cobrados a esa misma cuenta. Cuando Mercado Pago autoriza el
 *      primer cobro, la tienda abre sola.
 *
 * Brote nunca ve una tarjeta: el pago se hace en Mercado Pago.
 */
export function PasoMercadoPago({
  estado,
  mp,
  aviso,
}: {
  estado: EstadoVendedor;
  mp: { vincular: boolean; cobrar: boolean };
  aviso: { mp: string | null; motivo: string | null };
}) {
  const t = useTranslations('negocio.vendedor.mp');
  const formato = useFormatter();
  const router = useRouter();
  const [terminos, setTerminos] = useState(estado.terminos.aceptados);
  const [guardandoTerminos, setGuardandoTerminos] = useState(false);
  const [yendo, setYendo] = useState(false);
  const [esperando, setEsperando] = useState(aviso.mp === 'volvio' && !estado.abierta);
  const [demora, setDemora] = useState(false);
  const intentos = useRef(0);

  const precio = estado.precio;
  const vinculado = estado.mp.vinculado || !estado.mp.requerido;
  const suscripta = estado.suscripcion?.status === 'activa' || estado.suscripcion?.status === 'en_gracia';

  // Después de pagar, Mercado Pago avisa por webhook: se consulta cada 3 s
  // durante un minuto. Si tarda más, se dice, y el aviso llega igual.
  useEffect(() => {
    if (!esperando) return;
    const h = setInterval(async () => {
      intentos.current += 1;
      const e = await getEstadoVendedor(estado.id);
      if (e?.abierta) {
        clearInterval(h);
        router.replace('/negocio/alta?listo=1');
        router.refresh();
      } else if (intentos.current >= 20) {
        clearInterval(h);
        setDemora(true);
        setEsperando(false);
      }
    }, 3000);
    return () => clearInterval(h);
  }, [esperando, estado.id, router]);

  async function aceptar(v: boolean) {
    if (!v || estado.terminos.aceptados) return setTerminos(v || estado.terminos.aceptados);
    setGuardandoTerminos(true);
    const r = await aceptarTerminosVendedor(estado.id);
    setGuardandoTerminos(false);
    if (!r.ok) {
      useToastStore.getState().push({ variant: 'error', title: t('error') });
      return;
    }
    setTerminos(true);
    router.refresh();
  }

  async function suscribir() {
    setYendo(true);
    const r = await suscribirVendedor(estado.id);
    if (!r.ok) {
      setYendo(false);
      useToastStore.getState().push({ variant: 'error', title: t.has(`errores.${r.error}`) ? t(`errores.${r.error}`) : t('error') });
      return;
    }
    // El pago lo hospeda Mercado Pago: Brote nunca ve una tarjeta.
    window.location.href = r.init_point;
  }

  async function abrirGratis() {
    setYendo(true);
    const r = await abrirTienda(estado.id);
    setYendo(false);
    if (!r.ok) {
      useToastStore.getState().push({ variant: 'error', title: t('errorAbrir') });
      return;
    }
    router.replace('/negocio/alta?listo=1');
    router.refresh();
  }

  if (esperando || (aviso.mp === 'volvio' && estado.suscripcion?.status === 'pendiente' && !demora)) {
    return (
      <div className="rounded-card border border-border bg-surface p-6 text-center" aria-live="polite">
        <Loader2 className="mx-auto h-9 w-9 animate-spin text-primary" />
        <p className="mt-3 font-display text-h3 font-bold">{t('esperandoTitulo')}</p>
        <p className="mt-1 text-small text-muted-foreground">{t('esperandoCuerpo')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {aviso.mp === 'error' && aviso.motivo && (
        <p role="alert" className="flex items-start gap-2 rounded-card border border-brote-coral/40 bg-brote-coral/10 p-3.5 text-small">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-brote-coral" />
          {t.has(`motivos.${aviso.motivo}`) ? t(`motivos.${aviso.motivo}`) : t('motivos.error')}
        </p>
      )}
      {aviso.mp === 'ok' && (
        <p className="flex items-start gap-2 rounded-card border border-brote-green/40 bg-brote-green/10 p-3.5 text-small">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brote-green" />
          {t('vinculadaOk')}
        </p>
      )}
      {demora && (
        <p className="flex items-start gap-2 rounded-card border border-brote-sun/40 bg-brote-sun/10 p-3.5 text-small">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-brote-sun" />
          {t('demora')}
        </p>
      )}

      {/* El precio, dicho una sola vez y completo. */}
      {estado.cobro && (
        <section className="overflow-hidden rounded-card border border-border bg-surface">
          <div className="bg-brote-ink px-5 py-4 text-brote-cream">
            <span className="text-caption font-semibold uppercase tracking-[0.1em] text-brote-cream/70">{t('plan')}</span>
            <p className="mt-1 font-display text-display-l font-bold leading-none">
              {t('usd', { n: precio.usd })}
              <span className="ml-1 text-body font-medium text-brote-cream/70">{t('porMes')}</span>
            </p>
            {precio.ars !== null ? (
              <p className="mt-1.5 text-small text-brote-cream/80">
                {precio.fuente === 'oficial' && precio.fecha
                  ? t('enPesos', {
                      ars: formatoPrecio(precio.ars),
                      fecha: formato.dateTime(new Date(`${precio.fecha}T12:00:00`), { day: 'numeric', month: 'long' }),
                    })
                  : t('enPesosManual', { ars: formatoPrecio(precio.ars) })}
              </p>
            ) : (
              <p className="mt-1.5 text-small text-brote-sun">{t('sinCotizacion')}</p>
            )}
          </div>
          <ul className="space-y-1.5 px-5 py-4 text-small">
            {(['incluye1', 'incluye2', 'incluye3', 'incluye4'] as const).map((k) => (
              <li key={k} className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brote-green" />
                {t(k)}
              </li>
            ))}
          </ul>
          <p className="border-t border-hairline px-5 py-3 text-caption leading-relaxed text-muted-foreground">{t('ajuste')}</p>
        </section>
      )}

      {/* 1 · Términos */}
      <label className="flex cursor-pointer items-start gap-3 rounded-card border border-border bg-surface p-4">
        <input
          type="checkbox"
          checked={terminos}
          disabled={estado.terminos.aceptados || guardandoTerminos}
          onChange={(e) => aceptar(e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 accent-[rgb(var(--primary))]"
        />
        <span className="text-small leading-relaxed">
          {t.rich('terminos', {
            enlace: (c) => (
              <Link href="/legal/negocios" target="_blank" className="link-underline font-semibold text-primary">
                {c}
              </Link>
            ),
          })}
        </span>
      </label>

      {/* 2 · Vincular */}
      {estado.mp.requerido && (
        <section className={cn('rounded-card border bg-surface p-4', estado.mp.vinculado ? 'border-brote-green/40' : 'border-border')}>
          <div className="flex items-start gap-3">
            <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full', estado.mp.vinculado ? 'bg-brote-green/15' : 'bg-surface-2')}>
              {estado.mp.vinculado ? <BadgeCheck className="h-5 w-5 text-brote-green" /> : <ShieldCheck className="h-5 w-5 text-muted-foreground" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-small font-semibold">{estado.mp.vinculado ? t('vinculada', { cuenta: estado.mp.nickname ?? '' }) : t('vincularTitulo')}</p>
              <p className="mt-0.5 text-caption leading-relaxed text-muted-foreground">{estado.mp.vinculado ? t('vinculadaAyuda') : t('vincularAyuda')}</p>
            </div>
          </div>
          {!estado.mp.vinculado &&
            (mp.vincular ? (
              terminos ? (
                <a
                  href={`/api/pagos/mercadopago/vincular?negocio=${estado.id}`}
                  className={cn(buttonVariants({ variant: 'secondary', size: 'lg' }), 'mt-3 w-full rounded-pill')}
                >
                  {t('vincular')}
                </a>
              ) : (
                <span className={cn(buttonVariants({ variant: 'secondary', size: 'lg' }), 'pointer-events-none mt-3 w-full rounded-pill opacity-50')}>
                  <Lock className="h-4 w-4" />
                  {t('vincular')}
                </span>
              )
            ) : (
              <p className="mt-3 rounded-button bg-surface-2 p-3 text-caption text-muted-foreground">{t('noConfigurado')}</p>
            ))}
        </section>
      )}

      {/* 3 · Suscribirse (o abrir gratis, con el cobro apagado) */}
      {estado.cobro ? (
        suscripta ? (
          <p className="flex items-center gap-2 text-small font-semibold text-brote-green">
            <CheckCircle2 className="h-4 w-4" />
            {t('suscripta')}
          </p>
        ) : (
          <div>
            <Button
              onClick={suscribir}
              loading={yendo}
              disabled={!terminos || !vinculado || !mp.cobrar || precio.ars === null}
              block
              size="lg"
              className="rounded-pill"
            >
              {precio.ars !== null ? t('suscribirme', { ars: formatoPrecio(precio.ars) }) : t('suscribirmeSinPrecio')}
            </Button>
            <p className="mt-2 text-center text-caption text-muted-foreground">
              {!terminos ? t('faltaTerminos') : !vinculado ? t('faltaVincular') : !mp.cobrar ? t('noConfigurado') : t('seguridad')}
            </p>
          </div>
        )
      ) : (
        <div>
          <Button onClick={abrirGratis} loading={yendo} disabled={!terminos || !vinculado} block size="lg" className="rounded-pill">
            {t('abrirGratis')}
          </Button>
          <p className="mt-2 text-center text-caption text-muted-foreground">{t('gratisAyuda')}</p>
        </div>
      )}
    </div>
  );
}
