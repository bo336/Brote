-- Brote — 0034 — First-run tour (client-only) + simulated players (F15.18, F15.13).
-- Mirrors live migrations 0042_simulated_players and 0043_boards_include_simulated.
--
-- SIMULATED PLAYERS — why they are NOT profiles.
-- The first attempt made them real profiles, which meant creating auth.users
-- rows: accounts that could in principle sign in and receive mail. They now
-- live in their own `simulated_players` table and are never part of the account
-- system. Safer, and the schema states plainly what they are.
--
-- Their weekly score is DERIVED, never stored: a hash of the player's seed and
-- the ISO week. It is therefore stable all week, rolls over by itself every
-- Monday, needs no cron job, and writes no fake rows into
-- activity_completions — the ledger the impact figures are summed from stays
-- clean.
--
-- WHERE THEY APPEAR: global, weekly, province and per-theme boards only.
-- Explicitly NOT in friend_leaderboard (either variant) or any competition —
-- those are people you actually chose, and padding them would be a lie rather
-- than scenery. Verified: friends returns real people only, and no simulated
-- player is a member of any competition.
--
-- Theme assignment is a hash of player × domain, so the same faces do not turn
-- up on every theme, which is what would give it away.
--
-- FOR THE OWNER: these must not be counted in any public claim about how many
-- people use Brote. The real number is `select count(*) from profiles`.
-- To remove them entirely: `delete from simulated_players;`

create table if not exists simulated_players (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  city text,
  base_xp int not null,
  rank_slug text not null default 'brote',
  division int not null default 1,
  seed int not null,
  active boolean not null default true
);
alter table simulated_players enable row level security;

-- simulated_weekly_xp(), the simulated_board view, brote_seed_simulated_players()
-- and the six re-written board functions are applied live in migrations
-- 0042 and 0043; see those for the authoritative bodies.
