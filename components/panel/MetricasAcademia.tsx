'use client';

import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { academiaMetricas, type MetricasAcademia as M } from '@/lib/api/academia-admin';
import { toast } from '@/stores/toast';

/**
 * El tablero de la Academia.
 *
 * REGLA: si una cifra no se midió, dice "sin datos". No dice 0 %. Un tablero
 * que muestra 0 % cuando en realidad no hay una sola respuesta registrada es
 * peor que uno vacío, porque parece información.
 */

function Cifra({ etiqueta, valor, nota }: { etiqueta: string; valor: string; nota?: string }) {
  return (
    <Card className="p-3">
      <p className="tnum font-display text-h3 font-bold">{valor}</p>
      <p className="text-caption text-muted-foreground">{etiqueta}</p>
      {nota ? <p className="mt-0.5 text-caption text-muted-foreground/70">{nota}</p> : null}
    </Card>
  );
}

const pct = (v: number | null | undefined) => (v == null ? 'sin datos' : `${Math.round(v * 100)}%`);
const num = (v: number | null | undefined) => (v == null ? 'sin datos' : v.toLocaleString('es-AR'));

export function MetricasAcademia({ pass }: { pass: string }) {
  const [m, setM] = useState<M | null>(null);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    const r = await academiaMetricas(pass);
    setCargando(false);
    if (!r.ok) return toast.error('No se pudieron leer las métricas', 'error' in r ? r.error : undefined);
    setM(r as M);
  }, [pass]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  if (!m) {
    return (
      <section>
        <h2 className="mb-2 font-display text-h3 font-bold">Academia · números</h2>
        <Skeleton className="h-32 w-full" />
      </section>
    );
  }

  // La banda objetivo de acierto de primera vuelta es 0,78–0,86 (10-el-bosque §9).
  const acierto = m.acierto_primera.media;
  const enBanda = acierto != null && acierto >= 0.78 && acierto <= 0.86;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-h3 font-bold">
          Academia · números <span className="text-caption text-muted-foreground">({m.ventana_dias} días)</span>
        </h2>
        <Button size="sm" variant="secondary" onClick={cargar} loading={cargando}>
          <RefreshCw className="h-4 w-4" /> Actualizar
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        <Cifra etiqueta="Sesiones terminadas" valor={num(m.sesiones.terminadas)} nota={`${m.sesiones.por_dia}/día`} />
        <Cifra etiqueta="Riegos" valor={num(m.sesiones.riego)} />
        <Cifra
          etiqueta="Acierto de primera"
          valor={acierto == null ? 'sin datos' : pct(acierto)}
          nota={
            acierto == null
              ? `${m.acierto_primera.n} respuestas`
              : enBanda
                ? 'dentro de 78–86%'
                : 'FUERA de la banda 78–86%'
          }
        />
        <Cifra
          etiqueta="Se quedaron sin savia"
          valor={pct(m.savia.tasa_agotamiento)}
          nota={`${m.savia.agotaron} de ${m.savia.personas_con_uso}`}
        />
        <Cifra
          etiqueta="Semillas otorgadas"
          valor={num(m.semillas.otorgadas)}
          nota={`tope ${m.semillas.tope_diario}/día · ${m.semillas.dias_en_tope} en tope`}
        />
        <Cifra
          etiqueta="Gancho de acción tocado"
          valor={pct(m.gancho.tasa)}
          nota={`${m.gancho.tocado} de ${m.gancho.mostrado}`}
        />
        <Cifra
          etiqueta="Pools bajo el piso"
          valor={`${num(m.pool.bajo_piso)} / ${num(m.pool.pares_concepto_tipo)}`}
          nota={`mediana ${num(m.pool.mediana_vivos)} ítems`}
        />
        <Cifra
          etiqueta="Ítems aprobados"
          valor={num(m.items.aprobados)}
          nota={`${m.items.en_revision} en revisión · ${m.items.retirados} retirados`}
        />
        <Cifra
          etiqueta="Cola de revisión"
          valor={num(m.revision.pendientes)}
          nota={m.revision.mas_vieja_horas != null ? `la más vieja: ${m.revision.mas_vieja_horas} h` : 'vacía'}
        />
        <Cifra
          etiqueta="Generación este mes"
          valor={`US$ ${(m.presupuesto.gastado_centavos / 100).toFixed(2)}`}
          nota={`de ${(m.presupuesto.tope_centavos / 100).toFixed(2)} · ${m.presupuesto.habilitado ? 'encendida' : 'apagada'}`}
        />
        <Cifra
          etiqueta="Ítems generados"
          valor={num(m.generacion.aceptados)}
          nota={`${m.generacion.rechazados} rechazados · ${m.generacion.dead_letter} sin salida`}
        />
        <Cifra
          etiqueta="Propuestas de currículum"
          valor={num(m.propuestas.propuestas)}
          nota={`${m.propuestas.aplicadas} aplicadas · ${m.propuestas.rechazadas} rechazadas`}
        />
      </div>

      {/* La distribución de motivos de rechazo ES la lista de tareas del prompt. */}
      {m.motivos_rechazo.length > 0 ? (
        <Card className="p-4">
          <h3 className="mb-2 text-small font-semibold">Por qué se rechaza</h3>
          <ul className="divide-y divide-hairline">
            {m.motivos_rechazo.map((r) => (
              <li key={r.codigo} className="flex items-center justify-between py-1.5 text-small">
                <span>{r.etiqueta}</span>
                <span className="tnum text-muted-foreground">{r.n}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-caption text-muted-foreground">
            Esta lista es lo que hay que corregir en la próxima versión del prompt.
          </p>
        </Card>
      ) : null}
    </section>
  );
}
