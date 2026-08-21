'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Users, Trophy, Copy, Check, LogOut } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet } from '@/components/ui/sheet';
import { Input, Select, Field } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import {
  fetchMyCompetitions,
  fetchPublicCompetitions,
  createCompetition,
  joinCompetition,
  leaveCompetition,
  resetLabel,
  type ResetPeriod,
} from '@/lib/api/competencias';
import { toast } from '@/stores/toast';
import { haptic } from '@/lib/utils/haptics';
import { cn } from '@/lib/utils/cn';

function daysLeft(endsAt: string | null): string {
  // No end date: the competition simply keeps running.
  if (!endsAt) return 'Sin fecha de fin';
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
  // null duration = open-ended competition (F14.6).
  const [days, setDays] = useState<number | null>(7);
  const [resetPeriod, setResetPeriod] = useState<ResetPeriod>(null);
  const [resetAnchor, setResetAnchor] = useState<number>(1);
  const [busy, setBusy] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  async function onCreate() {
    if (!name.trim() || busy) return;
    setBusy(true);
    try {
      const res = await createCompetition(
        name.trim(),
        desc.trim(),
        isPublic,
        days,
        resetPeriod,
        resetPeriod ? resetAnchor : null,
      );
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

  async function onLeave(id: string, name: string) {
    if (!confirm(`¿Salir de "${name}"? Podés volver a sumarte con el código.`)) return;
    const res = await leaveCompetition(id);
    if (res.ok) {
      haptic('light');
      toast.success('Saliste de la competencia');
      qc.invalidateQueries({ queryKey: ['my-competitions'] });
      qc.invalidateQueries({ queryKey: ['public-competitions'] });
    } else {
      toast.error('No se pudo salir', res.error);
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
          <Input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && joinCode.trim() && onJoin()}
            placeholder="Ej: 4KD9F2"
            maxLength={6}
            className="flex-1 text-center font-mono uppercase tracking-[0.3em]"
          />
          <Button variant="secondary" onClick={() => onJoin()} loading={busy} disabled={!joinCode.trim()}>
            Unirme
          </Button>
        </div>
      </Card>

      {/* My competitions */}
      <section>
        <span className="eyebrow mb-1 block text-muted-foreground">Tus grupos</span>
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
                      {resetLabel(c.reset_period ?? null, c.reset_anchor) &&
                        ` · ${resetLabel(c.reset_period ?? null, c.reset_anchor)}`}
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
                  {/* Anything joinable must be leavable (F15.10). */}
                  <button
                    onClick={() => onLeave(c.id, c.name)}
                    aria-label={`Salir de ${c.name}`}
                    className="shrink-0 rounded-full p-1.5 text-muted-foreground transition-colors hover:text-brote-coral"
                  >
                    <LogOut className="h-3.5 w-3.5" />
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
                {/* Reflect membership instead of offering a join that
                    silently does nothing the second time (F15.9). */}
                {c.joined ? (
                  <Button variant="secondary" size="sm" onClick={() => onLeave(c.id, c.name)}>
                    <LogOut className="h-4 w-4" /> Salir
                  </Button>
                ) : (
                  <Button variant="secondary" size="sm" onClick={() => onJoin(c.code)} loading={busy}>
                    Sumarme
                  </Button>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Create sheet */}
      <Sheet open={showCreate} onOpenChange={setShowCreate} title="Nueva competencia">
        <div className="space-y-3">
          <Field label="Nombre" htmlFor="comp-nombre">
            <Input
              id="comp-nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Reto del curso 5°B"
              maxLength={60}
            />
          </Field>
          <Field label="Descripción (opcional)" htmlFor="comp-desc">
            <Input
              id="comp-desc"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="¿De qué se trata?"
              maxLength={140}
            />
          </Field>
          <div>
            <span className="mb-1.5 block text-small font-medium">Duración</span>
            <div className="flex flex-wrap gap-2">
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
              {/* An open-ended competition never expires — for a class or a
                  household that just wants a permanent scoreboard. */}
              <button
                onClick={() => setDays(null)}
                className={cn(
                  'flex-1 whitespace-nowrap rounded-button border px-3 py-2 text-small font-medium transition-colors',
                  days === null
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-surface hover:border-primary/40',
                )}
              >
                Sin fin
              </button>
            </div>
          </div>

          <div>
            <span className="mb-1.5 block text-small font-medium">Reinicio de puntos</span>
            <p className="mb-2 text-caption text-muted-foreground">
              Si lo activás, el puesto se define por los puntos del período actual y quien se suma tarde también puede
              ganar. El total acumulado se sigue mostrando.
            </p>
            <div className="flex gap-2">
              {(
                [
                  { v: null, label: 'Sin reinicio' },
                  { v: 'weekly', label: 'Semanal' },
                  { v: 'monthly', label: 'Mensual' },
                ] as const
              ).map((o) => (
                <button
                  key={o.label}
                  onClick={() => setResetPeriod(o.v)}
                  className={cn(
                    'flex-1 rounded-button border px-3 py-2 text-small font-medium transition-colors',
                    resetPeriod === o.v ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-surface',
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>

            {resetPeriod === 'weekly' && (
              <div className="mt-2">
                <span className="mb-1.5 block text-caption text-muted-foreground">¿Qué día reinicia?</span>
                <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
                  {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((d, i) => (
                    <button
                      key={d}
                      onClick={() => setResetAnchor(i)}
                      className={cn(
                        'shrink-0 rounded-button border px-2.5 py-1.5 text-caption font-medium transition-colors',
                        resetAnchor === i ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-surface',
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {resetPeriod === 'monthly' && (
              <label className="mt-2 block">
                <span className="mb-1.5 block text-caption text-muted-foreground">¿Qué día del mes reinicia?</span>
                <Select value={resetAnchor ?? 1} onChange={(e) => setResetAnchor(Number(e.target.value))}>
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      Día {d}
                    </option>
                  ))}
                </Select>
              </label>
            )}
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
