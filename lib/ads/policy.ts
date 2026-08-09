/**
 * Ad policy engine (PLAN F13.2).
 *
 * Every decision about advertising in Brote is made here — whether a given
 * user may see ads at all, which surfaces carry them, and how often. Putting
 * it in one pure module means the rules can be read, reasoned about and
 * audited, instead of being scattered through components.
 *
 * The rules are deliberately conservative. Ad revenue is worth nothing if it
 * costs retention or the AdSense account.
 */

export type AccountType = 'kid' | 'teen' | 'adult';

/** Where an ad may appear. Anything not listed here must never carry ads. */
export type Placement =
  | 'news-feed' // between items in the Novedades list
  | 'news-article' // under the body of an article you finished reading
  | 'ranking-footer' // under the leaderboard
  | 'catalog-footer' // under the Acciones catalogue
  | 'moment'; // full-width card at a natural stopping point

export interface AdContext {
  isPro: boolean;
  accountType: AccountType;
  onboarded: boolean;
  /** Ad-personalization consent: null = not asked yet. */
  adsConsent: boolean | null;
  /** When the account was created (ISO) — used for the new-user grace period. */
  memberSince?: string | null;
}

export interface AdDecision {
  show: boolean;
  /** Personalized ads require explicit opt-in; otherwise we request NPA. */
  personalized: boolean;
  /** Present when show === false, for logging/debugging (never shown to users). */
  reason?: string;
}

/**
 * Days a brand-new account is left completely ad-free.
 *
 * The first days decide whether someone keeps the app. Showing ads before the
 * habit exists trades a few cents for a churned user, which is a bad trade.
 */
export const NEW_USER_GRACE_DAYS = 2;

/** Ads are never allowed on these surfaces, regardless of anything else. */
export const NEVER_ADS_ROUTES = [
  '/onboarding',
  '/auth',
  '/brote-plus', // never advertise on the page selling the ad-free plan
  '/instalar',
  '/perfil/pip',
];

/** The core loop stays clean: the world, the daily set and celebrations. */
export function routeAllowsAds(pathname: string): boolean {
  if (NEVER_ADS_ROUTES.some((p) => pathname.startsWith(p))) return false;
  // Home is the world + daily set: the heart of the product, kept ad-free.
  if (pathname === '/') return false;
  return true;
}

/**
 * The single gate. Returns whether this user may be shown an ad right now and
 * whether it may be personalized.
 */
export function decideAds(ctx: AdContext): AdDecision {
  // 1. Paying users never see advertising. This is the product promise.
  if (ctx.isPro) return { show: false, personalized: false, reason: 'pro' };

  // 2. Children are never shown ads. Child-directed traffic cannot receive
  //    personalized ads (COPPA / GDPR-K), and rather than risk mis-tagging we
  //    simply do not monetise minors under 13 at all.
  if (ctx.accountType === 'kid') return { show: false, personalized: false, reason: 'kid-account' };

  // 3. Nothing until the person has actually set the app up.
  if (!ctx.onboarded) return { show: false, personalized: false, reason: 'not-onboarded' };

  // 4. New-user grace period.
  if (ctx.memberSince) {
    const days = (Date.now() - new Date(ctx.memberSince).getTime()) / 86_400_000;
    if (days < NEW_USER_GRACE_DAYS) return { show: false, personalized: false, reason: 'new-user-grace' };
  }

  // 5. Teens may see ads, but never personalized ones.
  const personalized = ctx.accountType === 'adult' && ctx.adsConsent === true;
  return { show: true, personalized };
}

// ── Frequency caps ──────────────────────────────────────────────────────────

export interface PlacementRule {
  /** Max units rendered per page view / list render. */
  maxPerView: number;
  /** For in-feed placements: insert one ad every N content items. */
  everyNItems?: number;
  /** Don't place an ad before this many items have been shown. */
  minItemsBefore?: number;
}

export const PLACEMENT_RULES: Record<Placement, PlacementRule> = {
  // One ad after the 4th story, then every 6th — enough to monetise a long
  // scroll without the feed feeling like a billboard.
  'news-feed': { maxPerView: 3, everyNItems: 6, minItemsBefore: 4 },
  'news-article': { maxPerView: 1 },
  'ranking-footer': { maxPerView: 1 },
  'catalog-footer': { maxPerView: 1 },
  moment: { maxPerView: 1 },
};

/** Indices in a list where an in-feed ad should be inserted. */
export function feedAdIndices(itemCount: number, placement: Placement = 'news-feed'): number[] {
  const rule = PLACEMENT_RULES[placement];
  const every = rule.everyNItems ?? 0;
  const first = rule.minItemsBefore ?? 0;
  if (!every || itemCount <= first) return [];
  const out: number[] = [];
  for (let i = first; i < itemCount && out.length < rule.maxPerView; i += every) out.push(i);
  return out;
}

// ── The "moment" interstitial ───────────────────────────────────────────────

/**
 * A moment ad is a full-width card shown at a natural pause — the user's
 * example: after closing the third article they read. It is deliberately NOT
 * a pop-over that blocks content, because interstitials that interrupt
 * navigation are both hostile and a Google policy risk.
 */
export const MOMENT_RULES = {
  /** How many "closes" before the first moment ad in a session. */
  triggerAfterCloses: 3,
  /** Never more than this many per session. */
  maxPerSession: 1,
  /** Minimum time between two moment ads, in minutes (across sessions). */
  minMinutesBetween: 20,
  /** Sessions the user must have had before moments start at all. */
  minSessions: 2,
} as const;

export interface MomentState {
  /** Article/detail closes counted in this session. */
  closes: number;
  /** Moments already shown this session. */
  shownThisSession: number;
  /** Epoch ms of the last moment ad, across sessions. */
  lastShownAt: number | null;
  /** How many sessions this user has opened (persisted). */
  sessions: number;
}

export const EMPTY_MOMENT_STATE: MomentState = { closes: 0, shownThisSession: 0, lastShownAt: null, sessions: 0 };

/** Pure decision: given the state and the gate, should a moment ad fire now? */
export function shouldShowMoment(state: MomentState, decision: AdDecision): boolean {
  if (!decision.show) return false;
  if (state.sessions < MOMENT_RULES.minSessions) return false;
  if (state.shownThisSession >= MOMENT_RULES.maxPerSession) return false;
  if (state.closes < MOMENT_RULES.triggerAfterCloses) return false;
  if (state.lastShownAt) {
    const mins = (Date.now() - state.lastShownAt) / 60_000;
    if (mins < MOMENT_RULES.minMinutesBetween) return false;
  }
  return true;
}
