'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * "N publicaciones nuevas".
 *
 * Counts inserts into `feed_posts` that arrive while you are reading, so the
 * timeline never rearranges itself under your thumb — the reader decides when
 * to jump. That is the whole point: a feed that reflows mid-scroll loses the
 * sentence you were on.
 *
 * Three things keep this cheap and honest:
 *
 *  · realtime enforces RLS, so a kid account is never counted a post it is not
 *    allowed to see, and neither is anyone else;
 *  · replies and your own posts do not count — your own post is already on
 *    screen, and a reply is not a new row of the river;
 *  · the subscription drops while the tab is hidden, so a forgotten tab in the
 *    background costs nothing.
 *
 * `enabled` is false for kids and while a topic filter is active: the payload
 * carries no `domain_tags` we can trust to filter on, and a count that
 * includes posts the filter would hide is a count that lies.
 */
export function useNewPosts({ enabled, myId }: { enabled: boolean; myId?: string | null }) {
  const [count, setCount] = useState(0);
  const myIdRef = useRef(myId);
  myIdRef.current = myId;

  useEffect(() => {
    if (!enabled) {
      setCount(0);
      return;
    }

    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    function subscribe() {
      if (channel) return;
      channel = supabase
        .channel('plaza-new-posts')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'feed_posts' },
          (payload) => {
            const row = payload.new as { kind?: string; author_id?: string | null; hidden?: boolean };
            if (row.kind === 'reply' || row.hidden) return;
            if (row.author_id && row.author_id === myIdRef.current) return;
            setCount((n) => n + 1);
          },
        )
        .subscribe();
    }

    function unsubscribe() {
      if (!channel) return;
      void supabase.removeChannel(channel);
      channel = null;
    }

    function onVisibility() {
      if (document.visibilityState === 'visible') subscribe();
      else unsubscribe();
    }

    onVisibility();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      unsubscribe();
    };
  }, [enabled]);

  return { count, reset: () => setCount(0) };
}
