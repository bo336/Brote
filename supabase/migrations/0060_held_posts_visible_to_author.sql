-- Brote — 0060 — Una publicación retenida se le sigue viendo a quien la escribió.
-- Feed v2 ("La Plaza") fase 2, paso 6.
--
-- Cuando el texto engancha la lista de palabras, `create_feed_post_v2` lo
-- guarda con `hidden = true` en vez de descartarlo — retener y no comerse en
-- silencio lo que alguien escribió (05 §6). Pero después NADIE lo veía, ni
-- quien lo escribió: para esa persona la publicación simplemente desaparecía,
-- que es justo la sensación que la moderación blanda quería evitar.
--
-- Se abre una sola rendija: en TU PROPIO perfil ves tus publicaciones
-- retenidas, con el cartel "En revisión". Para cualquier otra persona siguen
-- sin existir. Es la excepción mínima que hace que el aviso sea verdad.
--
-- Se agrega `hidden` a `feed_item_json` para que el cliente sepa cuál pintar
-- con el cartel: en todas las otras superficies ese campo siempre viene en
-- false, porque los ocultos ya están filtrados antes.

create or replace function feed_item_json(p_id uuid) returns jsonb
language sql stable security definer set search_path = public as $fn$
  select jsonb_build_object(
    'id', f.id, 'kind', f.kind::text, 'created_at', f.created_at, 'edited_at', f.edited_at,
    'body', f.body, 'image_url', f.image_url, 'domain_tags', coalesce(f.domain_tags,'{}'),
    'like_count', f.like_count, 'dislike_count', f.dislike_count,
    'reply_count', f.reply_count, 'repost_count', coalesce(f.repost_count,0),
    'hidden', f.hidden,
    'my_reaction', (select r.value from feed_reactions r where r.post_id = f.id and r.user_id = auth.uid()),
    'saved', exists (select 1 from feed_saves sv where sv.post_id = f.id and sv.user_id = auth.uid()),
    'reposted', exists (
      select 1 from feed_posts rp
      where rp.repost_of = f.id and rp.author_id = auth.uid() and not rp.hidden),
    'author', case when f.author_id is null then null else (
      select jsonb_build_object('id', p.id, 'username', p.username, 'display_name', p.display_name,
        'avatar_url', p.avatar_url, 'pip_style', p.pip_style, 'rank_slug', p.current_rank_slug,
        'is_verified', p.is_verified, 'city', p.city, 'total_xp', p.total_xp,
        'is_following', exists (select 1 from follows fo where fo.follower_id = auth.uid() and fo.followee_id = p.id))
      from profiles p where p.id = f.author_id) end,
    'news', case when f.news_id is null then null else (
      select jsonb_build_object('id', n.id, 'title_es', n.title_es, 'summary_es', n.summary_es,
        'image_url', n.image_url, 'source', n.source, 'source_url', n.source_url,
        'published_at', n.published_at)
      from news n where n.id = f.news_id) end,
    'repost_of', case when f.repost_of is null then null else (
      select jsonb_build_object('id', o.id, 'body', o.body, 'image_url', o.image_url,
        'created_at', o.created_at,
        'author', (select jsonb_build_object('id', p2.id, 'username', p2.username,
                     'display_name', p2.display_name, 'pip_style', p2.pip_style,
                     'avatar_url', p2.avatar_url, 'rank_slug', p2.current_rank_slug)
                   from profiles p2 where p2.id = o.author_id))
      from feed_posts o where o.id = f.repost_of) end
  ) from feed_posts f where f.id = p_id;
$fn$;

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
    where vis.ok and f.author_id = p_user
      -- La única excepción: tus propias retenidas, en tu propio perfil.
      and (not f.hidden or p_user = auth.uid())
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
