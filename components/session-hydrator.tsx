'use client';

import { useEffect } from 'react';
import { useSession } from '@/stores/session';
import type { ProfileSummary } from '@/lib/types';

/**
 * Hydrates the client session store from server-provided profile data.
 * In step 2 the app shell fetches the profile (server component) and passes it
 * here. Until auth is wired, rendering with no `profile` leaves the store empty
 * and the UI shows neutral zero-state values.
 */
export function SessionHydrator({
  profile,
  unread = 0,
}: {
  profile?: ProfileSummary | null;
  unread?: number;
}) {
  const setProfile = useSession((s) => s.setProfile);
  const setUnread = useSession((s) => s.setUnread);

  useEffect(() => {
    if (profile) setProfile(profile);
    setUnread(unread);
  }, [profile, unread, setProfile, setUnread]);

  return null;
}
