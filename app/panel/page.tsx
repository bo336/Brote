'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, ChevronRight } from 'lucide-react';
import { Actualizar, Delta, ErrorCarga, Etiqueta, Medidor, PageHeader, Section, Stat, StatGrid, hace, num, pesos } from '@/components/panel/ui';
import { Barras, SerieDiaria } from '@/components/panel/analitica/piezas';
import { Skeleton } from '@/components/ui/skeleton';
import { CUENTA, adminAnalitica, adminAnaliticaExtra, adminPendientes, adminSalud } from '@/lib/api/admin';
import { NOMBRE_SECCION } from '@/lib/panel/nombres';

/**
 * `/panel` — la primera pantalla: qué espera una respuesta, cómo viene la app y
 * si algo está roto. Todo lo demás está a un toque en el menú.
 */

const PENDIENTES: { clave: string; texto: (n: number) => string; href: string; urgente?: boolean }[] = [
  { clave: 'reportes_plaza', texto: (n) => (n === 1 ? 'reporte en la Plaza' : 'reportes en la Plaza'), href: '/panel/moderacion', urgente: true },
  { clave: 'negocios', texto: (n) => (n === 1 ? 'empresa para revisar' : 'empresas para revisar'), href: '/panel/negocios' },
  { clave: 'desafios', texto: (n) => (n === 1 ? 'entrega de desafío' : 'entregas de desafíos'), href: '/panel/desafios' },
  { clave: 'listados', texto: (n) => (n === 1 ? 'producto para revisar' : 'productos para revisar'), href: '/panel/listados' },
  { clave: 'auditoria', texto: (n) => (n === 1 ? 'producto para auditar' : 'productos para auditar'), href: '/panel/listados' },
  { clave: 'reportes_mercado', texto: (n) => (n === 1 ? 'reporte en el Mercado' : 'reportes en el Mercado'), href: '/panel/reportes', urgente: true },
  { clave: 'objetivos', texto: (n) => (n === 1 ? 'objetivo para cerrar' : 'objetivos para cerrar'), href: '/panel/objetivos' },
  { clave: 'compromisos', texto: (n) => (n === 1 ? 'compromiso para mirar' : 'compromisos para mirar'), href: '/panel/compromisos' },
  { clave: 'academia', texto: (n) => (n === 1 ? 'contenido de la Academia' : 'contenidos de la Academia'), href: '/panel/academia' },
  { clave: 'pagos_fallidos', texto: (n) => (n === 1 ? 'cobro con problemas' : 'cobros con problemas'), href: '/panel/suscripciones', urgente: true },
  { clave: 'errores_app_24h', texto: (n) => (n === 1 ? 'error en la app (24 h)' : 'errores en la app (24 h)'), href: '/panel/salud' },
];

export default function ResumenPage() {
  const a = useQuery({ queryKey: ['panel', 'analitica', 30], queryFn: () => adminAnalitica(CUENTA, 30) });
  const x = useQuery({ queryKey: ['panel', 'extra', 30], queryFn: () => adminAnaliticaExtra(CUENTA, 30) });
  const p = useQuery({ queryKey: ['panel', 'pendientes'], queryFn: () => adminPendientes(CUENTA) });
  const s = useQuery({ queryKey: ['panel', 'salud'], queryFn: () => adminSalud(CUENTA) });

  const refrescar = () => {
    void a.refetch();
    void x.refetch();
    void p.refetch();
    void s.refetch();
  };

  const r = a.data?.resumen;
  const c = x.data?.comparado;
  const esperan = PENDIENTES.map((d) => ({ ...d, n: Number(p.data?.[d.clave] ?? 0) })).filter((d) => d.n > 0);
  const d7 = x.data?.retencion.d7;
  const crons = s.data?.crons ?? [];
  const cronsMal = crons.filter((j) => j.fallos_24h > 0);
  const serie = a.data?.serie ?? [];
  const hoyTexto = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div>
      <PageHeader
        eyebrow={hoyTexto}
        title="Resumen"
        description="Lo que espera una respuesta y cómo viene Brote."
        actions={<Actualizar onClick={refrescar} cargando={a.isFetching || x.isFetching} />}
      />

      <div className="space-y-6">
        <Section title="Lo que te espera" description={esperan.length ? 'Del otro lado hay alguien esperando.' : undefined} sinPadding>
          {p.isLoading ? (
            <div className="p-5">
              <Skeleton className="h-20 w-full" />
            </div>
          ) : esperan.length === 0 ? (
            <p className="flex items-center gap-2.5 px-5 py-5 text-small">
              <CheckCircle2 className="h-5 w-5 text-brote-green" /> Nada esperando respuesta. Todo al día.
            </p>
          ) : (
            <ul className="grid divide-y divide-hairline sm:grid-cols-2 sm:divide-y-0">
              {esperan.map((e) => (
                <li key={e.clave} className="sm:border-b sm:border-hairline sm:odd:border-r">
                  <Link href={e.href} className="group flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-surface-2">
                    <span className="font-display text-h2 font-extrabold leading-none tnum">{num(e.n)}</span>
                    <span className="min-w-0 flex-1 text-small font-medium">{e.texto(e.n)}</span>
                    {e.urgente && <Etiqueta tono="atencion">Importa</Etiqueta>}
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {a.isError || x.isError || (a.isFetched && !a.data) ? (
          <ErrorCarga onReintentar={refrescar} />
        ) : !r || !c ? (
          <StatGrid>
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="h-32 rounded-card" />
            ))}
          </StatGrid>
        ) : (
          <>
            <StatGrid>
              <Stat
                label="Personas"
                value={num(r.usuarios)}
                delta={<Delta actual={c.nuevos_7d} previo={c.nuevos_7d_prev} />}
                hint={`${num(c.nuevos_7d)} nuevas en 7 días`}
                href="/panel/personas"
              />
              <Stat label="Activas hoy" value={num(c.activos_hoy)} delta={<Delta actual={c.activos_hoy} previo={c.activos_ayer} sufijo="contra ayer" />} />
              <Stat label="Activas en 7 días" value={num(c.activos_7d)} delta={<Delta actual={c.activos_7d} previo={c.activos_7d_prev} sufijo="contra la semana pasada" />} />
              <Stat label="Acciones hoy" value={num(c.acciones_hoy)} delta={<Delta actual={c.acciones_hoy} previo={c.acciones_ayer} sufijo="contra ayer" />} />
              <Stat
                label="Vuelven cada día"
                value={`${x.data?.pegajosidad.porcentaje ?? 0} %`}
                hint={`${x.data?.pegajosidad.dau_promedio ?? 0} por día de ${num(x.data?.pegajosidad.mau)} en el mes`}
              />
              <Stat
                label="Siguen a la semana"
                value={d7 && d7.base > 0 ? `${Math.round((100 * d7.vuelven) / d7.base)} %` : '—'}
                hint={d7 && d7.base > 0 ? `${num(d7.vuelven)} de ${num(d7.base)} volvieron a los 7 días` : 'Todavía sin datos'}
                href="/panel/analitica"
              />
              <Stat label="Ingreso mensual" value={pesos(x.data?.negocio.mrr_ars)} hint="Brote+, tiendas y empresas" href="/panel/suscripciones" />
              <Stat label="Brote+" value={num(x.data?.negocio.plus_activas)} hint={`${num(r.con_avisos)} con avisos · ${num(r.app_instalada)} con la app`} />
            </StatGrid>

            <div className="grid gap-6 lg:grid-cols-2">
              <Section title="Personas activas por día" description="Últimos 30 días.">
                <SerieDiaria titulo="Activas" datos={serie as never} clave="activos" forma="area" />
              </Section>
              <Section title="Acciones por día" description="Últimos 30 días.">
                <SerieDiaria titulo="Acciones" datos={serie as never} clave="acciones" forma="columnas" />
              </Section>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Section title="Lo más usado esta semana" description="Personas que entraron a cada parte.">
                <Barras
                  filas={(a.data?.secciones ?? [])
                    .slice(0, 7)
                    .map((f) => ({ etiqueta: NOMBRE_SECCION[f.clave.replace('sec:', '')] ?? f.clave.replace('sec:', ''), valor: Number(f.usuarios_7d) }))}
                />
              </Section>

              <Section
                title="Salud del sistema"
                actions={
                  <Link href="/panel/salud" className="text-caption font-semibold text-primary hover:underline">
                    Ver todo
                  </Link>
                }
              >
                {s.data ? (
                  <div className="space-y-4">
                    <Medidor
                      etiqueta="Base de datos"
                      usado={s.data.base.bytes}
                      tope={s.data.base.tope_bytes}
                      detalle={`${Math.round(s.data.base.bytes / 1048576)} MB de 500 MB del plan gratis`}
                    />
                    <ul className="space-y-2.5 text-small">
                      <FilaSalud ok={cronsMal.length === 0} bien={`${crons.length} tareas programadas sin fallos`} mal={cronsMal.length === 1 ? 'Una tarea falló en 24 h' : `${cronsMal.length} tareas fallaron en 24 h`} />
                      <FilaSalud
                        ok={s.data.avisos.vencidas === 0}
                        bien={`Avisos al día · ${num(s.data.avisos.enviadas_24h)} enviados en 24 h`}
                        mal={`${num(s.data.avisos.vencidas)} avisos atrasados en la cola`}
                      />
                      <FilaSalud ok={Number(s.data.errores.hoy) === 0} bien="Sin errores hoy en la app" mal={`${num(s.data.errores.hoy)} errores hoy en la app`} />
                      <FilaSalud
                        ok={!!s.data.noticias.ultima_at && Date.now() - new Date(s.data.noticias.ultima_at).getTime() < 36 * 3600_000}
                        bien={`Noticias al día · ${hace(s.data.noticias.ultima_at)}`}
                        mal={`Noticias sin actualizar · ${hace(s.data.noticias.ultima_at)}`}
                      />
                    </ul>
                  </div>
                ) : (
                  <Skeleton className="h-40 w-full" />
                )}
              </Section>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function FilaSalud({ ok, bien, mal }: { ok: boolean; bien: string; mal: string }) {
  return (
    <li className="flex items-center gap-2.5">
      <Etiqueta tono={ok ? 'ok' : 'mal'}>{ok ? 'Bien' : 'Mirar'}</Etiqueta>
      <span className="min-w-0">{ok ? bien : mal}</span>
    </li>
  );
}
