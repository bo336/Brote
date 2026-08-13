'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { createPost } from '@/lib/api/feed';
import { useSession } from '@/stores/session';
import { toast } from '@/stores/toast';
import { haptic } from '@/lib/utils/haptics';
import { cn } from '@/lib/utils/cn';

const MAX = 1000;

/**
 * Write an opinion, or reply to one. Kid accounts get an explanation instead of
 * a text box — they can read and react, but free text from minors is not
 * broadcast (see create_feed_post).
 */
export function Composer({
  parentId,
  newsId,
  placeholder = '¿Qué estás pensando?',
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
  const profile = useSession((s) => s.profile);
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const left = MAX - body.length;

  if (profile?.accountType === 'kid') {
    return (
      <p className="rounded-card border border-border bg-surface-2 p-3 text-caption text-muted-foreground">
        Podés leer y reaccionar a todo 🌱 Escribir comentarios se habilita a partir de los 13 años.
      </p>
    );
  }

  async function submit() {
    const text = body.trim();
    if (!text || busy) return;
    setBusy(true);
    const res = await createPost(text, parentId ?? null, newsId ?? null);
    setBusy(false);
    if (res.ok) {
      haptic('success');
      setBody('');
      onPosted?.();
    } else {
      toast.error('No se pudo publicar', res.error);
    }
  }

  return (
    <div className={cn('flex gap-2.5', compact ? 'items-start' : 'items-start')}>
      <Avatar name={profile?.displayName} src={profile?.avatarUrl} size={compact ? 30 : 36} />
      <div className="min-w-0 flex-1">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, MAX))}
          placeholder={placeholder}
          rows={compact ? 2 : 3}
          autoFocus={autoFocus}
          className="w-full resize-none rounded-card border border-border bg-surface px-3 py-2.5 text-body outline-none transition-colors focus:border-primary"
        />
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <span className={cn('text-caption', left < 60 ? 'text-brote-coral' : 'text-muted-foreground')}>
            {left < 200 ? `${left} caracteres` : ''}
          </span>
          <Button size="sm" variant="primary" onClick={submit} loading={busy} disabled={!body.trim()}>
            <Send className="h-3.5 w-3.5" /> {parentId ? 'Responder' : 'Publicar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
