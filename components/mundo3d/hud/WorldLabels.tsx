'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronRight, Hand } from 'lucide-react';

import { useSessionStore } from '../state/useSessionStore';
import { labelSlots } from './labelSlots';

/**
 * Words in the world, where the marks are.
 *
 * The 2026-09-16 playtest: "there are circles on the floor, some things create
 * confusion". A golden column, a green ring, an orange chevron at Pip's feet
 * and a bobbing drop all meant something, and none of them said what. Now two
 * labels do the explaining, positioned by the frame loop (`scene/screenPin.ts`):
 *
 *  - **The pin** hangs over the next task and names it, with how far it is. Off
 *    screen it waits at the edge and points the way. It replaced the chevron.
 *  - **The prompt** sits over the thing you can use right now — the one inside
 *    the green ring — and says the key and the verb, so the ring and the button
 *    are visibly the same thing.
 *
 * Both start hidden; the loop fades them in.
 */
export function WorldLabels() {
  const objective = useSessionStore((s) => s.objective);
  const active = useSessionStore((s) => s.active);
  const t = useTranslations('mundo');
  const [touch, setTouch] = useState(false);
  useEffect(() => setTouch(window.matchMedia?.('(pointer: coarse)')?.matches ?? false), []);

  // Both labels' sizes, for the loop's edge clamp and overlap — measured when
  // they change, never per frame.
  useEffect(() => {
    const pin = labelSlots.pin;
    const prompt = labelSlots.prompt;
    if (!pin || !prompt || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      labelSlots.pinSize.w = pin.offsetWidth;
      labelSlots.pinSize.h = pin.offsetHeight;
      pin.style.setProperty('--pin-half', `${Math.round(pin.offsetWidth / 2)}px`);
      const chip = prompt.firstElementChild as HTMLElement | null;
      labelSlots.promptSize.w = chip?.offsetWidth ?? 0;
      labelSlots.promptSize.h = chip?.offsetHeight ?? 0;
    });
    ro.observe(pin);
    ro.observe(prompt);
    return () => ro.disconnect();
  }, []);

  const thing = objective?.thingKey ? t(objective.thingKey) : '';
  const verb = active ? (active.verb ? t(`verb.${active.verb}`) : t(active.labelKey)) : '';

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div
        ref={(el) => { labelSlots.pin = el; }}
        className="absolute left-0 top-0 opacity-0 transition-opacity duration-300 will-change-transform"
      >
        {/* Anchored at its bottom centre, like a sign on a post. */}
        <div className="relative -translate-x-1/2 -translate-y-full">
          <div className="flex items-center gap-1.5 whitespace-nowrap rounded-pill bg-brote-ink/75 px-2.5 py-1 text-caption font-semibold text-white shadow-sun-glow backdrop-blur-sm">
            <span className="h-2 w-2 shrink-0 rounded-full bg-brote-sun" />
            <span className="first-letter:uppercase">{thing}</span>
            <span ref={(el) => { labelSlots.pinDistance = el; }} className="tnum text-white/70" />
          </div>
          <div
            ref={(el) => { labelSlots.pinArrow = el; }}
            className="absolute left-1/2 top-1/2 -ml-3 -mt-3 flex h-6 w-6 items-center justify-center opacity-0"
          >
            <ChevronRight className="h-5 w-5 translate-x-[calc(var(--pin-half,48px)+8px)] text-brote-sun drop-shadow" strokeWidth={3} />
          </div>
        </div>
      </div>

      <div
        ref={(el) => { labelSlots.prompt = el; }}
        className="absolute left-0 top-0 opacity-0 transition-opacity duration-200 will-change-transform"
      >
        {active && (
          <div className="flex -translate-x-1/2 -translate-y-full items-center gap-1.5 whitespace-nowrap rounded-pill bg-brote-cream/95 px-2.5 py-1 text-caption font-bold text-brote-ink shadow-soft-lg">
            {touch ? (
              <Hand className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <kbd className="rounded-md border border-brote-ink/30 px-1.5 font-sans text-[11px] leading-5">E</kbd>
            )}
            <span className="first-letter:uppercase">{verb}</span>
          </div>
        )}
      </div>
    </div>
  );
}
