-- ════════════════════════════════════════════════════════════════════════════
-- Brote — 0134 — Publicidad v2: AdSense + anuncios directos, con frenos.
--
-- Lo que había: un motor de reglas en el cliente (`lib/ads/policy.ts`) y el
-- interruptor `ads_enabled` en `app_settings`... que nadie leía. Apagarlo en
-- el panel no apagaba nada.
--
-- Lo nuevo:
--   · `publicidad_estado()` (pública): el interruptor general y las reglas
--     (`publicidad_config`). La app las lee al abrir y respeta cada valor.
--     Apagar la publicidad desde el panel la apaga en todas partes, sin deploy
--     y sin tocar nada más de la app.
--   · Anuncios DIRECTOS (`anuncios`): sponsors propios cargados desde el
--     panel, con fechas, ubicaciones, provincias, público, peso y topes. Cada
--     ubicación elige proveedor: 'auto' (directo si hay uno vigente, si no
--     AdSense), 'adsense', 'directo' o 'ninguno'.
--   · Métricas propias, agregadas por día: cuántos espacios se pidieron, se
--     llenaron o quedaron vacíos, por ubicación y proveedor; impresiones y
--     clics de cada anuncio directo. Lo que paga AdSense se ve en AdSense.
--   · Nada de esto llega a chicos (cuentas `kid`) ni a Brote+: lo decide el
--     cliente y lo vuelve a decidir `anuncio_elegir` en la base.
--   · La tarjeta del "momento" (flotante) sólo lleva anuncios directos: la
--     política de AdSense prohíbe anuncios de Google en ventanas que la persona
--     no abrió.
-- ════════════════════════════════════════════════════════════════════════════

insert into app_settings (key, value, description) values
  ('publicidad_config', '{
     "dias_gracia": 3,
     "por_dia": 12,
     "por_sesion": 5,
     "momento": {"activo": true, "tras_cierres": 3, "min_minutos": 30, "min_sesiones": 3},
     "ubicaciones": {
       "news-feed":      {"activa": true, "proveedor": "auto", "desde": 5, "cada": 8, "max": 3},
       "news-article":   {"activa": true, "proveedor": "auto"},
       "ranking-footer": {"activa": true, "proveedor": "auto"},
       "catalog-footer": {"activa": true, "proveedor": "auto"},
       "guia":           {"activa": true, "proveedor": "auto"},
       "moment":         {"activa": true, "proveedor": "directo"}
     }
   }'::jsonb, 'Reglas de la publicidad. Se editan en /panel/publicidad.')
on conflict (key) do nothing;

-- Ninguna migración había creado la fila: el panel "la prendía" con un
-- UPDATE que no encontraba nada. Nace apagada; se prende desde /panel/publicidad.
insert into app_settings (key, value, description)
values ('ads_enabled', 'false'::jsonb, 'Interruptor general de la publicidad (AdSense y anuncios directos). Apagado: no se carga nada.')
on conflict (key) do update set description = excluded.description;

-- ── Anuncios directos ───────────────────────────────────────────────────────

create table if not exists public.anuncios (
  id               uuid primary key default gen_random_uuid(),
  nombre           text not null check (length(nombre) between 2 and 80),
  anunciante       text not null check (length(anunciante) between 2 and 60),
  titulo           text not null check (length(titulo) between 3 and 70),
  texto            text check (length(texto) <= 160),
  imagen_url       text check (imagen_url is null or imagen_url ~ '^https://'),
  cta              text not null default 'Conocer más' check (length(cta) between 2 and 24),
  url_destino      text not null check (url_destino ~ '^https://'),
  ubicaciones      text[] not null default '{}',
  provincias       text[] not null default '{}',
  publico          text not null default 'adultos' check (publico in ('adultos', 'todos')),
  desde            date not null default ((now() at time zone 'America/Argentina/Buenos_Aires')::date),
  hasta            date,
  peso             int not null default 1 check (peso between 1 and 100),
  tope_impresiones int check (tope_impresiones is null or tope_impresiones > 0),
  activo           boolean not null default true,
  notas            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  check (hasta is null or hasta >= desde)
);
create index if not exists anuncios_vigentes on public.anuncios (desde, hasta) where activo;

create table if not exists public.anuncios_metricas (
  anuncio_id  uuid not null references public.anuncios (id) on delete cascade,
  dia         date not null,
  impresiones int not null default 0,
  clics       int not null default 0,
  primary key (anuncio_id, dia)
);

create table if not exists public.publicidad_metricas (
  dia       date not null,
  ubicacion text not null,
  proveedor text not null check (proveedor in ('adsense', 'directo')),
  pedidos   int not null default 0,
  llenos    int not null default 0,
  vacios    int not null default 0,
  primary key (dia, ubicacion, proveedor)
);

alter table public.anuncios enable row level security;
alter table public.anuncios_metricas enable row level security;
alter table public.publicidad_metricas enable row level security;
revoke all on public.anuncios, public.anuncios_metricas, public.publicidad_metricas from public, anon, authenticated;

-- Las imágenes de los anuncios directos: públicas para leer, las suben sólo
-- las cuentas del panel (0127).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('anuncios', 'anuncios', true, 1048576, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;
drop policy if exists "anuncios sube equipo" on storage.objects;
create policy "anuncios sube equipo" on storage.objects for insert to authenticated
  with check (bucket_id = 'anuncios' and public.brote_es_admin(auth.uid()));

-- `brote_es_admin` es privada (0127); la política la necesita con permiso.
grant execute on function public.brote_es_admin(uuid) to authenticated;

-- ── Lo que la app lee al abrir ──────────────────────────────────────────────

create or replace function public.publicidad_estado()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'activa', coalesce((select (value #>> '{}')::boolean from app_settings where key = 'ads_enabled'), false),
    'config', coalesce((select value from app_settings where key = 'publicidad_config'), '{}'::jsonb),
    'directos', exists (
      select 1 from anuncios a
       where a.activo
         and a.desde <= (now() at time zone 'America/Argentina/Buenos_Aires')::date
         and (a.hasta is null or a.hasta >= (now() at time zone 'America/Argentina/Buenos_Aires')::date)));
$$;
revoke all on function public.publicidad_estado() from public;
grant execute on function public.publicidad_estado() to anon, authenticated;

-- Un anuncio directo para esta persona y esta ubicación, o nada. Al azar
-- según el peso, entre los vigentes que le corresponden y que no pasaron su
-- tope. No devuelve el destino: el clic pasa por /api/anuncio/<id>.
create or replace function public.anuncio_elegir(p_ubicacion text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid(); p profiles%rowtype; v_hoy date := (now() at time zone 'America/Argentina/Buenos_Aires')::date;
  v jsonb;
begin
  if v_uid is null then return null; end if;
  if not coalesce((select (value #>> '{}')::boolean from app_settings where key = 'ads_enabled'), false) then return null; end if;
  select * into p from profiles where id = v_uid;
  if p.account_type = 'kid' or brote_is_pro(v_uid) then return null; end if;

  select jsonb_build_object('id', a.id, 'anunciante', a.anunciante, 'titulo', a.titulo, 'texto', a.texto,
                            'imagen_url', a.imagen_url, 'cta', a.cta)
    into v
    from anuncios a
   where a.activo
     and a.desde <= v_hoy and (a.hasta is null or a.hasta >= v_hoy)
     and (cardinality(a.ubicaciones) = 0 or p_ubicacion = any(a.ubicaciones))
     and (cardinality(a.provincias) = 0 or p.city = any(a.provincias))
     and (a.publico = 'todos' or p.account_type = 'adult')
     and (a.tope_impresiones is null
          or a.tope_impresiones > coalesce((select sum(m.impresiones) from anuncios_metricas m where m.anuncio_id = a.id), 0))
   -- Sorteo ponderado (Efraimidis–Spirakis): -ln(u)/peso, el menor gana.
   order by -ln(greatest(random(), 1e-9)) / a.peso
   limit 1;
  return v;
end $$;
revoke all on function public.anuncio_elegir(text) from public, anon;
grant execute on function public.anuncio_elegir(text) to authenticated;

-- Lo que reporta la app, en tandas: [{u: ubicacion, p: proveedor, e: evento, a?: anuncio}]
-- e = 'pedido' | 'lleno' | 'vacio' | 'impresion'. Topes por llamada y por hora.
create or replace function public.publicidad_registrar(p_eventos jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid(); v_hoy date := (now() at time zone 'America/Argentina/Buenos_Aires')::date; e jsonb;
  v_ubi text; v_prov text; v_ev text; v_anuncio uuid;
begin
  if v_uid is null or jsonb_typeof(p_eventos) <> 'array' then return; end if;
  if not brote_rate_limit('publicidad:' || v_uid, 120, interval '1 hour') then return; end if;
  for e in select * from jsonb_array_elements(p_eventos) limit 30 loop
    v_ubi := e ->> 'u'; v_prov := e ->> 'p'; v_ev := e ->> 'e';
    continue when v_ubi !~ '^[a-z-]{2,30}$' or v_prov not in ('adsense', 'directo')
               or v_ev not in ('pedido', 'lleno', 'vacio', 'impresion');
    if v_ev = 'impresion' then
      begin
        v_anuncio := (e ->> 'a')::uuid;
      exception when others then
        continue;
      end;
      continue when v_anuncio is null or not exists (select 1 from anuncios where id = v_anuncio);
      insert into anuncios_metricas (anuncio_id, dia, impresiones) values (v_anuncio, v_hoy, 1)
      on conflict (anuncio_id, dia) do update set impresiones = anuncios_metricas.impresiones + 1;
    else
      insert into publicidad_metricas (dia, ubicacion, proveedor, pedidos, llenos, vacios)
      values (v_hoy, v_ubi, v_prov,
              (v_ev = 'pedido')::int, (v_ev = 'lleno')::int, (v_ev = 'vacio')::int)
      on conflict (dia, ubicacion, proveedor) do update set
        pedidos = publicidad_metricas.pedidos + excluded.pedidos,
        llenos  = publicidad_metricas.llenos + excluded.llenos,
        vacios  = publicidad_metricas.vacios + excluded.vacios;
    end if;
  end loop;
exception when others then
  return;  -- la publicidad nunca rompe nada
end $$;
revoke all on function public.publicidad_registrar(jsonb) from public, anon;
grant execute on function public.publicidad_registrar(jsonb) to authenticated;

-- El clic: cuenta y devuelve el destino (sólo de un anuncio vigente).
create or replace function public.anuncio_clic(p_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare v_url text; v_hoy date := (now() at time zone 'America/Argentina/Buenos_Aires')::date;
begin
  select url_destino into v_url from anuncios where id = p_id;
  if v_url is null then return null; end if;
  -- Un visitante no puede inflar los clics de un anuncio: 30 por hora y por origen.
  if brote_rate_limit('anuncio_clic:' || coalesce(auth.uid()::text, 'anon') || ':' || p_id, 30, interval '1 hour') then
    insert into anuncios_metricas (anuncio_id, dia, clics) values (p_id, v_hoy, 1)
    on conflict (anuncio_id, dia) do update set clics = anuncios_metricas.clics + 1;
  end if;
  return v_url;
end $$;
revoke all on function public.anuncio_clic(uuid) from public;
grant execute on function public.anuncio_clic(uuid) to anon, authenticated;

-- ── El panel ────────────────────────────────────────────────────────────────

create or replace function public.admin_publicidad(p_pass text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_hoy date := (now() at time zone 'America/Argentina/Buenos_Aires')::date;
begin
  if not admin_check(p_pass) then return jsonb_build_object('ok', false, 'error', 'Contraseña incorrecta'); end if;
  return jsonb_build_object(
    'ok', true,
    'activa', coalesce((select (value #>> '{}')::boolean from app_settings where key = 'ads_enabled'), false),
    'config', coalesce((select value from app_settings where key = 'publicidad_config'), '{}'::jsonb),
    'metricas', coalesce((select jsonb_agg(x order by x.ubicacion, x.proveedor) from (
        select ubicacion, proveedor,
               sum(pedidos) filter (where dia = v_hoy) as pedidos_hoy,
               sum(pedidos) as pedidos_30d, sum(llenos) as llenos_30d, sum(vacios) as vacios_30d
          from publicidad_metricas where dia > v_hoy - 30
         group by ubicacion, proveedor) x), '[]'::jsonb),
    'serie', coalesce((select jsonb_agg(x order by x.dia) from (
        select dia, sum(pedidos) as pedidos, sum(llenos) as llenos
          from publicidad_metricas where dia > v_hoy - 30 group by dia) x), '[]'::jsonb),
    'anuncios', coalesce((select jsonb_agg(jsonb_build_object(
        'id', a.id, 'nombre', a.nombre, 'anunciante', a.anunciante, 'titulo', a.titulo, 'texto', a.texto,
        'imagen_url', a.imagen_url, 'cta', a.cta, 'url_destino', a.url_destino, 'ubicaciones', a.ubicaciones,
        'provincias', a.provincias, 'publico', a.publico, 'desde', a.desde, 'hasta', a.hasta, 'peso', a.peso,
        'tope_impresiones', a.tope_impresiones, 'activo', a.activo, 'notas', a.notas,
        'vigente', a.activo and a.desde <= v_hoy and (a.hasta is null or a.hasta >= v_hoy),
        'impresiones', coalesce((select sum(impresiones) from anuncios_metricas m where m.anuncio_id = a.id), 0),
        'clics', coalesce((select sum(clics) from anuncios_metricas m where m.anuncio_id = a.id), 0),
        'impresiones_7d', coalesce((select sum(impresiones) from anuncios_metricas m where m.anuncio_id = a.id and m.dia > v_hoy - 7), 0))
      order by a.activo desc, a.created_at desc) from anuncios a), '[]'::jsonb));
end $$;

-- Las reglas se validan acá: un valor fuera de rango no llega a la app.
create or replace function public.admin_publicidad_config(p_pass text, p_activa boolean, p_config jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare k text; u jsonb;
begin
  if not admin_check(p_pass) then return jsonb_build_object('ok', false, 'error', 'Contraseña incorrecta'); end if;
  if p_config is not null then
    if jsonb_typeof(p_config) <> 'object'
       or coalesce((p_config ->> 'por_dia')::int, -1) not between 0 and 50
       or coalesce((p_config ->> 'por_sesion')::int, -1) not between 0 and 20
       or coalesce((p_config ->> 'dias_gracia')::int, -1) not between 0 and 30 then
      return jsonb_build_object('ok', false, 'error', 'Topes fuera de rango: por día 0–50, por sesión 0–20, días de gracia 0–30.');
    end if;
    for k, u in select key, value from jsonb_each(coalesce(p_config -> 'ubicaciones', '{}'::jsonb)) loop
      if k not in ('news-feed', 'news-article', 'ranking-footer', 'catalog-footer', 'guia', 'moment')
         or coalesce(u ->> 'proveedor', 'auto') not in ('auto', 'adsense', 'directo', 'ninguno') then
        return jsonb_build_object('ok', false, 'error', 'Ubicación o proveedor desconocido: ' || k);
      end if;
      -- La tarjeta del "momento" flota sobre la pantalla: las políticas de
      -- AdSense no permiten anuncios de Google en ventanas que la persona no
      -- abrió. Ahí sólo van anuncios directos.
      if k = 'moment' and coalesce(u ->> 'proveedor', 'directo') not in ('directo', 'ninguno') then
        return jsonb_build_object('ok', false, 'error', 'El momento sólo admite anuncios directos (o ninguno): AdSense no permite anuncios flotantes.');
      end if;
    end loop;
    insert into app_settings (key, value) values ('publicidad_config', p_config)
    on conflict (key) do update set value = excluded.value, updated_at = now();
  end if;
  if p_activa is not null then
    insert into app_settings (key, value) values ('ads_enabled', to_jsonb(p_activa))
    on conflict (key) do update set value = excluded.value, updated_at = now();
  end if;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.admin_anuncio_guardar(p_pass text, p_anuncio jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_id uuid := nullif(p_anuncio ->> 'id', '')::uuid;
        v_ubic text[] := coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_anuncio -> 'ubicaciones', '[]'::jsonb)) x), '{}');
        v_prov text[] := coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_anuncio -> 'provincias', '[]'::jsonb)) x), '{}');
begin
  if not admin_check(p_pass) then return jsonb_build_object('ok', false, 'error', 'Contraseña incorrecta'); end if;
  if exists (select 1 from unnest(v_ubic) x where x not in ('news-feed', 'news-article', 'ranking-footer', 'catalog-footer', 'guia', 'moment')) then
    return jsonb_build_object('ok', false, 'error', 'Ubicación desconocida.');
  end if;
  if v_id is null then
    insert into anuncios (nombre, anunciante, titulo, texto, imagen_url, cta, url_destino, ubicaciones, provincias,
                          publico, desde, hasta, peso, tope_impresiones, activo, notas)
    values (p_anuncio ->> 'nombre', p_anuncio ->> 'anunciante', p_anuncio ->> 'titulo', nullif(p_anuncio ->> 'texto', ''),
            nullif(p_anuncio ->> 'imagen_url', ''), coalesce(nullif(p_anuncio ->> 'cta', ''), 'Conocer más'),
            p_anuncio ->> 'url_destino', v_ubic, v_prov, coalesce(p_anuncio ->> 'publico', 'adultos'),
            coalesce((p_anuncio ->> 'desde')::date, (now() at time zone 'America/Argentina/Buenos_Aires')::date),
            nullif(p_anuncio ->> 'hasta', '')::date, coalesce((p_anuncio ->> 'peso')::int, 1),
            nullif(p_anuncio ->> 'tope_impresiones', '')::int, coalesce((p_anuncio ->> 'activo')::boolean, true),
            nullif(p_anuncio ->> 'notas', ''))
    returning id into v_id;
  else
    update anuncios set
      nombre = p_anuncio ->> 'nombre', anunciante = p_anuncio ->> 'anunciante', titulo = p_anuncio ->> 'titulo',
      texto = nullif(p_anuncio ->> 'texto', ''), imagen_url = nullif(p_anuncio ->> 'imagen_url', ''),
      cta = coalesce(nullif(p_anuncio ->> 'cta', ''), 'Conocer más'), url_destino = p_anuncio ->> 'url_destino',
      ubicaciones = v_ubic, provincias = v_prov, publico = coalesce(p_anuncio ->> 'publico', 'adultos'),
      desde = coalesce((p_anuncio ->> 'desde')::date, desde), hasta = nullif(p_anuncio ->> 'hasta', '')::date,
      peso = coalesce((p_anuncio ->> 'peso')::int, peso), tope_impresiones = nullif(p_anuncio ->> 'tope_impresiones', '')::int,
      activo = coalesce((p_anuncio ->> 'activo')::boolean, activo), notas = nullif(p_anuncio ->> 'notas', ''),
      updated_at = now()
    where id = v_id;
  end if;
  return jsonb_build_object('ok', true, 'id', v_id);
exception
  when check_violation then
    return jsonb_build_object('ok', false, 'error', 'Revisá los campos: título (3–70), texto (hasta 160), botón (2–24), enlace e imagen con https://, fechas en orden.');
  when invalid_datetime_format or invalid_text_representation then
    return jsonb_build_object('ok', false, 'error', 'Alguna fecha o número no es válido.');
end $$;

revoke all on function public.admin_publicidad(text) from public, anon;
revoke all on function public.admin_publicidad_config(text, boolean, jsonb) from public, anon;
revoke all on function public.admin_anuncio_guardar(text, jsonb) from public, anon;
grant execute on function public.admin_publicidad(text) to authenticated;
grant execute on function public.admin_publicidad_config(text, boolean, jsonb) to authenticated;
grant execute on function public.admin_anuncio_guardar(text, jsonb) to authenticated;

-- Limpieza: métricas de más de 400 días (se suma a la limpieza diaria de 0128).
create or replace function public.brote_publicidad_limpieza()
returns void
language sql
security definer
set search_path = public
as $$
  delete from publicidad_metricas where dia < (now() at time zone 'America/Argentina/Buenos_Aires')::date - 400;
$$;
revoke all on function public.brote_publicidad_limpieza() from public, anon, authenticated;
select cron.unschedule('brote-publicidad-limpieza') where exists (select 1 from cron.job where jobname = 'brote-publicidad-limpieza');
select cron.schedule('brote-publicidad-limpieza', '50 4 * * *', $$select public.brote_publicidad_limpieza()$$);
