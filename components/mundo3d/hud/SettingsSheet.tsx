'use client';

import { useTranslations } from 'next-intl';

import { useSettings } from '@/stores/settings';
import { cn } from '@/lib/utils/cn';

/**
 * The Mundo settings group (`16-UI-AUDIO-A11Y.md` §4).
 *
 * Every control here is an accessibility control as much as a preference:
 * reduced motion, auto-centring and camera sensitivity are Xbox Accessibility
 * Guideline 117, and **a quality toggle in plain Spanish, always available**, is
 * what lets somebody on a slow phone play at all.
 *
 * Opening this sheet pauses the world and drops the render to `demand` — the
 * caller does that, because it owns the frameloop.
 */
type QualityValue = 'auto' | 'low' | 'mid' | 'high';

const QUALITY_OPTIONS: { value: QualityValue; key: string }[] = [
  { value: 'auto', key: 'set.quality.auto' },
  { value: 'low', key: 'set.quality.low' },
  { value: 'mid', key: 'set.quality.mid' },
  { value: 'high', key: 'set.quality.high' },
];

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span className="text-small">{label}</span>
      {children}
    </div>
  );
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={cn(
        'relative h-7 w-12 shrink-0 rounded-pill transition-colors',
        on ? 'bg-brote-green' : 'bg-muted',
      )}
    >
      <span
        className={cn(
          'absolute top-1 h-5 w-5 rounded-full bg-white transition-transform',
          on ? 'translate-x-6' : 'translate-x-1',
        )}
      />
    </button>
  );
}

export function SettingsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations('mundo');
  const settings = useSettings();

  if (!open) return null;
  return (
    <div className="absolute inset-0 z-10 flex items-end bg-brote-ink/50" onClick={onClose}>
      <div
        className="max-h-[80%] w-full overflow-y-auto rounded-t-[24px] bg-background p-5 pb-10"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t('set.quality.label')}
      >
        <div className="divide-y divide-border">
          <div className="py-3">
            <span className="text-small">{t('set.quality.label')}</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {QUALITY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => settings.setDetailMode(option.value)}
                  aria-pressed={settings.detailMode === option.value}
                  className={cn(
                    'rounded-pill px-4 py-2 text-caption font-semibold transition-colors',
                    settings.detailMode === option.value
                      ? 'bg-brote-green text-white'
                      : 'bg-surface-2 text-muted-foreground',
                  )}
                >
                  {t(option.key)}
                </button>
              ))}
            </div>
          </div>

          <Row label={t('set.motion')}>
            <Toggle
              label={t('set.motion')}
              on={settings.reduceMotion === true}
              onChange={(v) => settings.setMundo({ reduceMotion: v })}
            />
          </Row>
          <Row label={t('set.autocam')}>
            <Toggle
              label={t('set.autocam')}
              on={settings.autoCamera}
              onChange={(v) => settings.setMundo({ autoCamera: v })}
            />
          </Row>
          <Row label={t('set.sens')}>
            <input
              type="range"
              min={0.4}
              max={2}
              step={0.1}
              value={settings.cameraSensitivityX}
              aria-label={t('set.sens')}
              onChange={(e) =>
                settings.setMundo({
                  cameraSensitivityX: Number(e.target.value),
                  cameraSensitivityY: Number(e.target.value),
                })
              }
              className="w-32"
            />
          </Row>
          <Row label={t('set.sound')}>
            <Toggle
              label={t('set.sound')}
              on={settings.sound === true}
              onChange={(v) => settings.setMundo({ sound: v })}
            />
          </Row>
          <Row label={t('set.music')}>
            <Toggle
              label={t('set.music')}
              on={settings.music === true}
              onChange={(v) => settings.setMundo({ music: v })}
            />
          </Row>
          <Row label={t('set.text')}>
            <Toggle
              label={t('set.text')}
              on={settings.largeText}
              onChange={(v) => settings.setMundo({ largeText: v })}
            />
          </Row>
          <Row label={t('set.vibrate')}>
            <Toggle
              label={t('set.vibrate')}
              on={settings.vibrate}
              onChange={(v) => settings.setMundo({ vibrate: v })}
            />
          </Row>
        </div>
      </div>
    </div>
  );
}
