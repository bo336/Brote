import { type ReactNode } from 'react';
import { Sidebar } from '@/components/nav/Sidebar';
import { TopBar } from '@/components/nav/TopBar';
import { BottomTabBar } from '@/components/nav/BottomTabBar';
import { InstallBanner } from '@/components/pwa/InstallBanner';
import { SessionHydrator } from '@/components/session-hydrator';

/**
 * The authenticated app shell (BUILD_SPEC §3.1): desktop sidebar + mobile
 * bottom nav, contextual top bar, and the install banner. Auth gating is added
 * by middleware (step 2); this layout renders the chrome.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <InstallBanner />
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-28 pt-4 lg:pb-10">
          {children}
        </main>
        <BottomTabBar />
      </div>
      <SessionHydrator />
    </div>
  );
}
