'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Pill } from '@/components/ui/pill';
import { Skeleton } from '@/components/ui/skeleton';
import { Pip } from '@/components/pip/Pip';
import { getDomain } from '@/lib/domains';
import { fetchNewsItem } from '@/lib/api/explorar';

export default function NewsDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const t = useTranslations('explorar');
  const tc = useTranslations('common');

  const q = useQuery({ queryKey: ['news-item', params.id], queryFn: () => fetchNewsItem(params.id), enabled: !!params.id });
  const item = q.data;

  if (q.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }
  if (!item) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <Pip size={64} mood="neutral" />
        <p className="text-muted-foreground">No encontramos esa novedad.</p>
        <Button variant="secondary" asChild>
          <Link href="/explorar">{tc('back')}</Link>
        </Button>
      </div>
    );
  }

  const when = item.published_at
    ? new Date(item.published_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  return (
    <article className="space-y-4 pb-6">
      <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-small text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> {tc('back')}
      </button>

      {item.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.image_url} alt="" className="h-52 w-full rounded-card object-cover" />
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        {item.domain_tags.map((d) => {
          const dom = getDomain(d);
          return dom ? (
            <Pill key={d} color={dom.color} size="sm">
              {dom.name_es}
            </Pill>
          ) : null;
        })}
      </div>

      <h1 className="font-display text-h1 font-bold leading-tight">{item.title_es}</h1>
      <p className="text-caption text-muted-foreground">
        {item.source ? `${t('source')}: ${item.source}` : ''} {when && `· ${when}`}
      </p>

      {item.summary_es && <p className="text-body leading-relaxed">{item.summary_es}</p>}

      {/* Copyright: only the AI summary is shown; link out to the original. */}
      <Button variant="primary" asChild>
        <a href={item.source_url} target="_blank" rel="noopener noreferrer">
          {t('openOriginal')} <ExternalLink className="h-4 w-4" />
        </a>
      </Button>
    </article>
  );
}
