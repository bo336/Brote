-- Brote — 0052 — Los LIMIT de las búsquedas no limitaban nada.
-- Feed v2 ("La Plaza") fase 2 — bug propio, encontrado al probar.
--
-- `select jsonb_agg(...) from ... limit 20` NO devuelve 20 elementos: el
-- agregado colapsa todo a UNA fila, así que el LIMIT recorta filas de resultado
-- (siempre 1) y el array sale entero. search_news devolvía 28 items pidiéndole
-- 5, y search_profiles arrastraba el mismo error desde la fase 1 — invisible con
-- 4 cuentas, pero con miles de noticias significaba mandar la tabla completa al
-- cliente. El recorte tiene que pasar ANTES de agregar.

create or replace function search_news(p_q text, p_limit integer default 20) returns jsonb
language sql stable security definer set search_path = public as $fn$
  with me as (select coalesce(account_type::text,'adult') as age from profiles where id = auth.uid()),
       q as (select btrim(coalesce(p_q,'')) as t),
  hits as (
    select n.id, n.title_es, n.summary_es, n.image_url, n.source, n.source_url,
           n.published_at, n.domain_tags
    from news n, q, me
    where length(q.t) >= 2
      and n.active
      and me.age = any(n.age_groups)
      and n.title_es ilike '%' || q.t || '%'
    order by n.published_at desc
    limit greatest(1, least(50, coalesce(p_limit, 20)))
  )
  select coalesce(jsonb_agg(jsonb_build_object(
      'id', id, 'title_es', title_es, 'summary_es', summary_es,
      'image_url', image_url, 'source', source, 'source_url', source_url,
      'published_at', published_at, 'domain_tags', domain_tags)
    order by published_at desc), '[]'::jsonb)
  from hits;
$fn$;

create or replace function search_profiles(p_q text, p_limit integer default 20) returns jsonb
language sql stable security definer set search_path = public as $fn$
  with q as (select btrim(coalesce(p_q,'')) as t),
  hits as (
    select p.id, p.username, p.display_name, p.avatar_url, p.pip_style,
           p.current_rank_slug, p.is_verified, p.followers_count, p.city, p.total_xp
    from profiles p, q
    where length(q.t) >= 2
      and p.account_type <> 'kid'
      and p.profile_visibility <> 'private'
      and (p.username::text ilike q.t || '%' or p.display_name ilike '%' || q.t || '%')
      and not exists (select 1 from user_blocks b
                      where (b.blocker_id = auth.uid() and b.blocked_id = p.id)
                         or (b.blocker_id = p.id and b.blocked_id = auth.uid()))
    order by p.followers_count desc, p.total_xp desc
    limit greatest(1, least(50, coalesce(p_limit, 20)))
  )
  select coalesce(jsonb_agg(jsonb_build_object(
      'id', id, 'username', username, 'display_name', display_name,
      'avatar_url', avatar_url, 'pip_style', pip_style, 'rank_slug', current_rank_slug,
      'is_verified', is_verified, 'followers_count', followers_count, 'city', city,
      'is_following', exists (select 1 from follows f where f.follower_id = auth.uid() and f.followee_id = hits.id))
    order by followers_count desc, total_xp desc), '[]'::jsonb)
  from hits;
$fn$;

-- suggested_accounts ya recortaba adentro de la subconsulta, así que estaba bien.

revoke all on function search_news(text,integer), search_profiles(text,integer) from public, anon;
grant execute on function search_news(text,integer), search_profiles(text,integer) to authenticated;
