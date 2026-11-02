'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { BellRing, Download, Search, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Actualizar, Cargando, ErrorCarga, Etiqueta, PageHeader, Pestanas, Section, Tabla, Td, Th, Vacio, fecha, hace, num } from '@/components/panel/ui';
import { CUENTA, adminAnaliticaUsuarios, type UsuarioAnalitica } from '@/lib/api/admin';

/**
 * `/panel/personas` — todas las cuentas: buscar, ordenar y entrar a la ficha.
 * Busca por nombre, usuario, correo o ciudad (`admin_analitica_usuarios`, 0128).
 */

type Orden = 'recientes' | 'activos' | 'inactivos';

const TIPO: Record<string, string> = { adult: 'Adulto', teen: '13–17', kid: 'Chico' };

function descargarCsv(filas: UsuarioAnalitica[]) {
  const cols = ['usuario', 'nombre', 'correo', 'alta', 'tipo', 'ciudad', 'plan', 'ultima_vez', 'dias_activos_30d', 'acciones_30d', 'racha', 'avisos', 'plataforma', 'instalada'];
  const celda = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const texto = [
    cols.join(','),
    ...filas.map((u) =>
      [u.username, u.display_name, u.email, u.alta_at, u.account_type, u.city, u.plan, u.ultima_vez, u.dias_activos_30d, u.acciones_30d, u.racha, u.avisos, u.plataforma, u.instalada]
        .map(celda)
        .join(','),
    ),
  ].join('\n');
  const url = URL.createObjectURL(new Blob([texto], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `brote-personas-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function PersonasPage() {
  const [texto, setTexto] = useState('');
  const [busca, setBusca] = useState('');
  const [orden, setOrden] = useState<Orden>('recientes');

  // Espera a que se deje de escribir: cada búsqueda recorre varias tablas.
  useEffect(() => {
    const t = setTimeout(() => setBusca(texto.trim()), 350);
    return () => clearTimeout(t);
  }, [texto]);

  const q = useQuery({
    queryKey: ['panel', 'personas', busca, orden],
    queryFn: () => adminAnaliticaUsuarios(CUENTA, busca, orden, 200),
  });
  const filas = q.data ?? [];

  return (
    <div>
      <PageHeader
        eyebrow="Personas"
        title="Personas"
        description="Buscá a cualquiera, mirá cómo usa la app y entrá a su ficha."
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => descargarCsv(filas)} disabled={!filas.length}>
              <Download className="h-4 w-4" /> Exportar
            </Button>
            <Actualizar onClick={() => void q.refetch()} cargando={q.isFetching} />
          </>
        }
      />

      <div className="relative mb-4 max-w-md">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input icon value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Nombre, usuario, correo o ciudad" aria-label="Buscar personas" />
      </div>

      {!busca && (
        <Pestanas<Orden>
          valor={orden}
          onCambiar={setOrden}
          opciones={[
            { value: 'recientes', label: 'Últimas en llegar' },
            { value: 'activos', label: 'Más activas' },
            { value: 'inactivos', label: 'Hace más que no entran' },
          ]}
        />
      )}

      {q.isError || (q.isFetched && q.data === null) ? (
        <ErrorCarga onReintentar={() => void q.refetch()} />
      ) : q.isLoading ? (
        <Cargando filas={1} alto="h-96" />
      ) : (
        <Section sinPadding>
          {filas.length === 0 ? (
            <Vacio>{busca ? `Nadie coincide con «${busca}».` : 'Todavía no hay personas.'}</Vacio>
          ) : (
            <Tabla minimo={880}>
              <thead>
                <tr>
                  <Th>Persona</Th>
                  <Th>Alta</Th>
                  <Th>Última vez</Th>
                  <Th>Ciudad</Th>
                  <Th derecha>Días activos</Th>
                  <Th derecha>Acciones</Th>
                  <Th derecha>Racha</Th>
                  <Th>Estado</Th>
                </tr>
              </thead>
              <tbody>
                {filas.map((u) => (
                  <tr key={u.id} className="transition-colors hover:bg-surface-2/60">
                    <Td className="max-w-[260px]">
                      <Link href={`/panel/personas/${u.id}`} className="block min-w-0">
                        <span className="block truncate font-semibold hover:underline">{u.display_name ?? u.username ?? 'Sin nombre'}</span>
                        <span className="block truncate text-caption text-muted-foreground">
                          {u.username ? `@${u.username} · ` : ''}
                          {u.email}
                        </span>
                      </Link>
                    </Td>
                    <Td className="whitespace-nowrap">{fecha(u.alta_at)}</Td>
                    <Td className="whitespace-nowrap">{hace(u.ultima_vez)}</Td>
                    <Td className="max-w-[140px] truncate">{u.city ?? '—'}</Td>
                    <Td derecha>{num(u.dias_activos_30d)}</Td>
                    <Td derecha>{num(u.acciones_30d)}</Td>
                    <Td derecha>{num(u.racha)}</Td>
                    <Td>
                      <span className="flex flex-wrap items-center gap-1">
                        <Etiqueta>{TIPO[u.account_type] ?? u.account_type}</Etiqueta>
                        {u.plan === 'plus' && <Etiqueta tono="ok">Brote+</Etiqueta>}
                        {u.es_prueba && <Etiqueta tono="info">Prueba</Etiqueta>}
                        {!u.onboarding && <Etiqueta tono="atencion">Sin onboarding</Etiqueta>}
                        {u.avisos && <BellRing className="h-3.5 w-3.5 text-muted-foreground" aria-label="Con avisos" />}
                        {u.instalada && <Smartphone className="h-3.5 w-3.5 text-muted-foreground" aria-label="App instalada" />}
                      </span>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Tabla>
          )}
        </Section>
      )}
      {filas.length === 200 && <p className="mt-3 text-caption text-muted-foreground">Se muestran 200. Usá la búsqueda para encontrar a alguien en particular.</p>}
    </div>
  );
}
