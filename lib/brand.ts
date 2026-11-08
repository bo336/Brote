/**
 * Brote brand constants (BUILD_SPEC §2.1).
 *
 * The brand name is a WORKING name and will change later. Every user-facing
 * reference to the app/mascot must go through these constants so a future
 * rename is a one-line change. Never hardcode "Brote" or "Pip" in components.
 */
export const BRAND = {
  /** App name. */
  name: 'Brote',
  /** Lowercase handle / package-ish identifier. */
  slug: 'brote',
  /** Tagline (Argentine voseo). */
  tagline: 'Hacé crecer tu mundo.',
  /** One-line description used for manifest, OG, store-ish copy. */
  description:
    'Convertí tus acciones por el ambiente en un hábito diario. Sumá puntos, subí de rango y hacé crecer tu mundo.',
  /** Mascot name. */
  mascot: 'Pip',
  /** Short mascot descriptor for alt text / intros. */
  mascotDescription: 'un brote chiquito y curioso con una hoja muy expresiva',
  /** Theme color for browser chrome / manifest. */
  themeColor: '#0C1A13',
  /** Default locale. */
  defaultLocale: 'es',
  /**
   * Support / contact handle shown in settings, legal pages and the consumer
   * buttons. `NEXT_PUBLIC_CONTACT_EMAIL` in Vercel replaces it without a code
   * change (for example hola@<your domain>, once there is one).
   */
  contactEmail: (process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'aiaureum@gmail.com').trim(),
} as const;

export type Brand = typeof BRAND;
