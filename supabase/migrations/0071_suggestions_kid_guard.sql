-- Brote — 0071 — A una cuenta infantil no se le sugiere gente.
-- Feed v2 ("La Plaza") fase 3, paso 6 (repaso de edad).
--
-- `suggested_accounts` ya excluía a los chicos como RESULTADO
-- (`p.account_type <> 'kid'`), pero no como QUIEN PREGUNTA: llamándola con la
-- sesión de una cuenta infantil devolvía las cuatro cuentas adultas.
--
-- Hoy no es alcanzable desde la interfaz —el buscador no aparece en la barra
-- para un chico, `WhoToFollow` está detrás de `!isKid`, el paso de onboarding
-- se saltea y la escalera no incluye `discover`— y aunque llegara,
-- `follow_user` rechaza a un chico igual. Pero la regla del proyecto es que
-- esconder en la UI no es aplicar la regla (08 §2), y esta era la única RPC
-- social que quedaba sin la guarda del lado del servidor.
--
-- Una línea. Devuelve `[]`, no un error: no hay nada que explicarle a nadie,
-- simplemente no hay sugerencias para esa cuenta.

create or replace function suggested_accounts(p_limit integer default 6)
returns jsonb
language sql stable security definer set search_path = public as $fn$
  with me as (
    select id, city, coalesce(interests,'{}') as interests,
           coalesce(account_type::text,'adult') as age
    from profiles where id = auth.uid()
  )
  select coalesce(jsonb_agg(to_jsonb(s) - 'score' order by s.score desc), '[]'::jsonb)
  from (
    select p.id, p.username, p.display_name, p.avatar_url, p.pip_style, p.bio,
           p.current_rank_slug as rank_slug, p.is_verified, p.followers_count, p.city,
           (case when p.is_creator then 40 else 0 end)
           + (case when p.city is not null and p.city = me.city then 25 else 0 end)
           + (select count(*) * 8 from unnest(coalesce(p.interests,'{}')) t where t = any(me.interests))
           + least(20, p.followers_count)
           + least(15, (p.total_xp / 1000)::int) as score
    from profiles p, me
    where me.age <> 'kid'
      and p.id <> me.id
      and p.account_type <> 'kid'
      and p.onboarding_completed
      and p.profile_visibility = 'public'
      and not exists (select 1 from follows f where f.follower_id = me.id and f.followee_id = p.id)
      and not exists (select 1 from user_blocks b
                      where (b.blocker_id = me.id and b.blocked_id = p.id)
                         or (b.blocker_id = p.id and b.blocked_id = me.id))
    order by score desc, p.followers_count desc
    limit greatest(1, least(20, p_limit))
  ) s;
$fn$;

revoke all on function suggested_accounts(integer) from public, anon;
grant execute on function suggested_accounts(integer) to authenticated;
