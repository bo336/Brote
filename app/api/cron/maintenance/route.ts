import { NextResponse, type NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Vercel Cron fallback for daily maintenance (BUILD_SPEC §13). Prefer Supabase
 * pg_cron (already scheduled); this runs the same SQL when pg_cron isn't used.
 * Protected by CRON_SECRET (Vercel injects it as a Bearer token).
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ ok: true, skipped: 'no_service_key' });
  }
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc('daily_maintenance');
    if (error) throw error;
    return NextResponse.json({ ok: true, result: data });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'failed' }, { status: 500 });
  }
}
