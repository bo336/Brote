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
  /** The pin's size in CSS px, kept by a ResizeObserver so the loop never measures layout. */
  pinSize: { w: number; h: number };
  /** Where the pin's anchor (bottom centre) was put this frame. */
  pinAt: PinPlace;
  /** "E · Regar", over the thing you can use now. */
  prompt: HTMLDivElement | null;
  promptSize: { w: number; h: number };
  /** Where the prompt was put last frame, so the pin can step out of its way. */
  promptAt: PinPlace;
} = {
  pin: null, pinArrow: null, pinDistance: null, pinSize: { w: 0, h: 0 }, pinAt: { x: 0, y: 0, shown: false },
  prompt: null, promptSize: { w: 0, h: 0 }, promptAt: { x: 0, y: 0, shown: false },
};

/** A label's anchor on screen, in CSS px, and whether it is showing. */
export interface PinPlace {
  x: number;
  y: number;
  shown: boolean;
}
