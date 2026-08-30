import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PostThreadView } from '@/components/feed/PostThreadView';
import { PublicPostPreview } from '@/components/feed/PublicPostPreview';
import { BRAND } from '@/lib/brand';

/**
 * Post permalink.
 *
 * A server component only so `generateMetadata` can run — the thread itself is
 * still client-rendered. What the crawler gets comes from `feed_post_og`
 * (migration 0053), the one feed function `anon` may call, and it deliberately
 * returns nothing for a teen author, a private profile or a held post. In
 * those cases the link still works; it just previews as plain Brote instead of
 * leaking someone's words into a chat thread they never chose to be in.
 */
export const dynamic = 'force-dynamic';

interface OgPost {
  kind: string;
  title: string | null;
  body: string | null;
  summary: string | null;
  image: string | null;
  source: string | null;
  author: string | null;
}

async function loadOg(id: string): Promise<OgPost | null> {
  try {
    const { data, error } = await createClient().rpc('feed_post_og', { p_post_id: id });
    if (error || !data) return null;
    return data as OgPost;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const og = await loadOg(params.id);

  if (!og) {
    return {
      title: BRAND.name,
      description: BRAND.description,
      openGraph: { title: BRAND.name, description: BRAND.description, images: [{ url: '/og.png' }] },
    };
  }

  const title = og.title?.trim() || BRAND.name;
  // A story keeps its source line; a person's post is credited to the person.
  const description =
    og.summary?.trim() ||
    og.body?.trim() ||
    (og.source ? `${og.source} · ${BRAND.name}` : BRAND.description);
  const byline = og.author ? `${title} — ${og.author}` : title;
  const image = og.image ?? '/og.png';

  return {
    title: byline,
    description,
    openGraph: {
      title: byline,
      description,
      type: 'article',
      locale: 'es_AR',
      images: [{ url: image }],
    },
    twitter: { card: 'summary_large_image', title: byline, description, images: [image] },
  };
}

export default async function PostPermalinkPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    const og = await loadOg(params.id);
    // No session and nothing safe to preview: the login page is the honest
    // destination, and it comes back here afterwards.
    if (!og) redirect(`/auth/login?next=${encodeURIComponent(`/feed/p/${params.id}`)}`);
    return (
      <PublicPostPreview
        id={params.id}
        title={og.title}
        body={og.body}
        summary={og.summary}
        image={og.image}
        source={og.source}
        author={og.author}
      />
    );
  }

  return <PostThreadView id={params.id} />;
}
