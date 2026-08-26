'use client';

import { useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ImagePlus, X, Send } from 'lucide-react';
import { PipAvatar } from '@/components/pip/PipAvatar';
import { Button } from '@/components/ui/button';
import { Pill } from '@/components/ui/pill';
import { createPost, uploadFeedImage, MAX_FEED_IMAGE_BYTES } from '@/lib/api/feed';
import { DOMAINS, getDomain } from '@/lib/domains';
import { useSession } from '@/stores/session';
import { toast } from '@/stores/toast';
import { haptic } from '@/lib/utils/haptics';
import { cn } from '@/lib/utils/cn';

const MAX = 1000;

/**
 * Write something, or reply to something.
 *
 * Collapsed it is one row; tapping expands it. That keeps the top of the feed
 * from being a wall of empty form on a phone, which is the main reason people
 * scroll past a composer without seeing it.
 *
 * Kid accounts get an explanation instead of a box — they read and that is it.
 * Teens get the box but no image button (and the server refuses images from
 * them regardless, which is where the rule actually lives).
 */
export function Composer({
  parentId,
  newsId,
  placeholder,
  onPosted,
  autoFocus = false,
  compact = false,
}: {
  parentId?: string | null;
  newsId?: string | null;
  placeholder?: string;
  onPosted?: () => void;
  autoFocus?: boolean;
  compact?: boolean;
}) {
  const t = useTranslations('feed');
  const profile = useSession((s) => s.profile);
  const fileRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(autoFocus || compact);
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [image, setImage] = useState<{ url: string; preview: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dropped, setDropped] = useState<Set<string>>(new Set());

  const left = MAX - body.length;
  const isKid = profile?.accountType === 'kid';
  const isTeen = profile?.accountType === 'teen';

  // A rotating, concrete prompt. "¿Qué estás pensando?" is the generic default
  // every product ships; these ask for something Brote actually wants.
  const prompt = useMemo(() => {
    if (placeholder) return placeholder;
    const prompts = [t('composerPrompt1'), t('composerPrompt2'), t('composerPrompt3')];
    return prompts[Math.floor(Date.now() / 3_600_000) % prompts.length]!;
  }, [placeholder, t]);

  // Topics inferred from #hashtags that match a real domain. Shown so they can
  // be dropped before posting rather than discovered afterwards.
  const inferred = useMemo(() => {
    const found = DOMAINS.filter((d) => new RegExp(`#${d.slug}\\b`, 'i').test(body)).map((d) => d.slug);
    return found.filter((s) => !dropped.has(s));
  }, [body, dropped]);

  if (isKid) {
    return (
      <p className="rounded-card border border-border bg-surface-2 p-3.5 text-caption leading-relaxed text-muted-foreground">
        {t('kidNotice')}
      </p>
    );
  }

  async function pickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f || !profile?.id) return;
    if (f.size > MAX_FEED_IMAGE_BYTES) {
      toast.error(t('imageTooBig'));
      return;
    }
    setUploading(true);
    try {
      const preview = URL.createObjectURL(f);
      const url = await uploadFeedImage(profile.id, f);
      setImage({ url, preview });
    } catch {
      toast.error(t('imageFailed'));
    }
    setUploading(false);
  }

  async function submit() {
    const text = body.trim();
    if ((!text && !image) || busy) return;
    setBusy(true);
    const res = await createPost({
      body: text,
      parentId: parentId ?? null,
      newsId: newsId ?? null,
      imageUrl: image?.url ?? null,
    });
    setBusy(false);

    if (!res.ok) {
      toast.error(t('postFailed'), res.error);
      return;
    }
    haptic('success');
    setBody('');
    setImage(null);
    setDropped(new Set());
    if (!compact) setOpen(false);
    // Held is not a failure: the text is in, waiting on a human. Saying so is
    // the difference between "under review" and "my post vanished".
    if (res.held) toast.warning(t('postHeld'), t('postHeldBody'));
    onPosted?.();
  }

  // ── collapsed ─────────────────────────────────────────────────────────────
  if (!open) {
    return (
      <div className="flex items-center gap-2.5 py-1">
        <PipAvatar pipStyle={profile?.pipStyle} avatarUrl={profile?.avatarUrl} name={profile?.displayName} size={32} />
        <button
          onClick={() => setOpen(true)}
          className="press flex-1 rounded-pill border border-border bg-surface-2 px-4 py-2.5 text-left text-small text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
        >
          {prompt}
        </button>
        {!isTeen && (
          <button
            onClick={() => {
              setOpen(true);
              setTimeout(() => fileRef.current?.click(), 50);
            }}
            aria-label={t('addImage')}
            className="press rounded-full p-2 text-muted-foreground transition-colors hover:bg-surface-2 hover:text-primary"
          >
            <ImagePlus className="h-5 w-5" />
          </button>
        )}
      </div>
    );
  }

  // ── expanded ──────────────────────────────────────────────────────────────
  return (
    <div className={cn('flex gap-2.5', compact ? 'items-start' : 'items-start')}>
      <PipAvatar
        pipStyle={profile?.pipStyle}
        avatarUrl={profile?.avatarUrl}
        name={profile?.displayName}
        size={compact ? 30 : 36}
      />
      <div className="min-w-0 flex-1">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, MAX))}
          placeholder={prompt}
          rows={compact ? 2 : 3}
          autoFocus={autoFocus || !compact}
          className="w-full resize-none rounded-card border border-border bg-surface px-3.5 py-2.5 text-body outline-none transition-[border-color,box-shadow] duration-150 focus:border-primary focus:shadow-[0_0_0_3px_rgb(31_181_122_/_0.14)]"
        />

        {inferred.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {inferred.map((slug) => {
              const d = getDomain(slug);
              return (
                <button key={slug} onClick={() => setDropped((s) => new Set(s).add(slug))} type="button">
                  <Pill color={d?.color} size="sm">
                    {d?.name_es ?? slug} <X className="h-3 w-3" />
                  </Pill>
                </button>
              );
            })}
          </div>
        )}

        {image && (
          <div className="relative mt-2 overflow-hidden rounded-card border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.preview} alt="" className="aspect-[4/3] w-full object-cover" />
            <button
              onClick={() => setImage(null)}
              aria-label={t('removeImage')}
              className="absolute right-2 top-2 rounded-full bg-black/55 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-black/75"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={pickImage} />

        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            {!isTeen && (
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading || !!image}
                aria-label={t('addImage')}
                className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-surface-2 hover:text-primary disabled:opacity-40"
              >
                <ImagePlus className="h-4.5 w-4.5" />
              </button>
            )}
            {/* Only shown once it matters, per the spec. */}
            {left < 200 && (
              <span className={cn('text-caption tnum', left < 60 ? 'text-brote-coral' : 'text-muted-foreground')}>
                {t('charsLeft', { n: left })}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {!compact && (
              <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
            )}
            <Button
              size="sm"
              variant="primary"
              className="rounded-pill"
              onClick={submit}
              loading={busy || uploading}
              disabled={!body.trim() && !image}
            >
              <Send className="h-3.5 w-3.5" /> {parentId ? 'Responder' : t('publish')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
