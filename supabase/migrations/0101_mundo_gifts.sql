-- 0101 — Regalos: un objeto por amigo por día, del set que ya tenés.
--
-- `11-GAME-LOOP.md` §8. Un regalo **no te saca nada**: no es una transferencia,
-- es una copia. Regalar algo que perdés convierte la generosidad en un costo, y
-- un juego que cobra por ser generoso enseña lo contrario de lo que queremos.
--
-- El límite es uno por destinatario por día, como restricción y no como
-- consejo, y sólo entre gente que se sigue mutuamente: un regalo de un
-- desconocido es una notificación de un desconocido.

create table if not exists public.world_gifts (
  id          uuid primary key default gen_random_uuid(),
  from_id     uuid not null references auth.users(id) on delete cascade,
  to_id       uuid not null references auth.users(id) on delete cascade,
  slug        text not null,
  sent_on     date not null default (now() at time zone 'America/Argentina/Buenos_Aires')::date,
  seen_at     timestamptz,
  created_at  timestamptz not null default now(),
  check (from_id <> to_id)
);

create unique index if not exists world_gifts_one_per_day
  on public.world_gifts (from_id, to_id, sent_on);
create index if not exists world_gifts_inbox on public.world_gifts (to_id, created_at desc);

alter table public.world_gifts enable row level security;
-- Sin policies: se lee y se escribe sólo por las RPC de abajo.

-- ------------------------------------------------------- Qué se puede regalar
-- Lo tuyo, menos lo que ya tiene. Se calcula en el servidor para que el cliente
-- no tenga que pedir el inventario ajeno: lo que se filtra es "esto le sirve",
-- que es bastante menos que "esto tiene", y es lo mínimo para que el regalo no
-- sea un duplicado que se pierde.
create or replace function public.world_gift_options(p_username text)
returns jsonb language plpgsql stable security definer set search_path = public as $fn$
declare
  v_me   uuid := auth.uid();
  v_them uuid;
begin
  if v_me is null then raise exception 'not authenticated'; end if;
  select id into v_them from profiles where username = p_username;
  if v_them is null or v_them = v_me then
    return jsonb_build_object('ok', false, 'slugs', '[]'::jsonb, 'sentToday', 0);
  end if;

  return jsonb_build_object(
    'ok', true,
    -- Con el nombre, no sólo el slug: la pantalla no tiene que conocer el
    -- catálogo, y un slug crudo en un botón es una fuga de esquema.
    'slugs', coalesce((
      select jsonb_agg(jsonb_build_object('slug', uc.slug, 'name', coalesce(c.name_es, uc.slug))
                       order by coalesce(c.name_es, uc.slug))
        from user_cosmetics uc
        left join cosmetics c on c.slug = uc.slug
       where uc.user_id = v_me
         and not exists (select 1 from user_cosmetics th
                          where th.user_id = v_them and th.slug = uc.slug)), '[]'::jsonb),
    'sentToday', (
      select count(*) from public.world_gifts g
       where g.from_id = v_me and g.to_id = v_them
         and g.sent_on = (now() at time zone 'America/Argentina/Buenos_Aires')::date));
end $fn$;

-- ------------------------------------------------------------------- Mandarlo
create or replace function public.world_send_gift(p_username text, p_slug text)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare
  v_me    uuid := auth.uid();
  v_them  uuid;
  v_today date := (now() at time zone 'America/Argentina/Buenos_Aires')::date;
begin
  if v_me is null then raise exception 'not authenticated'; end if;

  select id into v_them from profiles where username = p_username;
  if v_them is null or v_them = v_me
     or exists (select 1 from user_blocks b
                 where (b.blocker_id = v_them and b.blocked_id = v_me)
                    or (b.blocker_id = v_me and b.blocked_id = v_them))
  then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  -- Sólo entre gente que se sigue en las dos direcciones. `11-GAME-LOOP.md` §8
  -- dice "amigo", y en esta app un amigo es eso.
  if not (exists (select 1 from follows f where f.follower_id = v_me and f.followee_id = v_them)
      and exists (select 1 from follows f where f.follower_id = v_them and f.followee_id = v_me))
  then
    return jsonb_build_object('ok', false, 'reason', 'not_friends');
  end if;

  -- Del set que ya tenés, y que no tenga ya.
  if not exists (select 1 from user_cosmetics uc where uc.user_id = v_me and uc.slug = p_slug) then
    return jsonb_build_object('ok', false, 'reason', 'not_owned');
  end if;
  if exists (select 1 from user_cosmetics uc where uc.user_id = v_them and uc.slug = p_slug) then
    return jsonb_build_object('ok', false, 'reason', 'already_has');
  end if;

  insert into public.world_gifts (from_id, to_id, slug, sent_on)
  values (v_me, v_them, p_slug, v_today)
  on conflict (from_id, to_id, sent_on) do nothing;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'already_today');
  end if;

  -- Una copia, no una transferencia: el que regala no pierde nada.
  insert into public.user_cosmetics (user_id, slug)
  values (v_them, p_slug)
  on conflict do nothing;

  return jsonb_build_object('ok', true);
end $fn$;

revoke all on function public.world_gift_options(text)     from public, anon;
revoke all on function public.world_send_gift(text, text)  from public, anon;
grant execute on function public.world_gift_options(text)    to authenticated;
grant execute on function public.world_send_gift(text, text) to authenticated;

-- ------------------------------------------------------------ Lo que te llegó
-- Sin notificaciones: el mundo no manda ninguna (`04-RESEARCH-DESIGN.md` §9.9).
-- Esto se lee una sola vez, al entrar a `/mundo`, y se marca visto en el mismo
-- viaje. Un regalo que nadie ve no es un regalo, y una notificación que te
-- persigue no es una gentileza.
create or replace function public.world_gifts_unseen()
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare
  v_me uuid := auth.uid();
  v_out jsonb;
begin
  if v_me is null then raise exception 'not authenticated'; end if;

  with fresh as (
    update public.world_gifts g
       set seen_at = now()
     where g.to_id = v_me and g.seen_at is null
    returning g.slug, g.from_id)
  select coalesce(jsonb_agg(jsonb_build_object(
           'slug', f.slug,
           'name', coalesce(c.name_es, f.slug),
           'from', coalesce(p.display_name, p.username))), '[]'::jsonb)
    into v_out
    from fresh f
    left join cosmetics c on c.slug = f.slug
    left join profiles  p on p.id = f.from_id;

  return jsonb_build_object('gifts', v_out);
end $fn$;

revoke all on function public.world_gifts_unseen() from public, anon;
grant execute on function public.world_gifts_unseen() to authenticated;
