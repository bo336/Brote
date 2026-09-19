-- Brote — 0070 — Que el puntaje de diversidad no dependa del plan.
-- Feed v2 ("La Plaza") fase 3, paso 2 (endurecimiento).
--
-- Honestidad primero: llegué acá persiguiendo un fantasma. Recorriendo el
-- timeline entero desde SQL me daba 916 items servidos contra 576 ids
-- distintos, o sea 340 repeticiones, y lo di por bug del ranking. No lo era:
-- el bug estaba en MI banco de pruebas. En plpgsql, `v->'next_cursor'` sobre
-- un null de JSON devuelve `'null'::jsonb`, que NO es NULL de SQL, así que el
-- `exit when v_cur is null` nunca se cumplía y el bucle volvía a empezar desde
-- la primera página. Medido de nuevo con `jsonb_typeof(v_cur) = 'null'`:
--
--   páginas 29 · items 576 · distintos 576 · duplicados 0
--
-- El feed estaba bien. (`scripts/check-feed-cursor.mjs` nunca tuvo el problema:
-- ahí el null de JSON llega como null de JavaScript.)
--
-- Aun así este cambio queda, porque el riesgo que fui a buscar es real aunque
-- todavía no se haya manifestado. La ventana de diversidad ordenaba así:
--
--     row_number() over (partition by s.source order by s.score desc)
--
-- y muchas filas empatan en `score` (noticias del mismo medio, misma
-- antigüedad, sin interacciones, mismo interest_score). Postgres no promete
-- ningún orden entre filas que empatan: puede repartir 1,2,3… distinto si
-- cambia el plan. Y si el puntaje final de una fila cambia entre páginas, el
-- cursor deja de garantizar lo único que garantiza. Agregar
-- `created_at desc, id desc` —los mismos desempates que ya usa el cursor—
-- vuelve el puntaje una función pura de la fila, con `p_now` fijo.
--
-- Cuesta nada y elimina una clase entera de bug difícil de reproducir.

create or replace function feed_timeline_v2(
  p_tab            text        default 'para_vos',
  p_topic          text        default null,
  p_limit          integer     default 20,
  p_now            timestamptz default now(),
  p_cursor_score   numeric     default null,
  p_cursor_created timestamptz default null,
  p_cursor_id      uuid        default null
) returns jsonb
language sql stable security definer set search_path = public as $fn$
  with me as (
    select p.id,
           coalesce(p.account_type::text,'adult') as age,
           coalesce(p.interests,'{}')             as interests,
           p.city
    from profiles p where p.id = auth.uid()
  ),
  lim as (select greatest(1, least(50, coalesce(p_limit, 20))) as n),
  tab as (
    select case when (select age from me) = 'kid' then 'novedades'
                else coalesce(p_tab,'para_vos') end as t
  ),
  my_follows   as (select followee_id as id from follows where follower_id = (select id from me)),
  my_followers as (select follower_id as id from follows where followee_id = (select id from me)),
  hidden_authors as (
    select blocked_id as id from user_blocks where blocker_id = (select id from me)
    union select blocker_id from user_blocks where blocked_id = (select id from me)
    union select muted_id  from user_mutes  where muter_id   = (select id from me)
  ),
  seen as (
    select post_id from feed_seen
    where user_id = (select id from me) and seen_at > p_now - interval '72 hours'
  ),
  visible as (
    select f.*
    from feed_posts f, me, tab
    where f.kind <> 'reply'
      and not f.hidden
      and me.age = any(f.age_groups)
      and (f.author_id is null or f.author_id not in (select id from hidden_authors))
      and (p_topic is null or p_topic = 'all' or f.domain_tags @> array[p_topic])
      and (tab.t <> 'novedades' or f.kind = 'news')
      and (tab.t <> 'siguiendo' or f.author_id = me.id
           or f.author_id in (select id from my_follows))
      and (me.age <> 'kid' or f.kind = 'news')
  ),
  scored as (
    select v.id, v.created_at, v.author_id, n.source,
           case
             when (select t from tab) = 'siguiendo'
               then round(extract(epoch from v.created_at)::numeric, 6)
             else round((
                 greatest(0.05, power(0.5, extract(epoch from (p_now - v.created_at)) / 129600.0)) * 100
               + (v.like_count * 2 + v.reply_count * 3 + coalesce(v.repost_count,0) * 4 - v.dislike_count * 2) * 4
               + (select count(*) from unnest(coalesce(v.domain_tags,'{}')) t where t = any(me.interests)) * 12
               + (coalesce(n.interest_score, 50) - 50) * 1.5
               + (case when v.kind <> 'news' then 45 else 0 end)
               + (case when v.author_id in (select id from my_follows) then 80 else 0 end)
               + (case when v.author_id in (select id from my_followers) then 25 else 0 end)
               + (case when au.city is not null and me.city = au.city then 18 else 0 end)
               + least(48, coalesce(log(10, 1 + greatest(0, au.total_xp)), 0) * 8)
               + (case when v.author_id is not null and coalesce(au.posts_count, 0) < 3 then 20 else 0 end)
               - (case when v.id in (select post_id from seen) then 45 else 0 end)
               - (case when v.author_id = me.id then 30 else 0 end)
             )::numeric, 6)
           end as score
    from visible v
    cross join me
    left join news     n  on n.id  = v.news_id
    left join profiles au on au.id = v.author_id
  ),
  ranked as (
    -- Diversidad: cada item extra de la misma PERSONA cuesta 15; cada nota
    -- extra del mismo MEDIO cuesta 12.
    --
    -- El `created_at desc, id desc` del ORDER BY de la ventana NO es cosmético:
    -- sin él, los empates de `score` hacen que `row_number()` devuelva un orden
    -- distinto en cada llamada, el puntaje final de una fila cambia entre
    -- páginas y el cursor deja de servir. Son los mismos desempates que usa el
    -- cursor, a propósito.
    select s.id, s.created_at, s.author_id,
           case
             when (select t from tab) = 'siguiendo' then s.score
             when s.author_id is not null
               then s.score - 15 * (row_number() over (
                      partition by s.author_id
                      order by s.score desc, s.created_at desc, s.id desc) - 1)
             when s.source is not null
               then s.score - 12 * (row_number() over (
                      partition by s.source
                      order by s.score desc, s.created_at desc, s.id desc) - 1)
             else s.score
           end as final_score
    from scored s
  ),
  paged as (
    select r.id, r.created_at, round(r.final_score, 6) as score
    from ranked r
    where p_cursor_score is null
       or (round(r.final_score,6), r.created_at, r.id) < (p_cursor_score, p_cursor_created, p_cursor_id)
    order by score desc, created_at desc, id desc
    limit (select n from lim)
  )
  select jsonb_build_object(
    'items', coalesce((
      select jsonb_agg(feed_item_json(pg.id) order by pg.score desc, pg.created_at desc, pg.id desc)
      from paged pg
    ), '[]'::jsonb),
    'next_cursor', (
      select case when (select count(*) from paged) < (select n from lim) then null
                  else (select jsonb_build_object('score', score, 'created_at', created_at, 'id', id)
                        from paged order by score asc, created_at asc, id asc limit 1)
             end)
  );
$fn$;
