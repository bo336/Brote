-- ════════════════════════════════════════════════════════════════════════════
-- Brote — 0145 — Cuentas de menores en regla, y un onboarding que sirve.
--
-- 1. NOTICIAS PARA CHICOS. Hasta acá eran las mismas noticias de adultos menos
--    las que tenían palabras feas: 859 de 1.143, con cumbres climáticas,
--    impuestos, demandas y pichones muertos. Ahora una noticia es para chicos
--    sólo si viene de una fuente marcada para chicos (`chicos: true` en
--    `app_state.news_feeds`), es de un tema de naturaleza o ciencia, tiene algo
--    curioso o positivo, y no toca muerte, violencia, enfermedad, política,
--    economía ni conflictos. Se decide al guardar cada noticia (trigger), no
--    horas después. Y una cuenta de chico no puede leer otra noticia ni
--    pidiéndola por su número (RLS).
--
-- 2. AUTORIZACIÓN ADULTA. La política de privacidad dice que una cuenta de
--    chico necesita la autorización de una persona adulta responsable, pero
--    nada la pedía. Ahora el onboarding de un chico no termina sin ella: queda
--    registrada con quién la dio, su vínculo, la versión del texto y la fecha,
--    en una tabla que no lee nadie desde la app.
--
-- 3. ADOLESCENTES EN EL MERCADO. Miran y guardan, pero no salen a contactar a
--    la tienda ni le escriben preguntas: no pueden comprar ni contratar, y el
--    contacto llevaba a un WhatsApp de un adulto desconocido fuera de la app.
--
-- 4. EL ONBOARDING. "¿Dónde comprás la comida?" no cambiaba nada: se va. Entra
--    "¿cuánto tiempo tenés por día?" (`context.ritmo`), que cambia el día de
--    todos: corto = sólo acciones rápidas; más = hasta dos largas. Y una función
--    cuenta cuántas acciones suma cada respuesta, para que se vea en pantalla.
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1 · Noticias para chicos ────────────────────────────────────────────────

update public.app_state
   set value = (
     select coalesce(jsonb_agg(
              case when f ->> 'name' in ('EcoInventos', 'Ambientum', 'Mongabay Latam', 'El Blog Verde', 'La Vanguardia Natural', 'Ecoticias')
                   then f || '{"chicos": true}'::jsonb
                   else f - 'chicos' end), '[]'::jsonb)
       from jsonb_array_elements(value) f)
 where key = 'news_feeds' and jsonb_typeof(value) = 'array';

create or replace function public.brote_news_fuentes_chicos()
returns text[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(array_agg(f ->> 'name'), '{}')
    from app_state s, jsonb_array_elements(case when jsonb_typeof(s.value) = 'array' then s.value else '[]'::jsonb end) f
   where s.key = 'news_feeds' and coalesce((f ->> 'chicos')::boolean, false);
$$;
revoke all on function public.brote_news_fuentes_chicos() from public, anon, authenticated;

drop function if exists public.brote_news_is_kid_safe(text, text, text[]);
create or replace function public.brote_news_is_kid_safe(p_title text, p_summary text, p_tags text[], p_source text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with t as (select lower(coalesce(p_title, '') || ' ' || coalesce(p_summary, '')) as x)
  select coalesce(p_source = any (brote_news_fuentes_chicos()), false)
     and coalesce(p_tags && array['animales', 'plantas', 'ciencia', 'agua_azul', 'residuos', 'alimentacion', 'energia'], false)
     -- Algo curioso o positivo: un descubrimiento, un invento, un animal, cómo se hace algo.
     and t.x ~ ('(descubr|invent|ingenios|crean |crea un|cre[oó] |desarroll|dise[ñn]a|nuev[oa]s? |nacen|naci[oó]|nacimiento'
               || '|regres|vuelve|vuelven|recuper|proteg|cuida|salv[aó]|rescat|aprend|curios|sab[ií]as|c[óo]mo se|c[óo]mo hacer'
               || '|por qu[eé]|qu[eé] es|truco|casero|reutiliz|recicl|huerta|compost|semilla|abeja|tortuga|ballena|ping[üu]in'
               || '|delf[ií]n|mariposa|p[áa]jaro|aves? |colibr|zorro|ciervo|nutria|oso |lobo|hongo|r[ée]cord|primera vez|solar|bici)')
     -- Nada de muerte, violencia, enfermedad, miedo, política, economía ni conflictos.
     and t.x !~ ('(muert|muer[eo]|mueren|muri[oó]|morir|fallec|v[ií]ctim|tragedia|cat[áa]str|desastre|masacre|guerra|conflict'
               || '|asesin|suicid|violaci|violent|matanza|mata[rn]? |matan|extermin|herid|desaparec|desaparici|caz[ao]|cazador'
               || '|furtiv|esqueleto|cad[áa]ver|sangr|d[ée]biles?|golpe|ataque|atac|arma|bomba|explos|accidente|maltrat|abus'
               || '|tr[áa]fic|contraband|sacrific|incendi|fuego|llamas|quema|arras|calcin|terremoto|sismo|temblor|tsunami'
               || '|hurac[áa]n|tornado|inundaci|temporal|granizo|alerta|evacua|desaloj|emergencia|damnificad|c[áa]ncer|enferm'
               || '|epidemia|pandemia|malaria|dengue|bacteria|legionel|virus|par[áa]sit|pulgas|plaga|obesidad|adelgaz|hambre'
               || '|desnutric|droga|alcohol|tabaco|t[óo]xic|veneno|canc[ée]r|pesticida|colaps|devasta|extinci|amenaz|peligr'
               || '|riesgo|vulnerab|crisis|sequ[ií]a|aridez|calor extremo|olas? de calor|emisiones|petr[óo]le|miner[ií]a|deforest'
               || '|destru|contamin|pol[ií]tic|gobierno|ministr|presiden|elecci|congreso|parlament|ley |leyes|legal|tribunal'
               || '|juicio|demanda|denuncia|ofensiva|cumbre|cop ?[0-9]|onu|pacto|pactan|permiso|impuesto|millones|euros|d[óo]lares'
               || '|empresa|industri|negocio|precio|inversi|financ|banco|ocde|comisi[óo]n europea|uni[óo]n europea|socios'
               || '|reclam|protest|critic|rechaz|pol[ée]mic|esc[áa]ndalo|fraude|multa|sanci|el tiempo hoy|pron[óo]stico)')
    from t;
$$;
revoke all on function public.brote_news_is_kid_safe(text, text, text[], text) from public, anon, authenticated;

-- Cada noticia se decide al guardarse, y se le saca la basura de algunas fuentes
-- ("Elige a Mongabay Latam como fuente preferida en Google…").
create or replace function public.brote_news_al_guardar()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.summary_es := nullif(btrim(regexp_replace(coalesce(new.summary_es, ''),
                      '^\s*Elige a .{1,80}? como fuente preferida en Google\s*', '', 'i')), '');
  new.age_groups := case when brote_news_is_kid_safe(new.title_es, new.summary_es, new.domain_tags, new.source)
                         then array['kid', 'teen', 'adult'] else array['teen', 'adult'] end;
  return new;
end $$;
revoke all on function public.brote_news_al_guardar() from public, anon, authenticated;

drop trigger if exists news_al_guardar on public.news;
create trigger news_al_guardar
  before insert or update of title_es, summary_es, domain_tags, source on public.news
  for each row execute function public.brote_news_al_guardar();

-- El cron de cada 8 horas sigue: ahora sólo recalcula con las mismas reglas
-- (sirve si alguien cambia qué fuentes son para chicos).
create or replace function public.brote_tag_kid_safe_news()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare v_n int;
begin
  update news
     set age_groups = case when brote_news_is_kid_safe(title_es, summary_es, domain_tags, source)
                           then array['kid', 'teen', 'adult'] else array['teen', 'adult'] end
   where active
     and ('kid' = any (age_groups)) is distinct from brote_news_is_kid_safe(title_es, summary_es, domain_tags, source);
  get diagnostics v_n = row_count;
  return v_n;
end $$;
revoke all on function public.brote_tag_kid_safe_news() from public, anon, authenticated;

-- Las que ya están: limpiar y decidir de nuevo.
update public.news set summary_es = summary_es where active;

-- Una cuenta de chico sólo lee noticias para chicos, aunque pida otra por su número.
drop policy if exists "read news" on public.news;
create policy "read news" on public.news for select
  using (active = true
         and ('kid' = any (age_groups)
              or coalesce((select brote_account_type((select auth.uid()))), 'adult') <> 'kid'));

-- ── 2 · Autorización de una persona adulta ──────────────────────────────────

create table if not exists public.autorizaciones_adultas (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  nombre     text not null check (char_length(nombre) between 2 and 80),
  vinculo    text not null check (vinculo in ('madre_padre', 'tutor', 'otro_familiar')),
  version    text not null,
  created_at timestamptz not null default now()
);
alter table public.autorizaciones_adultas enable row level security;
revoke all on public.autorizaciones_adultas from public, anon, authenticated;

create or replace function public.cuenta_autorizacion_adulta(p_nombre text, p_vinculo text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_uid uuid := auth.uid(); v_nombre text := btrim(coalesce(p_nombre, ''));
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'error', 'no_autenticado'); end if;
  if coalesce(brote_account_type(v_uid), 'adult') <> 'kid' then
    return jsonb_build_object('ok', false, 'error', 'no_es_chico');
  end if;
  if char_length(v_nombre) not between 2 and 80 then return jsonb_build_object('ok', false, 'error', 'nombre'); end if;
  if coalesce(p_vinculo, '') not in ('madre_padre', 'tutor', 'otro_familiar') then
    return jsonb_build_object('ok', false, 'error', 'vinculo');
  end if;
  insert into autorizaciones_adultas (user_id, nombre, vinculo, version)
  values (v_uid, v_nombre, p_vinculo, '2026-11-05')
  on conflict (user_id) do update set nombre = excluded.nombre, vinculo = excluded.vinculo,
                                      version = excluded.version, created_at = now();
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.cuenta_autorizacion_adulta(text, text) from public, anon;
grant execute on function public.cuenta_autorizacion_adulta(text, text) to authenticated;

-- Un chico no termina el onboarding sin esa autorización.
create or replace function public.brote_finish_onboarding()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'No autenticado' using errcode = 'P0001'; end if;
  if coalesce(brote_account_type(v_uid), 'adult') = 'kid'
     and not exists (select 1 from autorizaciones_adultas where user_id = v_uid) then
    return jsonb_build_object('ok', false, 'error', 'falta_autorizacion');
  end if;
  update profiles set onboarding_completed = true where id = v_uid and onboarding_completed is not true;
  return jsonb_build_object('ok', true);
end $$;

-- ── 3 · Adolescentes en el Mercado: miran, no contactan ─────────────────────

create or replace function public.mercado_salir(p_listing uuid, p_origen text, p_ua_hash text default null::text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare l listings%rowtype; b businesses%rowtype; v_url text;
begin
  -- Contactar una tienda es para comprar o contratar: sólo cuentas adultas.
  if coalesce(brote_account_type((select auth.uid())), 'adult') <> 'adult' then
    return jsonb_build_object('ok', false, 'error', 'solo_adultos');
  end if;
  select * into l from listings where id = p_listing and status = 'publicado';
  if l.id is null or not brote_mercado_puede_ver(l.categoria) then
    return jsonb_build_object('ok', false, 'error', 'no_disponible');
  end if;
  select * into b from businesses where id = l.business_id and status = 'approved';
  if b.id is null then return jsonb_build_object('ok', false, 'error', 'no_disponible'); end if;
  v_url := brote_listado_destino(l, b);
  if v_url is null then return jsonb_build_object('ok', false, 'error', 'sin_destino'); end if;
  insert into listing_clicks (listing_id, business_id, user_id, origen, ua_hash)
  values (l.id, l.business_id, (select auth.uid()),
          case when p_origen in ('catalogo','accion','perfil_negocio','busqueda','ficha') then p_origen else 'ficha' end,
          left(p_ua_hash, 64));
  return jsonb_build_object('ok', true, 'url', v_url, 'dominio', brote_dominio(v_url), 'canal', l.contacto);
end $function$;

create or replace function public.mercado_salida(p_listing uuid)
returns jsonb
language plpgsql
stable security definer
set search_path = public
as $function$
declare l listings%rowtype; b businesses%rowtype;
begin
  if coalesce(brote_account_type((select auth.uid())), 'adult') <> 'adult' then return null; end if;
  select * into l from listings where id = p_listing and status = 'publicado';
  if l.id is null or not brote_mercado_puede_ver(l.categoria) then return null; end if;
  select * into b from businesses where id = l.business_id and status = 'approved';
  if b.id is null then return null; end if;
  return jsonb_build_object('listado', l.titulo, 'slug', l.slug,
    'dominio', brote_dominio(brote_listado_destino(l, b)),
    'canal', l.contacto,
    'comercio', b.nombre_comercial, 'logo', b.logo_url,
    -- A partir de la 3ª vez en 30 días con el mismo comercio: toast y listo.
    'vistas_30d', (select count(*) from listing_clicks
                    where user_id = (select auth.uid()) and business_id = b.id
                      and created_at > now() - interval '30 days'));
end $function$;

create or replace function public.mercado_preguntar(p_listing uuid, p_texto text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare l listings%rowtype; v_uid uuid := (select auth.uid()); v_txt text; v_id uuid;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'error', 'no_autenticado'); end if;
  if coalesce(brote_account_type(v_uid), 'adult') <> 'adult' then
    return jsonb_build_object('ok', false, 'error', 'solo_adultos');
  end if;
  select * into l from listings where id = p_listing and status = 'publicado';
  if l.id is null or not brote_mercado_puede_ver(l.categoria) then
    return jsonb_build_object('ok', false, 'error', 'no_disponible');
  end if;
  if brote_is_member(l.business_id) then return jsonb_build_object('ok', false, 'error', 'propio'); end if;
  v_txt := regexp_replace(trim(coalesce(p_texto, '')), '\s+', ' ', 'g');
  if char_length(v_txt) < 5 then return jsonb_build_object('ok', false, 'error', 'muy_corta'); end if;
  if char_length(v_txt) > 300 then return jsonb_build_object('ok', false, 'error', 'muy_larga'); end if;
  if brote_matches_blocklist(v_txt) then return jsonb_build_object('ok', false, 'error', 'texto_no_permitido'); end if;
  if not brote_rate_limit('pregunta:' || v_uid, 20) then
    return jsonb_build_object('ok', false, 'error', 'demasiadas');
  end if;
  insert into listing_preguntas (listing_id, business_id, user_id, texto)
  values (l.id, l.business_id, v_uid, v_txt) returning id into v_id;
  perform brote_negocio_notificar(l.business_id, 'Te hicieron una pregunta',
    format('Sobre "%s": %s', l.titulo, left(v_txt, 120)), '/negocio/preguntas');
  return jsonb_build_object('ok', true, 'id', v_id);
end $function$;

-- ── 4 · El onboarding: cuánto tiempo tenés, y qué suma cada respuesta ───────

create or replace function public.acciones_guardar_contexto(p_ctx jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare v_uid uuid := auth.uid(); v_limpio jsonb := '{}'::jsonb; k text; v jsonb;
begin
  if v_uid is null then raise exception 'No autenticado' using errcode = 'P0001'; end if;
  if jsonb_typeof(p_ctx) is distinct from 'object' then
    return jsonb_build_object('ok', false, 'error', 'Formato inválido');
  end if;
  for k, v in select * from jsonb_each(p_ctx) loop
    if k in ('balcon','jardin','pileta','edificio','auto','bici','gas','aire','secarropas','lena','parrilla',
             'perro','gato','chicos','trabajo','estudio','campo','costa','compost','huerta','respondido')
       and jsonb_typeof(v) = 'boolean' then
      v_limpio := v_limpio || jsonb_build_object(k, v);
    elsif k = 'ritmo' and v #>> '{}' in ('corto', 'normal', 'mas') then
      v_limpio := v_limpio || jsonb_build_object(k, v);
    end if;
  end loop;
  update profiles set context = (coalesce(context, '{}'::jsonb) - 'compra') || v_limpio where id = v_uid;
  return jsonb_build_object('ok', true, 'context', (select context from profiles where id = v_uid));
end $function$;

update public.profiles set context = context - 'compra' where context ? 'compra';

-- Cuántas acciones suma cada respuesta, para la edad de quien pregunta.
create or replace function public.onboarding_conteos()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with a as (
    select a.* from activities a
     where a.active and not ('interno' = any (a.tags)) and not ('juego' = any (a.tags))
       and coalesce((select brote_account_type((select auth.uid()))), 'adult') = any (a.age_groups)
  )
  select jsonb_build_object(
    'total', (select count(*) from a),
    'rapidas', (select count(*) from a where a.minutos <= 5),
    'por_clave', coalesce((select jsonb_object_agg(k, n) from (select k, count(*) n from a, unnest(a.requiere) k group by k) x), '{}'::jsonb));
$$;
revoke all on function public.onboarding_conteos() from public, anon;
grant execute on function public.onboarding_conteos() to authenticated;

-- El día de cada persona respeta su ritmo. Copia de 0123 con ese cambio.
create or replace function public.brote_armar_dia(
  p_uid uuid, p_local date, p_mantener uuid[] default '{}', p_excluir uuid[] default '{}'
)
returns jsonb
language plpgsql
stable security definer
set search_path = public
as $fn$
declare
  v_reglas jsonb := brote_acciones_reglas();
  v_tam int := (v_reglas ->> 'tamano')::int;
  v_rap_min int := (v_reglas ->> 'rapidas_min')::int;
  v_rap_m int := (v_reglas ->> 'rapida_minutos')::int;
  v_lar_m int := (v_reglas ->> 'larga_minutos')::int;
  v_max_lar int := (v_reglas ->> 'max_largas')::int;
  v_max_dom int := (v_reglas ->> 'max_por_dominio')::int;
  v_max_tem int := coalesce((v_reglas ->> 'max_temporada')::int, 2);
  v_cand jsonb;
  v_x jsonb;
  v_ids uuid[] := '{}';
  v_razones jsonb := '{}';
  v_dom jsonb := '{}';
  v_rap int := 0;
  v_lar int := 0;
  v_tem int := 0;
  v_hay_nueva boolean := false;
  v_pasada int;
  v_tope int;
  v_mezcla boolean;
  v_m int;
  r record;
  v_ritmo text := coalesce((select context ->> 'ritmo' from profiles where id = p_uid), 'normal');
begin
  -- Cuánto tiempo tiene la persona por día (onboarding, 0145). Las pasadas 3 y 4
  -- siguen sin topes: si no hay suficientes rápidas, el día igual se completa.
  if v_ritmo = 'corto' then
    v_max_lar := 0;
    v_rap_min := v_tam;
  elsif v_ritmo = 'mas' then
    v_max_lar := greatest(v_max_lar, 2);
    v_rap_min := least(v_rap_min, 2);
  end if;

  -- Lo que se mantiene cuenta para los topes.
  for r in
    select a.id, a.domain_slug, a.minutos, cardinality(a.estaciones) > 0 as de_temporada,
           not exists (select 1 from activity_completions ac
                        where ac.user_id = p_uid and ac.activity_id = a.id and ac.status in ('honor','verified')) as nunca
      from unnest(coalesce(p_mantener, '{}')) with ordinality u(aid, ord)
      join activities a on a.id = u.aid
     order by u.ord
  loop
    v_ids := v_ids || r.id;
    v_dom := jsonb_set(v_dom, array[r.domain_slug], to_jsonb(coalesce((v_dom ->> r.domain_slug)::int, 0) + 1));
    if r.minutos <= v_rap_m then v_rap := v_rap + 1; end if;
    if r.minutos > v_lar_m then v_lar := v_lar + 1; end if;
    if r.de_temporada then v_tem := v_tem + 1; end if;
    if r.nunca then v_hay_nueva := true; end if;
  end loop;

  select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'd', c.d, 'm', c.m, 'n', c.n, 't', c.t, 's', c.s, 'r', c.r)
                            order by c.s desc, c.id), '[]'::jsonb)
    into v_cand
    from brote_candidatas(p_uid, p_local, 'daily', coalesce(p_excluir, '{}') || coalesce(p_mantener, '{}')) c;

  -- Paso 0: al menos una nueva, si existe una que no sea larga.
  if not v_hay_nueva and cardinality(v_ids) < v_tam then
    select value into v_x from jsonb_array_elements(v_cand)
     where (value ->> 'n')::boolean
       and (value ->> 'm')::int <= case when v_ritmo = 'corto' then v_rap_m else v_lar_m end
     limit 1;
    if v_x is not null then
      v_ids := v_ids || (v_x ->> 'id')::uuid;
      v_dom := jsonb_set(v_dom, array[v_x ->> 'd'], to_jsonb(coalesce((v_dom ->> (v_x ->> 'd'))::int, 0) + 1));
      v_m := (v_x ->> 'm')::int;
      if v_m <= v_rap_m then v_rap := v_rap + 1; end if;
      if v_m > v_lar_m then v_lar := v_lar + 1; end if;
      if (v_x ->> 't')::boolean then v_tem := v_tem + 1; end if;
      v_razones := v_razones || jsonb_build_object(v_x ->> 'id', v_x -> 'r');
    end if;
  end if;

  -- Pasadas: con todos los topes, y relajándolos de a uno si no alcanza.
  foreach v_pasada in array array[1, 2, 3, 4] loop
    exit when cardinality(v_ids) >= v_tam;
    v_tope := case v_pasada when 1 then v_max_dom when 4 then 1000000 else greatest(v_max_dom, 2) end;
    v_mezcla := v_pasada <= 2;
    for v_x in select value from jsonb_array_elements(v_cand) loop
      exit when cardinality(v_ids) >= v_tam;
      continue when (v_x ->> 'id')::uuid = any(v_ids);
      continue when coalesce((v_dom ->> (v_x ->> 'd'))::int, 0) >= v_tope;
      v_m := (v_x ->> 'm')::int;
      if v_mezcla then
        continue when v_m > v_lar_m and v_lar >= v_max_lar;
        continue when (v_x ->> 't')::boolean and v_tem >= v_max_tem;
        continue when v_m > v_rap_m and (v_tam - cardinality(v_ids) - 1) < greatest(0, v_rap_min - v_rap);
      end if;
      v_ids := v_ids || (v_x ->> 'id')::uuid;
      v_dom := jsonb_set(v_dom, array[v_x ->> 'd'], to_jsonb(coalesce((v_dom ->> (v_x ->> 'd'))::int, 0) + 1));
      if v_m <= v_rap_m then v_rap := v_rap + 1; end if;
      if v_m > v_lar_m then v_lar := v_lar + 1; end if;
      if (v_x ->> 't')::boolean then v_tem := v_tem + 1; end if;
      v_razones := v_razones || jsonb_build_object(v_x ->> 'id', v_x -> 'r');
    end loop;
  end loop;

  return jsonb_build_object('ids', to_jsonb(v_ids), 'razones', v_razones);
end $fn$;
