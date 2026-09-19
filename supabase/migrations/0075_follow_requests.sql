-- Brote — 0075 — Un perfil privado que de verdad es privado.
-- Feed v2 ("La Plaza") fase 3, cierre — paridad con las redes grandes.
--
-- AGUJERO REAL, encontrado comparando contra Instagram/Threads.
--
-- `profiles.profile_visibility` tiene tres estados y `get_public_profile_v2` los
-- respeta: con `followers`, quien no te sigue no ve tus números ni tus
-- publicaciones. Perfecto. Salvo que `follow_user` insertaba la fila SIEMPRE,
-- sin preguntarle a nadie. O sea que cualquiera se volvía seguidor con un toque
-- y a partir de ahí veía todo.
--
-- Dicho de otro modo: el candado existía y la puerta estaba abierta al lado.
-- Y le pega justo a quien más importa — el default de una cuenta ADOLESCENTE es
-- `followers` (08 §2), así que hasta acá la privacidad de un chico de 14 años
-- era exactamente un click de cualquier desconocido.
--
-- Esto agrega lo que toda red seria tiene: si la cuenta no es pública, seguirla
-- crea una SOLICITUD que esa persona acepta o rechaza.
--
--   · `follow_requests` — una fila por pedido pendiente, con RLS: cada quien ve
--     los que mandó y los que recibió, y nadie más.
--   · `follow_user` — con destino no público, deja la solicitud y avisa.
--   · `respond_follow_request` — aceptar crea el follow de verdad (y avisa a
--     quien pidió); rechazar borra y NO avisa, que es lo correcto: enterarte de
--     que te rechazaron es una invitación a insistir.
--   · `unfollow_user` — también cancela una solicitud pendiente, porque desde
--     la interfaz es el mismo botón.
--   · `my_follow_requests` — para la pantalla de notificaciones.
--
-- Bloquear a alguien, además, le borra cualquier solicitud pendiente en las dos
-- direcciones.

-- ═════════════════════════════════════════════════════════════════════════════
-- 1. La tabla
-- ═════════════════════════════════════════════════════════════════════════════

create table if not exists follow_requests (
  requester_id uuid not null references profiles(id) on delete cascade,
  target_id    uuid not null references profiles(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (requester_id, target_id)
);

create index if not exists idx_follow_req_target on follow_requests (target_id, created_at desc);

alter table follow_requests enable row level security;

-- Cada quien ve lo que mandó y lo que recibió. Nada más: quién le pidió seguir
-- a quién es información privada de esas dos personas.
drop policy if exists "follow requests visible to both" on follow_requests;
create policy "follow requests visible to both" on follow_requests for select
  using ((select auth.uid()) in (requester_id, target_id));

-- Las escrituras pasan por las funciones de abajo, que son SECURITY DEFINER.
-- Sin políticas de INSERT/UPDATE/DELETE, nadie escribe esta tabla a mano.

-- ═════════════════════════════════════════════════════════════════════════════
-- 2. Seguir: directo si es pública, solicitud si no
-- ═════════════════════════════════════════════════════════════════════════════

create or replace function follow_user(p_target uuid)
returns jsonb
language plpgsql security definer set search_path = public as $fn$
declare
  v_uid uuid := auth.uid();
  v_me text; v_them text; v_vis text; v_inserted int;
begin
  if v_uid is null then raise exception 'No autenticado' using errcode = 'P0001'; end if;
  if v_uid = p_target then return jsonb_build_object('ok', false, 'error', 'No podés seguirte a vos.'); end if;

  select coalesce(account_type::text,'adult') into v_me from profiles where id = v_uid;
  select coalesce(account_type::text,'adult'), coalesce(profile_visibility,'public')
    into v_them, v_vis from profiles where id = p_target;
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

  -- Ya la seguís: nada que hacer.
  if exists (select 1 from follows where follower_id = v_uid and followee_id = p_target) then
    return jsonb_build_object('ok', true, 'following', true,
      'followers', (select followers_count from profiles where id = p_target));
  end if;

  -- Perfil no público: se pide permiso en vez de entrar.
  if v_vis <> 'public' then
    insert into follow_requests (requester_id, target_id) values (v_uid, p_target)
    on conflict do nothing;
    get diagnostics v_inserted = row_count;

    if v_inserted > 0 then
      perform brote_notify_social(p_target, 'follow_request', 'freq:' || v_uid::text,
        coalesce((select display_name from profiles where id = v_uid), 'Alguien') || ' quiere seguirte',
        null, jsonb_build_object('user_id', v_uid));
    end if;

    return jsonb_build_object('ok', true, 'following', false, 'requested', true,
      'followers', (select followers_count from profiles where id = p_target));
  end if;

  insert into follows (follower_id, followee_id) values (v_uid, p_target)
  on conflict do nothing;
  get diagnostics v_inserted = row_count;

  if v_inserted > 0 then
    perform brote_notify_social(p_target, 'follow', 'follow:' || v_uid::text,
      coalesce((select display_name from profiles where id = v_uid), 'Alguien') || ' te empezó a seguir',
      null, jsonb_build_object('user_id', v_uid));
  end if;

  return jsonb_build_object('ok', true, 'following', true, 'requested', false,
    'followers', (select followers_count from profiles where id = p_target));
end;
$fn$;

-- ═════════════════════════════════════════════════════════════════════════════
-- 3. Dejar de seguir cancela también la solicitud
-- ═════════════════════════════════════════════════════════════════════════════

create or replace function unfollow_user(p_target uuid)
returns jsonb
language plpgsql security definer set search_path = public as $fn$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'No autenticado' using errcode = 'P0001'; end if;

  delete from follows where follower_id = v_uid and followee_id = p_target;
  -- Desde la interfaz es el mismo botón: si estaba pendiente, se retira.
  delete from follow_requests where requester_id = v_uid and target_id = p_target;

  return jsonb_build_object('ok', true, 'following', false, 'requested', false,
    'followers', (select followers_count from profiles where id = p_target));
end;
$fn$;

-- ═════════════════════════════════════════════════════════════════════════════
-- 4. Aceptar o rechazar
-- ═════════════════════════════════════════════════════════════════════════════

create or replace function respond_follow_request(p_requester uuid, p_accept boolean)
returns jsonb
language plpgsql security definer set search_path = public as $fn$
declare v_uid uuid := auth.uid(); v_found int;
begin
  if v_uid is null then raise exception 'No autenticado' using errcode = 'P0001'; end if;

  delete from follow_requests where requester_id = p_requester and target_id = v_uid;
  get diagnostics v_found = row_count;
  if v_found = 0 then
    return jsonb_build_object('ok', false, 'error', 'Esa solicitud ya no está.');
  end if;

  -- La notificación de la solicitud ya no tiene sentido en la bandeja.
  delete from notifications
   where user_id = v_uid and type = 'follow_request' and data->>'user_id' = p_requester::text;

  if p_accept then
    insert into follows (follower_id, followee_id) values (p_requester, v_uid)
    on conflict do nothing;
    perform brote_notify_social(p_requester, 'follow', 'accepted:' || v_uid::text,
      coalesce((select display_name from profiles where id = v_uid), 'Alguien') || ' aceptó tu solicitud',
      null, jsonb_build_object('user_id', v_uid));
  end if;
  -- Si se rechaza no se avisa: enterarte de que te rechazaron es una invitación
  -- a insistir, y quien rechaza no le debe una explicación a nadie.

  return jsonb_build_object('ok', true, 'accepted', p_accept);
end;
$fn$;

-- ═════════════════════════════════════════════════════════════════════════════
-- 5. Bandeja de solicitudes
-- ═════════════════════════════════════════════════════════════════════════════

create or replace function my_follow_requests()
returns jsonb
language sql stable security definer set search_path = public as $fn$
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', p.id, 'username', p.username, 'display_name', p.display_name,
           'avatar_url', p.avatar_url, 'pip_style', p.pip_style, 'bio', p.bio,
           'rank_slug', p.current_rank_slug, 'is_verified', p.is_verified,
           'followers_count', p.followers_count, 'city', p.city,
           'requested_at', r.created_at)
         order by r.created_at desc), '[]'::jsonb)
  from follow_requests r
  join profiles p on p.id = r.requester_id
  where r.target_id = auth.uid();
$fn$;

-- ═════════════════════════════════════════════════════════════════════════════
-- 6. Bloquear limpia las solicitudes pendientes
-- ═════════════════════════════════════════════════════════════════════════════

create or replace function brote_clear_requests_on_block()
returns trigger
language plpgsql security definer set search_path = public as $fn$
begin
  delete from follow_requests
   where (requester_id = new.blocker_id and target_id = new.blocked_id)
      or (requester_id = new.blocked_id and target_id = new.blocker_id);
  return null;
end;
$fn$;

drop trigger if exists trg_block_clears_requests on user_blocks;
create trigger trg_block_clears_requests after insert on user_blocks
for each row execute function brote_clear_requests_on_block();

-- ═════════════════════════════════════════════════════════════════════════════
-- 7. Permisos
-- ═════════════════════════════════════════════════════════════════════════════

revoke all on function follow_user(uuid), unfollow_user(uuid),
  respond_follow_request(uuid, boolean), my_follow_requests()
  from public, anon, authenticated;
revoke all on function brote_clear_requests_on_block() from public, anon, authenticated;

grant execute on function follow_user(uuid), unfollow_user(uuid),
  respond_follow_request(uuid, boolean), my_follow_requests()
  to authenticated;
