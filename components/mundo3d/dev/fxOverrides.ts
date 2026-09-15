'use client';

import { create } from 'zustand';

/**
 * Switches for the lens, for the perf protocol only.
 *
 * Measuring what each post pass costs means turning it off in a running scene,
 * and the passes are React children, so the switch has to be state. The preview
 * route exposes `window.__fx({ ... })`; nothing in the game itself writes here,
 * and with no override every pass is exactly what the tier asks for.
 */
export interface FxOverrides {
  ao?: boolean;
  /** Ambient occlusion at half resolution, upsampled against depth. */
  aoHalf?: boolean;
  bloom?: boolean;
  /** Multisample count on the composer's buffer; 0 is off. */
  msaa?: number;
  /** Morphological edge smoothing as a pass. */
  smaa?: boolean;
  grade?: boolean;
}

export const useFxOverrides = create<{ fx: FxOverrides; setFx: (fx: FxOverrides) => void }>((set) => ({
  fx: {},
  setFx: (fx) => set({ fx }),
}));
