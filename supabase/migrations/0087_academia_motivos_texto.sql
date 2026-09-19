-- ─────────────────────────────────────────────────────────────────────────────
-- 0087 · `text[] || 'literal'` no agrega un elemento.
--
-- ENCONTRADO EJERCITANDO LA CADENA DE COMPUERTAS CONTRA LA BASE VIVA:
--
--     ERROR: malformed array literal: "kid"
--     QUERY: v_motivos := v_motivos || 'kid'
--
-- Con `v_motivos text[]`, un literal sin tipo a la derecha del `||` NO se
-- interpreta como elemento: Postgres intenta leerlo como un array literal y
-- revienta. Funciona cuando la derecha es una expresión de tipo conocido —por
-- eso `v_probs || format(...)` en `academia_validar_propuesta` anda bien— y
-- falla justo con las constantes.
--
-- Estaba en las dos funciones que arman listas de motivos con constantes:
-- el ruteo a revisión humana (que es la regla de seguridad más importante de
-- la fase 3: era imposible marcar un ítem como `kid` o `sensible`) y el
-- cribado psicométrico (latente: hoy no hay ítems con 50 entregas, así que
-- todavía no se había ejecutado nunca).
--
-- Forward-only. Solo cambian los `::text`.
-- ─────────────────────────────────────────────────────────────────────────────

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
) returns jsonb language plpgsql volatile security definer set search_path = public, extensions as $fn$
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

  if not v_juez_ok                                   then v_motivos := v_motivos || 'juez'::text; end if;
  if v_sensible                                      then v_motivos := v_motivos || 'sensible'::text; end if;
  if coalesce(p_age_groups, '{}') @> array['kid']    then v_motivos := v_motivos || 'kid'::text; end if;
  if random() < 0.05                                 then v_motivos := v_motivos || 'auditoria'::text; end if;

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
      if v_it.p_correct < 0.15 then v_m := v_m || 'demasiado_dificil'::text; end if;
      if v_it.p_correct > 0.95 then v_m := v_m || 'demasiado_facil'::text; end if;
      if v_it.disc is not null and v_it.disc < 0.10 then v_m := v_m || 'no_discrimina'::text; end if;
      if v_it.lat_fam is not null and v_it.lat_fam > 0
         and (v_it.lat_mediana > v_it.lat_fam * 3 or v_it.lat_mediana < v_it.lat_fam / 3) then
        v_m := v_m || 'latencia_atipica'::text;
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

revoke all on function academia_ingerir_item(uuid, uuid, bigint, jsonb, jsonb, jsonb, text[], real, jsonb, extensions.vector) from public, anon, authenticated;
revoke all on function academia_cribado_psicometrico(boolean) from public, anon, authenticated;
