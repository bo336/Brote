-- 0103 — La racha compartida: "los dos, hoy".
--
-- `11-GAME-LOOP.md` §8. No es un ranking ni una competencia: es un número entre
-- exactamente dos personas, y no hay forma de verlo de nadie más que de alguien
-- cuya isla podés visitar.
--
-- **Nada se guarda.** Se deriva de `activity_completions`, que son acciones
-- reales ya verificadas: no hay tabla que farmear, no hay contador que empujar,
-- y borrar esta función no pierde ningún dato de nadie.
--
-- El anti-patrón 7 de `04-RESEARCH-DESIGN.md` §9 no prohíbe las rachas: prohíbe
-- **las rachas sin días de descanso gratis**. Por eso `p_rest` días flojos no la
-- cortan — se perdonan solos, sin pedir permiso y sin avisar, igual que los
-- `streak_freezes` de la app (§6).

create or replace function public.world_friend_streak(p_username text)
returns jsonb language plpgsql stable security definer set search_path = public as $fn$
declare
  v_me    uuid := auth.uid();
  v_them  uuid;
  v_tz    text := 'America/Argentina/Buenos_Aires';
  v_today date := (now() at time zone v_tz)::date;
  v_rest  int  := 2;      -- días de descanso gratis, en total
  v_max   int  := 400;    -- techo del recorrido; nadie necesita más
  v_day   date;
  v_both  boolean;
  v_days  int := 0;
  v_used  int := 0;
begin
  if v_me is null then raise exception 'not authenticated'; end if;

  select id into v_them from profiles where username = p_username;
  -- Las mismas puertas de siempre, y la misma respuesta: no está.
  if v_them is null or v_them = v_me
     or exists (select 1 from user_blocks b
                 where (b.blocker_id = v_them and b.blocked_id = v_me)
                    or (b.blocker_id = v_me and b.blocked_id = v_them))
  then
    return jsonb_build_object('days', 0, 'restUsed', 0);
  end if;

  for i in 0 .. v_max loop
    v_day := v_today - i;
    select exists (select 1 from activity_completions a
                    where a.user_id = v_me and a.local_date = v_day
                      and coalesce(a.counts_for_streak, true))
       and exists (select 1 from activity_completions a
                    where a.user_id = v_them and a.local_date = v_day
                      and coalesce(a.counts_for_streak, true))
      into v_both;

    if v_both then
      v_days := v_days + 1;
    elsif i = 0 then
      -- Hoy todavía no terminó. Que ninguno haya registrado nada a las nueve de
      -- la mañana no es un día perdido, y no gasta un descanso.
      continue;
    elsif v_used < v_rest then
      v_used := v_used + 1;
    else
      exit;
    end if;
  end loop;

  return jsonb_build_object('days', v_days, 'restUsed', v_used);
end $fn$;

revoke all on function public.world_friend_streak(text) from public, anon;
grant execute on function public.world_friend_streak(text) to authenticated;
