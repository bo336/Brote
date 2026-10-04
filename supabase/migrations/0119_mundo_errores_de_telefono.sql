-- 0119 — Cuando el mundo no abre en un teléfono, que quede escrito.
--
-- El "no abre en el celular" (R10) no se pudo reproducir en ningún emulador:
-- un emulador no se queda sin memoria ni le falta WebGL 2. La app ahora atrapa
-- esos fallos (components/mundo3d/MundoSeguro.tsx) y los reporta acá, para que
-- el próximo se vea con el modelo de teléfono, el navegador y qué pasó.
--
-- Nada personal más allá de la cuenta: tipo de fallo, mensaje y lo que el
-- aparato dice de sí (user agent, densidad de pantalla, núcleos). Tope de 20
-- por cuenta y por día. Se lee sólo desde /panel, con la contraseña.

create table if not exists public.world_client_errors (
  id         bigserial primary key,
  user_id    uuid references auth.users(id) on delete cascade,
  kind       text not null check (kind in ('sin_webgl2', 'render', 'contexto_perdido', 'arranque_liviano')),
  message    text not null,
  info       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_world_client_errors_at on public.world_client_errors (created_at desc);
create index if not exists idx_world_client_errors_user on public.world_client_errors (user_id, created_at desc);
alter table public.world_client_errors enable row level security;
revoke all on public.world_client_errors from public, anon, authenticated;

create or replace function public.world_report_client_error(p_kind text, p_message text, p_info jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_uid uuid := auth.uid();
  v_n int;
begin
  if v_uid is null then return; end if;
  if p_kind is null or p_kind not in ('sin_webgl2', 'render', 'contexto_perdido', 'arranque_liviano') then return; end if;
  select count(*) into v_n from world_client_errors
   where user_id = v_uid and created_at > now() - interval '1 day';
  if v_n >= 20 then return; end if;
  insert into world_client_errors (user_id, kind, message, info)
  values (
    v_uid, p_kind, left(coalesce(p_message, ''), 500),
    case when jsonb_typeof(p_info) = 'object' and length(p_info::text) <= 4000 then p_info else '{}'::jsonb end
  );
end $fn$;

create or replace function public.admin_mundo_errores(p_pass text, p_limit int default 60)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if not admin_check(p_pass) then
    return jsonb_build_object('ok', false, 'error', 'Contraseña incorrecta');
  end if;
  return jsonb_build_object(
    'ok', true,
    'resumen', (select coalesce(jsonb_object_agg(kind, n), '{}'::jsonb)
                  from (select kind, count(*) n from world_client_errors
                         where created_at > now() - interval '14 days' group by kind) k),
    'filas', (select coalesce(jsonb_agg(jsonb_build_object(
                  'kind', e.kind, 'message', e.message, 'info', e.info, 'at', e.created_at,
                  'usuario', p.username) order by e.created_at desc), '[]'::jsonb)
                from (select * from world_client_errors order by created_at desc
                       limit greatest(1, least(200, coalesce(p_limit, 60)))) e
                left join profiles p on p.id = e.user_id));
end $fn$;

revoke all on function public.world_report_client_error(text, text, jsonb) from public, anon;
revoke all on function public.admin_mundo_errores(text, int) from public, anon;
grant execute on function public.world_report_client_error(text, text, jsonb) to authenticated;
grant execute on function public.admin_mundo_errores(text, int) to authenticated;
