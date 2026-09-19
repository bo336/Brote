-- Brote — 0047 — Perfiles v2: "la cuenta es el recibo".
-- Feed v2 ("La Plaza") fase 2, paso 1.
--
-- Una sola llamada devuelve todo lo que el perfil necesita, y la visibilidad se
-- decide ACÁ, no en la UI: un perfil privado o de adolescente no manda los datos
-- y después los esconde — directamente no los manda. Los perfiles de chicos no
-- existen para nadie más (08 §1): ni siquiera un encabezado, porque exponer
-- nombre + ciudad + racha de un menor es justamente lo que no hay que hacer.
--
-- Dos columnas que el pack asumía y que no existen, corregidas acá:
--   · user_leagues es (user_id, tier, group_index, last_result, updated_at):
--     el nombre sale de brote_league_name(tier), no de una columna `league`.
--   · user_lessons no tiene `passed`: se completó si completed_at está.
-- Y rank_name salía null porque brote_get_rank devuelve {slug,tier,division}
-- sin nombre: el nombre y el color viven en lib/ranks.ts y el cliente los
-- resuelve desde el slug, como hace el resto de la app. Una segunda fuente de
-- verdad para los nombres de rango sólo se desincroniza.

create or replace function get_public_profile_v2(p_username text) returns jsonb
language plpgsql stable security definer set search_path = public as $fn$
declare
  v_me uuid := auth.uid(); p profiles%rowtype;
  v_can_see boolean; v_is_me boolean; v_following boolean; v_follows_me boolean; v_blocked boolean;
  v_rank jsonb;
begin
  select * into p from profiles where lower(username::text) = lower(btrim(coalesce(p_username,'')));
  if not found then return jsonb_build_object('ok', false, 'error', 'No existe'); end if;
  v_is_me := (v_me = p.id);

  if p.account_type = 'kid' and not v_is_me then
    return jsonb_build_object('ok', false, 'error', 'No disponible');
  end if;

  v_blocked := exists (select 1 from user_blocks
                       where (blocker_id = v_me and blocked_id = p.id)
                          or (blocker_id = p.id and blocked_id = v_me));
  if v_blocked and not v_is_me then
    return jsonb_build_object('ok', false, 'error', 'No disponible');
  end if;

  v_following  := exists (select 1 from follows where follower_id = v_me and followee_id = p.id);
  v_follows_me := exists (select 1 from follows where follower_id = p.id and followee_id = v_me);
  v_can_see := v_is_me or p.profile_visibility = 'public'
            or (p.profile_visibility = 'followers' and v_following);
  v_rank := brote_get_rank(p.total_xp);

  -- Encabezado siempre: es lo que permite pedirle seguir a alguien privado.
  if not v_can_see then
    return jsonb_build_object('ok', true,
      'profile', jsonb_build_object(
        'id', p.id, 'username', p.username, 'display_name', p.display_name,
        'avatar_url', p.avatar_url, 'pip_style', p.pip_style,
        'rank_slug', p.current_rank_slug, 'division', p.current_division,
        'is_verified', p.is_verified, 'is_creator', p.is_creator,
        'followers_count', p.followers_count, 'following_count', p.following_count,
        'posts_count', p.posts_count, 'profile_visibility', p.profile_visibility,
        'account_type', p.account_type::text, 'created_at', p.created_at),
      'viewer', jsonb_build_object('is_me', v_is_me, 'is_following', v_following,
        'follows_me', v_follows_me, 'is_blocked', v_blocked, 'can_see', false),
      'stats', null, 'recent', null);
  end if;

  return jsonb_build_object('ok', true,
    'profile', jsonb_build_object(
      'id', p.id, 'username', p.username, 'display_name', p.display_name,
      'bio', p.bio, 'city', p.city, 'avatar_url', p.avatar_url, 'pip_style', p.pip_style,
      'account_type', p.account_type::text,
      'rank_slug', p.current_rank_slug, 'division', p.current_division,
      'rank_tier', (v_rank->>'tier')::int,
      'total_xp', p.total_xp, 'current_streak', p.current_streak,
      'longest_streak', p.longest_streak, 'streak_freezes', p.streak_freezes,
      'equipped_title', (select t.name_es from titles t where t.id = p.equipped_title_id),
      'is_verified', p.is_verified, 'is_creator', p.is_creator, 'plan', p.plan::text,
      'created_at', p.created_at,
      'followers_count', p.followers_count, 'following_count', p.following_count,
      'posts_count', p.posts_count, 'profile_visibility', p.profile_visibility,
      'mundo_state', p.mundo_state),
    'viewer', jsonb_build_object('is_me', v_is_me, 'is_following', v_following,
      'follows_me', v_follows_me, 'is_blocked', v_blocked, 'can_see', true),
    'stats', jsonb_build_object(
      'completions_total', (select count(*) from activity_completions where user_id = p.id),
      'completions_30d',   (select count(*) from activity_completions
                             where user_id = p.id and completed_at > now() - interval '30 days'),
      'domain_points', coalesce((select jsonb_object_agg(domain_slug, points)
                                 from user_domain_points where user_id = p.id), '{}'::jsonb),
      'impact', brote_user_impact(p.id), 'impact_30d', brote_user_impact_since(p.id, 30),
      'badges', coalesce((select jsonb_agg(jsonb_build_object('slug', b.slug, 'name_es', b.name_es,
                    'rarity', b.rarity, 'icon', b.icon, 'earned_at', ub.earned_at) order by ub.earned_at desc)
                  from user_badges ub join badges b on b.id = ub.badge_id where ub.user_id = p.id), '[]'::jsonb),
      'titles', coalesce((select jsonb_agg(jsonb_build_object('slug', t.slug, 'name_es', t.name_es,
                    'rarity', t.rarity, 'equipped', t.id = p.equipped_title_id))
                  from user_titles ut join titles t on t.id = ut.title_id where ut.user_id = p.id), '[]'::jsonb),
      'league', (select jsonb_build_object('name', brote_league_name(ul.tier), 'tier', ul.tier,
                   'group_index', ul.group_index, 'last_result', ul.last_result)
                 from user_leagues ul where ul.user_id = p.id limit 1),
      'global_position', get_user_global_position(p.id),
      'weekly_position', get_user_weekly_position(p.id),
      'projects_created',  (select count(*) from projects where creator_id = p.id),
      'projects_joined',   (select count(*) from project_participants where user_id = p.id),
      'sessions_attended', (select count(*) from project_session_attendees where user_id = p.id),
      'habits_active',     (select count(*) from user_habits where user_id = p.id),
      'lessons_completed', (select count(*) from user_lessons where user_id = p.id and completed_at is not null)),
    'recent', jsonb_build_object(
      'posts', coalesce((select jsonb_agg(feed_item_json(f.id) order by f.created_at desc)
                from (select id, created_at from feed_posts
                       where author_id = p.id and kind <> 'reply' and not hidden
                       order by created_at desc limit 10) f), '[]'::jsonb)));
end $fn$;

-- Publicaciones / Respuestas de un perfil. Keyset por created_at, y el MISMO
-- portón de visibilidad que el perfil: sin eso, las publicaciones serían la
-- puerta de atrás a un perfil privado.
create or replace function profile_posts(
  p_user uuid, p_kind text default 'posts',
  p_cursor timestamptz default null, p_limit integer default 20
) returns jsonb
language sql stable security definer set search_path = public as $fn$
  with me as (select coalesce(account_type::text,'adult') as age from profiles where id = auth.uid()),
  vis as (
    select (t.id = auth.uid()
            or t.profile_visibility = 'public'
            or (t.profile_visibility = 'followers'
                and exists (select 1 from follows f where f.follower_id = auth.uid() and f.followee_id = t.id)))
           and t.account_type <> 'kid'
           and not exists (select 1 from user_blocks b
                           where (b.blocker_id = auth.uid() and b.blocked_id = t.id)
                              or (b.blocker_id = t.id and b.blocked_id = auth.uid())) as ok
    from profiles t where t.id = p_user
  ),
  rows as (
    select f.id, f.created_at
    from feed_posts f, me, vis
    where vis.ok and f.author_id = p_user and not f.hidden
      and me.age = any(f.age_groups)
      and (case when p_kind = 'replies' then f.kind = 'reply' else f.kind <> 'reply' end)
      and (p_cursor is null or f.created_at < p_cursor)
    order by f.created_at desc
    limit greatest(1, least(50, coalesce(p_limit, 20)))
  )
  select jsonb_build_object(
    'items', coalesce((select jsonb_agg(feed_item_json(r.id) order by r.created_at desc) from rows r), '[]'::jsonb),
    'next_cursor', (select min(created_at) from rows));
$fn$;

-- Guardados: privados, sólo propios, sin contador visible para nadie.
create or replace function my_saved_posts(p_cursor timestamptz default null, p_limit integer default 20)
returns jsonb language sql stable security definer set search_path = public as $fn$
  with rows as (
    select s.post_id as id, s.created_at
    from feed_saves s join feed_posts f on f.id = s.post_id
    where s.user_id = auth.uid() and not f.hidden
      and (p_cursor is null or s.created_at < p_cursor)
    order by s.created_at desc
    limit greatest(1, least(50, coalesce(p_limit, 20)))
  )
  select jsonb_build_object(
    'items', coalesce((select jsonb_agg(feed_item_json(r.id) order by r.created_at desc) from rows r), '[]'::jsonb),
    'next_cursor', (select min(created_at) from rows));
$fn$;

create or replace function followers_of(p_user uuid, p_cursor timestamptz default null, p_limit integer default 30)
returns jsonb language sql stable security definer set search_path = public as $fn$
  with rows as (
    select fo.follower_id as id, fo.created_at
    from follows fo join profiles p on p.id = fo.follower_id
    where fo.followee_id = p_user and p.account_type <> 'kid'
      and not exists (select 1 from user_blocks b
                      where (b.blocker_id = auth.uid() and b.blocked_id = p.id)
                         or (b.blocker_id = p.id and b.blocked_id = auth.uid()))
      and (p_cursor is null or fo.created_at < p_cursor)
    order by fo.created_at desc
    limit greatest(1, least(60, coalesce(p_limit, 30)))
  )
  select jsonb_build_object(
    'items', coalesce((select jsonb_agg(jsonb_build_object(
        'id', p.id, 'username', p.username, 'display_name', p.display_name,
        'avatar_url', p.avatar_url, 'pip_style', p.pip_style, 'bio', p.bio,
        'rank_slug', p.current_rank_slug, 'is_verified', p.is_verified,
        'followers_count', p.followers_count, 'city', p.city,
        'is_following', exists (select 1 from follows f2 where f2.follower_id = auth.uid() and f2.followee_id = p.id))
      order by r.created_at desc)
      from rows r join profiles p on p.id = r.id), '[]'::jsonb),
    'next_cursor', (select min(created_at) from rows));
$fn$;

create or replace function following_of(p_user uuid, p_cursor timestamptz default null, p_limit integer default 30)
returns jsonb language sql stable security definer set search_path = public as $fn$
  with rows as (
    select fo.followee_id as id, fo.created_at
    from follows fo join profiles p on p.id = fo.followee_id
    where fo.follower_id = p_user and p.account_type <> 'kid'
      and not exists (select 1 from user_blocks b
                      where (b.blocker_id = auth.uid() and b.blocked_id = p.id)
                         or (b.blocker_id = p.id and b.blocked_id = auth.uid()))
      and (p_cursor is null or fo.created_at < p_cursor)
    order by fo.created_at desc
    limit greatest(1, least(60, coalesce(p_limit, 30)))
  )
  select jsonb_build_object(
    'items', coalesce((select jsonb_agg(jsonb_build_object(
        'id', p.id, 'username', p.username, 'display_name', p.display_name,
        'avatar_url', p.avatar_url, 'pip_style', p.pip_style, 'bio', p.bio,
        'rank_slug', p.current_rank_slug, 'is_verified', p.is_verified,
        'followers_count', p.followers_count, 'city', p.city,
        'is_following', exists (select 1 from follows f2 where f2.follower_id = auth.uid() and f2.followee_id = p.id))
      order by r.created_at desc)
      from rows r join profiles p on p.id = r.id), '[]'::jsonb),
    'next_cursor', (select min(created_at) from rows));
$fn$;

revoke all on function get_public_profile_v2(text), profile_posts(uuid,text,timestamptz,integer),
  my_saved_posts(timestamptz,integer), followers_of(uuid,timestamptz,integer),
  following_of(uuid,timestamptz,integer) from public, anon;
grant execute on function get_public_profile_v2(text), profile_posts(uuid,text,timestamptz,integer),
  my_saved_posts(timestamptz,integer), followers_of(uuid,timestamptz,integer),
  following_of(uuid,timestamptz,integer) to authenticated;
