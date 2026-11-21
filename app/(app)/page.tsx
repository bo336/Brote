'use client';

import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { ArrowRight, PenLine } from 'lucide-react';
import { ImpactoReal } from '@/components/inicio/ImpactoReal';
import { AccionesDeHoy } from '@/components/inicio/AccionesDeHoy';
import { AntesDeCerrar } from '@/components/inicio/AntesDeCerrar';
import { InvitacionAvisos } from '@/components/avisos/InvitacionAvisos';
import { MiRutina } from '@/components/inicio/MiRutina';
import { RetoDelDia } from '@/components/inicio/RetoDelDia';
import { ParaVos } from '@/components/inicio/ParaVos';
import { ContanosDeTuCasa } from '@/components/inicio/ContanosDeTuCasa';
import { FilaLugares } from '@/components/inicio/FilaLugares';
import { LigaEnVivo } from '@/components/inicio/LigaEnVivo';
import { HojaAccion } from '@/components/acciones/HojaAccion';
import { Pip } from '@/components/pip/Pip';
import { useSession } from '@/stores/session';
import { useSumar } from '@/stores/sumar';
import { greetingKey } from '@/lib/utils/dates';
import { isStreakAtRisk } from '@/lib/streak';
import { useTodayCompletions, useCompleteActivity } from '@/hooks/use-daily-set';
import { useAccionesDeHoy, useCambiarAccion, useSugeridas } from '@/hooks/use-acciones';
import { parseImpact } from '@/lib/impact';
import type { ConImpacto } from '@/lib/inicio/impacto';
import type { Habit } from '@/lib/api/competencias';
import type { AccionConRazon } from '@/lib/api/acciones';
import type { CompleteActivityResult } from '@/lib/types';
import type { MotivoCambio } from '@/lib/acciones/reglas';
import { cn } from '@/lib/utils/cn';
import { BotonesConsumidor } from '@/components/legal/BotonesConsumidor';

type Accion = AccionConRazon & ConImpacto;

/** How many extra daily actions the "más" row offers (the pool has ~170). */
const EXTRAS = 6;

/**
 * Hoy — el día (docs/REESTRUCTURA.md D4).
 *
 * De arriba a abajo, en el orden en que alguien lo necesita:
 *   1. quién y cuándo, y una frase sobre cómo viene el día;
 *   2. los lugares de Brote en una fila, con un punto donde hay algo esperando;
 *   3. las acciones de hoy y, apenas se marca una, "Antes de cerrar": lo que
 *      sumó y una puerta elegida para eso; y "¿hiciste otra cosa?";
 *   4. la liga de la semana en vivo — lo más importante, ahora a la vista;
 *   5. tu impacto real dicho en una frase (cuánto dura un hábito diario);
 *   6. la rutina, el reto del día y acciones más grandes para vos.
 *
 * "Seguí en Brote" (las tarjetas de Academia, Mundo, Plaza y Mercado) se mudó a
 * Explorar: Hoy es el día, Explorar es el pueblo. El panel de impacto sólo se
 * mueve con acciones medidas (0117); las propias suman puntos, no impacto.
 */
export default function InicioPage() {
  const t = useTranslations('inicio');
  const th = useTranslations('home');
  const tp = useTranslations('pip');
  const qc = useQueryClient();
  const profile = useSession((s) => s.profile);
  const abrirSumar = useSumar((s) => s.abrir);

  const dia = useAccionesDeHoy();
  const completions = useTodayCompletions();
  const masQ = useSugeridas('daily', EXTRAS);
  const complete = useCompleteActivity();
  const cambiarM = useCambiarAccion();

  const [ultima, setUltima] = useState<Accion | null>(null);
  const [pendiente, setPendiente] = useState<string | null>(null);
  const [abierta, setAbierta] = useState<Accion | null>(null);

  const greeting = useMemo(() => {
    const key = greetingKey();
    return th(
      key === 'morning'
        ? 'greetingMorning'
        : key === 'afternoon'
          ? 'greetingAfternoon'
          : key === 'evening'
            ? 'greetingEvening'
            : 'greetingNight',
    );
  }, [th]);

  // "miércoles 21 de agosto", capitalised.
  const today = useMemo(() => {
    const s = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
    return s.charAt(0).toUpperCase() + s.slice(1);
  }, []);

  const set = useMemo(() => (dia.data?.acciones ?? []) as Accion[], [dia.data]);
  const done = useMemo(() => completions.data ?? new Set<string>(), [completions.data]);
  const hechas = set.filter((a) => done.has(a.id)).length;
  const total = set.length;
  const completo = total > 0 && hechas === total;
  const racha = profile?.currentStreak ?? 0;
  const atRisk = isStreakAtRisk(profile?.lastStreakDate ?? null, racha);

  // A handful of extra daily actions, picked by the server with the same rules
  // as the day (age, context, season, what was swapped away). The list is not
  // refetched on each completion, so what was done stays visible, ticked.
  const extra = useMemo(
    () => ((masQ.data ?? []) as Accion[]).filter((a) => !set.some((s) => s.id === a.id)),
    [masQ.data, set],
  );

  // What "Antes de cerrar" talks about: the action just marked, or — coming
  // back later the same day — one that was done earlier.
  const contexto: Accion | null = useMemo(
    () => ultima ?? [...set, ...extra].find((a) => done.has(a.id)) ?? null,
    [ultima, set, extra, done],
  );

  /** The server's own numbers for what this completion saved, when it sends them. */
  function conImpactoReal(base: Accion, res: CompleteActivityResult): Accion {
    if (!res.impact) return base;
    const p = parseImpact(res.impact);
    return { ...base, impact_water_l: p.water_l, impact_co2_kg: p.co2_kg, impact_waste_kg: p.waste_kg, impact_energy_kwh: p.energy_kwh };
  }

  function completar(a: Accion, cantidad?: number) {
    if (done.has(a.id) || complete.isPending) return;
    setPendiente(a.id);
    complete.mutate(
      { activityId: a.id, cantidad: cantidad ?? null },
      {
        onSuccess: (res) => {
          if (res.status === 'honor' || res.status === 'verified') setUltima(conImpactoReal(a, res));
          setAbierta(null);
        },
        onSettled: () => setPendiente(null),
      },
    );
  }

  function cambiar(a: Accion, motivo: MotivoCambio, contexto?: string | null) {
    return cambiarM.mutateAsync({ activityId: a.id, motivo, contexto });
  }

  function completarHabito(h: Habit) {
    if (h.done_today || complete.isPending) return;
    // The routine only knows title and topic; the impact comes back from
    // `complete_activity` itself.
    const base = { id: h.activity_id, title_es: h.title_es, domain_slug: h.domain_slug, base_points: h.base_points } as Accion;
    setPendiente(h.activity_id);
    complete.mutate(
      { activityId: h.activity_id },
      {
        onSuccess: (res) => {
          if (res.status === 'honor' || res.status === 'verified') setUltima(conImpactoReal(base, res));
        },
        onSettled: () => {
          setPendiente(null);
          qc.invalidateQueries({ queryKey: ['my-habits'] });
        },
      },
    );
  }

  const nombre = profile?.displayName ? `, ${profile.displayName.split(' ')[0]}` : '';
  const estado = dia.isLoading
    ? tp('homeGreeting')
    : atRisk && hechas === 0
      ? t('estado.enRiesgo', { n: racha })
      : completo
        ? t('estado.completo', { racha })
        : hechas > 0
          ? t('estado.algunas', { hechas, total, faltan: total - hechas })
          : t('estado.ninguna', { n: total });

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <span className="eyebrow block text-primary">{today}</span>
          <h1 className="mt-1 font-display text-h1 font-bold leading-tight">
            {greeting}
            {nombre}
          </h1>
          <p
            className={cn(
              'mt-1 text-small leading-snug',
              atRisk && hechas === 0 ? 'font-medium text-brote-coral' : 'text-muted-foreground',
            )}
          >
            {estado}
          </p>
        </div>
        <Pip
          size={56}
          mood={atRisk && hechas === 0 ? 'worried' : completo ? 'celebrating' : 'happy'}
          pipStyle={profile?.pipStyle}
        />
      </header>

      <FilaLugares />

      <div className="space-y-3">
        <AccionesDeHoy
          set={set}
          extra={extra}
          done={done}
          loading={dia.isLoading}
          onComplete={completar}
          onAbrir={setAbierta}
          efemeride={dia.data?.efemeride ?? null}
        />
        <AntesDeCerrar ultima={contexto} reciente={!!ultima} hechasHoy={done.size} completo={completo} />
        {/* Lo que no está en la lista también cuenta (D6): siempre los mismos puntos. */}
        <button
          type="button"
          onClick={() => abrirSumar('propia')}
          className="press group flex w-full items-center gap-3 rounded-card border border-dashed border-border px-3.5 py-3 text-left hover:border-hecho/50"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-hecho/12 text-hecho">
            <PenLine className="h-4 w-4" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-small font-semibold">{t('otraCosa.titulo')}</span>
            <span className="block text-caption text-muted-foreground">{t('otraCosa.bajada')}</span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
        </button>
        {/* Sólo cuando ya hay algo que cuidar: una racha o una acción de hoy. */}
        {(racha > 0 || hechas > 0) && <InvitacionAvisos motivo={racha > 0 ? 'racha' : 'hoy'} />}
        <ContanosDeTuCasa />
      </div>

      <HojaAccion
        accion={abierta}
        open={!!abierta}
        onOpenChange={(v) => !v && setAbierta(null)}
        hecha={!!abierta && done.has(abierta.id)}
        completando={!!abierta && pendiente === abierta.id}
        cambiable={!!abierta && set.some((s) => s.id === abierta.id) && !done.has(abierta.id)}
        cambiosRestantes={dia.data?.cambiosRestantes ?? 0}
        efemeride={dia.data?.efemeride ?? null}
        esChico={profile?.accountType === 'kid'}
        onCompletar={(a, cantidad) => completar(a as Accion, cantidad)}
        onCambiar={(a, motivo, ctx) => cambiar(a as Accion, motivo, ctx)}
      />

      <LigaEnVivo />

      <ImpactoReal />

      <MiRutina onDo={completarHabito} pendingId={pendiente} />

      <RetoDelDia />

      <ParaVos />

      {/* Disposición 954/2025: a simple vista en el primer acceso, también con sesión. */}
      <BotonesConsumidor className="border-t border-hairline pt-4" centrado />
    </div>
  );
}
