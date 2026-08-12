-- ════════════════════════════════════════════════════════════════════════════
-- Brote — 0026 — Brote+ plans and MercadoPago subscriptions (PLAN F13.1).
-- Mirrors live migration 0021_plans_subscriptions.
-- ════════════════════════════════════════════════════════════════════════════
do $$ begin create type plan_tier as enum ('free', 'plus');
exception when duplicate_object then null; end $$;
do $$ begin create type sub_status as enum ('pending','authorized','paused','cancelled','expired');
exception when duplicate_object then null; end $$;

alter table profiles add column if not exists plan plan_tier not null default 'free';
alter table profiles add column if not exists plan_expires_at timestamptz;
alter table profiles add column if not exists ads_consent boolean;
create index if not exists idx_profiles_plan on profiles (plan);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  provider text not null default 'mercadopago',
  external_id text unique,
  status sub_status not null default 'pending',
  amount numeric, currency text default 'ARS',
  current_period_end timestamptz,
  raw jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_subs_user on subscriptions (user_id, status);
alter table subscriptions enable row level security;
drop policy if exists "subs owner read" on subscriptions;
create policy "subs owner read" on subscriptions for select using ((select auth.uid()) = user_id);

create or replace function brote_is_pro(p_uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select p.plan = 'plus' and (p.plan_expires_at is null or p.plan_expires_at > now())
                   from profiles p where p.id = p_uid), false);
$$;
revoke execute on function brote_is_pro(uuid) from public, anon;
grant execute on function brote_is_pro(uuid) to authenticated;

-- my_monetization(), set_ads_consent(), apply_subscription_event() and
-- brote_expire_plans() are applied live in migration 0021; see that migration
-- (and PUBLICIDAD.html) for their bodies and the nightly cron.
