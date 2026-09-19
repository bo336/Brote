import { type ReactNode } from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/nav/Sidebar';
import { TopBar } from '@/components/nav/TopBar';
import { BottomTabBar } from '@/components/nav/BottomTabBar';
import { InstallBanner } from '@/components/pwa/InstallBanner';
import { PipChat } from '@/components/pip/PipChat';
import { FirstRunTour } from '@/components/tutorial/FirstRunTour';
import { MomentAd } from '@/components/ads/AdSlot';
import { AdsConsentBanner } from '@/components/ads/AdsConsent';
import { SessionHydrator } from '@/components/session-hydrator';
import { getSessionData } from '@/lib/supabase/queries';

/**
 * The authenticated app shell (BUILD_SPEC §3.1): desktop sidebar + mobile
 * bottom nav, contextual top bar, install banner. Middleware enforces auth;
 * here we also gate onboarding and hydrate the client session store.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const { profile, unread } = await getSessionData();

  // `/feed/p/[id]` is shareable, so it can be opened by somebody with no
  // account at all. That page renders its own public preview; the app shell
  // (sidebar, tab bar, Pip) would be furniture around a door they cannot open.
  const pathname = headers().get('x-pathname') ?? '';
  if (!profile && pathname.startsWith('/feed/p/')) return <>{children}</>;

  if (!profile) redirect('/auth/login');
  if (!profile.onboardingCompleted) redirect('/onboarding');

  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <InstallBanner />
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-28 pt-4 lg:pb-10">{children}</main>
        <BottomTabBar />
      </div>
      <PipChat />
      {/* One-time orientation, skippable from the first card (F15.18). */}
      <FirstRunTour />
      <MomentAd />
      <AdsConsentBanner />
      <SessionHydrator profile={profile} unread={unread} />
    </div>
  );
}
