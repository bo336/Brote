'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from './button';
import { cn } from '@/lib/utils/cn';

/** Cycles light → dark → system. Mobile-friendly single button. */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const t = useTranslations('theme');
  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className={cn('h-11 w-11', className)} />;

  const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
  const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;
  const label = theme === 'light' ? t('light') : theme === 'dark' ? t('dark') : t('system');

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(next)}
      aria-label={`${t('label')}: ${label}`}
      className={className}
    >
      <Icon className="h-5 w-5" />
    </Button>
  );
}

/** Segmented control variant for the settings screen. */
export function ThemeSegmented() {
  const { theme, setTheme } = useTheme();
  const t = useTranslations('theme');
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const options = [
    { key: 'light', icon: Sun, label: t('light') },
    { key: 'dark', icon: Moon, label: t('dark') },
    { key: 'system', icon: Monitor, label: t('system') },
  ] as const;

  return (
    <div className="inline-flex rounded-pill border border-border bg-surface-2 p-1">
      {options.map((o) => {
        const active = mounted && theme === o.key;
        const Icon = o.icon;
        return (
          <button
            key={o.key}
            onClick={() => setTheme(o.key)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-small font-medium transition-colors',
              active ? 'bg-primary text-primary-foreground shadow-soft' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4" />
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
