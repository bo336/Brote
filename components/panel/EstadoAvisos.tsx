'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, BellRing, CheckCircle2 } from 'lucide-react';
import { adminAvisosEstado, type EstadoAvisos as Estado } from '@/lib/api/admin';

const n = (v: number) => new Intl.NumberFormat('es-AR').format(v);

/**
 * Si los avisos están saliendo (0129). Lo único que tiene que mirar el dueño:
 * que haya claves, que nada quede vencido en la cola y cuántos llegaron.
 */
export function EstadoAvisos({ pass, refresco = 0 }: { pass: string; refresco?: number }) {
  const [e, setE] = useState<Estado | null>(null);
  useEffect(() => {
    adminAvisosEstado(pass).then(setE);
  }, [pass, refresco]);
  if (!e) return null;

  const problema = !e.claves
    ? 'Todavía no hay claves: se generan solas el primer minuto después de desplegar send-push.'
    : e.vencidas > 0
      ? `${n(e.vencidas)} avisos esperan hace más de 5 minutos: revisá los logs de send-push.`
      : null;

  return (
    <section aria-labelledby="avisos-titulo">
      <h2 id="avisos-titulo" className="mb-2 font-display text-h3 font-bold">
        Avisos al teléfono
      </h2>
      <div className="rounded-card border border-border bg-surface p-4">
        <p className="flex items-start gap-2 text-small">
          {problema ? (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-brote-coral" />
          ) : (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          )}
          <span>
            {problema ??
              `Funcionando${e.clave_origen === 'generada' ? ' (claves generadas por Brote)' : ' (claves de los secretos)'}.`}
          </span>
        </p>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-caption sm:grid-cols-4">
          {[
            ['Personas con avisos', e.personas_con_avisos],
            ['Dispositivos', e.dispositivos],
            ['Enviados 24 h', e.enviadas_24h],
            ['En cola', e.pendientes],
          ].map(([k, v]) => (
            <div key={k as string}>
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="font-display text-h3 font-bold tnum">{n(v as number)}</dd>
            </div>
          ))}
        </dl>
        {(e.fallidas_24h > 0 || e.omitidas_24h > 0) && (
          <p className="mt-2 flex items-center gap-1.5 text-caption text-muted-foreground">
            <BellRing className="h-3.5 w-3.5" />
            {n(e.fallidas_24h)} fallaron y {n(e.omitidas_24h)} no sonaron por el tope diario (quedaron en la campana).
          </p>
        )}
      </div>
    </section>
  );
}
