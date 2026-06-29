import {
  Recycle,
  Droplets,
  Zap,
  Bike,
  Sprout,
  Bird,
  Salad,
  ShoppingBag,
  Smartphone,
  Users,
  Waves,
  Wind,
  Microscope,
  Leaf,
  type LucideIcon,
} from 'lucide-react';
import { getDomainColor, type DomainSlug } from '@/lib/domains';
import { cn } from '@/lib/utils/cn';

const DOMAIN_ICON: Record<DomainSlug, LucideIcon> = {
  residuos: Recycle,
  agua: Droplets,
  energia: Zap,
  movilidad: Bike,
  plantas: Sprout,
  animales: Bird,
  alimentacion: Salad,
  consumo: ShoppingBag,
  digital: Smartphone,
  comunidad: Users,
  agua_azul: Waves,
  aire_suelo: Wind,
  ciencia: Microscope,
};

interface DomainIconProps {
  domain: string;
  size?: number;
  /** Render as a filled rounded tile (default) or bare icon. */
  variant?: 'tile' | 'bare';
  className?: string;
}

/**
 * Illustrated domain icon — a 2-tone rounded tile using the domain accent
 * (BUILD_SPEC §2.6). High-traffic activities can override with bespoke art.
 */
export function DomainIcon({ domain, size = 44, variant = 'tile', className }: DomainIconProps) {
  const Icon = DOMAIN_ICON[domain as DomainSlug] ?? Leaf;
  const color = getDomainColor(domain);

  if (variant === 'bare') {
    return <Icon style={{ color }} width={size} height={size} className={className} />;
  }

  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center rounded-[14px]', className)}
      style={{ width: size, height: size, backgroundColor: `${color}1f`, color }}
      aria-hidden
    >
      <Icon style={{ width: size * 0.5, height: size * 0.5 }} strokeWidth={2.2} />
    </span>
  );
}
