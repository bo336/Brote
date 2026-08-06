'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Users, Trophy, Copy, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet } from '@/components/ui/sheet';
import { EmptyState } from '@/components/ui/empty-state';
import {
  fetchMyCompetitions,
  fetchPublicCompetitions,
  createCompetition,
  joinCompetition,
} from '@/lib/api/competencias';
import { toast } from '@/stores/toast';
import { haptic } from '@/lib/utils/haptics';
import { cn } from '@/lib/utils/cn';

const inputCls =
  'w-full rounded-button border border-border bg-surface px-3 py-2.5 text-body outline-none transition-colors focus:border-primary';

function daysLeft(endsAt: string): string {
  const ms = new Date(endsAt).getTime() - Date.now();
  if (ms <= 0) return 'Terminada';
  const d = Math.ceil(ms / 86_400_000);
  return d === 1 ? 'Termina hoy' : `${d} días restantes`;
}

/**
 * Competencias (PLAN F12.4) — create private or public competitions, share a
 * code, and compete on WINDOWED points so time-on-app never decides a winner.
 */
export default function CompetenciasPage() {
  const qc = useQueryClient();
  const mine = useQuery({ queryKey: ['my-competitions'], queryFn: fetchMyCompetitions });
  const publics = useQuery({ queryKey: ['public-competitions'], queryFn: fetchPublicCompetitions });

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [days, setDays] = useState(7);
  const [busy, setBusy] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  async function onCreate() {
    if (!name.trim() || busy) return;
    setBusy(true);
    try {
      const res = await createCompetition(name.trim(), desc.trim(), isPublic, days);
      haptic('success');
      toast.success('¡Competencia creada!', `Código: ${res.code}`);
      setShowCreate(false);
      setName('');
      setDesc('');
      qc.invalidateQueries({ queryKey: ['my-competitions'] });
      qc.invalidateQueries({ queryKey: ['public-competitions'] });
    } catch (e) {
      toast.error('No se pudo crear', e instanceof Error ? e.message : '');
    } finally {
      setBusy(false);
    }
  }

  async function onJoin(code?: string) {
    const c = (code ?? joinCode).trim();
    if (!c || busy) return;
    setBusy(true);
    const res = await joinCompetition(c);
    setBusy(false);
    if (res.ok) {
      haptic('success');
      toast.success('¡Te sumaste!', res.name);
      setJoinCode('');
      qc.invalidateQueries({ queryKey: ['my-competitions'] });
    } else {
      toast.error('No se pudo unir', res.error);
    }
  }

  function copyCode(code: string) {
    navigator.clipboard?.writeText(code);
    setCopied(code);
    haptic('light');
    setTimeout(() => setCopied(null), 1600);
  }

  return (
    <div className="space-y-5 pb-6">
      <Link href="/ranking" className="inline-flex items-center gap-1.5 text-small text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Ranking
      </Link>
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-h1 font-bold">Competencias</h1>
        <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" /> Crear
        </Button>
      </div>
      <p className="-mt-3 text-small text-muted-foreground">
        Competí con amigos, tu curso o tu barrio. Los puntos se cuentan solo dentro de la competencia, así todos
        arrancan de cero. 🌱
      </p>

      {/* Join by code */}
      <Card className="p-3.5">
        <p className="mb-2 text-small font-semibold">¿Te pasaron un código?</p>
        <div className="flex gap-2">
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="Ej: 4KD9F2"
            maxLength={6}
            className={cn(inputCls, 'flex-1 font-mono uppercase tracking-widest')}
          />
          <Button variant="secondary" onClick={() => onJoin()} loading={busy} disabled={!joinCode.trim()}>
            Unirme
          </Button>
        </div>
      </Card>

      {/* My competitions */}
      <section>
        <h2 className="mb-2 font-display text-h3 font-bold">Mis competencias</h2>
        {mine.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-[76px] w-full" />
            <Skeleton className="h-[76px] w-full" />
          </div>
        ) : (mine.data?.length ?? 0) === 0 ? (
          <EmptyState message="Todavía no estás en ninguna competencia. Creá una o sumate con un código." />
        ) : (
          <div className="space-y-2">
            {mine.data!.map((c) => (
              <Card key={c.id} className={cn('p-3.5', !c.active && 'opacity-60')}>
                <div className="flex items-center gap-3">
                  <Link href={`/competencias/${c.id}`} className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{c.name}</p>
                    <p className="text-caption text-muted-foreground">
                      <Users className="mr-1 inline h-3 w-3" />
                      {c.members} · {daysLeft(c.ends_at)}
                    </p>
                  </Link>
                  <button
                    onClick={() => copyCode(c.code)}
                    className="flex items-center gap-1 rounded-pill border border-border px-2.5 py-1 font-mono text-caption tracking-wider"
                    aria-label="Copiar código"
                  >
                    {copied === c.code ? <Check className="h-3 w-3 text-brote-green" /> : <Copy className="h-3 w-3" />}
                    {c.code}
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Discover public */}
      <section>
        <h2 className="mb-2 font-display text-h3 font-bold">Abiertas para sumarse</h2>
        {publics.isLoading ? (
          <Skeleton className="h-[76px] w-full" />
        ) : (publics.data?.length ?? 0) === 0 ? (
          <EmptyState message="No hay competencias públicas activas. ¡Creá la primera!" />
        ) : (
          <div className="space-y-2">
            {publics.data!.map((c) => (
              <Card key={c.id} className="flex items-center gap-3 p-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-brote-sun/15 text-brote-sun">
                  <Trophy className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{c.name}</p>
                  <p className="truncate text-caption text-muted-foreground">
                    {c.description || `${c.members} participando`} · {daysLeft(c.ends_at)}
                  </p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => onJoin(c.code)} loading={busy}>
                  Sumarme
                </Button>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Create sheet */}
      <Sheet open={showCreate} onOpenChange={setShowCreate} title="Nueva competencia">
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1.5 block text-small font-medium">Nombre</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Reto del curso 5°B" className={inputCls} maxLength={60} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-small font-medium">Descripción (opcional)</span>
            <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="¿De qué se trata?" className={inputCls} maxLength={140} />
          </label>
          <div>
            <span className="mb-1.5 block text-small font-medium">Duración</span>
            <div className="flex gap-2">
              {[7, 14, 30].map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={cn(
                    'flex-1 rounded-button border px-3 py-2 text-small font-medium transition-colors',
                    days === d ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-surface',
                  )}
                >
                  {d} días
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="mb-1.5 block text-small font-medium">Quién puede entrar</span>
            <div className="flex gap-2">
              <button
                onClick={() => setIsPublic(false)}
                className={cn(
                  'flex-1 rounded-button border px-3 py-2 text-small font-medium transition-colors',
                  !isPublic ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-surface',
                )}
              >
                🔒 Privada (con código)
              </button>
              <button
                onClick={() => setIsPublic(true)}
                className={cn(
                  'flex-1 rounded-button border px-3 py-2 text-small font-medium transition-colors',
                  isPublic ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-surface',
                )}
              >
                🌍 Pública
              </button>
            </div>
          </div>
          <Button block variant="primary" loading={busy} disabled={!name.trim()} onClick={onCreate}>
            Crear competencia
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
