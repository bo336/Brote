-- 0117 — Lo que la app no puede escribir directo.
--
-- Hasta acá, cualquier cuenta con sesión podía, desde la consola del navegador:
--
--   · `update profiles set account_type = 'adult'` — una cuenta de chico se
--     pasaba a adulto y entraba al Mercado, a los negocios, a la búsqueda de
--     personas y a todo lo que el tipo de cuenta protege. (Es el aviso
--     "profiles.account_type es editable desde el cliente".)
--   · la misma sentencia con `total_xp`, `current_rank_slug`, `plan`,
--     `plan_expires_at`, `is_verified`, `trust_score`, `suspended_until`,
--     `semillas`, `followers_count`… La política "profiles owner update" dejaba
--     tocar TODAS las columnas de la propia fila.
--   · `insert into activity_completions (… status 'verified')` con cualquier
--     acción: "Tu impacto real" suma esa tabla, así que el impacto se podía
--     inflar sin hacer nada. La política era `for all`.
--   · lo mismo con `user_domain_points`, `user_challenges`, `daily_sets` y
--     `user_habits`: puntos por tema, progreso de retos, el set del día.
--
-- Ninguna de esas escrituras la hace la app: todas pasan por funciones
-- `security definer` (complete_activity, complete_project_session,
-- award_verified, ensure_daily_set, add_habit/remove_habit, complete_goal…),
-- que no dependen de estos permisos. Así que se cierran sin tocar un flujo:
--
--   1. profiles: sin UPDATE de tabla. Sólo columnas que la persona edita de
--      verdad (nombre, ciudad, idioma, intereses, avisos, su Pip). El tipo de
--      cuenta se elige una vez, en el onboarding, con `brote_set_account_type`;
--      el fin del onboarding y el título equipado también son funciones que
--      validan. Sin INSERT: la fila la crea `handle_new_user`.
--   2. activity_completions, user_domain_points, user_challenges, daily_sets,
--      user_habits: sólo lectura de lo propio.
--
-- Resultado para el impacto real: lo mueven únicamente las acciones del día
-- (el set, la rutina) y las de la sección Acciones (el catálogo y las jornadas
-- de proyectos), porque son las únicas funciones que escriben
-- activity_completions. `lib/inicio/__tests__/impacto-origen.test.ts` lo vigila.

-- ── 1 · profiles ────────────────────────────────────────────────────────────

-- Revocar el UPDATE de tabla también revoca los permisos por columna.
revoke insert, update on public.profiles from anon, authenticated;
grant update (
  display_name,
  city,
  neighborhood,
  language,
  timezone,
  interests,
  context,
  notification_prefs,
  pip_style
) on public.profiles to authenticated;

drop policy if exists "profiles owner insert" on public.profiles;

-- El tipo de cuenta: una vez, antes de terminar el onboarding. Después, sólo
-- el panel (soporte) lo cambia.
create or replace function public.brote_set_account_type(p_type account_type)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_uid uuid := auth.uid();
  v_done boolean;
begin
  if v_uid is null then raise exception 'No autenticado' using errcode = 'P0001'; end if;
  if p_type is null then return jsonb_build_object('ok', false, 'error', 'tipo'); end if;
  select onboarding_completed into v_done from profiles where id = v_uid;
  if not found then return jsonb_build_object('ok', false, 'error', 'perfil'); end if;
  if v_done then
    return jsonb_build_object('ok', false, 'error', 'cerrado',
      'mensaje', 'El tipo de cuenta se elige al empezar. Para cambiarlo, escribinos.');
  end if;
  update profiles set account_type = p_type where id = v_uid;
  return jsonb_build_object('ok', true, 'account_type', p_type);
end $fn$;

-- Terminar el onboarding: sólo hacia adelante (nunca se vuelve a abrir, que
-- es lo que permitiría elegir de nuevo el tipo de cuenta).
create or replace function public.brote_finish_onboarding()
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'No autenticado' using errcode = 'P0001'; end if;
  update profiles set onboarding_completed = true where id = v_uid and onboarding_completed is not true;
  return jsonb_build_object('ok', true);
end $fn$;

-- Equipar un título: sólo uno que la persona ganó (o ninguno).
create or replace function public.equip_title(p_title_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'No autenticado' using errcode = 'P0001'; end if;
  if p_title_id is not null
     and not exists (select 1 from user_titles where user_id = v_uid and title_id = p_title_id) then
    return jsonb_build_object('ok', false, 'error', 'no_ganado', 'mensaje', 'Todavía no ganaste ese título.');
  end if;
  update profiles set equipped_title_id = p_title_id where id = v_uid;
  return jsonb_build_object('ok', true);
end $fn$;

revoke all on function public.brote_set_account_type(account_type) from public, anon;
revoke all on function public.brote_finish_onboarding() from public, anon;
revoke all on function public.equip_title(uuid) from public, anon;
grant execute on function public.brote_set_account_type(account_type) to authenticated;
grant execute on function public.brote_finish_onboarding() to authenticated;
grant execute on function public.equip_title(uuid) to authenticated;

-- ── 2 · Lo que suma puntos o impacto: sólo lectura ─────────────────────────

drop policy if exists "completions owner all" on public.activity_completions;
drop policy if exists "completions owner read" on public.activity_completions;
create policy "completions owner read" on public.activity_completions
  for select using ((select auth.uid()) = user_id);
revoke insert, update, delete, truncate on public.activity_completions from anon, authenticated;

-- "udp read" (lectura pública, para los rankings por tema) queda como está.
drop policy if exists "udp owner insert" on public.user_domain_points;
drop policy if exists "udp owner update" on public.user_domain_points;
drop policy if exists "udp owner delete" on public.user_domain_points;
revoke insert, update, delete, truncate on public.user_domain_points from anon, authenticated;

drop policy if exists "user_challenges owner" on public.user_challenges;
drop policy if exists "user_challenges owner read" on public.user_challenges;
create policy "user_challenges owner read" on public.user_challenges
  for select using ((select auth.uid()) = user_id);
revoke insert, update, delete, truncate on public.user_challenges from anon, authenticated;

drop policy if exists "daily_sets owner" on public.daily_sets;
drop policy if exists "daily_sets owner read" on public.daily_sets;
create policy "daily_sets owner read" on public.daily_sets
  for select using ((select auth.uid()) = user_id);
revoke insert, update, delete, truncate on public.daily_sets from anon, authenticated;

drop policy if exists "habits owner" on public.user_habits;
drop policy if exists "habits owner read" on public.user_habits;
create policy "habits owner read" on public.user_habits
  for select using ((select auth.uid()) = user_id);
revoke insert, update, delete, truncate on public.user_habits from anon, authenticated;
