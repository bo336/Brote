-- 0100 — Calcomanías: lo único que un visitante puede dejar en otra isla.
--
-- `18-DECISIONS.md` D8. Una visita es de sólo lectura salvo por esto: ocho
-- dibujos, elegidos de una lista cerrada, uno por isla por día. No hay texto
-- libre, no hay nombre sobre la isla y no hay nada que moderar — el catálogo
-- vive en el cliente (`lib/world/visit.ts`) y acá se valida contra el mismo
-- listado, así una versión vieja de la app no puede inventar uno nuevo.

create table if not exists public.world_stickers (
  id          uuid primary key default gen_random_uuid(),
  host_id     uuid not null references auth.users(id) on delete cascade,
  visitor_id  uuid not null references auth.users(id) on delete cascade,
  sticker     text not null check (sticker in
                ('semilla','sol','agua','hoja','pajaro','estrella','corazon','mate')),
  region      text not null,
  x           double precision not null,
  z           double precision not null,
  left_on     date not null default (now() at time zone 'America/Argentina/Buenos_Aires')::date,
  created_at  timestamptz not null default now()
);

-- El límite, como restricción y no como consejo: una por isla, por visitante,
-- por día. Un cliente que insista recibe un conflicto, no una segunda calco.
create unique index if not exists world_stickers_one_per_day
  on public.world_stickers (host_id, visitor_id, left_on);
create index if not exists world_stickers_host on public.world_stickers (host_id, created_at desc);

alter table public.world_stickers enable row level security;
-- Sin policies: se lee y se escribe sólo por las RPC de abajo.

-- ---------------------------------------------------------------- Dejar una
create or replace function public.world_leave_sticker(
  p_username text, p_sticker text, p_region text, p_x double precision, p_z double precision)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare
  v_me    uuid := auth.uid();
  v_them  uuid;
  v_vis   text;
  v_today date := (now() at time zone 'America/Argentina/Buenos_Aires')::date;
begin
  if v_me is null then raise exception 'not authenticated'; end if;

  select id, coalesce(profile_visibility, 'public') into v_them, v_vis
    from profiles where username = p_username;

  -- Las mismas tres puertas que `world_snapshot_for`, y con la misma respuesta
  -- para las tres: quien no puede ver la isla tampoco puede dejar nada en ella,
  -- y no se entera de por qué.
  if v_them is null
     or exists (select 1 from user_blocks b
                 where (b.blocker_id = v_them and b.blocked_id = v_me)
                    or (b.blocker_id = v_me and b.blocked_id = v_them))
     or exists (select 1 from user_mutes m where m.muter_id = v_me and m.muted_id = v_them)
     or (v_vis <> 'public' and v_them <> v_me)
  then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if p_sticker not in ('semilla','sol','agua','hoja','pajaro','estrella','corazon','mate') then
    return jsonb_build_object('ok', false, 'reason', 'unknown_sticker');
  end if;

  insert into public.world_stickers (host_id, visitor_id, sticker, region, x, z, left_on)
  values (v_them, v_me, p_sticker, p_region, p_x, p_z, v_today)
  on conflict (host_id, visitor_id, left_on) do nothing;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'already_today');
  end if;

  return jsonb_build_object('ok', true);
end $fn$;

-- ------------------------------------------------- La isla, con sus calcos
-- Envuelve `world_snapshot_for` en vez de repetirla: las reglas de visibilidad
-- viven en un solo lugar, y si mañana cambian, cambian una vez.
create or replace function public.world_visit(p_username text)
returns jsonb language plpgsql stable security definer set search_path = public as $fn$
declare
  v_me    uuid := auth.uid();
  v_snap  jsonb;
  v_them  uuid;
  v_today date := (now() at time zone 'America/Argentina/Buenos_Aires')::date;
begin
  if v_me is null then raise exception 'not authenticated'; end if;
  v_snap := public.world_snapshot_for(p_username);
  if coalesce((v_snap->>'ok')::boolean, false) is not true then
    return v_snap;
  end if;

  select id into v_them from profiles where username = p_username;

  return v_snap
    || jsonb_build_object(
         'stickers', coalesce((
           select jsonb_agg(jsonb_build_object(
                    'sticker', s.sticker, 'region', s.region,
                    'x', s.x, 'z', s.z, 'by_me', s.visitor_id = v_me))
             from public.world_stickers s
            where s.host_id = v_them
              and s.created_at > now() - interval '30 days'), '[]'::jsonb),
         'leftToday', (
           select count(*) from public.world_stickers s
            where s.host_id = v_them and s.visitor_id = v_me and s.left_on = v_today));
end $fn$;

revoke all on function public.world_leave_sticker(text, text, text, double precision, double precision)
  from public, anon;
revoke all on function public.world_visit(text) from public, anon;
grant execute on function public.world_leave_sticker(text, text, text, double precision, double precision)
  to authenticated;
grant execute on function public.world_visit(text) to authenticated;
