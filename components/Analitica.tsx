'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { enviar, registrarEvento, registrarSeccion } from '@/lib/analitica';

/**
 * Cuenta qué partes de la app se abren (lib/analitica.ts). Va una sola vez en
 * el layout de la app; no dibuja nada.
 */
export function Analitica() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname) registrarSeccion(pathname);
  }, [pathname]);

  useEffect(() => {
    const alOcultar = () => {
      if (document.visibilityState === 'hidden') void enviar(true);
    };
    const instalada = () => registrarEvento('app_instalada');
    // Llegó desde un aviso: el service worker abre la URL con ?desde=aviso.
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('desde') === 'aviso') {
      registrarEvento('aviso_abierto');
    }
    document.addEventListener('visibilitychange', alOcultar);
    window.addEventListener('appinstalled', instalada);
    window.addEventListener('pagehide', alOcultar);
    return () => {
      document.removeEventListener('visibilitychange', alOcultar);
      window.removeEventListener('appinstalled', instalada);
      window.removeEventListener('pagehide', alOcultar);
    };
  }, []);

  return null;
}
