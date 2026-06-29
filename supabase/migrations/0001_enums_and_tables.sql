-- ════════════════════════════════════════════════════════════════════════════
-- Brote — 0001 — Enums + Tables (BUILD_SPEC §4.1, §4.2)
-- RLS is enabled per-table in 0002. Functions/triggers in 0003. Storage in 0004.
-- ════════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;
create extension if not exists citext;

-- ── Enums (§4.1) ────────────────────────────────────────────────────────────
create type activity_type as enum ('daily', 'catalog');
create type effort_level as enum ('easy', 'medium', 'hard');
create type impact_level as enum ('low', 'medium', 'high');
create type verification_type as enum ('honor', 'photo_ai', 'photo_peer', 'geo');
create type frequency_type as enum ('one_time', 'daily', 'weekly', 'recurring');
create type completion_status as enum ('honor', 'pending', 'verified', 'rejected');
create type project_status as enum ('proposed', 'active', 'completed', 'cancelled');
create type project_member_status as enum ('joined', 'interested', 'organizer', 'left');
create type challenge_type as enum ('daily', 'weekly', 'seasonal');
create type goal_period as enum ('weekly', 'monthly');
create type notif_type as enum ('points','rank_up','title','streak_risk','streak_lost','challenge','project','friend','news','system');

-- ── updated_at helper ───────────────────────────────────────────────────────
create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ── Reference: domains (§3.4) ───────────────────────────────────────────────
create table domains (
  slug            text primary key,
  name_es         text not null,
  name_en         text,
  color           text not null,
  icon            text,
  description_es   text,
  description_en   text,
  sort_order      int not null default 0
);

-- ── Reference: ranks (§5.1) ─────────────────────────────────────────────────
create table ranks (
  slug                 text primary key,
  name_es              text not null,
  name_en              text,
  tier                 int unique not null,
  xp_threshold         bigint not null,
  divisions            int not null default 5,
  color                text,
  icon                 text,
  unlock_description_es text
);

-- ── Titles + Badges (§7) ────────────────────────────────────────────────────
create table titles (
  id                 uuid primary key default gen_random_uuid(),
  slug               text unique not null,
  name_es            text not null,
  name_en            text,
  domain_slug        text references domains(slug),
  requirement_type   text not null,            -- domain_points|rank|activity_count|streak|special|verified
  requirement_value  bigint not null default 0,
  requirement_domain text,
  rarity             text not null default 'common', -- common|rare|epic|legendary
  icon               text,
  description_es      text
);

create table badges (
  id                 uuid primary key default gen_random_uuid(),
  slug               text unique not null,
  name_es            text not null,
  name_en            text,
  description_es      text,
  icon               text,
  rarity             text not null default 'common',
  requirement_type   text not null,
  requirement_value  bigint not null default 0,
  requirement_domain text
);

-- ── Profiles (1:1 with auth.users; row created by trigger on signup) ─────────
create table profiles (
  id                 uuid primary key references auth.users(id) on delete cascade,
  username           citext unique,
  display_name       text,
  avatar_url         text,
  bio                text,
  city               text not null default 'Buenos Aires',
  neighborhood       text,
  language           text not null default 'es',
  timezone           text not null default 'America/Argentina/Buenos_Aires',
  total_xp           bigint not null default 0,
  current_rank_slug  text not null default 'semilla',
  current_division   int not null default 1,
  current_streak     int not null default 0,
  longest_streak     int not null default 0,
  last_streak_date   date,
  streak_freezes     int not null default 0,
  equipped_title_id  uuid references titles(id) on delete set null,
  mundo_state        jsonb not null default '{}',
  interests          text[] not null default '{}',
  context            jsonb not null default '{}',
  onboarding_completed boolean not null default false,
  notification_prefs jsonb not null default '{"push":true,"streak":true,"challenges":true,"projects":true,"news":false}',
  trust_score        numeric not null default 1.0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create trigger profiles_updated_at before update on profiles
  for each row execute function set_updated_at();

-- ── Activities (the daily pool AND the catalog; `type` distinguishes) ────────
create table activities (
  id                    uuid primary key default gen_random_uuid(),
  slug                  text unique not null,
  type                  activity_type not null,
  domain_slug           text not null references domains(slug),
  title_es              text not null,
  title_en              text,
  short_es              text,
  short_en              text,
  description_es         text,
  description_en         text,
  instructions_es        text,
  instructions_en        text,
  effort                effort_level not null,
  impact                impact_level not null,
  verification          verification_type not null default 'honor',
  base_points           int not null,
  frequency             frequency_type not null,
  icon                  text,
  min_rank_slug         text not null default 'semilla',
  is_featured           boolean not null default false,
  featured_week         date,
  impact_equivalency_es text,
  impact_equivalency_en text,
  repeat_cooldown_hours int not null default 0,
  active                boolean not null default true,
  sort_order            int not null default 0,
  created_at            timestamptz not null default now()
);

-- ── Activity completions (the event log) ────────────────────────────────────
create table activity_completions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references profiles(id) on delete cascade,
  activity_id       uuid not null references activities(id),
  activity_type     activity_type not null,
  domain_slug       text not null,
  completed_at      timestamptz not null default now(),
  local_date        date not null,
  points_awarded    int not null default 0,
  status            completion_status not null default 'honor',
  photo_url         text,
  ai_result         jsonb,
  note              text,
  counts_for_streak boolean not null default false,
  created_at        timestamptz not null default now()
);
-- One daily action per (user, activity, local day) — anti double-logging (§6.3).
create unique index activity_completions_daily_unique
  on activity_completions (user_id, activity_id, local_date)
  where activity_type = 'daily';

-- ── Aggregates ──────────────────────────────────────────────────────────────
create table user_domain_points (
  user_id     uuid not null references profiles(id) on delete cascade,
  domain_slug text not null references domains(slug),
  points      bigint not null default 0,
  primary key (user_id, domain_slug)
);

create table user_titles (
  user_id   uuid not null references profiles(id) on delete cascade,
  title_id  uuid not null references titles(id) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (user_id, title_id)
);

create table user_badges (
  user_id   uuid not null references profiles(id) on delete cascade,
  badge_id  uuid not null references badges(id) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

-- ── Challenges + goals ──────────────────────────────────────────────────────
create table challenges (
  id            uuid primary key default gen_random_uuid(),
  type          challenge_type not null,
  title_es      text not null,
  title_en      text,
  description_es text,
  description_en text,
  domain_slug   text references domains(slug),
  target_metric text not null,
  target_value  int not null default 1,
  reward_points int not null default 0,
  min_rank_slug text not null default 'semilla',
  starts_at     timestamptz,
  ends_at       timestamptz,
  sponsor_name  text,
  sponsor_logo  text,
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

create table user_challenges (
  user_id      uuid not null references profiles(id) on delete cascade,
  challenge_id uuid not null references challenges(id) on delete cascade,
  progress     int not null default 0,
  completed    boolean not null default false,
  completed_at timestamptz,
  primary key (user_id, challenge_id)
);

create table goals (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  title_es    text not null,
  metric      text not null,             -- xp|completions|domain_points|streak_days|daily_actions
  domain_slug text references domains(slug),
  target_value int not null default 1,
  period      goal_period not null,
  starts_at   date not null,
  ends_at     date not null,
  progress    int not null default 0,
  is_custom   boolean not null default true,
  completed   boolean not null default false,
  reward_points int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger goals_updated_at before update on goals
  for each row execute function set_updated_at();

-- ── Community: projects ─────────────────────────────────────────────────────
create table projects (
  id              uuid primary key default gen_random_uuid(),
  creator_id      uuid not null references profiles(id) on delete cascade,
  title           text not null,
  description     text,
  type            text not null default 'otro',
  domain_slug     text references domains(slug),
  image_url       text,
  neighborhood    text,
  city            text not null default 'Buenos Aires',
  lat             double precision,
  lng             double precision,
  location_text   text,
  event_date      timestamptz,
  status          project_status not null default 'proposed',
  min_rank_slug   text not null default 'semilla',
  max_participants int,
  reward_points   int not null default 0,
  upvotes         int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create trigger projects_updated_at before update on projects
  for each row execute function set_updated_at();

create table project_participants (
  project_id uuid not null references projects(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  status     project_member_status not null default 'joined',
  joined_at  timestamptz not null default now(),
  primary key (project_id, user_id)
);

create table project_upvotes (
  project_id uuid not null references projects(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

-- ── News (AI-summarized cache, shared across users) ─────────────────────────
create table news (
  id             uuid primary key default gen_random_uuid(),
  source         text,
  source_url     text unique not null,
  original_title text,
  title_es       text,
  summary_es     text,
  title_en       text,
  summary_en     text,
  image_url      text,
  domain_tags    text[] not null default '{}',
  interest_score int not null default 50,
  published_at   timestamptz,
  fetched_at     timestamptz not null default now(),
  active         boolean not null default true
);

-- ── Social: friendships ─────────────────────────────────────────────────────
create table friendships (
  user_id    uuid not null references profiles(id) on delete cascade,
  friend_id  uuid not null references profiles(id) on delete cascade,
  status     text not null default 'pending',  -- pending|accepted|blocked
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id)
);

-- ── Notifications ───────────────────────────────────────────────────────────
create table notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  type       notif_type not null,
  title_es   text not null,
  body_es    text,
  data       jsonb not null default '{}',
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

-- ── Config / feature flags / rotation pointers ──────────────────────────────
create table app_state (
  key        text primary key,
  value      jsonb not null default '{}',
  is_public  boolean not null default false,
  updated_at timestamptz not null default now()
);
create trigger app_state_updated_at before update on app_state
  for each row execute function set_updated_at();

-- ── Web Push subscriptions (§12.4) ──────────────────────────────────────────
create table push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  endpoint   text unique not null,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);

-- ── Daily sets (stable per user/day; §7.3, §13.1) ───────────────────────────
create table daily_sets (
  user_id      uuid not null references profiles(id) on delete cascade,
  local_date   date not null,
  activity_ids uuid[] not null default '{}',
  bonus_awarded boolean not null default false,
  created_at   timestamptz not null default now(),
  primary key (user_id, local_date)
);

-- ── Weekly leaderboard snapshots (§13.5) ────────────────────────────────────
create table weekly_scores (
  user_id    uuid not null references profiles(id) on delete cascade,
  week_start date not null,
  xp         bigint not null default 0,
  primary key (user_id, week_start)
);
