'use client';

import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Users } from 'lucide-react';
import { ImpactoReal } from '@/components/inicio/ImpactoReal';
import { AccionesDeHoy } from '@/components/inicio/AccionesDeHoy';
import { AntesDeCerrar } from '@/components/inicio/AntesDeCerrar';
import { MiRutina } from '@/components/inicio/MiRutina';
import { SeguiEnBrote } from '@/components/inicio/SeguiEnBrote';
import { RetoDelDia } from '@/components/inicio/RetoDelDia';
import { ParaVos } from '@/components/inicio/ParaVos';
import { ContanosDeTuCasa } from '@/components/inicio/ContanosDeTuCasa';
import { HojaAccion } from '@/components/acciones/HojaAccion';
import { LinkRow } from '@/components/ui/link-row';
import { Pip } from '@/components/pip/Pip';
import { useSession } from '@/stores/session';
import { greetingKey } from '@/lib/utils/dates';
import { isStreakAtRisk } from '@/lib/streak';
import { useTodayCompletions, useCompleteActivity } from '@/hooks/use-daily-set';
import { useAccionesDeHoy, useCambiarAccion, useSugeridas } from '@/hooks/use-acciones';
import { fetchProjects } from '@/lib/api/plaza';
import { parseImpact } from '@/lib/impact';
import type { ConImpacto } from '@/lib/inicio/impacto';
import type { Habit } from '@/lib/api/competencias';
import type { AccionConRazon } from '@/lib/api/acciones';
import type { CompleteActivityResult } from '@/lib/types';
import type { MotivoCambio } from '@/lib/acciones/reglas';
import { cn } from '@/lib/utils/cn';

type Accion = AccionConRazon & ConImpacto;

/** How many extra daily actions the "más" row offers (the pool has ~170). */
const EXTRAS = 6;

/**
 * Inicio — the hub.
 *
 * Top to bottom, in the order someone needs it:
 *   1. who and when, and one sentence on where the day stands;
 *   2. **Tu impacto real** — what they saved in the real world, the reason the
 *      app exists, as the one hero of the page;
 *   3. today's actions (a checklist) and, the moment one is marked, "Antes de
 *      cerrar": what it added and one door picked for it;
 *   4. the routine (pills), one tap per habit;
 *   5. "Seguí en Brote": the Academia, their island, the Plaza and the Mercado
 *      with something real of theirs in each;
 *   6. the day's challenge and bigger actions picked for them.
 *
 * The world used to open the page as a 320 px picture and the impact sat at
 * the bottom; every block was the same bordered card. Now each block has its
 * own shape (see each component), and the impact panel only moves when an
 * action from the day, the routine or Acciones is marked (0117).
 */
export default function InicioPage() {
  const t = useTranslations('inicio');
  const th = useTranslations('home');
  const tp = useTranslations('pip');
  const tpr = useTranslations('proyectos');
  const qc = useQueryClient();
  const profile = useSession((s) => s.profile);

  const dia = useAccionesDeHoy();
  const completions = useTodayCompletions();
  const masQ = useSugeridas('daily', EXTRAS);
  const complete = useCompleteActivity();
  const cambiarM = useCambiarAccion();

  const [ultima, setUltima] = useState<Accion | null>(null);
  const [pendiente, setPendiente] = useState<string | null>(null);
  const [abierta, setAbierta] = useState<Accion | null>(null);

  // Real count, so the row never claims projects that are not there.
  const projectsQ = useQuery({
    queryKey: ['projects', profile?.id],
    queryFn: () => fetchProjects(profile?.id),
    staleTime: 5 * 60_000,
  });
  const openProjects = (projectsQ.data ?? []).filter((p) => p.status === 'active').length;

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

      <ImpactoReal />

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

      <MiRutina onDo={completarHabito} pendingId={pendiente} />

      <SeguiEnBrote />

      <RetoDelDia />

      <ParaVos />

      {/* Projects live under Acciones; this is their door from Inicio. */}
      <LinkRow
        href="/acciones?tab=proyectos"
        icon={<Users className="h-5 w-5" />}
        accent="#FF8A3D"
        title={tpr('nearbyTitle')}
        description={openProjects > 0 ? tpr('nearbyBody', { n: openProjects }) : 'Sumate a algo que ya está pasando'}
      />
    </div>
  );
}
