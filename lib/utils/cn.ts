import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/*
 * The type scale in tailwind.config.ts (`text-caption`, `text-small`, `text-h1`…)
 * has custom names. Plain `twMerge` doesn't know them, files them as text
 * COLORS, and drops them the moment a real color follows: `cn('text-caption',
 * 'text-muted-foreground')` used to come out as just the color, at body size.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['hero', 'display-xl', 'display-l', 'h1', 'h2', 'h3', 'body', 'small', 'caption'] }],
    },
  },
});

/** Merge Tailwind class names with conflict resolution. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
