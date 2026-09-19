'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Baby, Check, ExternalLink, Gavel, RefreshCw, Shuffle, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Ejercicio } from '@/components/academia/ejercicios';
import {
  academiaCola,
  academiaRevisar,
  type ColaAcademia as Cola,
  type FilaRevision,
} from '@/lib/api/academia-admin';
import { toast } from '@/stores/toast';
import { cn } from '@/lib/utils/cn';

/**
 * La cola de revisión de la Academia, dentro del panel del dueño.
 *
 * LO QUE HACE QUE ESTO SIRVA: el ítem se renderiza con el MISMO `<Ejercicio>`
 * que usa la Academia, así que quien revisa lo ve exactamente como lo va a ver
 * quien juegue. Revisar un ejercicio leyendo su JSON es cómo se aprueban
 * ejercicios rotos: el JSON puede estar impecable y la pantalla ser injugable.
 *
 * Al lado: las fuentes con su texto (para poder verificar la cita a ojo), los
 * puntajes del juez, y la procedencia — qué prompt, qué modelo, qué intento.
 *
 * Rechazar EXIGE un código de motivo. No es burocracia: la distribución de esos
 * códigos es la lista de tareas de la próxima revisión del prompt, y aparece en
 * las métricas justamente para eso.
 */

const ICONO_MOTIVO: Record<string, { Icon: typeof Gavel; label: string; tint: string }> = {
  juez: { Icon: Gavel, label: 'El juez lo marcó', tint: 'text-brote-coral' },
  sensible: { Icon: AlertTriangle, label: 'Concepto sensible', tint: 'text-brote-coral' },
  kid: { Icon: Baby, label: 'Apto para chicos', tint: 'text-brote-coral' },
  auditoria: { Icon: Shuffle, label: 'Auditoría al azar', tint: 'text-muted-foreground' },
  propuesta: { Icon: AlertTriangle, label: 'Propuesta de currículum', tint: 'text-brote-sun' },
};

export function ColaAcademia({ pass }: { pass: string }) {
  const [cola, setCola] = useState<Cola | null>(null);
  const [cargando, setCargando] = useState(true);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [rechazando, setRechazando] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    const r = await academiaCola(pass);
    setCargando(false);
    if (!r.ok) return toast.error('No se pudo leer la cola', r.error);
    setCola(r);
  }, [pass]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  async function resolver(fila: FilaRevision, accion: 'aprobar' | 'rechazar', motivo?: string) {
    setOcupado(fila.id);
    const r = await academiaRevisar(pass, fila.id, accion, { motivo });
    setOcupado(null);
    if (!r.ok) return toast.error('No se pudo', r.error);
    setRechazando(null);
    toast.success(accion === 'aprobar' ? 'Aprobado' : 'Rechazado');
    await cargar();
  }

  if (cargando && !cola) {
    return (
      <section>
        <h2 className="mb-2 font-display text-h3 font-bold">Academia · cola de revisión</h2>
        <Skeleton className="h-40 w-full" />
      </section>
    );
  }

  const items = cola?.items ?? [];

  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="font-display text-h3 font-bold">
          Academia · cola de revisión{' '}
          {cola?.pendientes ? <span className="tnum text-muted-foreground">({cola.pendientes})</span> : null}
        </h2>
        <Button size="sm" variant="secondary" onClick={cargar} loading={cargando}>
          <RefreshCw className="h-4 w-4" /> Actualizar
        </Button>
      </div>

      {items.length === 0 ? (
        <Card className="p-4">
          <p className="text-small text-muted-foreground">
            No hay nada esperando revisión. Todo lo que el pipeline generó pasó las compuertas
            automáticas o ya se resolvió.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((fila) => (
            <Card key={fila.id} className="space-y-3 p-4">
              {/* Por qué llegó acá. */}
              <div className="flex flex-wrap items-center gap-2">
                {fila.motivos.map((m) => {
                  const info = ICONO_MOTIVO[m] ?? {
                    Icon: AlertTriangle,
                    label: m,
                    tint: 'text-muted-foreground',
                  };
                  return (
                    <span
                      key={m}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-pill border border-hairline px-2.5 py-1 text-caption font-semibold',
                        info.tint,
                      )}
                    >
                      <info.Icon className="h-3.5 w-3.5" aria-hidden />
                      {info.label}
                    </span>
                  );
                })}
                <span className="ml-auto text-caption text-muted-foreground">
                  {new Date(fila.created_at).toLocaleString('es-AR')}
                </span>
              </div>

              {/* El ítem, tal cual lo vería quien juegue. */}
              {fila.item ? (
                <div className="rounded-card border border-hairline bg-surface-2 p-4">
                  <Ejercicio
                    payload={fila.item.payload_publico}
                    onCambio={() => {}}
                    bloqueado
                    correccion={null}
                  />
                </div>
              ) : null}

              {/* La propuesta de currículum, si es eso. */}
              {fila.propuesta ? (
                <div className="rounded-card border border-hairline bg-surface-2 p-4">
                  <p className="text-small font-semibold">
                    {fila.propuesta.rama_slug} · anillo {fila.propuesta.anillo}
                  </p>
                  {fila.propuesta.problemas.length > 0 ? (
                    <ul className="mt-2 space-y-1">
                      {fila.propuesta.problemas.map((p, i) => (
                        <li key={i} className="text-caption text-brote-coral">
                          ✕ {p}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <ul className="mt-2 space-y-2">
                    {(fila.propuesta.payload.gajos ?? []).map((g) => (
                      <li key={g.slug}>
                        <p className="text-small font-medium">{g.titulo_es}</p>
                        <p className="text-caption text-muted-foreground">{g.slug}</p>
                        <ul className="ml-3 mt-1 space-y-0.5">
                          {(g.conceptos ?? []).map((c) => (
                            <li key={c.slug} className="text-caption text-muted-foreground">
                              · {c.enunciado_es}
                              {c.prereq?.length ? ` (antes: ${c.prereq.join(', ')})` : ''}
                            </li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {/* La solución declarada. Quien revisa tiene que poder juzgarla. */}
              {fila.item ? (
                <details className="rounded-card border border-hairline p-3">
                  <summary className="cursor-pointer text-small font-semibold">Solución declarada</summary>
                  <pre className="mt-2 overflow-x-auto text-caption text-muted-foreground">
                    {JSON.stringify(fila.item.solucion, null, 1)}
                  </pre>
                </details>
              ) : null}

              {/* Las citas contra su fuente: es lo que hay que verificar a ojo. */}
              {fila.afirmaciones?.length ? (
                <div className="space-y-2">
                  <p className="eyebrow text-muted-foreground">Citas y sus fuentes</p>
                  {fila.afirmaciones.map((a, i) => {
                    const f = fila.item?.fuentes?.find((x) => x.id === a.fuente_id);
                    const literal = f ? f.contenido.replace(/\s+/g, ' ').includes(a.cita.replace(/\s+/g, ' ')) : false;
                    return (
                      <div key={i} className="rounded-card border border-hairline p-3">
                        <p className="text-small">{a.claim}</p>
                        <p className="mt-1 border-l-2 border-hairline pl-2 text-caption italic text-muted-foreground">
                          “{a.cita}”
                        </p>
                        <p className="mt-1 flex items-center gap-2 text-caption">
                          <span className={literal ? 'text-brote-green' : 'text-brote-coral'}>
                            {literal ? 'cita literal ✓' : 'NO es literal ✕'}
                          </span>
                          {f ? (
                            <a
                              href={f.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-muted-foreground underline-offset-2 hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" /> {f.organizacion}
                            </a>
                          ) : null}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {/* Los puntajes del juez y de dónde salió el ítem. */}
              <div className="flex flex-wrap gap-3 text-caption text-muted-foreground">
                {fila.juez
                  ? Object.entries(fila.juez)
                      .filter(([k]) => k !== 'comentario' && k !== 'juez_version')
                      .map(([k, v]) => (
                        <span key={k} className="tnum">
                          {k}: <strong className="text-foreground">{String(v)}</strong>
                        </span>
                      ))
                  : null}
                {fila.procedencia ? (
                  <span className="ml-auto">
                    {fila.procedencia.prompt_version} · {fila.procedencia.model_version} · intento{' '}
                    {fila.procedencia.intento}
                  </span>
                ) : null}
              </div>
              {typeof fila.juez?.comentario === 'string' ? (
                <p className="text-caption italic text-muted-foreground">“{fila.juez.comentario}”</p>
              ) : null}

              {/* Aprobar · rechazar con motivo. */}
              {rechazando === fila.id ? (
                <div className="space-y-2 border-t border-hairline pt-3">
                  <p className="text-small font-semibold">¿Por qué se rechaza?</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(cola?.motivos ?? []).map((m) => (
                      <button
                        key={m.codigo}
                        type="button"
                        title={m.descripcion ?? undefined}
                        onClick={() => resolver(fila, 'rechazar', m.codigo)}
                        className="rounded-pill border border-border px-2.5 py-1 text-caption transition-colors hover:border-brote-coral hover:text-brote-coral focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {m.etiqueta}
                      </button>
                    ))}
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setRechazando(null)}>
                    Cancelar
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2 border-t border-hairline pt-3">
                  <Button
                    size="sm"
                    loading={ocupado === fila.id}
                    disabled={
                      !!fila.propuesta && fila.propuesta.problemas.length > 0
                    }
                    onClick={() => resolver(fila, 'aprobar')}
                  >
                    <Check className="h-4 w-4" /> Aprobar
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setRechazando(fila.id)}>
                    <X className="h-4 w-4" /> Rechazar
                  </Button>
                  {fila.propuesta && fila.propuesta.problemas.length > 0 ? (
                    <span className="self-center text-caption text-brote-coral">
                      No se puede aprobar con problemas sin resolver.
                    </span>
                  ) : null}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
