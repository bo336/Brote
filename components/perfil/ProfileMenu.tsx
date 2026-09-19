'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { MoreHorizontal, Ban, VolumeX, Flag } from 'lucide-react';
import { Sheet } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ReportSheet } from '@/components/moderation/ReportSheet';
import { blockUser, muteUser } from '@/lib/api/social';
import { toast } from '@/stores/toast';
import { cn } from '@/lib/utils/cn';
import type { PublicProfileV2 } from '@/lib/api/perfil-publico';

/** Silenciar / bloquear / reportar, from someone else's profile. */
export function ProfileMenu({ profile }: { profile: PublicProfileV2 }) {
  const t = useTranslations('feed');
  const tp = useTranslations('perfilPublico');
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [reporting, setReporting] = useState(false);

  function refresh() {
    qc.invalidateQueries({ queryKey: ['public-profile'] });
    qc.invalidateQueries({ queryKey: ['feed'] });
  }

  async function onMute() {
    const res = await muteUser(profile.id, true);
    if (!res.ok) return toast.error(t('followFailed'), res.error);
    toast.success(t('mutedToast'));
    refresh();
    setOpen(false);
  }

  async function onBlock() {
    // Blocking is mutual and severing — say so before it happens, not after.
    if (!confirm(tp('blockConfirm', { name: profile.display_name ?? profile.username ?? '' }))) return;
    const res = await blockUser(profile.id, true);
    if (!res.ok) return toast.error(t('followFailed'), res.error);
    toast.success(t('blockedToast'));
    refresh();
    setOpen(false);
  }

  const row =
    'flex w-full items-center gap-3 rounded-button px-3 py-3 text-left text-small font-medium transition-colors hover:bg-surface-2';

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={t('more')}
        className="press rounded-full border border-border p-2 text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <div className="space-y-1">
          <button onClick={onMute} className={row}>
            <VolumeX className="h-4 w-4 text-muted-foreground" /> {t('mute')}
          </button>
          <button onClick={onBlock} className={cn(row, 'text-brote-coral')}>
            <Ban className="h-4 w-4" /> {t('block')}
          </button>
          <button
            onClick={() => {
              setOpen(false);
              setReporting(true);
            }}
            className={row}
          >
            <Flag className="h-4 w-4 text-muted-foreground" /> {t('report')}
          </button>
          <Button variant="ghost" block className="mt-2" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
        </div>
      </Sheet>

      <ReportSheet
        open={reporting}
        onOpenChange={setReporting}
        profileId={profile.id}
        onDone={() => setReporting(false)}
      />
    </>
  );
}
