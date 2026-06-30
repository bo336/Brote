'use client';

/** Root error boundary (catches errors in the root layout). Self-contained. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: 24,
          textAlign: 'center',
          background: '#0C1A13',
          color: '#F7F5EF',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '1.4rem' }}>Algo salió mal 🌱</h1>
        <p style={{ color: '#9FB0A6', margin: 0 }}>Recargá la página para volver a intentar.</p>
        <button
          onClick={() => reset()}
          style={{ border: 0, borderRadius: 14, padding: '12px 22px', background: '#1FB57A', color: '#08120d', fontWeight: 700, cursor: 'pointer' }}
        >
          Reintentar
        </button>
      </body>
    </html>
  );
}
