'use client';

import { useTranslations } from 'next-intl';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionHeader } from '@/components/ui/section';

/** Notifications center (BUILD_SPEC §8.10). Wired to the `notifications` table in step 14. */
export default function NotificacionesPage() {
  const t = useTranslations('notifications');
  return (
    <div className="space-y-4">
      <SectionHeader title={t('title')} />
      <EmptyState message={t('empty')} />
    </div>
  );
}
