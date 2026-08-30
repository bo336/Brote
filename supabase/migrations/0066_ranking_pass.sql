-- Brote — 0066 — Pasada de ranking con datos reales.
-- Feed v2 ("La Plaza") fase 3, paso 2.
--
-- MEDIDO, no supuesto. Con el archivo real (573 noticias, 3 publicaciones) la
-- primera página de "Para vos" daba:
--
--   19 noticias / 1 publicación          → 95 % noticias
--   EcoInventos 6, Ecoticias 6, EFEverde 5 → 17 de 20 lugares en tres medios
--
-- Los dos son problemas de estructura, no de volumen: con más gente publicando
-- el archivo de noticias sigue siendo dos órdenes de magnitud más grande y
-- creciendo ~30 por día. Dos correcciones, las dos compatibles con el cursor
-- (son términos del puntaje, se calculan antes de comparar contra el cursor):
--
-- 1. DIVERSIDAD DE FUENTE. Ya había diversidad de AUTOR —cada item extra de la
--    misma persona cuesta 15— pero la rama estaba exenta para `author_id is
--    null`, y todas las noticias tienen autor nulo. O sea: la diversidad no se
--    aplicaba jamás al 99 % del feed. Ahora el mismo mecanismo, partido por
--    medio: cada nota extra del mismo medio cuesta 12. La sexta de Ecoticias
--    pierde 60 puntos, que es más de lo que separa un día de antigüedad, así
--    que los medios se intercalan sin enterrar una nota realmente fuerte.
--
-- 2. PISO PARA LO HUMANO. Una publicación de una persona ahora arranca 45
--    puntos por encima de una noticia igual de reciente, y seguir a alguien
--    pasa de +60 a +80. El spec ofrecía dos caminos —subir el follow_boost o un
--    piso duro del 40 % intercalando dos listas— y acá va el primero a
--    propósito: intercalar dos listas rankeadas rompe el invariante del cursor
--    (un solo puntaje decreciente), y perder la paginación por keyset para
--    ganar un porcentaje fijo sería cambiar un problema real por otro peor.
--
-- Resultado con los mismos datos, después: ver el bloque de verificación en
-- IMPROVEMENT_PLAN.md.

create or replace function feed_timeline_v2(
  p_tab            text        default 'para_vos',   -- para_vos | siguiendo | novedades
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
    -- Los chicos solo reciben novedades, pida lo que pida el cliente. Esconder
    -- la pestaña en la UI no es aplicar la regla.
    select case when (select age from me) = 'kid' then 'novedades'
                else coalesce(p_tab,'para_vos') end as t
  ),
  hidden_authors as (
    select blocked_id as id from user_blocks where blocker_id = (select id from me)
    union select blocker_id from user_blocks where blocked_id = (select id from me)
    union select muted_id  from user_mutes  where muter_id   = (select id from me)
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
           or f.author_id in (select followee_id from follows where follower_id = me.id))
      and (me.age <> 'kid' or f.kind = 'news')
  ),
  scored as (
    select v.id, v.created_at, v.author_id,
           (select n.source from news n where n.id = v.news_id) as source,
           case
             -- "Siguiendo" es estrictamente cronológico por spec: ordenarlo por
             -- score lo volvería indistinguible de "Para vos". Usar el epoch como
             -- puntaje deja el mismo mecanismo de cursor funcionando igual.
             when (select t from tab) = 'siguiendo'
               then round(extract(epoch from v.created_at)::numeric, 6)
             else round((
                 greatest(0.05, power(0.5, extract(epoch from (p_now - v.created_at)) / 129600.0)) * 100
               + (v.like_count * 2 + v.reply_count * 3 + coalesce(v.repost_count,0) * 4 - v.dislike_count * 2) * 4
               + (select count(*) from unnest(coalesce(v.domain_tags,'{}')) t where t = any(me.interests)) * 12
               + (coalesce((select n.interest_score from news n where n.id = v.news_id), 50) - 50) * 1.5
               -- Piso para lo humano: alguien contando lo que hizo vale más que
               -- una nota del mismo momento. Sin esto el archivo de noticias
               -- gana siempre por volumen (medido: 95 % de la primera página).
               + (case when v.kind <> 'news' then 45 else 0 end)
               + (case when v.author_id in (select followee_id from follows where follower_id = me.id)
                       then 80 else 0 end)
               + (case when v.author_id is not null
                         and exists (select 1 from follows f2
                                     where f2.follower_id = v.author_id and f2.followee_id = me.id)
                       then 25 else 0 end)
               + (case when v.author_id is not null and me.city is not null
                         and me.city = (select city from profiles p2 where p2.id = v.author_id)
                       then 18 else 0 end)
               + least(48, coalesce((select log(10, 1 + greatest(0, p3.total_xp)) from profiles p3
                                     where p3.id = v.author_id), 0) * 8)
               + (case when v.author_id is not null
                         and coalesce((select posts_count from profiles p4 where p4.id = v.author_id), 0) < 3
                       then 20 else 0 end)
               - (case when exists (select 1 from feed_seen s
                                     where s.user_id = me.id and s.post_id = v.id
                                       and s.seen_at > p_now - interval '72 hours')
                       then 45 else 0 end)
               - (case when v.author_id = me.id then 30 else 0 end)
             )::numeric, 6)
           end as score
    from visible v, me
  ),
  ranked as (
    -- Diversidad. Cada item extra de la misma PERSONA cuesta 15; cada nota
    -- extra del mismo MEDIO cuesta 12. La segunda rama es nueva: antes las
    -- noticias quedaban exentas por tener `author_id` nulo, así que la
    -- diversidad no tocaba al 99 % del feed. No aplica en "Siguiendo", donde el
    -- orden cronológico es justamente el punto.
    select s.id, s.created_at, s.author_id,
           case
             when (select t from tab) = 'siguiendo' then s.score
             when s.author_id is not null
               then s.score - 15 * (row_number() over (partition by s.author_id order by s.score desc) - 1)
             when s.source is not null
               then s.score - 12 * (row_number() over (partition by s.source order by s.score desc) - 1)
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
    -- Página corta = no hay más. Devolver un cursor igual haría que el cliente
    -- pidiera páginas vacías para siempre y el scroll nunca terminara.
    'next_cursor', (
      select case when (select count(*) from paged) < (select n from lim) then null
                  else (select jsonb_build_object('score', score, 'created_at', created_at, 'id', id)
                        from paged order by score asc, created_at asc, id asc limit 1)
             end)
  );
$fn$;
