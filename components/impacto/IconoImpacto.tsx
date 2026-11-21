import {
  AirVent,
  Bath,
  Car,
  Cylinder,
  GlassWater,
  House,
  Laptop,
  Lightbulb,
  Milk,
  PaintBucket,
  Refrigerator,
  Route,
  ShoppingBag,
  ShowerHead,
  Smartphone,
  Trash2,
  User,
  WashingMachine,
  Container,
  type LucideIcon,
} from 'lucide-react';
import type { IconoImpacto as Clave } from '@/lib/impact';

/** Un ícono por cosa de la casa de las historias de impacto (`lib/impacto/historias.ts`). */
const ICONOS: Record<Clave, LucideIcon> = {
  tanque: Cylinder,
  banera: Bath,
  lavado: WashingMachine,
  ducha: ShowerHead,
  bidon: Container,
  balde: PaintBucket,
  vaso: GlassWater,
  auto: Car,
  ruta: Route,
  celular: Smartphone,
  aire: AirVent,
  bolsa: ShoppingBag,
  botella: Milk,
  basura: Trash2,
  notebook: Laptop,
  heladera: Refrigerator,
  casa: House,
  lampara: Lightbulb,
  persona: User,
};

export function IconoImpacto({ icono, className }: { icono: Clave; className?: string }) {
  const Icon = ICONOS[icono] ?? GlassWater;
  return <Icon className={className} aria-hidden />;
}
