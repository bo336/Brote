import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import { BRAND } from '@/lib/brand';

/**
 * What somebody with no session sees at /feed/p/[id].
 *
 * A shared link that opens on a login wall is a link nobody follows twice. So
 * the page shows what the Open Graph card shows — and nothing more, because it
 * is built from the exact same `feed_post_og` payload, which already refuses
 * anything from a teen, a private profile or a held post.
 *
 * Server-rendered on purpose: no session, no client fetch, nothing to hydrate.
 */
export function PublicPostPreview({
  id,
  title,
  body,
  summary,
  image,
  source,
  author,
}: {
  id: string;
  title: string | null;
  body: string | null;
  summary: string | null;
  image: string | null;
  source: string | null;
  author: string | null;
}) {
  const text = summary ?? body;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center gap-5 px-4 py-10">
      <Logo size={30} />

      <article className="overflow-hidden rounded-card border border-border bg-surface shadow-soft-lg">
        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="h-44 w-full object-cover" />
        )}
        <div className="space-y-2 p-4">
          {(author || source) && (
            <p className="eyebrow text-muted-foreground">{author ?? source}</p>
          )}
          <h1 className="font-display text-h2 font-bold leading-snug">{title}</h1>
          {text && <p className="text-small leading-relaxed text-muted-foreground">{text}</p>}
        </div>
      </article>

      <div className="space-y-2 text-center">
        <p className="text-small leading-relaxed text-muted-foreground">
          Entrá a {BRAND.name} para leer la conversación completa y sumarte.
        </p>
        <Link
          href={`/auth/login?next=${encodeURIComponent(`/feed/p/${id}`)}`}
          className="press inline-flex h-11 items-center justify-center rounded-pill bg-primary px-6 text-small font-semibold text-primary-foreground shadow-crisp hover:bg-brote-green-deep"
        >
          Entrar
        </Link>
      </div>

      <p className="text-center text-caption text-muted-foreground">
        {BRAND.name} · {BRAND.tagline}
      </p>
    </main>
  );
}
