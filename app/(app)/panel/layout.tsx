import { type ReactNode } from 'react';
import { PanelPassProvider } from '@/components/panel/PanelPass';

/** Comparte la contraseña del panel entre la consola y sus colas. */
export default function PanelLayout({ children }: { children: ReactNode }) {
  return <PanelPassProvider>{children}</PanelPassProvider>;
}
