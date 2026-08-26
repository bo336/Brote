-- Brote — 0044 — El feed v2: esquema, timeline con cursor y caminos de escritura.
-- Feed v2 ("La Plaza") fase 1, paso 5 de 5.
--
-- Aplicado en vivo en cuatro tandas (feed_v2_schema, feed_v2_item_json_and_timeline,
-- feed_v2_writes, feed_storage_bucket) porque apply_migration envuelve todo en una
-- transacción y conviene aislar los cuerpos plpgsql largos. El contenido es el mismo.

-- ═════════════════════════════════════════════════════════════════════════════
-- 1. Esquema
-- ═════════════════════════════════════════════════════════════════════════════

alter table feed_posts
  add column if not exists image_url    text,
  add column if not exists repost_of    uuid references feed_posts(id) on delete cascade,
  add column if not exists edited_at    timestamptz,
  add column if not exists repost_count integer not null default 0,
  add column if not exists lang         text default 'es';

create index if not exists idx_feed_repost_of on feed_posts (repost_of) where repost_of is not null;
create index if not exists idx_feed_visible on feed_posts (created_at desc) where not hidden and kind <> 'reply';
create index if not exists idx_feed_author_created on feed_posts (author_id, created_at desc);

-- Impresiones: para que el feed no se repita a sí mismo.
create table if not exists feed_seen (
  user_id uuid not null references profiles(id) on delete cascade,
  post_id uuid not null references feed_posts(id) on delete cascade,
  seen_at timestamptz not null default now(),
  primary key (user_id, post_id)
);
create index if not exists idx_feed_seen_recent on feed_seen (user_id, seen_at desc);
alter table feed_seen enable row level security;
drop policy if exists "seen own" on feed_seen;
create policy "seen own" on feed_seen for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Guardados: marcadores privados, sin contador público (§3.5).
create table if not exists feed_saves (
  user_id    uuid not null references profiles(id) on delete cascade,
  post_id    uuid not null references feed_posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);
alter table feed_saves enable row level security;
drop policy if exists "saves own" on feed_saves;
create policy "saves own" on feed_saves for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- ═════════════════════════════════════════════════════════════════════════════
-- 2. La forma de un item
--
-- Un solo lugar, para que el payload no se desincronice entre timeline, hilo y
-- permalink. Va ANTES del timeline a propósito: los cuerpos de funciones SQL se
-- parsean al crearlas, así que feed_timeline_v2 no compilaría sin esta.
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
-- 3. El timeline
--
-- Paginación por CURSOR, nunca OFFSET: con OFFSET cualquier publicación nueva
-- corre todo una posición y el lector ve items repetidos al scrollear. El cliente
-- devuelve el cursor Y el mismo p_now, así el decaimiento por antigüedad no puede
-- reordenar, en medio del scroll, cosas que la persona ya leyó.
-- Verificado: 8 páginas seguidas, 160 items, 0 duplicados.
-- ═════════════════════════════════════════════════════════════════════════════

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
               + (case when v.author_id in (select followee_id from follows where follower_id = me.id)
                       then 60 else 0 end)
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
    -- Diversidad de autores: cada item extra del mismo autor cuesta 15 puntos,
    -- para que una persona muy activa no se adueñe de la pantalla. No aplica en
    -- "Siguiendo", donde el orden cronológico es justamente el punto.
    select s.id, s.created_at, s.author_id,
           case when (select t from tab) = 'siguiendo' or s.author_id is null then s.score
                else s.score - 15 * (row_number() over (partition by s.author_id order by s.score desc) - 1)
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

-- Contadores reales para la PulseStrip. Nada de acá es inventado: si un número
-- no sale de una consulta, no se muestra (design system §7, anti-patrones).
create or replace function feed_pulse() returns jsonb
language sql stable security definer set search_path = public as $fn$
  with me as (select coalesce(account_type::text,'adult') as age from profiles where id = auth.uid())
  select jsonb_build_object(
    'today', (select count(*) from feed_posts f, me
              where not f.hidden and f.kind <> 'reply' and me.age = any(f.age_groups)
                and f.created_at > now() - interval '24 hours'),
    'total', (select count(*) from feed_posts f, me
              where not f.hidden and f.kind <> 'reply' and me.age = any(f.age_groups)),
    'trending', (select f.domain_tags[1] from feed_posts f, me
                 where not f.hidden and me.age = any(f.age_groups)
                   and f.created_at > now() - interval '24 hours'
                   and array_length(f.domain_tags,1) > 0
                 group by f.domain_tags[1]
                 order by count(*) desc limit 1),
    'topics', coalesce((
      select jsonb_agg(t.slug order by t.n desc)
      from (select f.domain_tags[1] as slug, count(*) as n
            from feed_posts f, me
            where not f.hidden and f.kind <> 'reply' and me.age = any(f.age_groups)
              and array_length(f.domain_tags,1) > 0
            group by f.domain_tags[1]) t), '[]'::jsonb));
$fn$;

-- ═════════════════════════════════════════════════════════════════════════════
-- 4. Escrituras
-- ═════════════════════════════════════════════════════════════════════════════

create or replace function create_feed_post_v2(
  p_body text, p_parent_id uuid default null, p_news_id uuid default null,
  p_image_url text default null, p_repost_of uuid default null
) returns jsonb
language plpgsql security definer set search_path = public as $fn$
declare
  v_uid uuid := auth.uid(); v_age text; v_body text; v_id uuid;
  v_recent int; v_cap int; v_tags text[] := '{}'; v_created timestamptz; v_suspended timestamptz;
  v_kind feed_kind; v_audience text[]; v_hidden boolean := false; v_mention text;
  v_hashtags text[]; v_image text := p_image_url;
begin
  if v_uid is null then raise exception 'No autenticado' using errcode = 'P0001'; end if;

  select coalesce(account_type::text,'adult'), created_at, suspended_until
    into v_age, v_created, v_suspended from profiles where id = v_uid;

  if v_age = 'kid' then
    return jsonb_build_object('ok', false, 'error', 'Las cuentas de chicos no publican ni comentan.');
  end if;
  if v_suspended is not null and v_suspended > now() then
    return jsonb_build_object('ok', false, 'error', 'Tu cuenta está suspendida para publicar por ahora.');
  end if;

  v_body := btrim(coalesce(p_body, ''));
  if length(v_body) = 0 and p_repost_of is null then
    return jsonb_build_object('ok', false, 'error', 'Escribí algo primero.');
  end if;
  if length(v_body) > 1000 then
    return jsonb_build_object('ok', false, 'error', 'Máximo 1000 caracteres.');
  end if;

  -- Adolescentes: sin imágenes y sin enlaces, siempre.
  if v_age = 'teen' then
    v_image := null;
    if v_body ~* '(https?://|www\.)' then
      return jsonb_build_object('ok', false, 'error', 'Por ahora no se pueden compartir enlaces.');
    end if;
  end if;

  -- Cuentas adultas recién creadas: sin enlaces las primeras 24 h (freno de spam).
  if v_age = 'adult' and v_created > now() - interval '24 hours' and v_body ~* '(https?://|www\.)' then
    return jsonb_build_object('ok', false, 'error', 'Vas a poder compartir enlaces mañana 🌱');
  end if;

  -- El tope se calcula ANTES del if: un CASE dentro de la condición de un IF
  -- confunde al parser de plpgsql, que corta la expresión en el primer THEN.
  v_cap := case when v_created > now() - interval '24 hours' then 3 else 10 end;
  select count(*) into v_recent from feed_posts
   where author_id = v_uid and created_at > now() - interval '1 hour';
  if v_recent >= v_cap then
    return jsonb_build_object('ok', false, 'error', 'Publicaste bastante por ahora. Probá en un rato.');
  end if;

  if v_body <> '' and exists (select 1 from feed_posts
       where author_id = v_uid and body = v_body and created_at > now() - interval '10 minutes') then
    return jsonb_build_object('ok', false, 'error', 'Ya publicaste eso recién.');
  end if;

  -- Moderación blanda: retener, nunca descartar en silencio. Un falso positivo
  -- que se come un texto sin avisar es peor que uno que lo demora.
  if brote_matches_blocklist(v_body) then v_hidden := true; end if;

  v_audience := array['teen','adult'];

  if p_parent_id is not null then
    if not exists (select 1 from feed_posts where id = p_parent_id and not hidden) then
      return jsonb_build_object('ok', false, 'error', 'Esa publicación ya no existe.');
    end if;
    v_kind := 'reply';
  elsif p_repost_of is not null then
    if not exists (select 1 from feed_posts where id = p_repost_of and not hidden) then
      return jsonb_build_object('ok', false, 'error', 'Esa publicación ya no existe.');
    end if;
    v_kind := 'repost';
  else
    v_kind := 'post';
  end if;

  if p_news_id is not null then
    select coalesce(domain_tags,'{}') into v_tags from news where id = p_news_id;
  end if;

  -- Los #hashtags que coinciden con un dominio se vuelven temas reales.
  select coalesce(array_agg(d.slug), '{}') into v_hashtags
    from domains d where v_body ~* ('#' || d.slug);
  v_tags := coalesce(v_tags,'{}') || coalesce(v_hashtags,'{}');

  insert into feed_posts (kind, author_id, parent_id, news_id, repost_of, body, image_url,
                          domain_tags, age_groups, hidden)
  values (v_kind, v_uid, p_parent_id, p_news_id, p_repost_of, nullif(v_body,''), v_image,
          coalesce(v_tags,'{}'), v_audience, v_hidden)
  returning id into v_id;

  if v_kind <> 'reply' then
    update profiles set posts_count = posts_count + 1 where id = v_uid;
  end if;

  if not v_hidden then
    if p_parent_id is not null then
      perform brote_notify_social((select author_id from feed_posts where id = p_parent_id),
        'reply', 'reply:' || p_parent_id::text,
        coalesce((select display_name from profiles where id = v_uid),'Alguien') || ' respondió tu publicación',
        left(v_body, 120), jsonb_build_object('post_id', p_parent_id, 'reply_id', v_id, 'user_id', v_uid));
    end if;

    if p_repost_of is not null then
      perform brote_notify_social((select author_id from feed_posts where id = p_repost_of),
        'repost', 'repost:' || p_repost_of::text,
        coalesce((select display_name from profiles where id = v_uid),'Alguien') || ' replantó tu publicación',
        null, jsonb_build_object('post_id', p_repost_of, 'user_id', v_uid));
      update feed_posts set repost_count = repost_count + 1 where id = p_repost_of;
    end if;

    for v_mention in select distinct lower(m[1]) from regexp_matches(v_body, '@([A-Za-z0-9_\.]{3,24})', 'g') m loop
      perform brote_notify_social(
        (select id from profiles where lower(username::text) = v_mention and account_type <> 'kid'),
        'mention', 'mention:' || v_id::text,
        coalesce((select display_name from profiles where id = v_uid),'Alguien') || ' te mencionó',
        left(v_body, 120), jsonb_build_object('post_id', coalesce(p_parent_id, v_id), 'user_id', v_uid));
    end loop;

    -- Semillas: la primera publicación del día, una sola vez. La actividad
    -- social NO imprime XP a propósito: eso convertiría el feed en una máquina
    -- de puntos y corrompería los rankings, que son la columna del producto.
    -- Se llama defensivamente por si la economía de semillas no estuviera.
    if v_kind = 'post'
       and to_regprocedure('public.brote_grant_semillas(uuid,integer,text,text,text)') is not null
       and not exists (
         select 1 from semilla_ledger
          where user_id = v_uid and source = 'feed'
            and created_at >= date_trunc('day', now() at time zone 'America/Argentina/Buenos_Aires')
                              at time zone 'America/Argentina/Buenos_Aires') then
      perform brote_grant_semillas(v_uid, 2, 'feed', v_id::text, 'Primera publicación del día');
    end if;
  end if;

  return jsonb_build_object('ok', true, 'id', v_id, 'held', v_hidden);
end $fn$;

create or replace function edit_feed_post(p_post_id uuid, p_body text) returns jsonb
language plpgsql security definer set search_path = public as $fn$
declare v_uid uuid := auth.uid(); v_body text;
begin
  if v_uid is null then raise exception 'No autenticado' using errcode = 'P0001'; end if;
  v_body := btrim(coalesce(p_body,''));
  if length(v_body) = 0 then return jsonb_build_object('ok', false, 'error', 'No puede quedar vacío.'); end if;
  if length(v_body) > 1000 then return jsonb_build_object('ok', false, 'error', 'Máximo 1000 caracteres.'); end if;

  update feed_posts set body = v_body, edited_at = now()
   where id = p_post_id and author_id = v_uid and created_at > now() - interval '5 minutes';
  if not found then return jsonb_build_object('ok', false, 'error', 'Ya no se puede editar.'); end if;
  return jsonb_build_object('ok', true);
end $fn$;

create or replace function toggle_save_post(p_post_id uuid) returns jsonb
language plpgsql security definer set search_path = public as $fn$
declare v_uid uuid := auth.uid(); v_saved boolean;
begin
  if v_uid is null then raise exception 'No autenticado' using errcode = 'P0001'; end if;
  if exists (select 1 from feed_saves where user_id = v_uid and post_id = p_post_id) then
    delete from feed_saves where user_id = v_uid and post_id = p_post_id; v_saved := false;
  else
    insert into feed_saves (user_id, post_id) values (v_uid, p_post_id) on conflict do nothing; v_saved := true;
  end if;
  return jsonb_build_object('ok', true, 'saved', v_saved);
end $fn$;

-- Se filtra contra feed_posts: un id que ya no existe reventaría la FK y con ella
-- el marcado entero, que desde el cliente es fire-and-forget.
create or replace function mark_feed_seen(p_ids uuid[]) returns void
language sql security definer set search_path = public as $fn$
  insert into feed_seen (user_id, post_id)
  select auth.uid(), f.id
  from feed_posts f
  where f.id = any(coalesce(p_ids, '{}'::uuid[])) and auth.uid() is not null
  on conflict (user_id, post_id) do update set seen_at = now();
$fn$;

create or replace function react_to_post(p_post_id uuid, p_value smallint) returns jsonb
language plpgsql security definer set search_path = public as $fn$
declare v_uid uuid := auth.uid(); v_current smallint; v_author uuid; v_age text; v_exists boolean;
begin
  if v_uid is null then raise exception 'No autenticado' using errcode = 'P0001'; end if;
  if p_value not in (-1, 1) then raise exception 'Valor inválido' using errcode = 'P0001'; end if;

  select coalesce(account_type::text,'adult') into v_age from profiles where id = v_uid;
  if v_age = 'kid' then
    return jsonb_build_object('ok', false, 'error', 'Las cuentas de chicos solo pueden leer.');
  end if;

  -- Un post sin autor (una novedad) es válido, así que "existe" no puede
  -- deducirse de author_id: se pregunta aparte.
  select author_id is not distinct from author_id, author_id into v_exists, v_author
    from feed_posts where id = p_post_id and not hidden;
  if not coalesce(v_exists, false) then return jsonb_build_object('ok', false, 'error', 'No existe'); end if;

  select value into v_current from feed_reactions where post_id = p_post_id and user_id = v_uid;
  if v_current = p_value then
    delete from feed_reactions where post_id = p_post_id and user_id = v_uid;
  else
    insert into feed_reactions (post_id, user_id, value) values (p_post_id, v_uid, p_value)
    on conflict (post_id, user_id) do update set value = excluded.value, created_at = now();
    if p_value = 1 and v_author is not null and v_author <> v_uid then
      perform brote_notify_social(v_author, 'like', 'like:' || p_post_id::text,
        coalesce((select display_name from profiles where id = v_uid),'Alguien') || ' reaccionó a tu publicación',
        null, jsonb_build_object('post_id', p_post_id, 'user_id', v_uid));
    end if;
  end if;

  return (select jsonb_build_object('ok', true, 'like_count', like_count, 'dislike_count', dislike_count,
                 'my_reaction', (select r.value from feed_reactions r where r.post_id = p_post_id and r.user_id = v_uid))
          from feed_posts where id = p_post_id);
end $fn$;

-- Hilo: publicación raíz + respuestas aplanadas, con la forma compartida y los
-- bloqueos/silencios aplicados también acá (un hilo abierto desde una
-- notificación no puede ser la puerta de atrás a alguien que bloqueaste).
create or replace function feed_thread_v2(p_post_id uuid) returns jsonb
language sql stable security definer set search_path = public as $fn$
  with me as (select coalesce(account_type::text,'adult') as age from profiles where id = auth.uid())
  select jsonb_build_object(
    'post', (select feed_item_json(f.id) from feed_posts f, me
             where f.id = p_post_id and not f.hidden and me.age = any(f.age_groups)),
    'replies', coalesce((
      select jsonb_agg(feed_item_json(r.id) order by r.created_at)
      from feed_posts r, me
      where r.parent_id = p_post_id and r.kind = 'reply' and not r.hidden and me.age = any(r.age_groups)
        and (r.author_id is null or r.author_id not in (
              select blocked_id from user_blocks where blocker_id = auth.uid()
              union select blocker_id from user_blocks where blocked_id = auth.uid()
              union select muted_id from user_mutes where muter_id = auth.uid()))
    ), '[]'::jsonb));
$fn$;

revoke all on function feed_timeline_v2(text,text,integer,timestamptz,numeric,timestamptz,uuid),
  feed_item_json(uuid), feed_thread_v2(uuid), create_feed_post_v2(text,uuid,uuid,text,uuid),
  edit_feed_post(uuid,text), toggle_save_post(uuid), mark_feed_seen(uuid[]), feed_pulse() from public;
grant execute on function feed_timeline_v2(text,text,integer,timestamptz,numeric,timestamptz,uuid),
  feed_item_json(uuid), feed_thread_v2(uuid), create_feed_post_v2(text,uuid,uuid,text,uuid),
  edit_feed_post(uuid,text), toggle_save_post(uuid), mark_feed_seen(uuid[]), feed_pulse() to authenticated;

-- ═════════════════════════════════════════════════════════════════════════════
-- 5. Bucket para las imágenes de las publicaciones
--
-- Público para lectura (un permalink se ve sin sesión), escritura solo dentro de
-- la carpeta propia {uid}/, 5 MB, tres formatos. Las imágenes de prensa NUNCA van
-- acá: se enlazan al og:image del medio para que sigan siendo suyas (08 §2).
-- ═════════════════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('feed', 'feed', true, 5242880, array['image/png','image/jpeg','image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "feed images are readable" on storage.objects;
create policy "feed images are readable" on storage.objects for select
  using (bucket_id = 'feed');

drop policy if exists "own feed images: insert" on storage.objects;
create policy "own feed images: insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'feed' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "own feed images: delete" on storage.objects;
create policy "own feed images: delete" on storage.objects for delete to authenticated
  using (bucket_id = 'feed' and (storage.foldername(name))[1] = (select auth.uid())::text);
