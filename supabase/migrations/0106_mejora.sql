-- Brote — 0106 — Negocios · Fase 2: Mejora.
--
-- El programa de objetivos: dossier, objetivos con su ciclo de vida, check-ins
-- de feedback con versionado, evidencia de cierre y Progreso de Mejora
-- (brote-negocios/fases/FASE_2_MEJORA.md, 04_ESQUEMA_DB.md §3).
--
-- MISMAS DECISIONES QUE 0105, POR LOS MISMOS MOTIVOS
--
-- 1. Escritura solo por RPC. `authenticated` no tiene INSERT/UPDATE/DELETE en
--    ninguna tabla nueva: un objetivo no se cierra editando una fila, se cierra
--    con evidencia y lo aprueba el revisor. Las policies quedan como matriz de
--    acceso (03 §4.2).
-- 2. El dossier NO se expone jamás. Es la operación interna del negocio: sin
--    policy pública, sin grants a anon, y con un test que lo prueba con dos
--    cuentas (fase 2 §10).
-- 3. El revisor es la contraseña del panel (`admin_check`), como en 0105.
--
-- LO QUE SE AGREGA AL ESQUEMA DEL DOCUMENTO, Y POR QUÉ
--
-- · `improvement_goals.metrica_tipo`, `metodo_tipo`, `alcance`,
--   `es_evento_unico`: son las entradas de las reglas R3, R4, R8 y R9 del
--   validador de realismo (05 §5.2). Sin ellas el validador no puede correr
--   sobre lo que ya está guardado.
-- · `reemplazado_at`: una replanificación crea una versión nueva y la anterior
--   queda como historia. El documento dice "nunca se borra"; si además se le
--   cambiara el estado a `descartado`, la historia mentiría (diría que la
--   empresa lo descartó). Se marca reemplazada y las consultas de objetivos
--   vivos la excluyen.
-- · `pasos_hechos`: los pasos son un checklist real que se guarda (fase 2 §6.2).
-- · `valor_final`, `observacion`, `motivo_descarte`: el cierre y la corrección.
-- · `goal_checkins.tiene_evidencia`: "ya lo hacemos" sin evidencia no cierra
--   nada (05 §5.4).

-- ── 1. Enums ────────────────────────────────────────────────────────────────

do $$ begin create type goal_status as enum
  ('propuesto','activo','en_riesgo','en_revision','logrado','logrado_parcial','incumplido','descartado');
exception when duplicate_object then null; end $$;

do $$ begin create type goal_horizon as enum ('trimestral','semestral','anual');
exception when duplicate_object then null; end $$;

do $$ begin create type goal_ambition as enum ('basico','intermedio','avanzado');
exception when duplicate_object then null; end $$;

do $$ begin create type baseline_origin as enum ('factura','medicion','estimado','a_medir');
exception when duplicate_object then null; end $$;

-- ── 2. Dossier ──────────────────────────────────────────────────────────────

create table if not exists improvement_dossiers (
  business_id   uuid primary key references businesses(id) on delete cascade,
  operacion     jsonb not null default '{}',
  energia       jsonb not null default '{}',
  residuos      jsonb not null default '{}',
  agua          jsonb not null default '{}',
  insumos       jsonb not null default '{}',
  logistica     jsonb not null default '{}',
  ya_hecho      text,
  restricciones jsonb not null default '{}',
  completitud   int not null default 0 check (completitud between 0 and 100),
  version       int not null default 1,
  updated_at    timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

alter table improvement_dossiers enable row level security;
drop policy if exists "dossier miembro" on improvement_dossiers;
create policy "dossier miembro" on improvement_dossiers for all to authenticated
  using (brote_is_member(business_id)) with check (brote_can_write(business_id, 'admin'));

-- ── 3. Objetivos ────────────────────────────────────────────────────────────

create table if not exists improvement_goals (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references businesses(id) on delete cascade,
  version       int  not null default 1,
  parent_id     uuid references improvement_goals(id) on delete set null,

  titulo        text not null check (char_length(titulo) between 8 and 140),
  porque        text not null,
  dominio       text,
  palanca_slug  text,

  metrica       text not null,
  unidad        text not null,
  linea_base    numeric,
  origen_base   baseline_origin not null default 'a_medir',
  objetivo      numeric,
  valor_final   numeric,

  horizonte     goal_horizon  not null default 'trimestral',
  ambicion      goal_ambition not null default 'basico',
  esfuerzo_horas_mes numeric not null check (esfuerzo_horas_mes > 0 and esfuerzo_horas_mes <= 6),
  inversion     text not null default 'ninguna' check (inversion in ('ninguna','baja','media')),
  como_medir    text not null,
  pasos         jsonb not null default '[]',
  evidencia_requerida text not null,
  si_no_llegas  text,
  confianza     text not null default 'media' check (confianza in ('alta','media','baja')),

  -- Entradas del validador de realismo (05 §5.2).
  metrica_tipo  text not null default 'reduccion' check (metrica_tipo in ('reduccion','medicion','sustitucion')),
  metodo_tipo   text not null default 'planilla'
    check (metodo_tipo in ('factura','conteo','pesaje','remito','planilla','foto_fechada')),
  alcance       smallint not null default 1 check (alcance in (1,2,3)),
  es_evento_unico boolean not null default false,
  supuestos     jsonb not null default '[]',

  status        goal_status not null default 'propuesto',
  generated_by  text not null default 'ia' check (generated_by in ('ia','reglas','manual')),
  es_publico    boolean not null default false,

  pasos_hechos  jsonb not null default '[]',
  motivo_descarte text,
  observacion   text,
  origen_checkin uuid,
  reemplazado_at timestamptz,

  inicia_at     timestamptz,
  vence_at      timestamptz,
  cerrado_at    timestamptz,
  aprobado_por  uuid references profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_goals_business on improvement_goals (business_id, status);
create index if not exists idx_goals_vence    on improvement_goals (vence_at) where status = 'activo';
create index if not exists idx_goals_parent   on improvement_goals (parent_id);
create index if not exists idx_goals_revision on improvement_goals (status, cerrado_at)
  where status = 'en_revision';
create index if not exists idx_goals_aprobador on improvement_goals (aprobado_por);

drop trigger if exists improvement_goals_updated_at on improvement_goals;
create trigger improvement_goals_updated_at before update on improvement_goals
  for each row execute function set_updated_at();

alter table improvement_goals enable row level security;
drop policy if exists "goals miembro" on improvement_goals;
create policy "goals miembro" on improvement_goals for all to authenticated
  using (brote_is_member(business_id)) with check (brote_can_write(business_id, 'editor'));
drop policy if exists "goals publicos" on improvement_goals;
create policy "goals publicos" on improvement_goals for select
  using (es_publico and status in ('logrado','logrado_parcial'));

-- ── 4. Check-ins: el historial de feedback ──────────────────────────────────

create table if not exists goal_checkins (
  id          uuid primary key default gen_random_uuid(),
  goal_id     uuid not null references improvement_goals(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  autor_id    uuid references profiles(id) on delete set null,
  tipo        text not null check (tipo in ('no_llego','ya_hecho','no_aplica','mas_tiempo','avance','nota')),
  mensaje     text not null,
  valor_reportado numeric,
  tiene_evidencia boolean not null default false,
  respuesta_ia jsonb,
  genero_version int,
  created_at  timestamptz not null default now()
);
create index if not exists idx_checkins_goal on goal_checkins (goal_id, created_at desc);
create index if not exists idx_checkins_business on goal_checkins (business_id, created_at desc);
create index if not exists idx_checkins_autor on goal_checkins (autor_id);

alter table goal_checkins enable row level security;
drop policy if exists "checkins miembro" on goal_checkins;
create policy "checkins miembro" on goal_checkins for all to authenticated
  using (brote_is_member(business_id)) with check (brote_is_member(business_id));

-- ── 5. Evidencia de cierre ──────────────────────────────────────────────────

create table if not exists goal_evidence (
  id          uuid primary key default gen_random_uuid(),
  goal_id     uuid not null references improvement_goals(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  storage_path text not null,
  nota        text,
  subido_por  uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists idx_gevidence_goal on goal_evidence (goal_id);
create index if not exists idx_gevidence_business on goal_evidence (business_id);
create index if not exists idx_gevidence_autor on goal_evidence (subido_por);

alter table goal_evidence enable row level security;
drop policy if exists "gevidence miembro" on goal_evidence;
create policy "gevidence miembro" on goal_evidence for all to authenticated
  using (brote_is_member(business_id)) with check (brote_can_write(business_id, 'editor'));

-- ── 6. Privilegios de tabla ─────────────────────────────────────────────────

revoke all on improvement_dossiers, improvement_goals, goal_checkins, goal_evidence
  from anon, authenticated;

-- Los miembros leen por RPC (`mejora_estado`), que es lo que arma la pantalla.
grant select on improvement_goals, goal_checkins, goal_evidence to authenticated;

-- Lo público de un objetivo (ficha del negocio, fase 4): nunca el dossier.
grant select (id, business_id, titulo, porque, dominio, metrica, unidad, linea_base, objetivo,
              valor_final, horizonte, ambicion, status, cerrado_at, es_publico)
  on improvement_goals to anon;

-- ── 7. Progreso de Mejora ───────────────────────────────────────────────────

-- 05 §6. Espejo exacto de `lib/mejora/progreso.ts`.
create or replace function brote_progreso_mejora(p_business uuid)
returns int language sql stable security definer set search_path = public as $fn$
  with cerrados as (
    select status, cerrado_at,
           case status when 'logrado' then 1.0 when 'logrado_parcial' then 0.5 else 0 end as peso,
           case ambicion when 'avanzado' then 1.5 when 'intermedio' then 1.2 else 1.0 end as mult
    from improvement_goals
    where business_id = p_business and status in ('logrado','logrado_parcial')
      and cerrado_at is not null
  )
  select least(100, coalesce(round(sum(
      peso * mult * 18
      * exp(-extract(epoch from (now() - cerrado_at)) / (86400 * 540))
    ))::int, 0))
  from cerrados;
$fn$;

/**
 * Recalcula lo que un cierre aprobado puede mover: el Progreso de Mejora y el
 * nivel de evidencia.
 *
 * El nivel: E1 al aprobar el alta. E2 exige verificación fuerte Y una
 * afirmación documentada, y E3/E4 exigen afirmaciones certificadas — y las
 * afirmaciones son de la fase 3. Hasta que exista `business_claims`, lo único
 * que esta función puede mover con honestidad es E0 → E1 (05 §3.3). Los ciclos
 * cerrados ya se cuentan acá para E4, que la fase 3 va a poder terminar.
 */
create or replace function brote_recalcular_mejora(p_business uuid)
returns void language plpgsql security definer set search_path = public as $fn$
declare v_progreso int;
begin
  v_progreso := brote_progreso_mejora(p_business);
  update businesses
     set progreso_mejora = v_progreso,
         tier = case when status = 'approved' and tier = 'e0' then 'e1'::evidence_tier else tier end
   where id = p_business;
end $fn$;

-- ── 8. Dossier: guardar un bloque ───────────────────────────────────────────

-- Cuánto del dossier está contestado. "No sé" CUENTA como contestado: es una
-- respuesta válida y explícita que dispara objetivos de medición (fase 2 §4.1).
create or replace function brote_dossier_completitud(d improvement_dossiers)
returns int language sql immutable set search_path = public as $fn$
  select least(100, round(100.0 * (
      (case when coalesce(d.operacion->>'que_produce','') <> '' then 1 else 0 end)
    + (case when d.energia ? 'tiene_factura' or coalesce(d.energia->>'consumo_mensual','') <> '' then 1 else 0 end)
    + (case when d.residuos ? 'separa' or coalesce(d.residuos->>'bolsas_semana','') <> '' then 1 else 0 end)
    + (case when d.agua ? 'es_relevante' or coalesce(d.agua->>'medicion','') <> '' then 1 else 0 end)
    + (case when coalesce(d.insumos->>'principales','') <> '' or d.insumos ? 'puede_cambiar_proveedores' then 1 else 0 end)
    + (case when coalesce(d.logistica->>'como_llega','') <> '' or d.logistica ? 'flota' then 1 else 0 end)
    + (case when coalesce(d.ya_hecho,'') <> '' then 1 else 0 end)
    + (case when d.restricciones ? 'presupuesto' then 1 else 0 end)
  ) / 8.0))::int;
$fn$;

create or replace function dossier_guardar(p_business uuid, p_bloque text, p_datos jsonb)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare d improvement_dossiers%rowtype;
begin
  if not brote_can_write(p_business, 'admin') then
    return jsonb_build_object('ok', false, 'error', 'sin_permiso');
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

-- ── 9. Objetivos: guardar propuestas ────────────────────────────────────────

-- Inserta las propuestas que ya pasaron el validador de realismo del lado de
-- TypeScript. Acá se vuelve a chequear lo que la base puede chequear sola:
-- esfuerzo, campos y que el negocio esté aprobado.
create or replace function objetivos_proponer(
  p_business uuid, p_objetivos jsonb, p_generated_by text default 'reglas'
) returns jsonb language plpgsql security definer set search_path = public as $fn$
declare
  o jsonb;
  v_status business_status;
  v_ids uuid[] := '{}';
  v_id uuid;
  v_n int := 0;
begin
  if not brote_can_write(p_business, 'editor') then
    return jsonb_build_object('ok', false, 'error', 'sin_permiso');
  end if;
  select status into v_status from businesses where id = p_business;
  if v_status is distinct from 'approved' then
    return jsonb_build_object('ok', false, 'error', 'negocio_no_aprobado');
  end if;
  if jsonb_typeof(p_objetivos) is distinct from 'array' then
    return jsonb_build_object('ok', false, 'error', 'datos_invalidos');
  end if;
  if p_generated_by not in ('ia','reglas','manual') then
    return jsonb_build_object('ok', false, 'error', 'datos_invalidos');
  end if;

  for o in select * from jsonb_array_elements(p_objetivos) loop
    exit when v_n >= 5;
    if coalesce((o->>'esfuerzo_horas_mes')::numeric, 99) > 6 then continue; end if;
    if coalesce(o->>'titulo','') = '' or coalesce(o->>'como_medir','') = '' then continue; end if;

    insert into improvement_goals (
      business_id, titulo, porque, dominio, palanca_slug, metrica, unidad,
      linea_base, origen_base, objetivo, horizonte, ambicion, esfuerzo_horas_mes,
      inversion, como_medir, pasos, evidencia_requerida, si_no_llegas, confianza,
      metrica_tipo, metodo_tipo, alcance, es_evento_unico, supuestos, generated_by
    ) values (
      p_business,
      left(o->>'titulo', 140),
      coalesce(o->>'porque',''),
      o->>'dominio',
      o->>'palanca_slug',
      coalesce(o->>'metrica',''),
      coalesce(o->>'unidad',''),
      nullif(o->>'linea_base','')::numeric,
      coalesce(o->>'origen_base','a_medir')::baseline_origin,
      nullif(o->>'objetivo','')::numeric,
      coalesce(o->>'horizonte','trimestral')::goal_horizon,
      coalesce(o->>'ambicion','basico')::goal_ambition,
      (o->>'esfuerzo_horas_mes')::numeric,
      coalesce(o->>'inversion','ninguna'),
      coalesce(o->>'como_medir',''),
      coalesce(o->'pasos', '[]'::jsonb),
      coalesce(o->>'evidencia_requerida',''),
      o->>'si_no_llegas',
      coalesce(o->>'confianza','media'),
      coalesce(o->>'metrica_tipo','reduccion'),
      coalesce(o->>'metodo_tipo','planilla'),
      coalesce((o->>'alcance')::smallint, 1),
      coalesce((o->>'es_evento_unico')::boolean, false),
      coalesce(o->'supuestos', '[]'::jsonb),
      p_generated_by
    ) returning id into v_id;
    v_ids := v_ids || v_id;
    v_n := v_n + 1;
  end loop;

  return jsonb_build_object('ok', true, 'ids', to_jsonb(v_ids), 'cantidad', v_n);
end $fn$;

-- ── 10. Ciclo de vida ───────────────────────────────────────────────────────

create or replace function objetivo_aceptar(p_goal uuid)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare
  g improvement_goals%rowtype;
  v_activos int;
  v_esfuerzo numeric;
  v_meses int;
begin
  select * into g from improvement_goals where id = p_goal for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'no_existe'); end if;
  if not brote_can_write(g.business_id, 'editor') then
    return jsonb_build_object('ok', false, 'error', 'sin_permiso');
  end if;
  if g.status <> 'propuesto' then return jsonb_build_object('ok', false, 'error', 'no_es_propuesta'); end if;

  -- R2 y R1 total del validador (05 §5.2), del lado de la base.
  select count(*), coalesce(sum(esfuerzo_horas_mes), 0) into v_activos, v_esfuerzo
    from improvement_goals
   where business_id = g.business_id and status in ('activo','en_riesgo') and reemplazado_at is null;
  if v_activos >= 3 then return jsonb_build_object('ok', false, 'error', 'demasiados_activos'); end if;
  if v_esfuerzo + g.esfuerzo_horas_mes > 12 then
    return jsonb_build_object('ok', false, 'error', 'carga_total_excede_12h');
  end if;

  v_meses := case g.horizonte when 'trimestral' then 3 when 'semestral' then 6 else 12 end;
  update improvement_goals
     set status = 'activo', inicia_at = now(), vence_at = now() + (v_meses || ' months')::interval
   where id = p_goal;
  return jsonb_build_object('ok', true);
end $fn$;

create or replace function objetivo_descartar(p_goal uuid, p_motivo text default null)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare g improvement_goals%rowtype;
begin
  select * into g from improvement_goals where id = p_goal for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'no_existe'); end if;
  if not brote_can_write(g.business_id, 'editor') then
    return jsonb_build_object('ok', false, 'error', 'sin_permiso');
  end if;
  if g.status not in ('propuesto','activo','en_riesgo') then
    return jsonb_build_object('ok', false, 'error', 'no_descartable');
  end if;
  update improvement_goals
     set status = 'descartado', motivo_descarte = nullif(trim(coalesce(p_motivo,'')), ''), cerrado_at = now()
   where id = p_goal;
  return jsonb_build_object('ok', true);
end $fn$;

-- El checklist de pasos, que se guarda de verdad (fase 2 §6.2).
create or replace function objetivo_pasos(p_goal uuid, p_hechos jsonb)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare g improvement_goals%rowtype;
begin
  select * into g from improvement_goals where id = p_goal for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'no_existe'); end if;
  if not brote_can_write(g.business_id, 'editor') then
    return jsonb_build_object('ok', false, 'error', 'sin_permiso');
  end if;
  if jsonb_typeof(p_hechos) is distinct from 'array' then
    return jsonb_build_object('ok', false, 'error', 'datos_invalidos');
  end if;
  update improvement_goals set pasos_hechos = p_hechos where id = p_goal;
  return jsonb_build_object('ok', true);
end $fn$;

-- ── 11. Feedback y versionado ───────────────────────────────────────────────

create or replace function objetivo_checkin(
  p_goal uuid, p_tipo text, p_mensaje text,
  p_valor numeric default null, p_tiene_evidencia boolean default false
) returns jsonb language plpgsql security definer set search_path = public as $fn$
declare g improvement_goals%rowtype; v_id uuid;
begin
  select * into g from improvement_goals where id = p_goal;
  if not found then return jsonb_build_object('ok', false, 'error', 'no_existe'); end if;
  if not brote_can_write(g.business_id, 'editor') then
    return jsonb_build_object('ok', false, 'error', 'sin_permiso');
  end if;
  if p_tipo not in ('no_llego','ya_hecho','no_aplica','mas_tiempo','avance','nota') then
    return jsonb_build_object('ok', false, 'error', 'tipo_invalido');
  end if;
  if coalesce(trim(p_mensaje), '') = '' then
    return jsonb_build_object('ok', false, 'error', 'mensaje_vacio');
  end if;

  insert into goal_checkins (goal_id, business_id, autor_id, tipo, mensaje, valor_reportado, tiene_evidencia)
  values (p_goal, g.business_id, auth.uid(), p_tipo, left(p_mensaje, 2000), p_valor, coalesce(p_tiene_evidencia, false))
  returning id into v_id;

  return jsonb_build_object('ok', true, 'checkin_id', v_id);
end $fn$;

/**
 * Aplica una replanificación ya resuelta (por reglas o por IA).
 *
 * Crea la VERSIÓN nueva con `parent_id` a la anterior y marca la anterior como
 * reemplazada. Nunca borra ni pisa: el historial es lo que convierte esto en un
 * programa serio y es lo que se audita para el nivel E4 (fase 2 §7.4).
 */
create or replace function objetivo_replanificar(
  p_goal uuid,
  p_checkin uuid,
  p_accion text,
  p_nuevo jsonb default null,
  p_alternativa jsonb default null,
  p_logrado_retroactivo boolean default false,
  p_retirar boolean default false,
  p_respuesta jsonb default null
) returns jsonb language plpgsql security definer set search_path = public as $fn$
declare
  g improvement_goals%rowtype;
  v_nuevo uuid;
  v_alt jsonb;
  v_meses int;
begin
  select * into g from improvement_goals where id = p_goal for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'no_existe'); end if;
  if not brote_can_write(g.business_id, 'editor') then
    return jsonb_build_object('ok', false, 'error', 'sin_permiso');
  end if;
  if g.reemplazado_at is not null then
    return jsonb_build_object('ok', false, 'error', 'version_vieja');
  end if;

  -- 1. Cierre retroactivo: "ya lo hacemos" con evidencia.
  if p_logrado_retroactivo then
    update improvement_goals
       set status = 'logrado', cerrado_at = now(), observacion = null
     where id = p_goal;
    perform brote_recalcular_mejora(g.business_id);
  -- 2. Retiro: "no aplica a mi negocio".
  elsif p_retirar then
    update improvement_goals
       set status = 'descartado', motivo_descarte = 'No aplica al negocio', cerrado_at = now()
     where id = p_goal;
  -- 3. Versión nueva del mismo objetivo.
  elsif p_nuevo is not null and jsonb_typeof(p_nuevo) = 'object' then
    if coalesce((p_nuevo->>'esfuerzo_horas_mes')::numeric, 99) > 6 then
      return jsonb_build_object('ok', false, 'error', 'esfuerzo_excede_6h');
    end if;
    v_meses := case coalesce(p_nuevo->>'horizonte', g.horizonte::text)
                 when 'trimestral' then 3 when 'semestral' then 6 else 12 end;

    insert into improvement_goals (
      business_id, version, parent_id, titulo, porque, dominio, palanca_slug, metrica, unidad,
      linea_base, origen_base, objetivo, horizonte, ambicion, esfuerzo_horas_mes, inversion,
      como_medir, pasos, evidencia_requerida, si_no_llegas, confianza, metrica_tipo, metodo_tipo,
      alcance, es_evento_unico, supuestos, status, generated_by, pasos_hechos, origen_checkin,
      inicia_at, vence_at
    ) values (
      g.business_id, g.version + 1, g.id,
      left(coalesce(p_nuevo->>'titulo', g.titulo), 140),
      coalesce(p_nuevo->>'porque', g.porque),
      coalesce(p_nuevo->>'dominio', g.dominio),
      coalesce(p_nuevo->>'palanca_slug', g.palanca_slug),
      coalesce(p_nuevo->>'metrica', g.metrica),
      coalesce(p_nuevo->>'unidad', g.unidad),
      coalesce(nullif(p_nuevo->>'linea_base','')::numeric, g.linea_base),
      coalesce(nullif(p_nuevo->>'origen_base','')::baseline_origin, g.origen_base),
      coalesce(nullif(p_nuevo->>'objetivo','')::numeric, g.objetivo),
      coalesce(nullif(p_nuevo->>'horizonte','')::goal_horizon, g.horizonte),
      coalesce(nullif(p_nuevo->>'ambicion','')::goal_ambition, g.ambicion),
      coalesce((p_nuevo->>'esfuerzo_horas_mes')::numeric, g.esfuerzo_horas_mes),
      coalesce(p_nuevo->>'inversion', g.inversion),
      coalesce(p_nuevo->>'como_medir', g.como_medir),
      coalesce(p_nuevo->'pasos', g.pasos),
      coalesce(p_nuevo->>'evidencia_requerida', g.evidencia_requerida),
      coalesce(p_nuevo->>'si_no_llegas', g.si_no_llegas),
      coalesce(p_nuevo->>'confianza', g.confianza),
      coalesce(p_nuevo->>'metrica_tipo', g.metrica_tipo),
      coalesce(p_nuevo->>'metodo_tipo', g.metodo_tipo),
      coalesce((p_nuevo->>'alcance')::smallint, g.alcance),
      coalesce((p_nuevo->>'es_evento_unico')::boolean, g.es_evento_unico),
      coalesce(p_nuevo->'supuestos', g.supuestos),
      case when g.status = 'propuesto' then 'propuesto'::goal_status else 'activo'::goal_status end,
      g.generated_by, g.pasos_hechos, p_checkin,
      coalesce(g.inicia_at, now()),
      coalesce(g.inicia_at, now()) + (v_meses || ' months')::interval
    ) returning id into v_nuevo;

    update improvement_goals set reemplazado_at = now() where id = p_goal;
  end if;

  -- 4. La alternativa o el escalón siguiente se proponen aparte.
  if p_alternativa is not null and jsonb_typeof(p_alternativa) = 'object' then
    v_alt := objetivos_proponer(g.business_id, jsonb_build_array(p_alternativa), g.generated_by);
  end if;

  update goal_checkins
     set respuesta_ia = p_respuesta,
         genero_version = case when v_nuevo is not null then g.version + 1 else null end
   where id = p_checkin and goal_id = p_goal;

  return jsonb_build_object('ok', true, 'nueva_version', v_nuevo, 'alternativa', v_alt);
end $fn$;

-- ── 12. Cierre con evidencia ────────────────────────────────────────────────

create or replace function objetivo_cerrar(p_goal uuid, p_valor_final numeric, p_rutas jsonb)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare
  g improvement_goals%rowtype;
  v_ruta text;
  v_n int := 0;
  v_nombre text;
begin
  select * into g from improvement_goals where id = p_goal for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'no_existe'); end if;
  if not brote_can_write(g.business_id, 'editor') then
    return jsonb_build_object('ok', false, 'error', 'sin_permiso');
  end if;
  if g.status not in ('activo','en_riesgo') then
    return jsonb_build_object('ok', false, 'error', 'no_cerrable');
  end if;
  if g.metrica_tipo <> 'medicion' and p_valor_final is null then
    return jsonb_build_object('ok', false, 'error', 'falta_valor');
  end if;

  for v_ruta in select value from jsonb_array_elements_text(coalesce(p_rutas, '[]'::jsonb)) loop
    if v_ruta !~ ('^' || g.business_id::text || '/objetivos/[0-9a-f-]{36}\.(jpg|jpeg|png|pdf)$') then
      return jsonb_build_object('ok', false, 'error', 'ruta_invalida');
    end if;
    insert into goal_evidence (goal_id, business_id, storage_path, subido_por)
    values (p_goal, g.business_id, v_ruta, auth.uid());
    v_n := v_n + 1;
  end loop;

  if v_n = 0 and not exists (select 1 from goal_evidence where goal_id = p_goal) then
    return jsonb_build_object('ok', false, 'error', 'falta_evidencia');
  end if;

  update improvement_goals
     set status = 'en_revision', valor_final = p_valor_final, cerrado_at = now(), observacion = null
   where id = p_goal;

  select nombre_comercial into v_nombre from businesses where id = g.business_id;
  perform brote_negocio_notificar_revisores(
    'Cierre de objetivo para revisar: ' || v_nombre, left(g.titulo, 120), '/panel/objetivos');

  return jsonb_build_object('ok', true);
end $fn$;

-- ── 13. Lectura: todo lo que necesita la pantalla de Mejora ─────────────────

create or replace function mejora_estado(p_business uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $fn$
declare d improvement_dossiers%rowtype; b businesses%rowtype;
begin
  if not brote_is_member(p_business) then return null; end if;
  select * into b from businesses where id = p_business;
  select * into d from improvement_dossiers where business_id = p_business;

  return jsonb_build_object(
    'negocio', jsonb_build_object(
      'id', b.id, 'nombre_comercial', b.nombre_comercial, 'rubro', b.rubro, 'tamano', b.tamano,
      'ciudad', b.ciudad, 'provincia', b.provincia, 'descripcion', b.descripcion,
      'status', b.status, 'tier', b.tier, 'progreso_mejora', b.progreso_mejora),
    'rol', brote_biz_role(p_business),
    'dossier', case when d.business_id is null then null else jsonb_build_object(
      'operacion', d.operacion, 'energia', d.energia, 'residuos', d.residuos, 'agua', d.agua,
      'insumos', d.insumos, 'logistica', d.logistica, 'ya_hecho', d.ya_hecho,
      'restricciones', d.restricciones, 'completitud', d.completitud,
      'updated_at', d.updated_at) end,
    'progreso', brote_progreso_mejora(p_business),
    'ciclos_cerrados', (select count(*) from improvement_goals
                        where business_id = p_business and status in ('logrado','logrado_parcial')),
    'objetivos', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', g.id, 'version', g.version, 'parent_id', g.parent_id, 'titulo', g.titulo,
        'porque', g.porque, 'dominio', g.dominio, 'palanca_slug', g.palanca_slug,
        'metrica', g.metrica, 'unidad', g.unidad, 'linea_base', g.linea_base,
        'origen_base', g.origen_base, 'objetivo', g.objetivo, 'valor_final', g.valor_final,
        'horizonte', g.horizonte, 'ambicion', g.ambicion, 'esfuerzo_horas_mes', g.esfuerzo_horas_mes,
        'inversion', g.inversion, 'como_medir', g.como_medir, 'pasos', g.pasos,
        'pasos_hechos', g.pasos_hechos, 'evidencia_requerida', g.evidencia_requerida,
        'si_no_llegas', g.si_no_llegas, 'confianza', g.confianza, 'metrica_tipo', g.metrica_tipo,
        'metodo_tipo', g.metodo_tipo, 'alcance', g.alcance, 'es_evento_unico', g.es_evento_unico,
        'status', g.status, 'generated_by', g.generated_by, 'observacion', g.observacion,
        'motivo_descarte', g.motivo_descarte, 'inicia_at', g.inicia_at, 'vence_at', g.vence_at,
        'cerrado_at', g.cerrado_at, 'created_at', g.created_at,
        'checkins', (select count(*) from goal_checkins c where c.goal_id = g.id),
        'evidencias', (select count(*) from goal_evidence e where e.goal_id = g.id),
        -- El último valor que la empresa informó en un check-in. Es lo único
        -- real que hay para dibujar una barra de avance: sin esto, la barra
        -- sería un número inventado.
        'ultimo_valor', (select c.valor_reportado from goal_checkins c
                         where c.goal_id = g.id and c.valor_reportado is not null
                         order by c.created_at desc limit 1))
        order by g.created_at)
      from improvement_goals g
      where g.business_id = p_business and g.reemplazado_at is null), '[]'::jsonb)
  );
end $fn$;

-- La ficha de un objetivo: la versión viva, su historial y sus check-ins.
--
-- La conversación sigue a la CADENA de versiones, no a la fila: un check-in se
-- escribió sobre la versión 1 y la respuesta creó la versión 2. Si la ficha
-- mostrara solo los check-ins de su propia fila, cada replanificación borraría
-- la conversación de la pantalla — y el historial visible es justamente lo que
-- convierte esto en un programa serio (fase 2 §7.4).
create or replace function objetivo_detalle(p_goal uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $fn$
declare g improvement_goals%rowtype; v_cadena uuid[];
begin
  select * into g from improvement_goals where id = p_goal;
  if not found or not brote_is_member(g.business_id) then return null; end if;

  with recursive atras as (
    select * from improvement_goals where id = g.id
    union all
    select v.* from improvement_goals v join atras a on v.id = a.parent_id
  )
  select array_agg(id) into v_cadena from atras;

  return jsonb_build_object(
    'objetivo', to_jsonb(g) - 'business_id',
    'negocio_id', g.business_id,
    'rol', brote_biz_role(g.business_id),
    'checkins', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', c.id, 'tipo', c.tipo, 'mensaje', c.mensaje, 'valor_reportado', c.valor_reportado,
        'tiene_evidencia', c.tiene_evidencia, 'respuesta_ia', c.respuesta_ia,
        'genero_version', c.genero_version, 'created_at', c.created_at,
        'version', (select v.version from improvement_goals v where v.id = c.goal_id),
        'autor', (select coalesce(p.display_name, p.username) from profiles p where p.id = c.autor_id))
        order by c.created_at)
      from goal_checkins c where c.goal_id = any(v_cadena)), '[]'::jsonb),
    'evidencias', coalesce((
      select jsonb_agg(jsonb_build_object('id', e.id, 'nota', e.nota, 'created_at', e.created_at)
        order by e.created_at)
      from goal_evidence e where e.goal_id = any(v_cadena)), '[]'::jsonb),
    -- El historial de versiones anteriores, de la más vieja a la más nueva.
    'historial', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', a.id, 'version', a.version, 'titulo', a.titulo, 'objetivo', a.objetivo,
        'unidad', a.unidad, 'horizonte', a.horizonte, 'ambicion', a.ambicion,
        'reemplazado_at', a.reemplazado_at, 'origen_checkin', a.origen_checkin)
        order by a.version)
      from improvement_goals a where a.id = any(v_cadena) and a.id <> g.id), '[]'::jsonb)
  );
end $fn$;

-- ── 14. Cola de cierres del revisor ─────────────────────────────────────────

create or replace function admin_objetivos_cola(p_pass text)
returns jsonb language plpgsql security definer set search_path = public as $fn$
begin
  if not admin_check(p_pass) then raise exception 'No autorizado' using errcode = 'P0001'; end if;
  return jsonb_build_object(
    'ok', true,
    'pendientes', (select count(*) from improvement_goals where status = 'en_revision'),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', g.id, 'negocio_id', g.business_id, 'negocio', b.nombre_comercial, 'rubro', b.rubro,
        'titulo', g.titulo, 'porque', g.porque, 'metrica', g.metrica, 'unidad', g.unidad,
        'linea_base', g.linea_base, 'objetivo', g.objetivo, 'valor_final', g.valor_final,
        'horizonte', g.horizonte, 'ambicion', g.ambicion, 'como_medir', g.como_medir,
        'evidencia_requerida', g.evidencia_requerida, 'cerrado_at', g.cerrado_at,
        'version', g.version, 'generated_by', g.generated_by,
        'evidencias', coalesce((select jsonb_agg(jsonb_build_object('id', e.id, 'path', e.storage_path)
                                order by e.created_at)
                                from goal_evidence e where e.goal_id = g.id), '[]'::jsonb))
        order by g.cerrado_at)
      from improvement_goals g join businesses b on b.id = g.business_id
      where g.status = 'en_revision'
      limit 100), '[]'::jsonb));
end $fn$;

create or replace function admin_objetivo_revisar(
  p_pass text, p_goal uuid, p_accion text, p_nota text default null
) returns jsonb language plpgsql security definer set search_path = public as $fn$
declare
  g improvement_goals%rowtype;
  v_nombre text;
  v_nota text := nullif(trim(coalesce(p_nota,'')), '');
begin
  if not admin_check(p_pass) then raise exception 'No autorizado' using errcode = 'P0001'; end if;
  if p_accion not in ('aprobar','parcial','corregir') then
    return jsonb_build_object('ok', false, 'error', 'Acción inválida');
  end if;
  select * into g from improvement_goals where id = p_goal for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'No existe'); end if;
  if g.status <> 'en_revision' then
    return jsonb_build_object('ok', false, 'error', 'Este cierre ya no está pendiente');
  end if;
  if p_accion = 'corregir' and coalesce(char_length(v_nota), 0) < 10 then
    return jsonb_build_object('ok', false, 'error', 'Escribí qué hay que corregir');
  end if;

  if p_accion = 'corregir' then
    update improvement_goals
       set status = 'activo', cerrado_at = null, observacion = v_nota
     where id = p_goal;
    perform brote_negocio_notificar(g.business_id, 'Revisamos el cierre de un objetivo', v_nota,
      '/negocio/mejora/' || p_goal::text);
  else
    update improvement_goals
       set status = case p_accion when 'aprobar' then 'logrado'::goal_status else 'logrado_parcial'::goal_status end,
           observacion = v_nota, aprobado_por = auth.uid(), cerrado_at = coalesce(g.cerrado_at, now())
     where id = p_goal;
    perform brote_recalcular_mejora(g.business_id);
    select nombre_comercial into v_nombre from businesses where id = g.business_id;
    perform brote_negocio_notificar(
      g.business_id,
      case p_accion when 'aprobar' then 'Objetivo cerrado: ' || left(g.titulo, 80)
                    else 'Objetivo cerrado como parcial: ' || left(g.titulo, 80) end,
      case p_accion when 'aprobar' then 'Aprobamos la evidencia. Suma al Progreso de Mejora de ' || v_nombre || '.'
                    else 'No llegaste al número pero hubo avance real: cuenta como medio ciclo.' end,
      '/negocio/mejora/' || p_goal::text);
  end if;

  return jsonb_build_object('ok', true);
end $fn$;

-- ── 15. Storage: evidencia de objetivos ─────────────────────────────────────
-- Mismo bucket privado que la fase 1, con el negocio como primer segmento:
-- `business-evidence/<business_id>/objetivos/<uuid>.<ext>`. Las policies de
-- 0105 ya cubren esa ruta.

-- ── 16. Privilegios de funciones ────────────────────────────────────────────

revoke all on function brote_progreso_mejora(uuid)              from public, anon;
revoke all on function brote_recalcular_mejora(uuid)            from public, anon, authenticated;
revoke all on function brote_dossier_completitud(improvement_dossiers) from public, anon, authenticated;
revoke all on function dossier_guardar(uuid, text, jsonb)       from public, anon;
revoke all on function objetivos_proponer(uuid, jsonb, text)    from public, anon;
revoke all on function objetivo_aceptar(uuid)                   from public, anon;
revoke all on function objetivo_descartar(uuid, text)           from public, anon;
revoke all on function objetivo_pasos(uuid, jsonb)              from public, anon;
revoke all on function objetivo_checkin(uuid, text, text, numeric, boolean) from public, anon;
revoke all on function objetivo_replanificar(uuid, uuid, text, jsonb, jsonb, boolean, boolean, jsonb)
  from public, anon;
revoke all on function objetivo_cerrar(uuid, numeric, jsonb)    from public, anon;
revoke all on function mejora_estado(uuid)                      from public, anon;
revoke all on function objetivo_detalle(uuid)                   from public, anon;
revoke all on function admin_objetivos_cola(text)               from public, anon;
revoke all on function admin_objetivo_revisar(text, uuid, text, text) from public, anon;

grant execute on function brote_progreso_mejora(uuid)           to authenticated;
grant execute on function dossier_guardar(uuid, text, jsonb)    to authenticated;
grant execute on function objetivos_proponer(uuid, jsonb, text) to authenticated;
grant execute on function objetivo_aceptar(uuid)                to authenticated;
grant execute on function objetivo_descartar(uuid, text)        to authenticated;
grant execute on function objetivo_pasos(uuid, jsonb)           to authenticated;
grant execute on function objetivo_checkin(uuid, text, text, numeric, boolean) to authenticated;
grant execute on function objetivo_replanificar(uuid, uuid, text, jsonb, jsonb, boolean, boolean, jsonb)
  to authenticated;
grant execute on function objetivo_cerrar(uuid, numeric, jsonb) to authenticated;
grant execute on function mejora_estado(uuid)                   to authenticated;
grant execute on function objetivo_detalle(uuid)                to authenticated;
grant execute on function admin_objetivos_cola(text)            to authenticated;
grant execute on function admin_objetivo_revisar(text, uuid, text, text) to authenticated;
