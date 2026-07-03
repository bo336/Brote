-- ════════════════════════════════════════════════════════════════════════════
-- Brote — 0023 — Weekly leagues + Pip avatar styles (PLAN F10.1 + F9.1).
-- Mirrors live migrations 0015_weekly_league_pip_style + 0016_weekly_league_fix.
-- ════════════════════════════════════════════════════════════════════════════

alter table profiles add column if not exists pip_style jsonb not null default '{}';

-- Stateless Duolingo-style weekly league: cohorts of 20 ranked by this week's
-- XP; group 1 = Liga Gaia. Zero maintenance, works forever.
create or replace function weekly_league(p_uid uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_ba date := (now() at time zone 'America/Argentina/Buenos_Aires')::date;
  v_rn bigint; v_grp int; v_league text; v_rows jsonb;
begin
  with wk as (
    select user_id, sum(points_awarded)::bigint as xp
    from activity_completions
    where local_date >= v_ba - 6 and status in ('honor','verified')
    group by user_id
  ), ranked as (
    select p.id, coalesce(wk.xp, 0) as xp,
           row_number() over (order by coalesce(wk.xp, 0) desc, p.created_at asc) as rn
    from profiles p
    left join wk on wk.user_id = p.id
    where coalesce(wk.xp, 0) > 0 or p.id = p_uid
  )
  select rn into v_rn from ranked where id = p_uid;
  if v_rn is null then v_rn := 1; end if;
  v_grp := ((v_rn - 1) / 20)::int + 1;
  v_league := case v_grp when 1 then 'Liga Gaia' when 2 then 'Liga Bosque' when 3 then 'Liga Árbol'
                         when 4 then 'Liga Arbusto' when 5 then 'Liga Plántula' else 'Liga Semilla' end;

  with wk as (
    select user_id, sum(points_awarded)::bigint as xp
    from activity_completions
    where local_date >= v_ba - 6 and status in ('honor','verified')
    group by user_id
  ), ranked as (
    select p.id, p.username::text as username, p.display_name, p.avatar_url,
           p.current_rank_slug, p.current_division, coalesce(wk.xp, 0) as xp,
           row_number() over (order by coalesce(wk.xp, 0) desc, p.created_at asc) as rn
    from profiles p
    left join wk on wk.user_id = p.id
    where coalesce(wk.xp, 0) > 0 or p.id = p_uid
  )
  select coalesce(jsonb_agg(jsonb_build_object(
           'pos', rn - (v_grp - 1) * 20, 'user_id', id, 'username', username,
           'display_name', display_name, 'avatar_url', avatar_url,
           'rank_slug', current_rank_slug, 'division', current_division, 'xp', xp
         ) order by rn), '[]'::jsonb)
    into v_rows
  from ranked
  where rn > (v_grp - 1) * 20 and rn <= v_grp * 20;

  return jsonb_build_object('league', v_league, 'group_index', v_grp,
    'my_pos', v_rn - (v_grp - 1) * 20, 'rows', v_rows, 'week_start', v_ba - 6);
end $$;
revoke execute on function weekly_league(uuid) from public, anon;
grant execute on function weekly_league(uuid) to authenticated;
