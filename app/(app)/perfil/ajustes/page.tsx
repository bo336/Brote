'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft, LogOut, Download, Trash2, Compass, ShieldOff, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input, Select, Field } from '@/components/ui/input';
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
import { setMyUsername } from '@/lib/api/perfil-publico';
import { toast } from '@/stores/toast';

const NOTIF_KEYS = [
  { key: 'streak', label: 'notifStreak' },
  { key: 'challenges', label: 'notifChallenges' },
  { key: 'projects', label: 'notifProjects' },
  { key: 'news', label: 'notifNews' },
] as const;

/**
 * The Plaza's own switches. `brote_notify_social` reads
 * `notification_prefs->>'notif_<type>'` generically, so each of these is a
 * real, server-enforced setting rather than a client-side filter — turning one
 * off stops the row being written at all, and with it the push.
 */
const SOCIAL_NOTIF_KEYS = [
  { key: 'notif_reply', label: 'Respuestas a lo que publico' },
  { key: 'notif_mention', label: 'Menciones' },
  { key: 'notif_follow', label: 'Cuando alguien me sigue' },
  { key: 'notif_like', label: 'Reacciones' },
  { key: 'notif_repost', label: 'Replantes' },
] as const;

/** Milestones Brote may publish for you. Both default to OFF. */
const AUTOPOST_KEYS = [
  { key: 'rank_up', label: 'Publicar cuando subo de rango' },
  { key: 'title', label: 'Publicar cuando gano un título' },
] as const;

export default function AjustesPage() {
  const t = useTranslations('ajustes');
  const tp = useTranslations('perfil');
  const ta = useTranslations('auth');
  const tcm = useTranslations('common');
  const tpp = useTranslations('perfilPublico');
  const tm = useTranslations('moderacion');
  const router = useRouter();
  const profile = useSession((s) => s.profile);
  const setProfile = useSession((s) => s.setProfile);
  const isKid = profile?.accountType === 'kid';
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

  // The whole prefs object, loaded from the server. Keeping it whole matters:
  // this screen used to write `{ push: true, ...next }`, which REPLACED the
  // column — so flipping "Novedades" silently wiped every social switch and
  // every autopost choice the person had made.
  const [prefs, setPrefs] = useState<Record<string, unknown>>({});
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [username, setUsername] = useState(profile?.username ?? '');
  const [savingUsername, setSavingUsername] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [pushOn, setPushOn] = useState(false);

  /**
   * Seed the form once the session store actually has the profile.
   *
   * `SessionHydrator` fills the store in an effect, so the first client render
   * has `profile === null` and every field below initialised to ''. Nothing
   * re-seeded them afterwards, which meant opening Ajustes and pressing
   * "Guardar cambios" wrote empty strings over your name and your province.
   * Keyed on the id so it runs when the profile arrives (or changes), never on
   * every keystroke.
   */
  const seededFor = useRef<string | null>(null);
  useEffect(() => {
    if (!profile?.id || seededFor.current === profile.id) return;
    seededFor.current = profile.id;
    setUsername(profile.username ?? '');
    setDisplayName(profile.displayName ?? '');
    const known = !profile.city || (CITIES as readonly string[]).includes(profile.city);
    setCitySel(profile.city ? (known ? profile.city : OTHER_CITY) : '');
    setCityOther(known ? '' : (profile.city ?? ''));
  }, [profile?.id, profile?.username, profile?.displayName, profile?.city]);

  useEffect(() => {
    if (pushSupported()) isPushSubscribed().then(setPushOn);
  }, []);

  useEffect(() => {
    if (!profile?.id) return;
    void createClient()
      .from('profiles')
      .select('notification_prefs')
      .eq('id', profile.id)
      .single()
      .then(({ data }) => {
        setPrefs((data?.notification_prefs as Record<string, unknown>) ?? {});
        setPrefsLoaded(true);
      });
  }, [profile?.id]);

  const notif = (key: string, fallback: boolean) =>
    typeof prefs[key] === 'boolean' ? (prefs[key] as boolean) : fallback;

  const autopost = (key: string) => {
    const ap = prefs.autopost as Record<string, unknown> | undefined;
    return typeof ap?.[key] === 'boolean' ? (ap[key] as boolean) : false;
  };

  /** Merge into the stored object — never replace it. */
  async function savePrefs(next: Record<string, unknown>) {
    setPrefs(next);
    if (!profile?.id) return;
    const { error } = await createClient()
      .from('profiles')
      .update({ notification_prefs: next })
      .eq('id', profile.id);
    if (error) toast.error('No se pudo guardar', error.message);
  }

  async function saveUsername() {
    const value = username.trim().replace(/^@/, '');
    if (!value || savingUsername || value === profile?.username) return;
    setSavingUsername(true);
    const res = await setMyUsername(value);
    setSavingUsername(false);
    if (!res.ok) return toast.error('No se pudo guardar', res.error);
    if (profile) setProfile({ ...profile, username: res.username ?? value });
    setUsername(res.username ?? value);
    toast.success(tpp('usernameSaved'));
  }

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

  function toggleNotif(key: string, value: boolean) {
    void savePrefs({ ...prefs, [key]: value });
  }

  function toggleAutopost(key: string, value: boolean) {
    const ap = (prefs.autopost as Record<string, unknown>) ?? {};
    void savePrefs({ ...prefs, autopost: { ...ap, [key]: value } });
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
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-primary/15 text-primary">
            <Compass className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-small font-semibold">Ver el tutorial de nuevo</p>
            <p className="mt-0.5 text-caption leading-relaxed text-muted-foreground">
              Un repaso rápido de para qué es cada sección.
            </p>
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
        <Card className="space-y-3.5 p-4">
          <Field label={tpp('usernameLabel')} htmlFor="ajustes-usuario" help={tpp('usernameHelp')}>
            <div className="flex gap-2">
              <Input
                id="ajustes-usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="tuusuario"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
              />
              <Button
                variant="secondary"
                size="sm"
                loading={savingUsername}
                disabled={!username.trim() || username.trim().replace(/^@/, '') === profile?.username}
                onClick={saveUsername}
              >
                {tcm('save')}
              </Button>
            </div>
          </Field>
          <Field label="Nombre" htmlFor="ajustes-nombre">
            <Input
              id="ajustes-nombre"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Tu nombre o apodo"
            />
          </Field>
          <Field label="Provincia" htmlFor="ajustes-provincia" help="Se usa para tu ranking local.">
            <Select id="ajustes-provincia" value={citySel} onChange={(e) => setCitySel(e.target.value)}>
              <option value="" disabled>
                Elegí tu provincia
              </option>
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              <option value={OTHER_CITY}>Vivo en otro país</option>
            </Select>
            {citySel === OTHER_CITY && (
              <Input
                value={cityOther}
                onChange={(e) => setCityOther(e.target.value)}
                placeholder="Escribí dónde vivís"
                className="mt-2"
              />
            )}
          </Field>
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
              <Switch
                checked={notif(key, key !== 'news')}
                disabled={!prefsLoaded}
                onCheckedChange={(v) => toggleNotif(key, v)}
              />
            </div>
          ))}
        </Card>
      </Section>

      {/* Kids have no social surface, so none of these would control anything
          for them. */}
      {!isKid && (
        <>
          <Section title="La Plaza">
            <Card className="divide-y divide-border">
              {SOCIAL_NOTIF_KEYS.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between p-3.5">
                  <span className="text-small">{label}</span>
                  <Switch
                    checked={notif(key, true)}
                    disabled={!prefsLoaded}
                    onCheckedChange={(v) => toggleNotif(key, v)}
                  />
                </div>
              ))}
            </Card>
          </Section>

          <Section title="Publicar mis logros">
            <Card className="divide-y divide-border">
              {AUTOPOST_KEYS.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between p-3.5">
                  <span className="text-small">{label}</span>
                  <Switch
                    checked={autopost(key)}
                    disabled={!prefsLoaded}
                    onCheckedChange={(v) => toggleAutopost(key, v)}
                  />
                </div>
              ))}
            </Card>
            <p className="mt-1.5 text-caption leading-relaxed text-muted-foreground">
              Vienen apagados. Si los prendés, tu subida de rango o tu título nuevo aparecen como una
              publicación tuya en la Plaza.
            </p>
          </Section>

          <Section title={tm('blockedAndMuted')}>
            <Link
              href="/perfil/ajustes/cuentas"
              className="press flex items-center gap-3 rounded-card border border-border bg-surface p-3.5 shadow-soft hover:border-primary/30 hover:shadow-lift"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-brote-coral/15 text-brote-coral">
                <ShieldOff className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-small font-semibold">{tm('blockedAndMuted')}</p>
                <p className="mt-0.5 text-caption leading-relaxed text-muted-foreground">
                  Revisá quién no te ve y quién no aparece en tu feed.
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          </Section>
        </>
      )}

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
