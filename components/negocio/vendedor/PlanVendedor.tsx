'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFormatter, useTranslations } from 'next-intl';
import { AlertTriangle, BadgeCheck, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatoPrecio } from '@/lib/mercado/imagenes';
import type { EstadoPlan } from '@/lib/negocio/plan';
import { cancelarSuscripcionVendedor, suscribirVendedor } from '@/lib/negocio/vendedor-acciones';
import { useToastStore } from '@/stores/toast';
import { cn } from '@/lib/utils/cn';

/**
 * `/negocio/plan` para una tienda nueva: un solo plan, dicho completo. El
 * estado de la suscripción, cuánto se cobra en pesos (y por qué ese número),
 * cuándo es el próximo cobro, qué incluye, y cómo darse de baja. Darse de
 * baja no borra nada: los productos salen del Mercado y vuelven al volver.
 */
export function PlanVendedor({ estado, negocioId }: { estado: EstadoPlan; negocioId: string }) {
  const t = useTranslations('negocio.vendedor.plan');
  const formato = useFormatter();
  const router = useRouter();
  const [ocupado, setOcupado] = useState<'suscribir' | 'cancelar' | null>(null);
  const s = estado.suscripcion;
  const precio = estado.precio_vendedor;
  const activa = s?.status === 'activa';
  const gracia = s?.status === 'en_gracia';
  const usados = estado.uso.listados;
  const tope = estado.limites.listados;

  async function suscribir() {
    setOcupado('suscribir');
    const r = await suscribirVendedor(negocioId);
    if (!r.ok) {
      setOcupado(null);
      useToastStore.getState().push({ variant: 'error', title: t.has(`errores.${r.error}`) ? t(`errores.${r.error}`) : t('errores.error') });
      return;
    }
    // El pago lo hospeda Mercado Pago: Brote nunca ve una tarjeta.
    window.location.href = r.init_point;
  }

  async function cancelar() {
    if (!window.confirm(t('cancelarConfirma'))) return;
    setOcupado('cancelar');
    const r = await cancelarSuscripcionVendedor(negocioId);
    setOcupado(null);
    if (!r.ok) {
      useToastStore.getState().push({ variant: 'error', title: t('errores.cancelar') });
      return;
    }
    useToastStore.getState().push({ variant: 'default', title: t('cancelada') });
    router.refresh();
  }

  return (
    <div className="max-w-xl space-y-6 pb-10">
      <header>
        <span className="eyebrow text-muted-foreground">{t('eyebrow')}</span>
        <h1 className="mt-1 font-display text-h1 font-bold">{t('titulo')}</h1>
      </header>

      {!estado.cobro_activo ? (
        <p className="flex items-start gap-2 rounded-card border border-brote-green/40 bg-brote-green/10 p-4 text-small">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brote-green" />
          {t('gratis')}
        </p>
      ) : activa ? (
        <p className="flex items-start gap-2 rounded-card border border-brote-green/40 bg-brote-green/10 p-4 text-small">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brote-green" />
          {s?.periodo_fin
            ? t('activaHasta', { fecha: formato.dateTime(new Date(s.periodo_fin), { day: 'numeric', month: 'long' }), monto: formatoPrecio(Number(s.monto ?? 0)) })
            : t('activa')}
        </p>
      ) : gracia ? (
        <p className="flex items-start gap-2 rounded-card border border-brote-coral/40 bg-brote-coral/10 p-4 text-small">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-brote-coral" />
          {t('gracia', { fecha: s?.gracia_fin ? formato.dateTime(new Date(s.gracia_fin), { day: 'numeric', month: 'long' }) : '' })}
        </p>
      ) : (
        <p className="flex items-start gap-2 rounded-card border border-brote-sun/40 bg-brote-sun/10 p-4 text-small">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-brote-sun" />
          {t('sinSuscripcion')}
        </p>
      )}

      <section className="overflow-hidden rounded-card border border-border bg-surface">
        <div className="bg-brote-ink px-5 py-4 text-brote-cream">
          <p className="font-display text-display-l font-bold leading-none">
            {t('usd', { n: precio?.usd ?? 5 })}
            <span className="ml-1 text-body font-medium text-brote-cream/70">{t('porMes')}</span>
          </p>
          {precio?.ars != null && (
            <p className="mt-1.5 text-small text-brote-cream/80">
              {precio.fuente === 'oficial' && precio.fecha
                ? t('hoy', {
                    ars: formatoPrecio(precio.ars),
                    fecha: formato.dateTime(new Date(`${precio.fecha}T12:00:00`), { day: 'numeric', month: 'long' }),
                  })
                : t('hoyManual', { ars: formatoPrecio(precio.ars) })}
            </p>
          )}
        </div>
        <dl className="grid grid-cols-2 gap-px bg-border text-small">
          <div className="bg-surface p-4">
            <dt className="text-caption text-muted-foreground">{t('productos')}</dt>
            <dd className="mt-0.5 font-display text-h3 font-bold tnum">
              {usados} <span className="text-small font-medium text-muted-foreground">/ {tope}</span>
            </dd>
          </div>
          <div className="bg-surface p-4">
            <dt className="text-caption text-muted-foreground">{t('equipo')}</dt>
            <dd className="mt-0.5 font-display text-h3 font-bold tnum">
              {estado.uso.miembros} <span className="text-small font-medium text-muted-foreground">/ {estado.limites.miembros}</span>
            </dd>
          </div>
        </dl>
        <p className="border-t border-hairline px-5 py-3 text-caption leading-relaxed text-muted-foreground">{t('ajuste')}</p>
      </section>

      {estado.mp?.vinculado && (
        <p className="flex items-center gap-2 text-small text-muted-foreground">
          <BadgeCheck className="h-4 w-4 text-brote-aqua" />
          {t('cuenta', { cuenta: estado.mp.nickname ?? '' })}
        </p>
      )}

      {estado.cobro_activo && (
        <div className="space-y-3">
          {!activa && !gracia && (
            <Button onClick={suscribir} loading={ocupado === 'suscribir'} disabled={!!ocupado} block size="lg" className="rounded-pill">
              {t('suscribirme')}
            </Button>
          )}
          {gracia && (
            <a
              href="https://www.mercadopago.com.ar/subscriptions"
              target="_blank"
              rel="noopener noreferrer"
              className={cn('press flex h-12 w-full items-center justify-center rounded-pill bg-primary text-body font-semibold text-primary-foreground shadow-crisp')}
            >
              {t('actualizarPago')}
            </a>
          )}
          {(activa || gracia) && (
            <div className="rounded-card border border-border p-4 text-small">
              <p className="font-semibold">{t('bajaTitulo')}</p>
              <p className="mt-1 text-muted-foreground">{t('bajaCuerpo')}</p>
              <Button variant="ghost" size="sm" onClick={cancelar} loading={ocupado === 'cancelar'} disabled={!!ocupado} className="-ml-3 mt-2 text-brote-coral">
                {t('cancelar')}
              </Button>
            </div>
          )}
        </div>
      )}

      <p className="text-caption leading-relaxed text-muted-foreground">
        {t.rich('legales', {
          enlace: (c) => (
            <Link href="/legal/negocios" className="link-underline font-semibold">
              {c}
            </Link>
          ),
        })}
      </p>
    </div>
  );
}
