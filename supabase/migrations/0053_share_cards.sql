-- Brote — 0053 — Tarjetas para compartir y el hilo de una novedad.
-- Feed v2 ("La Plaza") fase 2, paso 2.
--
-- Dos funciones chiquitas con un motivo cada una:
--
-- 1. `feed_post_og` es la ÚNICA función del feed a la que `anon` puede llamar,
--    y existe porque las etiquetas Open Graph las lee un rastreador de
--    WhatsApp o Twitter que no tiene sesión. En 0045 le sacamos el EXECUTE a
--    `anon` sobre todo el resto justamente para que un visitante deslogueado no
--    pudiera leer cualquier post por id; así que esta abre una ventana angosta
--    y explícita en lugar de deshacer aquello:
--      · solo posts visibles (no ocultos, no respuestas),
--      · solo de cuentas adultas con `profile_visibility = 'public'`,
--      · el cuerpo recortado a 200 caracteres,
--      · nunca la ciudad, el barrio, el XP ni nada del perfil más allá del
--        nombre visible y el @.
--    Las novedades (`kind = 'news'`, sin autor) son públicas por definición:
--    ya las publicó un medio.
--
--    Ojo con el corolario: si el post es de una cuenta teen o privada, la
--    función devuelve `null` y la página cae a la tarjeta genérica de Brote.
--    Eso es lo correcto — compartir el link sigue funcionando, lo que no se
--    filtra es la vista previa.
--
-- 2. `news_post_id` resuelve la conversación de una novedad. El detalle de la
--    nota necesita el post `kind='news'` que le corresponde para poder mostrar
--    (y sumar) comentarios, y sin esto el cliente tendría que consultar
--    `feed_posts` directo.

-- ═════════════════════════════════════════════════════════════════════════════
-- 1. Vista previa pública para compartir
-- ═════════════════════════════════════════════════════════════════════════════

create or replace function feed_post_og(p_post_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $fn$
  select case when f.id is null then null else jsonb_build_object(
    'id',      f.id,
    'kind',    f.kind::text,
    'title',   coalesce(n.title_es, left(f.body, 80), 'Una publicación en Brote'),
    'body',    left(f.body, 200),
    'summary', n.summary_es,
    'image',   coalesce(f.image_url, n.image_url),
    'source',  n.source,
    'author',  case when p.id is null then null else
                 coalesce(p.display_name, '@' || p.username) end,
    'created_at', f.created_at
  ) end
  from feed_posts f
  left join news n     on n.id = f.news_id
  left join profiles p on p.id = f.author_id
  where f.id = p_post_id
    and not f.hidden
    and f.kind <> 'reply'
    -- Una novedad no tiene autor: ya es pública. Un post sí, y entonces la
    -- cuenta tiene que ser adulta y pública para que se filtre una vista previa.
    and (
      f.author_id is null
      or (p.account_type::text = 'adult' and coalesce(p.profile_visibility, 'public') = 'public')
    );
$fn$;

-- ═════════════════════════════════════════════════════════════════════════════
-- 2. El hilo de una novedad
-- ═════════════════════════════════════════════════════════════════════════════

create or replace function news_post_id(p_news_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $fn$
  select f.id
  from feed_posts f
  join profiles me on me.id = (select auth.uid())
  where f.news_id = p_news_id
    and f.kind = 'news'
    and not f.hidden
    -- La política de edad se aplica acá también: si la nota no es apta para la
    -- edad de quien mira, tampoco se le abre la conversación (08 §2).
    and me.account_type::text = any(f.age_groups)
  order by f.created_at desc
  limit 1;
$fn$;

-- ═════════════════════════════════════════════════════════════════════════════
-- 3. Permisos
-- ═════════════════════════════════════════════════════════════════════════════

revoke all on function feed_post_og(uuid)  from public, anon, authenticated;
revoke all on function news_post_id(uuid)  from public, anon, authenticated;

-- La excepción deliberada: el rastreador no tiene sesión.
grant execute on function feed_post_og(uuid) to anon, authenticated;
grant execute on function news_post_id(uuid) to authenticated;
