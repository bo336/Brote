-- Brote — 0113 — El Mercado, segunda versión: el lado de quien compra.
--
-- QUÉ CAMBIA Y POR QUÉ. El Mercado de 0107 era un catálogo de una sola
-- pantalla: una grilla con filtros, pensada para decenas de listados. Esto lo
-- lleva a una arquitectura que aguanta miles, para públicos distintos:
--
--   · búsqueda de texto (español, con prefijos y tolerancia a errores de tipeo),
--     facetas con conteo, orden por precio de referencia, novedad y nivel;
--   · una taxonomía de dos niveles (12 categorías, ~65 subcategorías);
--   · estado del producto (nuevo, usado, reacondicionado), que el reuso necesita;
--   · un inicio con estantes que salen de lo que la persona HACE en Brote —las
--     acciones que completó, lo que estudia en la Academia, lo que guardó, lo
--     que miró, dónde vive—, no de un perfil comercial;
--   · guardados, tiendas que se siguen, lo visto hace poco y preguntas públicas
--     a quien vende;
--   · avisos que valen la pena: bajó el precio de referencia de algo que
--     guardaste, te respondieron, una tienda que seguís publicó algo.
--
-- LO QUE NO CAMBIA. El nivel es de la afirmación, nunca del producto ni de la
-- tienda. Toda salida pasa por el interstitial y queda registrada. Kid no ve
-- nada; teen no ve precios ni categorías sensibles. Todo se lee por RPC y la
-- escritura también. El plan de quien vende no entra en el orden: nada de esta
-- migración suma un término de plan al puntaje.
--
-- LO QUE NO HACE, A PROPÓSITO. No inventa urgencia ni escasez ("quedan 2",
-- "12 personas mirando"). Lo que se muestra es cierto: cuántas personas
-- guardaron un producto, si el precio de referencia bajó y desde cuándo.
--
-- Una afirmación ambiental deja de ser obligatoria en cada listado: el
-- compromiso ambiental se verifica en la TIENDA (0114). Un listado sin
-- afirmaciones tiene nivel `e0` y no lleva badge; el validador sigue sin dejar
-- escribir "ecológico" u "orgánico" sin la afirmación tipificada que lo
-- respalde, así que no se abre ninguna puerta al greenwashing.

-- ── 1. Taxonomía ────────────────────────────────────────────────────────────
-- ESPEJO de `lib/mercado/categorias.ts` (`SUBCATEGORIAS`): un test compara las
-- dos listas leyendo este archivo.

create or replace function brote_mercado_subcategorias()
returns jsonb language sql immutable set search_path = public as $fn$
  select '{
    "alimentos-frescos": ["frutas-y-verduras","bolsones","panaderia","lacteos-y-quesos","carnes-y-huevos","conservas-y-dulces"],
    "almacen-granel": ["legumbres-y-cereales","harinas","frutos-secos-y-semillas","yerba-cafe-y-te","especias","aceites-y-vinagres"],
    "bebidas": ["jugos-y-aguas","vinos","cervezas","fermentados"],
    "limpieza-hogar": ["detergentes","jabon-para-ropa","limpiadores","recargas","esponjas-y-utensilios"],
    "cuidado-personal": ["solidos","cosmetica","higiene-bucal","higiene-menstrual","desodorantes","bebes"],
    "indumentaria": ["ropa","calzado","accesorios","ninos","segunda-mano"],
    "hogar-y-deco": ["muebles","textiles","cocina","iluminacion","decoracion"],
    "jardin-y-huerta": ["semillas-y-plantines","sustratos-y-compost","composteras","macetas-y-herramientas","riego"],
    "mascotas": ["alimento","accesorios","higiene","juguetes"],
    "movilidad": ["bicicletas","repuestos-y-service","electrica","accesorios","alquiler"],
    "servicios-profesionales": ["consultoria","talleres-y-cursos","diseno","instalaciones","eventos"],
    "reparacion-y-reuso": ["electronica","electrodomesticos","costura","muebles","reacondicionados"]
  }'::jsonb;
$fn$;

create or replace function brote_mercado_subcategoria_valida(p_categoria text, p_sub text)
returns boolean language sql immutable set search_path = public as $fn$
  select p_sub is null
      or coalesce(brote_mercado_subcategorias() -> p_categoria ? p_sub, false);
$fn$;

-- ── 2. Listados: columnas nuevas ────────────────────────────────────────────

alter table listings add column if not exists subcategoria text;
alter table listings add column if not exists condicion text not null default 'nuevo';
alter table listings add column if not exists contacto text not null default 'web';
alter table listings add column if not exists favoritos int not null default 0;
alter table listings add column if not exists precio_anterior numeric;
alter table listings add column if not exists precio_cambio_at timestamptz;

do $$ begin
  alter table listings add constraint listings_condicion check (condicion in ('nuevo','usado','reacondicionado'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table listings add constraint listings_contacto check (contacto in ('web','whatsapp','instagram'));
exception when duplicate_object then null; end $$;

-- La búsqueda. `to_tsvector` con una configuración fija y `unaccent_safe` son
-- inmutables, así que puede ser una columna generada: nunca se desincroniza
-- del texto. Título pesa más que subcategoría, y ésta más que la descripción.
do $$ begin
  alter table listings add column busqueda tsvector generated always as (
    setweight(to_tsvector('spanish', unaccent_safe(coalesce(titulo, ''))), 'A') ||
    setweight(to_tsvector('spanish', unaccent_safe(replace(coalesce(subcategoria, ''), '-', ' '))), 'B') ||
    setweight(to_tsvector('spanish', unaccent_safe(coalesce(descripcion, ''))), 'C')) stored;
exception when duplicate_column then null; end $$;

create index if not exists idx_listings_busqueda on listings using gin (busqueda);
create index if not exists idx_listings_titulo_trgm on listings
  using gin ((lower(unaccent_safe(titulo))) extensions.gin_trgm_ops) where status = 'publicado';
create index if not exists idx_listings_pub_cat on listings (categoria, subcategoria, score desc)
  where status = 'publicado';
create index if not exists idx_listings_pub_nuevos on listings (publicado_at desc) where status = 'publicado';
create index if not exists idx_listings_pub_precio on listings (precio_referencia) where status = 'publicado';
create index if not exists idx_businesses_nombre_trgm on businesses
  using gin ((lower(unaccent_safe(nombre_comercial))) extensions.gin_trgm_ops) where status = 'approved';

-- ── 2b. Tiendas: lo que el alta nueva necesita guardar ──────────────────────
-- (Las RPC del alta están en 0114; acá va solo el esquema, porque la ficha y
-- el inicio de esta migración ya lo leen.)
--
-- `modelo`: 'vendedor' es el alta abierta de 0114 (cualquier persona adulta,
-- compromiso verificado, suscripción por Mercado Pago). 'legacy' es lo que se
-- dio de alta con el flujo de empresas de 0105 —hoy, solo los comercios de
-- demostración—, que conserva sus reglas.

alter table businesses add column if not exists modelo text not null default 'vendedor';
alter table businesses add column if not exists tipo_vendedor text not null default 'persona';
alter table businesses add column if not exists categoria_principal text;
alter table businesses add column if not exists contacto_preferido text;
alter table businesses add column if not exists prueba_verde_at timestamptz;
alter table businesses add column if not exists mp_user_id text;
alter table businesses add column if not exists mp_nickname text;
alter table businesses add column if not exists mp_email text;
alter table businesses add column if not exists mp_vinculado_at timestamptz;
alter table businesses add column if not exists mp_datos jsonb;
alter table businesses add column if not exists activa_at timestamptz;

do $$ begin
  alter table businesses add constraint businesses_modelo check (modelo in ('vendedor','legacy'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table businesses add constraint businesses_tipo_vendedor check (tipo_vendedor in ('persona','empresa'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table businesses add constraint businesses_contacto check (contacto_preferido in ('whatsapp','web','instagram'));
exception when duplicate_object then null; end $$;

create index if not exists idx_businesses_mp on businesses (mp_user_id) where mp_user_id is not null;

-- Lo dado de alta con el flujo anterior conserva sus reglas.
update businesses set modelo = 'legacy' where modelo = 'vendedor' and slug like 'demo-%';

-- Las prácticas que una tienda puede comprometer. ESPEJO de
-- `lib/mercado/practicas.ts`: un test compara las dos listas.
create or replace function brote_practicas()
returns text[] language sql immutable set search_path = public as $fn$
  select array[
    'envio-sin-plastico','recibe-envases','materia-prima-local','produccion-a-pedido',
    'repara-o-da-repuestos','vende-usado','energia-renovable','separa-residuos',
    'materiales-recuperados','ingredientes-publicos','agroecologico','granel-o-recarga',
    'de-estacion','entrega-sin-emisiones','precio-justo','hecho-para-durar',
    'alquila-o-presta','packaging-compostable','cuida-el-agua','dona-excedentes'];
$fn$;

-- El compromiso de una tienda: prácticas concretas que ya hace. Una al menos
-- con foto. Se publican como lo que son —"declarado por la tienda, con foto"—
-- hasta que alguien de Brote mira la foto ("revisado"). Nunca es un nivel: los
-- niveles son de las afirmaciones de un producto.
create table if not exists tienda_compromisos (
  business_id  uuid not null references businesses(id) on delete cascade,
  practica     text not null,
  estado       text not null default 'declarado' check (estado in ('declarado','revisado','rechazado')),
  foto_path    text,
  nota         text,
  revisado_por uuid references profiles(id) on delete set null,
  revisado_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  primary key (business_id, practica)
);
create index if not exists idx_tcomp_revision on tienda_compromisos (created_at) where estado = 'declarado' and foto_path is not null;
alter table tienda_compromisos enable row level security;
revoke all on tienda_compromisos from anon, authenticated;

create or replace function brote_tienda_compromisos_publicos(p_business uuid)
returns jsonb language sql stable security definer set search_path = public as $fn$
  select coalesce(jsonb_agg(jsonb_build_object(
      'practica', c.practica, 'foto', c.foto_path, 'revisado', c.estado = 'revisado')
    order by (c.estado = 'revisado') desc, (c.foto_path is not null) desc, c.created_at), '[]'::jsonb)
    from tienda_compromisos c where c.business_id = p_business and c.estado <> 'rechazado';
$fn$;

-- ── 3. Lo que hace cada persona en el Mercado ───────────────────────────────
-- Todo privado: sin policies de lectura, se lee y se escribe por RPC. Ninguna
-- tienda ve quién guardó, quién la sigue ni quién miró: solo cuántos.

create table if not exists mercado_favoritos (
  user_id     uuid not null references profiles(id) on delete cascade,
  listing_id  uuid not null references listings(id) on delete cascade,
  -- El precio de referencia cuando se guardó: así "bajó desde que lo
  -- guardaste" es un dato y no una impresión.
  precio_al_guardar numeric,
  created_at  timestamptz not null default now(),
  primary key (user_id, listing_id)
);
create index if not exists idx_mfav_listing on mercado_favoritos (listing_id);
create index if not exists idx_mfav_user on mercado_favoritos (user_id, created_at desc);

create table if not exists mercado_seguidos (
  user_id     uuid not null references profiles(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, business_id)
);
create index if not exists idx_mseg_business on mercado_seguidos (business_id);

-- Lo visto hace poco: una fila por persona y listado, 120 días (el job diario
-- borra lo viejo). Alimenta "Seguí viendo" y el "Para vos".
create table if not exists mercado_vistos (
  user_id     uuid not null references profiles(id) on delete cascade,
  listing_id  uuid not null references listings(id) on delete cascade,
  visto_at    timestamptz not null default now(),
  veces       int not null default 1,
  primary key (user_id, listing_id)
);
create index if not exists idx_mvis_user on mercado_vistos (user_id, visto_at desc);
create index if not exists idx_mvis_viejos on mercado_vistos (visto_at);

-- Preguntas públicas a quien vende. La respuesta es pública; quién preguntó,
-- no (se muestra "Una persona de Brote").
create table if not exists listing_preguntas (
  id            uuid primary key default gen_random_uuid(),
  listing_id    uuid not null references listings(id) on delete cascade,
  business_id   uuid not null references businesses(id) on delete cascade,
  user_id       uuid references profiles(id) on delete set null,
  texto         text not null check (char_length(texto) between 5 and 300),
  respuesta     text check (char_length(respuesta) <= 1000),
  respondida_at timestamptz,
  respondida_por uuid references profiles(id) on delete set null,
  estado        text not null default 'visible' check (estado in ('visible','oculta')),
  created_at    timestamptz not null default now()
);
create index if not exists idx_lpreg_listing on listing_preguntas (listing_id, created_at desc);
create index if not exists idx_lpreg_business on listing_preguntas (business_id, respondida_at nulls first, created_at desc);
create index if not exists idx_lpreg_user on listing_preguntas (user_id);

alter table mercado_favoritos  enable row level security;
alter table mercado_seguidos   enable row level security;
alter table mercado_vistos     enable row level security;
alter table listing_preguntas  enable row level security;
revoke all on mercado_favoritos, mercado_seguidos, mercado_vistos, listing_preguntas from anon, authenticated;

-- ── 4. Utilidades ───────────────────────────────────────────────────────────

-- Codificación de URL (RFC 3986), para el mensaje prearmado de WhatsApp.
create or replace function brote_urlencode(p text)
returns text language plpgsql immutable set search_path = public as $fn$
declare r text := ''; c text; b bytea; i int;
begin
  for c in select regexp_split_to_table(coalesce(p, ''), '') loop
    if c ~ '^[A-Za-z0-9._~-]$' then
      r := r || c;
    else
      b := convert_to(c, 'UTF8');
      for i in 0 .. length(b) - 1 loop
        r := r || '%' || upper(lpad(to_hex(get_byte(b, i)), 2, '0'));
      end loop;
    end if;
  end loop;
  return r;
end $fn$;

-- Lo que se busca, normalizado: minúsculas, sin acentos, solo letras y
-- números, como máximo 80 caracteres.
create or replace function brote_mercado_normalizar(p text)
returns text language sql immutable set search_path = public as $fn$
  select nullif(trim(regexp_replace(lower(unaccent_safe(left(coalesce(p, ''), 80))), '[^a-z0-9]+', ' ', 'g')), '');
$fn$;

-- La consulta de texto: cada palabra con prefijo ("jab" encuentra "jabón"),
-- todas obligatorias. Construida con palabras ya saneadas, así que nunca es
-- una consulta con sintaxis inválida.
create or replace function brote_mercado_tsquery(p_norm text)
returns tsquery language sql immutable set search_path = public as $fn$
  select case when p_norm is null then null else
    to_tsquery('spanish', (select string_agg(w || ':*', ' & ')
                             from regexp_split_to_table(p_norm, '\s+') w
                            where length(w) >= 1))
  end;
$fn$;

-- La tarjeta, versión 2: suma subcategoría, estado, cuántas personas lo
-- guardaron y el precio de referencia anterior SOLO si bajó en los últimos 30
-- días (un "antes" de hace un año no dice nada).
create or replace function brote_listado_tarjeta(l listings, b businesses, p_precios boolean)
returns jsonb language sql stable security definer set search_path = public as $fn$
  select jsonb_build_object(
    'id', l.id, 'slug', l.slug, 'titulo', l.titulo, 'tipo', l.tipo,
    'imagen', l.imagenes[1], 'imagenes_n', cardinality(l.imagenes),
    'categoria', l.categoria, 'subcategoria', l.subcategoria, 'dominios', to_jsonb(l.dominios),
    'precio', case when p_precios then l.precio_referencia else null end,
    'precio_anterior', case when p_precios and l.precio_anterior > l.precio_referencia
                             and l.precio_cambio_at > now() - interval '30 days'
                            then l.precio_anterior else null end,
    'moneda', l.moneda, 'tier', l.tier_efectivo, 'score', l.score,
    'disponibilidad', l.disponibilidad, 'zonas', to_jsonb(l.zonas), 'condicion', l.condicion,
    'tiene_precio', l.precio_referencia is not null,
    'descripcion_largo', length(l.descripcion),
    'favoritos', l.favoritos,
    'publicado_at', l.publicado_at,
    'updated_at', l.updated_at,
    'negocio', jsonb_build_object('id', b.id, 'slug', b.slug, 'nombre', b.nombre_comercial,
                                  'logo', b.logo_url, 'tier', b.tier,
                                  'provincia', b.provincia, 'ciudad', b.ciudad));
$fn$;
create or replace function brote_listado_tarjeta(l listings, b businesses)
returns jsonb language sql stable security definer set search_path = public as $fn$
  select brote_listado_tarjeta(l, b, brote_mercado_ve_precios());
$fn$;

-- ── 5. Buscar ───────────────────────────────────────────────────────────────
-- Una llamada devuelve la página, el total (hasta 1000: "más de 1000" no
-- necesita un número exacto) y las facetas. Las facetas de categoría ignoran
-- el filtro de categoría —para ver cuántos hay en las otras— y las de estado
-- ignoran el de estado; el resto se aplica a todo.
--
-- Por offset y no por cursor: con relevancia de texto no hay un cursor estable,
-- y 40 páginas de 24 alcanzan (nadie llega a la 41: afina la búsqueda).
--
-- Quién mira se resuelve UNA vez (la lección de 0109: un definer por fila
-- convierte 6 ms en 750).

create or replace function mercado_buscar(
  p_q            text default null,
  p_categoria    text default null,
  p_subcategoria text default null,
  p_tier_min     evidence_tier default 'e0',
  p_zona         text default null,
  p_modalidad    text default null,
  p_condicion    text default null,
  p_precio_min   numeric default null,
  p_precio_max   numeric default null,
  p_orden        text default null,
  p_negocio      uuid default null,
  p_offset       int default 0,
  p_limit        int default 24)
returns jsonb language plpgsql stable security definer
set search_path = public, extensions set pg_trgm.word_similarity_threshold = 0.4 as $fn$
declare
  v_uid uuid := (select auth.uid());
  v_cuenta text; v_precios boolean; v_sens text[];
  v_norm text; v_tsq tsquery; v_orden text; v_limit int; v_offset int;
  v_pmin numeric; v_pmax numeric; v_out jsonb;
begin
  v_cuenta := coalesce(brote_account_type(v_uid), 'adult');
  if v_cuenta = 'kid' then
    return jsonb_build_object('items', '[]'::jsonb, 'total', 0, 'facetas', '{}'::jsonb);
  end if;
  v_precios := v_cuenta = 'adult';
  v_sens := case when v_cuenta = 'teen' then brote_mercado_sensibles() else array[]::text[] end;
  v_norm := brote_mercado_normalizar(p_q);
  v_tsq := brote_mercado_tsquery(v_norm);
  v_limit := least(greatest(coalesce(p_limit, 24), 1), 48);
  v_offset := least(greatest(coalesce(p_offset, 0), 0), 960);
  -- Un teen no ve precios: tampoco filtra ni ordena por ellos.
  v_pmin := case when v_precios then p_precio_min end;
  v_pmax := case when v_precios then p_precio_max end;
  v_orden := coalesce(nullif(p_orden, ''), case when v_norm is null then 'recomendados' else 'relevancia' end);
  if not v_precios and v_orden in ('precio_asc','precio_desc') then v_orden := 'recomendados'; end if;
  if v_norm is null and v_orden = 'relevancia' then v_orden := 'recomendados'; end if;

  with base as materialized (
    select l, b,
           case when v_tsq is null then 0
                else ts_rank_cd(l.busqueda, v_tsq)
                   + 0.3 * word_similarity(v_norm, lower(unaccent_safe(l.titulo))) end as rk
      from listings l
      join businesses b on b.id = l.business_id and b.status = 'approved'
     where l.status = 'publicado'
       and (cardinality(v_sens) = 0 or not (l.categoria = any(v_sens)))
       and (p_negocio is null or l.business_id = p_negocio)
       and l.tier_efectivo >= coalesce(p_tier_min, 'e0')
       and (p_modalidad is null
            or (p_modalidad = 'online' and l.disponibilidad in ('online','ambas'))
            or (p_modalidad = 'local' and l.disponibilidad in ('local','ambas')))
       and (p_zona is null or l.disponibilidad in ('online','ambas') or p_zona = any(l.zonas) or b.provincia = p_zona)
       and (v_pmin is null or l.precio_referencia >= v_pmin)
       and (v_pmax is null or l.precio_referencia <= v_pmax)
       and (v_tsq is null
            or l.busqueda @@ v_tsq
            or v_norm <% lower(unaccent_safe(l.titulo))
            or v_norm <% lower(unaccent_safe(b.nombre_comercial)))
  ),
  filtrado as (
    select * from base
     where (p_categoria is null or (base.l).categoria = p_categoria)
       and (p_subcategoria is null or (base.l).subcategoria = p_subcategoria)
       and (p_condicion is null or (base.l).condicion = p_condicion)
  ),
  pagina as (
    select * from (
      select f.l, f.b, row_number() over (order by
               case when v_orden = 'relevancia' then f.rk end desc nulls last,
               case when v_orden = 'nivel' then (f.l).tier_efectivo end desc nulls last,
               case when v_orden = 'precio_asc' then (f.l).precio_referencia end asc nulls last,
               case when v_orden = 'precio_desc' then (f.l).precio_referencia end desc nulls last,
               case when v_orden = 'nuevos' then (f.l).publicado_at end desc nulls last,
               (f.l).score desc, (f.l).id desc) as n
        from filtrado f) z
     where z.n > v_offset and z.n <= v_offset + v_limit
  )
  select jsonb_build_object(
    'items', coalesce((select jsonb_agg(brote_listado_tarjeta(p.l, p.b, v_precios) order by p.n) from pagina p), '[]'::jsonb),
    'total', (select count(*) from (select 1 from filtrado limit 1001) x),
    'offset', v_offset,
    'orden', v_orden,
    'facetas', jsonb_build_object(
      'categorias', coalesce((
        select jsonb_object_agg(c, n) from (
          select (base.l).categoria c, count(*) n from base
           where p_condicion is null or (base.l).condicion = p_condicion
           group by 1) x), '{}'::jsonb),
      'subcategorias', case when p_categoria is null then '{}'::jsonb else coalesce((
        select jsonb_object_agg(s, n) from (
          select coalesce((base.l).subcategoria, '_') s, count(*) n from base
           where (base.l).categoria = p_categoria
             and (p_condicion is null or (base.l).condicion = p_condicion)
           group by 1) x), '{}'::jsonb) end,
      'condicion', coalesce((
        select jsonb_object_agg(c, n) from (
          select (base.l).condicion c, count(*) n from base
           where (p_categoria is null or (base.l).categoria = p_categoria)
             and (p_subcategoria is null or (base.l).subcategoria = p_subcategoria)
           group by 1) x), '{}'::jsonb)))
  into v_out;

  return v_out;
end $fn$;

-- Autocompletar: títulos que empiezan o se parecen, categorías cuyo nombre
-- coincide (lo resuelve la pantalla con la taxonomía) y tiendas por nombre.
create or replace function mercado_sugerencias(p_q text)
returns jsonb language plpgsql stable security definer
set search_path = public, extensions set pg_trgm.word_similarity_threshold = 0.4 as $fn$
declare
  v_uid uuid := (select auth.uid()); v_cuenta text; v_sens text[]; v_norm text; v_tsq tsquery;
begin
  v_cuenta := coalesce(brote_account_type(v_uid), 'adult');
  v_norm := brote_mercado_normalizar(p_q);
  if v_cuenta = 'kid' or v_norm is null or length(v_norm) < 2 then
    return jsonb_build_object('productos', '[]'::jsonb, 'tiendas', '[]'::jsonb);
  end if;
  v_sens := case when v_cuenta = 'teen' then brote_mercado_sensibles() else array[]::text[] end;
  v_tsq := brote_mercado_tsquery(v_norm);

  return jsonb_build_object(
    'productos', coalesce((
      select jsonb_agg(jsonb_build_object('slug', x.slug, 'titulo', x.titulo, 'imagen', x.imagen,
                                          'categoria', x.categoria) order by x.rk desc)
        from (
          select l.slug, l.titulo, l.imagenes[1] as imagen, l.categoria,
                 ts_rank_cd(l.busqueda, v_tsq) + word_similarity(v_norm, lower(unaccent_safe(l.titulo)))
                 + l.score / 1000.0 as rk
            from listings l join businesses b on b.id = l.business_id and b.status = 'approved'
           where l.status = 'publicado'
             and (cardinality(v_sens) = 0 or not (l.categoria = any(v_sens)))
             and (l.busqueda @@ v_tsq or v_norm <% lower(unaccent_safe(l.titulo)))
           order by rk desc limit 6) x), '[]'::jsonb),
    'tiendas', coalesce((
      select jsonb_agg(jsonb_build_object('slug', b.slug, 'nombre', b.nombre_comercial, 'logo', b.logo_url))
        from (select * from businesses b
               where b.status = 'approved'
                 and (v_norm <% lower(unaccent_safe(b.nombre_comercial))
                      or lower(unaccent_safe(b.nombre_comercial)) like v_norm || '%')
                 and exists (select 1 from listings l where l.business_id = b.id and l.status = 'publicado')
               order by word_similarity(v_norm, lower(unaccent_safe(b.nombre_comercial))) desc
               limit 3) b), '[]'::jsonb));
end $fn$;

-- ── 6. El inicio del Mercado ────────────────────────────────────────────────
-- Una sola llamada con todos los estantes. Cada estante aparece solo si tiene
-- con qué llenarse (4 productos; "Seguí viendo", 2): un estante con uno solo
-- se lee como un error, y rellenarlo con cualquier cosa, como publicidad.
--
-- De dónde sale lo personal, y nada más que de acá:
--   · los intereses del perfil (dominios de Brote);
--   · la última acción completada que tiene un puente al Mercado (30 días);
--   · la rama de la Academia donde estudió más recientemente (60 días);
--   · las categorías de lo que guardó y de lo que miró;
--   · su provincia.
-- Comprar no suma nada en Brote, y mirar tampoco.

create or replace function mercado_inicio()
returns jsonb language plpgsql stable security definer set search_path = public as $fn$
declare
  v_uid uuid := (select auth.uid());
  v_cuenta text; v_precios boolean; v_sens text[];
  v_intereses text[]; v_prov text; v_cats text[];
  v_acc_titulo text; v_acc_slug text; v_acc_cat text; v_rama text;
  v_favs uuid[]; v_seguidas uuid[];
  v_estantes jsonb := '[]'::jsonb; v_items jsonb;
begin
  v_cuenta := coalesce(brote_account_type(v_uid), 'adult');
  if v_cuenta = 'kid' then return null; end if;
  v_precios := v_cuenta = 'adult';
  v_sens := case when v_cuenta = 'teen' then brote_mercado_sensibles() else array[]::text[] end;

  select coalesce(p.interests, '{}'), p.city into v_intereses, v_prov from profiles p where p.id = v_uid;
  if not (v_prov = any(brote_provincias())) then v_prov := null; end if;

  select coalesce(array_agg(listing_id), '{}') into v_favs from mercado_favoritos where user_id = v_uid;
  select coalesce(array_agg(business_id), '{}') into v_seguidas from mercado_seguidos where user_id = v_uid;

  -- Categorías de lo guardado y lo visto hace poco, las más frecuentes.
  select coalesce(array_agg(c order by n desc), '{}') into v_cats from (
    select l.categoria c, count(*) n
      from (select listing_id from mercado_favoritos where user_id = v_uid
            union all
            select listing_id from (select listing_id from mercado_vistos where user_id = v_uid
                                     order by visto_at desc limit 30) v) x
      join listings l on l.id = x.listing_id
     group by 1 order by 2 desc limit 4) y;

  select a.title_es, a.slug, h.categoria into v_acc_titulo, v_acc_slug, v_acc_cat
    from activity_completions c
    join activities a on a.id = c.activity_id
    join activity_market_hints h on h.activity_id = a.id and h.activo
   where c.user_id = v_uid and c.completed_at > now() - interval '30 days'
     and not (h.categoria = any(v_sens))
   order by c.completed_at desc limit 1;

  select u.rama_slug into v_rama
    from ac_user_leccion ul
    join ac_lecciones le on le.id = ul.leccion_id
    join ac_unidades u on u.id = le.unidad_id
   where ul.user_id = v_uid and u.rama_slug <> 'tronco'
     and ul.updated_at > now() - interval '60 days'
   order by ul.updated_at desc limit 1;

  -- Seguí viendo
  select jsonb_agg(t order by visto_at desc) into v_items from (
    select brote_listado_tarjeta(l, b, v_precios) || jsonb_build_object('favorito', l.id = any(v_favs)) t, v.visto_at
      from mercado_vistos v
      join listings l on l.id = v.listing_id and l.status = 'publicado'
      join businesses b on b.id = l.business_id and b.status = 'approved'
     where v.user_id = v_uid and not (l.categoria = any(v_sens))
     order by v.visto_at desc limit 12) x;
  if jsonb_array_length(coalesce(v_items, '[]')) >= 2 then
    v_estantes := v_estantes || jsonb_build_array(jsonb_build_object('clave', 'seguir_viendo', 'items', v_items));
  end if;

  -- Para vos: el puntaje de siempre, más lo que le importa a esta persona.
  -- Máximo dos por tienda, para que no sea la vidriera de una sola.
  select jsonb_agg(t order by ps desc) into v_items from (
    select t, ps from (
      select brote_listado_tarjeta(l, b, v_precios) || jsonb_build_object('favorito', l.id = any(v_favs)) t,
             l.score
             + case when l.dominios && v_intereses then 25 else 0 end
             + case when l.categoria = any(v_cats) then 20 else 0 end
             + case when v_prov is not null and (b.provincia = v_prov or v_prov = any(l.zonas)) then 10 else 0 end
             + case when l.business_id = any(v_seguidas) then 10 else 0 end as ps,
             row_number() over (partition by l.business_id order by l.score desc) as rn
        from listings l join businesses b on b.id = l.business_id and b.status = 'approved'
       where l.status = 'publicado' and not (l.categoria = any(v_sens))
         and not (l.id = any(v_favs))) z
     where rn <= 2 order by ps desc limit 12) x;
  if jsonb_array_length(coalesce(v_items, '[]')) >= 4 then
    v_estantes := v_estantes || jsonb_build_array(jsonb_build_object('clave', 'para_vos', 'items', v_items));
  end if;

  -- Porque hiciste una acción
  if v_acc_cat is not null then
    select jsonb_agg(t order by s desc) into v_items from (
      select brote_listado_tarjeta(l, b, v_precios) || jsonb_build_object('favorito', l.id = any(v_favs)) t, l.score s
        from listings l join businesses b on b.id = l.business_id and b.status = 'approved'
       where l.status = 'publicado' and l.categoria = v_acc_cat
       order by l.score desc limit 12) x;
    if jsonb_array_length(coalesce(v_items, '[]')) >= 4 then
      v_estantes := v_estantes || jsonb_build_array(jsonb_build_object(
        'clave', 'porque_hiciste', 'param', v_acc_titulo, 'accion', v_acc_slug,
        'categoria', v_acc_cat, 'items', v_items));
    end if;
  end if;

  -- Lo que estás aprendiendo
  if v_rama is not null then
    select jsonb_agg(t order by s desc) into v_items from (
      select brote_listado_tarjeta(l, b, v_precios) || jsonb_build_object('favorito', l.id = any(v_favs)) t, l.score s
        from listings l join businesses b on b.id = l.business_id and b.status = 'approved'
       where l.status = 'publicado' and v_rama = any(l.dominios) and not (l.categoria = any(v_sens))
       order by l.score desc limit 12) x;
    if jsonb_array_length(coalesce(v_items, '[]')) >= 4 then
      v_estantes := v_estantes || jsonb_build_array(jsonb_build_object(
        'clave', 'aprendiendo', 'param', v_rama, 'items', v_items));
    end if;
  end if;

  -- Cerca tuyo: se puede ir a buscar o lo traen a la provincia.
  if v_prov is not null then
    select jsonb_agg(t order by s desc) into v_items from (
      select brote_listado_tarjeta(l, b, v_precios) || jsonb_build_object('favorito', l.id = any(v_favs)) t, l.score s
        from listings l join businesses b on b.id = l.business_id and b.status = 'approved'
       where l.status = 'publicado' and not (l.categoria = any(v_sens))
         and l.disponibilidad in ('local','ambas')
         and (b.provincia = v_prov or v_prov = any(l.zonas))
       order by l.score desc limit 12) x;
    if jsonb_array_length(coalesce(v_items, '[]')) >= 4 then
      v_estantes := v_estantes || jsonb_build_array(jsonb_build_object('clave', 'cerca', 'param', v_prov, 'items', v_items));
    end if;
  end if;

  -- Bajó el precio de referencia (solo adultos: un teen no ve precios)
  if v_precios then
    select jsonb_agg(t order by c desc) into v_items from (
      select brote_listado_tarjeta(l, b, true) || jsonb_build_object('favorito', l.id = any(v_favs)) t, l.precio_cambio_at c
        from listings l join businesses b on b.id = l.business_id and b.status = 'approved'
       where l.status = 'publicado' and l.precio_anterior > l.precio_referencia
         and l.precio_cambio_at > now() - interval '30 days'
       order by l.precio_cambio_at desc limit 12) x;
    if jsonb_array_length(coalesce(v_items, '[]')) >= 4 then
      v_estantes := v_estantes || jsonb_build_array(jsonb_build_object('clave', 'bajaron', 'items', v_items));
    end if;
  end if;

  -- Nuevos
  select jsonb_agg(t order by p desc) into v_items from (
    select brote_listado_tarjeta(l, b, v_precios) || jsonb_build_object('favorito', l.id = any(v_favs)) t, l.publicado_at p
      from listings l join businesses b on b.id = l.business_id and b.status = 'approved'
     where l.status = 'publicado' and not (l.categoria = any(v_sens))
       and l.publicado_at > now() - interval '21 days'
     order by l.publicado_at desc limit 12) x;
  if jsonb_array_length(coalesce(v_items, '[]')) >= 4 then
    v_estantes := v_estantes || jsonb_build_array(jsonb_build_object('clave', 'nuevos', 'items', v_items));
  end if;

  -- Segunda vida: usado, reacondicionado o reparación
  select jsonb_agg(t order by s desc) into v_items from (
    select brote_listado_tarjeta(l, b, v_precios) || jsonb_build_object('favorito', l.id = any(v_favs)) t, l.score s
      from listings l join businesses b on b.id = l.business_id and b.status = 'approved'
     where l.status = 'publicado' and not (l.categoria = any(v_sens))
       and (l.condicion in ('usado','reacondicionado') or l.categoria = 'reparacion-y-reuso')
     order by l.score desc limit 12) x;
  if jsonb_array_length(coalesce(v_items, '[]')) >= 4 then
    v_estantes := v_estantes || jsonb_build_array(jsonb_build_object('clave', 'segunda_vida', 'items', v_items));
  end if;

  -- Mejor documentados: Nivel 2 o más
  select jsonb_agg(t order by rn) into v_items from (
    select brote_listado_tarjeta(l, b, v_precios) || jsonb_build_object('favorito', l.id = any(v_favs)) t,
           row_number() over (order by l.tier_efectivo desc, l.score desc) rn
      from listings l join businesses b on b.id = l.business_id and b.status = 'approved'
     where l.status = 'publicado' and not (l.categoria = any(v_sens)) and l.tier_efectivo >= 'e2'
     order by l.tier_efectivo desc, l.score desc limit 12) x;
  if jsonb_array_length(coalesce(v_items, '[]')) >= 4 then
    v_estantes := v_estantes || jsonb_build_array(jsonb_build_object('clave', 'documentados', 'items', v_items));
  end if;

  return jsonb_build_object(
    'cuenta', v_cuenta,
    'provincia', v_prov,
    'categorias', coalesce((
      select jsonb_object_agg(c, n) from (
        select l.categoria c, count(*) n
          from listings l join businesses b on b.id = l.business_id and b.status = 'approved'
         where l.status = 'publicado' and not (l.categoria = any(v_sens))
         group by 1) x), '{}'::jsonb),
    'total', (select count(*) from listings l join businesses b on b.id = l.business_id and b.status = 'approved'
               where l.status = 'publicado' and not (l.categoria = any(v_sens))),
    'estantes', v_estantes,
    'tiendas', coalesce((
      select jsonb_agg(t order by s desc) from (
        select jsonb_build_object('id', b.id, 'slug', b.slug, 'nombre', b.nombre_comercial, 'logo', b.logo_url,
                 'provincia', b.provincia, 'ciudad', b.ciudad, 'tier', b.tier,
                 'productos', x.n, 'seguidores', (select count(*) from mercado_seguidos s where s.business_id = b.id),
                 'seguida', b.id = any(v_seguidas),
                 'imagenes', x.imgs) t,
               x.s + case when b.id = any(v_seguidas) then -1000 else 0 end as s
          from (select l.business_id, count(*) n, max(l.score) s,
                       (array_agg(l.imagenes[1] order by l.score desc) filter (where l.imagenes[1] is not null))[1:3] imgs
                  from listings l
                 where l.status = 'publicado' and not (l.categoria = any(v_sens))
                 group by 1) x
          join businesses b on b.id = x.business_id and b.status = 'approved'
         order by s desc limit 10) y), '[]'::jsonb));
end $fn$;

-- ── 7. La ficha, versión 2 ──────────────────────────────────────────────────
-- Suma lo que una ficha de verdad necesita: el estado, la tienda con sus
-- compromisos y su antigüedad, si ya lo guardaste, las preguntas, "más de esta
-- tienda" y "parecidos". El canal de contacto se dice (WhatsApp, sitio,
-- Instagram) pero la dirección sigue saliendo SOLO de `mercado_salir`.

create or replace function mercado_listado(p_slug text)
returns jsonb language plpgsql stable security definer set search_path = public as $fn$
declare
  l listings%rowtype; b businesses%rowtype; v_miembro boolean; v_uid uuid := (select auth.uid());
  v_cuenta text; v_precios boolean; v_sens text[];
begin
  select * into l from listings where slug = p_slug;
  if l.id is null then return null; end if;
  v_miembro := brote_is_member(l.business_id);
  if not v_miembro and (l.status <> 'publicado' or not brote_mercado_puede_ver(l.categoria)) then return null; end if;
  select * into b from businesses where id = l.business_id;
  if not v_miembro and b.status <> 'approved' then return null; end if;

  v_cuenta := coalesce(brote_account_type(v_uid), 'adult');
  v_precios := v_cuenta = 'adult';
  v_sens := case when v_cuenta = 'teen' then brote_mercado_sensibles() else array[]::text[] end;

  return brote_listado_tarjeta(l, b, v_precios) || jsonb_build_object(
    'descripcion', l.descripcion, 'imagenes', to_jsonb(l.imagenes), 'status', l.status,
    'vista_previa', l.status <> 'publicado',
    'dominio_destino', case when l.contacto = 'web' then brote_dominio(l.url_destino) end,
    'contacto', l.contacto,
    'publicado_at', l.publicado_at,
    'favorito', exists (select 1 from mercado_favoritos f where f.user_id = v_uid and f.listing_id = l.id),
    'negocio', jsonb_build_object('id', b.id, 'slug', b.slug, 'nombre', b.nombre_comercial,
                                  'logo', b.logo_url, 'tier', b.tier, 'provincia', b.provincia,
                                  'ciudad', b.ciudad, 'verificacion', brote_verificacion_fuerza(b.id),
                                  'nota_correccion', b.nota_correccion,
                                  'tipo', b.tipo_vendedor,
                                  'desde', coalesce(b.activa_at, b.revisado_at, b.created_at),
                                  'mp_vinculado', b.mp_vinculado_at is not null,
                                  'productos', (select count(*) from listings x where x.business_id = b.id and x.status = 'publicado'),
                                  'seguidores', (select count(*) from mercado_seguidos s where s.business_id = b.id),
                                  'seguida', exists (select 1 from mercado_seguidos s where s.business_id = b.id and s.user_id = v_uid),
                                  'compromisos', brote_tienda_compromisos_publicos(b.id)),
    'afirmaciones', coalesce((
      select jsonb_agg(jsonb_build_object(
          'id', c.id, 'kind', c.kind, 'alcance', c.alcance, 'datos', c.datos, 'tier', c.tier,
          'cert_numero', c.cert_numero, 'cert_vence', c.cert_vence,
          'cert', (select jsonb_build_object('nombre', x.nombre, 'emisor', x.emisor)
                   from certifications x where x.slug = c.cert_slug))
        order by c.tier desc, lc.created_at)
      from listing_claims lc join business_claims c on c.id = lc.claim_id
      where lc.listing_id = l.id and c.status = 'aprobada' and c.tier <> 'e0'), '[]'::jsonb),
    'ya_reportado', exists (select 1 from listing_reports where listing_id = l.id and user_id = v_uid),
    'preguntas', brote_listado_preguntas(l.id, v_uid, 0, 5),
    'preguntas_total', (select count(*) from listing_preguntas q
                         where q.listing_id = l.id and q.estado = 'visible' and q.respondida_at is not null),
    'mas_de_la_tienda', coalesce((
      select jsonb_agg(t) from (
        select brote_listado_tarjeta(x, b, v_precios) t from listings x
         where x.business_id = b.id and x.status = 'publicado' and x.id <> l.id
           and not (x.categoria = any(v_sens))
         order by x.score desc limit 8) y), '[]'::jsonb),
    'parecidos', coalesce((
      select jsonb_agg(t order by s desc) from (
        select brote_listado_tarjeta(x, xb, v_precios) t,
               x.score
               + case when l.subcategoria is not null and x.subcategoria = l.subcategoria then 40 else 0 end
               + case when x.dominios && l.dominios then 10 else 0 end as s
          from listings x join businesses xb on xb.id = x.business_id and xb.status = 'approved'
         where x.status = 'publicado' and x.categoria = l.categoria and x.id <> l.id
           and x.business_id <> b.id and not (x.categoria = any(v_sens))
         order by s desc limit 12) y), '[]'::jsonb));
end $fn$;

-- ── 8. Preguntas ────────────────────────────────────────────────────────────

create or replace function brote_listado_preguntas(p_listing uuid, p_uid uuid, p_offset int, p_limit int)
returns jsonb language sql stable security definer set search_path = public as $fn$
  select coalesce(jsonb_agg(jsonb_build_object(
      'id', q.id, 'texto', q.texto, 'respuesta', q.respuesta,
      'respondida_at', q.respondida_at, 'created_at', q.created_at,
      'propia', q.user_id = p_uid) order by q.respondida_at desc nulls first, q.created_at desc), '[]'::jsonb)
    from (select * from listing_preguntas q
           where q.listing_id = p_listing and q.estado = 'visible'
             -- Las sin responder solo las ve quien preguntó.
             and (q.respondida_at is not null or q.user_id = p_uid)
           order by q.respondida_at desc nulls first, q.created_at desc
           offset greatest(0, coalesce(p_offset, 0)) limit least(greatest(coalesce(p_limit, 10), 1), 30)) q;
$fn$;

create or replace function mercado_preguntas(p_listing uuid, p_offset int default 0)
returns jsonb language plpgsql stable security definer set search_path = public as $fn$
declare l listings%rowtype;
begin
  select * into l from listings where id = p_listing and status = 'publicado';
  if l.id is null or not brote_mercado_puede_ver(l.categoria) then return '[]'::jsonb; end if;
  return brote_listado_preguntas(l.id, (select auth.uid()), p_offset, 10);
end $fn$;

create or replace function mercado_preguntar(p_listing uuid, p_texto text)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare l listings%rowtype; v_uid uuid := (select auth.uid()); v_txt text; v_id uuid;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'error', 'no_autenticado'); end if;
  select * into l from listings where id = p_listing and status = 'publicado';
  if l.id is null or not brote_mercado_puede_ver(l.categoria) then
    return jsonb_build_object('ok', false, 'error', 'no_disponible');
  end if;
  if brote_is_member(l.business_id) then return jsonb_build_object('ok', false, 'error', 'propio'); end if;
  v_txt := regexp_replace(trim(coalesce(p_texto, '')), '\s+', ' ', 'g');
  if char_length(v_txt) < 5 then return jsonb_build_object('ok', false, 'error', 'muy_corta'); end if;
  if char_length(v_txt) > 300 then return jsonb_build_object('ok', false, 'error', 'muy_larga'); end if;
  if brote_matches_blocklist(v_txt) then return jsonb_build_object('ok', false, 'error', 'texto_no_permitido'); end if;
  if not brote_rate_limit('pregunta:' || v_uid, 20) then
    return jsonb_build_object('ok', false, 'error', 'demasiadas');
  end if;
  insert into listing_preguntas (listing_id, business_id, user_id, texto)
  values (l.id, l.business_id, v_uid, v_txt) returning id into v_id;
  perform brote_negocio_notificar(l.business_id, 'Te hicieron una pregunta',
    format('Sobre "%s": %s', l.titulo, left(v_txt, 120)), '/negocio/preguntas');
  return jsonb_build_object('ok', true, 'id', v_id);
end $fn$;

-- La bandeja de la tienda: sin responder primero.
create or replace function tienda_preguntas(p_business uuid, p_estado text default 'pendientes')
returns jsonb language plpgsql stable security definer set search_path = public as $fn$
begin
  if not brote_is_member(p_business) then return null; end if;
  return jsonb_build_object(
    'pendientes', (select count(*) from listing_preguntas q
                    where q.business_id = p_business and q.estado = 'visible' and q.respondida_at is null),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
          'id', q.id, 'texto', q.texto, 'respuesta', q.respuesta, 'respondida_at', q.respondida_at,
          'created_at', q.created_at, 'estado', q.estado,
          'listado', jsonb_build_object('id', l.id, 'slug', l.slug, 'titulo', l.titulo, 'imagen', l.imagenes[1]))
        order by q.respondida_at nulls first, q.created_at desc)
        from (select * from listing_preguntas q
               where q.business_id = p_business
                 and case p_estado
                       when 'respondidas' then q.respondida_at is not null and q.estado = 'visible'
                       when 'ocultas' then q.estado = 'oculta'
                       else q.respondida_at is null and q.estado = 'visible' end
               order by q.respondida_at nulls first, q.created_at desc limit 100) q
        join listings l on l.id = q.listing_id), '[]'::jsonb));
end $fn$;

create or replace function tienda_responder(p_pregunta uuid, p_texto text)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare q listing_preguntas%rowtype; v_txt text; v_titulo text; v_slug text;
begin
  select * into q from listing_preguntas where id = p_pregunta for update;
  if q.id is null or not brote_can_write(q.business_id, 'editor') then
    return jsonb_build_object('ok', false, 'error', 'sin_permiso');
  end if;
  v_txt := trim(coalesce(p_texto, ''));
  if char_length(v_txt) < 2 then return jsonb_build_object('ok', false, 'error', 'muy_corta'); end if;
  if char_length(v_txt) > 1000 then return jsonb_build_object('ok', false, 'error', 'muy_larga'); end if;
  if brote_matches_blocklist(v_txt) then return jsonb_build_object('ok', false, 'error', 'texto_no_permitido'); end if;
  -- Una respuesta también es texto comercial: la lista negra de salud y
  -- absolutos vale igual que en la descripción.
  if brote_texto_prohibido(v_txt) is not null then
    return jsonb_build_object('ok', false, 'error', 'texto_prohibido', 'termino', brote_texto_prohibido(v_txt));
  end if;
  update listing_preguntas set respuesta = v_txt, respondida_at = coalesce(respondida_at, now()),
         respondida_por = (select auth.uid())
   where id = q.id;
  select titulo, slug into v_titulo, v_slug from listings where id = q.listing_id;
  if q.respondida_at is null and q.user_id is not null then
    insert into notifications (user_id, type, title_es, body_es, data)
    values (q.user_id, 'system', 'Te respondieron',
            format('Sobre "%s": %s', v_titulo, left(v_txt, 140)),
            jsonb_build_object('url', '/mercado/' || v_slug || '#preguntas', 'categoria', 'mercado'));
  end if;
  return jsonb_build_object('ok', true);
end $fn$;

create or replace function tienda_pregunta_ocultar(p_pregunta uuid, p_ocultar boolean default true)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare q listing_preguntas%rowtype;
begin
  select * into q from listing_preguntas where id = p_pregunta;
  if q.id is null or not brote_can_write(q.business_id, 'editor') then
    return jsonb_build_object('ok', false, 'error', 'sin_permiso');
  end if;
  update listing_preguntas set estado = case when p_ocultar then 'oculta' else 'visible' end where id = q.id;
  return jsonb_build_object('ok', true);
end $fn$;

-- ── 9. Guardar, seguir, lo visto ────────────────────────────────────────────

create or replace function mercado_favorito(p_listing uuid, p_on boolean)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare v_uid uuid := (select auth.uid()); l listings%rowtype;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'error', 'no_autenticado'); end if;
  select * into l from listings where id = p_listing;
  if l.id is null or not brote_mercado_puede_ver(l.categoria) then
    return jsonb_build_object('ok', false, 'error', 'no_disponible');
  end if;
  if p_on then
    if l.status <> 'publicado' then return jsonb_build_object('ok', false, 'error', 'no_disponible'); end if;
    if (select count(*) from mercado_favoritos where user_id = v_uid) >= 500 then
      return jsonb_build_object('ok', false, 'error', 'demasiados');
    end if;
    insert into mercado_favoritos (user_id, listing_id, precio_al_guardar)
    values (v_uid, l.id, l.precio_referencia) on conflict do nothing;
  else
    delete from mercado_favoritos where user_id = v_uid and listing_id = l.id;
  end if;
  return jsonb_build_object('ok', true, 'favorito', p_on,
                            'favoritos', (select favoritos from listings where id = l.id));
end $fn$;

create or replace function brote_mercado_favoritos_contar()
returns trigger language plpgsql security definer set search_path = public as $fn$
begin
  if tg_op = 'INSERT' then
    update listings set favoritos = favoritos + 1 where id = new.listing_id;
  elsif tg_op = 'DELETE' then
    update listings set favoritos = greatest(0, favoritos - 1) where id = old.listing_id;
  end if;
  return null;
end $fn$;

drop trigger if exists trg_mfav_contar on mercado_favoritos;
create trigger trg_mfav_contar after insert or delete on mercado_favoritos
  for each row execute function brote_mercado_favoritos_contar();

create or replace function mercado_seguir(p_business uuid, p_on boolean)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare v_uid uuid := (select auth.uid());
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'error', 'no_autenticado'); end if;
  if coalesce(brote_account_type(v_uid), 'adult') = 'kid' then
    return jsonb_build_object('ok', false, 'error', 'no_disponible');
  end if;
  if not exists (select 1 from businesses where id = p_business and status = 'approved') then
    return jsonb_build_object('ok', false, 'error', 'no_disponible');
  end if;
  if brote_is_member(p_business) then return jsonb_build_object('ok', false, 'error', 'propio'); end if;
  if p_on then
    insert into mercado_seguidos (user_id, business_id) values (v_uid, p_business) on conflict do nothing;
  else
    delete from mercado_seguidos where user_id = v_uid and business_id = p_business;
  end if;
  return jsonb_build_object('ok', true, 'seguida', p_on,
                            'seguidores', (select count(*) from mercado_seguidos where business_id = p_business));
end $fn$;

create or replace function mercado_visto(p_listing uuid)
returns void language plpgsql security definer set search_path = public as $fn$
declare v_uid uuid := (select auth.uid());
begin
  if v_uid is null then return; end if;
  insert into mercado_vistos (user_id, listing_id)
  select v_uid, l.id from listings l
   where l.id = p_listing and l.status = 'publicado' and not brote_is_member(l.business_id)
  on conflict (user_id, listing_id) do update set visto_at = now(), veces = mercado_vistos.veces + 1;
end $fn$;

-- Guardados, lo visto y las tiendas que sigue: `/mercado/guardados`.
create or replace function mercado_guardados()
returns jsonb language plpgsql stable security definer set search_path = public as $fn$
declare v_uid uuid := (select auth.uid()); v_cuenta text; v_precios boolean; v_sens text[];
begin
  v_cuenta := coalesce(brote_account_type(v_uid), 'adult');
  if v_uid is null or v_cuenta = 'kid' then return null; end if;
  v_precios := v_cuenta = 'adult';
  v_sens := case when v_cuenta = 'teen' then brote_mercado_sensibles() else array[]::text[] end;
  return jsonb_build_object(
    'favoritos', coalesce((
      select jsonb_agg(brote_listado_tarjeta(l, b, v_precios) || jsonb_build_object(
               'favorito', true, 'guardado_at', f.created_at,
               'precio_al_guardar', case when v_precios then f.precio_al_guardar end,
               'disponible', l.status = 'publicado' and b.status = 'approved')
             order by (l.status = 'publicado') desc, f.created_at desc)
        from mercado_favoritos f
        join listings l on l.id = f.listing_id
        join businesses b on b.id = l.business_id
       where f.user_id = v_uid and not (l.categoria = any(v_sens))), '[]'::jsonb),
    'vistos', coalesce((
      select jsonb_agg(t order by v desc) from (
        select brote_listado_tarjeta(l, b, v_precios) t, mv.visto_at v
          from mercado_vistos mv
          join listings l on l.id = mv.listing_id and l.status = 'publicado'
          join businesses b on b.id = l.business_id and b.status = 'approved'
         where mv.user_id = v_uid and not (l.categoria = any(v_sens))
         order by mv.visto_at desc limit 48) x), '[]'::jsonb),
    'tiendas', coalesce((
      select jsonb_agg(jsonb_build_object('id', b.id, 'slug', b.slug, 'nombre', b.nombre_comercial,
               'logo', b.logo_url, 'provincia', b.provincia, 'ciudad', b.ciudad,
               'productos', (select count(*) from listings l where l.business_id = b.id and l.status = 'publicado'),
               'nuevos', (select count(*) from listings l where l.business_id = b.id and l.status = 'publicado'
                            and l.publicado_at > s.created_at and l.publicado_at > now() - interval '14 days'))
             order by s.created_at desc)
        from mercado_seguidos s join businesses b on b.id = s.business_id and b.status = 'approved'
       where s.user_id = v_uid), '[]'::jsonb));
end $fn$;

-- ── 10. Avisos que valen la pena ────────────────────────────────────────────

-- El precio de referencia: si baja 5% o más, queda el anterior para mostrarlo
-- ("antes $ 4.200") durante 30 días; si sube, se borra. Nada se inventa: el
-- número viejo es el que la tienda había publicado.
create or replace function brote_listado_precio_cambio()
returns trigger language plpgsql security definer set search_path = public as $fn$
begin
  if new.precio_referencia is distinct from old.precio_referencia then
    if old.precio_referencia is not null and new.precio_referencia is not null
       and new.precio_referencia <= old.precio_referencia * 0.95 then
      new.precio_anterior := greatest(old.precio_referencia, coalesce(
        case when old.precio_cambio_at > now() - interval '30 days' then old.precio_anterior end, 0));
      new.precio_cambio_at := now();
    elsif new.precio_referencia is null or old.precio_referencia is null
          or new.precio_referencia > old.precio_referencia then
      new.precio_anterior := null;
      new.precio_cambio_at := now();
    end if;
  end if;
  return new;
end $fn$;

drop trigger if exists trg_listings_precio on listings;
create trigger trg_listings_precio before update of precio_referencia on listings
  for each row execute function brote_listado_precio_cambio();

-- Después de guardar: avisar a quien lo guardó (bajó el precio de referencia) y
-- a quien sigue la tienda (publicó algo por primera vez). Con tope: un aviso
-- por persona y listado cada 7 días por el precio, y uno por persona y tienda
-- por día por lo nuevo. Un aviso de más es la forma más rápida de que alguien
-- apague todos.
create or replace function brote_listado_avisos()
returns trigger language plpgsql security definer set search_path = public as $fn$
declare r record; v_tienda text;
begin
  if new.status <> 'publicado' then return null; end if;
  select nombre_comercial into v_tienda from businesses where id = new.business_id and status = 'approved';
  if v_tienda is null then return null; end if;

  if new.precio_cambio_at is distinct from old.precio_cambio_at and new.precio_anterior is not null then
    for r in
      select f.user_id from mercado_favoritos f
       where f.listing_id = new.id and brote_account_type(f.user_id) = 'adult'
    loop
      if brote_rate_limit('aviso_precio:' || r.user_id || ':' || new.id, 1, interval '7 days') then
        insert into notifications (user_id, type, title_es, body_es, data)
        values (r.user_id, 'system', 'Bajó el precio de referencia de algo que guardaste',
                format('"%s" en %s.', new.titulo, v_tienda),
                jsonb_build_object('url', '/mercado/' || new.slug, 'categoria', 'mercado'));
      end if;
    end loop;
  end if;

  if old.status <> 'publicado' and old.publicado_at is null then
    for r in
      select s.user_id from mercado_seguidos s
       where s.business_id = new.business_id
         and brote_mercado_puede_ver_cuenta(brote_account_type(s.user_id), new.categoria)
    loop
      if brote_rate_limit('aviso_tienda:' || r.user_id || ':' || new.business_id, 1, interval '1 day') then
        insert into notifications (user_id, type, title_es, body_es, data)
        values (r.user_id, 'system', format('Novedad en %s', v_tienda),
                format('Publicó "%s".', new.titulo),
                jsonb_build_object('url', '/mercado/' || new.slug, 'categoria', 'mercado'));
      end if;
    end loop;
  end if;
  return null;
end $fn$;

create or replace function brote_mercado_puede_ver_cuenta(p_cuenta text, p_categoria text)
returns boolean language sql stable set search_path = public as $fn$
  select case coalesce(p_cuenta, 'adult')
    when 'kid' then false
    when 'teen' then not (p_categoria = any(brote_mercado_sensibles()))
    else true end;
$fn$;

drop trigger if exists trg_listings_avisos on listings;
create trigger trg_listings_avisos after update on listings
  for each row
  when (new.status = 'publicado'
        and (new.precio_cambio_at is distinct from old.precio_cambio_at or old.status is distinct from new.status))
  execute function brote_listado_avisos();

-- ── 11. La salida, por canal ────────────────────────────────────────────────
-- WhatsApp e Instagram se arman en el momento con el dato de la tienda: si la
-- tienda cambia de número, ningún listado queda apuntando al viejo. El mensaje
-- de WhatsApp llega prearmado con el nombre del producto.

create or replace function brote_listado_destino(l listings, b businesses)
returns text language sql stable security definer set search_path = public as $fn$
  select case l.contacto
    when 'whatsapp' then case when b.whatsapp is null then null else
      'https://wa.me/' || regexp_replace(b.whatsapp, '\D', '', 'g') || '?text=' ||
      brote_urlencode(format('Hola, vi "%s" en Brote y quería consultarte.', l.titulo)) end
    when 'instagram' then case when b.instagram is null then null else 'https://www.instagram.com/' || b.instagram end
    else nullif(l.url_destino, '') end;
$fn$;

create or replace function mercado_salida(p_listing uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $fn$
declare l listings%rowtype; b businesses%rowtype;
begin
  select * into l from listings where id = p_listing and status = 'publicado';
  if l.id is null or not brote_mercado_puede_ver(l.categoria) then return null; end if;
  select * into b from businesses where id = l.business_id and status = 'approved';
  if b.id is null then return null; end if;
  return jsonb_build_object('listado', l.titulo, 'slug', l.slug,
    'dominio', brote_dominio(brote_listado_destino(l, b)),
    'canal', l.contacto,
    'comercio', b.nombre_comercial, 'logo', b.logo_url,
    -- A partir de la 3ª vez en 30 días con el mismo comercio: toast y listo.
    'vistas_30d', (select count(*) from listing_clicks
                    where user_id = (select auth.uid()) and business_id = b.id
                      and created_at > now() - interval '30 days'));
end $fn$;

create or replace function mercado_salir(p_listing uuid, p_origen text, p_ua_hash text default null)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare l listings%rowtype; b businesses%rowtype; v_url text;
begin
  select * into l from listings where id = p_listing and status = 'publicado';
  if l.id is null or not brote_mercado_puede_ver(l.categoria) then
    return jsonb_build_object('ok', false, 'error', 'no_disponible');
  end if;
  select * into b from businesses where id = l.business_id and status = 'approved';
  if b.id is null then return jsonb_build_object('ok', false, 'error', 'no_disponible'); end if;
  v_url := brote_listado_destino(l, b);
  if v_url is null then return jsonb_build_object('ok', false, 'error', 'sin_destino'); end if;
  insert into listing_clicks (listing_id, business_id, user_id, origen, ua_hash)
  values (l.id, l.business_id, (select auth.uid()),
          case when p_origen in ('catalogo','accion','perfil_negocio','busqueda','ficha') then p_origen else 'ficha' end,
          left(p_ua_hash, 64));
  return jsonb_build_object('ok', true, 'url', v_url, 'dominio', brote_dominio(v_url), 'canal', l.contacto);
end $fn$;

-- ── 12. Niveles: un listado sin afirmaciones es `e0` ────────────────────────
-- Antes todo listado tenía al menos una afirmación y el piso era E1. Ahora la
-- afirmación es opcional: sin ninguna aprobada, el listado no tiene nivel (y
-- no lleva badge). NUNCA hereda el nivel de la tienda: antihalo.

create or replace function brote_recalcular_tiers(p_business uuid default null)
returns void language plpgsql security definer set search_path = public as $fn$
begin
  update business_claims set status = 'vencida', updated_at = now()
   where kind = 'certificacion_tercero' and status = 'aprobada'
     and cert_vence is not null and cert_vence < current_date
     and (p_business is null or business_id = p_business);

  update business_claims c set tier = brote_claim_nivel(c)
   where (p_business is null or c.business_id = p_business)
     and c.tier is distinct from brote_claim_nivel(c);

  update listings l set tier_efectivo = coalesce((
      select max(bc.tier) from listing_claims lc join business_claims bc on bc.id = lc.claim_id
       where lc.listing_id = l.id and bc.status = 'aprobada' and bc.tier <> 'e0'), 'e0')
   where (p_business is null or l.business_id = p_business)
     and l.tier_efectivo is distinct from coalesce((
      select max(bc.tier) from listing_claims lc join business_claims bc on bc.id = lc.claim_id
       where lc.listing_id = l.id and bc.status = 'aprobada' and bc.tier <> 'e0'), 'e0');

  update businesses b set tier = brote_negocio_nivel(b.id)
   where (p_business is null or b.id = p_business)
     and b.tier is distinct from brote_negocio_nivel(b.id);
end $fn$;

-- ── 13. Retención ───────────────────────────────────────────────────────────
-- Lo visto se guarda 120 días; las preguntas ocultas, 180. Corre dentro del
-- job diario de siempre (`brote_negocios_diario`) a través de este helper.

create or replace function brote_mercado_limpieza()
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare v_vistos int; v_preg int;
begin
  delete from mercado_vistos where visto_at < now() - interval '120 days';
  get diagnostics v_vistos = row_count;
  delete from listing_preguntas where estado = 'oculta' and created_at < now() - interval '180 days';
  get diagnostics v_preg = row_count;
  return jsonb_build_object('vistos', v_vistos, 'preguntas', v_preg);
end $fn$;

-- ── 13b. El plan de quien vende ─────────────────────────────────────────────
-- Un valor nuevo de un enum no se puede usar en la misma transacción que lo
-- crea: por eso vive acá y se usa recién en 0114.
alter type biz_plan add value if not exists 'vendedor';

-- ── 14. Permisos ────────────────────────────────────────────────────────────
-- Lo que la API expone, y a quién. Todo lo demás, a nadie (los privilegios por
-- defecto de la base conceden EXECUTE a anon/authenticated: hay que revocar).

revoke all on function brote_mercado_subcategorias() from public, anon, authenticated;
revoke all on function brote_practicas() from public, anon, authenticated;
revoke all on function brote_tienda_compromisos_publicos(uuid) from public, anon, authenticated;
revoke all on function brote_mercado_subcategoria_valida(text, text) from public, anon, authenticated;
revoke all on function brote_urlencode(text) from public, anon, authenticated;
revoke all on function brote_mercado_normalizar(text) from public, anon, authenticated;
revoke all on function brote_mercado_tsquery(text) from public, anon, authenticated;
revoke all on function brote_listado_tarjeta(listings, businesses, boolean) from public, anon, authenticated;
revoke all on function brote_listado_tarjeta(listings, businesses) from public, anon, authenticated;
revoke all on function brote_listado_preguntas(uuid, uuid, int, int) from public, anon, authenticated;
revoke all on function brote_mercado_favoritos_contar() from public, anon, authenticated;
revoke all on function brote_listado_precio_cambio() from public, anon, authenticated;
revoke all on function brote_listado_avisos() from public, anon, authenticated;
revoke all on function brote_mercado_puede_ver_cuenta(text, text) from public, anon, authenticated;
revoke all on function brote_listado_destino(listings, businesses) from public, anon, authenticated;
revoke all on function brote_recalcular_tiers(uuid) from public, anon, authenticated;
revoke all on function brote_mercado_limpieza() from public, anon, authenticated;

revoke all on function mercado_buscar(text, text, text, evidence_tier, text, text, text, numeric, numeric, text, uuid, int, int) from public, anon;
revoke all on function mercado_sugerencias(text) from public, anon;
revoke all on function mercado_inicio() from public, anon;
revoke all on function mercado_listado(text) from public, anon;
revoke all on function mercado_preguntas(uuid, int) from public, anon;
revoke all on function mercado_preguntar(uuid, text) from public, anon;
revoke all on function tienda_preguntas(uuid, text) from public, anon;
revoke all on function tienda_responder(uuid, text) from public, anon;
revoke all on function tienda_pregunta_ocultar(uuid, boolean) from public, anon;
revoke all on function mercado_favorito(uuid, boolean) from public, anon;
revoke all on function mercado_seguir(uuid, boolean) from public, anon;
revoke all on function mercado_visto(uuid) from public, anon;
revoke all on function mercado_guardados() from public, anon;
revoke all on function mercado_salida(uuid) from public, anon;
revoke all on function mercado_salir(uuid, text, text) from public, anon;

grant execute on function mercado_buscar(text, text, text, evidence_tier, text, text, text, numeric, numeric, text, uuid, int, int) to authenticated;
grant execute on function mercado_sugerencias(text) to authenticated;
grant execute on function mercado_inicio() to authenticated;
grant execute on function mercado_listado(text) to authenticated;
grant execute on function mercado_preguntas(uuid, int) to authenticated;
grant execute on function mercado_preguntar(uuid, text) to authenticated;
grant execute on function tienda_preguntas(uuid, text) to authenticated;
grant execute on function tienda_responder(uuid, text) to authenticated;
grant execute on function tienda_pregunta_ocultar(uuid, boolean) to authenticated;
grant execute on function mercado_favorito(uuid, boolean) to authenticated;
grant execute on function mercado_seguir(uuid, boolean) to authenticated;
grant execute on function mercado_visto(uuid) to authenticated;
grant execute on function mercado_guardados() to authenticated;
grant execute on function mercado_salida(uuid) to authenticated;
grant execute on function mercado_salir(uuid, text, text) to authenticated;
