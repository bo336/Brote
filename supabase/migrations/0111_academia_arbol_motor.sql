-- Brote — 0111 — La Academia, el Árbol: el motor.
--
-- Qué hay acá, en el orden en que lo usa una persona:
--
--   academia_mapa()          el árbol entero en UNA llamada
--   academia_unidad(slug)    una unidad por dentro: sus sesiones y qué repasa
--   academia_empezar(id)     arma una sesión y cobra la savia si corresponde
--   academia_repasar()       una sesión de repaso libre, siempre gratis
--   academia_responder(...)  corrige UN paso, de un solo uso
--   academia_retomar(id)     relee una sesión en curso (F5, pestaña cerrada)
--   academia_terminar(id)    puntaje, progreso, XP, semillas, racha, gancho
--   academia_salir(id)       abandonar, con reembolso si no se empezó
--
-- LAS REGLAS DE DESBLOQUEO, en un solo lugar (`ac_estado_unidades`):
--   · Tronco: la unidad n abre cuando la n−1 está completa.
--   · Rama: la unidad abre cuando la anterior de la misma rama está completa
--     Y la unidad del tronco que pide (`requiere_tronco`) también.
--   · Sesión: la primera de una unidad abierta está disponible; cada una
--     abre la siguiente. Rehacer una sesión hecha siempre se puede.
--   · Una unidad se completa cuando TODAS sus sesiones están hechas: el
--     desafío final es la última, así que en la práctica es "aprobar el
--     desafío". Completarla es lo que hace crecer la rama.
--
-- EL REPASO ESPACIADO vive en el compositor: cada sesión intercala pasos de
-- sesiones y unidades anteriores, elegidos por fuerza de memoria
-- (mastery × retrievability, lo más olvidado primero), con prioridad para las
-- unidades que el currículum marca en `repasa` y para la misma rama.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1 · Estado de las unidades para una persona. La única fuente de verdad de
--     "qué está abierto". La usan el mapa, la unidad, empezar y terminar.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function ac_estado_unidades(p_uid uuid, p_acc text)
returns table (
  unidad_id uuid, rama_slug text, orden smallint, abierta boolean, completa boolean,
  hechas int, total int, fuerza real, estado text, falta text
)
language sql stable security definer set search_path = public as $fn$
  with u as (
    select u.id, u.rama_slug, u.orden, u.titulo_es, u.requiere_tronco,
           exists (select 1 from ac_user_unidad x where x.user_id = p_uid and x.unidad_id = u.id) as completa
    from ac_unidades u
    where u.status = 'aprobado' and u.age_groups @> array[p_acc]
  ),
  lec as (
    select l.unidad_id, count(*)::int as total,
           count(*) filter (where ul.completada_at is not null)::int as hechas
    from ac_lecciones l
    left join ac_user_leccion ul on ul.leccion_id = l.id and ul.user_id = p_uid
    where l.status = 'aprobado'
    group by l.unidad_id
  ),
  tronco as (
    select orden, titulo_es, completa from u where rama_slug = 'tronco'
  ),
  mem as (
    select l.unidad_id,
           avg(m.mastery * ac_retrievability(m.last_seen, m.half_life))::real as fuerza
    from ac_user_memoria m
    join (select distinct grupo, leccion_id from ac_pasos where status = 'aprobado'
            and tipo not in ('teoria','ejemplo')) p on p.grupo = m.grupo
    join ac_lecciones l on l.id = p.leccion_id
    where m.user_id = p_uid
    group by l.unidad_id
  ),
  seq as (
    select u.*,
           lag(u.completa) over (partition by u.rama_slug order by u.orden) as prev_completa,
           lag(u.titulo_es) over (partition by u.rama_slug order by u.orden) as prev_titulo
    from u
  ),
  calc as (
    select s.id, s.rama_slug, s.orden, s.completa,
           coalesce(lec.hechas, 0) as hechas, coalesce(lec.total, 0) as total,
           mem.fuerza,
           case
             when s.rama_slug = 'tronco' then coalesce(s.prev_completa, true)
             else coalesce(s.prev_completa, true)
                  and (s.requiere_tronco <= 0
                       or coalesce((select t.completa from tronco t where t.orden = s.requiere_tronco), true))
           end as abierta,
           case
             when s.prev_completa is false then 'unidad:' || s.prev_titulo
             when s.rama_slug <> 'tronco' and s.requiere_tronco > 0
                  and (select t.completa from tronco t where t.orden = s.requiere_tronco) is false
               then 'tronco:' || (select t.titulo_es from tronco t where t.orden = s.requiere_tronco)
           end as falta
    from seq s
    left join lec on lec.unidad_id = s.id
    left join mem on mem.unidad_id = s.id
  )
  select c.id, c.rama_slug, c.orden, (c.abierta or c.completa), c.completa, c.hechas, c.total,
         c.fuerza,
         case
           -- Lo que se sabía y se está secando. Solo pasa en unidades
           -- completas: es el aviso de "regalo", no un castigo.
           when c.completa and coalesce(c.fuerza, 1) < 0.5 then 'repasar'
           when c.completa then 'completa'
           when c.abierta and c.hechas > 0 then 'en_curso'
           when c.abierta then 'disponible'
           else 'bloqueada'
         end,
         case when c.abierta or c.completa then null else c.falta end
  from calc c;
$fn$;

-- Las sesiones de una unidad con su estado. Una sesión está disponible si la
-- unidad está abierta y la anterior está hecha (o si ya se hizo: rehacer
-- siempre se puede).
create or replace function ac_estado_lecciones(p_uid uuid, p_unidad uuid, p_abierta boolean)
returns table (leccion_id uuid, orden smallint, estado text, mejor_score smallint, intentos smallint)
language sql stable security definer set search_path = public as $fn$
  with l as (
    select l.id, l.orden, ul.completada_at is not null as hecha,
           coalesce(ul.mejor_score, 0)::smallint as mejor_score,
           coalesce(ul.intentos, 0)::smallint as intentos
    from ac_lecciones l
    left join ac_user_leccion ul on ul.leccion_id = l.id and ul.user_id = p_uid
    where l.unidad_id = p_unidad and l.status = 'aprobado'
  ), s as (
    select l.*, lag(l.hecha) over (order by l.orden) as prev_hecha from l
  )
  select s.id, s.orden,
         case
           when s.hecha then 'completa'
           when p_abierta and coalesce(s.prev_hecha, true) then 'disponible'
           else 'bloqueada'
         end,
         s.mejor_score, s.intentos
  from s;
$fn$;

-- Una foto de `ac_estado_unidades` guardada en una variable jsonb y releída
-- como tabla. Evita una tabla temporal por llamada: en un RPC que se abre en
-- cada visita al árbol, crear y tirar tablas temporales ensucia el catálogo.
create or replace function ac_eu(p jsonb)
returns table (
  unidad_id uuid, rama_slug text, orden smallint, abierta boolean, completa boolean,
  hechas int, total int, fuerza real, estado text, falta text
)
language sql immutable security definer set search_path = public as $fn$
  select * from jsonb_to_recordset(coalesce(p, '[]'::jsonb)) as x(
    unidad_id uuid, rama_slug text, orden smallint, abierta boolean, completa boolean,
    hechas int, total int, fuerza real, estado text, falta text);
$fn$;

revoke all on function ac_estado_unidades(uuid, text) from public, anon, authenticated;
revoke all on function ac_eu(jsonb) from public, anon, authenticated;
revoke all on function ac_estado_lecciones(uuid, uuid, boolean) from public, anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2 · academia_mapa() — TODO el árbol en una sola llamada.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function academia_mapa()
returns jsonb language plpgsql volatile security definer set search_path = public as $fn$
declare
  v_uid uuid := auth.uid(); v_acc text; v_estado jsonb; v_ramas jsonb; v_eu jsonb;
  v_sig jsonb; v_motivo text; v_unidad uuid; v_leccion record; v_intereses text[];
  v_repaso int; v_stats jsonb;
begin
  if v_uid is null then raise exception 'No autenticado' using errcode = 'P0001'; end if;
  if not ac_setting_bool('academia_enabled', true) then
    return jsonb_build_object('ok', false, 'error', 'pausa',
      'mensaje', 'La Academia está en pausa por un momento.');
  end if;

  select coalesce(account_type::text, 'adult'), coalesce(interests, '{}')
    into v_acc, v_intereses from profiles where id = v_uid;
  v_estado := academia_estado();

  select coalesce(jsonb_agg(to_jsonb(e)), '[]'::jsonb) into v_eu
    from ac_estado_unidades(v_uid, v_acc) e;

  select coalesce(jsonb_agg(jsonb_build_object(
           'slug', r.slug, 'nombre_es', r.nombre_es, 'bajada_es', r.bajada_es,
           'es_tronco', r.es_tronco, 'sort_order', r.sort_order,
           'unidades', coalesce((
             select jsonb_agg(jsonb_build_object(
                      'id', u.id, 'slug', u.slug, 'orden', u.orden, 'nivel', u.nivel,
                      'titulo_es', u.titulo_es, 'bajada_es', u.bajada_es,
                      'estado', e.estado, 'falta', e.falta,
                      'hechas', e.hechas, 'total', e.total,
                      'fuerza', round(coalesce(e.fuerza, 0)::numeric, 3),
                      'lecciones', coalesce((
                        select jsonb_agg(jsonb_build_object(
                                 'id', el.leccion_id, 'orden', el.orden,
                                 'tipo', l.tipo, 'estado', el.estado,
                                 'titulo_es', l.titulo_es, 'minutos', l.minutos,
                                 'mejor_score', el.mejor_score)
                               order by el.orden)
                        from ac_estado_lecciones(v_uid, u.id, e.abierta) el
                        join ac_lecciones l on l.id = el.leccion_id), '[]'::jsonb))
                    order by u.orden)
             from ac_unidades u join ac_eu(v_eu) e on e.unidad_id = u.id
             where u.rama_slug = r.slug), '[]'::jsonb))
         order by r.sort_order), '[]'::jsonb)
    into v_ramas
  from ac_ramas r
  where exists (select 1 from ac_eu(v_eu) e where e.rama_slug = r.slug);

  -- ── La próxima sesión que conviene hacer, y por qué.
  -- 1) Seguir la última unidad que se tocó, si sigue a medias.
  select l.unidad_id into v_unidad
    from ac_intentos i join ac_lecciones l on l.id = i.leccion_id
    join ac_eu(v_eu) e on e.unidad_id = l.unidad_id and e.estado in ('en_curso','disponible')
   where i.user_id = v_uid
   order by i.started_at desc limit 1;
  if v_unidad is not null then v_motivo := 'continuar'; end if;

  -- 2) El tronco antes que nada: es la base de todo lo demás.
  if v_unidad is null then
    select e.unidad_id into v_unidad from ac_eu(v_eu) e
     where e.rama_slug = 'tronco' and e.estado in ('en_curso','disponible')
     order by e.orden limit 1;
    if v_unidad is not null then v_motivo := 'tronco'; end if;
  end if;

  -- 3) Una rama que le interesa, y si no, la primera abierta.
  if v_unidad is null then
    select e.unidad_id into v_unidad from ac_eu(v_eu) e
      join ac_ramas r on r.slug = e.rama_slug
     where e.estado in ('en_curso','disponible')
     order by (e.rama_slug = any(v_intereses)) desc, (e.estado = 'en_curso') desc,
              e.orden, r.sort_order
     limit 1;
    if v_unidad is not null then
      v_motivo := case when exists (select 1 from ac_unidades u where u.id = v_unidad
                                      and u.rama_slug = any(v_intereses))
                       then 'interes' else 'siguiente' end;
    end if;
  end if;

  if v_unidad is not null then
    select l.id, l.slug, l.titulo_es, l.bajada_es, l.orden, l.tipo, l.minutos into v_leccion
      from ac_estado_lecciones(v_uid, v_unidad, true) el
      join ac_lecciones l on l.id = el.leccion_id
     where el.estado = 'disponible'
     order by el.orden limit 1;
    if found then
      select jsonb_build_object(
               'motivo', v_motivo,
               'unidad', jsonb_build_object('id', u.id, 'slug', u.slug, 'titulo_es', u.titulo_es,
                                            'rama_slug', u.rama_slug, 'orden', u.orden),
               'leccion', jsonb_build_object('id', v_leccion.id, 'slug', v_leccion.slug,
                                             'titulo_es', v_leccion.titulo_es,
                                             'bajada_es', v_leccion.bajada_es,
                                             'orden', v_leccion.orden, 'tipo', v_leccion.tipo,
                                             'minutos', v_leccion.minutos))
        into v_sig
        from ac_unidades u where u.id = v_unidad;
    end if;
  end if;

  -- ── Cuánto hay para repasar: grupos que se están olvidando.
  select count(*) into v_repaso
    from ac_user_memoria m
   where m.user_id = v_uid and m.last_seen < now() - interval '12 hours'
     and ac_retrievability(m.last_seen, m.half_life) < 0.85
     and exists (select 1 from ac_pasos p where p.grupo = m.grupo and p.status = 'aprobado'
                   and p.repasable and p.age_groups @> array[v_acc]);

  select jsonb_build_object(
           'unidades_completas', count(*) filter (where e.completa),
           'unidades_total', count(*),
           'lecciones_completas', coalesce(sum(e.hechas), 0),
           'lecciones_total', coalesce(sum(e.total), 0),
           'para_repasar', v_repaso,
           'ramas_abiertas', count(distinct e.rama_slug) filter (where e.abierta and e.rama_slug <> 'tronco'))
    into v_stats from ac_eu(v_eu) e;

  return jsonb_build_object(
    'ok', true,
    'ramas', v_ramas,
    'siguiente', v_sig,
    'repaso', v_repaso,
    'stats', v_stats,
    'pro', v_estado -> 'pro',
    'savia', v_estado -> 'savia',
    'racha', v_estado -> 'racha',
    'semillas_hoy', v_estado -> 'semillas_hoy',
    'semillas_tope', v_estado -> 'semillas_tope',
    'semillas_saldo', v_estado -> 'semillas_saldo');
end $fn$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3 · academia_unidad(slug) — una unidad por dentro.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function academia_unidad(p_slug text)
returns jsonb language plpgsql volatile security definer set search_path = public as $fn$
declare
  v_uid uuid := auth.uid(); v_acc text; v_u ac_unidades%rowtype; v_e record;
  v_lecciones jsonb; v_repasa jsonb; v_siguiente jsonb; v_rama jsonb;
begin
  if v_uid is null then raise exception 'No autenticado' using errcode = 'P0001'; end if;
  select coalesce(account_type::text, 'adult') into v_acc from profiles where id = v_uid;

  select * into v_u from ac_unidades
   where slug = p_slug and status = 'aprobado' and age_groups @> array[v_acc];
  if not found then
    return jsonb_build_object('ok', false, 'error', 'no_encontrada',
      'mensaje', 'Esa unidad no existe o no está disponible para tu cuenta.');
  end if;

  select * into v_e from ac_estado_unidades(v_uid, v_acc) e where e.unidad_id = v_u.id;

  select coalesce(jsonb_agg(jsonb_build_object(
           'id', l.id, 'slug', l.slug, 'orden', l.orden, 'tipo', l.tipo,
           'titulo_es', l.titulo_es, 'bajada_es', l.bajada_es, 'minutos', l.minutos,
           'estado', el.estado, 'mejor_score', el.mejor_score, 'intentos', el.intentos,
           'pasos', (select count(distinct p.orden) from ac_pasos p
                      where p.leccion_id = l.id and p.status = 'aprobado'
                        and p.tipo not in ('teoria','ejemplo')))
         order by l.orden), '[]'::jsonb)
    into v_lecciones
  from ac_estado_lecciones(v_uid, v_u.id, v_e.abierta) el
  join ac_lecciones l on l.id = el.leccion_id;

  select coalesce(jsonb_agg(jsonb_build_object('slug', u.slug, 'titulo_es', u.titulo_es,
                                               'rama_slug', u.rama_slug) order by u.rama_slug, u.orden),
                  '[]'::jsonb)
    into v_repasa
  from ac_unidades u where u.slug = any(v_u.repasa) and u.status = 'aprobado';

  select jsonb_build_object('slug', u.slug, 'titulo_es', u.titulo_es)
    into v_siguiente
  from ac_unidades u
  where u.rama_slug = v_u.rama_slug and u.orden > v_u.orden and u.status = 'aprobado'
    and u.age_groups @> array[v_acc]
  order by u.orden limit 1;

  select jsonb_build_object('slug', r.slug, 'nombre_es', r.nombre_es, 'es_tronco', r.es_tronco,
                            'unidades', (select count(*) from ac_unidades x
                                          where x.rama_slug = r.slug and x.status = 'aprobado'
                                            and x.age_groups @> array[v_acc]))
    into v_rama from ac_ramas r where r.slug = v_u.rama_slug;

  return jsonb_build_object(
    'ok', true,
    'unidad', jsonb_build_object(
      'id', v_u.id, 'slug', v_u.slug, 'orden', v_u.orden, 'nivel', v_u.nivel,
      'titulo_es', v_u.titulo_es, 'bajada_es', v_u.bajada_es,
      'objetivos_es', to_jsonb(v_u.objetivos_es),
      'estado', v_e.estado, 'falta', v_e.falta, 'hechas', v_e.hechas, 'total', v_e.total,
      'fuerza', round(coalesce(v_e.fuerza, 0)::numeric, 3)),
    'rama', v_rama,
    'lecciones', v_lecciones,
    'repasa', v_repasa,
    'siguiente', v_siguiente,
    'estado', academia_estado());
end $fn$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4 · Lo que ve el cliente de un paso servido. Un solo lugar, usado al empezar
--     y al retomar, así las dos vistas no pueden divergir.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function ac_paso_cliente(p_ip ac_intento_pasos, p_con_correccion boolean)
returns jsonb language plpgsql volatile security definer set search_path = public as $fn$
declare v_p ac_pasos%rowtype; v_bar jsonb; v_rep jsonb; v_corr jsonb;
begin
  select * into v_p from ac_pasos where id = p_ip.paso_id;
  v_bar := ac_barajar_paso(v_p.payload_publico, v_p.tipo, p_ip.perm);

  if p_ip.repaso then
    -- Un paso de repaso dice de dónde viene: volver a ver algo de la unidad 2
    -- sin saber que es de la unidad 2 no ayuda a ubicarlo en la memoria.
    select jsonb_build_object('unidad', u.titulo_es, 'rama_slug', u.rama_slug)
      into v_rep
      from ac_lecciones l join ac_unidades u on u.id = l.unidad_id
     where l.id = v_p.leccion_id;
  end if;

  if p_con_correccion and p_ip.answered_at is not null and p_ip.graduable then
    v_corr := ac_corregir(v_p.tipo, v_p.payload_publico, v_p.solucion, p_ip.perm, p_ip.elegido)
              || jsonb_build_object('explicacion', v_p.solucion ->> 'explicacion',
                                    'reencolada', false, 'recuperacion', false);
  end if;

  return jsonb_build_object(
    'orden', p_ip.orden,
    'entrega_id', p_ip.id,
    'tipo', v_p.tipo,
    'graduable', p_ip.graduable,
    'dificultad', v_p.dificultad,
    'repaso', v_rep,
    'requeue', p_ip.requeue,
    'payload', v_bar -> 'payload',
    'respondido', p_ip.answered_at is not null,
    'correccion', v_corr);
end $fn$;

revoke all on function ac_paso_cliente(ac_intento_pasos, boolean) from public, anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5 · El compositor.
--
-- Una sesión = los pasos escritos de la lección (una variante por posición)
--            + relleno adaptativo (práctica y desafío)
--            + repaso espaciado intercalado en la segunda mitad.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function ac_componer(p_uid uuid, p_acc text, p_intento uuid,
                                       p_leccion ac_lecciones, p_tipo text)
returns int language plpgsql volatile security definer set search_path = public as $fn$
declare
  v_autor uuid[] := '{}'; v_autor_grad boolean[] := '{}'; v_din uuid[] := '{}';
  v_rep uuid[] := '{}'; v_grupos text[] := '{}';
  v_unidad ac_unidades%rowtype; v_nrep int; v_meta int := 0;
  v_final uuid[] := '{}'; v_final_rep boolean[] := '{}'; v_final_grad boolean[] := '{}';
  v_n_grad int; v_marcas int[]; v_ri int := 1; v_g int := 0; i int; v_bar jsonb;
  r record;
begin
  if p_leccion.id is not null then
    select * into v_unidad from ac_unidades where id = p_leccion.unidad_id;

    -- Los pasos escritos, una variante al azar por posición.
    for r in
      select distinct on (p.orden) p.id, p.grupo, p.tipo
        from ac_pasos p
       where p.leccion_id = p_leccion.id and p.status = 'aprobado' and p.age_groups @> array[p_acc]
       order by p.orden, random()
    loop
      v_autor := v_autor || r.id;
      v_autor_grad := v_autor_grad || (r.tipo not in ('teoria','ejemplo'));
      v_grupos := v_grupos || r.grupo;
    end loop;
  end if;

  -- Relleno adaptativo: la práctica mezcla toda la unidad; el desafío suma
  -- los más difíciles. Primero lo que salió mal la última vez, después lo más
  -- débil, y al azar entre iguales para no servir siempre lo mismo.
  if p_tipo in ('practica','desafio') then
    v_meta := case when p_tipo = 'practica' then 12 else 6 end;
    select coalesce(array_agg(x.id order by x.dificultad, x.rnd), '{}') into v_din from (
      select g.id, g.dificultad, g.rnd from (
        select distinct on (p.grupo) p.id, p.grupo, p.dificultad,
               coalesce(m.mastery, 0) as mas, m.ultimo_correcto, random() as rnd
          from ac_pasos p
          join ac_lecciones l on l.id = p.leccion_id and l.unidad_id = p_leccion.unidad_id
                              and l.tipo = 'leccion' and l.status = 'aprobado'
          left join ac_user_memoria m on m.user_id = p_uid and m.grupo = p.grupo
         where p.status = 'aprobado' and p.age_groups @> array[p_acc]
           and p.tipo not in ('teoria','ejemplo')
           and not (p.grupo = any(v_grupos))
         order by p.grupo, random()
      ) g
      order by (case when p_tipo = 'desafio' and g.dificultad >= 3 then 0 else 1 end),
               (case when g.ultimo_correcto is false then 0 else 1 end),
               g.mas, g.rnd
      limit v_meta
    ) x;
    select v_grupos || coalesce(array_agg(p.grupo), '{}') into v_grupos
      from ac_pasos p where p.id = any(v_din);
  end if;

  -- Repaso espaciado. Nada visto en las últimas 12 horas: repasar lo que se
  -- acaba de aprender no es repasar, es repetir.
  v_nrep := case p_tipo when 'leccion' then 3 when 'practica' then 2
                        when 'desafio' then 3 else 12 end;
  select coalesce(array_agg(c.id order by c.prioridad), '{}') into v_rep from (
    select z.id,
           z.fuerza
             - (case when v_unidad.id is not null and z.u_slug = any(v_unidad.repasa) then 0.35 else 0 end)
             - (case when v_unidad.id is not null and z.rama_slug = v_unidad.rama_slug then 0.15 else 0 end)
             - (case when z.ultimo_correcto is false then 0.2 else 0 end)
             + random() * 0.2 as prioridad
    from (
      select distinct on (p.grupo) p.id, p.grupo, u.slug as u_slug, u.rama_slug,
             m.mastery * ac_retrievability(m.last_seen, m.half_life) as fuerza, m.ultimo_correcto
        from ac_user_memoria m
        join ac_pasos p on p.grupo = m.grupo and p.status = 'aprobado' and p.repasable
                       and p.tipo not in ('teoria','ejemplo') and p.age_groups @> array[p_acc]
        join ac_lecciones l on l.id = p.leccion_id and l.status = 'aprobado'
        join ac_unidades u on u.id = l.unidad_id and u.status = 'aprobado'
                          and u.age_groups @> array[p_acc]
       where m.user_id = p_uid and m.last_seen < now() - interval '12 hours'
         and (p_leccion.id is null or l.id <> p_leccion.id)
         and not (p.grupo = any(v_grupos))
       order by p.grupo, random()
    ) z
    order by 2
    limit v_nrep
  ) c;

  -- ── El orden final.
  if p_tipo = 'repaso' then
    -- Intercalado entre ramas: un repaso es justamente una prueba diferida, y
    -- alternar temas es lo que mejor la aprovecha.
    select coalesce(array_agg(y.id order by y.k, y.rama_slug), '{}') into v_final from (
      select p.id, u.rama_slug,
             row_number() over (partition by u.rama_slug order by random()) as k
        from ac_pasos p join ac_lecciones l on l.id = p.leccion_id
        join ac_unidades u on u.id = l.unidad_id
       where p.id = any(v_rep)
    ) y;
    for i in 1..coalesce(array_length(v_final, 1), 0) loop
      v_final_rep := v_final_rep || true;
      v_final_grad := v_final_grad || true;
    end loop;
  else
    -- Escritos + relleno, y los repasos repartidos en la segunda mitad: al
    -- 45 %, 70 % y 90 % de los pasos que se corrigen. Nunca al principio (la
    -- sesión arranca enseñando) y nunca dos seguidos.
    v_autor := v_autor || v_din;
    for i in 1..coalesce(array_length(v_din, 1), 0) loop
      v_autor_grad := v_autor_grad || true;
    end loop;
    select count(*) into v_n_grad from unnest(v_autor_grad) x where x;
    v_marcas := array[greatest(2, round(v_n_grad * 0.45)::int),
                      greatest(3, round(v_n_grad * 0.70)::int),
                      greatest(4, round(v_n_grad * 0.90)::int)];

    for i in 1..coalesce(array_length(v_autor, 1), 0) loop
      v_final := v_final || v_autor[i];
      v_final_rep := v_final_rep || false;
      v_final_grad := v_final_grad || v_autor_grad[i];
      if v_autor_grad[i] then
        v_g := v_g + 1;
        while v_ri <= coalesce(array_length(v_rep, 1), 0)
              and v_ri <= 3 and v_g >= v_marcas[v_ri] and v_g < v_n_grad loop
          v_final := v_final || v_rep[v_ri];
          v_final_rep := v_final_rep || true;
          v_final_grad := v_final_grad || true;
          v_ri := v_ri + 1;
          exit;   -- uno por posición: nunca dos repasos seguidos
        end loop;
      end if;
    end loop;
  end if;

  -- ── Las entregas. Una fila por paso, con su permutación propia.
  for i in 1..coalesce(array_length(v_final, 1), 0) loop
    select ac_barajar_paso(p.payload_publico, p.tipo, null) into v_bar
      from ac_pasos p where p.id = v_final[i];
    insert into ac_intento_pasos (intento_id, orden, paso_id, graduable, perm, repaso)
    values (p_intento, i, v_final[i], v_final_grad[i],
            coalesce((select array_agg(e::smallint) from jsonb_array_elements_text(v_bar -> 'perm') e),
                     '{}'::smallint[]),
            v_final_rep[i]);
  end loop;

  return coalesce(array_length(v_final, 1), 0);
end $fn$;

revoke all on function ac_componer(uuid, text, uuid, ac_lecciones, text) from public, anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6 · academia_empezar / academia_repasar
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function ac_sesion_cliente(p_intento uuid)
returns jsonb language plpgsql volatile security definer set search_path = public as $fn$
declare v_i ac_intentos%rowtype; v_l ac_lecciones%rowtype; v_u ac_unidades%rowtype; v_pasos jsonb;
begin
  select * into v_i from ac_intentos where id = p_intento;
  if v_i.leccion_id is not null then
    select * into v_l from ac_lecciones where id = v_i.leccion_id;
    select * into v_u from ac_unidades where id = v_l.unidad_id;
  end if;

  select coalesce(jsonb_agg(ac_paso_cliente(ip, true) order by ip.orden), '[]'::jsonb)
    into v_pasos from ac_intento_pasos ip where ip.intento_id = p_intento;

  return jsonb_build_object(
    'ok', true,
    'intento_id', v_i.id,
    'tipo', v_i.tipo,
    'leccion', case when v_l.id is not null then jsonb_build_object(
      'id', v_l.id, 'slug', v_l.slug, 'titulo_es', v_l.titulo_es, 'bajada_es', v_l.bajada_es,
      'orden', v_l.orden, 'tipo', v_l.tipo) end,
    'unidad', case when v_u.id is not null then jsonb_build_object(
      'id', v_u.id, 'slug', v_u.slug, 'titulo_es', v_u.titulo_es, 'rama_slug', v_u.rama_slug,
      'orden', v_u.orden) end,
    'rama_slug', coalesce(v_u.rama_slug, 'tronco'),
    'pasos', v_pasos,
    'savia_gastada', v_i.savia_gastada,
    'expires_at', v_i.expires_at,
    'terminado', v_i.finished_at is not null);
end $fn$;

revoke all on function ac_sesion_cliente(uuid) from public, anon, authenticated;

create or replace function academia_empezar(p_leccion_id uuid)
returns jsonb language plpgsql volatile security definer set search_path = public as $fn$
declare
  v_uid uuid := auth.uid(); v_acc text; v_pro boolean; v_l ac_lecciones%rowtype;
  v_e record; v_estado text; v_hecha boolean; v_savia int := 0; v_libre int;
  v_dia date; v_n int; v_intento uuid; v_graduables int;
begin
  if v_uid is null then raise exception 'No autenticado' using errcode = 'P0001'; end if;
  if not ac_setting_bool('academia_enabled', true) then
    return jsonb_build_object('ok', false, 'error', 'pausa',
      'mensaje', 'La Academia está en pausa por un momento.');
  end if;
  select coalesce(account_type::text, 'adult') into v_acc from profiles where id = v_uid;

  select * into v_l from ac_lecciones where id = p_leccion_id and status = 'aprobado';
  if not found then
    return jsonb_build_object('ok', false, 'error', 'no_encontrada',
      'mensaje', 'Esa sesión no existe.');
  end if;

  select * into v_e from ac_estado_unidades(v_uid, v_acc) e where e.unidad_id = v_l.unidad_id;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'no_disponible',
      'mensaje', 'Esa unidad no está disponible para tu cuenta.');
  end if;
  select el.estado into v_estado
    from ac_estado_lecciones(v_uid, v_l.unidad_id, v_e.abierta) el where el.leccion_id = v_l.id;
  if v_estado is null or v_estado = 'bloqueada' then
    return jsonb_build_object('ok', false, 'error', 'bloqueada',
      'mensaje', 'Esta sesión se abre cuando termines la anterior.');
  end if;
  v_hecha := v_estado = 'completa';

  -- ── Savia: se cobra al EMPEZAR territorio nuevo. Rehacer una sesión hecha,
  -- practicar y repasar no cuestan nada: el limitador frena el avance, nunca
  -- la memoria.
  v_pro := brote_is_pro(v_uid);
  if not v_hecha and not v_pro then
    v_libre := ac_setting_int('academia_savia_libre', 5);
    if v_libre <= 0 then
      return jsonb_build_object('ok', false, 'error', 'sin_savia',
        'mensaje', 'La Academia está en pausa por un momento.');
    end if;
    v_dia := ac_dia_local(v_uid);
    -- Una sola sentencia atómica: con dos pestañas abiertas, un chequeo y una
    -- suma separados duplicarían la cuota.
    insert into ac_uso_diario (user_id, dia_local, hojas)
    values (v_uid, v_dia, 1)
    on conflict (user_id, dia_local) do update
      set hojas = ac_uso_diario.hojas + 1
      where ac_uso_diario.hojas < (v_libre + ac_uso_diario.savia_extra)
    returning hojas into v_n;
    if v_n is null then
      return jsonb_build_object('ok', false, 'error', 'sin_savia',
        'mensaje', 'Se te terminó la savia de hoy. Vuelve a subir a la medianoche, y repasar sigue siendo gratis.');
    end if;
    v_savia := 1;
  end if;

  insert into ac_intentos (user_id, leccion_id, tipo, savia_gastada)
  values (v_uid, v_l.id, v_l.tipo, v_savia)
  returning id into v_intento;

  v_n := ac_componer(v_uid, v_acc, v_intento, v_l, v_l.tipo);
  select count(*) into v_graduables from ac_intento_pasos where intento_id = v_intento and graduable;

  if v_graduables = 0 then
    -- Nada para corregir: se devuelve la savia en el acto. Cobrar por una
    -- sesión vacía sería el peor error posible del limitador.
    delete from ac_intentos where id = v_intento;
    if v_savia > 0 then
      update ac_uso_diario set hojas = greatest(0, hojas - 1)
       where user_id = v_uid and dia_local = v_dia;
    end if;
    return jsonb_build_object('ok', false, 'error', 'sin_contenido',
      'mensaje', 'Esta sesión todavía no tiene ejercicios.');
  end if;

  update ac_intentos set pasos = v_n where id = v_intento;
  return ac_sesion_cliente(v_intento);
end $fn$;

create or replace function academia_repasar()
returns jsonb language plpgsql volatile security definer set search_path = public as $fn$
declare v_uid uuid := auth.uid(); v_acc text; v_intento uuid; v_n int; v_vacia ac_lecciones;
begin
  if v_uid is null then raise exception 'No autenticado' using errcode = 'P0001'; end if;
  if not ac_setting_bool('academia_enabled', true) then
    return jsonb_build_object('ok', false, 'error', 'pausa',
      'mensaje', 'La Academia está en pausa por un momento.');
  end if;
  select coalesce(account_type::text, 'adult') into v_acc from profiles where id = v_uid;

  insert into ac_intentos (user_id, leccion_id, tipo) values (v_uid, null, 'repaso')
  returning id into v_intento;
  v_n := ac_componer(v_uid, v_acc, v_intento, v_vacia, 'repaso');

  if v_n < 4 then
    delete from ac_intentos where id = v_intento;
    return jsonb_build_object('ok', false, 'error', 'sin_contenido',
      'mensaje', 'Todavía no hay nada para repasar. Volvé mañana, después de un par de sesiones.');
  end if;

  update ac_intentos set pasos = v_n where id = v_intento;
  return ac_sesion_cliente(v_intento);
end $fn$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7 · academia_responder — corrige UN paso, atómicamente y de un solo uso.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function academia_responder(p_entrega_id uuid, p_respuesta jsonb)
returns jsonb language plpgsql volatile security definer set search_path = public as $fn$
declare
  v_uid uuid := auth.uid(); v_ip ac_intento_pasos%rowtype; v_i ac_intentos%rowtype;
  v_p ac_pasos%rowtype; v_lat int; v_c jsonb; v_ok boolean; v_par real;
  v_requeue boolean := false; v_orden int; v_reencolados int; v_seguidas int;
  v_fuerza real;
begin
  if v_uid is null then raise exception 'No autenticado' using errcode = 'P0001'; end if;

  select * into v_ip from ac_intento_pasos where id = p_entrega_id;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'no_existe', 'mensaje', 'Ese paso no existe.');
  end if;
  select * into v_i from ac_intentos where id = v_ip.intento_id;
  if v_i.user_id <> v_uid then
    return jsonb_build_object('ok', false, 'error', 'ajena', 'mensaje', 'Esa sesión no es tuya.');
  end if;
  if v_i.finished_at is not null or v_i.abandonada_at is not null then
    return jsonb_build_object('ok', false, 'error', 'cerrada', 'mensaje', 'Esa sesión ya está cerrada.');
  end if;
  if now() > v_i.expires_at then
    return jsonb_build_object('ok', false, 'error', 'expirada',
      'mensaje', 'Esta sesión venció. Empezá una nueva cuando quieras.');
  end if;
  if not v_ip.graduable then
    return jsonb_build_object('ok', false, 'error', 'no_graduable',
      'mensaje', 'Ese paso no se corrige.');
  end if;

  -- clock_timestamp(), no now(): now() está congelado en la transacción.
  v_lat := greatest(0, (extract(epoch from (clock_timestamp() - v_ip.issued_at)) * 1000)::int);

  -- El candado: una respuesta por entrega. Sin esto, una opción múltiple de
  -- cuatro es un oráculo de cuatro intentos.
  update ac_intento_pasos
     set answered_at = now(), elegido = p_respuesta, latency_ms = v_lat
   where id = p_entrega_id and answered_at is null
  returning * into v_ip;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'ya_respondida',
      'mensaje', 'Ese paso ya lo respondiste.');
  end if;

  select * into v_p from ac_pasos where id = v_ip.paso_id;
  v_c := ac_corregir(v_p.tipo, v_p.payload_publico, v_p.solucion, v_ip.perm, p_respuesta);
  v_ok := coalesce((v_c ->> 'correcto')::boolean, false);
  v_par := coalesce((v_c ->> 'parcial')::real, 0);

  update ac_intento_pasos set correcto = v_ok, parcial = v_par where id = v_ip.id;

  -- La latencia mínima escala con el paso: para leer un caso de ocho líneas
  -- 600 ms es imposible, pero para un verdadero/falso corto no. Se marca y no
  -- se bloquea, y nunca se le dice nada a la persona.
  update ac_intentos
     set respondidas = respondidas + 1,
         correctas = correctas + case when v_ok then 1 else 0 end,
         banderas = banderas + case when v_lat < 600 then 1 else 0 end
   where id = v_i.id;

  -- ── Memoria del grupo: promedio móvil y vida media.
  insert into ac_user_memoria (user_id, grupo, mastery, half_life, vistas, aciertos, ultimo_correcto, last_seen)
  -- La primera observación fija la maestría (no arranca en cero): quien
  -- acierta algo la primera vez lo sabe AHORA. Lo que cae después es la
  -- retrievability, no la maestría. Arrancando en 0,4, una unidad recién
  -- aprobada aparecía como "para repasar" en el mismo instante (medido en QA).
  values (v_uid, v_p.grupo, v_par, case when v_ok then 2.0 else 0.6 end, 1,
          case when v_ok then 1 else 0 end, v_ok, now())
  on conflict (user_id, grupo) do update set
    mastery = ac_user_memoria.mastery + 0.4 * (v_par - ac_user_memoria.mastery),
    -- Acertar algo que ya se estaba olvidando estira mucho más la vida media
    -- que acertar algo fresco: es el efecto de espaciado, en una línea.
    half_life = greatest(0.25, least(365,
      case when v_ok
           then ac_user_memoria.half_life
                * (1.6 + 1.2 * (1 - ac_retrievability(ac_user_memoria.last_seen, ac_user_memoria.half_life)))
           else ac_user_memoria.half_life * 0.5 end)),
    vistas = ac_user_memoria.vistas + 1,
    aciertos = ac_user_memoria.aciertos + case when v_ok then 1 else 0 end,
    ultimo_correcto = v_ok,
    last_seen = now()
  returning mastery * ac_retrievability(last_seen, half_life) into v_fuerza;

  -- ── Re-encolar el error UNA vez, al final. Tope de seis por sesión: una
  -- lección larga con muchos errores no puede duplicar su largo.
  if not v_ok and not v_ip.requeue then
    select count(*) into v_reencolados from ac_intento_pasos
     where intento_id = v_i.id and requeue;
    if v_reencolados < 6 then
      select greatest(100, coalesce(max(orden), 99) + 1) into v_orden
        from ac_intento_pasos where intento_id = v_i.id and orden >= 100;
      insert into ac_intento_pasos (intento_id, orden, paso_id, graduable, perm, repaso, requeue)
      values (v_i.id, v_orden, v_ip.paso_id, true, v_ip.perm, v_ip.repaso, true);
      update ac_intentos set pasos = pasos + 1 where id = v_i.id;
      v_requeue := true;
    end if;
  end if;

  -- Tres seguidas mal: Pip aparece, una vez.
  select count(*) into v_seguidas from (
    select correcto from ac_intento_pasos
     where intento_id = v_i.id and answered_at is not null
     order by answered_at desc limit 3) x
   where correcto is false;

  return v_c || jsonb_build_object(
    'ok', true,
    'explicacion', v_p.solucion ->> 'explicacion',
    'fuerza', round(coalesce(v_fuerza, 0)::numeric, 3),
    'reencolada', v_requeue,
    'recuperacion', v_seguidas = 3);
end $fn$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 8 · academia_retomar — relee una sesión en curso sin empezar nada.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function academia_retomar(p_intento_id uuid)
returns jsonb language plpgsql volatile security definer set search_path = public as $fn$
declare v_uid uuid := auth.uid(); v_i ac_intentos%rowtype;
begin
  if v_uid is null then raise exception 'No autenticado' using errcode = 'P0001'; end if;
  select * into v_i from ac_intentos where id = p_intento_id;
  if not found or v_i.user_id <> v_uid then
    return jsonb_build_object('ok', false, 'error', 'ajena', 'mensaje', 'Esa sesión no es tuya.');
  end if;
  if v_i.abandonada_at is not null then
    return jsonb_build_object('ok', false, 'error', 'cerrada', 'mensaje', 'Esa sesión ya se cerró.');
  end if;
  if v_i.finished_at is null and now() > v_i.expires_at then
    return jsonb_build_object('ok', false, 'error', 'expirada',
      'mensaje', 'Esta sesión venció. Empezá una nueva cuando quieras.');
  end if;
  return ac_sesion_cliente(v_i.id);
end $fn$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 9 · academia_accion_rama — el gancho a una acción real, por rama.
--     Devuelve null antes que una acción mala. Nunca inventa una acción.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function ac_accion_para(p_uid uuid, p_rama text)
returns jsonb language plpgsql stable security definer set search_path = public as $fn$
declare v_acc text; v_xp bigint; v_tier int; v_rama text := p_rama; v_local date; v_a activities%rowtype;
begin
  select coalesce(account_type::text, 'adult'), total_xp into v_acc, v_xp from profiles where id = p_uid;
  v_tier := (brote_get_rank(coalesce(v_xp, 0)) ->> 'tier')::int;
  v_local := ac_dia_local(p_uid);

  -- El tronco no es un dominio: se cae al dominio donde la persona ya actúa.
  if v_rama is null or v_rama = 'tronco' then
    select domain_slug into v_rama from user_domain_points
     where user_id = p_uid order by points desc limit 1;
    if v_rama is null then
      select unnest(interests) into v_rama from profiles where id = p_uid limit 1;
    end if;
  end if;
  if v_rama is null then return null; end if;

  select * into v_a from activities a
   where a.active and a.domain_slug = v_rama and a.age_groups @> array[v_acc]
     and coalesce((select r.tier from ranks r where r.slug = a.min_rank_slug), 1) <= v_tier
     and not exists (
       select 1 from activity_completions ac
        where ac.user_id = p_uid and ac.activity_id = a.id
          and ac.status in ('honor','verified','pending')
          and ((a.frequency = 'one_time')
            or (a.type = 'daily' and ac.local_date = v_local)
            or (a.frequency = 'weekly' and ac.completed_at > now() - interval '168 hours')
            or (a.frequency = 'recurring' and ac.completed_at > now() -
                make_interval(hours => greatest(coalesce(a.repeat_cooldown_hours, 20), 1)))))
   order by random() limit 1;
  if not found then return null; end if;

  return jsonb_build_object(
    'id', v_a.id, 'slug', v_a.slug, 'titulo_es', v_a.title_es, 'short_es', v_a.short_es,
    'domain_slug', v_a.domain_slug, 'base_points', v_a.base_points, 'icon', v_a.icon,
    'impact_water_l', v_a.impact_water_l, 'impact_co2_kg', v_a.impact_co2_kg,
    'impact_waste_kg', v_a.impact_waste_kg, 'impact_energy_kwh', v_a.impact_energy_kwh,
    'equivalencia_es', v_a.impact_equivalency_es);
end $fn$;

revoke all on function ac_accion_para(uuid, text) from public, anon, authenticated;

create or replace function academia_gancho_intento(p_intento_id uuid, p_accion_id uuid, p_evento text)
returns jsonb language plpgsql volatile security definer set search_path = public as $fn$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'No autenticado' using errcode = 'P0001'; end if;
  if not exists (select 1 from ac_intentos where id = p_intento_id and user_id = v_uid) then
    return jsonb_build_object('ok', false, 'error', 'ajena');
  end if;
  if p_evento not in ('mostrado','tocado') then
    return jsonb_build_object('ok', false, 'error', 'evento_invalido');
  end if;
  insert into ac_intento_gancho (intento_id, accion_id) values (p_intento_id, p_accion_id)
  on conflict (intento_id) do nothing;
  if p_evento = 'tocado' then
    update ac_intento_gancho set tocado_at = coalesce(tocado_at, now()) where intento_id = p_intento_id;
  end if;
  return jsonb_build_object('ok', true);
end $fn$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 10 · academia_terminar — puntaje, progreso, XP, semillas, racha y gancho.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function academia_terminar(p_intento_id uuid)
returns jsonb language plpgsql volatile security definer set search_path = public as $fn$
declare
  v_uid uuid := auth.uid(); v_i ac_intentos%rowtype; v_l ac_lecciones%rowtype;
  v_u ac_unidades%rowtype; v_prof profiles%rowtype; v_acc text; v_pend int;
  v_n int; v_ok_n int; v_par real; v_score int; v_umbral int; v_aprobada boolean;
  v_correctas int; v_incorrectas int; v_repasados int;
  v_primer_clear boolean := false; v_unidad_completa boolean := false;
  v_ramas_abiertas boolean := false; v_hechas int; v_total int;
  v_xp int := 0; v_sem_quiere int := 0; v_sem int := 0; v_tope int; v_hoy int;
  v_local date; v_streak int; v_streak_inc boolean := false; v_ach jsonb;
  v_rama text; v_sig jsonb; v_accion jsonb; v_balance int; v_clave text;
  v_desbloqueada jsonb;
begin
  if v_uid is null then raise exception 'No autenticado' using errcode = 'P0001'; end if;
  select * into v_i from ac_intentos where id = p_intento_id;
  if not found or v_i.user_id <> v_uid then
    return jsonb_build_object('ok', false, 'error', 'ajena', 'mensaje', 'Esa sesión no es tuya.');
  end if;
  if v_i.finished_at is not null then
    return jsonb_build_object('ok', false, 'error', 'cerrada', 'mensaje', 'Esa sesión ya está cerrada.');
  end if;

  -- Sin esto, "terminar" en el paso 1 sería una sesión perfecta.
  select count(*) into v_pend from ac_intento_pasos
   where intento_id = v_i.id and graduable and answered_at is null;
  if v_pend > 0 then
    return jsonb_build_object('ok', false, 'error', 'incompleta', 'pendientes', v_pend,
      'mensaje', 'Todavía te quedan pasos por responder.');
  end if;

  select * into v_prof from profiles where id = v_uid for update;
  v_acc := coalesce(v_prof.account_type::text, 'adult');
  v_local := ac_dia_local(v_uid);

  -- Puntaje sobre la PRIMERA vuelta, con crédito parcial. Los re-encolados son
  -- práctica: si contaran, equivocarse en todo y acertar la segunda vez sería
  -- una sesión perfecta.
  select count(*), count(*) filter (where correcto), coalesce(avg(coalesce(parcial, 0)), 0),
         count(*) filter (where repaso)
    into v_n, v_ok_n, v_par, v_repasados
    from ac_intento_pasos where intento_id = v_i.id and graduable and not requeue;
  v_score := case when v_n = 0 then 0 else round(100 * v_par)::int end;

  select count(*) filter (where correcto), count(*) filter (where not correcto)
    into v_correctas, v_incorrectas
    from ac_intento_pasos where intento_id = v_i.id and graduable and answered_at is not null;

  v_umbral := case when v_i.tipo = 'desafio' then ac_setting_int('academia_umbral_desafio', 75)
                   else ac_setting_int('academia_umbral_leccion', 60) end;
  v_aprobada := v_score >= v_umbral;

  -- XP: 10 por acierto de primera, 3 por error (equivocarse también es
  -- practicar) y 2 por arreglar un error re-encolado.
  v_xp := 10 * v_ok_n + 3 * (v_n - v_ok_n)
        + 2 * (select count(*) from ac_intento_pasos
                where intento_id = v_i.id and requeue and correcto)::int;

  if v_i.leccion_id is not null then
    select * into v_l from ac_lecciones where id = v_i.leccion_id;
    select * into v_u from ac_unidades where id = v_l.unidad_id;
    v_rama := v_u.rama_slug;

    select completada_at is null into v_primer_clear
      from ac_user_leccion where user_id = v_uid and leccion_id = v_l.id;
    v_primer_clear := coalesce(v_primer_clear, true) and v_aprobada;

    insert into ac_user_leccion (user_id, leccion_id, mejor_score, intentos, completada_at)
    values (v_uid, v_l.id, v_score, 1, case when v_aprobada then now() end)
    on conflict (user_id, leccion_id) do update set
      mejor_score = greatest(ac_user_leccion.mejor_score, excluded.mejor_score),
      intentos = ac_user_leccion.intentos + 1,
      completada_at = coalesce(ac_user_leccion.completada_at, excluded.completada_at),
      updated_at = now();

    if v_primer_clear then
      v_xp := v_xp + case v_l.tipo when 'desafio' then 80 when 'practica' then 50 else 30 end;
      v_sem_quiere := v_sem_quiere + case v_l.tipo when 'desafio' then 5 else 2 end
                    + case when v_score >= 90 then 1 else 0 end;
    end if;

    -- ¿Se completó la unidad? Todas sus sesiones hechas.
    select count(*), count(*) filter (where ul.completada_at is not null)
      into v_total, v_hechas
      from ac_lecciones l
      left join ac_user_leccion ul on ul.leccion_id = l.id and ul.user_id = v_uid
     where l.unidad_id = v_u.id and l.status = 'aprobado';

    if v_hechas = v_total and v_total > 0 then
      insert into ac_user_unidad (user_id, unidad_id) values (v_uid, v_u.id)
      on conflict do nothing;
      if found then
        v_unidad_completa := true;
        v_xp := v_xp + 150;
        v_sem_quiere := v_sem_quiere + 10;
        -- La primera unidad del tronco es la que abre las ramas: es EL momento
        -- del árbol, y la pantalla lo festeja distinto.
        v_ramas_abiertas := v_u.rama_slug = 'tronco' and v_u.orden = 1;
      end if;
    end if;
  elsif v_i.tipo = 'repaso' and v_score >= 80 then
    v_xp := v_xp + 25;
    v_sem_quiere := v_sem_quiere + 2;
  end if;

  -- ── Semillas, con tope diario y en silencio si hubo tiempos imposibles.
  if v_sem_quiere > 0 and v_i.banderas < 3 then
    v_tope := ac_setting_int('academia_semillas_dia', 15);
    select coalesce(sum(amount), 0) into v_hoy from semilla_ledger
     where user_id = v_uid and source = 'academia'
       and created_at >= (v_local::timestamp at time zone
             coalesce(nullif(v_prof.timezone, ''), 'America/Argentina/Buenos_Aires'));
    v_sem := least(v_sem_quiere, greatest(0, v_tope - v_hoy));
    if v_sem > 0 then
      v_clave := case when v_i.leccion_id is null then 'repaso:' || v_i.id::text
                      else 'leccion:' || v_i.leccion_id::text end;
      insert into ac_user_premios (user_id, clave, semillas) values (v_uid, v_clave, v_sem)
      on conflict (user_id, clave) do nothing;
      if found then
        perform brote_grant_semillas(v_uid, v_sem, 'academia', v_i.id::text,
          case when v_unidad_completa then 'Unidad completa en la Academia'
               when v_i.leccion_id is null then 'Repaso de la Academia'
               else 'Sesión de la Academia' end);
        insert into ac_uso_diario (user_id, dia_local, semillas) values (v_uid, v_local, v_sem)
        on conflict (user_id, dia_local) do update set semillas = ac_uso_diario.semillas + v_sem;
      else
        v_sem := 0;
      end if;
    end if;
  end if;

  -- ── XP y racha por los caminos que ya existen.
  if v_xp > 0 then
    update profiles set total_xp = total_xp + v_xp where id = v_uid;
    if v_rama is not null and v_rama <> 'tronco' then
      insert into user_domain_points (user_id, domain_slug, points) values (v_uid, v_rama, v_xp)
      on conflict (user_id, domain_slug) do update set points = user_domain_points.points + v_xp;
    end if;
  end if;

  if v_prof.last_streak_date is distinct from v_local then
    v_streak := case when v_prof.last_streak_date = v_local - 1 then v_prof.current_streak + 1 else 1 end;
    v_streak_inc := true;
    update profiles set current_streak = v_streak,
      longest_streak = greatest(longest_streak, v_streak), last_streak_date = v_local
     where id = v_uid;
  else
    v_streak := v_prof.current_streak;
  end if;

  v_ach := brote_award_achievements(v_uid);
  update ac_intentos set finished_at = now() where id = v_i.id;

  -- ── Qué sigue. Si la unidad se completó, lo que se abrió.
  if v_u.id is not null then
    if v_unidad_completa then
      select jsonb_build_object('slug', u.slug, 'titulo_es', u.titulo_es, 'rama_slug', u.rama_slug,
                                'estado', e.estado)
        into v_desbloqueada
        from ac_unidades u join ac_estado_unidades(v_uid, v_acc) e on e.unidad_id = u.id
       where u.rama_slug = v_u.rama_slug and u.orden > v_u.orden
       order by u.orden limit 1;
    end if;

    select jsonb_build_object('id', l.id, 'titulo_es', l.titulo_es, 'tipo', l.tipo, 'orden', l.orden)
      into v_sig
      from ac_estado_lecciones(v_uid, v_u.id, true) el join ac_lecciones l on l.id = el.leccion_id
     where el.estado = 'disponible'
     order by el.orden limit 1;
  end if;

  v_accion := ac_accion_para(v_uid, v_rama);
  select semillas into v_balance from profiles where id = v_uid;

  return jsonb_build_object(
    'ok', true,
    'tipo', v_i.tipo,
    'score', v_score, 'umbral', v_umbral, 'aprobada', v_aprobada,
    'correctas', v_ok_n, 'total', v_n, 'repasados', v_repasados,
    'xp', v_xp, 'semillas', v_sem, 'semillas_balance', coalesce(v_balance, 0),
    'primer_clear', v_primer_clear,
    'leccion', case when v_l.id is not null then jsonb_build_object(
      'id', v_l.id, 'titulo_es', v_l.titulo_es, 'tipo', v_l.tipo, 'orden', v_l.orden) end,
    'unidad', case when v_u.id is not null then jsonb_build_object(
      'id', v_u.id, 'slug', v_u.slug, 'titulo_es', v_u.titulo_es, 'rama_slug', v_u.rama_slug,
      'orden', v_u.orden, 'hechas', v_hechas, 'total', v_total, 'completa', v_unidad_completa) end,
    'unidad_desbloqueada', v_desbloqueada,
    'ramas_abiertas', v_ramas_abiertas,
    'siguiente', v_sig,
    'racha', v_streak, 'racha_sumo', v_streak_inc,
    'accion', v_accion,
    'nuevos_titulos', v_ach -> 'titles', 'nuevas_insignias', v_ach -> 'badges');
end $fn$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 11 · academia_salir — abandonar. Salir sin haber respondido nada, en el
--      primer minuto, devuelve la savia: un mal toque no cuesta una sesión.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function academia_salir(p_intento_id uuid)
returns jsonb language plpgsql volatile security definer set search_path = public as $fn$
declare v_uid uuid := auth.uid(); v_i ac_intentos%rowtype; v_resp int; v_reembolso boolean := false;
begin
  if v_uid is null then raise exception 'No autenticado' using errcode = 'P0001'; end if;
  select * into v_i from ac_intentos where id = p_intento_id;
  if not found or v_i.user_id <> v_uid then
    return jsonb_build_object('ok', false, 'error', 'ajena', 'mensaje', 'Esa sesión no es tuya.');
  end if;
  if v_i.finished_at is not null or v_i.abandonada_at is not null then
    return jsonb_build_object('ok', true, 'reembolso', false);
  end if;

  select count(*) into v_resp from ac_intento_pasos
   where intento_id = v_i.id and answered_at is not null;

  if v_i.savia_gastada > 0 and v_resp = 0 and v_i.started_at > now() - interval '90 seconds' then
    update ac_uso_diario set hojas = greatest(0, hojas - 1)
     where user_id = v_uid and dia_local = ac_dia_local(v_uid);
    v_reembolso := true;
  end if;

  update ac_intentos set abandonada_at = now() where id = v_i.id;
  return jsonb_build_object('ok', true, 'reembolso', v_reembolso);
end $fn$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 12 · Permisos. Todo definer, revocado de public/anon, concedido solo a
--      authenticated.
-- ─────────────────────────────────────────────────────────────────────────────

revoke all on function academia_mapa()                        from public, anon, authenticated;
revoke all on function academia_unidad(text)                  from public, anon, authenticated;
revoke all on function academia_empezar(uuid)                 from public, anon, authenticated;
revoke all on function academia_repasar()                     from public, anon, authenticated;
revoke all on function academia_responder(uuid, jsonb)        from public, anon, authenticated;
revoke all on function academia_retomar(uuid)                 from public, anon, authenticated;
revoke all on function academia_terminar(uuid)                from public, anon, authenticated;
revoke all on function academia_salir(uuid)                   from public, anon, authenticated;
revoke all on function academia_gancho_intento(uuid, uuid, text) from public, anon, authenticated;

grant execute on function academia_mapa()                     to authenticated;
grant execute on function academia_unidad(text)               to authenticated;
grant execute on function academia_empezar(uuid)              to authenticated;
grant execute on function academia_repasar()                  to authenticated;
grant execute on function academia_responder(uuid, jsonb)     to authenticated;
grant execute on function academia_retomar(uuid)              to authenticated;
grant execute on function academia_terminar(uuid)             to authenticated;
grant execute on function academia_salir(uuid)                to authenticated;
grant execute on function academia_gancho_intento(uuid, uuid, text) to authenticated;
