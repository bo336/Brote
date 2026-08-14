-- Brote — 0033 — "Aprendé": interactive lessons (F15.17).
-- Mirrors live migration 0041_learning_schema plus the content seed.
--
-- SHAPE: a lesson is a small ordered deck of steps. A step is one card, and
-- `kind` decides how `payload` is read:
--     info      { body, highlight? }
--     quiz      { question, options[], correct, explain }
--     truefalse { statement, answer, explain }
-- Content lives in the database so it can be corrected and extended without a
-- deploy, and so it can be age-gated per lesson like everything else.
--
-- PROGRESSION: levels open once ~60% of the previous level is passed. Enough
-- shape to feel like a path, never a hard wall.
--
-- SCORING: pass at 60%. Points are awarded ONCE, the first time you pass —
-- retaking is encouraged for learning but must not become a points farm, and
-- that rule is enforced in complete_lesson() rather than in the UI.
--
-- DELIBERATELY NOT written to activity_completions: finishing a lesson is not
-- a real-world action, so it must never inflate the impact figures. XP is
-- credited directly instead.

create table if not exists lessons (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title_es text not null,
  summary_es text not null,
  domain_slug text not null,
  level smallint not null default 1,
  sort_order smallint not null default 0,
  minutes smallint not null default 3,
  reward_points int not null default 150,
  age_groups text[] not null default '{kid,teen,adult}',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists lesson_steps (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references lessons(id) on delete cascade,
  sort_order smallint not null,
  kind text not null check (kind in ('info','quiz','truefalse')),
  payload jsonb not null,
  unique (lesson_id, sort_order)
);

create table if not exists user_lessons (
  user_id uuid not null references profiles(id) on delete cascade,
  lesson_id uuid not null references lessons(id) on delete cascade,
  best_score smallint not null default 0,
  attempts smallint not null default 0,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

alter table lessons enable row level security;
alter table lesson_steps enable row level security;
alter table user_lessons enable row level security;

-- learning_path(), lesson_detail() and complete_lesson() are applied live in
-- migration 0041; see it for the authoritative bodies.
--
-- Seeded content: 10 lessons / 47 steps across three levels —
--   L1  el agua invisible · qué pasa con lo que tirás · consumo fantasma ·
--       efecto invernadero
--   L2  reciclar bien · qué mueve tu huella de transporte · huella de la comida
--   L3  detectar greenwashing · biodiversidad · economía circular
-- Every question explains itself on BOTH a right and a wrong answer, because
-- the explanation is the actual content rather than a reward.
