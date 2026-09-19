-- Brote — 0058 — `pip_styles_for` alcanza para pintar a quien te notificó.
-- Feed v2 ("La Plaza") fase 2, paso 5.
--
-- Las notificaciones sociales guardan `data->>'user_id'`: quién reaccionó,
-- quién respondió, quién te empezó a seguir. Para mostrar esa fila como
-- corresponde — el Pip de la persona, su nombre, y un "Seguir de vuelta" que
-- sepa si ya la seguís — hacían falta tres campos más de los que la búsqueda
-- por lote de 0046 devolvía.
--
-- Se agregan de forma aditiva (las claves nuevas conviven con las viejas), así
-- que los trece llamadores existentes de rankings y competencias siguen
-- funcionando sin tocarlos. Ese era el punto de 0046 y sigue siéndolo.
--
-- Los kids SÍ aparecen acá, y es correcto: esta función también pinta las
-- tablas de posiciones, donde una cuenta infantil sí puede estar. Lo que la
-- política de edad prohíbe es que un kid aparezca en búsquedas, sugerencias,
-- menciones o como alguien a quien seguir — y eso lo bloquean
-- `search_profiles`, `suggested_accounts` y `follow_user`, cada una en su
-- propio lugar. Igual `is_following` sale en false para ellos, porque
-- `follows` nunca puede tener una fila que los apunte.

create or replace function pip_styles_for(p_ids uuid[]) returns jsonb
language sql stable security definer set search_path = public as $fn$
  select coalesce(jsonb_object_agg(p.id::text, jsonb_build_object(
           'pip_style',    p.pip_style,
           'rank_slug',    p.current_rank_slug,
           'is_verified',  p.is_verified,
           'username',     p.username,
           'display_name', p.display_name,
           'avatar_url',   p.avatar_url,
           'is_following', exists (
             select 1 from follows f
             where f.follower_id = (select auth.uid()) and f.followee_id = p.id)
         )), '{}'::jsonb)
  from profiles p
  where p.id = any(coalesce(p_ids, '{}'::uuid[]));
$fn$;

revoke all on function pip_styles_for(uuid[]) from public, anon;
grant execute on function pip_styles_for(uuid[]) to authenticated;
