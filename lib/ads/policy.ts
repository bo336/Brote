/**
 * Ad policy engine (PLAN F13.2, Publicidad v2 — 0134).
 *
 * Every decision about advertising in Brote is made here — whether a given
 * person may see ads at all, which surfaces carry them, which provider fills
 * each one, and how often. One pure module, so the rules can be read, tested
 * (`lib/ads/__tests__`) and audited instead of being scattered through
 * components.
 *
 * The numbers live in the database (`app_settings.publicidad_config`, edited
 * in /panel/publicidad) and arrive through `publicidad_estado()`. The values
 * below are the defaults used until that answer arrives, and the safe fallback
 * if it never does. The master switch (`ads_enabled`) wins over everything.
 *
 * The rules are deliberately conservative. Ad revenue is worth nothing if it
 * costs retention or the AdSense account.
 */

export type AccountType = 'kid' | 'teen' | 'adult';

/** Where an ad may appear. Anything not listed here must never carry ads. */
export type Placement =
  | 'news-feed' // between posts in the Plaza
  | 'news-article' // under the body of an article you finished reading
  | 'ranking-footer' // under the leaderboard
  | 'catalog-footer' // under the Acciones catalogue
  | 'guia' // under an action in the public guide (also for visitors without an account)
  | 'moment'; // card at a natural stopping point — DIRECT ads only (see below)

export const PLACEMENTS: Placement[] = ['news-feed', 'news-article', 'ranking-footer', 'catalog-footer', 'guia', 'moment'];

/** Who fills a placement. 'auto' = a direct sponsor if one is running, AdSense otherwise. */
export type Proveedor = 'auto' | 'adsense' | 'directo' | 'ninguno';

export interface ReglaUbicacion {
  activa: boolean;
  proveedor: Proveedor;
  /** In-feed only: first ad after this many items, then one every `cada`, at most `max`. */
  desde?: number;
  cada?: number;
  max?: number;
}

export interface ConfigPublicidad {
  /** Days a brand-new account is left completely ad-free. */
  dias_gracia: number;
  /** Max ad units rendered per person per day / per session (all placements together). */
  por_dia: number;
  por_sesion: number;
  momento: { activo: boolean; tras_cierres: number; min_minutos: number; min_sesiones: number };
  ubicaciones: Partial<Record<Placement, Partial<ReglaUbicacion>>>;
}

export const CONFIG_DEFECTO: ConfigPublicidad = {
  // The first days decide whether someone keeps the app. Ads before the habit
  // exists trade a few cents for a churned user.
  dias_gracia: 3,
  por_dia: 12,
  por_sesion: 5,
  momento: { activo: true, tras_cierres: 3, min_minutos: 30, min_sesiones: 3 },
  ubicaciones: {
    'news-feed': { activa: true, proveedor: 'auto', desde: 5, cada: 8, max: 3 },
    'news-article': { activa: true, proveedor: 'auto' },
    'ranking-footer': { activa: true, proveedor: 'auto' },
    'catalog-footer': { activa: true, proveedor: 'auto' },
    guia: { activa: true, proveedor: 'auto' },
    // AdSense policy: no Google ads in windows the person did not open. The
    // moment card floats over the screen, so it only ever carries our own
    // direct sponsors. Enforced here AND in `admin_publicidad_config`.
    moment: { activa: true, proveedor: 'directo' },
  },
};

/** Merge what the database says over the defaults, clamping anything odd. */
export function normalizarConfig(raw: unknown): ConfigPublicidad {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<ConfigPublicidad>;
  const num = (v: unknown, def: number, min: number, max: number) =>
    typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v))) : def;
  const ubic: ConfigPublicidad['ubicaciones'] = {};
  for (const p of PLACEMENTS) {
    const def = CONFIG_DEFECTO.ubicaciones[p]!;
    const got = (r.ubicaciones?.[p] ?? {}) as Partial<ReglaUbicacion>;
    let proveedor: Proveedor = (['auto', 'adsense', 'directo', 'ninguno'] as const).includes(got.proveedor as Proveedor)
      ? (got.proveedor as Proveedor)
      : (def.proveedor as Proveedor);
    if (p === 'moment' && (proveedor === 'auto' || proveedor === 'adsense')) proveedor = 'directo';
    ubic[p] = {
      activa: typeof got.activa === 'boolean' ? got.activa : (def.activa ?? true),
      proveedor,
      ...(def.cada !== undefined
        ? {
            desde: num(got.desde, def.desde ?? 5, 1, 50),
            cada: num(got.cada, def.cada ?? 8, 3, 50),
            max: num(got.max, def.max ?? 3, 0, 10),
          }
        : {}),
    };
  }
  const m = (r.momento ?? {}) as Partial<ConfigPublicidad['momento']>;
  return {
    dias_gracia: num(r.dias_gracia, CONFIG_DEFECTO.dias_gracia, 0, 30),
    por_dia: num(r.por_dia, CONFIG_DEFECTO.por_dia, 0, 50),
    por_sesion: num(r.por_sesion, CONFIG_DEFECTO.por_sesion, 0, 20),
    momento: {
      activo: typeof m.activo === 'boolean' ? m.activo : CONFIG_DEFECTO.momento.activo,
      tras_cierres: num(m.tras_cierres, CONFIG_DEFECTO.momento.tras_cierres, 1, 20),
      min_minutos: num(m.min_minutos, CONFIG_DEFECTO.momento.min_minutos, 5, 1440),
      min_sesiones: num(m.min_sesiones, CONFIG_DEFECTO.momento.min_sesiones, 1, 50),
    },
    ubicaciones: ubic,
  };
}

// ── Who may see ads ─────────────────────────────────────────────────────────

export interface AdContext {
  /** Master switch (`ads_enabled`). */
  globalEnabled: boolean;
  /** No account: a visitor of a public page (the guide). */
  anonymous?: boolean;
  isPro: boolean;
  accountType: AccountType;
  onboarded: boolean;
  /** Ad-personalization consent: null = not asked yet. */
  adsConsent: boolean | null;
  /** When the account was created (ISO) — used for the new-user grace period. */
  memberSince?: string | null;
  diasGracia?: number;
}

export interface AdDecision {
  show: boolean;
  /** Personalized ads require explicit opt-in; otherwise we request NPA. */
  personalized: boolean;
  /** Present when show === false, for logging/debugging (never shown to users). */
  reason?: string;
}

/** @deprecated kept for callers of v1; use `CONFIG_DEFECTO.dias_gracia`. */
export const NEW_USER_GRACE_DAYS = CONFIG_DEFECTO.dias_gracia;

/** Ads are never allowed on these surfaces, regardless of anything else. */
export const NEVER_ADS_ROUTES = [
  '/onboarding',
  '/auth',
  '/brote-plus', // never advertise on the page selling the ad-free plan
  '/instalar',
  '/perfil', // your profile, settings, stats and Pip are yours
  '/mundo', // the 3D world is the product
  '/panel',
  '/negocio', // the business workspace is a tool, not a feed
  '/notificaciones',
  '/aprender/sesion', // never in the middle of a lesson
  '/mercado', // ads competing with our own sellers make no sense
  '/proyectos/nuevo',
  '/certificados',
  '/legal',
  '/offline',
  '/vender',
  '/negocios',
];

/** The core loop stays clean: the world, the daily set and celebrations. */
export function routeAllowsAds(pathname: string): boolean {
  if (NEVER_ADS_ROUTES.some((p) => pathname === p || pathname.startsWith(`${p}/`) || pathname.startsWith(p))) return false;
  // Home is the world + daily set: the heart of the product, kept ad-free.
  if (pathname === '/') return false;
  return true;
}

/** Public pages a visitor without an account can see WITH ads. Only the guide. */
export function routeAllowsAnonymousAds(pathname: string): boolean {
  return pathname === '/guia' || pathname.startsWith('/guia/');
}

/**
 * The single gate. Returns whether this person may be shown an ad right now
 * and whether it may be personalized.
 */
export function decideAds(ctx: AdContext): AdDecision {
  // 0. The switch in the panel wins over everything.
  if (!ctx.globalEnabled) return { show: false, personalized: false, reason: 'disabled' };

  // A visitor without an account only ever gets non-personalized ads, and
  // only on the public guide (the caller checks the route).
  if (ctx.anonymous) return { show: true, personalized: false };

  // 1. Paying users never see advertising. This is the product promise.
  if (ctx.isPro) return { show: false, personalized: false, reason: 'pro' };

  // 2. Children are never shown ads. Child-directed traffic cannot receive
  //    personalized ads (COPPA / GDPR-K), and rather than risk mis-tagging we
  //    simply do not monetise minors under 13 at all.
  if (ctx.accountType === 'kid') return { show: false, personalized: false, reason: 'kid-account' };

  // 3. Nothing until the person has actually set the app up.
  if (!ctx.onboarded) return { show: false, personalized: false, reason: 'not-onboarded' };

  // 4. New-user grace period.
  const gracia = ctx.diasGracia ?? CONFIG_DEFECTO.dias_gracia;
  if (ctx.memberSince && gracia > 0) {
    const days = (Date.now() - new Date(ctx.memberSince).getTime()) / 86_400_000;
    if (days < gracia) return { show: false, personalized: false, reason: 'new-user-grace' };
  }

  // 5. Teens may see ads, but never personalized ones.
  const personalized = ctx.accountType === 'adult' && ctx.adsConsent === true;
  return { show: true, personalized };
}

/**
 * Which provider fills a placement right now, or null for nothing.
 * `hayDirecto`: a direct sponsor is running somewhere (from `publicidad_estado`);
 * `adsenseListo`: a publisher id and this placement's slot id are configured.
 */
export function proveedorPara(
  placement: Placement,
  config: ConfigPublicidad,
  opts: { hayDirecto: boolean; adsenseListo: boolean; anonymous?: boolean },
): 'adsense' | 'directo' | null {
  const regla = config.ubicaciones[placement];
  if (!regla?.activa) return null;
  const p = regla.proveedor ?? 'auto';
  if (p === 'ninguno') return null;
  // Direct sponsors are picked per person by the database; a visitor without
  // an account has no profile to match, so they only get AdSense.
  const directo = opts.hayDirecto && !opts.anonymous;
  if (placement === 'moment') return directo && (p === 'directo' || p === 'auto') ? 'directo' : null;
  if (p === 'directo') return directo ? 'directo' : null;
  if (p === 'adsense') return opts.adsenseListo ? 'adsense' : null;
  // auto
  if (directo) return 'directo';
  return opts.adsenseListo ? 'adsense' : null;
}

// ── Frequency caps ──────────────────────────────────────────────────────────

export interface Contadores {
  hoy: number;
  sesion: number;
}

/** Whether one more ad unit fits under the daily and per-session caps. */
export function dentroDeTopes(c: Contadores, config: ConfigPublicidad): boolean {
  return c.hoy < config.por_dia && c.sesion < config.por_sesion;
}

/** Indices in a list where an in-feed ad should be inserted. */
export function feedAdIndices(itemCount: number, config: ConfigPublicidad = CONFIG_DEFECTO): number[] {
  const rule = config.ubicaciones['news-feed'];
  if (!rule?.activa) return [];
  const every = rule.cada ?? 0;
  const first = rule.desde ?? 0;
  const max = rule.max ?? 0;
  if (!every || !max || itemCount <= first) return [];
  const out: number[] = [];
  for (let i = first; i < itemCount && out.length < max; i += every) out.push(i);
  return out;
}

// ── The "moment" card ───────────────────────────────────────────────────────

/**
 * A moment ad is a card shown at a natural pause — after closing the third
 * article of a session. It is a calm card at the bottom of the screen, never
 * a pop-over that blocks content, and it only ever carries a direct sponsor.
 */
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
export function shouldShowMoment(
  state: MomentState,
  decision: AdDecision,
  config: ConfigPublicidad = CONFIG_DEFECTO,
  ahora: number = Date.now(),
): boolean {
  const m = config.momento;
  if (!decision.show || !m.activo) return false;
  if (state.sessions < m.min_sesiones) return false;
  if (state.shownThisSession >= 1) return false;
  if (state.closes < m.tras_cierres) return false;
  if (state.lastShownAt && (ahora - state.lastShownAt) / 60_000 < m.min_minutos) return false;
  return true;
}
