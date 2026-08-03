-- ════════════════════════════════════════════════════════════════════════════
-- Brote — 0025 — PLATAFORMA v2 (PLAN F12). Mirrors live migrations
-- 0017_account_types_orgs, 0018_real_impact_metrics,
-- 0019_competitions_habits_groups and 0020_complete_activity_v4_habits_impact.
--
-- NOTE: complete_activity v4 (age gate + habit touch + impact payload), the
-- age tagging of the 168 activities and the per-activity impact seed are large
-- and are applied live (authoritative). This file carries every NEW schema
-- object + helper so a fresh project can be rebuilt.
-- ════════════════════════════════════════════════════════════════════════════

-- ── F12.1 Account types + organizations ─────────────────────────────────────
do $$ begin create type account_type as enum ('kid','teen','adult');
exception when duplicate_object then null; end $$;
do $$ begin create type org_type as enum ('escuela','club','empresa','barrio','familia');
exception when duplicate_object then null; end $$;

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null, type org_type not null default 'escuela',
  code text unique not null, city text,
  created_by uuid references profiles(id) on delete set null,
  member_count int not null default 0, created_at timestamptz not null default now()
);
alter table organizations enable row level security;
drop policy if exists "orgs read" on organizations;
create policy "orgs read" on organizations for select using (true);

alter table profiles   add column if not exists account_type account_type not null default 'adult';
alter table profiles   add column if not exists birth_year int;
alter table profiles   add column if not exists org_id uuid references organizations(id) on delete set null;
alter table profiles   add column if not exists guardian_email text;
alter table activities add column if not exists age_groups text[] not null default '{kid,teen,adult}';
alter table news       add column if not exists age_groups text[] not null default '{teen,adult}';
alter table challenges add column if not exists age_groups text[] not null default '{kid,teen,adult}';
create index if not exists idx_profiles_account_type on profiles (account_type);
create index if not exists idx_profiles_org on profiles (org_id);
create index if not exists idx_activities_age on activities using gin (age_groups);

create or replace function brote_account_type(p_uid uuid)
returns text language sql stable security definer set search_path = public as $$
  select coalesce(account_type::text, 'adult') from profiles where id = p_uid;
$$;
revoke execute on function brote_account_type(uuid) from public, anon;
grant execute on function brote_account_type(uuid) to authenticated;

-- ── F12.2 Real impact metrics ───────────────────────────────────────────────
alter table activities add column if not exists impact_water_l    numeric not null default 0;
alter table activities add column if not exists impact_co2_kg     numeric not null default 0;
alter table activities add column if not exists impact_waste_kg   numeric not null default 0;
alter table activities add column if not exists impact_energy_kwh numeric not null default 0;

create or replace function brote_user_impact(p_uid uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('water_l', coalesce(sum(a.impact_water_l),0), 'co2_kg', coalesce(sum(a.impact_co2_kg),0),
    'waste_kg', coalesce(sum(a.impact_waste_kg),0), 'energy_kwh', coalesce(sum(a.impact_energy_kwh),0), 'actions', count(*))
  from activity_completions ac join activities a on a.id = ac.activity_id
  where ac.user_id = p_uid and ac.status in ('honor','verified');
$$;
create or replace function brote_user_impact_since(p_uid uuid, p_days int default 7)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('water_l', coalesce(sum(a.impact_water_l),0), 'co2_kg', coalesce(sum(a.impact_co2_kg),0),
    'waste_kg', coalesce(sum(a.impact_waste_kg),0), 'energy_kwh', coalesce(sum(a.impact_energy_kwh),0), 'actions', count(*))
  from activity_completions ac join activities a on a.id = ac.activity_id
  where ac.user_id = p_uid and ac.status in ('honor','verified')
    and ac.local_date >= ((now() at time zone 'America/Argentina/Buenos_Aires')::date - p_days);
$$;
revoke execute on function brote_user_impact(uuid) from public, anon;
revoke execute on function brote_user_impact_since(uuid, int) from public, anon;
grant execute on function brote_user_impact(uuid) to authenticated;
grant execute on function brote_user_impact_since(uuid, int) to authenticated;

-- ── F12.3 Weekly competition points (never lifetime XP) ─────────────────────
create or replace function my_weekly_points()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('points', coalesce(sum(points_awarded),0), 'actions', count(*),
    'since', (now() at time zone 'America/Argentina/Buenos_Aires')::date - 6)
  from activity_completions
  where user_id = auth.uid() and status in ('honor','verified')
    and local_date >= ((now() at time zone 'America/Argentina/Buenos_Aires')::date - 6);
$$;
revoke execute on function my_weekly_points() from public, anon;
grant execute on function my_weekly_points() to authenticated;

-- ── F12.4 Competitions ──────────────────────────────────────────────────────
create table if not exists competitions (
  id uuid primary key default gen_random_uuid(), code text unique not null,
  name text not null, description text,
  creator_id uuid references profiles(id) on delete cascade,
  is_public boolean not null default false,
  age_groups text[] not null default '{kid,teen,adult}',
  org_id uuid references organizations(id) on delete set null,
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now()
);
create table if not exists competition_members (
  competition_id uuid not null references competitions(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (competition_id, user_id)
);
create index if not exists idx_competitions_public on competitions (is_public, ends_at desc);
create index if not exists idx_comp_members_user on competition_members (user_id);
alter table competitions enable row level security;
alter table competition_members enable row level security;
drop policy if exists "competitions read" on competitions;
create policy "competitions read" on competitions for select using (
  is_public or exists (select 1 from competition_members m where m.competition_id = id and m.user_id = (select auth.uid())));
drop policy if exists "comp members read" on competition_members;
create policy "comp members read" on competition_members for select using (true);
drop policy if exists "comp members self" on competition_members;
create policy "comp members self" on competition_members for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- ── F12.6 Habits ────────────────────────────────────────────────────────────
create table if not exists user_habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  activity_id uuid not null references activities(id) on delete cascade,
  cadence text not null default 'daily',
  current_streak int not null default 0, longest_streak int not null default 0,
  last_done_date date, active boolean not null default true,
  created_at timestamptz not null default now(), unique (user_id, activity_id)
);
alter table user_habits enable row level security;
drop policy if exists "habits owner" on user_habits;
create policy "habits owner" on user_habits for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create index if not exists idx_habits_user on user_habits (user_id, active);

-- ── F12.5 Group actions ─────────────────────────────────────────────────────
alter table projects add column if not exists completed_at timestamptz;
alter table projects add column if not exists group_activity_id uuid references activities(id);

-- Remaining function bodies (create_organization, join_organization,
-- org_leaderboard, create_competition, join_competition,
-- competition_leaderboard, my_competitions, public_competitions, add_habit,
-- remove_habit, my_habits, brote_touch_habit, complete_group_action,
-- ensure_daily_set v3 age-aware, complete_activity v4) are applied live in
-- migrations 0017-0020 of the São Paulo project.
