-- ════════════════════════════════════════════════════════════════════════════
-- Brote — 0135 — La guía pública de acciones (/guia).
--
-- Casi todo Brote está detrás del login. Para Google eso es un sitio sin
-- contenido: la revisión de AdSense rechaza sitios que no puede leer, y los
-- buscadores no tienen nada que mostrar. Las 420 acciones del catálogo
-- (docs/ACCIONES.md) son contenido propio, escrito y con fuentes: la guía las
-- publica de sólo lectura, sin cuenta.
--
-- Qué sale: título, por qué importa, cómo se hace, cuánto lleva, dónde, cuánto
-- cuesta, el impacto por vez y la fuente. Qué NO sale: nada de personas,
-- puntos ni rangos, y ninguna acción interna (`'interno' = any(tags)`).
-- ════════════════════════════════════════════════════════════════════════════

create or replace function public.guia_publica()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'slug', a.slug, 'titulo', a.title_es, 'resumen', a.short_es, 'tema', a.domain_slug,
           'minutos', a.minutos, 'costo', a.costo, 'lugar', a.lugar, 'esfuerzo', a.effort,
           'agua_l', a.impact_water_l, 'co2_kg', a.impact_co2_kg, 'residuos_kg', a.impact_waste_kg,
           'energia_kwh', a.impact_energy_kwh)
         order by a.domain_slug, a.sort_order, a.title_es), '[]'::jsonb)
    from activities a
   where a.active and not ('interno' = any(a.tags)) and not ('juego' = any(a.tags));
$$;

create or replace function public.guia_publica_accion(p_slug text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
           'slug', a.slug, 'titulo', a.title_es, 'resumen', a.short_es, 'descripcion', a.description_es,
           'pasos', a.instructions_es, 'tema', a.domain_slug, 'minutos', a.minutos, 'costo', a.costo,
           'lugar', a.lugar, 'esfuerzo', a.effort, 'ahorra', a.ahorra, 'con_adulto', a.con_adulto,
           'agua_l', a.impact_water_l, 'co2_kg', a.impact_co2_kg, 'residuos_kg', a.impact_waste_kg,
           'energia_kwh', a.impact_energy_kwh, 'equivalencia', a.impact_equivalency_es,
           'fuente', a.fuente, 'fuente_url', a.fuente_url,
           -- Primero las del mismo camino: el orden se fija con `n`, porque un
           -- `order by` dentro de la subconsulta no sobrevive al agregado.
           'relacionadas', (select coalesce(jsonb_agg(jsonb_build_object('slug', r.slug, 'titulo', r.title_es, 'resumen', r.short_es)
                                                       order by r.n), '[]'::jsonb)
                              from (select x.slug, x.title_es, x.short_es,
                                           row_number() over (order by (x.camino_slug is not distinct from a.camino_slug) desc,
                                                                       x.sort_order, x.title_es) as n
                                      from activities x
                                     where x.active and x.domain_slug = a.domain_slug and x.slug <> a.slug
                                       and not ('interno' = any(x.tags)) and not ('juego' = any(x.tags))
                                     order by n
                                     limit 6) r))
    from activities a
   where a.slug = p_slug and a.active and not ('interno' = any(a.tags)) and not ('juego' = any(a.tags));
$$;

revoke all on function public.guia_publica() from public;
revoke all on function public.guia_publica_accion(text) from public;
grant execute on function public.guia_publica() to anon, authenticated;
grant execute on function public.guia_publica_accion(text) to anon, authenticated;
