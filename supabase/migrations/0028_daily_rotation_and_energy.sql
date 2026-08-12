-- Brote — 0028 — Real daily-set rotation + everyday energy/CO2 actions.
-- Mirrors live migrations 0024_daily_set_real_rotation and the accompanying
-- activity seed.
--
-- ROTATION BUG: ensure_daily_set() narrowed its candidate pool to `rn = 1` per
-- domain — exactly one activity per domain per day. With 13 domains that is 13
-- candidates regardless of catalogue size, so adding activities could never
-- increase variety. Now up to 4 per domain, and the no-repeat window went from
-- 3 days to 21 (brote_repeat_window_days()), with an automatic relaxation when
-- the eligible pool is too small to sustain it.
--
-- The full ensure_daily_set() body is applied live in migration 0024; see it
-- for the authoritative definition.

create or replace function brote_repeat_window_days()
returns int language sql immutable as $$ select 21; $$;

-- 15 everyday energy/air actions were seeded alongside it: unplugging idle
-- chargers, killing standby, suspending the computer, using daylight, choosing
-- the microwave over the oven, boiling only the water you need, trying the fan
-- before the air conditioner, cutting the power strip on the way out, walking
-- a short trip, not idling the engine. Deliberately no purchases and no
-- installations — the previous energy set was dominated by solar panels, heat
-- pumps and insulation, which are investments rather than daily habits.
