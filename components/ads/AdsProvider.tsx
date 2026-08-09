'use client';

/**
 * Ads runtime (PLAN F13.3/F13.4).
 *
 * Loads AdSense at most once, exposes the policy decision to the tree, and
 * owns the session state behind "moment" ads. Nothing here renders an ad by
 * itself — components ask for one via <AdSlot>, and this provider is the only
 * thing that can say yes.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import {
  EMPTY_MOMENT_STATE,
  decideAds,
  routeAllowsAds,
  shouldShowMoment,
  type AccountType,
  type AdDecision,
  type MomentState,
} from '@/lib/ads/policy';

export const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? '';

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

interface AdsContextValue {
  monetization: Monetization | null;
  decision: AdDecision;
  /** True when AdSense is configured AND the route permits ads. */
  canRenderHere: boolean;
  /** Register that the user closed a detail view (feeds the moment logic). */
  noteContentClosed: () => void;
  /** True while a moment ad should be displayed. */
  momentOpen: boolean;
  dismissMoment: () => void;
  refresh: () => void;
}

const AdsContext = createContext<AdsContextValue>({
  monetization: null,
  decision: { show: false, personalized: false, reason: 'no-provider' },
  canRenderHere: false,
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
      const next: MomentState = {
        closes: 0,
        shownThisSession: 0,
        lastShownAt: persisted.lastShownAt ?? null,
        sessions,
      };
      localStorage.setItem(MOMENT_KEY, JSON.stringify({ lastShownAt: next.lastShownAt, sessions }));
      return next;
    }
    return {
      closes: 0,
      shownThisSession: 0,
      lastShownAt: persisted.lastShownAt ?? null,
      sessions: persisted.sessions ?? 1,
    };
  } catch {
    return EMPTY_MOMENT_STATE;
  }
}

async function fetchMonetization(): Promise<Monetization | null> {
  const { data, error } = await createClient().rpc('my_monetization');
  if (error) return null;
  return (data ?? null) as Monetization | null;
}

export function AdsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const q = useQuery({ queryKey: ['monetization'], queryFn: fetchMonetization, staleTime: 5 * 60_000 });
  const monetization = q.data ?? null;

  const [moment, setMoment] = useState<MomentState>(EMPTY_MOMENT_STATE);
  const [momentOpen, setMomentOpen] = useState(false);
  const scriptLoaded = useRef(false);

  useEffect(() => {
    setMoment(loadMomentState());
  }, []);

  const decision = useMemo<AdDecision>(() => {
    if (!monetization) return { show: false, personalized: false, reason: 'loading' };
    return decideAds({
      isPro: monetization.is_pro,
      accountType: monetization.account_type,
      onboarded: monetization.onboarded,
      adsConsent: monetization.ads_consent,
      memberSince: monetization.member_since,
    });
  }, [monetization]);

  const canRenderHere = !!ADSENSE_CLIENT && decision.show && routeAllowsAds(pathname ?? '/');

  // Load the AdSense library once, and only for users who may actually see an
  // ad — a paying user or a child never even downloads the script.
  useEffect(() => {
    if (!decision.show || !ADSENSE_CLIENT || scriptLoaded.current) return;
    if (document.querySelector('script[data-brote-adsense]')) {
      scriptLoaded.current = true;
      return;
    }
    const s = document.createElement('script');
    s.async = true;
    s.crossOrigin = 'anonymous';
    s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
    s.setAttribute('data-brote-adsense', '1');
    document.head.appendChild(s);
    scriptLoaded.current = true;

    // Ask for non-personalized ads unless the user opted in.
    const w = window as unknown as { adsbygoogle?: unknown[] & { requestNonPersonalizedAds?: number } };
    w.adsbygoogle = w.adsbygoogle || [];
    if (!decision.personalized) {
      (w.adsbygoogle as { requestNonPersonalizedAds?: number }).requestNonPersonalizedAds = 1;
    }
  }, [decision.show, decision.personalized]);

  // Kept in a ref so `noteContentClosed` has a STABLE identity. Without this
  // the callback changes whenever the decision object is rebuilt, and effect
  // cleanups that call it would fire spuriously — counting phantom "closes".
  const decisionRef = useRef(decision);
  useEffect(() => {
    decisionRef.current = decision;
  }, [decision]);

  const noteContentClosed = useCallback(() => {
    setMoment((prev) => {
      const next = { ...prev, closes: prev.closes + 1 };
      if (shouldShowMoment(next, decisionRef.current)) {
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

  const value = useMemo<AdsContextValue>(
    () => ({
      monetization,
      decision,
      canRenderHere,
      noteContentClosed,
      momentOpen,
      dismissMoment: () => setMomentOpen(false),
      refresh: () => void q.refetch(),
    }),
    [monetization, decision, canRenderHere, noteContentClosed, momentOpen, q],
  );

  return <AdsContext.Provider value={value}>{children}</AdsContext.Provider>;
}
