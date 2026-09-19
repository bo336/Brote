-- ─────────────────────────────────────────────────────────────────────────────
-- 0088 · Cerrar un anillo y abrir el siguiente.
--
-- HUECO REAL DE LAS FASES 1 Y 2: `ac_user_anillo` tiene `cerrado_at` desde
-- 0077 y NADA lo escribía. `academia_arbol` calcula el anillo actual como
-- `max(anillo) where cerrado_at is null`, así que todo el mundo se quedaba en
-- el anillo 1 para siempre: los gajos de anillo 2 nunca dejaban de ser
-- `latente`. El árbol no crecía.
--
-- Un anillo se cierra cuando TODOS los gajos alcanzables de ese anillo están
-- frondosos. "Alcanzables" importa: un gajo latente por un prerrequisito que
-- vive en un anillo superior no puede bloquear el cierre, porque no hay forma
-- de completarlo desde acá.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function academia_cerrar_anillo()
returns jsonb language plpgsql volatile security definer set search_path = public as $fn$
declare
  v_uid uuid := auth.uid(); v_acc text; v_anillo int; v_techo int;
  v_total int; v_frondosos int; v_nombre text;
begin
  if v_uid is null then raise exception 'No autenticado' using errcode = 'P0001'; end if;
  if not ac_setting_bool('academia_enabled', true) then
    return jsonb_build_object('ok', true, 'cerrado', false);
  end if;

  v_acc := brote_account_type(v_uid);
  v_techo := ac_setting_int('academia_anillo_techo', 6);

  insert into ac_user_anillo (user_id, anillo) values (v_uid, 1) on conflict do nothing;
  select coalesce(max(anillo), 1) into v_anillo from ac_user_anillo
   where user_id = v_uid and cerrado_at is null;

  if v_anillo >= v_techo then
    return jsonb_build_object('ok', true, 'cerrado', false, 'motivo', 'techo');
  end if;

  -- Los gajos de ESTE anillo, y cuántos están frondosos. Un gajo está frondoso
  -- cuando la maestría media de sus conceptos llega a 0,85 — la misma cuenta
  -- que hace `academia_arbol`, para que la pantalla y esto no se contradigan.
  with gc as (
    select distinct g.id as gajo_id, hc.concepto_id
    from ac_gajos g
    join ac_hojas h on h.gajo_id = g.id and h.status = 'aprobado'
    join ac_hoja_conceptos hc on hc.hoja_id = h.id
    join ac_conceptos c on c.id = hc.concepto_id and c.status = 'aprobado'
    where g.status = 'aprobado' and g.anillo = v_anillo
      and g.age_groups @> array[v_acc] and c.age_groups @> array[v_acc]
  ),
  agg as (
    select gc.gajo_id, avg(coalesce(uc.mastery_ema, 0)) as m
    from gc left join ac_user_concepto uc
      on uc.concepto_id = gc.concepto_id and uc.user_id = v_uid
    group by gc.gajo_id
  )
  select count(*), count(*) filter (where m >= 0.85) into v_total, v_frondosos from agg;

  if v_total = 0 or v_frondosos < v_total then
    return jsonb_build_object('ok', true, 'cerrado', false,
      'anillo', v_anillo, 'frondosos', v_frondosos, 'total', v_total);
  end if;

  update ac_user_anillo set cerrado_at = now()
   where user_id = v_uid and anillo = v_anillo and cerrado_at is null;
  insert into ac_user_anillo (user_id, anillo) values (v_uid, v_anillo + 1)
  on conflict do nothing;

  select nombre_es into v_nombre from ac_anillos where n = v_anillo + 1;

  return jsonb_build_object('ok', true, 'cerrado', true,
    'anillo_cerrado', v_anillo, 'anillo', v_anillo + 1,
    'nombre', coalesce(v_nombre, 'Anillo ' || (v_anillo + 1)),
    'gajos', v_total);
end $fn$;

revoke all on function academia_cerrar_anillo() from public, anon, authenticated;
grant execute on function academia_cerrar_anillo() to authenticated;
