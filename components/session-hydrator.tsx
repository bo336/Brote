'use client';

import { useEffect } from 'react';
import { useSession } from '@/stores/session';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/stores/toast';
import type { ProfileSummary } from '@/lib/types';

/**
 * Hydrates the client session store from server-provided profile data and
 * subscribes to Realtime notification inserts so the top-bar unread badge stays
 * live (BUILD_SPEC §8.10).
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

  useEffect(() => {
    if (!profile?.id) return;
    let supabase: ReturnType<typeof createClient>;
    try {
      supabase = createClient();
    } catch {
      return; // never let a client-init issue crash the app shell
    }
    const channel = supabase
      .channel(`notif:${profile.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` },
        (payload) => {
          const row = payload.new as { title_es?: string; body_es?: string };
          useSession.getState().setUnread(useSession.getState().unreadNotifications + 1);
          if (row.title_es) toast.show({ variant: 'default', glyph: '🔔', title: row.title_es, description: row.body_es ?? undefined });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  return null;
}
