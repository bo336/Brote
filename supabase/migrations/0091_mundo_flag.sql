-- ============================================================================
-- MUNDO — la bandera de la ruta /mundo. Estrictamente aditivo.
--
-- Fase 1 de BROTE-MUNDO. La migración grande (user_world, world_placements,
-- world_species, world_journal, world_daily y sus RPC) es de la fase 4
-- (15-DATA-MODEL.md §3). Acá va solo lo que la fase 1 necesita para existir:
-- la bandera y la forma de leerla.
--
-- Numeración: el repo llega hasta 0090. Antes de la fase 4 hay que correr
-- `supabase db pull` y confirmar contra la base viva (18-DECISIONS.md D1); si
-- la base viva ya pasó este número, esta migración se renumera.
-- ============================================================================

insert into app_settings (key, value, description)
values ('mundo_game_enabled', 'false'::jsonb,
        'Ruta /mundo activa. En false, /mundo redirige a /perfil.')
on conflict (key) do nothing;

-- `app_settings` tiene RLS activo y ninguna policy de lectura, así que ni el
-- cliente ni el server component pueden consultarla directo. Misma solución que
-- la Academia: una función `security definer` que expone UN booleano y nada más.
--
-- El default es false: si la fila no existe todavía, o si algo falla, la ruta
-- queda apagada. Es el único default seguro para una pantalla que aún no está
-- lista para todo el mundo.
create or replace function public.mundo_enabled()
returns boolean language sql stable security definer set search_path = public as $fn$
  select coalesce(
    (select (value #>> '{}')::boolean from app_settings where key = 'mundo_game_enabled'),
    false);
$fn$;

revoke all on function public.mundo_enabled() from public, anon;
grant execute on function public.mundo_enabled() to authenticated;

comment on function public.mundo_enabled() is
  'Bandera de la ruta /mundo. Devuelve false si la fila no existe: una pantalla a medio construir se apaga sola antes que abrirse por accidente.';
