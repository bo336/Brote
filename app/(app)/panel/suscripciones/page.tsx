'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Circle, Copy, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { CandadoPanel, usePanelPass } from '@/components/panel/PanelPass';
import { Bloque, Cifra, n } from '@/components/panel/analitica/piezas';
import { adminSetSetting, adminSuscripciones, type PanelSuscripciones } from '@/lib/api/admin';
import { estadoCobroServidor } from '@/lib/pagos/plus-acciones';
import { toast } from '@/stores/toast';
import { cn } from '@/lib/utils/cn';

/**
 * `/panel/suscripciones` — las tres suscripciones de Brote (LANZAMIENTO F5).
 *
 * Arriba, lo que falta para poder cobrar (sin mostrar ningún secreto). Después,
 * cada producto con su interruptor, su precio y sus números. Abajo, lo último
 * que pasó. Los precios en dólares se cobran en pesos al oficial del día.
 */

const pesos = (v: number | null | undefined) =>
  v == null ? '—' : new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(v);

const ESTADO: Record<string, string> = {
  authorized: 'activa',
  pending: 'pendiente',
  paused: 'pausada',
  cancelled: 'baja',
  expired: 'vencida',
  activa: 'activa',
  pendiente: 'pendiente',
  en_gracia: 'cobro rechazado',
  pausada: 'pausada',
  cancelada: 'baja',
  vencida: 'vencida',
};

type Servidor = Awaited<ReturnType<typeof estadoCobroServidor>>;

export default function SuscripcionesPage() {
  const { pass, setPass } = usePanelPass();
  const [d, setD] = useState<PanelSuscripciones | null>(null);
  const [srv, setSrv] = useState<Servidor | null>(null);
  const [cargando, setCargando] = useState(false);

  const cargar = useCallback(async () => {
    if (!pass) return;
    setCargando(true);
    const [a, b] = await Promise.all([adminSuscripciones(pass), estadoCobroServidor(pass)]);
    setCargando(false);
    if (!a) return setPass('');
    setD(a);
    setSrv(b);
  }, [pass, setPass]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  if (!pass) return <CandadoPanel verificar={async (p) => !!(await adminSuscripciones(p))} />;

  async function guardar(key: string, value: boolean | number) {
    const r = await adminSetSetting(pass, key, value);
    if (!r.ok) return toast.error('No se pudo guardar', r.error);
    toast.success('Guardado');
    await cargar();
  }

  const ajuste = (k: string) => d?.ajustes[k]?.value;
  const listo = !!(srv?.mp_token && srv?.mp_webhook && srv?.service_role);

  return (
    <div className="space-y-5 py-4 pb-16">
      <div className="flex items-center justify-between gap-3">
        <Link href="/panel" className="inline-flex items-center gap-1.5 text-small text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Panel
        </Link>
        <Button variant="secondary" size="sm" onClick={() => void cargar()} loading={cargando}>
          <RefreshCw className="h-4 w-4" /> Actualizar
        </Button>
      </div>

      <header>
        <p className="eyebrow text-primary">Suscripciones</p>
        <h1 className="font-display text-display-l font-extrabold">Lo que se cobra</h1>
        <p className="mt-1 text-small text-muted-foreground">
          Brote+ para personas, la suscripción de las tiendas del Mercado y los planes de las empresas que mejoran.
        </p>
      </header>

      {!d ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <>
          <Bloque eyebrow="Antes de cobrar" titulo={listo ? 'Mercado Pago está listo' : 'Lo que falta configurar'}>
            <ul className="space-y-2 text-small">
              <Paso ok={!!srv?.mp_token} texto="MP_ACCESS_TOKEN en Vercel (el token de la cuenta de Brote)." />
              <Paso ok={!!srv?.mp_webhook} texto="MP_WEBHOOK_SECRET en Vercel (la clave de la firma de los avisos)." />
              <Paso ok={!!srv?.service_role} texto="SUPABASE_SERVICE_ROLE_KEY en Vercel." />
              <Paso ok={!!srv?.mp_vincular} texto="MP_CLIENT_ID y MP_CLIENT_SECRET (para que las tiendas vinculen su cuenta)." />
              <Paso ok={!!d.tipo_cambio} texto={d.tipo_cambio ? `Dólar oficial: ${pesos(d.tipo_cambio.venta)} (${d.tipo_cambio.fecha}).` : 'Sin dólar oficial de los últimos 10 días.'} />
            </ul>
            {srv?.webhook_url && (
              <div className="mt-3 rounded-button border border-border bg-surface-2 p-3">
                <p className="text-caption text-muted-foreground">En Mercado Pago → Tus integraciones → Webhooks, esta URL (eventos: Planes y suscripciones, Pagos):</p>
                <div className="mt-1 flex items-center gap-2">
                  <code className="min-w-0 flex-1 truncate text-caption">{srv.webhook_url}</code>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label="Copiar"
                    onClick={() => {
                      void navigator.clipboard.writeText(srv.webhook_url ?? '');
                      toast.success('Copiada');
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            {d.eventos_sin_procesar > 0 && (
              <p className="mt-3 text-caption text-brote-coral">
                {d.eventos_sin_procesar} avisos de Mercado Pago sin procesar hace más de 10 minutos: el cron los reintenta.
              </p>
            )}
          </Bloque>

          {/* ── Brote+ ── */}
          <Bloque eyebrow="Personas" titulo="Brote+">
            <Interruptor
              titulo="A la venta"
              detalle="Apagado: la pantalla muestra los beneficios y «muy pronto», sin botón."
              valor={ajuste('plus_venta_activa') === true}
              onCambiar={(v) => guardar('plus_venta_activa', v)}
            />
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <PrecioUsd etiqueta="Mensual" clave="plus_usd_mes" usd={Number(ajuste('plus_usd_mes') ?? 0)} ars={d.precios.plus_mes.ars} onGuardar={guardar} />
              <PrecioUsd etiqueta="Anual" clave="plus_usd_anio" usd={Number(ajuste('plus_usd_anio') ?? 0)} ars={d.precios.plus_anio.ars} onGuardar={guardar} />
            </div>
            <div className="mt-4 grid grid-cols-2 divide-x divide-y divide-hairline overflow-hidden rounded-button border border-border sm:grid-cols-4">
              <Cifra etiqueta="Activas" valor={n(d.plus.activas)} detalle={`${n(d.plus.anuales)} anuales`} />
              <Cifra etiqueta="Con beneficios hoy" valor={n(d.plus.con_beneficio)} />
              <Cifra etiqueta="Bajas 30 días" valor={n(d.plus.bajas_30d)} detalle={`${n(d.plus.pausadas)} pausadas`} />
              <Cifra etiqueta="Ingreso mensual" valor={pesos(d.plus.ingreso_mes_ars)} detalle="estimado" />
            </div>
          </Bloque>

          {/* ── Tiendas ── */}
          <Bloque eyebrow="Mercado" titulo="Tiendas">
            <Interruptor
              titulo="Cobrar la suscripción"
              detalle="Apagado: las tiendas abren sin pagar."
              valor={ajuste('mercado_cobro_vendedores') !== false}
              onCambiar={(v) => guardar('mercado_cobro_vendedores', v)}
            />
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <PrecioUsd etiqueta="Por mes" clave="mercado_vendedor_usd" usd={Number(ajuste('mercado_vendedor_usd') ?? 5)} ars={d.precios.tienda.ars} onGuardar={guardar} />
            </div>
            <NumerosPlan datos={d.negocios.vendedor} />
          </Bloque>

          {/* ── Empresas que mejoran ── */}
          <Bloque eyebrow="Empresas que mejoran" titulo="Planes Semilla, Raíz y Bosque">
            <Interruptor
              titulo="Cobro activo"
              detalle="Apagado = modo fundador: todo funciona sin tarjeta y sin prueba."
              valor={ajuste('negocios_cobro_activo') === true}
              onCambiar={(v) => guardar('negocios_cobro_activo', v)}
            />
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {(['semilla', 'raiz', 'bosque'] as const).map((p) => (
                <PrecioPesos
                  key={p}
                  etiqueta={p === 'raiz' ? 'Raíz' : p[0]!.toUpperCase() + p.slice(1)}
                  clave={`negocios_precio_${p}`}
                  ars={Number(ajuste(`negocios_precio_${p}`) ?? 0)}
                  onGuardar={guardar}
                />
              ))}
            </div>
            {(['semilla', 'raiz', 'bosque'] as const).map((p) =>
              d.negocios[p] ? (
                <div key={p} className="mt-3">
                  <p className="text-caption font-semibold">{p === 'raiz' ? 'Raíz' : p[0]!.toUpperCase() + p.slice(1)}</p>
                  <NumerosPlan datos={d.negocios[p]} />
                </div>
              ) : null,
            )}
          </Bloque>

          <Bloque eyebrow="Lo último" titulo="Movimientos">
            {d.ultimas.length === 0 ? (
              <p className="text-small text-muted-foreground">Todavía no hubo ninguna suscripción.</p>
            ) : (
              <ul className="divide-y divide-hairline">
                {d.ultimas.map((u, i) => (
                  <li key={i} className="flex items-center gap-3 py-2.5 text-small">
                    <span className="w-16 shrink-0 text-caption text-muted-foreground">{new Date(u.cuando).toLocaleDateString('es-AR')}</span>
                    <span className="min-w-0 flex-1 truncate">
                      <span className="font-medium">{u.quien ?? '—'}</span>
                      <span className="text-muted-foreground">
                        {' · '}
                        {u.producto === 'plus' ? `Brote+ ${u.detalle}` : u.producto === 'tienda' ? 'Tienda' : `Plan ${u.detalle}`}
                      </span>
                    </span>
                    <span
                      className={cn(
                        'shrink-0 rounded-pill px-2 py-0.5 text-caption font-semibold',
                        ['authorized', 'activa'].includes(u.estado)
                          ? 'bg-primary/15 text-primary'
                          : ['en_gracia', 'paused', 'pausada'].includes(u.estado)
                            ? 'bg-brote-coral/15 text-brote-coral'
                            : 'bg-surface-2 text-muted-foreground',
                      )}
                    >
                      {ESTADO[u.estado] ?? u.estado}
                    </span>
                    <span className="w-20 shrink-0 text-right tnum">{pesos(u.monto)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Bloque>
        </>
      )}
    </div>
  );
}

function Paso({ ok, texto }: { ok: boolean; texto: string }) {
  return (
    <li className="flex items-start gap-2">
      {ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />}
      <span className={ok ? '' : 'text-muted-foreground'}>{texto}</span>
    </li>
  );
}

function Interruptor({ titulo, detalle, valor, onCambiar }: { titulo: string; detalle: string; valor: boolean; onCambiar: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-button border border-border p-3">
      <span className="min-w-0 flex-1">
        <span className="block text-small font-semibold">{titulo}</span>
        <span className="block text-caption text-muted-foreground">{detalle}</span>
      </span>
      <Switch checked={valor} onCheckedChange={onCambiar} />
    </label>
  );
}

function PrecioUsd({
  etiqueta,
  clave,
  usd,
  ars,
  onGuardar,
}: {
  etiqueta: string;
  clave: string;
  usd: number;
  ars: number | null;
  onGuardar: (k: string, v: number) => void;
}) {
  const [v, setV] = useState(String(usd));
  useEffect(() => setV(String(usd)), [usd]);
  const num = Number(v.replace(',', '.'));
  const sucio = v.trim() !== '' && Number.isFinite(num) && num > 0 && num !== usd;
  return (
    <div className="rounded-button border border-border p-3">
      <p className="text-caption text-muted-foreground">{etiqueta}</p>
      <div className="mt-1 flex items-center gap-2">
        <span className="text-small font-semibold">USD</span>
        <Input value={v} onChange={(e) => setV(e.target.value)} inputMode="decimal" className="h-9 w-24 text-small tnum" aria-label={`${etiqueta} en dólares`} />
        <Button size="sm" variant="secondary" disabled={!sucio} onClick={() => onGuardar(clave, num)}>
          Guardar
        </Button>
      </div>
      <p className="mt-1 text-caption text-muted-foreground">Hoy se cobra {pesos(ars)}</p>
    </div>
  );
}

function PrecioPesos({ etiqueta, clave, ars, onGuardar }: { etiqueta: string; clave: string; ars: number; onGuardar: (k: string, v: number) => void }) {
  const [v, setV] = useState(String(ars));
  useEffect(() => setV(String(ars)), [ars]);
  const num = Number(v);
  const sucio = v.trim() !== '' && Number.isFinite(num) && num >= 0 && num !== ars;
  return (
    <div className="rounded-button border border-border p-3">
      <p className="text-caption text-muted-foreground">{etiqueta} · por mes</p>
      <div className="mt-1 flex items-center gap-2">
        <span className="text-small font-semibold">$</span>
        <Input value={v} onChange={(e) => setV(e.target.value)} inputMode="numeric" className="h-9 w-28 text-small tnum" aria-label={`${etiqueta} en pesos`} />
        <Button size="sm" variant="secondary" disabled={!sucio} onClick={() => onGuardar(clave, num)}>
          Guardar
        </Button>
      </div>
      <p className="mt-1 text-caption text-muted-foreground">{ars > 0 ? pesos(ars) : 'Sin precio: no se puede contratar.'}</p>
    </div>
  );
}

function NumerosPlan({ datos }: { datos?: { activas: number; en_gracia: number; pendientes: number; bajas_30d: number; ingreso_mes_ars: number } }) {
  const x = datos ?? { activas: 0, en_gracia: 0, pendientes: 0, bajas_30d: 0, ingreso_mes_ars: 0 };
  return (
    <div className="mt-3 grid grid-cols-2 divide-x divide-y divide-hairline overflow-hidden rounded-button border border-border sm:grid-cols-4">
      <Cifra etiqueta="Activas" valor={n(x.activas)} />
      <Cifra etiqueta="Cobro rechazado" valor={n(x.en_gracia)} />
      <Cifra etiqueta="Bajas 30 días" valor={n(x.bajas_30d)} />
      <Cifra etiqueta="Ingreso mensual" valor={pesos(x.ingreso_mes_ars)} />
    </div>
  );
}
