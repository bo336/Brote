'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { BadgeCheck, Share2, Sparkles } from 'lucide-react';
import { PipAvatar } from '@/components/pip/PipAvatar';
import { CountUp } from '@/components/ui/count-up';
import { FollowButton } from '@/components/social/FollowButton';
import { ProfileMenu } from './ProfileMenu';
import { RANK_BY_SLUG, formatRank } from '@/lib/ranks';
import { toast } from '@/stores/toast';
import type { ProfileViewer, PublicProfileV2 } from '@/lib/api/perfil-publico';

/**
 * The profile header, shared by your own profile and everyone else's.
 *
 * Same shape both ways — only the actions differ — so there is one
 * implementation to keep correct instead of two that drift.
 *
 * Note what is NOT here: `neighborhood`. City is a fine public attribute of a
 * person; the barrio is not (08 §5). Projects show a location because that is
 * their purpose and the organiser chose to publish it.
 */
export function ProfileHeader({
  profile,
  viewer,
  onEdit,
}: {
  profile: PublicProfileV2;
  viewer: ProfileViewer;
  onEdit?: () => void;
}) {
  const t = useTranslations('perfilPublico');
  const rank = profile.rank_slug ? RANK_BY_SLUG[profile.rank_slug] : null;
  const tier = rank?.tier ?? 1;

  async function share() {
    const url = `${window.location.origin}/perfil/${profile.username}`;
    try {
      if (navigator.share) await navigator.share({ title: profile.display_name ?? 'Brote', url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success(t('linkCopied'));
      }
    } catch {
      /* dismissed */
    }
  }

  return (
    <header>
      {/* The one angular cut on this screen (§4): the brand band. */}
      <div className="leaf-clip -mx-4 h-24 bg-brand-gradient lg:mx-0 lg:rounded-card" />

      <div className="-mt-10 px-1">
        <PipAvatar
          pipStyle={profile.pip_style}
          avatarUrl={profile.avatar_url}
          name={profile.display_name}
          rankSlug={profile.rank_slug}
          size={88}
          ring
          aura={tier >= 8}
          animate
        />

        <div className="mt-2 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {profile.equipped_title && (
              <span className="eyebrow block text-primary">{profile.equipped_title}</span>
            )}
            <h1 className="flex items-center gap-1.5 font-display text-h1 font-bold leading-tight">
              <span className="truncate">{profile.display_name ?? profile.username}</span>
              {profile.is_verified && (
                <BadgeCheck className="h-4 w-4 shrink-0 text-primary" aria-label={t('verified')} />
              )}
            </h1>
            <p className="mt-0.5 truncate text-small text-muted-foreground">
              @{profile.username}
              {rank ? ` · ${formatRank(rank.name_es, profile.division ?? 1)}` : ''}
              {profile.city ? ` · ${profile.city}` : ''}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {viewer.is_me ? (
              onEdit && (
                <button
                  onClick={onEdit}
                  className="press rounded-pill border border-border bg-surface-2 px-3.5 py-1.5 text-small font-semibold transition-colors hover:border-primary/30"
                >
                  {t('edit')}
                </button>
              )
            ) : (
              <FollowButton
                targetId={profile.id}
                initialFollowing={viewer.is_following}
                initialRequested={viewer.requested ?? false}
              />
            )}
            <button
              onClick={share}
              aria-label={t('share')}
              className="press rounded-full border border-border p-2 text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
            >
              <Share2 className="h-4 w-4" />
            </button>
            {!viewer.is_me && <ProfileMenu profile={profile} />}
          </div>
        </div>

        {profile.bio && <p className="mt-2 whitespace-pre-wrap text-small leading-relaxed">{profile.bio}</p>}

        {/* Counts. Real numbers, tabular, and they link where they should. */}
        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-small">
          {typeof profile.current_streak === 'number' && (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <span className="font-semibold text-brote-sun tnum">
                <CountUp value={profile.current_streak} />
              </span>
              {t('streakDays')}
            </span>
          )}
          <Link
            href={`/perfil/${profile.username}/seguidores`}
            className="group text-muted-foreground transition-colors hover:text-foreground"
          >
            <span className="font-semibold text-foreground tnum">
              <CountUp value={profile.followers_count} />
            </span>{' '}
            <span className="link-underline">{t('followers')}</span>
          </Link>
          <Link
            href={`/perfil/${profile.username}/siguiendo`}
            className="group text-muted-foreground transition-colors hover:text-foreground"
          >
            <span className="font-semibold text-foreground tnum">
              <CountUp value={profile.following_count} />
            </span>{' '}
            <span className="link-underline">{t('following')}</span>
          </Link>
          {profile.plan === 'plus' && (
            <span className="inline-flex items-center gap-1 rounded-pill border border-brote-sun/40 bg-brote-sun/10 px-2 py-0.5 text-caption font-semibold text-brote-sun">
              <Sparkles className="h-3 w-3" /> Brote+
            </span>
          )}
        </div>

        {viewer.follows_me && !viewer.is_me && (
          <p className="eyebrow mt-1.5 text-muted-foreground">{t('followsYou')}</p>
        )}
      </div>
    </header>
  );
}
