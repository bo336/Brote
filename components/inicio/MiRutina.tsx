'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Check, Flame, Pencil, Plus, Repeat, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet } from '@/components/ui/sheet';
import { DomainIcon } from '@/components/icons/DomainIcon';
import { fetchMyHabits, fetchRoutineSuggestions, addHabit, removeHabit, type Habit } from '@/lib/api/competencias';
import { getDomainColor } from '@/lib/domains';
import { toast } from '@/stores/toast';
import { haptic } from '@/lib/utils/haptics';
import { cn } from '@/lib/utils/cn';

const MAX_HABITS = 5;

/**
 * "Mi rutina" (F14.5) as a row of pills — the things someone does EVERY day,
 * one tap each.
 *
 * Its own shape on purpose: the day's actions are a checklist, suggestions are
 * cards, and a habit is a small repeated gesture, so it looks like a toggle,
 * with its streak on it. The row scrolls sideways; "Sumar" is always the last
 * pill; "Editar" turns the pills into removable chips instead of scattering an
 * ✕ on every one of them all the time.
 *
 * Only curated, genuinely repeatable actions can be added (routine_eligible):
 * letting everything be pinned would turn the daily set into a static list.
 * Marking one goes through `complete_activity`, like any action — so it is
 * real impact, and counts as such.
 */
export function MiRutina({ onDo, pendingId }: { onDo: (h: Habit) => void; pendingId: string | null }) {
  const t = useTranslations('inicio.rutina');
  const qc = useQueryClient();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editando, setEditando] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const habitsQ = useQuery({ queryKey: ['my-habits'], queryFn: fetchMyHabits, staleTime: 30_000 });
  const suggestionsQ = useQuery({
    queryKey: ['routine-suggestions'],
    queryFn: () => fetchRoutineSuggestions(20),
    enabled: pickerOpen || (habitsQ.isSuccess && habitsQ.data.length === 0),
  });

  const habits = habitsQ.data ?? [];
  const full = habits.length >= MAX_HABITS;
  const hechos = habits.filter((h) => h.done_today).length;

  function refresh() {
    qc.invalidateQueries({ queryKey: ['my-habits'] });
    qc.invalidateQueries({ queryKey: ['routine-suggestions'] });
  }

  async function onAdd(activityId: string) {
    setBusyId(activityId);
    const res = await addHabit(activityId);
    setBusyId(null);
    if (res.ok) {
      haptic('success');
      refresh();
      setPickerOpen(false);
    } else {
      toast.error(t('noSeSumo'), res.error);
    }
  }

  async function onDrop(activityId: string) {
    await removeHabit(activityId);
    refresh();
  }

  return (
    <section aria-labelledby="mi-rutina">
      <div className="mb-2.5 flex items-end justify-between gap-2">
        <div className="min-w-0">
          <span className="eyebrow flex items-center gap-1.5 text-muted-foreground">
            <Repeat className="h-3.5 w-3.5 text-primary" aria-hidden />
            {habits.length > 0 ? t('eyebrowConteo', { hechos, total: habits.length }) : t('eyebrow')}
          </span>
          <h2 id="mi-rutina" className="mt-0.5 font-display text-h3 font-bold leading-tight">
            {t('titulo')}
          </h2>
        </div>
        {habits.length > 0 && (
          <button
            type="button"
            onClick={() => setEditando((v) => !v)}
            aria-pressed={editando}
            className="inline-flex items-center gap-1 rounded-pill px-2.5 py-1 text-caption font-medium text-muted-foreground transition-colors duration-150 hover:bg-surface-2 hover:text-foreground"
          >
            {editando ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Pencil className="h-3.5 w-3.5" aria-hidden />}
            {editando ? t('listo') : t('editar')}
          </button>
        )}
      </div>

      {habitsQ.isLoading ? (
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-11 w-36 rounded-pill" />
          ))}
        </div>
      ) : habits.length === 0 ? (
        <Vacia sugerencias={suggestionsQ.data ?? []} busyId={busyId} onAdd={onAdd} onMas={() => setPickerOpen(true)} />
      ) : (
        <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar" aria-label={t('titulo')}>
          {habits.map((h) => (
            <li key={h.activity_id} className="shrink-0">
              <Pastilla
                h={h}
                editando={editando}
                cargando={pendingId === h.activity_id}
                onDo={() => onDo(h)}
                onDrop={() => void onDrop(h.activity_id)}
              />
            </li>
          ))}
          {!full && !editando && (
            <li className="shrink-0">
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="press inline-flex h-11 items-center gap-1.5 rounded-pill border border-dashed border-primary/50 px-4 text-small font-semibold text-primary hover:bg-primary/[0.06]"
              >
                <Plus className="h-4 w-4" aria-hidden />
                {t('sumar')}
              </button>
            </li>
          )}
        </ul>
      )}

      <Sheet open={pickerOpen} onOpenChange={setPickerOpen} title={t('sheetTitulo')}>
        <p className="mb-3 text-small text-muted-foreground">{t('sheetCuerpo', { max: MAX_HABITS })}</p>
        {suggestionsQ.isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : (suggestionsQ.data ?? []).length === 0 ? (
          <p className="py-6 text-center text-small text-muted-foreground">{t('sinSugerencias')}</p>
        ) : (
          <div className="divide-hairline overflow-hidden rounded-card border border-border">
            {(suggestionsQ.data ?? []).map((s) => (
              <button
                key={s.activity_id}
                type="button"
                onClick={() => void onAdd(s.activity_id)}
                disabled={busyId === s.activity_id}
                className="flex w-full items-center gap-3 bg-surface p-3 text-left transition-colors duration-150 hover:bg-surface-2 disabled:opacity-50"
              >
                <DomainIcon domain={s.domain_slug} size={34} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-small font-medium">{s.title_es}</span>
                  {s.short_es && <span className="block truncate text-caption text-muted-foreground">{s.short_es}</span>}
                </span>
                <span className="shrink-0 text-caption font-bold text-brote-sun tnum">+{s.base_points}</span>
                <Plus className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              </button>
            ))}
          </div>
        )}
      </Sheet>
    </section>
  );
}

function Pastilla({
  h,
  editando,
  cargando,
  onDo,
  onDrop,
}: {
  h: Habit;
  editando: boolean;
  cargando: boolean;
  onDo: () => void;
  onDrop: () => void;
}) {
  const t = useTranslations('inicio.rutina');
  const color = getDomainColor(h.domain_slug);

  if (editando) {
    return (
      <button
        type="button"
        onClick={onDrop}
        aria-label={t('sacarAria', { titulo: h.title_es })}
        className="press inline-flex h-11 max-w-[15rem] items-center gap-2 rounded-pill border border-brote-coral/40 bg-brote-coral/[0.06] pl-3 pr-2.5 text-small font-medium"
      >
        <span className="truncate">{h.title_es}</span>
        <X className="h-4 w-4 shrink-0 text-brote-coral" aria-hidden />
      </button>
    );
  }

  const hecho = h.done_today;
  return (
    <button
      type="button"
      onClick={() => {
        if (hecho || cargando) return;
        haptic('medium');
        onDo();
      }}
      disabled={hecho || cargando}
      aria-pressed={hecho}
      aria-label={hecho ? t('hechoAria', { titulo: h.title_es }) : t('marcarAria', { titulo: h.title_es, puntos: h.base_points })}
      className={cn(
        'press relative inline-flex h-11 max-w-[15rem] items-center gap-2 overflow-hidden rounded-pill border pl-1.5 pr-3 text-small font-medium transition-colors duration-200',
        hecho
          ? 'border-transparent bg-primary text-primary-foreground shadow-crisp'
          : 'border-border bg-surface shadow-soft hover:border-primary/40',
      )}
    >
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
        style={hecho ? { background: 'rgb(255 255 255 / 0.2)' } : { background: `${color}1f`, color }}
      >
        {hecho ? (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 22 }}>
            <Check className="h-4 w-4" strokeWidth={3} aria-hidden />
          </motion.span>
        ) : (
          <DomainIcon domain={h.domain_slug} size={18} variant="bare" />
        )}
      </span>
      <span className="truncate">{h.title_es}</span>
      {h.current_streak > 0 ? (
        <span
          className={cn(
            'inline-flex shrink-0 items-center gap-0.5 text-caption font-bold tnum',
            hecho ? 'text-primary-foreground/90' : 'text-brote-coral',
          )}
        >
          <Flame className="h-3.5 w-3.5" aria-hidden />
          {h.current_streak}
        </span>
      ) : (
        !hecho && <span className="shrink-0 text-caption font-bold text-brote-sun tnum">+{h.base_points}</span>
      )}
    </button>
  );
}

/** No routine yet: say what it is in one line and offer three real ones. */
function Vacia({
  sugerencias,
  busyId,
  onAdd,
  onMas,
}: {
  sugerencias: { activity_id: string; title_es: string; domain_slug: string }[];
  busyId: string | null;
  onAdd: (id: string) => void;
  onMas: () => void;
}) {
  const t = useTranslations('inicio.rutina');
  return (
    <div className="rounded-card border border-dashed border-border p-3.5">
      <p className="text-small leading-relaxed text-muted-foreground">{t('vacia')}</p>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {sugerencias.slice(0, 3).map((s) => (
          <button
            key={s.activity_id}
            type="button"
            disabled={busyId === s.activity_id}
            onClick={() => onAdd(s.activity_id)}
            className="press inline-flex h-10 max-w-full items-center gap-1.5 rounded-pill border border-border bg-surface pl-1.5 pr-3 text-small font-medium shadow-soft hover:border-primary/40 disabled:opacity-50"
          >
            <DomainIcon domain={s.domain_slug} size={28} className="rounded-full" />
            <span className="truncate">{s.title_es}</span>
            <Plus className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
          </button>
        ))}
        <button
          type="button"
          onClick={onMas}
          className="press inline-flex h-10 items-center gap-1 rounded-pill px-3 text-small font-semibold text-primary hover:bg-primary/[0.06]"
        >
          {t('verTodas')}
        </button>
      </div>
    </div>
  );
}
