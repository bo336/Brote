'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  Circle,
  Clock,
  Copy,
  ExternalLink,
  FileText,
  Loader2,
  MessageSquareWarning,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CATEGORIA,
  EVIDENCIA,
  NIVEL,
  desafioAbandonar,
  desafioDetalle,
  desafioEnviar,
  desafioGuardarEvidencia,
  desafioInscribirse,
  subirArchivoDesafio,
  verArchivoPropio,
  type DetalleDesafio,
  type Evidencia,
  type Requisito,
} from '@/lib/api/desafios';
import { toast } from '@/stores/toast';
import { cn } from '@/lib/utils/cn';

const ERRORES: Record<string, string> = {
  sin_permiso: 'Tu rol en la empresa no permite esto.',
  no_verificada: 'La empresa tiene que estar verificada para inscribirse.',
  demasiados: 'Ya tienen cinco desafíos en marcha. Terminen uno antes de empezar otro.',
  ya_inscripta: 'Ya están inscriptos en este desafío.',
  cerrada: 'Esta entrega ya no se puede editar.',
  vencida: 'Se pasó la fecha para este desafío.',
  incompleta: 'Faltan requisitos por completar.',
  archivo: 'El archivo no es válido.',
  enlace: 'El enlace tiene que empezar con http:// o https://.',
  limite: 'Demasiados cambios por hoy. Sigan mañana.',
  tipo: 'Sólo fotos o PDF.',
  grande: 'El archivo pesa más de 5 MB.',
  subida: 'No se pudo subir el archivo. Probá de nuevo.',
};

const fecha = (iso: string) => new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });

export function DetalleDesafioEmpresa({ negocioId, slug }: { negocioId: string; slug: string }) {
  const [d, setD] = useState<DetalleDesafio | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const cargar = useCallback(async () => {
    setD(await desafioDetalle(negocioId, slug));
  }, [negocioId, slug]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  if (!d) return <Skeleton className="h-96 w-full" />;
  if (!d.ok) return <p className="text-small text-muted-foreground">Ese desafío no existe o ya no está disponible.</p>;

  const { desafio, inscripcion: ins, evidencias, certificado } = d;
  const cat = CATEGORIA[desafio.categoria];
  const activa = ins && ['en_curso', 'observada'].includes(ins.estado);
  const editable = !!activa && d.puede_editar;
  const completos = desafio.requisitos.filter((r) => evidencias[r.id]?.completa).length;
  const todo = completos === desafio.requisitos.length;
  const puedeInscribirse =
    d.puede_inscribir && d.verificada && desafio.abierto && (!ins || ['vencida', 'abandonada', 'rechazada'].includes(ins.estado));

  async function inscribirse() {
    setOcupado(true);
    const r = await desafioInscribirse(negocioId, desafio.id);
    setOcupado(false);
    if (!r.ok) return toast.error('No se pudo', ERRORES[r.error ?? ''] ?? r.error);
    toast.success('Inscriptos', `Tienen ${desafio.dias} días para completarlo.`);
    await cargar();
  }

  async function enviar() {
    if (!ins) return;
    setOcupado(true);
    const r = await desafioEnviar(negocioId, ins.id);
    setOcupado(false);
    if (!r.ok) return toast.error('No se pudo enviar', ERRORES[r.error ?? ''] ?? r.error);
    toast.success('Enviado', 'Lo revisamos y les avisamos. Suele tardar pocos días hábiles.');
    await cargar();
  }

  async function abandonar() {
    if (!ins) return;
    setOcupado(true);
    const r = await desafioAbandonar(negocioId, ins.id);
    setOcupado(false);
    if (!r.ok) return toast.error('No se pudo', ERRORES[r.error ?? ''] ?? r.error);
    await cargar();
  }

  return (
    <div className="space-y-5">
      <Link href="/negocio/desafios" className="inline-flex items-center gap-1.5 text-small text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Desafíos
      </Link>

      <header className="border-l-4 pl-4" style={{ borderColor: cat.color }}>
        <p className="eyebrow text-muted-foreground">
          {cat.nombre} · Nivel {desafio.nivel} — {NIVEL[desafio.nivel]}
        </p>
        <h1 className="mt-1 font-display text-h1 font-bold">{desafio.titulo}</h1>
        <p className="mt-1 text-small leading-relaxed">{desafio.resumen}</p>
        {desafio.descripcion && <p className="mt-2 max-w-2xl text-small leading-relaxed text-muted-foreground">{desafio.descripcion}</p>}
      </header>

      {/* Estado */}
      {certificado ? (
        <Certificado c={certificado} titulo={desafio.titulo} />
      ) : ins?.estado === 'enviada' ? (
        <Aviso icono={<Loader2 className="h-4 w-4 animate-spin text-primary" />} titulo="En revisión">
          Lo mandaron el {fecha(ins.enviada_at!)}. Les avisamos apenas lo revisemos.
        </Aviso>
      ) : ins?.estado === 'observada' ? (
        <Aviso icono={<MessageSquareWarning className="h-4 w-4 text-brote-coral" />} titulo="Falta algo" tono="coral">
          {ins.nota}
          <span className="mt-1 block text-caption text-muted-foreground">Corrijan y vuelvan a enviar antes del {fecha(ins.vence_at)}.</span>
        </Aviso>
      ) : ins?.estado === 'rechazada' ? (
        <Aviso icono={<MessageSquareWarning className="h-4 w-4 text-brote-coral" />} titulo="No pudimos aprobarlo" tono="coral">
          {ins.nota} Pueden volver a inscribirse cuando lo tengan.
        </Aviso>
      ) : ins?.estado === 'en_curso' ? (
        <Aviso icono={<Clock className="h-4 w-4 text-primary" />} titulo={`${completos} de ${desafio.requisitos.length} requisitos`}>
          Tienen hasta el {fecha(ins.vence_at)} para enviarlo.
          <span className="mt-2 block h-1.5 overflow-hidden rounded-pill bg-surface-2">
            <span
              className="block h-full rounded-pill bg-primary transition-[width] duration-300"
              style={{ width: `${(100 * completos) / desafio.requisitos.length}%` }}
            />
          </span>
        </Aviso>
      ) : null}

      {puedeInscribirse && (
        <div className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4 sm:flex-row sm:items-center">
          <p className="flex-1 text-small text-muted-foreground">
            Tienen {desafio.dias} días para cargar la evidencia. Si se aprueba, el certificado vale {desafio.vigencia_meses} meses.
          </p>
          <Button variant="primary" loading={ocupado} onClick={inscribirse}>
            {ins ? 'Volver a inscribirse' : 'Inscribirse'}
          </Button>
        </div>
      )}
      {!d.verificada && !ins && (
        <p className="text-small text-muted-foreground">
          Para inscribirse, la empresa tiene que estar verificada.{' '}
          <Link href="/negocio/verificacion" className="font-semibold text-primary underline-offset-2 hover:underline">
            Ver la verificación
          </Link>
        </p>
      )}

      {/* Requisitos */}
      <section>
        <h2 className="mb-2 font-display text-h3 font-bold">Requisitos</h2>
        <ol className="space-y-2">
          {desafio.requisitos.map((r, i) => (
            <RequisitoFila
              key={r.id}
              n={i + 1}
              r={r}
              e={evidencias[r.id]}
              editable={editable}
              negocioId={negocioId}
              inscripcionId={ins?.id ?? null}
              onCambio={cargar}
            />
          ))}
        </ol>
      </section>

      {editable && (
        <div className="flex flex-wrap items-center gap-3 border-t border-hairline pt-4">
          <Button variant="primary" loading={ocupado} disabled={!todo} onClick={enviar}>
            Enviar para revisión
          </Button>
          {!todo && <span className="text-caption text-muted-foreground">Completen todos los requisitos para enviar.</span>}
          {d.puede_inscribir && (
            <button type="button" onClick={abandonar} className="ml-auto text-caption text-muted-foreground hover:text-brote-coral">
              Abandonar el desafío
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Aviso({
  icono,
  titulo,
  children,
  tono = 'neutro',
}: {
  icono: React.ReactNode;
  titulo: string;
  children: React.ReactNode;
  tono?: 'neutro' | 'coral';
}) {
  return (
    <div className={cn('rounded-card border p-4', tono === 'coral' ? 'border-brote-coral/40 bg-brote-coral/5' : 'border-border bg-surface')}>
      <p className="flex items-center gap-2 text-small font-semibold">
        {icono}
        {titulo}
      </p>
      <div className="mt-1 text-small leading-relaxed">{children}</div>
    </div>
  );
}

function Certificado({ c, titulo }: { c: NonNullable<DetalleDesafio['certificado']>; titulo: string }) {
  const url = typeof window !== 'undefined' ? `${window.location.origin}/certificados/${c.codigo}` : `/certificados/${c.codigo}`;
  return (
    <div className="overflow-hidden rounded-card border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-primary/15 text-primary">
          <Award className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="eyebrow text-primary">{c.revocado ? 'Certificado revocado' : c.vigente ? 'Certificado vigente' : 'Certificado vencido'}</p>
          <p className="font-display text-h2 font-bold">{titulo}</p>
          <p className="mt-0.5 text-small text-muted-foreground">
            Código <span className="font-semibold text-foreground">{c.codigo}</span> · emitido el {fecha(c.emitido_at)} · vence el{' '}
            {fecha(c.vence_at)}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={`/certificados/${c.codigo}`}
          target="_blank"
          rel="noopener"
          className="inline-flex h-9 items-center gap-1.5 rounded-button bg-primary px-3.5 text-small font-semibold text-primary-foreground shadow-crisp transition-colors hover:bg-brote-green-deep"
        >
          <ExternalLink className="h-4 w-4" /> Ver la página pública
        </a>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            void navigator.clipboard.writeText(url);
            toast.success('Enlace copiado', 'Cualquiera puede verificarlo con ese enlace.');
          }}
        >
          <Copy className="h-4 w-4" /> Copiar enlace
        </Button>
      </div>
    </div>
  );
}

function RequisitoFila({
  n,
  r,
  e,
  editable,
  negocioId,
  inscripcionId,
  onCambio,
}: {
  n: number;
  r: Requisito;
  e: Evidencia | undefined;
  editable: boolean;
  negocioId: string;
  inscripcionId: string | null;
  onCambio: () => Promise<void>;
}) {
  const [texto, setTexto] = useState(e?.texto ?? '');
  const [valor, setValor] = useState(e?.valor != null ? String(e.valor) : '');
  const [enlace, setEnlace] = useState(e?.enlace ?? '');
  const [guardando, setGuardando] = useState(false);
  const archivoRef = useRef<HTMLInputElement>(null);
  const completa = !!e?.completa;

  useEffect(() => {
    setTexto(e?.texto ?? '');
    setValor(e?.valor != null ? String(e.valor) : '');
    setEnlace(e?.enlace ?? '');
  }, [e?.texto, e?.valor, e?.enlace]);

  async function guardar(campos: Parameters<typeof desafioGuardarEvidencia>[3]) {
    if (!inscripcionId) return;
    setGuardando(true);
    const res = await desafioGuardarEvidencia(negocioId, inscripcionId, r.id, campos);
    setGuardando(false);
    if (!res.ok) return toast.error('No se pudo guardar', ERRORES[res.error ?? ''] ?? res.error);
    await onCambio();
  }

  async function subir(f: File) {
    setGuardando(true);
    const s = await subirArchivoDesafio(negocioId, f);
    setGuardando(false);
    if (!s.ok) return toast.error('No se pudo subir', ERRORES[s.error] ?? s.error);
    await guardar({ archivo: s.ruta });
  }

  const pideArchivo = r.evidencia === 'foto' || r.evidencia === 'documento';

  return (
    <li className={cn('rounded-card border bg-surface p-4 transition-colors', completa ? 'border-primary/30' : 'border-border')}>
      <div className="flex items-start gap-3">
        {completa ? (
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-label="Completo" />
        ) : (
          <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-label="Pendiente" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-small font-semibold">
            <span className="text-muted-foreground">{n}.</span> {r.texto}
          </p>
          <p className="mt-0.5 text-caption text-muted-foreground">
            {EVIDENCIA[r.evidencia]}
            {r.unidad ? ` · ${r.unidad}` : ''}
            {r.ayuda ? ` · ${r.ayuda}` : ''}
          </p>

          {/* Lo cargado */}
          {e?.archivo_path && (
            <button
              type="button"
              onClick={async () => {
                const u = await verArchivoPropio(e.archivo_path!);
                if (u) window.open(u, '_blank', 'noopener');
              }}
              className="mt-2 inline-flex items-center gap-1.5 text-caption font-medium text-primary hover:underline"
            >
              <FileText className="h-3.5 w-3.5" /> Ver el archivo cargado
            </button>
          )}
          {!editable && e?.valor != null && <p className="mt-2 text-small tnum">{e.valor} {r.unidad ?? ''}</p>}
          {!editable && e?.enlace && (
            <a href={e.enlace} target="_blank" rel="noopener nofollow" className="mt-2 block truncate text-caption text-primary hover:underline">
              {e.enlace}
            </a>
          )}
          {!editable && e?.texto && <p className="mt-2 whitespace-pre-line text-small text-muted-foreground">{e.texto}</p>}

          {/* Cargar */}
          {editable && (
            <div className="mt-3 space-y-2">
              {pideArchivo && (
                <>
                  <input
                    ref={archivoRef}
                    type="file"
                    accept={r.evidencia === 'foto' ? 'image/*' : 'image/*,application/pdf'}
                    className="sr-only"
                    onChange={(ev) => {
                      const f = ev.target.files?.[0];
                      if (f) void subir(f);
                      ev.target.value = '';
                    }}
                  />
                  <Button size="sm" variant="secondary" loading={guardando} onClick={() => archivoRef.current?.click()}>
                    <Upload className="h-4 w-4" /> {e?.archivo_path ? 'Reemplazar' : r.evidencia === 'foto' ? 'Subir foto' : 'Subir archivo'}
                  </Button>
                </>
              )}
              {(r.evidencia === 'enlace' || r.evidencia === 'documento') && (
                <div className="flex gap-2">
                  <Input
                    value={enlace}
                    onChange={(ev) => setEnlace(ev.target.value)}
                    placeholder={r.evidencia === 'documento' ? '…o pegá un enlace (Drive, sitio web)' : 'https://'}
                    inputMode="url"
                    className="h-9 text-small"
                  />
                  <Button size="sm" variant="secondary" loading={guardando} disabled={!enlace.trim() || enlace === (e?.enlace ?? '')} onClick={() => guardar({ enlace: enlace.trim() })}>
                    Guardar
                  </Button>
                </div>
              )}
              {r.evidencia === 'dato' && (
                <div className="flex items-center gap-2">
                  <Input
                    value={valor}
                    onChange={(ev) => setValor(ev.target.value)}
                    inputMode="decimal"
                    className="h-9 w-32 text-small tnum"
                    aria-label={r.unidad ?? 'Dato'}
                  />
                  {r.unidad && <span className="text-caption text-muted-foreground">{r.unidad}</span>}
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={guardando}
                    disabled={!valor.trim() || !Number.isFinite(Number(valor.replace(',', '.')))}
                    onClick={() => guardar({ valor: Number(valor.replace(',', '.')) })}
                  >
                    Guardar
                  </Button>
                </div>
              )}
              {r.evidencia === 'declaracion' && (
                <div className="space-y-2">
                  <Textarea value={texto} onChange={(ev) => setTexto(ev.target.value)} maxLength={2000} placeholder="Contalo con detalle: qué, cuándo, quién." />
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="secondary" loading={guardando} disabled={texto.trim().length < 20 || texto === (e?.texto ?? '')} onClick={() => guardar({ texto })}>
                      Guardar
                    </Button>
                    {texto.trim().length < 20 && <span className="text-caption text-muted-foreground">Al menos 20 caracteres.</span>}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

