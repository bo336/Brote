'use client';

import { useEffect, useRef } from 'react';
import { marcarVistas, type OrigenVista } from '@/lib/mercado/acciones';

const CLAVE = 'brote:mercado:vistas';

function vistasDeSesion(): Set<string> {
  try {
    const crudo = sessionStorage.getItem(CLAVE);
    return new Set<string>(crudo ? (JSON.parse(crudo) as string[]) : []);
  } catch {
    return new Set<string>();
  }
}

function recordar(ids: string[]): void {
  try {
    const s = vistasDeSesion();
    for (const id of ids) s.add(id);
    sessionStorage.setItem(CLAVE, JSON.stringify([...s].slice(-600)));
  } catch {
    /* modo privado: alcanza con la deduplicación de la base */
  }
}

/**
 * Impresiones (05 §4.4, fase 4 §3.2): una tarjeta cuenta cuando ENTRA EN
 * PANTALLA —la mitad a la vista—, no cuando la página la carga. Una vez por
 * listado y por sesión acá, una vez por persona y día en la base, y en tandas
 * cada 800 ms para no mandar una consulta por tarjeta en un scroll rápido.
 *
 * Se engancha a un contenedor: toda descendiente con `data-listado` cuenta.
 * `dependencia` es lo que cambia cuando entran tarjetas nuevas.
 */
export function useImpresiones<T extends HTMLElement>(origen: OrigenVista, dependencia: unknown) {
  const ref = useRef<T>(null);
  const vistos = useRef<Set<string> | null>(null);

  useEffect(() => {
    const raiz = ref.current;
    if (!raiz || typeof IntersectionObserver === 'undefined') return;
    vistos.current ??= vistasDeSesion();
    const pendientes = new Set<string>();
    let timer: ReturnType<typeof setTimeout> | null = null;

    function vaciar() {
      timer = null;
      const lote = [...pendientes];
      pendientes.clear();
      if (lote.length) {
        recordar(lote);
        void marcarVistas(lote, origen);
      }
    }

    const io = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (!e.isIntersecting) continue;
          const id = (e.target as HTMLElement).dataset.listado;
          io.unobserve(e.target);
          if (!id || vistos.current!.has(id)) continue;
          vistos.current!.add(id);
          pendientes.add(id);
        }
        if (pendientes.size && timer === null) timer = setTimeout(vaciar, 800);
      },
      { threshold: 0.5 },
    );
    for (const el of raiz.querySelectorAll<HTMLElement>('[data-listado]')) {
      if (!vistos.current.has(el.dataset.listado ?? '')) io.observe(el);
    }
    return () => {
      io.disconnect();
      if (timer) clearTimeout(timer);
      vaciar();
    };
  }, [origen, dependencia]);

  return ref;
}
