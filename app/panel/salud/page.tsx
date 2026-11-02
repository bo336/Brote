'use client';

import { useQuery } from '@tanstack/react-query';
import { fecha, Actualizar, Cargando, ErrorCarga, Etiqueta, Medidor, PageHeader, Section, Stat, StatGrid, Tabla, Td, Th, Vacio, fechaHora, hace, num } from '@/components/panel/ui';
import { CUENTA, adminSalud } from '@/lib/api/admin';

/**
 * `/panel/salud` — si algo está roto, se ve acá antes de que alguien avise:
 * la base contra el tope del plan, las tareas programadas, la cola de avisos y
 * los errores que le saltan a la gente en el navegador.
 */

const CRON: Record<string, string> = {
  'brote-academia-plan': 'Planear contenido de la Academia',
  'brote-academia-submit': 'Mandar a generar contenido',
  'brote-academia-poll': 'Recibir el contenido generado',
  'brote-analitica-limpieza': 'Limpiar datos viejos de uso',
  'brote-avisos-plaza': 'Avisar novedades de la Plaza',
  'brote-avisos-racha': 'Avisar rachas en riesgo',
  'brote-avisos-reenganche': 'Avisar a quien dejó de venir',
  'brote-billing': 'Cobros y vencimientos',
  'brote-daily-maintenance': 'Mantenimiento diario',
  'brote-desafios-vencer': 'Vencer desafíos y certificados',
  'brote-dolar': 'Pedir el dólar oficial',
  'brote-dolar-leer': 'Guardar el dólar oficial',
  'brote-expire-plans': 'Vencer planes de Brote+',
  'brote-link-health': 'Revisar enlaces rotos',
  'brote-link-health-leer': 'Guardar enlaces rotos',
  'brote-negocios-diario': 'Revisión diaria de empresas',
  'brote-news-retention': 'Limpiar noticias viejas',
  'brote-plus-protectores': 'Protectores de racha de Brote+',
  'brote-proyectos-revisar': 'Revisar organizadores de proyectos',
  'brote-publicidad-limpieza': 'Limpiar métricas de publicidad',
  'brote-push': 'Enviar avisos al teléfono',
  'brote-rangos-cerrar': 'Cerrar el período de rangos',
  'brote-refresh-news': 'Traer noticias',
  'brote-resumen-equipo': 'Tu resumen de cada mañana',
  'brote-tag-kid-news': 'Marcar noticias aptas para chicos',
  'brote-weekly-recap': 'Resumen semanal de cada persona',
};

const mb = (b: number) => (b >= 1048576 ? `${Math.round(b / 1048576)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

export default function SaludPage() {
  const q = useQuery({ queryKey: ['panel', 'salud'], queryFn: () => adminSalud(CUENTA), refetchInterval: 120_000 });

  const cabecera = (
    <PageHeader
      eyebrow="Sistema"
      title="Salud"
      description="Si algo está roto, se ve acá antes de que alguien te avise."
      actions={<Actualizar onClick={() => void q.refetch()} cargando={q.isFetching} />}
    />
  );
  if (q.isError || (q.isFetched && !q.data)) return <div>{cabecera}<ErrorCarga onReintentar={() => void q.refetch()} /></div>;
  if (!q.data) return <div>{cabecera}<Cargando /></div>;

  const s = q.data;
  const fallos = s.crons.filter((c) => c.fallos_24h > 0).length;
  const http = s.llamadas_24h;

  return (
    <div>
      {cabecera}
      <div className="space-y-6">
        <StatGrid>
          <Stat label="Errores en la app hoy" value={num(s.errores.hoy)} hint={`${num(s.errores.semana)} en 7 días`} tone={Number(s.errores.hoy) > 0 ? 'atencion' : 'bien'} />
          <Stat label="Tareas con fallos" value={num(fallos)} hint={`de ${num(s.crons.length)} programadas`} tone={fallos > 0 ? 'mal' : 'bien'} />
          <Stat label="Avisos atrasados" value={num(s.avisos.vencidas)} hint={`${num(s.avisos.enviadas_24h)} enviados en 24 h`} tone={s.avisos.vencidas > 0 ? 'mal' : 'bien'} />
          <Stat
            label="Llamadas a funciones fallidas"
            value={num(http.fallidas)}
            hint={`de ${num(http.total)} en 24 h`}
            tone={Number(http.fallidas) > 0 ? 'atencion' : 'bien'}
          />
        </StatGrid>

        <Section title="Errores que le saltan a la gente" description="Últimos 7 días, agrupados. Sin datos de quién." sinPadding>
          {s.errores.lista.length === 0 ? (
            <Vacio>Ningún error en los últimos 7 días.</Vacio>
          ) : (
            <Tabla minimo={640}>
              <thead>
                <tr>
                  <Th>Error</Th>
                  <Th>Dónde</Th>
                  <Th derecha>Veces</Th>
                  <Th>Última vez</Th>
                </tr>
              </thead>
              <tbody>
                {s.errores.lista.map((e, i) => (
                  <tr key={i}>
                    <Td className="max-w-[420px] break-words font-mono text-caption">{e.mensaje}</Td>
                    <Td className="max-w-[200px] truncate text-caption">{e.ruta ?? '—'}</Td>
                    <Td derecha>{num(e.veces)}</Td>
                    <Td className="whitespace-nowrap">{hace(e.ultimo_at)}</Td>
                  </tr>
                ))}
              </tbody>
            </Tabla>
          )}
        </Section>

        <Section title="Tareas programadas" description="Lo que corre solo: si una falla, algo deja de pasar." sinPadding>
          {s.crons.length === 0 ? (
            <Vacio>No se pudo leer el estado de las tareas.</Vacio>
          ) : (
            <Tabla minimo={620}>
              <thead>
                <tr>
                  <Th>Tarea</Th>
                  <Th>Última vez</Th>
                  <Th>Estado</Th>
                  <Th derecha>Fallos (24 h)</Th>
                </tr>
              </thead>
              <tbody>
                {s.crons.map((c) => (
                  <tr key={c.nombre}>
                    <Td>
                      <span className="block font-medium">{CRON[c.nombre] ?? c.nombre}</span>
                      {c.fallos_24h > 0 && c.ultimo_error && <span className="mt-0.5 block font-mono text-caption text-brote-coral">{c.ultimo_error}</span>}
                    </Td>
                    <Td className="whitespace-nowrap">{hace(c.ultimo_at)}</Td>
                    <Td>
                      {!c.activo ? (
                        <Etiqueta>Apagada</Etiqueta>
                      ) : c.fallos_24h > 0 ? (
                        <Etiqueta tono="mal">Con fallos</Etiqueta>
                      ) : c.ultimo_at ? (
                        <Etiqueta tono="ok">Bien</Etiqueta>
                      ) : (
                        <Etiqueta>Todavía no corrió</Etiqueta>
                      )}
                    </Td>
                    <Td derecha>{num(c.fallos_24h)}</Td>
                  </tr>
                ))}
              </tbody>
            </Tabla>
          )}
        </Section>

        <div className="grid gap-6 lg:grid-cols-2">
          <Section title="Base de datos">
            <Medidor etiqueta="Espacio usado" usado={s.base.bytes} tope={s.base.tope_bytes} detalle={`${mb(s.base.bytes)} de 500 MB del plan gratis`} />
            <ul className="mt-5 space-y-2 text-small">
              {s.base.tablas.map((t) => (
                <li key={t.tabla} className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate font-mono text-caption">{t.tabla}</span>
                  <span className="shrink-0 tnum">{mb(t.bytes)}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Lo demás">
            <dl className="space-y-3 text-small">
              <Fila k="Claves de avisos" v={s.avisos.claves ? 'Listas' : 'Falta generarlas'} ok={s.avisos.claves} />
              <Fila k="Dispositivos con avisos" v={num(s.avisos.dispositivos)} />
              <Fila k="Avisos fallidos (24 h)" v={num(s.avisos.fallidas_24h)} ok={s.avisos.fallidas_24h === 0} />
              <Fila k="Noticias" v={`${num(s.noticias.activas)} activas · ${hace(s.noticias.ultima_at)}`} />
              <Fila k="Dólar oficial" v={s.tipo_cambio ? `$ ${num(s.tipo_cambio.venta)} (${fecha(s.tipo_cambio.fecha)})` : 'Sin cotización reciente'} ok={!!s.tipo_cambio} />
              <Fila k="Fallos del mundo 3D (24 h)" v={num(s.mundo_errores_24h)} ok={s.mundo_errores_24h === 0} />
            </dl>
          </Section>
        </div>

        <Section title="Acceso al panel" description="Sólo tu cuenta puede abrirlo. Si otra lo intenta, queda acá y te llega un aviso.">
          <p className="text-small">
            Tu última entrada: <span className="font-semibold">{fechaHora(s.accesos.ultimo_tuyo)}</span>
          </p>
          {s.accesos.intentos.length === 0 ? (
            <p className="mt-2 text-small text-muted-foreground">Nadie más intentó entrar.</p>
          ) : (
            <ul className="mt-3 space-y-1.5 text-small">
              {s.accesos.intentos.map((i, k) => (
                <li key={k} className="flex items-center gap-2">
                  <Etiqueta tono="atencion">Intento</Etiqueta>
                  <span className="font-medium">{i.quien}</span>
                  <span className="text-muted-foreground">{fechaHora(i.at)}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}

function Fila({ k, v, ok }: { k: string; v: string; ok?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="flex items-center gap-2 text-right font-semibold tnum">
        {v}
        {ok === true && <Etiqueta tono="ok">Bien</Etiqueta>}
        {ok === false && <Etiqueta tono="mal">Mirar</Etiqueta>}
      </dd>
    </div>
  );
}
