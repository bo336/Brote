-- Brote — 0065 — La escalera: el feed no termina en una pared.
-- Feed v2 ("La Plaza") fase 3, paso 1.
--
-- Cuando se acaban las publicaciones y las noticias rankeadas, el timeline
-- devolvía `next_cursor = null` y aparecía la tarjeta de "estás al día". Con
-- 573 noticias eso está lejísimos para una cuenta nueva, pero llega — y cuando
-- llega, la respuesta honesta no es "no hay nada más", es "no hay nada más
-- PARA LEER; acá tenés cosas para hacer".
--
-- La escalera son seis peldaños (02 §3.4). Los dos primeros —noticias viejas
-- del interés, y después cualquier noticia— ya los sirve el timeline: no tiene
-- corte por fecha, así que el archivo entero entra en el ranking. Esta función
-- cubre los cuatro que faltaban:
--
--   discover → 3 cuentas reales para seguir
--   project  → proyectos abiertos, primero los de tu ciudad
--   action   → acciones del catálogo que todavía no hiciste, a tu altura
--   lesson   → la próxima lección de tu camino
--
-- Devuelve TODO de una vez y no paginado a propósito: son como mucho seis
-- tarjetas. Un cursor sobre una cola fija es complejidad sin beneficio, y el
-- cliente la pide una sola vez, cuando el timeline se queda sin páginas.
--
-- Nada de esto se inventa. Si no hay proyectos abiertos, no hay tarjeta de
-- proyecto. Si ya hiciste todas las acciones, no hay tarjeta de acción. La
-- escalera puede volver vacía, y entonces sí corresponde el final honesto.
--
-- Edad: una cuenta infantil no recibe `discover` (no sigue a nadie ni aparece
-- en sugerencias) ni `project` (son encuentros presenciales con desconocidos).
-- Le quedan acciones y lecciones, que es exactamente lo que el producto le
-- ofrece.

create or replace function feed_ladder()
returns jsonb
language sql
stable
security definer
set search_path = public
as $fn$
  with me as (
    select p.id,
           coalesce(p.account_type::text,'adult') as age,
           coalesce(p.interests,'{}')             as interests,
           p.city,
           coalesce(p.total_xp, 0)                as xp
    from profiles p where p.id = auth.uid()
  ),
  my_tier as (
    select coalesce((brote_get_rank((select xp from me))->>'tier')::int, 1) as tier
  ),

  -- ── 3. Cuentas para descubrir ────────────────────────────────────────────
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

  -- ── 4. Proyectos abiertos, los de tu ciudad primero ──────────────────────
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
      -- Si ya te sumaste no es un descubrimiento, es una tarea; va en Acciones.
      and not exists (select 1 from project_participants pp
                       where pp.project_id = pr.id and pp.user_id = me.id)
    order by ord, pr.created_at desc
    limit 2
  ),

  -- ── 5. Acciones del catálogo que todavía no hiciste ──────────────────────
  act as (
    select jsonb_build_object(
             'ladder', 'action',
             'id', 'ladder-action-' || a.id::text,
             'action', jsonb_build_object(
               'id', a.id, 'slug', a.slug, 'title_es', a.title_es,
               'short_es', a.short_es, 'domain_slug', a.domain_slug,
               'base_points', a.base_points, 'effort', a.effort, 'impact', a.impact)
           ) as card,
           -- Primero lo que coincide con tus intereses; después, lo más liviano.
           (case when a.domain_slug = any(me.interests) then 0 else 1 end) as ord,
           a.sort_order
    from activities a, me, my_tier
    where a.active
      and a.type in ('catalog','daily')
      and me.age = any(a.age_groups)
      and coalesce((select r.tier from ranks r where r.slug = a.min_rank_slug), 1) <= my_tier.tier
      and not exists (select 1 from activity_completions c
                       where c.user_id = me.id and c.activity_id = a.id
                         and c.status in ('honor','verified'))
    order by ord, a.sort_order
    limit 2
  ),

  -- ── 6. La próxima lección ────────────────────────────────────────────────
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
    || coalesce((select jsonb_agg(card order by ord, sort_order) from act), '[]'::jsonb)
    || coalesce((select jsonb_agg(card order by level, sort_order) from les), '[]'::jsonb)
  );
$fn$;

revoke all on function feed_ladder() from public, anon, authenticated;
grant execute on function feed_ladder() to authenticated;
