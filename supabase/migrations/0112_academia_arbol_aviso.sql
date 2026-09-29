-- Brote — 0112 — La Academia, el Árbol: el aviso nocturno de repaso.
--
-- `academia_mantenimiento_diario()` (0082) mandaba el aviso de "regá tu
-- bosque" leyendo la memoria del modelo anterior (`ac_user_concepto`). Con el
-- Árbol, lo que se aprende se guarda en `ac_user_memoria`: sin este cambio, el
-- aviso seguiría mirando una tabla que nadie actualiza y no avisaría nunca.
--
-- Se reemplaza SOLO el aviso. El cribado y el pool hambriento del pipeline
-- anterior siguen corriendo igual: no molestan y siguen siendo del panel.
--
-- Mismas reglas de siempre: un aviso por día como máximo, solo si se está
-- olvidando algo que se sabía de verdad, respetando `notification_prefs`, y
-- nunca el mismo día que un aviso de racha.

create or replace function academia_mantenimiento_diario()
returns jsonb language plpgsql volatile security definer set search_path = public as $fn$
declare v_criba jsonb; v_hambre jsonb; v_avisos int := 0; r record;
begin
  if not ac_setting_bool('academia_enabled', true) then
    return jsonb_build_object('ok', true, 'saltado', 'academia apagada');
  end if;

  v_criba := academia_cribado_psicometrico(false);
  v_hambre := academia_pool_hambriento(40);

  -- "Se está olvidando": lo acertaba (maestría ≥ 0,6), no lo ve hace más de un
  -- día, y la fuerza (maestría × retrievability) cayó por debajo de 0,45.
  for r in
    select m.user_id, count(*) as olvidandose
      from ac_user_memoria m
      join profiles p on p.id = m.user_id
     where m.mastery >= 0.6
       and m.last_seen < now() - interval '1 day'
       and m.mastery * ac_retrievability(m.last_seen, m.half_life) < 0.45
       and coalesce((p.notification_prefs->>'academia')::boolean, true)
       and exists (select 1 from ac_pasos x where x.grupo = m.grupo and x.status = 'aprobado' and x.repasable)
       and not exists (
         select 1 from notifications n
          where n.user_id = m.user_id
            and n.created_at > now() - interval '20 hours'
            and n.type in ('academia_riego', 'streak_risk', 'streak_lost'))
     group by m.user_id
     having count(*) >= 4
     limit 500
  loop
    insert into notifications (user_id, type, title_es, body_es, data)
    values (r.user_id, 'academia_riego',
            'Tu árbol pide un repaso',
            format('Hay %s cosas que aprendiste y se te están por olvidar. Un repaso corto las vuelve a fijar, y es gratis.', r.olvidandose),
            jsonb_build_object('url', '/aprender/repaso', 'count', r.olvidandose));
    v_avisos := v_avisos + 1;
  end loop;

  return jsonb_build_object(
    'ok', true,
    'retirados', v_criba->'retirados',
    'pools_flacos', jsonb_array_length(v_hambre),
    'avisos_repaso', v_avisos);
end $fn$;

revoke all on function academia_mantenimiento_diario() from public, anon, authenticated;
