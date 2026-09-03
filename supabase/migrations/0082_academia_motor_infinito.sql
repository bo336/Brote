-- ─────────────────────────────────────────────────────────────────────────────
-- 0082 · La Academia, fase 3 — las funciones del motor infinito.
--
-- Segunda mitad de lo que el pack numera 0040. El esquema está en 0081.
--
-- DÓNDE VIVE CADA COMPUERTA, Y POR QUÉ. La cadena de 14-generation-pipeline §5
-- se reparte entre la edge function y Postgres, y el reparto no es arbitrario:
--
--   1. esquema JSON      → Gemini
--   2. Zod               → edge function (necesita la semántica de cada tipo)
--   3. determinísticas   → edge function (ídem)
--   4. GROUNDING         → ACÁ. Es la compuerta que impide publicar un dato
--                          inventado, y `ac_fuentes.contenido` vive en esta
--                          base. Hacerla acá significa que ningún deploy malo
--                          la puede saltear: no hay camino a `aprobado` que no
--                          pase por `academia_ingerir_item`.
--   5. deduplicado       → ACÁ. pgvector está acá.
--   6. juez LLM          → edge function (es otra llamada, otro prompt)
--   7. cola humana       → ACÁ. El ruteo obligatorio es una regla de negocio,
--                          no una decisión del cliente.
--   8. cribado en vivo   → ACÁ, de noche.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1 · Presupuesto ──────────────────────────────────────────────────────────

create or replace function ac_presupuesto_mes()
returns ac_generacion_presupuesto language plpgsql volatile security definer set search_path = public as $fn$
declare v_mes date := date_trunc('month', (now() at time zone 'America/Argentina/Buenos_Aires'))::date;
        v_row ac_generacion_presupuesto%rowtype;
begin
  insert into ac_generacion_presupuesto (mes, tope_centavos)
  values (v_mes, ac_setting_int('academia_presupuesto_centavos', 2000))
  on conflict (mes) do nothing;
  select * into v_row from ac_generacion_presupuesto where mes = v_mes;
  return v_row;
end $fn$;

/**
 * ¿Se puede enviar algo más este mes?
 *
 * Se consulta ANTES de enviar, nunca después. Cuando el tope se alcanza la
 * generación se detiene y lo deja escrito: no baja una compuerta, no acorta el
 * prompt, no cambia de modelo. Para.
 */
create or replace function academia_presupuesto_estado()
returns jsonb language plpgsql volatile security definer set search_path = public as $fn$
declare v ac_generacion_presupuesto%rowtype;
begin
  v := ac_presupuesto_mes();
  return jsonb_build_object(
    'mes', v.mes, 'tope_centavos', v.tope_centavos,
    'gastado_centavos', round(v.gastado_centavos, 2),
    'restante_centavos', round(greatest(0, v.tope_centavos - v.gastado_centavos), 2),
    'solicitudes', v.solicitudes,
    'habilitado', ac_setting_bool('academia_generacion_enabled', false)
                  and v.gastado_centavos < v.tope_centavos,
    'detenido_at', v.detenido_at);
end $fn$;

create or replace function academia_presupuesto_gastar(p_centavos numeric)
returns jsonb language plpgsql volatile security definer set search_path = public as $fn$
declare v ac_generacion_presupuesto%rowtype;
begin
  v := ac_presupuesto_mes();
  update ac_generacion_presupuesto
     set gastado_centavos = gastado_centavos + greatest(0, coalesce(p_centavos, 0)),
         solicitudes = solicitudes + 1,
         detenido_at = case
           when gastado_centavos + greatest(0, coalesce(p_centavos, 0)) >= tope_centavos
                and detenido_at is null then now() else detenido_at end,
         updated_at = now()
   where mes = v.mes;
  return academia_presupuesto_estado();
end $fn$;

-- ── 2 · Piso de pool: generar contra la demanda, no contra un reloj ──────────

/**
 * Qué (concepto, tipo) está flaco.
 *
 * Ordenado por cuánta gente está a DOS SALTOS de prerrequisito de ese concepto:
 * generar lo que la gente está por necesitar, no lo que falta en abstracto.
 * Generar contra un cronograma fabrica contenido que nadie ve.
 */
create or replace function academia_pool_hambriento(p_limite int default 40)
returns jsonb language plpgsql stable security definer set search_path = public as $fn$
declare v_piso int := ac_setting_int('academia_pool_piso', 40);
begin
  return coalesce((
    with pool as (
      select c.id as concepto_id, c.slug, c.titulo_es, c.anillo, c.sensible, c.age_groups,
             p.tipo,
             count(*) filter (where i.status = 'aprobado') as vivos
      from ac_conceptos c
      join ac_plantilla_conceptos pc on pc.concepto_id = c.id
      join ac_plantillas p on p.id = pc.plantilla_id and p.status = 'aprobado'
      left join ac_items i on i.plantilla_id = p.id
      where c.status = 'aprobado'
      group by c.id, p.tipo
      having count(*) filter (where i.status = 'aprobado') < v_piso
    ),
    -- A dos saltos: quien ya sabe algo que es prerrequisito de un prerrequisito
    -- de este concepto está a punto de encontrárselo.
    cerca as (
      select pr2.concepto_id, count(distinct uc.user_id) as gente
      from ac_concepto_prereq pr2
      join ac_concepto_prereq pr1 on pr1.concepto_id = pr2.requiere_id
      join ac_user_concepto uc on uc.concepto_id = pr1.requiere_id and uc.mastery_ema >= 0.6
      group by pr2.concepto_id
      union all
      select pr1.concepto_id, count(distinct uc.user_id)
      from ac_concepto_prereq pr1
      join ac_user_concepto uc on uc.concepto_id = pr1.requiere_id and uc.mastery_ema >= 0.6
      group by pr1.concepto_id
    ),
    demanda as (select concepto_id, sum(gente) as gente from cerca group by concepto_id)
    select jsonb_agg(x order by x.gente desc, x.vivos asc)
    from (
      select pool.concepto_id, pool.slug, pool.titulo_es, pool.anillo, pool.sensible,
             pool.age_groups, pool.tipo::text as tipo, pool.vivos,
             coalesce(d.gente, 0) as gente
      from pool left join demanda d on d.concepto_id = pool.concepto_id
      order by coalesce(d.gente, 0) desc, pool.vivos asc
      limit greatest(1, p_limite)
    ) x
  ), '[]'::jsonb);
end $fn$;

/**
 * Todo lo que el prompt necesita de un (concepto, tipo), en una sola llamada.
 *
 * Las fuentes van con su `contenido` completo porque son el material de
 * anclaje: el modelo tiene que poder citar literalmente de ahí, y la compuerta
 * de grounding después comprueba que lo haya hecho.
 *
 * Los ejemplares son kNN por embedding cuando lo hay —el few-shot recuperado
 * por vecino cercano es el elemento de mayor palanca del prompt— y los más
 * recientes aprobados cuando todavía no hay embeddings.
 */
create or replace function academia_gen_contexto(p_concepto_id uuid, p_tipo ac_tipo_ejercicio)
returns jsonb language plpgsql stable security definer set search_path = public as $fn$
declare v_c ac_conceptos%rowtype; v_ref extensions.vector(768);
begin
  select * into v_c from ac_conceptos where id = p_concepto_id;
  if not found then return jsonb_build_object('ok', false, 'error', 'concepto inexistente'); end if;

  select i.embedding into v_ref
    from ac_items i
    join ac_plantilla_conceptos pc on pc.plantilla_id = i.plantilla_id
   where pc.concepto_id = p_concepto_id and i.embedding is not null
   order by pc.peso desc limit 1;

  return jsonb_build_object(
    'ok', true,
    'concepto', jsonb_build_object(
      'id', v_c.id, 'slug', v_c.slug, 'titulo_es', v_c.titulo_es,
      'enunciado_es', v_c.enunciado_es, 'detalle_es', v_c.detalle_es,
      'rama_slug', v_c.rama_slug, 'anillo', v_c.anillo,
      'age_groups', to_jsonb(v_c.age_groups), 'sensible', v_c.sensible),
    'anillo_rubrica', (select jsonb_build_object('nombre', nombre_es, 'rubrica', rubrica)
                       from ac_anillos where n = v_c.anillo),
    'fuentes', coalesce((select jsonb_agg(jsonb_build_object(
        'id', f.id, 'organizacion', f.organizacion, 'titulo', f.titulo,
        'publicado', f.publicado, 'contenido', f.contenido))
      from ac_fuentes f
      where f.id = v_c.fuente_id
         or f.id in (select m.fuente_id from ac_misconceptions m where m.concepto_id = v_c.id)
      limit 4), '[]'::jsonb),
    -- Las creencias falsas documentadas son LA fuente de distractores: un
    -- distractor que nadie cree no mide nada.
    'misconceptions', coalesce((select jsonb_agg(jsonb_build_object(
        'slug', m.slug, 'creencia_es', m.creencia_es, 'correccion_es', m.correccion_es))
      from ac_misconceptions m where m.concepto_id = v_c.id), '[]'::jsonb),
    'ejemplos', coalesce((select jsonb_agg(jsonb_build_object(
        'enunciado', i.payload_publico->>'enunciado', 'payload_publico', i.payload_publico))
      from (
        select i.payload_publico, i.created_at, i.embedding
        from ac_items i
        join ac_plantillas p on p.id = i.plantilla_id and p.tipo = p_tipo
        where i.status = 'aprobado'
        order by case when v_ref is not null and i.embedding is not null
                      then i.embedding <=> v_ref else null end nulls last,
                 i.created_at desc
        limit 3) i), '[]'::jsonb));
end $fn$;

-- ── 3 · Grounding: la compuerta que importa ─────────────────────────────────

/**
 * Cada `cita` tiene que ser subcadena LITERAL del `contenido` de la fuente que
 * declara. Una comparación de strings, gratis, y mata las citas inventadas de
 * raíz — es la compuerta de mayor valor por línea de todo el pipeline.
 *
 * Se normalizan solo los espacios (el modelo reformatea saltos de línea). NO se
 * normaliza nada más: bajar la exigencia acá es exactamente cómo se cuela un
 * dato fabricado. Y no se "arregla" una cita que falla: se rechaza el ítem.
 */
create or replace function academia_grounding(p_afirmaciones jsonb)
returns jsonb language plpgsql stable security definer set search_path = public as $fn$
declare a jsonb; v_txt text; v_cita text; v_fallas jsonb := '[]'::jsonb; v_n int := 0;
begin
  if p_afirmaciones is null or jsonb_typeof(p_afirmaciones) <> 'array'
     or jsonb_array_length(p_afirmaciones) = 0 then
    return jsonb_build_object('ok', false, 'motivo', 'sin_afirmaciones', 'fallas', '[]'::jsonb);
  end if;

  for a in select * from jsonb_array_elements(p_afirmaciones) loop
    v_n := v_n + 1;
    select regexp_replace(coalesce(contenido, ''), '\s+', ' ', 'g') into v_txt
      from ac_fuentes where id = (a->>'fuente_id')::uuid;
    v_cita := regexp_replace(coalesce(a->>'cita', ''), '\s+', ' ', 'g');

    if v_txt is null or v_txt = '' then
      v_fallas := v_fallas || jsonb_build_array(jsonb_build_object(
        'i', v_n, 'motivo', 'fuente_inexistente_o_vacia', 'fuente_id', a->>'fuente_id'));
    elsif length(v_cita) < 12 then
      v_fallas := v_fallas || jsonb_build_array(jsonb_build_object(
        'i', v_n, 'motivo', 'cita_demasiado_corta', 'cita', v_cita));
    elsif position(v_cita in v_txt) = 0 then
      v_fallas := v_fallas || jsonb_build_array(jsonb_build_object(
        'i', v_n, 'motivo', 'cita_no_literal', 'cita', left(v_cita, 160)));
    end if;
  end loop;

  return jsonb_build_object(
    'ok', jsonb_array_length(v_fallas) = 0,
    'afirmaciones', v_n,
    'fallas', v_fallas);
end $fn$;

-- ── 4 · Deduplicado por embedding ───────────────────────────────────────────

/**
 * `<=>` es distancia coseno; la similitud es `1 - (a <=> b)`. Se compara solo
 * contra ítems del MISMO concepto y tipo: dos ítems parecidos de conceptos
 * distintos no son un duplicado, son una analogía, y borrarla empobrece.
 */
create or replace function academia_dedupe(p_concepto_id uuid, p_tipo ac_tipo_ejercicio,
                                           p_embedding extensions.vector(768))
returns jsonb language plpgsql stable security definer set search_path = public as $fn$
declare v_umbral real := coalesce((select (value #>> '{}')::real from app_settings
                                    where key = 'academia_dedupe_umbral'), 0.93);
        v_id uuid; v_sim real;
begin
  if p_embedding is null then
    return jsonb_build_object('ok', true, 'motivo', 'sin_embedding', 'umbral', v_umbral);
  end if;

  select i.id, (1 - (i.embedding <=> p_embedding))::real
    into v_id, v_sim
    from ac_items i
    join ac_plantillas p on p.id = i.plantilla_id and p.tipo = p_tipo
    join ac_plantilla_conceptos pc on pc.plantilla_id = i.plantilla_id and pc.concepto_id = p_concepto_id
   where i.embedding is not null and i.status in ('aprobado', 'en_revision', 'borrador')
   order by i.embedding <=> p_embedding
   limit 1;

  return jsonb_build_object(
    'ok', v_sim is null or v_sim <= v_umbral,
    'similitud', v_sim, 'umbral', v_umbral, 'parecido_a', v_id);
end $fn$;

-- ── 5 · Dificultad inicial: heredar la familia ──────────────────────────────

/**
 * Un ítem recién nacido NO se sirve como si estuviera calibrado.
 *
 * Hacen falta ~100 respuestas para que la dificultad de un ítem sea confiable.
 * Hasta entonces se lo encoge hacia la media de su familia de plantilla, con
 * peso `n / (n + 100)`: con 0 respuestas es la familia pura, con 100 es mitad
 * y mitad, y de ahí en más manda lo medido.
 */
create or replace function academia_dificultad_familia(p_plantilla_id uuid)
returns real language sql stable security definer set search_path = public as $fn$
  select coalesce(
    (select avg(i.dificultad)::real
       from ac_items i
       join ac_plantillas p on p.id = i.plantilla_id
      where p.id = p_plantilla_id or (p.titulo_interno = (select titulo_interno from ac_plantillas where id = p_plantilla_id))),
    (select dificultad_base from ac_plantillas where id = p_plantilla_id),
    0)::real;
$fn$;

create or replace function academia_dificultad_encogida(p_item_id uuid)
returns real language plpgsql stable security definer set search_path = public as $fn$
declare v_n int; v_fam real; v_prop real; v_w real;
begin
  select count(*) into v_n from ac_entregas where item_id = p_item_id and answered_at is not null;
  select i.dificultad, academia_dificultad_familia(i.plantilla_id) into v_prop, v_fam
    from ac_items i where i.id = p_item_id;
  if v_prop is null then return coalesce(v_fam, 0); end if;
  v_w := v_n::real / (v_n + 100.0);
  return v_fam + v_w * (v_prop - v_fam);
end $fn$;

-- ── 6 · Cribado psicométrico: la única compuerta que ve usuarios reales ─────

/**
 * Retira —nunca borra— los ítems que dejaron de informar, después de al menos
 * 50 entregas respondidas:
 *
 *   · p_correct < 0.15 o > 0.95  → no distingue a nadie de nadie
 *   · discriminación < 0.10      → no separa a quien sabe de quien no
 *   · latencia mediana disparatada contra su familia de plantilla
 *
 * `status = 'retirado'`, jamás un delete: el registro de respuestas tiene que
 * seguir siendo interpretable, y una fila borrada se lleva su propio pasado.
 */
create or replace function academia_cribado_psicometrico(p_seco boolean default false)
returns jsonb language plpgsql volatile security definer set search_path = public as $fn$
declare v_ids uuid[] := '{}'; v_motivos jsonb := '[]'::jsonb; v_it record;
begin
  for v_it in
    with resp as (
      select e.item_id,
             count(*) as n,
             avg(case when e.correcto then 1.0 else 0.0 end)::real as p_correct,
             -- Discriminación: correlación punto-biserial entre acertar el ítem
             -- y la habilidad previa de quien lo contestó. Si no separa, no mide.
             corr(case when e.correcto then 1.0 else 0.0 end, e.theta_previo::float8)::real as disc,
             percentile_cont(0.5) within group (order by e.latency_ms)::real as lat_mediana
      from ac_entregas e
      where e.answered_at is not null and e.item_id is not null
      group by e.item_id
      having count(*) >= 50
    ),
    fam as (
      select i.plantilla_id,
             percentile_cont(0.5) within group (order by r.lat_mediana)::real as lat_fam
      from resp r join ac_items i on i.id = r.item_id
      group by i.plantilla_id
    )
    select r.item_id, r.n, r.p_correct, r.disc, r.lat_mediana, f.lat_fam
    from resp r
    join ac_items i on i.id = r.item_id and i.status = 'aprobado'
    left join fam f on f.plantilla_id = i.plantilla_id
  loop
    declare v_m text[] := '{}';
    begin
      if v_it.p_correct < 0.15 then v_m := v_m || 'demasiado_dificil'; end if;
      if v_it.p_correct > 0.95 then v_m := v_m || 'demasiado_facil'; end if;
      if v_it.disc is not null and v_it.disc < 0.10 then v_m := v_m || 'no_discrimina'; end if;
      if v_it.lat_fam is not null and v_it.lat_fam > 0
         and (v_it.lat_mediana > v_it.lat_fam * 3 or v_it.lat_mediana < v_it.lat_fam / 3) then
        v_m := v_m || 'latencia_atipica';
      end if;

      if array_length(v_m, 1) is not null then
        v_ids := v_ids || v_it.item_id;
        v_motivos := v_motivos || jsonb_build_array(jsonb_build_object(
          'item_id', v_it.item_id, 'n', v_it.n,
          'p_correct', round(v_it.p_correct::numeric, 3),
          'discriminacion', round(coalesce(v_it.disc, 0)::numeric, 3),
          'motivos', to_jsonb(v_m)));
      end if;
    end;
  end loop;

  if not p_seco and array_length(v_ids, 1) is not null then
    update ac_items set status = 'retirado' where id = any(v_ids);
  end if;

  return jsonb_build_object('ok', true, 'retirados', coalesce(array_length(v_ids, 1), 0),
                            'seco', p_seco, 'detalle', v_motivos);
end $fn$;

-- ── 7 · Ingesta: grounding + dedupe + ruteo, todo del lado del servidor ─────

/**
 * El único camino por el que un ítem generado llega al pool.
 *
 * Corre las compuertas 4, 5 y 7 y decide el destino. El ruteo a revisión humana
 * es OBLIGATORIO y no negociable en cinco casos: lo que el juez marcó, un 5 %
 * de auditoría al azar, todo lo que toca un concepto sensible, **todo lo que es
 * apto `kid`**, y todas las propuestas de currículum. Nada entra a contenido
 * infantil sin que una persona lo haya leído.
 */
create or replace function academia_ingerir_item(
  p_solicitud_id uuid,
  p_plantilla_id uuid,
  p_seed bigint,
  p_payload_publico jsonb,
  p_solucion jsonb,
  p_afirmaciones jsonb,
  p_age_groups text[],
  p_dificultad real default null,
  p_juez jsonb default null,
  p_embedding extensions.vector(768) default null
) returns jsonb language plpgsql volatile security definer set search_path = public as $fn$
declare
  v_concepto uuid; v_sensible boolean; v_tipo ac_tipo_ejercicio;
  v_g jsonb; v_d jsonb; v_item uuid; v_motivos text[] := '{}';
  v_juez_ok boolean; v_dif real;
begin
  select p.tipo into v_tipo from ac_plantillas p where p.id = p_plantilla_id;
  if v_tipo is null then
    return jsonb_build_object('ok', false, 'motivo', 'plantilla_inexistente');
  end if;

  select pc.concepto_id, c.sensible into v_concepto, v_sensible
    from ac_plantilla_conceptos pc
    join ac_conceptos c on c.id = pc.concepto_id
   where pc.plantilla_id = p_plantilla_id
   order by pc.peso desc limit 1;

  -- 4 · Grounding. Rechazo duro: no se corrige una cita que falla.
  v_g := academia_grounding(p_afirmaciones);
  if not (v_g->>'ok')::boolean then
    return jsonb_build_object('ok', false, 'motivo', 'grounding', 'detalle', v_g);
  end if;

  -- 5 · Deduplicado.
  v_d := academia_dedupe(v_concepto, v_tipo, p_embedding);
  if not (v_d->>'ok')::boolean then
    return jsonb_build_object('ok', false, 'motivo', 'duplicado', 'detalle', v_d);
  end if;

  -- La dificultad de un ítem nuevo es la de su familia, no la que el modelo dijo.
  v_dif := coalesce(academia_dificultad_familia(p_plantilla_id), coalesce(p_dificultad, 0));

  insert into ac_items (plantilla_id, seed, payload_publico, solucion, age_groups,
                        anillo_min, dificultad, status, embedding, embedding_at)
  values (p_plantilla_id, p_seed, p_payload_publico,
          p_solucion || jsonb_build_object('afirmaciones', p_afirmaciones),
          coalesce(p_age_groups, array['teen','adult']),
          coalesce((select anillo from ac_conceptos where id = v_concepto), 1),
          v_dif, 'en_revision', p_embedding,
          case when p_embedding is null then null else now() end)
  on conflict (plantilla_id, seed) do nothing
  returning id into v_item;

  if v_item is null then
    return jsonb_build_object('ok', false, 'motivo', 'seed_repetido');
  end if;

  -- 7 · Ruteo a revisión. Los cinco casos obligatorios.
  v_juez_ok := p_juez is null
               or not coalesce((p_juez->>'problema_bloqueante')::boolean, false);
  if p_juez is not null and coalesce((p_juez->>'correccion_factual')::real, 5) < 4 then
    v_juez_ok := false;
  end if;

  if not v_juez_ok                                   then v_motivos := v_motivos || 'juez'; end if;
  if v_sensible                                      then v_motivos := v_motivos || 'sensible'; end if;
  if coalesce(p_age_groups, '{}') @> array['kid']    then v_motivos := v_motivos || 'kid'; end if;
  if random() < 0.05                                 then v_motivos := v_motivos || 'auditoria'; end if;

  if array_length(v_motivos, 1) is null then
    -- Nada lo obliga a revisión: entra al pool.
    update ac_items set status = 'aprobado' where id = v_item;
    return jsonb_build_object('ok', true, 'item_id', v_item, 'estado', 'aprobado',
                              'grounding', v_g, 'dedupe', v_d);
  end if;

  insert into ac_revision_cola (clase, item_id, solicitud_id, motivos, juez, afirmaciones,
                                prioridad)
  values ('item', v_item, p_solicitud_id, v_motivos, p_juez, p_afirmaciones,
          case when 'kid' = any(v_motivos) or 'sensible' = any(v_motivos) then 1
               when 'juez' = any(v_motivos) then 3 else 5 end);

  return jsonb_build_object('ok', true, 'item_id', v_item, 'estado', 'en_revision',
                            'motivos', to_jsonb(v_motivos), 'grounding', v_g, 'dedupe', v_d);
end $fn$;

-- ── 8 · Expansión de anillo ─────────────────────────────────────────────────

/**
 * Las barandas, en SQL y no en el prompt.
 *
 * Un prompt puede pedir por favor; una restricción se cumple. Acá se rechaza:
 * una rama que no existe (las 13 son identidad de producto, no contenido
 * generado), un anillo por encima del techo, un prerrequisito que nombra un
 * slug inexistente, un slug de gajo o concepto ya usado, y cualquier ciclo.
 */
create or replace function academia_validar_propuesta(p_rama text, p_anillo int, p_payload jsonb)
returns text[] language plpgsql stable security definer set search_path = public as $fn$
declare v_probs text[] := '{}'; g jsonb; c jsonb; pre text;
        v_nuevos text[] := '{}'; v_techo int := ac_setting_int('academia_anillo_techo', 6);
begin
  if not exists (select 1 from ac_ramas where slug = p_rama) then
    v_probs := v_probs || format('la rama "%s" no existe: no se crean ramas nuevas', p_rama);
    return v_probs;
  end if;
  if p_anillo is null or p_anillo < 1 or p_anillo > v_techo then
    v_probs := v_probs || format('anillo %s fuera del techo (%s)', p_anillo, v_techo);
  end if;
  if p_payload->'gajos' is null or jsonb_typeof(p_payload->'gajos') <> 'array'
     or jsonb_array_length(p_payload->'gajos') = 0 then
    v_probs := v_probs || 'la propuesta no trae gajos';
    return v_probs;
  end if;

  -- Todos los slugs nuevos primero: un prerrequisito puede apuntar a un
  -- concepto de la misma propuesta, y eso es legítimo.
  for g in select * from jsonb_array_elements(p_payload->'gajos') loop
    for c in select * from jsonb_array_elements(coalesce(g->'conceptos', '[]'::jsonb)) loop
      v_nuevos := v_nuevos || (c->>'slug');
    end loop;
  end loop;

  for g in select * from jsonb_array_elements(p_payload->'gajos') loop
    if g->>'slug' is null or g->>'titulo_es' is null then
      v_probs := v_probs || 'un gajo viene sin slug o sin título';
    elsif exists (select 1 from ac_gajos where slug = g->>'slug') then
      v_probs := v_probs || format('el gajo "%s" ya existe', g->>'slug');
    end if;

    for c in select * from jsonb_array_elements(coalesce(g->'conceptos', '[]'::jsonb)) loop
      if c->>'slug' is null or c->>'enunciado_es' is null then
        v_probs := v_probs || 'un concepto viene sin slug o sin enunciado';
      elsif exists (select 1 from ac_conceptos where slug = c->>'slug') then
        v_probs := v_probs || format('el concepto "%s" ya existe', c->>'slug');
      end if;

      for pre in select jsonb_array_elements_text(coalesce(c->'prereq', '[]'::jsonb)) loop
        if not exists (select 1 from ac_conceptos where slug = pre)
           and not (pre = any(v_nuevos)) then
          v_probs := v_probs || format('el prerrequisito "%s" no existe', pre);
        end if;
        if pre = c->>'slug' then
          v_probs := v_probs || format('"%s" se pide a sí mismo', pre);
        end if;
      end loop;
    end loop;
  end loop;

  return v_probs;
end $fn$;

/**
 * ¿Esta persona cerró un anillo y le queda poco por delante?
 *
 * Se dispara al cerrar: todos los gajos alcanzables del anillo n están
 * frondosos y hay menos de `k` gajos en n+1 en sus ramas más fuertes. Devuelve
 * la rama a proponer, o null. No genera nada: solo dice que hace falta.
 */
create or replace function academia_expansion_necesaria(p_user uuid, p_k int default 3)
returns jsonb language plpgsql stable security definer set search_path = public as $fn$
declare v_anillo int; v_acc text; v_rama text; v_faltan int; v_techo int;
begin
  v_techo := ac_setting_int('academia_anillo_techo', 6);
  v_acc := brote_account_type(p_user);
  select coalesce(max(anillo), 1) into v_anillo from ac_user_anillo
   where user_id = p_user and cerrado_at is null;
  if v_anillo >= v_techo then
    return jsonb_build_object('necesaria', false, 'motivo', 'techo');
  end if;

  -- Su rama más fuerte, medida por maestría acumulada.
  select c.rama_slug into v_rama
    from ac_user_concepto uc
    join ac_conceptos c on c.id = uc.concepto_id
   where uc.user_id = p_user and c.rama_slug <> 'tronco'
   group by c.rama_slug
   order by sum(uc.mastery_ema) desc
   limit 1;
  if v_rama is null then return jsonb_build_object('necesaria', false, 'motivo', 'sin_datos'); end if;

  select count(*) into v_faltan from ac_gajos
   where rama_slug = v_rama and anillo = v_anillo + 1
     and status = 'aprobado' and age_groups @> array[v_acc];

  return jsonb_build_object(
    'necesaria', v_faltan < p_k,
    'rama_slug', v_rama, 'anillo', v_anillo + 1, 'gajos_existentes', v_faltan);
end $fn$;

/**
 * Guarda una propuesta. Siempre `propuesto`, siempre invisible, siempre con sus
 * problemas anotados si los tiene — una propuesta inválida se guarda igual para
 * que se vea POR QUÉ falló, pero no se puede aprobar.
 */
create or replace function academia_guardar_propuesta(
  p_rama text, p_anillo int, p_payload jsonb,
  p_prompt_version text default null, p_model_version text default null,
  p_user uuid default null)
returns jsonb language plpgsql volatile security definer set search_path = public as $fn$
declare v_probs text[]; v_id uuid;
begin
  v_probs := academia_validar_propuesta(p_rama, p_anillo, p_payload);

  insert into ac_propuestas (rama_slug, anillo, disparada_por, payload, problemas,
                             prompt_version, model_version)
  values (p_rama, p_anillo, p_user, p_payload, v_probs, p_prompt_version, p_model_version)
  on conflict do nothing
  returning id into v_id;

  if v_id is null then
    return jsonb_build_object('ok', false, 'motivo', 'ya_hay_una_abierta');
  end if;

  -- Toda propuesta va a revisión humana. Sin excepción.
  insert into ac_revision_cola (clase, propuesta_id, motivos, prioridad)
  values ('propuesta', v_id, array['propuesta'], 2);

  return jsonb_build_object('ok', true, 'propuesta_id', v_id,
                            'problemas', to_jsonb(v_probs),
                            'aprobable', array_length(v_probs, 1) is null);
end $fn$;

/**
 * Aplicar una propuesta aprobada: crea gajos, hojas, conceptos y prerrequisitos.
 *
 * Todo entra `aprobado` porque una persona ya lo leyó — que es exactamente lo
 * que significa que la propuesta esté aprobada. El trigger anticiclos de 0077
 * sigue vigilando los prerrequisitos, así que un ciclo revienta la transacción
 * entera y no se aplica nada.
 */
create or replace function academia_aplicar_propuesta(p_id uuid)
returns jsonb language plpgsql volatile security definer set search_path = public as $fn$
declare v_p ac_propuestas%rowtype; g jsonb; c jsonb; pre text;
        v_gajo uuid; v_hoja uuid; v_con uuid; v_ng int := 0; v_nc int := 0; v_ord int := 0;
begin
  select * into v_p from ac_propuestas where id = p_id;
  if not found then return jsonb_build_object('ok', false, 'error', 'no existe'); end if;
  if v_p.estado <> 'aprobado' then
    return jsonb_build_object('ok', false, 'error', 'la propuesta no está aprobada');
  end if;
  if array_length(v_p.problemas, 1) is not null then
    return jsonb_build_object('ok', false, 'error', 'la propuesta tiene problemas sin resolver');
  end if;

  for g in select * from jsonb_array_elements(v_p.payload->'gajos') loop
    v_ord := v_ord + 1;
    insert into ac_gajos (slug, rama_slug, anillo, titulo_es, bajada_es, sort_order, status, origen)
    values (g->>'slug', v_p.rama_slug, v_p.anillo, g->>'titulo_es',
            coalesce(g->>'bajada_es', ''), v_ord, 'aprobado', 'propuesta')
    returning id into v_gajo;
    v_ng := v_ng + 1;

    insert into ac_hojas (slug, gajo_id, titulo_es, bajada_es, minutos, sort_order, status)
    values ((g->>'slug') || '-1', v_gajo, g->>'titulo_es', coalesce(g->>'bajada_es', ''),
            5, 1, 'aprobado')
    returning id into v_hoja;

    for c in select * from jsonb_array_elements(coalesce(g->'conceptos', '[]'::jsonb)) loop
      insert into ac_conceptos (slug, rama_slug, titulo_es, enunciado_es, anillo, status)
      values (c->>'slug', v_p.rama_slug, coalesce(c->>'titulo_es', c->>'slug'),
              c->>'enunciado_es', v_p.anillo, 'aprobado')
      returning id into v_con;
      v_nc := v_nc + 1;

      insert into ac_hoja_conceptos (hoja_id, concepto_id) values (v_hoja, v_con)
      on conflict do nothing;

      for pre in select jsonb_array_elements_text(coalesce(c->'prereq', '[]'::jsonb)) loop
        insert into ac_concepto_prereq (concepto_id, requiere_id, fuerza)
        select v_con, x.id, 0.9 from ac_conceptos x where x.slug = pre
        on conflict do nothing;
      end loop;
    end loop;
  end loop;

  update ac_propuestas set estado = 'aplicada', aplicada_at = now() where id = p_id;
  return jsonb_build_object('ok', true, 'gajos', v_ng, 'conceptos', v_nc);
end $fn$;

-- ── 9 · Mantenimiento nocturno ──────────────────────────────────────────────

/**
 * Todo lo que la Academia hace de noche, en una sola función que
 * `daily_maintenance()` invoca. No hay un segundo cronograma.
 *
 * El decaimiento NO se materializa acá y es a propósito: `fuerza` se calcula al
 * leer (`mastery × ac_retrievability(last_seen, half_life)`), así que un gajo se
 * marchita solo con que pase el tiempo, sin que nadie escriba una fila. Lo que
 * sí hace esta función es MIRAR quién quedó marchito para poder avisarle, y
 * encolar generación para los pools flacos.
 */
create or replace function academia_mantenimiento_diario()
returns jsonb language plpgsql volatile security definer set search_path = public as $fn$
declare v_criba jsonb; v_hambre jsonb; v_avisos int := 0; r record;
begin
  if not ac_setting_bool('academia_enabled', true) then
    return jsonb_build_object('ok', true, 'saltado', 'academia apagada');
  end if;

  -- Cribado psicométrico: retira lo que dejó de informar.
  v_criba := academia_cribado_psicometrico(false);

  -- Pools flacos, para que el pipeline sepa qué pedir cuando corra.
  v_hambre := academia_pool_hambriento(40);

  -- UN aviso por día como máximo, y solo a quien tiene algo marchito de verdad
  -- y no recibió ya el empujón de racha. Nunca los dos, nunca un tercero.
  for r in
    select uc.user_id, count(*) as marchitos
      from ac_user_concepto uc
      join profiles p on p.id = uc.user_id
     where uc.mastery_ema >= 0.85
       and uc.mastery_ema * ac_retrievability(uc.last_seen, uc.half_life) < 0.6
       and coalesce((p.notification_prefs->>'academia')::boolean, true)
       and not exists (
         select 1 from notifications n
          where n.user_id = uc.user_id
            and n.created_at > now() - interval '20 hours'
            and n.type in ('academia_riego', 'streak_risk', 'streak_lost'))
     group by uc.user_id
     having count(*) >= 3
     limit 500
  loop
    insert into notifications (user_id, type, title_es, body_es)
    values (r.user_id, 'academia_riego',
            'Tu bosque necesita un riego',
            format('Hay %s conceptos apagándose. Un repaso corto y vuelven.', r.marchitos));
    v_avisos := v_avisos + 1;
  end loop;

  return jsonb_build_object(
    'ok', true,
    'retirados', v_criba->'retirados',
    'pools_flacos', jsonb_array_length(v_hambre),
    'avisos_riego', v_avisos);
end $fn$;

-- ── 10 · Permisos ───────────────────────────────────────────────────────────
--
-- Nada de esto lo llama el cliente. Son funciones de servidor: las invoca
-- `daily_maintenance()` (definer) o la edge function con la clave de servicio.

revoke all on function ac_presupuesto_mes()                                   from public, anon, authenticated;
revoke all on function academia_presupuesto_estado()                          from public, anon, authenticated;
revoke all on function academia_presupuesto_gastar(numeric)                   from public, anon, authenticated;
revoke all on function academia_pool_hambriento(int)                          from public, anon, authenticated;
revoke all on function academia_gen_contexto(uuid, ac_tipo_ejercicio)         from public, anon, authenticated;
revoke all on function academia_grounding(jsonb)                              from public, anon, authenticated;
revoke all on function academia_dedupe(uuid, ac_tipo_ejercicio, extensions.vector) from public, anon, authenticated;
revoke all on function academia_dificultad_familia(uuid)                      from public, anon, authenticated;
revoke all on function academia_dificultad_encogida(uuid)                     from public, anon, authenticated;
revoke all on function academia_cribado_psicometrico(boolean)                 from public, anon, authenticated;
revoke all on function academia_ingerir_item(uuid, uuid, bigint, jsonb, jsonb, jsonb, text[], real, jsonb, extensions.vector) from public, anon, authenticated;
revoke all on function academia_validar_propuesta(text, int, jsonb)           from public, anon, authenticated;
revoke all on function academia_expansion_necesaria(uuid, int)                from public, anon, authenticated;
revoke all on function academia_guardar_propuesta(text, int, jsonb, text, text, uuid) from public, anon, authenticated;
revoke all on function academia_aplicar_propuesta(uuid)                       from public, anon, authenticated;
revoke all on function academia_mantenimiento_diario()                        from public, anon, authenticated;
