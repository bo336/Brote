'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Barras } from '@/components/panel/analitica/piezas';
import { Actualizar, Cargando, ErrorCarga, PageHeader, Section, Stat, StatGrid, Tabla, Td, Th, Vacio, fecha, num } from '@/components/panel/ui';
import { CUENTA } from '@/lib/api/admin';
import { adminRangoGuardar, adminRangoPeriodo, adminRangos, type PanelRangos } from '@/lib/api/rangos';
import { ETIQUETA_REQUISITO, type ClaveRequisito, type Requisitos } from '@/lib/rangos';
import { toast } from '@/stores/toast';
import { cn } from '@/lib/utils/cn';

/**
 * `/panel/rangos` — la liga: cada cuánto se define y qué pide cada rango.
 * El nivel de por vida (Semilla → Gaia) no se toca desde acá: mueve el mundo.
 */

const CLAVES: ClaveRequisito[] = ['dias', 'acciones', 'temas', 'medidas', 'comunidad', 'aprendizaje'];
const mayuscula = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

export default function RangosPanelPage() {
  const q = useQuery({ queryKey: ['panel', 'rangos'], queryFn: () => adminRangos(CUENTA) });
  const [cambiando, setCambiando] = useState(false);

  async function cambiarPeriodo(tipo: 'semana' | 'mes') {
    setCambiando(true);
    const r = await adminRangoPeriodo(CUENTA, tipo);
    setCambiando(false);
    if (!r.ok) return toast.error('No se pudo cambiar', r.error);
    toast.success(tipo === 'mes' ? 'Pasa a ser por mes' : 'Pasa a ser por semana', r.desde ? `Rige desde el ${fecha(r.desde)}. El período en curso termina como empezó.` : undefined);
    void q.refetch();
  }

  const cabecera = (
    <PageHeader
      eyebrow="Personas"
      title="Rangos y ligas"
      description="Qué tipo de persona que cuida el ambiente fue cada uno en el último período. Se sostiene haciendo; si no, se baja."
      actions={<Actualizar onClick={() => void q.refetch()} cargando={q.isFetching} />}
    />
  );
  if (q.isError || (q.isFetched && !q.data)) return <div>{cabecera}<ErrorCarga onReintentar={() => void q.refetch()} /></div>;
  if (!q.data) return <div>{cabecera}<Cargando /></div>;

  const d = q.data;
  const total = Object.values(d.distribucion).reduce((t, n) => t + Number(n), 0);

  return (
    <div>
      {cabecera}
      <div className="space-y-6">
        <StatGrid columnas={3}>
          <Stat label="Período en curso" value={<span className="text-[1.5rem]">{`${fecha(d.periodo.inicio)} – ${fecha(d.periodo.fin)}`}</span>} hint={d.periodo.tipo === 'mes' ? 'Mensual' : 'Semanal'} />
          <Stat label="Sumaron puntos este período" value={num(d.activos_periodo)} hint={`de ${num(total)} personas`} />
          <Stat label="En Referente o más" value={num(d.rangos.filter((r) => r.tier >= 4).reduce((t, r) => t + Number(d.distribucion[r.tier] ?? 0), 0))} hint="Pueden organizar proyectos" />
        </StatGrid>

        <Section title="Cada cuánto se define" description="El cambio rige desde el próximo período: el que está en curso termina como empezó.">
          <div role="radiogroup" aria-label="Duración del período" className="inline-flex rounded-button border border-border p-1">
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
          {d.tipo !== d.periodo.tipo && (
            <p className="mt-3 text-small text-muted-foreground">
              El período actual es {d.periodo.tipo === 'mes' ? 'mensual' : 'semanal'}; el próximo va a ser {d.tipo === 'mes' ? 'mensual' : 'semanal'}.
            </p>
          )}
        </Section>

        <div className="grid gap-6 lg:grid-cols-2">
          <Section title="Cuánta gente hay en cada rango">
            <Barras filas={[...d.rangos].reverse().map((r) => ({ etiqueta: r.nombre, valor: Number(d.distribucion[r.tier] ?? 0) }))} />
          </Section>
          <Section title="Últimos cierres" sinPadding>
            {d.cierres.length === 0 ? (
              <Vacio>Todavía no cerró ningún período.</Vacio>
            ) : (
              <Tabla minimo={420}>
                <thead>
                  <tr>
                    <Th>Período</Th>
                    <Th derecha>Suben</Th>
                    <Th derecha>Siguen</Th>
                    <Th derecha>Por poco</Th>
                    <Th derecha>Bajan</Th>
                  </tr>
                </thead>
                <tbody>
                  {d.cierres.map((c) => (
                    <tr key={c.inicio}>
                      <Td className="whitespace-nowrap font-medium">{`${fecha(c.inicio)} – ${fecha(c.fin)}`}</Td>
                      <Td derecha>{num(c.suben)}</Td>
                      <Td derecha>{num(c.mantienen)}</Td>
                      <Td derecha>{num(c.margen)}</Td>
                      <Td derecha>{num(c.bajan)}</Td>
                    </tr>
                  ))}
                </tbody>
              </Tabla>
            )}
          </Section>
        </div>

        <Section
          title="Qué pide cada rango"
          description="Por semana. En modo mensual se multiplica por los días del mes, salvo los temas, que son amplitud y no cantidad."
          sinPadding
        >
          <Tabla minimo={860}>
            <thead>
              <tr>
                <Th>Rango</Th>
                {CLAVES.map((k) => (
                  <Th key={k} derecha>
                    <span title={ETIQUETA_REQUISITO[k].larga}>{mayuscula(ETIQUETA_REQUISITO[k].corta)}</span>
                  </Th>
                ))}
                <Th> </Th>
              </tr>
            </thead>
            <tbody>
              {d.rangos.map((r) => (
                <EditorRango key={r.tier} rango={r} onGuardado={() => void q.refetch()} />
              ))}
            </tbody>
          </Tabla>
          <ul className="space-y-1 border-t border-hairline px-5 py-4 text-caption leading-relaxed text-muted-foreground">
            {CLAVES.map((k) => (
              <li key={k}>
                <span className="font-semibold text-foreground">{mayuscula(ETIQUETA_REQUISITO[k].corta)}:</span> {ETIQUETA_REQUISITO[k].larga}.
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  );
}

function EditorRango({ rango, onGuardado }: { rango: PanelRangos['rangos'][number]; onGuardado: () => void }) {
  const [nombre, setNombre] = useState(rango.nombre);
  const [descripcion, setDescripcion] = useState(rango.descripcion);
  const [req, setReq] = useState<Requisitos>(rango.requisitos);
  const [ocupado, setOcupado] = useState(false);
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    setNombre(rango.nombre);
    setDescripcion(rango.descripcion);
    setReq(rango.requisitos);
  }, [rango]);

  const sucio =
    nombre !== rango.nombre ||
    descripcion !== rango.descripcion ||
    CLAVES.some((k) => Number(req[k] ?? 0) !== Number(rango.requisitos[k] ?? 0));

  async function guardar() {
    setOcupado(true);
    const limpio = Object.fromEntries(CLAVES.filter((k) => Number(req[k] ?? 0) > 0).map((k) => [k, Number(req[k])])) as Requisitos;
    const r = await adminRangoGuardar(CUENTA, rango.tier, nombre, descripcion, limpio);
    setOcupado(false);
    if (!r.ok) return toast.error('No se pudo guardar', r.error);
    toast.success(`${nombre} guardado`);
    setAbierto(false);
    onGuardado();
  }

  return (
    <>
      <tr>
        <Td className="min-w-[210px]">
          <button type="button" onClick={() => setAbierto((v) => !v)} aria-expanded={abierto} className="group flex items-center gap-2 text-left">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: rango.color }} aria-hidden />
            <span className="font-semibold">{rango.nombre}</span>
            <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform', abierto && 'rotate-180')} />
          </button>
          {rango.previo && <p className="mt-0.5 pl-[18px] text-caption text-muted-foreground">Pide haber sido el rango anterior</p>}
        </Td>
        {rango.tier === 1 ? (
          <Td derecha colSpan={CLAVES.length} className="text-caption text-muted-foreground">
            El rango de partida: no pide nada
          </Td>
        ) : (
          CLAVES.map((k) => (
            <Td key={k} derecha className="py-2">
              <Input
                type="number"
                min={0}
                max={k === 'dias' ? 7 : 60}
                value={req[k] ?? 0}
                onChange={(e) => setReq((x) => ({ ...x, [k]: Math.max(0, Number(e.target.value) || 0) }))}
                className="ml-auto h-9 w-[68px] text-right text-small tnum"
                aria-label={`${ETIQUETA_REQUISITO[k].larga}, ${rango.nombre}`}
              />
            </Td>
          ))
        )}
        <Td derecha className="w-24 py-2">
          {sucio && (
            <Button size="sm" loading={ocupado} onClick={() => void guardar()}>
              Guardar
            </Button>
          )}
        </Td>
      </tr>
      {abierto && (
        <tr>
          <Td colSpan={CLAVES.length + 2} className="bg-surface-2/60">
            <div className="grid gap-3 sm:grid-cols-[220px_1fr]">
              <label className="block text-caption font-medium">
                Nombre
                <Input value={nombre} onChange={(e) => setNombre(e.target.value)} className="mt-1 h-9 text-small" />
              </label>
              <label className="block text-caption font-medium">
                Qué tipo de persona es
                <Input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className="mt-1 h-9 text-small" />
              </label>
            </div>
          </Td>
        </tr>
      )}
    </>
  );
}
