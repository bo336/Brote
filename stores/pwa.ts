import { create } from 'zustand';

/** Captured `beforeinstallprompt` event (Chromium only). */
export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PwaState {
  deferredPrompt: BeforeInstallPromptEvent | null;
  installed: boolean;
  dismissedThisSession: boolean;
  setDeferredPrompt: (e: BeforeInstallPromptEvent | null) => void;
  setInstalled: (v: boolean) => void;
  dismiss: () => void;
}

export const usePwa = create<PwaState>((set) => ({
  deferredPrompt: null,
  installed: false,
  dismissedThisSession: false,
  setDeferredPrompt: (deferredPrompt) => set({ deferredPrompt }),
  setInstalled: (installed) => set({ installed }),
  dismiss: () => set({ dismissedThisSession: true }),
}));

/** True when the app is already running as an installed PWA (§12.3). */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
    new URLSearchParams(window.location.search).get('source') === 'pwa'
  );
}

export function isIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
}
