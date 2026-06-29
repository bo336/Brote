-- ════════════════════════════════════════════════════════════════════════════
-- Brote — 0014 — Scheduled jobs via pg_cron + pg_net (BUILD_SPEC §13).
-- Idempotent: cron.schedule upserts by job name. A Vercel Cron fallback lives
-- in vercel.json + app/api/cron/* for environments without pg_cron.
-- ════════════════════════════════════════════════════════════════════════════
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Daily maintenance at 00:05 America/Argentina/Buenos_Aires (03:05 UTC).
-- Pure in-DB SQL — no external key required (§13.1-13.6).
select cron.schedule('brote-daily-maintenance', '5 3 * * *', $$select daily_maintenance();$$);

-- News refresh every 8h via the edge function (§13.7). Requires the service_role
-- key in Vault (OWNER ACTION): create a secret named `service_role_key`. Until
-- set, the call is unauthorized and news isn't refreshed — harmless. Scheduling
-- itself never fails on a missing secret.
select cron.schedule('brote-refresh-news', '0 */8 * * *', $$
  select net.http_post(
    url := 'https://abnnjszxlwovpnazmbnu.supabase.co/functions/v1/refresh-news',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || coalesce((select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key'), '')
    ),
    body := '{}'::jsonb
  );
$$);

-- To remove:  select cron.unschedule('brote-daily-maintenance');
--             select cron.unschedule('brote-refresh-news');
