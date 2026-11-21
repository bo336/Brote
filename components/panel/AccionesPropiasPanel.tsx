'use client';

import { useCallback, useEffect, useState } from 'react';
import { Cargando, ErrorCarga, Etiqueta, Section, Stat, StatGrid, Tabla, Td, Th, Vacio } from '@/components/panel/ui';
import { adminPropias, type PanelPropias } from '@/lib/api/propias';
import { getDomainName } from '@/lib/domains';

/**
 * Las acciones propias en el panel (0150, docs/REESTRUCTURA.md D6).
 *
 * Lo que la gente carga por su cuenta es la mejor lista de lo que le falta al
 * catálogo: lo que repiten varias personas es candidato a acción con impacto
 * medido. Y lo raro (alguien que carga 10 por día) salta a la vista.
 */
export function AccionesPropiasPanel({ pass }: { pass: string }) {
  const [datos, setDatos] = useState<PanelPropias | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setError(null);
    const r = await adminPropias(pass);
    if (!r.ok) {
      setError('error' in r ? r.error : 'No se pudo cargar');
      return;
    }
    setDatos(r);
  }, [pass]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  if (error) return <ErrorCarga onReintentar={() => void cargar()} mensaje={error} />;
  if (!datos) return <Cargando />;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-h2 font-bold">Acciones propias</h2>
        <p className="mt-0.5 text-small text-muted-foreground">
          Lo que la gente carga y no está en el catálogo. Siempre {datos.reglas.puntos} puntos, las {datos.reglas.con_puntos_por_dia} primeras
          del día; hasta {datos.reglas.max_por_dia} por día. No suman impacto.
        </p>
      </div>

      <StatGrid columnas={3}>
        <Stat label="Cargadas (7 días)" value={datos.semana.cargadas} />
        <Stat label="Personas (7 días)" value={datos.semana.personas} />
        <Stat label="Puntos dados (7 días)" value={datos.semana.puntos} />
      </StatGrid>

      <Section
        title="Las que más se repiten (30 días)"
        description="Cargadas por 2 personas o más. Candidatas a sumarse al catálogo con su impacto medido."
        sinPadding
      >
        {datos.repetidas.length === 0 ? (
          <Vacio>Todavía nada se repite entre personas.</Vacio>
        ) : (
          <Tabla minimo={520}>
            <thead>
              <tr>
                <Th>Título</Th>
                <Th>Tema</Th>
                <Th derecha>Veces</Th>
                <Th derecha>Personas</Th>
              </tr>
            </thead>
            <tbody>
              {datos.repetidas.map((r) => (
                <tr key={r.titulo_norm}>
                  <Td>{r.ejemplo}</Td>
                  <Td>{getDomainName(r.dominio)}</Td>
                  <Td derecha>{r.veces}</Td>
                  <Td derecha>{r.personas}</Td>
                </tr>
              ))}
            </tbody>
          </Tabla>
        )}
      </Section>

      <Section title="Lo último" sinPadding>
        {datos.ultimas.length === 0 ? (
          <Vacio>Nadie cargó nada todavía.</Vacio>
        ) : (
          <Tabla minimo={640}>
            <thead>
              <tr>
                <Th>Título</Th>
                <Th>Tema</Th>
                <Th>Quién</Th>
                <Th derecha>Puntos</Th>
                <Th derecha>Día</Th>
              </tr>
            </thead>
            <tbody>
              {datos.ultimas.map((u) => (
                <tr key={u.id} className={u.borrada ? 'opacity-50' : undefined}>
                  <Td>
                    {u.titulo} {u.borrada && <Etiqueta>borrada</Etiqueta>}
                  </Td>
                  <Td>{getDomainName(u.dominio)}</Td>
                  <Td>
                    {u.usuario ? `@${u.usuario}` : '—'} {u.cuenta !== 'adult' && <Etiqueta tono="atencion">{u.cuenta === 'kid' ? 'chico' : 'adolescente'}</Etiqueta>}
                  </Td>
                  <Td derecha>{u.puntos}</Td>
                  <Td derecha>{new Date(`${u.fecha}T12:00:00`).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}</Td>
                </tr>
              ))}
            </tbody>
          </Tabla>
        )}
      </Section>
    </div>
  );
}
