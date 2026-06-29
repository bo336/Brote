-- ════════════════════════════════════════════════════════════════════════════
-- Brote — 0013 — daily_maintenance() (BUILD_SPEC §13).
-- Pure SQL so pg_cron can call it directly (no external key needed): streak
-- reset/freeze, daily challenge rotation, weekly featured rotation, goal
-- rollover, weekly snapshot, and a safety-net auto-approve of stale pendings.
-- ════════════════════════════════════════════════════════════════════════════
create or replace function daily_maintenance()
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_ba_date   date := (now() at time zone 'America/Argentina/Buenos_Aires')::date;
  v_yesterday date := v_ba_date - 1;
  v_dow       int  := extract(dow from v_ba_date); -- 0=Sun, 1=Mon
  v_reset     int  := 0;
  v_frozen    int  := 0;
  r           record;
begin
  -- 1) Streak maintenance (§13.2): users who missed a whole day.
  for r in
    select id, total_xp, streak_freezes from profiles
    where current_streak > 0 and (last_streak_date is null or last_streak_date < v_yesterday)
  loop
    if r.streak_freezes > 0 then
      update profiles set streak_freezes = streak_freezes - 1, last_streak_date = v_yesterday where id = r.id;
      insert into notifications (user_id, type, title_es, body_es)
        values (r.id, 'streak_risk', 'Usaste un protector de racha 🛡️', 'Tu racha sigue viva. ¡Hacé una acción hoy!');
      v_frozen := v_frozen + 1;
    else
      update profiles set current_streak = 0,
        mundo_state = brote_compute_mundo(total_xp, 0, brote_domain_points_json(id))
      where id = r.id;
      insert into notifications (user_id, type, title_es, body_es)
        values (r.id, 'streak_lost', 'Perdiste tu racha 😶‍🌫️', 'No pasa nada. Empezá una nueva hoy con una acción.');
      v_reset := v_reset + 1;
    end if;
  end loop;

  -- 2) Daily challenge rotation (§13.3), avoiding an immediate repeat.
  update app_state set value = (
    select jsonb_build_object('id', id) from challenges
    where type = 'daily' and active
      and id <> coalesce((select (value->>'id')::uuid from app_state where key = 'current_daily_challenge'),
                         '00000000-0000-0000-0000-000000000000'::uuid)
    order by random() limit 1
  ) where key = 'current_daily_challenge';

  -- 3) Weekly featured activity rotation (§13.4), Mondays.
  if v_dow = 1 then
    declare v_ptr int; v_total int; v_ids uuid[];
    begin
      select coalesce((value->>'pointer')::int, 0) into v_ptr from app_state where key = 'featured_rotation';
      select count(*) into v_total from activities where type = 'catalog' and active;
      update activities set is_featured = false, featured_week = null where is_featured;
      select array_agg(id) into v_ids from (
        select id from activities where type = 'catalog' and active
        order by sort_order offset (v_ptr % greatest(v_total, 1)) limit 2
      ) x;
      update activities set is_featured = true, featured_week = v_ba_date where id = any(v_ids);
      update app_state set value = jsonb_build_object('pointer', v_ptr + 2) where key = 'featured_rotation';
    end;
  end if;

  -- 4) Goal rollover (§13.6): complete goals that hit target.
  update goals set completed = true where not completed and progress >= target_value;

  -- 5) Weekly leaderboard snapshot (§13.5), Mondays.
  if v_dow = 1 then
    insert into weekly_scores (user_id, week_start, xp)
    select user_id, v_ba_date, sum(points_awarded)::bigint
    from activity_completions
    where local_date >= v_ba_date - 7
    group by user_id
    on conflict (user_id, week_start) do update set xp = excluded.xp;
  end if;

  -- 6) Safety net: auto-approve pending photo completions older than 15 min
  --    (verify-completion normally resolves these instantly).
  for r in select id from activity_completions where status = 'pending' and completed_at < now() - interval '15 minutes'
  loop
    perform auto_approve_completion(r.id);
  end loop;

  return jsonb_build_object('reset', v_reset, 'frozen', v_frozen, 'date', v_ba_date, 'dow', v_dow);
end $$;
revoke execute on function daily_maintenance() from anon, authenticated;
