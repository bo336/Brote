-- Performance del Mercado v2 con 5.000 productos de 50 tiendas. NO es una
-- migración: todo se inserta y se deshace en la misma transacción.
--
-- Cada consulta corre dos veces y se mide la segunda (caché caliente), que es
-- lo que ve una persona después de la primera visita. Umbral: 100 ms.
--
-- ═══ Bloque 1 · Tiempos ═══
do $perf$
declare
  u uuid := gen_random_uuid(); v_biz uuid[] := '{}'; v_id uuid; t0 timestamptz; res jsonb := '{}'; r jsonb; v_slug text;
  cats text[] := array['alimentos-frescos','almacen-granel','bebidas','limpieza-hogar','cuidado-personal','indumentaria',
                       'hogar-y-deco','jardin-y-huerta','mascotas','movilidad','servicios-profesionales','reparacion-y-reuso'];
  palabras text[] := array['jabón','shampoo','harina','yerba','café','bolsón','verduras','mochila','remera','bicicleta',
                           'compostera','maceta','detergente','cepillo','vela','mate','taza','frasco','semillas','plantines',
                           'miel','queso','pan','aceite','vinagre','lentejas','arroz','avena','granola','almendras'];
  adj text[] := array['artesanal','de algodón','de vidrio','de madera','sólido','a granel','familiar','grande','chico',
                      'de la huerta','del valle','reutilizable'];
  i int;
begin
  insert into auth.users (id, email, aud, role, created_at, email_confirmed_at)
  values (u, u::text || '@qa.test', 'authenticated', 'authenticated', now(), now());
  update profiles set onboarding_completed = true, city = 'Buenos Aires', interests = array['residuos','alimentacion'] where id = u;

  for i in 1..50 loop
    insert into businesses (slug, nombre_comercial, rubro, status, modelo, provincia, activa_at)
    values ('perf-tienda-' || i || '-' || substr(md5(random()::text), 1, 5), 'Tienda de prueba ' || i, 'comercio-minorista',
            'approved', 'vendedor', case when i % 3 = 0 then 'Buenos Aires' else 'Córdoba' end, now())
    returning id into v_id;
    v_biz := v_biz || v_id;
  end loop;

  insert into listings (business_id, slug, titulo, descripcion, categoria, precio_referencia, status, publicado_at,
                        score, imagenes, condicion, disponibilidad, zonas, dominios, tier_efectivo, contacto, url_destino)
  select v_biz[1 + g % 50], 'perf-' || g || '-' || substr(md5(random()::text), 1, 4),
         initcap(palabras[1 + g % 30]) || ' ' || adj[1 + (g / 30) % 12] || ' ' || g,
         'Producto de prueba número ' || g || ', hecho a mano con materiales de la zona y enviado en caja de cartón.',
         cats[1 + g % 12], 1000 + (g % 900) * 10, 'publicado', now() - (g % 60) * interval '1 day',
         round((random() * 80)::numeric, 3), array['/demo/1.webp'],
         case when g % 7 = 0 then 'usado' else 'nuevo' end,
         case g % 3 when 0 then 'online' when 1 then 'local' else 'ambas' end,
         array['Buenos Aires'], array[case when g % 2 = 0 then 'residuos' else 'alimentacion' end],
         case when g % 10 = 0 then 'e2'::evidence_tier else 'e0'::evidence_tier end, 'web', 'https://example.com/p'
    from generate_series(1, 5000) g;
  analyze listings;
  select slug into v_slug from listings where slug like 'perf-2500-%';

  perform set_config('request.jwt.claims', json_build_object('sub', u, 'role', 'authenticated')::text, true);
  set local role authenticated;

  -- Primera página sin texto (recomendados), con texto, con filtros, por precio, página 21.
  perform mercado_buscar(null);
  t0 := clock_timestamp(); r := mercado_buscar(null);
  res := res || jsonb_build_object('buscar_vacio_ms', round(extract(epoch from clock_timestamp() - t0) * 1000, 1), 'total', r->'total');
  perform mercado_buscar('jabon');
  t0 := clock_timestamp(); r := mercado_buscar('jabon');
  res := res || jsonb_build_object('buscar_texto_ms', round(extract(epoch from clock_timestamp() - t0) * 1000, 1),
                                   'jabon_total', r->'total', 'jabon_primero', r->'items'->0->>'titulo');
  t0 := clock_timestamp(); r := mercado_buscar('jabom solido');
  res := res || jsonb_build_object('buscar_typo_ms', round(extract(epoch from clock_timestamp() - t0) * 1000, 1),
                                   'typo_total', r->'total');
  t0 := clock_timestamp(); r := mercado_buscar(null, 'cuidado-personal', null, 'e0', null, 'online', 'nuevo');
  res := res || jsonb_build_object('buscar_filtros_ms', round(extract(epoch from clock_timestamp() - t0) * 1000, 1));
  t0 := clock_timestamp(); r := mercado_buscar(null, p_orden => 'precio_asc');
  res := res || jsonb_build_object('buscar_precio_ms', round(extract(epoch from clock_timestamp() - t0) * 1000, 1));
  t0 := clock_timestamp(); r := mercado_buscar(null, p_offset => 480);
  res := res || jsonb_build_object('buscar_pagina21_ms', round(extract(epoch from clock_timestamp() - t0) * 1000, 1));
  perform mercado_sugerencias('jab');
  t0 := clock_timestamp(); r := mercado_sugerencias('jab');
  res := res || jsonb_build_object('sugerencias_ms', round(extract(epoch from clock_timestamp() - t0) * 1000, 1),
                                   'sugerencias_n', jsonb_array_length(r->'productos'));
  perform mercado_inicio();
  t0 := clock_timestamp(); r := mercado_inicio();
  res := res || jsonb_build_object('inicio_ms', round(extract(epoch from clock_timestamp() - t0) * 1000, 1),
                                   'estantes', (select jsonb_agg(e->>'clave') from jsonb_array_elements(r->'estantes') e));
  perform mercado_listado(v_slug);
  t0 := clock_timestamp(); r := mercado_listado(v_slug);
  res := res || jsonb_build_object('ficha_ms', round(extract(epoch from clock_timestamp() - t0) * 1000, 1),
                                   'parecidos', jsonb_array_length(r->'parecidos'));

  raise exception 'QA_PERF %', res;
end $perf$;
