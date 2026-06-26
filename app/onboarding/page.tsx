import { redirect } from 'next/navigation';
import { getSessionData } from '@/lib/supabase/queries';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';

/** Onboarding entry (BUILD_SPEC §8.2). Server-gates already-onboarded users. */
export default async function OnboardingPage() {
  const { profile } = await getSessionData();
  if (!profile) redirect('/auth/login');
  if (profile.onboardingCompleted) redirect('/');

  return <OnboardingFlow initialName={profile.displayName ?? ''} />;
}
