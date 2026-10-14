-- ════════════════════════════════════════════════════════════════════════════
-- Brote — 0127 — El panel atado a cuentas (docs/LANZAMIENTO.md D8, F2).
--
-- Hasta acá el panel tenía una sola llave: la contraseña. Con ella se entraba
-- desde cualquier cuenta, y si se olvidaba no había vuelta salvo SQL.
--
-- Ahora:
--   · `brote_admins` guarda las cuentas del equipo. Mientras esté vacía, todo
--     sigue igual que antes (la contraseña sola). En cuanto tiene una cuenta,
--     la contraseña sola ya no alcanza: además hay que estar con una cuenta
--     vinculada. Una contraseña filtrada deja de servir de nada.
--   · La primera contraseña la crea una cuenta y esa cuenta queda vinculada.
--   · Una cuenta vinculada puede recuperar la contraseña sin saber la anterior,
--     pero sólo con un ingreso RECIENTE (≤ 15 min, según el `amr` del JWT, que
--     guarda la hora del ingreso real y no se renueva con el token): una sesión
--     robada y vieja no alcanza. Máximo 3 intentos por hora.
--   · Desde el panel se vinculan otras cuentas por correo y se desvinculan
--     (nunca la última).
--   · Estas cuentas reciben los avisos de lo que espera una respuesta (0129).
--
-- `admin_check` sigue siendo el único lugar que decide: todas las RPC del panel
-- lo llaman, así que el cambio cubre las 40 de una vez.
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.brote_admins (
  user_id       uuid primary key references auth.users (id) on delete cascade,
  vinculado_at  timestamptz not null default now(),
  vinculado_por uuid,
  nota          text
);
alter table public.brote_admins enable row level security;
revoke all on public.brote_admins from public, anon, authenticated;

create or replace function public.brote_es_admin(p_uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_uid is not null and exists (select 1 from brote_admins where user_id = p_uid);
$$;
revoke all on function public.brote_es_admin(uuid) from public, anon, authenticated;

-- ── admin_check: la contraseña + (si hay cuentas) una cuenta vinculada ──────

create or replace function public.admin_check(p_pass text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare v_cfg admin_config%rowtype; v_ok boolean;
begin
  -- Una cuenta que no es del equipo ni llega a probar la contraseña, así que
  -- tampoco suma intentos fallidos: no puede usar el panel para bloquearlo.
  if exists (select 1 from brote_admins) and not brote_es_admin(auth.uid()) then
    return false;
  end if;

  select * into v_cfg from admin_config where id = 1;
  if v_cfg.pass_hash is null then return false; end if;
  if v_cfg.locked_until is not null and v_cfg.locked_until > now() then return false; end if;

  v_ok := encode(extensions.digest(v_cfg.pass_salt || coalesce(p_pass, ''), 'sha256'), 'hex') = v_cfg.pass_hash;

  if v_ok then
    update admin_config set failed_count = 0, locked_until = null where id = 1;
  else
    update admin_config
       set failed_count = v_cfg.failed_count + 1,
           locked_until = case when v_cfg.failed_count + 1 >= 8 then now() + interval '15 minutes' else null end
     where id = 1;
  end if;
  return v_ok;
end $$;

-- ── Crear / cambiar la contraseña ───────────────────────────────────────────

create or replace function public.admin_set_password(p_new text, p_current text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_cfg admin_config%rowtype; v_salt text; v_uid uuid := auth.uid();
begin
  if length(coalesce(p_new, '')) < 8 then
    return jsonb_build_object('ok', false, 'error', 'La contraseña necesita al menos 8 caracteres');
  end if;
  if exists (select 1 from brote_admins) and not brote_es_admin(v_uid) then
    return jsonb_build_object('ok', false, 'error', 'Esta cuenta no está vinculada al panel');
  end if;

  select * into v_cfg from admin_config where id = 1;
  if v_cfg.pass_hash is not null then
    if p_current is null
       or encode(extensions.digest(v_cfg.pass_salt || p_current, 'sha256'), 'hex') is distinct from v_cfg.pass_hash then
      return jsonb_build_object('ok', false, 'error', 'La contraseña actual no coincide');
    end if;
  end if;

  v_salt := encode(extensions.gen_random_bytes(16), 'hex');
  insert into admin_config (id) values (1) on conflict (id) do nothing;
  update admin_config
     set pass_salt = v_salt,
         pass_hash = encode(extensions.digest(v_salt || p_new, 'sha256'), 'hex'),
         failed_count = 0, locked_until = null, updated_at = now()
   where id = 1;

  -- La primera contraseña la crea una persona: esa cuenta queda vinculada.
  if v_uid is not null and not exists (select 1 from brote_admins) then
    insert into brote_admins (user_id, vinculado_por, nota) values (v_uid, v_uid, 'creó la contraseña del panel');
  end if;
  return jsonb_build_object('ok', true);
end $$;

-- ── Lo que la pantalla de candado necesita saber ────────────────────────────

create or replace function public.admin_estado_acceso()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare v_ts bigint;
begin
  select max((e ->> 'timestamp')::bigint) into v_ts
    from jsonb_array_elements(coalesce(auth.jwt() -> 'amr', '[]'::jsonb)) e;
  return jsonb_build_object(
    'configurado', coalesce((select pass_hash is not null from admin_config where id = 1), false),
    'con_cuentas', exists (select 1 from brote_admins),
    'soy_admin', brote_es_admin(auth.uid()),
    'ingreso_reciente', v_ts is not null and v_ts >= extract(epoch from now()) - 900
  );
end $$;

-- ── Recuperar la contraseña desde una cuenta vinculada ──────────────────────

create or replace function public.admin_recuperar_clave(p_nueva text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_uid uuid := auth.uid(); v_ts bigint; v_salt text;
begin
  if not brote_es_admin(v_uid) then
    return jsonb_build_object('ok', false, 'error', 'Esta cuenta no está vinculada al panel.');
  end if;
  if not brote_rate_limit('admin_recuperar:' || v_uid, 3, interval '1 hour') then
    return jsonb_build_object('ok', false, 'error', 'Demasiados intentos. Probá de nuevo en una hora.');
  end if;
  select max((e ->> 'timestamp')::bigint) into v_ts
    from jsonb_array_elements(coalesce(auth.jwt() -> 'amr', '[]'::jsonb)) e;
  if v_ts is null or v_ts < extract(epoch from now()) - 900 then
    return jsonb_build_object('ok', false, 'reingresar', true,
      'error', 'Por seguridad, cerrá sesión y volvé a entrar con esta cuenta. Después tenés 15 minutos para cambiarla.');
  end if;
  if length(coalesce(p_nueva, '')) < 10 then
    return jsonb_build_object('ok', false, 'error', 'La contraseña nueva necesita al menos 10 caracteres.');
  end if;

  v_salt := encode(extensions.gen_random_bytes(16), 'hex');
  insert into admin_config (id) values (1) on conflict (id) do nothing;
  update admin_config
     set pass_salt = v_salt,
         pass_hash = encode(extensions.digest(v_salt || p_nueva, 'sha256'), 'hex'),
         failed_count = 0, locked_until = null, updated_at = now()
   where id = 1;
  return jsonb_build_object('ok', true);
end $$;

-- ── Vincular y desvincular cuentas ──────────────────────────────────────────

create or replace function public.admin_vincular_cuenta(p_pass text, p_email text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_uid uuid := auth.uid(); v_target uuid;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'Entrá con tu cuenta para vincularla.');
  end if;
  if not admin_check(p_pass) then
    return jsonb_build_object('ok', false, 'error', 'Contraseña incorrecta');
  end if;
  if p_email is null or btrim(p_email) = '' then
    v_target := v_uid;
  else
    select id into v_target from auth.users where lower(email) = lower(btrim(p_email)) limit 1;
    if v_target is null then
      return jsonb_build_object('ok', false, 'error', 'No hay ninguna cuenta de Brote con ese correo.');
    end if;
    if (select account_type from profiles where id = v_target) is distinct from 'adult' then
      return jsonb_build_object('ok', false, 'error', 'Sólo una cuenta de una persona adulta puede administrar.');
    end if;
  end if;
  insert into brote_admins (user_id, vinculado_por) values (v_target, v_uid) on conflict (user_id) do nothing;
  return jsonb_build_object('ok', true, 'user_id', v_target);
end $$;

create or replace function public.admin_desvincular_cuenta(p_pass text, p_user uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not admin_check(p_pass) then
    return jsonb_build_object('ok', false, 'error', 'Contraseña incorrecta');
  end if;
  if (select count(*) from brote_admins) <= 1 then
    return jsonb_build_object('ok', false, 'error', 'Es la única cuenta vinculada: vinculá otra antes de sacar esta.');
  end if;
  delete from brote_admins where user_id = p_user;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.admin_cuentas(p_pass text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not admin_check(p_pass) then
    return jsonb_build_object('ok', false, 'error', 'Contraseña incorrecta');
  end if;
  return jsonb_build_object('ok', true, 'cuentas', coalesce((
    select jsonb_agg(jsonb_build_object(
             'user_id', a.user_id,
             'email', u.email,
             'nombre', p.display_name,
             'username', p.username,
             'vinculado_at', a.vinculado_at,
             'soy_yo', a.user_id = auth.uid(),
             'avisos', exists (select 1 from push_subscriptions s where s.user_id = a.user_id))
           order by a.vinculado_at)
      from brote_admins a
      join auth.users u on u.id = a.user_id
      left join profiles p on p.id = a.user_id), '[]'::jsonb));
end $$;

revoke all on function public.admin_estado_acceso() from public, anon;
revoke all on function public.admin_recuperar_clave(text) from public, anon;
revoke all on function public.admin_vincular_cuenta(text, text) from public, anon;
revoke all on function public.admin_desvincular_cuenta(text, uuid) from public, anon;
revoke all on function public.admin_cuentas(text) from public, anon;
grant execute on function public.admin_estado_acceso() to authenticated;
grant execute on function public.admin_recuperar_clave(text) to authenticated;
grant execute on function public.admin_vincular_cuenta(text, text) to authenticated;
grant execute on function public.admin_desvincular_cuenta(text, uuid) to authenticated;
grant execute on function public.admin_cuentas(text) to authenticated;

-- `brote_negocio_notificar_revisores` avisaba a quien hubiera revisado algún
-- negocio el último año: con una sola cuenta revisora, el primer negocio nunca
-- avisaba a nadie. Ahora avisa a las cuentas del panel (0129 la reemplaza por
-- el sistema de avisos completo; esto deja de depender de ese historial ya).
create or replace function public.brote_negocio_notificar_revisores(p_titulo text, p_cuerpo text, p_url text)
returns void
language sql
security definer
set search_path = public
as $$
  insert into notifications (user_id, type, title_es, body_es, data)
  select a.user_id, 'system'::notif_type, p_titulo, p_cuerpo, jsonb_build_object('url', p_url, 'admin', true)
    from brote_admins a;
$$;
