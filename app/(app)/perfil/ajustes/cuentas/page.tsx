'use client';

import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Ban, VolumeX } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PipAvatar } from '@/components/pip/PipAvatar';
import { fetchBlocksAndMutes } from '@/lib/api/perfil-publico';
import { blockUser, muteUser, type SocialAccount } from '@/lib/api/social';
import { toast } from '@/stores/toast';

/**
 * Who you have blocked or muted, and the way back.
 *
 * A block with no undo is a trap: people block in a bad moment and then have
 * no way to change their mind. Muting and blocking are also genuinely
 * different — a mute is "not in my feed", a block is "we cannot see each other
 * at all, in either direction" — so they are two lists, not one with a tag.
 */
export default function CuentasPage() {
  const t = useTranslations('moderacion');
  const tp = useTranslations('ajustes');
  const qc = useQueryClient();

  const q = useQuery({ queryKey: ['blocks-and-mutes'], queryFn: fetchBlocksAndMutes });

  async function undoBlock(id: string) {
    const res = await blockUser(id, false);
    if (!res.ok) return toast.error(res.error ?? 'No se pudo');
    qc.invalidateQueries({ queryKey: ['blocks-and-mutes'] });
    qc.invalidateQueries({ queryKey: ['feed'] });
  }

  async function undoMute(id: string) {
    const res = await muteUser(id, false);
    if (!res.ok) return toast.error(res.error ?? 'No se pudo');
    qc.invalidateQueries({ queryKey: ['blocks-and-mutes'] });
    qc.invalidateQueries({ queryKey: ['feed'] });
  }

  return (
    <div className="space-y-5 pb-6">
      <Link href="/perfil/ajustes" className="inline-flex items-center gap-1.5 text-small text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> {tp('title')}
      </Link>
      <h1 className="font-display text-h1 font-bold">{t('blockedAndMuted')}</h1>

      {q.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <>
          <ListSection
            title={t('blockedList')}
            icon={<Ban className="h-4 w-4 text-brote-coral" />}
            empty={t('noneBlocked')}
            accounts={q.data?.blocked ?? []}
            actionLabel={t('unblock')}
            onAction={undoBlock}
          />
          <ListSection
            title={t('mutedList')}
            icon={<VolumeX className="h-4 w-4 text-muted-foreground" />}
            empty={t('noneMuted')}
            accounts={q.data?.muted ?? []}
            actionLabel={t('unmute')}
            onAction={undoMute}
          />
        </>
      )}
    </div>
  );
}

function ListSection({
  title,
  icon,
  empty,
  accounts,
  actionLabel,
  onAction,
}: {
  title: string;
  icon: React.ReactNode;
  empty: string;
  accounts: SocialAccount[];
  actionLabel: string;
  onAction: (id: string) => void;
}) {
  return (
    <section>
      <h2 className="mb-2 flex items-center gap-1.5 font-display text-h3 font-bold">
        {icon}
        {title}
      </h2>
      {accounts.length === 0 ? (
        <Card className="p-4">
          <p className="text-small text-muted-foreground">{empty}</p>
        </Card>
      ) : (
        <Card className="divide-y divide-hairline">
          {accounts.map((a) => (
            <div key={a.id} className="flex items-center gap-3 p-3.5">
              <PipAvatar
                pipStyle={a.pip_style}
                avatarUrl={a.avatar_url}
                name={a.display_name}
                rankSlug={a.rank_slug}
                size={36}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-small font-semibold">{a.display_name ?? a.username ?? 'Alguien'}</p>
                <p className="eyebrow truncate text-muted-foreground">@{a.username}</p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => onAction(a.id)}>
                {actionLabel}
              </Button>
            </div>
          ))}
        </Card>
      )}
    </section>
  );
}
