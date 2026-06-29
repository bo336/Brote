'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Download, X } from 'lucide-react';
import { BRAND } from '@/lib/brand';
import { usePwa, isStandalone, isIos, type BeforeInstallPromptEvent } from '@/stores/pwa';
import { haptic } from '@/lib/utils/haptics';
import { Button } from '@/components/ui/button';

/**
 * Prominent install banner (BUILD_SPEC §12.3). Visible on web until installed;
 * hidden once standalone. On iOS / unsupported browsers it links to /instalar.
 */
export function InstallBanner() {
  const t = useTranslations('install');
  const { deferredPrompt, installed, dismissedThisSession, setDeferredPrompt, setInstalled, dismiss } = usePwa();

  useEffect(() => {
    if (isStandalone()) {
      setInstalled(true);
      return;
    }
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, [setDeferredPrompt, setInstalled]);

  if (installed || dismissedThisSession) return null;

  const ios = typeof window !== 'undefined' && isIos();
  // Only render when we can actually offer install (Chromium prompt) or on iOS
  // (manual guide). On other desktop browsers we still nudge toward /instalar.
  const canPrompt = !!deferredPrompt;
  if (!canPrompt && !ios && typeof window !== 'undefined' && !navigator.userAgent.includes('Mobile')) {
    // Desktop without an install prompt yet — keep the banner but route to guide.
  }

  async function handleInstall() {
    haptic('medium');
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') setInstalled(true);
      setDeferredPrompt(null);
    }
  }

  return (
    <div className="border-b border-brote-green/30 bg-primary/10">
      <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-2.5">
        <span className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary sm:flex">
          <Download className="h-5 w-5" />
        </span>
        <p className="min-w-0 flex-1 text-small text-foreground">
          {t('banner', { app: BRAND.name })}
        </p>
        {canPrompt ? (
          <Button size="sm" variant="primary" onClick={handleInstall} className="shrink-0">
            <Download className="h-4 w-4" />
            {t('button')}
          </Button>
        ) : (
          <Button size="sm" variant="primary" asChild className="shrink-0">
            <Link href="/instalar">{t('button')}</Link>
          </Button>
        )}
        <button
          onClick={dismiss}
          aria-label={t('dismiss')}
          className="shrink-0 rounded-full p-1.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
