'use client';

import { Component, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Pip } from '@/components/pip/Pip';
import { reportarError } from '@/lib/errores';

/**
 * La red de un paso. Si un renderer se rompe con un dato inesperado, se rompe
 * ese paso y no la lección: lo que ya se respondió está guardado en el servidor
 * y se puede salir y volver, nunca queda una pantalla en blanco sin salida.
 */
export class PasoSeguro extends Component<{ children: ReactNode; onSalir: () => void }, { fallo: boolean }> {
  override state = { fallo: false };

  static getDerivedStateFromError() {
    return { fallo: true };
  }

  override componentDidCatch(error: unknown) {
    console.error('[academia] un paso no se pudo mostrar', error);
    reportarError(error);
  }

  override render() {
    if (!this.state.fallo) return this.props.children;
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <Pip size={72} mood="worried" />
        <p className="max-w-xs text-small leading-relaxed text-muted-foreground">
          Este paso no se pudo mostrar. Lo que ya respondiste está guardado: podés salir y seguir después.
        </p>
        <Button variant="secondary" onClick={this.props.onSalir}>
          Salir de la lección
        </Button>
      </div>
    );
  }
}
