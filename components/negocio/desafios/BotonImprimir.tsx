'use client';

import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Imprimir o guardar como PDF: la página del certificado tiene su propia hoja de impresión. */
export function BotonImprimir() {
  return (
    <Button size="sm" variant="secondary" onClick={() => window.print()}>
      <Printer className="h-4 w-4" /> Imprimir o guardar PDF
    </Button>
  );
}
