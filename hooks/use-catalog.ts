'use client';

import { useQuery } from '@tanstack/react-query';
import {
  fetchCatalog,
  fetchCatalogCompletions,
  fetchDomainPoints,
  type CompletionInfo,
} from '@/lib/api/catalog';

export function useCatalog() {
  return useQuery({ queryKey: ['catalog'], queryFn: fetchCatalog, staleTime: 10 * 60_000 });
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
