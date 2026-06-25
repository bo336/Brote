'use client';

import { useTranslations } from 'next-intl';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';

/** Explorar — Novedades (news) + Proyectos (community). Built in step 8. */
export default function ExplorarPage() {
  const t = useTranslations('explorar');

  return (
    <div className="space-y-4">
      <Tabs defaultValue="novedades">
        <TabsList className="w-full">
          <TabsTrigger value="novedades" className="flex-1">
            {t('novedades')}
          </TabsTrigger>
          <TabsTrigger value="proyectos" className="flex-1">
            {t('proyectos')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="novedades">
          <EmptyState message={t('newsEmpty')} />
        </TabsContent>
        <TabsContent value="proyectos">
          <EmptyState message={t('projectsEmpty')} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
