'use client';

import { useTranslations } from 'next-intl';
import { Droplet, Sprout } from 'lucide-react';

import { INTERACT, JOYSTICK } from '@/lib/world/config';
import { haptic } from '@/lib/utils/haptics';
import type { VerbId } from '@/lib/world/types';
import { useSessionStore } from '../state/useSessionStore';
import { getInteractable } from './InteractableRegistry';

/**
 * The screen-space action button, in the right thumb zone.
 *
 * It appears **only** when an interactable is active (`16-UI-AUDIO-A11Y.md` §1)
 * and is at least 48×48 CSS px, because interaction has to succeed with
 * low-precision motor control. The verb word comes from `messages/es.json`;
 * nothing here is ever an inline string.
 *
 * Colour alone never carries the state: the icon and the word do too.
 */
const ICONS: Partial<Record<VerbId, typeof Sprout>> = {
  plant: Sprout,
  water: Droplet,
};

export function ActionButton() {
  const active = useSessionStore((s) => s.active);
  const t = useTranslations('mundo');
  if (!active) return null;

  const Icon = ICONS[active.verb] ?? Sprout;
  return (
    <button
      type="button"
      onPointerDown={(e) => {
        e.stopPropagation();
        haptic('medium');
        getInteractable(active.id)?.onInteract();
      }}
      aria-label={t(`verb.${active.verb}`)}
      className="absolute right-5 flex flex-col items-center gap-1 rounded-pill bg-brote-cream/95 px-5 py-3 text-brote-ink shadow-soft-lg transition-transform active:scale-95"
      style={{
        bottom: `max(env(safe-area-inset-bottom), ${JOYSTICK.safeAreaMinPx}px)`,
        minWidth: INTERACT.buttonMinPx,
        minHeight: INTERACT.buttonMinPx,
      }}
    >
      <Icon className="h-5 w-5" aria-hidden />
      <span className="text-caption font-bold capitalize">{t(`verb.${active.verb}`)}</span>
    </button>
  );
}
