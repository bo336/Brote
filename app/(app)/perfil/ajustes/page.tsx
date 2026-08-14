'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft, LogOut, Download, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Sheet } from '@/components/ui/sheet';
import { ThemeSegmented } from '@/components/ui/theme-toggle';
import { AccountTypeBadge } from '@/components/perfil/AccountTypeBadge';
import { FirstRunTour } from '@/components/tutorial/FirstRunTour';
import { BRAND } from '@/lib/brand';
import { CITIES, OTHER_CITY } from '@/lib/data/cities';
import { useSession } from '@/stores/session';
import { useSettings } from '@/stores/settings';
import { createClient } from '@/lib/supabase/client';
import { signOut } from '@/app/(auth)/auth/actions';
import { exportMyData, deleteMyAccount } from '@/lib/api/profile';
import { subscribeToPush, unsubscribeFromPush, isPushSubscribed, pushSupported } from '@/lib/api/push';
import { toast } from '@/stores/toast';
import { useEffect } from 'react';

const NOTIF_KEYS = [
  { key: 'streak', label: 'notifStreak' },
  { key: 'challenges', label: 'notifChallenges' },
  { key: 'projects', label: 'notifProjects' },
  { key: 'news', label: 'notifNews' },
] as const;

export default function AjustesPage() {
  const t = useTranslations('ajustes');
  const tp = useTranslations('perfil');
  const ta = useTranslations('auth');
  const tcm = useTranslations('common');
  const router = useRouter();
  const profile = useSession((s) => s.profile);
  const setProfile = useSession((s) => s.setProfile);
  const detailMode = useSettings((s) => s.detailMode);
  const setDetailMode = useSettings((s) => s.setDetailMode);

  const knownCity = !profile?.city || (CITIES as readonly string[]).includes(profile.city);
  const [citySel, setCitySel] = useState<string>(profile?.city ? (knownCity ? profile.city : OTHER_CITY) : '');
  const [cityOther, setCityOther] = useState<string>(knownCity ? '' : (profile?.city ?? ''));
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [savingProfile, setSavingProfile] = useState(false);

  async function saveProfile() {
    if (!profile?.id || savingProfile) return;
    const city = (citySel === OTHER_CITY ? cityOther : citySel).trim();
    setSavingProfile(true);
    const { error } = await createClient()
      .from('profiles')
      .update({ display_name: displayName.trim() || null, city: city || null })
      .eq('id', profile.id);
    setSavingProfile(false);
    if (error) {
      toast.error('No se pudo guardar', error.message);
      return;
    }
    setProfile({ ...profile, displayName: displayName.trim() || null, city: city || null });
    toast.success('Perfil actualizado');
  }

  const [prefs, setPrefs] = useState<Record<string, boolean>>({ streak: true, challenges: true, projects: true, news: false });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [pushOn, setPushOn] = useState(false);

  useEffect(() => {
    if (pushSupported()) isPushSubscribed().then(setPushOn);
  }, []);

  async function togglePush(on: boolean) {
    if (on) {
      if (!profile?.id) return;
      const res = await subscribeToPush(profile.id);
      if (res.ok) {
        setPushOn(true);
        toast.success('Notificaciones activadas');
      } else {
        toast.error('No se pudo activar', res.error);
      }
    } else {
      await unsubscribeFromPush();
      setPushOn(false);
    }
  }

  async function setLanguage(lang: 'es' | 'en') {
    document.cookie = `NEXT_LOCALE=${lang}; path=/; max-age=31536000`;
    if (profile?.id) await createClient().from('profiles').update({ language: lang }).eq('id', profile.id);
    router.refresh();
    window.location.reload();
  }

  async function toggleNotif(key: string, value: boolean) {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    if (profile?.id) {
      await createClient()
        .from('profiles')
        .update({ notification_prefs: { push: true, ...next } })
        .eq('id', profile.id);
    }
  }

  async function doExport() {
    if (!profile?.id) return;
    const data = await exportMyData(profile.id);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brote-mis-datos.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Datos exportados');
  }

  async function doDelete() {
    setDeleting(true);
    try {
      await deleteMyAccount();
      await createClient().auth.signOut();
      window.location.href = '/auth/login';
    } catch (e) {
      toast.error('No se pudo eliminar', e instanceof Error ? e.message : '');
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-5 pb-6">
      <Link href="/perfil" className="inline-flex items-center gap-1.5 text-small text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> {tp('title')}
      </Link>
      <h1 className="font-display text-h1 font-bold">{t('title')}</h1>

      {/* A tutorial you can only ever see once is a tutorial you cannot go
          back to when you actually need it (F15.18). */}
      {showTour && <FirstRunTour force onClose={() => setShowTour(false)} />}
      <Section title="Cómo funciona la app">
        <Card className="flex items-center gap-3 p-4">
          <span className="text-2xl">🧭</span>
          <div className="min-w-0 flex-1">
            <p className="text-small font-semibold">Ver el tutorial de nuevo</p>
            <p className="text-caption text-muted-foreground">Un repaso rápido de para qué es cada sección.</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setShowTour(true)}>
            Ver
          </Button>
        </Card>
      </Section>

      {/* The account type silently gates actions, news, competitions and ads —
          so it has to be visible and explained somewhere (F14.3). */}
      <Section title="Tipo de cuenta">
        <Card className="space-y-2 p-4">
          <AccountTypeBadge type={profile?.accountType} showDetail />
          <p className="text-caption text-muted-foreground">
            Define qué acciones, noticias y competencias ves. Para cambiarlo escribinos a{' '}
            <a href={`mailto:${BRAND.contactEmail}`} className="text-primary underline underline-offset-2">
              {BRAND.contactEmail}
            </a>
            .
          </p>
        </Card>
      </Section>

      {/* Profile: name + city */}
      <Section title="Tu perfil">
        <Card className="space-y-3 p-4">
          <label className="block">
            <span className="mb-1.5 block text-small font-medium">Nombre</span>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Tu nombre o apodo"
              className="w-full rounded-button border border-border bg-surface px-3 py-2.5 text-body outline-none focus:border-primary"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-small font-medium">Provincia</span>
            <select
              value={citySel}
              onChange={(e) => setCitySel(e.target.value)}
              className="w-full rounded-button border border-border bg-surface px-3 py-2.5 text-body outline-none focus:border-primary"
            >
              <option value="" disabled>
                Elegí tu provincia
              </option>
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              <option value={OTHER_CITY}>Vivo en otro país</option>
            </select>
            {citySel === OTHER_CITY && (
              <input
                value={cityOther}
                onChange={(e) => setCityOther(e.target.value)}
                placeholder="Escribí dónde vivís"
                className="mt-2 w-full rounded-button border border-border bg-surface px-3 py-2.5 text-body outline-none focus:border-primary"
              />
            )}
            <span className="mt-1 block text-caption text-muted-foreground">Se usa para tu ranking local.</span>
          </label>
          <Button variant="primary" size="sm" loading={savingProfile} onClick={saveProfile}>
            Guardar cambios
          </Button>
        </Card>
      </Section>

      {/* Language */}
      <Section title={t('language')}>
        <div className="flex gap-2">
          <Button variant={profile?.language === 'es' || !profile?.language ? 'primary' : 'secondary'} size="sm" onClick={() => setLanguage('es')}>
            {t('spanish')}
          </Button>
          <Button variant={profile?.language === 'en' ? 'primary' : 'secondary'} size="sm" onClick={() => setLanguage('en')}>
            {t('english')}
          </Button>
        </div>
        {profile?.language === 'en' && <p className="mt-2 text-caption text-muted-foreground">{t('englishSoon')}</p>}
      </Section>

      {/* Theme */}
      <Section title={t('theme')}>
        <ThemeSegmented />
      </Section>

      {/* Tu Mundo detail */}
      <Section title="Tu Mundo (3D)">
        <div className="flex gap-2">
          {(['auto', 'high', 'low'] as const).map((m) => (
            <Button key={m} variant={detailMode === m ? 'primary' : 'secondary'} size="sm" onClick={() => setDetailMode(m)}>
              {m === 'auto' ? 'Automático' : m === 'high' ? 'Alto detalle' : 'Bajo detalle'}
            </Button>
          ))}
        </div>
      </Section>

      {/* Notifications */}
      <Section title={t('notifications')}>
        <Card className="divide-y divide-border">
          <div className="flex items-center justify-between p-3.5">
            <span className="text-small font-medium">{t('notifPush')}</span>
            <Switch checked={pushOn} onCheckedChange={togglePush} />
          </div>
          {NOTIF_KEYS.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between p-3.5">
              <span className="text-small">{t(label)}</span>
              <Switch checked={prefs[key]} onCheckedChange={(v) => toggleNotif(key, v)} />
            </div>
          ))}
        </Card>
      </Section>

      {/* Account */}
      <Section title={t('account')}>
        <div className="space-y-2">
          <Button variant="secondary" block className="justify-start" onClick={doExport}>
            <Download className="h-4 w-4" /> {t('exportData')}
          </Button>
          <form action={signOut}>
            <Button type="submit" variant="secondary" block className="justify-start">
              <LogOut className="h-4 w-4" /> {ta('signOut')}
            </Button>
          </form>
          <Button variant="ghost" block className="justify-start text-brote-coral" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="h-4 w-4" /> {t('deleteAccount')}
          </Button>
        </div>
      </Section>

      <p className="pt-2 text-center text-caption text-muted-foreground">
        {BRAND.name} · {BRAND.tagline}
      </p>

      <Sheet open={confirmDelete} onOpenChange={setConfirmDelete} title={t('deleteAccount')} description={t('deleteConfirm')}>
        <div className="flex gap-3">
          <Button variant="secondary" block onClick={() => setConfirmDelete(false)}>
            {tcm('cancel')}
          </Button>
          <Button variant="danger" block loading={deleting} onClick={doDelete}>
            {t('deleteAccount')}
          </Button>
        </div>
      </Sheet>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 font-display text-h3 font-bold">{title}</h2>
      {children}
    </section>
  );
}
