'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Copy, Check, UserPlus, Share2, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  fetchMyFriendCode,
  addFriendByCode,
  fetchFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
} from '@/lib/api/ranking';
import { toast } from '@/stores/toast';
import { haptic } from '@/lib/utils/haptics';

/**
 * Add friends by code (F15.11).
 *
 * Adding by username did not work and could not really work: you had to
 * already know someone's exact handle, and the friendship was written in one
 * direction only, so it existed for one person and not the other. A code you
 * can read out loud or send as a link fixes both — and the link carries it
 * automatically.
 */
export function FriendInvite({ onAdded }: { onAdded?: () => void }) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const mine = useQuery({ queryKey: ['friend-code'], queryFn: fetchMyFriendCode, staleTime: 60 * 60_000 });
  const requests = useQuery({ queryKey: ['friend-requests'], queryFn: fetchFriendRequests, staleTime: 30_000 });
  const inviteUrl =
    typeof window !== 'undefined' && mine.data ? `${window.location.origin}/ranking?amigo=${mine.data}` : '';

  async function submit() {
    const c = code.trim();
    if (!c || busy) return;
    setBusy(true);
    const res = await addFriendByCode(c);
    setBusy(false);
    if (res.ok) {
      haptic('success');
      // A code can be shared or screenshotted, so adding someone now asks them
      // first — unless they had already asked you, in which case it just
      // completes the match.
      if (res.accepted) toast.success('¡Listo!', `Ahora sos amigo de ${res.name ?? 'esa persona'}`);
      else toast.success('Solicitud enviada', `${res.name ?? 'Esa persona'} tiene que aceptarla.`);
      setCode('');
      onAdded?.();
    } else {
      toast.error('No se pudo agregar', res.error);
    }
  }

  async function share() {
    if (!mine.data) return;
    const text = `Sumate a mis amigos en Brote 🌱 Mi código es ${mine.data}`;
    try {
      if (navigator.share) await navigator.share({ title: 'Brote', text, url: inviteUrl || undefined });
      else {
        await navigator.clipboard.writeText(inviteUrl || text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      /* cancelled */
    }
  }

  return (
    <div className="space-y-2.5">
      {/* Incoming requests come first — they need an answer. */}
      {(requests.data ?? []).length > 0 && (
        <Card className="p-3.5">
          <p className="mb-2 text-small font-semibold">
            Solicitudes ({requests.data!.length})
          </p>
          <div className="space-y-2">
            {requests.data!.map((r) => (
              <div key={r.user_id} className="flex items-center gap-2.5">
                <Avatar name={r.display_name} src={r.avatar_url} size={34} />
                <span className="min-w-0 flex-1 truncate text-small font-medium">
                  {r.display_name ?? r.username ?? 'Alguien'}
                </span>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={async () => {
                    const res = await acceptFriendRequest(r.user_id);
                    if (res.ok) {
                      haptic('success');
                      toast.success('¡Ahora son amigos!');
                      requests.refetch();
                      onAdded?.();
                    } else toast.error('No se pudo', res.error);
                  }}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  aria-label="Rechazar"
                  onClick={async () => {
                    await rejectFriendRequest(r.user_id);
                    requests.refetch();
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-3.5">
        <p className="text-small font-semibold">Agregar con un código</p>
        <div className="mt-2 flex gap-2">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 8))}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="Ej: N24KED"
            className="flex-1 text-center font-mono uppercase tracking-[0.3em]"
          />
          <Button variant="primary" onClick={submit} loading={busy} disabled={!code.trim()}>
            <UserPlus className="h-4 w-4" /> Agregar
          </Button>
        </div>
      </Card>

      <Card className="p-3.5">
        <p className="text-small font-semibold">Tu código</p>
        <p className="mt-0.5 text-caption text-muted-foreground">Compartilo para que te agreguen.</p>
        {mine.isLoading ? (
          <Skeleton className="mt-2 h-11 w-full" />
        ) : (
          <div className="mt-2 flex items-center gap-2">
            <span className="flex-1 rounded-button border border-dashed border-border bg-surface-2 px-3 py-2 text-center font-display text-h3 font-bold tracking-[0.3em]">
              {mine.data ?? '—'}
            </span>
            <Button variant="secondary" onClick={share} aria-label="Compartir mi código">
              {copied ? <Check className="h-4 w-4 text-brote-green" /> : <Share2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="secondary"
              aria-label="Copiar mi código"
              onClick={async () => {
                if (!mine.data) return;
                await navigator.clipboard.writeText(mine.data);
                setCopied(true);
                haptic('light');
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
