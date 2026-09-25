-- Brote — 0114 — El Mercado, segunda versión: el lado de quien vende.
--
-- QUÉ CAMBIA Y POR QUÉ. El alta de 0105 era para empresas: cinco pasos, CUIT,
-- una descripción de 120 caracteres, verificar la propiedad de un sitio web
-- con una etiqueta meta o un registro DNS, y esperar a que alguien del equipo
-- la aprobara a mano. Pedía cosas que no hacen falta para vender, dejaba afuera
-- a quien no tiene sitio propio (casi todos los que venden por WhatsApp o
-- Instagram) y su verificación no decía nada sobre el ambiente.
--
-- El alta nueva es abierta: cualquier persona adulta puede tener una tienda,
-- sea emprendimiento o empresa. Son cuatro pasos cortos:
--
--   1. La tienda: nombre, qué vende, dónde está y por dónde la contactan.
--   2. El compromiso: al menos dos prácticas concretas que YA hace, de una
--      lista cerrada, y una foto que muestre una de ellas.
--   3. La prueba verde: cinco respuestas correctas sobre cómo hablar de
--      ambiente sin exagerar. Si se equivoca, se explica y sigue con otra: es
--      para aprender las reglas que después aplica el validador.
--   4. Mercado Pago: vincula su cuenta (Brote confirma con Mercado Pago que es
--      una cuenta activa de Argentina con identidad cargada) y RECIÉN AHÍ se
--      suscribe: USD 5 por mes, cobrados en pesos al dólar oficial del día.
--
-- Cuando el primer cobro se autoriza, la tienda queda abierta y puede publicar.
-- Nadie la aprueba a mano: la foto del compromiso la revisa el equipo DESPUÉS
-- (`/panel/compromisos`), y hasta entonces se muestra como lo que es:
-- "declarado por la tienda, con foto".
--
-- LO QUE SE CONSERVA. La escritura es solo por RPC. El nivel es de cada
-- afirmación. El plan nunca entra en el puntaje. Menores no venden. Lo que se
-- dio de alta con el flujo anterior (`modelo = 'legacy'`: hoy, solo los
-- comercios de demostración) sigue con sus reglas de siempre.
--
-- AJUSTES SIN DEPLOY (en `app_settings`; sin fila, vale el valor por defecto):
--   mercado_cobro_vendedores      true   apagado = tiendas nuevas sin cobro
--   mercado_vendedor_mp_requerido true   apagado = no exige vincular Mercado Pago
--   mercado_vendedor_usd          5      el precio en dólares
--   mercado_vendedor_ars          0      precio en pesos de respaldo si no hay cotización

-- ── 1. Ajustes ──────────────────────────────────────────────────────────────

create or replace function brote_ajuste_num(p_key text, p_def numeric)
returns numeric language plpgsql stable security definer set search_path = public as $fn$
declare v numeric;
begin
  begin
    select (value #>> '{}')::numeric into v from app_settings where key = p_key;
  exception when others then v := null;
  end;
  return coalesce(v, p_def);
end $fn$;

create or replace function brote_ajuste_bool(p_key text, p_def boolean)
returns boolean language plpgsql stable security definer set search_path = public as $fn$
declare v boolean;
begin
  begin
    select (value #>> '{}')::boolean into v from app_settings where key = p_key;
  exception when others then v := null;
  end;
  return coalesce(v, p_def);
end $fn$;

create or replace function brote_vendedor_cobro()
returns boolean language sql stable security definer set search_path = public as $fn$
  select brote_ajuste_bool('mercado_cobro_vendedores', true);
$fn$;

create or replace function brote_vendedor_mp_requerido()
returns boolean language sql stable security definer set search_path = public as $fn$
  select brote_ajuste_bool('mercado_vendedor_mp_requerido', true);
$fn$;

-- Los términos ahora cubren a las tiendas (quién puede vender, el compromiso,
-- USD 5 por mes y el ajuste por tipo de cambio): /legal/negocios pasa a la
-- versión 2026-09-24 y quien ya los había aceptado los acepta de nuevo antes de
-- seguir. Solo avanza: si alguien ya puso una versión posterior, no se toca.
create or replace function brote_terminos_version()
returns text language sql stable security definer set search_path = public as $fn$
  select coalesce((select value #>> '{}' from app_settings where key = 'negocios_terminos_version'), '2026-09-24');
$fn$;

update app_settings set value = '"2026-09-24"'::jsonb
 where key = 'negocios_terminos_version' and coalesce(value #>> '{}', '') < '2026-09-24';

-- ── 2. El dólar oficial ─────────────────────────────────────────────────────
-- Se pide una vez por día a dolarapi.com (el valor de venta del dólar oficial
-- que publica el BCRA a través de los bancos) con `pg_net`, en dos pasos como
-- la salud de enlaces: lanzar y, diez minutos después, leer. Un valor fuera de
-- rango se descarta: un error del proveedor no puede cobrarle a nadie $5.

create table if not exists tipos_cambio (
  fuente      text not null,
  fecha       date not null,
  compra      numeric,
  venta       numeric not null check (venta > 0),
  obtenido_at timestamptz not null default now(),
  crudo       jsonb,
  primary key (fuente, fecha)
);
create table if not exists tipos_cambio_pedidos (
  id         bigint primary key,
  lanzado_at timestamptz not null default now(),
  leido_at   timestamptz
);
alter table tipos_cambio enable row level security;
alter table tipos_cambio_pedidos enable row level security;
revoke all on tipos_cambio, tipos_cambio_pedidos from anon, authenticated;

create or replace function brote_tipo_cambio_lanzar()
returns bigint language plpgsql security definer set search_path = public, net as $fn$
declare v_id bigint;
begin
  select net.http_get(url := 'https://dolarapi.com/v1/dolares/oficial', timeout_milliseconds := 15000) into v_id;
  insert into tipos_cambio_pedidos (id) values (v_id) on conflict do nothing;
  return v_id;
end $fn$;

create or replace function brote_tipo_cambio_leer()
returns jsonb language plpgsql security definer set search_path = public, net as $fn$
declare r record; v_body jsonb; v_venta numeric; v_compra numeric; n int := 0;
begin
  for r in
    select p.id, h.status_code, h.content
      from tipos_cambio_pedidos p
      join net._http_response h on h.id = p.id
     where p.leido_at is null
  loop
    begin
      v_body := r.content::jsonb;
      v_venta := (v_body->>'venta')::numeric;
      v_compra := (v_body->>'compra')::numeric;
    exception when others then
      v_venta := null;
    end;
    if r.status_code = 200 and v_venta between 100 and 100000 then
      insert into tipos_cambio (fuente, fecha, compra, venta, crudo)
      values ('oficial', (now() at time zone 'America/Argentina/Buenos_Aires')::date, v_compra, v_venta, v_body)
      on conflict (fuente, fecha) do update set venta = excluded.venta, compra = excluded.compra,
                                                crudo = excluded.crudo, obtenido_at = now();
      n := n + 1;
    end if;
    update tipos_cambio_pedidos set leido_at = now() where id = r.id;
  end loop;
  delete from tipos_cambio_pedidos where lanzado_at < now() - interval '3 days';
  return jsonb_build_object('leidos', n);
end $fn$;

-- La cotización vigente: la última de los últimos 10 días.
create or replace function brote_tipo_cambio_actual()
returns jsonb language sql stable security definer set search_path = public as $fn$
  select (select jsonb_build_object('venta', venta, 'fecha', fecha)
            from tipos_cambio where fuente = 'oficial' and fecha > current_date - 10
           order by fecha desc limit 1);
$fn$;

-- Lo que cuesta la suscripción de quien vende, hoy. En pesos, redondeado hacia
-- arriba a la centena: "$7.300" se lee mejor que "$7.263,50" y la diferencia
-- es de centavos de dólar. Sin cotización y sin precio de respaldo, no hay
-- precio: nadie se suscribe con un número inventado.
create or replace function brote_vendedor_precio()
returns jsonb language plpgsql stable security definer set search_path = public as $fn$
declare v_usd numeric; v_tc jsonb; v_ars numeric; v_manual numeric;
begin
  v_usd := brote_ajuste_num('mercado_vendedor_usd', 5);
  v_tc := brote_tipo_cambio_actual();
  if v_tc is not null then
    v_ars := ceil(v_usd * (v_tc->>'venta')::numeric / 100) * 100;
    return jsonb_build_object('usd', v_usd, 'ars', v_ars, 'tipo_cambio', (v_tc->>'venta')::numeric,
                              'fecha', v_tc->>'fecha', 'fuente', 'oficial');
  end if;
  v_manual := brote_ajuste_num('mercado_vendedor_ars', 0);
  if v_manual > 0 then
    return jsonb_build_object('usd', v_usd, 'ars', v_manual, 'tipo_cambio', null, 'fecha', null, 'fuente', 'manual');
  end if;
  return jsonb_build_object('usd', v_usd, 'ars', null, 'tipo_cambio', null, 'fecha', null, 'fuente', null);
end $fn$;

select cron.unschedule('brote-dolar') where exists (select 1 from cron.job where jobname = 'brote-dolar');
select cron.unschedule('brote-dolar-leer') where exists (select 1 from cron.job where jobname = 'brote-dolar-leer');
-- 10:00 AR (13:00 UTC), cuando los bancos ya publicaron, y la lectura diez minutos después.
select cron.schedule('brote-dolar', '0 13 * * *', $cron$ select brote_tipo_cambio_lanzar(); $cron$);
select cron.schedule('brote-dolar-leer', '10 13 * * *', $cron$ select brote_tipo_cambio_leer(); $cron$);

-- ── 3. El plan de quien vende ───────────────────────────────────────────────
-- Un solo plan. Lo que compra es CAPACIDAD —300 productos publicados a la vez,
-- equipo de 3, analítica completa— y nunca posición: `brote_listado_score` no
-- tiene término de plan.

create or replace function brote_biz_limites(p_plan biz_plan)
returns jsonb language sql immutable set search_path = public as $fn$
  select case p_plan
    when 'semilla' then '{"listados":3,"objetivos":2,"replanificaciones":4,"miembros":1,
                          "analitica":"basica","historial_publico":false,"destacados":0,"acelerada":false}'::jsonb
    when 'raiz'    then '{"listados":15,"objetivos":3,"replanificaciones":8,"miembros":3,
                          "analitica":"completa","historial_publico":true,"destacados":0,"acelerada":true}'::jsonb
    when 'vendedor' then '{"listados":300,"objetivos":3,"replanificaciones":8,"miembros":3,
                          "analitica":"completa","historial_publico":true,"destacados":0,"acelerada":true}'::jsonb
    else                '{"listados":999999,"objetivos":3,"replanificaciones":15,"miembros":10,
                          "analitica":"completa","historial_publico":true,"destacados":1,"acelerada":true}'::jsonb
  end;
$fn$;

create or replace function brote_negocio_plan(p_business uuid)
returns text language sql stable security definer set search_path = public as $fn$
  select case
    when (select modelo from businesses where id = p_business) = 'vendedor' then 'vendedor'
    when not brote_biz_cobro_activo() then 'raiz'
    else coalesce((select s.plan::text from business_subscriptions s
                    where s.business_id = p_business and s.status in ('activa','en_gracia')
                    order by s.created_at desc limit 1), 'semilla')
  end;
$fn$;

-- Puede escribir (publicar, sumar objetivos): una tienda nueva, con la
-- suscripción al día —o sin cobro—; una del flujo anterior, con sus reglas.
create or replace function brote_biz_escritura(p_business uuid)
returns boolean language sql stable security definer set search_path = public as $fn$
  select case
    when (select modelo from businesses where id = p_business) = 'vendedor'
      then (not brote_vendedor_cobro()) or brote_biz_activo(p_business)
    else (not brote_biz_cobro_activo()) or brote_biz_en_prueba(p_business) or brote_biz_activo(p_business)
  end;
$fn$;

-- ── 4. El alta ──────────────────────────────────────────────────────────────

-- Qué rubro de 0105 corresponde a la categoría principal del Mercado.
create or replace function brote_categoria_rubro(p_categoria text)
returns text language sql immutable set search_path = public as $fn$
  select case p_categoria
    when 'alimentos-frescos' then 'produccion-alimentos'
    when 'almacen-granel' then 'comercio-minorista'
    when 'bebidas' then 'produccion-alimentos'
    when 'limpieza-hogar' then 'limpieza-higiene'
    when 'cuidado-personal' then 'belleza-cuidado-personal'
    when 'indumentaria' then 'indumentaria-textil'
    when 'hogar-y-deco' then 'hogar-construccion'
    when 'jardin-y-huerta' then 'agro-vivero-huerta'
    when 'mascotas' then 'comercio-minorista'
    when 'movilidad' then 'logistica-transporte'
    when 'servicios-profesionales' then 'servicios-profesionales'
    when 'reparacion-y-reuso' then 'reparacion-reuso'
    else 'comercio-minorista' end;
$fn$;

-- Crea la tienda con lo mínimo: un nombre. Todo lo demás se completa con
-- `vendedor_guardar`, así el primer paso se guarda aunque falte algo.
create or replace function vendedor_crear(p_nombre text)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare
  v_uid uuid := auth.uid(); v_prof profiles%rowtype; v_confirmado timestamptz;
  v_owned int; v_tope int; v_nombre text := trim(coalesce(p_nombre, '')); v_id uuid;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'error', 'no_autenticado'); end if;
  select * into v_prof from profiles where id = v_uid;
  if v_prof.account_type is distinct from 'adult' then return jsonb_build_object('ok', false, 'error', 'solo_adultos'); end if;
  if not coalesce(v_prof.onboarding_completed, false) then
    return jsonb_build_object('ok', false, 'error', 'onboarding_pendiente');
  end if;
  select email_confirmed_at into v_confirmado from auth.users where id = v_uid;
  if v_confirmado is null then return jsonb_build_object('ok', false, 'error', 'email_sin_confirmar'); end if;
  if char_length(v_nombre) not between 2 and 80 then
    return jsonb_build_object('ok', false, 'error', 'campo_invalido', 'campo', 'nombre_comercial');
  end if;
  if brote_matches_blocklist(v_nombre) then
    return jsonb_build_object('ok', false, 'error', 'campo_invalido', 'campo', 'nombre_comercial');
  end if;

  perform pg_advisory_xact_lock(hashtext('create_business:' || v_uid::text));
  v_tope := coalesce((select (value #>> '{}')::int from app_settings where key = 'negocios_max_por_dueno'), 3);
  select count(*) into v_owned from business_members where user_id = v_uid and role = 'owner';
  if v_owned >= v_tope then return jsonb_build_object('ok', false, 'error', 'limite_negocios'); end if;

  insert into businesses (slug, nombre_comercial, rubro, provincia, modelo, created_by, alta_paso)
  values (brote_slugify(v_nombre), v_nombre, 'comercio-minorista',
          case when v_prof.city = any(brote_provincias()) then v_prof.city end,
          'vendedor', v_uid, 1)
  returning id into v_id;
  insert into business_members (business_id, user_id, role) values (v_id, v_uid, 'owner');
  return jsonb_build_object('ok', true, 'id', v_id);
end $fn$;

-- Guarda datos de la tienda. Sirve en el alta y después (editar el perfil de la
-- tienda). Cada campo se valida acá aunque el cliente ya lo haya hecho.
create or replace function vendedor_guardar(p_business uuid, p_datos jsonb)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare b businesses%rowtype; v text;
begin
  if not brote_can_write(p_business, 'admin') then return jsonb_build_object('ok', false, 'error', 'sin_permiso'); end if;
  if jsonb_typeof(p_datos) is distinct from 'object' then return jsonb_build_object('ok', false, 'error', 'datos_invalidos'); end if;
  select * into b from businesses where id = p_business for update;
  if b.modelo <> 'vendedor' then return jsonb_build_object('ok', false, 'error', 'no_editable'); end if;
  if b.status in ('suspended','closed') then return jsonb_build_object('ok', false, 'error', 'no_editable'); end if;

  if p_datos ? 'nombre_comercial' then
    v := trim(coalesce(p_datos->>'nombre_comercial', ''));
    if char_length(v) not between 2 and 80 or brote_matches_blocklist(v) then
      return jsonb_build_object('ok', false, 'error', 'campo_invalido', 'campo', 'nombre_comercial');
    end if;
    b.nombre_comercial := v;
    -- El slug se fija con el nombre mientras la tienda no abrió.
    if b.activa_at is null then b.slug := brote_slugify(v); end if;
  end if;

  if p_datos ? 'tipo_vendedor' then
    if coalesce(p_datos->>'tipo_vendedor', '') not in ('persona','empresa') then
      return jsonb_build_object('ok', false, 'error', 'campo_invalido', 'campo', 'tipo_vendedor');
    end if;
    b.tipo_vendedor := p_datos->>'tipo_vendedor';
  end if;

  if p_datos ? 'categoria_principal' then
    v := p_datos->>'categoria_principal';
    if v is null or not (v = any(brote_mercado_categorias())) then
      return jsonb_build_object('ok', false, 'error', 'campo_invalido', 'campo', 'categoria_principal');
    end if;
    b.categoria_principal := v;
    b.rubro := brote_categoria_rubro(v);
  end if;

  if p_datos ? 'provincia' then
    v := nullif(p_datos->>'provincia', '');
    if v is not null and not (v = any(brote_provincias())) then
      return jsonb_build_object('ok', false, 'error', 'campo_invalido', 'campo', 'provincia');
    end if;
    b.provincia := v;
  end if;

  if p_datos ? 'ciudad' then
    b.ciudad := nullif(trim(coalesce(p_datos->>'ciudad', '')), '');
    if char_length(b.ciudad) > 80 then return jsonb_build_object('ok', false, 'error', 'campo_invalido', 'campo', 'ciudad'); end if;
  end if;

  if p_datos ? 'descripcion' then
    b.descripcion := nullif(trim(coalesce(p_datos->>'descripcion', '')), '');
    if char_length(b.descripcion) > 1000 or brote_texto_prohibido(b.descripcion) is not null
       or brote_matches_blocklist(coalesce(b.descripcion, '')) then
      return jsonb_build_object('ok', false, 'error', 'campo_invalido', 'campo', 'descripcion');
    end if;
    -- Antihalo: una tienda no se describe con afirmaciones de producto. Lo
    -- orgánico, lo reciclable o lo sin TACC se cuenta en cada producto, con su
    -- afirmación y su nivel.
    if brote_termino_sin_afirmacion(b.descripcion, '{}', false) is not null then
      return jsonb_build_object('ok', false, 'error', 'termino_sin_afirmacion', 'campo', 'descripcion',
                                'termino', brote_termino_sin_afirmacion(b.descripcion, '{}', false));
    end if;
  end if;

  if p_datos ? 'whatsapp' then
    v := nullif(regexp_replace(coalesce(p_datos->>'whatsapp', ''), '[^\d+]', '', 'g'), '');
    if v is not null and v !~ '^\+?\d{8,15}$' then
      return jsonb_build_object('ok', false, 'error', 'campo_invalido', 'campo', 'whatsapp');
    end if;
    b.whatsapp := v;
  end if;

  if p_datos ? 'sitio_web' then
    v := nullif(trim(coalesce(p_datos->>'sitio_web', '')), '');
    if v is not null and v !~ '^https://[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$' then
      return jsonb_build_object('ok', false, 'error', 'campo_invalido', 'campo', 'sitio_web');
    end if;
    if v is distinct from b.sitio_web then
      delete from business_verifications
       where business_id = p_business and method in ('dominio_meta','dominio_dns','dominio_archivo','email_dominio');
      b.sitio_estado := null; b.sitio_chequeado_at := null;
    end if;
    b.sitio_web := v;
  end if;

  if p_datos ? 'instagram' then
    v := nullif(lower(trim(both '@' from trim(coalesce(p_datos->>'instagram', '')))), '');
    if v is not null and v !~ '^[a-z0-9._]{1,30}$' then
      return jsonb_build_object('ok', false, 'error', 'campo_invalido', 'campo', 'instagram');
    end if;
    b.instagram := v;
  end if;

  if p_datos ? 'contacto_preferido' then
    v := nullif(p_datos->>'contacto_preferido', '');
    if v is not null and v not in ('whatsapp','web','instagram') then
      return jsonb_build_object('ok', false, 'error', 'campo_invalido', 'campo', 'contacto_preferido');
    end if;
    b.contacto_preferido := v;
  end if;

  if p_datos ? 'cuit' then
    v := regexp_replace(coalesce(p_datos->>'cuit', ''), '\D', '', 'g');
    if v = '' then b.cuit := null;
    elsif not brote_cuit_valido(v) then return jsonb_build_object('ok', false, 'error', 'campo_invalido', 'campo', 'cuit');
    else b.cuit := v;
    end if;
  end if;

  if p_datos ? 'razon_social' then
    b.razon_social := nullif(trim(coalesce(p_datos->>'razon_social', '')), '');
    if char_length(b.razon_social) > 120 then
      return jsonb_build_object('ok', false, 'error', 'campo_invalido', 'campo', 'razon_social');
    end if;
  end if;

  if p_datos ? 'logo_url' then
    v := nullif(p_datos->>'logo_url', '');
    if v is not null and v !~ ('^' || p_business::text || '/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$') then
      return jsonb_build_object('ok', false, 'error', 'campo_invalido', 'campo', 'logo_url');
    end if;
    b.logo_url := v;
  end if;

  -- El canal preferido tiene que existir.
  if b.contacto_preferido = 'whatsapp' and b.whatsapp is null
     or b.contacto_preferido = 'web' and b.sitio_web is null
     or b.contacto_preferido = 'instagram' and b.instagram is null then
    b.contacto_preferido := case when b.whatsapp is not null then 'whatsapp'
                                 when b.sitio_web is not null then 'web'
                                 when b.instagram is not null then 'instagram' end;
  end if;

  update businesses set
    nombre_comercial = b.nombre_comercial, slug = b.slug, tipo_vendedor = b.tipo_vendedor,
    categoria_principal = b.categoria_principal, rubro = b.rubro, provincia = b.provincia,
    ciudad = b.ciudad, descripcion = b.descripcion, whatsapp = b.whatsapp, sitio_web = b.sitio_web,
    instagram = b.instagram, contacto_preferido = b.contacto_preferido, cuit = b.cuit,
    razon_social = b.razon_social, logo_url = b.logo_url, sitio_estado = b.sitio_estado,
    sitio_chequeado_at = b.sitio_chequeado_at,
    -- Una tienda del flujo anterior que había quedado "enviada" vuelve a ser un
    -- borrador del alta nueva: nadie la estaba revisando.
    status = case when b.status in ('submitted','in_review','rejected') then 'draft'::business_status else b.status end,
    alta_paso = greatest(b.alta_paso, 2),
    updated_at = now()
  where id = p_business;

  return jsonb_build_object('ok', true, 'slug', b.slug);
end $fn$;

-- El compromiso: 2 a 6 prácticas de la lista, una con foto. Reemplaza lo
-- anterior salvo lo ya revisado por el equipo, que no se pierde por editar.
create or replace function vendedor_compromisos(p_business uuid, p_practicas text[], p_foto_practica text, p_foto_path text)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare v_pr text[]; v_foto text;
begin
  if not brote_can_write(p_business, 'admin') then return jsonb_build_object('ok', false, 'error', 'sin_permiso'); end if;
  select coalesce(array_agg(distinct x), '{}') into v_pr from unnest(coalesce(p_practicas, '{}')) x;
  if cardinality(v_pr) < 2 then return jsonb_build_object('ok', false, 'error', 'pocas_practicas'); end if;
  if cardinality(v_pr) > 6 then return jsonb_build_object('ok', false, 'error', 'demasiadas_practicas'); end if;
  if not (v_pr <@ brote_practicas()) then return jsonb_build_object('ok', false, 'error', 'practica_invalida'); end if;

  v_foto := nullif(p_foto_path, '');
  if v_foto is not null then
    if p_foto_practica is null or not (p_foto_practica = any(v_pr)) then
      return jsonb_build_object('ok', false, 'error', 'foto_sin_practica');
    end if;
    if v_foto !~ ('^' || p_business::text || '/compromisos/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$') then
      return jsonb_build_object('ok', false, 'error', 'ruta_invalida');
    end if;
  end if;

  delete from tienda_compromisos
   where business_id = p_business and not (practica = any(v_pr)) and estado <> 'revisado';
  insert into tienda_compromisos (business_id, practica)
  select p_business, x from unnest(v_pr) x
  on conflict (business_id, practica) do update
    set estado = case when tienda_compromisos.estado = 'rechazado' then 'declarado' else tienda_compromisos.estado end,
        updated_at = now();
  if v_foto is not null then
    update tienda_compromisos
       set foto_path = v_foto, estado = case when foto_path is distinct from v_foto then 'declarado' else estado end,
           updated_at = now()
     where business_id = p_business and practica = p_foto_practica;
  end if;

  if not exists (select 1 from tienda_compromisos where business_id = p_business and foto_path is not null and estado <> 'rechazado') then
    return jsonb_build_object('ok', false, 'error', 'falta_foto');
  end if;
  update businesses set alta_paso = greatest(alta_paso, 3) where id = p_business;
  -- Una foto nueva de una tienda abierta vuelve a la cola del equipo.
  if v_foto is not null and (select status from businesses where id = p_business) = 'approved' then
    perform brote_negocio_notificar_revisores('Compromiso para revisar',
      'Una tienda subió una foto de su compromiso.', '/panel/compromisos');
  end if;
  return jsonb_build_object('ok', true);
end $fn$;

-- ── 5. La prueba verde ──────────────────────────────────────────────────────
-- Cinco respuestas correctas. Si se equivoca, se explica por qué y sigue con
-- otra pregunta; con tres errores en el mismo intento, empieza de nuevo (con
-- las preguntas en otro orden). La respuesta correcta nunca viaja antes de
-- contestar, y quién contestó qué queda registrado.

create table if not exists vendedor_preguntas (
  id          text primary key,
  enunciado   text not null,
  opciones    jsonb not null,      -- [{id, texto}]
  correcta    text not null,
  explicacion text not null,
  activa      boolean not null default true
);
alter table vendedor_preguntas enable row level security;
revoke all on vendedor_preguntas from anon, authenticated;

create table if not exists vendedor_prueba_intentos (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references businesses(id) on delete cascade,
  user_id      uuid references profiles(id) on delete set null,
  orden        text[] not null,
  actual       int not null default 1,
  correctas    int not null default 0,
  incorrectas  int not null default 0,
  respuestas   jsonb not null default '[]',
  estado       text not null default 'en_curso' check (estado in ('en_curso','aprobada','fallida')),
  created_at   timestamptz not null default now(),
  terminado_at timestamptz
);
create index if not exists idx_vpi_business on vendedor_prueba_intentos (business_id, created_at desc);
alter table vendedor_prueba_intentos enable row level security;
revoke all on vendedor_prueba_intentos from anon, authenticated;

insert into vendedor_preguntas (id, enunciado, opciones, correcta, explicacion) values
('absolutos',
 'Vendés un jabón de glicerina vegetal. ¿Cómo lo podés presentar en Brote?',
 '[{"id":"a","texto":"Jabón de glicerina vegetal, en barra"},{"id":"b","texto":"Jabón 100% ecológico"},{"id":"c","texto":"El jabón que no contamina"}]',
 'a', 'Las frases absolutas ("100% ecológico", "no contamina", "impacto cero") no se pueden probar: todo producto tiene algún impacto. Decí lo concreto: de qué está hecho y cómo viene.'),
('organico',
 'Querés decir que tu yerba es orgánica. ¿Qué hace falta?',
 '[{"id":"a","texto":"Que los ingredientes sean naturales"},{"id":"b","texto":"Una certificación de una entidad habilitada por SENASA"},{"id":"c","texto":"Que tu proveedor te lo haya dicho"}]',
 'b', 'En Argentina "orgánico" es un término protegido por la Ley 25.127: solo lo puede usar lo certificado por una entidad habilitada por SENASA. Sin certificado, contá cómo se produce.'),
('biodegradable',
 'Tu bolsa se degrada en cinco años en un basural. ¿Podés decir "biodegradable"?',
 '[{"id":"a","texto":"Sí, porque en algún momento se degrada"},{"id":"b","texto":"Sí, si agregás \"con el tiempo\""},{"id":"c","texto":"No: en Brote tiene que degradarse en 12 meses o menos, con documentación"}]',
 'c', 'Casi todo se degrada "algún día". Por eso en Brote "biodegradable" exige un plazo de 12 meses o menos y un documento que lo respalde.'),
('salud',
 'Alguien te pregunta si tu té de hierbas ayuda a adelgazar. ¿Qué podés contestar en Brote?',
 '[{"id":"a","texto":"Que en Brote no se hacen afirmaciones de salud"},{"id":"b","texto":"Que sí, porque lo dicen tus clientes"},{"id":"c","texto":"Que \"ayuda a desintoxicar\""}]',
 'a', 'Curar, prevenir, adelgazar o desintoxicar son afirmaciones de salud: las regula la ANMAT y en el Mercado no se aceptan, tengas la certificación que tengas.'),
('halo',
 'Tu café tiene certificación de comercio justo. ¿Podés mostrarla en la miel que también vendés?',
 '[{"id":"a","texto":"Sí, porque es la misma tienda"},{"id":"b","texto":"No: una certificación vale solo para el producto que certifica"},{"id":"c","texto":"Sí, si subís la foto del certificado"}]',
 'b', 'Es la regla más importante del Mercado: el nivel es de cada afirmación, nunca de la tienda. Un sello de un producto no se "contagia" a los demás.'),
('reciclable',
 'Tu envase es de un plástico que en tu ciudad nadie recicla. ¿Qué conviene decir?',
 '[{"id":"a","texto":"Reciclable"},{"id":"b","texto":"100% reciclable"},{"id":"c","texto":"De qué material es y dónde se puede reciclar de verdad"}]',
 'c', 'Que un material sea técnicamente reciclable no sirve si nadie lo recicla donde se usa. Lo honesto es decir el material y dónde se recibe.'),
('carbono',
 'Compensaste emisiones comprando bonos de carbono. ¿Podés decir "carbono neutral"?',
 '[{"id":"a","texto":"No: en Brote no se acepta; podés contar qué mediste y qué hiciste"},{"id":"b","texto":"Sí, porque compensaste"},{"id":"c","texto":"Sí, si mostrás el recibo de los bonos"}]',
 'a', '"Carbono neutral" suele esconder que se siguió emitiendo igual. En Brote no se acepta: se cuenta la medición, lo que se redujo y lo que se compensó, por separado.'),
('nivel1',
 '¿Qué quiere decir "Nivel 1 · Declarado por el comercio" en un producto?',
 '[{"id":"a","texto":"Que Brote lo verificó"},{"id":"b","texto":"Que es el mejor nivel"},{"id":"c","texto":"Que lo afirma la tienda y Brote no revisó documentos que lo respalden"}]',
 'c', 'Los niveles dicen cuánta evidencia hay detrás de cada afirmación. El 1 es tu palabra; el 2, documentación revisada; el 3, una certificación de un tercero.'),
('foto',
 'Tu compromiso es "envío sin plástico de un solo uso". ¿Qué foto lo muestra?',
 '[{"id":"a","texto":"Un paquete real, armado como lo mandás"},{"id":"b","texto":"Un paisaje con árboles"},{"id":"c","texto":"El símbolo de reciclaje"}]',
 'a', 'La foto del compromiso tiene que mostrar la práctica, no la idea: un paquete de verdad, tu estación de recarga, tu huerta, tu taller.'),
('porcentaje',
 'Tu mochila tiene 30% de material reciclado. ¿Cuál es la forma honesta de decirlo?',
 '[{"id":"a","texto":"Hecha con materiales reciclados"},{"id":"b","texto":"Con 30% de contenido reciclado"},{"id":"c","texto":"Mochila reciclada"}]',
 'b', 'Si una parte es reciclada, se dice cuánto. "Hecha con reciclados" hace creer que es toda.'),
('reportes',
 '¿Qué pasa si publicás algo falso y dos personas distintas lo reportan?',
 '[{"id":"a","texto":"Nada, hasta que Brote lo mire"},{"id":"b","texto":"El producto sale del Mercado hasta que se revise"},{"id":"c","texto":"Te cobran una multa"}]',
 'b', 'Con dos reportes de personas distintas, el producto deja de mostrarse hasta que el equipo lo revisa. Tenés 7 días para dar tu descargo, con evidencia.'),
('huerta',
 'Vendés verduras de tu huerta, cultivadas sin agroquímicos pero sin certificación. ¿Qué podés decir?',
 '[{"id":"a","texto":"Orgánicas"},{"id":"b","texto":"Libres de todo químico"},{"id":"c","texto":"Cultivadas sin agroquímicos de síntesis (declarado por la tienda)"}]',
 'c', 'Sin certificación no es "orgánico", y "sin químicos" no existe: todo es química. Contar cómo cultivás es honesto, y se muestra como declarado.'),
('natural',
 'En un producto de limpieza, la palabra "natural"…',
 '[{"id":"a","texto":"No dice nada concreto: mejor contar qué ingredientes tiene"},{"id":"b","texto":"Garantiza que es seguro"},{"id":"c","texto":"Quiere decir que es biodegradable"}]',
 'a', '"Natural" no dice si algo es seguro ni si se degrada: hay sustancias naturales muy tóxicas. Los ingredientes sí dicen algo.'),
('usado',
 'Vendés ropa usada. ¿Qué ayuda más a quien compra?',
 '[{"id":"a","texto":"Decir siempre \"como nueva\""},{"id":"b","texto":"El estado real, con fotos de los detalles"},{"id":"c","texto":"No aclarar que es usada"}]',
 'b', 'En el Mercado cada producto dice si es nuevo, usado o reacondicionado. Las fotos de los detalles evitan reclamos y reportes.'),
('proveedor',
 'Un proveedor te dice que su tela es "eco". ¿Qué hacés antes de repetirlo?',
 '[{"id":"a","texto":"Le preguntás qué significa y con qué lo respalda"},{"id":"b","texto":"Lo repetís tal cual"},{"id":"c","texto":"Lo cambiás por \"sustentable\""}]',
 'a', 'Lo que publicás es responsabilidad tuya, aunque lo haya dicho otro. Si el proveedor tiene un certificado, podés cargarlo como afirmación con su nivel.'),
('comparar',
 '¿Cuál de estas comparaciones es honesta?',
 '[{"id":"a","texto":"El más ecológico del mercado"},{"id":"b","texto":"Mejor para el planeta que cualquier otro"},{"id":"c","texto":"Usa 40% menos plástico que nuestro envase anterior"}]',
 'c', 'Una comparación honesta dice contra qué y cuánto, y se puede comprobar. "El más ecológico" no se puede medir.')
on conflict (id) do update set enunciado = excluded.enunciado, opciones = excluded.opciones,
  correcta = excluded.correcta, explicacion = excluded.explicacion, activa = true;

-- Lo que viaja de una pregunta: el enunciado y las opciones en otro orden.
create or replace function brote_vendedor_pregunta(p_id text)
returns jsonb language sql stable security definer set search_path = public as $fn$
  select jsonb_build_object('id', q.id, 'enunciado', q.enunciado,
           'opciones', (select jsonb_agg(o order by random()) from jsonb_array_elements(q.opciones) o))
    from vendedor_preguntas q where q.id = p_id;
$fn$;

create or replace function vendedor_prueba_empezar(p_business uuid)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare v_orden text[]; i vendedor_prueba_intentos%rowtype;
begin
  if not brote_can_write(p_business, 'admin') then return jsonb_build_object('ok', false, 'error', 'sin_permiso'); end if;
  if (select prueba_verde_at from businesses where id = p_business) is not null then
    return jsonb_build_object('ok', true, 'aprobada', true);
  end if;
  -- Un intento en curso se retoma (recargar la página no regala preguntas).
  select * into i from vendedor_prueba_intentos
   where business_id = p_business and estado = 'en_curso' and created_at > now() - interval '1 day'
   order by created_at desc limit 1;
  if i.id is null then
    if not brote_rate_limit('prueba_verde:' || p_business, 10) then
      return jsonb_build_object('ok', false, 'error', 'demasiados_intentos');
    end if;
    select array_agg(id order by random()) into v_orden from vendedor_preguntas where activa;
    insert into vendedor_prueba_intentos (business_id, user_id, orden)
    values (p_business, (select auth.uid()), v_orden) returning * into i;
  end if;
  return jsonb_build_object('ok', true, 'aprobada', false, 'intento', i.id,
    'correctas', i.correctas, 'incorrectas', i.incorrectas, 'necesarias', 5, 'max_errores', 3,
    'pregunta', brote_vendedor_pregunta(i.orden[i.actual]));
end $fn$;

create or replace function vendedor_prueba_responder(p_intento uuid, p_pregunta text, p_opcion text)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare i vendedor_prueba_intentos%rowtype; q vendedor_preguntas%rowtype; v_ok boolean; v_estado text;
begin
  select * into i from vendedor_prueba_intentos where id = p_intento for update;
  if i.id is null or not brote_can_write(i.business_id, 'admin') then
    return jsonb_build_object('ok', false, 'error', 'sin_permiso');
  end if;
  if i.estado <> 'en_curso' then return jsonb_build_object('ok', false, 'error', 'terminado'); end if;
  if i.orden[i.actual] is distinct from p_pregunta then
    return jsonb_build_object('ok', false, 'error', 'otra_pregunta');
  end if;
  select * into q from vendedor_preguntas where id = p_pregunta;
  v_ok := q.correcta = p_opcion;

  i.correctas := i.correctas + case when v_ok then 1 else 0 end;
  i.incorrectas := i.incorrectas + case when v_ok then 0 else 1 end;
  v_estado := case when i.correctas >= 5 then 'aprobada'
                   when i.incorrectas >= 3 or i.actual >= cardinality(i.orden) then 'fallida'
                   else 'en_curso' end;

  update vendedor_prueba_intentos
     set correctas = i.correctas, incorrectas = i.incorrectas, actual = i.actual + 1,
         respuestas = respuestas || jsonb_build_array(jsonb_build_object('pregunta', p_pregunta, 'opcion', p_opcion,
                                                                         'correcta', v_ok, 'at', now())),
         estado = v_estado, terminado_at = case when v_estado <> 'en_curso' then now() end
   where id = i.id;

  if v_estado = 'aprobada' then
    update businesses set prueba_verde_at = now(), alta_paso = greatest(alta_paso, 4) where id = i.business_id;
  end if;

  return jsonb_build_object('ok', true, 'correcta', v_ok, 'correcta_id', q.correcta,
    'explicacion', q.explicacion, 'correctas', i.correctas, 'incorrectas', i.incorrectas,
    'estado', v_estado,
    'siguiente', case when v_estado = 'en_curso' then brote_vendedor_pregunta(i.orden[i.actual + 1]) end);
end $fn$;

-- ── 6. Mercado Pago: vincular la cuenta ─────────────────────────────────────
-- La llama SOLO el servidor de Brote (con la clave de servicio), después de
-- que Mercado Pago devolvió la autorización y el servidor consultó
-- `/users/me` con ella. Ninguna cuenta puede llamarla: si pudiera, cualquiera
-- se "vincularía" sola.

create or replace function vendedor_mp_vincular(
  p_business uuid, p_user uuid, p_mp_user_id text, p_nickname text, p_email text, p_datos jsonb)
returns jsonb language plpgsql security definer set search_path = public as $fn$
begin
  if not exists (select 1 from business_members where business_id = p_business and user_id = p_user and role = 'owner') then
    return jsonb_build_object('ok', false, 'error', 'solo_owner');
  end if;
  if coalesce(p_mp_user_id, '') = '' then return jsonb_build_object('ok', false, 'error', 'mp_invalido'); end if;
  -- Una cuenta de Mercado Pago es de una persona: puede tener varias tiendas
  -- propias, pero no la de otra persona.
  if exists (select 1 from businesses b
              where b.mp_user_id = p_mp_user_id and b.id <> p_business
                and not exists (select 1 from business_members m
                                 where m.business_id = b.id and m.user_id = p_user and m.role = 'owner')) then
    return jsonb_build_object('ok', false, 'error', 'mp_en_uso');
  end if;
  update businesses
     set mp_user_id = p_mp_user_id, mp_nickname = left(p_nickname, 80), mp_email = left(lower(p_email), 160),
         mp_vinculado_at = now(), mp_datos = coalesce(p_datos, '{}'::jsonb),
         alta_paso = greatest(alta_paso, 4), updated_at = now()
   where id = p_business;
  return jsonb_build_object('ok', true);
end $fn$;

create or replace function vendedor_mp_desvincular(p_business uuid)
returns jsonb language plpgsql security definer set search_path = public as $fn$
begin
  if brote_biz_role(p_business) is distinct from 'owner' then return jsonb_build_object('ok', false, 'error', 'solo_owner'); end if;
  if brote_biz_activo(p_business) then return jsonb_build_object('ok', false, 'error', 'suscripcion_activa'); end if;
  update businesses set mp_user_id = null, mp_nickname = null, mp_email = null, mp_vinculado_at = null, mp_datos = null
   where id = p_business;
  return jsonb_build_object('ok', true);
end $fn$;

-- ── 7. Abrir la tienda ──────────────────────────────────────────────────────

-- Qué le falta a una tienda para abrir, en el orden del alta.
create or replace function brote_vendedor_faltantes(p_business uuid)
returns text[] language plpgsql stable security definer set search_path = public as $fn$
declare b businesses%rowtype; f text[] := '{}';
begin
  select * into b from businesses where id = p_business;
  if b.id is null then return array['no_existe']; end if;
  if b.categoria_principal is null or b.provincia is null
     or (b.whatsapp is null and b.sitio_web is null and b.instagram is null) then
    f := f || 'tienda'::text;
  end if;
  if (select count(*) from tienda_compromisos where business_id = p_business and estado <> 'rechazado') < 2
     or not exists (select 1 from tienda_compromisos where business_id = p_business and estado <> 'rechazado' and foto_path is not null) then
    f := f || 'compromiso'::text;
  end if;
  if b.prueba_verde_at is null then f := f || 'prueba'::text; end if;
  if brote_vendedor_mp_requerido() and b.mp_vinculado_at is null then f := f || 'mercado_pago'::text; end if;
  if not brote_terminos_aceptados(p_business) then f := f || 'terminos'::text; end if;
  if brote_vendedor_cobro() and not brote_biz_activo(p_business) then f := f || 'suscripcion'::text; end if;
  return f;
end $fn$;

-- Abre la tienda si ya no le falta nada. La llaman el webhook (al autorizarse
-- el primer cobro) y `vendedor_abrir` (cuando el cobro está apagado).
create or replace function brote_vendedor_activar(p_business uuid)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare b businesses%rowtype; v_falta text[];
begin
  select * into b from businesses where id = p_business for update;
  if b.id is null or b.modelo <> 'vendedor' then return jsonb_build_object('ok', false, 'error', 'no_aplica'); end if;
  if b.status = 'approved' then return jsonb_build_object('ok', true, 'ya_abierta', true); end if;
  if b.status in ('suspended','closed') then return jsonb_build_object('ok', false, 'error', 'no_disponible'); end if;
  v_falta := brote_vendedor_faltantes(p_business);
  if cardinality(v_falta) > 0 then return jsonb_build_object('ok', false, 'error', 'incompleta', 'falta', to_jsonb(v_falta)); end if;

  update businesses set status = 'approved', activa_at = coalesce(activa_at, now()),
         enviado_at = coalesce(enviado_at, now()), ultima_revision = now(), updated_at = now()
   where id = p_business;
  perform brote_recalcular_tiers(p_business);
  perform brote_negocio_notificar(p_business, 'Tu tienda está abierta',
    'Ya podés publicar tus productos en el Mercado.', '/negocio/listados/nuevo');
  -- La foto del compromiso entra a la cola del equipo.
  perform brote_negocio_notificar_revisores('Tienda nueva',
    format('"%s" abrió su tienda. Su compromiso está para revisar.', b.nombre_comercial), '/panel/compromisos');
  return jsonb_build_object('ok', true, 'abierta', true);
end $fn$;

create or replace function vendedor_abrir(p_business uuid)
returns jsonb language plpgsql security definer set search_path = public as $fn$
begin
  if brote_biz_role(p_business) is distinct from 'owner' then return jsonb_build_object('ok', false, 'error', 'solo_owner'); end if;
  return brote_vendedor_activar(p_business);
end $fn$;

-- Todo lo que el alta necesita para dibujarse, en una llamada.
create or replace function vendedor_estado(p_business uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $fn$
declare b businesses%rowtype; s business_subscriptions%rowtype; v_falta text[];
begin
  if not brote_is_member(p_business) then return null; end if;
  select * into b from businesses where id = p_business;
  select * into s from business_subscriptions
   where business_id = p_business and status in ('activa','en_gracia','pendiente')
   order by created_at desc limit 1;
  v_falta := brote_vendedor_faltantes(p_business);

  return jsonb_build_object(
    'id', b.id, 'slug', b.slug, 'status', b.status, 'modelo', b.modelo, 'rol', brote_biz_role(p_business),
    'abierta', b.status = 'approved', 'activa_at', b.activa_at,
    'falta', to_jsonb(v_falta),
    'tienda', jsonb_build_object(
      'nombre_comercial', b.nombre_comercial, 'tipo_vendedor', b.tipo_vendedor,
      'categoria_principal', b.categoria_principal, 'provincia', b.provincia, 'ciudad', b.ciudad,
      'descripcion', b.descripcion, 'whatsapp', b.whatsapp, 'sitio_web', b.sitio_web,
      'instagram', b.instagram, 'contacto_preferido', b.contacto_preferido,
      'cuit', b.cuit, 'razon_social', b.razon_social, 'logo_url', b.logo_url),
    'compromisos', coalesce((select jsonb_agg(jsonb_build_object('practica', c.practica, 'estado', c.estado,
                               'foto_path', c.foto_path, 'nota', c.nota) order by c.created_at)
                             from tienda_compromisos c where c.business_id = p_business), '[]'::jsonb),
    'prueba_verde_at', b.prueba_verde_at,
    'mp', jsonb_build_object('vinculado', b.mp_vinculado_at is not null, 'nickname', b.mp_nickname,
                             'vinculado_at', b.mp_vinculado_at, 'requerido', brote_vendedor_mp_requerido()),
    'terminos', jsonb_build_object('version', brote_terminos_version(), 'aceptados', brote_terminos_aceptados(p_business)),
    'cobro', brote_vendedor_cobro(),
    'precio', brote_vendedor_precio(),
    'suscripcion', case when s.id is null then null else jsonb_build_object(
      'status', s.status, 'monto', s.monto, 'moneda', s.moneda, 'periodo_fin', s.periodo_fin,
      'gracia_fin', s.gracia_fin, 'desde', s.created_at) end);
end $fn$;

-- ── 8. Cobro: cotizar, aplicar y el reloj diario ────────────────────────────

-- Lo que el servidor necesita para crear la suscripción en Mercado Pago. El
-- precio NUNCA viaja desde el cliente, y el cobro va a la MISMA cuenta que se
-- vinculó: el correo de Mercado Pago es el `payer_email`.
create or replace function negocio_plan_cotizar(p_business uuid, p_plan biz_plan)
returns jsonb language plpgsql stable security definer set search_path = public as $fn$
declare b businesses%rowtype; v_monto numeric; v_inicio timestamptz; v_precio jsonb; v_falta text[];
begin
  if brote_biz_role(p_business) is distinct from 'owner' then
    return jsonb_build_object('ok', false, 'error', 'solo_owner');
  end if;
  select * into b from businesses where id = p_business;

  if b.modelo = 'vendedor' then
    if not brote_vendedor_cobro() then return jsonb_build_object('ok', false, 'error', 'cobro_apagado'); end if;
    if brote_biz_activo(p_business) then return jsonb_build_object('ok', false, 'error', 'ya_suscripta'); end if;
    -- Todo lo del alta tiene que estar, menos la suscripción misma.
    select coalesce(array_agg(x), '{}') into v_falta
      from unnest(brote_vendedor_faltantes(p_business)) x where x <> 'suscripcion';
    if cardinality(v_falta) > 0 then
      return jsonb_build_object('ok', false, 'error', 'alta_incompleta', 'falta', to_jsonb(v_falta));
    end if;
    v_precio := brote_vendedor_precio();
    if (v_precio->>'ars') is null then return jsonb_build_object('ok', false, 'error', 'sin_cotizacion'); end if;
    return jsonb_build_object('ok', true, 'monto', (v_precio->>'ars')::numeric, 'moneda', 'ARS',
      'usd', (v_precio->>'usd')::numeric, 'tipo_cambio', v_precio->'tipo_cambio',
      'plan', 'vendedor', 'inicio', null, 'fundador', false,
      'payer_email', b.mp_email,
      'razon', format('Brote Mercado — suscripción de vendedor (USD %s por mes)', v_precio->>'usd'));
  end if;

  -- Flujo anterior (0108), sin cambios.
  if b.status <> 'approved' then return jsonb_build_object('ok', false, 'error', 'no_aprobada'); end if;
  if not brote_biz_cobro_activo() then return jsonb_build_object('ok', false, 'error', 'cobro_apagado'); end if;
  v_monto := brote_biz_precio(p_plan);
  if b.fundador and p_plan = 'raiz' and b.created_at > now() - interval '6 months' then
    v_monto := brote_biz_precio('semilla');
  end if;
  if v_monto is null or v_monto <= 0 then
    return jsonb_build_object('ok', false, 'error', 'precio_sin_definir');
  end if;
  v_inicio := case when b.prueba_fin > now() + interval '1 day' then b.prueba_fin else null end;
  return jsonb_build_object('ok', true, 'monto', v_monto, 'moneda', 'ARS',
    'plan', p_plan, 'inicio', v_inicio, 'fundador', b.fundador,
    'razon', format('Brote Negocios — plan %s', initcap(p_plan::text)));
end $fn$;

-- El webhook aplica el estado de la suscripción. Igual que 0108, más: cuando la
-- suscripción de una tienda nueva queda activa, la tienda abre.
create or replace function negocio_suscripcion_aplicar(
  p_business uuid, p_external_id text, p_estado text, p_pago text,
  p_plan biz_plan, p_monto numeric, p_moneda text, p_periodo_fin timestamptz, p_raw jsonb)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare s business_subscriptions%rowtype; v_new biz_sub_status; v_prev biz_sub_status; v_lim int;
  v_modelo text; v_abrir jsonb;
begin
  if p_business is null or not exists (select 1 from businesses where id = p_business) then
    return jsonb_build_object('ok', false, 'error', 'negocio_desconocido');
  end if;
  select modelo into v_modelo from businesses where id = p_business;

  select * into s from business_subscriptions where external_id = p_external_id;
  v_prev := s.status;

  v_new := case
    when p_pago = 'rejected' then 'en_gracia'
    when p_estado = 'authorized' then 'activa'
    when p_estado = 'paused' then 'pausada'
    when p_estado = 'cancelled' then 'cancelada'
    when p_estado = 'pending' then 'pendiente'
    else coalesce(v_prev, 'pendiente') end;
  -- Un pago rechazado ANTES de que la suscripción estuviera activa no abre una
  -- gracia: todavía no había nada que sostener.
  if v_new = 'en_gracia' and coalesce(v_prev, 'pendiente') = 'pendiente' then v_new := 'pendiente'; end if;

  if s.id is null then
    insert into business_subscriptions (business_id, plan, status, external_id, monto, moneda,
                                        precio_bloqueado, periodo_fin, gracia_fin, raw)
    values (p_business, coalesce(p_plan, case when v_modelo = 'vendedor' then 'vendedor'::biz_plan else 'semilla'::biz_plan end),
            v_new, p_external_id, p_monto, coalesce(p_moneda, 'ARS'),
            (select fundador from businesses where id = p_business), p_periodo_fin,
            case when v_new = 'en_gracia' then now() + interval '7 days' else null end,
            coalesce(p_raw, '{}'::jsonb))
    returning * into s;
  else
    update business_subscriptions
       set status = v_new,
           plan = coalesce(p_plan, plan),
           monto = coalesce(p_monto, monto),
           moneda = coalesce(p_moneda, moneda),
           periodo_fin = coalesce(p_periodo_fin, periodo_fin),
           gracia_fin = case when v_new = 'en_gracia' then coalesce(gracia_fin, now() + interval '7 days') else null end,
           raw = coalesce(p_raw, raw),
           updated_at = now()
     where id = s.id
    returning * into s;
  end if;

  if v_prev is distinct from v_new then
    if v_new = 'activa' then
      if v_modelo = 'vendedor' then
        v_abrir := brote_vendedor_activar(p_business);
      end if;
      v_lim := brote_biz_limite(p_business, 'listados');
      update listings set status = 'publicado', despublicado_por = null, updated_at = now()
       where id in (select id from listings
                     where business_id = p_business and status = 'despublicado' and despublicado_por = 'cobro'
                     order by score desc nulls last
                     limit greatest(0, v_lim - (select count(*) from listings
                                                 where business_id = p_business and status in ('publicado','pendiente'))));
      perform brote_recalcular_scores(p_business);
      if coalesce((v_abrir->>'abierta')::boolean, false) is false then
        perform brote_negocio_notificar(p_business, 'Suscripción activa',
          case when v_modelo = 'vendedor' then 'Listo: tu suscripción está al día y tus productos están en el Mercado.'
               else 'Listo: tu plan está activo y tus listados vuelven al Mercado.' end, '/negocio/plan');
      end if;
    elsif v_new = 'en_gracia' then
      perform brote_recalcular_scores(p_business);
      perform brote_negocio_notificar(p_business, 'No pudimos cobrar tu suscripción',
        'Tenés 7 días para actualizar el medio de pago en Mercado Pago. Tus productos siguen publicados mientras tanto.',
        '/negocio/plan');
    elsif v_new in ('pausada','cancelada') then
      update listings set status = 'despublicado', despublicado_por = 'cobro', updated_at = now()
       where business_id = p_business and status = 'publicado';
      perform brote_negocio_notificar(p_business,
        case when v_new = 'pausada' then 'Tu suscripción quedó en pausa' else 'Diste de baja tu suscripción' end,
        'Tus productos salieron del Mercado. No borramos nada: cuando vuelvas, están donde los dejaste.',
        '/negocio/plan');
    end if;
  end if;

  return jsonb_build_object('ok', true, 'status', v_new, 'cambio', v_prev is distinct from v_new,
                            'business_id', p_business, 'abierta', v_abrir->'abierta');
end $fn$;

-- Ajuste por dólar: con cada cobro mensual el servidor pregunta si el monto en
-- pesos quedó más de 10% lejos de USD 5 al oficial de hoy. Si quedó, lo
-- actualiza en Mercado Pago para el mes siguiente y la tienda recibe un aviso.
create or replace function vendedor_ajuste_consultar(p_external_id text)
returns jsonb language plpgsql stable security definer set search_path = public as $fn$
declare s business_subscriptions%rowtype; v_precio jsonb; v_nuevo numeric;
begin
  select * into s from business_subscriptions where external_id = p_external_id;
  if s.id is null or s.plan <> 'vendedor' or s.status <> 'activa' or s.monto is null or s.monto <= 0 then
    return jsonb_build_object('ajustar', false);
  end if;
  v_precio := brote_vendedor_precio();
  v_nuevo := (v_precio->>'ars')::numeric;
  if v_nuevo is null or abs(v_nuevo - s.monto) / s.monto <= 0.10 then
    return jsonb_build_object('ajustar', false, 'monto', s.monto);
  end if;
  return jsonb_build_object('ajustar', true, 'monto', s.monto, 'nuevo', v_nuevo, 'business_id', s.business_id);
end $fn$;

create or replace function vendedor_ajuste_aplicar(p_external_id text, p_monto numeric)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare s business_subscriptions%rowtype;
begin
  select * into s from business_subscriptions where external_id = p_external_id for update;
  if s.id is null or p_monto is null or p_monto <= 0 then return jsonb_build_object('ok', false); end if;
  update business_subscriptions set monto = p_monto, updated_at = now() where id = s.id;
  perform brote_negocio_notificar(s.business_id, 'Actualizamos el monto en pesos',
    format('Tu suscripción sigue siendo de USD 5 por mes. Con el dólar oficial de hoy, desde el próximo cobro son $ %s.',
           to_char(p_monto, 'FM999G999G990')),
    '/negocio/plan');
  return jsonb_build_object('ok', true);
end $fn$;

-- El reloj diario del cobro. Lo del flujo anterior (la prueba de 14 días)
-- sigue dependiendo de su bandera; lo que sigue a una suscripción (avisos,
-- gracia, vencimiento) corre siempre, porque ahora hay tiendas que pagan.
create or replace function brote_negocios_cobro()
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare r record; v_prueba int := 0; v_avisos int := 0; v_gracia int := 0; v_vencidas int := 0; v_cierres int := 0;
  v_legacy boolean := brote_biz_cobro_activo();
begin
  if v_legacy then
    -- 1. Empieza la prueba (solo el flujo anterior).
    for r in
      update businesses
         set prueba_fin = now() + case when fundador then interval '90 days' else interval '14 days' end
       where status = 'approved' and prueba_fin is null and modelo = 'legacy'
      returning id, fundador, prueba_fin
    loop
      perform brote_negocio_notificar(r.id, 'Empezó tu prueba',
        format('Tenés hasta el %s para usar todo sin tarjeta.', to_char(r.prueba_fin, 'DD/MM/YYYY')),
        '/negocio/plan');
      v_prueba := v_prueba + 1;
    end loop;

    -- 2. Faltan 3 días para que termine la prueba.
    for r in
      select b.id, b.prueba_fin from businesses b
       where b.status = 'approved' and b.modelo = 'legacy'
         and b.prueba_fin between now() and now() + interval '3 days'
         and not brote_biz_activo(b.id)
         and not exists (select 1 from business_billing_log l
                          where l.business_id = b.id and l.evento = 'prueba_3dias'
                            and l.clave = to_char(b.prueba_fin, 'YYYY-MM-DD'))
    loop
      perform brote_negocio_notificar(r.id, 'Tu prueba termina en 3 días',
        'Si no elegís un plan, tus listados salen del Mercado y Mejora queda en modo lectura. No se borra nada.',
        '/negocio/plan');
      insert into business_billing_log (business_id, evento, clave)
      values (r.id, 'prueba_3dias', to_char(r.prueba_fin, 'YYYY-MM-DD')) on conflict do nothing;
      v_avisos := v_avisos + 1;
    end loop;

    -- 3. Prueba terminada sin plan.
    for r in
      select b.id, b.prueba_fin from businesses b
       where b.status = 'approved' and b.modelo = 'legacy' and b.prueba_fin < now() and not brote_biz_activo(b.id)
         and not exists (select 1 from business_billing_log l
                          where l.business_id = b.id and l.evento = 'prueba_fin'
                            and l.clave = to_char(b.prueba_fin, 'YYYY-MM-DD'))
    loop
      update listings set status = 'despublicado', despublicado_por = 'cobro', updated_at = now()
       where business_id = r.id and status = 'publicado';
      perform brote_negocio_notificar(r.id, 'Terminó tu prueba',
        'Tus listados salieron del Mercado y Mejora quedó en modo lectura. Elegís un plan y vuelve todo como estaba.',
        '/negocio/plan');
      insert into business_billing_log (business_id, evento, clave)
      values (r.id, 'prueba_fin', to_char(r.prueba_fin, 'YYYY-MM-DD')) on conflict do nothing;
      v_vencidas := v_vencidas + 1;
    end loop;
  end if;

  -- 4. Faltan 3 días para el próximo cobro.
  for r in
    select s.business_id, s.periodo_fin, s.monto from business_subscriptions s
     where s.status = 'activa' and s.periodo_fin between now() and now() + interval '3 days'
       and not exists (select 1 from business_billing_log l
                        where l.business_id = s.business_id and l.evento = 'cobro_3dias'
                          and l.clave = to_char(s.periodo_fin, 'YYYY-MM-DD'))
  loop
    perform brote_negocio_notificar(r.business_id, 'Tu próximo cobro es en 3 días',
      format('El %s se cobra tu suscripción: $ %s.', to_char(r.periodo_fin, 'DD/MM/YYYY'),
             to_char(coalesce(r.monto, 0), 'FM999G999G990')), '/negocio/plan');
    insert into business_billing_log (business_id, evento, clave)
    values (r.business_id, 'cobro_3dias', to_char(r.periodo_fin, 'YYYY-MM-DD')) on conflict do nothing;
    v_avisos := v_avisos + 1;
  end loop;

  -- 5. En gracia: aviso diario mientras dure.
  for r in
    select s.business_id, s.gracia_fin from business_subscriptions s
     where s.status = 'en_gracia' and s.gracia_fin > now()
       and not exists (select 1 from business_billing_log l
                        where l.business_id = s.business_id and l.evento = 'gracia'
                          and l.clave = to_char(current_date, 'YYYY-MM-DD'))
  loop
    perform brote_negocio_notificar(r.business_id, 'Seguimos sin poder cobrar tu suscripción',
      format('Tenés hasta el %s para actualizar el medio de pago en Mercado Pago.', to_char(r.gracia_fin, 'DD/MM/YYYY')),
      '/negocio/plan');
    insert into business_billing_log (business_id, evento, clave)
    values (r.business_id, 'gracia', to_char(current_date, 'YYYY-MM-DD')) on conflict do nothing;
    v_gracia := v_gracia + 1;
  end loop;

  -- 6. Gracia vencida: la suscripción vence y los productos salen.
  for r in
    update business_subscriptions set status = 'vencida', updated_at = now()
     where status = 'en_gracia' and gracia_fin < now()
    returning business_id
  loop
    update listings set status = 'despublicado', despublicado_por = 'cobro', updated_at = now()
     where business_id = r.business_id and status = 'publicado';
    perform brote_negocio_notificar(r.business_id, 'Tu suscripción venció',
      'Tus productos salieron del Mercado. Guardamos todo: cuando vuelvas, sigue donde estaba.',
      '/negocio/plan');
    v_vencidas := v_vencidas + 1;
  end loop;

  -- 7. Noventa días después: ofrecer llevarse los datos. Nunca se borra nada.
  for r in
    select s.business_id from business_subscriptions s
     join businesses b on b.id = s.business_id
     where s.status in ('vencida','cancelada') and s.updated_at < now() - interval '90 days'
       and b.cierre_ofrecido_at is null
  loop
    perform brote_negocio_notificar(r.business_id, '¿Te llevás tus datos?',
      'Pasaron 90 días. Podés descargar todo lo que cargaste, o retomar donde lo dejaste cuando quieras.',
      '/negocio/plan');
    update businesses set cierre_ofrecido_at = now() where id = r.business_id;
    v_cierres := v_cierres + 1;
  end loop;

  perform brote_recalcular_scores(null);
  perform brote_mercado_limpieza();

  return jsonb_build_object('cobro_activo', v_legacy, 'pruebas', v_prueba, 'avisos', v_avisos,
                            'gracia', v_gracia, 'vencidas', v_vencidas, 'cierres', v_cierres);
end $fn$;

-- El plan, como lo ve la tienda: lo de 0108 más el modelo y el precio de hoy.
create or replace function negocio_plan_estado(p_business uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $fn$
declare b businesses%rowtype; s business_subscriptions%rowtype; v_plan biz_plan;
begin
  if not brote_is_member(p_business) then return null; end if;
  select * into b from businesses where id = p_business;
  select * into s from business_subscriptions
   where business_id = p_business and status in ('activa','en_gracia','pendiente')
   order by created_at desc limit 1;
  v_plan := brote_biz_plan(p_business);

  return jsonb_build_object(
    'modelo', b.modelo,
    'cobro_activo', case when b.modelo = 'vendedor' then brote_vendedor_cobro() else brote_biz_cobro_activo() end,
    'plan', v_plan,
    'limites', brote_biz_limites(v_plan),
    'uso', brote_biz_uso(p_business),
    'escritura', brote_biz_escritura(p_business),
    'fundador', b.fundador,
    'prueba_fin', b.prueba_fin,
    'en_prueba', brote_biz_en_prueba(p_business),
    'rol', brote_biz_role(p_business),
    'mp', jsonb_build_object('vinculado', b.mp_vinculado_at is not null, 'nickname', b.mp_nickname),
    'suscripcion', case when s.id is null then null else jsonb_build_object(
      'plan', s.plan, 'status', s.status, 'monto', s.monto, 'moneda', s.moneda,
      'precio_bloqueado', s.precio_bloqueado, 'periodo_fin', s.periodo_fin, 'gracia_fin', s.gracia_fin,
      'desde', s.created_at) end,
    'precio_vendedor', brote_vendedor_precio(),
    'precios', jsonb_build_object(
      'semilla', brote_biz_precio('semilla'), 'raiz', brote_biz_precio('raiz'),
      'bosque', brote_biz_precio('bosque'), 'moneda', 'ARS'));
end $fn$;

-- ── 9. Listados: publicar en el acto ────────────────────────────────────────

-- La lista negra de 0107, con las conjugaciones que se colaban: "curan",
-- "previenen", "adelgazante". Con la publicación en el acto, esto es lo único
-- que frena una afirmación de salud antes de que alguien la lea. Quedan afuera
-- a propósito "curar" y "curado" (el mate se cura, el jamón es curado) y
-- "prevenir" (se previene el desperdicio). ESPEJO de `LISTA_NEGRA` en
-- lib/mercado/claims.ts.
create or replace function brote_texto_prohibido(p text)
returns text language plpgsql immutable set search_path = public as $fn$
declare
  t text := ' ' || regexp_replace(lower(unaccent_safe(coalesce(p, ''))), '[^a-z0-9%]+', ' ', 'g') || ' ';
  termino text;
begin
  t := replace(t, ' se trata de ', ' ');
  t := replace(t, ' se trata del ', ' ');
  foreach termino in array array[
    -- absolutos
    '100% ecologico','totalmente natural','no contamina','impacto cero','completamente sustentable',
    'amigable con el planeta','el mas ecologico','producto verde','eco friendly','biodegradable al 100%',
    'carbono neutral','carbono neutro','neutro en carbono',
    -- salud (ANMAT)
    'cura','previene','trata','sana','desintoxica','detox','elimina toxinas','refuerza las defensas',
    'fortalece el sistema inmune','adelgaza','antitumoral','antiviral','sin efectos secundarios',
    'curan','curativo','curativa','curativos','curativas','previenen','sanan','desintoxican',
    'desintoxicante','adelgazan','adelgazante','adelgazantes','depurativo','depurativa','quema grasa',
    'milagroso','milagrosa'
  ] loop
    if position(' ' || termino || ' ' in t) > 0 then return termino; end if;
  end loop;
  return null;
end $fn$;

-- ESPEJO de `terminosSinAfirmacion` (lib/mercado/claims.ts): una palabra
-- ambiental en el texto libre ("orgánico", "reciclable", "sin TACC") exige la
-- afirmación tipificada que la respalde. Antes esto lo miraba solo el servidor
-- de la app y un revisor humano; ahora que una tienda publica en el acto, la
-- base lo vuelve a mirar: una llamada directa a la API no se lo saltea.
-- Devuelve `termino|tipo` (el mismo formato que el validador de TypeScript) o
-- null. Un test compara los patrones con los de TypeScript.
create or replace function brote_termino_sin_afirmacion(p_texto text, p_kinds text[], p_con_cert boolean)
returns text language plpgsql immutable set search_path = public as $fn$
declare
  t text := ' ' || regexp_replace(lower(unaccent_safe(coalesce(p_texto, ''))), '\s+', ' ', 'g') || ' ';
  r record; m text;
begin
  for r in select * from (values
    ('organico',              '\yorganic[oa]s?\y'),
    ('reciclable',            '\yreciclables?\y'),
    ('contenido_reciclado',   '\yreciclad[oa]s?\y'),
    ('compostable',           '\ycompostables?\y'),
    ('biodegradable',         '\ybiodegradables?\y'),
    ('libre_de',              '\ylibre de\y'),
    ('libre_de',              '\ysin (parabenos|sulfatos|siliconas|ftalatos|bpa|gluten|tacc|lactosa|plomo|cloro|fosfatos)\y'),
    ('no_toxico',             '\yno toxic[oa]s?\y'),
    ('no_toxico',             '\yatoxic[oa]\y'),
    ('energia_renovable',     '\yenergia (solar|renovable|eolica|limpia|verde)\y'),
    ('materiales_renovables', '\ymateriales? renovables?\y'),
    ('reduccion_origen',      '\d+ ?% menos\y'),
    ('reduccion_origen',      '\ymenos plastico\y'),
    ('recargable',            '\yrecargables?\y'),
    ('huella_carbono',        '\yhuella de carbono\y'),
    ('huella_carbono',        '\yco2\y'),
    ('huella_carbono',        '\ycompensad[oa]s? en carbono\y'),
    ('bienestar_animal',      '\ycruelty[- ]?free\y'),
    ('bienestar_animal',      '\ysin testeo\y'),
    ('bienestar_animal',      '\ylibre de crueldad\y'),
    ('bienestar_animal',      '\yveganos?\y'),
    ('bienestar_animal',      '\yveganas?\y'),
    ('local_estacional',      '\y(producto|produccion) local\y'),
    ('local_estacional',      '\yde estacion\y'),
    ('local_estacional',      '\ykm ?0\y'),
    ('local_estacional',      '\ykilometro cero\y'),
    ('comercio_justo',        '\ycomercio justo\y'),
    ('comercio_justo',        '\yfair ?trade\y')) v(kind, re)
  loop
    if not (r.kind = any(coalesce(p_kinds, '{}'))) then
      m := (regexp_match(t, '(' || r.re || ')'))[1];
      if m is not null then return trim(m) || '|' || r.kind; end if;
    end if;
  end loop;
  if not coalesce(p_con_cert, false) then
    m := (regexp_match(t, '(\ycertificad[oa]s?\y|\ycertificacion\y)'))[1];
    if m is not null then return trim(m) || '|certificacion_tercero'; end if;
  end if;
  return null;
end $fn$;

-- Lo mismo, para un listado con sus afirmaciones cargadas.
create or replace function brote_listado_sin_afirmacion(p_listing uuid, p_texto text)
returns text language sql stable security definer set search_path = public as $fn$
  select brote_termino_sin_afirmacion(p_texto,
    coalesce((select array_agg(distinct c.kind::text) from listing_claims lc join business_claims c on c.id = lc.claim_id
               where lc.listing_id = p_listing), '{}'),
    exists (select 1 from listing_claims lc join business_claims c on c.id = lc.claim_id
             where lc.listing_id = p_listing and c.cert_slug is not null));
$fn$;

-- Guardar. Suma subcategoría, estado, canal de contacto, hasta 8 imágenes, y
-- deja EDITAR EN VIVO un listado publicado (precio, texto, fotos) sin sacarlo
-- del Mercado: con el mismo control de texto que al publicarlo.
create or replace function listado_guardar(p_business uuid, p_listing uuid, p_datos jsonb)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare l listings%rowtype; b businesses%rowtype;
  v_titulo text; v_desc text; v_cat text; v_sub text; v_tipo text; v_dom text[]; v_url text; v_disp text;
  v_zonas text[]; v_precio numeric; v_cond text; v_contacto text; v_bad text;
begin
  if not brote_can_write(p_business, 'editor') then
    return jsonb_build_object('ok', false, 'error', 'sin_permiso');
  end if;
  select * into b from businesses where id = p_business;
  if b.status <> 'approved' then return jsonb_build_object('ok', false, 'error', 'negocio_no_aprobado'); end if;
  if jsonb_typeof(p_datos) is distinct from 'object' then
    return jsonb_build_object('ok', false, 'error', 'datos_invalidos');
  end if;

  if p_listing is not null then
    select * into l from listings where id = p_listing and business_id = p_business for update;
    if l.id is null then return jsonb_build_object('ok', false, 'error', 'no_existe'); end if;
    if l.status not in ('draft','despublicado','publicado') then
      return jsonb_build_object('ok', false, 'error', 'no_editable');
    end if;
  end if;

  v_titulo := left(regexp_replace(trim(coalesce(p_datos->>'titulo', l.titulo, '')), '\s+', ' ', 'g'), 70);
  v_desc   := left(trim(coalesce(p_datos->>'descripcion', l.descripcion, '')), 4000);
  v_cat    := coalesce(p_datos->>'categoria', l.categoria);
  v_sub    := case when p_datos ? 'subcategoria' then nullif(p_datos->>'subcategoria', '') else l.subcategoria end;
  v_tipo   := coalesce(p_datos->>'tipo', l.tipo::text, 'producto');
  v_url    := left(trim(coalesce(p_datos->>'url_destino', l.url_destino, '')), 500);
  v_disp   := coalesce(p_datos->>'disponibilidad', l.disponibilidad, 'online');
  v_cond   := coalesce(p_datos->>'condicion', l.condicion, 'nuevo');
  v_contacto := coalesce(p_datos->>'contacto', l.contacto, b.contacto_preferido, 'web');

  if length(v_titulo) < 3 then return jsonb_build_object('ok', false, 'error', 'titulo_corto'); end if;
  if v_cat is null or not (v_cat = any(brote_mercado_categorias())) then
    return jsonb_build_object('ok', false, 'error', 'categoria_invalida');
  end if;
  if not brote_mercado_subcategoria_valida(v_cat, v_sub) then v_sub := null; end if;
  if v_tipo not in ('producto','servicio') then return jsonb_build_object('ok', false, 'error', 'tipo_invalido'); end if;
  if v_disp not in ('online','local','ambas') then return jsonb_build_object('ok', false, 'error', 'disponibilidad_invalida'); end if;
  if v_cond not in ('nuevo','usado','reacondicionado') then return jsonb_build_object('ok', false, 'error', 'condicion_invalida'); end if;
  if v_contacto not in ('web','whatsapp','instagram') then return jsonb_build_object('ok', false, 'error', 'contacto_invalido'); end if;
  if v_url <> '' and v_url !~* '^https://[^\s/]+\.[^\s/]+' then
    return jsonb_build_object('ok', false, 'error', 'url_invalida');
  end if;

  if p_datos ? 'dominios' then
    if jsonb_typeof(p_datos->'dominios') is distinct from 'array' then
      return jsonb_build_object('ok', false, 'error', 'dominios_invalidos');
    end if;
    select coalesce(array_agg(distinct x), '{}') into v_dom from jsonb_array_elements_text(p_datos->'dominios') x;
    if cardinality(v_dom) > 3 or exists (select 1 from unnest(v_dom) d where not exists (select 1 from domains where slug = d)) then
      return jsonb_build_object('ok', false, 'error', 'dominios_invalidos');
    end if;
  else
    v_dom := coalesce(l.dominios, '{}');
  end if;

  if p_datos ? 'zonas' then
    if jsonb_typeof(p_datos->'zonas') is distinct from 'array' then
      return jsonb_build_object('ok', false, 'error', 'zonas_invalidas');
    end if;
    select coalesce(array_agg(distinct left(x, 60)), '{}') into v_zonas from jsonb_array_elements_text(p_datos->'zonas') x;
    if cardinality(v_zonas) > 24 then return jsonb_build_object('ok', false, 'error', 'zonas_invalidas'); end if;
  else
    v_zonas := coalesce(l.zonas, '{}');
  end if;

  if p_datos ? 'precio_referencia' then
    if jsonb_typeof(p_datos->'precio_referencia') = 'null' then
      v_precio := null;
    elsif jsonb_typeof(p_datos->'precio_referencia') = 'number'
          and (p_datos->>'precio_referencia')::numeric > 0
          and (p_datos->>'precio_referencia')::numeric < 1000000000 then
      v_precio := round((p_datos->>'precio_referencia')::numeric, 2);
    else
      return jsonb_build_object('ok', false, 'error', 'precio_invalido');
    end if;
  else
    v_precio := l.precio_referencia;
  end if;

  -- Editar en vivo: lo que se publica tiene que pasar lo mismo que al enviar.
  if l.status = 'publicado' then
    if length(v_titulo) not between 10 and 70 then return jsonb_build_object('ok', false, 'error', 'titulo_largo'); end if;
    if length(v_desc) not between 30 and 4000 then return jsonb_build_object('ok', false, 'error', 'descripcion_largo'); end if;
    v_bad := coalesce(brote_texto_prohibido(v_titulo), brote_texto_prohibido(v_desc));
    if v_bad is not null then return jsonb_build_object('ok', false, 'error', 'texto_prohibido', 'termino', v_bad); end if;
    v_bad := brote_listado_sin_afirmacion(l.id, v_titulo || ' ' || v_desc);
    if v_bad is not null then return jsonb_build_object('ok', false, 'error', 'termino_sin_afirmacion', 'termino', v_bad); end if;
    if v_tipo = 'producto' and v_precio is null then return jsonb_build_object('ok', false, 'error', 'falta_precio'); end if;
    if v_contacto = 'web' and v_url !~* '^https://[^\s/]+\.[^\s/]+' then return jsonb_build_object('ok', false, 'error', 'url_invalida'); end if;
    if v_contacto = 'whatsapp' and b.whatsapp is null then return jsonb_build_object('ok', false, 'error', 'sin_whatsapp'); end if;
    if v_contacto = 'instagram' and b.instagram is null then return jsonb_build_object('ok', false, 'error', 'sin_instagram'); end if;
  end if;

  if l.id is null then
    insert into listings (business_id, slug, tipo, titulo, descripcion, categoria, subcategoria, dominios,
                          precio_referencia, url_destino, disponibilidad, zonas, condicion, contacto, created_by, tier_efectivo)
    values (p_business, brote_listado_slug(v_titulo), v_tipo::listing_kind, v_titulo, v_desc, v_cat, v_sub, v_dom,
            v_precio, v_url, v_disp, v_zonas, v_cond, v_contacto, (select auth.uid()), 'e0')
    returning * into l;
  else
    update listings set tipo = v_tipo::listing_kind, titulo = v_titulo, descripcion = v_desc, categoria = v_cat,
           subcategoria = v_sub, dominios = v_dom, precio_referencia = v_precio, url_destino = v_url,
           disponibilidad = v_disp, zonas = v_zonas, condicion = v_cond, contacto = v_contacto, updated_at = now(),
           slug = case when publicado_at is null and titulo <> v_titulo then brote_listado_slug(v_titulo) else slug end
     where id = l.id returning * into l;
    if l.status = 'publicado' then perform brote_recalcular_scores(p_business, l.id); end if;
  end if;
  return jsonb_build_object('ok', true, 'id', l.id, 'slug', l.slug, 'status', l.status);
end $fn$;

-- Hasta 8 imágenes, también en un publicado (cambiar fotos no lo saca).
create or replace function listado_imagenes(p_listing uuid, p_paths text[])
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare l listings%rowtype; p text;
begin
  select * into l from listings where id = p_listing;
  if l.id is null or not brote_can_write(l.business_id, 'editor') then
    return jsonb_build_object('ok', false, 'error', 'sin_permiso');
  end if;
  if l.status not in ('draft','despublicado','publicado') then return jsonb_build_object('ok', false, 'error', 'no_editable'); end if;
  if cardinality(coalesce(p_paths, '{}')) > 8 then return jsonb_build_object('ok', false, 'error', 'max_imagenes'); end if;
  if l.status = 'publicado' and cardinality(coalesce(p_paths, '{}')) = 0 then
    return jsonb_build_object('ok', false, 'error', 'faltan_imagenes');
  end if;
  foreach p in array coalesce(p_paths, '{}') loop
    if p !~ ('^' || l.business_id::text || '/' || l.id::text || '/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$') then
      return jsonb_build_object('ok', false, 'error', 'ruta_invalida');
    end if;
  end loop;
  update listings set imagenes = coalesce(p_paths, '{}'), updated_at = now() where id = l.id;
  return jsonb_build_object('ok', true);
end $fn$;

-- Enviar. Para una tienda nueva, se PUBLICA EN EL ACTO si el validador no
-- marcó nada y no hay afirmaciones esperando revisión; si hay, va a la cola
-- como siempre. La afirmación es opcional. Una tienda del flujo anterior sigue
-- con sus reglas (y su publicación acelerada).
create or replace function listado_enviar(p_listing uuid, p_validacion jsonb default null)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare l listings%rowtype; b businesses%rowtype; v_bad text; n int; v_pend int; v_auto boolean; s jsonb;
begin
  select * into l from listings where id = p_listing for update;
  if l.id is null or not brote_can_write(l.business_id, 'editor') then
    return jsonb_build_object('ok', false, 'error', 'sin_permiso');
  end if;
  if l.status not in ('draft','despublicado') then return jsonb_build_object('ok', false, 'error', 'no_enviable'); end if;
  select * into b from businesses where id = l.business_id;
  if b.status <> 'approved' then return jsonb_build_object('ok', false, 'error', 'negocio_no_aprobado'); end if;

  if length(l.titulo) not between 10 and 70 then return jsonb_build_object('ok', false, 'error', 'titulo_largo'); end if;
  if length(l.descripcion) not between (case when b.modelo = 'vendedor' then 30 else 80 end) and 4000 then
    return jsonb_build_object('ok', false, 'error', 'descripcion_largo');
  end if;
  if cardinality(l.imagenes) not between 1 and 8 then return jsonb_build_object('ok', false, 'error', 'faltan_imagenes'); end if;
  if l.contacto = 'web' and l.url_destino !~* '^https://[^\s/]+\.[^\s/]+' then return jsonb_build_object('ok', false, 'error', 'url_invalida'); end if;
  if l.contacto = 'whatsapp' and b.whatsapp is null then return jsonb_build_object('ok', false, 'error', 'sin_whatsapp'); end if;
  if l.contacto = 'instagram' and b.instagram is null then return jsonb_build_object('ok', false, 'error', 'sin_instagram'); end if;
  if b.modelo = 'vendedor' and l.tipo = 'producto' and l.precio_referencia is null then
    return jsonb_build_object('ok', false, 'error', 'falta_precio');
  end if;
  v_bad := coalesce(brote_texto_prohibido(l.titulo), brote_texto_prohibido(l.descripcion));
  if v_bad is not null then return jsonb_build_object('ok', false, 'error', 'texto_prohibido', 'termino', v_bad); end if;
  v_bad := brote_listado_sin_afirmacion(l.id, l.titulo || ' ' || l.descripcion);
  if v_bad is not null then return jsonb_build_object('ok', false, 'error', 'termino_sin_afirmacion', 'termino', v_bad); end if;

  select count(*) into n from listing_claims where listing_id = l.id;
  if n = 0 and b.modelo = 'legacy' then return jsonb_build_object('ok', false, 'error', 'sin_afirmaciones'); end if;
  if exists (select 1 from listing_claims lc join business_claims c on c.id = lc.claim_id
             where lc.listing_id = l.id
               and (c.status = 'vencida'
                    or brote_claim_error(c.business_id, c.kind, c.alcance, c.datos, c.cert_slug,
                                         c.cert_numero, c.cert_vence, c.evidencia_path) is not null)) then
    return jsonb_build_object('ok', false, 'error', 'afirmacion_invalida');
  end if;
  select brote_texto_prohibido(c.alcance || ' ' || c.datos::text) into v_bad
    from listing_claims lc join business_claims c on c.id = lc.claim_id
   where lc.listing_id = l.id and brote_texto_prohibido(c.alcance || ' ' || c.datos::text) is not null
   limit 1;
  if v_bad is not null then return jsonb_build_object('ok', false, 'error', 'texto_prohibido', 'termino', v_bad); end if;

  update business_claims c set status = 'pendiente', updated_at = now()
   where c.id in (select claim_id from listing_claims where listing_id = l.id)
     and c.status in ('borrador','rechazada');

  if b.modelo = 'vendedor' then
    select count(*) into v_pend from listing_claims lc join business_claims c on c.id = lc.claim_id
     where lc.listing_id = l.id and c.status = 'pendiente';
    v_auto := v_pend = 0 and brote_jsonb_largo(p_validacion->'banderas') = 0;
  else
    s := l.screening_ia;
    v_auto := brote_negocio_acelerado(l.business_id)
          and s is not null and s->>'por' = 'ia'
          and s->>'recomendacion' = 'publicar'
          and coalesce(s->>'riesgo_greenwashing', 'alto') = 'bajo'
          and brote_jsonb_largo(s->'banderas_texto') = 0
          and jsonb_typeof(s->'afirmaciones') = 'array'
          and not exists (select 1 from jsonb_array_elements(s->'afirmaciones') a
                          where a->>'nivel_sugerido' = 'rechazar' or brote_jsonb_largo(a->'problemas') > 0)
          and brote_jsonb_largo(p_validacion->'banderas') = 0;
    if v_auto then
      update business_claims c set status = 'aprobada', auto_aprobada = true, revisado_at = now(),
             categoria_origen = coalesce(categoria_origen, l.categoria), updated_at = now()
       where c.id in (select claim_id from listing_claims where listing_id = l.id) and c.status = 'pendiente';
    end if;
  end if;

  if v_auto then
    update listings set status = 'publicado', acelerada = (b.modelo = 'legacy'), auditado_at = null, observacion = null,
           despublicado_por = null, validacion = p_validacion, enviado_at = now(),
           publicado_at = coalesce(publicado_at, now()), updated_at = now()
     where id = l.id;
    perform brote_recalcular_tiers(l.business_id);
    perform brote_recalcular_scores(l.business_id, l.id);
    perform brote_negocio_notificar(l.business_id, 'Producto publicado',
      format('"%s" ya está en el Mercado.', l.titulo), '/negocio/listados/' || l.id);
    return jsonb_build_object('ok', true, 'status', 'publicado');
  end if;

  update listings set status = 'pendiente', validacion = p_validacion, enviado_at = now(),
         observacion = null, updated_at = now()
   where id = l.id;
  perform brote_negocio_notificar_revisores('Listado para revisar',
    format('"%s"', l.titulo), '/panel/listados/' || l.id);
  return jsonb_build_object('ok', true, 'status', 'pendiente');
end $fn$;

-- El detalle de un listado para su formulario: lo de 0107 más los campos
-- nuevos y lo que la tienda tiene cargado para contactarla (sin los datos:
-- solo si existen, para ofrecer o no cada canal).
create or replace function listado_detalle(p_listing uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $fn$
declare l listings%rowtype; b businesses%rowtype;
begin
  select * into l from listings where id = p_listing;
  if l.id is null or not brote_is_member(l.business_id) then return null; end if;
  select * into b from businesses where id = l.business_id;
  return jsonb_build_object(
    'rol', brote_biz_role(l.business_id),
    'verificacion', brote_verificacion_fuerza(l.business_id),
    'negocio', jsonb_build_object('modelo', b.modelo, 'whatsapp', b.whatsapp is not null,
                                  'instagram', b.instagram is not null, 'sitio_web', b.sitio_web,
                                  'contacto_preferido', b.contacto_preferido, 'provincia', b.provincia),
    'listado', jsonb_build_object(
      'id', l.id, 'business_id', l.business_id, 'slug', l.slug, 'tipo', l.tipo, 'titulo', l.titulo,
      'descripcion', l.descripcion, 'imagenes', to_jsonb(l.imagenes), 'categoria', l.categoria,
      'subcategoria', l.subcategoria, 'condicion', l.condicion, 'contacto', l.contacto,
      'dominios', to_jsonb(l.dominios), 'precio_referencia', l.precio_referencia, 'moneda', l.moneda,
      'url_destino', l.url_destino, 'disponibilidad', l.disponibilidad, 'zonas', to_jsonb(l.zonas),
      'status', l.status, 'tier_efectivo', l.tier_efectivo, 'observacion', l.observacion,
      'acelerada', l.acelerada, 'despublicado_por', l.despublicado_por, 'favoritos', l.favoritos,
      'publicado_at', l.publicado_at, 'enviado_at', l.enviado_at, 'updated_at', l.updated_at,
      'sugerencias', case when l.screening_ia->>'por' = 'ia' then jsonb_build_object(
          'banderas_texto', l.screening_ia->'banderas_texto',
          'afirmaciones', l.screening_ia->'afirmaciones') else null end),
    'afirmaciones', coalesce((
      select jsonb_agg(brote_claim_json(c) order by lc.created_at)
      from listing_claims lc join business_claims c on c.id = lc.claim_id
      where lc.listing_id = l.id), '[]'::jsonb),
    'reportes', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', r.id, 'motivo', r.motivo, 'detalle', r.detalle, 'estado', r.estado,
        'descargo', r.descargo, 'descargo_at', r.descargo_at, 'descargo_vence', r.descargo_vence,
        'corregir_hasta', r.corregir_hasta, 'nota', r.nota, 'created_at', r.created_at)
        order by r.created_at desc)
      from listing_reports r where r.listing_id = l.id), '[]'::jsonb));
end $fn$;

-- La salud de enlaces mira solo los productos que salen a un sitio web: un
-- WhatsApp o un Instagram no tienen "enlace caído".
create or replace function brote_link_health_lanzar(p_limit int default 200)
returns jsonb language plpgsql security definer set search_path = public, net as $fn$
declare r record; v_id bigint; n int := 0;
begin
  delete from link_checks;
  for r in
    select l.id, l.url_destino from listings l
     where l.status = 'publicado' and l.contacto = 'web' and coalesce(l.url_destino, '') <> ''
     order by l.link_fallos desc, l.updated_at
     limit greatest(1, least(coalesce(p_limit, 200), 500))
  loop
    begin
      select net.http_get(url := r.url_destino, timeout_milliseconds := 8000) into v_id;
      insert into link_checks (listing_id, request_id) values (r.id, v_id)
      on conflict (listing_id) do update set request_id = excluded.request_id, pedido_at = now();
      n := n + 1;
    exception when others then
      perform brote_link_health_fallo(r.id);
    end;
  end loop;
  return jsonb_build_object('pedidos', n);
end $fn$;

-- Los listados de la tienda, para `/negocio/listados`: lo de 0107 más lo nuevo.
create or replace function mis_listados(p_business uuid)
returns jsonb language sql stable security definer set search_path = public as $fn$
  select case when not brote_is_member(p_business) then null else jsonb_build_object(
    'rol', brote_biz_role(p_business),
    'negocio', (select jsonb_build_object('id', b.id, 'slug', b.slug, 'nombre', b.nombre_comercial,
                  'status', b.status, 'tier', b.tier, 'sitio_web', b.sitio_web, 'modelo', b.modelo,
                  'whatsapp', b.whatsapp is not null, 'instagram', b.instagram is not null,
                  'verificacion', brote_verificacion_fuerza(b.id))
                from businesses b where b.id = p_business),
    'preguntas_pendientes', (select count(*) from listing_preguntas q
                              where q.business_id = p_business and q.estado = 'visible' and q.respondida_at is null),
    'listados', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', l.id, 'slug', l.slug, 'titulo', l.titulo, 'tipo', l.tipo, 'categoria', l.categoria,
        'subcategoria', l.subcategoria, 'condicion', l.condicion, 'precio', l.precio_referencia,
        'imagen', l.imagenes[1], 'status', l.status, 'tier_efectivo', l.tier_efectivo,
        'observacion', l.observacion, 'updated_at', l.updated_at, 'publicado_at', l.publicado_at,
        'favoritos', l.favoritos,
        'afirmaciones', (select count(*) from listing_claims where listing_id = l.id),
        'reportes_abiertos', (select count(*) from listing_reports where listing_id = l.id and estado = 'abierto'),
        'preguntas_pendientes', (select count(*) from listing_preguntas q
                                  where q.listing_id = l.id and q.estado = 'visible' and q.respondida_at is null),
        'clics_30d', (select count(*) from listing_clicks where listing_id = l.id and created_at > now() - interval '30 days'))
        order by l.updated_at desc)
      from listings l where l.business_id = p_business and l.status <> 'removido'), '[]'::jsonb)) end;
$fn$;

-- Las tiendas de la persona, para el selector de contexto: lo de 0105 más el
-- modelo, que decide qué secciones tiene el espacio de la tienda. Cambia la
-- forma de lo que devuelve, así que hay que borrarla y crearla de nuevo.
drop function if exists my_businesses();
create function my_businesses()
returns table (id uuid, nombre text, slug text, role text, status business_status, tier evidence_tier, modelo text)
language sql stable security definer set search_path = public as $fn$
  select b.id, b.nombre_comercial, b.slug, m.role::text, b.status, b.tier, b.modelo
  from business_members m join businesses b on b.id = m.business_id
  where m.user_id = auth.uid()
  order by b.created_at;
$fn$;
revoke all on function my_businesses() from public, anon;
grant execute on function my_businesses() to authenticated;

-- ── 10. El equipo revisa los compromisos ────────────────────────────────────

create or replace function admin_compromisos_cola(p_pass text)
returns jsonb language plpgsql stable security definer set search_path = public as $fn$
begin
  if not admin_check(p_pass) then raise exception 'No autorizado' using errcode = 'P0001'; end if;
  return jsonb_build_object(
    'pendientes', (select count(*) from tienda_compromisos c join businesses b on b.id = c.business_id
                    where c.estado = 'declarado' and c.foto_path is not null and b.status = 'approved'),
    'items', coalesce((
      select jsonb_agg(x order by (x->>'abierta_at') nulls last) from (
        select jsonb_build_object(
          'business_id', b.id, 'slug', b.slug, 'nombre', b.nombre_comercial, 'abierta_at', b.activa_at,
          'categoria', b.categoria_principal, 'provincia', b.provincia, 'tipo', b.tipo_vendedor,
          'mp_nickname', b.mp_nickname,
          'compromisos', (select jsonb_agg(jsonb_build_object('practica', c.practica, 'estado', c.estado,
                            'foto_path', c.foto_path, 'nota', c.nota, 'created_at', c.created_at) order by c.created_at)
                          from tienda_compromisos c where c.business_id = b.id)) x
          from businesses b
         where b.status = 'approved' and b.modelo = 'vendedor'
           and exists (select 1 from tienda_compromisos c
                        where c.business_id = b.id and c.estado = 'declarado' and c.foto_path is not null)
         order by b.activa_at nulls last limit 50) y), '[]'::jsonb));
end $fn$;

create or replace function admin_compromiso_revisar(p_pass text, p_business uuid, p_practica text, p_decision text, p_nota text default null)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare c tienda_compromisos%rowtype;
begin
  if not admin_check(p_pass) then raise exception 'No autorizado' using errcode = 'P0001'; end if;
  if p_decision not in ('revisado','rechazado') then return jsonb_build_object('ok', false, 'error', 'decision_invalida'); end if;
  if p_decision = 'rechazado' and length(trim(coalesce(p_nota, ''))) < 10 then
    return jsonb_build_object('ok', false, 'error', 'falta_nota');
  end if;
  select * into c from tienda_compromisos where business_id = p_business and practica = p_practica for update;
  if c.business_id is null then return jsonb_build_object('ok', false, 'error', 'no_existe'); end if;
  update tienda_compromisos set estado = p_decision, nota = nullif(trim(coalesce(p_nota, '')), ''),
         revisado_por = (select auth.uid()), revisado_at = now(), updated_at = now()
   where business_id = p_business and practica = p_practica;
  if p_decision = 'rechazado' then
    perform brote_negocio_notificar(p_business, 'Revisamos tu compromiso',
      format('No pudimos confirmar una de tus prácticas con la foto: %s', trim(p_nota)), '/negocio/tienda');
  else
    perform brote_negocio_notificar(p_business, 'Revisamos tu compromiso',
      'Listo: tu práctica ya se muestra como revisada por Brote.', '/negocio/tienda');
  end if;
  return jsonb_build_object('ok', true);
end $fn$;

-- ── 11. Permisos ────────────────────────────────────────────────────────────

revoke all on function brote_ajuste_num(text, numeric) from public, anon, authenticated;
revoke all on function brote_ajuste_bool(text, boolean) from public, anon, authenticated;
revoke all on function brote_vendedor_cobro() from public, anon, authenticated;
revoke all on function brote_vendedor_mp_requerido() from public, anon, authenticated;
revoke all on function brote_tipo_cambio_lanzar() from public, anon, authenticated;
revoke all on function brote_tipo_cambio_leer() from public, anon, authenticated;
revoke all on function brote_tipo_cambio_actual() from public, anon, authenticated;
revoke all on function brote_vendedor_precio() from public, anon, authenticated;
revoke all on function brote_biz_limites(biz_plan) from public, anon, authenticated;
revoke all on function brote_negocio_plan(uuid) from public, anon, authenticated;
revoke all on function brote_biz_escritura(uuid) from public, anon, authenticated;
revoke all on function brote_categoria_rubro(text) from public, anon, authenticated;
revoke all on function brote_vendedor_pregunta(text) from public, anon, authenticated;
revoke all on function brote_vendedor_faltantes(uuid) from public, anon, authenticated;
revoke all on function brote_vendedor_activar(uuid) from public, anon, authenticated;
revoke all on function brote_negocios_cobro() from public, anon, authenticated;
revoke all on function brote_link_health_lanzar(int) from public, anon, authenticated;
revoke all on function brote_termino_sin_afirmacion(text, text[], boolean) from public, anon, authenticated;
revoke all on function brote_listado_sin_afirmacion(uuid, text) from public, anon, authenticated;

-- Solo el servidor de Brote (clave de servicio).
revoke all on function vendedor_mp_vincular(uuid, uuid, text, text, text, jsonb) from public, anon, authenticated;
revoke all on function negocio_suscripcion_aplicar(uuid, text, text, text, biz_plan, numeric, text, timestamptz, jsonb) from public, anon, authenticated;
revoke all on function vendedor_ajuste_consultar(text) from public, anon, authenticated;
revoke all on function vendedor_ajuste_aplicar(text, numeric) from public, anon, authenticated;
grant execute on function vendedor_mp_vincular(uuid, uuid, text, text, text, jsonb) to service_role;
grant execute on function negocio_suscripcion_aplicar(uuid, text, text, text, biz_plan, numeric, text, timestamptz, jsonb) to service_role;
grant execute on function vendedor_ajuste_consultar(text) to service_role;
grant execute on function vendedor_ajuste_aplicar(text, numeric) to service_role;
grant execute on function negocio_plan_cotizar(uuid, biz_plan) to service_role;
grant execute on function brote_negocios_cobro() to service_role;

revoke all on function vendedor_crear(text) from public, anon;
revoke all on function vendedor_guardar(uuid, jsonb) from public, anon;
revoke all on function vendedor_compromisos(uuid, text[], text, text) from public, anon;
revoke all on function vendedor_prueba_empezar(uuid) from public, anon;
revoke all on function vendedor_prueba_responder(uuid, text, text) from public, anon;
revoke all on function vendedor_mp_desvincular(uuid) from public, anon;
revoke all on function vendedor_abrir(uuid) from public, anon;
revoke all on function vendedor_estado(uuid) from public, anon;
revoke all on function negocio_plan_cotizar(uuid, biz_plan) from public, anon;
revoke all on function negocio_plan_estado(uuid) from public, anon;
revoke all on function listado_guardar(uuid, uuid, jsonb) from public, anon;
revoke all on function listado_imagenes(uuid, text[]) from public, anon;
revoke all on function listado_enviar(uuid, jsonb) from public, anon;
revoke all on function mis_listados(uuid) from public, anon;
revoke all on function listado_detalle(uuid) from public, anon;
revoke all on function admin_compromisos_cola(text) from public, anon;
revoke all on function admin_compromiso_revisar(text, uuid, text, text, text) from public, anon;

grant execute on function vendedor_crear(text) to authenticated;
grant execute on function vendedor_guardar(uuid, jsonb) to authenticated;
grant execute on function vendedor_compromisos(uuid, text[], text, text) to authenticated;
grant execute on function vendedor_prueba_empezar(uuid) to authenticated;
grant execute on function vendedor_prueba_responder(uuid, text, text) to authenticated;
grant execute on function vendedor_mp_desvincular(uuid) to authenticated;
grant execute on function vendedor_abrir(uuid) to authenticated;
grant execute on function vendedor_estado(uuid) to authenticated;
grant execute on function negocio_plan_cotizar(uuid, biz_plan) to authenticated;
grant execute on function negocio_plan_estado(uuid) to authenticated;
grant execute on function listado_guardar(uuid, uuid, jsonb) to authenticated;
grant execute on function listado_imagenes(uuid, text[]) to authenticated;
grant execute on function listado_enviar(uuid, jsonb) to authenticated;
grant execute on function mis_listados(uuid) to authenticated;
grant execute on function listado_detalle(uuid) to authenticated;
grant execute on function admin_compromisos_cola(text) to authenticated;
grant execute on function admin_compromiso_revisar(text, uuid, text, text, text) to authenticated;
