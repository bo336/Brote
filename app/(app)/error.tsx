'use client';

import { useEffect } from 'react';
import { Pip } from '@/components/pip/Pip';
import { Button } from '@/components/ui/button';

/** Friendly error boundary for the app shell — never a blank screen (§2.7). */
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Surface the error for debugging.
    console.error('App error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center gap-4 px-6 text-center">
      <Pip size={88} mood="worried" />
      <div>
        <h1 className="font-display text-h2 font-bold">Algo no salió como esperábamos</h1>
        <p className="mt-1 text-small text-muted-foreground">Probá de nuevo en un momento.</p>
      </div>
      <div className="flex gap-2">
        <Button variant="primary" onClick={() => reset()}>
          Reintentar
        </Button>
        <Button variant="secondary" onClick={() => (window.location.href = '/')}>
          Ir al inicio
        </Button>
      </div>
      {process.env.NODE_ENV !== 'production' && (
        <pre className="mt-2 max-w-full overflow-auto rounded-card bg-surface-2 p-3 text-left text-caption text-brote-coral">
          {error.message}
        </pre>
      )}
    </div>
  );
}
