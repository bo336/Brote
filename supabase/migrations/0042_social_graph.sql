-- Brote — 0042 — El grafo social: seguir, contadores, descubrimiento, búsqueda.
-- Feed v2 ("La Plaza") fase 1, paso 3 de 5.
--
-- `follows` es ASIMÉTRICO e INSTANTÁNEO, y es una tabla distinta de
-- `friendships`. Son dos cosas distintas y mezclarlas rompería las dos: una
-- amistad es mutua, se pide y se acepta, y existe para la pestaña Amigos del
-- ranking; seguir es unilateral, inmediato, y existe para armar un timeline.
-- No se migra nada de una a la otra.

create table if not exists follows (
  follower_id uuid not null references profiles(id) on delete cascade,
  followee_id uuid not null references profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (follower_id, followee_id),
  constraint follows_not_self check (follower_id <> followee_id)
);

create index if not exists idx_follows_followee on follows (followee_id, created_at desc);
create index if not exists idx_follows_follower on follows (follower_id, created_at desc);

alter table follows enable row level security;

drop policy if exists "follows read" on follows;
create policy "follows read" on follows for select using (true);

drop policy if exists "follows insert" on follows;
create policy "follows insert" on follows for insert with check ((select auth.uid()) = follower_id);

drop policy if exists "follows delete" on follows;
create policy "follows delete" on follows for delete using ((select auth.uid()) = follower_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Contadores desnormalizados. Nunca un count(*) dentro de una consulta de feed:
-- con 20 items por página serían 40 subconsultas por scroll.
-- ─────────────────────────────────────────────────────────────────────────────

alter table profiles
  add column if not exists followers_count    integer not null default 0,
  add column if not exists following_count    integer not null default 0,
  add column if not exists posts_count        integer not null default 0,
  add column if not exists is_verified        boolean not null default false,
  add column if not exists is_creator         boolean not null default false,
  add column if not exists profile_visibility text not null default 'public',
  add column if not exists suspended_until    timestamptz;

do $blk$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_visibility_chk') then
    alter table profiles add constraint profiles_visibility_chk
      check (profile_visibility in ('public','followers','private'));
  end if;
end $blk$;

create or replace function brote_sync_follow_counts() returns trigger
language plpgsql security definer set search_path = public as $fn$
begin
  if tg_op = 'INSERT' then
    update profiles set followers_count = followers_count + 1 where id = new.followee_id;
    update profiles set following_count = following_count + 1 where id = new.follower_id;
  elsif tg_op = 'DELETE' then
    update profiles set followers_count = greatest(0, followers_count - 1) where id = old.followee_id;
    update profiles set following_count = greatest(0, following_count - 1) where id = old.follower_id;
  end if;
  return null;
end $fn$;

drop trigger if exists trg_follow_counts on follows;
create trigger trg_follow_counts after insert or delete on follows
for each row execute function brote_sync_follow_counts();

-- Backfill, seguro de volver a correr.
update profiles p set
  followers_count = (select count(*) from follows f where f.followee_id = p.id),
  following_count = (select count(*) from follows f where f.follower_id = p.id),
  posts_count     = (select count(*) from feed_posts x
                      where x.author_id = p.id and x.kind <> 'reply' and not x.hidden);

-- La privacidad de los menores no es una preferencia: es el default y no se
-- ofrece cambiarlo. Los adolescentes arrancan en "solo seguidores".
update profiles set profile_visibility = 'private'   where account_type = 'kid';
update profiles set profile_visibility = 'followers' where account_type = 'teen' and profile_visibility = 'public';

-- ─────────────────────────────────────────────────────────────────────────────
-- Seguir / dejar de seguir
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function follow_user(p_target uuid) returns jsonb
language plpgsql security definer set search_path = public as $fn$
declare v_uid uuid := auth.uid(); v_me text; v_them text; v_inserted int;
begin
  if v_uid is null then raise exception 'No autenticado' using errcode = 'P0001'; end if;
  if v_uid = p_target then return jsonb_build_object('ok', false, 'error', 'No podés seguirte a vos.'); end if;

  select coalesce(account_type::text,'adult') into v_me   from profiles where id = v_uid;
  select coalesce(account_type::text,'adult') into v_them from profiles where id = p_target;
  if v_them is null then return jsonb_build_object('ok', false, 'error', 'Esa cuenta no existe.'); end if;

  -- La regla de edad vive acá, no en la UI. Un chico con la consola abierta no
  -- es una hipótesis.
  if v_me = 'kid' or v_them = 'kid' then
    return jsonb_build_object('ok', false, 'error', 'Las cuentas de chicos no participan de la parte social.');
  end if;

  if exists (select 1 from user_blocks
             where (blocker_id = v_uid and blocked_id = p_target)
                or (blocker_id = p_target and blocked_id = v_uid)) then
    return jsonb_build_object('ok', false, 'error', 'No se puede seguir a esta cuenta.');
  end if;

  insert into follows (follower_id, followee_id) values (v_uid, p_target)
  on conflict do nothing;
  get diagnostics v_inserted = row_count;

  -- Solo se avisa si de verdad hubo un follow nuevo. `found` después de un
  -- INSERT ... ON CONFLICT DO NOTHING queda en true aunque no se haya insertado
  -- nada, así que se usa row_count.
  if v_inserted > 0 then
    perform brote_notify_social(p_target, 'follow', 'follow:' || v_uid::text,
      coalesce((select display_name from profiles where id = v_uid), 'Alguien') || ' te empezó a seguir',
      null, jsonb_build_object('user_id', v_uid));
  end if;

  return jsonb_build_object('ok', true, 'following', true,
    'followers', (select followers_count from profiles where id = p_target));
end $fn$;

create or replace function unfollow_user(p_target uuid) returns jsonb
language plpgsql security definer set search_path = public as $fn$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'No autenticado' using errcode = 'P0001'; end if;
  delete from follows where follower_id = v_uid and followee_id = p_target;
  return jsonb_build_object('ok', true, 'following', false,
    'followers', (select followers_count from profiles where id = p_target));
end $fn$;

-- ─────────────────────────────────────────────────────────────────────────────
-- A quién seguir. Solo cuentas reales: nunca jugadores simulados (que existen
-- únicamente para que los rankings públicos no estén vacíos), nunca chicos.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function suggested_accounts(p_limit integer default 6) returns jsonb
language sql stable security definer set search_path = public as $fn$
  with me as (
    select id, city, coalesce(interests,'{}') as interests
    from profiles where id = auth.uid()
  )
  select coalesce(jsonb_agg(to_jsonb(s) - 'score' order by s.score desc), '[]'::jsonb)
  from (
    select p.id, p.username, p.display_name, p.avatar_url, p.pip_style, p.bio,
           p.current_rank_slug as rank_slug, p.is_verified, p.followers_count, p.city,
           (case when p.is_creator then 40 else 0 end)
           + (case when p.city is not null and p.city = me.city then 25 else 0 end)
           + (select count(*) * 8 from unnest(coalesce(p.interests,'{}')) t where t = any(me.interests))
           + least(20, p.followers_count)
           + least(15, (p.total_xp / 1000)::int) as score
    from profiles p, me
    where p.id <> me.id
      and p.account_type <> 'kid'
      and p.onboarding_completed
      and p.profile_visibility = 'public'
      and not exists (select 1 from follows f where f.follower_id = me.id and f.followee_id = p.id)
      and not exists (select 1 from user_blocks b
                      where (b.blocker_id = me.id and b.blocked_id = p.id)
                         or (b.blocker_id = p.id and b.blocked_id = me.id))
    order by score desc, p.followers_count desc
    limit greatest(1, least(20, p_limit))
  ) s;
$fn$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Búsqueda de cuentas
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists pg_trgm;
create index if not exists idx_profiles_display_trgm on profiles using gin (display_name gin_trgm_ops);

create or replace function search_profiles(p_q text, p_limit integer default 20) returns jsonb
language sql stable security definer set search_path = public as $fn$
  with q as (select btrim(coalesce(p_q,'')) as t)
  select coalesce(jsonb_agg(jsonb_build_object(
      'id', p.id, 'username', p.username, 'display_name', p.display_name,
      'avatar_url', p.avatar_url, 'pip_style', p.pip_style, 'rank_slug', p.current_rank_slug,
      'is_verified', p.is_verified, 'followers_count', p.followers_count, 'city', p.city,
      'is_following', exists (select 1 from follows f where f.follower_id = auth.uid() and f.followee_id = p.id))
    order by p.followers_count desc, p.total_xp desc), '[]'::jsonb)
  from profiles p, q
  where length(q.t) >= 2
    and p.account_type <> 'kid'
    and p.profile_visibility <> 'private'
    and (p.username::text ilike q.t || '%' or p.display_name ilike '%' || q.t || '%')
    and not exists (select 1 from user_blocks b
                    where (b.blocker_id = auth.uid() and b.blocked_id = p.id)
                       or (b.blocker_id = p.id and b.blocked_id = auth.uid()))
  limit greatest(1, least(50, p_limit));
$fn$;

-- ¿A quién sigo? Se usa para el botón de seguir y para la pestaña Siguiendo.
create or replace function my_following_ids() returns jsonb
language sql stable security definer set search_path = public as $fn$
  select coalesce(jsonb_agg(followee_id), '[]'::jsonb)
  from follows where follower_id = auth.uid();
$fn$;

revoke all on function follow_user(uuid), unfollow_user(uuid), suggested_accounts(integer),
  search_profiles(text,integer), my_following_ids() from public;
grant execute on function follow_user(uuid), unfollow_user(uuid), suggested_accounts(integer),
  search_profiles(text,integer), my_following_ids() to authenticated;
