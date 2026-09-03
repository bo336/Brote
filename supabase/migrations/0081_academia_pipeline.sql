-- ─────────────────────────────────────────────────────────────────────────────
-- 0081 · La Academia, fase 3 — el esquema del motor infinito.
--
-- El pack numera esta migración 0040. El repo ya iba por 0080, así que se sigue
-- la numeración real: secuencial y nunca reusada. Y va partida en dos archivos
-- (esquema acá, funciones en 0082) por el mismo motivo que la fase 1: aplicar
-- dos mil líneas de una sola vez por un canal remoto es exactamente el fallo
-- parcial que la idempotencia intenta evitar.
--
-- Lo que se agrega:
--   · pgvector y una columna de embedding en ac_items, para el deduplicado.
--   · La cola de generación por lote, con clave de idempotencia única — que es
--     lo que hace que reintentar a ciegas sea inofensivo.
--   · El presupuesto mensual, que se consulta ANTES de enviar. Cuando se agota,
--     la generación para y lo registra; nunca baja una compuerta para seguir.
--   · La cola de revisión humana, con códigos de motivo. Los códigos no son
--     decoración: son los datos de entrenamiento de la próxima versión del
--     prompt, y por eso se guardan y se cuentan.
--   · Las propuestas de currículum, que nacen `propuesto` y son invisibles.
--
-- Idempotente. RLS en todo. Nada se borra.
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists vector with schema extensions;

-- ── 1 · Embeddings para deduplicar ───────────────────────────────────────────
--
-- 768 dimensiones = text-embedding-004 de Gemini. El deduplicado compara
-- CONCEPTO+TIPO, nunca el catálogo entero: dos ítems parecidos de conceptos
-- distintos no son duplicados, son analogía.
--
-- `<=>` es DISTANCIA coseno. La similitud es `1 - (a <=> b)`. Confundirlas
-- invierte la compuerta y deja pasar exactamente lo que tenía que frenar.

alter table ac_items add column if not exists embedding extensions.vector(768);
alter table ac_items add column if not exists embedding_at timestamptz;

-- ivfflat necesita filas para entrenar las listas; con el catálogo actual
-- (5.638 ítems) 32 listas es la escala razonable. Se crea igual: sin índice la
-- búsqueda es secuencial y correcta, solo más lenta.
do $$
begin
  if not exists (select 1 from pg_class where relname = 'ac_items_embedding_idx') then
    begin
      create index ac_items_embedding_idx on ac_items
        using ivfflat (embedding extensions.vector_cosine_ops) with (lists = 32);
    exception when others then
      -- Sin filas con embedding todavía, ivfflat puede negarse. No es fatal.
      raise notice 'ac_items_embedding_idx no se pudo crear todavía: %', sqlerrm;
    end;
  end if;
end $$;

-- ── 2 · La cola de generación ────────────────────────────────────────────────

create table if not exists ac_generacion_solicitudes (
  id               uuid primary key default gen_random_uuid(),
  -- sha256(model_version || prompt_version || concepto || tipo || params || seed).
  -- Único: una re-corrida ciega de un lote fallido es un no-op, y esa es la
  -- propiedad que hace que los reintentos sean seguros.
  idempotency_key  text not null,
  -- Id del lote del lado de Gemini. Null hasta que se envía.
  batch_id         text,
  concepto_id      uuid references ac_conceptos(id) on delete cascade,
  -- Null en las propuestas de currículum: esas no son de un concepto.
  tipo             ac_tipo_ejercicio,
  clase            text not null default 'item'
                   check (clase in ('item','plantilla','propuesta')),
  n_pedidos        smallint not null default 4,
  prompt_version   text not null,
  model_version    text not null,
  temperatura      real not null default 0.6,
  estado           text not null default 'pendiente'
                   check (estado in ('pendiente','enviado','recibido','ingerido','fallido','dead_letter')),
  -- Escalera de reintentos, tope 2: violación de esquema → prompt de reparación
  -- → regeneración completa a +0.2 de temperatura → carta muerta. Un tercer
  -- intento no sale nunca y solo quema presupuesto.
  intento          smallint not null default 0,
  request          jsonb,
  respuesta_cruda  jsonb,
  error            text,
  tokens_in        int not null default 0,
  tokens_out       int not null default 0,
  cost_cents       numeric(12,4) not null default 0,
  aceptados        smallint not null default 0,
  rechazados       smallint not null default 0,
  rechazos         jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now(),
  submitted_at     timestamptz,
  completed_at     timestamptz
);

create unique index if not exists ac_gen_solicitudes_idem_key
  on ac_generacion_solicitudes (idempotency_key);
create index if not exists ac_gen_solicitudes_estado
  on ac_generacion_solicitudes (estado, created_at desc);
create index if not exists ac_gen_solicitudes_batch
  on ac_generacion_solicitudes (batch_id) where batch_id is not null;

-- ── 3 · El presupuesto ───────────────────────────────────────────────────────
--
-- Una fila por mes. Se consulta ANTES de enviar y se decrementa al enviar. Si
-- el tope se alcanza, la generación se detiene y lo deja escrito: nunca baja
-- una compuerta ni acorta el prompt para seguir corriendo.

create table if not exists ac_generacion_presupuesto (
  mes              date primary key,
  tope_centavos    int not null default 2000,
  gastado_centavos numeric(12,4) not null default 0,
  solicitudes      int not null default 0,
  detenido_at      timestamptz,
  updated_at       timestamptz not null default now()
);

-- ── 4 · Las propuestas de currículum ─────────────────────────────────────────
--
-- Nacen `propuesto` y son invisibles: `academia_arbol` y `academia_start_session`
-- filtran por `status = 'aprobado'` desde la fase 1, así que esto no necesita
-- ningún filtro nuevo — necesita NO tocar el que ya existe.

create table if not exists ac_propuestas (
  id             uuid primary key default gen_random_uuid(),
  rama_slug      text not null references ac_ramas(slug) on delete cascade,
  anillo         smallint not null,
  -- Quién la disparó al cerrar un anillo. Solo para no volver a pedir lo mismo.
  disparada_por  uuid references profiles(id) on delete set null,
  payload        jsonb not null,
  problemas      text[] not null default '{}',
  prompt_version text,
  model_version  text,
  estado         text not null default 'propuesto'
                 check (estado in ('propuesto','aprobado','rechazado','aplicada')),
  motivo_rechazo text,
  created_at     timestamptz not null default now(),
  resuelta_at    timestamptz,
  aplicada_at    timestamptz
);

create index if not exists ac_propuestas_estado on ac_propuestas (estado, created_at desc);
create unique index if not exists ac_propuestas_abierta
  on ac_propuestas (rama_slug, anillo) where estado = 'propuesto';

-- ── 5 · La cola de revisión ──────────────────────────────────────────────────
--
-- `motivos` dice POR QUÉ llegó acá (juez, auditoría del 5 %, sensible, kid,
-- propuesta). `motivo_rechazo` dice por qué se rechazó, y ESE es el que importa
-- después: es el dato de entrenamiento de la próxima revisión del prompt.

create table if not exists ac_revision_cola (
  id             uuid primary key default gen_random_uuid(),
  clase          text not null check (clase in ('item','plantilla','propuesta')),
  item_id        uuid references ac_items(id) on delete cascade,
  plantilla_id   uuid references ac_plantillas(id) on delete cascade,
  propuesta_id   uuid references ac_propuestas(id) on delete cascade,
  solicitud_id   uuid references ac_generacion_solicitudes(id) on delete set null,
  motivos        text[] not null default '{}',
  juez           jsonb,
  afirmaciones   jsonb,
  prioridad      smallint not null default 5,
  estado         text not null default 'pendiente'
                 check (estado in ('pendiente','aprobado','editado','rechazado')),
  motivo_rechazo text,
  nota           text,
  revisado_at    timestamptz,
  created_at     timestamptz not null default now(),
  -- Exactamente uno de los tres objetivos.
  constraint ac_revision_un_objetivo check (
    (item_id is not null)::int + (plantilla_id is not null)::int + (propuesta_id is not null)::int = 1
  )
);

create index if not exists ac_revision_pendientes
  on ac_revision_cola (estado, prioridad, created_at) where estado = 'pendiente';
create unique index if not exists ac_revision_item_unico
  on ac_revision_cola (item_id) where item_id is not null and estado = 'pendiente';

-- ── 6 · Los códigos de rechazo ───────────────────────────────────────────────
--
-- Tabla y no enum: la lista va a crecer con lo que se aprenda revisando, y un
-- enum nuevo cada vez es una migración cada vez.

create table if not exists ac_motivos_rechazo (
  codigo      text primary key,
  etiqueta_es text not null,
  descripcion text
);

insert into ac_motivos_rechazo (codigo, etiqueta_es, descripcion) values
  ('dato_incorrecto',   'Dato incorrecto',        'La afirmación no es cierta o está desactualizada.'),
  ('sin_respaldo',      'No lo dice la fuente',   'La cita no sostiene lo que el ítem afirma.'),
  ('ambiguo',           'Más de una correcta',    'Hay otra opción defendible.'),
  ('distractor_obvio',  'Distractores obvios',    'Se contesta sin saber el tema.'),
  ('distractor_absurdo','Distractores absurdos',  'Ninguna persona los elegiría.'),
  ('nivel_lectura',     'Lenguaje fuera de nivel','No corresponde a la edad declarada.'),
  ('tono',              'Tono equivocado',        'Culpa, catástrofe o reto en segunda persona.'),
  ('sesgo_regional',    'Solo sirve en Buenos Aires', 'Asume un contexto que no es general.'),
  ('duplicado',         'Repetido',               'Ya existe algo equivalente.'),
  ('mal_formado',       'Mal armado',             'El payload no se puede jugar.'),
  ('fuera_de_concepto', 'No enseña el concepto',  'Mide otra cosa.'),
  ('otro',              'Otro',                   'Explicado en la nota.')
on conflict (codigo) do nothing;

-- ── 7 · Bandits por (concepto, tipo) ─────────────────────────────────────────
--
-- Beta-Bernoulli con posteriores decaídos. Se agrupa entre personas: un bandit
-- por persona nunca sale de la etapa de exploración. La tabla existe y se
-- alimenta desde el primer día aunque el muestreo se encienda después: sin el
-- registro no hay nada que aprender más adelante.

create table if not exists ac_bandit_tipo (
  concepto_id uuid not null references ac_conceptos(id) on delete cascade,
  tipo        ac_tipo_ejercicio not null,
  alfa        real not null default 1.0,
  beta        real not null default 1.0,
  vistas      int  not null default 0,
  updated_at  timestamptz not null default now(),
  primary key (concepto_id, tipo)
);

-- ── 8 · RLS ──────────────────────────────────────────────────────────────────
--
-- Todo esto es maquinaria interna. Nadie lo lee desde el cliente: se llega por
-- los RPC `academia_admin_*`, que son `security definer` y piden contraseña.
-- RLS activa y SIN política, más revocación explícita — el mismo patrón que las
-- cinco tablas secretas de la fase 1.

alter table ac_generacion_solicitudes enable row level security;
alter table ac_generacion_presupuesto enable row level security;
alter table ac_revision_cola          enable row level security;
alter table ac_propuestas             enable row level security;
alter table ac_motivos_rechazo        enable row level security;
alter table ac_bandit_tipo            enable row level security;

revoke all on table ac_generacion_solicitudes from anon, authenticated;
revoke all on table ac_generacion_presupuesto from anon, authenticated;
revoke all on table ac_revision_cola          from anon, authenticated;
revoke all on table ac_propuestas             from anon, authenticated;
revoke all on table ac_motivos_rechazo        from anon, authenticated;
revoke all on table ac_bandit_tipo            from anon, authenticated;

-- ── 9 · Ajustes nuevos ───────────────────────────────────────────────────────
--
-- Todos aparecen solos en /panel: esa pantalla dibuja cualquier `app_settings`
-- booleano o numérico, así que agregar un interruptor server-side no necesita
-- tocar la UI.

insert into app_settings (key, value, description) values
  ('academia_pool_piso', '40'::jsonb,
   'Ítems aprobados mínimos por (concepto, tipo) antes de pedir generación.'),
  ('academia_anillo_techo', '6'::jsonb,
   'Anillo máximo que puede proponer la expansión de currículum.'),
  ('academia_presupuesto_centavos', '2000'::jsonb,
   'Tope mensual de generación, en centavos de dólar. Al llegar, la generación se detiene.'),
  ('academia_dedupe_umbral', '0.93'::jsonb,
   'Similitud coseno a partir de la cual un ítem generado se considera repetido.')
on conflict (key) do nothing;

-- La descripción vieja mentía: la pantalla anterior se retiró en la fase 2.
update app_settings
   set description = 'Sección Academia (El Bosque) activa. En false, /aprender muestra una pausa.'
 where key = 'academia_enabled';

update app_settings
   set description = 'Pipeline de generación con Gemini. Apagarlo detiene la generación sin deploy.'
 where key = 'academia_generacion_enabled';
