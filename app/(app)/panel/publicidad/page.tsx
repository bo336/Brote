'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, Circle, ImagePlus, Pencil, Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, inputBase } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { CandadoPanel, usePanelPass } from '@/components/panel/PanelPass';
import { Bloque, Cifra, SerieDiaria, n, pct } from '@/components/panel/analitica/piezas';
import { CLASE_TARJETA, ContenidoAnuncio } from '@/components/ads/AnuncioDirecto';
import {
  adminAnuncioGuardar,
  adminPublicidad,
  adminPublicidadConfig,
  subirImagenAnuncio,
  type AnuncioPanel,
  type PanelPublicidad,
} from '@/lib/api/admin';
import { estadoAdsenseServidor } from '@/lib/ads/estado-servidor';
import { CONFIG_DEFECTO, PLACEMENTS, normalizarConfig, type ConfigPublicidad, type Placement, type Proveedor } from '@/lib/ads/policy';
import { REGION_DE_PROVINCIA } from '@/lib/acciones/reglas';
import { toast } from '@/stores/toast';
import { cn } from '@/lib/utils/cn';

/**
 * `/panel/publicidad` — la publicidad de Brote (0134).
 *
 * Arriba, el interruptor general: apagado, nadie ve un anuncio y no se carga
 * ningún script, en todos los teléfonos en menos de diez minutos y sin deploy.
 * Después, qué falta para que AdSense funcione, las reglas (cuántos, dónde y
 * de quién), los números, y los anuncios directos — los sponsors propios, que
 * reemplazan a AdSense donde haya uno vigente.
 */

const UBICACION: Record<Placement, { titulo: string; donde: string }> = {
  'news-feed': { titulo: 'Plaza', donde: 'Entre publicaciones, nunca antes de la quinta.' },
  'news-article': { titulo: 'Noticia', donde: 'Debajo del texto, cuando ya se leyó.' },
  'ranking-footer': { titulo: 'Ranking', donde: 'Al pie de la tabla.' },
  'catalog-footer': { titulo: 'Acciones', donde: 'Al pie del catálogo.' },
  guia: { titulo: 'Guía pública', donde: 'Debajo de cada acción de /guia, también sin cuenta.' },
  moment: { titulo: 'Momento', donde: 'Una tarjeta al cerrar algo, cada tanto. Sólo sponsors directos.' },
};

const PROVEEDOR: Record<Proveedor, string> = {
  auto: 'Directo si hay; si no, AdSense',
  adsense: 'Sólo AdSense',
  directo: 'Sólo directos',
  ninguno: 'Nada',
};

const PROVINCIAS = Object.keys(REGION_DE_PROVINCIA);

type Servidor = Awaited<ReturnType<typeof estadoAdsenseServidor>>;
type Borrador = Partial<AnuncioPanel>;

const NUEVO: Borrador = {
  nombre: '',
  anunciante: '',
  titulo: '',
  texto: '',
  imagen_url: '',
  cta: 'Conocer más',
  url_destino: 'https://',
  ubicaciones: [],
  provincias: [],
  publico: 'adultos',
  hasta: null,
  peso: 1,
  tope_impresiones: null,
  activo: true,
  notas: '',
};

export default function PublicidadPanelPage() {
  const { pass, setPass } = usePanelPass();
  const qc = useQueryClient();
  const [d, setD] = useState<PanelPublicidad | null>(null);
  const [srv, setSrv] = useState<Servidor | null>(null);
  const [cfg, setCfg] = useState<ConfigPublicidad>(CONFIG_DEFECTO);
  const [sucio, setSucio] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [borrador, setBorrador] = useState<Borrador | null>(null);

  const cargar = useCallback(async () => {
    if (!pass) return;
    setCargando(true);
    const [a, b] = await Promise.all([adminPublicidad(pass), estadoAdsenseServidor(pass)]);
    setCargando(false);
    if (!a) return setPass('');
    setD(a);
    setSrv(b);
    setCfg(normalizarConfig(a.config));
    setSucio(false);
  }, [pass, setPass]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  if (!pass) return <CandadoPanel verificar={async (p) => !!(await adminPublicidad(p))} />;

  async function prender(v: boolean) {
    const r = await adminPublicidadConfig(pass, v, null);
    if (!r.ok) return toast.error('No se pudo guardar', r.error);
    toast.success(v ? 'Publicidad encendida' : 'Publicidad apagada', 'Llega a todos en menos de 10 minutos.');
    void qc.invalidateQueries({ queryKey: ['publicidad-estado'] });
    await cargar();
  }

  async function guardarReglas() {
    const r = await adminPublicidadConfig(pass, null, cfg);
    if (!r.ok) return toast.error('No se pudo guardar', r.error);
    toast.success('Reglas guardadas');
    void qc.invalidateQueries({ queryKey: ['publicidad-estado'] });
    await cargar();
  }

  function cambiar(f: (c: ConfigPublicidad) => ConfigPublicidad) {
    setCfg((c) => f(structuredClone(c)));
    setSucio(true);
  }

  async function guardarAnuncio(a: Borrador) {
    const { impresiones: _i, clics: _c, impresiones_7d: _s, vigente: _v, ...datos } = a;
    const r = await adminAnuncioGuardar(pass, datos);
    if (!r.ok) {
      toast.error('No se pudo guardar', r.error);
      return false;
    }
    toast.success('Anuncio guardado');
    void qc.invalidateQueries({ queryKey: ['publicidad-estado'] });
    await cargar();
    return true;
  }

  const totales = (d?.metricas ?? []).reduce(
    (t, m) => ({ pedidos: t.pedidos + Number(m.pedidos_30d), llenos: t.llenos + Number(m.llenos_30d), hoy: t.hoy + Number(m.pedidos_hoy ?? 0) }),
    { pedidos: 0, llenos: 0, hoy: 0 },
  );
  const adsenseOk = !!srv?.cliente;

  return (
    <div className="space-y-5 py-4 pb-16">
      <div className="flex items-center justify-between gap-3">
        <Link href="/panel" className="inline-flex items-center gap-1.5 text-small text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Panel
        </Link>
        <Button variant="secondary" size="sm" onClick={() => void cargar()} loading={cargando}>
          <RefreshCw className="h-4 w-4" /> Actualizar
        </Button>
      </div>

      <header>
        <p className="eyebrow text-primary">Publicidad</p>
        <h1 className="font-display text-display-l font-extrabold">Pocos anuncios, en su lugar</h1>
        <p className="mt-1 text-small text-muted-foreground">
          AdSense y sponsors propios. Nunca en Inicio, Tu mundo, el perfil, una acción en curso, el Mercado ni el panel;
          nunca a chicos ni a Brote+; nunca en los primeros días de una cuenta.
        </p>
      </header>

      {!d ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <>
          <Bloque eyebrow="Interruptor general" titulo={d.activa ? 'La publicidad está encendida' : 'La publicidad está apagada'}>
            <Fila
              titulo="Mostrar publicidad"
              detalle="Apagada: nadie ve anuncios y no se descarga ningún script. El resto de la app sigue igual."
            >
              <Switch checked={d.activa} onCheckedChange={(v) => void prender(v)} aria-label="Mostrar publicidad" />
            </Fila>
          </Bloque>

          <Bloque eyebrow="AdSense" titulo={adsenseOk ? 'AdSense está conectado' : 'Lo que falta para AdSense'}>
            <ul className="space-y-2 text-small">
              <Paso
                ok={!!srv?.dominio_propio}
                texto={
                  srv?.dominio_propio
                    ? `Dominio propio: ${srv.app_url}.`
                    : `Recomendado: un dominio propio antes de pedir la revisión (hoy: ${srv?.app_url ?? '—'}). El sitio queda dado de alta con ese nombre; cambiarlo después es pedir la revisión de nuevo.`
                }
              />
              <Paso
                ok={!!srv?.cliente}
                texto={srv?.cliente ? `Cuenta: ${srv.cliente}.` : 'NEXT_PUBLIC_ADSENSE_CLIENT en Vercel (ca-pub-…), y volver a desplegar.'}
              />
              {PLACEMENTS.filter((p) => p !== 'moment').map((p) => (
                <Paso
                  key={p}
                  ok={!!srv?.bloques?.[p]}
                  texto={`Bloque «${UBICACION[p].titulo}»${srv?.bloques?.[p] ? '' : ' — sin id: ahí sólo van sponsors directos'}.`}
                />
              ))}
              <Paso
                ok={!!srv?.rastreador}
                texto="ADSENSE_CRAWLER_EMAIL: una cuenta de Brote para que el rastreador de Google lea la Plaza (opcional, mejora los anuncios)."
              />
            </ul>
            {srv?.ads_txt && (
              <div className="mt-3 rounded-button border border-border bg-surface-2 p-3">
                <p className="text-caption text-muted-foreground">
                  Lo que sirve{' '}
                  <a href="/ads.txt" target="_blank" rel="noreferrer" className="font-medium text-foreground underline-offset-2 hover:underline">
                    /ads.txt
                  </a>{' '}
                  ahora:
                </p>
                <pre className="mt-1 overflow-x-auto whitespace-pre text-caption">{srv.ads_txt}</pre>
              </div>
            )}
            <p className="mt-3 text-caption text-muted-foreground">
              Paso a paso — alta, verificación, bloques, cobro e impuestos — en docs/PUBLICIDAD.md.
            </p>
          </Bloque>

          <Bloque eyebrow="Reglas" titulo="Cuántos y dónde">
            <div className="grid gap-3 sm:grid-cols-3">
              <Numero etiqueta="Por persona y día" valor={cfg.por_dia} min={0} max={50} onCambiar={(v) => cambiar((c) => ({ ...c, por_dia: v }))} />
              <Numero etiqueta="Por sesión" valor={cfg.por_sesion} min={0} max={20} onCambiar={(v) => cambiar((c) => ({ ...c, por_sesion: v }))} />
              <Numero
                etiqueta="Días sin anuncios al empezar"
                valor={cfg.dias_gracia}
                min={0}
                max={30}
                onCambiar={(v) => cambiar((c) => ({ ...c, dias_gracia: v }))}
              />
            </div>

            <ul className="mt-4 divide-y divide-hairline rounded-button border border-border">
              {PLACEMENTS.map((p) => {
                const u = cfg.ubicaciones[p] ?? {};
                const opciones: Proveedor[] = p === 'moment' ? ['directo', 'ninguno'] : ['auto', 'adsense', 'directo', 'ninguno'];
                return (
                  <li key={p} className="p-3">
                    <div className="flex items-center gap-3">
                      <span className="min-w-0 flex-1">
                        <span className="block text-small font-semibold">{UBICACION[p].titulo}</span>
                        <span className="block text-caption text-muted-foreground">{UBICACION[p].donde}</span>
                      </span>
                      <Switch
                        checked={u.activa !== false}
                        onCheckedChange={(v) => cambiar((c) => ({ ...c, ubicaciones: { ...c.ubicaciones, [p]: { ...u, activa: v } } }))}
                        aria-label={`Anuncios en ${UBICACION[p].titulo}`}
                      />
                    </div>
                    <div className="mt-2 flex flex-wrap items-end gap-3">
                      <label className="text-caption text-muted-foreground">
                        Quién lo llena
                        <select
                          value={u.proveedor ?? 'auto'}
                          disabled={u.activa === false}
                          onChange={(e) =>
                            cambiar((c) => ({ ...c, ubicaciones: { ...c.ubicaciones, [p]: { ...u, proveedor: e.target.value as Proveedor } } }))
                          }
                          className={cn(inputBase, 'mt-1 block h-9 px-2.5 text-small')}
                        >
                          {opciones.map((o) => (
                            <option key={o} value={o}>
                              {PROVEEDOR[o]}
                            </option>
                          ))}
                        </select>
                      </label>
                      {p === 'news-feed' && (
                        <>
                          <Numero
                            corto
                            etiqueta="Primero tras"
                            valor={u.desde ?? 5}
                            min={1}
                            max={50}
                            onCambiar={(v) => cambiar((c) => ({ ...c, ubicaciones: { ...c.ubicaciones, [p]: { ...u, desde: v } } }))}
                          />
                          <Numero
                            corto
                            etiqueta="Uno cada"
                            valor={u.cada ?? 8}
                            min={3}
                            max={50}
                            onCambiar={(v) => cambiar((c) => ({ ...c, ubicaciones: { ...c.ubicaciones, [p]: { ...u, cada: v } } }))}
                          />
                          <Numero
                            corto
                            etiqueta="Máximo"
                            valor={u.max ?? 3}
                            min={0}
                            max={10}
                            onCambiar={(v) => cambiar((c) => ({ ...c, ubicaciones: { ...c.ubicaciones, [p]: { ...u, max: v } } }))}
                          />
                        </>
                      )}
                    </div>
                    {p === 'moment' && (
                      <div className="mt-2 flex flex-wrap items-end gap-3">
                        <Numero
                          corto
                          etiqueta="Tras cerrar"
                          valor={cfg.momento.tras_cierres}
                          min={1}
                          max={20}
                          onCambiar={(v) => cambiar((c) => ({ ...c, momento: { ...c.momento, tras_cierres: v } }))}
                        />
                        <Numero
                          corto
                          etiqueta="Minutos entre uno y otro"
                          valor={cfg.momento.min_minutos}
                          min={5}
                          max={1440}
                          onCambiar={(v) => cambiar((c) => ({ ...c, momento: { ...c.momento, min_minutos: v } }))}
                        />
                        <Numero
                          corto
                          etiqueta="Desde la sesión"
                          valor={cfg.momento.min_sesiones}
                          min={1}
                          max={50}
                          onCambiar={(v) => cambiar((c) => ({ ...c, momento: { ...c.momento, min_sesiones: v } }))}
                        />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
            <div className="mt-3 flex justify-end gap-2">
              {sucio && (
                <Button variant="ghost" size="sm" onClick={() => void cargar()}>
                  Descartar
                </Button>
              )}
              <Button size="sm" disabled={!sucio} onClick={() => void guardarReglas()}>
                Guardar reglas
              </Button>
            </div>
          </Bloque>

          <Bloque eyebrow="Últimos 30 días" titulo="Números">
            <div className="grid grid-cols-3 divide-x divide-hairline overflow-hidden rounded-button border border-border">
              <Cifra etiqueta="Pedidos" valor={n(totales.pedidos)} detalle={`${n(totales.hoy)} hoy`} />
              <Cifra etiqueta="Llenos" valor={n(totales.llenos)} />
              <Cifra etiqueta="Llenado" valor={pct(totales.llenos, totales.pedidos)} />
            </div>
            {d.serie.length > 1 && (
              <div className="mt-4">
                <SerieDiaria titulo="Anuncios llenos por día" datos={d.serie} clave="llenos" forma="columnas" />
              </div>
            )}
            {d.metricas.length > 0 ? (
              <table className="mt-4 w-full text-small">
                <thead className="text-left text-caption text-muted-foreground">
                  <tr>
                    <th className="py-1.5 font-medium">Dónde</th>
                    <th className="py-1.5 font-medium">De quién</th>
                    <th className="py-1.5 text-right font-medium">Pedidos</th>
                    <th className="py-1.5 text-right font-medium">Llenos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {d.metricas.map((m) => (
                    <tr key={`${m.ubicacion}-${m.proveedor}`}>
                      <td className="py-1.5">{UBICACION[m.ubicacion as Placement]?.titulo ?? m.ubicacion}</td>
                      <td className="py-1.5 text-muted-foreground">{m.proveedor === 'adsense' ? 'AdSense' : 'Directo'}</td>
                      <td className="py-1.5 text-right tnum">{n(m.pedidos_30d)}</td>
                      <td className="py-1.5 text-right tnum">
                        {n(m.llenos_30d)} <span className="text-caption text-muted-foreground">{pct(Number(m.llenos_30d), Number(m.pedidos_30d))}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="mt-3 text-small text-muted-foreground">Todavía no se mostró ningún anuncio.</p>
            )}
            <p className="mt-3 text-caption text-muted-foreground">
              Lo que se cobra lo dice AdSense (adsense.google.com → Informes). Acá se cuenta lo que pasa en Brote: cuántos espacios se
              pidieron y cuántos se llenaron.
            </p>
          </Bloque>

          <Bloque eyebrow="Sponsors propios" titulo="Anuncios directos">
            <p className="text-small text-muted-foreground">
              Un anuncio directo ocupa el lugar de AdSense donde la regla dice «Directo si hay». Lo ven adultos (o todos, si lo
              marcás), con la marca «Patrocinado». Lo cobrás vos, por fuera de Brote.
            </p>
            {d.anuncios.length > 0 && (
              <ul className="mt-3 divide-y divide-hairline rounded-button border border-border">
                {d.anuncios.map((a) => (
                  <li key={a.id} className="flex items-center gap-3 p-3">
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-small font-semibold">{a.nombre}</span>
                        <span
                          className={cn(
                            'shrink-0 rounded-pill px-2 py-0.5 text-caption font-semibold',
                            a.vigente ? 'bg-primary/15 text-primary' : 'bg-surface-2 text-muted-foreground',
                          )}
                        >
                          {a.vigente ? 'al aire' : a.activo ? 'fuera de fecha' : 'pausado'}
                        </span>
                      </span>
                      <span className="block truncate text-caption text-muted-foreground">
                        {a.anunciante} · {a.ubicaciones.length ? a.ubicaciones.map((u) => UBICACION[u as Placement]?.titulo ?? u).join(', ') : 'todas'}
                      </span>
                      <span className="block text-caption tnum text-muted-foreground">
                        {n(a.impresiones)} vistas ({n(a.impresiones_7d)} en 7 días) · {n(a.clics)} clics · {pct(a.clics, a.impresiones)}
                        {a.tope_impresiones ? ` · tope ${n(a.tope_impresiones)}` : ''}
                      </span>
                    </span>
                    <Switch checked={a.activo} onCheckedChange={(v) => void guardarAnuncio({ ...a, activo: v })} aria-label={`Activo: ${a.nombre}`} />
                    <Button size="icon-sm" variant="ghost" aria-label="Editar" onClick={() => setBorrador({ ...a })}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            {!borrador && (
              <Button variant="secondary" size="sm" className="mt-3" onClick={() => setBorrador({ ...NUEVO })}>
                <Plus className="h-4 w-4" /> Nuevo anuncio
              </Button>
            )}
            {borrador && (
              <EditorAnuncio
                inicial={borrador}
                onCancelar={() => setBorrador(null)}
                onGuardar={async (a) => {
                  if (await guardarAnuncio(a)) setBorrador(null);
                }}
              />
            )}
          </Bloque>
        </>
      )}
    </div>
  );
}

function EditorAnuncio({
  inicial,
  onCancelar,
  onGuardar,
}: {
  inicial: Borrador;
  onCancelar: () => void;
  onGuardar: (a: Borrador) => Promise<void>;
}) {
  const [a, setA] = useState<Borrador>(inicial);
  const [subiendo, setSubiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const set = <K extends keyof Borrador>(k: K, v: Borrador[K]) => setA((x) => ({ ...x, [k]: v }));
  const alternar = (k: 'ubicaciones' | 'provincias', v: string) =>
    setA((x) => {
      const l = x[k] ?? [];
      return { ...x, [k]: l.includes(v) ? l.filter((y) => y !== v) : [...l, v] };
    });

  async function subir(f: File | undefined) {
    if (!f) return;
    setSubiendo(true);
    try {
      set('imagen_url', await subirImagenAnuncio(f));
    } catch {
      toast.error('No se pudo subir la imagen', 'Tiene que ser JPG, PNG o WebP, y tu cuenta tiene que estar vinculada al panel.');
    }
    setSubiendo(false);
  }

  return (
    <form
      className="mt-4 space-y-3 rounded-button border border-primary/30 p-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setGuardando(true);
        await onGuardar(a);
        setGuardando(false);
      }}
    >
      <p className="text-small font-semibold">{a.id ? 'Editar anuncio' : 'Nuevo anuncio'}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo etiqueta="Nombre interno">
          <Input value={a.nombre ?? ''} onChange={(e) => set('nombre', e.target.value)} placeholder="Vivero Sol — octubre" required />
        </Campo>
        <Campo etiqueta="Anunciante (se ve)">
          <Input value={a.anunciante ?? ''} onChange={(e) => set('anunciante', e.target.value)} placeholder="Vivero Sol" required />
        </Campo>
        <Campo etiqueta={`Título (${(a.titulo ?? '').length}/70)`}>
          <Input value={a.titulo ?? ''} maxLength={70} onChange={(e) => set('titulo', e.target.value)} required />
        </Campo>
        <Campo etiqueta="Botón">
          <Input value={a.cta ?? ''} maxLength={24} onChange={(e) => set('cta', e.target.value)} />
        </Campo>
      </div>
      <Campo etiqueta={`Texto (${(a.texto ?? '').length}/160)`}>
        <Input value={a.texto ?? ''} maxLength={160} onChange={(e) => set('texto', e.target.value)} />
      </Campo>
      <Campo etiqueta="Enlace (https://)">
        <Input type="url" value={a.url_destino ?? ''} onChange={(e) => set('url_destino', e.target.value)} required />
      </Campo>
      <div className="flex flex-wrap items-center gap-2">
        <label className={cn('inline-flex cursor-pointer items-center gap-1.5 rounded-button border border-border px-3 py-2 text-small', subiendo && 'opacity-60')}>
          <ImagePlus className="h-4 w-4" /> {subiendo ? 'Subiendo…' : a.imagen_url ? 'Cambiar imagen' : 'Subir imagen'}
          <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => void subir(e.target.files?.[0])} />
        </label>
        {a.imagen_url && (
          <Button type="button" size="sm" variant="ghost" onClick={() => set('imagen_url', '')}>
            Sin imagen
          </Button>
        )}
      </div>

      <fieldset>
        <legend className="text-caption text-muted-foreground">Dónde (ninguno = todas las que admiten directos)</legend>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {PLACEMENTS.map((p) => (
            <Chip key={p} activo={(a.ubicaciones ?? []).includes(p)} onClick={() => alternar('ubicaciones', p)}>
              {UBICACION[p].titulo}
            </Chip>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="text-caption text-muted-foreground">Provincias (ninguna = todo el país)</legend>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {PROVINCIAS.map((p) => (
            <Chip key={p} activo={(a.provincias ?? []).includes(p)} onClick={() => alternar('provincias', p)}>
              {p}
            </Chip>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-3">
        <Campo etiqueta="Público">
          <select value={a.publico ?? 'adultos'} onChange={(e) => set('publico', e.target.value as 'adultos' | 'todos')} className={cn(inputBase, 'h-11 px-3')}>
            <option value="adultos">Sólo adultos</option>
            <option value="todos">Adultos y 13 a 17</option>
          </select>
        </Campo>
        <Campo etiqueta="Desde">
          <Input type="date" value={a.desde ?? ''} onChange={(e) => set('desde', e.target.value)} />
        </Campo>
        <Campo etiqueta="Hasta (vacío = sin fin)">
          <Input type="date" value={a.hasta ?? ''} onChange={(e) => set('hasta', e.target.value || null)} />
        </Campo>
        <Campo etiqueta="Peso (1–100)">
          <Input type="number" min={1} max={100} value={a.peso ?? 1} onChange={(e) => set('peso', Number(e.target.value) || 1)} />
        </Campo>
        <Campo etiqueta="Tope de vistas (vacío = sin tope)">
          <Input
            type="number"
            min={1}
            value={a.tope_impresiones ?? ''}
            onChange={(e) => set('tope_impresiones', e.target.value ? Number(e.target.value) : null)}
          />
        </Campo>
        <Campo etiqueta="Notas (sólo el panel)">
          <Input value={a.notas ?? ''} onChange={(e) => set('notas', e.target.value)} placeholder="Pagó $… hasta …" />
        </Campo>
      </div>

      <div>
        <p className="mb-1 text-caption text-muted-foreground">Así se ve</p>
        <div className="max-w-md">
          <p className="mb-1.5 text-caption text-muted-foreground">Patrocinado</p>
          <div className={CLASE_TARJETA}>
            <ContenidoAnuncio
              anuncio={{
                anunciante: a.anunciante || 'Anunciante',
                titulo: a.titulo || 'Título del anuncio',
                texto: a.texto || null,
                imagen_url: a.imagen_url || null,
                cta: a.cta || 'Conocer más',
              }}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancelar}>
          Cancelar
        </Button>
        <Button type="submit" size="sm" loading={guardando} disabled={subiendo}>
          Guardar
        </Button>
      </div>
    </form>
  );
}

function Fila({ titulo, detalle, children }: { titulo: string; detalle: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-button border border-border p-3">
      <span className="min-w-0 flex-1">
        <span className="block text-small font-semibold">{titulo}</span>
        <span className="block text-caption text-muted-foreground">{detalle}</span>
      </span>
      {children}
    </div>
  );
}

function Paso({ ok, texto }: { ok: boolean; texto: string }) {
  return (
    <li className="flex items-start gap-2">
      {ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />}
      <span className={ok ? '' : 'text-muted-foreground'}>{texto}</span>
    </li>
  );
}

function Numero({
  etiqueta,
  valor,
  min,
  max,
  corto,
  onCambiar,
}: {
  etiqueta: string;
  valor: number;
  min: number;
  max: number;
  corto?: boolean;
  onCambiar: (v: number) => void;
}) {
  return (
    <label className="flex flex-col text-caption text-muted-foreground">
      {etiqueta}
      <Input
        type="number"
        min={min}
        max={max}
        value={valor}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (Number.isFinite(v)) onCambiar(Math.min(max, Math.max(min, Math.round(v))));
        }}
        className={cn('mt-1 tnum', corto ? 'h-9 w-24 px-2.5 text-small' : '')}
      />
    </label>
  );
}

function Campo({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <label className="block text-caption text-muted-foreground">
      {etiqueta}
      <span className="mt-1 block">{children}</span>
    </label>
  );
}

function Chip({ activo, onClick, children }: { activo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={cn(
        'rounded-pill border px-2.5 py-1 text-caption font-medium transition-colors',
        activo ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40',
      )}
    >
      {children}
    </button>
  );
}
