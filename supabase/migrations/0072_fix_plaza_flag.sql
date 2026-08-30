-- Brote — 0072 — `set_plaza_flag` que de verdad guarda.
-- Feed v2 ("La Plaza") fase 3, paso 4 (corrección de 0067).
--
-- BUG REAL, y silencioso del peor modo: la función devolvía `{"ok": true}` y no
-- escribía nada. El aviso de "lo que publicás es público" volvía a aparecer en
-- cada publicación, para siempre.
--
-- La causa es un detalle de `jsonb_set`: su cuarto argumento `create_missing`
-- crea la ÚLTIMA clave del camino, no los niveles intermedios. Con
--
--     jsonb_set(context, array['plaza','consent_at'], ..., true)
--
-- y un `context` que no tiene todavía la clave `plaza`, el camino no existe,
-- así que devuelve el jsonb ORIGINAL sin tocar y sin quejarse. El UPDATE
-- corría, actualizaba una fila, y la fila quedaba igual.
--
-- Se reemplaza por dos merges explícitos, que sí crean el nivel intermedio, y
-- se hace que la función devuelva el valor guardado en vez de un `ok` a ciegas:
-- si algo no se escribe, ahora se ve.

create or replace function set_plaza_flag(p_key text, p_value jsonb default 'true'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_uid uuid := auth.uid();
  v_plaza jsonb;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'Iniciá sesión');
  end if;
  -- Lista cerrada: esta función no es un almacén de datos arbitrarios.
  if p_key not in ('consent_at', 'first_post_seen') then
    return jsonb_build_object('ok', false, 'error', 'Clave inválida');
  end if;

  update profiles
     set context = coalesce(context, '{}'::jsonb)
                || jsonb_build_object(
                     'plaza',
                     coalesce(context -> 'plaza', '{}'::jsonb) || jsonb_build_object(p_key, p_value))
   where id = v_uid
   returning context -> 'plaza' into v_plaza;

  if v_plaza is null then
    return jsonb_build_object('ok', false, 'error', 'No se pudo guardar');
  end if;

  -- Devolver lo guardado, no un ok a ciegas: así un fallo se nota.
  return jsonb_build_object('ok', true, 'plaza', v_plaza);
end;
$fn$;

revoke all on function set_plaza_flag(text, jsonb) from public, anon, authenticated;
grant execute on function set_plaza_flag(text, jsonb) to authenticated;
