'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Lock, Check } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useSession } from '@/stores/session';
import { fetchTitles, fetchBadges, equipTitle } from '@/lib/api/profile';
import { getDomainColor } from '@/lib/domains';
import { cn } from '@/lib/utils/cn';
import { toast } from '@/stores/toast';

const RARITY_RING: Record<string, string> = {
  common: 'ring-border',
  rare: 'ring-domain-agua',
  epic: 'ring-domain-consumo',
  legendary: 'ring-brote-sun',
};
const RARITY_LABEL: Record<string, string> = { common: 'Común', rare: 'Raro', epic: 'Épico', legendary: 'Legendario' };

export default function LogrosPage() {
  const t = useTranslations('perfil');
  const tc = useTranslations('common');
  const qc = useQueryClient();
  const profile = useSession((s) => s.profile);
  const setProfile = useSession((s) => s.setProfile);

  const titlesQ = useQuery({
    queryKey: ['titles', profile?.id],
    queryFn: () => fetchTitles(profile!.id),
    enabled: !!profile?.id,
  });
  const badgesQ = useQuery({ queryKey: ['badges', profile?.id], queryFn: () => fetchBadges(profile!.id), enabled: !!profile?.id });

  const equipM = useMutation({
    mutationFn: (titleId: string | null) => equipTitle(titleId),
    onSuccess: (_d, titleId) => {
      const title = titlesQ.data?.find((x) => x.id === titleId);
      if (profile) setProfile({ ...profile, equippedTitle: title?.name_es ?? null });
      qc.invalidateQueries({ queryKey: ['titles'] });
      toast.success(titleId ? '¡Título equipado!' : 'Título quitado');
    },
  });

  return (
    <div className="space-y-4">
      <Link href="/perfil" className="inline-flex items-center gap-1.5 text-small text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> {t('title')}
      </Link>
      <h1 className="font-display text-h1 font-bold">{t('logros')}</h1>

      <Tabs defaultValue="titulos">
        <TabsList className="w-full">
          <TabsTrigger value="titulos" className="flex-1">
            {t('titles')}
          </TabsTrigger>
          <TabsTrigger value="medallas" className="flex-1">
            {t('badges')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="titulos" className="space-y-2">
          {titlesQ.isLoading
            ? [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)
            : (titlesQ.data ?? []).map((title) => (
                <Card key={title.id} className={cn('flex items-center gap-3 p-3', !title.earned && 'opacity-60')}>
                  <span
                    className={cn(
                      'flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg ring-2',
                      RARITY_RING[title.rarity] ?? 'ring-border',
                    )}
                    style={{ backgroundColor: title.domain_slug ? `${getDomainColor(title.domain_slug)}22` : 'rgb(var(--surface-2))' }}
                  >
                    {title.earned ? '🏅' : <Lock className="h-4 w-4 text-muted-foreground" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-small font-semibold">{title.name_es}</p>
                    <p className="text-caption text-muted-foreground">
                      {RARITY_LABEL[title.rarity]} · {title.description_es}
                    </p>
                  </div>
                  {title.earned &&
                    (title.equipped ? (
                      <Button size="sm" variant="secondary" disabled className="shrink-0">
                        <Check className="h-4 w-4" /> {t('equipped')}
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" className="shrink-0" loading={equipM.isPending} onClick={() => equipM.mutate(title.id)}>
                        {t('equip')}
                      </Button>
                    ))}
                </Card>
              ))}
        </TabsContent>

        <TabsContent value="medallas">
          {badgesQ.isLoading ? (
            <div className="grid grid-cols-3 gap-3">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-28 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {(badgesQ.data ?? []).map((badge) => (
                <div
                  key={badge.id}
                  className={cn(
                    'flex flex-col items-center gap-1.5 rounded-card border border-border bg-surface p-3 text-center',
                    !badge.earned && 'opacity-55',
                  )}
                  title={badge.description_es ?? ''}
                >
                  <span className={cn('text-3xl', !badge.earned && 'grayscale')}>{badge.earned ? '🎖️' : '🔒'}</span>
                  <p className="text-caption font-semibold leading-tight">{badge.name_es}</p>
                  {!badge.earned && <p className="text-[10px] leading-tight text-muted-foreground">{badge.description_es}</p>}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
