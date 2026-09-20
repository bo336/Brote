'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Check, Minus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cancelarSuscripcion, iniciarSuscripcion } from '@/lib/negocio/plan-acciones';
import { LIMITES, PLANES, diasHasta, situacion, textoTope, type BizPlan, type EstadoPlan } from '@/lib/negocio/plan';
import { toast } from '@/stores/toast';
import { cn } from '@/lib/utils/cn';

/**
 * `/negocio/plan` (09 §2 y §4.3).
 *
 * El botón dice "Suscribirme", no "MercadoPago": MercadoPago es el procesador,
 * no el producto (F15.1 del repo). Abajo, en chico, quién procesa el pago —
 * como sello de confianza, no como marca.
 *
 * La prueba es de 14 días SIN TARJETA. Con el cobro apagado no hay ni prueba
 * ni tarjeta: es el modo fundador, y la pantalla lo dice en vez de esconderlo.
 */
/** Los motivos que sabemos explicar; cualquier otro se cuenta como "no disponible". */
const MOTIVOS = ['cobro_apagado', 'precio_sin_definir', 'solo_owner', 'no_aprobada', 'no_configurado', 'sin_suscripcion'];

function motivo(e: string): string {
  return MOTIVOS.includes(e) ? e : 'no_disponible';
}

export function PlanNegocio({ estado, negocioId }: { estado: EstadoPlan; negocioId: string }) {
  const t = useTranslations('negocio.plan');
  const params = useSearchParams();
  const [ocupado, setOcupado] = useState<BizPlan | 'cancelar' | null>(null);
  const situacionActual = situacion(estado);
  const esOwner = estado.rol === 'owner';
  const pendiente = params.get('estado') === 'pendiente';

  async function suscribir(plan: BizPlan) {
    setOcupado(plan);
    const r = await iniciarSuscripcion(negocioId, plan);
    setOcupado(null);
    if (!r.ok) {
      toast.error(t('errorTitulo'), t(`error.${motivo(r.error)}`));
      return;
    }
    // MercadoPago hospeda todo el paso de pago: Brote nunca ve una tarjeta.
    if (r.init_point) window.location.href = r.init_point;
  }

  async function cancelar() {
    setOcupado('cancelar');
    const r = await cancelarSuscripcion(negocioId);
    setOcupado(null);
    if (!r.ok) return toast.error(t('errorTitulo'), t('error.no_disponible'));
    toast.success(t('cancelada'), t('canceladaDetalle'));
  }

  return (
    <div className="space-y-7 pb-10">
      <header>
        <span className="eyebrow text-muted-foreground">{t('eyebrow')}</span>
        <h1 className="mt-1 font-display text-h1 font-bold">{t('titulo')}</h1>
        <p className="mt-2 max-w-prose text-small leading-relaxed text-muted-foreground">{t('bajada')}</p>
      </header>

      {pendiente && (
        <p className="rounded-card border border-border bg-surface p-4 text-small leading-relaxed">{t('vueltaPendiente')}</p>
      )}

      {/* La situación, en una banda. Una sola, arriba, siempre honesta. */}
      <Situacion estado={estado} />

      <div className="grid gap-3 lg:grid-cols-3">
        {PLANES.map((p) => {
          const lim = LIMITES[p];
          const precio = estado.precios[p];
          const actual = estado.plan === p && (situacionActual === 'activa' || situacionActual === 'gracia');
          return (
            <section
              key={p}
              className={cn(
                'flex flex-col rounded-card border bg-surface p-5',
                actual ? 'border-primary' : 'border-border',
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-h3 font-bold">{t(`planes.${p}.nombre`)}</h2>
                {actual && <span className="eyebrow text-primary">{t('tuPlan')}</span>}
              </div>
              <p className="mt-1 text-small leading-relaxed text-muted-foreground">{t(`planes.${p}.para`)}</p>

              <p className="mt-3 font-display text-h2 font-extrabold tnum">
                {precio > 0 ? `$ ${precio.toLocaleString('es-AR')}` : t('precioSinDefinir')}
                {precio > 0 && <span className="ml-1 text-small font-medium text-muted-foreground">{t('porMes')}</span>}
              </p>

              <ul className="mt-4 flex-1 space-y-1.5 text-small">
                <Fila
                  si
                  texto={
                    textoTope(lim.listados)
                      ? t('fila.listados', { n: textoTope(lim.listados)! })
                      : t('fila.listadosSinTope')
                  }
                />
                <Fila si texto={t('fila.objetivos', { n: lim.objetivos })} />
                <Fila si texto={t('fila.replanificaciones', { n: lim.replanificaciones })} />
                <Fila si texto={t('fila.miembros', { n: lim.miembros })} />
                <Fila si texto={t(`fila.analitica.${lim.analitica}`)} />
                <Fila si={lim.historial_publico} texto={t('fila.historial')} />
                <Fila si={lim.acelerada} texto={t('fila.acelerada')} />
                <Fila si texto={t('fila.kit')} />
                {lim.destacados > 0 && <Fila si texto={t('fila.destacado')} />}
              </ul>

              {estado.cobro_activo && esOwner && !actual && (
                <Button
                  className="mt-4"
                  block
                  variant={p === 'raiz' ? 'primary' : 'secondary'}
                  loading={ocupado === p}
                  disabled={precio <= 0 || ocupado !== null}
                  onClick={() => void suscribir(p)}
                >
                  {t('suscribirme')}
                </Button>
              )}
            </section>
          );
        })}
      </div>

      {estado.cobro_activo && (
        <p className="text-caption text-muted-foreground">{t('procesaMercadoPago')}</p>
      )}

      {/* Estado de la suscripción y cómo darla de baja. Sin letra chica. */}
      {estado.suscripcion && (
        <section className="rounded-card border border-border bg-surface p-5">
          <h2 className="font-display text-h3 font-bold">{t('tuSuscripcion')}</h2>
          <dl className="mt-3 space-y-1.5 text-small">
            <Dato termino={t('estado')} valor={t(`estados.${estado.suscripcion.status}`)} />
            {estado.suscripcion.monto != null && (
              <Dato termino={t('monto')} valor={`$ ${Number(estado.suscripcion.monto).toLocaleString('es-AR')}`} />
            )}
            {estado.suscripcion.periodo_fin && (
              <Dato
                termino={t('proximoCobro')}
                valor={new Date(estado.suscripcion.periodo_fin).toLocaleDateString('es-AR')}
              />
            )}
            {estado.suscripcion.precio_bloqueado && <Dato termino={t('precioBloqueado')} valor={t('doceMeses')} />}
          </dl>
          {esOwner && ['activa', 'en_gracia', 'pendiente'].includes(estado.suscripcion.status) && (
            <>
              <Button className="mt-4" variant="ghost" size="sm" loading={ocupado === 'cancelar'} onClick={() => void cancelar()}>
                {t('darDeBaja')}
              </Button>
              <p className="mt-1.5 text-caption leading-relaxed text-muted-foreground">{t('bajaDetalle')}</p>
            </>
          )}
        </section>
      )}

      <p className="text-caption leading-relaxed text-muted-foreground">
        {t('nadaSeBorra')}{' '}
        <Link href="/legal/niveles" className="link-underline">
          {t('comoFuncionanNiveles')}
        </Link>
      </p>
    </div>
  );
}

function Situacion({ estado }: { estado: EstadoPlan }) {
  const t = useTranslations('negocio.plan');
  const s = situacion(estado);
  const dias = diasHasta(estado.prueba_fin);

  const texto =
    s === 'fundador'
      ? t('situacion.fundador')
      : s === 'prueba'
        ? t('situacion.prueba', { dias })
        : s === 'gracia'
          ? t('situacion.gracia', { dias: diasHasta(estado.suscripcion?.gracia_fin ?? null) })
          : s === 'activa'
            ? t('situacion.activa')
            : t('situacion.sinPlan');

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-card border p-4',
        s === 'gracia' || s === 'sin_plan' ? 'border-brote-sun/40 bg-brote-sun/10' : 'border-border bg-surface',
      )}
    >
      {estado.fundador && <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brote-sun" />}
      <div className="min-w-0">
        <p className="text-small font-semibold">{texto}</p>
        {estado.fundador && <p className="mt-1 text-caption leading-relaxed text-muted-foreground">{t('fundadora')}</p>}
        <p className="mt-1 text-caption leading-relaxed text-muted-foreground">
          {t('usoActual', {
            listados: estado.uso.listados,
            tope: textoTope(estado.limites.listados) ?? t('ilimitados'),
            objetivos: estado.uso.objetivos,
            topeObjetivos: estado.limites.objetivos,
          })}
        </p>
      </div>
    </div>
  );
}

function Fila({ si, texto }: { si: boolean; texto: string }) {
  return (
    <li className={cn('flex items-start gap-2', !si && 'text-muted-foreground')}>
      {si ? (
        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      ) : (
        <Minus className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/60" />
      )}
      <span>{texto}</span>
    </li>
  );
}

function Dato({ termino, valor }: { termino: string; valor: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted-foreground">{termino}</dt>
      <dd className="font-medium tnum">{valor}</dd>
    </div>
  );
}
