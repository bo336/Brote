'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { usePanelPass } from '@/components/panel/PanelPass';
import { Actualizar, Cargando, ErrorCarga, FilaInterruptor, PageHeader, Section, Vacio } from '@/components/panel/ui';
import { Pedido } from '@/components/panel/PedidoConsumidorPanel';
import { adminConsumidor, adminSetSetting, type PanelConsumidor } from '@/lib/api/admin';
import { DIAS_ARREPENTIMIENTO } from '@/lib/consumidor/reglas';
import { toast } from '@/stores/toast';

/**
 * `/panel/consumidor` — los pedidos del botón de arrepentimiento y del botón de
 * baja de servicio (0147, Disposición 954/2025).
 *
 * La persona ya recibió su código en el momento. Lo que queda acá es hacer lo
 * que pidió: un botón por caso (devolver Brote+, dar de baja, dar de baja el
 * plan de una tienda) o, si es otra cosa, escribir qué se hizo y cerrarlo. Lo
 * que se escribe lo ve la persona.
 */

export default function ConsumidorPage() {
  const { pass } = usePanelPass();
  const [d, setD] = useState<PanelConsumidor | null>(null);
  const [fallo, setFallo] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [todas, setTodas] = useState(false);

  const cargar = useCallback(async () => {
    setFallo(false);
    setCargando(true);
    const r = await adminConsumidor(pass);
    setCargando(false);
    if (!r) return setFallo(true);
    setD(r);
  }, [pass]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const filas = (d?.filas ?? []).filter((f) => todas || f.abierta);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Ingresos"
        title="Arrepentimiento y bajas"
        description="Lo que llega por el botón de arrepentimiento y el botón de baja de servicio. La persona ya tiene su código: acá se hace lo que pidió."
        actions={<Actualizar onClick={() => void cargar()} cargando={cargando} />}
      />

      {fallo && !d ? (
        <ErrorCarga onReintentar={() => void cargar()} />
      ) : !d ? (
        <Cargando alto="h-64" />
      ) : (
        <>
          <Section title="Cómo funciona">
            <ul className="space-y-1.5 text-small leading-relaxed text-muted-foreground">
              <li>· El código se da en el momento (la norma pide dentro de las 24 h). Resolvé lo pedido lo antes posible.</li>
              <li>
                · Arrepentimiento: {DIAS_ARREPENTIMIENTO} días corridos desde que contrató. Se devuelve todo lo cobrado por Mercado Pago y Brote+
                termina en el momento.
              </li>
              <li>· Baja: no se cobra más y sigue con los beneficios hasta el final de lo pagado. Nunca se cobra por darse de baja.</li>
            </ul>
            <div className="mt-2 border-t border-hairline">
              <FilaInterruptor
                titulo="Devolver sola, dentro de los 10 días"
                detalle="Si alguien con la sesión iniciada se arrepiente de Brote+ dentro del plazo, la app da de baja y devuelve el dinero sin esperar al panel. Una sola vez por persona."
                valor={d.reembolso_auto}
                onCambiar={async (v) => {
                  const r = await adminSetSetting(pass, 'consumidor_reembolso_auto', v);
                  if (!r.ok) return toast.error('No se pudo guardar', r.error);
                  await cargar();
                }}
              />
            </div>
          </Section>

          <div className="flex items-center gap-2">
            <Button size="sm" variant={todas ? 'ghost' : 'secondary'} onClick={() => setTodas(false)}>
              Abiertas ({d.abiertas})
            </Button>
            <Button size="sm" variant={todas ? 'secondary' : 'ghost'} onClick={() => setTodas(true)}>
              Todas
            </Button>
          </div>

          {filas.length === 0 ? (
            <Vacio>{todas ? 'Todavía no llegó ningún pedido.' : 'No hay pedidos abiertos.'}</Vacio>
          ) : (
            <div className="space-y-3">
              {filas.map((f) => (
                <Pedido key={f.id} f={f} pass={pass} onCambio={() => void cargar()} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
