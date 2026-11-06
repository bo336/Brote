'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Barras, Cohortes, Embudo, MapaHorarios, SerieDiaria } from '@/components/panel/analitica/piezas';
import { Actualizar, Cargando, Delta, ErrorCarga, Etiqueta, PageHeader, Pestanas, Section, Stat, StatGrid, Tabla, Td, Th, Vacio, fecha, num, pesos } from '@/components/panel/ui';
import { ChipRail } from '@/components/ui/chip-rail';
import { DOMAINS } from '@/lib/domains';
import { RANKS } from '@/lib/ranks';
import { CUENTA, adminAnalitica, adminAnaliticaExtra, type Analitica, type AnaliticaExtra } from '@/lib/api/admin';
import {
  NOMBRE_AVISO,
  NOMBRE_EVENTO,
  NOMBRE_NAVEGADOR,
  NOMBRE_PLATAFORMA,
  NOMBRE_SECCION,
  NOMBRE_SISTEMA,
  NOMBRE_TIPO_CUENTA,
  NOMBRE_TIPO_PASO,
} from '@/lib/panel/nombres';

/**
 * `/panel/analitica` — cuánta gente usa Brote, qué usa, si vuelve y dónde se cae.
 *
 * Un "día activo" es abrir la app o marcar una acción. Las cuentas de prueba no
 * cuentan nunca. Sale de `admin_analitica` (0128) y `admin_analitica_extra` (0138).
 */

type Vista = 'crecimiento' | 'uso' | 'academia' | 'comunidad' | 'ingresos' | 'audiencia';

const PERIODOS = [
  { value: '14', label: '14 días' },
  { value: '30', label: '30 días' },
  { value: '60', label: '60 días' },
  { value: '90', label: '90 días' },
];

const aFilas = (o: Record<string, number> | undefined, nombres: Record<string, string>) =>
  Object.entries(o ?? {})
    .map(([k, v]) => ({ etiqueta: nombres[k] ?? k, valor: Number(v) }))
    .sort((a, b) => b.valor - a.valor);

const pct = (a: number, b: number) => (b > 0 ? `${Math.round((100 * a) / b)} %` : '—');

export default function AnaliticaPage() {
  const [vista, setVista] = useState<Vista>('crecimiento');
  const [dias, setDias] = useState('30');
  const a = useQuery({ queryKey: ['panel', 'analitica', Number(dias)], queryFn: () => adminAnalitica(CUENTA, Number(dias)) });
  const x = useQuery({ queryKey: ['panel', 'extra', Number(dias)], queryFn: () => adminAnaliticaExtra(CUENTA, Number(dias)) });

  const fallo = a.isError || x.isError || (a.isFetched && !a.data) || (x.isFetched && !x.data);
  const refrescar = () => {
    void a.refetch();
    void x.refetch();
  };

  return (
    <div>
      <PageHeader
        eyebrow="Personas"
        title="Analítica"
        description="Cuánta gente usa Brote, qué usa, si vuelve y dónde se cae. Las cuentas de prueba no cuentan."
        actions={
          <>
            <ChipRail options={PERIODOS} value={dias} onChange={setDias} layoutId="analitica-periodo" />
            <Actualizar onClick={refrescar} cargando={a.isFetching || x.isFetching} />
          </>
        }
      />

      <Pestanas<Vista>
        valor={vista}
        onCambiar={setVista}
        opciones={[
          { value: 'crecimiento', label: 'Crecimiento' },
          { value: 'uso', label: 'Uso' },
          { value: 'academia', label: 'Academia' },
          { value: 'comunidad', label: 'Comunidad' },
          { value: 'ingresos', label: 'Ingresos' },
          { value: 'audiencia', label: 'Audiencia' },
        ]}
      />

      {fallo ? (
        <ErrorCarga onReintentar={refrescar} />
      ) : !a.data || !x.data ? (
        <Cargando />
      ) : (
        <div className="space-y-6">
          {vista === 'crecimiento' && <Crecimiento a={a.data} x={x.data} />}
          {vista === 'uso' && <Uso a={a.data} x={x.data} />}
          {vista === 'academia' && <Academia a={a.data} x={x.data} />}
          {vista === 'comunidad' && <Comunidad a={a.data} x={x.data} />}
          {vista === 'ingresos' && <Ingresos x={x.data} />}
          {vista === 'audiencia' && <Audiencia a={a.data} x={x.data} />}
        </div>
      )}
    </div>
  );
}

function Crecimiento({ a, x }: { a: Analitica; x: AnaliticaExtra }) {
  const r = a.resumen;
  const c = x.comparado;
  const tasa = (k: 'd1' | 'd7' | 'd30') => pct(x.retencion[k].vuelven, x.retencion[k].base);
  const altas = a.serie.reduce((t, d) => t + Number(d.altas), 0);
  return (
    <>
      <StatGrid>
        <Stat label="Personas en total" value={num(r.usuarios)} hint={`${num(r.onboarding)} terminaron el onboarding`} />
        <Stat label="Nuevas en 30 días" value={num(c.nuevos_30d)} delta={<Delta actual={c.nuevos_30d} previo={c.nuevos_30d_prev} sufijo="contra los 30 anteriores" />} />
        <Stat label="Activas en 30 días" value={num(c.activos_30d)} delta={<Delta actual={c.activos_30d} previo={c.activos_30d_prev} sufijo="contra los 30 anteriores" />} />
        <Stat label="Vuelven cada día" value={`${x.pegajosidad.porcentaje} %`} hint={`${x.pegajosidad.dau_promedio} por día de ${num(x.pegajosidad.mau)} en el mes`} />
      </StatGrid>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Altas por día" description={`${num(altas)} en el período.`}>
          <SerieDiaria titulo="Altas" datos={a.serie as never} clave="altas" forma="columnas" />
        </Section>
        <Section title="Personas activas por día">
          <SerieDiaria titulo="Activas" datos={a.serie as never} clave="activos" forma="area" />
        </Section>
      </div>

      <StatGrid columnas={3}>
        <Stat label="Vuelven al día siguiente" value={tasa('d1')} hint={`${num(x.retencion.d1.vuelven)} de ${num(x.retencion.d1.base)}`} />
        <Stat label="Siguen a los 7 días" value={tasa('d7')} hint={`${num(x.retencion.d7.vuelven)} de ${num(x.retencion.d7.base)}`} />
        <Stat label="Siguen a los 30 días" value={tasa('d30')} hint={`${num(x.retencion.d30.vuelven)} de ${num(x.retencion.d30.base)}`} />
      </StatGrid>

      <Section
        title="De dónde sale el crecimiento, semana a semana"
        description="Quién vino esa semana comparado con la anterior. Si se pierde más de lo que entra, la app se achica aunque haya altas."
        sinPadding
      >
        <Tabla minimo={560}>
          <thead>
            <tr>
              <Th>Semana del</Th>
              <Th derecha>Nuevas</Th>
              <Th derecha>Siguen</Th>
              <Th derecha>Volvieron</Th>
              <Th derecha>Se fueron</Th>
              <Th derecha>Balance</Th>
            </tr>
          </thead>
          <tbody>
            {[...x.contabilidad].reverse().map((f) => {
              const balance = Number(f.nuevos) + Number(f.recuperados) - Number(f.perdidos);
              return (
                <tr key={f.semana}>
                  <Td className="whitespace-nowrap font-medium">{fecha(f.semana)}</Td>
                  <Td derecha>{num(f.nuevos)}</Td>
                  <Td derecha>{num(f.retenidos)}</Td>
                  <Td derecha>{num(f.recuperados)}</Td>
                  <Td derecha>{num(f.perdidos)}</Td>
                  <Td derecha>
                    <Etiqueta tono={balance > 0 ? 'ok' : balance < 0 ? 'mal' : 'neutro'}>
                      {balance > 0 ? '+' : ''}
                      {num(balance)}
                    </Etiqueta>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Tabla>
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Del registro al hábito" description="Quienes se registraron en el período: hasta dónde llegó cada uno.">
          <Embudo
            pasos={[
              { etiqueta: 'Se registraron', valor: a.embudo.registrados },
              { etiqueta: 'Terminaron el onboarding', valor: a.embudo.onboarding },
              { etiqueta: 'Hicieron una acción', valor: a.embudo.primera_accion },
              { etiqueta: 'Volvieron otro día', valor: a.embudo.volvio },
              { etiqueta: '7 días activos', valor: a.embudo.siete_dias },
              { etiqueta: 'Racha de 7', valor: a.embudo.racha_7 },
            ]}
          />
        </Section>
        <Section title="Retención por semana de alta" description="Qué parte de cada grupo volvió en las semanas siguientes.">
          <Cohortes filas={a.cohortes} />
        </Section>
      </div>
    </>
  );
}

function Uso({ a, x }: { a: Analitica; x: AnaliticaExtra }) {
  const activos7 = x.comparado.activos_7d;
  const temas = useMemo(
    () =>
      Object.entries(a.contenido.dominios ?? {})
        .map(([k, v]) => ({ etiqueta: DOMAINS.find((d) => d.slug === k)?.name_es ?? k, valor: Number(v) }))
        .sort((p, q) => q.valor - p.valor),
    [a.contenido.dominios],
  );
  // Los pasos del onboarding (onb_1… antes, onb_vos… desde 0145) no son eventos sueltos.
  const eventos = a.eventos.filter((e) => !/onb_(\d|vos|adulto|tiempo|temas|casa|seguir|mundo|dia)/.test(e.clave));
  return (
    <>
      <StatGrid>
        <Stat label="Acciones en 7 días" value={num(x.comparado.acciones_7d)} delta={<Delta actual={x.comparado.acciones_7d} previo={x.comparado.acciones_7d_prev} sufijo="contra la anterior" />} />
        <Stat label="Acciones por persona activa" value={x.acciones_por_activo_7d ?? '—'} hint="en los últimos 7 días" />
        <Stat label="Pantallas por persona y día" value={x.profundidad.vistas_por_persona_dia} hint="cuando entra" />
        <Stat label="Secciones por persona y día" value={x.profundidad.secciones_por_persona_dia} hint="cuánto de la app recorre" />
      </StatGrid>

      <Section title="Qué parte de la app usa la gente" description="Personas distintas que entraron a cada sección." sinPadding>
        {a.secciones.length === 0 ? (
          <Vacio>Se llena a medida que la gente use la app.</Vacio>
        ) : (
          <Tabla minimo={520}>
            <thead>
              <tr>
                <Th>Sección</Th>
                <Th derecha>Personas (7 días)</Th>
                <Th derecha>De las activas</Th>
                <Th derecha>Personas (30 días)</Th>
                <Th derecha>Pantallas (7 días)</Th>
              </tr>
            </thead>
            <tbody>
              {a.secciones.map((s) => (
                <tr key={s.clave}>
                  <Td className="font-medium">{NOMBRE_SECCION[s.clave.replace('sec:', '')] ?? s.clave.replace('sec:', '')}</Td>
                  <Td derecha>{num(s.usuarios_7d)}</Td>
                  <Td derecha>{pct(Number(s.usuarios_7d), activos7)}</Td>
                  <Td derecha>{num(s.usuarios_30d)}</Td>
                  <Td derecha>{num(s.vistas_7d)}</Td>
                </tr>
              ))}
            </tbody>
          </Tabla>
        )}
      </Section>

      <Section title="Cuándo se hacen las acciones" description="Hora de Argentina, últimos 30 días. Sirve para elegir a qué hora mandar avisos o publicar.">
        <MapaHorarios datos={x.horarios} />
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Acciones más hechas" description="Últimos 7 días." sinPadding>
          {a.contenido.acciones_top.length === 0 ? (
            <Vacio>Todavía no hay acciones esta semana.</Vacio>
          ) : (
            <Tabla minimo={380}>
              <thead>
                <tr>
                  <Th>Acción</Th>
                  <Th derecha>Veces</Th>
                  <Th derecha>Personas</Th>
                </tr>
              </thead>
              <tbody>
                {a.contenido.acciones_top.map((f) => (
                  <tr key={f.titulo}>
                    <Td className="max-w-[260px] truncate font-medium">{f.titulo}</Td>
                    <Td derecha>{num(f.veces)}</Td>
                    <Td derecha>{num(f.personas)}</Td>
                  </tr>
                ))}
              </tbody>
            </Tabla>
          )}
        </Section>
        <Section title="Por tema" description="Acciones de los últimos 7 días.">
          <Barras filas={temas} />
        </Section>
        <Section title="Rachas ahora" description="Días seguidos de cada persona.">
          <Barras
            filas={[
              { etiqueta: 'Sin racha', valor: Number(a.rachas.cero) },
              { etiqueta: '1 a 2 días', valor: Number(a.rachas.de_1_a_2) },
              { etiqueta: '3 a 6 días', valor: Number(a.rachas.de_3_a_6) },
              { etiqueta: '7 a 29 días', valor: Number(a.rachas.de_7_a_29) },
              { etiqueta: '30 o más', valor: Number(a.rachas.de_30_mas) },
            ]}
          />
        </Section>
        <Section title="Cosas que hizo la gente" description="Personas en 30 días.">
          <Barras filas={eventos.map((e) => ({ etiqueta: NOMBRE_EVENTO[e.clave.replace('ev:', '')] ?? e.clave.replace('ev:', ''), valor: Number(e.usuarios_30d) }))} />
        </Section>
      </div>
    </>
  );
}

function Academia({ a, x }: { a: Analitica; x: AnaliticaExtra }) {
  const ac = x.academia;
  return (
    <>
      <StatGrid>
        <Stat label="Lecciones empezadas" value={num(ac.empezadas)} hint={`${num(ac.personas)} personas`} />
        <Stat
          label="Se terminan"
          value={pct(Number(ac.terminadas), Number(ac.empezadas))}
          hint={`${num(ac.terminadas)} de ${num(ac.empezadas)}`}
          tone={ac.empezadas > 5 && ac.terminadas / ac.empezadas < 0.5 ? 'atencion' : undefined}
        />
        <Stat label="Respuestas correctas" value={ac.aciertos_pct == null ? '—' : `${ac.aciertos_pct} %`} />
        <Stat label="Sesiones en 7 días" value={num(a.contenido.academia_sesiones_7d)} hint={`${num(a.contenido.academia_personas_7d)} personas`} />
      </StatGrid>

      <Section
        title="Dónde se abandonan las lecciones"
        description="Si muchas personas dejan la misma lección en el mismo punto, hay algo para mirar ahí."
        sinPadding
      >
        {ac.abandonos.length === 0 ? (
          <Vacio>Ninguna lección abandonada en este período.</Vacio>
        ) : (
          <Tabla minimo={620}>
            <thead>
              <tr>
                <Th>Lección</Th>
                <Th derecha>Empezaron</Th>
                <Th derecha>No terminaron</Th>
                <Th derecha>Pasos respondidos</Th>
                <Th>Último paso respondido</Th>
              </tr>
            </thead>
            <tbody>
              {ac.abandonos.map((f) => (
                <tr key={f.slug}>
                  <Td className="max-w-[280px]">
                    <span className="block truncate font-medium">{f.titulo}</span>
                    <span className="text-caption text-muted-foreground">{f.slug}</span>
                  </Td>
                  <Td derecha>{num(f.empezadas)}</Td>
                  <Td derecha>{num(f.sin_terminar)}</Td>
                  <Td derecha>{f.respondidas_prom}</Td>
                  <Td>{f.ultimo_tipo ? (NOMBRE_TIPO_PASO[f.ultimo_tipo] ?? f.ultimo_tipo) : '—'}</Td>
                </tr>
              ))}
            </tbody>
          </Tabla>
        )}
      </Section>

      <Section title="Qué tan difícil es cada tipo de ejercicio" description="Un tipo muy por debajo del resto puede estar mal explicado." sinPadding>
        {ac.por_tipo.length === 0 ? (
          <Vacio>Todavía no hay respuestas en este período.</Vacio>
        ) : (
          <Tabla minimo={420}>
            <thead>
              <tr>
                <Th>Tipo</Th>
                <Th derecha>Respuestas</Th>
                <Th derecha>Correctas</Th>
              </tr>
            </thead>
            <tbody>
              {ac.por_tipo.map((f) => (
                <tr key={f.tipo}>
                  <Td className="font-medium">{NOMBRE_TIPO_PASO[f.tipo] ?? f.tipo}</Td>
                  <Td derecha>{num(f.respuestas)}</Td>
                  <Td derecha>{f.aciertos_pct} %</Td>
                </tr>
              ))}
            </tbody>
          </Tabla>
        )}
      </Section>
    </>
  );
}

function Comunidad({ a, x }: { a: Analitica; x: AnaliticaExtra }) {
  const c = a.contenido;
  return (
    <>
      <StatGrid>
        <Stat label="Publicaciones en 7 días" value={num(c.plaza_publicaciones_7d)} hint={`${num(c.plaza_autores_7d)} personas publicaron`} />
        <Stat label="Reacciones en 7 días" value={num(c.plaza_reacciones_7d)} />
        <Stat label="Proyectos activos" value={num(x.comunidad.proyectos_activos)} hint={`${num(x.comunidad.sumados_30d)} se sumaron en 30 días`} href="/panel/proyectos" />
        <Stat label="Jugaron en su mundo" value={num(c.mundo_jugadores_7d)} hint="en 7 días" />
        <Stat label="Mercado: vistas" value={num(c.mercado_impresiones_7d)} hint="en 7 días" />
        <Stat label="Mercado: clics" value={num(c.mercado_clics_7d)} hint={`${pct(Number(c.mercado_clics_7d), Number(c.mercado_impresiones_7d))} de las vistas`} />
        <Stat label="Empresas que mejoran" value={num(a.resumen.empresas_mejora)} hint={`${num(a.resumen.empresas_en_alta)} en alta`} href="/panel/negocios" />
        <Stat label="Tiendas" value={num(a.resumen.tiendas)} href="/panel/listados" />
      </StatGrid>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Quienes más empujan" description="Días activos en los últimos 30." sinPadding>
          {x.mas_activos.length === 0 ? (
            <Vacio>Todavía nadie.</Vacio>
          ) : (
            <Tabla minimo={380}>
              <thead>
                <tr>
                  <Th>Persona</Th>
                  <Th derecha>Días</Th>
                  <Th derecha>Acciones</Th>
                  <Th derecha>Racha</Th>
                </tr>
              </thead>
              <tbody>
                {x.mas_activos.map((p) => (
                  <tr key={p.id}>
                    <Td>
                      <Link href={`/panel/personas/${p.id}`} className="font-medium hover:underline">
                        {p.nombre ?? p.usuario ?? 'Sin nombre'}
                      </Link>
                    </Td>
                    <Td derecha>{num(p.dias)}</Td>
                    <Td derecha>{num(p.acciones)}</Td>
                    <Td derecha>{num(p.racha)}</Td>
                  </tr>
                ))}
              </tbody>
            </Tabla>
          )}
        </Section>
        <Section title="Se están yendo" description={`${num(x.en_riesgo.n)} personas venían y hace 7 días o más que no entran.`} sinPadding>
          {x.en_riesgo.lista.length === 0 ? (
            <Vacio>Nadie por ahora.</Vacio>
          ) : (
            <Tabla minimo={380}>
              <thead>
                <tr>
                  <Th>Persona</Th>
                  <Th>Última vez</Th>
                  <Th derecha>Días que vino</Th>
                </tr>
              </thead>
              <tbody>
                {x.en_riesgo.lista.map((p) => (
                  <tr key={p.id}>
                    <Td>
                      <Link href={`/panel/personas/${p.id}`} className="font-medium hover:underline">
                        {p.nombre ?? p.usuario ?? 'Sin nombre'}
                      </Link>
                    </Td>
                    <Td>{fecha(p.ultimo)}</Td>
                    <Td derecha>{num(p.dias)}</Td>
                  </tr>
                ))}
              </tbody>
            </Tabla>
          )}
        </Section>
      </div>
    </>
  );
}

function Ingresos({ x }: { x: AnaliticaExtra }) {
  const n = x.negocio;
  return (
    <>
      <StatGrid columnas={3}>
        <Stat label="Ingreso mensual estimado" value={pesos(n.mrr_ars)} hint="Lo anual cuenta dividido por 12" href="/panel/suscripciones" />
        <Stat label="Suscripciones a Brote+" value={num(n.plus_activas)} />
        <Stat label="De quienes vieron Brote+, empezaron" value={pct(Number(n.plus_iniciaron_30d), Number(n.plus_vieron_30d))} hint={`${num(n.plus_iniciaron_30d)} de ${num(n.plus_vieron_30d)} en 30 días`} />
      </StatGrid>
      <Section title="Camino a Brote+" description="Últimos 30 días.">
        <Embudo
          pasos={[
            { etiqueta: 'Vieron la pantalla', valor: Number(n.plus_vieron_30d) },
            { etiqueta: 'Empezaron a suscribirse', valor: Number(n.plus_iniciaron_30d) },
            { etiqueta: 'Suscripciones activas (hoy)', valor: Number(n.plus_activas) },
          ]}
        />
      </Section>
      <p className="text-small text-muted-foreground">
        Precios y cobros en{' '}
        <Link href="/panel/suscripciones" className="font-semibold text-primary hover:underline">
          Suscripciones
        </Link>
        ; anuncios en{' '}
        <Link href="/panel/publicidad" className="font-semibold text-primary hover:underline">
          Publicidad
        </Link>
        .
      </p>
    </>
  );
}

function Audiencia({ a, x }: { a: Analitica; x: AnaliticaExtra }) {
  const s = a.segmentos;
  const niveles = RANKS.map((r) => ({ etiqueta: r.name_es, valor: Number(a.niveles[r.slug] ?? 0) })).filter((f) => f.valor > 0);
  return (
    <>
      <StatGrid>
        <Stat label="Con avisos activados" value={num(a.resumen.con_avisos)} hint={pct(a.resumen.con_avisos, a.resumen.usuarios) + ' de las personas'} />
        <Stat label="Con la app instalada" value={num(a.resumen.app_instalada)} hint={pct(a.resumen.app_instalada, a.resumen.usuarios) + ' de las personas'} />
        <Stat label="Avisos enviados en 7 días" value={num(x.avisos.enviados_7d)} hint={`${num(x.avisos.abiertos_7d)} abiertos`} />
        <Stat label="Abren los avisos" value={pct(Number(x.avisos.abiertos_7d), Number(x.avisos.enviados_7d))} hint={`${num(x.avisos.rechazaron_30d)} los rechazaron en 30 días`} />
      </StatGrid>
      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Tipo de cuenta">
          <Barras filas={aFilas(s.tipo, NOMBRE_TIPO_CUENTA)} />
        </Section>
        <Section title="Dónde están" description="Las 12 ciudades con más gente.">
          <Barras filas={s.ciudad.map((c) => ({ etiqueta: c.ciudad, valor: Number(c.usuarios) }))} />
        </Section>
        <Section title="Dispositivo">
          <Barras filas={aFilas(s.plataforma, NOMBRE_PLATAFORMA)} />
        </Section>
        <Section title="Sistema">
          <Barras filas={aFilas(s.sistema, NOMBRE_SISTEMA)} />
        </Section>
        <Section title="Navegador">
          <Barras filas={aFilas(s.navegador, NOMBRE_NAVEGADOR)} />
        </Section>
        <Section title="Rango" description="Por puntos totales (Semilla → Gaia). Nunca baja.">
          <Barras filas={niveles} />
        </Section>
        <Section title="Avisos por tipo" description="Últimos 7 días.">
          <Barras filas={aFilas(a.avisos_7d, NOMBRE_AVISO)} />
        </Section>
      </div>
    </>
  );
}
