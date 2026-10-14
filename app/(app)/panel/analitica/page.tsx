'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, RefreshCw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ChipRail } from '@/components/ui/chip-rail';
import { CandadoPanel, usePanelPass } from '@/components/panel/PanelPass';
import { Barras, Bloque, Cifra, Cohortes, SerieDiaria, n, pct } from '@/components/panel/analitica/piezas';
import { DOMAINS } from '@/lib/domains';
import { RANKS } from '@/lib/ranks';
import {
  adminAnalitica,
  adminAnaliticaUsuarios,
  type Analitica,
  type UsuarioAnalitica,
} from '@/lib/api/admin';
import { cn } from '@/lib/utils/cn';

/**
 * `/panel/analitica` — cuánta gente usa Brote, qué usa y si vuelve.
 *
 * De dónde sale cada número: `admin_analitica` y `admin_analitica_usuarios`
 * (0128). Un "día activo" es abrir la app o marcar una acción. Las cuentas de
 * prueba (`es_prueba`) no cuentan nunca.
 */

const SECCION: Record<string, string> = {
  inicio: 'Inicio',
  acciones: 'Acciones',
  mundo: 'Tu mundo',
  academia: 'Academia',
  plaza: 'La Plaza',
  buscar: 'Buscar',
  mercado: 'Mercado',
  ranking: 'Ranking',
  perfil: 'Perfil',
  ajustes: 'Ajustes',
  proyectos: 'Proyectos',
  competencias: 'Competencias',
  notificaciones: 'Notificaciones',
  brote_plus: 'Brote+',
  negocio: 'Espacio de empresa',
  onboarding: 'Onboarding',
};

const EVENTO: Record<string, string> = {
  avisos_activados: 'Activó los avisos',
  avisos_rechazados: 'Rechazó los avisos',
  aviso_abierto: 'Abrió un aviso',
  app_instalada: 'Instaló la app',
  onb_fin: 'Terminó el onboarding',
  plus_visto: 'Vio Brote+',
  plus_iniciar: 'Empezó a suscribirse a Brote+',
  compartir: 'Compartió algo',
};

const TIPO: Record<string, string> = { adult: 'Adultos', teen: 'Adolescentes (13–17)', kid: 'Chicos (hasta 12)', sin_dato: 'Sin dato' };
const PLATAFORMA: Record<string, string> = { telefono: 'Teléfono', tablet: 'Tablet', compu: 'Compu', sin_dato: 'Sin dato' };
const SISTEMA: Record<string, string> = { android: 'Android', ios: 'iPhone / iPad', windows: 'Windows', mac: 'Mac', linux: 'Linux', otro: 'Otro', sin_dato: 'Sin dato' };
const NAVEGADOR: Record<string, string> = { chrome: 'Chrome', safari: 'Safari', firefox: 'Firefox', edge: 'Edge', samsung: 'Samsung', otro: 'Otro', sin_dato: 'Sin dato' };
const AVISO: Record<string, string> = {
  streak_risk: 'Racha en riesgo',
  streak_lost: 'Racha perdida',
  rank_up: 'Subió de nivel',
  system: 'Sistema / resumen',
  follow: 'Seguidores',
  reply: 'Respuestas',
  mention: 'Menciones',
  like: 'Reacciones',
  academia_riego: 'Academia',
  challenge: 'Retos',
  project: 'Proyectos',
};

const RANGOS = [
  { value: '14', label: '14 días' },
  { value: '30', label: '30 días' },
  { value: '60', label: '60 días' },
  { value: '90', label: '90 días' },
];

/** Personas que llegaron a cada paso; vacío si todavía no se registró ninguno. */
function pasosOnboarding(datos: Analitica) {
  const usuarios = (clave: string) => datos.eventos.find((e) => e.clave === clave)?.usuarios_30d ?? 0;
  const pasos = [1, 2, 3, 4, 5, 6].map((p) => ({ etiqueta: `Paso ${p}`, valor: usuarios(`ev:onb_${p}`) }));
  pasos.push({ etiqueta: 'Terminó', valor: usuarios('ev:onb_fin') });
  return pasos.some((p) => p.valor > 0) ? pasos : [];
}

function aFilas(obj: Record<string, number> | undefined, nombres: Record<string, string>) {
  return Object.entries(obj ?? {})
    .map(([k, v]) => ({ etiqueta: nombres[k] ?? k, valor: Number(v) }))
    .sort((a, b) => b.valor - a.valor);
}

export default function AnaliticaPage() {
  const { pass, setPass } = usePanelPass();
  const [dias, setDias] = useState('30');
  const [datos, setDatos] = useState<Analitica | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(false);

  const cargar = useCallback(async () => {
    if (!pass) return;
    setCargando(true);
    setError(false);
    const r = await adminAnalitica(pass, Number(dias));
    setCargando(false);
    if (!r) {
      setError(true);
      return;
    }
    setDatos(r);
  }, [pass, dias]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  if (!pass) return <CandadoPanel verificar={async (p) => !!(await adminAnalitica(p, 7))} />;

  const r = datos?.resumen;
  const serie = datos?.serie ?? [];
  const sumar = (k: 'altas' | 'acciones') => serie.reduce((t, d) => t + Number(d[k] ?? 0), 0);

  return (
    <div className="space-y-5 py-4 pb-16">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/panel"
          className="inline-flex items-center gap-1.5 text-small text-muted-foreground transition-colors duration-150 hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Panel
        </Link>
        <Button variant="secondary" size="sm" onClick={() => void cargar()} loading={cargando}>
          <RefreshCw className="h-4 w-4" /> Actualizar
        </Button>
      </div>

      <header>
        <p className="eyebrow text-primary">Analítica</p>
        <h1 className="font-display text-display-l font-extrabold">Quién usa Brote</h1>
        <p className="mt-1 text-small text-muted-foreground">
          Personas reales: las cuentas de prueba nunca cuentan. Un día activo es abrir la app o marcar una acción.
        </p>
      </header>

      <ChipRail options={RANGOS} value={dias} onChange={(v) => setDias(v)} layoutId="analitica-periodo" />

      {error && (
        <p className="rounded-card border border-brote-coral/40 bg-brote-coral/10 p-3 text-small">
          No se pudo leer la analítica. Si la contraseña cambió, volvé a entrar.{' '}
          <button className="font-semibold underline" onClick={() => setPass('')}>
            Entrar de nuevo
          </button>
        </p>
      )}

      {!datos ? (
        <div className="space-y-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-56 w-full" />
        </div>
      ) : (
        <>
          {/* El número que manda arriba, y el resto a su alrededor. */}
          <section className="overflow-hidden rounded-card bg-brote-ink text-brote-cream shadow-soft-lg dark:border dark:border-white/10">
            <div className="grid grid-cols-2 divide-x divide-y divide-white/10 sm:grid-cols-4 [&_p.text-muted-foreground]:text-brote-cream/60">
              <Cifra destacada etiqueta="Personas en Brote" valor={n(r!.usuarios)} detalle={`${n(r!.nuevos_7d)} nuevas esta semana`} />
              <Cifra etiqueta="Activas hoy" valor={n(r!.activos_hoy)} detalle={`${pct(r!.activos_hoy, r!.activos_30d)} de las del mes`} />
              <Cifra etiqueta="Activas 7 días" valor={n(r!.activos_7d)} detalle={pct(r!.activos_7d, r!.usuarios) + ' del total'} />
              <Cifra etiqueta="Activas 30 días" valor={n(r!.activos_30d)} detalle={pct(r!.activos_30d, r!.usuarios) + ' del total'} />
              <Cifra etiqueta="Terminaron el onboarding" valor={n(r!.onboarding)} detalle={pct(r!.onboarding, r!.usuarios)} />
              <Cifra etiqueta="Con avisos activados" valor={n(r!.con_avisos)} detalle={pct(r!.con_avisos, r!.usuarios)} />
              <Cifra etiqueta="Con la app instalada" valor={n(r!.app_instalada)} detalle={pct(r!.app_instalada, r!.usuarios)} />
              <Cifra etiqueta="Brote+" valor={n(r!.brote_plus)} detalle={pct(r!.brote_plus, r!.usuarios) + ' convierte'} />
            </div>
            <p className="border-t border-white/10 px-3.5 py-2 text-caption text-brote-cream/60">
              Acciones hoy {n(r!.acciones_hoy)} · 7 días {n(r!.acciones_7d)} · Empresas que mejoran {n(r!.empresas_mejora)} ·
              Tiendas {n(r!.tiendas)} · En alta {n(r!.empresas_en_alta)}
            </p>
          </section>

          <Bloque eyebrow={`Últimos ${datos.dias} días`} titulo="Día por día">
            <div className="grid gap-5 lg:grid-cols-3">
              <SerieDiaria titulo="Personas activas" datos={serie as never} clave="activos" forma="area" />
              <SerieDiaria titulo="Cuentas nuevas" datos={serie as never} clave="altas" forma="columnas" total={`${n(sumar('altas'))} en total`} />
              <SerieDiaria titulo="Acciones marcadas" datos={serie as never} clave="acciones" forma="columnas" total={`${n(sumar('acciones'))} en total`} />
            </div>
          </Bloque>

          <Bloque eyebrow="Retención" titulo="¿Vuelven? Por semana de alta">
            <p className="mb-3 text-caption leading-relaxed text-muted-foreground">
              Cada fila es la gente que se registró esa semana; S1…S7, qué parte usó Brote en cada semana siguiente. La meta
              de docs/MONETIZACION.md es 40 % el primer día, 20 % a la semana, 10 % al mes.
            </p>
            <Cohortes filas={datos.cohortes} />
          </Bloque>

          <div className="grid gap-5 lg:grid-cols-2">
            <Bloque eyebrow={`Altas de los últimos ${datos.dias} días`} titulo="Embudo">
              <Barras
                max={datos.embudo.registrados || 1}
                filas={[
                  { etiqueta: 'Se registraron', valor: datos.embudo.registrados },
                  { etiqueta: 'Terminaron el onboarding', valor: datos.embudo.onboarding, detalle: pct(datos.embudo.onboarding, datos.embudo.registrados) },
                  { etiqueta: 'Marcaron una acción', valor: datos.embudo.primera_accion, detalle: pct(datos.embudo.primera_accion, datos.embudo.registrados) },
                  { etiqueta: 'Volvieron otro día', valor: datos.embudo.volvio, detalle: pct(datos.embudo.volvio, datos.embudo.registrados) },
                  { etiqueta: '7 días activos', valor: datos.embudo.siete_dias, detalle: pct(datos.embudo.siete_dias, datos.embudo.registrados) },
                  { etiqueta: 'Racha de 7', valor: datos.embudo.racha_7, detalle: pct(datos.embudo.racha_7, datos.embudo.registrados) },
                ]}
              />
            </Bloque>

            <Bloque eyebrow="Personas distintas, últimos 7 días" titulo="Qué usa la gente">
              <Barras
                vacio="Todavía no hay visitas registradas: se empiezan a contar desde esta versión."
                filas={datos.secciones.map((s) => ({
                  etiqueta: SECCION[s.clave.slice(4)] ?? s.clave.slice(4),
                  valor: s.usuarios_7d,
                  detalle: `${n(s.usuarios_30d)} en 30 d`,
                }))}
              />
            </Bloque>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <Bloque eyebrow="Onboarding, últimos 30 días" titulo="Hasta dónde llegan">
              <Barras vacio="Se empieza a contar desde esta versión." filas={pasosOnboarding(datos)} />
            </Bloque>
            <Bloque eyebrow="Personas distintas, últimos 30 días" titulo="Lo que hacen">
              <Barras
                vacio="Se empieza a contar desde esta versión."
                filas={datos.eventos
                  .filter((e) => !e.clave.startsWith('ev:onb_'))
                  .map((e) => ({ etiqueta: EVENTO[e.clave.slice(3)] ?? e.clave.slice(3), valor: e.usuarios_30d, detalle: `${n(e.veces_30d)} veces` }))}
              />
            </Bloque>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <Bloque titulo="Tipo de cuenta">
              <Barras filas={aFilas(datos.segmentos.tipo, TIPO)} />
            </Bloque>
            <Bloque titulo="Desde dónde entran">
              <Barras filas={aFilas(datos.segmentos.plataforma, PLATAFORMA)} />
              <div className="mt-4">
                <Barras filas={aFilas(datos.segmentos.sistema, SISTEMA)} />
              </div>
            </Bloque>
            <Bloque titulo="Provincias">
              <Barras filas={datos.segmentos.ciudad.map((c) => ({ etiqueta: c.ciudad, valor: c.usuarios }))} />
            </Bloque>
          </div>

          <Bloque eyebrow="Últimos 7 días" titulo="Contenido">
            <div className="grid grid-cols-2 divide-x divide-y divide-hairline overflow-hidden rounded-button border border-border sm:grid-cols-4">
              <Cifra etiqueta="Sesiones de la Academia" valor={n(datos.contenido.academia_sesiones_7d)} detalle={`${n(datos.contenido.academia_personas_7d)} personas`} />
              <Cifra etiqueta="Publicaciones en la Plaza" valor={n(datos.contenido.plaza_publicaciones_7d)} detalle={`${n(datos.contenido.plaza_autores_7d)} personas`} />
              <Cifra etiqueta="Reacciones en la Plaza" valor={n(datos.contenido.plaza_reacciones_7d)} />
              <Cifra etiqueta="Jugaron en Tu mundo" valor={n(datos.contenido.mundo_jugadores_7d)} />
              <Cifra etiqueta="Clics al Mercado" valor={n(datos.contenido.mercado_clics_7d)} detalle={`${n(datos.contenido.mercado_impresiones_7d)} vistas de productos`} />
              <Cifra etiqueta="Se sumaron a proyectos" valor={n(datos.contenido.proyectos_sumados_7d)} />
            </div>
            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <div>
                <p className="mb-2 text-small font-semibold">Acciones más hechas</p>
                <Barras
                  filas={(datos.contenido.acciones_top ?? []).map((a) => ({ etiqueta: a.titulo, valor: a.veces, detalle: `${n(a.personas)} pers.` }))}
                />
              </div>
              <div>
                <p className="mb-2 text-small font-semibold">Por tema</p>
                <Barras
                  filas={aFilas(
                    datos.contenido.dominios,
                    Object.fromEntries(DOMAINS.map((d) => [d.slug, d.name_es])),
                  )}
                />
              </div>
            </div>
          </Bloque>

          <div className="grid gap-5 lg:grid-cols-3">
            <Bloque titulo="Rachas de hoy">
              <Barras
                filas={[
                  { etiqueta: 'Sin racha', valor: datos.rachas.cero },
                  { etiqueta: '1 a 2 días', valor: datos.rachas.de_1_a_2 },
                  { etiqueta: '3 a 6 días', valor: datos.rachas.de_3_a_6 },
                  { etiqueta: '7 a 29 días', valor: datos.rachas.de_7_a_29 },
                  { etiqueta: '30 días o más', valor: datos.rachas.de_30_mas },
                ]}
              />
            </Bloque>
            <Bloque titulo="Niveles (de por vida)">
              <Barras
                filas={RANKS.map((rk) => ({ etiqueta: rk.name_es, valor: Number(datos.niveles[rk.slug] ?? 0) })).filter((f) => f.valor > 0)}
              />
            </Bloque>
            <Bloque eyebrow="Últimos 7 días" titulo="Avisos enviados">
              <Barras filas={aFilas(datos.avisos_7d, AVISO)} />
            </Bloque>
          </div>

          <Personas pass={pass} />
        </>
      )}
    </div>
  );
}

/* ── Personas una por una ─────────────────────────────────────────────────── */

const ORDENES = [
  { value: 'recientes', label: 'Más nuevas' },
  { value: 'activos', label: 'Más activas' },
  { value: 'inactivos', label: 'Hace más que no entran' },
];

function Personas({ pass }: { pass: string }) {
  const [q, setQ] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [orden, setOrden] = useState<'recientes' | 'activos' | 'inactivos'>('recientes');
  const [filas, setFilas] = useState<UsuarioAnalitica[] | null>(null);

  useEffect(() => {
    let vivo = true;
    setFilas(null);
    adminAnaliticaUsuarios(pass, busqueda, orden, 100).then((r) => vivo && setFilas(r ?? []));
    return () => {
      vivo = false;
    };
  }, [pass, busqueda, orden]);

  const csv = useMemo(() => {
    if (!filas?.length) return null;
    const cab = ['usuario', 'nombre', 'email', 'alta', 'tipo', 'provincia', 'plan', 'ultima_vez', 'dias_activos_30d', 'acciones_30d', 'racha', 'nivel', 'avisos', 'instalada', 'plataforma', 'secciones_30d'];
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const cuerpo = filas.map((f) =>
      [f.username, f.display_name, f.email, f.alta_at, f.account_type, f.city, f.plan, f.ultima_vez, f.dias_activos_30d, f.acciones_30d, f.racha, f.nivel, f.avisos, f.instalada, f.plataforma, Object.entries(f.secciones_30d ?? {}).map(([k, v]) => `${k}:${v}`).join(' ')]
        .map(esc)
        .join(','),
    );
    return URL.createObjectURL(new Blob([[cab.join(','), ...cuerpo].join('\n')], { type: 'text/csv;charset=utf-8' }));
  }, [filas]);

  return (
    <Bloque eyebrow="Una por una" titulo="Personas">
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          setBusqueda(q.trim());
        }}
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input icon value={q} onChange={(e) => setQ(e.target.value)} placeholder="Usuario, nombre, correo o provincia" aria-label="Buscar personas" />
        </div>
        <Button type="submit" variant="secondary">
          Buscar
        </Button>
        {csv && (
          <a
            href={csv}
            download={`brote-personas-${new Date().toISOString().slice(0, 10)}.csv`}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-button border border-border px-4 text-small font-semibold transition-colors hover:bg-surface-2"
          >
            <Download className="h-4 w-4" /> CSV
          </a>
        )}
      </form>
      <div className="mt-3">
        <ChipRail options={ORDENES} value={orden} onChange={(v) => setOrden(v as typeof orden)} layoutId="analitica-orden" />
      </div>

      <div className="-mx-4 mt-3 overflow-x-auto">
        <table className="w-full min-w-[760px] text-small">
          <thead>
            <tr className="border-b border-border text-left text-caption text-muted-foreground">
              <th className="px-4 py-2 font-medium">Persona</th>
              <th className="px-2 py-2 font-medium">Alta</th>
              <th className="px-2 py-2 font-medium">Última vez</th>
              <th className="px-2 py-2 text-right font-medium">Días 30d</th>
              <th className="px-2 py-2 text-right font-medium">Acciones</th>
              <th className="px-2 py-2 text-right font-medium">Racha</th>
              <th className="px-2 py-2 font-medium">Qué usa</th>
              <th className="px-4 py-2 font-medium">Avisos · App</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {filas === null ? (
              <tr>
                <td colSpan={8} className="px-4 py-4">
                  <Skeleton className="h-8 w-full" />
                </td>
              </tr>
            ) : filas.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-4 text-muted-foreground">
                  Nadie coincide con esa búsqueda.
                </td>
              </tr>
            ) : (
              filas.map((f) => (
                <tr key={f.id} className="transition-colors duration-150 hover:bg-surface-2">
                  <td className="max-w-[220px] px-4 py-2">
                    <Link href={f.username ? `/perfil/${f.username}` : '#'} className="block truncate font-semibold hover:underline">
                      {f.display_name ?? f.username ?? '—'}
                    </Link>
                    <span className="block truncate text-caption text-muted-foreground">
                      {f.email} · {TIPO[f.account_type] ?? f.account_type}
                      {f.es_prueba ? ' · prueba' : ''}
                      {f.plan === 'plus' ? ' · Brote+' : ''}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-2 py-2 text-caption">{new Date(f.alta_at).toLocaleDateString('es-AR')}</td>
                  <td className="whitespace-nowrap px-2 py-2 text-caption">
                    {f.ultima_vez ? new Date(f.ultima_vez).toLocaleDateString('es-AR') : '—'}
                  </td>
                  <td className="px-2 py-2 text-right tnum">{f.dias_activos_30d}</td>
                  <td className="px-2 py-2 text-right tnum">{f.acciones_30d}</td>
                  <td className="px-2 py-2 text-right tnum">{f.racha}</td>
                  <td className="max-w-[200px] px-2 py-2 text-caption text-muted-foreground">
                    <span className="line-clamp-2">
                      {Object.entries(f.secciones_30d ?? {})
                        .sort((a, b) => b[1] - a[1])
                        .map(([k, v]) => `${SECCION[k] ?? k} ${v}`)
                        .join(' · ') || '—'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-caption">
                    <span className={cn(f.avisos ? 'text-primary' : 'text-muted-foreground')}>{f.avisos ? 'Sí' : 'No'}</span>
                    {' · '}
                    <span className={cn(f.instalada ? 'text-primary' : 'text-muted-foreground')}>
                      {f.instalada ? 'Instalada' : (PLATAFORMA[f.plataforma ?? ''] ?? '—')}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Bloque>
  );
}
