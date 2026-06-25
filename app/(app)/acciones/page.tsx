'use client';

import { useTranslations } from 'next-intl';
import { SectionHeader } from '@/components/ui/section';
import { DomainIcon } from '@/components/icons/DomainIcon';
import { Card } from '@/components/ui/card';
import { Pip } from '@/components/pip/Pip';
import { DOMAINS } from '@/lib/domains';

/**
 * Acciones / Activity Catalog (BUILD_SPEC §8.4). The personalized "Para Vos"
 * feed, search, filters and the full catalog land in step 6. Scaffold shows the
 * 13 domains so the structure is visible and on-brand.
 */
export default function AccionesPage() {
  const t = useTranslations('acciones');

  return (
    <div className="space-y-6">
      <Card className="flex items-center gap-3 p-4">
        <Pip size={48} />
        <div>
          <p className="font-display text-h3 font-bold">{t('paraVos')}</p>
          <p className="text-small text-muted-foreground">
            Iniciá sesión y te armo recomendaciones según lo que te importa.
          </p>
        </div>
      </Card>

      <section>
        <SectionHeader title={t('browseByDomain')} />
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {DOMAINS.map((d) => (
            <Card
              key={d.slug}
              className="flex flex-col gap-2 p-3.5 transition-transform hover:-translate-y-0.5"
              style={{ borderColor: `${d.color}33` }}
            >
              <DomainIcon domain={d.slug} size={40} />
              <div>
                <p className="text-small font-semibold leading-tight">{d.name_es}</p>
                <p className="mt-0.5 line-clamp-2 text-caption text-muted-foreground">{d.description_es}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
