import { create } from 'zustand';

export type ToastVariant = 'default' | 'success' | 'points' | 'warning' | 'error';

export interface ToastItem {
  id: string;
  title?: string;
  description?: string;
  variant: ToastVariant;
  /** Optional leading emoji/icon glyph. */
  glyph?: string;
  durationMs: number;
}

export type ToastInput = Omit<ToastItem, 'id' | 'durationMs' | 'variant'> & {
  variant?: ToastVariant;
  durationMs?: number;
};

interface ToastState {
  toasts: ToastItem[];
  push: (t: ToastInput) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

let counter = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (t) => {
    const id = `t${++counter}`;
    const item: ToastItem = {
      id,
      variant: 'default',
      durationMs: 3500,
      ...t,
    };
    set((s) => ({ toasts: [...s.toasts, item] }));
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
  clear: () => set({ toasts: [] }),
}));

/** Convenience helper usable outside React (e.g. mutation callbacks). */
export const toast = {
  show: (t: Parameters<ToastState['push']>[0]) => useToastStore.getState().push(t),
  points: (points: number) =>
    useToastStore.getState().push({
      variant: 'points',
      glyph: '✨',
      title: `+${new Intl.NumberFormat('es-AR').format(points)} puntos`,
      durationMs: 2800,
    }),
  success: (title: string, description?: string) =>
    useToastStore.getState().push({ variant: 'success', title, description, glyph: '✅' }),
  warning: (title: string, description?: string) =>
    useToastStore.getState().push({ variant: 'warning', title, description, glyph: '⚠️' }),
  error: (title: string, description?: string) =>
    useToastStore.getState().push({ variant: 'error', title, description, glyph: '😕' }),
};
