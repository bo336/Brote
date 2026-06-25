/**
 * The 13 canonical environmental domains (BUILD_SPEC §3.4).
 * Mirrored in the DB `domains` table (seed). Each domain owns one accent color
 * used for its icon, leaderboard, category headers, progress, and accents —
 * never for global chrome.
 */
export type DomainSlug =
  | 'residuos'
  | 'agua'
  | 'energia'
  | 'movilidad'
  | 'plantas'
  | 'animales'
  | 'alimentacion'
  | 'consumo'
  | 'digital'
  | 'comunidad'
  | 'agua_azul'
  | 'aire_suelo'
  | 'ciencia';

export interface Domain {
  slug: DomainSlug;
  name_es: string;
  name_en: string;
  color: string;
  /** Short one-line description (Pip voice). */
  description_es: string;
  sort_order: number;
}

export const DOMAINS: Domain[] = [
  {
    slug: 'residuos',
    name_es: 'Residuos y Reciclaje',
    name_en: 'Waste & Recycling',
    color: '#C2703D',
    description_es: 'Menos basura, más vueltas: reducí, reusá y reciclá.',
    sort_order: 1,
  },
  {
    slug: 'agua',
    name_es: 'Agua',
    name_en: 'Water',
    color: '#2DB4D4',
    description_es: 'Cada gota cuenta. Cuidá el agua en casa.',
    sort_order: 2,
  },
  {
    slug: 'energia',
    name_es: 'Energía y CO₂',
    name_en: 'Home Energy & CO₂',
    color: '#F4A62A',
    description_es: 'Gastá menos energía y bajá tus emisiones.',
    sort_order: 3,
  },
  {
    slug: 'movilidad',
    name_es: 'Movilidad',
    name_en: 'Transport',
    color: '#5B6CF0',
    description_es: 'Moverte limpio: a pie, en bici o en transporte.',
    sort_order: 4,
  },
  {
    slug: 'plantas',
    name_es: 'Plantas y Verde Urbano',
    name_en: 'Plants & Greening',
    color: '#3CB371',
    description_es: 'Sembrá vida y llená de verde tu entorno.',
    sort_order: 5,
  },
  {
    slug: 'animales',
    name_es: 'Animales y Vida Silvestre',
    name_en: 'Animals & Wildlife',
    color: '#E8638C',
    description_es: 'Dales una mano a los bichos y la fauna.',
    sort_order: 6,
  },
  {
    slug: 'alimentacion',
    name_es: 'Alimentación',
    name_en: 'Food & Diet',
    color: '#9CC93B',
    description_es: 'Comé rico cuidando el planeta.',
    sort_order: 7,
  },
  {
    slug: 'consumo',
    name_es: 'Consumo Responsable',
    name_en: 'Consumption & Shopping',
    color: '#B07CD6',
    description_es: 'Comprá mejor, comprá menos, durá más.',
    sort_order: 8,
  },
  {
    slug: 'digital',
    name_es: 'Digital y Tecnología',
    name_en: 'Tech & Digital Carbon',
    color: '#3DC1C1',
    description_es: 'Tu huella digital también pesa: livianala.',
    sort_order: 9,
  },
  {
    slug: 'comunidad',
    name_es: 'Comunidad',
    name_en: 'Community Action',
    color: '#FF8A3D',
    description_es: 'Juntos podemos más. Sumate al barrio.',
    sort_order: 10,
  },
  {
    slug: 'agua_azul',
    name_es: 'Océanos y Ríos',
    name_en: 'Water Bodies & Oceans',
    color: '#1E88A8',
    description_es: 'Protegé el agua azul: ríos, costas y mares.',
    sort_order: 11,
  },
  {
    slug: 'aire_suelo',
    name_es: 'Aire y Suelo',
    name_en: 'Air, Soil & Land',
    color: '#A38B6D',
    description_es: 'Aire más limpio y suelo más sano.',
    sort_order: 12,
  },
  {
    slug: 'ciencia',
    name_es: 'Ciencia Ciudadana',
    name_en: 'Citizen Science',
    color: '#6FBF73',
    description_es: 'Observá, registrá y ayudá a la ciencia.',
    sort_order: 13,
  },
];

export const DOMAIN_BY_SLUG: Record<DomainSlug, Domain> = Object.fromEntries(
  DOMAINS.map((d) => [d.slug, d]),
) as Record<DomainSlug, Domain>;

export function getDomain(slug: string): Domain | undefined {
  return DOMAIN_BY_SLUG[slug as DomainSlug];
}

export function getDomainColor(slug: string): string {
  return DOMAIN_BY_SLUG[slug as DomainSlug]?.color ?? '#1FB57A';
}

export function getDomainName(slug: string, lang: 'es' | 'en' = 'es'): string {
  const d = DOMAIN_BY_SLUG[slug as DomainSlug];
  if (!d) return slug;
  return lang === 'en' ? d.name_en : d.name_es;
}
