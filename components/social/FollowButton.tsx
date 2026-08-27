'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { UserPlus, Check } from 'lucide-react';
import { followUser, unfollowUser } from '@/lib/api/social';
import { useSession } from '@/stores/session';
import { toast } from '@/stores/toast';
import { haptic } from '@/lib/utils/haptics';
import { cn } from '@/lib/utils/cn';

/**
 * Seguir / Siguiendo / Dejar de seguir.
 *
 * Three labels, two states: hovering while already following swaps to the
 * "unfollow" wording in coral, so the destructive read is obvious before the
 * tap rather than after it.
 *
 * Optimistic, because a follow that waits for a round trip feels broken — but
 * it rolls back on failure, since the server is the only thing that knows
 * about blocks and age rules.
 */
export function FollowButton({
  targetId,
  initialFollowing,
  size = 'md',
  className,
  label: notFollowingLabel,
  onChange,
}: {
  targetId: string;
  initialFollowing: boolean;
  size?: 'sm' | 'md';
  className?: string;
  /** Overrides the "Seguir" wording — e.g. "Seguir de vuelta". */
  label?: string;
  onChange?: (following: boolean) => void;
}) {
  const t = useTranslations('feed');
  const qc = useQueryClient();
  const me = useSession((s) => s.profile);
  const [following, setFollowing] = useState(initialFollowing);
  const [hovering, setHovering] = useState(false);
  const [busy, setBusy] = useState(false);

  // Kids have no social surface at all, and nobody follows themselves.
  if (!me || me.id === targetId || me.accountType === 'kid') return null;

  async function toggle() {
    if (busy) return;
    setBusy(true);
    haptic('light');

    const next = !following;
    setFollowing(next);
    onChange?.(next);

    const res = next ? await followUser(targetId) : await unfollowUser(targetId);
    setBusy(false);

    if (!res.ok) {
      setFollowing(!next); // roll back
      onChange?.(!next);
      toast.error(t('followFailed'), res.error);
      return;
    }
    // The Siguiendo tab and any follower counter are now stale.
    qc.invalidateQueries({ queryKey: ['feed'] });
    qc.invalidateQueries({ queryKey: ['my-following'] });
    qc.invalidateQueries({ queryKey: ['suggested-accounts'] });
  }

  const label = following
    ? hovering
      ? t('unfollow')
      : t('following')
    : (notFollowingLabel ?? t('follow'));

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={following}
      aria-label={label}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      className={cn(
        'press inline-flex items-center justify-center gap-1.5 rounded-pill font-semibold transition-colors duration-150',
        size === 'sm' ? 'h-8 px-3 text-caption' : 'h-9 px-4 text-small',
        following
          ? hovering
            ? 'border border-brote-coral/50 bg-brote-coral/10 text-brote-coral'
            : 'border border-border bg-surface-2 text-muted-foreground'
          : 'bg-primary text-primary-foreground shadow-crisp hover:bg-brote-green-deep',
        busy && 'opacity-60',
        className,
      )}
    >
      {following ? <Check className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
      {label}
    </button>
  );
}
