-- Brote — 0063 — Las funciones de trigger no son endpoints.
-- Feed v2 ("La Plaza") fase 2, paso 8 (cierre).
--
-- Los advisors marcan seis funciones de trigger como ejecutables por `anon` y
-- por `authenticated` a través de `/rest/v1/rpc/`. Es la misma trampa que
-- 0045: Supabase concede EXECUTE por defecto sobre toda función nueva, y
-- revocar de `public` NO alcanza — hay que nombrar el rol.
--
-- Ninguna es explotable hoy: llamar una función de trigger directamente falla
-- con "can only be called as a trigger". Pero dejarlas publicadas es exponer
-- superficie sin ninguna razón, y la regla del proyecto desde 0045 es que sólo
-- se expone lo que se usa. Cuatro son viejas (fase 1 y anteriores); dos son de
-- esta tanda (`feed_reroot_reply` de 0057 y `feed_sync_repost_count` de 0056),
-- así que se cierran todas juntas.
--
-- Los triggers siguen funcionando igual: los ejecuta el motor con el dueño de
-- la función, no con el rol de quien hizo la escritura.

revoke all on function brote_validate_pip_style()   from public, anon, authenticated;
revoke all on function feed_reroot_reply()          from public, anon, authenticated;
revoke all on function feed_sync_news()             from public, anon, authenticated;
revoke all on function feed_sync_reaction_counts()  from public, anon, authenticated;
revoke all on function feed_sync_reply_count()      from public, anon, authenticated;
revoke all on function feed_sync_repost_count()     from public, anon, authenticated;
