'use client';

import Link from 'next/link';
import { BadgeCheck } from 'lucide-react';
import { PipAvatar } from '@/components/pip/PipAvatar';
import { FollowButton } from './FollowButton';
import { RANK_BY_SLUG } from '@/lib/ranks';
import type { SocialAccount } from '@/lib/api/social';

/** One person in a list: followers, following, search results, suggestions. */
export function AccountRow({ account, showBio = true }: { account: SocialAccount; showBio?: boolean }) {
  const rank = account.rank_slug ? RANK_BY_SLUG[account.rank_slug] : null;
  const href = account.username ? `/perfil/${account.username}` : undefined;

  return (
    <li className="flex items-start gap-3 py-3">
      <PipAvatar
        pipStyle={account.pip_style}
        avatarUrl={account.avatar_url}
        name={account.display_name}
        rankSlug={account.rank_slug}
        size={40}
        ring
        href={href}
      />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1 text-small font-semibold leading-tight">
          {href ? (
            <Link href={href} className="truncate transition-colors hover:text-primary">
              {account.display_name ?? account.username ?? 'Alguien'}
            </Link>
          ) : (
            <span className="truncate">{account.display_name ?? 'Alguien'}</span>
          )}
          {account.is_verified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-primary" />}
        </p>
        <p className="eyebrow truncate text-muted-foreground">
          {['@' + (account.username ?? ''), rank?.name_es, account.city].filter(Boolean).join(' · ')}
        </p>
        {showBio && account.bio && (
          <p className="mt-1 line-clamp-2 text-caption leading-relaxed text-muted-foreground">{account.bio}</p>
        )}
      </div>
      <FollowButton targetId={account.id} initialFollowing={account.is_following ?? false} size="sm" />
    </li>
  );
}
