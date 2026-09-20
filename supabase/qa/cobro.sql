-- QA del cobro y los topes de plan (Negocios, fase 4). NO es una migración.
--
-- Igual que `mercado.sql`: cada bloque arma sus datos, prueba, y termina con
-- `raise exception 'QA_RESULT ...'`, así que la transacción se deshace entera
-- —incluida la bandera `negocios_cobro_activo`, que los dos bloques prenden
-- para poder probar el cobro sin prenderlo de verdad.
--
-- Truco que se usa acá: en vez de `set role authenticated` se fija solo el JWT
-- (`request.jwt.claims`). Así la sentencia corre con los permisos del dueño de
-- la tabla y `auth.uid()` devuelve a la persona — que es exactamente lo que
-- pasa dentro de una RPC `security definer`, donde viven todas las escrituras.

-- ═══ Bloque 1 · Modo fundador, prueba, topes y modo lectura ═══
-- Esperado:
--   fundador = true (es de las primeras 30);
--   cobro apagado → plan raiz, escritura true, tope 15, acelerada e historial true;
--   cobro prendido sin suscripción → plan semilla, escritura false, tope 3,
--   analítica completa false;
--   cron_1 abre la prueba (90 días por fundadora) y la escritura vuelve;
--   de 4 listados se envían 3, el 4º da 'limite_plan' y queda 1 en borrador;
--   con la prueba vencida el cron despublica 3 (despublicado_por = 'cobro'),
--   la escritura queda en false y tocar el dossier da 'solo_lectura'.
do $qa$
declare
  u_owner uuid := gen_random_uuid(); v_biz uuid; r jsonb; res jsonb := '{}'; n int; t text; i int; v_ok int := 0;
begin
  insert into auth.users (id, email, aud, role, created_at, email_confirmed_at)
  values (u_owner, u_owner::text || '@qa.test', 'authenticated', 'authenticated', now() - interval '10 days', now() - interval '10 days');

  insert into businesses (slug, nombre_comercial, rubro, tamano, status, tier, provincia, sitio_web, ultima_revision)
  values ('qa-plan-' || substr(md5(random()::text), 1, 6), 'Plan QA', 'produccion-alimentos', '2-10', 'submitted', 'e1',
          'Buenos Aires', 'https://qaplan.com.ar', now()) returning id into v_biz;
  insert into business_members (business_id, user_id, role) values (v_biz, u_owner, 'owner');

  update businesses set status = 'approved' where id = v_biz;
  select fundador::text into t from businesses where id = v_biz;
  res := res || jsonb_build_object('fundador', t);

  res := res || jsonb_build_object(
    'cobro_activo', brote_biz_cobro_activo(),
    'plan_fundador', brote_negocio_plan(v_biz),
    'escritura_fundador', brote_biz_escritura(v_biz),
    'limite_listados_fundador', brote_biz_limite(v_biz, 'listados'),
    'acelerada_permitida', brote_negocio_permite(v_biz, 'acelerada'),
    'historial_publico', brote_negocio_permite(v_biz, 'historial_publico'));

  update app_settings set value = 'true'::jsonb where key = 'negocios_cobro_activo';
  res := res || jsonb_build_object(
    'plan_sin_sub', brote_negocio_plan(v_biz),
    'escritura_sin_sub', brote_biz_escritura(v_biz),
    'limite_semilla', brote_biz_limite(v_biz, 'listados'),
    'analitica_completa_semilla', brote_negocio_permite(v_biz, 'analitica_completa'));

  res := res || jsonb_build_object('cron_1', brote_negocios_cobro());
  select (prueba_fin > now() + interval '80 days')::text into t from businesses where id = v_biz;
  res := res || jsonb_build_object('prueba_90d_fundadora', t, 'escritura_en_prueba', brote_biz_escritura(v_biz));

  for i in 1..4 loop
    insert into listings (business_id, slug, titulo, descripcion, categoria, url_destino, status)
    values (v_biz, 'qa-p-' || i || '-' || substr(md5(random()::text), 1, 5), 'Listado QA ' || i,
            repeat('Descripción larga de prueba. ', 4), 'alimentos-frescos', 'https://qaplan.com.ar/' || i, 'draft');
  end loop;

  perform set_config('request.jwt.claims', json_build_object('sub', u_owner, 'role', 'authenticated')::text, true);
  for r in select to_jsonb(l) from listings l where l.business_id = v_biz order by l.slug loop
    begin
      update listings set status = 'pendiente' where id = (r->>'id')::uuid;
      v_ok := v_ok + 1;
    exception when others then
      res := res || jsonb_build_object('tope_listados_error', sqlerrm);
    end;
  end loop;
  res := res || jsonb_build_object('listados_enviados', v_ok);
  select count(*) into n from listings where business_id = v_biz and status = 'draft';
  res := res || jsonb_build_object('quedan_en_borrador', n);
  perform set_config('request.jwt.claims', '', true);

  update businesses set prueba_fin = now() - interval '1 day' where id = v_biz;
  update listings set status = 'publicado', publicado_at = now() where business_id = v_biz and status = 'pendiente';
  res := res || jsonb_build_object('cron_2', brote_negocios_cobro());
  select count(*) into n from listings where business_id = v_biz and status = 'despublicado' and despublicado_por = 'cobro';
  res := res || jsonb_build_object('despublicados_por_cobro', n,
                                   'escritura_tras_prueba', brote_biz_escritura(v_biz));

  perform set_config('request.jwt.claims', json_build_object('sub', u_owner, 'role', 'authenticated')::text, true);
  begin
    insert into improvement_dossiers (business_id, energia) values (v_biz, '{"x":1}'::jsonb);
    res := res || jsonb_build_object('dossier_en_lectura', 'PERMITIDO (MAL)');
  exception when others then
    res := res || jsonb_build_object('dossier_en_lectura', sqlerrm);
  end;
  perform set_config('request.jwt.claims', '', true);

  raise exception 'QA_RESULT %', res::text;
end $qa$;

-- ═══ Bloque 2 · La suscripción, evento por evento ═══
-- Esperado:
--   evento_1 true y evento_1_repetido false, con una sola fila (idempotencia);
--   authorized → activa, plan raiz, escritura true, cambio_1 true, cambio_2 false
--   y UN solo aviso "Suscripción activa";
--   pago rechazado → en_gracia, listado SIGUE publicado, gracia de 7 días y
--   penalizacion = 15 exacta en el puntaje;
--   gracia vencida → vencida y despublicado;
--   volver a pagar → activa y republicado;
--   la referencia de una persona no se confunde con una empresa.
do $qa$
declare
  u_owner uuid := gen_random_uuid(); v_biz uuid; v_ext text := 'qa-preapproval-1';
  r jsonb; res jsonb := '{}'; n int; v_score numeric; v_score2 numeric; t text;
begin
  insert into auth.users (id, email, aud, role, created_at, email_confirmed_at)
  values (u_owner, u_owner::text || '@qa.test', 'authenticated', 'authenticated', now(), now());

  insert into businesses (slug, nombre_comercial, rubro, tamano, status, tier, provincia, sitio_web, ultima_revision)
  values ('qa-sub-' || substr(md5(random()::text), 1, 6), 'Sub QA', 'produccion-alimentos', '2-10', 'approved', 'e1',
          'Buenos Aires', 'https://qasub.com.ar', now()) returning id into v_biz;
  insert into business_members (business_id, user_id, role) values (v_biz, u_owner, 'owner');
  update app_settings set value = 'true'::jsonb where key = 'negocios_cobro_activo';

  insert into listings (business_id, slug, titulo, descripcion, categoria, url_destino, status, publicado_at, tier_efectivo)
  values (v_biz, 'qa-s1-' || substr(md5(random()::text), 1, 5), 'Listado suscripción', repeat('Descripción larga. ', 6),
          'alimentos-frescos', 'https://qasub.com.ar/1', 'publicado', now(), 'e1');
  perform brote_recalcular_scores(v_biz);
  select score into v_score from listings where business_id = v_biz;

  res := res || jsonb_build_object(
    'evento_1', pagos_evento_registrar('notif-1', 'subscription_preapproval', v_ext, '{"id":"notif-1"}'::jsonb),
    'evento_1_repetido', pagos_evento_registrar('notif-1', 'subscription_preapproval', v_ext, '{"id":"notif-1"}'::jsonb));
  select count(*) into n from pagos_eventos where clave = 'notif-1';
  res := res || jsonb_build_object('filas_evento', n);

  r := negocio_suscripcion_aplicar(v_biz, v_ext, 'authorized', null, 'raiz', 12000, 'ARS', now() + interval '30 days', '{"x":1}'::jsonb);
  res := res || jsonb_build_object('aplicar_activa', r->>'status', 'cambio_1', r->>'cambio',
                                   'plan_tras_activa', brote_negocio_plan(v_biz),
                                   'escritura_tras_activa', brote_biz_escritura(v_biz));
  r := negocio_suscripcion_aplicar(v_biz, v_ext, 'authorized', null, 'raiz', 12000, 'ARS', now() + interval '30 days', '{"x":1}'::jsonb);
  res := res || jsonb_build_object('cambio_2', r->>'cambio');
  select count(*) into n from notifications where business_id = v_biz and title_es = 'Suscripción activa';
  res := res || jsonb_build_object('avisos_activa', n);

  r := negocio_suscripcion_aplicar(v_biz, v_ext, 'authorized', 'rejected', 'raiz', 12000, 'ARS', null, '{"x":2}'::jsonb);
  select count(*) into n from listings where business_id = v_biz and status = 'publicado';
  select score into v_score2 from listings where business_id = v_biz;
  select (gracia_fin between now() + interval '6 days' and now() + interval '8 days')::text into t
    from business_subscriptions where external_id = v_ext;
  res := res || jsonb_build_object('gracia', r->>'status', 'publicados_en_gracia', n, 'gracia_7d', t,
    'score_antes', v_score, 'score_en_gracia', v_score2, 'penalizacion', v_score - v_score2,
    'escritura_en_gracia', brote_biz_escritura(v_biz));

  update business_subscriptions set gracia_fin = now() - interval '1 hour' where external_id = v_ext;
  res := res || jsonb_build_object('cron', brote_negocios_cobro());
  select status::text into t from business_subscriptions where external_id = v_ext;
  select count(*) into n from listings where business_id = v_biz and status = 'despublicado' and despublicado_por = 'cobro';
  res := res || jsonb_build_object('estado_final', t, 'despublicados', n);

  r := negocio_suscripcion_aplicar(v_biz, v_ext, 'authorized', 'approved', 'raiz', 12000, 'ARS', now() + interval '30 days', '{"x":3}'::jsonb);
  select count(*) into n from listings where business_id = v_biz and status = 'publicado';
  res := res || jsonb_build_object('tras_pagar', r->>'status', 'republicados', n);

  res := res || jsonb_build_object(
    'ref_empresa', pagos_negocio_de_referencia(v_biz::text) is not null,
    'ref_persona', pagos_negocio_de_referencia(u_owner::text) is null,
    'ref_basura', pagos_negocio_de_referencia('no-es-uuid') is null);

  raise exception 'QA_RESULT %', res::text;
end $qa$;
