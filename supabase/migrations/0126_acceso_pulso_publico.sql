-- ════════════════════════════════════════════════════════════════════════════
-- Brote — 0126 — El pulso público del login (docs/LANZAMIENTO.md F1).
--
-- La pantalla de ingreso muestra lo que la comunidad ya hizo de verdad: cuántas
-- acciones, cuánta agua y cuánto CO₂. Lo ve gente SIN cuenta, así que:
--
--   · sólo totales, nunca nada de una persona;
--   · las cuentas de prueba (`es_prueba`) no cuentan;
--   · lo que es del juego (`'juego' = any(tags)`) no cuenta, igual que en el
--     impacto de cada persona (0123);
--   · se calcula como mucho cada 10 minutos y se guarda en `app_state`. Si diez
--     personas abren el login a la vez cuando venció, UNA recalcula (candado de
--     transacción) y las demás reciben el valor anterior: un login concurrido
--     nunca dispara diez sumas sobre toda la tabla de acciones.
--
-- La pantalla decide si lo muestra: con pocos números todavía no lo dibuja
-- (inventar o inflar un número está prohibido en BROTE_DESIGN_SYSTEM §7).
-- ════════════════════════════════════════════════════════════════════════════

create or replace function public.brote_pulso_publico()
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v jsonb;
  v_at timestamptz;
  v_hoy date := (now() at time zone 'America/Argentina/Buenos_Aires')::date;
begin
  select value, updated_at into v, v_at from app_state where key = 'pulso_publico';
  if v is not null and v_at > now() - interval '10 minutes' then
    return v;
  end if;

  -- Otra sesión ya lo está calculando: el anterior sirve.
  if not pg_try_advisory_xact_lock(hashtext('brote_pulso_publico')) then
    return coalesce(v, '{}'::jsonb);
  end if;

  select jsonb_build_object(
           'personas', (select count(*) from profiles
                         where onboarding_completed and not coalesce(es_prueba, false)),
           'acciones', count(*),
           'acciones_hoy', count(*) filter (where ac.local_date = v_hoy),
           'agua_l', round(coalesce(sum(coalesce(ac.impact_water_l, a.impact_water_l)), 0)),
           'co2_kg', round(coalesce(sum(coalesce(ac.impact_co2_kg, a.impact_co2_kg)), 0)),
           'residuos_kg', round(coalesce(sum(coalesce(ac.impact_waste_kg, a.impact_waste_kg)), 0)),
           'calculado_at', now())
    into v
    from activity_completions ac
    join activities a on a.id = ac.activity_id
    join profiles p on p.id = ac.user_id
   where ac.status in ('honor', 'verified')
     and not ('juego' = any(a.tags))
     and not coalesce(p.es_prueba, false);

  insert into app_state (key, value, updated_at)
  values ('pulso_publico', v, now())
  on conflict (key) do update set value = excluded.value, updated_at = excluded.updated_at;

  return v;
end $$;

revoke all on function public.brote_pulso_publico() from public;
grant execute on function public.brote_pulso_publico() to anon, authenticated;
