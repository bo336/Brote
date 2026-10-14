-- ════════════════════════════════════════════════════════════════════════════
-- Brote — 0132 — Desafíos y certificados para PyMEs (LANZAMIENTO F6, D10).
--
-- El equipo publica desafíos desde el panel (`/panel/desafios`): una meta
-- concreta con requisitos verificables, cada uno con el tipo de evidencia que
-- pide. Una empresa verificada se inscribe, carga la evidencia requisito por
-- requisito y la envía. El equipo la revisa: aprueba (y se emite un
-- certificado), la observa (vuelve con una nota) o la rechaza.
--
-- El certificado:
--   · tiene un código público (BRT-XXXX-XXXX) y una página que cualquiera
--     puede abrir para verificarlo (`/certificados/<código>`);
--   · dice lo que es y nada más: que Brote revisó la evidencia que mandó la
--     empresa para esos requisitos, en esa fecha. NO es una auditoría ni una
--     certificación de un organismo — la página lo dice con esas palabras;
--   · vence (12 meses por omisión) y se puede revocar con un motivo.
--
-- Es distinto del nivel de evidencia de los productos (0107) y de las
-- certificaciones de terceros (`certifications`): esto lo emite Brote.
--
-- Todo por RPC. Las tablas no tienen ninguna política para el cliente.
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.empresa_desafios (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique check (slug ~ '^[a-z0-9-]{3,60}$'),
  titulo         text not null check (length(titulo) between 3 and 80),
  resumen        text not null check (length(resumen) between 10 and 200),
  descripcion    text,
  categoria      text not null check (categoria in ('energia', 'residuos', 'agua', 'compras', 'movilidad', 'comunidad', 'gestion')),
  nivel          smallint not null check (nivel between 1 and 3),
  requisitos     jsonb not null check (jsonb_typeof(requisitos) = 'array' and jsonb_array_length(requisitos) between 1 and 10),
  dias_para_cumplir int not null default 60 check (dias_para_cumplir between 7 and 365),
  vigencia_meses int not null default 12 check (vigencia_meses between 1 and 36),
  para           text not null default 'todas' check (para in ('mejorar', 'vender', 'todas')),
  estado         text not null default 'borrador' check (estado in ('borrador', 'publicado', 'archivado')),
  orden          int not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists public.empresa_desafio_inscripciones (
  id           uuid primary key default gen_random_uuid(),
  desafio_id   uuid not null references public.empresa_desafios (id) on delete restrict,
  business_id  uuid not null references public.businesses (id) on delete cascade,
  estado       text not null default 'en_curso'
               check (estado in ('en_curso', 'enviada', 'observada', 'aprobada', 'rechazada', 'vencida', 'abandonada')),
  inscripta_at timestamptz not null default now(),
  vence_at     timestamptz not null,
  enviada_at   timestamptz,
  revisada_at  timestamptz,
  revisado_por uuid,
  nota         text,
  unique (desafio_id, business_id)
);
create index if not exists empresa_desafio_insc_estado on public.empresa_desafio_inscripciones (estado, enviada_at);
create index if not exists empresa_desafio_insc_negocio on public.empresa_desafio_inscripciones (business_id);

create table if not exists public.empresa_desafio_evidencias (
  inscripcion_id uuid not null references public.empresa_desafio_inscripciones (id) on delete cascade,
  requisito_id   text not null,
  texto          text check (length(texto) <= 2000),
  valor          numeric,
  enlace         text check (enlace is null or enlace ~ '^https?://'),
  archivo_path   text,
  updated_at     timestamptz not null default now(),
  primary key (inscripcion_id, requisito_id)
);

create table if not exists public.empresa_certificados (
  id             uuid primary key default gen_random_uuid(),
  codigo         text not null unique,
  business_id    uuid not null references public.businesses (id) on delete cascade,
  desafio_id     uuid not null references public.empresa_desafios (id) on delete restrict,
  inscripcion_id uuid not null unique references public.empresa_desafio_inscripciones (id) on delete cascade,
  titulo         text not null,
  nivel          smallint not null,
  categoria      text not null,
  requisitos     jsonb not null,  -- lo que se cumplió, congelado al emitirlo
  emitido_at     timestamptz not null default now(),
  vence_at       timestamptz not null,
  revocado_at    timestamptz,
  motivo_revocacion text
);
create index if not exists empresa_certificados_negocio on public.empresa_certificados (business_id);

alter table public.empresa_desafios enable row level security;
alter table public.empresa_desafio_inscripciones enable row level security;
alter table public.empresa_desafio_evidencias enable row level security;
alter table public.empresa_certificados enable row level security;
revoke all on public.empresa_desafios, public.empresa_desafio_inscripciones,
              public.empresa_desafio_evidencias, public.empresa_certificados from public, anon, authenticated;

-- ── Validar requisitos ──────────────────────────────────────────────────────
-- Cada requisito: {id, texto, evidencia, ayuda?, unidad?}. La evidencia es una
-- de: foto | documento | dato | enlace | declaracion.

create or replace function public.brote_desafio_requisitos_validos(p jsonb)
returns boolean
language sql
immutable
as $$
  select jsonb_typeof(p) = 'array'
     and jsonb_array_length(p) between 1 and 10
     and not exists (
       select 1 from jsonb_array_elements(p) r
        where coalesce(r ->> 'id', '') !~ '^[a-z0-9_]{1,30}$'
           or length(coalesce(r ->> 'texto', '')) not between 5 and 300
           or coalesce(r ->> 'evidencia', '') not in ('foto', 'documento', 'dato', 'enlace', 'declaracion'))
     and (select count(distinct r ->> 'id') from jsonb_array_elements(p) r) = jsonb_array_length(p);
$$;

-- Una evidencia alcanza para su requisito si trae lo que ese tipo pide.
create or replace function public.brote_evidencia_completa(p_tipo text, e public.empresa_desafio_evidencias)
returns boolean
language sql
immutable
as $$
  select case p_tipo
    when 'foto' then e.archivo_path is not null
    when 'documento' then e.archivo_path is not null or e.enlace is not null
    when 'dato' then e.valor is not null
    when 'enlace' then e.enlace is not null
    when 'declaracion' then length(coalesce(e.texto, '')) >= 20
    else false end;
$$;

create or replace function public.brote_certificado_codigo()
returns text
language plpgsql
volatile
security definer
set search_path = public
as $$
declare v text; alfabeto constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; i int;
begin
  loop
    v := 'BRT-';
    for i in 1..8 loop
      v := v || substr(alfabeto, 1 + (get_byte(extensions.gen_random_bytes(1), 0) % length(alfabeto)), 1);
      if i = 4 then v := v || '-'; end if;
    end loop;
    exit when not exists (select 1 from empresa_certificados where codigo = v);
  end loop;
  return v;
end $$;

-- ── El lado de la empresa ───────────────────────────────────────────────────

create or replace function public.desafios_empresa(p_business uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare b businesses%rowtype;
begin
  if brote_biz_role(p_business) is null then return jsonb_build_object('ok', false, 'error', 'sin_permiso'); end if;
  select * into b from businesses where id = p_business;
  return jsonb_build_object(
    'ok', true,
    'verificada', b.status = 'approved',
    'puede_editar', brote_can_write(p_business, 'editor'),
    'desafios', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', d.id, 'slug', d.slug, 'titulo', d.titulo, 'resumen', d.resumen, 'categoria', d.categoria,
               'nivel', d.nivel, 'dias', d.dias_para_cumplir, 'requisitos', jsonb_array_length(d.requisitos),
               'inscripcion', case when i.id is null then null else jsonb_build_object(
                  'id', i.id, 'estado', i.estado, 'vence_at', i.vence_at, 'nota', i.nota,
                  'hechos', (select count(*) from empresa_desafio_evidencias e where e.inscripcion_id = i.id)) end,
               'certificado', (select jsonb_build_object('codigo', c.codigo, 'vence_at', c.vence_at,
                                        'vigente', c.revocado_at is null and c.vence_at > now())
                                 from empresa_certificados c where c.inscripcion_id = i.id))
             order by (i.id is null), d.categoria, d.nivel, d.orden)
        from empresa_desafios d
        left join empresa_desafio_inscripciones i on i.desafio_id = d.id and i.business_id = p_business
       where (d.estado = 'publicado' or i.id is not null)
         and (d.para = 'todas' or b.objetivo = 'ambos' or d.para = b.objetivo)
    ), '[]'::jsonb));
end $$;

create or replace function public.desafio_detalle(p_business uuid, p_slug text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare d empresa_desafios%rowtype; i empresa_desafio_inscripciones%rowtype;
begin
  if brote_biz_role(p_business) is null then return jsonb_build_object('ok', false, 'error', 'sin_permiso'); end if;
  select * into d from empresa_desafios where slug = p_slug;
  if not found then return jsonb_build_object('ok', false, 'error', 'no_existe'); end if;
  select * into i from empresa_desafio_inscripciones where desafio_id = d.id and business_id = p_business;
  if d.estado <> 'publicado' and i.id is null then return jsonb_build_object('ok', false, 'error', 'no_existe'); end if;
  return jsonb_build_object(
    'ok', true,
    'puede_editar', brote_can_write(p_business, 'editor'),
    'puede_inscribir', brote_biz_role(p_business) in ('owner', 'admin'),
    'verificada', (select status = 'approved' from businesses where id = p_business),
    'desafio', jsonb_build_object('id', d.id, 'slug', d.slug, 'titulo', d.titulo, 'resumen', d.resumen,
                 'descripcion', d.descripcion, 'categoria', d.categoria, 'nivel', d.nivel,
                 'requisitos', d.requisitos, 'dias', d.dias_para_cumplir, 'vigencia_meses', d.vigencia_meses,
                 'abierto', d.estado = 'publicado'),
    'inscripcion', case when i.id is null then null else jsonb_build_object(
        'id', i.id, 'estado', i.estado, 'inscripta_at', i.inscripta_at, 'vence_at', i.vence_at,
        'enviada_at', i.enviada_at, 'revisada_at', i.revisada_at, 'nota', i.nota) end,
    'evidencias', coalesce((select jsonb_object_agg(e.requisito_id, jsonb_build_object(
        'texto', e.texto, 'valor', e.valor, 'enlace', e.enlace, 'archivo_path', e.archivo_path,
        'completa', brote_evidencia_completa((select r ->> 'evidencia' from jsonb_array_elements(d.requisitos) r where r ->> 'id' = e.requisito_id), e)))
      from empresa_desafio_evidencias e where e.inscripcion_id = i.id), '{}'::jsonb),
    'certificado', (select jsonb_build_object('codigo', c.codigo, 'emitido_at', c.emitido_at, 'vence_at', c.vence_at,
                            'vigente', c.revocado_at is null and c.vence_at > now(), 'revocado', c.revocado_at is not null)
                      from empresa_certificados c where c.inscripcion_id = i.id));
end $$;

create or replace function public.desafio_inscribirse(p_business uuid, p_desafio uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare d empresa_desafios%rowtype; b businesses%rowtype; v_id uuid; v_activos int;
begin
  if brote_biz_role(p_business) not in ('owner', 'admin') then return jsonb_build_object('ok', false, 'error', 'sin_permiso'); end if;
  select * into b from businesses where id = p_business;
  if b.status <> 'approved' then return jsonb_build_object('ok', false, 'error', 'no_verificada'); end if;
  select * into d from empresa_desafios where id = p_desafio and estado = 'publicado';
  if not found then return jsonb_build_object('ok', false, 'error', 'no_existe'); end if;
  -- Cinco a la vez como mucho: un desafío es trabajo de verdad.
  select count(*) into v_activos from empresa_desafio_inscripciones
   where business_id = p_business and estado in ('en_curso', 'enviada', 'observada');
  if v_activos >= 5 then return jsonb_build_object('ok', false, 'error', 'demasiados'); end if;
  insert into empresa_desafio_inscripciones (desafio_id, business_id, vence_at)
  values (d.id, p_business, now() + make_interval(days => d.dias_para_cumplir))
  on conflict (desafio_id, business_id) do update
     set estado = 'en_curso', inscripta_at = now(), vence_at = now() + make_interval(days => d.dias_para_cumplir),
         enviada_at = null, revisada_at = null, nota = null
   where empresa_desafio_inscripciones.estado in ('vencida', 'abandonada', 'rechazada')
  returning id into v_id;
  if v_id is null then return jsonb_build_object('ok', false, 'error', 'ya_inscripta'); end if;
  return jsonb_build_object('ok', true, 'id', v_id);
end $$;

create or replace function public.desafio_evidencia_guardar(
  p_business uuid, p_inscripcion uuid, p_requisito text,
  p_texto text default null, p_valor numeric default null, p_enlace text default null, p_archivo text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare i empresa_desafio_inscripciones%rowtype; v_tipo text;
begin
  if not brote_can_write(p_business, 'editor') then return jsonb_build_object('ok', false, 'error', 'sin_permiso'); end if;
  select * into i from empresa_desafio_inscripciones where id = p_inscripcion and business_id = p_business;
  if not found then return jsonb_build_object('ok', false, 'error', 'no_existe'); end if;
  if i.estado not in ('en_curso', 'observada') then return jsonb_build_object('ok', false, 'error', 'cerrada'); end if;
  select r ->> 'evidencia' into v_tipo
    from empresa_desafios d, jsonb_array_elements(d.requisitos) r
   where d.id = i.desafio_id and r ->> 'id' = p_requisito;
  if v_tipo is null then return jsonb_build_object('ok', false, 'error', 'requisito'); end if;
  -- El archivo tiene que estar en la carpeta de ESTA empresa.
  if p_archivo is not null and p_archivo not like p_business || '/desafios/%' then
    return jsonb_build_object('ok', false, 'error', 'archivo');
  end if;
  if p_enlace is not null and p_enlace !~ '^https?://' then return jsonb_build_object('ok', false, 'error', 'enlace'); end if;
  if not brote_rate_limit('desafio_evidencia:' || p_business, 300, interval '1 day') then
    return jsonb_build_object('ok', false, 'error', 'limite');
  end if;
  insert into empresa_desafio_evidencias (inscripcion_id, requisito_id, texto, valor, enlace, archivo_path)
  values (p_inscripcion, p_requisito, nullif(btrim(coalesce(p_texto, '')), ''), p_valor, nullif(btrim(coalesce(p_enlace, '')), ''), p_archivo)
  on conflict (inscripcion_id, requisito_id) do update set
    texto = coalesce(excluded.texto, empresa_desafio_evidencias.texto),
    valor = coalesce(excluded.valor, empresa_desafio_evidencias.valor),
    enlace = coalesce(excluded.enlace, empresa_desafio_evidencias.enlace),
    archivo_path = coalesce(excluded.archivo_path, empresa_desafio_evidencias.archivo_path),
    updated_at = now();
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.desafio_enviar(p_business uuid, p_inscripcion uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare i empresa_desafio_inscripciones%rowtype; d empresa_desafios%rowtype; v_faltan text[];
begin
  if not brote_can_write(p_business, 'editor') then return jsonb_build_object('ok', false, 'error', 'sin_permiso'); end if;
  select * into i from empresa_desafio_inscripciones where id = p_inscripcion and business_id = p_business for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'no_existe'); end if;
  if i.estado not in ('en_curso', 'observada') then return jsonb_build_object('ok', false, 'error', 'cerrada'); end if;
  if i.vence_at < now() then return jsonb_build_object('ok', false, 'error', 'vencida'); end if;
  select * into d from empresa_desafios where id = i.desafio_id;
  select coalesce(array_agg(r ->> 'id'), '{}') into v_faltan
    from jsonb_array_elements(d.requisitos) r
   where not exists (select 1 from empresa_desafio_evidencias e
                      where e.inscripcion_id = i.id and e.requisito_id = r ->> 'id'
                        and brote_evidencia_completa(r ->> 'evidencia', e));
  if cardinality(v_faltan) > 0 then
    return jsonb_build_object('ok', false, 'error', 'incompleta', 'faltan', to_jsonb(v_faltan));
  end if;
  update empresa_desafio_inscripciones set estado = 'enviada', enviada_at = now() where id = i.id;
  perform brote_avisar_admins('desafios', 'Entrega de desafío para revisar',
    coalesce((select nombre_comercial from businesses where id = p_business), 'Una empresa') || ' mandó "' || d.titulo || '".',
    '/panel/desafios');
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.desafio_abandonar(p_business uuid, p_inscripcion uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if brote_biz_role(p_business) not in ('owner', 'admin') then return jsonb_build_object('ok', false, 'error', 'sin_permiso'); end if;
  update empresa_desafio_inscripciones set estado = 'abandonada'
   where id = p_inscripcion and business_id = p_business and estado in ('en_curso', 'observada');
  return jsonb_build_object('ok', found);
end $$;

-- ── El certificado, para cualquiera ─────────────────────────────────────────

create or replace function public.certificado_publico(p_codigo text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'ok', true,
    'codigo', c.codigo,
    'titulo', c.titulo,
    'nivel', c.nivel,
    'categoria', c.categoria,
    'requisitos', (select jsonb_agg(r ->> 'texto') from jsonb_array_elements(c.requisitos) r),
    'emitido_at', c.emitido_at,
    'vence_at', c.vence_at,
    'estado', case when c.revocado_at is not null then 'revocado'
                   when c.vence_at <= now() then 'vencido' else 'vigente' end,
    'motivo_revocacion', c.motivo_revocacion,
    'empresa', jsonb_build_object('nombre', b.nombre_comercial, 'slug', b.slug, 'logo', b.logo_url,
                                  'ciudad', b.ciudad, 'provincia', b.provincia),
    'resumen', d.resumen)
  from empresa_certificados c
  join businesses b on b.id = c.business_id
  join empresa_desafios d on d.id = c.desafio_id
  where c.codigo = upper(btrim(p_codigo));
$$;

-- Los certificados vigentes de una empresa, para su ficha pública.
create or replace function public.certificados_de_empresa(p_slug text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object('codigo', c.codigo, 'titulo', c.titulo, 'nivel', c.nivel,
                                               'categoria', c.categoria, 'emitido_at', c.emitido_at, 'vence_at', c.vence_at)
                            order by c.emitido_at desc), '[]'::jsonb)
    from empresa_certificados c join businesses b on b.id = c.business_id
   where b.slug = p_slug and b.status = 'approved' and c.revocado_at is null and c.vence_at > now();
$$;

-- ── El panel ────────────────────────────────────────────────────────────────

create or replace function public.admin_desafios(p_pass text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not admin_check(p_pass) then return jsonb_build_object('ok', false, 'error', 'Contraseña incorrecta'); end if;
  return jsonb_build_object('ok', true,
    'desafios', coalesce((select jsonb_agg(jsonb_build_object(
        'id', d.id, 'slug', d.slug, 'titulo', d.titulo, 'resumen', d.resumen, 'descripcion', d.descripcion,
        'categoria', d.categoria, 'nivel', d.nivel, 'requisitos', d.requisitos, 'dias', d.dias_para_cumplir,
        'vigencia_meses', d.vigencia_meses, 'para', d.para, 'estado', d.estado, 'orden', d.orden,
        'inscriptas', (select count(*) from empresa_desafio_inscripciones i where i.desafio_id = d.id and i.estado in ('en_curso','enviada','observada')),
        'certificadas', (select count(*) from empresa_certificados c where c.desafio_id = d.id and c.revocado_at is null))
      order by d.estado = 'archivado', d.categoria, d.nivel, d.orden) from empresa_desafios d), '[]'::jsonb),
    'certificados', coalesce((select jsonb_agg(jsonb_build_object(
        'codigo', c.codigo, 'titulo', c.titulo, 'empresa', b.nombre_comercial, 'emitido_at', c.emitido_at,
        'vence_at', c.vence_at, 'revocado', c.revocado_at is not null) order by c.emitido_at desc)
        from (select * from empresa_certificados order by emitido_at desc limit 100) c
        join businesses b on b.id = c.business_id), '[]'::jsonb));
end $$;

create or replace function public.admin_desafio_guardar(p_pass text, p_desafio jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_id uuid := nullif(p_desafio ->> 'id', '')::uuid; v_req jsonb := p_desafio -> 'requisitos';
begin
  if not admin_check(p_pass) then return jsonb_build_object('ok', false, 'error', 'Contraseña incorrecta'); end if;
  if not brote_desafio_requisitos_validos(v_req) then
    return jsonb_build_object('ok', false, 'error', 'Revisá los requisitos: cada uno con texto (5 a 300 letras) y tipo de evidencia, sin repetir.');
  end if;
  if v_id is null then
    insert into empresa_desafios (slug, titulo, resumen, descripcion, categoria, nivel, requisitos,
                                  dias_para_cumplir, vigencia_meses, para, estado, orden)
    values (p_desafio ->> 'slug', p_desafio ->> 'titulo', p_desafio ->> 'resumen', nullif(p_desafio ->> 'descripcion', ''),
            p_desafio ->> 'categoria', (p_desafio ->> 'nivel')::smallint, v_req,
            coalesce((p_desafio ->> 'dias')::int, 60), coalesce((p_desafio ->> 'vigencia_meses')::int, 12),
            coalesce(p_desafio ->> 'para', 'todas'), coalesce(p_desafio ->> 'estado', 'borrador'),
            coalesce((p_desafio ->> 'orden')::int, 0))
    returning id into v_id;
  else
    -- Con entregas en curso, los requisitos no cambian por debajo: se edita el
    -- texto, pero cambiar requisitos pide archivar y publicar uno nuevo.
    if exists (select 1 from empresa_desafio_inscripciones where desafio_id = v_id and estado in ('en_curso', 'enviada', 'observada'))
       and (select requisitos from empresa_desafios where id = v_id) is distinct from v_req then
      return jsonb_build_object('ok', false, 'error', 'Hay empresas trabajando en este desafío: los requisitos no se pueden cambiar. Archivalo y publicá uno nuevo.');
    end if;
    update empresa_desafios set
      slug = p_desafio ->> 'slug', titulo = p_desafio ->> 'titulo', resumen = p_desafio ->> 'resumen',
      descripcion = nullif(p_desafio ->> 'descripcion', ''), categoria = p_desafio ->> 'categoria',
      nivel = (p_desafio ->> 'nivel')::smallint, requisitos = v_req,
      dias_para_cumplir = coalesce((p_desafio ->> 'dias')::int, dias_para_cumplir),
      vigencia_meses = coalesce((p_desafio ->> 'vigencia_meses')::int, vigencia_meses),
      para = coalesce(p_desafio ->> 'para', para), estado = coalesce(p_desafio ->> 'estado', estado),
      orden = coalesce((p_desafio ->> 'orden')::int, orden), updated_at = now()
    where id = v_id;
  end if;
  return jsonb_build_object('ok', true, 'id', v_id);
exception
  when unique_violation then return jsonb_build_object('ok', false, 'error', 'Ya hay un desafío con esa dirección (slug).');
  when check_violation then return jsonb_build_object('ok', false, 'error', 'Algún campo no es válido: revisá título, resumen, categoría y nivel.');
end $$;

create or replace function public.admin_desafios_cola(p_pass text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not admin_check(p_pass) then return jsonb_build_object('ok', false, 'error', 'Contraseña incorrecta'); end if;
  return jsonb_build_object('ok', true, 'items', coalesce((
    select jsonb_agg(jsonb_build_object(
             'id', i.id, 'estado', i.estado, 'enviada_at', i.enviada_at, 'nota', i.nota,
             'empresa', jsonb_build_object('id', b.id, 'nombre', b.nombre_comercial, 'slug', b.slug, 'rubro', b.rubro,
                                           'ciudad', b.ciudad, 'provincia', b.provincia),
             'desafio', jsonb_build_object('titulo', d.titulo, 'nivel', d.nivel, 'categoria', d.categoria, 'requisitos', d.requisitos),
             'evidencias', coalesce((select jsonb_object_agg(e.requisito_id, jsonb_build_object(
                 'texto', e.texto, 'valor', e.valor, 'enlace', e.enlace, 'archivo_path', e.archivo_path))
               from empresa_desafio_evidencias e where e.inscripcion_id = i.id), '{}'::jsonb))
           order by i.enviada_at)
      from empresa_desafio_inscripciones i
      join businesses b on b.id = i.business_id
      join empresa_desafios d on d.id = i.desafio_id
     where i.estado = 'enviada'), '[]'::jsonb));
end $$;

create or replace function public.admin_desafio_revisar(p_pass text, p_inscripcion uuid, p_accion text, p_nota text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare i empresa_desafio_inscripciones%rowtype; d empresa_desafios%rowtype; v_codigo text; v_nota text := nullif(btrim(coalesce(p_nota, '')), '');
begin
  if not admin_check(p_pass) then return jsonb_build_object('ok', false, 'error', 'Contraseña incorrecta'); end if;
  if p_accion not in ('aprobar', 'observar', 'rechazar') then return jsonb_build_object('ok', false, 'error', 'accion'); end if;
  if p_accion in ('observar', 'rechazar') and v_nota is null then
    return jsonb_build_object('ok', false, 'error', 'Escribí qué falta o por qué: la empresa lo va a leer.');
  end if;
  select * into i from empresa_desafio_inscripciones where id = p_inscripcion for update;
  if not found or i.estado <> 'enviada' then return jsonb_build_object('ok', false, 'error', 'Esa entrega ya no está esperando revisión.'); end if;
  select * into d from empresa_desafios where id = i.desafio_id;

  if p_accion = 'aprobar' then
    v_codigo := brote_certificado_codigo();
    insert into empresa_certificados (codigo, business_id, desafio_id, inscripcion_id, titulo, nivel, categoria, requisitos, vence_at)
    values (v_codigo, i.business_id, d.id, i.id, d.titulo, d.nivel, d.categoria, d.requisitos,
            now() + make_interval(months => d.vigencia_meses));
    update empresa_desafio_inscripciones set estado = 'aprobada', revisada_at = now(), revisado_por = auth.uid(), nota = v_nota where id = i.id;
    perform brote_negocio_notificar(i.business_id, 'Certificado emitido: ' || d.titulo,
      'Revisamos la evidencia y está todo. Ya pueden mostrar el certificado ' || v_codigo || '.', '/negocio/desafios/' || d.slug);
  elsif p_accion = 'observar' then
    update empresa_desafio_inscripciones set estado = 'observada', revisada_at = now(), revisado_por = auth.uid(), nota = v_nota,
           vence_at = greatest(vence_at, now() + interval '14 days') where id = i.id;
    perform brote_negocio_notificar(i.business_id, 'Falta algo en "' || d.titulo || '"', v_nota, '/negocio/desafios/' || d.slug);
  else
    update empresa_desafio_inscripciones set estado = 'rechazada', revisada_at = now(), revisado_por = auth.uid(), nota = v_nota where id = i.id;
    perform brote_negocio_notificar(i.business_id, 'No pudimos aprobar "' || d.titulo || '"', v_nota, '/negocio/desafios/' || d.slug);
  end if;
  return jsonb_build_object('ok', true, 'codigo', v_codigo);
end $$;

create or replace function public.admin_certificado_revocar(p_pass text, p_codigo text, p_motivo text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare c empresa_certificados%rowtype;
begin
  if not admin_check(p_pass) then return jsonb_build_object('ok', false, 'error', 'Contraseña incorrecta'); end if;
  if length(btrim(coalesce(p_motivo, ''))) < 10 then
    return jsonb_build_object('ok', false, 'error', 'El motivo es público en la página del certificado: escribilo completo.');
  end if;
  update empresa_certificados set revocado_at = now(), motivo_revocacion = btrim(p_motivo)
   where codigo = upper(btrim(p_codigo)) and revocado_at is null returning * into c;
  if c.id is null then return jsonb_build_object('ok', false, 'error', 'No existe o ya estaba revocado.'); end if;
  perform brote_negocio_notificar(c.business_id, 'Certificado revocado: ' || c.titulo, btrim(p_motivo), '/negocio/desafios');
  return jsonb_build_object('ok', true);
end $$;

-- Vencer las inscripciones que se pasaron de fecha sin enviarse.
create or replace function public.brote_desafios_vencer()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare v_n int;
begin
  update empresa_desafio_inscripciones set estado = 'vencida'
   where estado in ('en_curso', 'observada') and vence_at < now();
  get diagnostics v_n = row_count;
  return v_n;
end $$;
select cron.unschedule('brote-desafios-vencer') where exists (select 1 from cron.job where jobname = 'brote-desafios-vencer');
select cron.schedule('brote-desafios-vencer', '50 3 * * *', $$select public.brote_desafios_vencer()$$);

-- La bandeja (0131) suma las entregas.
create or replace function public.admin_pendientes(p_pass text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not admin_check(p_pass) then
    return jsonb_build_object('ok', false, 'error', 'Contraseña incorrecta');
  end if;
  return jsonb_build_object(
    'ok', true,
    'reportes_plaza', (select count(*) from content_reports where status = 'open'),
    'negocios',       (select count(*) from businesses where status in ('submitted','in_review') and revision_note is null),
    'desafios',       (select count(*) from empresa_desafio_inscripciones where estado = 'enviada'),
    'listados',       (select count(*) from listings where status = 'pendiente'),
    'auditoria',      (select count(*) from listings where acelerada and auditado_at is null and status = 'publicado'),
    'reportes_mercado', (select count(*) from listing_reports where estado = 'abierto'),
    'objetivos',      (select count(*) from improvement_goals where status = 'en_revision'),
    'compromisos',    (select count(*) from tienda_compromisos c join businesses b on b.id = c.business_id
                        where c.estado = 'declarado' and c.foto_path is not null and b.status = 'approved'),
    'academia',       (select count(*) from ac_revision_cola where estado = 'pendiente'),
    'pagos_fallidos', (select count(*) from business_subscriptions where status = 'en_gracia')
                    + (select count(*) from subscriptions where status = 'paused')
                    + (select count(*) from pagos_eventos where procesado_at is null and recibido_at < now() - interval '10 minutes'),
    'errores_mundo_24h', (select count(*) from world_client_errors where created_at > now() - interval '24 hours')
  );
end $$;

-- ── Permisos ────────────────────────────────────────────────────────────────

revoke all on function public.brote_desafio_requisitos_validos(jsonb) from public, anon, authenticated;
revoke all on function public.brote_evidencia_completa(text, public.empresa_desafio_evidencias) from public, anon, authenticated;
revoke all on function public.brote_certificado_codigo() from public, anon, authenticated;
revoke all on function public.brote_desafios_vencer() from public, anon, authenticated;
revoke all on function public.desafios_empresa(uuid) from public, anon;
revoke all on function public.desafio_detalle(uuid, text) from public, anon;
revoke all on function public.desafio_inscribirse(uuid, uuid) from public, anon;
revoke all on function public.desafio_evidencia_guardar(uuid, uuid, text, text, numeric, text, text) from public, anon;
revoke all on function public.desafio_enviar(uuid, uuid) from public, anon;
revoke all on function public.desafio_abandonar(uuid, uuid) from public, anon;
revoke all on function public.admin_desafios(text) from public, anon;
revoke all on function public.admin_desafio_guardar(text, jsonb) from public, anon;
revoke all on function public.admin_desafios_cola(text) from public, anon;
revoke all on function public.admin_desafio_revisar(text, uuid, text, text) from public, anon;
revoke all on function public.admin_certificado_revocar(text, text, text) from public, anon;
grant execute on function public.desafios_empresa(uuid) to authenticated;
grant execute on function public.desafio_detalle(uuid, text) to authenticated;
grant execute on function public.desafio_inscribirse(uuid, uuid) to authenticated;
grant execute on function public.desafio_evidencia_guardar(uuid, uuid, text, text, numeric, text, text) to authenticated;
grant execute on function public.desafio_enviar(uuid, uuid) to authenticated;
grant execute on function public.desafio_abandonar(uuid, uuid) to authenticated;
grant execute on function public.admin_desafios(text) to authenticated;
grant execute on function public.admin_desafio_guardar(text, jsonb) to authenticated;
grant execute on function public.admin_desafios_cola(text) to authenticated;
grant execute on function public.admin_desafio_revisar(text, uuid, text, text) to authenticated;
grant execute on function public.admin_certificado_revocar(text, text, text) to authenticated;
revoke all on function public.certificado_publico(text) from public;
revoke all on function public.certificados_de_empresa(text) from public;
grant execute on function public.certificado_publico(text) to anon, authenticated;
grant execute on function public.certificados_de_empresa(text) to anon, authenticated;

-- ── Los desafíos sembrados ──────────────────────────────────────────────────
-- Diecisiete, en siete temas y tres niveles. Cada requisito se puede
-- comprobar con lo que una PyME tiene a mano: una foto, una factura, un dato.

insert into empresa_desafios (slug, titulo, resumen, descripcion, categoria, nivel, requisitos, dias_para_cumplir, para, estado, orden) values
('luz-eficiente', 'Luz eficiente', 'Toda la iluminación del local o la oficina pasa a LED.',
 'La iluminación es de los consumos más fáciles de bajar: una lámpara LED usa entre 75 y 85 % menos que una incandescente y dura años.',
 'energia', 1, '[
  {"id":"led_80","texto":"Al menos el 80 % de las luminarias son LED.","evidencia":"dato","unidad":"% de luminarias LED","ayuda":"Contá cuántas luminarias hay y cuántas son LED."},
  {"id":"fotos","texto":"Fotos de dos ambientes distintos con la iluminación nueva.","evidencia":"foto"},
  {"id":"descarte","texto":"Las lámparas viejas se descartaron como residuo especial (no a la basura común).","evidencia":"declaracion","ayuda":"Contá dónde las llevaste: punto limpio, campaña municipal, proveedor."}
 ]', 45, 'todas', 'publicado', 1),
('apagado-inteligente', 'Apagado inteligente', 'Nada queda prendido cuando no hay nadie: equipos, luces y aires.',
 'Los consumos en reposo y fuera de horario pueden ser hasta un 10 % de la factura. Un procedimiento simple y un responsable lo resuelven.',
 'energia', 1, '[
  {"id":"procedimiento","texto":"Un procedimiento de cierre escrito: qué se apaga, qué queda y quién lo controla.","evidencia":"declaracion"},
  {"id":"cartel","texto":"Un cartel visible con el procedimiento en el lugar de trabajo.","evidencia":"foto"},
  {"id":"zapatillas","texto":"Zapatillas con interruptor o temporizadores en los puestos con más equipos.","evidencia":"foto"}
 ]', 30, 'todas', 'publicado', 2),
('medir-para-bajar', 'Medir para bajar', 'Saber cuánta energía usan y bajarla un 10 % en tres meses.',
 'Lo que no se mide no se puede mejorar. Este desafío arma la línea de base con las facturas y fija una meta concreta.',
 'energia', 2, '[
  {"id":"base","texto":"Consumo eléctrico promedio de los últimos 3 meses (línea de base).","evidencia":"dato","unidad":"kWh por mes"},
  {"id":"facturas_base","texto":"Las facturas de esos 3 meses.","evidencia":"documento"},
  {"id":"plan","texto":"Tres medidas concretas para bajar el consumo, con su responsable.","evidencia":"declaracion"},
  {"id":"resultado","texto":"Consumo del tercer mes después de aplicar las medidas (al menos 10 % menos que la base).","evidencia":"dato","unidad":"kWh por mes"},
  {"id":"factura_final","texto":"La factura de ese mes.","evidencia":"documento"}
 ]', 120, 'todas', 'publicado', 3),
('energia-renovable', 'Energía renovable', 'Al menos un 20 % de la electricidad viene de fuentes renovables.',
 'Con paneles propios, un contrato de energía renovable o una cooperativa eléctrica que la provea.',
 'energia', 3, '[
  {"id":"porcentaje","texto":"Qué parte del consumo anual es renovable.","evidencia":"dato","unidad":"% del consumo"},
  {"id":"respaldo","texto":"El respaldo: factura de generación, contrato o certificado del proveedor.","evidencia":"documento"},
  {"id":"instalacion","texto":"Si es generación propia, foto de la instalación (si no, una foto del contrato o la factura).","evidencia":"foto"}
 ]', 180, 'todas', 'publicado', 4),
('separacion-en-origen', 'Separación en origen', 'Los residuos se separan donde se generan, en todas las áreas.',
 'Separar bien es el primer paso para que algo se recicle de verdad. Sin separación, lo reciclable termina enterrado.',
 'residuos', 1, '[
  {"id":"puntos","texto":"Cantidad de puntos de separación (reciclables, orgánicos y resto) instalados.","evidencia":"dato","unidad":"puntos"},
  {"id":"fotos","texto":"Fotos de los puntos de separación con su señalética.","evidencia":"foto"},
  {"id":"equipo","texto":"El equipo sabe qué va en cada lugar: contá cómo lo explicaron.","evidencia":"declaracion"}
 ]', 30, 'todas', 'publicado', 10),
('reciclado-con-destino', 'Reciclado con destino', 'Lo que se separa llega a una cooperativa, un recuperador o un punto verde.',
 'Separar sin un destino no sirve. Este desafío asegura que lo reciclable se recupere y que se sepa cuánto.',
 'residuos', 2, '[
  {"id":"acuerdo","texto":"Con quién retiran o dónde llevan los reciclables (cooperativa, recuperador urbano, punto verde).","evidencia":"declaracion"},
  {"id":"comprobantes","texto":"Comprobantes o registros de retiro de al menos dos meses.","evidencia":"documento"},
  {"id":"kilos","texto":"Kilos de reciclables recuperados por mes, en promedio.","evidencia":"dato","unidad":"kg por mes"}
 ]', 75, 'todas', 'publicado', 11),
('cero-descartables', 'Cero descartables', 'Sin vasos, cubiertos ni bolsas descartables en la atención ni en el equipo.',
 'Los descartables de un solo uso son de lo que más se ve en la basura de la calle. Cambiarlos por reutilizables es inmediato.',
 'residuos', 2, '[
  {"id":"alternativas","texto":"Fotos de las alternativas reutilizables en uso.","evidencia":"foto"},
  {"id":"evitados","texto":"Unidades descartables que dejan de usar por mes (estimadas).","evidencia":"dato","unidad":"unidades por mes"},
  {"id":"politica","texto":"La regla escrita: qué no se usa más y qué se ofrece a quien lo pide.","evidencia":"declaracion"}
 ]', 45, 'todas', 'publicado', 12),
('compostaje', 'Compostaje de orgánicos', 'Los restos orgánicos se compostan en vez de ir a la basura.',
 'La mitad de la basura de un comercio de comida es orgánica. Compostada, vuelve a la tierra en vez de generar metano en un relleno.',
 'residuos', 2, '[
  {"id":"como","texto":"Compostera propia o servicio de compostaje: foto o comprobante.","evidencia":"documento"},
  {"id":"kilos","texto":"Kilos de orgánicos compostados por mes, en promedio.","evidencia":"dato","unidad":"kg por mes"},
  {"id":"uso","texto":"Qué se hace con el compost (huerta, plantas, entrega a terceros).","evidencia":"declaracion"}
 ]', 60, 'todas', 'publicado', 13),
('agua-sin-perdidas', 'Agua sin pérdidas', 'Canillas e inodoros revisados, pérdidas arregladas y aireadores puestos.',
 'Una canilla que gotea puede tirar más de 30 litros por día. Un aireador baja el caudal a la mitad sin que se note.',
 'agua', 1, '[
  {"id":"revision","texto":"Revisión de todas las canillas, inodoros y cañerías a la vista: qué se encontró y qué se arregló.","evidencia":"declaracion"},
  {"id":"aireadores","texto":"Canillas con aireador o reductor de caudal.","evidencia":"dato","unidad":"canillas"},
  {"id":"fotos","texto":"Fotos de los aireadores instalados.","evidencia":"foto"}
 ]', 30, 'todas', 'publicado', 20),
('agua-medida', 'Agua medida', 'Medir el consumo de agua y bajarlo un 15 % en tres meses.',
 'Para empresas con medidor o con un consumo de agua importante (gastronomía, lavaderos, producción).',
 'agua', 3, '[
  {"id":"base","texto":"Consumo de agua promedio de los últimos 3 meses (línea de base).","evidencia":"dato","unidad":"m³ por mes"},
  {"id":"respaldo_base","texto":"Facturas o registros del medidor de esos meses.","evidencia":"documento"},
  {"id":"medidas","texto":"Qué cambiaron para consumir menos.","evidencia":"declaracion"},
  {"id":"resultado","texto":"Consumo del tercer mes (al menos 15 % menos que la base).","evidencia":"dato","unidad":"m³ por mes"},
  {"id":"respaldo_final","texto":"La factura o el registro de ese mes.","evidencia":"documento"}
 ]', 120, 'todas', 'publicado', 21),
('compras-responsables', 'Compras locales y responsables', 'Al menos un 30 % de lo que compran viene de proveedores locales o con atributos ambientales.',
 'Comprar cerca baja el transporte y fortalece la economía de la zona. Una política de compras simple ordena las decisiones.',
 'compras', 2, '[
  {"id":"politica","texto":"La política de compras: qué se prioriza y por qué.","evidencia":"declaracion"},
  {"id":"porcentaje","texto":"Qué parte de las compras (en pesos) es local o con atributos ambientales.","evidencia":"dato","unidad":"% de las compras"},
  {"id":"listado","texto":"Listado de esos proveedores con su localidad o su atributo.","evidencia":"documento"}
 ]', 60, 'todas', 'publicado', 30),
('envases-que-vuelven', 'Envases que vuelven', 'Clientes que pueden recargar o devolver los envases.',
 'Un sistema de recarga o de envases retornables evita un envase nuevo en cada compra.',
 'compras', 2, '[
  {"id":"sistema","texto":"Cómo funciona: recarga, retorno con seña o envase propio del cliente.","evidencia":"declaracion"},
  {"id":"fotos","texto":"Fotos del punto de recarga o de los envases retornables.","evidencia":"foto"},
  {"id":"ventas","texto":"Qué parte de las ventas de esos productos se hace sin envase nuevo.","evidencia":"dato","unidad":"% de las ventas"}
 ]', 60, 'vender', 'publicado', 31),
('movilidad-del-equipo', 'Movilidad sostenible del equipo', 'Más gente del equipo llega caminando, en bici, en transporte público o trabaja a distancia.',
 'Los viajes al trabajo suelen ser una parte grande de la huella de una PyME de servicios.',
 'movilidad', 2, '[
  {"id":"encuesta","texto":"Cómo viaja hoy el equipo (una encuesta simple y su resultado).","evidencia":"documento"},
  {"id":"facilidades","texto":"Qué facilitaron: bicicletero, vestuario, días remotos, horarios flexibles.","evidencia":"foto"},
  {"id":"porcentaje","texto":"Qué parte del equipo viaja de forma sostenible al menos 3 días por semana.","evidencia":"dato","unidad":"% del equipo"}
 ]', 60, 'todas', 'publicado', 40),
('logistica-limpia', 'Logística limpia', 'Al menos un 30 % de las entregas se hace en bici, vehículo eléctrico o consolidada.',
 'Para comercios con reparto. Juntar entregas por zona o hacerlas en bici baja emisiones y costos.',
 'movilidad', 3, '[
  {"id":"como","texto":"Cómo hacen esas entregas (propias, cadetería en bici, operador con flota eléctrica, rutas consolidadas).","evidencia":"declaracion"},
  {"id":"respaldo","texto":"Contrato, factura del servicio o registro de las rutas.","evidencia":"documento"},
  {"id":"porcentaje","texto":"Qué parte de las entregas del último mes se hizo así.","evidencia":"dato","unidad":"% de las entregas"}
 ]', 90, 'vender', 'publicado', 41),
('equipo-que-sabe', 'Equipo que sabe', 'Al menos el 80 % del equipo hizo una capacitación ambiental de una hora o más.',
 'Puede ser una charla, un curso o los caminos de la Academia de Brote. Un equipo que entiende el porqué sostiene los cambios.',
 'comunidad', 1, '[
  {"id":"capacitacion","texto":"Qué capacitación hicieron, cuándo y con quién.","evidencia":"declaracion"},
  {"id":"personas","texto":"Cuántas personas del equipo la completaron, de cuántas.","evidencia":"dato","unidad":"% del equipo"},
  {"id":"registro","texto":"Registro de asistencia, certificados o fotos.","evidencia":"documento"}
 ]', 45, 'todas', 'publicado', 50),
('huella-de-carbono', 'Huella de carbono básica', 'Medir las emisiones propias y de la energía comprada, con un plan para bajarlas.',
 'Alcance 1 (combustibles propios) y alcance 2 (electricidad), con una calculadora reconocida, y tres metas con fecha.',
 'gestion', 3, '[
  {"id":"informe","texto":"El cálculo de la huella (alcances 1 y 2) con la herramienta usada y los datos de entrada.","evidencia":"documento"},
  {"id":"total","texto":"La huella total del último año.","evidencia":"dato","unidad":"t CO₂e por año"},
  {"id":"plan","texto":"Tres metas de reducción con fecha y responsable.","evidencia":"declaracion"}
 ]', 120, 'mejorar', 'publicado', 60),
('comunicacion-honesta', 'Comunicación honesta', 'Contar lo que hacen y lo que todavía no, sin exagerar.',
 'Decir de más destruye la confianza. Este desafío pide mostrar en público lo hecho y lo pendiente, con respaldo.',
 'gestion', 1, '[
  {"id":"publicacion","texto":"Dónde lo cuentan (su sitio, sus redes o su ficha en Brote).","evidencia":"enlace"},
  {"id":"pendiente","texto":"Qué todavía no hacen y piensan hacer (tiene que estar en lo publicado).","evidencia":"declaracion"},
  {"id":"sin_superlativos","texto":"Lo publicado no usa palabras como \"100 % sustentable\", \"eco\" o \"verde\" sin respaldo.","evidencia":"declaracion"}
 ]', 30, 'todas', 'publicado', 61)
on conflict (slug) do nothing;
