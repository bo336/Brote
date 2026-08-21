'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Users, ThumbsUp, Lock, MapPin, Calendar, LogOut } from 'lucide-react';
import { Pill } from '@/components/ui/pill';
import { DomainIcon } from '@/components/icons/DomainIcon';
import { getDomain } from '@/lib/domains';
import { meetsRank } from '@/lib/ranks';
import { lockLabel } from '@/lib/recommendations';
import { cn } from '@/lib/utils/cn';
import { leaveProject, type ProjectWithMeta } from '@/lib/api/explorar';
import { useSession } from '@/stores/session';
import { toast } from '@/stores/toast';

export function ProjectCard({ project, totalXp }: { project: ProjectWithMeta; totalXp: number }) {
  const qc = useQueryClient();
  const userId = useSession((s) => s.profile?.id);
  const [leaving, setLeaving] = useState(false);
  const domain = getDomain(project.domain_slug ?? '');
  const locked = !meetsRank(totalXp, project.min_rank_slug);
  const date = project.event_date ? new Date(project.event_date) : null;
  // Organisers can't leave their own project (enforced server-side too), so
  // the button is only worth showing to someone who actually joined as a guest.
  const canLeave = project.joined && project.creator_id !== userId;

  async function leave(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (leaving || !confirm('¿Salir de este proyecto?')) return;
    setLeaving(true);
    const res = await leaveProject(project.id);
    setLeaving(false);
    if (res.ok) {
      toast.success('Saliste del proyecto');
      qc.invalidateQueries({ queryKey: ['projects'] });
    } else {
      toast.error('No se pudo salir', res.error);
    }
  }

  return (
    <Link
      href={`/explorar/proyectos/${project.id}`}
      className="block overflow-hidden rounded-card border border-border bg-surface shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-soft-lg"
    >
      <div className="relative h-28 w-full" style={{ background: `linear-gradient(135deg, ${domain?.color ?? '#1FB57A'}, ${domain?.color ?? '#1FB57A'}99)` }}>
        {project.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={project.image_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <DomainIcon domain={project.domain_slug ?? 'comunidad'} size={48} variant="bare" className="text-white/90" />
          </div>
        )}
        {locked && (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-pill bg-brote-ink/70 px-2 py-0.5 text-caption font-semibold text-white">
            <Lock className="h-3 w-3" /> {lockLabel(project.min_rank_slug)}
          </span>
        )}
        {canLeave && (
          <button
            type="button"
            onClick={leave}
            disabled={leaving}
            aria-label="Salir del proyecto"
            className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-pill bg-brote-ink/70 px-2 py-0.5 text-caption font-semibold text-white transition-colors hover:bg-brote-ink/90 disabled:opacity-60"
          >
            <LogOut className="h-3 w-3" /> Salir
          </button>
        )}
      </div>
      <div className="p-3.5">
        <div className="mb-1.5 flex items-center gap-1.5">
          {domain && (
            <Pill color={domain.color} size="sm">
              {domain.name_es}
            </Pill>
          )}
          <Pill size="sm" className="capitalize">
            {project.type}
          </Pill>
        </div>
        <p className="font-display text-h3 font-bold leading-tight">{project.title}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-muted-foreground">
          {project.neighborhood && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {project.neighborhood}
            </span>
          )}
          {date && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" /> {date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
            </span>
          )}
          <span className="inline-flex items-center gap-1 tnum">
            <Users className="h-3 w-3" /> {project.participant_count}
            {project.max_participants ? `/${project.max_participants}` : ''}
          </span>
          <span className={cn('inline-flex items-center gap-1 tnum', project.upvoted && 'text-primary')}>
            <ThumbsUp className="h-3 w-3" /> {project.upvotes}
          </span>
        </div>
      </div>
    </Link>
  );
}
