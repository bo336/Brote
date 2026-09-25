-- QA del Mercado v2 y del alta de vendedores (0113 + 0114) contra la base viva.
-- NO es una migración.
--
-- Como los otros archivos de `supabase/qa/`: el bloque crea sus personas de
-- prueba, juega de verdad contra las RPC con `request.jwt.claims` y el rol
-- `authenticated` (el webhook y el vínculo con Mercado Pago, con el rol
-- `service_role`, que es como los llama el servidor) y termina con
-- `raise exception 'QA_RESULT ...'`: la transacción entera se deshace.
--
-- ═══ Bloque 1 · Una persona abre su tienda, publica, y otras personas compran ═══
-- Esperado (entre paréntesis, el valor):
--   crear (ok) · falta_inicial [tienda, compromiso, prueba, mercado_pago, terminos, suscripcion]
--   desc_organica (termino_sin_afirmacion) · guardar (ok) · canal (whatsapp)
--   una_practica (pocas_practicas) · sin_foto (falta_foto) · compromiso (ok)
--   prueba: primera_mal (false) · explicacion (no vacía) · aprobada (aprobada) · prueba_verde_at (true)
--   vincular_como_persona (denegado) · vincular (ok) · mp_ajeno (mp_en_uso)
--   cotizar_sin_dolar (sin_cotizacion) · cotizar_monto (7300) · payer (qa-mp@…)
--   abrir_sin_pagar (incompleta, falta [suscripcion]) · webhook_abre (true) · status (approved)
--   estacion_en_titulo (termino_sin_afirmacion) · enviar (publicado) · tier (e0)
--   buscar_bolson (1) · buscar_typo (1) · sugerencias (≥1) · teen_precio (null) · kid_items (0)
--   ficha: contacto (whatsapp), compromisos (2), mp_vinculado (true)
--   salir_url empieza con https://wa.me/5491122334455?text=
--   favorito (1) · baja_precio: precio_anterior (9000) · aviso_precio (1)
--   seguir (true) · aviso_novedad (1) · pregunta (ok) · pendientes (1) · aviso_respuesta (1)
--   guardados: favoritos 1, vistos 1, tiendas 1
--   edicion_cura (texto_prohibido) · edicion_organica (termino_sin_afirmacion)
--   lee_mp_email (denegado) · compromisos_cola (≥1) · revisar (ok) · revisado (true)
--   ajuste_dolar (true, nuevo 8500) · cancelar: despublicados (2)
--   legacy_plan (raiz) · cobro_diario (sin error)
do $qa$
declare
  u_v uuid := gen_random_uuid(); u_c uuid := gen_random_uuid(); u_teen uuid := gen_random_uuid();
  u_kid uuid := gen_random_uuid(); u_otro uuid := gen_random_uuid();
  v_biz uuid; v_biz2 uuid; v_l uuid; v_l2 uuid; v_slug text; v_int uuid; v_preg text; v_ok text; v_q uuid;
  r jsonb; res jsonb := '{}'; n int; i int; v_primera boolean;
  PASS constant text := 'clave-qa';
begin
  update admin_config set pass_salt = 'qa', pass_hash = encode(extensions.digest('qa' || PASS, 'sha256'), 'hex'),
         failed_count = 0, locked_until = null where id = 1;
  insert into auth.users (id, email, aud, role, created_at, email_confirmed_at)
  select x, x::text || '@qa.test', 'authenticated', 'authenticated', now() - interval '1 hour', now() - interval '1 hour'
  from unnest(array[u_v, u_c, u_teen, u_kid, u_otro]) x;
  update profiles set onboarding_completed = true, city = 'Buenos Aires' where id in (u_v, u_c, u_teen, u_kid, u_otro);
  update profiles set account_type = 'teen' where id = u_teen;
  update profiles set account_type = 'kid' where id = u_kid;
  delete from tipos_cambio;

  -- ── Quien vende ──
  perform set_config('request.jwt.claims', json_build_object('sub', u_v, 'role', 'authenticated')::text, true);
  set local role authenticated;

  r := vendedor_crear('Huerta QA');
  v_biz := (r->>'id')::uuid;
  res := res || jsonb_build_object('crear', r->>'ok', 'falta_inicial', vendedor_estado(v_biz)->'falta');

  r := vendedor_guardar(v_biz, '{"categoria_principal":"alimentos-frescos","provincia":"Buenos Aires","ciudad":"Cañuelas",
        "whatsapp":"+54 9 11 2233-4455","contacto_preferido":"whatsapp","descripcion":"Verduras orgánicas de la huerta"}');
  res := res || jsonb_build_object('desc_organica', r->>'error');
  r := vendedor_guardar(v_biz, '{"categoria_principal":"alimentos-frescos","provincia":"Buenos Aires","ciudad":"Cañuelas",
        "whatsapp":"+54 9 11 2233-4455","contacto_preferido":"whatsapp","descripcion":"Verduras de nuestra huerta en Cañuelas"}');
  res := res || jsonb_build_object('guardar', r->>'ok', 'canal', vendedor_estado(v_biz)->'tienda'->>'contacto_preferido');

  res := res || jsonb_build_object(
    'una_practica', vendedor_compromisos(v_biz, array['envio-sin-plastico'], null, null)->>'error',
    'sin_foto', vendedor_compromisos(v_biz, array['envio-sin-plastico','agroecologico'], null, null)->>'error');
  r := vendedor_compromisos(v_biz, array['envio-sin-plastico','agroecologico'], 'agroecologico',
                            v_biz || '/compromisos/' || gen_random_uuid() || '.jpg');
  res := res || jsonb_build_object('compromiso', r->>'ok');

  -- La prueba: una mal a propósito, después las correctas.
  r := vendedor_prueba_empezar(v_biz);
  v_int := (r->>'intento')::uuid;
  v_preg := r->'pregunta'->>'id';
  v_primera := true;
  for i in 1..10 loop
    reset role;
    select correcta into v_ok from vendedor_preguntas where id = v_preg;
    set local role authenticated;
    if v_primera then
      r := vendedor_prueba_responder(v_int, v_preg, case when v_ok = 'a' then 'b' else 'a' end);
      res := res || jsonb_build_object('primera_mal', r->'correcta', 'explicacion', length(r->>'explicacion') > 20);
      v_primera := false;
    else
      r := vendedor_prueba_responder(v_int, v_preg, v_ok);
    end if;
    exit when r->>'estado' <> 'en_curso';
    v_preg := r->'siguiente'->>'id';
  end loop;
  res := res || jsonb_build_object('aprobada', r->>'estado',
                                   'prueba_verde_at', vendedor_estado(v_biz)->'prueba_verde_at' is not null
                                                      and vendedor_estado(v_biz)->>'prueba_verde_at' is not null);

  -- Mercado Pago: una persona no puede "vincularse" sola.
  begin
    perform vendedor_mp_vincular(v_biz, u_v, '999', 'X', 'x@x.com', '{}');
    res := res || jsonb_build_object('vincular_como_persona', 'PERMITIDO');
  exception when insufficient_privilege then
    res := res || jsonb_build_object('vincular_como_persona', 'denegado');
  end;

  set local role service_role;
  r := vendedor_mp_vincular(v_biz, u_v, '12345', 'HUERTAQA', 'qa-mp@qa.test', '{"site_id":"MLA"}');
  res := res || jsonb_build_object('vincular', r->>'ok');

  -- Otra persona no puede usar la misma cuenta de Mercado Pago.
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', u_otro, 'role', 'authenticated')::text, true);
  v_biz2 := (vendedor_crear('Otra Tienda QA')->>'id')::uuid;
  set local role service_role;
  res := res || jsonb_build_object('mp_ajeno', vendedor_mp_vincular(v_biz2, u_otro, '12345', 'HUERTAQA', 'qa-mp@qa.test', '{}')->>'error');

  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', u_v, 'role', 'authenticated')::text, true);
  perform negocio_aceptar_terminos(v_biz);
  res := res || jsonb_build_object('cotizar_sin_dolar', negocio_plan_cotizar(v_biz, 'semilla')->>'error');
  reset role;
  insert into tipos_cambio (fuente, fecha, venta, compra) values ('oficial', current_date, 1450, 1400);
  set local role authenticated;
  r := negocio_plan_cotizar(v_biz, 'semilla');
  res := res || jsonb_build_object('cotizar_monto', r->'monto', 'payer', r->>'payer_email', 'razon', r->>'razon');
  r := vendedor_abrir(v_biz);
  res := res || jsonb_build_object('abrir_sin_pagar', r->>'error', 'falta_al_abrir', r->'falta');

  -- El webhook: Mercado Pago autoriza el primer cobro y la tienda abre.
  set local role service_role;
  r := negocio_suscripcion_aplicar(v_biz, 'pre-qa-1', 'authorized', null, 'vendedor', 7300, 'ARS', now() + interval '30 days', '{}');
  res := res || jsonb_build_object('webhook_abre', r->'abierta');
  reset role;
  res := res || jsonb_build_object('status', (select status from businesses where id = v_biz));

  -- Publicar: "de estación" sin la afirmación no pasa; sin eso, en el acto.
  set local role authenticated;
  r := listado_guardar(v_biz, null, jsonb_build_object('titulo', 'Bolsón de verduras de estación 5 kg',
         'descripcion', 'Verduras de la huerta, cosechadas el día anterior. Van en cajón de madera retornable.',
         'categoria', 'alimentos-frescos', 'subcategoria', 'bolsones', 'tipo', 'producto',
         'precio_referencia', 9000, 'contacto', 'whatsapp', 'disponibilidad', 'ambas',
         'zonas', jsonb_build_array('Buenos Aires'), 'dominios', jsonb_build_array('alimentacion')));
  v_l := (r->>'id')::uuid;
  perform listado_imagenes(v_l, array[v_biz || '/' || v_l || '/' || gen_random_uuid() || '.jpg']);
  res := res || jsonb_build_object('estacion_en_titulo', listado_enviar(v_l, '{}')->>'error');
  perform listado_guardar(v_biz, v_l, '{"titulo":"Bolsón de verduras de la huerta 5 kg"}');
  r := listado_enviar(v_l, '{}');
  res := res || jsonb_build_object('enviar', r->>'status');
  reset role;
  select slug into v_slug from listings where id = v_l;
  res := res || jsonb_build_object('tier', (select tier_efectivo from listings where id = v_l));

  -- ── Quien compra ──
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', u_c, 'role', 'authenticated')::text, true);
  res := res || jsonb_build_object(
    'buscar_bolson', jsonb_array_length(mercado_buscar('bolson')->'items'),
    'buscar_typo', jsonb_array_length(mercado_buscar('bolzon verduras')->'items'),
    'buscar_facetas', mercado_buscar('verduras')->'facetas'->'categorias',
    'sugerencias', jsonb_array_length(mercado_sugerencias('bols')->'productos'),
    'inicio_ok', mercado_inicio() ? 'estantes');
  r := mercado_listado(v_slug);
  res := res || jsonb_build_object('contacto', r->>'contacto', 'compromisos', jsonb_array_length(r->'negocio'->'compromisos'),
                                   'mp_vinculado', r->'negocio'->'mp_vinculado', 'favorito_antes', r->'favorito');
  r := mercado_salir(v_l, 'ficha');
  res := res || jsonb_build_object('salir_url', left(r->>'url', 60));
  perform mercado_visto(v_l);
  res := res || jsonb_build_object('favorito', mercado_favorito(v_l, true)->'favoritos');
  res := res || jsonb_build_object('seguir', mercado_seguir(v_biz, true)->'seguida');
  res := res || jsonb_build_object('pregunta', mercado_preguntar(v_l, '¿Hacen envíos a Lanús?')->>'ok');

  -- Quien vende baja el precio de referencia, responde y publica algo nuevo.
  perform set_config('request.jwt.claims', json_build_object('sub', u_v, 'role', 'authenticated')::text, true);
  r := listado_guardar(v_biz, v_l, '{"precio_referencia":8000}');
  res := res || jsonb_build_object('edicion_en_vivo', r->>'status');
  res := res || jsonb_build_object(
    'edicion_cura', listado_guardar(v_biz, v_l, '{"descripcion":"Verduras de la huerta que curan el estrés y previenen todo."}')->>'error',
    'edicion_organica', listado_guardar(v_biz, v_l, '{"descripcion":"Verduras orgánicas de la huerta, cosechadas el día anterior."}')->>'error');
  r := tienda_preguntas(v_biz);
  res := res || jsonb_build_object('pendientes', r->'pendientes');
  v_q := (r->'items'->0->>'id')::uuid;
  res := res || jsonb_build_object('responder', tienda_responder(v_q, 'Sí, los martes y viernes.')->>'ok');
  r := listado_guardar(v_biz, null, jsonb_build_object('titulo', 'Plantines de lechuga, bandeja de 12',
         'descripcion', 'Plantines criados en la huerta, listos para trasplantar a maceta o cantero.',
         'categoria', 'jardin-y-huerta', 'subcategoria', 'semillas-y-plantines', 'tipo', 'producto',
         'precio_referencia', 3500, 'contacto', 'whatsapp'));
  v_l2 := (r->>'id')::uuid;
  perform listado_imagenes(v_l2, array[v_biz || '/' || v_l2 || '/' || gen_random_uuid() || '.jpg']);
  res := res || jsonb_build_object('enviar2', listado_enviar(v_l2, '{}')->>'status');

  reset role;
  res := res || jsonb_build_object(
    'precio_anterior', (select precio_anterior from listings where id = v_l),
    'aviso_precio', (select count(*) from notifications where user_id = u_c and title_es like 'Bajó el precio%'),
    'aviso_novedad', (select count(*) from notifications where user_id = u_c and title_es like 'Novedad en%'),
    'aviso_respuesta', (select count(*) from notifications where user_id = u_c and title_es = 'Te respondieron'),
    'aviso_pregunta_tienda', (select count(*) from notifications where user_id = u_v and title_es = 'Te hicieron una pregunta'));

  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', u_c, 'role', 'authenticated')::text, true);
  r := mercado_guardados();
  res := res || jsonb_build_object('guardados', jsonb_build_object(
    'favoritos', jsonb_array_length(r->'favoritos'), 'vistos', jsonb_array_length(r->'vistos'),
    'tiendas', jsonb_array_length(r->'tiendas'), 'precio_al_guardar', r->'favoritos'->0->'precio_al_guardar',
    'precio_ahora', r->'favoritos'->0->'precio', 'antes', r->'favoritos'->0->'precio_anterior'));
  begin
    perform mp_email from businesses limit 1;
    res := res || jsonb_build_object('lee_mp_email', 'PERMITIDO');
  exception when insufficient_privilege then
    res := res || jsonb_build_object('lee_mp_email', 'denegado');
  end;

  -- Menores
  perform set_config('request.jwt.claims', json_build_object('sub', u_teen, 'role', 'authenticated')::text, true);
  res := res || jsonb_build_object('teen_precio', mercado_buscar('bolson')->'items'->0->'precio',
                                   'teen_items', jsonb_array_length(mercado_buscar('bolson')->'items'));
  perform set_config('request.jwt.claims', json_build_object('sub', u_kid, 'role', 'authenticated')::text, true);
  res := res || jsonb_build_object('kid_items', jsonb_array_length(mercado_buscar(null)->'items'),
                                   'kid_inicio', mercado_inicio() is null,
                                   'kid_ficha', mercado_listado(v_slug) is null);

  -- El equipo revisa el compromiso.
  perform set_config('request.jwt.claims', json_build_object('sub', u_otro, 'role', 'authenticated')::text, true);
  r := admin_compromisos_cola(PASS);
  res := res || jsonb_build_object('compromisos_cola', r->'pendientes');
  res := res || jsonb_build_object('revisar', admin_compromiso_revisar(PASS, v_biz, 'agroecologico', 'revisado', null)->>'ok');
  perform set_config('request.jwt.claims', json_build_object('sub', u_c, 'role', 'authenticated')::text, true);
  res := res || jsonb_build_object('revisado', (select bool_or((c->>'revisado')::boolean)
                                                  from jsonb_array_elements(mercado_listado(v_slug)->'negocio'->'compromisos') c));

  -- El dólar subió 17%: el próximo cobro se ajusta.
  reset role;
  update tipos_cambio set venta = 1700 where fecha = current_date;
  set local role service_role;
  r := vendedor_ajuste_consultar('pre-qa-1');
  res := res || jsonb_build_object('ajuste_dolar', r->'ajustar', 'ajuste_nuevo', r->'nuevo');

  -- Se da de baja: los productos salen del Mercado (no se borran).
  r := negocio_suscripcion_aplicar(v_biz, 'pre-qa-1', 'cancelled', null, 'vendedor', 7300, 'ARS', null, '{}');
  reset role;
  res := res || jsonb_build_object('cancelar_despublicados',
    (select count(*) from listings where business_id = v_biz and status = 'despublicado' and despublicado_por = 'cobro'));

  -- Lo del flujo anterior sigue con sus reglas.
  res := res || jsonb_build_object('legacy_plan', (select brote_negocio_plan(id) from businesses where slug like 'demo-%' limit 1),
                                   'legacy_escritura', (select brote_biz_escritura(id) from businesses where slug like 'demo-%' limit 1));
  perform brote_negocios_cobro();
  res := res || jsonb_build_object('cobro_diario', 'ok');

  raise exception 'QA_RESULT %', res;
end $qa$;
