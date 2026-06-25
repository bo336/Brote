'use client';

import { type ReactNode } from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useToastStore, type ToastVariant } from '@/stores/toast';
import { cn } from '@/lib/utils/cn';

const VARIANT_STYLES: Record<ToastVariant, string> = {
  default: 'border-border bg-surface text-foreground',
  success: 'border-brote-green/40 bg-surface text-foreground',
  points: 'border-brote-sun/50 bg-surface text-foreground shadow-sun-glow',
  warning: 'border-brote-sun/50 bg-surface text-foreground',
  error: 'border-brote-coral/50 bg-surface text-foreground',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <ToastPrimitive.Provider swipeDirection="right" duration={3500}>
      {children}

      <AnimatePresence>
        {toasts.map((t) => (
          <ToastPrimitive.Root
            key={t.id}
            duration={t.durationMs}
            onOpenChange={(open) => {
              if (!open) dismiss(t.id);
            }}
            asChild
            forceMount
          >
            <motion.div
              layout
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className={cn(
                'pointer-events-auto flex items-start gap-3 rounded-card border p-3.5 shadow-soft-lg',
                VARIANT_STYLES[t.variant],
              )}
            >
              {t.glyph && (
                <span
                  className={cn(
                    'text-xl leading-none',
                    t.variant === 'points' && 'animate-count-pop',
                  )}
                  aria-hidden
                >
                  {t.glyph}
                </span>
              )}
              <div className="min-w-0 flex-1">
                {t.title && (
                  <ToastPrimitive.Title
                    className={cn(
                      'text-small font-semibold tnum',
                      t.variant === 'points' && 'font-display text-brote-sun',
                    )}
                  >
                    {t.title}
                  </ToastPrimitive.Title>
                )}
                {t.description && (
                  <ToastPrimitive.Description className="mt-0.5 text-small text-muted-foreground">
                    {t.description}
                  </ToastPrimitive.Description>
                )}
              </div>
              <ToastPrimitive.Close
                className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </ToastPrimitive.Close>
            </motion.div>
          </ToastPrimitive.Root>
        ))}
      </AnimatePresence>

      <ToastPrimitive.Viewport className="pb-safe fixed bottom-22 right-0 z-[60] flex w-full max-w-sm flex-col gap-2 p-4 outline-none sm:bottom-4" />
    </ToastPrimitive.Provider>
  );
}
