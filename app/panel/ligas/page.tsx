'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Barras } from '@/components/panel/analitica/piezas';
import { Actualizar, Cargando, ErrorCarga, PageHeader, Section, Stat, StatGrid, Tabla, Td, Th, Vacio, fecha, num } from '@/components/panel/ui';
import { CUENTA } from '@/lib/api/admin';
import { adminLigaGuardar, adminLigaPeriodo, adminLigaReglas, adminLigas, type PanelLigas } from '@/lib/api/ligas';
import type { ReglasLiga } from '@/lib/ligas';
import { toast } from '@/stores/toast';
import { cn } from '@/lib/utils/cn';

/**
 * `/panel/ligas` — las ligas de la semana: qué pide cada una y cómo vienen los
 * cierres. El rango por puntos totales (Semilla → Gaia) no se toca desde acá.
 */

export default function LigasPanelPage() {
  const q = useQuery({ queryKey: ['panel', 'ligas'], queryFn: () => adminLigas(CUENTA) });
  const [cambiando, setCambiando] = useState(false);

  async function cambiarPeriodo(tipo: 'semana' | 'mes') {
    setCambiando(true);
    const r = await adminLigaPeriodo(CUENTA, tipo);
    setCambiando(false);
    if (!r.ok) return toast.error('No se pudo cambiar', r.error);
    toast.success(tipo === 'mes' ? 'Pasa a cerrar por mes' : 'Pasa a cerrar por semana', r.desde ? `Rige desde el ${fecha(r.desde)}. La que está en curso termina como empezó.` : undefined);
    void q.refetch();
  }

  const cabecera = (
    <PageHeader
      eyebrow="Personas"
      title="Ligas"
      description="Un ranking que se mide cada semana. Al cerrar, cada persona sube, baja o se mantiene según los puntos que hizo."
      actions={<Actualizar onClick={() => void q.refetch()} cargando={q.isFetching} />}
    />
  );
  if (q.isError || (q.isFetched && !q.data)) return <div>{cabecera}<ErrorCarga onReintentar={() => void q.refetch()} /></div>;
  if (!q.data) return <div>{cabecera}<Cargando /></div>;

  const d = q.data;
  const total = Object.values(d.distribucion).reduce((t, n) => t + Number(n), 0);
  const ultimo = d.cierres[0];

  return (
    <div>
      {cabecera}
      <div className="space-y-6">
        <StatGrid columnas={4}>
          <Stat label="Semana en curso" value={<span className="text-[1.5rem]">{`${fecha(d.periodo.inicio)} – ${fecha(d.periodo.fin)}`}</span>} hint={d.periodo.tipo === 'mes' ? 'Cierra por mes' : 'Cierra el domingo a medianoche'} />
          <Stat label="Sumaron puntos" value={num(d.activos_periodo)} hint={`de ${num(total)} personas`} />
          <Stat label="En Referente o más" value={num(d.ligas.filter((l) => l.tier >= 4).reduce((t, l) => t + Number(d.distribucion[l.tier] ?? 0), 0))} hint="Pueden organizar proyectos" />
          <Stat
            label="Último cierre"
            value={ultimo ? `${num(ultimo.suben)} / ${num(ultimo.bajan)}` : '—'}
            hint={ultimo ? `Subieron / bajaron · promedio ${num(ultimo.promedio)} pts` : 'Todavía no cerró ninguna'}
          />
        </StatGrid>

        <Section
          title="Qué pide cada liga"
          description="Puntos por semana. Con menos que “para seguir”, se baja una. Con “para subir” o más, se sube una. Una acción típica da unos 70 puntos."
          sinPadding
        >
          <Tabla minimo={620}>
            <thead>
              <tr>
                <Th>Liga</Th>
                <Th derecha>Personas</Th>
                <Th derecha>Para seguir</Th>
                <Th derecha>Para subir</Th>
                <Th> </Th>
              </tr>
            </thead>
            <tbody>
              {d.ligas.map((l) => (
                <EditorLiga key={l.tier} liga={l} personas={Number(d.distribucion[l.tier] ?? 0)} onGuardado={() => void q.refetch()} />
              ))}
            </tbody>
          </Tabla>
        </Section>

        <Reglas reglas={d.reglas} onGuardado={() => void q.refetch()} />

        <div className="grid gap-6 lg:grid-cols-2">
          <Section title="Cuánta gente hay en cada liga">
            <Barras filas={[...d.ligas].reverse().map((l) => ({ etiqueta: l.nombre, valor: Number(d.distribucion[l.tier] ?? 0) }))} />
          </Section>
          <Section title="Últimos cierres" sinPadding>
            {d.cierres.length === 0 ? (
              <Vacio>Todavía no cerró ninguna semana.</Vacio>
            ) : (
              <Tabla minimo={420}>
                <thead>
                  <tr>
                    <Th>Semana</Th>
                    <Th derecha>Suben</Th>
                    <Th derecha>Siguen</Th>
                    <Th derecha>Bajan</Th>
                    <Th derecha>Promedio</Th>
                  </tr>
                </thead>
                <tbody>
                  {d.cierres.map((c) => (
                    <tr key={c.inicio}>
                      <Td className="whitespace-nowrap font-medium">{`${fecha(c.inicio)} – ${fecha(c.fin)}`}</Td>
                      <Td derecha>{num(c.suben)}</Td>
                      <Td derecha>{num(c.mantienen)}</Td>
                      <Td derecha>{num(c.bajan)}</Td>
                      <Td derecha>{num(c.promedio)}</Td>
                    </tr>
                  ))}
                </tbody>
              </Tabla>
            )}
          </Section>
        </div>

        <Section title="Cada cuánto cierra" description="Lo normal es por semana. En modo mensual las metas se multiplican por los días del mes. El cambio rige desde el próximo cierre.">
          <div role="radiogroup" aria-label="Cada cuánto cierra" className="inline-flex rounded-button border border-border p-1">
            {(['semana', 'mes'] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={d.tipo === t}
                disabled={cambiando}
                onClick={() => d.tipo !== t && void cambiarPeriodo(t)}
                className={cn(
                  'rounded-[10px] px-5 py-2 text-small font-semibold transition-colors',
                  d.tipo === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t === 'semana' ? 'Por semana' : 'Por mes'}
              </button>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

function Reglas({ reglas, onGuardado }: { reglas: ReglasLiga; onGuardado: () => void }) {
  const [r, setR] = useState<ReglasLiga>(reglas);
  const [ocupado, setOcupado] = useState(false);
  useEffect(() => setR(reglas), [reglas]);
  const sucio = (Object.keys(reglas) as (keyof ReglasLiga)[]).some((k) => Number(r[k]) !== Number(reglas[k]));

  async function guardar() {
    setOcupado(true);
    const res = await adminLigaReglas(CUENTA, r);
    setOcupado(false);
    if (!res.ok) return toast.error('No se pudo guardar', res.error);
    toast.success('Reglas guardadas');
    onGuardado();
  }

  const campo = (k: keyof ReglasLiga, titulo: string, ayuda: string) => (
    <label className="block text-caption font-medium">
      {titulo}
      <Input
        type="number"
        min={0}
        value={r[k]}
        onChange={(e) => setR((x) => ({ ...x, [k]: Math.max(0, Number(e.target.value) || 0) }))}
        className="mt-1.5 tnum"
      />
      <span className="mt-1.5 block font-normal leading-relaxed text-muted-foreground">{ayuda}</span>
    </label>
  );

  return (
    <Section
      title="Reglas de todas las ligas"
      actions={
        <Button size="sm" disabled={!sucio} loading={ocupado} onClick={() => void guardar()}>
          Guardar
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {campo('tope_diario', 'Puntos que cuentan por día', 'Lo que pase de acá suma al total, no a la liga. Evita que un solo día te suba.')}
        {campo('tamano_grupo', 'Personas por grupo', 'Se arman con quienes suman su primer punto de la semana.')}
        {campo('top_suben', 'Primeros que también suben', 'Si llegaron a mantenerse. Con 0 sólo vale la meta de puntos.')}
        {campo('grupo_minimo', 'Desde qué tamaño de grupo', 'En un grupo más chico, salir primero no dice nada.')}
      </div>
    </Section>
  );
}

function EditorLiga({ liga, personas, onGuardado }: { liga: PanelLigas['ligas'][number]; personas: number; onGuardado: () => void }) {
  const [nombre, setNombre] = useState(liga.nombre);
  const [descripcion, setDescripcion] = useState(liga.descripcion);
  const [mantener, setMantener] = useState(liga.mantener);
  const [subir, setSubir] = useState<number | null>(liga.subir);
  const [ocupado, setOcupado] = useState(false);
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    setNombre(liga.nombre);
    setDescripcion(liga.descripcion);
    setMantener(liga.mantener);
    setSubir(liga.subir);
  }, [liga]);

  const sucio = nombre !== liga.nombre || descripcion !== liga.descripcion || mantener !== liga.mantener || subir !== liga.subir;

  async function guardar() {
    setOcupado(true);
    const r = await adminLigaGuardar(CUENTA, liga.tier, nombre, descripcion, mantener, subir);
    setOcupado(false);
    if (!r.ok) return toast.error('No se pudo guardar', r.error);
    toast.success(`${nombre} guardada`);
    setAbierto(false);
    onGuardado();
  }

  return (
    <>
      <tr>
        <Td className="min-w-[190px]">
          <button type="button" onClick={() => setAbierto((v) => !v)} aria-expanded={abierto} className="group flex items-center gap-2 text-left">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: liga.color }} aria-hidden />
            <span className="font-semibold">{liga.nombre}</span>
            <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform', abierto && 'rotate-180')} />
          </button>
        </Td>
        <Td derecha>{num(personas)}</Td>
        <Td derecha>
          {liga.tier === 1 ? (
            <span className="text-caption text-muted-foreground">No se baja</span>
          ) : (
            <Input
              type="number"
              min={0}
              aria-label={`Puntos para seguir en ${liga.nombre}`}
              value={mantener}
              onChange={(e) => setMantener(Math.max(0, Number(e.target.value) || 0))}
              className="ml-auto h-9 w-24 text-right tnum"
            />
          )}
        </Td>
        <Td derecha>
          {subir == null ? (
            <span className="text-caption text-muted-foreground">Es la última</span>
          ) : (
            <Input
              type="number"
              min={1}
              aria-label={`Puntos para subir desde ${liga.nombre}`}
              value={subir}
              onChange={(e) => setSubir(Math.max(1, Number(e.target.value) || 1))}
              className="ml-auto h-9 w-24 text-right tnum"
            />
          )}
        </Td>
        <Td derecha>
          <Button size="sm" variant="secondary" disabled={!sucio} loading={ocupado} onClick={() => void guardar()}>
            Guardar
          </Button>
        </Td>
      </tr>
      {abierto && (
        <tr>
          <Td colSpan={5} className="bg-surface-2/50">
            <div className="grid gap-3 sm:grid-cols-[1fr_2fr]">
              <label className="block text-caption font-medium">
                Nombre
                <Input value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={30} className="mt-1.5" />
              </label>
              <label className="block text-caption font-medium">
                Qué dice de quien está acá
                <Input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} maxLength={160} className="mt-1.5" />
              </label>
            </div>
          </Td>
        </tr>
      )}
    </>
  );
}
