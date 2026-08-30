-- Brote — 0076 — El perfil dice si ya pediste seguirlo.
-- Feed v2 ("La Plaza") fase 3, cierre.
--
-- Sin esto, al volver a un perfil privado al que ya le mandaste una solicitud
-- el botón dice "Seguir" otra vez. Tocarlo no rompe nada (la solicitud queda
-- igual por el ON CONFLICT DO NOTHING) pero la pantalla te miente sobre el
-- estado en el que estás.
--
-- Se aplica con un reemplazo sobre el cuerpo vivo en vez de reescribir la
-- función entera: `get_public_profile_v2` son 120 líneas de estadísticas
-- reales, y copiarlas para agregar un campo es exactamente cómo se pierde una.
--
-- La condición va INLINE y no en una variable a propósito. El cuerpo tiene
-- cuatro `return jsonb_build_object('ok', false ...)` distintos (no existe,
-- cuenta infantil, bloqueada, privada) y `replace()` en SQL reemplaza TODAS las
-- ocurrencias: anclar ahí para asignar una variable la habría insertado también
-- antes de que el perfil esté cargado. El bloque `viewer`, en cambio, aparece
-- exactamente dos veces —la rama privada y la visible— y las dos necesitan el
-- campo, así que reemplazar todas las ocurrencias es justo lo que se quiere.

do $mig$
declare v_src text; v_args text; v_new text;
begin
  select prosrc, pg_get_function_arguments(oid) into v_src, v_args
    from pg_proc where proname = 'get_public_profile_v2'
      and pronamespace = 'public'::regnamespace limit 1;

  if v_src is null then
    raise exception 'get_public_profile_v2 no existe';
  end if;
  if v_src like '%''requested''%' then
    return; -- ya aplicada
  end if;

  v_new := replace(v_src,
    '''follows_me'', v_follows_me, ''is_blocked'', v_blocked, ''can_see''',
    '''follows_me'', v_follows_me, ''is_blocked'', v_blocked,'
    || ' ''requested'', exists (select 1 from follow_requests fr'
    || ' where fr.requester_id = v_me and fr.target_id = p.id), ''can_see''');

  if v_new = v_src then
    raise exception 'El bloque viewer no coincide: revisar get_public_profile_v2';
  end if;

  execute format(
    'create or replace function get_public_profile_v2(%s) returns jsonb '
    'language plpgsql stable security definer set search_path = public as %L',
    v_args, v_new);
end;
$mig$;

revoke all on function get_public_profile_v2(text) from public, anon;
grant execute on function get_public_profile_v2(text) to authenticated;
