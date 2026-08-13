-- Brote — 0031 — Routine activities + project work sessions.
-- Mirrors live migrations 0028_routine_activities, 0029_project_sessions_and_contact,
-- 0030_fix_session_activity_type and 0031_create_project_contact.

-- ── F14.5 ROUTINES ──────────────────────────────────────────────────────────
-- Only a CURATED subset may be pinned as a daily routine. This is the whole
-- point of the feature: if anything could be pinned, within a week the daily
-- set would be replaced by a static checklist and the reason to open the app
-- would disappear. 23 actions qualify — a short shower, cycling, the reusable
-- bottle, lights off. Excluded on purpose: one-off or occasional actions
-- (setting up a compost, deleting old files, picking up litter you happen to
-- pass), which make poor daily commitments and only generate broken streaks.
--
-- The rule is enforced in add_habit(), not merely hidden in the UI, and the
-- activity detail page only offers the CTA when routine_eligible is true so a
-- user is never shown a button that will refuse them.
alter table activities add column if not exists routine_eligible boolean not null default false;
create index if not exists idx_activities_routine on activities (routine_eligible) where routine_eligible;
-- See live migration 0028 for the curated slug list, routine_suggestions()
-- and the hardened add_habit().

-- ── F14.8 PROJECT SESSIONS ──────────────────────────────────────────────────
-- A neighbourhood cleanup is rarely a single afternoon. The organiser closes a
-- SESSION ("jornada"), which credits everyone who turned out and is repeatable
-- across phases, instead of the project being one irreversible completion.
alter table projects add column if not exists contact_info text;
alter table projects add column if not exists contact_kind text
  check (contact_kind is null or contact_kind in ('whatsapp','email','instagram','telegram','otro'));
alter table projects add column if not exists session_points int not null default 120;

create table if not exists project_sessions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  organizer_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  notes text,
  held_at timestamptz not null default now(),
  points_each int not null default 0,
  attendees int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists project_session_attendees (
  session_id uuid not null references project_sessions(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  primary key (session_id, user_id)
);

alter table project_sessions enable row level security;
alter table project_session_attendees enable row level security;

-- complete_project_session() credits each attendee through the normal
-- activity_completions ledger, so a session flows into XP, every leaderboard
-- and the impact totals rather than being a parallel scoring system. Points
-- scale with turnout on the same curve as group actions (x1 → x3). Only the
-- project's creator may close one, and someone who never joined the project
-- can never be credited even if their id is passed in. Live migration 0030
-- holds the authoritative body (note: activity_type has no 'group' value —
-- only daily | catalog | one_time — so the ledger row is a catalog action).
