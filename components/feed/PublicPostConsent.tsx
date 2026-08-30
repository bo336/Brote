'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Globe2 } from 'lucide-react';
import { Sheet } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { BRAND } from '@/lib/brand';

/**
 * Shown once, the first time somebody is about to publish.
 *
 * Not a checkbox buried in the Terms: the moment a person's words are about to
 * become public with their name on them is the moment they should be told, and
 * it is the only moment they will actually read it. One tap, once, and never
 * again — the acknowledgement is stored server-side (`context.plaza.consent_at`),
 * so it survives a new device.
 *
 * It gates the post rather than following it. An "actually, no" here has to
 * still be possible.
 */
export function PublicPostConsent({
  open,
  onOpenChange,
  onAccept,
  busy,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAccept: () => void;
  busy?: boolean;
}) {
  const t = useTranslations('feed');
  const tc = useTranslations('common');

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={t('consentTitle')}>
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Globe2 className="h-5 w-5" />
          </span>
          <p className="text-small leading-relaxed">
            {t('consentBody', { mascot: BRAND.mascot })}
          </p>
        </div>

        <p className="text-caption leading-relaxed text-muted-foreground">
          {t('consentRules')}{' '}
          <Link href="/legal/normas" className="font-medium text-primary underline underline-offset-2">
            {t('consentRulesLink')}
          </Link>
          .
        </p>

        <div className="flex gap-3">
          <Button variant="secondary" block onClick={() => onOpenChange(false)}>
            {tc('cancel')}
          </Button>
          <Button variant="primary" block loading={busy} onClick={onAccept}>
            {t('consentAccept')}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
