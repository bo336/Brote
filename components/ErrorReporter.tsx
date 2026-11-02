'use client';

import { useEffect } from 'react';
import { reportarError } from '@/lib/errores';

/** Los errores que no agarra ningún límite de React, para verlos en el panel. */
export function ErrorReporter() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    const alError = (e: ErrorEvent) => {
      // Sólo lo nuestro: un script de terceros no se puede arreglar desde acá.
      if (e.filename && !e.filename.startsWith(window.location.origin)) return;
      reportarError(e.error ?? e.message);
    };
    const alRechazo = (e: PromiseRejectionEvent) => reportarError(e.reason);
    window.addEventListener('error', alError);
    window.addEventListener('unhandledrejection', alRechazo);
    return () => {
      window.removeEventListener('error', alError);
      window.removeEventListener('unhandledrejection', alRechazo);
    };
  }, []);
  return null;
}
