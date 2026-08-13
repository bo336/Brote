-- Brote — 0027 — Competitions: optional end date + recurring point resets.
-- Mirrors live migration 0023_competition_periods.
-- ends_at NULL = runs forever. reset_period = null|'weekly'|'monthly'.
-- reset_anchor = weekly: 0-6 (Sun-Sat); monthly: 1-28.
alter table competitions alter column ends_at drop not null;
alter table competitions alter column ends_at drop default;
alter table competitions add column if not exists reset_period text
  check (reset_period is null or reset_period in ('weekly','monthly'));
alter table competitions add column if not exists reset_anchor smallint;
-- competition_period_start(), create_competition() (6-arg),
-- competition_leaderboard() and my_competitions() are applied live in
-- migration 0023; see it for the authoritative bodies.
