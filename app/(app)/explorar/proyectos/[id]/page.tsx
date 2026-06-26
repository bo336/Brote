'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Users, ThumbsUp, Lock, MapPin, Calendar, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pill } from '@/components/ui/pill';
import { Avatar } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Pip } from '@/components/pip/Pip';
import { DomainIcon } from '@/components/icons/DomainIcon';
import { useSession } from '@/stores/session';
import { fetchProject, fetchProjectParticipants, joinProject, upvoteProject } from '@/lib/api/explorar';
import { getDomain } from '@/lib/domains';
import { meetsRank } from '@/lib/ranks';
import { lockLabel } from '@/lib/recommendations';
import { toast } from '@/stores/toast';
import { haptic } from '@/lib/utils/haptics';

const ProjectMap = dynamic(() => import('@/components/explorar/ProjectMap'), {
  ssr: false,
  loading: () => <Skeleton className="h-[200px] w-full" />,
});

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const t = useTranslations('explorar');
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

  const p = projectQ.data;
  const locked = p ? !meetsRank(totalXp, p.min_rank_slug) : false;

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
          <Link href="/explorar">{tc('back')}</Link>
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
        {p.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.image_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <DomainIcon domain={p.domain_slug ?? 'comunidad'} size={64} variant="bare" className="text-white/90" />
          </div>
        )}
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
            <Avatar key={u.id} name={u.display_name ?? u.username} src={u.avatar_url} size={36} />
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
        {locked ? (
          <Button block variant="secondary" size="lg" disabled>
            <Lock className="h-4 w-4" /> {t('createGated', { rank: lockLabel(p.min_rank_slug) })}
          </Button>
        ) : p.joined ? (
          <Button block variant="secondary" size="lg" disabled>
            <Check className="h-4 w-4" /> {t('joined')}
          </Button>
        ) : (
          <Button block variant="primary" size="lg" onClick={() => joinM.mutate()} loading={joinM.isPending}>
            {t('joinProject')}
          </Button>
        )}
      </div>
    </div>
  );
}
