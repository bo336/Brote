'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Check, Leaf, MessagesSquare, PenLine, Search, Trash2, Users } from 'lucide-react';
import { Sheet } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { DomainIcon } from '@/components/icons/DomainIcon';
import { useSumar } from '@/stores/sumar';
import { useSession } from '@/stores/session';
import { useAccionesDeHoy } from '@/hooks/use-acciones';
import { useCompleteActivity, useTodayCompletions } from '@/hooks/use-daily-set';
import { useCatalog } from '@/hooks/use-catalog';
import { impactoDeAccion, pistaDeImpacto, type ConImpacto } from '@/lib/inicio/impacto';
import {
  REGLAS_PROPIAS,
  TEXTO_MOTIVO,
  limpiarTitulo,
  motivoTituloPropio,
  puntosDeLaProxima,
  sugerirDelCatalogo,
} from '@/lib/acciones/propias';
import { borrarPropia, fetchMisPropias, registrarPropia } from '@/lib/api/propias';
import { createPost } from '@/lib/api/feed';
import { DOMAINS } from '@/lib/domains';
import { invalidateScores } from '@/lib/refresh';
import { toast } from '@/stores/toast';
import { haptic } from '@/lib/utils/haptics';
import { cn } from '@/lib/utils/cn';
import type { AccionConRazon } from '@/lib/api/acciones';

type Accion = AccionConRazon & ConImpacto;

/** Nombres cortos para los temas: los largos ("Residuos y Reciclaje") no entran en una píldora. */
const TEMA_CORTO: Record<string, string> = {
  residuos: 'Residuos',
  agua: 'Agua',
  energia: 'Energía',
  movilidad: 'Movilidad',
  plantas: 'Plantas',
  animales: 'Animales',
  alimentacion: 'Comida',
  consumo: 'Consumo',
  digital: 'Digital',
  comunidad: 'Comunidad',
  agua_azul: 'Ríos y mar',
  aire_suelo: 'Aire y suelo',
  ciencia: 'Ciencia',
};

function useEsEscritorio(): boolean {
  const [v, setV] = useState(false);
  useEffect(() => {
    const m = window.matchMedia('(min-width: 1024px)');
    const f = () => setV(m.matches);
    f();
    m.addEventListener('change', f);
    return () => m.removeEventListener('change', f);
  }, []);
  return v;
}

/**
 * Sumar — el botón del centro (docs/REESTRUCTURA.md D3, D6).
 *
 * Desde cualquier pantalla: marcar lo que falta del día, cargar algo propio
 * que no está en el catálogo, o ir a buscar una acción más grande. Antes el
 * centro de la barra llevaba al catálogo, y marcar lo del día obligaba a volver
 * a Hoy.
 */
export function HojaSumar() {
  const abierta = useSumar((s) => s.abierta);
  const modo = useSumar((s) => s.modo);
  const cerrar = useSumar((s) => s.cerrar);
  const [pestana, setPestana] = useState<'dia' | 'propia'>(modo);
  const escritorio = useEsEscritorio();
  useEffect(() => {
    if (abierta) setPestana(modo);
  }, [abierta, modo]);

  return (
    <Sheet
      open={abierta}
      onOpenChange={(v) => !v && cerrar()}
      side={escritorio ? 'center' : 'bottom'}
      title="¿Qué hiciste?"
      description="Todo suma a tu día, a tu liga y a tu mundo."
      className={escritorio ? 'max-h-[88vh] overflow-y-auto' : undefined}
    >
      <div role="tablist" aria-label="Qué querés sumar" className="mt-2 grid grid-cols-2 gap-1 rounded-pill bg-surface-2 p-1">
        {(
          [
            ['dia', 'De tu día'],
            ['propia', 'Otra cosa'],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={pestana === k}
            onClick={() => setPestana(k)}
            className={cn(
              'relative h-10 rounded-pill text-small font-semibold transition-colors duration-150',
              pestana === k ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {pestana === k && (
              <motion.span
                layoutId="sumar-pestana"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                className="absolute inset-0 rounded-pill bg-surface shadow-soft"
              />
            )}
            <span className="relative">{label}</span>
          </button>
        ))}
      </div>

      <div className="mt-4">
        {pestana === 'dia' ? <ListaDelDia onOtra={() => setPestana('propia')} onCerrar={cerrar} /> : <FormPropia onCerrar={cerrar} />}
      </div>

      <Puertas onCerrar={cerrar} />
    </Sheet>
  );
}

// ── De tu día ───────────────────────────────────────────────────────────────

function ListaDelDia({ onOtra, onCerrar }: { onOtra: () => void; onCerrar: () => void }) {
  const dia = useAccionesDeHoy();
  const completions = useTodayCompletions();
  const complete = useCompleteActivity();
  const [pendiente, setPendiente] = useState<string | null>(null);
  const set = useMemo(() => (dia.data?.acciones ?? []) as Accion[], [dia.data]);
  const done = completions.data ?? new Set<string>();
  const hechas = set.filter((a) => done.has(a.id)).length;
  const completo = set.length > 0 && hechas === set.length;

  if (dia.isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-card" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="eyebrow text-muted-foreground">Tu día</span>
        <span className="text-caption font-semibold tnum text-muted-foreground">
          {hechas} de {set.length}
        </span>
      </div>

      {completo && (
        <div className="rounded-card bg-hecho/[0.08] p-3.5 text-small">
          <p className="font-semibold">Tu día está completo.</p>
          <p className="mt-0.5 text-muted-foreground">¿Hiciste algo más? Cargalo y suma a tu semana.</p>
          <button type="button" onClick={onOtra} className="mt-2 inline-flex items-center gap-1 font-semibold text-hecho">
            Cargar otra cosa <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      )}

      <ul className="divide-hairline overflow-hidden rounded-card border border-border bg-surface">
        {set.map((a) => {
          const hecha = done.has(a.id);
          const medible = !!a.medida && !hecha;
          const pista = pistaDeImpacto(impactoDeAccion(a), a.domain_slug);
          return (
            <li key={a.id} className="flex items-center gap-3 px-3 py-2.5">
              <DomainIcon domain={a.domain_slug} size={36} />
              <span className="min-w-0 flex-1">
                <span className={cn('block truncate text-small font-medium', hecha && 'text-muted-foreground line-through')}>{a.title_es}</span>
                <span className="mt-0.5 flex items-center gap-1.5 text-caption text-muted-foreground">
                  <span className="font-bold text-brote-sun tnum">+{a.base_points}</span>
                  {pista && (
                    <span className="truncate" style={{ color: pista.color }}>
                      · {pista.texto}
                    </span>
                  )}
                </span>
              </span>
              {medible ? (
                <Link
                  href={`/acciones/${a.slug}`}
                  onClick={onCerrar}
                  className="press inline-flex h-9 shrink-0 items-center rounded-pill border border-border px-3 text-caption font-semibold hover:border-hecho/40"
                >
                  Contar
                </Link>
              ) : (
                <button
                  type="button"
                  disabled={hecha || complete.isPending}
                  aria-label={hecha ? `Hecha: ${a.title_es}` : `Marcar como hecha: ${a.title_es}`}
                  onClick={() => {
                    if (hecha) return;
                    haptic('success');
                    setPendiente(a.id);
                    complete.mutate({ activityId: a.id }, { onSettled: () => setPendiente(null) });
                  }}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full disabled:cursor-default"
                >
                  <span
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-200',
                      hecha ? 'border-hecho bg-hecho text-hecho-foreground' : 'border-border hover:border-hecho/60',
                      pendiente === a.id && 'animate-pulse',
                    )}
                  >
                    {hecha && <Check className="h-4 w-4" strokeWidth={3} />}
                  </span>
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <PropiasDeHoy />

      {!completo && (
        <button
          type="button"
          onClick={onOtra}
          className="press flex w-full items-center gap-3 rounded-card border border-dashed border-border px-3.5 py-3 text-left hover:border-hecho/50"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-hecho/12 text-hecho">
            <PenLine className="h-4 w-4" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-small font-semibold">¿Hiciste otra cosa?</span>
            <span className="block text-caption text-muted-foreground">Cargala aunque no esté en la lista.</span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        </button>
      )}
    </div>
  );
}

/** Lo que cargaste hoy por tu cuenta, con la opción de borrarlo. */
function PropiasDeHoy() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['propias'], queryFn: () => fetchMisPropias(20), staleTime: 30_000 });
  const [borrando, setBorrando] = useState<string | null>(null);
  const deHoy = (q.data?.acciones ?? []).filter((a) => a.borrable);
  if (deHoy.length === 0) return null;

  async function borrar(id: string) {
    setBorrando(id);
    const r = await borrarPropia(id);
    setBorrando(null);
    if (!r.ok) return toast.error('No se pudo borrar', 'Probá de nuevo en un rato.');
    qc.invalidateQueries({ queryKey: ['propias'] });
    invalidateScores(qc);
  }

  return (
    <div>
      <span className="eyebrow block text-muted-foreground">También hiciste hoy</span>
      <ul className="mt-1.5 space-y-1.5">
        {deHoy.map((a) => (
          <li key={a.id} className="flex items-center gap-2.5 rounded-button bg-surface-2 px-3 py-2">
            <DomainIcon domain={a.dominio} size={26} variant="bare" />
            <span className="min-w-0 flex-1 truncate text-small">{a.titulo}</span>
            <span className={cn('shrink-0 text-caption font-bold tnum', a.puntos > 0 ? 'text-brote-sun' : 'text-muted-foreground')}>
              {a.puntos > 0 ? `+${a.puntos}` : 'sin puntos'}
            </span>
            <button
              type="button"
              onClick={() => borrar(a.id)}
              disabled={borrando === a.id}
              aria-label={`Borrar: ${a.titulo}`}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface hover:text-brote-coral"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Otra cosa (acción propia) ───────────────────────────────────────────────

function FormPropia({ onCerrar }: { onCerrar: () => void }) {
  const qc = useQueryClient();
  const profile = useSession((s) => s.profile);
  const esChico = profile?.accountType === 'kid';
  const catalogo = useCatalog(profile?.accountType ?? 'adult');
  const q = useQuery({ queryKey: ['propias'], queryFn: () => fetchMisPropias(20), staleTime: 30_000 });
  const [titulo, setTitulo] = useState('');
  const [tema, setTema] = useState<string | null>(null);
  const [nota, setNota] = useState('');
  const [conNota, setConNota] = useState(false);
  const [compartir, setCompartir] = useState(false);
  const [intento, setIntento] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reglas = q.data?.reglas ?? REGLAS_PROPIAS;
  const conPuntos = q.data?.hoy.con_puntos_restantes ?? REGLAS_PROPIAS.con_puntos_por_dia;
  const restantes = q.data?.hoy.restantes ?? REGLAS_PROPIAS.max_por_dia;
  const puntos = puntosDeLaProxima(conPuntos, reglas);
  const motivo = motivoTituloPropio(titulo, reglas);
  const parecidas = useMemo(
    () => (titulo.trim().length >= 6 ? sugerirDelCatalogo(titulo, catalogo.data ?? [], 2) : []),
    [titulo, catalogo.data],
  );

  async function enviar() {
    setIntento(true);
    setError(null);
    if (motivo) return;
    if (!tema) return setError(TEXTO_MOTIVO.tema);
    setEnviando(true);
    const limpio = limpiarTitulo(titulo);
    const r = await registrarPropia(limpio, tema, conNota ? nota : null);
    if (!r.ok) {
      setEnviando(false);
      return setError(TEXTO_MOTIVO[r.error ?? 'no_disponible'] ?? TEXTO_MOTIVO.no_disponible);
    }
    if (compartir && !esChico) {
      // La Plaza tiene su propio filtro: si algo engancha la lista, queda en revisión.
      await createPost({ body: conNota && nota.trim() ? `${limpio}\n\n${nota.trim()}` : limpio }).catch(() => null);
    }
    setEnviando(false);
    haptic('success');
    if ((r.puntos ?? 0) > 0) toast.points(r.puntos!);
    toast.success('¡Anotado!', (r.puntos ?? 0) > 0 ? 'Suma a tu día y a tu liga.' : 'Quedó en tu historial. Hoy ya sumaste las que dan puntos.');
    setTitulo('');
    setTema(null);
    setNota('');
    setConNota(false);
    setIntento(false);
    qc.invalidateQueries({ queryKey: ['propias'] });
    invalidateScores(qc);
  }

  if (restantes <= 0) {
    return (
      <div className="rounded-card bg-surface-2 p-4 text-small">
        <p className="font-semibold">Ya cargaste {reglas.max_por_dia} hoy.</p>
        <p className="mt-0.5 text-muted-foreground">Mañana seguís. Mientras, mirá el catálogo: hay acciones que suman su impacto real.</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void enviar();
      }}
      className="space-y-4"
    >
      <div>
        <label htmlFor="propia-titulo" className="text-small font-semibold">
          ¿Qué hiciste?
        </label>
        <input
          id="propia-titulo"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          maxLength={reglas.max_largo}
          placeholder="Ej.: Arreglé la canilla que goteaba"
          autoComplete="off"
          className="mt-1.5 h-12 w-full rounded-button border border-border bg-surface px-3.5 text-body outline-none transition-colors focus:border-foreground/40"
          aria-invalid={intento && !!motivo}
          aria-describedby="propia-ayuda"
        />
        <p id="propia-ayuda" className={cn('mt-1 text-caption', intento && motivo ? 'text-brote-coral' : 'text-muted-foreground')}>
          {intento && motivo ? TEXTO_MOTIVO[motivo] : 'Con dos palabras alcanza: qué hiciste y con qué.'}
        </p>
      </div>

      {parecidas.length > 0 && (
        <div className="rounded-card border border-lugar-acciones/30 bg-lugar-acciones/[0.06] p-3">
          <p className="flex items-center gap-1.5 text-caption font-semibold text-lugar-acciones">
            <Leaf className="h-3.5 w-3.5" aria-hidden />
            ¿Es alguna de estas? Suman su impacto real.
          </p>
          <ul className="mt-2 space-y-1.5">
            {parecidas.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/acciones/${a.slug}`}
                  onClick={onCerrar}
                  className="press flex items-center gap-2.5 rounded-button bg-surface px-2.5 py-2 text-small font-medium shadow-soft hover:-translate-y-px"
                >
                  <DomainIcon domain={a.domain_slug} size={28} />
                  <span className="min-w-0 flex-1 truncate">{a.title_es}</span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-lugar-acciones" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <fieldset>
        <legend className="text-small font-semibold">¿De qué tema es?</legend>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {DOMAINS.map((d) => {
            const sel = tema === d.slug;
            return (
              <button
                key={d.slug}
                type="button"
                onClick={() => {
                  setTema(d.slug);
                  setError(null);
                }}
                aria-pressed={sel}
                className={cn(
                  'press inline-flex h-9 items-center gap-1.5 rounded-pill border px-3 text-caption font-semibold transition-colors duration-150',
                  sel ? 'border-transparent text-white' : 'border-border bg-surface hover:border-foreground/25',
                )}
                style={sel ? { background: d.color } : undefined}
              >
                {!sel && <DomainIcon domain={d.slug} size={14} variant="bare" />}
                {TEMA_CORTO[d.slug] ?? d.name_es}
              </button>
            );
          })}
        </div>
      </fieldset>

      {conNota ? (
        <div>
          <label htmlFor="propia-nota" className="text-small font-semibold">
            Nota <span className="font-normal text-muted-foreground">(opcional)</span>
          </label>
          <textarea
            id="propia-nota"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            maxLength={reglas.max_nota}
            rows={3}
            className="mt-1.5 w-full resize-none rounded-button border border-border bg-surface px-3.5 py-2.5 text-small outline-none transition-colors focus:border-foreground/40"
          />
        </div>
      ) : (
        <button type="button" onClick={() => setConNota(true)} className="text-caption font-semibold text-muted-foreground hover:text-foreground">
          + Agregar una nota
        </button>
      )}

      {!esChico && (
        <label className="flex items-center justify-between gap-3 rounded-button bg-surface-2 px-3.5 py-3">
          <span className="flex min-w-0 items-center gap-2 text-small">
            <MessagesSquare className="h-4 w-4 shrink-0 text-lugar-plaza" aria-hidden />
            <span className="min-w-0">Contarlo en la Plaza</span>
          </span>
          <Switch checked={compartir} onCheckedChange={setCompartir} aria-label="Contarlo en la Plaza" />
        </label>
      )}

      {error && <p className="text-small font-medium text-brote-coral">{error}</p>}

      <div className="space-y-1.5">
        <Button type="submit" block loading={enviando} className="bg-hecho text-hecho-foreground hover:bg-hecho/90">
          {puntos > 0 ? `Sumar · +${puntos}` : 'Anotar sin puntos'}
        </Button>
        <p className="text-center text-caption leading-relaxed text-muted-foreground">
          {conPuntos > 0
            ? `Siempre ${reglas.puntos} puntos. Te quedan ${conPuntos} con puntos hoy.`
            : `Ya sumaste las ${reglas.con_puntos_por_dia} de hoy que dan puntos: esta queda en tu historial.`}{' '}
          No suma impacto medido: eso lo dan las acciones del catálogo.
        </p>
      </div>
    </form>
  );
}

// ── Puertas ─────────────────────────────────────────────────────────────────

function Puertas({ onCerrar }: { onCerrar: () => void }) {
  const esChico = useSession((s) => s.profile?.accountType) === 'kid';
  const items = [
    { href: '/acciones', icon: Search, label: 'Buscar en el catálogo', clase: 'text-lugar-acciones bg-lugar-acciones/12' },
    { href: '/acciones?tab=proyectos', icon: Users, label: 'Sumarte a un proyecto', clase: 'text-lugar-proyectos bg-lugar-proyectos/12' },
    ...(!esChico ? [{ href: '/feed', icon: MessagesSquare, label: 'Contar algo en la Plaza', clase: 'text-lugar-plaza bg-lugar-plaza/12' }] : []),
  ];
  return (
    <nav aria-label="Más formas de sumar" className="mt-5 border-t border-hairline pt-3">
      <ul className="grid grid-cols-3 gap-2">
        {items.map((i) => {
          const Icon = i.icon;
          return (
            <li key={i.href}>
              <Link
                href={i.href}
                onClick={onCerrar}
                className="press flex h-full flex-col items-center gap-1.5 rounded-button px-1 py-2 text-center text-caption font-medium leading-tight hover:bg-surface-2"
              >
                <span className={cn('flex h-10 w-10 items-center justify-center rounded-full', i.clase)}>
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                {i.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
