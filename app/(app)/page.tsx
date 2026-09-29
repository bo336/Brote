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
import { LinkRow } from '@/components/ui/link-row';
import { Pip } from '@/components/pip/Pip';
import { useSession } from '@/stores/session';
import { greetingKey } from '@/lib/utils/dates';
import { isStreakAtRisk } from '@/lib/streak';
import { useDailySet, useTodayCompletions, useDailyPool, useCompleteActivity } from '@/hooks/use-daily-set';
import { fetchProjects } from '@/lib/api/plaza';
import { parseImpact } from '@/lib/impact';
import type { ConImpacto } from '@/lib/inicio/impacto';
import type { Habit } from '@/lib/api/competencias';
import type { ActivityRow } from '@/lib/supabase/rows';
import type { CompleteActivityResult } from '@/lib/types';
import { cn } from '@/lib/utils/cn';

type Accion = ActivityRow & ConImpacto;

/** How many extra daily actions the "más" row offers (the pool has ~180). */
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

  const dailySet = useDailySet();
  const completions = useTodayCompletions();
  const pool = useDailyPool();
  const complete = useCompleteActivity();

  const [ultima, setUltima] = useState<Accion | null>(null);
  const [pendiente, setPendiente] = useState<string | null>(null);

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

  const set = useMemo(() => (dailySet.data ?? []) as Accion[], [dailySet.data]);
  const done = useMemo(() => completions.data ?? new Set<string>(), [completions.data]);
  const hechas = set.filter((a) => done.has(a.id)).length;
  const total = set.length;
  const completo = total > 0 && hechas === total;
  const racha = profile?.currentStreak ?? 0;
  const atRisk = isStreakAtRisk(profile?.lastStreakDate ?? null, racha);

  // A handful of extra daily actions: the ones already done today first (so
  // they stay visible), then the person's topics, then the catalogue order.
  const extra = useMemo(() => {
    const intereses = new Set(profile?.interests ?? []);
    return ((pool.data ?? []) as Accion[])
      .filter((a) => !set.some((s) => s.id === a.id))
      .map((a, i) => ({ a, k: (done.has(a.id) ? 0 : 2) + (intereses.has(a.domain_slug) ? 0 : 1), i }))
      .sort((x, y) => x.k - y.k || x.i - y.i)
      .slice(0, EXTRAS)
      .map((x) => x.a);
  }, [pool.data, set, done, profile?.interests]);

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

  function completar(a: Accion) {
    if (done.has(a.id) || complete.isPending) return;
    setPendiente(a.id);
    complete.mutate(
      { activityId: a.id },
      {
        onSuccess: (res) => {
          if (res.status === 'honor' || res.status === 'verified') setUltima(conImpactoReal(a, res));
        },
        onSettled: () => setPendiente(null),
      },
    );
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
  const estado = dailySet.isLoading
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
        <AccionesDeHoy set={set} extra={extra} done={done} loading={dailySet.isLoading} onComplete={completar} />
        <AntesDeCerrar ultima={contexto} reciente={!!ultima} hechasHoy={done.size} completo={completo} />
      </div>

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
