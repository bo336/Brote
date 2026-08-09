'use client';

/**
 * Ad personalization consent (PLAN F13.5).
 *
 * Shown once, only to users who can actually see ads. Until someone opts in we
 * request NON-personalized ads, so declining (or ignoring this entirely) is
 * always the safe default rather than something the user must fight for.
 *
 * Note for EEA/UK traffic: Google requires a certified CMP there. This banner
 * is the honest baseline for Argentina/LatAm; see PUBLICIDAD.html before
 * advertising to European users.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAds } from './AdsProvider';
import { setAdsConsent } from '@/lib/api/monetizacion';

export function AdsConsentBanner() {
  const { monetization, decision } = useAds();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [visible, setVisible] = useState(false);

  // Only ask people who will actually see advertising, and only once.
  useEffect(() => {
    if (!monetization) return;
    const eligible = decision.show && monetization.ads_consent === null && monetization.account_type === 'adult';
    // Give the app a beat before interrupting.
    const t = setTimeout(() => setVisible(eligible), 2500);
    return () => clearTimeout(t);
  }, [monetization, decision.show]);

  if (!visible) return null;

  async function choose(value: boolean) {
    setBusy(true);
    await setAdsConsent(value);
    await qc.invalidateQueries({ queryKey: ['monetization'] });
    setBusy(false);
    setVisible(false);
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[65] px-3 pb-24 lg:pb-4">
      <Card className="mx-auto max-w-md p-4 shadow-soft-lg">
        <p className="text-small font-semibold">Sobre la publicidad 🌱</p>
        <p className="mt-1 text-small text-muted-foreground">
          Brote es gratis gracias a algunos anuncios. Podés permitir que sean más relevantes para vos, o dejarlos
          genéricos: en ambos casos vas a ver la misma cantidad.
        </p>
        <div className="mt-3 flex gap-2">
          <Button variant="secondary" className="flex-1" loading={busy} onClick={() => choose(false)}>
            Genéricos
          </Button>
          <Button variant="primary" className="flex-1" loading={busy} onClick={() => choose(true)}>
            Permitir
          </Button>
        </div>
        <Link href="/brote-plus" className="mt-2 block text-center text-caption text-primary">
          O sacá los anuncios con Brote+
        </Link>
      </Card>
    </div>
  );
}
