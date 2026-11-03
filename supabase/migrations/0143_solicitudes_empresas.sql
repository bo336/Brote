-- ════════════════════════════════════════════════════════════════════════════
-- Brote — 0143 — Primero la solicitud, después todo lo demás. Igual para los dos.
--
-- QUÉ ESTABA MAL. Ninguna empresa nueva llegaba al panel, porque ninguna pasaba
-- por `submitted`:
--   · "Empresa que mejora" (`empresa_crear`, 0121) nacía `approved`, derecho al
--     programa con objetivos.
--   · "Tienda" (`vendedor_crear`, 0114) nacía `draft` y se abría sola al pagar.
-- El aviso al dueño (0130) estaba bien: nunca tenía de qué avisar.
--
-- CÓMO ES AHORA, para las dos:
--   1. La persona elige qué quiere y manda un formulario corto con lo necesario
--      para ver que el negocio es real (`negocio_solicitud_enviar`).
--   2. Queda `submitted`: al dueño le llega el aviso y la solicitud aparece en
--      /panel/negocios. Mientras tanto la persona ve "en revisión" y nada más.
--   3. El dueño aprueba, pide datos o rechaza (`admin_negocio_revisar`).
--   4. Recién aprobada empieza el armado: la tienda sigue con su compromiso, la
--      prueba verde y Mercado Pago; la empresa, con su diagnóstico y objetivos.
--
-- Para una tienda, `approved` ahora significa "aprobada", no "abierta". Abierta
-- es `activa_at`: lo que antes hacía el primer cobro lo sigue haciendo.
-- ════════════════════════════════════════════════════════════════════════════

alter table public.businesses add column if not exists solicitud jsonb not null default '{}'::jsonb;

-- ── 1 · La solicitud ────────────────────────────────────────────────────────

-- Crea la solicitud (p_business null) o la vuelve a mandar corregida.
create or replace function public.negocio_solicitud_enviar(p_business uuid, p_objetivo text, p_datos jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_uid uuid := auth.uid(); v_prof profiles%rowtype; v_confirmado timestamptz; b businesses%rowtype;
  v_owned int; v_tope int; v_id uuid;
  v_nombre text := trim(coalesce(p_datos ->> 'nombre_comercial', ''));
  v_tipo text := p_datos ->> 'tipo_vendedor';
  v_rubro text := p_datos ->> 'rubro';
  v_tamano text := p_datos ->> 'tamano';
  v_provincia text := nullif(p_datos ->> 'provincia', '');
  v_ciudad text := nullif(trim(coalesce(p_datos ->> 'ciudad', '')), '');
  v_desc text := trim(coalesce(p_datos ->> 'descripcion', ''));
  v_sitio text := nullif(trim(coalesce(p_datos ->> 'sitio_web', '')), '');
  v_ig text := nullif(lower(trim(both '@' from trim(coalesce(p_datos ->> 'instagram', '')))), '');
  v_wa text := nullif(regexp_replace(coalesce(p_datos ->> 'whatsapp', ''), '[^\d+]', '', 'g'), '');
  v_cuit text := nullif(regexp_replace(coalesce(p_datos ->> 'cuit', ''), '\D', '', 'g'), '');
  v_rol text := p_datos ->> 'rol';
  v_extra text := nullif(trim(coalesce(p_datos ->> 'extra', '')), '');
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'error', 'no_autenticado'); end if;
  if p_objetivo not in ('vender', 'mejorar') then return jsonb_build_object('ok', false, 'error', 'objetivo_invalido'); end if;
  if jsonb_typeof(p_datos) is distinct from 'object' then return jsonb_build_object('ok', false, 'error', 'datos_invalidos'); end if;

  select * into v_prof from profiles where id = v_uid;
  if v_prof.account_type is distinct from 'adult' then return jsonb_build_object('ok', false, 'error', 'solo_adultos'); end if;
  if not coalesce(v_prof.onboarding_completed, false) then return jsonb_build_object('ok', false, 'error', 'onboarding_pendiente'); end if;
  select email_confirmed_at into v_confirmado from auth.users where id = v_uid;
  if v_confirmado is null then return jsonb_build_object('ok', false, 'error', 'email_sin_confirmar'); end if;

  -- Campo por campo: la pantalla marca el que está mal.
  if char_length(v_nombre) not between 2 and 80 or brote_matches_blocklist(v_nombre) then
    return jsonb_build_object('ok', false, 'error', 'campo_invalido', 'campo', 'nombre_comercial');
  end if;
  if coalesce(v_tipo, '') not in ('persona', 'empresa') then
    return jsonb_build_object('ok', false, 'error', 'campo_invalido', 'campo', 'tipo_vendedor');
  end if;
  if v_rubro is null or not (v_rubro = any (brote_rubros())) then
    return jsonb_build_object('ok', false, 'error', 'campo_invalido', 'campo', 'rubro');
  end if;
  if v_tamano is null or not (v_tamano = any (enum_range(null::business_size)::text[])) then
    return jsonb_build_object('ok', false, 'error', 'campo_invalido', 'campo', 'tamano');
  end if;
  if v_provincia is null or not (v_provincia = any (brote_provincias())) then
    return jsonb_build_object('ok', false, 'error', 'campo_invalido', 'campo', 'provincia');
  end if;
  if char_length(coalesce(v_ciudad, '')) > 80 then
    return jsonb_build_object('ok', false, 'error', 'campo_invalido', 'campo', 'ciudad');
  end if;
  if char_length(v_desc) not between 30 and 800 or brote_matches_blocklist(v_desc) or brote_texto_prohibido(v_desc) is not null then
    return jsonb_build_object('ok', false, 'error', 'campo_invalido', 'campo', 'descripcion');
  end if;
  if v_sitio is not null and v_sitio !~ '^https://[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$' then
    return jsonb_build_object('ok', false, 'error', 'campo_invalido', 'campo', 'sitio_web');
  end if;
  if v_ig is not null and v_ig !~ '^[a-z0-9._]{1,30}$' then
    return jsonb_build_object('ok', false, 'error', 'campo_invalido', 'campo', 'instagram');
  end if;
  if v_wa is not null and v_wa !~ '^\+?\d{8,15}$' then
    return jsonb_build_object('ok', false, 'error', 'campo_invalido', 'campo', 'whatsapp');
  end if;
  -- Algo público donde se pueda mirar que existe.
  if v_sitio is null and v_ig is null and v_wa is null then
    return jsonb_build_object('ok', false, 'error', 'campo_invalido', 'campo', 'contacto');
  end if;
  if v_cuit is not null and not brote_cuit_valido(v_cuit) then
    return jsonb_build_object('ok', false, 'error', 'campo_invalido', 'campo', 'cuit');
  end if;
  if coalesce(v_rol, '') not in ('dueno', 'socio', 'empleado', 'otro') then
    return jsonb_build_object('ok', false, 'error', 'campo_invalido', 'campo', 'rol');
  end if;
  if char_length(coalesce(v_extra, '')) > 500 or brote_matches_blocklist(coalesce(v_extra, '')) then
    return jsonb_build_object('ok', false, 'error', 'campo_invalido', 'campo', 'extra');
  end if;
  if coalesce((p_datos ->> 'acepta')::boolean, false) is not true then
    return jsonb_build_object('ok', false, 'error', 'campo_invalido', 'campo', 'acepta');
  end if;
  if not brote_rate_limit('solicitud:' || v_uid, 10) then
    return jsonb_build_object('ok', false, 'error', 'demasiados_intentos');
  end if;

  if p_business is null then
    perform pg_advisory_xact_lock(hashtext('create_business:' || v_uid::text));
    v_tope := coalesce((select (value #>> '{}')::int from app_settings where key = 'negocios_max_por_dueno'), 3);
    select count(*) into v_owned from business_members where user_id = v_uid and role = 'owner';
    if v_owned >= v_tope then return jsonb_build_object('ok', false, 'error', 'limite_negocios'); end if;

    insert into businesses (slug, nombre_comercial, tipo_vendedor, rubro, tamano, provincia, ciudad, descripcion,
                            sitio_web, instagram, whatsapp, cuit, modelo, objetivo, status, intereses, created_by,
                            alta_paso, enviado_at, solicitud)
    values (brote_slugify(v_nombre), v_nombre, v_tipo, v_rubro, v_tamano::business_size, v_provincia, v_ciudad, v_desc,
            v_sitio, v_ig, v_wa, v_cuit,
            case p_objetivo when 'vender' then 'vendedor' else 'empresa' end, p_objetivo, 'submitted',
            case p_objetivo when 'vender' then '{mercado}'::text[] else '{mejora}'::text[] end, v_uid,
            1, now(), jsonb_build_object('rol', v_rol, 'extra', v_extra))
    returning id into v_id;
    insert into business_members (business_id, user_id, role) values (v_id, v_uid, 'owner');
    insert into business_terms (business_id, version, user_id) values (v_id, brote_terminos_version(), v_uid)
    on conflict (business_id, version) do nothing;
  else
    if brote_biz_role(p_business) is distinct from 'owner' then
      return jsonb_build_object('ok', false, 'error', 'sin_permiso');
    end if;
    select * into b from businesses where id = p_business for update;
    if b.status = 'rejected' and b.revisado_at > now() - interval '30 days' then
      return jsonb_build_object('ok', false, 'error', 'rechazo_reciente', 'desde', b.revisado_at + interval '30 days');
    end if;
    if not (b.status in ('draft', 'rejected') or (b.status in ('submitted', 'in_review') and b.revision_note is not null)) then
      return jsonb_build_object('ok', false, 'error', 'ya_enviada');
    end if;
    v_id := p_business;
    insert into business_terms (business_id, version, user_id) values (v_id, brote_terminos_version(), v_uid)
    on conflict (business_id, version) do nothing;
    update businesses
       set slug = case when activa_at is null then brote_slugify(v_nombre) else slug end,
           nombre_comercial = v_nombre, tipo_vendedor = v_tipo, rubro = v_rubro, tamano = v_tamano::business_size,
           provincia = v_provincia, ciudad = v_ciudad, descripcion = v_desc, sitio_web = v_sitio, instagram = v_ig,
           whatsapp = v_wa, cuit = v_cuit,
           modelo = case p_objetivo when 'vender' then 'vendedor' else 'empresa' end, objetivo = p_objetivo,
           intereses = case p_objetivo when 'vender' then '{mercado}'::text[] else '{mejora}'::text[] end,
           status = 'submitted', revision_note = null, enviado_at = now(),
           solicitud = jsonb_build_object('rol', v_rol, 'extra', v_extra), updated_at = now()
     where id = v_id;
  end if;

  perform brote_negocio_notificar(v_id, 'Recibimos la solicitud de ' || v_nombre,
    'La vamos a revisar y te avisamos acá mismo. Si falta algo, te decimos qué.', '/negocio/alta');
  return jsonb_build_object('ok', true, 'id', v_id);
end $fn$;
revoke all on function public.negocio_solicitud_enviar(uuid, text, jsonb) from public, anon;
grant execute on function public.negocio_solicitud_enviar(uuid, text, jsonb) to authenticated;

-- Lo que la pantalla de espera necesita: en qué está y lo que se mandó.
create or replace function public.negocio_solicitud(p_business uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $fn$
declare b businesses%rowtype;
begin
  if not brote_is_member(p_business) then return null; end if;
  select * into b from businesses where id = p_business;
  return jsonb_build_object(
    'id', b.id, 'status', b.status, 'objetivo', b.objetivo, 'revision_note', b.revision_note,
    'revisado_at', b.revisado_at, 'enviado_at', b.enviado_at,
    'puede_reenviar_desde', case when b.status = 'rejected' then b.revisado_at + interval '30 days' end,
    'datos', jsonb_build_object(
      'nombre_comercial', b.nombre_comercial, 'tipo_vendedor', b.tipo_vendedor, 'rubro', b.rubro, 'tamano', b.tamano,
      'provincia', b.provincia, 'ciudad', b.ciudad, 'descripcion', b.descripcion, 'sitio_web', b.sitio_web,
      'instagram', b.instagram, 'whatsapp', b.whatsapp, 'cuit', b.cuit,
      'rol', b.solicitud ->> 'rol', 'extra', b.solicitud ->> 'extra'));
end $fn$;
revoke all on function public.negocio_solicitud(uuid) from public, anon;
grant execute on function public.negocio_solicitud(uuid) to authenticated;

-- Las dos altas directas se terminan. Quedan un momento por si hay una pestaña
-- abierta con la versión anterior, y se borran en 0144.
create or replace function public.vendedor_crear(p_nombre text)
returns jsonb language sql security definer set search_path = public as $fn$
  select jsonb_build_object('ok', false, 'error', 'usar_solicitud');
$fn$;
create or replace function public.empresa_crear(
  p_nombre text, p_rubro text, p_tamano business_size, p_provincia text, p_ciudad text, p_sitio_web text)
returns jsonb language sql security definer set search_path = public as $fn$
  select jsonb_build_object('ok', false, 'error', 'usar_solicitud');
$fn$;

-- ── 2 · Nada se empieza sin la aprobación ───────────────────────────────────
-- Copias de 0114, 0106 y 0121 con el cambio justo.

create or replace function vendedor_guardar(p_business uuid, p_datos jsonb)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare b businesses%rowtype; v text;
begin
  if not brote_can_write(p_business, 'admin') then return jsonb_build_object('ok', false, 'error', 'sin_permiso'); end if;
  if jsonb_typeof(p_datos) is distinct from 'object' then return jsonb_build_object('ok', false, 'error', 'datos_invalidos'); end if;
  select * into b from businesses where id = p_business for update;
  if b.modelo <> 'vendedor' then return jsonb_build_object('ok', false, 'error', 'no_editable'); end if;
  if b.status <> 'approved' then return jsonb_build_object('ok', false, 'error', 'no_aprobada'); end if;

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
    alta_paso = greatest(b.alta_paso, 2),
    updated_at = now()
  where id = p_business;

  return jsonb_build_object('ok', true, 'slug', b.slug);
end $fn$;

create or replace function vendedor_compromisos(p_business uuid, p_practicas text[], p_foto_practica text, p_foto_path text)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare v_pr text[]; v_foto text;
begin
  if not brote_can_write(p_business, 'admin') then return jsonb_build_object('ok', false, 'error', 'sin_permiso'); end if;
  if (select status from businesses where id = p_business) <> 'approved' then return jsonb_build_object('ok', false, 'error', 'no_aprobada'); end if;
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

create or replace function vendedor_prueba_empezar(p_business uuid)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare v_orden text[]; i vendedor_prueba_intentos%rowtype;
begin
  if not brote_can_write(p_business, 'admin') then return jsonb_build_object('ok', false, 'error', 'sin_permiso'); end if;
  if (select status from businesses where id = p_business) <> 'approved' then return jsonb_build_object('ok', false, 'error', 'no_aprobada'); end if;
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

create or replace function vendedor_mp_vincular(
  p_business uuid, p_user uuid, p_mp_user_id text, p_nickname text, p_email text, p_datos jsonb)
returns jsonb language plpgsql security definer set search_path = public as $fn$
begin
  if not exists (select 1 from business_members where business_id = p_business and user_id = p_user and role = 'owner') then
    return jsonb_build_object('ok', false, 'error', 'solo_owner');
  end if;
  if coalesce(p_mp_user_id, '') = '' then return jsonb_build_object('ok', false, 'error', 'mp_invalido'); end if;
  if (select status from businesses where id = p_business) <> 'approved' then return jsonb_build_object('ok', false, 'error', 'no_aprobada'); end if;
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

create or replace function brote_vendedor_faltantes(p_business uuid)
returns text[] language plpgsql stable security definer set search_path = public as $fn$
declare b businesses%rowtype; f text[] := '{}';
begin
  select * into b from businesses where id = p_business;
  if b.id is null then return array['no_existe']; end if;
  -- Sin la aprobación del equipo no se empieza nada de lo demás.
  if b.status <> 'approved' then return array['revision']; end if;
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

create or replace function brote_vendedor_activar(p_business uuid)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare b businesses%rowtype; v_falta text[];
begin
  select * into b from businesses where id = p_business for update;
  if b.id is null or b.modelo <> 'vendedor' then return jsonb_build_object('ok', false, 'error', 'no_aplica'); end if;
  if b.status in ('suspended','closed') then return jsonb_build_object('ok', false, 'error', 'no_disponible'); end if;
  if b.status <> 'approved' then return jsonb_build_object('ok', false, 'error', 'no_aprobada'); end if;
  if b.activa_at is not null then return jsonb_build_object('ok', true, 'ya_abierta', true); end if;
  v_falta := brote_vendedor_faltantes(p_business);
  if cardinality(v_falta) > 0 then return jsonb_build_object('ok', false, 'error', 'incompleta', 'falta', to_jsonb(v_falta)); end if;

  update businesses set activa_at = now(), updated_at = now()
   where id = p_business;
  perform brote_recalcular_tiers(p_business);
  perform brote_negocio_notificar(p_business, 'Tu tienda está abierta',
    'Ya podés publicar tus productos en el Mercado.', '/negocio/listados/nuevo');
  -- La foto del compromiso entra a la cola del equipo.
  perform brote_negocio_notificar_revisores('Tienda nueva',
    format('"%s" abrió su tienda. Su compromiso está para revisar.', b.nombre_comercial), '/panel/compromisos');
  return jsonb_build_object('ok', true, 'abierta', true);
end $fn$;

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
    'abierta', b.status = 'approved' and b.activa_at is not null, 'activa_at', b.activa_at,
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

create or replace function dossier_guardar(p_business uuid, p_bloque text, p_datos jsonb)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare d improvement_dossiers%rowtype;
begin
  if not brote_can_write(p_business, 'admin') then
    return jsonb_build_object('ok', false, 'error', 'sin_permiso');
  end if;
  if (select status from businesses where id = p_business) <> 'approved' then
    return jsonb_build_object('ok', false, 'error', 'negocio_no_aprobado');
  end if;
  if p_bloque not in ('operacion','energia','residuos','agua','insumos','logistica','ya_hecho','restricciones') then
    return jsonb_build_object('ok', false, 'error', 'bloque_invalido');
  end if;

  insert into improvement_dossiers (business_id) values (p_business)
  on conflict (business_id) do nothing;

  if p_bloque = 'ya_hecho' then
    update improvement_dossiers
       set ya_hecho = left(coalesce(p_datos->>'texto', ''), 4000), updated_at = now()
     where business_id = p_business;
  else
    if jsonb_typeof(p_datos) is distinct from 'object' then
      return jsonb_build_object('ok', false, 'error', 'datos_invalidos');
    end if;
    execute format('update improvement_dossiers set %I = $1, updated_at = now() where business_id = $2', p_bloque)
      using p_datos, p_business;
  end if;

  select * into d from improvement_dossiers where business_id = p_business;
  update improvement_dossiers set completitud = brote_dossier_completitud(d)
   where business_id = p_business;

  select * into d from improvement_dossiers where business_id = p_business;
  return jsonb_build_object('ok', true, 'completitud', d.completitud);
end $fn$;

create or replace function public.negocio_set_objetivo(p_business uuid, p_objetivo text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare b businesses%rowtype;
begin
  if p_objetivo not in ('vender', 'mejorar', 'ambos') then
    return jsonb_build_object('ok', false, 'error', 'objetivo_invalido');
  end if;
  if brote_biz_role(p_business) is distinct from 'owner' then
    return jsonb_build_object('ok', false, 'error', 'sin_permiso');
  end if;
  select * into b from businesses where id = p_business for update;
  if b.status <> 'approved' then return jsonb_build_object('ok', false, 'error', 'no_aprobada'); end if;
  if p_objetivo = 'mejorar'
     and exists (select 1 from listings l where l.business_id = p_business and l.status in ('publicado', 'pendiente')) then
    return jsonb_build_object('ok', false, 'error', 'tiene_productos');
  end if;
  update businesses set objetivo = p_objetivo, updated_at = now() where id = p_business;
  return jsonb_build_object('ok', true, 'objetivo', p_objetivo);
end $fn$;

-- Una tienda aprobada que todavía no abrió no publica.
create or replace function public.brote_listado_exige_vender()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
declare b businesses%rowtype;
begin
  select * into b from businesses where id = new.business_id;
  if b.objetivo = 'mejorar' then
    raise exception 'Esta cuenta es de una empresa que mejora su impacto: para vender, sumá la tienda desde el resumen.'
      using errcode = 'P0001';
  end if;
  if b.modelo = 'vendedor' and b.activa_at is null then
    raise exception 'Tu tienda todavía no abrió: terminá el alta para publicar.' using errcode = 'P0001';
  end if;
  return new;
end $fn$;
revoke all on function public.brote_listado_exige_vender() from public, anon, authenticated;

-- Y su página no existe hasta que abra.
create or replace function public.mercado_negocio(p_slug text)
returns jsonb
language plpgsql
stable security definer
set search_path = public
as $function$
declare b businesses%rowtype; v_uid uuid := (select auth.uid()); v_sens text[];
begin
  if v_uid is not null and coalesce(brote_account_type(v_uid), 'adult') = 'kid' then return null; end if;
  v_sens := case when v_uid is not null and brote_account_type(v_uid) = 'teen' then brote_mercado_sensibles()
                 else array[]::text[] end;
  select * into b from businesses where slug = p_slug and status = 'approved'
     and (modelo <> 'vendedor' or activa_at is not null);
  if b.id is null then return null; end if;
  return jsonb_build_object(
    'negocio', jsonb_build_object('id', b.id, 'slug', b.slug, 'nombre', b.nombre_comercial, 'rubro', b.rubro,
                'descripcion', b.descripcion, 'logo', b.logo_url, 'portada', b.portada_url,
                'provincia', b.provincia, 'ciudad', b.ciudad, 'sitio_web', brote_dominio(b.sitio_web),
                'tier', b.tier, 'progreso_mejora', b.progreso_mejora,
                'verificacion', brote_verificacion_fuerza(b.id),
                'nota_correccion', b.nota_correccion, 'nota_correccion_at', b.nota_correccion_at,
                'fundador', b.fundador,
                'desde', coalesce(b.activa_at, b.revisado_at, b.created_at),
                'tipo', b.tipo_vendedor, 'modelo', b.modelo,
                'categoria_principal', b.categoria_principal,
                'mp_vinculado', b.mp_vinculado_at is not null,
                'compromisos', brote_tienda_compromisos_publicos(b.id),
                'seguidores', (select count(*) from mercado_seguidos s where s.business_id = b.id),
                'seguida', v_uid is not null and exists (select 1 from mercado_seguidos s
                                                          where s.business_id = b.id and s.user_id = v_uid),
                'propia', v_uid is not null and brote_is_member(b.id),
                'productos', (select count(*) from listings l where l.business_id = b.id and l.status = 'publicado'
                                and not (l.categoria = any(v_sens))),
                'categorias', coalesce((select jsonb_object_agg(c, n) from (
                                select l.categoria c, count(*) n from listings l
                                 where l.business_id = b.id and l.status = 'publicado' and not (l.categoria = any(v_sens))
                                 group by 1) x), '{}'::jsonb)),
    'mejora', case when brote_negocio_permite(b.id, 'historial_publico') then coalesce((
        select jsonb_agg(jsonb_build_object('titulo', g.titulo, 'dominio', g.dominio, 'unidad', g.unidad,
                           'linea_base', g.linea_base, 'valor_final', g.valor_final, 'cerrado_at', g.cerrado_at)
                         order by g.cerrado_at desc)
        from improvement_goals g where g.business_id = b.id and g.es_publico and g.status = 'logrado'), '[]'::jsonb)
      else '[]'::jsonb end);
end $function$;

-- ── 3 · El aviso al dueño ───────────────────────────────────────────────────
-- Avisa sólo cuando la pelota está de este lado: una solicitud nueva o una
-- corrección enviada. Abrir la ficha la pone `in_review` y pedir datos la deja
-- `submitted` con nota: ninguna de las dos es algo nuevo para mirar.
create or replace function public.brote_equipo_negocio()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.slug like 'demo-%' then return new; end if;
  if new.status = 'submitted' and new.revision_note is null
     and (tg_op = 'INSERT' or old.status is distinct from new.status or old.revision_note is not null) then
    perform brote_avisar_admins(
      'negocio:' || new.id,
      case when tg_op = 'UPDATE' and old.revision_note is not null
           then 'Corrección enviada: ' || coalesce(new.nombre_comercial, 'una empresa')
           else 'Solicitud para aprobar: ' || coalesce(new.nombre_comercial, 'nueva') end,
      case new.objetivo when 'vender' then 'Quiere vender en el Mercado. Mirá si es real y decidí.'
                        when 'mejorar' then 'Quiere mejorar su impacto con Brote. Mirá si es real y decidí.'
                        else 'Quiere vender y mejorar. Mirá si es real y decidí.' end,
      '/panel/negocios/' || new.id);
  end if;
  return new;
end $$;
revoke all on function public.brote_equipo_negocio() from public, anon, authenticated;

-- ── 4 · El panel ────────────────────────────────────────────────────────────

create or replace function public.admin_negocios_cola(p_pass text, p_filtro text default 'pendientes')
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if not admin_check(p_pass) then raise exception 'No autorizado' using errcode = 'P0001'; end if;

  return jsonb_build_object(
    'ok', true,
    'contadores', (select jsonb_build_object(
        'pendientes', count(*) filter (where status in ('submitted','in_review') and revision_note is null),
        'observadas', count(*) filter (where status in ('submitted','in_review') and revision_note is not null),
        'rechazadas', count(*) filter (where status = 'rejected'),
        'todas',      count(*) filter (where status <> 'draft' and slug not like 'demo-%'))
      from businesses),
    'items', coalesce((
      select jsonb_agg(fila order by orden)
      from (
        select
          case when p_filtro = 'pendientes' then extract(epoch from b.enviado_at)
               else -extract(epoch from coalesce(b.enviado_at, b.created_at)) end as orden,
          jsonb_build_object(
            'id', b.id, 'nombre', b.nombre_comercial, 'rubro', b.rubro,
            'provincia', b.provincia, 'ciudad', b.ciudad, 'tamano', b.tamano,
            'status', b.status, 'enviado_at', b.enviado_at, 'revisado_at', b.revisado_at,
            'objetivo', b.objetivo, 'modelo', b.modelo,
            'observada', b.revision_note is not null and b.status in ('submitted','in_review'),
            'verificacion', (
              select jsonb_build_object('method', v.method, 'status', v.status, 'verified_at', v.verified_at)
              from business_verifications v where v.business_id = b.id
              order by (v.status = 'verificado') desc,
                       (v.method in ('dominio_meta','dominio_dns','dominio_archivo')) desc,
                       v.ultimo_intento_at desc nulls last
              limit 1),
            'riesgos', to_jsonb(brote_negocio_riesgos(b.id))) as fila
        from businesses b
        where case p_filtro
                when 'pendientes' then b.status in ('submitted','in_review') and b.revision_note is null
                when 'observadas' then b.status in ('submitted','in_review') and b.revision_note is not null
                when 'rechazadas' then b.status = 'rejected'
                else b.status <> 'draft' and b.slug not like 'demo-%'
              end
        order by orden
        limit 200
      ) t), '[]'::jsonb)
  );
end $fn$;

create or replace function public.admin_negocio_detalle(p_pass text, p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  b businesses%rowtype;
  v_cola uuid[];
  v_pos int;
begin
  if not admin_check(p_pass) then raise exception 'No autorizado' using errcode = 'P0001'; end if;
  select * into b from businesses where id = p_id;
  if not found then return jsonb_build_object('ok', false, 'error', 'No existe'); end if;

  -- Abrirla la pone "en revisión": es lo que la empresa ve en su resumen.
  if b.status = 'submitted' and b.revision_note is null then
    update businesses set status = 'in_review' where id = p_id;
    b.status := 'in_review';
  end if;

  select array_agg(id order by enviado_at) into v_cola
    from businesses where status in ('submitted','in_review') and revision_note is null;
  v_pos := array_position(v_cola, p_id);

  return jsonb_build_object(
    'ok', true,
    'negocio', jsonb_build_object(
      'id', b.id, 'slug', b.slug, 'nombre_comercial', b.nombre_comercial,
      'razon_social', b.razon_social, 'cuit', b.cuit,
      'cuit_valido', case when b.cuit is null then null else brote_cuit_valido(b.cuit) end,
      'rubro', b.rubro, 'tamano', b.tamano, 'provincia', b.provincia, 'ciudad', b.ciudad,
      'descripcion', b.descripcion, 'sitio_web', b.sitio_web, 'instagram', b.instagram,
      'whatsapp', b.whatsapp, 'email_contacto', b.email_contacto,
      'objetivo', b.objetivo, 'modelo', b.modelo, 'tipo_vendedor', b.tipo_vendedor, 'solicitud', b.solicitud,
      'status', b.status, 'tier', b.tier, 'intereses', to_jsonb(b.intereses),
      'score_ia', b.score_ia, 'informe_ia', b.informe_ia,
      'revision_note', b.revision_note, 'revisado_at', b.revisado_at,
      'enviado_at', b.enviado_at, 'created_at', b.created_at,
      'sitio_estado', b.sitio_estado, 'sitio_chequeado_at', b.sitio_chequeado_at),
    'creador', (select jsonb_build_object('id', p.id, 'display_name', p.display_name, 'username', p.username,
                                           'desde', p.created_at, 'email', u.email,
                                           'puntos', p.total_xp, 'rango', p.current_rank_slug,
                                           'otras', (select count(*) from business_members m
                                                      where m.user_id = p.id and m.role = 'owner' and m.business_id <> b.id))
                from profiles p join auth.users u on u.id = p.id where p.id = b.created_by),
    'verificaciones', coalesce((
      select jsonb_agg(jsonb_build_object(
        'method', v.method, 'status', v.status, 'target', v.target, 'intentos', v.intentos,
        'ultimo_error', v.ultimo_error, 'evidencia_url', v.evidencia_url,
        'verified_at', v.verified_at, 'ultimo_intento_at', v.ultimo_intento_at)
        order by v.created_at)
      from business_verifications v where v.business_id = b.id), '[]'::jsonb),
    'duplicados', brote_negocio_duplicados(b.id),
    'riesgos', to_jsonb(brote_negocio_riesgos(b.id)),
    'anterior', case when v_pos > 1 then v_cola[v_pos - 1] end,
    'siguiente', case when v_pos is not null and v_pos < cardinality(v_cola) then v_cola[v_pos + 1]
                      when v_pos is null then v_cola[1] end
  );
end $fn$;

create or replace function public.admin_negocio_revisar(p_pass text, p_id uuid, p_accion text, p_nota text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  b businesses%rowtype;
  v_nota text := nullif(trim(coalesce(p_nota, '')), '');
begin
  if not admin_check(p_pass) then raise exception 'No autorizado' using errcode = 'P0001'; end if;
  if p_accion not in ('aprobar','pedir_datos','rechazar') then
    return jsonb_build_object('ok', false, 'error', 'Acción inválida');
  end if;
  select * into b from businesses where id = p_id for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'No existe'); end if;
  if b.status not in ('submitted','in_review') then
    return jsonb_build_object('ok', false, 'error', 'Esta solicitud ya no está pendiente');
  end if;
  -- Pedir datos y rechazar sin decir qué ni por qué deja a la empresa a ciegas.
  if p_accion in ('pedir_datos','rechazar') and coalesce(char_length(v_nota), 0) < 10 then
    return jsonb_build_object('ok', false, 'error', 'Escribí en la nota qué falta o por qué');
  end if;

  update businesses set
    status = case p_accion when 'aprobar' then 'approved'::business_status
                           when 'rechazar' then 'rejected'::business_status
                           else 'submitted'::business_status end,
    tier = case when p_accion = 'aprobar' and tier < 'e1' then 'e1'::evidence_tier else tier end,
    revision_note = v_nota,
    revisado_por = auth.uid(),
    revisado_at = now(),
    ultima_revision = now()
  where id = p_id;

  if p_accion = 'aprobar' then
    -- Recién acá empieza el armado de cada plan.
    if b.modelo = 'vendedor' then
      perform brote_negocio_notificar(p_id, '¡Aprobamos ' || b.nombre_comercial || '! 🌱',
        coalesce(v_nota, 'Ya podés armar tu tienda: son unos pasos cortos y quedás lista para publicar.'), '/negocio/alta');
    elsif b.modelo = 'empresa' then
      insert into improvement_dossiers (business_id) values (p_id) on conflict (business_id) do nothing;
      perform brote_negocio_notificar(p_id, '¡Aprobamos ' || b.nombre_comercial || '! 🌱',
        coalesce(v_nota, 'Ya podés empezar tu plan: contanos cómo trabajan y te proponemos objetivos a tu medida.'), '/negocio/mejora/dossier');
    else
      perform brote_negocio_notificar(p_id, b.nombre_comercial || ' ya está en Brote',
        coalesce(v_nota, 'Aprobamos la solicitud. Ya podés entrar al espacio de tu negocio.'), '/negocio');
    end if;
  elsif p_accion = 'pedir_datos' then
    perform brote_negocio_notificar(p_id, 'Nos falta un dato de ' || b.nombre_comercial, v_nota, '/negocio/alta');
  else
    perform brote_negocio_notificar(p_id, 'No pudimos aprobar a ' || b.nombre_comercial, v_nota, '/negocio/alta');
  end if;

  return jsonb_build_object('ok', true);
end $fn$;

-- La bandeja del panel no cuenta las tiendas de demostración.
create or replace function public.admin_pendientes(p_pass text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not admin_check(p_pass) then
    return jsonb_build_object('ok', false, 'error', 'Sin acceso');
  end if;
  return jsonb_build_object(
    'ok', true,
    'reportes_plaza', (select count(*) from content_reports where status = 'open'),
    'negocios',       (select count(*) from businesses where status in ('submitted','in_review') and revision_note is null),
    'desafios',       (select count(*) from empresa_desafio_inscripciones where estado = 'enviada'),
    'listados',       (select count(*) from listings l join businesses b on b.id = l.business_id
                        where l.status = 'pendiente' and b.slug not like 'demo-%'),
    'auditoria',      (select count(*) from listings where acelerada and auditado_at is null and status = 'publicado'),
    'reportes_mercado', (select count(*) from listing_reports where estado = 'abierto'),
    'objetivos',      (select count(*) from improvement_goals where status = 'en_revision'),
    'compromisos',    (select count(*) from tienda_compromisos c join businesses b on b.id = c.business_id
                        where c.estado = 'declarado' and c.foto_path is not null and b.status = 'approved'),
    'academia',       (select count(*) from ac_revision_cola where estado = 'pendiente'),
    'pagos_fallidos', (select count(*) from business_subscriptions where status = 'en_gracia')
                    + (select count(*) from subscriptions where status = 'paused')
                    + (select count(*) from pagos_eventos where procesado_at is null and recibido_at < now() - interval '10 minutes'),
    'errores_mundo_24h', (select count(*) from world_client_errors where created_at > now() - interval '24 hours'),
    'errores_app_24h', (select coalesce(sum(n), 0) from app_errores where ultimo_at > now() - interval '24 hours'));
end $$;

-- ── 5 · Lo que ya estaba creado ─────────────────────────────────────────────
-- Las que entraron sin que nadie las mirara van a la cola, como cualquier otra.
-- No hay ninguna abierta ni con productos: son las de prueba del dueño.
update public.businesses set enviado_at = coalesce(enviado_at, created_at)
 where status in ('submitted', 'in_review') and enviado_at is null;

update public.businesses b
   set status = 'submitted', revision_note = null, enviado_at = coalesce(b.enviado_at, now()), updated_at = now()
 where b.slug not like 'demo-%' and b.activa_at is null and b.revisado_por is null
   and ((b.modelo = 'empresa' and b.status = 'approved') or (b.modelo = 'vendedor' and b.status = 'draft'))
   and not exists (select 1 from profiles p where p.id = b.created_by and coalesce(p.es_prueba, false));

-- Las tiendas abiertas por el camino anterior ya tenían `approved`; sin fecha de
-- apertura no se consideran abiertas, así que se les pone la de su aprobación.
update public.businesses set activa_at = coalesce(revisado_at, updated_at)
 where modelo = 'vendedor' and status = 'approved' and activa_at is null;
