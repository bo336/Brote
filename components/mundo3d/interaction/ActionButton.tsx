'use client';

import { useTranslations } from 'next-intl';
import { Droplet, Sprout } from 'lucide-react';

import { INTERACT, JOYSTICK } from '@/lib/world/config';
import type { VerbId } from '@/lib/world/types';
import { useSessionStore } from '../state/useSessionStore';

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

  // A verb-less interactable labels itself. El Mojón is not "plantar"; it is
  // "leer", and the registry is what knows which.
  const Icon = (active.verb ? ICONS[active.verb] : undefined) ?? Sprout;
  const label = active.verb ? t(`verb.${active.verb}`) : t(active.labelKey);
  return (
    <button
      type="button"
      onPointerDown={(e) => {
        e.stopPropagation();
        // The same door E goes through, so the key and the button cannot disagree.
        useSessionStore.getState().interact?.();
      }}
      aria-label={label}
      className="absolute right-5 flex flex-col items-center gap-1 rounded-pill bg-brote-cream/95 px-5 py-3 text-brote-ink shadow-soft-lg transition-transform active:scale-95"
      style={{
        bottom: `max(env(safe-area-inset-bottom), ${JOYSTICK.safeAreaMinPx}px)`,
        minWidth: INTERACT.buttonMinPx,
        minHeight: INTERACT.buttonMinPx,
      }}
    >
      <span className="flex items-center gap-1.5">
        <Icon className="h-5 w-5" aria-hidden />
        {/* The key, for a keyboard. A phone has no E to press. */}
        <kbd className="rounded-md border border-brote-ink/25 px-1.5 text-[11px] font-bold leading-5 [@media(pointer:coarse)]:hidden">
          E
        </kbd>
      </span>
      {/* No `capitalize`: it title-cases every word, and Spanish does not.
          "Sembrar en otro mundo" was rendering as "Sembrar En Otro Mundo" on
          the one button the player reads most. The copy already arrives in the
          case it wants to be in. */}
      <span className="text-caption font-bold first-letter:uppercase">{label}</span>
    </button>
  );
}
