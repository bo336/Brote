-- QA del Mercado (Negocios, fase 3) contra la base viva. NO es una migración.
--
-- Cada bloque arma sus datos, prueba como cada tipo de cuenta y termina con
-- `raise exception 'QA_RESULT ...'`: la transacción se deshace entera y no
-- queda nada escrito. El resultado viene en el mensaje de error. Se corre
-- pegando un bloque por vez en el SQL editor (o `execute_sql`), y se compara
-- contra lo esperado que figura arriba de cada uno.
--
-- La fase 5 pide repetir las pruebas de menores (08 §9): están acá para eso.

-- ═══ Bloque 1 · Afirmaciones, publicación, antihalo, salida, menores, reportes ═══
-- Esperado:
--   los 8 rechazos de claim_guardar con su código (no_toxico_sin_doc, biodegradable_24m,
--   reciclable_sin_disp, reciclado_sin_pct, fsc_libre_de, renovable_60, argencert,
--   carbono_sin_verif); enviar_100_ecologico y enviar_cura bloqueados con su término;
--   enviar_ok = pendiente; autopublicar_directo y autoaprobar_directo = denegado;
--   ajeno_ve_pendiente = 0 y sin ficha; publicar = true;
--   tras_publicar: c1 e3, c2 e1, negocio e3, score 65.5; halo = true;
--   adulto_niveles [e3, e1], precio 4200, solo el dominio; salida sin url hasta el clic;
--   lee_clicks y lee_precio_directo = denegado; clic_registrado = 1;
--   teen sin precio y sin bebidas (RPC y RLS); kid 0 en catálogo, sin ficha, salir = error, RLS 0;
--   tras_vencer: c1 e2, sigue publicado, score 50.5, negocio e2;
--   filas_de_a = 1 de 10 intentos; tras_dos_reportes = despublicado/reportes;
--   confirmar_sin_descargo = error; descargo ok; confirmar ok; tras_resolver = despublicado.
do $qa$
declare
  u_owner uuid := gen_random_uuid(); u_a uuid := gen_random_uuid(); u_b uuid := gen_random_uuid();
  u_kid uuid := gen_random_uuid(); u_teen uuid := gen_random_uuid(); u_ajeno uuid := gen_random_uuid();
  v_biz uuid; v_l uuid; v_l3 uuid; v_beb uuid; v_c1 uuid; v_c2 uuid; v_rep_a uuid; v_rep_b uuid;
  r jsonb; res jsonb := '{}'; n int; t text; v_slug text; v_desc text;
  PASS constant text := 'clave-qa';
begin
  update admin_config set pass_salt = 'qa', pass_hash = encode(extensions.digest('qa' || PASS, 'sha256'), 'hex'),
         failed_count = 0, locked_until = null where id = 1;
  insert into auth.users (id, email, aud, role, created_at, email_confirmed_at)
  select x, x::text || '@qa.test', 'authenticated', 'authenticated', now() - interval '10 days', now() - interval '10 days'
  from unnest(array[u_owner, u_a, u_b, u_kid, u_teen, u_ajeno]) x;
  update profiles set account_type = 'kid' where id = u_kid;
  update profiles set account_type = 'teen' where id = u_teen;

  insert into businesses (slug, nombre_comercial, rubro, tamano, status, tier, provincia, sitio_web, ultima_revision)
  values ('molino-qa-' || substr(md5(random()::text), 1, 6), 'Molino QA', 'produccion-alimentos', '2-10', 'approved', 'e1',
          'Buenos Aires', 'https://molinoqa.com.ar', now())
  returning id into v_biz;
  insert into business_members (business_id, user_id, role) values (v_biz, u_owner, 'owner');
  insert into business_verifications (business_id, method, token, target, status, verified_at)
  values (v_biz, 'dominio_meta', 'tok', 'molinoqa.com.ar', 'verificado', now());

  -- ── Como la empresa ──
  perform set_config('request.jwt.claims', json_build_object('sub', u_owner, 'role', 'authenticated')::text, true);
  set local role authenticated;

  res := res || jsonb_build_object(
    'no_toxico_sin_doc', claim_guardar(v_biz, null, 'no_toxico', 'Detergente', '{"para_quien":"personas"}', null, null, null, null, 'x')->>'error',
    'biodegradable_24m', claim_guardar(v_biz, null, 'biodegradable', 'Bolsa', '{"plazo_meses":24,"condiciones":"suelo húmedo"}', null, null, null, null, 'x')->>'error',
    'reciclable_sin_disp', claim_guardar(v_biz, null, 'reciclable', 'Envase', '{"material":"papel"}', null, null, null, null, 'x')->>'error',
    'reciclado_sin_pct', claim_guardar(v_biz, null, 'contenido_reciclado', 'Envase', '{"post_consumo":true}', null, null, null, null, 'x')->>'error',
    'fsc_libre_de', claim_guardar(v_biz, null, 'libre_de', 'Crema', '{"sustancia":"parabenos","no_agregada_intencionalmente":true,"sustituto":"alcohol bencílico"}', 'fsc', '123', current_date + 365, null, 'x')->>'error',
    'renovable_60', claim_guardar(v_biz, null, 'energia_renovable', 'Proceso', '{"fuente":"solar","porcentaje_procesos":60,"certificados":"a_nombre_propio"}', null, null, null, null, 'x')->>'error',
    'argencert', claim_guardar(v_biz, null, 'organico', 'Harina', '{}', 'argencert', '1', current_date + 100, null, 'x')->>'error',
    'carbono_sin_verif', claim_guardar(v_biz, null, 'huella_carbono', 'Empresa', ('{"tipo":"compensada","metodologia":"GHG Protocol"}')::jsonb, null, null, null, v_biz || '/afirmaciones/' || gen_random_uuid() || '.pdf', 'x')->>'error');

  r := claim_guardar(v_biz, null, 'organico', 'Harina de trigo', '{}', 'oia', 'OIA-123', current_date + 200,
                     v_biz || '/afirmaciones/' || gen_random_uuid() || '.pdf', 'Harina de trigo, de producción orgánica');
  v_c1 := (r->>'id')::uuid;
  r := claim_guardar(v_biz, null, 'reciclable', 'Envase', '{"material":"papel kraft","disponibilidad":"recoleccion_diferenciada_amplia"}',
                     null, null, null, null, 'Envase de papel kraft, reciclable');
  v_c2 := (r->>'id')::uuid;

  v_desc := 'Harina de trigo molida en piedra en nuestro molino de Tandil, con trigo de productores de la zona. Bolsa de papel.';
  r := listado_guardar(v_biz, null, jsonb_build_object('titulo', 'Harina orgánica de trigo 1 kg', 'descripcion', v_desc || ' 100% ecológico.',
         'categoria', 'alimentos-frescos', 'tipo', 'producto', 'url_destino', 'https://molinoqa.com.ar/harina',
         'precio_referencia', 4200, 'dominios', jsonb_build_array('alimentacion')));
  v_l := (r->>'id')::uuid; v_slug := r->>'slug';
  perform listado_imagenes(v_l, array[v_biz || '/' || v_l || '/' || gen_random_uuid() || '.jpg']);
  perform listado_claims(v_l, array[v_c1, v_c2]);
  r := listado_enviar(v_l, '{}');
  res := res || jsonb_build_object('enviar_100_ecologico', (r->>'error') || ':' || coalesce(r->>'termino', ''));
  perform listado_guardar(v_biz, v_l, jsonb_build_object('descripcion', v_desc || ' Cura el estrés.'));
  r := listado_enviar(v_l, '{}');
  res := res || jsonb_build_object('enviar_cura', (r->>'error') || ':' || coalesce(r->>'termino', ''));
  perform listado_guardar(v_biz, v_l, jsonb_build_object('descripcion', v_desc));
  r := listado_enviar(v_l, '{}');
  res := res || jsonb_build_object('enviar_ok', r->>'status');

  begin
    update listings set status = 'publicado' where id = v_l;
    res := res || jsonb_build_object('autopublicar_directo', 'PERMITIDO (MAL)');
  exception when insufficient_privilege then
    res := res || jsonb_build_object('autopublicar_directo', 'denegado');
  end;
  begin
    update business_claims set tier = 'e3', status = 'aprobada' where id = v_c2;
    res := res || jsonb_build_object('autoaprobar_directo', 'PERMITIDO (MAL)');
  exception when insufficient_privilege then
    res := res || jsonb_build_object('autoaprobar_directo', 'denegado');
  end;

  -- Listado 3 (limpieza) con la afirmación orgánica: alerta de halo, después.
  r := listado_guardar(v_biz, null, jsonb_build_object('titulo', 'Jabón líquido para ropa 1 litro', 'descripcion', v_desc,
         'categoria', 'limpieza-hogar', 'url_destino', 'https://molinoqa.com.ar/jabon'));
  v_l3 := (r->>'id')::uuid;
  reset role;

  -- ── Un ajeno no ve el pendiente ──
  perform set_config('request.jwt.claims', json_build_object('sub', u_ajeno, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from listings where id = v_l;
  res := res || jsonb_build_object('ajeno_ve_pendiente', n, 'ajeno_ficha_pendiente', mercado_listado(v_slug) is not null);
  reset role;

  -- ── El revisor publica ──
  perform set_config('request.jwt.claims', json_build_object('sub', u_a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  r := admin_listado_revisar(PASS, v_l, 'publicar', null,
         jsonb_build_array(jsonb_build_object('id', v_c1, 'decision', 'aprobar'), jsonb_build_object('id', v_c2, 'decision', 'aprobar')));
  res := res || jsonb_build_object('publicar', r->>'ok');
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', u_owner, 'role', 'authenticated')::text, true);
  set local role authenticated;
  perform listado_claims(v_l3, array[v_c1]);
  reset role;

  select jsonb_build_object('status', l.status, 'tier_efectivo', l.tier_efectivo, 'score', l.score,
                            'c1', (select tier from business_claims where id = v_c1),
                            'c2', (select tier from business_claims where id = v_c2),
                            'negocio', (select tier from businesses where id = v_biz))
    into r from listings l where l.id = v_l;
  res := res || jsonb_build_object('tras_publicar', r);

  r := admin_listado_detalle(PASS, v_l3);
  res := res || jsonb_build_object('halo', r->'afirmaciones'->0->'alerta_halo',
                                   'enganchada_en', jsonb_array_length(r->'afirmaciones'->0->'enganchada_en'));

  -- Un listado de bebidas publicado, para el teen.
  insert into listings (business_id, slug, titulo, descripcion, categoria, status, url_destino, precio_referencia, publicado_at)
  values (v_biz, 'cerveza-qa-' || substr(md5(random()::text), 1, 5), 'Cerveza artesanal QA', v_desc, 'bebidas', 'publicado',
          'https://molinoqa.com.ar/cerveza', 3000, now())
  returning id into v_beb;

  -- ── Adulto: ficha, antihalo, salida ──
  perform set_config('request.jwt.claims', json_build_object('sub', u_a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  r := mercado_listado(v_slug);
  res := res || jsonb_build_object('adulto_niveles', (select jsonb_agg(a->>'tier') from jsonb_array_elements(r->'afirmaciones') a),
                                   'adulto_precio', r->'precio', 'adulto_dominio', r->'dominio_destino');
  select count(*) into n from mercado_listados();
  res := res || jsonb_build_object('adulto_catalogo', n);
  r := mercado_salida(v_l);
  res := res || jsonb_build_object('salida_tiene_url', r ? 'url', 'salida_vistas', r->'vistas_30d');
  r := mercado_salir(v_l, 'catalogo', null);
  res := res || jsonb_build_object('salir_url', r->>'url');
  begin
    select count(*) into n from listing_clicks;
    res := res || jsonb_build_object('lee_clicks', 'PERMITIDO (MAL)');
  exception when insufficient_privilege then
    res := res || jsonb_build_object('lee_clicks', 'denegado');
  end;
  begin
    select count(*) into n from listings where id = v_l and precio_referencia > 0;
    res := res || jsonb_build_object('lee_precio_directo', 'PERMITIDO (MAL)');
  exception when insufficient_privilege then
    res := res || jsonb_build_object('lee_precio_directo', 'denegado');
  end;
  reset role;
  select count(*) into n from listing_clicks where listing_id = v_l and origen = 'catalogo';
  res := res || jsonb_build_object('clic_registrado', n);

  -- ── Teen y kid ──
  perform set_config('request.jwt.claims', json_build_object('sub', u_teen, 'role', 'authenticated')::text, true);
  set local role authenticated;
  r := mercado_listado(v_slug);
  res := res || jsonb_build_object('teen_ve', r is not null, 'teen_precio', r->'precio');
  select count(*) into n from mercado_listados() x where x->>'id' = v_beb::text;
  res := res || jsonb_build_object('teen_ve_bebidas', n);
  select count(*) into n from listings where id = v_beb;
  res := res || jsonb_build_object('teen_rls_bebidas', n);
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', u_kid, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from mercado_listados();
  res := res || jsonb_build_object('kid_catalogo', n, 'kid_ficha', mercado_listado(v_slug) is not null,
                                   'kid_salir', mercado_salir(v_l, 'catalogo', null)->>'error');
  select count(*) into n from listings;
  res := res || jsonb_build_object('kid_rls', n);
  reset role;

  -- ── Vence el certificado: baja a E2, sigue publicado ──
  update business_claims set cert_vence = current_date - 1 where id = v_c1;
  perform brote_recalcular_tiers(v_biz);
  perform brote_recalcular_scores(v_biz);
  select jsonb_build_object('status', l.status, 'tier_efectivo', l.tier_efectivo, 'score', l.score,
                            'c1', (select tier from business_claims where id = v_c1),
                            'negocio', (select tier from businesses where id = v_biz))
    into r from listings l where l.id = v_l;
  res := res || jsonb_build_object('tras_vencer', r);

  -- ── Reportes ──
  perform set_config('request.jwt.claims', json_build_object('sub', u_a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  r := mercado_reportar(v_l, 'afirmacion_falsa', 'No parece orgánica');
  t := r->>'ok';
  for i in 1..9 loop r := mercado_reportar(v_l, 'afirmacion_falsa', 'otra vez'); end loop;
  res := res || jsonb_build_object('reporte_a', t, 'reporte_a_repetido', r->>'error');
  reset role;
  select count(*) into n from listing_reports where listing_id = v_l and user_id = u_a;
  res := res || jsonb_build_object('filas_de_a', n);
  select status into t from listings where id = v_l;
  res := res || jsonb_build_object('tras_un_reporte', t);

  perform set_config('request.jwt.claims', json_build_object('sub', u_ajeno, 'role', 'authenticated')::text, true);
  set local role authenticated;
  res := res || jsonb_build_object('otro_sin_detalle', mercado_reportar(v_l, 'otro', null)->>'error');
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', u_b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  perform mercado_reportar(v_l, 'afirmacion_falsa', 'Tampoco');
  reset role;
  select status || '/' || coalesce(despublicado_por, '') into t from listings where id = v_l;
  res := res || jsonb_build_object('tras_dos_reportes', t);

  select id into v_rep_a from listing_reports where listing_id = v_l and user_id = u_a;
  select id into v_rep_b from listing_reports where listing_id = v_l and user_id = u_b;
  perform set_config('request.jwt.claims', json_build_object('sub', u_a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  res := res || jsonb_build_object('confirmar_sin_descargo', admin_reporte_resolver(PASS, v_rep_a, 'confirmar', 'Afirmación sin respaldo')->>'error');
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', u_owner, 'role', 'authenticated')::text, true);
  set local role authenticated;
  res := res || jsonb_build_object('descargo', listado_descargo(v_rep_a, 'Tenemos el certificado de OIA, lo renovamos esta semana.', null)->>'ok');
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', u_a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  res := res || jsonb_build_object('confirmar', admin_reporte_resolver(PASS, v_rep_a, 'confirmar', 'El certificado estaba vencido.')->>'ok',
                                   'desestimar_b', admin_reporte_resolver(PASS, v_rep_b, 'desestimar', null)->>'ok');
  reset role;
  select status into t from listings where id = v_l;
  res := res || jsonb_build_object('tras_resolver', t);

  res := res || jsonb_build_object('diario', brote_negocios_diario());
  raise exception 'QA_RESULT %', res::text;
end $qa$;
-- ═══ Bloque 2 · Despublicación inmediata ═══
-- Esperado: antes_a/antes_b true; retirar true; despublicar_clave_mala = "No autorizado";
--   despublicar true; despues_a/despues_b false; despues_en_catalogo 0;
--   estados: A despublicado/negocio, B despublicado/revisor.
do $qa$
declare
  u_owner uuid := gen_random_uuid(); u_a uuid := gen_random_uuid();
  v_biz uuid; v_l uuid; v_l2 uuid; r jsonb; res jsonb := '{}'; n int; v_slug text; v_slug2 text;
  PASS constant text := 'clave-qa';
begin
  update admin_config set pass_salt = 'qa', pass_hash = encode(extensions.digest('qa' || PASS, 'sha256'), 'hex'),
         failed_count = 0, locked_until = null where id = 1;
  insert into auth.users (id, email, aud, role, created_at, email_confirmed_at)
  select x, x::text || '@qa.test', 'authenticated', 'authenticated', now() - interval '10 days', now() - interval '10 days'
  from unnest(array[u_owner, u_a]) x;

  insert into businesses (slug, nombre_comercial, rubro, tamano, status, tier, provincia, sitio_web, ultima_revision)
  values ('qa-desp-' || substr(md5(random()::text), 1, 6), 'Despublicar QA', 'produccion-alimentos', '2-10', 'approved', 'e1',
          'Buenos Aires', 'https://qa.com.ar', now()) returning id into v_biz;
  insert into business_members (business_id, user_id, role) values (v_biz, u_owner, 'owner');

  insert into listings (business_id, slug, titulo, descripcion, categoria, status, url_destino, precio_referencia, publicado_at)
  values (v_biz, 'qa-a-' || substr(md5(random()::text), 1, 5), 'Listado A', repeat('Descripción larga. ', 8), 'alimentos-frescos', 'publicado', 'https://qa.com.ar/a', 100, now()),
         (v_biz, 'qa-b-' || substr(md5(random()::text), 1, 5), 'Listado B', repeat('Descripción larga. ', 8), 'alimentos-frescos', 'publicado', 'https://qa.com.ar/b', 100, now());
  select id, slug into v_l, v_slug from listings where business_id = v_biz and titulo = 'Listado A';
  select id, slug into v_l2, v_slug2 from listings where business_id = v_biz and titulo = 'Listado B';

  perform set_config('request.jwt.claims', json_build_object('sub', u_a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  res := res || jsonb_build_object('antes_a', mercado_listado(v_slug) is not null, 'antes_b', mercado_listado(v_slug2) is not null);
  reset role;

  -- La empresa retira el A.
  perform set_config('request.jwt.claims', json_build_object('sub', u_owner, 'role', 'authenticated')::text, true);
  set local role authenticated;
  r := listado_retirar(v_l);
  res := res || jsonb_build_object('retirar', coalesce(r->>'ok', r->>'error', r::text));
  reset role;

  -- El revisor despublica el B.
  perform set_config('request.jwt.claims', json_build_object('sub', u_a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    r := admin_listado_despublicar('mal', v_l2, 'x');
    res := res || jsonb_build_object('despublicar_clave_mala', 'PERMITIDO (MAL)');
  exception when others then
    res := res || jsonb_build_object('despublicar_clave_mala', sqlerrm);
  end;
  r := admin_listado_despublicar(PASS, v_l2, 'Enlace caído');
  res := res || jsonb_build_object('despublicar', coalesce(r->>'ok', r->>'error', r::text));
  res := res || jsonb_build_object('despues_a', mercado_listado(v_slug) is not null, 'despues_b', mercado_listado(v_slug2) is not null);
  select count(*) into n from mercado_listados() x where (x->>'id')::uuid in (v_l, v_l2);
  res := res || jsonb_build_object('despues_en_catalogo', n);
  reset role;
  select jsonb_object_agg(titulo, status::text || '/' || coalesce(despublicado_por, '')) into r from listings where business_id = v_biz;
  res := res || jsonb_build_object('estados', r);

  raise exception 'QA_RESULT %', res::text;
end $qa$;

-- ═══ Bloque 3 · Menores, sobre la tabla (08 §9 y el checklist de 08 §10) ═══
-- Esperado: kid_businesses, kid_listings y kid_claims = 0; kid_crea_empresa y
--   teen_crea_empresa = sin_permiso; teen, adulto, miembro y anon ven el negocio (1).
do $qa$
declare
  u_owner uuid := gen_random_uuid(); u_a uuid := gen_random_uuid(); u_kid uuid := gen_random_uuid(); u_teen uuid := gen_random_uuid();
  v_biz uuid; r jsonb; res jsonb := '{}'; n int;
begin
  insert into auth.users (id, email, aud, role, created_at, email_confirmed_at)
  select x, x::text || '@qa.test', 'authenticated', 'authenticated', now() - interval '10 days', now() - interval '10 days'
  from unnest(array[u_owner, u_a, u_kid, u_teen]) x;
  update profiles set account_type = 'kid' where id = u_kid;
  update profiles set account_type = 'teen' where id = u_teen;

  insert into businesses (slug, nombre_comercial, rubro, tamano, status, tier, provincia)
  values ('qa-k-' || substr(md5(random()::text), 1, 6), 'Kid QA', 'produccion-alimentos', '2-10', 'approved', 'e1', 'Buenos Aires')
  returning id into v_biz;
  insert into business_members (business_id, user_id, role) values (v_biz, u_owner, 'owner');

  perform set_config('request.jwt.claims', json_build_object('sub', u_kid, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from businesses; res := res || jsonb_build_object('kid_businesses', n);
  select count(*) into n from listings; res := res || jsonb_build_object('kid_listings', n);
  select count(*) into n from business_claims; res := res || jsonb_build_object('kid_claims', n);
  r := negocio_guardar_alta(null, '{"nombre_comercial":"Kid SA","rubro":"produccion-alimentos"}', 1);
  res := res || jsonb_build_object('kid_crea_empresa', coalesce(r->>'error', 'CREADA (MAL)'));
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', u_teen, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from businesses where id = v_biz; res := res || jsonb_build_object('teen_ve_negocio', n);
  r := negocio_guardar_alta(null, '{"nombre_comercial":"Teen SA","rubro":"produccion-alimentos"}', 1);
  res := res || jsonb_build_object('teen_crea_empresa', coalesce(r->>'error', 'CREADA (MAL)'));
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', u_a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from businesses where id = v_biz; res := res || jsonb_build_object('adulto_ve_negocio', n);
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', u_owner, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from businesses where id = v_biz; res := res || jsonb_build_object('miembro_ve_negocio', n);
  reset role;

  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  set local role anon;
  select count(*) into n from businesses where id = v_biz; res := res || jsonb_build_object('anon_ve_negocio', n);
  reset role;

  raise exception 'QA_RESULT %', res::text;
end $qa$;
