'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Share, Plus, ArrowLeft } from 'lucide-react';
import { BRAND } from '@/lib/brand';
import { Pip } from '@/components/pip/Pip';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { isIos } from '@/stores/pwa';

/** Friendly manual-install guide for iOS / unsupported browsers (§12.3). */
export default function InstalarPage() {
  const t = useTranslations('install');
  const tc = useTranslations('common');
  const [ios, setIos] = useState(false);
  useEffect(() => setIos(isIos()), []);

  const steps = ios
    ? [
        { icon: Share, text: t('iosStep1') },
        { icon: Plus, text: t('iosStep2') },
        { icon: Plus, text: t('iosStep3') },
      ]
    : [
        { icon: Share, text: t('androidStep1') },
        { icon: Plus, text: t('androidStep2') },
        { icon: Plus, text: t('androidStep3') },
      ];

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-5 py-8">
      <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-small text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> {tc('back')}
      </Link>
      <div className="flex flex-col items-center text-center">
        <Pip size={96} mood="happy" />
        <h1 className="mt-3 font-display text-h1 font-bold">{t('guideTitle', { app: BRAND.name })}</h1>
      </div>
      <div className="mt-6 space-y-3">
        {steps.map((s, i) => {
          const Icon = s.icon;
          return (
            <Card key={i} className="flex items-center gap-3 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 font-display font-bold text-primary">
                {i + 1}
              </span>
              <p className="flex-1 text-small">{s.text}</p>
              <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
            </Card>
          );
        })}
      </div>
      <Button asChild variant="primary" block className="mt-8">
        <Link href="/">{tc('continue')}</Link>
      </Button>
    </main>
  );
}
