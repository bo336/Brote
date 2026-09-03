'use client';

import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Pip } from '@/components/pip/Pip';
import { SectionHeader } from '@/components/ui/section';
import { ProfileHeader } from '@/components/perfil/ProfileHeader';
import { ProfileStats } from '@/components/perfil/ProfileStats';
import { ProfileTabs } from '@/components/perfil/ProfileTabs';
import { fetchPublicProfileV2 } from '@/lib/api/perfil-publico';
import type { MundoState } from '@/lib/mundo';

// The world is the reward, not the reputation, so it still comes last on the
// page — but it is now one <img>, not a WebGL context (07-RENDER §1).
const MundoPoster = dynamic(
  () => import('@/components/mundo3d/poster/MundoPoster').then((m) => m.MundoPoster),
  { ssr: false, loading: () => <Skeleton className="h-[280px] w-full rounded-card" /> },
);

/**
 * Someone else's profile.
 *
 * The numbers come first and the world comes last, deliberately: the impact
 * figures are what make an account worth following, the world is the prize.
 * Visiting someone's world is read-only — that bug was fixed once already and
 * `interactive` is what keeps it fixed.
 */
export default function PublicProfilePage() {
  const { username } = useParams<{ username: string }>();
  const router = useRouter();
  const t = useTranslations('perfilPublico');
  const tc = useTranslations('common');

  const q = useQuery({
    queryKey: ['public-profile', username],
    queryFn: () => fetchPublicProfileV2(username),
    enabled: !!username,
  });

  if (q.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const res = q.data;
  if (!res?.ok || !res.profile || !res.viewer) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <Pip size={64} mood="neutral" />
        <p className="text-muted-foreground">{res?.error ?? t('notFound')}</p>
        <Button variant="secondary" onClick={() => router.push('/feed')}>
          {tc('back')}
        </Button>
      </div>
    );
  }

  const { profile, viewer, stats, recent } = res;

  return (
    <div className="space-y-5 pb-6">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-small text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> {tc('back')}
      </button>

      <ProfileHeader profile={profile} viewer={viewer} />

      {/* A private or followers-only account still gets a header — that is what
          lets you decide to follow — but nothing behind it. */}
      {!viewer.can_see ? (
        <Card className="flex flex-col items-center gap-2 p-8 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-muted-foreground">
            <Lock className="h-5 w-5" />
          </span>
          <p className="font-display text-h3 font-bold">{t('privateTitle')}</p>
          <p className="max-w-xs text-balance text-small leading-relaxed text-muted-foreground">
            {t('privateBody')}
          </p>
        </Card>
      ) : (
        <>
          {stats && <ProfileStats profile={profile} stats={stats} />}

          <ProfileTabs userId={profile.id} isMe={viewer.is_me} displayName={profile.display_name} />

          {profile.mundo_state ? (
            <section>
              <SectionHeader eyebrow={t('theReward')} title={t('theirWorld')} />
              {/* interactive={false}: their island is shown, but it is not a
                  door — only your own poster leads into /mundo. */}
              <MundoPoster
                mundo={profile.mundo_state as MundoState}
                height={280}
                interactive={false}
                className="shadow-soft-lg"
              />
            </section>
          ) : null}
        </>
      )}

      {/* `recent` is already in the payload; the tabs re-fetch page 1 so the
          list stays consistent as you switch. Kept here only as a hint that a
          brand-new account is not broken, just empty. */}
      {viewer.can_see && (recent?.posts.length ?? 0) === 0 && profile.posts_count === 0 && null}
    </div>
  );
}
