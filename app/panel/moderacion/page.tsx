'use client';

import { ModerationQueue } from '@/components/panel/ModerationQueue';
import { PageHeader } from '@/components/panel/ui';
import { CUENTA } from '@/lib/api/admin';

/** `/panel/moderacion` — los reportes de la Plaza. Del otro lado hay alguien esperando. */
export default function ModeracionPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Comunidad"
        title="Moderación"
        description="Lo que la gente reportó en la Plaza. Con tres reportes una publicación se oculta sola; acá se decide si se queda oculta."
      />
      <ModerationQueue pass={CUENTA} />
    </div>
  );
}
