'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { lugarDe } from '@/lib/lugares';

/**
 * Sigue el lugar donde estás en las navegaciones del cliente y lo deja en
 * `<html data-lugar>` (la primera carga la resuelve `scriptLugar()` antes de
 * pintar). Con eso `--primary` cambia de color por lugar: ver `lib/lugares.ts`.
 */
export function LugarActual() {
  const pathname = usePathname();
  useEffect(() => {
    const l = lugarDe(pathname ?? '/');
    const html = document.documentElement;
    if (l) html.setAttribute('data-lugar', l);
    else html.removeAttribute('data-lugar');
  }, [pathname]);
  return null;
}
