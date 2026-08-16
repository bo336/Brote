-- Brote — 0036 — Simplify project points; leave-project fix; explore listing leave button.
-- Mirrors live migration 0051_simplify_project_points (name: simplify_project_points).

-- ── ONE MECHANISM, NOT TWO ──────────────────────────────────────────────────
-- Projects had two separate ways to pay participants for showing up:
--   · "Cerrar acción grupal" — one-shot, closes the whole project, points
--     scaled by a turnout bonus (x1.25 → x3).
--   · Jornadas ("cerrar jornada") — repeatable per phase, ALSO scaled by a
--     turnout bonus, plus a per-project session_points base that nothing in
--     the UI ever let an organiser actually set.
-- Two buttons that both "give everyone points" with different curves is a
-- trap for organisers and unreadable for participants. Removed the group
-- action entirely (function dropped, button and client call removed) and
-- collapsed jornadas to ONE fixed, admin-set amount per person — same
-- regardless of the project, the headcount, or anything else. Tunable from
-- /panel ("Puntos por jornada") without a deploy.

insert into app_settings (key, value, description)
values ('session_points_universal', to_jsonb(120),
        'Puntos fijos por persona al cerrar una jornada. Mismo valor para todos los proyectos.')
on conflict (key) do nothing;

-- complete_project_session() now reads session_points_universal and ignores
-- both v_proj.session_points and the old turnout-multiplier curve. Full body
-- applied live in 0051; see app/(app)/explorar/proyectos/[id]/page.tsx for
-- the client side.

drop function if exists public.complete_group_action(uuid);

-- ── LEAVE-PROJECT BUG ───────────────────────────────────────────────────────
-- The project detail page had two `p.joined ? ... : p.joined ? ...` branches:
-- the first (a disabled "already joined" pill) always matched first, so the
-- second branch — the actual "Salir del proyecto" button — was dead code and
-- could never render. Collapsed to one condition, gated additionally on not
-- being the creator (organisers can't leave their own project; leave_project()
-- already enforced that server-side with a friendly error, the UI just never
-- reached it). A matching leave button was also added to the project card on
-- the Explorar LISTING itself, not just the detail page, since that's the
-- surface most people browse from.
