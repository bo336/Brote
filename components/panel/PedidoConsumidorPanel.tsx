'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Etiqueta, fechaHora, hace, type Tono } from '@/components/panel/ui';
import { adminConsumidorResolver, type PedidoConsumidorPanel } from '@/lib/api/admin';
import { panelArrepentimientoPlus, panelBajaNegocio, panelBajaPlus } from '@/lib/consumidor/panel-acciones';
import { DIAS_ARREPENTIMIENTO, ESTADO_PEDIDO, PLAN_NEGOCIO, SERVICIOS } from '@/lib/consumidor/reglas';
import { toast } from '@/stores/toast';
import { cn } from '@/lib/utils/cn';

/** Un pedido de arrepentimiento o de baja en `/panel/consumidor`, con sus botones. */

const TONO: Record<string, Tono> = { recibida: 'atencion', en_proceso: 'info', resuelta: 'ok', rechazada: 'mal' };
const ESTADO_SUB: Record<string, string> = {
  authorized: 'activa', pending: 'pendiente', paused: 'pausada', cancelled: 'dada de baja', expired: 'vencida',
  activa: 'activa', pendiente: 'pendiente', en_gracia: 'cobro rechazado', pausada: 'pausada', cancelada: 'dada de baja', vencida: 'vencida',
};
const FALLO: Record<string, string> = {
  mp_error: 'Mercado Pago no aceptó la baja.',
  mp_pagos: 'Mercado Pago no devolvió la lista de cobros.',
  sin_suscripcion: 'No apareció la suscripción en Mercado Pago.',
  sin_datos: 'Faltaba configurar el cobro en el servidor.',
};
const SERVICIO = Object.fromEntries(SERVICIOS.map((s) => [s.v, s.label])) as Record<string, string>;
const pesos = (v: number | null | undefined) =>
  v == null ? '—' : new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(v).replace(/\s/g, ' ');

export function Pedido({ f, pass, onCambio }: { f: PedidoConsumidorPanel; pass: string; onCambio: () => void }) {
  const [texto, setTexto] = useState('');
  const [ocupado, setOcupado] = useState<string | null>(null);
  const reembolsos = (f.detalle?.reembolsos as { id: string; monto: number | null }[] | undefined) ?? [];
  const falloDetalle = f.detalle?.fallo as string | undefined;
  const enPlazo = f.plus ? f.plus.dias <= DIAS_ARREPENTIMIENTO : false;
  const plusActiva = f.plus && ['authorized', 'paused', 'pending'].includes(f.plus.estado);

  async function hacer(clave: string, accion: () => Promise<{ ok: true; mensaje: string } | { ok: false; error: string }>) {
    setOcupado(clave);
    const r = await accion().catch(() => ({ ok: false as const, error: 'No se pudo. Probá de nuevo.' }));
    setOcupado(null);
    if (!r.ok) return toast.error('No se pudo', r.error);
    toast.success('Hecho', r.mensaje);
    onCambio();
  }

  async function cerrar(estado: 'en_proceso' | 'resuelta' | 'rechazada') {
    setOcupado(estado);
    const r = await adminConsumidorResolver(pass, f.codigo, estado, texto);
    setOcupado(null);
    if (!r.ok) return toast.error('No se pudo', r.error);
    toast.success('Guardado', 'La persona lo ve con su código y, si tiene cuenta, en sus avisos.');
    setTexto('');
    onCambio();
  }

  return (
    <article className={cn('rounded-card border bg-surface p-4', f.abierta ? 'border-brote-sun/50' : 'border-border')}>
      <header className="flex flex-wrap items-center gap-2">
        <code className="text-small font-bold tracking-wide">{f.codigo}</code>
        <Etiqueta tono={f.tipo === 'arrepentimiento' ? 'atencion' : 'neutro'}>{f.tipo === 'arrepentimiento' ? 'Arrepentimiento' : 'Baja'}</Etiqueta>
        <Etiqueta tono={TONO[f.estado] ?? 'neutro'}>{ESTADO_PEDIDO[f.estado] ?? f.estado}</Etiqueta>
        <span className="ml-auto text-caption text-muted-foreground" title={fechaHora(f.creada)}>
          {hace(f.creada)}
        </span>
      </header>

      <dl className="mt-3 grid gap-x-6 gap-y-1.5 text-small sm:grid-cols-2">
        <Dato k="Servicio" v={SERVICIO[f.servicio] ?? f.servicio} />
        <Dato k="Quién" v={`${f.nombre} · ${f.email}`} />
        <Dato
          k="Cuenta"
          v={
            f.cuenta_id ? (
              <Link href={`/panel/personas/${f.cuenta_id}`} className="text-primary underline underline-offset-2">
                {f.cuenta_nombre ?? 'Ver cuenta'} {f.con_sesion ? '(pidió con su sesión)' : '(coincide el correo)'}
              </Link>
            ) : (
              'Ninguna cuenta con ese correo'
            )
          }
        />
        {f.referencia && <Dato k="Operación" v={f.referencia} />}
        {f.plus && (
          <Dato
            k="Brote+"
            v={`${ESTADO_SUB[f.plus.estado] ?? f.plus.estado} · desde ${fechaHora(f.plus.alta)} · ${pesos(f.plus.monto)} · ${f.plus.dias} días antes del pedido${f.tipo === 'arrepentimiento' ? (enPlazo ? ' (dentro del plazo)' : ' (fuera de los 10 días)') : ''}`}
          />
        )}
        {f.negocios.length > 0 && <Dato k="Negocios" v={f.negocios.map((n) => `${n.nombre} (${PLAN_NEGOCIO[n.plan] ?? n.plan}, ${ESTADO_SUB[n.estado] ?? n.estado})`).join(' · ')} />}
      </dl>
      {f.mensaje && <p className="mt-2 rounded-button bg-surface-2 p-2.5 text-small leading-relaxed">“{f.mensaje}”</p>}
      {reembolsos.length > 0 && (
        <p className="mt-2 text-caption text-muted-foreground">
          Devuelto: {reembolsos.map((r) => `${pesos(r.monto)} (devolución ${r.id})`).join(', ')}
        </p>
      )}
      {falloDetalle && f.abierta && <p className="mt-2 text-caption text-brote-coral">Quedó pendiente: {FALLO[falloDetalle] ?? falloDetalle}</p>}
      {f.resolucion && <p className="mt-2 text-small leading-relaxed text-muted-foreground">Lo que ve la persona: {f.resolucion}</p>}

      {f.abierta && (
        <div className="mt-4 space-y-3 border-t border-hairline pt-3">
          <div className="flex flex-wrap gap-2">
            {f.plus && f.cuenta_id && (
              <Button
                size="sm"
                variant={f.tipo === 'arrepentimiento' ? 'primary' : 'secondary'}
                loading={ocupado === 'devolver'}
                onClick={() => void hacer('devolver', () => panelArrepentimientoPlus(f.codigo))}
              >
                Devolver lo cobrado y terminar Brote+
              </Button>
            )}
            {plusActiva && f.cuenta_id && (
              <Button size="sm" variant={f.tipo === 'baja' ? 'primary' : 'secondary'} loading={ocupado === 'baja'} onClick={() => void hacer('baja', () => panelBajaPlus(f.codigo))}>
                Dar de baja Brote+ (sin devolver)
              </Button>
            )}
            {f.negocios
              .filter((n) => ['activa', 'en_gracia', 'pendiente'].includes(n.estado))
              .map((n) => (
                <Button key={n.id} size="sm" variant="secondary" loading={ocupado === n.id} onClick={() => void hacer(n.id, () => panelBajaNegocio(f.codigo, n.id))}>
                  Dar de baja el plan de {n.nombre}
                </Button>
              ))}
          </div>
          <div>
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              rows={2}
              maxLength={1000}
              placeholder="Si lo resolviste de otra forma: qué se hizo (lo ve la persona)."
              className="w-full rounded-button border border-border bg-surface px-3 py-2 text-small outline-none focus:border-primary"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" loading={ocupado === 'resuelta'} disabled={texto.trim().length < 5} onClick={() => void cerrar('resuelta')}>
                Marcar resuelto
              </Button>
              <Button size="sm" variant="ghost" loading={ocupado === 'en_proceso'} onClick={() => void cerrar('en_proceso')}>
                En proceso
              </Button>
              <Button size="sm" variant="ghost" loading={ocupado === 'rechazada'} disabled={texto.trim().length < 5} onClick={() => void cerrar('rechazada')}>
                No se puede
              </Button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

function Dato({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <dt className="shrink-0 text-muted-foreground">{k}:</dt>
      <dd className="min-w-0 break-words">{v}</dd>
    </div>
  );
}
