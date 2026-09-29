import {
  Bike,
  Briefcase,
  Carrot,
  PawPrint,
  Shirt,
  Sofa,
  Sparkles,
  SprayCan,
  Sprout,
  Wheat,
  Wine,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import type { Categoria } from '@/lib/mercado/categorias';

/**
 * Cómo se ve cada categoría: un ícono y un color de acento. El color es de
 * identidad (como los dominios), no de tema: funciona igual en claro y oscuro,
 * y nunca va como color de texto sobre el fondo (contraste): solo en un punto,
 * un fondo tenue o un borde.
 */
export const VISUAL_CATEGORIA: Record<Categoria, { icono: LucideIcon; color: string }> = {
  'alimentos-frescos': { icono: Carrot, color: '#9CC93B' },
  'almacen-granel': { icono: Wheat, color: '#D4A04C' },
  bebidas: { icono: Wine, color: '#C2556B' },
  'limpieza-hogar': { icono: SprayCan, color: '#2DB4D4' },
  'cuidado-personal': { icono: Sparkles, color: '#B07CD6' },
  indumentaria: { icono: Shirt, color: '#5B6CF0' },
  'hogar-y-deco': { icono: Sofa, color: '#C2703D' },
  'jardin-y-huerta': { icono: Sprout, color: '#3CB371' },
  mascotas: { icono: PawPrint, color: '#FF8A3D' },
  movilidad: { icono: Bike, color: '#1E88A8' },
  'servicios-profesionales': { icono: Briefcase, color: '#3DC1C1' },
  'reparacion-y-reuso': { icono: Wrench, color: '#A38B6D' },
};

export function visualCategoria(c: string): { icono: LucideIcon; color: string } {
  return VISUAL_CATEGORIA[c as Categoria] ?? { icono: Sparkles, color: '#1FB57A' };
}
