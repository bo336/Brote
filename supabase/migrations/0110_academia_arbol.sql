-- Brote — 0110 — La Academia, segunda versión: el Árbol (esquema y corrector).
--
-- QUÉ CAMBIA Y POR QUÉ. El modelo anterior (rama → gajo → hoja → concepto,
-- con anillos) componía cada sesión al vuelo con ítems sueltos derivados de
-- una oración por concepto. Funcionaba como motor, pero como experiencia era
-- confuso de leer y poco profundo: nueve preguntas de reconocimiento sin una
-- lección detrás. Esta versión es un currículum ESCRITO, con forma de árbol:
--
--   Árbol → Rama (el tronco + los 13 dominios) → Unidad → Sesión → Paso
--
-- Una unidad agrupa ideas que van juntas y tiene de 5 a 10 sesiones. Una
-- sesión es una lección con arco propio: enseña (teoría, ejemplo resuelto),
-- practica de lo simple a lo complejo (reconocer → aplicar → analizar → casos
-- y cálculos) y trae de vuelta, intercalados, pasos de unidades anteriores que
-- se están olvidando. Terminar una unidad hace crecer esa rama y abre la
-- siguiente.
--
-- LO QUE SE REUSA, sin tocarlo: `ac_ramas` (la identidad de las ramas),
-- `ac_fuentes`, `ac_uso_diario` (la savia del día), `ac_user_premios` (premios
-- de una sola vez), los ajustes de `app_settings` y los helpers de 0077
-- (`ac_setting_*`, `ac_dia_local`, `ac_retrievability`, `ac_kendall`).
--
-- LO QUE NO SE BORRA. Las tablas y funciones del modelo anterior quedan
-- intactas: tienen historial y siguen alimentando la cola de `/panel`. Nada de
-- esta migración es destructivo.
--
-- LA REGLA QUE SIGUE MANDANDO: la respuesta correcta no cruza el cable antes
-- de corregir. `ac_pasos.solucion` es inalcanzable por PostgREST; lo que sale
-- es `payload_publico`, barajado y reetiquetado por entrega.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1 · Currículum. Lo escriben SOLO funciones security definer (el cargador).
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists ac_unidades (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  rama_slug       text not null references ac_ramas(slug),
  orden           smallint not null,
  -- 0 tronco · 1 básico · 2 intermedio · 3 avanzado. Es lo que el árbol usa
  -- para decidir a qué altura de la copa va cada unidad.
  nivel           smallint not null default 1,
  titulo_es       text not null,
  bajada_es       text not null,
  objetivos_es    text[] not null default '{}',
  -- Unidades (por slug) que esta unidad vuelve a traer a propósito. El
  -- repaso espaciado las prioriza: es la espiral del currículum escrita a mano,
  -- no solo la que resulta del olvido.
  repasa          text[] not null default '{}',
  -- Qué unidad del tronco hay que haber terminado para abrir esta. Las ramas
  -- crecen desde el tronco: sin la base, los números de la unidad 4 de Energía
  -- no se entienden.
  requiere_tronco smallint not null default 1,
  fuentes         text[] not null default '{}',
  age_groups      text[] not null default '{kid,teen,adult}',
  status          ac_estado_contenido not null default 'aprobado',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists ac_lecciones (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,
  unidad_id  uuid not null references ac_unidades(id) on delete cascade,
  orden      smallint not null,
  -- `leccion` enseña; `practica` mezcla la unidad de forma adaptativa;
  -- `desafio` es el cierre, más exigente, y es lo que completa la unidad.
  tipo       text not null default 'leccion',
  titulo_es  text not null,
  bajada_es  text not null,
  minutos    smallint not null default 7,
  status     ac_estado_contenido not null default 'aprobado',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ac_lecciones_tipo check (tipo in ('leccion','practica','desafio'))
);

-- Un paso: una tarjeta de teoría, un ejemplo resuelto o un ejercicio.
-- Los pasos con el mismo (leccion, orden) son VARIANTES del mismo ejercicio
-- —típicamente un cálculo con otros números— y comparten `grupo`, que es la
-- clave de la memoria: repasar una variante cuenta como repasar el grupo.
create table if not exists ac_pasos (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  leccion_id      uuid not null references ac_lecciones(id) on delete cascade,
  orden           smallint not null,
  grupo           text not null,
  tipo            text not null,
  payload_publico jsonb not null,
  solucion        jsonb not null default '{}'::jsonb,
  dificultad      smallint not null default 2,
  concepto        text,
  repasable       boolean not null default true,
  age_groups      text[] not null default '{kid,teen,adult}',
  status          ac_estado_contenido not null default 'aprobado',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint ac_pasos_tipo check (tipo in (
    'teoria','ejemplo',
    'opcion','multiple','vf','ordenar','ranking','cadena',
    'clasificar','emparejar','completar','numero','estimar','detectar')),
  constraint ac_pasos_dificultad check (dificultad between 1 and 5)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2 · Estado de quien aprende
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists ac_user_leccion (
  user_id       uuid not null references profiles(id) on delete cascade,
  leccion_id    uuid not null references ac_lecciones(id) on delete cascade,
  mejor_score   smallint not null default 0,
  intentos      smallint not null default 0,
  completada_at timestamptz,
  updated_at    timestamptz not null default now(),
  primary key (user_id, leccion_id)
);

create table if not exists ac_user_unidad (
  user_id       uuid not null references profiles(id) on delete cascade,
  unidad_id     uuid not null references ac_unidades(id) on delete cascade,
  completada_at timestamptz not null default now(),
  primary key (user_id, unidad_id)
);

-- La memoria, por grupo de paso. Dos números y nada más (el mismo modelo de
-- vida media de 0077): `mastery` es un promedio móvil de aciertos y
-- `half_life` cuántos días tarda el recuerdo en caer a la mitad.
-- Al leer: fuerza = mastery · 2^(−días / half_life).
create table if not exists ac_user_memoria (
  user_id         uuid not null references profiles(id) on delete cascade,
  grupo           text not null,
  mastery         real not null default 0,
  half_life       real not null default 1,
  vistas          int not null default 0,
  aciertos        int not null default 0,
  ultimo_correcto boolean,
  last_seen       timestamptz not null default now(),
  primary key (user_id, grupo)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3 · Intentos y entregas — la columna vertebral anti-trampa
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists ac_intentos (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  leccion_id    uuid references ac_lecciones(id),   -- null ⇒ repaso libre
  tipo          text not null,
  pasos         smallint not null default 0,
  correctas     smallint not null default 0,
  respondidas   smallint not null default 0,
  savia_gastada smallint not null default 0,
  banderas      smallint not null default 0,
  started_at    timestamptz not null default now(),
  -- Una lección larga dura quince minutos; noventa dan margen para una
  -- interrupción sin dejar vivas entregas de ayer.
  expires_at    timestamptz not null default now() + interval '90 minutes',
  finished_at   timestamptz,
  abandonada_at timestamptz,
  constraint ac_intentos_tipo check (tipo in ('leccion','practica','desafio','repaso'))
);

-- Una fila por paso servido, INCLUIDOS los de teoría: así una sesión se puede
-- retomar entera después de un F5, con sus tarjetas, y no solo las preguntas.
-- `perm[k]` = índice 1-based de la ficha original que quedó en la posición k.
create table if not exists ac_intento_pasos (
  id          uuid primary key default gen_random_uuid(),
  intento_id  uuid not null references ac_intentos(id) on delete cascade,
  orden       smallint not null,
  paso_id     uuid not null references ac_pasos(id),
  graduable   boolean not null,
  perm        smallint[] not null default '{}',
  repaso      boolean not null default false,
  issued_at   timestamptz not null default now(),
  answered_at timestamptz,
  elegido     jsonb,
  correcto    boolean,
  parcial     real,
  latency_ms  int,
  requeue     boolean not null default false,
  unique (intento_id, orden)
);

-- El gancho de acción, medido, para los intentos de esta versión.
create table if not exists ac_intento_gancho (
  intento_id  uuid primary key references ac_intentos(id) on delete cascade,
  accion_id   uuid not null references activities(id) on delete cascade,
  mostrado_at timestamptz not null default now(),
  tocado_at   timestamptz
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4 · Índices
-- ─────────────────────────────────────────────────────────────────────────────

create index if not exists ac_unidades_rama_idx      on ac_unidades (rama_slug, orden);
create index if not exists ac_lecciones_unidad_idx   on ac_lecciones (unidad_id, orden);
create index if not exists ac_pasos_leccion_idx      on ac_pasos (leccion_id, orden) where status = 'aprobado';
create index if not exists ac_pasos_grupo_idx        on ac_pasos (grupo);
create index if not exists ac_user_leccion_user_idx  on ac_user_leccion (user_id);
create index if not exists ac_user_unidad_user_idx   on ac_user_unidad (user_id);
create index if not exists ac_user_memoria_seen_idx  on ac_user_memoria (user_id, last_seen);
create index if not exists ac_intentos_user_idx      on ac_intentos (user_id, started_at desc);
create index if not exists ac_intento_pasos_pend_idx on ac_intento_pasos (intento_id) where answered_at is null;
create index if not exists ac_intento_pasos_paso_idx on ac_intento_pasos (paso_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5 · RLS
--
-- Contenido: RLS sin políticas y sin permisos. Se lee solo desde las
-- funciones, que filtran por edad y estado; `ac_pasos` además guarda la
-- solución. Estado propio: solo lectura de lo propio, sin escritura directa.
-- ─────────────────────────────────────────────────────────────────────────────

alter table ac_unidades       enable row level security;
alter table ac_lecciones      enable row level security;
alter table ac_pasos          enable row level security;
alter table ac_user_leccion   enable row level security;
alter table ac_user_unidad    enable row level security;
alter table ac_user_memoria   enable row level security;
alter table ac_intentos       enable row level security;
alter table ac_intento_pasos  enable row level security;
alter table ac_intento_gancho enable row level security;

revoke all on table ac_unidades, ac_lecciones, ac_pasos, ac_intento_pasos, ac_intento_gancho
  from anon, authenticated;
revoke all on table ac_user_leccion, ac_user_unidad, ac_user_memoria, ac_intentos from anon;
revoke insert, update, delete on table ac_user_leccion, ac_user_unidad, ac_user_memoria, ac_intentos
  from authenticated;

drop policy if exists ac_user_leccion_read on ac_user_leccion;
create policy ac_user_leccion_read on ac_user_leccion for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists ac_user_unidad_read on ac_user_unidad;
create policy ac_user_unidad_read on ac_user_unidad for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists ac_user_memoria_read on ac_user_memoria;
create policy ac_user_memoria_read on ac_user_memoria for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists ac_intentos_read on ac_intentos;
create policy ac_intentos_read on ac_intentos for select to authenticated
  using ((select auth.uid()) = user_id);

comment on column ac_pasos.solucion is
  'Solo servidor. Si PostgREST llega a esta columna, toda la Academia se resuelve con un curl.';
comment on table ac_intento_pasos is
  'Registro de respuestas de la versión Árbol. Sin política de lectura: guarda `perm`, el mapa que permitiría deducir la respuesta de un paso ya visto.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 6 · Ajustes nuevos. Se leen en tiempo de ejecución, nunca se hardcodean.
-- ─────────────────────────────────────────────────────────────────────────────

insert into app_settings (key, value, description) values
  ('academia_umbral_leccion', '60'::jsonb,
   'Puntaje mínimo (0-100) para dar por hecha una sesión de lección o de práctica.'),
  ('academia_umbral_desafio', '75'::jsonb,
   'Puntaje mínimo (0-100) para aprobar el desafío que cierra una unidad.')
on conflict (key) do nothing;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7 · Fichas: barajar, reetiquetar y volver.
--
-- Qué colección de un payload porta la respuesta. Un binario o un número no
-- filtran nada por su posición, así que esos tipos devuelven null.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function ac_fichas_de(p_tipo text)
returns text language sql immutable security definer set search_path = public as $fn$
  select case p_tipo
    when 'opcion'     then 'opciones'
    when 'multiple'   then 'opciones'
    when 'vf'         then 'razones'
    when 'ordenar'    then 'items'
    when 'ranking'    then 'items'
    when 'cadena'     then 'items'
    when 'clasificar' then 'items'
    when 'emparejar'  then 'derecha'
    when 'completar'  then 'banco'
    when 'detectar'   then 'segmentos'
    else null
  end;
$fn$;

-- Aplica una permutación dada y reetiqueta a t1..tn. Sin permutación, baraja.
-- `detectar` NUNCA se baraja: sus segmentos arman un texto y el orden es el
-- texto. Se reetiqueta igual, para que los ids del ítem no salgan.
-- Devuelve {payload, perm}.
create or replace function ac_barajar_paso(p_payload jsonb, p_tipo text, p_perm smallint[] default null)
returns jsonb language plpgsql volatile security definer set search_path = public as $fn$
declare
  v_key text := ac_fichas_de(p_tipo);
  v_arr jsonb; v_n int; v_perm smallint[]; v_out jsonb := '[]'::jsonb; i int;
begin
  if v_key is null then
    return jsonb_build_object('payload', p_payload, 'perm', '[]'::jsonb);
  end if;
  v_arr := p_payload -> v_key;
  if v_arr is null or jsonb_typeof(v_arr) <> 'array' or jsonb_array_length(v_arr) = 0 then
    return jsonb_build_object('payload', p_payload, 'perm', '[]'::jsonb);
  end if;
  v_n := jsonb_array_length(v_arr);

  if p_perm is not null and coalesce(array_length(p_perm, 1), 0) = v_n then
    v_perm := p_perm;
  elsif p_tipo = 'detectar' then
    select array_agg(x::smallint order by x) into v_perm from generate_series(1, v_n) x;
  else
    select array_agg(x::smallint order by random()) into v_perm from generate_series(1, v_n) x;
  end if;

  for i in 1..v_n loop
    v_out := v_out || jsonb_build_array(
      ((v_arr -> (v_perm[i] - 1)) - 'id') || jsonb_build_object('id', 't' || i));
  end loop;
  return jsonb_build_object('payload', jsonb_set(p_payload, array[v_key], v_out),
                            'perm', to_jsonb(v_perm));
end $fn$;

-- Token opaco → id real. Vive solo del lado del servidor.
create or replace function ac_ficha_id(p_payload jsonb, p_tipo text, p_perm smallint[], p_token text)
returns text language plpgsql immutable security definer set search_path = public as $fn$
declare v_key text := ac_fichas_de(p_tipo); v_k int;
begin
  if p_token is null or v_key is null or left(p_token, 1) <> 't' then return null; end if;
  begin v_k := substring(p_token from 2)::int; exception when others then return null; end;
  if v_k is null or v_k < 1 or v_k > coalesce(array_length(p_perm, 1), 0) then return null; end if;
  return p_payload -> v_key -> (p_perm[v_k] - 1) ->> 'id';
end $fn$;

-- Id real → token de ESTA entrega. Para devolver la clave en el espacio de
-- fichas que la pantalla conoce.
create or replace function ac_ficha_token(p_payload jsonb, p_tipo text, p_perm smallint[], p_id text)
returns text language plpgsql immutable security definer set search_path = public as $fn$
declare v_key text := ac_fichas_de(p_tipo); k int;
begin
  if p_id is null or v_key is null then return null; end if;
  for k in 1..coalesce(array_length(p_perm, 1), 0) loop
    if (p_payload -> v_key -> (p_perm[k] - 1) ->> 'id') = p_id then return 't' || k; end if;
  end loop;
  return null;
end $fn$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 8 · El corrector. Una función pura: mismo paso, misma respuesta, mismo
--     resultado. Se usa al responder y al retomar una sesión.
--
-- Devuelve {correcto, parcial, clave, clave_cruda, revela, nota}:
--   clave        lo correcto, en tokens de ESTA entrega (array u objeto)
--   clave_cruda  para los tipos sin fichas (vf, numero, estimar)
--   revela       datos que solo tienen sentido después de responder
--                (los valores reales de un ranking)
--   nota         por qué tentaba la opción elegida, si el contenido lo dice
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function ac_corregir(p_tipo text, p_pub jsonb, p_sol jsonb,
                                       p_perm smallint[], p_resp jsonb)
returns jsonb language plpgsql immutable security definer set search_path = public as $fn$
declare
  v_key text := ac_fichas_de(p_tipo);
  v_clave jsonb := p_sol -> 'clave';
  v_ok boolean := false; v_par real := 0; v_nota text;
  v_clave_tok jsonb; v_cruda jsonb; v_revela jsonb;
  v_id text; v_ids text[]; v_clave_ids text[]; v_n int; v_k int;
  v_val numeric; v_obj numeric; v_tol numeric; v_r numeric;
  r record;
begin
  if p_resp is null then p_resp := '{}'::jsonb; end if;

  if p_tipo = 'opcion' then
    v_id := ac_ficha_id(p_pub, p_tipo, p_perm, p_resp ->> 'elegido');
    v_ok := v_id is not null and coalesce(v_clave ? v_id, false);
    v_par := case when v_ok then 1 else 0 end;
    if not v_ok and v_id is not null then
      v_nota := p_sol #>> array['por_opcion', v_id];
    end if;

  elsif p_tipo in ('multiple', 'detectar') then
    -- Crédito por ficha: cada una bien clasificada (marcada y debía, o sin
    -- marcar y no debía) suma. Correcto es todas.
    select coalesce(array_agg(ac_ficha_id(p_pub, p_tipo, p_perm, x)), '{}') into v_ids
      from jsonb_array_elements_text(coalesce(p_resp -> 'marcados', '[]'::jsonb)) x;
    select coalesce(array_agg(x), '{}') into v_clave_ids
      from jsonb_array_elements_text(coalesce(v_clave, '[]'::jsonb)) x;
    v_n := coalesce(jsonb_array_length(p_pub -> v_key), 0);
    select count(*) into v_k
      from jsonb_array_elements(coalesce(p_pub -> v_key, '[]'::jsonb)) o
     where ((o ->> 'id') = any(v_ids)) = ((o ->> 'id') = any(v_clave_ids));
    v_par := case when v_n = 0 then 0 else v_k::real / v_n end;
    v_ok := v_n > 0 and v_k = v_n;
    if not v_ok then
      -- La nota de la primera ficha que se marcó sin deber, si el contenido
      -- explica por qué tienta.
      select p_sol #>> array['por_opcion', x] into v_nota
        from unnest(v_ids) x where not (x = any(v_clave_ids)) and p_sol #>> array['por_opcion', x] is not null
       limit 1;
    end if;

  elsif p_tipo = 'vf' then
    v_ok := coalesce((p_resp -> 'valor') = (p_sol -> 'valor'), false);
    v_par := case when v_ok then 1 else 0 end;
    if v_ok and coalesce(jsonb_array_length(p_pub -> 'razones'), 0) > 0 then
      -- Acertar verdadero/falso sin saber por qué es media respuesta.
      v_id := ac_ficha_id(p_pub, p_tipo, p_perm, p_resp ->> 'razon');
      if v_id is null or not coalesce(v_clave ? v_id, false) then
        v_ok := false; v_par := 0.5;
        if v_id is not null then v_nota := p_sol #>> array['por_opcion', v_id]; end if;
      end if;
    end if;
    v_cruda := jsonb_build_object('valor', p_sol -> 'valor');

  elsif p_tipo in ('ordenar', 'ranking') then
    select coalesce(array_agg(ac_ficha_id(p_pub, p_tipo, p_perm, x) order by o), '{}') into v_ids
      from jsonb_array_elements_text(coalesce(p_resp -> 'orden', '[]'::jsonb)) with ordinality e(x, o);
    select coalesce(array_agg(x order by o), '{}') into v_clave_ids
      from jsonb_array_elements_text(coalesce(v_clave, '[]'::jsonb)) with ordinality e(x, o);
    v_ok := coalesce(array_length(v_clave_ids, 1), 0) > 0 and v_ids = v_clave_ids;
    v_par := case when v_ok then 1 else ac_kendall(v_ids, v_clave_ids) end;

  elsif p_tipo = 'cadena' then
    -- Una cadena causal se evalúa eslabón por eslabón: cada posición bien
    -- puesta suma, y los señuelos elegidos no suman nunca.
    select coalesce(array_agg(ac_ficha_id(p_pub, p_tipo, p_perm, x) order by o), '{}') into v_ids
      from jsonb_array_elements_text(coalesce(p_resp -> 'orden', '[]'::jsonb)) with ordinality e(x, o);
    select coalesce(array_agg(x order by o), '{}') into v_clave_ids
      from jsonb_array_elements_text(coalesce(v_clave, '[]'::jsonb)) with ordinality e(x, o);
    v_n := coalesce(array_length(v_clave_ids, 1), 0);
    v_k := 0;
    for r in select g from generate_series(1, v_n) g loop
      if v_ids[r.g] is not null and v_ids[r.g] = v_clave_ids[r.g] then v_k := v_k + 1; end if;
    end loop;
    v_ok := v_n > 0 and v_ids = v_clave_ids;
    v_par := case when v_n = 0 then 0 else v_k::real / v_n end;

  elsif p_tipo = 'clasificar' then
    v_n := coalesce(jsonb_array_length(p_pub -> 'items'), 0);
    v_k := 0;
    for r in select key, value #>> '{}' as val
               from jsonb_each(coalesce(p_resp -> 'asignacion', '{}'::jsonb)) loop
      v_id := ac_ficha_id(p_pub, p_tipo, p_perm, r.key);
      if v_id is not null and (v_clave ->> v_id) = r.val then v_k := v_k + 1; end if;
    end loop;
    v_par := case when v_n = 0 then 0 else least(1, v_k::real / v_n) end;
    v_ok := v_n > 0 and v_k = v_n;

  elsif p_tipo = 'emparejar' then
    v_n := coalesce(jsonb_array_length(p_pub -> 'izquierda'), 0);
    v_k := 0;
    for r in select key, value #>> '{}' as val
               from jsonb_each(coalesce(p_resp -> 'pares', '{}'::jsonb)) loop
      if (v_clave ->> r.key) = ac_ficha_id(p_pub, p_tipo, p_perm, r.val) then v_k := v_k + 1; end if;
    end loop;
    v_par := case when v_n = 0 then 0 else least(1, v_k::real / v_n) end;
    v_ok := v_n > 0 and v_k = v_n;

  elsif p_tipo = 'completar' then
    select coalesce(array_agg(ac_ficha_id(p_pub, p_tipo, p_perm, x) order by o), '{}') into v_ids
      from jsonb_array_elements_text(coalesce(p_resp -> 'huecos', '[]'::jsonb)) with ordinality e(x, o);
    select coalesce(array_agg(x order by o), '{}') into v_clave_ids
      from jsonb_array_elements_text(coalesce(v_clave, '[]'::jsonb)) with ordinality e(x, o);
    v_n := coalesce(array_length(v_clave_ids, 1), 0);
    v_k := 0;
    for r in select g from generate_series(1, v_n) g loop
      if v_ids[r.g] is not null and v_ids[r.g] = v_clave_ids[r.g] then v_k := v_k + 1; end if;
    end loop;
    v_ok := v_n > 0 and v_k = v_n;
    v_par := case when v_n = 0 then 0 else v_k::real / v_n end;

  elsif p_tipo = 'numero' then
    begin v_val := (p_resp ->> 'valor')::numeric; exception when others then v_val := null; end;
    v_obj := (p_sol ->> 'valor')::numeric;
    v_tol := coalesce((p_sol ->> 'tolerancia')::numeric, abs(v_obj) * 0.01);
    v_ok := v_val is not null and v_obj is not null and abs(v_val - v_obj) <= v_tol;
    v_par := case when v_ok then 1 else 0 end;
    -- El error más común en un cálculo ambiental no es de razonamiento: es de
    -- unidades. Un resultado corrido una potencia de diez se dice como tal.
    if not v_ok and v_val is not null and v_val <> 0 and v_obj <> 0 then
      v_r := abs(v_val / v_obj);
      if v_r between 9.5 and 10.5 or v_r between 95 and 105 or v_r between 950 and 1050
         or v_r between 0.095 and 0.105 or v_r between 0.0095 and 0.0105
         or v_r between 0.00095 and 0.00105 then
        v_nota := 'Tu número está corrido una potencia de diez: el razonamiento va bien, revisá las unidades.';
      end if;
    end if;
    v_cruda := jsonb_build_object('valor', v_obj, 'unidad', p_pub ->> 'unidad');

  elsif p_tipo = 'estimar' then
    begin v_val := (p_resp ->> 'valor')::numeric; exception when others then v_val := null; end;
    v_obj := (p_sol ->> 'valor')::numeric;
    if v_val is null or v_obj is null or v_obj = 0 then
      v_ok := false; v_par := 0;
    elsif coalesce(p_sol ->> 'banda', 'lineal') = 'log' then
      -- En escala logarítmica lo que importa es el orden de magnitud: se mide
      -- el cociente, no la diferencia.
      if v_val <= 0 then v_ok := false; v_par := 0;
      else
        v_r := greatest(v_val, v_obj) / least(v_val, v_obj);
        if v_r <= 1.5 then v_ok := true; v_par := 1;
        elsif v_r <= 3 then v_ok := false; v_par := 0.5;
        else v_ok := false; v_par := 0; end if;
      end if;
    else
      v_r := abs(v_val - v_obj) / abs(v_obj);
      if v_r <= 0.15 then v_ok := true; v_par := 1;
      elsif v_r <= 0.40 then v_ok := false; v_par := 0.5;
      else v_ok := false; v_par := 0; end if;
    end if;
    v_cruda := jsonb_build_object('valor', v_obj, 'unidad', p_pub ->> 'unidad');

  else
    return jsonb_build_object('error', 'tipo_no_graduable');
  end if;

  -- La clave, en el espacio de tokens de esta entrega.
  if v_key is null or v_clave is null then
    v_clave_tok := null;
  elsif jsonb_typeof(v_clave) = 'array' then
    select coalesce(jsonb_agg(ac_ficha_token(p_pub, p_tipo, p_perm, x) order by o), '[]'::jsonb)
      into v_clave_tok
      from jsonb_array_elements_text(v_clave) with ordinality e(x, o);
  elsif p_tipo = 'emparejar' then
    -- izquierda (id estable, su texto ya está a la vista) → token de la derecha
    select coalesce(jsonb_object_agg(key, ac_ficha_token(p_pub, p_tipo, p_perm, value)), '{}'::jsonb)
      into v_clave_tok from jsonb_each_text(v_clave);
  elsif p_tipo = 'clasificar' then
    -- token de la ficha → grupo (id estable, su nombre ya está a la vista)
    select coalesce(jsonb_object_agg(ac_ficha_token(p_pub, p_tipo, p_perm, key), value), '{}'::jsonb)
      into v_clave_tok from jsonb_each_text(v_clave);
  end if;

  if p_tipo = 'ranking' and p_sol ? 'valores' then
    select coalesce(jsonb_object_agg(ac_ficha_token(p_pub, p_tipo, p_perm, key), value), '{}'::jsonb)
      into v_revela from jsonb_each_text(p_sol -> 'valores');
  end if;

  return jsonb_build_object(
    'correcto', v_ok,
    'parcial', round(v_par::numeric, 3),
    'clave', v_clave_tok,
    'clave_cruda', v_cruda,
    'revela', v_revela,
    'nota', v_nota);
end $fn$;

revoke all on function ac_fichas_de(text) from public, anon, authenticated;
revoke all on function ac_barajar_paso(jsonb, text, smallint[]) from public, anon, authenticated;
revoke all on function ac_ficha_id(jsonb, text, smallint[], text) from public, anon, authenticated;
revoke all on function ac_ficha_token(jsonb, text, smallint[], text) from public, anon, authenticated;
revoke all on function ac_corregir(text, jsonb, jsonb, smallint[], jsonb) from public, anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 9 · El cargador. El currículum se escribe en `scripts/academia-arbol/` y
--     entra acá como un JSON por unidad. Idempotente: reemplaza por slug y
--     retira (nunca borra) lo que ya no está en el archivo, así el historial
--     de respuestas no queda apuntando a nada.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function ac_cargar_rama(p jsonb)
returns void language plpgsql volatile security definer set search_path = public as $fn$
begin
  insert into ac_ramas (slug, es_tronco, nombre_es, bajada_es, sort_order)
  values (p ->> 'slug', coalesce((p ->> 'es_tronco')::boolean, false), p ->> 'nombre_es',
          p ->> 'bajada_es', coalesce((p ->> 'sort_order')::smallint, 0))
  on conflict (slug) do update set
    es_tronco = excluded.es_tronco, nombre_es = excluded.nombre_es,
    bajada_es = excluded.bajada_es, sort_order = excluded.sort_order;
end $fn$;

create or replace function ac_cargar_fuente(p jsonb)
returns void language plpgsql volatile security definer set search_path = public as $fn$
begin
  insert into ac_fuentes (slug, titulo, organizacion, url, publicado, licencia, contenido)
  values (p ->> 'slug', p ->> 'titulo', p ->> 'organizacion', p ->> 'url',
          p ->> 'publicado', p ->> 'licencia', p ->> 'contenido')
  on conflict (slug) do update set
    titulo = excluded.titulo, organizacion = excluded.organizacion, url = excluded.url,
    publicado = excluded.publicado, licencia = excluded.licencia,
    contenido = coalesce(excluded.contenido, ac_fuentes.contenido);
end $fn$;

create or replace function ac_cargar_unidad(p jsonb)
returns jsonb language plpgsql volatile security definer set search_path = public as $fn$
declare
  v_unidad uuid; v_leccion uuid; l jsonb; s jsonb;
  v_lecciones text[] := '{}'; v_pasos text[]; v_n_pasos int := 0;
begin
  insert into ac_unidades (slug, rama_slug, orden, nivel, titulo_es, bajada_es, objetivos_es,
                           repasa, requiere_tronco, fuentes, age_groups, status, updated_at)
  values (p ->> 'slug', p ->> 'rama', (p ->> 'orden')::smallint, (p ->> 'nivel')::smallint,
          p ->> 'titulo_es', p ->> 'bajada_es',
          coalesce(array(select jsonb_array_elements_text(p -> 'objetivos_es')), '{}'),
          coalesce(array(select jsonb_array_elements_text(p -> 'repasa')), '{}'),
          coalesce((p ->> 'requiere_tronco')::smallint, 1),
          coalesce(array(select jsonb_array_elements_text(p -> 'fuentes')), '{}'),
          coalesce(nullif(array(select jsonb_array_elements_text(p -> 'age_groups')), '{}'::text[]),
                   '{kid,teen,adult}'),
          'aprobado', now())
  on conflict (slug) do update set
    rama_slug = excluded.rama_slug, orden = excluded.orden, nivel = excluded.nivel,
    titulo_es = excluded.titulo_es, bajada_es = excluded.bajada_es,
    objetivos_es = excluded.objetivos_es, repasa = excluded.repasa,
    requiere_tronco = excluded.requiere_tronco, fuentes = excluded.fuentes,
    age_groups = excluded.age_groups, status = 'aprobado', updated_at = now()
  returning id into v_unidad;

  for l in select * from jsonb_array_elements(p -> 'lecciones') loop
    insert into ac_lecciones (slug, unidad_id, orden, tipo, titulo_es, bajada_es, minutos, status, updated_at)
    values (l ->> 'slug', v_unidad, (l ->> 'orden')::smallint, l ->> 'tipo', l ->> 'titulo_es',
            l ->> 'bajada_es', coalesce((l ->> 'minutos')::smallint, 7), 'aprobado', now())
    on conflict (slug) do update set
      unidad_id = excluded.unidad_id, orden = excluded.orden, tipo = excluded.tipo,
      titulo_es = excluded.titulo_es, bajada_es = excluded.bajada_es,
      minutos = excluded.minutos, status = 'aprobado', updated_at = now()
    returning id into v_leccion;
    v_lecciones := v_lecciones || (l ->> 'slug');

    v_pasos := '{}';
    for s in select * from jsonb_array_elements(l -> 'pasos') loop
      insert into ac_pasos (slug, leccion_id, orden, grupo, tipo, payload_publico, solucion,
                            dificultad, concepto, repasable, age_groups, status, updated_at)
      values (s ->> 'slug', v_leccion, (s ->> 'orden')::smallint, s ->> 'grupo', s ->> 'tipo',
              s -> 'payload', coalesce(s -> 'solucion', '{}'::jsonb),
              coalesce((s ->> 'dificultad')::smallint, 2), s ->> 'concepto',
              coalesce((s ->> 'repasable')::boolean, true),
              coalesce(nullif(array(select jsonb_array_elements_text(s -> 'age_groups')), '{}'::text[]),
                       nullif(array(select jsonb_array_elements_text(p -> 'age_groups')), '{}'::text[]),
                       '{kid,teen,adult}'),
              'aprobado', now())
      on conflict (slug) do update set
        leccion_id = excluded.leccion_id, orden = excluded.orden, grupo = excluded.grupo,
        tipo = excluded.tipo, payload_publico = excluded.payload_publico,
        solucion = excluded.solucion, dificultad = excluded.dificultad,
        concepto = excluded.concepto, repasable = excluded.repasable,
        age_groups = excluded.age_groups, status = 'aprobado', updated_at = now();
      v_pasos := v_pasos || (s ->> 'slug');
      v_n_pasos := v_n_pasos + 1;
    end loop;

    update ac_pasos set status = 'retirado', updated_at = now()
     where leccion_id = v_leccion and not (slug = any(v_pasos)) and status <> 'retirado';
  end loop;

  update ac_lecciones set status = 'retirado', updated_at = now()
   where unidad_id = v_unidad and not (slug = any(v_lecciones)) and status <> 'retirado';

  return jsonb_build_object('unidad', p ->> 'slug', 'lecciones', array_length(v_lecciones, 1),
                            'pasos', v_n_pasos);
end $fn$;

-- Una unidad que desaparece del currículum se retira entera. Recibe la lista
-- completa de slugs vigentes y retira el resto.
create or replace function ac_retirar_unidades_fuera(p_vigentes text[])
returns int language plpgsql volatile security definer set search_path = public as $fn$
declare v_n int;
begin
  update ac_unidades set status = 'retirado', updated_at = now()
   where not (slug = any(p_vigentes)) and status <> 'retirado';
  get diagnostics v_n = row_count;
  return v_n;
end $fn$;

revoke all on function ac_cargar_rama(jsonb) from public, anon, authenticated;
revoke all on function ac_cargar_fuente(jsonb) from public, anon, authenticated;
revoke all on function ac_cargar_unidad(jsonb) from public, anon, authenticated;
revoke all on function ac_retirar_unidades_fuera(text[]) from public, anon, authenticated;
