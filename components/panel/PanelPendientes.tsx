'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, ChevronRight, Inbox } from 'lucide-react';
import { adminPendientes } from '@/lib/api/admin';
import { cn } from '@/lib/utils/cn';

/**
 * La bandeja: todo lo que espera una respuesta, con su número, arriba de todo.
 * Antes cada cola vivía en su pantalla y había que entrar a cada una para saber
 * si había algo. Lo que está en cero no se dibuja.
 */
const COLAS: { clave: string; etiqueta: string; href: string; urgente?: boolean }[] = [
  { clave: 'negocios', etiqueta: 'Empresas esperando revisión', href: '/panel/negocios', urgente: true },
  { clave: 'desafios', etiqueta: 'Entregas de desafíos', href: '/panel/desafios', urgente: true },
  { clave: 'objetivos', etiqueta: 'Objetivos para cerrar', href: '/panel/objetivos', urgente: true },
  { clave: 'listados', etiqueta: 'Productos para revisar', href: '/panel/listados', urgente: true },
  { clave: 'reportes_plaza', etiqueta: 'Reportes de la Plaza', href: '/panel#moderacion', urgente: true },
  { clave: 'reportes_mercado', etiqueta: 'Reportes del Mercado', href: '/panel/reportes', urgente: true },
  { clave: 'compromisos', etiqueta: 'Compromisos de tiendas', href: '/panel/compromisos' },
  { clave: 'auditoria', etiqueta: 'Publicaciones aceleradas para auditar', href: '/panel/listados' },
  { clave: 'academia', etiqueta: 'Contenido de la Academia', href: '/panel#academia' },
  { clave: 'pagos_fallidos', etiqueta: 'Cobros con problemas', href: '/panel/suscripciones', urgente: true },
  { clave: 'errores_mundo_24h', etiqueta: 'Fallos del mundo en 24 h', href: '/panel/pruebas' },
];

export function PanelPendientes({ pass, refresco = 0 }: { pass: string; refresco?: number }) {
  const [datos, setDatos] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    let vivo = true;
    adminPendientes(pass).then((d) => vivo && setDatos(d));
    return () => {
      vivo = false;
    };
  }, [pass, refresco]);

  if (!datos) return <div className="skeleton h-24 rounded-card" />;

  const filas = COLAS.filter((c) => (datos[c.clave] ?? 0) > 0);
  const total = filas.reduce((n, c) => n + (datos[c.clave] ?? 0), 0);

  return (
    <section aria-labelledby="pendientes-titulo">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 id="pendientes-titulo" className="font-display text-h3 font-bold">
          Pendientes
        </h2>
        <span className="eyebrow text-muted-foreground tnum">{total === 0 ? 'Nada esperando' : `${total} en total`}</span>
      </div>
      {filas.length === 0 ? (
        <div className="flex items-center gap-3 rounded-card border border-border bg-surface p-4 text-small text-muted-foreground">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
          Nadie está esperando una respuesta. Cuando llegue algo, además de verlo acá te avisa al teléfono si activaste
          los avisos en esta cuenta.
        </div>
      ) : (
        <div className="divide-y divide-hairline overflow-hidden rounded-card border border-border bg-surface">
          {filas.map((c) => (
            <Link
              key={c.clave}
              href={c.href}
              className="group flex items-center gap-3 px-4 py-3 transition-colors duration-150 hover:bg-surface-2"
            >
              <Inbox className={cn('h-4 w-4 shrink-0', c.urgente ? 'text-brote-coral' : 'text-muted-foreground')} />
              <span className="min-w-0 flex-1 text-small font-medium">{c.etiqueta}</span>
              <span
                className={cn(
                  'rounded-pill px-2.5 py-0.5 text-caption font-bold tnum',
                  c.urgente ? 'bg-brote-coral/15 text-brote-coral' : 'bg-surface-2 text-foreground',
                )}
              >
                {datos[c.clave]}
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
