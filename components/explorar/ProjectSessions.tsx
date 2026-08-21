'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarCheck, Plus, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { Input, Field } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchProjectSessions, completeProjectSession } from '@/lib/api/explorar';
import { invalidateScores } from '@/lib/refresh';
import { toast } from '@/stores/toast';
import { haptic } from '@/lib/utils/haptics';
import { cn } from '@/lib/utils/cn';

/**
 * Work sessions ("jornadas") for a project (F14.8).
 *
 * A neighbourhood cleanup is rarely one afternoon. The organiser closes a
 * session, everyone who turned out is credited, and it can be repeated for
 * each phase — instead of the project being a single one-shot completion.
 */
export function ProjectSessions({
  projectId,
  isOrganizer,
  participantCount,
  className,
}: {
  projectId: string;
  isOrganizer: boolean;
  participantCount: number;
  className?: string;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const q = useQuery({
    queryKey: ['project-sessions', projectId],
    queryFn: () => fetchProjectSessions(projectId),
  });
  const sessions = q.data ?? [];

  async function submit() {
    if (!title.trim() || busy) return;
    setBusy(true);
    const res = await completeProjectSession(projectId, title.trim(), notes.trim() || null);
    setBusy(false);
    if (res.ok) {
      haptic('success');
      toast.success('¡Jornada acreditada!', `+${res.points_each} pts para ${res.attendees} personas`);
      setTitle('');
      setNotes('');
      setOpen(false);
      qc.invalidateQueries({ queryKey: ['project-sessions', projectId] });
      invalidateScores(qc);
    } else {
      toast.error('No se pudo cerrar', res.error);
    }
  }

  return (
    <section className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <CalendarCheck className="h-4 w-4 text-primary" />
          <h2 className="font-display text-h3 font-bold">Jornadas</h2>
        </div>
        {isOrganizer && (
          <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Cerrar jornada
          </Button>
        )}
      </div>

      {q.isLoading ? (
        <Skeleton className="h-16 w-full" />
      ) : sessions.length === 0 ? (
        <Card className="p-3.5">
          <p className="text-small text-muted-foreground">
            {isOrganizer
              ? 'Cuando terminen un encuentro, cerralo acá y todas las personas que participaron reciben sus puntos. Podés hacerlo una vez por cada jornada.'
              : 'Todavía no hubo jornadas. Cuando se haga una, vas a recibir tus puntos automáticamente.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => (
            <Card key={s.id} className="flex items-start gap-3 p-3.5">
              <span
                className={cn(
                  'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                  s.i_was_there ? 'bg-brote-green/15 text-brote-green' : 'bg-surface-2 text-muted-foreground',
                )}
              >
                {s.i_was_there ? <Check className="h-4 w-4" /> : <CalendarCheck className="h-4 w-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-small font-semibold leading-tight">{s.title}</p>
                {s.notes && <p className="mt-0.5 text-caption text-muted-foreground">{s.notes}</p>}
                <p className="mt-1 text-caption text-muted-foreground">
                  {new Date(s.held_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })} ·{' '}
                  {s.attendees} {s.attendees === 1 ? 'persona' : 'personas'}
                  {s.i_was_there && <span className="text-brote-green"> · participaste</span>}
                </p>
              </div>
              <span className="shrink-0 text-small font-bold text-brote-sun tnum">+{s.points_each}</span>
            </Card>
          ))}
        </div>
      )}

      <Sheet open={open} onOpenChange={setOpen} title="Cerrar una jornada">
        <div className="space-y-3">
          <p className="text-small text-muted-foreground">
            Se van a acreditar los mismos puntos a las {participantCount}{' '}
            {participantCount === 1 ? 'persona anotada' : 'personas anotadas'} en el proyecto.
          </p>
          <Field label="¿Qué jornada fue?" htmlFor="jornada-titulo">
            <Input
              id="jornada-titulo"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Jornada 1 — sector norte"
              maxLength={80}
            />
          </Field>
          <Field label="Notas (opcional)" htmlFor="jornada-notas">
            <Input
              id="jornada-notas"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: juntamos 12 bolsas"
              maxLength={140}
            />
          </Field>
          <Button block variant="primary" onClick={submit} loading={busy} disabled={!title.trim()}>
            Acreditar puntos
          </Button>
        </div>
      </Sheet>
    </section>
  );
}
