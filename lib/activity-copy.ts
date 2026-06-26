/**
 * Activity copy templates (mirrors scripts/gen-seed.mjs).
 *
 * The catalog stores title_es, short_es and impact_equivalency_es; the longer
 * description + step instructions are rendered from these warm Spanish (voseo)
 * templates so the DB stays lean and copy stays centralized. The activity
 * detail page uses `activityDescription` / `activityInstructions`, falling back
 * to any DB-provided value when present (so future bespoke copy can override).
 */
import type { Impact } from './points';

const IMPACT_SENT: Record<Impact, string> = {
  high: 'Es una de las acciones de mayor impacto real.',
  medium: 'Suma un impacto concreto y sostenido.',
  low: 'Un gesto chico que, repetido, hace una gran diferencia.',
};

export function activityDescription(
  title: string,
  impact: Impact,
  stored?: string | null,
): string {
  if (stored && stored.trim()) return stored;
  return `${title}. ${IMPACT_SENT[impact]}`;
}

export function activityInstructions(
  verification: string,
  stored?: string | null,
): string[] {
  if (stored && stored.trim()) return stored.split('\n');
  return verification === 'photo_ai'
    ? [
        'Hacé la acción en la vida real.',
        'Sacá una foto clara que la muestre.',
        'Subila para verificar y sumar tus puntos (con bonus).',
      ]
    : ['Hacé la acción hoy.', 'Cuando termines, marcala.', 'Sumás tus puntos al instante.'];
}
