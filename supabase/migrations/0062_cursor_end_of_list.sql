-- Brote — 0062 — El cursor sabe cuándo se terminó la lista.
-- Feed v2 ("La Plaza") fase 2, paso 8 (corrección).
--
-- QUINTO BUG REAL, encontrado mirando /perfil/guardados con UN solo guardado:
-- abajo de la lista había un botón "Cargar más".
--
-- Las cuatro funciones paginadas del perfil devuelven
-- `'next_cursor', (select min(created_at) from rows)` sin condición. Con una
-- página corta —o sea, la última— eso igual devuelve una fecha, así que el
-- cliente cree que hay más, muestra el botón, pide otra página, recibe cero
-- items... y vuelve a mostrar el botón. La lista no termina nunca.
--
-- Es exactamente el mismo error que ya se había corregido en
-- `feed_timeline_v2` (0044), donde quedó el comentario: "Página corta = no hay
-- más. Devolver un cursor igual haría que el cliente pidiera páginas vacías
-- para siempre y el scroll nunca terminara". Faltaba aplicarlo acá.
--
-- La regla: el cursor sale sólo si la página vino LLENA. Si trajo menos filas
-- que el límite pedido, no hay una página siguiente que pedir.

-- ═════════════════════════════════════════════════════════════════════════════
-- 1. Publicaciones y respuestas de un perfil
-- ═════════════════════════════════════════════════════════════════════════════

create or replace function profile_posts(
  p_user uuid, p_kind text default 'posts',
  p_cursor timestamptz default null, p_limit integer default 20
) returns jsonb
language sql stable security definer set search_path = public as $fn$
  with lim as (select greatest(1, least(50, coalesce(p_limit, 20))) as n),
  me as (select coalesce(account_type::text,'adult') as age from profiles where id = auth.uid()),
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
    from feed_posts f, me, vis, lim
    where vis.ok and f.author_id = p_user
      -- La única excepción: tus propias retenidas, en tu propio perfil (0060).
      and (not f.hidden or p_user = auth.uid())
      and me.age = any(f.age_groups)
      and (case when p_kind = 'replies' then f.kind = 'reply' else f.kind <> 'reply' end)
      and (p_cursor is null or f.created_at < p_cursor)
    order by f.created_at desc
    limit (select n from lim)
  )
  select jsonb_build_object(
    'items', coalesce((select jsonb_agg(feed_item_json(r.id) order by r.created_at desc) from rows r), '[]'::jsonb),
    'next_cursor', (select case when (select count(*) from rows) < (select n from lim)
                                then null else (select min(created_at) from rows) end));
$fn$;

-- ═════════════════════════════════════════════════════════════════════════════
-- 2. Guardados
-- ═════════════════════════════════════════════════════════════════════════════

create or replace function my_saved_posts(p_cursor timestamptz default null, p_limit integer default 20)
returns jsonb language sql stable security definer set search_path = public as $fn$
  with lim as (select greatest(1, least(50, coalesce(p_limit, 20))) as n),
  rows as (
    select s.post_id as id, s.created_at
    from feed_saves s join feed_posts f on f.id = s.post_id, lim
    where s.user_id = auth.uid() and not f.hidden
      and (p_cursor is null or s.created_at < p_cursor)
    order by s.created_at desc
    limit (select n from lim)
  )
  select jsonb_build_object(
    'items', coalesce((select jsonb_agg(feed_item_json(r.id) order by r.created_at desc) from rows r), '[]'::jsonb),
    'next_cursor', (select case when (select count(*) from rows) < (select n from lim)
                                then null else (select min(created_at) from rows) end));
$fn$;

-- ═════════════════════════════════════════════════════════════════════════════
-- 3. Seguidores y seguidos
-- ═════════════════════════════════════════════════════════════════════════════

create or replace function followers_of(p_user uuid, p_cursor timestamptz default null, p_limit integer default 30)
returns jsonb language sql stable security definer set search_path = public as $fn$
  with lim as (select greatest(1, least(60, coalesce(p_limit, 30))) as n),
  rows as (
    select fo.follower_id as id, fo.created_at
    from follows fo join profiles p on p.id = fo.follower_id, lim
    where fo.followee_id = p_user and p.account_type <> 'kid'
      and not exists (select 1 from user_blocks b
                      where (b.blocker_id = auth.uid() and b.blocked_id = p.id)
                         or (b.blocker_id = p.id and b.blocked_id = auth.uid()))
      and (p_cursor is null or fo.created_at < p_cursor)
    order by fo.created_at desc
    limit (select n from lim)
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
    'next_cursor', (select case when (select count(*) from rows) < (select n from lim)
                                then null else (select min(created_at) from rows) end));
$fn$;

create or replace function following_of(p_user uuid, p_cursor timestamptz default null, p_limit integer default 30)
returns jsonb language sql stable security definer set search_path = public as $fn$
  with lim as (select greatest(1, least(60, coalesce(p_limit, 30))) as n),
  rows as (
    select fo.followee_id as id, fo.created_at
    from follows fo join profiles p on p.id = fo.followee_id, lim
    where fo.follower_id = p_user and p.account_type <> 'kid'
      and not exists (select 1 from user_blocks b
                      where (b.blocker_id = auth.uid() and b.blocked_id = p.id)
                         or (b.blocker_id = p.id and b.blocked_id = auth.uid()))
      and (p_cursor is null or fo.created_at < p_cursor)
    order by fo.created_at desc
    limit (select n from lim)
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
    'next_cursor', (select case when (select count(*) from rows) < (select n from lim)
                                then null else (select min(created_at) from rows) end));
$fn$;
