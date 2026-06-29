'use client';

import { createBrowserClient } from '@supabase/ssr';

/**
 * Browser Supabase client (BUILD_SPEC §16). Uses the public anon key — safe to
 * expose. All privileged logic lives in RLS-protected RPCs + Edge Functions.
 * Query results are cast to the precise row types in `lib/supabase/rows.ts`.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
