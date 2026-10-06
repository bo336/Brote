'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Check, Lock, Repeat, Globe2, Clock, PiggyBank, Users, ExternalLink, Compass, EyeOff } from 'lucide-react';
import { DomainIcon } from '@/components/icons/DomainIcon';
import { DondeConseguirlo } from '@/components/mercado/DondeConseguirlo';
import { Pill } from '@/components/ui/pill';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Pip } from '@/components/pip/Pip';
import { getDomain } from '@/lib/domains';
import { meetsRank } from '@/lib/ranks';
import { lockLabel } from '@/lib/recommendations';
import { formatPoints } from '@/lib/points';
import { activityDescription, activityInstructions } from '@/lib/activity-copy';
import { useSession } from '@/stores/session';
import { fetchActivityBySlug } from '@/lib/api/catalog';
import { addHabit } from '@/lib/api/competencias';
import { useCatalogCompletions } from '@/hooks/use-catalog';
import { completeActivity } from '@/lib/api/activities';
import { celebrateCompletion } from '@/lib/rewards';
import { invalidateScores } from '@/lib/refresh';
import { toast } from '@/stores/toast';
import Link from 'next/link';
import type { Impact } from '@/lib/points';
import { CantidadSelector } from '@/components/acciones/CantidadSelector';
import { useMisCaminos } from '@/hooks/use-acciones';
import { ocultarAccion } from '@/lib/api/acciones';
import { estacionesTexto, formatoTexto, minutosTexto, requiereTexto } from '@/lib/acciones/presentar';

const EFFORT_ES = { easy: 'Fácil', medium: 'Media', hard: 'Difícil' } as const;
const IMPACT_ES = { low: 'Bajo', medium: 'Medio', high: 'Alto' } as const;

/**
 * Activity detail. Trust-based completion model: no photo verification —
 * every action is marked done on the user's honor (IMPROVEMENT_PLAN F1.6).
 */
export default function ActivityDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const t = useTranslations('acciones');
  const tc = useTranslations('common');
  const qc = useQueryClient();
  const profile = useSession((s) => s.profile);
  const [busy, setBusy] = useState(false);
  const [habitBusy, setHabitBusy] = useState(false);
  const [cantidad, setCantidad] = useState(1);
  const [ocultando, setOcultando] = useState(false);
  const caminosQ = useMisCaminos();

  const activityQ = useQuery({
    queryKey: ['activity', params.slug],
    queryFn: () => fetchActivityBySlug(params.slug),
    enabled: !!params.slug,
  });
  const completions = useCatalogCompletions(profile?.id);

  const a = activityQ.data;
  const completion = a ? completions.data?.get(a.id) : undefined;
  useEffect(() => {
    if (a?.medida) setCantidad(a.medida.def);
  }, [a?.id, a?.medida]);
  const camino = a?.camino_slug ? (caminosQ.data ?? []).find((c) => c.slug === a.camino_slug) : undefined;
  const locked = a ? !meetsRank(profile?.totalXp ?? 0, a.min_rank_slug) : false;

  function invalidate() {
    // Completing from the catalogue moves the same numbers as the daily set.
    invalidateScores(qc);
  }

  async function doComplete() {
    if (!a || busy) return;
    setBusy(true);
    try {
      const result = await completeActivity(a.id, null, null, a.medida ? cantidad : null);
      celebrateCompletion(result);
      invalidate();
    } catch (e) {
      toast.error('Ups', e instanceof Error ? e.message : 'No se pudo completar');
    } finally {
      setBusy(false);
    }
  }

  async function ocultar(motivo: 'no_aplica' | 'no_me_gusta') {
    if (!a || ocultando) return;
    setOcultando(true);
    const r = await ocultarAccion(a.id, motivo, motivo === 'no_aplica' ? (a.requiere ?? [])[0] ?? null : null);
    setOcultando(false);
    if (!r.ok) {
      toast.error('No se pudo', r.error);
      return;
    }
    toast.success('Listo', 'No te la vamos a ofrecer. Lo podés deshacer en Ajustes.');
    qc.invalidateQueries({ queryKey: ['sugeridas'] });
    router.back();
  }

  if (activityQ.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!a) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <Pip size={64} mood="neutral" />
        <p className="text-muted-foreground">No encontramos esa acción.</p>
        <Button variant="secondary" asChild>
          <Link href="/acciones">{tc('back')}</Link>
        </Button>
      </div>
    );
  }

  const domain = getDomain(a.domain_slug);
  const isDone = completion?.status === 'honor' || completion?.status === 'verified';

  return (
    <div className="space-y-5 pb-4">
      <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-small text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> {tc('back')}
      </button>

      {/* Header */}
      <div
        className="flex flex-col items-center rounded-card border border-border p-6 text-center shadow-soft"
        style={{ background: `linear-gradient(160deg, ${domain?.color}22, transparent)` }}
      >
        <DomainIcon domain={a.domain_slug} size={72} />
        {domain && (
          <span className="eyebrow mt-3" style={{ color: domain.color }}>
            {domain.name_es}
          </span>
        )}
        <h1 className="mt-1 text-balance font-display text-h1 font-bold leading-tight">{a.title_es}</h1>
        <div className="mt-2.5 flex flex-wrap items-center justify-center gap-1.5">
          {minutosTexto(a.minutos) && (
            <Pill size="sm">
              <Clock className="h-3 w-3" aria-hidden /> {minutosTexto(a.minutos)}
            </Pill>
          )}
          {formatoTexto(a.formato) && <Pill size="sm">{formatoTexto(a.formato)}</Pill>}
          <Pill size="sm">{EFFORT_ES[a.effort]}</Pill>
          <Pill size="sm">Impacto {IMPACT_ES[a.impact]}</Pill>
          {a.ahorra && (
            <Pill size="sm" className="border-brote-green/40 text-brote-green">
              <PiggyBank className="h-3 w-3" aria-hidden /> Te ahorra plata
            </Pill>
          )}
          {profile?.accountType === 'kid' && a.con_adulto && (
            <Pill size="sm">
              <Users className="h-3 w-3" aria-hidden /> Con un adulto
            </Pill>
          )}
        </div>
        {(estacionesTexto(a.estaciones) || requiereTexto(a.requiere)) && (
          <p className="mt-2 text-caption text-muted-foreground">
            {[estacionesTexto(a.estaciones), requiereTexto(a.requiere)].filter(Boolean).join(' · ')}
          </p>
        )}
        <span className="mt-3 font-display text-display-l font-extrabold text-brote-sun tnum">
          +{formatPoints(a.base_points)}
        </span>
      </div>

      {/* Description */}
      <Card className="p-4">
        <p className="text-body leading-relaxed">
          {activityDescription(a.title_es, a.impact as Impact, a.description_es)}
        </p>
        {a.fuente && a.fuente_url && (
          <a
            href={a.fuente_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-caption text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            Fuente: {a.fuente} <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
        )}
      </Card>

      {/* El camino del que es parte: dónde está y qué sigue. */}
      {camino && (
        <Card className="p-4">
          <p className="eyebrow flex items-center gap-1.5 text-primary">
            <Compass className="h-3.5 w-3.5" aria-hidden />
            Paso {a.camino_paso} de {camino.pasos.length} · {camino.titulo_es}
          </p>
          <div className="mt-2 flex gap-1" aria-hidden>
            {camino.pasos.map((p) => (
              <span key={p.id} className={p.hecho ? 'h-1.5 flex-1 rounded-pill bg-primary' : 'h-1.5 flex-1 rounded-pill bg-border'} />
            ))}
          </div>
          {(() => {
            const sig = camino.pasos.find((p) => !p.hecho && p.slug !== a.slug);
            return sig ? (
              <Link href={`/acciones/${sig.slug}`} className="mt-2.5 inline-flex items-center gap-1 text-small font-semibold text-primary">
                Después: {sig.title_es} →
              </Link>
            ) : (
              <p className="mt-2.5 text-small text-muted-foreground">Es el último paso que te falta: al hacerlo, terminás el camino.</p>
            );
          })()}
        </Card>
      )}

      {/* Instructions */}
      <section>
        <span className="eyebrow mb-1 block text-muted-foreground">Cómo se hace</span>
        <h2 className="mb-3 font-display text-h3 font-bold">{t('instructions')}</h2>
        {/* Numbered steps get a connecting rule, so a multi-step action reads
            as a sequence instead of a bulleted list. */}
        <ol className="space-y-0">
          {activityInstructions(a.verification, a.instructions_es).map((step, i, arr) => (
            <li key={i} className="relative flex gap-3 pb-4 last:pb-0">
              {i < arr.length - 1 && (
                <span className="absolute left-3 top-7 h-[calc(100%-1.75rem)] w-px bg-border" aria-hidden />
              )}
              <span className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-small font-bold text-primary tnum">
                {i + 1}
              </span>
              <span className="text-body leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* Add to routine (F14.5) — offered ONLY for the curated subset that is
          genuinely worth repeating daily, matching the server-side guard in
          add_habit(). Showing it on every action would invite a refusal. */}
      {a.routine_eligible && (
        <Card className="flex items-center gap-3 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-primary/15 text-primary">
            <Repeat className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-small font-semibold">Sumalo a mi rutina</p>
            <p className="mt-0.5 text-small leading-relaxed text-muted-foreground">
              Lo vas a ver todos los días en tu inicio, con su propia racha.
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            loading={habitBusy}
            onClick={async () => {
              setHabitBusy(true);
              const res = await addHabit(a.id);
              setHabitBusy(false);
              if (res.ok) {
                toast.success('¡Sumado a tu rutina!', 'Lo vas a ver todos los días en tu inicio');
                qc.invalidateQueries({ queryKey: ['my-habits'] });
                qc.invalidateQueries({ queryKey: ['routine-suggestions'] });
              } else toast.error('No se pudo', res.error);
            }}
          >
            Sumar
          </Button>
        </Card>
      )}

      {/* Impact */}
      {a.impact_equivalency_es && (
        <Card className="flex items-center gap-3 border-primary/20 bg-primary/5 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-primary/15 text-primary">
            <Globe2 className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="eyebrow text-primary">{t('impactEquivalency')}</p>
            <p className="mt-0.5 text-small leading-relaxed">{a.impact_equivalency_es}</p>
          </div>
        </Card>
      )}

      {a.medida && !isDone && !locked && (
        <CantidadSelector medida={a.medida} valor={cantidad} onChange={setCantidad} dominio={a.domain_slug} />
      )}

      {/* CTA */}
      <div className="sticky bottom-24 lg:bottom-4">
        {locked ? (
          <Button block variant="secondary" disabled>
            <Lock className="h-4 w-4" /> {t('lockedUntil', { rank: lockLabel(a.min_rank_slug) })}
          </Button>
        ) : isDone ? (
          <Button block variant="secondary" disabled>
            <Check className="h-4 w-4" /> {t('alreadyDone')}
          </Button>
        ) : (
          <Button block variant="primary" loading={busy} onClick={doComplete}>
            <Check className="h-4 w-4" /> {t('markDone')}
          </Button>
        )}
      </div>

      {/* "Dónde conseguirlo" (02 §6.1): DEBAJO de todo, nunca en el camino de
          completar, y nunca para una cuenta de chico. Si no hay al menos tres
          listados relevantes, la base devuelve nada y acá no se dibuja nada. */}
      {profile?.accountType !== 'kid' && <DondeConseguirlo slugAccion={a.slug} />}

      {/* Si no te sirve, decilo: no te la volvemos a ofrecer (se deshace en Ajustes). */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 pt-2 text-caption text-muted-foreground">
        <EyeOff className="h-3.5 w-3.5" aria-hidden />
        <button type="button" disabled={ocultando} onClick={() => ocultar('no_aplica')} className="underline underline-offset-2 hover:text-foreground">
          No aplica a mí
        </button>
        <button type="button" disabled={ocultando} onClick={() => ocultar('no_me_gusta')} className="underline underline-offset-2 hover:text-foreground">
          No me interesa
        </button>
      </div>
    </div>
  );
}
