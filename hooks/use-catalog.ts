'use client';

import { useQuery } from '@tanstack/react-query';
import {
  fetchCatalog,
  fetchCatalogCompletions,
  fetchDomainPoints,
  type CompletionInfo,
} from '@/lib/api/catalog';

/** The full, age-appropriate action library. */
export function useCatalog(accountType: 'kid' | 'teen' | 'adult' = 'adult') {
  return useQuery({
    queryKey: ['catalog', accountType],
    queryFn: () => fetchCatalog(accountType),
    staleTime: 10 * 60_000,
  });
}

export function useCatalogCompletions(userId: string | undefined) {
  return useQuery({
    queryKey: ['catalog-completions', userId],
    queryFn: () => fetchCatalogCompletions(userId!),
    enabled: !!userId,
    staleTime: 60_000,
  });
}

export function useDomainPoints(userId: string | undefined) {
  return useQuery({
    queryKey: ['domain-points', userId],
    queryFn: () => fetchDomainPoints(userId!),
    enabled: !!userId,
    staleTime: 60_000,
  });
}

export type { CompletionInfo };
