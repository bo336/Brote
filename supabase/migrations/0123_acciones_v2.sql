-- 0123 — Acciones v2: el modelo, las reglas del día y las mecánicas nuevas.
--
-- Plan y auditoría completos en docs/ACCIONES.md. En corto: el set del día no
-- sabía nada de la persona (ni contexto, ni estación, ni región, ni lo que
-- hace o deja), no repartía los temas, no se podía cambiar, y "Más acciones"
-- salía sin filtro de edad y siempre igual. Esta migración trae:
--
--   1. Columnas nuevas en `activities` (formato, minutos, costo, ahorra,
--      requiere, lugar, estaciones, días, regiones, con_adulto, medida,
--      fuente, camino, tags), todas con valor por omisión.
--   2. Caminos (`caminos`, `user_caminos`), feedback (`acciones_feedback`),
--      motivos y cambios del día (`daily_sets.razones/cambios`).
--   3. El impacto de cada acción hecha queda CONGELADO en su fila
--      (`activity_completions.impact_*`, con la cantidad si es medible), así
--      corregir el catálogo no reescribe el pasado de nadie.
--   4. Una sola elegibilidad (`brote_accion_apta`) para el set, "Más", Para
--      vos, la rutina, la Plaza y la Academia.
--   5. El generador del día v2 (`brote_candidatas` + `brote_armar_dia`), con
--      reglas que el dueño puede ajustar en `app_settings.acciones_reglas`.
--   6. RPCs: `acciones_de_hoy`, `acciones_cambiar`, `acciones_sugeridas`,
--      `acciones_ocultar`, `mis_acciones_ocultas`, `acciones_mostrar_de_nuevo`,
--      `mis_caminos`; `complete_activity` con cantidad y caminos.
--
-- El espejo de las reglas en TypeScript es `lib/acciones/reglas.ts`; los
-- tests de `lib/acciones/__tests__` comparan los dos.

-- ── 1 · El modelo de una acción ─────────────────────────────────────────────

alter table public.activities
  add column if not exists formato     text     not null default 'gesto',
  add column if not exists minutos     smallint not null default 5,
  add column if not exists costo       text     not null default 'gratis',
  add column if not exists ahorra      boolean  not null default false,
  add column if not exists requiere    text[]   not null default '{}',
  add column if not exists lugar       text     not null default 'casa',
  add column if not exists estaciones  text[]   not null default '{}',
  add column if not exists dias        text,
  add column if not exists regiones    text[]   not null default '{}',
  add column if not exists con_adulto  boolean  not null default false,
  add column if not exists medida      jsonb,
  add column if not exists fuente      text,
  add column if not exists fuente_url  text,
  add column if not exists camino_slug text,
  add column if not exists camino_paso smallint,
  add column if not exists tags        text[]   not null default '{}',
  -- Lo que la acción deja armado: al completarla se marca en el contexto
  -- ("Empezá a compostar" → compost) y se abren las que lo piden.
  add column if not exists otorga      text;

alter table public.activities drop constraint if exists activities_formato_chk;
alter table public.activities add constraint activities_formato_chk
  check (formato in ('gesto','tarea','salida','social','observar','aprender','reto'));
alter table public.activities drop constraint if exists activities_minutos_chk;
alter table public.activities add constraint activities_minutos_chk check (minutos between 1 and 600);
alter table public.activities drop constraint if exists activities_costo_chk;
alter table public.activities add constraint activities_costo_chk check (costo in ('gratis','bajo'));
alter table public.activities drop constraint if exists activities_lugar_chk;
alter table public.activities add constraint activities_lugar_chk
  check (lugar in ('casa','calle','compras','trabajo','escuela','naturaleza','celular'));
alter table public.activities drop constraint if exists activities_dias_chk;
alter table public.activities add constraint activities_dias_chk check (dias is null or dias in ('habil','finde'));
alter table public.activities drop constraint if exists activities_requiere_chk;
alter table public.activities add constraint activities_requiere_chk check (requiere <@ array[
  'balcon','jardin','pileta','edificio','auto','bici','gas','aire','lena','parrilla',
  'perro','gato','chicos','trabajo','estudio','campo','costa','compost','huerta','mascota']::text[]);
alter table public.activities drop constraint if exists activities_otorga_chk;
alter table public.activities add constraint activities_otorga_chk check (otorga is null or otorga in ('compost','huerta'));
alter table public.activities drop constraint if exists activities_estaciones_chk;
alter table public.activities add constraint activities_estaciones_chk
  check (estaciones <@ array['verano','otono','invierno','primavera']::text[]);
alter table public.activities drop constraint if exists activities_regiones_chk;
alter table public.activities add constraint activities_regiones_chk
  check (regiones <@ array['centro','cuyo','noa','nea','patagonia']::text[]);
alter table public.activities drop constraint if exists activities_medida_chk;
alter table public.activities add constraint activities_medida_chk
  check (medida is null or (jsonb_typeof(medida) = 'object' and medida ? 'por' and medida ? 'max'));

-- Hasta que llegue el catálogo nuevo (0124), algo razonable para lo que hay.
update public.activities set formato = 'tarea', minutos = 30 where type = 'catalog' and formato = 'gesto';

-- "Regá tu mundo" es del juego, no del mundo real: fuera del set y del catálogo.
update public.activities set active = false where slug = 'cuida-tu-mundo';

-- ── 2 · Caminos, feedback y el día ──────────────────────────────────────────

create table if not exists public.caminos (
  slug              text primary key,
  titulo_es         text not null,
  descripcion_es    text not null,
  domain_slug       text not null references public.domains(slug),
  orden             int  not null default 0,
  recompensa_puntos int  not null default 300 check (recompensa_puntos between 0 and 2000),
  active            boolean not null default true,
  created_at        timestamptz not null default now()
);
alter table public.caminos enable row level security;
drop policy if exists "caminos read" on public.caminos;
create policy "caminos read" on public.caminos for select using (active);
revoke all on public.caminos from anon, authenticated;
grant select on public.caminos to anon, authenticated;

alter table public.activities drop constraint if exists activities_camino_fk;
alter table public.activities add constraint activities_camino_fk
  foreign key (camino_slug) references public.caminos(slug) on delete set null;
create index if not exists activities_camino_idx on public.activities (camino_slug) where camino_slug is not null;

create table if not exists public.user_caminos (
  user_id      uuid not null references public.profiles(id) on delete cascade,
  camino_slug  text not null references public.caminos(slug) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, camino_slug)
);
alter table public.user_caminos enable row level security;
drop policy if exists "user_caminos owner read" on public.user_caminos;
create policy "user_caminos owner read" on public.user_caminos for select using ((select auth.uid()) = user_id);
revoke all on public.user_caminos from anon, authenticated;
grant select on public.user_caminos to authenticated;
create index if not exists user_caminos_camino_idx on public.user_caminos (camino_slug);

create table if not exists public.acciones_feedback (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  activity_id uuid not null references public.activities(id) on delete cascade,
  motivo      text not null check (motivo in ('hoy_no','no_aplica','ya_lo_hago','no_me_gusta')),
  local_date  date not null,
  -- "Mostrar de nuevo" no borra la historia: la marca.
  deshecho    boolean not null default false,
  created_at  timestamptz not null default now()
);
alter table public.acciones_feedback enable row level security;
drop policy if exists "acciones_feedback owner read" on public.acciones_feedback;
create policy "acciones_feedback owner read" on public.acciones_feedback for select using ((select auth.uid()) = user_id);
revoke all on public.acciones_feedback from anon, authenticated;
grant select on public.acciones_feedback to authenticated;
create index if not exists acciones_feedback_user_idx on public.acciones_feedback (user_id, activity_id);
create index if not exists acciones_feedback_activity_idx on public.acciones_feedback (activity_id, motivo);

alter table public.daily_sets
  add column if not exists razones jsonb    not null default '{}',
  add column if not exists cambios smallint not null default 0,
  add column if not exists version smallint not null default 1;

-- ── 3 · Impacto congelado en cada acción hecha ──────────────────────────────

alter table public.activity_completions
  add column if not exists cantidad          numeric,
  add column if not exists impact_water_l    numeric,
  add column if not exists impact_co2_kg     numeric,
  add column if not exists impact_waste_kg   numeric,
  add column if not exists impact_energy_kwh numeric;

-- Lo ya hecho conserva exactamente lo que mostraba: se copia antes de que el
-- catálogo nuevo (0124) corrija los números.
update public.activity_completions ac
   set impact_water_l = a.impact_water_l, impact_co2_kg = a.impact_co2_kg,
       impact_waste_kg = a.impact_waste_kg, impact_energy_kwh = a.impact_energy_kwh
  from public.activities a
 where a.id = ac.activity_id and ac.impact_water_l is null;

create or replace function public.brote_user_impact(p_uid uuid)
returns jsonb
language sql
stable security definer
set search_path = public
as $$
  select jsonb_build_object(
    'water_l',    coalesce(sum(coalesce(ac.impact_water_l, a.impact_water_l)), 0),
    'co2_kg',     coalesce(sum(coalesce(ac.impact_co2_kg, a.impact_co2_kg)), 0),
    'waste_kg',   coalesce(sum(coalesce(ac.impact_waste_kg, a.impact_waste_kg)), 0),
    'energy_kwh', coalesce(sum(coalesce(ac.impact_energy_kwh, a.impact_energy_kwh)), 0),
    'actions',    count(*)
  )
  from activity_completions ac
  join activities a on a.id = ac.activity_id
  where ac.user_id = p_uid and ac.status in ('honor','verified');
$$;

create or replace function public.brote_user_impact_since(p_uid uuid, p_days integer default 7)
returns jsonb
language sql
stable security definer
set search_path = public
as $$
  select jsonb_build_object(
    'water_l',    coalesce(sum(coalesce(ac.impact_water_l, a.impact_water_l)), 0),
    'co2_kg',     coalesce(sum(coalesce(ac.impact_co2_kg, a.impact_co2_kg)), 0),
    'waste_kg',   coalesce(sum(coalesce(ac.impact_waste_kg, a.impact_waste_kg)), 0),
    'energy_kwh', coalesce(sum(coalesce(ac.impact_energy_kwh, a.impact_energy_kwh)), 0),
    'actions',    count(*)
  )
  from activity_completions ac
  join activities a on a.id = ac.activity_id
  where ac.user_id = p_uid and ac.status in ('honor','verified')
    and ac.local_date >= ((now() at time zone 'America/Argentina/Buenos_Aires')::date
                          - greatest(0, p_days - 1));
$$;

create or replace function public.world_collective_impact()
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare v_row public.world_collective;
begin
  select * into v_row from public.world_collective where id = 1;

  if v_row.refreshed_at < now() - interval '1 hour' then
    update public.world_collective c
       set water_l = agg.water_l, co2_kg = agg.co2_kg, waste_kg = agg.waste_kg,
           energy_kwh = agg.energy_kwh, people = agg.people, refreshed_at = now()
      from (
        select coalesce(sum(coalesce(ac.impact_water_l, a.impact_water_l)), 0)       as water_l,
               coalesce(sum(coalesce(ac.impact_co2_kg, a.impact_co2_kg)), 0)         as co2_kg,
               coalesce(sum(coalesce(ac.impact_waste_kg, a.impact_waste_kg)), 0)     as waste_kg,
               coalesce(sum(coalesce(ac.impact_energy_kwh, a.impact_energy_kwh)), 0) as energy_kwh,
               count(distinct ac.user_id)                                            as people
          from activity_completions ac
          join activities a on a.id = ac.activity_id
         where ac.status in ('honor', 'verified')
      ) agg
     where c.id = 1
    returning c.* into v_row;
  end if;

  return jsonb_build_object(
    'water_l', v_row.water_l, 'co2_kg', v_row.co2_kg, 'waste_kg', v_row.waste_kg,
    'energy_kwh', v_row.energy_kwh, 'people', v_row.people,
    'refreshed_at', v_row.refreshed_at);
end $fn$;

-- ── 4 · Región, estación, efemérides, reglas ────────────────────────────────

create or replace function public.brote_region(p_provincia text)
returns text
language sql
immutable
as $$
  select case
    when p_provincia in ('Ciudad Autónoma de Buenos Aires','Buenos Aires','Córdoba','Santa Fe','Entre Ríos','La Pampa') then 'centro'
    when p_provincia in ('Mendoza','San Juan','San Luis') then 'cuyo'
    when p_provincia in ('Jujuy','Salta','Tucumán','Catamarca','Santiago del Estero','La Rioja') then 'noa'
    when p_provincia in ('Misiones','Corrientes','Chaco','Formosa') then 'nea'
    when p_provincia in ('Neuquén','Río Negro','Chubut','Santa Cruz','Tierra del Fuego') then 'patagonia'
  end;
$$;

-- Hemisferio sur.
create or replace function public.brote_estacion(p_fecha date)
returns text
language sql
immutable
as $$
  select case
    when extract(month from p_fecha) in (12, 1, 2) then 'verano'
    when extract(month from p_fecha) in (3, 4, 5) then 'otono'
    when extract(month from p_fecha) in (6, 7, 8) then 'invierno'
    else 'primavera'
  end;
$$;

-- Fechas fijas; empuja su tema dos días antes y dos después.
create or replace function public.brote_efemeride(p_fecha date)
returns jsonb
language sql
immutable
as $$
  with e(mes, dia, slug, nombre, dominios, tags) as (values
    (1, 26, 'educacion-ambiental', 'Día de la Educación Ambiental', array['ciencia','comunidad'], array[]::text[]),
    (2, 2, 'humedales', 'Día Mundial de los Humedales', array['agua_azul'], array['humedal']),
    (3, 3, 'vida-silvestre', 'Día Mundial de la Vida Silvestre', array['animales'], array[]::text[]),
    (3, 21, 'bosques', 'Día Internacional de los Bosques', array['plantas'], array['arbol']),
    (3, 22, 'agua', 'Día Mundial del Agua', array['agua'], array[]::text[]),
    (4, 22, 'tierra', 'Día de la Tierra', array['aire_suelo','plantas'], array[]::text[]),
    (4, 29, 'animal', 'Día del Animal', array['animales'], array['perro','gato']),
    (5, 17, 'reciclaje', 'Día Mundial del Reciclaje', array['residuos'], array['reciclaje']),
    (5, 20, 'abejas', 'Día Mundial de las Abejas', array['plantas'], array['polinizadores']),
    (5, 22, 'biodiversidad', 'Día de la Diversidad Biológica', array['ciencia','animales'], array[]::text[]),
    (6, 3, 'bicicleta', 'Día Mundial de la Bicicleta', array['movilidad'], array['bici']),
    (6, 5, 'medio-ambiente', 'Día Mundial del Medio Ambiente', array['residuos','consumo'], array['plastico']),
    (6, 8, 'oceanos', 'Día Mundial de los Océanos', array['agua_azul'], array[]::text[]),
    (6, 17, 'desertificacion', 'Día de Lucha contra la Desertificación', array['aire_suelo'], array['suelo']),
    (7, 3, 'sin-bolsas', 'Día Internacional Libre de Bolsas de Plástico', array['consumo'], array['bolsa','plastico']),
    (7, 7, 'suelo-ar', 'Día Nacional de la Conservación del Suelo', array['aire_suelo'], array['suelo','compost']),
    (8, 1, 'pachamama', 'Día de la Pachamama', array['aire_suelo','plantas'], array['suelo','semillas']),
    (8, 29, 'arbol', 'Día del Árbol', array['plantas'], array['arbol']),
    (9, 22, 'sin-auto', 'Día Mundial sin Auto', array['movilidad'], array[]::text[]),
    (9, 27, 'conciencia-ambiental', 'Día Nacional de la Conciencia Ambiental', array['comunidad'], array[]::text[]),
    (9, 29, 'desperdicio', 'Día contra la Pérdida y el Desperdicio de Alimentos', array['alimentacion'], array['desperdicio']),
    (10, 16, 'alimentacion', 'Día Mundial de la Alimentación', array['alimentacion'], array[]::text[]),
    (10, 21, 'ahorro-energia', 'Día Mundial del Ahorro de Energía', array['energia'], array[]::text[]),
    (11, 6, 'parques-nacionales', 'Día de los Parques Nacionales', array['animales','plantas'], array['nativas']),
    (11, 30, 'mate', 'Día Nacional del Mate', array[]::text[], array['mate']),
    (12, 5, 'suelo', 'Día Mundial del Suelo', array['aire_suelo'], array['suelo','compost'])
  ), c as (
    select e.*, make_date(y, e.mes, e.dia) as fecha
      from e, unnest(array[extract(year from p_fecha)::int - 1,
                           extract(year from p_fecha)::int,
                           extract(year from p_fecha)::int + 1]) y
  )
  select jsonb_build_object('slug', slug, 'nombre', nombre, 'dominios', to_jsonb(dominios),
                            'tags', to_jsonb(tags), 'fecha', fecha, 'dias', fecha - p_fecha)
    from c
   where abs(fecha - p_fecha) <= 2
   order by abs(fecha - p_fecha), fecha
   limit 1;
$$;

-- Los valores por omisión, pisables desde el panel. Mismo objeto que
-- REGLAS en lib/acciones/reglas.ts (un test los compara).
create or replace function public.brote_acciones_reglas()
returns jsonb
language sql
stable security definer
set search_path = public
as $$
  with d as (
    select '{"tamano":5,"rapidas_min":3,"rapida_minutos":5,"larga_minutos":15,"max_largas":1,"max_por_dominio":1,"max_temporada":2,"ventana_dias":21,"cambios_por_dia":3,"ya_lo_hago_dias":60,"hoy_no_dias":7,"hecha_reciente_dias":3,"pesos":{"interes":30,"afinidad":15,"nueva":20,"temporada":8,"efemeride":25,"contexto":10,"impacto_medio":5,"impacto_alto":10,"ofrecida":25,"hoy_no":15,"hecha_reciente":15,"azar":20}}'::jsonb as j
  ), s as (
    select case when jsonb_typeof(v) = 'object' then v else '{}'::jsonb end as j
      from (select (select value from app_settings where key = 'acciones_reglas') as v) x
  )
  select (d.j || s.j)
         || jsonb_build_object('pesos', (d.j -> 'pesos')
              || case when jsonb_typeof(s.j -> 'pesos') = 'object' then s.j -> 'pesos' else '{}'::jsonb end)
    from d, s;
$$;

insert into public.app_settings (key, value, description)
values ('acciones_reglas', '{}'::jsonb,
        'Reglas del set de acciones del día (docs/ACCIONES.md §5). Vacío = los valores por omisión. Ej.: {"tamano":5,"cambios_por_dia":3,"pesos":{"interes":30}}')
on conflict (key) do nothing;

-- ── 5 · ¿Le sirve? ──────────────────────────────────────────────────────────

do $$ begin
  if not exists (select 1 from pg_type where typname = 'brote_perfil_accion') then
    create type public.brote_perfil_accion as (
      uid uuid, edad text, tier int, ctx jsonb, region text, estacion text, dow int, fecha date, intereses text[]
    );
  end if;
end $$;

-- Todo lo que hace falta saber de una persona para elegirle acciones.
create or replace function public.brote_perfil_accion(p_uid uuid, p_fecha date default null)
returns public.brote_perfil_accion
language sql
stable security definer
set search_path = public
as $$
  with b as (
    select p.*,
           coalesce(p_fecha, (now() at time zone coalesce(p.timezone, 'America/Argentina/Buenos_Aires'))::date) as f,
           coalesce(p.account_type::text, 'adult') as edad
      from profiles p where p.id = p_uid
  )
  select (b.id,
          b.edad,
          coalesce((brote_get_rank(b.total_xp) ->> 'tier')::int, 1),
          coalesce(b.context, '{}'::jsonb)
            || case when b.edad in ('kid','teen') and not (coalesce(b.context, '{}'::jsonb) ? 'estudio')
                    then '{"estudio": true}'::jsonb else '{}'::jsonb end
            -- Quien tiene jardín tiene un lugar afuera.
            || case when coalesce(b.context, '{}'::jsonb) -> 'jardin' = 'true'::jsonb
                    then '{"balcon": true}'::jsonb else '{}'::jsonb end
            -- Mascota = perro o gato (y la respuesta del onboarding viejo).
            || case when coalesce(b.context, '{}'::jsonb) -> 'perro' = 'true'::jsonb
                      or coalesce(b.context, '{}'::jsonb) -> 'gato' = 'true'::jsonb
                    then '{"mascota": true}'::jsonb else '{}'::jsonb end,
          brote_region(b.city),
          brote_estacion(b.f),
          extract(dow from b.f)::int,
          b.f,
          coalesce(b.interests, '{}'))::public.brote_perfil_accion
    from b;
$$;

-- Tiene todo lo que la acción pide. Sólo `true` cuenta: si no sabemos, no suponemos.
create or replace function public.brote_contexto_tiene(p_ctx jsonb, p_req text[])
returns boolean
language sql
immutable
as $$
  select coalesce(bool_and(coalesce(p_ctx -> k = 'true'::jsonb, false)), true)
    from unnest(coalesce(p_req, '{}')) k;
$$;

-- La misma pregunta para todo el que elige acciones (set, Más, Para vos,
-- rutina, Plaza, Academia). Lo que depende del historial va aparte.
create or replace function public.brote_accion_apta(a public.activities, p public.brote_perfil_accion)
returns boolean
language sql
stable
set search_path = public
as $$
  select a.active
     -- Las de uso interno (la jornada de un proyecto) no se ofrecen nunca.
     and not ('interno' = any(a.tags))
     and p.edad = any(a.age_groups)
     and coalesce((select r.tier from ranks r where r.slug = a.min_rank_slug), 1) <= p.tier
     and brote_contexto_tiene(p.ctx, a.requiere)
     and (cardinality(a.estaciones) = 0 or p.estacion = any(a.estaciones))
     and (cardinality(a.regiones) = 0 or p.region = any(a.regiones))
     and (a.dias is null
          or (a.dias = 'habil' and p.dow between 1 and 5)
          or (a.dias = 'finde' and p.dow in (0, 6)));
$$;

-- Las que la persona sacó (no aplica / no me interesa) o dijo que ya hace.
create or replace function public.brote_acciones_fuera(p_uid uuid, p_local date)
returns setof uuid
language sql
stable security definer
set search_path = public
as $$
  select f.activity_id
    from acciones_feedback f
   where f.user_id = p_uid and not f.deshecho
     and (f.motivo in ('no_aplica','no_me_gusta')
          or (f.motivo = 'ya_lo_hago'
              and f.local_date >= p_local - (brote_acciones_reglas() ->> 'ya_lo_hago_dias')::int));
$$;

-- ── 6 · Candidatas con puntaje y motivo (§5) ────────────────────────────────

create or replace function public.brote_candidatas(
  p_uid uuid, p_local date, p_tipo text, p_excluir uuid[] default '{}'
)
returns table (id uuid, d text, m int, i text, n boolean, t boolean, s int, r jsonb)
language sql
stable security definer
set search_path = public
as $$
  with R as (select brote_acciones_reglas() as j),
  w as (
    select (j #>> '{pesos,interes}')::int as interes, (j #>> '{pesos,afinidad}')::int as afinidad,
           (j #>> '{pesos,nueva}')::int as nueva, (j #>> '{pesos,temporada}')::int as temporada,
           (j #>> '{pesos,efemeride}')::int as efemeride, (j #>> '{pesos,contexto}')::int as contexto,
           (j #>> '{pesos,impacto_medio}')::int as imp_medio, (j #>> '{pesos,impacto_alto}')::int as imp_alto,
           (j #>> '{pesos,ofrecida}')::int as ofrecida, (j #>> '{pesos,hoy_no}')::int as hoy_no,
           (j #>> '{pesos,hecha_reciente}')::int as hecha_rec, (j #>> '{pesos,azar}')::int as azar,
           (j ->> 'ventana_dias')::int as ventana, (j ->> 'hoy_no_dias')::int as hoy_no_dias,
           (j ->> 'hecha_reciente_dias')::int as hecha_dias
      from R
  ),
  p as (select brote_perfil_accion(p_uid, p_local) as v),
  efe as (
    select x as e,
           coalesce(array(select jsonb_array_elements_text(x -> 'dominios')), '{}') as dom,
           coalesce(array(select jsonb_array_elements_text(x -> 'tags')), '{}') as tags
      from (select brote_efemeride(p_local) as x) z
  ),
  hist as (
    select ac.activity_id, max(ac.local_date) as ultima
      from activity_completions ac
     where ac.user_id = p_uid and ac.status in ('honor','verified')
     group by ac.activity_id
  ),
  dom as (
    select ac.domain_slug, count(*)::numeric / sum(count(*)) over () as share
      from activity_completions ac
     where ac.user_id = p_uid and ac.status in ('honor','verified') and ac.local_date >= p_local - 60
     group by ac.domain_slug
  ),
  ofrecidas as (
    select distinct x.aid
      from daily_sets ds, unnest(ds.activity_ids) x(aid), w
     where ds.user_id = p_uid and ds.local_date >= p_local - w.ventana and ds.local_date < p_local
  ),
  hoy_no as (
    select distinct f.activity_id
      from acciones_feedback f, w
     where f.user_id = p_uid and f.motivo = 'hoy_no' and f.local_date >= p_local - w.hoy_no_dias
  ),
  base as (
    select a.*, h.activity_id is null as nunca, h.ultima, coalesce(dom.share, 0) as share,
           o.aid is not null as fue_ofrecida, hn.activity_id is not null as dijo_hoy_no,
           (efe.e is not null and (a.domain_slug = any(efe.dom) or a.tags && efe.tags)) as en_efe
      from activities a
      cross join p
      cross join efe
      left join hist h on h.activity_id = a.id
      left join dom on dom.domain_slug = a.domain_slug
      left join ofrecidas o on o.aid = a.id
      left join hoy_no hn on hn.activity_id = a.id
     where a.type::text = p_tipo
       and brote_accion_apta(a, p.v)
       and not (a.id = any(coalesce(p_excluir, '{}')))
       and a.id not in (select brote_acciones_fuera(p_uid, p_local))
       and a.id not in (select uh.activity_id from user_habits uh where uh.user_id = p_uid and uh.active)
       -- Hecha hoy (el día) o todavía enfriándose (el catálogo): no se ofrece.
       and coalesce(h.ultima, '-infinity'::date) < p_local
       and (a.type = 'daily' or not exists (
             select 1 from activity_completions ac
              where ac.user_id = p_uid and ac.activity_id = a.id
                and ac.status in ('honor','verified','pending')
                and (a.frequency = 'one_time'
                     or (a.frequency = 'weekly' and ac.completed_at > now() - interval '168 hours')
                     or (a.frequency = 'recurring' and ac.completed_at > now()
                         - make_interval(hours => greatest(coalesce(nullif(a.repeat_cooldown_hours, 0), 20), 1))))))
  )
  select b.id, b.domain_slug, b.minutos::int, b.impact::text, b.nunca, cardinality(b.estaciones) > 0,
         ( (case when b.domain_slug = any((p.v).intereses) then w.interes else 0 end)
         + round(w.afinidad * least(1, b.share * 3))::int
         + (case when b.nunca then w.nueva else 0 end)
         + (case when cardinality(b.estaciones) > 0 then w.temporada else 0 end)
         + (case when b.en_efe then w.efemeride else 0 end)
         + (case when cardinality(b.requiere) > 0 then w.contexto else 0 end)
         + (case b.impact when 'high' then w.imp_alto when 'medium' then w.imp_medio else 0 end)
         - (case when b.fue_ofrecida then w.ofrecida else 0 end)
         - (case when b.dijo_hoy_no then w.hoy_no else 0 end)
         - (case when b.ultima >= p_local - w.hecha_dias then w.hecha_rec else 0 end)
         + get_byte(decode(md5(b.id::text || p_local::text || p_uid::text), 'hex'), 0) % (w.azar + 1)
         )::int,
         case
           when b.en_efe then jsonb_build_object('r', 'efemeride')
           when cardinality(b.estaciones) > 0 then jsonb_build_object('r', 'temporada', 'e', (p.v).estacion)
           when cardinality(b.requiere) > 0 then jsonb_build_object('r', 'contexto', 'k', b.requiere[1])
           when b.domain_slug = any((p.v).intereses) then jsonb_build_object('r', 'interes', 'd', b.domain_slug)
           when b.nunca then jsonb_build_object('r', 'nueva')
           when b.impact = 'high' then jsonb_build_object('r', 'impacto')
           else jsonb_build_object('r', 'variedad')
         end
    from base b cross join p cross join w;
$$;

-- §5 · Composición del día. Mismo algoritmo que armarDia() en lib/acciones/reglas.ts.
create or replace function public.brote_armar_dia(
  p_uid uuid, p_local date, p_mantener uuid[] default '{}', p_excluir uuid[] default '{}'
)
returns jsonb
language plpgsql
stable security definer
set search_path = public
as $fn$
declare
  v_reglas jsonb := brote_acciones_reglas();
  v_tam int := (v_reglas ->> 'tamano')::int;
  v_rap_min int := (v_reglas ->> 'rapidas_min')::int;
  v_rap_m int := (v_reglas ->> 'rapida_minutos')::int;
  v_lar_m int := (v_reglas ->> 'larga_minutos')::int;
  v_max_lar int := (v_reglas ->> 'max_largas')::int;
  v_max_dom int := (v_reglas ->> 'max_por_dominio')::int;
  v_max_tem int := coalesce((v_reglas ->> 'max_temporada')::int, 2);
  v_cand jsonb;
  v_x jsonb;
  v_ids uuid[] := '{}';
  v_razones jsonb := '{}';
  v_dom jsonb := '{}';
  v_rap int := 0;
  v_lar int := 0;
  v_tem int := 0;
  v_hay_nueva boolean := false;
  v_pasada int;
  v_tope int;
  v_mezcla boolean;
  v_m int;
  r record;
begin
  -- Lo que se mantiene cuenta para los topes.
  for r in
    select a.id, a.domain_slug, a.minutos, cardinality(a.estaciones) > 0 as de_temporada,
           not exists (select 1 from activity_completions ac
                        where ac.user_id = p_uid and ac.activity_id = a.id and ac.status in ('honor','verified')) as nunca
      from unnest(coalesce(p_mantener, '{}')) with ordinality u(aid, ord)
      join activities a on a.id = u.aid
     order by u.ord
  loop
    v_ids := v_ids || r.id;
    v_dom := jsonb_set(v_dom, array[r.domain_slug], to_jsonb(coalesce((v_dom ->> r.domain_slug)::int, 0) + 1));
    if r.minutos <= v_rap_m then v_rap := v_rap + 1; end if;
    if r.minutos > v_lar_m then v_lar := v_lar + 1; end if;
    if r.de_temporada then v_tem := v_tem + 1; end if;
    if r.nunca then v_hay_nueva := true; end if;
  end loop;

  select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'd', c.d, 'm', c.m, 'n', c.n, 't', c.t, 's', c.s, 'r', c.r)
                            order by c.s desc, c.id), '[]'::jsonb)
    into v_cand
    from brote_candidatas(p_uid, p_local, 'daily', coalesce(p_excluir, '{}') || coalesce(p_mantener, '{}')) c;

  -- Paso 0: al menos una nueva, si existe una que no sea larga.
  if not v_hay_nueva and cardinality(v_ids) < v_tam then
    select value into v_x from jsonb_array_elements(v_cand)
     where (value ->> 'n')::boolean and (value ->> 'm')::int <= v_lar_m
     limit 1;
    if v_x is not null then
      v_ids := v_ids || (v_x ->> 'id')::uuid;
      v_dom := jsonb_set(v_dom, array[v_x ->> 'd'], to_jsonb(coalesce((v_dom ->> (v_x ->> 'd'))::int, 0) + 1));
      v_m := (v_x ->> 'm')::int;
      if v_m <= v_rap_m then v_rap := v_rap + 1; end if;
      if v_m > v_lar_m then v_lar := v_lar + 1; end if;
      if (v_x ->> 't')::boolean then v_tem := v_tem + 1; end if;
      v_razones := v_razones || jsonb_build_object(v_x ->> 'id', v_x -> 'r');
    end if;
  end if;

  -- Pasadas: con todos los topes, y relajándolos de a uno si no alcanza.
  foreach v_pasada in array array[1, 2, 3, 4] loop
    exit when cardinality(v_ids) >= v_tam;
    v_tope := case v_pasada when 1 then v_max_dom when 4 then 1000000 else greatest(v_max_dom, 2) end;
    v_mezcla := v_pasada <= 2;
    for v_x in select value from jsonb_array_elements(v_cand) loop
      exit when cardinality(v_ids) >= v_tam;
      continue when (v_x ->> 'id')::uuid = any(v_ids);
      continue when coalesce((v_dom ->> (v_x ->> 'd'))::int, 0) >= v_tope;
      v_m := (v_x ->> 'm')::int;
      if v_mezcla then
        continue when v_m > v_lar_m and v_lar >= v_max_lar;
        continue when (v_x ->> 't')::boolean and v_tem >= v_max_tem;
        continue when v_m > v_rap_m and (v_tam - cardinality(v_ids) - 1) < greatest(0, v_rap_min - v_rap);
      end if;
      v_ids := v_ids || (v_x ->> 'id')::uuid;
      v_dom := jsonb_set(v_dom, array[v_x ->> 'd'], to_jsonb(coalesce((v_dom ->> (v_x ->> 'd'))::int, 0) + 1));
      if v_m <= v_rap_m then v_rap := v_rap + 1; end if;
      if v_m > v_lar_m then v_lar := v_lar + 1; end if;
      if (v_x ->> 't')::boolean then v_tem := v_tem + 1; end if;
      v_razones := v_razones || jsonb_build_object(v_x ->> 'id', v_x -> 'r');
    end loop;
  end loop;

  return jsonb_build_object('ids', to_jsonb(v_ids), 'razones', v_razones);
end $fn$;

-- El set de hoy: el guardado, o uno nuevo armado con las reglas v2.
create or replace function public.brote_dia_asegurar(p_uid uuid, p_local date)
returns public.daily_sets
language plpgsql
security definer
set search_path = public
as $fn$
declare v_set daily_sets%rowtype; v_res jsonb;
begin
  select * into v_set from daily_sets where user_id = p_uid and local_date = p_local;
  if found then return v_set; end if;

  v_res := brote_armar_dia(p_uid, p_local);
  insert into daily_sets (user_id, local_date, activity_ids, razones, version)
  values (p_uid, p_local,
          coalesce(array(select jsonb_array_elements_text(v_res -> 'ids')::uuid), '{}'),
          coalesce(v_res -> 'razones', '{}'), 2)
  on conflict (user_id, local_date) do nothing;

  select * into v_set from daily_sets where user_id = p_uid and local_date = p_local;
  return v_set;
end $fn$;

-- ── 7 · Lo que llama la app ─────────────────────────────────────────────────

-- Compatibilidad: devuelve las mismas filas que antes, ahora armadas con v2
-- y en el orden del set.
create or replace function public.ensure_daily_set()
returns setof public.activities
language plpgsql
security definer
set search_path = public
as $fn$
declare v_uid uuid := auth.uid(); v_tz text; v_set daily_sets%rowtype;
begin
  if v_uid is null then raise exception 'No autenticado' using errcode = 'P0001'; end if;
  select coalesce(timezone, 'America/Argentina/Buenos_Aires') into v_tz from profiles where id = v_uid;
  v_set := brote_dia_asegurar(v_uid, (now() at time zone v_tz)::date);
  return query
    select a.* from unnest(v_set.activity_ids) with ordinality u(aid, ord)
      join activities a on a.id = u.aid
     order by u.ord;
end $fn$;

-- El día completo: acciones con su motivo, cambios que quedan, efeméride y estación.
create or replace function public.acciones_de_hoy()
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare v_uid uuid := auth.uid(); v_tz text; v_local date; v_set daily_sets%rowtype; R jsonb := brote_acciones_reglas();
begin
  if v_uid is null then raise exception 'No autenticado' using errcode = 'P0001'; end if;
  select coalesce(timezone, 'America/Argentina/Buenos_Aires') into v_tz from profiles where id = v_uid;
  v_local := (now() at time zone v_tz)::date;
  v_set := brote_dia_asegurar(v_uid, v_local);
  return jsonb_build_object(
    'fecha', v_local,
    'acciones', coalesce((
      select jsonb_agg(to_jsonb(a) || jsonb_build_object('razon', v_set.razones -> (a.id::text)) order by u.ord)
        from unnest(v_set.activity_ids) with ordinality u(aid, ord)
        join activities a on a.id = u.aid), '[]'::jsonb),
    'cambios_restantes', greatest(0, (R ->> 'cambios_por_dia')::int - v_set.cambios),
    'efemeride', brote_efemeride(v_local),
    'estacion', brote_estacion(v_local));
end $fn$;

-- Cambiar una acción del día, diciendo por qué (docs/ACCIONES.md §4.1).
create or replace function public.acciones_cambiar(p_activity_id uuid, p_motivo text, p_contexto text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_uid uuid := auth.uid(); v_tz text; v_local date; v_set daily_sets%rowtype; R jsonb := brote_acciones_reglas();
  v_max int; v_idx int; v_mantener uuid[]; v_excl uuid[]; v_res jsonb; v_nueva uuid; v_act activities%rowtype;
  v_ctx boolean := false; v_rutina boolean := false;
begin
  if v_uid is null then raise exception 'No autenticado' using errcode = 'P0001'; end if;
  if p_motivo not in ('hoy_no','no_aplica','ya_lo_hago','no_me_gusta') then
    return jsonb_build_object('ok', false, 'error', 'Motivo inválido');
  end if;
  select coalesce(timezone, 'America/Argentina/Buenos_Aires') into v_tz from profiles where id = v_uid;
  v_local := (now() at time zone v_tz)::date;

  select * into v_set from daily_sets where user_id = v_uid and local_date = v_local for update;
  if not found or not (p_activity_id = any(v_set.activity_ids)) then
    return jsonb_build_object('ok', false, 'error', 'Esa acción no está en tu día');
  end if;
  if exists (select 1 from activity_completions
              where user_id = v_uid and activity_id = p_activity_id and local_date = v_local) then
    return jsonb_build_object('ok', false, 'error', 'Ya la hiciste hoy: no hace falta cambiarla');
  end if;
  v_max := (R ->> 'cambios_por_dia')::int;
  if v_set.cambios >= v_max then
    return jsonb_build_object('ok', false, 'error', format('Ya cambiaste %s acciones hoy. Mañana hay otras.', v_max));
  end if;

  select * into v_act from activities where id = p_activity_id;
  insert into acciones_feedback (user_id, activity_id, motivo, local_date)
  values (v_uid, p_activity_id, p_motivo, v_local);

  -- "No tengo auto": se anota, y se van todas las que lo piden.
  if p_motivo = 'no_aplica' and p_contexto is not null and p_contexto = any(v_act.requiere) then
    update profiles set context = coalesce(context, '{}'::jsonb) || jsonb_build_object(p_contexto, false)
     where id = v_uid;
    v_ctx := true;
  end if;

  v_idx := array_position(v_set.activity_ids, p_activity_id);
  v_mantener := array_remove(v_set.activity_ids, p_activity_id);
  -- Lo que ya cambió hoy no vuelve el mismo día.
  select coalesce(array_agg(distinct f.activity_id), '{}') into v_excl
    from acciones_feedback f where f.user_id = v_uid and f.local_date = v_local;
  -- Con el contexto actualizado, las que quedaron en el día y ya no aplican se mantienen
  -- (la persona puede cambiarlas o no); sólo la nueva respeta todo.
  v_res := brote_armar_dia(v_uid, v_local, v_mantener, v_excl);
  select x::uuid into v_nueva
    from jsonb_array_elements_text(v_res -> 'ids') x
   where not (x::uuid = any(v_mantener))
   limit 1;

  if v_nueva is null then
    update daily_sets
       set activity_ids = v_mantener, cambios = cambios + 1, razones = razones - p_activity_id::text
     where user_id = v_uid and local_date = v_local;
  else
    update daily_sets
       set activity_ids = v_set.activity_ids[1:v_idx - 1] || v_nueva || v_set.activity_ids[v_idx + 1:],
           cambios = cambios + 1,
           razones = (razones - p_activity_id::text)
                     || jsonb_build_object(v_nueva::text, v_res -> 'razones' -> (v_nueva::text))
     where user_id = v_uid and local_date = v_local;
  end if;

  v_rutina := p_motivo = 'ya_lo_hago' and v_act.routine_eligible
    and not exists (select 1 from user_habits where user_id = v_uid and activity_id = p_activity_id and active)
    and (select count(*) from user_habits where user_id = v_uid and active) < 5;

  return jsonb_build_object(
    'ok', true,
    'nueva', (select to_jsonb(a) || jsonb_build_object('razon', v_res -> 'razones' -> (a.id::text))
                from activities a where a.id = v_nueva),
    'cambios_restantes', greatest(0, v_max - v_set.cambios - 1),
    'sugerir_rutina', v_rutina,
    'contexto_actualizado', v_ctx);
end $fn$;

-- Más acciones para hoy ('daily') o del catálogo ('catalog'), con la misma
-- elegibilidad y el mismo puntaje. Como mucho 2 por tema, para que varíe.
create or replace function public.acciones_sugeridas(p_tipo text default 'daily', p_limit int default 6)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare v_uid uuid := auth.uid(); v_tz text; v_local date; v_excl uuid[] := '{}';
begin
  if v_uid is null then raise exception 'No autenticado' using errcode = 'P0001'; end if;
  if p_tipo not in ('daily', 'catalog') then raise exception 'Tipo inválido'; end if;
  select coalesce(timezone, 'America/Argentina/Buenos_Aires') into v_tz from profiles where id = v_uid;
  v_local := (now() at time zone v_tz)::date;
  if p_tipo = 'daily' then
    select coalesce(activity_ids, '{}') into v_excl from daily_sets where user_id = v_uid and local_date = v_local;
  end if;
  return coalesce((
    select jsonb_agg(to_jsonb(a) || jsonb_build_object('razon', t.r) order by t.s desc, t.id)
      from (
        select c.id, c.s, c.r
          from (
            select x.*, row_number() over (partition by x.d order by x.s desc, x.id) as rn
              from brote_candidatas(v_uid, v_local, p_tipo, coalesce(v_excl, '{}')) x
          ) c
         where c.rn <= 2
         order by c.s desc, c.id
         limit greatest(1, least(30, p_limit))
      ) t
      join activities a on a.id = t.id
  ), '[]'::jsonb);
end $fn$;

-- Sacar una acción desde el catálogo (sin estar en el día).
create or replace function public.acciones_ocultar(p_activity_id uuid, p_motivo text default 'no_aplica', p_contexto text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare v_uid uuid := auth.uid(); v_tz text; v_req text[];
begin
  if v_uid is null then raise exception 'No autenticado' using errcode = 'P0001'; end if;
  if p_motivo not in ('no_aplica', 'no_me_gusta', 'ya_lo_hago') then
    return jsonb_build_object('ok', false, 'error', 'Motivo inválido');
  end if;
  select requiere into v_req from activities where id = p_activity_id and active;
  if not found then return jsonb_build_object('ok', false, 'error', 'Esa acción no existe'); end if;
  select coalesce(timezone, 'America/Argentina/Buenos_Aires') into v_tz from profiles where id = v_uid;
  insert into acciones_feedback (user_id, activity_id, motivo, local_date)
  values (v_uid, p_activity_id, p_motivo, (now() at time zone v_tz)::date);
  if p_motivo = 'no_aplica' and p_contexto is not null and p_contexto = any(v_req) then
    update profiles set context = coalesce(context, '{}'::jsonb) || jsonb_build_object(p_contexto, false) where id = v_uid;
  end if;
  return jsonb_build_object('ok', true);
end $fn$;

create or replace function public.mis_acciones_ocultas()
returns jsonb
language sql
stable security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'activity_id', a.id, 'slug', a.slug, 'title_es', a.title_es, 'domain_slug', a.domain_slug,
           'motivo', f.motivo, 'fecha', f.local_date) order by f.created_at desc), '[]'::jsonb)
    from (
      select distinct on (activity_id) activity_id, motivo, local_date, created_at
        from acciones_feedback
       where user_id = auth.uid() and not deshecho and motivo in ('no_aplica', 'no_me_gusta', 'ya_lo_hago')
       order by activity_id, created_at desc
    ) f
    join activities a on a.id = f.activity_id;
$$;

create or replace function public.acciones_mostrar_de_nuevo(p_activity_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update acciones_feedback set deshecho = true
   where user_id = auth.uid() and activity_id = p_activity_id and not deshecho;
$$;

-- Los caminos que le sirven a esta persona, con su avance.
create or replace function public.mis_caminos()
returns jsonb
language sql
stable security definer
set search_path = public
as $$
  with p as (select brote_perfil_accion(auth.uid()) as v),
  hechas as (
    select distinct ac.activity_id from activity_completions ac
     where ac.user_id = auth.uid() and ac.status in ('honor','verified')
  ),
  pasos as (
    select c.slug as camino, a.id, a.slug, a.title_es, a.camino_paso, a.domain_slug, a.base_points,
           a.id in (select activity_id from hechas) as hecho,
           -- compost y huerta no cuentan: se ganan dentro del mismo camino.
           ((p.v).edad = any(a.age_groups)
            and brote_contexto_tiene((p.v).ctx || '{"compost": true, "huerta": true}'::jsonb, a.requiere)) as le_sirve
      from caminos c
      join activities a on a.camino_slug = c.slug and a.active
      cross join p
     where c.active
  ),
  ok as (
    select camino from pasos group by camino having bool_and(le_sirve) and count(*) >= 3
  )
  select coalesce(jsonb_agg(jsonb_build_object(
           'slug', c.slug, 'titulo_es', c.titulo_es, 'descripcion_es', c.descripcion_es,
           'domain_slug', c.domain_slug, 'recompensa_puntos', c.recompensa_puntos,
           'completado', exists (select 1 from user_caminos uc where uc.user_id = auth.uid() and uc.camino_slug = c.slug),
           'pasos', (select jsonb_agg(jsonb_build_object('id', x.id, 'slug', x.slug, 'title_es', x.title_es,
                                                         'paso', x.camino_paso, 'hecho', x.hecho) order by x.camino_paso)
                       from pasos x where x.camino = c.slug)
         ) order by c.orden, c.slug), '[]'::jsonb)
    from caminos c
   where c.active and c.slug in (select camino from ok);
$$;

-- ── 8 · Completar, con cantidad, impacto congelado y caminos ────────────────

drop function if exists public.complete_activity(uuid, text, text);

create or replace function public.complete_activity(
  p_activity_id uuid, p_photo_url text default null, p_note text default null, p_cantidad numeric default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_uid uuid := auth.uid(); v_act activities%rowtype; v_prof profiles%rowtype; v_local date; v_yesterday date;
  v_base int; v_points int := 0; v_first boolean := false; v_counts_streak boolean := false;
  v_status completion_status := 'honor'; v_new_streak int; v_streak_inc boolean := false; v_mult numeric := 1.0;
  v_old_rank jsonb; v_new_rank jsonb; v_rank_up boolean := false; v_div_up boolean := false;
  v_ach jsonb := jsonb_build_object('titles', '[]'::jsonb, 'badges', '[]'::jsonb); v_session_bonus int := 0;
  v_set_complete boolean := false; v_cooldown int; v_exists boolean; v_new_total bigint; v_min_tier int;
  v_set uuid[]; v_bonus_done boolean; v_done int; v_total int; v_cur_streak int;
  r_ch challenges%rowtype; v_prog int; v_was_done boolean; v_ch_completed jsonb := '[]'::jsonb;
  v_comp_total bigint; v_bonus_growth int; v_mundo jsonb; v_wp_prev jsonb; v_wp_now jsonb;
  v_world_completed jsonb := null; v_habit jsonb := null;
  v_sem int := 0; v_sem_balance int; v_sem_streak int;
  -- v2: cantidad, impacto congelado, caminos
  v_cant numeric := null; v_w numeric; v_c numeric; v_r numeric; v_e numeric;
  v_camino jsonb := null; v_cam_total int; v_cam_hechos int; v_cam_pts int; v_cam_titulo text;
begin
  if v_uid is null then raise exception 'No autenticado' using errcode = 'P0001'; end if;
  select * into v_act from activities where id = p_activity_id and active;
  if not found then raise exception 'Acción no disponible'; end if;
  select * into v_prof from profiles where id = v_uid for update;
  if not found then raise exception 'Perfil no encontrado'; end if;
  if not (coalesce(v_prof.account_type::text, 'adult') = any(v_act.age_groups)) then
    raise exception 'Esta acción no está disponible para tu tipo de cuenta';
  end if;
  select tier into v_min_tier from ranks where slug = v_act.min_rank_slug;
  if (brote_get_rank(v_prof.total_xp)->>'tier')::int < coalesce(v_min_tier, 1) then
    raise exception 'Necesitás un rango mayor para esta acción'; end if;
  v_local := (now() at time zone v_prof.timezone)::date; v_yesterday := v_local - 1; v_base := v_act.base_points;

  -- Lo que suma esta vez: por la cantidad (con tope) si es medible, si no lo fijo.
  if v_act.medida is not null then
    v_cant := least(coalesce((v_act.medida ->> 'max')::numeric, 1),
                    greatest(coalesce((v_act.medida ->> 'min')::numeric, 1),
                             coalesce(p_cantidad, (v_act.medida ->> 'def')::numeric, 1)));
    v_w := round(coalesce((v_act.medida #>> '{por,water_l}')::numeric, 0) * v_cant, 3);
    v_c := round(coalesce((v_act.medida #>> '{por,co2_kg}')::numeric, 0) * v_cant, 3);
    v_r := round(coalesce((v_act.medida #>> '{por,waste_kg}')::numeric, 0) * v_cant, 3);
    v_e := round(coalesce((v_act.medida #>> '{por,energy_kwh}')::numeric, 0) * v_cant, 3);
  else
    v_w := v_act.impact_water_l; v_c := v_act.impact_co2_kg; v_r := v_act.impact_waste_kg; v_e := v_act.impact_energy_kwh;
  end if;

  if v_act.type = 'daily' then
    select exists(select 1 from activity_completions where user_id = v_uid and activity_id = v_act.id and local_date = v_local) into v_exists;
    if v_exists then raise exception 'Ya hiciste esta acción hoy'; end if;
    v_counts_streak := true; v_status := 'honor';
    if v_prof.last_streak_date = v_local then v_new_streak := v_prof.current_streak;
    elsif v_prof.last_streak_date = v_yesterday then v_new_streak := v_prof.current_streak + 1; v_streak_inc := true;
    else v_new_streak := 1; v_streak_inc := true; end if;
    v_mult := case when v_new_streak >= 100 then 1.3 when v_new_streak >= 30 then 1.2 when v_new_streak >= 7 then 1.1 else 1.0 end;
    v_points := round(v_base * v_mult)::int;
  else
    v_cooldown := case when v_act.frequency = 'one_time' then -1 when v_act.frequency = 'weekly' then 168
      when v_act.frequency = 'recurring' then (case when v_act.repeat_cooldown_hours > 0 then v_act.repeat_cooldown_hours else 20 end) else 0 end;
    if v_cooldown = -1 then
      select exists(select 1 from activity_completions where user_id = v_uid and activity_id = v_act.id and status in ('honor','verified','pending')) into v_exists;
      if v_exists then raise exception 'Ya completaste esta acción'; end if;
    elsif v_cooldown > 0 then
      select exists(select 1 from activity_completions where user_id = v_uid and activity_id = v_act.id and status in ('honor','verified','pending')
        and completed_at > now() - make_interval(hours => v_cooldown)) into v_exists;
      if v_exists then raise exception 'Todavía no podés repetir esta acción'; end if;
    end if;
    select not exists(select 1 from activity_completions where user_id = v_uid and activity_id = v_act.id and status in ('honor','verified')) into v_first;
    v_status := 'honor'; v_points := v_base + (case when v_first then 100 else 0 end);
  end if;
  insert into activity_completions (user_id, activity_id, activity_type, domain_slug, local_date, points_awarded, status,
                                    photo_url, note, counts_for_streak, cantidad,
                                    impact_water_l, impact_co2_kg, impact_waste_kg, impact_energy_kwh)
  values (v_uid, v_act.id, v_act.type, v_act.domain_slug, v_local, v_points, v_status, p_photo_url, p_note, v_counts_streak, v_cant,
          v_w, v_c, v_r, v_e);
  v_old_rank := brote_get_rank(v_prof.total_xp);
  if v_points > 0 then
    update profiles set total_xp = total_xp + v_points where id = v_uid;
    insert into user_domain_points (user_id, domain_slug, points) values (v_uid, v_act.domain_slug, v_points)
      on conflict (user_id, domain_slug) do update set points = user_domain_points.points + v_points;
  end if;
  v_habit := brote_touch_habit(v_uid, v_act.id, v_local);
  -- Lo que esta acción deja armado (una compostera, una huerta) abre las que lo piden.
  if v_act.otorga is not null then
    update profiles set context = coalesce(context, '{}'::jsonb) || jsonb_build_object(v_act.otorga, true) where id = v_uid;
  end if;
  if v_act.type = 'daily' then
    update profiles set current_streak = v_new_streak, longest_streak = greatest(longest_streak, v_new_streak), last_streak_date = v_local where id = v_uid;
    if v_streak_inc then
      v_sem_streak := case v_new_streak when 7 then 30 when 30 then 100 when 100 then 300 when 365 then 1000 else 0 end;
      if v_sem_streak > 0 then
        v_sem := v_sem + v_sem_streak;
        perform brote_grant_semillas(v_uid, v_sem_streak, 'streak', v_new_streak::text,
                                     'Racha de ' || v_new_streak || ' días');
      end if;
    end if;
    select activity_ids, bonus_awarded into v_set, v_bonus_done from daily_sets where user_id = v_uid and local_date = v_local;
    if v_set is not null and coalesce(array_length(v_set, 1), 0) > 0 and not coalesce(v_bonus_done, false) then
      v_total := array_length(v_set, 1);
      select count(distinct activity_id) into v_done from activity_completions where user_id = v_uid and local_date = v_local and activity_id = any(v_set);
      if v_done >= v_total then
        v_session_bonus := 200; update profiles set total_xp = total_xp + v_session_bonus where id = v_uid;
        update daily_sets set bonus_awarded = true where user_id = v_uid and local_date = v_local; v_set_complete := true;
        v_sem := v_sem + 15;
        perform brote_grant_semillas(v_uid, 15, 'daily_set', v_local::text, 'Jornada completa');
      end if;
    end if;
  end if;
  for r_ch in select * from challenges c where c.active
      and (c.starts_at is null or c.starts_at <= now()) and (c.ends_at is null or c.ends_at > now())
      and coalesce(v_prof.account_type::text, 'adult') = any(c.age_groups)
  loop
    if r_ch.target_metric = 'daily_actions' then
      select count(*) into v_prog from activity_completions
        where user_id = v_uid and activity_type = 'daily' and local_date = v_local and status in ('honor','verified');
    elsif r_ch.target_metric = 'domain_completions' then
      if r_ch.domain_slug is null then continue; end if;
      select count(*) into v_prog from activity_completions
        where user_id = v_uid and domain_slug = r_ch.domain_slug and status in ('honor','verified')
          and completed_at >= coalesce(r_ch.starts_at, now() - interval '7 days');
    elsif r_ch.target_metric = 'completions' then
      select count(*) into v_prog from activity_completions
        where user_id = v_uid and status in ('honor','verified') and completed_at >= coalesce(r_ch.starts_at, now() - interval '7 days');
    else continue; end if;
    select completed into v_was_done from user_challenges where user_id = v_uid and challenge_id = r_ch.id;
    insert into user_challenges (user_id, challenge_id, progress) values (v_uid, r_ch.id, v_prog)
      on conflict (user_id, challenge_id) do update set progress = greatest(user_challenges.progress, excluded.progress);
    if coalesce(v_was_done, false) = false and v_prog >= r_ch.target_value then
      update user_challenges set completed = true, completed_at = now() where user_id = v_uid and challenge_id = r_ch.id;
      if r_ch.reward_points > 0 then update profiles set total_xp = total_xp + r_ch.reward_points where id = v_uid; end if;
      v_sem_streak := case r_ch.type::text when 'daily' then 10 when 'weekly' then 25 else 60 end;
      v_sem := v_sem + v_sem_streak;
      perform brote_grant_semillas(v_uid, v_sem_streak, 'challenge', r_ch.id::text, r_ch.title_es);
      if r_ch.type <> 'daily' then
      insert into notifications (user_id, type, title_es, body_es, data)
      values (v_uid, 'challenge', '¡Reto completado! 🏆', r_ch.title_es || ' · +' || r_ch.reward_points || ' pts', jsonb_build_object('challenge', r_ch.id));
      end if;
      v_ch_completed := v_ch_completed || jsonb_build_object('title_es', r_ch.title_es, 'reward_points', r_ch.reward_points, 'type', r_ch.type);
    end if;
  end loop;

  -- Caminos: en qué paso está, y el premio la primera vez que se completa.
  if v_act.camino_slug is not null then
    select titulo_es, recompensa_puntos into v_cam_titulo, v_cam_pts from caminos where slug = v_act.camino_slug and active;
    if found then
      select count(*) into v_cam_total from activities where camino_slug = v_act.camino_slug and active;
      select count(distinct ac.activity_id) into v_cam_hechos
        from activity_completions ac join activities a on a.id = ac.activity_id
       where ac.user_id = v_uid and a.camino_slug = v_act.camino_slug and a.active and ac.status in ('honor','verified');
      v_camino := jsonb_build_object('slug', v_act.camino_slug, 'titulo_es', v_cam_titulo,
                                     'paso', v_act.camino_paso, 'total', v_cam_total, 'hechos', v_cam_hechos,
                                     'completado', false);
      if v_cam_total > 0 and v_cam_hechos >= v_cam_total
         and not exists (select 1 from user_caminos where user_id = v_uid and camino_slug = v_act.camino_slug) then
        insert into user_caminos (user_id, camino_slug) values (v_uid, v_act.camino_slug);
        if v_cam_pts > 0 then update profiles set total_xp = total_xp + v_cam_pts where id = v_uid; end if;
        v_sem := v_sem + 40;
        perform brote_grant_semillas(v_uid, 40, 'camino', v_act.camino_slug, 'Camino: ' || v_cam_titulo);
        insert into notifications (user_id, type, title_es, body_es, data)
        values (v_uid, 'system', '¡Terminaste un camino! 🧭', v_cam_titulo || ' · +' || v_cam_pts || ' pts',
                jsonb_build_object('camino', v_act.camino_slug));
        v_camino := v_camino || jsonb_build_object('completado', true, 'puntos', v_cam_pts);
      end if;
    end if;
  end if;

  select total_xp, current_streak, bonus_growth into v_new_total, v_cur_streak, v_bonus_growth from profiles where id = v_uid;
  select count(*) into v_comp_total from activity_completions where user_id = v_uid and status in ('honor','verified');
  v_comp_total := v_comp_total + coalesce(v_bonus_growth, 0);
  v_wp_prev := brote_world_progress(greatest(0, v_comp_total - 1));
  v_wp_now := brote_world_progress(v_comp_total);
  if (v_wp_now->>'worldIndex')::int > (v_wp_prev->>'worldIndex')::int then
    v_world_completed := jsonb_build_object('completed_index', (v_wp_prev->>'worldIndex')::int, 'new_index', (v_wp_now->>'worldIndex')::int);
    insert into notifications (user_id, type, title_es, body_es, data)
    values (v_uid, 'system', '¡Completaste un mundo! 🌍✨', 'Tu mundo ' || (v_wp_prev->>'worldIndex') || ' floreció por completo. Se abrió un bioma nuevo.', v_world_completed);
    v_sem := v_sem + 150;
    perform brote_grant_semillas(v_uid, 150, 'world', (v_wp_prev->>'worldIndex'),
                                 'Mundo ' || (v_wp_prev->>'worldIndex') || ' completo');
  end if;
  v_new_rank := brote_get_rank(v_new_total);
  v_mundo := brote_compute_mundo(v_new_total, v_cur_streak, brote_domain_points_json(v_uid), v_comp_total);
  update profiles set current_rank_slug = v_new_rank->>'slug', current_division = (v_new_rank->>'division')::int,
    mundo_state = v_mundo where id = v_uid;
  v_rank_up := (v_old_rank->>'slug') is distinct from (v_new_rank->>'slug');
  v_div_up := (not v_rank_up) and (v_old_rank->>'division')::int < (v_new_rank->>'division')::int;
  if v_points > 0 or v_set_complete then v_ach := brote_award_achievements(v_uid); end if;
  if v_rank_up then
    insert into notifications (user_id, type, title_es, body_es, data)
    values (v_uid, 'rank_up', '¡Subiste de rango!', '¡Llegaste a ' || initcap(v_new_rank->>'slug') || '!', jsonb_build_object('rank', v_new_rank->>'slug'));
    v_sem := v_sem + 50;
    perform brote_grant_semillas(v_uid, 50, 'rank', v_new_rank->>'slug', 'Rango ' || initcap(v_new_rank->>'slug'));
  end if;
  select semillas into v_sem_balance from profiles where id = v_uid;
  return jsonb_build_object('points_awarded', v_points, 'new_total', v_new_total, 'rank_up', v_rank_up,
    'new_rank_slug', case when v_rank_up then v_new_rank->>'slug' else null end, 'division_up', v_div_up,
    'new_titles', v_ach->'titles', 'new_badges', v_ach->'badges', 'streak', v_cur_streak, 'streak_incremented', v_streak_inc,
    'daily_set_complete', v_set_complete, 'session_bonus', v_session_bonus, 'first_time', v_first, 'status', v_status,
    'mundo', v_mundo, 'completions_count', v_comp_total, 'challenges_completed', v_ch_completed,
    'world_completed', v_world_completed, 'habit', v_habit,
    'semillas_earned', v_sem, 'semillas_balance', coalesce(v_sem_balance, 0),
    'impact', jsonb_build_object('water_l', coalesce(v_w, 0), 'co2_kg', coalesce(v_c, 0),
                                 'waste_kg', coalesce(v_r, 0), 'energy_kwh', coalesce(v_e, 0)),
    'cantidad', v_cant, 'camino', v_camino, 'otorga', v_act.otorga,
    'mundo_delta', null);
end $function$;

-- ── 9 · La rutina, la Plaza y la Academia eligen con la misma regla ─────────

create or replace function public.routine_suggestions(p_limit integer default 12)
returns jsonb
language sql
stable security definer
set search_path = public
as $$
  with p as (select brote_perfil_accion(auth.uid()) as v)
  select coalesce(jsonb_agg(row order by ord), '[]'::jsonb)
  from (
    select jsonb_build_object(
             'activity_id', a.id, 'slug', a.slug, 'title_es', a.title_es,
             'short_es', a.short_es, 'domain_slug', a.domain_slug,
             'base_points', a.base_points, 'minutos', a.minutos) as row,
           row_number() over (
             order by (a.domain_slug = any((p.v).intereses)) desc,
                      (case a.impact when 'high' then 2 when 'medium' then 1 else 0 end) desc,
                      a.minutos asc, a.sort_order) as ord
      from activities a
      cross join p
     where a.routine_eligible
       and brote_accion_apta(a, p.v)
       and a.id not in (select brote_acciones_fuera((p.v).uid, (p.v).fecha))
       and not exists (select 1 from user_habits h
                        where h.user_id = (p.v).uid and h.activity_id = a.id and h.active)
     order by ord
     limit greatest(1, least(50, p_limit))
  ) t;
$$;

create or replace function public.my_habits()
returns jsonb
language sql
stable security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'activity_id', h.activity_id, 'title_es', a.title_es, 'domain_slug', a.domain_slug,
    'base_points', a.base_points, 'cadence', h.cadence,
    'current_streak', h.current_streak, 'longest_streak', h.longest_streak,
    'done_today', (h.last_done_date = (now() at time zone coalesce(pr.timezone, 'America/Argentina/Buenos_Aires'))::date)
  ) order by h.created_at), '[]'::jsonb)
  from user_habits h
  join activities a on a.id = h.activity_id
  join profiles pr on pr.id = h.user_id
  where h.user_id = auth.uid() and h.active;
$$;

create or replace function public.ac_accion_para(p_uid uuid, p_rama text)
returns jsonb
language plpgsql
stable security definer
set search_path = public
as $function$
declare v_rama text := p_rama; v_a activities%rowtype; v_p brote_perfil_accion;
begin
  v_p := brote_perfil_accion(p_uid, ac_dia_local(p_uid));
  if v_p.uid is null then return null; end if;

  -- El tronco no es un dominio: se cae al dominio donde la persona ya actúa.
  if v_rama is null or v_rama = 'tronco' then
    select domain_slug into v_rama from user_domain_points
     where user_id = p_uid order by points desc limit 1;
    if v_rama is null then v_rama := v_p.intereses[1]; end if;
  end if;
  if v_rama is null then return null; end if;

  select a.* into v_a from activities a
   where a.domain_slug = v_rama
     and brote_accion_apta(a, v_p)
     and a.id not in (select brote_acciones_fuera(p_uid, v_p.fecha))
     and not exists (
       select 1 from activity_completions ac
        where ac.user_id = p_uid and ac.activity_id = a.id
          and ac.status in ('honor','verified','pending')
          and ((a.frequency = 'one_time')
            or (a.type = 'daily' and ac.local_date = v_p.fecha)
            or (a.frequency = 'weekly' and ac.completed_at > now() - interval '168 hours')
            or (a.frequency = 'recurring' and ac.completed_at > now() -
                make_interval(hours => greatest(coalesce(nullif(a.repeat_cooldown_hours, 0), 20), 1)))))
   order by (a.minutos <= 15) desc, random() limit 1;
  if not found then return null; end if;

  return jsonb_build_object(
    'id', v_a.id, 'slug', v_a.slug, 'titulo_es', v_a.title_es, 'short_es', v_a.short_es,
    'domain_slug', v_a.domain_slug, 'base_points', v_a.base_points, 'icon', v_a.icon,
    'impact_water_l', v_a.impact_water_l, 'impact_co2_kg', v_a.impact_co2_kg,
    'impact_waste_kg', v_a.impact_waste_kg, 'impact_energy_kwh', v_a.impact_energy_kwh,
    'equivalencia_es', v_a.impact_equivalency_es);
end $function$;

create or replace function public.academia_accion_sugerida(p_hoja_id uuid)
returns jsonb
language plpgsql
stable security definer
set search_path = public
as $function$
declare v_uid uuid := auth.uid(); v_rama text;
begin
  if v_uid is null then raise exception 'No autenticado' using errcode = 'P0001'; end if;
  select g.rama_slug into v_rama
    from ac_hojas h join ac_gajos g on g.id = h.gajo_id where h.id = p_hoja_id;
  -- Una sola regla para elegir: la de ac_accion_para (que ya resuelve el tronco).
  return ac_accion_para(v_uid, v_rama);
end $function$;

create or replace function public.feed_ladder()
returns jsonb
language sql
stable security definer
set search_path = public
as $function$
  with me as (
    select p.id,
           coalesce(p.account_type::text,'adult') as age,
           coalesce(p.interests,'{}')             as interests,
           p.city,
           coalesce(p.total_xp, 0)                as xp
    from profiles p where p.id = auth.uid()
  ),
  pa as (select brote_perfil_accion(auth.uid()) as v),
  discover as (
    select jsonb_build_object(
             'ladder', 'discover',
             'id', 'ladder-discover',
             'accounts', suggested_accounts(3)
           ) as card
    from me
    where me.age <> 'kid'
      and jsonb_array_length(coalesce(suggested_accounts(3), '[]'::jsonb)) > 0
  ),
  proj as (
    select jsonb_build_object(
             'ladder', 'project',
             'id', 'ladder-project-' || pr.id::text,
             'project', jsonb_build_object(
               'id', pr.id, 'title', pr.title, 'description', pr.description,
               'city', pr.city, 'domain_slug', pr.domain_slug,
               'image_url', pr.image_url, 'event_date', pr.event_date,
               'participants', (select count(*) from project_participants pp
                                 where pp.project_id = pr.id))
           ) as card,
           (case when pr.city is not distinct from (select city from me) then 0 else 1 end) as ord,
           pr.created_at
    from projects pr, me
    where me.age <> 'kid'
      and pr.status in ('active','proposed')
      and not exists (select 1 from project_participants pp
                       where pp.project_id = pr.id and pp.user_id = me.id)
    order by ord, pr.created_at desc
    limit 2
  ),
  act as (
    select jsonb_build_object(
             'ladder', 'action',
             'id', 'ladder-action-' || a.id::text,
             'action', jsonb_build_object(
               'id', a.id, 'slug', a.slug, 'title_es', a.title_es,
               'short_es', a.short_es, 'domain_slug', a.domain_slug,
               'base_points', a.base_points, 'effort', a.effort, 'impact', a.impact)
           ) as card,
           (case when a.domain_slug = any(me.interests) then 0 else 1 end) as ord,
           (case a.impact when 'high' then 0 when 'medium' then 1 else 2 end) as imp,
           a.sort_order
    from activities a, me, pa
    where a.type in ('catalog','daily')
      and brote_accion_apta(a, pa.v)
      and a.id not in (select brote_acciones_fuera((pa.v).uid, (pa.v).fecha))
      and not exists (select 1 from activity_completions c
                       where c.user_id = me.id and c.activity_id = a.id
                         and c.status in ('honor','verified'))
    order by ord, imp, a.sort_order
    limit 2
  ),
  les as (
    select jsonb_build_object(
             'ladder', 'lesson',
             'id', 'ladder-lesson-' || l.id::text,
             'lesson', jsonb_build_object(
               'id', l.id, 'slug', l.slug, 'title_es', l.title_es,
               'summary_es', l.summary_es, 'domain_slug', l.domain_slug,
               'minutes', l.minutes, 'reward_points', l.reward_points)
           ) as card,
           l.level, l.sort_order
    from lessons l, me
    where l.active
      and me.age = any(l.age_groups)
      and not exists (select 1 from user_lessons ul
                       where ul.user_id = me.id and ul.lesson_id = l.id
                         and ul.completed_at is not null)
    order by l.level, l.sort_order
    limit 1
  )
  select jsonb_build_object(
    'items',
      coalesce((select jsonb_agg(card) from discover), '[]'::jsonb)
    || coalesce((select jsonb_agg(card order by ord, created_at desc) from proj), '[]'::jsonb)
    || coalesce((select jsonb_agg(card order by ord, imp, sort_order) from act), '[]'::jsonb)
    || coalesce((select jsonb_agg(card order by level, sort_order) from les), '[]'::jsonb)
  );
$function$;

-- ── 10 · Permisos ───────────────────────────────────────────────────────────
-- Por omisión la base le da EXECUTE a todos sobre lo nuevo: se cierra todo y
-- se abre sólo lo que la app llama.

revoke all on function public.brote_region(text) from public, anon, authenticated;
revoke all on function public.brote_estacion(date) from public, anon, authenticated;
revoke all on function public.brote_efemeride(date) from public, anon, authenticated;
revoke all on function public.brote_acciones_reglas() from public, anon, authenticated;
revoke all on function public.brote_perfil_accion(uuid, date) from public, anon, authenticated;
revoke all on function public.brote_contexto_tiene(jsonb, text[]) from public, anon, authenticated;
revoke all on function public.brote_accion_apta(public.activities, public.brote_perfil_accion) from public, anon, authenticated;
revoke all on function public.brote_acciones_fuera(uuid, date) from public, anon, authenticated;
revoke all on function public.brote_candidatas(uuid, date, text, uuid[]) from public, anon, authenticated;
revoke all on function public.brote_armar_dia(uuid, date, uuid[], uuid[]) from public, anon, authenticated;
revoke all on function public.brote_dia_asegurar(uuid, date) from public, anon, authenticated;
revoke all on function public.ac_accion_para(uuid, text) from public, anon, authenticated;
-- Los dos de impacto los llama Inicio con el id propio: quedan como estaban.
revoke all on function public.brote_user_impact(uuid) from public, anon;
revoke all on function public.brote_user_impact_since(uuid, integer) from public, anon;
grant execute on function public.brote_user_impact(uuid) to authenticated;
grant execute on function public.brote_user_impact_since(uuid, integer) to authenticated;

revoke all on function public.ensure_daily_set() from public, anon;
revoke all on function public.acciones_de_hoy() from public, anon;
revoke all on function public.acciones_cambiar(uuid, text, text) from public, anon;
revoke all on function public.acciones_sugeridas(text, int) from public, anon;
revoke all on function public.acciones_ocultar(uuid, text, text) from public, anon;
revoke all on function public.mis_acciones_ocultas() from public, anon;
revoke all on function public.acciones_mostrar_de_nuevo(uuid) from public, anon;
revoke all on function public.mis_caminos() from public, anon;
revoke all on function public.complete_activity(uuid, text, text, numeric) from public, anon;
revoke all on function public.routine_suggestions(integer) from public, anon;
revoke all on function public.my_habits() from public, anon;
revoke all on function public.academia_accion_sugerida(uuid) from public, anon;
revoke all on function public.feed_ladder() from public, anon;
revoke all on function public.world_collective_impact() from public, anon;

grant execute on function public.ensure_daily_set() to authenticated;
grant execute on function public.acciones_de_hoy() to authenticated;
grant execute on function public.acciones_cambiar(uuid, text, text) to authenticated;
grant execute on function public.acciones_sugeridas(text, int) to authenticated;
grant execute on function public.acciones_ocultar(uuid, text, text) to authenticated;
grant execute on function public.mis_acciones_ocultas() to authenticated;
grant execute on function public.acciones_mostrar_de_nuevo(uuid) to authenticated;
grant execute on function public.mis_caminos() to authenticated;
grant execute on function public.complete_activity(uuid, text, text, numeric) to authenticated;
grant execute on function public.routine_suggestions(integer) to authenticated;
grant execute on function public.my_habits() to authenticated;
grant execute on function public.academia_accion_sugerida(uuid) to authenticated;
grant execute on function public.feed_ladder() to authenticated;
grant execute on function public.world_collective_impact() to authenticated;
