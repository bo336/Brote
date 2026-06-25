'use client';

import { useTranslations } from 'next-intl';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';

/** Ranking / Leaderboards (BUILD_SPEC §8.6). Built in step 9. */
export default function RankingPage() {
  const t = useTranslations('ranking');

  return (
    <div className="space-y-4">
      <Tabs defaultValue="global">
        <div className="no-scrollbar -mx-4 overflow-x-auto px-4">
          <TabsList>
            <TabsTrigger value="global">{t('global')}</TabsTrigger>
            <TabsTrigger value="barrio">{t('barrio')}</TabsTrigger>
            <TabsTrigger value="amigos">{t('amigos')}</TabsTrigger>
            <TabsTrigger value="dominio">{t('porDominio')}</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="global">
          <EmptyState message="Iniciá sesión para aparecer en el ranking y competir con tu barrio." />
        </TabsContent>
        <TabsContent value="barrio">
          <EmptyState message="Tu ranking local aparece acá cuando elijas tu barrio." />
        </TabsContent>
        <TabsContent value="amigos">
          <EmptyState message={t('friendsEmpty')} />
        </TabsContent>
        <TabsContent value="dominio">
          <EmptyState message="Elegí un tema para ver su ranking." />
        </TabsContent>
      </Tabs>
    </div>
  );
}
