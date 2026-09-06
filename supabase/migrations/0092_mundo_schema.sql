-- ============================================================================
-- MUNDO — el esquema de la isla jugable. Estrictamente aditivo.
--
-- Nada existente se borra ni se altera, salvo las once copias de
-- `ranks.unlock_description_es` al final (15-DATA-MODEL.md §5), que son datos
-- y no esquema.
--
-- NUMERACIÓN. La base viva llega hasta `0090_academia_cron_generacion`
-- (20260903051819). `0091_mundo_flag.sql` existe en el repo y **todavía no está
-- aplicada**, así que este archivo es 0092 y las dos hay que correrlas en
-- orden. `supabase db pull` **no se corrió**: lo que sabemos del esquema vivo
-- sale de consultarlo directo, y por eso cada sentencia acá es defensiva —
-- `if not exists`, `create or replace`, `on conflict` — como pide
-- 15-DATA-MODEL.md §0. Es segura de correr esté el repo al día o no.
--
-- Se parte en tres archivos porque uno solo pasa las 400 líneas
-- (`01-RULES.md` §3.2) y porque esquema, datos y funciones se revisan distinto:
--   0092 — tablas, RLS, copia de rangos, bucket
--   0093 — las 64 especies
--   0094 — las nueve RPC
-- ============================================================================

-- ---------------------------------------------------------------- user_world
create table if not exists public.user_world (
  user_id           uuid primary key references public.profiles(id) on delete cascade,
  seed              bigint      not null,
  spec_version      smallint    not null default 1,
  last_entered_at   timestamptz,
  last_snapshot_url text,
  celebrated_tier   smallint    not null default 0,
  celebrated_world  integer     not null default 0,
  settings          jsonb       not null default '{}'::jsonb,
  layouts           jsonb       not null default '[]'::jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on column public.user_world.spec_version is
  'Permite regenerar islas si cambia la generación, sin perder datos. Si queda atrás se rehace el layout y se CONSERVAN los placements, encajando los que hayan quedado fuera de terreno legal. Nunca se borra un placement.';
comment on column public.user_world.layouts is
  'Arreglos guardados, máximo 3 sin plan. Cada uno {name, placements[]}.';

-- ---------------------------------------------------------- world_placements
create table if not exists public.world_placements (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  prop_slug  text not null,
  region     text not null,
  x          real not null,
  z          real not null,
  rot_y      real not null default 0,
  variant    smallint not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists world_placements_user_idx on public.world_placements(user_id);

-- ------------------------------------------------------------- world_species
create table if not exists public.world_species (
  slug        text primary key,
  name_es     text not null,
  blurb_es    text not null,
  kind        text not null,
  region      text not null,
  min_tier    smallint not null default 1,
  time_of_day text[]   not null default '{dia}',
  rarity      smallint not null default 1,
  domain_slug text references public.domains(slug),
  active      boolean  not null default true
);

-- Los blurbs son de 12 a 18 palabras. Se comprueba, no se confía: la Bitácora
-- es el producto y una ficha de tres palabras no es una ficha.
alter table public.world_species drop constraint if exists world_species_blurb_len;
alter table public.world_species add constraint world_species_blurb_len
  check (array_length(regexp_split_to_array(btrim(blurb_es), '\s+'), 1) between 12 and 18);

-- ------------------------------------------------------------- world_journal
create table if not exists public.world_journal (
  user_id       uuid not null references public.profiles(id) on delete cascade,
  species_slug  text not null references public.world_species(slug),
  first_seen_at timestamptz not null default now(),
  region        text not null,
  time_of_day   text not null,
  count         integer not null default 1,
  primary key (user_id, species_slug)
);

-- --------------------------------------------------------------- world_daily
create table if not exists public.world_daily (
  user_id          uuid not null references public.profiles(id) on delete cascade,
  local_date       date not null,
  chores_done      smallint not null default 0,
  forage_done      smallint not null default 0,
  semillas_awarded integer  not null default 0,
  event_slug       text,
  event_done       boolean  not null default false,
  primary key (user_id, local_date)
);

-- --------------------------------------------------------------------- RLS
alter table public.user_world        enable row level security;
alter table public.world_placements  enable row level security;
alter table public.world_journal     enable row level security;
alter table public.world_daily       enable row level security;
alter table public.world_species     enable row level security;

drop policy if exists user_world_own on public.user_world;
create policy user_world_own on public.user_world
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists placements_own on public.world_placements;
create policy placements_own on public.world_placements
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists journal_own on public.world_journal;
create policy journal_own on public.world_journal
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists daily_own on public.world_daily;
create policy daily_own on public.world_daily
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists species_read on public.world_species;
create policy species_read on public.world_species
  for select to authenticated using (active);

-- Visitar la isla de otra persona lo sirve SOLO la RPC `world_snapshot_for`
-- (0094), nunca una policy de lectura. Así no hay forma de que se escape nada
-- más allá de tier / seed / paleta / placements / pip_style / nombre.

-- ------------------------------------------------------------------ Storage
-- Un bucket, lectura pública, ruta `<user_id>/poster.png`, se pisa en cada
-- visita. Si Storage no está disponible el póster cae al SVG para siempre: el
-- juego tiene que andar igual (15-DATA-MODEL.md §6).
insert into storage.buckets (id, name, public)
values ('world-snapshots', 'world-snapshots', true)
on conflict (id) do nothing;

drop policy if exists world_snapshots_read on storage.objects;
create policy world_snapshots_read on storage.objects
  for select using (bucket_id = 'world-snapshots');

drop policy if exists world_snapshots_write_own on storage.objects;
create policy world_snapshots_write_own on storage.objects
  for all to authenticated
  using (bucket_id = 'world-snapshots' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'world-snapshots' and (storage.foldername(name))[1] = auth.uid()::text);

-- ------------------------------------------------- La copia de los rangos
-- El único cambio a datos existentes. Hace que lo que la app ya promete y el
-- mundo que el jugador realmente recibe digan lo mismo
-- (08-WORLD-AND-PROGRESSION.md §3, 14-CONTENT.md §7).
update public.ranks set unlock_description_es = v.txt from (values
 ('semilla',    'Tu isla arranca: un claro de tierra, un sendero y Pip.'),
 ('brote',      'Sale el pasto y los primeros brotes. Ya podés regar.'),
 ('plantula',   'Aparecen las flores y las mariposas. Empezás la bitácora.'),
 ('retono',     'Tu primer árbol y una cornisa baja. Ya podés trepar.'),
 ('arbusto',    'Arbustos, moras y el primer nido. Ya podés recolectar.'),
 ('arbol',      'La copa se cierra. Casita en el árbol: ya podés planear y descansar.'),
 ('bosque',     'Nace el río y la laguna. Ya podés nadar y pescar.'),
 ('guardian',   'Se levanta el monte, con cuevas y cumbre. Ya podés escalar.'),
 ('ecosistema', 'Llega la nieve y la fauna de altura. Ya podés rastrear huellas.'),
 ('planeta',    'Aparece el islote y el telescopio. Ya podés navegar y observar.'),
 ('gaia',       'Todo florece en dorado. Ya podés sembrar en el mundo de otra persona.')
) as v(slug, txt) where ranks.slug = v.slug;
