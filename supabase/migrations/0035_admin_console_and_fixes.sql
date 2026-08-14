-- Brote — 0035 — Owner console, friend requests, board caps, position fix.
-- Mirrors live migrations 0044-0050.

-- ── POSITION BUG ────────────────────────────────────────────────────────────
-- "Tu posición" disagreed with the board: the boards include simulated players
-- but the position functions counted only `profiles`, so someone shown 5th was
-- told they were 1st. Both now count from exactly the population the board
-- renders. Verified: board row 34 == reported 34.

-- ── BOARD CAPS ──────────────────────────────────────────────────────────────
-- Everyone still competes and everyone is still ranked, but a board only ever
-- returns brote_board_cap() = 200 rows. Nobody scrolls to position 4.000 and
-- fetching it costs every reader.

-- ── FRIEND REQUESTS ─────────────────────────────────────────────────────────
-- Entering someone's code used to add you to their friends list without them
-- being asked — and a code can be shared, screenshotted or guessed. It now
-- sends a request; the friendship exists only once accepted, and is then
-- written in BOTH directions so neither side has a one-sided list. If they had
-- already requested you, entering their code completes the match instead of
-- creating a mirror request.

-- ── OWNER CONSOLE (/panel) ──────────────────────────────────────────────────
-- Reached only by typing the URL; nothing links to it. Obscurity is not the
-- security model:
--   · passphrase stored as SHA-256 with a per-install salt, never plaintext,
--     never in the client bundle;
--   · verified in a SECURITY DEFINER function so the hash never leaves the DB;
--   · required AGAIN on every write, so a stale open tab cannot flip switches;
--   · 8 failed attempts locks it for 15 minutes.
-- admin_config has RLS on with NO policies: unreachable from the client except
-- through those functions.
--
-- BUG FOUND IN TESTING: pgcrypto lives in the `extensions` schema while these
-- functions pin `search_path = public`, so gen_random_bytes/digest were
-- invisible and the passphrase could never be set. Calls are now fully
-- qualified rather than widening the search path, which would reintroduce the
-- hijacking risk the pinned path exists to prevent.
--
-- The console exposes app_settings switches (simulated players, ads, news
-- refresh, feed posting, learning) plus live counts, with real_users and
-- simulated_players deliberately reported separately.

create table if not exists admin_config (
  id smallint primary key default 1 check (id = 1),
  pass_hash text, pass_salt text,
  failed_count smallint not null default 0,
  locked_until timestamptz,
  updated_at timestamptz not null default now()
);
alter table admin_config enable row level security;

create table if not exists app_settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_at timestamptz not null default now()
);
alter table app_settings enable row level security;

-- ── SIMULATED PLAYERS: realism ──────────────────────────────────────────────
-- Two tells gave them away: every name was "Nombre X." for all eighty, and
-- scores only moved once a week so the board sat visibly frozen. Names now mix
-- full surnames, initials and first-name-only from a real surname list, and
-- totals drift DAILY (hashed by player × date) while weekly still resets on
-- Monday — same trick, finer grain, still no cron and still no fake rows in
-- activity_completions.
--
-- The old brote-simulate-activity cron, which DID insert fake completions, is
-- unscheduled and its rows removed: they would have polluted impact totals.
--
-- simulated_board is gated on the app_settings switch, so turning the feature
-- off in the console empties every board at once. Verified: OFF → 0 simulated
-- and global drops to the real users; ON → 80 again.

alter table simulated_players add column if not exists surname text;
alter table simulated_players add column if not exists name_style smallint not null default 0;

-- Authoritative bodies for admin_check, admin_set_password, admin_dashboard,
-- admin_set_setting, admin_set_simulated_count, the friend-request functions,
-- the capped boards and the position fixes are applied live in 0044-0050.
