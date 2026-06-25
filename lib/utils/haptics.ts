/**
 * Lightweight haptic feedback (used by buttons + reward moments).
 * No-ops silently where unsupported. Never throws.
 */
type HapticKind = 'light' | 'medium' | 'success' | 'warning';

const PATTERNS: Record<HapticKind, number | number[]> = {
  light: 8,
  medium: 16,
  success: [10, 40, 16],
  warning: [12, 30, 12, 30],
};

export function haptic(kind: HapticKind = 'light'): void {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return;
  try {
    navigator.vibrate(PATTERNS[kind]);
  } catch {
    /* ignore */
  }
}
