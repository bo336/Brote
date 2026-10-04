'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Users, ThumbsUp, Lock, MapPin, Calendar, Check, MessageSquare, LogOut } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pill } from '@/components/ui/pill';
import { PipAvatar } from '@/components/pip/PipAvatar';
import { usePipStyles } from '@/hooks/use-pip-styles';
import { Skeleton } from '@/components/ui/skeleton';
import { SafeImage } from '@/components/ui/safe-image';
import { Pip } from '@/components/pip/Pip';
import { DomainIcon } from '@/components/icons/DomainIcon';
import { useSession } from '@/stores/session';
import { fetchProject, fetchProjectContact, fetchProjectParticipants, joinProject, leaveProject, upvoteProject } from '@/lib/api/plaza';
import { ProjectSessions } from '@/components/plaza/ProjectSessions';
import { getDomain } from '@/lib/domains';
import { meetsRank } from '@/lib/ranks';
import { lockLabel } from '@/lib/recommendations';
import { toast } from '@/stores/toast';
import { haptic } from '@/lib/utils/haptics';

const ProjectMap = dynamic(() => import('@/components/plaza/ProjectMap'), {
  ssr: false,
  loading: () => <Skeleton className="h-[200px] w-full" />,
});

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const t = useTranslations('proyectos');
  const tc = useTranslations('common');
  const qc = useQueryClient();
  const profile = useSession((s) => s.profile);
  const totalXp = profile?.totalXp ?? 0;

  const projectQ = useQuery({
    queryKey: ['project', params.id, profile?.id],
    queryFn: () => fetchProject(params.id, profile?.id),
    enabled: !!params.id,
  });
  const participantsQ = useQuery({
    queryKey: ['project-participants', params.id],
    queryFn: () => fetchProjectParticipants(params.id),
    enabled: !!params.id,
  });

  const pips = usePipStyles((participantsQ.data ?? []).map((u) => u.id));
  const p = projectQ.data;
  const locked = p ? !meetsRank(totalXp, p.min_rank_slug) : false;
  // A project is a meeting in person: a kid account cannot join one (0120).
  const esKid = profile?.accountType === 'kid';
  const contactQ = useQuery({
    queryKey: ['project-contact', params.id, p?.joined],
    queryFn: () => fetchProjectContact(params.id),
    enabled: !!p && (p.joined || p.creator_id === profile?.id) && !esKid,
  });

  const joinM = useMutation({
    mutationFn: () => joinProject(params.id),
    onSuccess: () => {
      haptic('success');
      toast.success(t('joined'));
      qc.invalidateQueries({ queryKey: ['project', params.id] });
      qc.invalidateQueries({ queryKey: ['project-participants', params.id] });
    },
    onError: (e) => toast.error('Ups', e instanceof Error ? e.message : ''),
  });

  const upvoteM = useMutation({
    mutationFn: () => upvoteProject(params.id),
    onSuccess: () => {
      haptic('light');
      qc.invalidateQueries({ queryKey: ['project', params.id] });
    },
  });

  if (projectQ.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }
  if (!p) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <Pip size={64} mood="neutral" />
        <p className="text-muted-foreground">No encontramos ese proyecto.</p>
        <Button variant="secondary" asChild>
          <Link href="/feed">{tc('back')}</Link>
        </Button>
      </div>
    );
  }

  const domain = getDomain(p.domain_slug ?? '');
  const date = p.event_date ? new Date(p.event_date) : null;

  return (
    <div className="space-y-5 pb-4">
      <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-small text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> {tc('back')}
      </button>

      <div
        className="relative h-40 overflow-hidden rounded-card"
        style={{ background: `linear-gradient(135deg, ${domain?.color ?? '#1FB57A'}, ${domain?.color ?? '#1FB57A'}99)` }}
      >
        <SafeImage
          src={p.image_url}
          className="h-full w-full object-cover"
          fallback={
            <div className="flex h-full items-center justify-center">
              <DomainIcon domain={p.domain_slug ?? 'comunidad'} size={64} variant="bare" className="text-white/90" />
            </div>
          }
        />
      </div>

      <div>
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          {domain && (
            <Pill color={domain.color} size="sm">
              {domain.name_es}
            </Pill>
          )}
          <Pill size="sm" className="capitalize">
            {p.type}
          </Pill>
          {p.reward_points > 0 && <Pill size="sm" className="text-brote-sun">+{p.reward_points} pts</Pill>}
        </div>
        <h1 className="font-display text-h1 font-bold">{p.title}</h1>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-small text-muted-foreground">
          {p.neighborhood && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4" /> {p.location_text ?? p.neighborhood}
            </span>
          )}
          {date && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-4 w-4" /> {date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          )}
        </div>
      </div>

      {p.description && <p className="text-body">{p.description}</p>}

      {p.lat != null && p.lng != null && <ProjectMap lat={p.lat} lng={p.lng} height={200} />}

      {/* Participants */}
      <section>
        <div className="mb-2 flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <span className="font-semibold">
            {t('participants', { count: p.participant_count })}
            {p.max_participants ? ` / ${p.max_participants}` : ''}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {(participantsQ.data ?? []).map((u) => (
            <PipAvatar key={u.id} pipStyle={pips.data?.[u.id]?.pip_style ?? null} avatarUrl={u.avatar_url} name={u.display_name ?? u.username} rankSlug={u.rank_slug} size={36} ring href={u.username ? `/perfil/${u.username}` : undefined} />
          ))}
          {(participantsQ.data ?? []).length === 0 && (
            <p className="text-small text-muted-foreground">Sé la primera persona en sumarte.</p>
          )}
        </div>
      </section>

      {/* Actions */}
      <div className="sticky bottom-24 flex gap-2 lg:bottom-4">
        <Button
          variant={p.upvoted ? 'primary' : 'secondary'}
          size="lg"
          onClick={() => upvoteM.mutate()}
          loading={upvoteM.isPending}
          className="shrink-0"
          aria-label="Votar"
        >
          <ThumbsUp className="h-5 w-5" /> {p.upvotes}
        </Button>
        {esKid ? (
          <p className="flex-1 rounded-card border border-border bg-surface-2 px-3.5 py-2.5 text-caption leading-relaxed text-muted-foreground">
            Los proyectos son encuentros en persona: con una cuenta de chico no te podés sumar. Puede hacerlo una persona
            adulta de tu familia.
          </p>
        ) : locked ? (
          <Button block variant="secondary" size="lg" disabled>
            <Lock className="h-4 w-4" /> {t('createGated', { rank: lockLabel(p.min_rank_slug) })}
          </Button>
        ) : p.joined && p.creator_id === profile?.id ? (
          // Organisers can't leave their own project (enforced server-side too).
          <Button block variant="secondary" size="lg" disabled>
            <Check className="h-4 w-4" /> {t('joined')}
          </Button>
        ) : p.joined ? (
          // Already in: offer the way out instead of a join that does nothing.
          <Button
            block
            variant="secondary"
            size="lg"
            onClick={async () => {
              if (!confirm('¿Salir de este proyecto?')) return;
              const res = await leaveProject(p.id);
              if (res.ok) {
                toast.success('Saliste del proyecto');
                qc.invalidateQueries({ queryKey: ['project', p.id] });
                qc.invalidateQueries({ queryKey: ['projects'] });
              } else {
                toast.error('No se pudo salir', res.error);
              }
            }}
          >
            <LogOut className="h-4 w-4" /> Salir del proyecto
          </Button>
        ) : (
          <Button block variant="primary" size="lg" onClick={() => joinM.mutate()} loading={joinM.isPending}>
            {t('joinProject')}
          </Button>
        )}
      </div>

      {/* How to reach the organiser — a project nobody can coordinate with
          never actually happens (F14.8). */}
      {/* The contact reaches only people who joined (0120): an open phone
          number on a public page is how strangers get it. */}
      {contactQ.data ? (
        <Card className="mt-3 flex items-center gap-3 p-3.5">
          <MessageSquare className="h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="text-caption text-muted-foreground">
              Coordinación{contactQ.data.contact_kind ? ` · ${contactQ.data.contact_kind}` : ''}
            </p>
            <p className="truncate text-small font-medium">{contactQ.data.contact_info}</p>
          </div>
        </Card>
      ) : (
        !esKid &&
        !p.joined && (
          <p className="mt-3 flex items-center gap-2 text-caption text-muted-foreground">
            <MessageSquare className="h-3.5 w-3.5 shrink-0" />
            Cuando te sumes vas a ver cómo coordinar con quien lo organiza.
          </p>
        )
      )}

      {/* Repeatable work sessions, each crediting everyone who turned out. */}
      <ProjectSessions
        projectId={p.id}
        isOrganizer={p.creator_id === profile?.id}
        participantCount={p.participant_count}
        className="mt-5"
      />

    </div>
  );
}
