-- ============================================================================
-- MUNDO — cerrar los helpers.
--
-- El linter de seguridad de Supabase encontró dos cosas reales en 0094/0095, y
-- las dos son mías:
--
-- 1. **`world_placements_reason` y `world_tier_of` toman un `uuid` y quedaron
--    ejecutables por `authenticated`.** Postgres da EXECUTE a `PUBLIC` por
--    defecto y Supabase además otorga sobre todo el esquema, así que revocar
--    de `public, anon` no alcanzaba. Cualquiera con sesión podía preguntar por
--    el id de otra persona: `world_tier_of` le devuelve su nivel, y
--    `world_placements_reason` le devuelve `prop_not_owned:<slug>`, que es una
--    forma de leer el inventario ajeno de a una pieza por vez.
--
--    Son helpers internos. Las RPC que los usan son `security definer`, así que
--    corren como el dueño y siguen viéndolos igual.
--
-- 2. **Los cuatro helpers puros tenían `search_path` mutable.** No tocan
--    tablas, pero un `search_path` abierto en una función es la forma clásica
--    de que alguien la haga resolver otra cosa. Cuestan nada de arreglar.
--
-- Lo que el linter marca y **no** es un problema: `world_collective` tiene RLS
-- sin policies. Es a propósito — RLS sin policy niega todo, y esa tabla se lee
-- únicamente desde `world_collective_impact()`.
-- ============================================================================

-- Los cuatro puros: `search_path` vacío, porque no resuelven ningún nombre.
alter function public.world_region_tier(text)    set search_path = '';
alter function public.world_island_radius(int)   set search_path = '';
alter function public.world_placement_cap(int)   set search_path = '';
alter function public.world_semillas_for(text)   set search_path = '';

-- Y nadie con sesión llama a un helper directo. Sólo las RPC, desde adentro.
revoke execute on function public.world_region_tier(text)               from authenticated;
revoke execute on function public.world_island_radius(int)              from authenticated;
revoke execute on function public.world_placement_cap(int)              from authenticated;
revoke execute on function public.world_semillas_for(text)              from authenticated;
revoke execute on function public.world_tier_of(uuid)                   from authenticated;
revoke execute on function public.world_placements_reason(uuid, jsonb)  from authenticated;

comment on function public.world_placements_reason(uuid, jsonb) is
  'Helper interno. No se otorga a authenticated: devuelve prop_not_owned:<slug>, que sobre un id ajeno sería leer el inventario de otra persona de a una pieza.';
comment on function public.world_tier_of(uuid) is
  'Helper interno. No se otorga a authenticated: el nivel de otra persona no es un dato público.';
