'use client';

import { useState } from 'react';
import { ColaAcademia } from '@/components/panel/ColaAcademia';
import { MetricasAcademia } from '@/components/panel/MetricasAcademia';
import { PageHeader, Pestanas } from '@/components/panel/ui';
import { CUENTA } from '@/lib/api/admin';

/** `/panel/academia` — lo que espera revisión antes de llegar a alguien, y cómo viene el contenido. */
export default function AcademiaPanelPage() {
  const [vista, setVista] = useState<'cola' | 'metricas'>('cola');
  return (
    <div>
      <PageHeader
        eyebrow="Contenido"
        title="Academia"
        description="Nada generado llega a nadie hasta que alguien lo mira. Cómo se usan las lecciones y dónde se abandonan está en Analítica."
      />
      <Pestanas
        valor={vista}
        onCambiar={setVista}
        opciones={[
          { value: 'cola', label: 'Para revisar' },
          { value: 'metricas', label: 'Contenido y costos' },
        ]}
      />
      {vista === 'cola' ? <ColaAcademia pass={CUENTA} /> : <MetricasAcademia pass={CUENTA} />}
    </div>
  );
}
