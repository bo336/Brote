'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { PipStyle } from '@/components/pip/Pip';

export interface PipIdentity {
  pip_style: PipStyle | null;
  rank_slug: string | null;
  is_verified: boolean;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  is_following: boolean;
}

/**
 * Pip identities for a list of user ids.
 *
 * The feed carries `pip_style` inside its own payload — that is the surface
 * where an extra round trip would matter. Rankings, competition members and
 * friend requests each come from their own RPC with its own return shape, and
 * rewriting all thirteen of them to add one column meant dropping and
 * recreating the functions the leaderboards depend on. One batched lookup per
 * list is the cheaper trade.
 */
export function usePipStyles(ids: (string | null | undefined)[]) {
  const clean = Array.from(new Set(ids.filter((x): x is string => !!x))).sort();
  return useQuery({
    queryKey: ['pip-styles', clean.join(',')],
    enabled: clean.length > 0,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<Record<string, PipIdentity>> => {
      const { data, error } = await createClient().rpc('pip_styles_for', { p_ids: clean });
      if (error) return {};
      return (data ?? {}) as Record<string, PipIdentity>;
    },
  });
}
