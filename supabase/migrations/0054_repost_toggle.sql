-- Brote — 0054 — Replantar como interruptor.
-- Feed v2 ("La Plaza") fase 2, paso 3.
--
-- El spec pide que replantar dos veces la misma publicación la des-replante.
-- Para eso hacen falta dos cosas que faltaban:
--
-- 1. Que el item sepa si YA lo replantaste. Va en `feed_item_json` y no en una
--    consulta aparte del cliente por el mismo motivo de siempre: es la única
--    función que le da forma al payload, así que timeline, hilo y permalink
--    no pueden desincronizarse. Un `exists` más sobre un índice que ya está
--    (`idx_feed_repost_of`).
--
-- 2. Que exista un camino de escritura que borre EL replante propio y nada
--    más. Sin esto el cliente tendría que buscar el id de su repost y llamar a
--    `delete_feed_post`, o sea dos viajes y una ventana en la que el borrado
--    puede apuntar a algo que no es suyo. `unrepost` lo resuelve del lado del
--    servidor y devuelve el contador ya corregido, igual que `react_to_post`.

-- ═════════════════════════════════════════════════════════════════════════════
-- 1. El item sabe si ya lo replantaste
-- ═════════════════════════════════════════════════════════════════════════════

create or replace function feed_item_json(p_id uuid) returns jsonb
language sql stable security definer set search_path = public as $fn$
  select jsonb_build_object(
    'id', f.id, 'kind', f.kind::text, 'created_at', f.created_at, 'edited_at', f.edited_at,
    'body', f.body, 'image_url', f.image_url, 'domain_tags', coalesce(f.domain_tags,'{}'),
    'like_count', f.like_count, 'dislike_count', f.dislike_count,
    'reply_count', f.reply_count, 'repost_count', coalesce(f.repost_count,0),
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

-- ═════════════════════════════════════════════════════════════════════════════
-- 2. Des-replantar
-- ═════════════════════════════════════════════════════════════════════════════

create or replace function unrepost(p_post_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_uid uuid := auth.uid();
  v_deleted integer := 0;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'Iniciá sesión');
  end if;

  -- Solo los replantes propios, y solo los que son replantes puros o citas de
  -- ESTA publicación. El `author_id` es lo que hace que esto sea seguro.
  delete from feed_posts
  where repost_of = p_post_id and author_id = v_uid;
  get diagnostics v_deleted = row_count;

  return jsonb_build_object(
    'ok', true,
    'removed', v_deleted,
    'repost_count', coalesce((select repost_count from feed_posts where id = p_post_id), 0)
  );
end;
$fn$;

revoke all on function unrepost(uuid) from public, anon, authenticated;
grant execute on function unrepost(uuid) to authenticated;
