'use client';

import type { QueryClient } from '@tanstack/react-query';

/**
 * Refresh everything that displays a score, after anything that awards points
 * (F14.7).
 *
 * Before this, completing an action only invalidated the day's completion set,
 * so leaderboards, positions, impact totals, domain points and competition
 * standings all kept showing stale numbers until the page was reloaded — which
 * made the whole app feel broken.
 *
 * The list is a deny-list rather than an allow-list on purpose: a new screen
 * that shows points is far more likely to be forgotten here than a content
 * query is to be wrongly refetched. Content that cannot change as a result of
 * scoring is excluded so a completion never triggers a heavy news refetch.
 */
const NOT_SCORE_RELATED = ['news', 'news-item', 'projects', 'project', 'monetization', 'feed', 'feed-thread'];

export function invalidateScores(qc: QueryClient): void {
  qc.invalidateQueries({
    predicate: (query) => {
      const root = query.queryKey[0];
      if (typeof root !== 'string') return true;
      return !NOT_SCORE_RELATED.includes(root);
    },
  });
}
