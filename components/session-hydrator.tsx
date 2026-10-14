'use client';

import { useEffect } from 'react';
import { useSession } from '@/stores/session';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/stores/toast';
import { fetchUnreadCount } from '@/lib/api/notifications';
import { asegurarAvisos } from '@/lib/api/push';
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

  // Avisos: si ya hay permiso, que este dispositivo siga suscripto y a nombre
  // de esta cuenta (lib/api/push.ts). No pregunta nada.
  useEffect(() => {
    if (profile?.id) void asegurarAvisos();
  }, [profile?.id]);

  useEffect(() => {
    if (!profile?.id) return;
    let supabase: ReturnType<typeof createClient>;
    try {
      supabase = createClient();
    } catch {
      return; // never let a client-init issue crash the app shell
    }
    // Plan B: Realtime del plan gratis acepta 200 conexiones a la vez. Si el
    // canal no entra (o se cae), la campana se actualiza consultando cada
    // minuto mientras la pestaña está a la vista. Nada se rompe, sólo llega
    // un poco más tarde.
    const uid = profile.id;
    let sondeo: ReturnType<typeof setInterval> | null = null;
    const consultar = () => {
      if (document.visibilityState !== 'visible') return;
      fetchUnreadCount(uid)
        .then((n) => useSession.getState().setUnread(n))
        .catch(() => null);
    };
    const empezarSondeo = () => {
      if (sondeo) return;
      sondeo = setInterval(consultar, 60_000);
    };
    const channel = supabase
      .channel(`notif:${profile.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` },
        (payload) => {
          const row = payload.new as { title_es?: string; body_es?: string; business_id?: string | null };
          // Un aviso de empresa no toca la campana personal (02 §7): tiene la
          // suya en el espacio de negocio.
          if (row.business_id) return;
          useSession.getState().setUnread(useSession.getState().unreadNotifications + 1);
          if (row.title_es) toast.show({ variant: 'default', glyph: '🔔', title: row.title_es, description: row.body_es ?? undefined });
        },
      )
      .subscribe((estado) => {
        if (estado === 'CHANNEL_ERROR' || estado === 'TIMED_OUT' || estado === 'CLOSED') empezarSondeo();
        if (estado === 'SUBSCRIBED' && sondeo) {
          clearInterval(sondeo);
          sondeo = null;
        }
      });
    return () => {
      if (sondeo) clearInterval(sondeo);
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  return null;
}
