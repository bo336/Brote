'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Lock, Check, Clock, GraduationCap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ProgressBar } from '@/components/ui/progress';
import { DomainIcon } from '@/components/icons/DomainIcon';
import { Reveal } from '@/components/ui/reveal';
import { fetchLearningPath } from '@/lib/api/aprender';
import { getDomain } from '@/lib/domains';
import { cn } from '@/lib/utils/cn';

/**
 * "Aprendé" (F15.17) — a short path of interactive lessons.
 *
 * Grouped by level rather than shown as one long list, because the point is
 * that it builds: a level opens once most of the previous one is passed, so
 * there is a sense of progression without ever hard-blocking someone.
 */
export default function AprenderPage() {
  const q = useQuery({ queryKey: ['learning-path'], queryFn: fetchLearningPath, staleTime: 60_000 });

  const lessons = q.data ?? [];
  const done = lessons.filter((l) => l.completed).length;
  const levels = [...new Set(lessons.map((l) => l.level))].sort((a, b) => a - b);

  return (
    <div className="space-y-5 pb-6">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Aprendé</p>
        <h1 className="mt-1 font-display text-display-l font-extrabold leading-tight">
          Entendé lo que estás haciendo
        </h1>
        <p className="mt-1.5 text-small text-muted-foreground">
          Lecciones cortas y concretas. Sin humo y sin fórmulas.
        </p>
      </header>

      {q.isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : lessons.length === 0 ? (
        <Card className="p-5 text-center">
          <p className="text-small text-muted-foreground">Todavía no hay lecciones disponibles para tu cuenta.</p>
        </Card>
      ) : (
        <>
          <Card className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-small font-semibold">
                <GraduationCap className="h-4 w-4 text-primary" /> Tu progreso
              </span>
              <span className="tnum text-small text-muted-foreground">
                {done} de {lessons.length}
              </span>
            </div>
            <ProgressBar value={(done / lessons.length) * 100} />
          </Card>

          {levels.map((level) => {
            const group = lessons.filter((l) => l.level === level);
            const locked = group.every((l) => !l.unlocked);
            return (
              <section key={level} className="space-y-2">
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-h3 font-bold">Nivel {level}</h2>
                  {locked && (
                    <span className="inline-flex items-center gap-1 rounded-pill border border-border bg-surface-2 px-2 py-0.5 text-caption text-muted-foreground">
                      <Lock className="h-3 w-3" /> Se abre al avanzar
                    </span>
                  )}
                </div>

                {group.map((l, i) => {
                  const dom = getDomain(l.domain_slug);
                  const body = (
                    <>
                      <span
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px]"
                        style={{ background: `${dom?.color ?? '#1FB57A'}1f` }}
                      >
                        <DomainIcon domain={l.domain_slug} size={26} variant="bare" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-display text-body font-bold">{l.title_es}</span>
                        <span className="block truncate text-caption text-muted-foreground">{l.summary_es}</span>
                        <span className="mt-1 flex items-center gap-2.5 text-caption text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {l.minutes} min
                          </span>
                          <span>{l.steps} pasos</span>
                          {!l.completed && <span className="font-semibold text-brote-sun">+{l.reward_points}</span>}
                        </span>
                      </span>
                      {l.completed ? (
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brote-green/15 text-brote-green">
                          <Check className="h-4 w-4" />
                        </span>
                      ) : !l.unlocked ? (
                        <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
                      ) : null}
                    </>
                  );

                  const cls = cn(
                    'flex items-center gap-3 rounded-card border border-border bg-surface p-3.5 transition-colors',
                    l.unlocked ? 'hover:border-primary/40' : 'opacity-60',
                  );

                  return (
                    <Reveal key={l.id} index={i}>
                      {l.unlocked ? (
                        <Link href={`/aprender/${l.slug}`} className={cls}>
                          {body}
                        </Link>
                      ) : (
                        <div className={cls} aria-disabled>
                          {body}
                        </div>
                      )}
                    </Reveal>
                  );
                })}
              </section>
            );
          })}
        </>
      )}
    </div>
  );
}
