'use client';

/**
 * Ads runtime (PLAN F13.3/F13.4, Publicidad v2 — 0134).
 *
 * Reads the master switch and the rules from the database
 * (`publicidad_estado`), combines them with who the person is
 * (`my_monetization`) and exposes one decision to the tree. Nothing here
 * renders an ad by itself — components ask for one via <AdSlot>, and this
 * provider is the only thing that can say yes.
 *
 * The AdSense script is NOT loaded here any more: the first <AdSlot> that is
 * about to scroll into view loads it (`lib/ads/runtime.ts`). Someone who only
 * uses Inicio and Tu mundo never downloads it.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import {
  CONFIG_DEFECTO,
  EMPTY_MOMENT_STATE,
  decideAds,
  normalizarConfig,
  routeAllowsAds,
  routeAllowsAnonymousAds,
  shouldShowMoment,
  type AccountType,
  type AdDecision,
  type ConfigPublicidad,
  type MomentState,
} from '@/lib/ads/policy';
import { enviarMetricas } from '@/lib/ads/runtime';

export { ADSENSE_CLIENT } from '@/lib/ads/runtime';

export interface Monetization {
  plan: 'free' | 'plus';
  is_pro: boolean;
  plan_expires_at: string | null;
  account_type: AccountType;
  ads_consent: boolean | null;
  onboarded: boolean;
  member_since: string | null;
  subscription: {
    status: string;
    current_period_end: string | null;
    amount: number | null;
    currency: string | null;
    external_id: string | null;
  } | null;
}

interface EstadoPublicidad {
  activa: boolean;
  config: ConfigPublicidad;
  /** A direct sponsor is running somewhere. */
  directos: boolean;
}

interface AdsContextValue {
  monetization: Monetization | null;
  estado: EstadoPublicidad;
  decision: AdDecision;
  /** True when the rules AND the route permit an ad here. */
  canRenderHere: boolean;
  /** No account (visitor of the public guide). */
  anonymous: boolean;
  /** Register that the user closed a detail view (feeds the moment logic). */
  noteContentClosed: () => void;
  /** True while a moment ad should be displayed. */
  momentOpen: boolean;
  dismissMoment: () => void;
  refresh: () => void;
}

const ESTADO_APAGADO: EstadoPublicidad = { activa: false, config: CONFIG_DEFECTO, directos: false };

const AdsContext = createContext<AdsContextValue>({
  monetization: null,
  estado: ESTADO_APAGADO,
  decision: { show: false, personalized: false, reason: 'no-provider' },
  canRenderHere: false,
  anonymous: false,
  noteContentClosed: () => {},
  momentOpen: false,
  dismissMoment: () => {},
  refresh: () => {},
});

export const useAds = () => useContext(AdsContext);

const MOMENT_KEY = 'brote.ads.moment.v1';
const SESSION_KEY = 'brote.ads.session.v1';

function loadMomentState(): MomentState {
  if (typeof window === 'undefined') return EMPTY_MOMENT_STATE;
  try {
    const raw = localStorage.getItem(MOMENT_KEY);
    const persisted = raw ? (JSON.parse(raw) as Partial<MomentState>) : {};
    const isNewSession = !sessionStorage.getItem(SESSION_KEY);
    if (isNewSession) {
      sessionStorage.setItem(SESSION_KEY, '1');
      const sessions = (persisted.sessions ?? 0) + 1;
      localStorage.setItem(MOMENT_KEY, JSON.stringify({ lastShownAt: persisted.lastShownAt ?? null, sessions }));
      return { closes: 0, shownThisSession: 0, lastShownAt: persisted.lastShownAt ?? null, sessions };
    }
    return { closes: 0, shownThisSession: 0, lastShownAt: persisted.lastShownAt ?? null, sessions: persisted.sessions ?? 1 };
  } catch {
    return EMPTY_MOMENT_STATE;
  }
}

async function fetchMonetization(): Promise<Monetization | null> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;
  const { data, error } = await supabase.rpc('my_monetization');
  if (error) return null;
  return (data ?? null) as Monetization | null;
}

async function fetchEstado(): Promise<EstadoPublicidad> {
  const { data, error } = await createClient().rpc('publicidad_estado');
  if (error || !data) return ESTADO_APAGADO;
  const d = data as { activa?: boolean; config?: unknown; directos?: boolean };
  return { activa: d.activa === true, config: normalizarConfig(d.config), directos: d.directos === true };
}

export function AdsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '/';
  const q = useQuery({ queryKey: ['monetization'], queryFn: fetchMonetization, staleTime: 5 * 60_000 });
  // The rules change rarely; ten minutes of cache means turning ads off in the
  // panel reaches everyone within ten minutes, with one tiny query per person.
  const est = useQuery({ queryKey: ['publicidad-estado'], queryFn: fetchEstado, staleTime: 10 * 60_000 });
  const monetization = q.data ?? null;
  const estado = est.data ?? ESTADO_APAGADO;
  const anonymous = q.isFetched && !monetization;

  const [, setMoment] = useState<MomentState>(EMPTY_MOMENT_STATE);
  const [momentOpen, setMomentOpen] = useState(false);

  useEffect(() => {
    setMoment(loadMomentState());
  }, []);

  // Metrics leave in batches; the last batch goes out when the tab hides.
  useEffect(() => {
    const alOcultar = () => {
      if (document.visibilityState === 'hidden') void enviarMetricas();
    };
    document.addEventListener('visibilitychange', alOcultar);
    return () => document.removeEventListener('visibilitychange', alOcultar);
  }, []);

  const decision = useMemo<AdDecision>(() => {
    if (!est.data) return { show: false, personalized: false, reason: 'loading' };
    if (anonymous) return decideAds({ globalEnabled: estado.activa, anonymous: true, isPro: false, accountType: 'adult', onboarded: true, adsConsent: null });
    if (!monetization) return { show: false, personalized: false, reason: 'loading' };
    return decideAds({
      globalEnabled: estado.activa,
      isPro: monetization.is_pro,
      accountType: monetization.account_type,
      onboarded: monetization.onboarded,
      adsConsent: monetization.ads_consent,
      memberSince: monetization.member_since,
      diasGracia: estado.config.dias_gracia,
    });
  }, [est.data, estado, monetization, anonymous]);

  const canRenderHere = decision.show && (anonymous ? routeAllowsAnonymousAds(pathname) : routeAllowsAds(pathname));

  // Kept in refs so `noteContentClosed` has a STABLE identity. Without this
  // the callback changes whenever the decision object is rebuilt, and effect
  // cleanups that call it would fire spuriously — counting phantom "closes".
  const decisionRef = useRef(decision);
  const configRef = useRef(estado.config);
  const directosRef = useRef(estado.directos);
  useEffect(() => {
    decisionRef.current = decision;
    configRef.current = estado.config;
    directosRef.current = estado.directos;
  }, [decision, estado]);

  const noteContentClosed = useCallback(() => {
    setMoment((prev) => {
      const next = { ...prev, closes: prev.closes + 1 };
      // The moment card only carries direct sponsors: with none running there
      // is nothing to show, and the counter keeps going.
      if (directosRef.current && shouldShowMoment(next, decisionRef.current, configRef.current)) {
        next.shownThisSession = prev.shownThisSession + 1;
        next.closes = 0;
        next.lastShownAt = Date.now();
        try {
          localStorage.setItem(MOMENT_KEY, JSON.stringify({ lastShownAt: next.lastShownAt, sessions: next.sessions }));
        } catch {
          /* storage unavailable — the cap simply resets next session */
        }
        setMomentOpen(true);
      }
      return next;
    });
  }, []);

  const dismissMoment = useCallback(() => setMomentOpen(false), []);

  const value = useMemo<AdsContextValue>(
    () => ({
      monetization,
      estado,
      decision,
      canRenderHere,
      anonymous,
      noteContentClosed,
      momentOpen,
      dismissMoment,
      refresh: () => {
        void q.refetch();
        void est.refetch();
      },
    }),
    [monetization, estado, decision, canRenderHere, anonymous, noteContentClosed, momentOpen, dismissMoment, q, est],
  );

  return <AdsContext.Provider value={value}>{children}</AdsContext.Provider>;
}
