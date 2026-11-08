-- ════════════════════════════════════════════════════════════════════════════
-- Brote — 0149 — Funciones que contaban de más.
--
-- Revisando los avisos de seguridad de Supabase antes del lanzamiento:
--
--   · `friend_leaderboard_weekly(p_uid)` y `friend_leaderboard(p_uid)`
--     devolvían la lista de amigos de CUALQUIER id, con usuario, nombre, foto,
--     puntos y barrio. La semanal, incluso sin sesión. Un perfil adolescente es
--     sólo para quien lo sigue: ahora cada una responde sólo por quien pregunta.
--   · `get_profiles_brief(p_ids)` daba nombre y foto de cualquier id, también de
--     cuentas de chicos, que no se muestran a nadie. Ahora deja afuera a los
--     chicos (salvo a uno mismo) y no se llama sin sesión.
--   · `activity_available_at(p_uid, …)` decía, de cualquier persona, cuándo hizo
--     una acción. La app no la usa desde el navegador: se cierra.
--
-- La app pasa siempre el id propio, así que nada cambia para quien la usa.
-- ════════════════════════════════════════════════════════════════════════════

create or replace function public.friend_leaderboard_weekly(p_uid uuid)
returns table(pos bigint, user_id uuid, username text, display_name text, avatar_url text, neighborhood text,
              xp bigint, rank_slug text, division integer, title_es text)
language sql
stable
security definer
set search_path = public
as $$
  with yo as (select (select auth.uid()) as uid where p_uid = (select auth.uid())),
  friends as (
    select case when f.user_id = yo.uid then f.friend_id else f.user_id end as fid
      from friendships f, yo
     where f.status = 'accepted' and (f.user_id = yo.uid or f.friend_id = yo.uid)
    union
    select uid from yo),
  wk as (
    select ac.user_id, sum(ac.points_awarded)::bigint as xp
      from activity_completions ac
     where ac.local_date >= brote_week_start() and ac.status in ('honor','verified')
       and ac.user_id in (select fid from friends)
     group by ac.user_id)
  -- Friends with zero points this week must still appear, otherwise the board
  -- looks empty every Monday morning.
  select row_number() over (order by coalesce(wk.xp, 0) desc), p.id, p.username::text, p.display_name, p.avatar_url,
         p.neighborhood, coalesce(wk.xp, 0), p.current_rank_slug, p.current_division, t.name_es
    from profiles p
    join friends fr on fr.fid = p.id
    left join wk on wk.user_id = p.id
    left join titles t on t.id = p.equipped_title_id
   order by coalesce(wk.xp, 0) desc;
$$;
revoke all on function public.friend_leaderboard_weekly(uuid) from public, anon;
grant execute on function public.friend_leaderboard_weekly(uuid) to authenticated;

create or replace function public.friend_leaderboard(p_uid uuid)
returns table(pos bigint, user_id uuid, username text, display_name text, avatar_url text, neighborhood text,
              total_xp bigint, rank_slug text, division integer, title_es text)
language sql
stable
security definer
set search_path = public
as $$
  with yo as (select (select auth.uid()) as uid where p_uid = (select auth.uid())),
  friends as (
    select case when f.user_id = yo.uid then f.friend_id else f.user_id end as fid
      from friendships f, yo
     where f.status = 'accepted' and (f.user_id = yo.uid or f.friend_id = yo.uid)
    union
    select uid from yo)
  select row_number() over (order by p.total_xp desc), p.id, p.username::text, p.display_name, p.avatar_url,
         p.neighborhood, p.total_xp, p.current_rank_slug, p.current_division, t.name_es
    from profiles p
    join friends f on f.fid = p.id
    left join titles t on t.id = p.equipped_title_id
   order by p.total_xp desc;
$$;
revoke all on function public.friend_leaderboard(uuid) from public, anon;
grant execute on function public.friend_leaderboard(uuid) to authenticated;

create or replace function public.get_profiles_brief(p_ids uuid[])
returns table(id uuid, username text, display_name text, avatar_url text, rank_slug text, division integer)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.username::text, p.display_name, p.avatar_url, p.current_rank_slug, p.current_division
    from profiles p
   where p.id = any(p_ids)
     and (p.account_type is distinct from 'kid' or p.id = (select auth.uid()));
$$;
revoke all on function public.get_profiles_brief(uuid[]) from public, anon;
grant execute on function public.get_profiles_brief(uuid[]) to authenticated;

revoke all on function public.activity_available_at(uuid, uuid) from public, anon, authenticated;
