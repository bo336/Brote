'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Clock, ExternalLink, PiggyBank, RefreshCw, Repeat, Sparkles, Users } from 'lucide-react';
import { Sheet } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Pill } from '@/components/ui/pill';
import { DomainIcon } from '@/components/icons/DomainIcon';
import { CantidadSelector } from './CantidadSelector';
import { getDomain, getDomainName } from '@/lib/domains';
import { activityDescription, activityInstructions } from '@/lib/activity-copy';
import { CONTEXTO_POR_CLAVE, MOTIVO_CAMBIO_ES, type ContextoClave, type MotivoCambio } from '@/lib/acciones/reglas';
import { estacionesTexto, formatoTexto, minutosTexto, razonTexto, type EfemerideHoy } from '@/lib/acciones/presentar';
import { addHabit } from '@/lib/api/competencias';
import type { AccionConRazon, ResultadoCambio } from '@/lib/api/acciones';
import type { Impact } from '@/lib/points';
import { toast } from '@/stores/toast';
import { cn } from '@/lib/utils/cn';

type Modo = 'detalle' | 'cambiar' | 'rutina';

/**
 * La hoja de una acción del día: qué es, cómo se hace, por qué está en tu día,
 * cuánto (si es medible), marcarla y, si no te sirve, cambiarla diciendo por
 * qué. No completa nada por su cuenta: avisa a quien la abrió.
 */
export function HojaAccion({
  accion,
  open,
  onOpenChange,
  hecha,
  completando,
  cambiable,
  cambiosRestantes,
  efemeride,
  esChico,
  onCompletar,
  onCambiar,
}: {
  accion: AccionConRazon | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  hecha: boolean;
  completando: boolean;
  /** Está en el set de hoy y todavía no se hizo. */
  cambiable: boolean;
  cambiosRestantes: number;
  efemeride?: EfemerideHoy | null;
  esChico?: boolean;
  onCompletar: (a: AccionConRazon, cantidad?: number) => void;
  onCambiar?: (a: AccionConRazon, motivo: MotivoCambio, contexto?: string | null) => Promise<ResultadoCambio>;
}) {
  const [modo, setModo] = useState<Modo>('detalle');
  const [cantidad, setCantidad] = useState(1);
  const [cambiando, setCambiando] = useState<string | null>(null);
  const [sumando, setSumando] = useState(false);

  useEffect(() => {
    if (!open) return;
    setModo('detalle');
    setCambiando(null);
    setCantidad(accion?.medida?.def ?? 1);
  }, [open, accion?.id, accion?.medida?.def]);

  if (!accion) return null;
  const a = accion;
  const dom = getDomain(a.domain_slug);
  const razon = razonTexto(a.razon, { efemeride, dominio: (s) => getDomainName(s) });
  const pasos = activityInstructions(a.verification, a.instructions_es);

  async function cambiar(motivo: MotivoCambio, contexto?: string | null) {
    if (!onCambiar) return;
    setCambiando(`${motivo}:${contexto ?? ''}`);
    const res = await onCambiar(a, motivo, contexto);
    setCambiando(null);
    if (!res.ok) {
      toast.error('No se pudo cambiar', res.error);
      return;
    }
    if (res.contextoActualizado && contexto) {
      const info = CONTEXTO_POR_CLAVE[contexto as ContextoClave];
      toast.success('Anotado', info ? `Ya no te mostramos acciones que piden ${info.label.toLowerCase()}.` : undefined);
    }
    if (res.sugerirRutina) {
      setModo('rutina');
      return;
    }
    toast.success(res.nueva ? 'Listo, te dimos otra' : 'La sacamos de tu día');
    onOpenChange(false);
  }

  async function sumarARutina() {
    setSumando(true);
    const r = await addHabit(a.id);
    setSumando(false);
    if (r.ok) toast.success('¡Sumada a tu rutina!', 'La vas a ver todos los días, con su racha.');
    else toast.error('No se pudo', r.error);
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {modo === 'detalle' && (
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <DomainIcon domain={a.domain_slug} size={44} />
            <div className="min-w-0 flex-1">
              {dom && (
                <span className="eyebrow block" style={{ color: dom.color }}>
                  {dom.name_es}
                </span>
              )}
              <h2 className="mt-0.5 text-balance font-display text-h3 font-bold leading-tight">{a.title_es}</h2>
              {razon && (
                <p className="mt-1 inline-flex items-center gap-1 text-caption font-medium text-primary">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden />
                  {razon}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {minutosTexto(a.minutos) && (
              <Pill size="sm">
                <Clock className="h-3 w-3" aria-hidden /> {minutosTexto(a.minutos)}
              </Pill>
            )}
            {formatoTexto(a.formato) && <Pill size="sm">{formatoTexto(a.formato)}</Pill>}
            {a.ahorra && (
              <Pill size="sm" className="border-brote-green/40 text-brote-green">
                <PiggyBank className="h-3 w-3" aria-hidden /> Te ahorra plata
              </Pill>
            )}
            {esChico && a.con_adulto && (
              <Pill size="sm" className="border-brote-sun/50 text-brote-ink dark:text-brote-sun">
                <Users className="h-3 w-3" aria-hidden /> Con un adulto
              </Pill>
            )}
            {estacionesTexto(a.estaciones) && <Pill size="sm">{estacionesTexto(a.estaciones)}</Pill>}
          </div>

          <p className="text-body leading-relaxed">{activityDescription(a.title_es, a.impact as Impact, a.description_es)}</p>
          {a.fuente && a.fuente_url && (
            <a
              href={a.fuente_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-caption text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              Fuente: {a.fuente} <ExternalLink className="h-3 w-3" aria-hidden />
            </a>
          )}

          <ol className="space-y-2">
            {pasos.map((p, i) => (
              <li key={i} className="flex gap-2.5 text-small leading-relaxed">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-caption font-bold text-primary tnum">
                  {i + 1}
                </span>
                <span>{p}</span>
              </li>
            ))}
          </ol>

          {a.medida && !hecha && (
            <CantidadSelector medida={a.medida} valor={cantidad} onChange={setCantidad} dominio={a.domain_slug} />
          )}

          <div className="space-y-2 pt-1">
            {hecha ? (
              <Button block variant="secondary" disabled>
                <Check className="h-4 w-4" /> Hecha hoy
              </Button>
            ) : (
              <Button block variant="primary" loading={completando} onClick={() => onCompletar(a, a.medida ? cantidad : undefined)}>
                <Check className="h-4 w-4" /> Marcar como hecha
              </Button>
            )}
            <div className="flex gap-2">
              {cambiable && onCambiar && (
                <Button
                  variant="ghost"
                  className="flex-1"
                  disabled={cambiosRestantes <= 0}
                  onClick={() => setModo('cambiar')}
                >
                  <RefreshCw className="h-4 w-4" /> {cambiosRestantes > 0 ? 'Cambiar' : 'Sin cambios hoy'}
                </Button>
              )}
              <Button variant="ghost" className="flex-1" asChild>
                <Link href={`/acciones/${a.slug}`}>
                  Ver más <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {modo === 'cambiar' && (
        <div className="space-y-3">
          <div>
            <h2 className="font-display text-h3 font-bold leading-tight">¿Por qué la cambiás?</h2>
            <p className="mt-0.5 text-small text-muted-foreground">
              Te {cambiosRestantes === 1 ? 'queda 1 cambio' : `quedan ${cambiosRestantes} cambios`} hoy. Lo que nos digas
              hace que tus próximos días te sirvan más.
            </p>
          </div>
          <div className="overflow-hidden rounded-card border border-border">
            <Motivo
              titulo={MOTIVO_CAMBIO_ES.hoy_no.titulo}
              detalle={MOTIVO_CAMBIO_ES.hoy_no.detalle}
              cargando={cambiando === 'hoy_no:'}
              onClick={() => cambiar('hoy_no')}
            />
            {(a.requiere ?? [])
              .filter((k) => CONTEXTO_POR_CLAVE[k as ContextoClave])
              .map((k) => {
                const info = CONTEXTO_POR_CLAVE[k as ContextoClave];
                return (
                  <Motivo
                    key={k}
                    titulo={info.noTengo}
                    detalle="La sacamos, y también las otras que lo piden."
                    cargando={cambiando === `no_aplica:${k}`}
                    onClick={() => cambiar('no_aplica', k)}
                  />
                );
              })}
            <Motivo
              titulo={MOTIVO_CAMBIO_ES.no_aplica.titulo}
              detalle={MOTIVO_CAMBIO_ES.no_aplica.detalle}
              cargando={cambiando === 'no_aplica:'}
              onClick={() => cambiar('no_aplica')}
            />
            <Motivo
              titulo={MOTIVO_CAMBIO_ES.ya_lo_hago.titulo}
              detalle={MOTIVO_CAMBIO_ES.ya_lo_hago.detalle}
              cargando={cambiando === 'ya_lo_hago:'}
              onClick={() => cambiar('ya_lo_hago')}
            />
            <Motivo
              titulo={MOTIVO_CAMBIO_ES.no_me_gusta.titulo}
              detalle={MOTIVO_CAMBIO_ES.no_me_gusta.detalle}
              cargando={cambiando === 'no_me_gusta:'}
              onClick={() => cambiar('no_me_gusta')}
            />
          </div>
          <Button variant="ghost" block onClick={() => setModo('detalle')}>
            Volver
          </Button>
        </div>
      )}

      {modo === 'rutina' && (
        <div className="space-y-4 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Repeat className="h-7 w-7" aria-hidden />
          </span>
          <div>
            <h2 className="font-display text-h3 font-bold leading-tight">¡Buenísimo que ya lo hagas!</h2>
            <p className="mt-1 text-small leading-relaxed text-muted-foreground">
              Te dimos otra para hoy. Si querés, sumá «{a.title_es}» a tu rutina: la marcás con un toque cada día, cuenta
              igual y tiene su propia racha.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={() => onOpenChange(false)}>
              Listo
            </Button>
            <Button variant="primary" className="flex-[2]" loading={sumando} onClick={sumarARutina}>
              <Repeat className="h-4 w-4" /> Sumar a mi rutina
            </Button>
          </div>
        </div>
      )}
    </Sheet>
  );
}

function Motivo({
  titulo,
  detalle,
  cargando,
  onClick,
}: {
  titulo: string;
  detalle: string;
  cargando: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={cargando}
      className={cn(
        'flex w-full items-center gap-3 border-b border-hairline bg-surface p-3.5 text-left transition-colors last:border-b-0 hover:bg-surface-2',
        cargando && 'opacity-60',
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-small font-semibold">{titulo}</span>
        <span className="mt-0.5 block text-caption leading-snug text-muted-foreground">{detalle}</span>
      </span>
      {cargando ? (
        <RefreshCw className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" aria-hidden />
      ) : (
        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      )}
    </button>
  );
}
