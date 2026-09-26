'use client';

import { useTranslations } from 'next-intl';
import { Check, RotateCw, Undo2, X } from 'lucide-react';

import { JOYSTICK } from '@/lib/world/config';
import { cn } from '@/lib/utils/cn';
import type { PropId } from '@/lib/world/types';
import type { SaveState } from '../placement/usePlacementSave';

/**
 * The controls for placement mode.
 *
 * `08-WORLD-AND-PROGRESSION.md` §8 asks for "one-thumb drag, confirm/cancel,
 * undo", and this is deliberately the only moment the HUD is allowed to grow:
 * the rest of the game runs on four elements (`16-UI-AUDIO-A11Y.md` §1). It
 * shrinks back the instant placement mode ends.
 *
 * **Nothing here reports an error.** A prop that cannot go somewhere shows a
 * coral ring under the ghost and a greyed confirm; that is the whole refusal.
 */
interface PlacementBarProps {
  props: readonly PropId[];
  /**
   * Something is in hand, and whether the spot under it refuses it.
   *
   * Two booleans rather than the ghost: the ghost moves with a finger and this
   * component renders buttons. Taking the object would re-render the whole bar
   * sixty times a second to change nothing on screen.
   */
  hasGhost: boolean;
  /** Copies still to place of what the world's shop sold. */
  left?: Readonly<Record<string, number>>;
  rejected: boolean;
  remaining: number;
  canUndo: boolean;
  /** Saved-arrangement slots: filled ones load, empty ones save. */
  slots: boolean[];
  saveState: SaveState;
  onPick: (slug: PropId) => void;
  onRotate: () => void;
  onCommit: () => void;
  onCancel: () => void;
  onUndo: () => void;
  onUseSlot: (index: number) => void;
  onExit: () => void;
}

function Round({
  label, onClick, disabled, children, tone = 'neutral',
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  tone?: 'neutral' | 'go';
}) {
  return (
    <button
      type="button"
      onPointerDown={(e) => {
        e.stopPropagation();
        if (!disabled) onClick();
      }}
      disabled={disabled}
      aria-label={label}
      className={cn(
        'flex h-12 w-12 items-center justify-center rounded-pill shadow-soft transition-transform active:scale-95',
        disabled && 'opacity-40',
        tone === 'go' ? 'bg-brote-green text-white' : 'bg-brote-cream/95 text-brote-ink',
      )}
    >
      {children}
    </button>
  );
}

export function PlacementBar({
  props, left, hasGhost, rejected, remaining, canUndo, slots, saveState,
  onPick, onRotate, onCommit, onCancel, onUndo, onUseSlot, onExit,
}: PlacementBarProps) {
  const t = useTranslations('mundo');

  return (
    <div
      className="pointer-events-auto absolute inset-x-0 bottom-0 flex flex-col gap-3 p-4"
      style={{ paddingBottom: `max(env(safe-area-inset-bottom), ${JOYSTICK.safeAreaMinPx}px)` }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between">
        {/* How much room is left, as a number rather than a warning. The cap is
            what stops an island becoming a junkyard; it is not a telling-off. */}
        <span className="rounded-pill bg-brote-ink/70 px-3 py-1 text-caption font-semibold text-brote-cream">
          {t('placement.remaining', { n: remaining })}
        </span>
        <span className="rounded-pill bg-brote-ink/70 px-3 py-1 text-caption text-brote-cream">
          {saveState === 'queued'
            ? t('placement.queued')
            : saveState === 'saving'
              ? t('placement.saving')
              : t('placement.saved')}
        </span>
      </div>

      {/* Saved arrangements. **Numbered, never named** — a text input in a 3D
          HUD is a keyboard over the world to solve a problem nobody has. A
          full row is also the whole explanation of the cap. */}
      {!hasGhost && slots.length > 0 && (
        <div className="flex gap-2">
          {slots.map((full, i) => (
            <button
              key={i}
              type="button"
              onPointerDown={(e) => {
                e.stopPropagation();
                onUseSlot(i);
              }}
              aria-label={full ? t('placement.cargar', { n: i + 1 }) : t('placement.guardar', { n: i + 1 })}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-pill text-caption font-semibold',
                full ? 'bg-brote-green text-white' : 'bg-brote-ink/60 text-brote-cream/70',
              )}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* The tray of things they own. Empty is not an error state: at tier 1
          nobody has bought anything yet. */}
      {!hasGhost && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {props.length === 0 ? (
            <span className="text-caption text-brote-cream">{t('placement.nada')}</span>
          ) : (
            props.map((slug) => (
              <button
                key={slug}
                type="button"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onPick(slug);
                }}
                disabled={remaining <= 0}
                className={cn(
                  'shrink-0 rounded-pill bg-brote-cream/95 px-4 py-2 text-caption font-semibold text-brote-ink',
                  remaining <= 0 && 'opacity-40',
                )}
              >
                {t(`props.${slug}`)}
                {left?.[slug] !== undefined && <span className="tnum ml-1.5 opacity-60">×{left[slug]}</span>}
              </button>
            ))
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <Round label={t('placement.salir')} onClick={onExit}>
          <X className="h-5 w-5" aria-hidden />
        </Round>

        <div className="flex items-center gap-3">
          <Round label={t('placement.deshacer')} onClick={onUndo} disabled={!canUndo}>
            <Undo2 className="h-5 w-5" aria-hidden />
          </Round>
          {hasGhost && (
            <>
              <Round label={t('placement.girar')} onClick={onRotate}>
                <RotateCw className="h-5 w-5" aria-hidden />
              </Round>
              <Round label={t('placement.cancelar')} onClick={onCancel}>
                <X className="h-5 w-5" aria-hidden />
              </Round>
              <Round
                label={t('placement.confirmar')}
                onClick={onCommit}
                disabled={rejected}
                tone="go"
              >
                <Check className="h-5 w-5" aria-hidden />
              </Round>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
