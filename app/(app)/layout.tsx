import { type ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/nav/Sidebar';
import { TopBar } from '@/components/nav/TopBar';
import { BottomTabBar } from '@/components/nav/BottomTabBar';
import { InstallBanner } from '@/components/pwa/InstallBanner';
import { SessionHydrator } from '@/components/session-hydrator';
import { getSessionData } from '@/lib/supabase/queries';

/**
 * The authenticated app shell (BUILD_SPEC §3.1): desktop sidebar + mobile
 * bottom nav, contextual top bar, install banner. Middleware enforces auth;
 * here we also gate onboarding and hydrate the client session store.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const { profile, unread } = await getSessionData();

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
      <SessionHydrator profile={profile} unread={unread} />
    </div>
  );
}
