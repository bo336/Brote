-- Brote — 0073 — Una sola política de lectura sobre `feed_reactions`.
-- Feed v2 ("La Plaza") fase 3, paso 5.
--
-- Lo marcan los advisors de rendimiento: `feed_reactions` tenía DOS políticas
-- permisivas para SELECT.
--
--   "reactions readable"   FOR SELECT  using (true)
--   "reactions own write"  FOR ALL     using (auth.uid() = user_id)
--
-- `FOR ALL` incluye SELECT, así que cada lectura evaluaba las dos y se quedaba
-- con el OR. El resultado no cambia —`true OR loquesea` es `true`— pero se
-- paga la comparación con `auth.uid()` en cada fila leída, y esta es la tabla
-- más caliente de la parte social: se lee una vez por publicación en pantalla.
--
-- Se parte la de escritura en INSERT / UPDATE / DELETE, que es lo que
-- realmente quería decir. Los permisos efectivos quedan exactamente iguales:
-- cualquiera lee las reacciones (los contadores son públicos), y sólo se puede
-- escribir la propia.

drop policy if exists "reactions own write" on feed_reactions;

create policy "reactions own insert" on feed_reactions for insert
  with check ((select auth.uid()) = user_id);

create policy "reactions own update" on feed_reactions for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "reactions own delete" on feed_reactions for delete
  using ((select auth.uid()) = user_id);
