-- ════════════════════════════════════════════════════════════════════════════
-- DATOS DE DEMOSTRACIÓN de Negocios. NO es una migración, y NO es real.
-- ════════════════════════════════════════════════════════════════════════════
--
-- Existe para poder recorrer la sección con el catálogo lleno antes de tener
-- empresas de verdad. Cuatro reglas que lo hacen honesto:
--
-- 1. **Todo se llama «(DEMO)»** y todos los slugs empiezan con `demo-`. Cada
--    descripción de listado abre con "DEMOSTRACIÓN — producto de ejemplo, no
--    está a la venta". Nadie que entre puede confundirlo con un comercio real.
-- 2. **Ningún número de certificado se parece a uno real**: son `DEMO-0001`.
--    Las certificadoras que figuran existen, pero el número dice lo que es.
-- 3. **Las impresiones y las salidas son inventadas.** Salen de una fórmula
--    determinista, no de gente. Están para que la analítica tenga forma.
-- 4. **Los documentos de evidencia no existen.** Las afirmaciones E2 y el
--    cierre del objetivo guardan una ruta de Storage que no tiene archivo
--    detrás: el botón "ver documento" del panel del revisor va a fallar en los
--    comercios de demostración, y solo en ellos.
--
-- ── BORRAR TODO (dos líneas) ────────────────────────────────────────────────
--
--   delete from businesses where slug like 'demo-%';
--   delete from auth.users where email = 'demo-negocios@brote.test';
--
-- Eso arrastra en cascada listados, afirmaciones, objetivos, clics, impresiones
-- y reportes de la demostración, y no toca nada más.
--
-- ── Cómo se armó ────────────────────────────────────────────────────────────
--
-- Todo lo que hace una empresa pasa por las MISMAS RPC que usaría una persona
-- (`create_business`, `negocio_guardar_alta`, `claim_guardar`, `listado_guardar`,
-- `listado_enviar`, `dossier_guardar`, `objetivos_proponer`, `objetivo_cerrar`…),
-- con la sesión de su dueño puesta en `request.jwt.claims`. Los pasos que son
-- del REVISOR —aprobar la empresa, aprobar cada afirmación, publicar, aceptar
-- el cierre de un objetivo— se hacen por SQL directo, porque las RPC de admin
-- piden la contraseña del panel, que no está acá.

-- ════ 1. Dueño de demostración (empresas 2 y 3) ════
insert into auth.users (id, email, aud, role, created_at, email_confirmed_at)
select '00000000-0000-4000-8000-000000000d30', 'demo-negocios@brote.test', 'authenticated', 'authenticated',
       now() - interval '120 days', now() - interval '120 days'
where not exists (select 1 from auth.users where email = 'demo-negocios@brote.test');

update profiles set display_name = 'Comercios de demostración', onboarding_completed = true
 where id = '00000000-0000-4000-8000-000000000d30';

-- ════ 2. Las tres empresas ════
-- La 1 es del dueño de la app (para poder entrar a /negocio y verla desde
-- adentro); las otras dos, del usuario de demostración.
do $seed$
declare
  v_duenio uuid := '3d99b835-22a9-4dc4-a8c6-278f13a19721';   -- la cuenta del dueño
  v_demo   uuid := '00000000-0000-4000-8000-000000000d30';
  v_a uuid; v_b uuid; v_c uuid;
begin
  if exists (select 1 from businesses where slug like 'demo-%') then
    raise notice 'La demostración ya está cargada; no se hace nada.';
    return;
  end if;

  -- ── Empresa 1, por el camino real ──
  perform set_config('request.jwt.claims', json_build_object('sub', v_duenio, 'role', 'authenticated')::text, true);
  v_a := create_business('Molino del Valle (DEMO)', 'produccion-alimentos', '2-10', 'Buenos Aires', 'Tandil');

  perform negocio_guardar_alta(v_a, jsonb_build_object(
    'sitio_web', 'https://ejemplo-molino.com.ar',
    'instagram', 'molinodelvalle.demo',
    'descripcion', 'DEMOSTRACIÓN — esta empresa no existe. Molino de trigo en Tandil: molienda en piedra, trigo de productores de la zona y bolsa de papel. Los datos están acá para poder recorrer la sección con el catálogo lleno.',
    'intereses', jsonb_build_array('mejora', 'mercado')), 4);
  perform negocio_aceptar_terminos(v_a);
  perform negocio_enviar(v_a);
  perform set_config('request.jwt.claims', '', true);

  -- Lo del revisor: se hace directo.
  update businesses
     set status = 'approved', revisado_at = now() - interval '40 days', ultima_revision = now() - interval '40 days',
         slug = 'demo-molino-del-valle'
   where id = v_a;
  insert into business_verifications (business_id, method, token, target, status, verified_at)
  values (v_a, 'dominio_meta', 'demo-token', 'ejemplo-molino.com.ar', 'verificado', now() - interval '39 days');

  -- ── Empresas 2 y 3 ──
  insert into businesses (slug, nombre_comercial, rubro, tamano, status, provincia, ciudad, sitio_web,
                          descripcion, created_by, revisado_at, ultima_revision, intereses)
  values ('demo-jaboneria-del-sur', 'Jabonería del Sur (DEMO)', 'belleza-cuidado-personal', '2-10', 'approved',
          'Buenos Aires', 'Mar del Plata', 'https://ejemplo-jaboneria.com.ar',
          'DEMOSTRACIÓN — esta empresa no existe. Jabones sólidos y recargas de limpieza, con envase retornable.',
          v_demo, now() - interval '30 days', now() - interval '30 days', array['mercado']),
         ('demo-tostadero-norte', 'Tostadero Norte (DEMO)', 'produccion-alimentos', '2-10', 'approved',
          'Córdoba', 'Córdoba', 'https://ejemplo-tostadero.com.ar',
          'DEMOSTRACIÓN — esta empresa no existe. Tostadero de café de especialidad y venta a granel.',
          v_demo, now() - interval '25 days', now() - interval '25 days', array['mercado']);

  select id into v_b from businesses where slug = 'demo-jaboneria-del-sur';
  select id into v_c from businesses where slug = 'demo-tostadero-norte';

  insert into business_members (business_id, user_id, role, joined_at) values
    (v_b, v_demo, 'owner', now() - interval '31 days'),
    (v_c, v_demo, 'owner', now() - interval '26 days');

  insert into business_verifications (business_id, method, token, target, status, verified_at) values
    (v_b, 'dominio_meta', 'demo-token-b', 'ejemplo-jaboneria.com.ar', 'verificado', now() - interval '29 days'),
    (v_c, 'dominio_dns', 'demo-token-c', 'ejemplo-tostadero.com.ar', 'verificado', now() - interval '24 days');

  insert into business_terms (business_id, version, user_id, aceptado_at) values
    (v_b, brote_terminos_version(), v_demo, now() - interval '31 days'),
    (v_c, brote_terminos_version(), v_demo, now() - interval '26 days');

  raise notice 'Empresas de demostración creadas.';
end $seed$;

-- La fecha de alta ("en Brote desde"), nueve días antes de la aprobación.
update businesses set created_at = revisado_at - interval '9 days' where slug like 'demo-%';

-- ════ 3. Afirmaciones y catálogo ════
-- Doce afirmaciones (una E3 con certificado DEMO-0001 por empresa, tres E2 con
-- documento, el resto declaradas) y catorce listados publicados.
do $seed$
declare
  v_a uuid; v_b uuid; v_c uuid;
  v_demo uuid := '00000000-0000-4000-8000-000000000d30';
  v_duenio uuid := '3d99b835-22a9-4dc4-a8c6-278f13a19721';
  cl jsonb; ls jsonb; it jsonb; ref text;
  v_map jsonb := '{}'::jsonb; v_lids uuid[] := '{}';
  v_biz uuid; v_uid uuid; v_lid uuid; v_arr uuid[]; v_res jsonb; v_evid text;
begin
  select id into v_a from businesses where slug = 'demo-molino-del-valle';
  select id into v_b from businesses where slug = 'demo-jaboneria-del-sur';
  select id into v_c from businesses where slug = 'demo-tostadero-norte';
  if v_a is null or v_b is null or v_c is null then raise exception 'faltan las empresas de demostracion'; end if;
  if exists (select 1 from listings where business_id in (v_a, v_b, v_c)) then
    raise notice 'los listados de demostracion ya estan cargados'; return;
  end if;

  cl := $j${
   "a-organico": {"neg":"a","kind":"organico","alcance":"Trigo de todo el producto","datos":{"porcentaje":"100"},"cert":"oia","num":"DEMO-0001","vence":"2027-03-31","enunciado":"El trigo viene de lotes con certificación orgánica vigente."},
   "a-papel": {"neg":"a","kind":"reduccion_origen","alcance":"Envase de la bolsa","datos":{"que_se_redujo":"plástico del envase","porcentaje":"100","comparado_con":"producto_anterior"},"enunciado":"La bolsa pasó de polipropileno a papel kraft, sin ventana plástica."},
   "a-local": {"neg":"a","kind":"local_estacional","alcance":"Trigo del producto","datos":{"origen":"Productores de Tandil y Azul, hasta 80 km del molino"},"enunciado":"El trigo se compra a productores a menos de 80 km del molino."},
   "a-compost": {"neg":"a","kind":"compostable","alcance":"Bolsa de papel del envase","datos":{"tipo_compostaje":"domiciliario","plazo_meses":"6"},"evid":"si","enunciado":"La bolsa de papel se composta en casa en unos 6 meses."},
   "b-recarga": {"neg":"b","kind":"recargable","alcance":"Botella de 1 litro del detergente","datos":{"mecanismo_recarga":"Botella retornable que se devuelve y se vuelve a llenar en el local","donde_se_recarga":"Local de Mar del Plata y 6 puntos de venta adheridos"},"evid":"si","enunciado":"La botella vuelve al local y se rellena."},
   "b-libre": {"neg":"b","kind":"libre_de","alcance":"Fórmula del jabón sólido","datos":{"sustancia":"SLS (lauril sulfato de sodio)","no_agregada_intencionalmente":true,"sustituto":"Tensioactivo derivado de coco"},"enunciado":"Sin SLS agregado; en su lugar lleva un tensioactivo de coco."},
   "b-envase": {"neg":"b","kind":"reduccion_origen","alcance":"Envase del shampoo sólido","datos":{"que_se_redujo":"plástico por unidad vendida","porcentaje":"85","comparado_con":"estandar_categoria"},"enunciado":"Una pastilla reemplaza una botella de 400 ml."},
   "b-reciclado": {"neg":"b","kind":"contenido_reciclado","alcance":"Caja de cartón del pack","datos":{"porcentaje":"70"},"evid":"si","enunciado":"La caja tiene 70% de cartón recuperado."},
   "c-justo": {"neg":"c","kind":"comercio_justo","alcance":"Café verde del origen","datos":{"tipo":"certificado"},"cert":"fairtrade","num":"DEMO-0001","vence":"2027-06-30","enunciado":"El café verde se compra bajo certificación de comercio justo."},
   "c-coop": {"neg":"c","kind":"comercio_justo","alcance":"Café verde de las Yungas","datos":{"tipo":"cooperativa","organizacion":"Cooperativa de pequeños productores (DEMO)"},"enunciado":"Se compra a una cooperativa de pequeños productores."},
   "c-compost": {"neg":"c","kind":"compostable","alcance":"Bolsa del café","datos":{"tipo_compostaje":"industrial","plazo_meses":"6"},"enunciado":"La bolsa se composta en planta industrial, no en casa."},
   "c-tela": {"neg":"c","kind":"materiales_renovables","alcance":"Tela del filtro","datos":{"material":"algodón","porcentaje":"100","por_que_renovable":"Fibra vegetal que se vuelve a cosechar cada año"},"enunciado":"El filtro es de algodón, sin plástico."}
  }$j$::jsonb;

  for ref, it in select * from jsonb_each(cl) loop
    v_biz := case it->>'neg' when 'a' then v_a when 'b' then v_b else v_c end;
    v_uid := case it->>'neg' when 'a' then v_duenio else v_demo end;
    -- Ruta de evidencia SIN archivo detrás (ver la regla 4 del encabezado).
    v_evid := case when it->>'evid' = 'si'
                   then v_biz::text || '/afirmaciones/' || gen_random_uuid()::text || '.pdf' end;
    perform set_config('request.jwt.claims', json_build_object('sub', v_uid, 'role', 'authenticated')::text, true);
    v_res := claim_guardar(v_biz, null, (it->>'kind')::claim_kind, it->>'alcance',
                           coalesce(it->'datos', '{}'::jsonb), it->>'cert', it->>'num',
                           (it->>'vence')::date, v_evid, it->>'enunciado');
    if not (v_res->>'ok')::boolean then raise exception 'afirmacion % => %', ref, v_res::text; end if;
    v_map := v_map || jsonb_build_object(ref, v_res->>'id');
  end loop;

  ls := $j$[
   {"neg":"a","img":1,"dias":34,"cat":"almacen-granel","dom":["alimentacion","residuos"],"precio":3200,"disp":"ambas","zonas":["Tandil","CABA","GBA"],"claims":["a-organico","a-papel"],"titulo":"Harina integral molida a piedra, 1 kg","desc":"DEMOSTRACIÓN — producto de ejemplo, no está a la venta. Harina integral de trigo, molida a piedra y envasada en bolsa de papel kraft. Rinde bien en masa madre y en pastas caseras. Este listado existe para poder mirar el Mercado con el catálogo lleno."},
   {"neg":"a","img":2,"dias":31,"cat":"almacen-granel","dom":["alimentacion","residuos"],"precio":12400,"disp":"ambas","zonas":["Tandil","CABA"],"claims":["a-papel"],"titulo":"Harina 000 en bolsa de papel, 5 kg","desc":"DEMOSTRACIÓN — producto de ejemplo, no está a la venta. Formato de 5 kg para panaderías chicas y para quien hornea seguido en casa. La bolsa es de papel, sin ventana plástica ni recubrimiento interno."},
   {"neg":"a","img":3,"dias":27,"cat":"almacen-granel","dom":["alimentacion"],"precio":1900,"disp":"online","zonas":["Todo el país"],"claims":["a-organico"],"titulo":"Salvado de trigo fino, 500 g","desc":"DEMOSTRACIÓN — producto de ejemplo, no está a la venta. Salvado fino que sale de la misma molienda que la harina integral, sin mezcla de otros lotes. Sirve para panificación y para sumar fibra a preparaciones de todos los días."},
   {"neg":"a","img":4,"dias":21,"cat":"almacen-granel","dom":["alimentacion","residuos"],"precio":4100,"disp":"ambas","zonas":["Tandil","Mar del Plata","CABA"],"claims":["a-organico","a-compost"],"titulo":"Premezcla integral para pizza, 1 kg","desc":"DEMOSTRACIÓN — producto de ejemplo, no está a la venta. Premezcla de harina integral y sémola para pizza de molde, con instrucciones en la bolsa. El envase es de papel y se composta en casa."},
   {"neg":"a","img":5,"dias":12,"cat":"alimentos-frescos","dom":["alimentacion","comunidad"],"precio":2800,"disp":"local","zonas":["Tandil"],"claims":["a-local"],"titulo":"Pan de campo de masa madre, 700 g","desc":"DEMOSTRACIÓN — producto de ejemplo, no está a la venta. Pan de masa madre horneado con la harina del molino, en el local de Tandil. Se retira el mismo día que se hornea, de jueves a sábado."},
   {"neg":"b","img":6,"dias":29,"cat":"cuidado-personal","dom":["consumo","residuos"],"precio":2600,"disp":"ambas","zonas":["Mar del Plata","CABA","GBA"],"claims":["b-libre"],"titulo":"Jabón sólido de avena y caléndula, 100 g","desc":"DEMOSTRACIÓN — producto de ejemplo, no está a la venta. Jabón sólido para piel seca, con avena molida y caléndula. Viene en papel encerado, sin caja ni film. Pensado para quien quiere dejar el envase plástico del jabón líquido."},
   {"neg":"b","img":7,"dias":24,"cat":"cuidado-personal","dom":["consumo","residuos","agua"],"precio":4300,"disp":"ambas","zonas":["Mar del Plata","CABA","GBA","Rosario"],"claims":["b-envase"],"titulo":"Shampoo sólido para pelo graso, 80 g","desc":"DEMOSTRACIÓN — producto de ejemplo, no está a la venta. Pastilla de shampoo para pelo graso que rinde aproximadamente lo mismo que una botella de 400 ml. Se guarda en una jabonera con rejilla para que escurra."},
   {"neg":"b","img":8,"dias":19,"cat":"limpieza-hogar","dom":["residuos","agua","consumo"],"precio":5200,"disp":"local","zonas":["Mar del Plata"],"claims":["b-recarga"],"titulo":"Detergente concentrado, recarga de 1 L","desc":"DEMOSTRACIÓN — producto de ejemplo, no está a la venta. Detergente concentrado en botella retornable de 1 litro. Se devuelve el envase vacío en el local o en los puntos adheridos y se lleva uno lleno, con descuento por la devolución."},
   {"neg":"b","img":9,"dias":15,"cat":"limpieza-hogar","dom":["residuos","agua"],"precio":3400,"disp":"local","zonas":["Mar del Plata"],"claims":["b-recarga"],"titulo":"Jabón líquido de manos, recarga 500 ml","desc":"DEMOSTRACIÓN — producto de ejemplo, no está a la venta. Recarga de jabón líquido de manos en el mismo sistema de botella retornable. Se usa con el dosificador que ya tengas en casa, no viene uno nuevo."},
   {"neg":"b","img":10,"dias":8,"cat":"cuidado-personal","dom":["consumo","residuos"],"precio":7200,"disp":"ambas","zonas":["Mar del Plata","CABA","GBA"],"claims":["b-libre","b-reciclado"],"titulo":"Pack de 3 jabones sólidos para regalo","desc":"DEMOSTRACIÓN — producto de ejemplo, no está a la venta. Tres jabones sólidos surtidos en una caja de cartón recuperado, sin bandeja plástica adentro. La caja se puede volver a usar o tirar al cartón."},
   {"neg":"c","img":1,"dias":22,"cat":"almacen-granel","dom":["alimentacion","comunidad"],"precio":9800,"disp":"ambas","zonas":["Córdoba","CABA","Rosario"],"claims":["c-justo","c-compost"],"titulo":"Café de especialidad en grano, 250 g","desc":"DEMOSTRACIÓN — producto de ejemplo, no está a la venta. Café de especialidad tostado la semana del pedido, con la fecha de tueste impresa en la bolsa. Molienda a pedido si se retira en el local de Córdoba."},
   {"neg":"c","img":2,"dias":17,"cat":"almacen-granel","dom":["alimentacion"],"precio":17600,"disp":"online","zonas":["Todo el país"],"claims":["c-justo"],"titulo":"Café molido para filtro, 500 g","desc":"DEMOSTRACIÓN — producto de ejemplo, no está a la venta. Formato de 500 g molido para filtro de papel o de tela, para quien toma café todos los días y prefiere comprar menos veces."},
   {"neg":"c","img":3,"dias":10,"cat":"almacen-granel","dom":["alimentacion","comunidad"],"precio":10400,"disp":"ambas","zonas":["Córdoba","CABA"],"claims":["c-coop","c-compost"],"titulo":"Café de las Yungas en grano, 250 g","desc":"DEMOSTRACIÓN — producto de ejemplo, no está a la venta. Café de origen del norte argentino, comprado a una cooperativa de pequeños productores. Tueste medio, pensado para prensa francesa y para filtro."},
   {"neg":"c","img":4,"dias":5,"cat":"hogar-y-deco","dom":["residuos","consumo"],"precio":3900,"disp":"ambas","zonas":["Córdoba","CABA","Rosario"],"claims":["c-tela"],"titulo":"Filtro de tela reutilizable, pack x2","desc":"DEMOSTRACIÓN — producto de ejemplo, no está a la venta. Dos filtros de tela de algodón para cafetera de goteo, con costura reforzada. Se lavan con agua caliente y reemplazan el filtro de papel descartable."}
  ]$j$::jsonb;

  for it in select * from jsonb_array_elements(ls) loop
    v_biz := case it->>'neg' when 'a' then v_a when 'b' then v_b else v_c end;
    v_uid := case it->>'neg' when 'a' then v_duenio else v_demo end;
    perform set_config('request.jwt.claims', json_build_object('sub', v_uid, 'role', 'authenticated')::text, true);

    v_res := listado_guardar(v_biz, null, jsonb_build_object(
      'titulo', it->>'titulo', 'descripcion', it->>'desc', 'categoria', it->>'cat',
      'tipo', 'producto', 'dominios', it->'dom', 'precio_referencia', (it->>'precio')::numeric,
      'url_destino', 'https://brote-ft7m.vercel.app/negocios',
      'disponibilidad', it->>'disp', 'zonas', it->'zonas'));
    if not (v_res->>'ok')::boolean then raise exception 'listado % => %', it->>'titulo', v_res::text; end if;
    v_lid := (v_res->>'id')::uuid;
    v_lids := v_lids || v_lid;

    -- Las imágenes de la demostración no viven en Storage: son archivos de la
    -- propia app (`public/demo/N.webp`), así que se escriben directo.
    update listings set imagenes = array['/demo/' || (it->>'img') || '.webp'] where id = v_lid;

    select array_agg((v_map->>x)::uuid) into v_arr from jsonb_array_elements_text(it->'claims') x;
    v_res := listado_claims(v_lid, v_arr);
    if not (v_res->>'ok')::boolean then raise exception 'enganche % => %', it->>'titulo', v_res::text; end if;

    v_res := listado_enviar(v_lid, null);
    if not (v_res->>'ok')::boolean then raise exception 'envio % => %', it->>'titulo', v_res::text; end if;

    update listings set status = 'publicado',
           enviado_at = now() - (((it->>'dias')::int + 1) || ' days')::interval,
           publicado_at = now() - ((it->>'dias') || ' days')::interval,
           revisado_at = now() - ((it->>'dias') || ' days')::interval,
           created_at = now() - (((it->>'dias')::int + 3) || ' days')::interval,
           updated_at = now() - ((it->>'dias') || ' days')::interval
     where id = v_lid;
  end loop;

  perform set_config('request.jwt.claims', '', true);

  -- El paso del revisor: aprueba todo.
  update business_claims c
     set status = 'aprobada', auto_aprobada = false, revisado_at = now() - interval '20 days',
         categoria_origen = coalesce(c.categoria_origen,
           (select l.categoria from listing_claims lc join listings l on l.id = lc.listing_id
             where lc.claim_id = c.id limit 1)),
         updated_at = now()
   where c.business_id in (v_a, v_b, v_c) and c.status = 'pendiente';

  -- Los avisos a revisores que generó el envío son ruido de la demostración.
  delete from notifications n
   where exists (select 1 from unnest(v_lids) x where n.data::text like '%' || x::text || '%');

  perform brote_recalcular_tiers(v_a);
  perform brote_recalcular_tiers(v_b);
  perform brote_recalcular_tiers(v_c);
  perform brote_recalcular_scores(v_a);
  perform brote_recalcular_scores(v_b);
  perform brote_recalcular_scores(v_c);
  raise notice 'Catálogo de demostración creado.';
end $seed$;

-- ════ 4. Mejora del Molino: dossier y tres objetivos ════
-- Uno logrado y público, uno en marcha, uno en riesgo. Es lo que le da cuerpo
-- a /negocio/mejora, al historial público de la ficha y al Progreso de Mejora.
do $seed$
declare
  v_a uuid; v_duenio uuid := '3d99b835-22a9-4dc4-a8c6-278f13a19721';
  v_t0 timestamptz := now(); v_res jsonb; v_ids uuid[]; v_g1 uuid; v_g2 uuid; v_g3 uuid;
begin
  select id into v_a from businesses where slug = 'demo-molino-del-valle';
  if exists (select 1 from improvement_goals where business_id = v_a) then
    raise notice 'la mejora de demostracion ya esta cargada'; return;
  end if;
  perform set_config('request.jwt.claims', json_build_object('sub', v_duenio, 'role', 'authenticated')::text, true);

  -- ── El dossier, los ocho bloques ──
  perform dossier_guardar(v_a, 'operacion', $j${"que_produce":"Harina de trigo molida a piedra, salvado y premezclas; panificación chica en el local","volumen":"Unas 12 toneladas de trigo por mes","estacionalidad":"Pico entre marzo y julio; enero es el mes más flojo"}$j$::jsonb);
  perform dossier_guardar(v_a, 'energia', $j${"suministro":"electrico_gas","tiene_factura":true,"consumo_mensual":2400,"equipos":"Molino de piedra, zaranda, dos hornos y una cámara de frío chica"}$j$::jsonb);
  perform dossier_guardar(v_a, 'residuos', $j${"que_tiran":"Cartón y film del embalaje secundario, bolsas de rafia, polvillo de zaranda","bolsas_semana":6,"separa":true,"retiro_reciclables":true}$j$::jsonb);
  perform dossier_guardar(v_a, 'agua', $j${"es_relevante":false,"medicion":"medidor","consumo_mensual":"no_se"}$j$::jsonb);
  perform dossier_guardar(v_a, 'insumos', $j${"principales":"Trigo, bolsas de papel kraft, cajas de cartón, film stretch","proveedores_clave":7,"puede_cambiar_proveedores":true}$j$::jsonb);
  perform dossier_guardar(v_a, 'logistica', $j${"como_llega":"El trigo llega en camión del productor; la salida es con flete tercerizado dos veces por semana","flota":"tercerizada","viajes_mes":9}$j$::jsonb);
  perform dossier_guardar(v_a, 'ya_hecho', $j${"texto":"Cambiamos la bolsa de polipropileno por papel kraft en toda la línea de 1 kg. Separamos cartón y lo retira una cooperativa desde 2023."}$j$::jsonb);
  perform dossier_guardar(v_a, 'restricciones', $j${"presupuesto":"hasta_x","presupuesto_monto":150000,"horas_mes_disponibles":6,"local":"propio"}$j$::jsonb);

  -- ── Tres objetivos, propuestos por reglas ──
  v_res := objetivos_proponer(v_a, $j$[
    {"titulo":"Medir el consumo eléctrico mensual para tener una línea de base","porque":"No se puede mejorar lo que no se mide. Tres meses de facturas alcanzan para saber cuánto gastás de verdad y en qué momentos, y a partir de ahí cualquier cambio se puede evaluar.","dominio":"energia","palanca_slug":"medir-energia","metrica":"consumo eléctrico","unidad":"kWh/mes","origen_base":"a_medir","horizonte":"trimestral","ambicion":"basico","esfuerzo_horas_mes":1,"inversion":"ninguna","como_medir":"Los kWh que figuran en la factura de la distribuidora","pasos":["Juntar las últimas 3 facturas","Anotar kWh y período en una planilla","Registrar cada factura nueva","Marcar el mes más alto y anotar qué pasó ese mes"],"evidencia_requerida":"Foto o PDF de las 3 facturas","si_no_llegas":"Con dos meses registrados ya tenés con qué empezar. Cerralo con lo que juntaste.","confianza":"alta","metrica_tipo":"medicion","metodo_tipo":"factura","alcance":2,"es_evento_unico":false},
    {"titulo":"Bajar el cartón y el film del embalaje secundario","porque":"El embalaje secundario lo paga el que produce y lo tira el que recibe. Ajustar la medida de la caja, bajar vueltas de film o pasar a cajas retornables con tus clientes habituales se nota rápido en los remitos.","dominio":"residuos","palanca_slug":"packaging-secundario","metrica":"cartón y film de embalaje","unidad":"kg/mes","linea_base":"78","objetivo":"62","origen_base":"factura","horizonte":"semestral","ambicion":"intermedio","esfuerzo_horas_mes":3,"inversion":"baja","como_medir":"Compras de cartón y film en los remitos","pasos":["Anotar cuánto cartón y film comprás por mes","Revisar si la caja está sobredimensionada para el producto","Probar bajar vueltas de film en una ruta o cliente","Proponer caja retornable a los clientes de entrega frecuente"],"evidencia_requerida":"Remitos del antes y el después","si_no_llegas":"Si solo funcionó con un cliente, cerralo con ese volumen: es real y es repetible.","confianza":"media","metrica_tipo":"reduccion","metodo_tipo":"remito","alcance":3,"es_evento_unico":true},
    {"titulo":"Pasar 30% de tus compras a proveedores de menos de 100 km","porque":"Comprar cerca baja el transporte, acorta los plazos de reposición y te da un proveedor con el que podés hablar. Además es lo que te habilita a afirmar origen local en tus productos del Mercado.","dominio":"consumo","palanca_slug":"proveedores-locales","metrica":"compras a proveedores cercanos","unidad":"% de compras","linea_base":"18","objetivo":"30","origen_base":"estimado","horizonte":"semestral","ambicion":"intermedio","esfuerzo_horas_mes":4,"inversion":"ninguna","como_medir":"Porcentaje sobre el gasto mensual de compras, con los remitos","pasos":["Listar los 10 insumos que más comprás y de dónde vienen","Marcar cuáles tienen alternativa a menos de 100 km","Pedir precio a dos de ellos","Cambiar uno y evaluar a los 2 meses","Repetir con el siguiente"],"evidencia_requerida":"Planilla de proveedores del antes y el después","si_no_llegas":"Un proveedor cambiado y sostenido vale más que cinco consultados. Cerralo con ese.","confianza":"media","metrica_tipo":"sustitucion","metodo_tipo":"remito","alcance":3,"es_evento_unico":false}
  ]$j$::jsonb, 'reglas');
  if not (v_res->>'ok')::boolean or (v_res->>'cantidad')::int <> 3 then
    raise exception 'objetivos => %', v_res::text;
  end if;
  select array_agg(x::uuid order by ord) into v_ids
    from jsonb_array_elements_text(v_res->'ids') with ordinality t(x, ord);
  v_g1 := v_ids[1]; v_g2 := v_ids[2]; v_g3 := v_ids[3];

  perform objetivo_aceptar(v_g1);
  perform objetivo_aceptar(v_g2);
  perform objetivo_aceptar(v_g3);

  update improvement_goals set created_at = now() - interval '96 days',
         inicia_at = now() - interval '94 days', vence_at = now() - interval '4 days'
   where id = v_g1;
  update improvement_goals set created_at = now() - interval '96 days',
         inicia_at = now() - interval '94 days', vence_at = now() + interval '88 days'
   where id in (v_g2, v_g3);

  -- ── Objetivo 1: check-ins, cierre y aprobación del revisor ──
  perform objetivo_pasos(v_g1, '[0,1,2,3]'::jsonb);
  perform objetivo_checkin(v_g1, 'avance', 'Junté las tres facturas y armé la planilla. Febrero salió 2.610 kWh, que es el mes más alto.', 2610, false);
  perform objetivo_checkin(v_g1, 'avance', 'Cargada la factura de marzo: 2.180 kWh. Ya tengo cuatro meses seguidos anotados.', 2180, false);
  -- Ruta de evidencia SIN archivo detrás (ver la regla 4 del encabezado).
  v_res := objetivo_cerrar(v_g1, 2330,
    jsonb_build_array(v_a::text || '/objetivos/' || gen_random_uuid()::text || '.pdf'));
  if not (v_res->>'ok')::boolean then raise exception 'cierre => %', v_res::text; end if;

  update improvement_goals set status = 'logrado', cerrado_at = now() - interval '6 days',
         observacion = 'Las tres facturas coinciden con la planilla. Línea de base aceptada.'
   where id = v_g1;
  update goal_checkins set created_at = now() - interval '60 days' where goal_id = v_g1 and valor_reportado = 2610;
  update goal_checkins set created_at = now() - interval '28 days' where goal_id = v_g1 and valor_reportado = 2180;
  update goal_evidence set created_at = now() - interval '8 days' where goal_id = v_g1;
  perform objetivo_publico(v_g1, true);

  -- ── Objetivo 2: en marcha ──
  perform objetivo_pasos(v_g2, '[0,1]'::jsonb);
  perform objetivo_checkin(v_g2, 'avance', 'Medí las cajas: la de 12 kg está sobredimensionada. Pedí muestra de una caja 3 cm más baja.', null, false);
  perform objetivo_checkin(v_g2, 'avance', 'Bajamos de 4 a 3 vueltas de film en la ruta de Mar del Plata. Abril cerró en 71 kg.', 71, true);
  update goal_checkins set created_at = now() - interval '52 days' where goal_id = v_g2 and valor_reportado is null;
  update goal_checkins set created_at = now() - interval '19 days' where goal_id = v_g2 and valor_reportado = 71;

  -- ── Objetivo 3: en riesgo ──
  perform objetivo_pasos(v_g3, '[0]'::jsonb);
  perform objetivo_checkin(v_g3, 'no_llego', 'Pedí precio a dos molinos de la zona pero no me contestaron. Sigo en 18%, no avancé este mes.', 18, false);
  update goal_checkins set created_at = now() - interval '23 days' where goal_id = v_g3;
  update improvement_goals set status = 'en_riesgo' where id = v_g3;

  perform set_config('request.jwt.claims', '', true);
  perform brote_recalcular_mejora(v_a);
  perform brote_recalcular_tiers(v_a);

  delete from notifications where created_at >= v_t0 and data::text like '%/panel/objetivos%';
  raise notice 'Mejora de demostración creada.';
end $seed$;

update improvement_dossiers set created_at = now() - interval '100 days'
 where business_id in (select id from businesses where slug like 'demo-%');

-- ════ 5. Demanda inventada y colas del panel ════
-- Impresiones y salidas de 45 días que NO son de nadie: salen de `hashtext`,
-- que es determinista. Los clics van sin `user_id` justamente porque no hubo
-- una persona atrás. Más un reporte resuelto, uno abierto y un listado
-- esperando revisión, para que las tres colas tengan algo que mostrar.
do $seed$
declare
  v_bizs uuid[]; v_c uuid; v_lid uuid; v_res jsonb;
  v_demo uuid := '00000000-0000-4000-8000-000000000d30';
begin
  select array_agg(id) into v_bizs from businesses where slug like 'demo-%';
  select id into v_c from businesses where slug = 'demo-tostadero-norte';
  if exists (select 1 from listing_impresiones_dia where business_id = any(v_bizs)) then
    raise notice 'la demanda de demostracion ya esta cargada'; return;
  end if;

  insert into listing_impresiones_dia (listing_id, business_id, dia, origen, impresiones)
  select l.id, l.business_id, d::date, o.origen,
         greatest(1, round(
           (case l.tier_efectivo when 'e3' then 26 when 'e2' then 19 else 13 end)
           * o.peso
           * (case when extract(dow from d) in (0, 6) then 0.55 else 1.0 end)
           * (0.65 + (((hashtext(l.id::text || d::text || o.origen) % 80) + 80) % 80) / 100.0)
         ))::int
    from listings l
    cross join lateral generate_series(
      greatest(l.publicado_at::date, current_date - 44), current_date, interval '1 day') d
    cross join (values ('catalogo', 1.0), ('accion', 0.22), ('plaza', 0.12), ('perfil_negocio', 0.10))
      as o(origen, peso)
   where l.business_id = any(v_bizs) and l.status = 'publicado'
  on conflict (listing_id, dia, origen) do nothing;

  insert into listing_impresiones_mensual (listing_id, business_id, mes, impresiones)
  select listing_id, business_id, date_trunc('month', dia)::date, sum(impresiones)
    from listing_impresiones_dia where business_id = any(v_bizs)
   group by 1, 2, 3
  on conflict (listing_id, mes) do update set impresiones = excluded.impresiones;

  -- Salidas: entre 2% y 6% de las impresiones del día.
  insert into listing_clicks (listing_id, business_id, user_id, origen, ua_hash, created_at)
  select i.listing_id, i.business_id, null,
         (array['ficha','catalogo','accion','perfil_negocio'])
           [1 + (((hashtext(i.listing_id::text || i.dia::text || g::text) % 4) + 4) % 4)],
         null,
         i.dia::timestamptz
           + (interval '1 hour' * (9 + (((hashtext(i.listing_id::text || g::text) % 12) + 12) % 12)))
           + (interval '1 minute' * (((hashtext(i.dia::text || g::text) % 60) + 60) % 60))
    from (select listing_id, business_id, dia, sum(impresiones) as imp
            from listing_impresiones_dia where business_id = any(v_bizs)
           group by 1, 2, 3) i
    cross join lateral generate_series(1, greatest(0, round(
      i.imp * (0.02 + (((hashtext(i.listing_id::text || i.dia::text) % 5) + 5) % 5) / 100.0))::int)) g;

  -- Un reporte resuelto y uno abierto.
  insert into listing_reports (listing_id, business_id, user_id, motivo, detalle, estado,
                               nota, resuelto_at, created_at)
  select l.id, l.business_id, v_demo, 'enlace_roto',
         'El botón de comprar me llevó a una página que no existe.', 'desestimado',
         'Probamos el enlace y responde bien. Puede haber sido una caída momentánea del sitio.',
         now() - interval '11 days', now() - interval '13 days'
    from listings l where l.business_id = (select id from businesses where slug = 'demo-jaboneria-del-sur')
   order by l.publicado_at limit 1;

  insert into listing_reports (listing_id, business_id, user_id, motivo, detalle, estado, created_at)
  select l.id, l.business_id, v_demo, 'precio_muy_distinto',
         'El precio de la ficha está bastante por debajo del que figura en el sitio del comercio.',
         'abierto', now() - interval '2 days'
    from listings l where l.business_id = v_c
   order by l.publicado_at desc limit 1;

  -- Un listado esperando revisión, para ver la cola del panel.
  perform set_config('request.jwt.claims', json_build_object('sub', v_demo, 'role', 'authenticated')::text, true);
  v_res := listado_guardar(v_c, null, jsonb_build_object(
    'titulo', 'Cápsulas compostables para cafetera, x30',
    'descripcion', 'DEMOSTRACIÓN — producto de ejemplo, no está a la venta. Cápsulas compatibles con cafetera de sistema cerrado, con cuerpo y filtro compostables en planta industrial. Este listado quedó a propósito esperando revisión, para poder mirar cómo se ve la cola del panel.',
    'categoria', 'almacen-granel', 'tipo', 'producto',
    'dominios', jsonb_build_array('alimentacion', 'residuos'),
    'precio_referencia', 8900, 'url_destino', 'https://brote-ft7m.vercel.app/negocios',
    'disponibilidad', 'online', 'zonas', jsonb_build_array('Todo el país')));
  if not (v_res->>'ok')::boolean then raise exception 'listado pendiente => %', v_res::text; end if;
  v_lid := (v_res->>'id')::uuid;
  update listings set imagenes = array['/demo/5.webp'] where id = v_lid;
  perform listado_claims(v_lid, array[(select id from business_claims
                                        where business_id = v_c and kind = 'compostable' limit 1)]);
  v_res := listado_enviar(v_lid, null);
  if not (v_res->>'ok')::boolean then raise exception 'envio pendiente => %', v_res::text; end if;
  perform set_config('request.jwt.claims', '', true);

  perform brote_recalcular_tiers();
  perform brote_recalcular_scores();
  raise notice 'Demanda de demostración creada.';
end $seed$;

-- ════ 6. Un cuarto comercio, para que el puente de las acciones aparezca ════
-- `mercado_para_accion` no muestra nada con menos de TRES negocios distintos:
-- una tira de "dónde conseguirlo" con dos comercios es publicidad de esos dos,
-- no un puente. Con tres empresas repartidas en seis categorías, ninguna
-- categoría llegaba a tres, así que el puente no se podía ver nunca. Este
-- cuarto comercio es de granel y lleva `almacen-granel` a tres negocios, que
-- es lo que la regla pide — sin tocar la regla.
do $seed$
declare
  v_d uuid; v_demo uuid := '00000000-0000-4000-8000-000000000d30';
  cl jsonb; ls jsonb; it jsonb; ref text;
  v_map jsonb := '{}'::jsonb; v_lids uuid[] := '{}'; v_lid uuid; v_arr uuid[]; v_res jsonb; v_evid text;
begin
  if exists (select 1 from businesses where slug = 'demo-almacen-del-centro') then
    raise notice 'el cuarto comercio ya esta cargado'; return;
  end if;

  insert into businesses (slug, nombre_comercial, rubro, tamano, status, provincia, ciudad, sitio_web,
                          descripcion, created_by, revisado_at, ultima_revision, intereses, created_at)
  values ('demo-almacen-del-centro', 'Almacén del Centro (DEMO)', 'comercio-minorista', '2-10', 'approved',
          'Santa Fe', 'Rosario', 'https://ejemplo-almacen.com.ar',
          'DEMOSTRACIÓN — esta empresa no existe. Almacén de venta a granel: secos, legumbres y limpieza con envase propio.',
          v_demo, now() - interval '20 days', now() - interval '20 days', array['mercado'],
          now() - interval '29 days')
  returning id into v_d;

  insert into business_members (business_id, user_id, role, joined_at)
  values (v_d, v_demo, 'owner', now() - interval '29 days');
  insert into business_verifications (business_id, method, token, target, status, verified_at)
  values (v_d, 'dominio_meta', 'demo-token-d', 'ejemplo-almacen.com.ar', 'verificado', now() - interval '19 days');
  insert into business_terms (business_id, version, user_id, aceptado_at)
  values (v_d, brote_terminos_version(), v_demo, now() - interval '29 days');

  cl := $j${
   "d-envase": {"kind":"reduccion_origen","alcance":"Envase de todo lo que se vende a granel","datos":{"que_se_redujo":"envase descartable por compra","porcentaje":"90","comparado_con":"estandar_categoria"},"enunciado":"Se despacha en el envase que trae cada cliente."},
   "d-recarga": {"kind":"recargable","alcance":"Línea de limpieza a granel","datos":{"mecanismo_recarga":"Se rellena el bidón o la botella que trae el cliente, pesando antes y después","donde_se_recarga":"En el local de Rosario, en el mostrador de limpieza"},"evid":"si","enunciado":"La botella se rellena en el mostrador."},
   "d-organico": {"kind":"organico","alcance":"Legumbres del proveedor certificado","datos":{"porcentaje":"100"},"cert":"letis","num":"DEMO-0001","vence":"2027-09-30","enunciado":"Las legumbres vienen de un proveedor con certificación orgánica vigente."}
  }$j$::jsonb;

  for ref, it in select * from jsonb_each(cl) loop
    v_evid := case when it->>'evid' = 'si'
                   then v_d::text || '/afirmaciones/' || gen_random_uuid()::text || '.pdf' end;
    perform set_config('request.jwt.claims', json_build_object('sub', v_demo, 'role', 'authenticated')::text, true);
    v_res := claim_guardar(v_d, null, (it->>'kind')::claim_kind, it->>'alcance',
                           coalesce(it->'datos', '{}'::jsonb), it->>'cert', it->>'num',
                           (it->>'vence')::date, v_evid, it->>'enunciado');
    if not (v_res->>'ok')::boolean then raise exception 'afirmacion % => %', ref, v_res::text; end if;
    v_map := v_map || jsonb_build_object(ref, v_res->>'id');
  end loop;

  ls := $j$[
   {"img":6,"dias":18,"cat":"almacen-granel","dom":["consumo","residuos"],"precio":2400,"disp":"local","zonas":["Rosario"],"claims":["d-organico","d-envase"],"titulo":"Lentejas a granel, por 100 g","desc":"DEMOSTRACIÓN — producto de ejemplo, no está a la venta. Lentejas despachadas en el envase que traés vos: se pesa el frasco vacío antes y se descuenta. Si no traés, hay bolsa de papel."},
   {"img":7,"dias":13,"cat":"almacen-granel","dom":["consumo","residuos"],"precio":1800,"disp":"local","zonas":["Rosario"],"claims":["d-envase"],"titulo":"Avena arrollada a granel, por 100 g","desc":"DEMOSTRACIÓN — producto de ejemplo, no está a la venta. Avena arrollada fina, del cajón al envase que traigas. Es el producto que más sale del sector de secos y no lleva envase de fábrica."},
   {"img":8,"dias":7,"cat":"limpieza-hogar","dom":["residuos","agua"],"precio":4600,"disp":"local","zonas":["Rosario"],"claims":["d-recarga","d-envase"],"titulo":"Limpiador de pisos a granel, por litro","desc":"DEMOSTRACIÓN — producto de ejemplo, no está a la venta. Limpiador de pisos que se despacha por litro en el bidón o la botella que traés. Se pesa antes y después, y se cobra la diferencia."}
  ]$j$::jsonb;

  for it in select * from jsonb_array_elements(ls) loop
    perform set_config('request.jwt.claims', json_build_object('sub', v_demo, 'role', 'authenticated')::text, true);
    v_res := listado_guardar(v_d, null, jsonb_build_object(
      'titulo', it->>'titulo', 'descripcion', it->>'desc', 'categoria', it->>'cat',
      'tipo', 'producto', 'dominios', it->'dom', 'precio_referencia', (it->>'precio')::numeric,
      'url_destino', 'https://brote-ft7m.vercel.app/negocios',
      'disponibilidad', it->>'disp', 'zonas', it->'zonas'));
    if not (v_res->>'ok')::boolean then raise exception 'listado % => %', it->>'titulo', v_res::text; end if;
    v_lid := (v_res->>'id')::uuid;
    v_lids := v_lids || v_lid;
    update listings set imagenes = array['/demo/' || (it->>'img') || '.webp'] where id = v_lid;
    select array_agg((v_map->>x)::uuid) into v_arr from jsonb_array_elements_text(it->'claims') x;
    perform listado_claims(v_lid, v_arr);
    v_res := listado_enviar(v_lid, null);
    if not (v_res->>'ok')::boolean then raise exception 'envio % => %', it->>'titulo', v_res::text; end if;
    update listings set status = 'publicado',
           enviado_at = now() - (((it->>'dias')::int + 1) || ' days')::interval,
           publicado_at = now() - ((it->>'dias') || ' days')::interval,
           revisado_at = now() - ((it->>'dias') || ' days')::interval,
           created_at = now() - (((it->>'dias')::int + 3) || ' days')::interval,
           updated_at = now() - ((it->>'dias') || ' days')::interval
     where id = v_lid;
  end loop;

  perform set_config('request.jwt.claims', '', true);
  update business_claims c
     set status = 'aprobada', auto_aprobada = false, revisado_at = now() - interval '15 days',
         categoria_origen = coalesce(c.categoria_origen,
           (select l.categoria from listing_claims lc join listings l on l.id = lc.listing_id
             where lc.claim_id = c.id limit 1)), updated_at = now()
   where c.business_id = v_d and c.status = 'pendiente';
  delete from notifications n
   where exists (select 1 from unnest(v_lids) x where n.data::text like '%' || x::text || '%');

  -- Demanda inventada, con la misma fórmula determinista de la sección 5.
  insert into listing_impresiones_dia (listing_id, business_id, dia, origen, impresiones)
  select l.id, l.business_id, d::date, o.origen,
         greatest(1, round(
           (case l.tier_efectivo when 'e3' then 26 when 'e2' then 19 else 13 end) * o.peso
           * (case when extract(dow from d) in (0, 6) then 0.55 else 1.0 end)
           * (0.65 + (((hashtext(l.id::text || d::text || o.origen) % 80) + 80) % 80) / 100.0)))::int
    from listings l
    cross join lateral generate_series(greatest(l.publicado_at::date, current_date - 44), current_date, interval '1 day') d
    cross join (values ('catalogo', 1.0), ('accion', 0.22), ('plaza', 0.12), ('perfil_negocio', 0.10)) as o(origen, peso)
   where l.business_id = v_d and l.status = 'publicado'
  on conflict (listing_id, dia, origen) do nothing;

  insert into listing_impresiones_mensual (listing_id, business_id, mes, impresiones)
  select listing_id, business_id, date_trunc('month', dia)::date, sum(impresiones)
    from listing_impresiones_dia where business_id = v_d group by 1, 2, 3
  on conflict (listing_id, mes) do update set impresiones = excluded.impresiones;

  insert into listing_clicks (listing_id, business_id, user_id, origen, ua_hash, created_at)
  select i.listing_id, i.business_id, null,
         (array['ficha','catalogo','accion','perfil_negocio'])
           [1 + (((hashtext(i.listing_id::text || i.dia::text || g::text) % 4) + 4) % 4)],
         null,
         i.dia::timestamptz + (interval '1 hour' * (9 + (((hashtext(i.listing_id::text || g::text) % 12) + 12) % 12)))
           + (interval '1 minute' * (((hashtext(i.dia::text || g::text) % 60) + 60) % 60))
    from (select listing_id, business_id, dia, sum(impresiones) as imp
            from listing_impresiones_dia where business_id = v_d group by 1, 2, 3) i
    cross join lateral generate_series(1, greatest(0, round(
      i.imp * (0.02 + (((hashtext(i.listing_id::text || i.dia::text) % 5) + 5) % 5) / 100.0))::int)) g;

  perform brote_recalcular_tiers();
  perform brote_recalcular_scores();
  raise notice 'Cuarto comercio de demostración creado.';
end $seed$;
