'use client';

import { createClient } from '@/lib/supabase/client';
import type { NotificationRow } from '@/lib/supabase/rows';

export async function fetchNotifications(userId: string): Promise<NotificationRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(60);
  if (error) throw error;
  return (data ?? []) as NotificationRow[];
}

export async function markAllRead(userId: string): Promise<void> {
  const supabase = createClient();
  await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false);
}

export async function fetchUnreadCount(userId: string): Promise<number> {
  const supabase = createClient();
  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false);
  return count ?? 0;
}
