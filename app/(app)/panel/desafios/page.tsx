'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Award, ExternalLink, FileText, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Select, Textarea, Field } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ChipRail } from '@/components/ui/chip-rail';
import { Sheet } from '@/components/ui/sheet';
import { CandadoPanel, usePanelPass } from '@/components/panel/PanelPass';
import {
  CATEGORIA,
  EVIDENCIA,
  NIVEL,
  adminCertificadoRevocar,
  adminDesafioGuardar,
  adminDesafioRevisar,
  adminDesafios,
  adminDesafiosCola,
  type CategoriaDesafio,
  type DesafioAdmin,
  type EntregaDesafio,
  type Requisito,
  type TipoEvidencia,
} from '@/lib/api/desafios';
import { firmarEvidencia } from '@/lib/api/negocios';
import { toast } from '@/stores/toast';
import { cn } from '@/lib/utils/cn';

/**
 * `/panel/desafios` (LANZAMIENTO F6): las entregas para revisar, los desafíos
 * (crear, editar, publicar, archivar) y los certificados emitidos.
 */

type Tab = 'entregas' | 'desafios' | 'certificados';
const fecha = (iso: string) => new Date(iso).toLocaleDateString('es-AR');

export default function DesafiosPanelPage() {
  const { pass, setPass } = usePanelPass();
  const [tab, setTab] = useState<Tab>('entregas');
  const [cola, setCola] = useState<EntregaDesafio[] | null>(null);
  const [todo, setTodo] = useState<Awaited<ReturnType<typeof adminDesafios>> | null>(null);
  const [editando, setEditando] = useState<Partial<DesafioAdmin> | null>(null);
  const [cargando, setCargando] = useState(false);

  const cargar = useCallback(async () => {
    if (!pass) return;
    setCargando(true);
    const [c, d] = await Promise.all([adminDesafiosCola(pass), adminDesafios(pass)]);
    setCargando(false);
    if (!c.ok || !d.ok) return setPass('');
    setCola(c.items);
    setTodo(d);
  }, [pass, setPass]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  if (!pass) return <CandadoPanel verificar={async (p) => (await adminDesafios(p)).ok} />;

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
        <p className="eyebrow text-primary">Empresas</p>
        <h1 className="font-display text-display-l font-extrabold">Desafíos y certificados</h1>
        <p className="mt-1 text-small text-muted-foreground">
          Publicá metas con requisitos verificables. Lo que se aprueba se vuelve un certificado con código público.
        </p>
      </header>

      <ChipRail
        layoutId="panel-desafios"
        value={tab}
        onChange={(v) => setTab(v as Tab)}
        options={[
          { value: 'entregas', label: `Entregas${cola?.length ? ` (${cola.length})` : ''}` },
          { value: 'desafios', label: 'Desafíos' },
          { value: 'certificados', label: 'Certificados' },
        ]}
      />

      {!cola || !todo ? (
        <Skeleton className="h-80 w-full" />
      ) : tab === 'entregas' ? (
        cola.length === 0 ? (
          <p className="rounded-card border border-border bg-surface p-4 text-small text-muted-foreground">No hay entregas esperando revisión.</p>
        ) : (
          <div className="space-y-4">
            {cola.map((e) => (
              <Entrega key={e.id} e={e} pass={pass} onListo={cargar} />
            ))}
          </div>
        )
      ) : tab === 'desafios' ? (
        <>
          <Button variant="primary" onClick={() => setEditando({ requisitos: [], nivel: 1, categoria: 'energia', para: 'todas', estado: 'borrador', dias: 60, vigencia_meses: 12, orden: 0 })}>
            <Plus className="h-4 w-4" /> Nuevo desafío
          </Button>
          <ul className="divide-y divide-hairline overflow-hidden rounded-card border border-border bg-surface">
            {todo.desafios.map((d) => (
              <li key={d.id}>
                <button
                  type="button"
                  onClick={() => setEditando(d)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-2"
                >
                  <span className="h-9 w-1 shrink-0 rounded-pill" style={{ backgroundColor: CATEGORIA[d.categoria].color }} />
                  <span className="min-w-0 flex-1">
                    <span className="eyebrow block text-muted-foreground">
                      {CATEGORIA[d.categoria].nombre} · {NIVEL[d.nivel]} · {d.para === 'todas' ? 'todas' : d.para === 'vender' ? 'tiendas' : 'empresas que mejoran'}
                    </span>
                    <span className="block truncate text-small font-semibold">{d.titulo}</span>
                  </span>
                  <span className="shrink-0 text-right text-caption">
                    <span
                      className={cn(
                        'inline-block rounded-pill px-2 py-0.5 font-semibold',
                        d.estado === 'publicado' ? 'bg-primary/15 text-primary' : d.estado === 'borrador' ? 'bg-brote-sun/15 text-brote-sun' : 'bg-surface-2 text-muted-foreground',
                      )}
                    >
                      {d.estado}
                    </span>
                    <span className="mt-0.5 block text-muted-foreground tnum">
                      {d.inscriptas} en curso · {d.certificadas} cert.
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <Certificados lista={todo.certificados} pass={pass} onCambio={cargar} />
      )}

      <Sheet open={!!editando} onOpenChange={(v) => !v && setEditando(null)} title={editando?.id ? 'Editar desafío' : 'Nuevo desafío'} side="center" className="max-h-[90vh] w-[min(94vw,40rem)] overflow-y-auto">
        {editando && (
          <Editor
            inicial={editando}
            pass={pass}
            onGuardado={async () => {
              setEditando(null);
              await cargar();
            }}
          />
        )}
      </Sheet>
    </div>
  );
}

/* ── Una entrega ─────────────────────────────────────────────────────────── */

function Entrega({ e, pass, onListo }: { e: EntregaDesafio; pass: string; onListo: () => Promise<void> }) {
  const [nota, setNota] = useState('');
  const [ocupado, setOcupado] = useState<string | null>(null);

  async function revisar(accion: 'aprobar' | 'observar' | 'rechazar') {
    setOcupado(accion);
    const r = await adminDesafioRevisar(pass, e.id, accion, nota);
    setOcupado(null);
    if (!r.ok) return toast.error('No se pudo', r.error);
    toast.success(accion === 'aprobar' ? `Certificado ${r.codigo} emitido` : accion === 'observar' ? 'Observado' : 'Rechazado', 'La empresa recibe un aviso.');
    await onListo();
  }

  return (
    <article className="rounded-card border border-border bg-surface p-4 shadow-soft">
      <p className="eyebrow text-muted-foreground">
        {CATEGORIA[e.desafio.categoria].nombre} · {NIVEL[e.desafio.nivel]} · enviado el {fecha(e.enviada_at)}
      </p>
      <h2 className="font-display text-h3 font-bold">{e.desafio.titulo}</h2>
      <p className="text-small text-muted-foreground">
        <Link href={`/panel/negocios/${e.empresa.id}`} className="font-semibold text-foreground hover:underline">
          {e.empresa.nombre}
        </Link>{' '}
        · {e.empresa.rubro}
        {e.empresa.ciudad ? ` · ${e.empresa.ciudad}` : ''}
      </p>
      {e.nota && <p className="mt-2 text-caption text-muted-foreground">Observación anterior: {e.nota}</p>}

      <ol className="mt-3 divide-y divide-hairline border-y border-hairline">
        {e.desafio.requisitos.map((r, i) => (
          <EvidenciaRevisor key={r.id} n={i + 1} r={r} ev={e.evidencias[r.id]} pass={pass} negocioId={e.empresa.id} />
        ))}
      </ol>

      <Textarea
        className="mt-3"
        value={nota}
        onChange={(ev) => setNota(ev.target.value)}
        placeholder="Nota para la empresa (obligatoria para observar o rechazar)"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="primary" loading={ocupado === 'aprobar'} onClick={() => revisar('aprobar')}>
          <Award className="h-4 w-4" /> Aprobar y emitir certificado
        </Button>
        <Button variant="secondary" loading={ocupado === 'observar'} onClick={() => revisar('observar')}>
          Observar
        </Button>
        <Button variant="ghost" className="text-brote-coral" loading={ocupado === 'rechazar'} onClick={() => revisar('rechazar')}>
          Rechazar
        </Button>
      </div>
    </article>
  );
}

function EvidenciaRevisor({
  n,
  r,
  ev,
  pass,
  negocioId,
}: {
  n: number;
  r: Requisito;
  ev: EntregaDesafio['evidencias'][string] | undefined;
  pass: string;
  negocioId: string;
}) {
  return (
    <li className="py-2.5 text-small">
      <p className="font-medium">
        <span className="text-muted-foreground">{n}.</span> {r.texto}
      </p>
      <div className="mt-1 space-y-1 text-muted-foreground">
        {ev?.valor != null && (
          <p className="text-foreground tnum">
            {ev.valor} {r.unidad ?? ''}
          </p>
        )}
        {ev?.texto && <p className="whitespace-pre-line text-foreground">{ev.texto}</p>}
        {ev?.enlace && (
          <a href={ev.enlace} target="_blank" rel="noopener nofollow" className="inline-flex items-center gap-1 text-primary hover:underline">
            <ExternalLink className="h-3.5 w-3.5" /> {ev.enlace}
          </a>
        )}
        {ev?.archivo_path && (
          <button
            type="button"
            onClick={async () => {
              const u = await firmarEvidencia(pass, negocioId, ev.archivo_path!);
              if (u) window.open(u, '_blank', 'noopener');
              else toast.error('No se pudo abrir el archivo');
            }}
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            <FileText className="h-3.5 w-3.5" /> Abrir archivo (enlace de 1 minuto)
          </button>
        )}
        {!ev && <p className="text-brote-coral">Sin evidencia</p>}
      </div>
    </li>
  );
}

/* ── Certificados ─────────────────────────────────────────────────────────── */

function Certificados({
  lista,
  pass,
  onCambio,
}: {
  lista: { codigo: string; titulo: string; empresa: string; emitido_at: string; vence_at: string; revocado: boolean }[];
  pass: string;
  onCambio: () => Promise<void>;
}) {
  const [revocando, setRevocando] = useState<string | null>(null);
  const [motivo, setMotivo] = useState('');
  if (lista.length === 0) return <p className="text-small text-muted-foreground">Todavía no se emitió ningún certificado.</p>;
  return (
    <>
      <ul className="divide-y divide-hairline overflow-hidden rounded-card border border-border bg-surface">
        {lista.map((c) => (
          <li key={c.codigo} className="flex items-center gap-3 px-4 py-3 text-small">
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">
                {c.empresa} · {c.titulo}
              </span>
              <span className="block text-caption text-muted-foreground">
                <a href={`/certificados/${c.codigo}`} target="_blank" rel="noopener" className="font-mono hover:underline">
                  {c.codigo}
                </a>{' '}
                · {fecha(c.emitido_at)} → {fecha(c.vence_at)}
              </span>
            </span>
            {c.revocado ? (
              <span className="rounded-pill bg-brote-coral/15 px-2 py-0.5 text-caption font-semibold text-brote-coral">revocado</span>
            ) : (
              <Button size="sm" variant="ghost" className="text-brote-coral" onClick={() => setRevocando(c.codigo)}>
                <Trash2 className="h-4 w-4" /> Revocar
              </Button>
            )}
          </li>
        ))}
      </ul>
      <Sheet open={!!revocando} onOpenChange={(v) => !v && setRevocando(null)} title={`Revocar ${revocando ?? ''}`}>
        <p className="text-small text-muted-foreground">El motivo se muestra en la página pública del certificado.</p>
        <Textarea className="mt-3" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Por qué se revoca" />
        <Button
          className="mt-3"
          variant="danger"
          block
          disabled={motivo.trim().length < 10}
          onClick={async () => {
            const r = await adminCertificadoRevocar(pass, revocando!, motivo);
            if (!r.ok) return toast.error('No se pudo', r.error);
            setRevocando(null);
            setMotivo('');
            await onCambio();
          }}
        >
          Revocar certificado
        </Button>
      </Sheet>
    </>
  );
}

/* ── Editor ──────────────────────────────────────────────────────────────── */

const slugDe = (t: string) =>
  t
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);

function Editor({ inicial, pass, onGuardado }: { inicial: Partial<DesafioAdmin>; pass: string; onGuardado: () => Promise<void> }) {
  const [d, setD] = useState<Partial<DesafioAdmin>>(inicial);
  const [guardando, setGuardando] = useState(false);
  const req = (d.requisitos ?? []) as Requisito[];
  const set = <K extends keyof DesafioAdmin>(k: K, v: DesafioAdmin[K]) => setD((x) => ({ ...x, [k]: v }));
  const setReq = (i: number, campo: keyof Requisito, v: string) =>
    set('requisitos', req.map((r, j) => (j === i ? { ...r, [campo]: v || undefined } : r)) as Requisito[]);

  async function guardar(estado?: DesafioAdmin['estado']) {
    setGuardando(true);
    const r = await adminDesafioGuardar(pass, { ...d, ...(estado ? { estado } : {}), slug: d.slug || slugDe(d.titulo ?? '') });
    setGuardando(false);
    if (!r.ok) return toast.error('No se pudo guardar', r.error);
    toast.success('Guardado');
    await onGuardado();
  }

  return (
    <div className="space-y-4 pb-6">
      <Field label="Título">
        <Input value={d.titulo ?? ''} onChange={(e) => set('titulo', e.target.value)} maxLength={80} />
      </Field>
      <Field label="Dirección (slug)" help={`/negocio/desafios/${d.slug || slugDe(d.titulo ?? '') || '…'}`}>
        <Input value={d.slug ?? ''} onChange={(e) => set('slug', slugDe(e.target.value))} placeholder={slugDe(d.titulo ?? '')} />
      </Field>
      <Field label="Resumen (una línea)">
        <Input value={d.resumen ?? ''} onChange={(e) => set('resumen', e.target.value)} maxLength={200} />
      </Field>
      <Field label="Por qué importa (opcional)">
        <Textarea value={d.descripcion ?? ''} onChange={(e) => set('descripcion', e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Tema">
          <Select value={d.categoria} onChange={(e) => set('categoria', e.target.value as CategoriaDesafio)}>
            {Object.entries(CATEGORIA).map(([k, v]) => (
              <option key={k} value={k}>
                {v.nombre}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Nivel">
          <Select value={d.nivel} onChange={(e) => set('nivel', Number(e.target.value) as 1 | 2 | 3)}>
            {[1, 2, 3].map((n) => (
              <option key={n} value={n}>
                {n} — {NIVEL[n]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Para">
          <Select value={d.para} onChange={(e) => set('para', e.target.value as DesafioAdmin['para'])}>
            <option value="todas">Todas</option>
            <option value="mejorar">Empresas que mejoran</option>
            <option value="vender">Tiendas</option>
          </Select>
        </Field>
        <Field label="Días para cumplir">
          <Input type="number" value={d.dias ?? 60} onChange={(e) => set('dias', Number(e.target.value))} />
        </Field>
        <Field label="Vigencia (meses)">
          <Input type="number" value={d.vigencia_meses ?? 12} onChange={(e) => set('vigencia_meses', Number(e.target.value))} />
        </Field>
        <Field label="Orden">
          <Input type="number" value={d.orden ?? 0} onChange={(e) => set('orden', Number(e.target.value))} />
        </Field>
      </div>

      <div>
        <p className="mb-2 text-small font-semibold">Requisitos ({req.length}/10)</p>
        <div className="space-y-3">
          {req.map((r, i) => (
            <div key={i} className="space-y-2 rounded-button border border-border p-3">
              <div className="flex gap-2">
                <Input value={r.texto} onChange={(e) => setReq(i, 'texto', e.target.value)} placeholder="Qué tiene que demostrar" className="text-small" />
                <Button size="icon-sm" variant="ghost" aria-label="Quitar" onClick={() => set('requisitos', req.filter((_, j) => j !== i) as Requisito[])}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Select value={r.evidencia} onChange={(e) => setReq(i, 'evidencia', e.target.value as TipoEvidencia)} className="text-small">
                  {Object.entries(EVIDENCIA).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </Select>
                <Input value={r.unidad ?? ''} onChange={(e) => setReq(i, 'unidad', e.target.value)} placeholder="Unidad (si es un dato)" className="text-small" />
              </div>
              <Input value={r.ayuda ?? ''} onChange={(e) => setReq(i, 'ayuda', e.target.value)} placeholder="Ayuda (opcional)" className="text-small" />
            </div>
          ))}
        </div>
        {req.length < 10 && (
          <Button
            size="sm"
            variant="secondary"
            className="mt-2"
            onClick={() => {
              const usados = new Set(req.map((r) => r.id));
              let k = req.length + 1;
              while (usados.has(`r${k}`)) k++;
              set('requisitos', [...req, { id: `r${k}`, texto: '', evidencia: 'foto' }] as Requisito[]);
            }}
          >
            <Plus className="h-4 w-4" /> Agregar requisito
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-hairline pt-4">
        <Button variant="primary" loading={guardando} onClick={() => guardar('publicado')}>
          Guardar y publicar
        </Button>
        <Button variant="secondary" loading={guardando} onClick={() => guardar('borrador')}>
          Guardar como borrador
        </Button>
        {d.id && d.estado !== 'archivado' && (
          <Button variant="ghost" loading={guardando} onClick={() => guardar('archivado')}>
            Archivar
          </Button>
        )}
      </div>
    </div>
  );
}
