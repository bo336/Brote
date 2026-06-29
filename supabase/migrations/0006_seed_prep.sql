-- ════════════════════════════════════════════════════════════════════════════
-- Brote — 0006 — Seed prep
-- ════════════════════════════════════════════════════════════════════════════

-- Allow official/seeded projects to exist without a user creator (their RLS
-- update/delete policies are creator-scoped, so they remain read-only seeds).
alter table projects alter column creator_id drop not null;
