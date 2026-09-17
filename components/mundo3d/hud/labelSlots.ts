/**
 * The DOM labels the world moves every frame (`scene/screenPin.ts`): where the
 * next task is, and what you can use right here.
 *
 * The HUD writes the nodes when it mounts; the frame loop positions them
 * directly. No React state, so nothing re-renders sixty times a second.
 */
export const labelSlots: {
  /** Where the objective is: its name and how far. */
  pin: HTMLDivElement | null;
  /** The pin's pointer, shown when the objective is off screen. */
  pinArrow: HTMLDivElement | null;
  pinDistance: HTMLSpanElement | null;
  /** "E · Regar", over the thing you can use now. */
  prompt: HTMLDivElement | null;
} = { pin: null, pinArrow: null, pinDistance: null, prompt: null };
