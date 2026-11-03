'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Actualizar, Cargando, ErrorCarga, FilaInterruptor, PageHeader, Section, Stat, StatGrid, num } from '@/components/panel/ui';
import { CUENTA, adminDashboard, adminDemoResumen, adminSetSetting, adminSetSimulatedCount } from '@/lib/api/admin';
import { toast } from '@/stores/toast';

/**
 * `/panel/ajustes` — los interruptores y valores de la app. Lo que tiene su
 * propia sección (publicidad, precios) se maneja allá, con su contexto.
 */

const EN_OTRA_SECCION = new Set([
  'simulated_players_enabled',
  'ads_enabled',
  'plus_venta_activa',
  'plus_usd_mes',
  'plus_usd_anio',
  'mercado_cobro_vendedores',
  'mercado_vendedor_usd',
  'negocios_cobro_activo',
  'negocios_precio_semilla',
  'negocios_precio_raiz',
  'negocios_precio_bosque',
]);

const CONTENIDO: Record<string, string> = {
  real_users: 'Personas reales',
  simulated_players: 'Jugadores simulados',
  completions_total: 'Acciones hechas',
  activities: 'Acciones en el catálogo',
  lessons: 'Lecciones',
  news_active: 'Noticias activas',
  feed_posts: 'Publicaciones',
  competitions: 'Competencias',
  projects: 'Proyectos',
};

export default function AjustesPanelPage() {
  const q = useQuery({ queryKey: ['panel', 'ajustes'], queryFn: () => adminDashboard(CUENTA) });
  const demo = useQuery({ queryKey: ['panel', 'demo'], queryFn: () => adminDemoResumen(CUENTA) });
  const [simulados, setSimulados] = useState('');
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    if (q.data?.ok) setSimulados(String(q.data.stats.simulated_players ?? 0));
  }, [q.data]);

  async function guardar(key: string, value: boolean | number) {
    const r = await adminSetSetting(CUENTA, key, value);
    if (!r.ok) {
      toast.error('No se pudo guardar', r.error);
      return;
    }
    toast.success('Guardado');
    void q.refetch();
    void demo.refetch();
  }

  const cabecera = (
    <PageHeader
      eyebrow="Sistema"
      title="Ajustes"
      description="Los interruptores de la app. Los cambios llegan a todos sin hacer un deploy."
      actions={<Actualizar onClick={() => void q.refetch()} cargando={q.isFetching} />}
    />
  );
  if (q.isError || (q.isFetched && !q.data?.ok)) return <div>{cabecera}<ErrorCarga onReintentar={() => void q.refetch()} /></div>;
  if (!q.data) return <div>{cabecera}<Cargando /></div>;

  const ajustes = Object.entries(q.data.settings).filter(([k]) => !EN_OTRA_SECCION.has(k));
  const si = ajustes.filter(([, s]) => typeof s.value === 'boolean');
  const valores = ajustes.filter(([, s]) => typeof s.value === 'number');

  return (
    <div>
      {cabecera}
      <div className="space-y-6">
        <StatGrid columnas={4}>
          {Object.entries(CONTENIDO).map(([k, label]) =>
            q.data?.stats[k] == null ? null : <Stat key={k} label={label} value={num(q.data.stats[k])} />,
          )}
        </StatGrid>

        <Section
          title="Datos de demostración"
          description="Lo que no es real: sirve para que la app no se vea vacía. Apagado, desaparece todo de una; prendido, vuelve igual. Nada se borra."
        >
          <div className="-my-3.5">
            <FilaInterruptor
              titulo={q.data.settings.simulated_players_enabled?.value === true ? 'Se está mostrando' : 'No se está mostrando'}
              detalle={
                demo.data?.ok
                  ? `${num(demo.data.jugadores)} jugadores simulados · ${num(demo.data.tiendas)} tiendas y ${num(demo.data.productos)} productos DEMO · ${num(demo.data.proyectos)} proyectos de ejemplo`
                  : undefined
              }
              valor={q.data.settings.simulated_players_enabled?.value === true}
              onCambiar={(v) => void guardar('simulated_players_enabled', v)}
            />
          </div>
        </Section>

        <div className="grid items-start gap-6 lg:grid-cols-2">
          <Section title="Interruptores">
            {si.length === 0 ? (
              <p className="text-small text-muted-foreground">No hay interruptores.</p>
            ) : (
              <div className="-my-3.5 divide-y divide-hairline">
                {si.map(([k, s]) => (
                  <FilaInterruptor key={k} titulo={s.description ?? k} valor={s.value === true} onCambiar={(v) => void guardar(k, v)} />
                ))}
              </div>
            )}
          </Section>

          <div className="space-y-6">
            <Section title="Valores">
              <div className="-my-3 divide-y divide-hairline">
                {valores.map(([k, s]) => (
                  <Valor key={k} clave={k} descripcion={s.description} valor={s.value as number} onGuardar={(v) => guardar(k, v)} />
                ))}
              </div>
            </Section>

            <Section title="Cuántos jugadores simulados" description="Llenan los rankings públicos para que no se vean vacíos. Nunca aparecen en amigos, competencias ni ligas, y no cuentan en ningún número de este panel. 0 los elimina.">
              <div className="flex max-w-xs gap-2">
                <Input type="number" min={0} max={500} value={simulados} onChange={(e) => setSimulados(e.target.value)} className="tnum" aria-label="Cantidad de jugadores simulados" />
                <Button
                  variant="secondary"
                  loading={ocupado}
                  onClick={async () => {
                    setOcupado(true);
                    const r = await adminSetSimulatedCount(CUENTA, Number(simulados) || 0);
                    setOcupado(false);
                    if (!r.ok) return toast.error('No se pudo', r.error);
                    toast.success('Listo', `Ahora hay ${r.count} jugadores simulados`);
                    void q.refetch();
                  }}
                >
                  Aplicar
                </Button>
              </div>
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}

function Valor({ clave, descripcion, valor, onGuardar }: { clave: string; descripcion: string | null; valor: number; onGuardar: (v: number) => void | Promise<void> }) {
  const [borrador, setBorrador] = useState(String(valor));
  useEffect(() => setBorrador(String(valor)), [valor]);
  const n = Number(borrador);
  const sucio = borrador.trim() !== '' && Number.isFinite(n) && n !== valor;
  return (
    <div className="flex items-center gap-3 py-3">
      <p className="min-w-0 flex-1 text-small font-medium leading-snug">{descripcion ?? clave}</p>
      <Input type="number" value={borrador} onChange={(e) => setBorrador(e.target.value)} className="h-9 w-24 shrink-0 text-right text-small tnum" aria-label={descripcion ?? clave} />
      <Button size="sm" variant="secondary" disabled={!sucio} onClick={() => void onGuardar(n)}>
        Guardar
      </Button>
    </div>
  );
}
