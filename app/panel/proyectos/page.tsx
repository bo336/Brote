'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet } from '@/components/ui/sheet';
import { Actualizar, Cargando, ErrorCarga, Etiqueta, PageHeader, Pestanas, Section, Stat, StatGrid, Tabla, Td, Th, Vacio, fecha, num } from '@/components/panel/ui';
import { CUENTA, adminProyectoAccion, adminProyectos, adminProyectosReglas, type ProyectoPanel, type ReglasProyectos } from '@/lib/api/admin';
import { toast } from '@/stores/toast';

/**
 * `/panel/proyectos` — quién puede organizar y qué está pasando con cada uno.
 * Sumarse es libre; crear y manejar sale de la liga de la semana (0142).
 */

type Filtro = 'abiertos' | 'atencion' | 'cerrados';
type Pedido = { p: ProyectoPanel; accion: 'pausar' | 'reanudar' | 'cerrar' | 'cancelar'; titulo: string; cuerpo: string };

function estadoDe(p: ProyectoPanel) {
  const abierto = p.status === 'active' || p.status === 'proposed';
  if (!abierto) return p.status === 'completed' ? ({ t: 'Terminado', tono: 'neutro' } as const) : ({ t: 'Cancelado', tono: 'neutro' } as const);
  if (p.pausado_at) return { t: 'En pausa', tono: 'mal' } as const;
  if (p.organizador_bajo_desde) return { t: 'En gracia', tono: 'atencion' } as const;
  return { t: 'Abierto', tono: 'ok' } as const;
}

export default function ProyectosPanelPage() {
  const q = useQuery({ queryKey: ['panel', 'proyectos'], queryFn: () => adminProyectos(CUENTA) });
  const [filtro, setFiltro] = useState<Filtro>('abiertos');
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const filas = useMemo(() => {
    const todos = q.data?.proyectos ?? [];
    const abierto = (p: ProyectoPanel) => p.status === 'active' || p.status === 'proposed';
    if (filtro === 'atencion') return todos.filter((p) => abierto(p) && (p.pausado_at || p.organizador_bajo_desde));
    if (filtro === 'cerrados') return todos.filter((p) => !abierto(p));
    return todos.filter(abierto);
  }, [q.data, filtro]);

  async function confirmar() {
    if (!pedido) return;
    setOcupado(true);
    const r = await adminProyectoAccion(CUENTA, pedido.p.id, pedido.accion);
    setOcupado(false);
    setPedido(null);
    if (!r.ok) return toast.error('No se pudo', r.error);
    toast.success('Listo');
    void q.refetch();
  }

  const cabecera = (
    <PageHeader
      eyebrow="Comunidad"
      title="Proyectos"
      description="Sumarse es libre. Crear y manejar depende de la liga de la semana: se sostiene o se pierde. Un proyecto nunca se corta de golpe."
      actions={<Actualizar onClick={() => void q.refetch()} cargando={q.isFetching} />}
    />
  );
  if (q.isError || (q.isFetched && !q.data)) return <div>{cabecera}<ErrorCarga onReintentar={() => void q.refetch()} /></div>;
  if (!q.data) return <div>{cabecera}<Cargando /></div>;

  const { resumen: r, reglas, rangos } = q.data;

  return (
    <div>
      {cabecera}
      <div className="space-y-6">
        <StatGrid>
          <Stat label="Abiertos" value={num(r.activos)} hint={`${num(r.participaciones)} personas sumadas`} />
          <Stat label="En gracia" value={num(r.en_gracia)} hint="El organizador bajó de liga" tone={r.en_gracia > 0 ? 'atencion' : undefined} />
          <Stat label="En pausa" value={num(r.en_pausa)} hint="Vuelven solos si recupera la liga" tone={r.en_pausa > 0 ? 'mal' : undefined} />
          <Stat label="Se sumaron en 7 días" value={num(r.sumados_7d)} hint={`${num(r.jornadas_30d)} jornadas en 30 días`} />
        </StatGrid>

        <Reglas reglas={reglas} rangos={rangos} onGuardado={() => void q.refetch()} />

        <div>
          <Pestanas<Filtro>
            valor={filtro}
            onCambiar={setFiltro}
            opciones={[
              { value: 'abiertos', label: 'Abiertos' },
              { value: 'atencion', label: 'Para mirar', badge: r.en_gracia + r.en_pausa },
              { value: 'cerrados', label: 'Terminados' },
            ]}
          />
          <Section sinPadding>
            {filas.length === 0 ? (
              <Vacio>Nada por acá.</Vacio>
            ) : (
              <Tabla minimo={820}>
                <thead>
                  <tr>
                    <Th>Proyecto</Th>
                    <Th>Organiza</Th>
                    <Th>Fecha</Th>
                    <Th derecha>Personas</Th>
                    <Th>Estado</Th>
                    <Th />
                  </tr>
                </thead>
                <tbody>
                  {filas.map((p) => {
                    const e = estadoDe(p);
                    const abierto = p.status === 'active' || p.status === 'proposed';
                    return (
                      <tr key={p.id}>
                        <Td className="max-w-[280px]">
                          <Link href={`/proyectos/${p.id}`} className="block truncate font-semibold hover:underline" target="_blank">
                            {p.title}
                          </Link>
                          <span className="block truncate text-caption text-muted-foreground">{p.neighborhood || p.city || '—'}</span>
                        </Td>
                        <Td className="max-w-[180px]">
                          <span className="block truncate">{p.organizador ?? 'Sin organizador'}</span>
                          {p.organizador_rango && <span className="block text-caption text-muted-foreground">{p.organizador_rango}</span>}
                        </Td>
                        <Td className="whitespace-nowrap">{p.event_date ? fecha(p.event_date) : 'Sin fecha'}</Td>
                        <Td derecha>
                          {num(p.personas)}
                          {p.max_participants ? ` / ${num(p.max_participants)}` : ''}
                        </Td>
                        <Td>
                          <Etiqueta tono={e.tono}>{e.t}</Etiqueta>
                          {p.organizador_bajo_desde && !p.pausado_at && abierto && (
                            <span className="mt-0.5 block text-caption text-muted-foreground">desde {fecha(p.organizador_bajo_desde)}</span>
                          )}
                        </Td>
                        <Td className="whitespace-nowrap text-right">
                          {abierto &&
                            (p.pausado_at ? (
                              <Button size="sm" variant="secondary" onClick={() => setPedido({ p, accion: 'reanudar', titulo: 'Reanudar', cuerpo: `«${p.title}» vuelve a estar abierto y se le borra la cuenta de la gracia.` })}>
                                Reanudar
                              </Button>
                            ) : (
                              <Button size="sm" variant="ghost" onClick={() => setPedido({ p, accion: 'pausar', titulo: 'Poner en pausa', cuerpo: `«${p.title}» deja de aparecer y no acepta gente nueva. Quien ya está conserva su lugar.` })}>
                                Pausar
                              </Button>
                            ))}
                          {abierto && (
                            <Button size="sm" variant="ghost" onClick={() => setPedido({ p, accion: 'cancelar', titulo: 'Cancelar el proyecto', cuerpo: `«${p.title}» se cancela para todos. No se puede deshacer desde acá.` })}>
                              Cancelar
                            </Button>
                          )}
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </Tabla>
            )}
          </Section>
        </div>
      </div>

      <Sheet open={!!pedido} onOpenChange={(v) => !v && setPedido(null)} title={pedido?.titulo ?? ''} description={pedido?.cuerpo}>
        <div className="flex flex-col gap-2 pt-2">
          <Button block variant={pedido?.accion === 'cancelar' ? 'danger' : 'primary'} loading={ocupado} onClick={() => void confirmar()}>
            Confirmar
          </Button>
          <Button block variant="ghost" onClick={() => setPedido(null)}>
            Volver
          </Button>
        </div>
      </Sheet>
    </div>
  );
}

function Reglas({
  reglas,
  rangos,
  onGuardado,
}: {
  reglas: ReglasProyectos;
  rangos: { tier: number; nombre: string; color: string }[];
  onGuardado: () => void;
}) {
  const [cupos, setCupos] = useState<Record<string, number>>(reglas.cupos);
  const [gracia, setGracia] = useState(reglas.gracia_dias);
  const [jornadas, setJornadas] = useState(reglas.jornadas_semana ?? 3);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    setCupos(reglas.cupos);
    setGracia(reglas.gracia_dias);
    setJornadas(reglas.jornadas_semana ?? 3);
  }, [reglas]);

  const sucio = gracia !== reglas.gracia_dias || jornadas !== (reglas.jornadas_semana ?? 3) || rangos.some((r) => Number(cupos[r.tier]) !== Number(reglas.cupos[r.tier]));

  async function guardar() {
    setOcupado(true);
    const r = await adminProyectosReglas(CUENTA, { cupos, gracia_dias: gracia, jornadas_semana: jornadas });
    setOcupado(false);
    if (!r.ok) return toast.error('No se pudo guardar', r.error);
    toast.success('Reglas guardadas');
    onGuardado();
  }

  return (
    <Section
      title="Cuántos puede organizar cada liga"
      description="A la vez. Si alguien baja y le sobran proyectos, siguen en regla los más próximos; a los otros les corre la gracia, y después quedan en pausa."
      actions={
        <Button size="sm" disabled={!sucio} loading={ocupado} onClick={() => void guardar()}>
          Guardar
        </Button>
      }
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {rangos.map((r) => (
          <label key={r.tier} className="block text-caption font-medium">
            <span className="mb-1.5 flex items-center gap-1.5 truncate">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: r.color }} aria-hidden />
              {r.nombre}
            </span>
            <Input
              type="number"
              min={0}
              max={50}
              value={cupos[r.tier] ?? 0}
              onChange={(e) => setCupos((c) => ({ ...c, [r.tier]: Math.max(0, Math.min(50, Number(e.target.value) || 0)) }))}
              className="tnum"
            />
          </label>
        ))}
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col text-caption font-medium">
          Días de gracia al bajar de liga
          <Input type="number" min={0} max={180} value={gracia} onChange={(e) => setGracia(Math.max(0, Math.min(180, Number(e.target.value) || 0)))} className="mt-1.5 tnum" />
          <span className="mt-1.5 font-normal text-muted-foreground">Un proyecto con fecha en los próximos 14 días nunca se pausa: esa reunión ya está armada.</span>
        </label>
        <label className="flex flex-col text-caption font-medium">
          Jornadas por semana, por organizador
          <Input type="number" min={1} max={21} value={jornadas} onChange={(e) => setJornadas(Math.max(1, Math.min(21, Number(e.target.value) || 1)))} className="mt-1.5 tnum" />
          <span className="mt-1.5 font-normal text-muted-foreground">Cerrar una jornada reparte puntos. Con este tope, y una por proyecto por día, un proyecto no sirve para farmear.</span>
        </label>
      </div>
    </Section>
  );
}
