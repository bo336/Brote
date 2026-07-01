'use client';

import { useEffect } from 'react';

/**
 * Root-level error boundary for routes outside the (app) group (e.g.
 * /onboarding, /auth/*). Mirrors app/(app)/error.tsx so a transient failure
 * (a DB hiccup, a network blip) never looks like a silent bounce back to
 * login — it shows a clear retry instead.
 */
export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-6 text-center text-foreground">
      <div>
        <h1 className="text-xl font-bold">Algo no salió como esperábamos</h1>
        <p className="mt-1 text-sm text-muted-foreground">Probá de nuevo en un momento.</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => reset()}
          className="rounded-full bg-primary px-5 py-2.5 font-semibold text-primary-foreground"
        >
          Reintentar
        </button>
        <button
          onClick={() => (window.location.href = '/')}
          className="rounded-full border border-border px-5 py-2.5 font-semibold"
        >
          Ir al inicio
        </button>
      </div>
      {process.env.NODE_ENV !== 'production' && (
        <pre className="mt-2 max-w-full overflow-auto rounded-xl bg-black/20 p-3 text-left text-xs text-red-400">
          {error.message}
        </pre>
      )}
    </div>
  );
}
