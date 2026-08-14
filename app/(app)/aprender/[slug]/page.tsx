'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Pip } from '@/components/pip/Pip';
import { LessonPlayer } from '@/components/aprender/LessonPlayer';
import { fetchLesson } from '@/lib/api/aprender';

export default function LessonPage() {
  const params = useParams<{ slug: string }>();
  const q = useQuery({
    queryKey: ['lesson', params.slug],
    queryFn: () => fetchLesson(params.slug),
    enabled: !!params.slug,
  });

  if (q.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!q.data) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <Pip size={64} mood="neutral" />
        <p className="text-muted-foreground">No encontramos esa lección.</p>
        <Button variant="secondary" asChild>
          <Link href="/aprender">Volver</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link href="/aprender" className="inline-flex items-center gap-1.5 text-small text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Lecciones
      </Link>
      <div>
        <h1 className="font-display text-h1 font-bold leading-tight">{q.data.title_es}</h1>
        <p className="mt-0.5 text-small text-muted-foreground">{q.data.summary_es}</p>
      </div>
      <LessonPlayer lesson={q.data} />
    </div>
  );
}
