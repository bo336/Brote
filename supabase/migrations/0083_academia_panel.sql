-- ─────────────────────────────────────────────────────────────────────────────
-- 0083 · La Academia, fase 3 — la cola de revisión, las métricas y el gancho.
--
-- Los RPC de administración copian EXACTAMENTE el patrón que ya existe
-- (`admin_moderation_queue` / `admin_moderate` de 0049): la contraseña se pide
-- en cada lectura y en cada escritura, verificada por `admin_check`, así una
-- pestaña vieja no puede seguir aprobando contenido. No se inventa un esquema
-- de autenticación nuevo para esto.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1 · El gancho de acción, medido ──────────────────────────────────────────
--
-- ACCEPTANCE pide la tasa de toques del gancho, y no había forma de calcularla:
-- la pantalla de resultados mostraba la acción y linkeaba, sin dejar rastro.
-- Dos eventos por sesión como mucho, y el denominador es lo mostrado — una
-- tasa contra el total de sesiones mentiría, porque no todas traen acción.

create table if not exists ac_gancho_eventos (
  sesion_id  uuid not null references ac_sesiones(id) on delete cascade,
  accion_id  uuid not null references activities(id) on delete cascade,
  mostrado_at timestamptz not null default now(),
  tocado_at  timestamptz,
  primary key (sesion_id)
);

alter table ac_gancho_eventos enable row level security;
revoke all on table ac_gancho_eventos from anon, authenticated;

create index if not exists ac_gancho_tocado on ac_gancho_eventos (mostrado_at desc);

/**
 * Registra que el gancho se mostró o se tocó. Idempotente en los dos sentidos:
 * mostrar dos veces no duplica, y tocar dos veces no cuenta dos.
 */
create or replace function academia_gancho(p_sesion_id uuid, p_accion_id uuid, p_evento text)
returns jsonb language plpgsql volatile security definer set search_path = public as $fn$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'No autenticado' using errcode = 'P0001'; end if;
  if not exists (select 1 from ac_sesiones where id = p_sesion_id and user_id = v_uid) then
    return jsonb_build_object('ok', false, 'error', 'Esa sesión no es tuya.');
  end if;
  if p_evento not in ('mostrado', 'tocado') then
    return jsonb_build_object('ok', false, 'error', 'Evento inválido.');
  end if;

  insert into ac_gancho_eventos (sesion_id, accion_id)
  values (p_sesion_id, p_accion_id)
  on conflict (sesion_id) do nothing;

  if p_evento = 'tocado' then
    update ac_gancho_eventos set tocado_at = coalesce(tocado_at, now())
     where sesion_id = p_sesion_id;
  end if;

  return jsonb_build_object('ok', true);
end $fn$;

revoke all on function academia_gancho(uuid, uuid, text) from public, anon, authenticated;
grant execute on function academia_gancho(uuid, uuid, text) to authenticated;

-- ── 2 · La cola de revisión ──────────────────────────────────────────────────

/**
 * Lo que ve quien revisa: el ítem RENDERIZADO como lo vería una persona
 * jugando, sus fuentes, los puntajes del juez y su procedencia.
 *
 * `payload_publico` es literalmente lo que recibe el jugador, así que el panel
 * puede pasárselo al mismo `<Ejercicio>` que usa la Academia. Revisar un ítem
 * leyendo su JSON es cómo se aprueban ítems rotos.
 */
create or replace function academia_admin_cola(p_pass text, p_estado text default 'pendiente',
                                               p_limite int default 50)
returns jsonb language plpgsql volatile security definer set search_path = public as $fn$
begin
  if not admin_check(p_pass) then raise exception 'No autorizado' using errcode = 'P0001'; end if;

  return jsonb_build_object(
    'ok', true,
    'motivos', coalesce((select jsonb_agg(jsonb_build_object(
        'codigo', codigo, 'etiqueta', etiqueta_es, 'descripcion', descripcion) order by codigo)
      from ac_motivos_rechazo), '[]'::jsonb),
    'pendientes', (select count(*) from ac_revision_cola where estado = 'pendiente'),
    'items', coalesce((select jsonb_agg(x order by x.prioridad, x.created_at) from (
      select
        rc.id, rc.clase, rc.motivos, rc.juez, rc.afirmaciones, rc.prioridad,
        rc.estado, rc.created_at, rc.motivo_rechazo, rc.nota,
        -- El ítem tal cual lo vería quien juega.
        case when rc.item_id is null then null else jsonb_build_object(
          'id', i.id, 'tipo', pl.tipo, 'payload_publico', i.payload_publico,
          'solucion', i.solucion, 'age_groups', to_jsonb(i.age_groups),
          'dificultad', i.dificultad, 'status', i.status,
          'plantilla', jsonb_build_object('id', pl.id, 'titulo_interno', pl.titulo_interno,
                                          'version', pl.version, 'tipo', pl.tipo),
          'conceptos', (select jsonb_agg(jsonb_build_object(
              'slug', c.slug, 'titulo_es', c.titulo_es, 'sensible', c.sensible,
              'enunciado_es', c.enunciado_es))
            from ac_plantilla_conceptos pc
            join ac_conceptos c on c.id = pc.concepto_id
            where pc.plantilla_id = i.plantilla_id),
          'fuentes', (select jsonb_agg(distinct jsonb_build_object(
              'id', f.id, 'organizacion', f.organizacion, 'titulo', f.titulo,
              'url', f.url, 'contenido', f.contenido))
            from jsonb_array_elements(coalesce(rc.afirmaciones, '[]'::jsonb)) a
            join ac_fuentes f on f.id = (a->>'fuente_id')::uuid)
        ) end as item,
        case when rc.propuesta_id is null then null else jsonb_build_object(
          'id', pr.id, 'rama_slug', pr.rama_slug, 'anillo', pr.anillo,
          'payload', pr.payload, 'problemas', to_jsonb(pr.problemas), 'estado', pr.estado
        ) end as propuesta,
        case when rc.solicitud_id is null then null else jsonb_build_object(
          'prompt_version', s.prompt_version, 'model_version', s.model_version,
          'temperatura', s.temperatura, 'intento', s.intento,
          'cost_cents', s.cost_cents, 'created_at', s.created_at
        ) end as procedencia
      from ac_revision_cola rc
      left join ac_items i on i.id = rc.item_id
      left join ac_plantillas pl on pl.id = i.plantilla_id
      left join ac_propuestas pr on pr.id = rc.propuesta_id
      left join ac_generacion_solicitudes s on s.id = rc.solicitud_id
      where rc.estado = p_estado
      order by rc.prioridad, rc.created_at
      limit greatest(1, least(200, p_limite))
    ) x), '[]'::jsonb));
end $fn$;

/**
 * Aprobar · editar · rechazar-con-motivo.
 *
 * El código de motivo es obligatorio al rechazar y no es burocracia: es el dato
 * con el que se corrige el prompt de la próxima tanda. Sin él, rechazar cien
 * ítems no enseña nada.
 *
 * Rechazar RETIRA el ítem, nunca lo borra: el registro tiene que seguir siendo
 * interpretable, y además el ítem rechazado es el ejemplo negativo.
 */
create or replace function academia_admin_revisar(
  p_pass text, p_id uuid, p_accion text,
  p_motivo text default null, p_nota text default null,
  p_payload jsonb default null)
returns jsonb language plpgsql volatile security definer set search_path = public as $fn$
declare v_rc ac_revision_cola%rowtype; v_kid boolean;
begin
  if not admin_check(p_pass) then raise exception 'No autorizado' using errcode = 'P0001'; end if;
  if p_accion not in ('aprobar', 'editar', 'rechazar') then
    return jsonb_build_object('ok', false, 'error', 'Acción inválida.');
  end if;

  select * into v_rc from ac_revision_cola where id = p_id;
  if not found then return jsonb_build_object('ok', false, 'error', 'No existe.'); end if;
  if v_rc.estado <> 'pendiente' then
    return jsonb_build_object('ok', false, 'error', 'Ya estaba resuelto.');
  end if;

  if p_accion = 'rechazar' then
    if p_motivo is null or not exists (select 1 from ac_motivos_rechazo where codigo = p_motivo) then
      return jsonb_build_object('ok', false, 'error', 'Hace falta un código de motivo válido.');
    end if;
    if v_rc.item_id is not null then
      update ac_items set status = 'retirado' where id = v_rc.item_id;
    end if;
    if v_rc.propuesta_id is not null then
      update ac_propuestas set estado = 'rechazado', motivo_rechazo = p_motivo, resuelta_at = now()
       where id = v_rc.propuesta_id;
    end if;
    update ac_revision_cola
       set estado = 'rechazado', motivo_rechazo = p_motivo, nota = p_nota, revisado_at = now()
     where id = p_id;
    return jsonb_build_object('ok', true, 'estado', 'rechazado');
  end if;

  -- Editar: se guarda el payload corregido y se aprueba en el mismo paso. Quien
  -- edita ya leyó el ítem entero, que es lo que la aprobación significa.
  if p_accion = 'editar' then
    if v_rc.item_id is null or p_payload is null then
      return jsonb_build_object('ok', false, 'error', 'Editar necesita un ítem y un payload.');
    end if;
    update ac_items set payload_publico = p_payload where id = v_rc.item_id;
  end if;

  if v_rc.item_id is not null then
    -- Un ítem apto kid solo llega acá con una persona mirándolo. Es el punto
    -- exacto donde eso deja de ser una promesa y pasa a ser una decisión.
    select coalesce(age_groups, '{}') @> array['kid'] into v_kid from ac_items where id = v_rc.item_id;
    update ac_items set status = 'aprobado' where id = v_rc.item_id;
  end if;

  if v_rc.propuesta_id is not null then
    update ac_propuestas set estado = 'aprobado', resuelta_at = now() where id = v_rc.propuesta_id;
    -- Aprobar una propuesta la APLICA: crea los gajos, las hojas y los
    -- conceptos, ya `aprobado`, porque alguien acaba de leerlos.
    perform academia_aplicar_propuesta(v_rc.propuesta_id);
  end if;

  update ac_revision_cola
     set estado = case when p_accion = 'editar' then 'editado' else 'aprobado' end,
         nota = p_nota, revisado_at = now()
   where id = p_id;

  return jsonb_build_object('ok', true, 'estado', p_accion, 'kid', coalesce(v_kid, false));
end $fn$;

-- ── 3 · Métricas ─────────────────────────────────────────────────────────────

/**
 * Todo lo que hace falta para saber si la sección está sana, en una llamada.
 *
 * Ninguna cifra está inventada ni estimada: si no hay datos, sale `null` y la
 * pantalla lo dice. Un tablero que muestra 0 % cuando en realidad no midió nada
 * es peor que uno vacío.
 */
create or replace function academia_admin_metricas(p_pass text)
returns jsonb language plpgsql volatile security definer set search_path = public as $fn$
declare v_dias int := 30;
begin
  if not admin_check(p_pass) then raise exception 'No autorizado' using errcode = 'P0001'; end if;

  return jsonb_build_object(
    'ok', true,
    'ventana_dias', v_dias,

    'sesiones', (select jsonb_build_object(
        'total', count(*),
        'terminadas', count(*) filter (where finished_at is not null),
        'abandonadas', count(*) filter (where abandonada_at is not null),
        'riego', count(*) filter (where tipo = 'riego' and finished_at is not null),
        'por_dia', round((count(*) filter (where finished_at is not null))::numeric / v_dias, 2))
      from ac_sesiones where started_at > now() - make_interval(days => v_dias)),

    -- Acierto de PRIMERA vuelta: los re-encolados son práctica, no examen.
    'acierto_primera', (select jsonb_build_object(
        'n', count(*),
        'mediana', percentile_cont(0.5) within group (
          order by case when correcto then 1.0 else 0.0 end),
        'media', round(avg(case when correcto then 1.0 else 0.0 end)::numeric, 4))
      from ac_entregas
      where answered_at is not null and not requeue
        and answered_at > now() - make_interval(days => v_dias)),

    -- Cuántas personas se quedaron sin savia, sobre las que la usaron.
    'savia', (select jsonb_build_object(
        'personas_con_uso', count(*),
        'agotaron', count(*) filter (where hojas >= ac_setting_int('academia_savia_libre', 5)),
        'tasa_agotamiento', case when count(*) = 0 then null else
          round((count(*) filter (where hojas >= ac_setting_int('academia_savia_libre', 5)))::numeric
                / count(*), 4) end)
      from ac_uso_diario where dia_local > current_date - v_dias),

    'semillas', (select jsonb_build_object(
        'otorgadas', coalesce(sum(semillas), 0),
        'tope_diario', ac_setting_int('academia_semillas_dia', 15),
        'dias_en_tope', count(*) filter (where semillas >= ac_setting_int('academia_semillas_dia', 15)))
      from ac_uso_diario where dia_local > current_date - v_dias),

    'gancho', (select jsonb_build_object(
        'mostrado', count(*),
        'tocado', count(*) filter (where tocado_at is not null),
        'tasa', case when count(*) = 0 then null
                     else round((count(*) filter (where tocado_at is not null))::numeric / count(*), 4) end)
      from ac_gancho_eventos where mostrado_at > now() - make_interval(days => v_dias)),

    'pool', (select jsonb_build_object(
        'pares_concepto_tipo', count(*),
        'bajo_piso', count(*) filter (where vivos < ac_setting_int('academia_pool_piso', 40)),
        'mediana_vivos', percentile_cont(0.5) within group (order by vivos))
      from (
        select count(*) filter (where i.status = 'aprobado') as vivos
        from ac_conceptos c
        join ac_plantilla_conceptos pc on pc.concepto_id = c.id
        join ac_plantillas p on p.id = pc.plantilla_id and p.status = 'aprobado'
        left join ac_items i on i.plantilla_id = p.id
        where c.status = 'aprobado'
        group by c.id, p.tipo) z),

    'items', (select jsonb_build_object(
        'aprobados', count(*) filter (where status = 'aprobado'),
        'en_revision', count(*) filter (where status = 'en_revision'),
        'retirados', count(*) filter (where status = 'retirado'),
        'con_embedding', count(*) filter (where embedding is not null))
      from ac_items),

    'generacion', (select jsonb_build_object(
        'solicitudes', count(*),
        'ingeridas', count(*) filter (where estado = 'ingerido'),
        'dead_letter', count(*) filter (where estado = 'dead_letter'),
        'aceptados', coalesce(sum(aceptados), 0),
        'rechazados', coalesce(sum(rechazados), 0),
        'tokens_in', coalesce(sum(tokens_in), 0),
        'tokens_out', coalesce(sum(tokens_out), 0))
      from ac_generacion_solicitudes
      where created_at > date_trunc('month', now())),

    'presupuesto', academia_presupuesto_estado(),

    'revision', (select jsonb_build_object(
        'pendientes', count(*) filter (where estado = 'pendiente'),
        'mas_vieja_horas', round(extract(epoch from (now() - min(created_at)
          filter (where estado = 'pendiente'))) / 3600.0),
        'aprobados', count(*) filter (where estado = 'aprobado'),
        'editados', count(*) filter (where estado = 'editado'),
        'rechazados', count(*) filter (where estado = 'rechazado'))
      from ac_revision_cola),

    -- La distribución de códigos de rechazo ES la lista de tareas del prompt.
    'motivos_rechazo', coalesce((select jsonb_agg(jsonb_build_object(
        'codigo', rc.motivo_rechazo,
        'etiqueta', coalesce(m.etiqueta_es, rc.motivo_rechazo),
        'n', rc.n) order by rc.n desc)
      from (select motivo_rechazo, count(*) as n from ac_revision_cola
             where estado = 'rechazado' and motivo_rechazo is not null
             group by motivo_rechazo) rc
      left join ac_motivos_rechazo m on m.codigo = rc.motivo_rechazo), '[]'::jsonb),

    'propuestas', (select jsonb_build_object(
        'propuestas', count(*) filter (where estado = 'propuesto'),
        'aplicadas', count(*) filter (where estado = 'aplicada'),
        'rechazadas', count(*) filter (where estado = 'rechazado'))
      from ac_propuestas));
end $fn$;

revoke all on function academia_admin_cola(text, text, int)                     from public, anon, authenticated;
revoke all on function academia_admin_revisar(text, uuid, text, text, text, jsonb) from public, anon, authenticated;
revoke all on function academia_admin_metricas(text)                            from public, anon, authenticated;
grant execute on function academia_admin_cola(text, text, int)                     to authenticated;
grant execute on function academia_admin_revisar(text, uuid, text, text, text, jsonb) to authenticated;
grant execute on function academia_admin_metricas(text)                            to authenticated;
