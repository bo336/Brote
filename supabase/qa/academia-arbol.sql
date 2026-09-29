-- QA del Árbol de la Academia (0110 + 0111). NO es una migración.
--
-- Como los otros archivos de `supabase/qa/`: cada bloque crea una persona de
-- prueba, juega de verdad contra los RPC (con `request.jwt.claims` puesto y
-- SIN `set role`, que es exactamente como corre una función security definer)
-- y termina con `raise exception 'QA_RESULT ...'`, así que todo se deshace.
--
-- La respuesta correcta de cada paso se calcula acá, del lado del servidor,
-- con la misma solución y la misma permutación que usa el corrector. Es la
-- única forma de jugar "perfecto" sin mirar la pantalla.

-- ═══ Bloque 1 · Una persona nueva juega la unidad 1 del tronco de punta a punta ═══
do $qa$
declare
  u uuid := gen_random_uuid(); res jsonb := '{}'; m jsonb; s jsonb; r jsonb; t jsonb;
  v_unidad uuid; l1 uuid; l2 uuid; l6 uuid; l7 uuid; v_int uuid; v_primero uuid; ip record;
  n_ok int := 0; n int;
begin
  execute $f$
    create function pg_temp.qa_resp(p_ip uuid) returns jsonb language sql as $$
      select case p.tipo
        when 'opcion' then jsonb_build_object('elegido', ac_ficha_token(p.payload_publico, p.tipo, x.perm, p.solucion -> 'clave' ->> 0))
        when 'multiple' then jsonb_build_object('marcados', coalesce((select jsonb_agg(ac_ficha_token(p.payload_publico, p.tipo, x.perm, k)) from jsonb_array_elements_text(p.solucion -> 'clave') k), '[]'))
        when 'detectar' then jsonb_build_object('marcados', coalesce((select jsonb_agg(ac_ficha_token(p.payload_publico, p.tipo, x.perm, k)) from jsonb_array_elements_text(p.solucion -> 'clave') k), '[]'))
        when 'vf' then jsonb_build_object('valor', p.solucion -> 'valor')
                       || case when p.payload_publico ? 'razones'
                               then jsonb_build_object('razon', ac_ficha_token(p.payload_publico, p.tipo, x.perm, p.solucion -> 'clave' ->> 0))
                               else '{}'::jsonb end
        when 'clasificar' then jsonb_build_object('asignacion', (select jsonb_object_agg(ac_ficha_token(p.payload_publico, p.tipo, x.perm, key), value) from jsonb_each_text(p.solucion -> 'clave')))
        when 'emparejar' then jsonb_build_object('pares', (select jsonb_object_agg(key, ac_ficha_token(p.payload_publico, p.tipo, x.perm, value)) from jsonb_each_text(p.solucion -> 'clave')))
        when 'completar' then jsonb_build_object('huecos', (select jsonb_agg(ac_ficha_token(p.payload_publico, p.tipo, x.perm, k) order by o) from jsonb_array_elements_text(p.solucion -> 'clave') with ordinality e(k, o)))
        when 'numero' then jsonb_build_object('valor', p.solucion -> 'valor')
        when 'estimar' then jsonb_build_object('valor', p.solucion -> 'valor')
        else jsonb_build_object('orden', (select jsonb_agg(ac_ficha_token(p.payload_publico, p.tipo, x.perm, k) order by o) from jsonb_array_elements_text(p.solucion -> 'clave') with ordinality e(k, o)))
      end
      from ac_intento_pasos x join ac_pasos p on p.id = x.paso_id where x.id = p_ip
    $$ $f$;

  insert into auth.users (id, email, aud, role, created_at, email_confirmed_at)
  values (u, u::text || '@qa.test', 'authenticated', 'authenticated', now(), now());
  update profiles set account_type = 'adult', timezone = 'America/Argentina/Buenos_Aires' where id = u;
  perform set_config('request.jwt.claims', json_build_object('sub', u, 'role', 'authenticated')::text, true);

  select id into v_unidad from ac_unidades where slug = 'tronco-1';
  select id into l1 from ac_lecciones where slug = 'tronco-1.s1';
  select id into l2 from ac_lecciones where slug = 'tronco-1.s2';
  select id into l6 from ac_lecciones where slug = 'tronco-1.s6';
  select id into l7 from ac_lecciones where slug = 'tronco-1.s7';

  -- 1 · El mapa de una cuenta nueva.
  m := academia_mapa();
  res := res || jsonb_build_object(
    '1_mapa_ok', m -> 'ok',
    '1_tronco_estado', m #> '{ramas,0,unidades,0,estado}',
    '1_siguiente_motivo', m #> '{siguiente,motivo}',
    '1_siguiente_leccion', m #> '{siguiente,leccion,orden}',
    '1_repaso', m -> 'repaso');

  -- 2 · La sesión 2 está cerrada hasta hacer la 1.
  r := academia_empezar(l2);
  res := res || jsonb_build_object('2_s2_bloqueada', r ->> 'error');

  -- 3 · Empezar la sesión 1: cuántos pasos, y que NO viaje ninguna respuesta.
  s := academia_empezar(l1);
  v_int := (s ->> 'intento_id')::uuid;
  select count(*) into n from ac_intento_pasos where intento_id = v_int and graduable;
  res := res || jsonb_build_object(
    '3_ok', s -> 'ok',
    '3_pasos', jsonb_array_length(s -> 'pasos'),
    '3_graduables', n,
    '3_savia', s -> 'savia_gastada',
    '3_fuga', s::text ~ '"(clave|explicacion|por_opcion|tolerancia|valores|banda)"',
    '3_primer_paso', s #>> '{pasos,0,tipo}');

  -- Latencias creíbles: un paso respondido en 0 ms se marca como imposible.
  update ac_intento_pasos set issued_at = now() - interval '8 seconds' where intento_id = v_int;

  -- 4 · El primero mal, el resto bien.
  for ip in select * from ac_intento_pasos where intento_id = v_int and graduable order by orden loop
    if v_primero is null then
      v_primero := ip.id;
      r := academia_responder(ip.id, '{}'::jsonb);
      res := res || jsonb_build_object('4_mal_correcto', r -> 'correcto', '4_mal_reencolada', r -> 'reencolada',
                                       '4_mal_trae_explicacion', (r ->> 'explicacion') is not null);
    else
      r := academia_responder(ip.id, pg_temp.qa_resp(ip.id));
      if (r ->> 'correcto')::boolean then n_ok := n_ok + 1;
      else res := res || jsonb_build_object('4_fallo_' || ip.orden, r); end if;
    end if;
  end loop;
  res := res || jsonb_build_object('4_bien', n_ok, '4_de', n - 1);

  -- 5 · Responder dos veces el mismo paso.
  r := academia_responder(v_primero, '{}'::jsonb);
  res := res || jsonb_build_object('5_doble', r ->> 'error');

  -- 6 · No se cierra con el re-encolado pendiente.
  t := academia_terminar(v_int);
  res := res || jsonb_build_object('6_incompleta', t ->> 'error', '6_pendientes', t -> 'pendientes');

  update ac_intento_pasos set issued_at = now() - interval '8 seconds' where intento_id = v_int and answered_at is null;
  for ip in select * from ac_intento_pasos where intento_id = v_int and answered_at is null and graduable loop
    r := academia_responder(ip.id, pg_temp.qa_resp(ip.id));
    res := res || jsonb_build_object('6_reencolado_bien', r -> 'correcto');
  end loop;

  -- 7 · Terminar.
  t := academia_terminar(v_int);
  res := res || jsonb_build_object('7_ok', t -> 'ok', '7_score', t -> 'score', '7_aprobada', t -> 'aprobada',
    '7_xp', t -> 'xp', '7_semillas', t -> 'semillas', '7_primer_clear', t -> 'primer_clear',
    '7_siguiente', t #> '{siguiente,orden}', '7_racha', t -> 'racha');

  -- 8 · Savia: con el día gastado, la sesión NUEVA se niega y rehacer la hecha no.
  update ac_uso_diario set hojas = 5 where user_id = u;
  r := academia_empezar(l2);
  res := res || jsonb_build_object('8_sin_savia', r ->> 'error');
  r := academia_empezar(l1);
  res := res || jsonb_build_object('8_rehacer_ok', r -> 'ok', '8_rehacer_savia', r -> 'savia_gastada');
  t := academia_salir((r ->> 'intento_id')::uuid);
  res := res || jsonb_build_object('8_salir_reembolso', t -> 'reembolso');
  update ac_uso_diario set hojas = 0 where user_id = u;

  -- 9 · Reembolso: empezar la 2 y salir enseguida devuelve la savia.
  r := academia_empezar(l2);
  select hojas into n from ac_uso_diario where user_id = u;
  t := academia_salir((r ->> 'intento_id')::uuid);
  res := res || jsonb_build_object('9_hojas_antes', n, '9_reembolso', t -> 'reembolso',
                                   '9_hojas_despues', (select hojas from ac_uso_diario where user_id = u));

  -- 10 · La práctica: con 1..5 hechas, se arma sola con la unidad.
  insert into ac_user_leccion (user_id, leccion_id, mejor_score, intentos, completada_at)
  select u, id, 80, 1, now() from ac_lecciones where unidad_id = v_unidad and orden between 2 and 5
  on conflict do nothing;
  s := academia_empezar(l6);
  res := res || jsonb_build_object('10_practica_ok', s -> 'ok', '10_practica_pasos', jsonb_array_length(s -> 'pasos'));
  v_int := (s ->> 'intento_id')::uuid;
  update ac_intento_pasos set issued_at = now() - interval '8 seconds' where intento_id = v_int;
  for ip in select * from ac_intento_pasos where intento_id = v_int and graduable order by orden loop
    r := academia_responder(ip.id, pg_temp.qa_resp(ip.id));
  end loop;
  t := academia_terminar(v_int);
  res := res || jsonb_build_object('10_practica_score', t -> 'score');

  -- 11 · El desafío completa la unidad y abre las ramas.
  s := academia_empezar(l7);
  v_int := (s ->> 'intento_id')::uuid;
  res := res || jsonb_build_object('11_desafio_pasos', jsonb_array_length(s -> 'pasos'));
  update ac_intento_pasos set issued_at = now() - interval '8 seconds' where intento_id = v_int;
  for ip in select * from ac_intento_pasos where intento_id = v_int and graduable order by orden loop
    r := academia_responder(ip.id, pg_temp.qa_resp(ip.id));
  end loop;
  t := academia_terminar(v_int);
  res := res || jsonb_build_object('11_score', t -> 'score', '11_unidad_completa', t #> '{unidad,completa}',
    '11_ramas_abiertas', t -> 'ramas_abiertas', '11_xp', t -> 'xp', '11_semillas', t -> 'semillas');

  m := academia_mapa();
  res := res || jsonb_build_object('11_mapa_tronco', m #> '{ramas,0,unidades,0,estado}',
                                   '11_stats', m -> 'stats');

  -- 12 · El repaso: con la memoria envejecida cuatro días hay qué regar.
  update ac_user_memoria set last_seen = now() - interval '4 days' where user_id = u;
  r := academia_repasar();
  res := res || jsonb_build_object('12_repaso_ok', r -> 'ok', '12_repaso_pasos', jsonb_array_length(r -> 'pasos'),
    '12_todos_repaso', (select bool_and((x ->> 'repaso') is not null) from jsonb_array_elements(r -> 'pasos') x));

  -- 13 · Una lección rehecha con memoria vieja intercala repasos.
  r := academia_empezar(l1);
  res := res || jsonb_build_object('13_repasos_en_leccion',
    (select count(*) from jsonb_array_elements(r -> 'pasos') x where x -> 'repaso' <> 'null'::jsonb));

  -- 14 · Retomar una sesión terminada.
  r := academia_retomar(v_int);
  res := res || jsonb_build_object('14_retomar_terminado', r -> 'terminado',
    '14_con_correcciones', (select count(*) from jsonb_array_elements(r -> 'pasos') x where x -> 'correccion' <> 'null'::jsonb));

  -- 15 · La unidad por dentro.
  r := academia_unidad('tronco-1');
  res := res || jsonb_build_object('15_unidad_ok', r -> 'ok', '15_lecciones', jsonb_array_length(r -> 'lecciones'),
                                   '15_estado', r #> '{unidad,estado}');

  raise exception 'QA_RESULT %', res;
end $qa$;

-- ═══ Bloque 2 · Aislamiento: nadie lee soluciones ni permutaciones por PostgREST ═══
-- Esperado: todos 'denegado'.
do $qa$
declare u uuid := gen_random_uuid(); res jsonb := '{}'; n int;
begin
  insert into auth.users (id, email, aud, role, created_at, email_confirmed_at)
  values (u, u::text || '@qa.test', 'authenticated', 'authenticated', now(), now());
  perform set_config('request.jwt.claims', json_build_object('sub', u, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin select count(*) into n from ac_pasos; res := res || jsonb_build_object('pasos', n);
  exception when others then res := res || jsonb_build_object('pasos', 'denegado'); end;
  begin select count(*) into n from ac_intento_pasos; res := res || jsonb_build_object('intento_pasos', n);
  exception when others then res := res || jsonb_build_object('intento_pasos', 'denegado'); end;
  begin select count(*) into n from ac_unidades; res := res || jsonb_build_object('unidades', n);
  exception when others then res := res || jsonb_build_object('unidades', 'denegado'); end;
  begin select count(*) into n from ac_lecciones; res := res || jsonb_build_object('lecciones', n);
  exception when others then res := res || jsonb_build_object('lecciones', 'denegado'); end;
  begin perform ac_corregir('opcion', '{}', '{}', '{}', '{}'); res := res || jsonb_build_object('corregir', 'ejecutable');
  exception when others then res := res || jsonb_build_object('corregir', 'denegado'); end;
  begin perform ac_cargar_unidad('{}'); res := res || jsonb_build_object('cargar', 'ejecutable');
  exception when others then res := res || jsonb_build_object('cargar', 'denegado'); end;
  raise exception 'QA_RESULT %', res;
end $qa$;
