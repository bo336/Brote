# 12 — Savia, Semillas and Brote+

> Daily limits and rewards. Two hard requirements from the brief: **limited attempts per day unless the user has Brote+**, and **a small amount of semillas per lesson completed**.

---

## 1. Savia — the daily limiter

### Why not hearts

Hearts (or any meter that drains on **wrong answers**) punish the exact behaviour learning requires. They are also the most recognisable piece of a competitor's expression. Brote's limiter drains on **effort spent**, not on **mistakes made**.

> **Savia** is the sap that rises through the tree. You have a certain amount each day. Starting a hoja spends some. It comes back overnight, and you can earn more by doing something real.

### Rules

| | Free | Brote+ |
|---|---|---|
| Savia máxima | **5** | ∞ (meter hidden entirely) |
| Cost of starting a hoja | 1 | 0 |
| Cost of a `riego` (review) session | **0** | 0 |
| Cost of a wrong answer | **0** | 0 |
| Refill | Full reset at local midnight (user's `profiles.timezone`) | — |
| Earn +1 | Completing any real action via `complete_activity` (max **+2**/day) | — |
| Earn +2 | Optional rewarded video (max **1**/day, only where `ads_enabled` and the user is 13+ and consented) | — |
| Hard daily ceiling | **9 hojas** (5 base + 2 action + 2 ad) | none |

Four consequences worth stating explicitly, because they are the design:

1. **Review is always free.** A user who has run out of savia can still water their wilted gajos. The limiter never blocks retention, only new territory. This is both better pedagogy and a much softer paywall.
2. **The limiter is a bridge to the core loop.** Running out nudges you toward doing a real environmental action, not toward the store. That is the right nudge for this app, and it is the strongest possible answer to "is this monetisation ethical".
3. **Mistakes are free.** Say so in the UI, once, in the empty state: *"Equivocarte no cuesta savia. Para eso está."*
4. **Kids never see an ad path.** `account_type = 'kid'` → the rewarded-video route does not exist. COPPA-adjacent surfaces are the ones to be conservative about.

### Empty state

When savia hits 0, do **not** show a hard wall. Show, in this order:

1. *"Se te terminó la savia por hoy. Vuelve a subir a la medianoche."* + a live countdown.
2. **Regar** — the wilted gajos, free, right there. (Primary CTA.)
3. **Una acción real** — a suggested `activity` worth +1 savia. (Secondary CTA.)
4. **Brote+** — a single calm line, never a full-screen interstitial, never more than once per day.

### Implementation

Server-authoritative, single atomic statement, timezone-correct from `profiles.timezone` — never a client-supplied date:

```sql
insert into ac_uso_diario (user_id, dia_local, hojas, savia_extra)
values (uid, dia, 1, 0)
on conflict (user_id, dia_local)
  do update set hojas = ac_uso_diario.hojas + 1
  where ac_uso_diario.hojas < (5 + ac_uso_diario.savia_extra)
returning hojas into n;
-- n is null  ⇒  the WHERE failed  ⇒  out of savia
```

`brote_is_pro(uid)` short-circuits the whole check. No client write policy on `ac_uso_diario`; all mutation through `security definer` functions. Savia is consumed at `academia_start_session`, **not** at finish — otherwise abandoning sessions is free and the limit is meaningless. A session abandoned within 60 seconds and with zero answers refunds its savia (a mis-tap should not cost a fifth of the day).

---

## 2. Semillas — the reward

Semillas already exist: `profiles.semillas`, `semilla_ledger`, `brote_grant_semillas()`, `cosmetics` / `buy_cosmetic()`. The Academia becomes a new **source**, not a new currency. Every grant goes through `brote_grant_semillas(uid, amount, 'academia', ref, note_es)` so the ledger stays the single source of truth.

### Grants

| Event | Semillas | Conditions |
|---|---|---|
| First clear of a hoja at ≥70% | **2** | Once per hoja, ever. |
| …with ≥90% first-try accuracy | **+1** | Same clear only. |
| Completing a gajo (all hojas ≥70%) | **10** | Once per gajo per anillo. |
| Completing a rama within an anillo | **40** | Once per rama per anillo. |
| Watering: taking a `marchito` gajo back to `frondoso` | **3** | Max once per gajo per **7 days**. |
| Repeating an already-cleared hoja | **0** | XP only. |

**Daily cap from the Academia: 15 semillas.** Server-enforced by summing today's `semilla_ledger` rows with `source = 'academia'` before granting. Without a cap the tree becomes a semilla farm and the cosmetics economy dies.

### XP (puntos)

XP is the app's main currency and stays generous, because it feeds ranks, leagues and the world:

- Per graded step answered: **8 XP** (correct) / **3 XP** (wrong — you still practised).
- Hoja completed at ≥70%: **+60 XP**, plus **+40** for a first clear.
- Riego session completed: **+35 XP**.
- No streak multiplier on Academia XP (streak multipliers belong to real actions — keep the ranking meaningful). Academia XP **does** count toward the weekly league, and Academia activity **does** keep the daily streak alive.

### The economy invariant

> Everything buyable with money must also be earnable by playing, slowly. Nothing buyable with money may be required to learn.

Brote+ buys **unlimited savia** and cosmetics. It never buys a better explanation, an easier item, exclusive conceptos, or faster mastery. Repeat this sentence in the Brote+ copy — it is a genuine differentiator and it is true.

---

## 3. Anti-abuse

All of these are server-side, none are optional:

- Semillas only on **first clear**, verified against `ac_user_hoja.completed_at`, not against a client claim.
- Daily semilla cap per source, checked inside the same transaction as the grant.
- A session cannot be finished unless every delivery it contains was graded through `academia_answer` (count check in `academia_finish_session`).
- Deliveries are single-use (`update … where answered_at is null`) and expire after 45 minutes.
- Grading before 600 ms after issue: accepted, but flagged. Three flags in a session → the session awards XP but **no semillas**, silently. Never accuse a user in the UI.
- The savia counter is read from the server on every session start; the client's copy is a display cache only.
- Rewarded-video credit is granted only from a server-verified ad callback, never from a client "I watched it" call.

---

## 4. Brote+ integration

The existing `/brote-plus` page and `mp-subscribe` edge function already handle checkout. The Academia adds exactly two touch points, and no more:

1. A **savia meter** in the Academia header. For Brote+ users it is replaced by a small `Brote+` chip — the absence of a meter *is* the benefit, and hiding it is the reward.
2. The savia-empty state's third option (§1), which is one calm line linking to `/brote-plus`.

Add "**Savia ilimitada en la Academia**" to the Brote+ benefits list in `docs/MONETIZACION.md` and on `/brote-plus`. Do not gate content, do not add an interstitial, do not add a second upsell surface. The rule from `docs/MONETIZACION.md` stands: *paywall del core loop = nunca*.
