-- ════════════════════════════════════════════════════════════════════════════
-- Brote — 0019 — Algorithms deep-pass (IMPROVEMENT_PLAN F1.9).
-- Mirrors live migration 0010_algorithms_rolling_windows (São Paulo project).
--
-- A2: ensure_daily_set v2 — anti-repetition (last 3 days), one per domain,
--     guaranteed effort mix (>=3 easy of 5), interest-weighted, day-stable.
-- A4: rolling challenge windows — daily/weekly/seasonal challenges refresh
--     their windows forever (the seeded fixed ends_at meant ALL challenge
--     progress silently stopped once past — the loop now never runs out).
-- ════════════════════════════════════════════════════════════════════════════

create or replace function ensure_daily_set()
returns setof activities language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_prof profiles%rowtype; v_local date; v_ids uuid[]; v_recent uuid[];
begin
  if v_uid is null then raise exception 'No autenticado'; end if;
  select * into v_prof from profiles where id = v_uid;
  v_local := (now() at time zone v_prof.timezone)::date;
  select activity_ids into v_ids from daily_sets where user_id = v_uid and local_date = v_local;
  if v_ids is null then
    select coalesce(array_agg(distinct aid), '{}'::uuid[]) into v_recent
      from daily_sets ds, unnest(ds.activity_ids) aid
      where ds.user_id = v_uid and ds.local_date >= v_local - 3 and ds.local_date < v_local;

    with pool as (
      select a.id, a.effort, a.domain_slug,
             (a.domain_slug = any(v_prof.interests)) as is_interest,
             (a.id = any(v_recent)) as is_recent,
             md5(a.id::text || v_local::text || v_uid::text) as seed
      from activities a where a.type = 'daily' and a.active
    ), per_domain as (
      select *, row_number() over (partition by domain_slug order by is_recent asc, seed) as rn
      from pool
    ), candidates as (
      select * from per_domain where rn = 1
    ), easy_picks as (
      select id from candidates where effort = 'easy'
      order by is_recent asc, is_interest desc, seed limit 3
    ), rest as (
      select id from candidates where id not in (select id from easy_picks)
      order by is_recent asc, is_interest desc, seed limit 2
    )
    select array_agg(id) into v_ids from (select id from easy_picks union all select id from rest) picked;

    insert into daily_sets (user_id, local_date, activity_ids) values (v_uid, v_local, coalesce(v_ids, '{}'))
      on conflict (user_id, local_date) do update set activity_ids = excluded.activity_ids
      returning activity_ids into v_ids;
  end if;
  return query select * from activities where id = any(v_ids);
end $$;

create or replace function daily_maintenance()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_ba_date date := (now() at time zone 'America/Argentina/Buenos_Aires')::date; v_yesterday date := v_ba_date - 1; v_dow int := extract(dow from v_ba_date); v_reset int := 0; v_frozen int := 0; r record;
begin
  -- 1) Streak maintenance.
  for r in select id, total_xp, streak_freezes from profiles where current_streak > 0 and (last_streak_date is null or last_streak_date < v_yesterday) loop
    if r.streak_freezes > 0 then
      update profiles set streak_freezes = streak_freezes - 1, last_streak_date = v_yesterday where id = r.id;
      insert into notifications (user_id, type, title_es, body_es) values (r.id, 'streak_risk', 'Usaste un protector de racha 🛡️', 'Tu racha sigue viva. ¡Hacé una acción hoy!');
      v_frozen := v_frozen + 1;
    else
      update profiles set current_streak = 0 where id = r.id;
      update profiles set mundo_state = brote_mundo_for(r.id) where id = r.id;
      insert into notifications (user_id, type, title_es, body_es) values (r.id, 'streak_lost', 'Perdiste tu racha 😶‍🌫️', 'No pasa nada. Empezá una nueva hoy con una acción.');
      v_reset := v_reset + 1;
    end if;
  end loop;

  -- 2) Rolling challenge windows (+ per-window progress reset).
  with ref as (
    update challenges set starts_at = v_ba_date::timestamptz, ends_at = (v_ba_date + 1)::timestamptz
    where type = 'daily' and active returning id
  )
  delete from user_challenges where challenge_id in (select id from ref);
  with ref as (
    update challenges set starts_at = v_ba_date::timestamptz, ends_at = (v_ba_date + 7)::timestamptz
    where type = 'weekly' and active and (v_dow = 1 or ends_at < now()) returning id
  )
  delete from user_challenges where challenge_id in (select id from ref);
  with ref as (
    update challenges set starts_at = now(), ends_at = now() + interval '21 days'
    where type = 'seasonal' and active and ends_at < now() returning id
  )
  delete from user_challenges where challenge_id in (select id from ref);

  -- 3) Daily challenge rotation (avoid immediate repeat).
  update app_state set value = (select jsonb_build_object('id', id) from challenges where type = 'daily' and active
      and id <> coalesce((select (value->>'id')::uuid from app_state where key = 'current_daily_challenge'), '00000000-0000-0000-0000-000000000000'::uuid) order by random() limit 1) where key = 'current_daily_challenge';

  -- 4) Weekly featured rotation (Mondays).
  if v_dow = 1 then
    declare v_ptr int; v_total int; v_ids uuid[];
    begin
      select coalesce((value->>'pointer')::int, 0) into v_ptr from app_state where key = 'featured_rotation';
      select count(*) into v_total from activities where type = 'catalog' and active;
      update activities set is_featured = false, featured_week = null where is_featured;
      select array_agg(id) into v_ids from (select id from activities where type = 'catalog' and active order by sort_order offset (v_ptr % greatest(v_total, 1)) limit 2) x;
      update activities set is_featured = true, featured_week = v_ba_date where id = any(v_ids);
      update app_state set value = jsonb_build_object('pointer', v_ptr + 2) where key = 'featured_rotation';
    end;
  end if;

  -- 5) Goal rollover + weekly snapshot + stale-pending safety net.
  update goals set completed = true where not completed and progress >= target_value;
  if v_dow = 1 then
    insert into weekly_scores (user_id, week_start, xp) select user_id, v_ba_date, sum(points_awarded)::bigint from activity_completions where local_date >= v_ba_date - 7 group by user_id
    on conflict (user_id, week_start) do update set xp = excluded.xp;
  end if;
  for r in select id from activity_completions where status = 'pending' and completed_at < now() - interval '15 minutes' loop perform auto_approve_completion(r.id); end loop;

  return jsonb_build_object('reset', v_reset, 'frozen', v_frozen, 'date', v_ba_date, 'dow', v_dow);
end $$;
revoke execute on function daily_maintenance() from public, anon, authenticated;

-- One-time revive of already-expired windows (also ran live).
with ref as (
  update challenges set starts_at = (now() at time zone 'America/Argentina/Buenos_Aires')::date::timestamptz,
    ends_at = ((now() at time zone 'America/Argentina/Buenos_Aires')::date + 1)::timestamptz
  where type = 'daily' and active returning id
) delete from user_challenges where challenge_id in (select id from ref);
with ref as (
  update challenges set starts_at = (now() at time zone 'America/Argentina/Buenos_Aires')::date::timestamptz,
    ends_at = ((now() at time zone 'America/Argentina/Buenos_Aires')::date + 7)::timestamptz
  where type = 'weekly' and active and ends_at < now() returning id
) delete from user_challenges where challenge_id in (select id from ref);
with ref as (
  update challenges set starts_at = now(), ends_at = now() + interval '21 days'
  where type = 'seasonal' and active and ends_at < now() returning id
) delete from user_challenges where challenge_id in (select id from ref);
