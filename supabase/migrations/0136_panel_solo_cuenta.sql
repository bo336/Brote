-- ════════════════════════════════════════════════════════════════════════════
-- Brote — 0136 — El panel se abre con la cuenta del dueño, y con nada más.
--
-- Hasta acá había una contraseña además de la cuenta. Sumaba fricción y un
-- problema real: se olvida, se pide de nuevo en cada sección, y cuando una
-- sección fallaba por cualquier motivo decía "contraseña incorrecta".
--
-- Ahora:
--   · `admin_check` no mira ninguna contraseña: responde si la sesión (el JWT
--     firmado por Supabase, imposible de falsificar desde el navegador) es de
--     una cuenta en `brote_admins`. Sigue siendo el único lugar que decide, y
--     todas las RPC del panel lo llaman: el cambio las cubre a todas.
--   · En `brote_admins` queda UNA cuenta, la del dueño. Las funciones que
--     dejaban vincular otras o crear contraseñas ya no hacen nada: agregar una
--     cuenta sólo se puede desde el editor SQL de Supabase.
--   · La tabla no tiene ninguna política para el cliente y sus permisos están
--     revocados (0127): nadie puede agregarse a sí mismo.
--   · Si otra cuenta intenta entrar, queda anotado y el dueño recibe un aviso.
--   · El parámetro `p_pass` sigue existiendo en las 60 funciones del panel para
--     no reescribirlas: se ignora.
-- ════════════════════════════════════════════════════════════════════════════

alter table public.brote_admins add column if not exists ultimo_acceso_at timestamptz;

insert into public.brote_admins (user_id, vinculado_por, nota)
values ('3d99b835-22a9-4dc4-a8c6-278f13a19721', '3d99b835-22a9-4dc4-a8c6-278f13a19721', 'dueño')
on conflict (user_id) do nothing;

-- Sólo el dueño, aunque antes de esta migración se hubiera vinculado otra.
delete from public.brote_admins where user_id <> '3d99b835-22a9-4dc4-a8c6-278f13a19721';

-- La contraseña vieja deja de existir, no sólo de usarse.
update public.admin_config set pass_hash = null, pass_salt = null, failed_count = 0, locked_until = null where id = 1;

create table if not exists public.panel_intentos (
  id      bigserial primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  at      timestamptz not null default now()
);
create index if not exists panel_intentos_at on public.panel_intentos (at desc);
alter table public.panel_intentos enable row level security;
revoke all on public.panel_intentos from public, anon, authenticated;

create or replace function public.admin_check(p_pass text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then return false; end if;

  if brote_es_admin(v_uid) then
    update brote_admins set ultimo_acceso_at = now()
     where user_id = v_uid and (ultimo_acceso_at is null or ultimo_acceso_at < now() - interval '5 minutes');
    return true;
  end if;

  -- Otra cuenta llegó hasta acá: se anota (con tope, para que no se pueda usar
  -- para llenar la tabla) y se avisa. Un aviso igual en media hora se junta.
  begin
    if brote_rate_limit('panel_intento:' || v_uid, 5, interval '1 hour') then
      insert into panel_intentos (user_id) values (v_uid);
      perform brote_avisar_admins(
        'panel_intento',
        'Alguien intentó abrir el panel',
        coalesce((select coalesce(display_name, username::text) from profiles where id = v_uid), 'Una cuenta')
          || ' no tiene acceso y no pudo entrar.',
        '/panel');
    end if;
  exception when others then
    null;  -- anotarlo nunca cambia la respuesta
  end;
  return false;
end $$;

-- Lo que le sirve a la pantalla: ¿esta sesión es del dueño? (sin anotar nada).
create or replace function public.panel_soy_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select brote_es_admin(auth.uid());
$$;
revoke all on function public.panel_soy_admin() from public, anon;
grant execute on function public.panel_soy_admin() to authenticated;

create or replace function public.admin_estado_acceso()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object('configurado', true, 'con_cuentas', true, 'soy_admin', brote_es_admin(auth.uid()),
                            'ingreso_reciente', true);
$$;

create or replace function public.admin_is_configured()
returns boolean
language sql
stable
security definer
set search_path = public
as $$ select true $$;

-- Lo que ya no existe: responden lo mismo que cualquier otra cosa prohibida.
create or replace function public.admin_set_password(p_new text, p_current text default null)
returns jsonb
language sql
as $$ select jsonb_build_object('ok', false, 'error', 'El panel ya no usa contraseña: se abre con tu cuenta.') $$;

create or replace function public.admin_recuperar_clave(p_nueva text)
returns jsonb
language sql
as $$ select jsonb_build_object('ok', false, 'error', 'El panel ya no usa contraseña: se abre con tu cuenta.') $$;

create or replace function public.admin_vincular_cuenta(p_pass text, p_email text default null)
returns jsonb
language sql
as $$ select jsonb_build_object('ok', false, 'error', 'El panel es de una sola cuenta. Otra se agrega desde el editor SQL de Supabase.') $$;

create or replace function public.admin_desvincular_cuenta(p_pass text, p_user uuid)
returns jsonb
language sql
as $$ select jsonb_build_object('ok', false, 'error', 'El panel es de una sola cuenta. Se cambia desde el editor SQL de Supabase.') $$;
