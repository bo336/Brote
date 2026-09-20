-- QA de seguridad de Negocios (fase 5 §2 y §3). NO es una migración.
--
-- Igual que `mercado.sql` y `cobro.sql`: cada bloque arma sus datos, prueba con
-- personas reales y termina con `raise exception 'QA_RESULT ...'`, así que la
-- transacción se deshace entera. Se corre pegando un bloque por vez.
--
-- Es la auditoría que pide la fase 5: las trece pruebas de RLS con dos usuarios
-- reales, el storage, los límites de uso, los términos, la salud de enlaces y
-- la sucesión de la titularidad.

-- ═══ Bloque 1 · RLS con dos personas reales (fase 5 §2.1) ═══
-- Esperado: 1_businesses_draft 0 · 2_dossier denegado · 3_objetivos 0 ·
--   4a/4b 0 · 5_verificaciones 0 · 6_suscripciones 0 · 7_clicks denegado ·
--   8_ai_jobs denegado · 9_listado_draft 0 · 9b_terminos 0 ·
--   10a/10b/10c denegado · 13a-13f null (la cookie no autoriza) ·
--   11a denegado, 11b solo_owner, 11c sin_permiso · 12 denegado.
do $qa$
declare
  u_a uuid := gen_random_uuid(); u_ed uuid := gen_random_uuid(); u_ad uuid := gen_random_uuid(); u_b uuid := gen_random_uuid();
  v_x uuid; v_l uuid; v_g uuid; res jsonb := '{}'; n int;
begin
  insert into auth.users (id, email, aud, role, created_at, email_confirmed_at)
  select x, x::text || '@qa.test', 'authenticated', 'authenticated', now() - interval '20 days', now() - interval '20 days'
  from unnest(array[u_a, u_ed, u_ad, u_b]) x;

  insert into businesses (slug, nombre_comercial, rubro, tamano, status, tier, provincia, sitio_web)
  values ('qa-sec-' || substr(md5(random()::text), 1, 6), 'Seguridad QA', 'produccion-alimentos', '2-10', 'draft', 'e1',
          'Buenos Aires', 'https://qasec.com.ar') returning id into v_x;
  insert into business_members (business_id, user_id, role) values (v_x, u_a, 'owner'), (v_x, u_ed, 'editor'), (v_x, u_ad, 'admin');
  insert into improvement_dossiers (business_id, energia) values (v_x, '{"secreto":"consumo real"}'::jsonb);
  insert into improvement_goals (business_id, titulo, porque, dominio, metrica, unidad, objetivo, horizonte, ambicion,
                                 esfuerzo_horas_mes, como_medir, evidencia_requerida, si_no_llegas, status, es_publico)
  values (v_x, 'Objetivo privado', 'porque sí', 'energia', 'kWh', 'kWh', 100, 'trimestral', 'basico', 2, 'medidor', 'foto', 'ajustar', 'activo', false)
  returning id into v_g;
  insert into goal_checkins (goal_id, business_id, autor_id, tipo, mensaje) values (v_g, v_x, u_a, 'no_llego', 'no llegamos');
  insert into goal_evidence (goal_id, business_id, storage_path, subido_por) values (v_g, v_x, v_x || '/g/ev.jpg', u_a);
  insert into business_verifications (business_id, method, token, target, status) values (v_x, 'dominio_meta', 'tok-secreto', 'qasec.com.ar', 'pendiente');
  insert into business_subscriptions (business_id, plan, status, external_id, monto) values (v_x, 'raiz', 'activa', 'qa-ext-sec', 12000);
  insert into ai_jobs (kind, business_id, input_hash, status) values ('objetivos', v_x, 'hash-qa', 'ok');
  insert into listings (business_id, slug, titulo, descripcion, categoria, url_destino, status)
  values (v_x, 'qa-sec-l-' || substr(md5(random()::text), 1, 5), 'Listado en borrador', repeat('Descripción larga. ', 6),
          'alimentos-frescos', 'https://qasec.com.ar/x', 'draft') returning id into v_l;
  insert into listing_clicks (listing_id, business_id, user_id, origen) values (v_l, v_x, u_a, 'catalogo');

  perform set_config('request.jwt.claims', json_build_object('sub', u_b, 'role', 'authenticated')::text, true);
  set local role authenticated;

  begin select count(*) into n from businesses where id = v_x; res := res || jsonb_build_object('1_businesses_draft', n::text);
  exception when others then res := res || jsonb_build_object('1_businesses_draft', 'denegado'); end;
  begin select count(*) into n from improvement_dossiers where business_id = v_x; res := res || jsonb_build_object('2_dossier', n::text);
  exception when others then res := res || jsonb_build_object('2_dossier', 'denegado'); end;
  begin select count(*) into n from improvement_goals where business_id = v_x; res := res || jsonb_build_object('3_objetivos', n::text);
  exception when others then res := res || jsonb_build_object('3_objetivos', 'denegado'); end;
  begin select count(*) into n from goal_checkins where business_id = v_x; res := res || jsonb_build_object('4a_checkins', n::text);
  exception when others then res := res || jsonb_build_object('4a_checkins', 'denegado'); end;
  begin select count(*) into n from goal_evidence where business_id = v_x; res := res || jsonb_build_object('4b_evidencia', n::text);
  exception when others then res := res || jsonb_build_object('4b_evidencia', 'denegado'); end;
  begin select count(*) into n from business_verifications where business_id = v_x; res := res || jsonb_build_object('5_verificaciones', n::text);
  exception when others then res := res || jsonb_build_object('5_verificaciones', 'denegado'); end;
  begin select count(*) into n from business_subscriptions where business_id = v_x; res := res || jsonb_build_object('6_suscripciones', n::text);
  exception when others then res := res || jsonb_build_object('6_suscripciones', 'denegado'); end;
  begin select count(*) into n from listing_clicks; res := res || jsonb_build_object('7_clicks', n::text);
  exception when others then res := res || jsonb_build_object('7_clicks', 'denegado'); end;
  begin select count(*) into n from ai_jobs where business_id = v_x; res := res || jsonb_build_object('8_ai_jobs', n::text);
  exception when others then res := res || jsonb_build_object('8_ai_jobs', 'denegado'); end;
  begin select count(*) into n from listings where id = v_l; res := res || jsonb_build_object('9_listado_draft', n::text);
  exception when others then res := res || jsonb_build_object('9_listado_draft', 'denegado'); end;
  begin select count(*) into n from business_terms where business_id = v_x; res := res || jsonb_build_object('9b_terminos', n::text);
  exception when others then res := res || jsonb_build_object('9b_terminos', 'denegado'); end;

  begin
    update businesses set nombre_comercial = 'Robada' where id = v_x;
    get diagnostics n = row_count;
    res := res || jsonb_build_object('10a_update_negocio', case when n = 0 then 'sin efecto' else 'MODIFICÓ (MAL)' end);
  exception when others then res := res || jsonb_build_object('10a_update_negocio', 'denegado'); end;
  begin
    update listings set titulo = 'Robado' where id = v_l;
    get diagnostics n = row_count;
    res := res || jsonb_build_object('10b_update_listado', case when n = 0 then 'sin efecto' else 'MODIFICÓ (MAL)' end);
  exception when others then res := res || jsonb_build_object('10b_update_listado', 'denegado'); end;
  begin
    delete from business_members where business_id = v_x;
    get diagnostics n = row_count;
    res := res || jsonb_build_object('10c_borra_equipo', case when n = 0 then 'sin efecto' else 'BORRÓ (MAL)' end);
  exception when others then res := res || jsonb_build_object('10c_borra_equipo', 'denegado'); end;

  -- Editar la cookie al id de otra empresa no da NINGÚN acceso: las RPC
  -- chequean membresía, no la cookie.
  res := res || jsonb_build_object(
    '13a_mis_listados', coalesce(mis_listados(v_x)::text, 'null'),
    '13b_mejora_estado', coalesce(mejora_estado(v_x)::text, 'null'),
    '13c_plan_estado', coalesce(negocio_plan_estado(v_x)::text, 'null'),
    '13d_analitica', coalesce(negocio_analitica(v_x, 30)::text, 'null'),
    '13e_sugerencias', coalesce(negocio_sugerencias_datos(v_x)::text, 'null'),
    '13f_detalle', coalesce(negocio_detalle(v_x)::text, 'null'));
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', u_ed, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    insert into business_members (business_id, user_id, role) values (v_x, u_b, 'editor');
    res := res || jsonb_build_object('11a_editor_suma_equipo', 'PERMITIDO (MAL)');
  exception when others then res := res || jsonb_build_object('11a_editor_suma_equipo', 'denegado'); end;
  res := res || jsonb_build_object('11b_editor_cotiza_plan', negocio_plan_cotizar(v_x, 'raiz')->>'error');
  res := res || jsonb_build_object('11c_editor_acepta_terminos', negocio_aceptar_terminos(v_x)->>'error');
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', u_ad, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    delete from businesses where id = v_x;
    get diagnostics n = row_count;
    res := res || jsonb_build_object('12_admin_borra_empresa', case when n = 0 then 'sin efecto' else 'BORRÓ (MAL)' end);
  exception when others then res := res || jsonb_build_object('12_admin_borra_empresa', 'denegado'); end;
  reset role;

  raise exception 'QA_RESULT %', res::text;
end $qa$;

-- ═══ Bloque 2 · Storage privado (fase 5 §2.3) ═══
-- Esperado: A sube y lee lo suyo (1) · B con la ruta exacta 0 · B listando 0 ·
--   B subiendo a la carpeta ajena denegado · anon 0 · bucket privado, 5 MB y
--   solo pdf/jpeg/png.
do $qa$
declare
  u_a uuid := gen_random_uuid(); u_b uuid := gen_random_uuid();
  v_x uuid; res jsonb := '{}'; n int; v_path text;
begin
  insert into auth.users (id, email, aud, role, created_at, email_confirmed_at)
  select x, x::text || '@qa.test', 'authenticated', 'authenticated', now() - interval '20 days', now() - interval '20 days'
  from unnest(array[u_a, u_b]) x;

  insert into businesses (slug, nombre_comercial, rubro, tamano, status, tier, provincia)
  values ('qa-sto-' || substr(md5(random()::text), 1, 6), 'Storage QA', 'produccion-alimentos', '2-10', 'approved', 'e1', 'Buenos Aires')
  returning id into v_x;
  insert into business_members (business_id, user_id, role) values (v_x, u_a, 'owner');
  v_path := v_x || '/afirmaciones/secreto.pdf';

  perform set_config('request.jwt.claims', json_build_object('sub', u_a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    insert into storage.objects (bucket_id, name, owner) values ('business-evidence', v_path, u_a);
    res := res || jsonb_build_object('A_sube', 'ok');
  exception when others then res := res || jsonb_build_object('A_sube', sqlerrm); end;
  begin
    select count(*) into n from storage.objects where bucket_id = 'business-evidence' and name = v_path;
    res := res || jsonb_build_object('A_lee_lo_suyo', n::text);
  exception when others then res := res || jsonb_build_object('A_lee_lo_suyo', 'denegado'); end;
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', u_b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    select count(*) into n from storage.objects where bucket_id = 'business-evidence' and name = v_path;
    res := res || jsonb_build_object('B_adivina_la_ruta', n::text);
  exception when others then res := res || jsonb_build_object('B_adivina_la_ruta', 'denegado'); end;
  begin
    select count(*) into n from storage.objects where bucket_id = 'business-evidence';
    res := res || jsonb_build_object('B_lista_el_bucket', n::text);
  exception when others then res := res || jsonb_build_object('B_lista_el_bucket', 'denegado'); end;
  begin
    insert into storage.objects (bucket_id, name, owner) values ('business-evidence', v_x || '/afirmaciones/intruso.pdf', u_b);
    res := res || jsonb_build_object('B_sube_a_carpeta_ajena', 'PERMITIDO (MAL)');
  exception when others then res := res || jsonb_build_object('B_sube_a_carpeta_ajena', 'denegado'); end;
  reset role;

  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  set local role anon;
  begin
    select count(*) into n from storage.objects where bucket_id = 'business-evidence';
    res := res || jsonb_build_object('anon_lee_evidencia', n::text);
  exception when others then res := res || jsonb_build_object('anon_lee_evidencia', 'denegado'); end;
  reset role;

  res := res || jsonb_build_object(
    'bucket_privado', (select not public from storage.buckets where id = 'business-evidence'),
    'tipos_permitidos', (select allowed_mime_types from storage.buckets where id = 'business-evidence'),
    'limite_bytes', (select file_size_limit from storage.buckets where id = 'business-evidence'));

  raise exception 'QA_RESULT %', res::text;
end $qa$;

-- ═══ Bloque 3 · Términos, enlaces caídos y límites de uso ═══
-- Esperado: enviar_sin_terminos = faltan_terminos · registro con quién y qué
--   versión · fallo 2 avisa y NO despublica · fallo 4 despublica
--   (despublicado_por = 'enlace') · un acierto pone el contador en 0 ·
--   20 reportes aceptados y el 21 rechazado.
do $qa$
declare
  u_owner uuid := gen_random_uuid(); u_rep uuid := gen_random_uuid();
  v_biz uuid; v_l uuid; res jsonb := '{}'; n int; t text; i int; v_ok int := 0; v_acept boolean;
begin
  insert into auth.users (id, email, aud, role, created_at, email_confirmed_at)
  select x, x::text || '@qa.test', 'authenticated', 'authenticated', now() - interval '10 days', now() - interval '10 days'
  from unnest(array[u_owner, u_rep]) x;

  insert into businesses (slug, nombre_comercial, rubro, tamano, status, tier, provincia, sitio_web)
  values ('qa-f5-' || substr(md5(random()::text), 1, 6), 'Endurecimiento QA', 'produccion-alimentos', '2-10', 'draft', 'e1',
          'Buenos Aires', 'https://qaf5.com.ar') returning id into v_biz;
  insert into business_members (business_id, user_id, role) values (v_biz, u_owner, 'owner');

  perform set_config('request.jwt.claims', json_build_object('sub', u_owner, 'role', 'authenticated')::text, true);
  begin
    update businesses set status = 'submitted' where id = v_biz;
    res := res || jsonb_build_object('enviar_sin_terminos', 'PERMITIDO (MAL)');
  exception when others then
    res := res || jsonb_build_object('enviar_sin_terminos', sqlerrm);
  end;
  perform negocio_aceptar_terminos(v_biz);
  v_acept := brote_terminos_aceptados(v_biz);
  update businesses set status = 'submitted' where id = v_biz;
  select version || ' · la aceptó quien corresponde: ' || (user_id = u_owner)::text into t
    from business_terms where business_id = v_biz;
  res := res || jsonb_build_object('aceptados', v_acept, 'registro', t,
                                   'estado', (select status::text from businesses where id = v_biz));
  perform set_config('request.jwt.claims', '', true);

  update businesses set status = 'approved' where id = v_biz;
  insert into listings (business_id, slug, titulo, descripcion, categoria, url_destino, status, publicado_at, tier_efectivo)
  values (v_biz, 'qa-enl-' || substr(md5(random()::text), 1, 5), 'Listado con enlace', repeat('Descripción larga. ', 6),
          'alimentos-frescos', 'https://qaf5.com.ar/roto', 'publicado', now(), 'e1')
  returning id into v_l;

  perform brote_link_health_fallo(v_l);
  perform brote_link_health_fallo(v_l);
  res := res || jsonb_build_object(
    'tras_2_fallos', (select status::text from listings where id = v_l),
    'avisos', (select count(*) from notifications where business_id = v_biz and title_es = 'Tu enlace no responde'));
  perform brote_link_health_fallo(v_l);
  perform brote_link_health_fallo(v_l);
  select status::text || '/' || coalesce(despublicado_por, '') into t from listings where id = v_l;
  res := res || jsonb_build_object('tras_4_fallos', t);

  update listings set status = 'publicado', link_fallos = 3 where id = v_l;
  update listings set link_fallos = 0 where id = v_l and link_fallos > 0;   -- lo que hace un acierto
  res := res || jsonb_build_object('acierto_resetea', (select link_fallos from listings where id = v_l));

  -- 22 listados distintos, un reporte en cada uno: el tope es 20 por día.
  perform set_config('request.jwt.claims', json_build_object('sub', u_rep, 'role', 'authenticated')::text, true);
  for i in 1..22 loop
    insert into listings (business_id, slug, titulo, descripcion, categoria, url_destino, status, publicado_at, tier_efectivo)
    values (v_biz, 'qa-r-' || i || '-' || substr(md5(random()::text), 1, 5), 'Listado QA ' || i,
            repeat('Descripción larga de prueba. ', 4), 'alimentos-frescos', 'https://qaf5.com.ar/' || i, 'publicado', now(), 'e1')
    returning id into v_l;
    begin
      insert into listing_reports (listing_id, business_id, user_id, motivo, detalle)
      values (v_l, v_biz, u_rep, 'afirmacion_falsa', 'No parece cierto lo que afirma este producto.');
      v_ok := v_ok + 1;
    exception when others then
      res := res || jsonb_build_object('tope_reportes', sqlerrm, 'freno_en', i);
    end;
  end loop;
  res := res || jsonb_build_object('reportes_aceptados', v_ok);
  perform set_config('request.jwt.claims', '', true);

  raise exception 'QA_RESULT %', res::text;
end $qa$;

-- ═══ Bloque 4 · Se va quien era dueño (02 §8, borde 3) ═══
-- Esperado: nuevo_dueno_es_el_admin = owner · la empresa sigue existiendo ·
--   la empresa de una sola persona queda 'suspended', NO borrada.
do $qa$
declare
  u_own uuid := gen_random_uuid(); u_adm uuid := gen_random_uuid(); u_ed uuid := gen_random_uuid();
  u_solo uuid := gen_random_uuid(); v_x uuid; v_y uuid; res jsonb := '{}'; t text;
begin
  insert into auth.users (id, email, aud, role, created_at, email_confirmed_at)
  select x, x::text || '@qa.test', 'authenticated', 'authenticated', now() - interval '30 days', now() - interval '30 days'
  from unnest(array[u_own, u_adm, u_ed, u_solo]) x;

  insert into businesses (slug, nombre_comercial, rubro, tamano, status, tier, provincia)
  values ('qa-suc-' || substr(md5(random()::text), 1, 6), 'Sucesión QA', 'produccion-alimentos', '2-10', 'approved', 'e1', 'Buenos Aires')
  returning id into v_x;
  insert into business_members (business_id, user_id, role, joined_at) values
    (v_x, u_own, 'owner', now() - interval '10 days'),
    (v_x, u_ed,  'editor', now() - interval '5 days'),
    (v_x, u_adm, 'admin', now() - interval '8 days');

  insert into businesses (slug, nombre_comercial, rubro, tamano, status, tier, provincia)
  values ('qa-suc2-' || substr(md5(random()::text), 1, 6), 'Sola QA', 'produccion-alimentos', '2-10', 'approved', 'e1', 'Buenos Aires')
  returning id into v_y;
  insert into business_members (business_id, user_id, role) values (v_y, u_solo, 'owner');

  delete from profiles where id = u_own;
  delete from profiles where id = u_solo;

  select role::text into t from business_members where business_id = v_x and user_id = u_adm;
  res := res || jsonb_build_object(
    'nuevo_dueno_es_el_admin', t,
    'sigue_habiendo_empresa', (select count(*) from businesses where id = v_x),
    'aviso', (select count(*) from notifications where business_id = v_x and title_es = 'Sos la nueva titular de la empresa'),
    'empresa_sola', (select status::text from businesses where id = v_y),
    'empresa_sola_existe', (select count(*) from businesses where id = v_y));

  raise exception 'QA_RESULT %', res::text;
end $qa$;
