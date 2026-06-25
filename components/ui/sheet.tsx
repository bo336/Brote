'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { type ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  /** 'bottom' = mobile sheet (default); 'center' = modal dialog. */
  side?: 'bottom' | 'center';
  title?: string;
  description?: string;
  className?: string;
}

export function Sheet({ open, onOpenChange, children, side = 'bottom', title, description, className }: SheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm"
              />
            </Dialog.Overlay>
            <Dialog.Content
              asChild
              forceMount
              onOpenAutoFocus={(e) => side === 'bottom' && e.preventDefault()}
            >
              <motion.div
                initial={side === 'bottom' ? { y: '100%' } : { opacity: 0, scale: 0.95 }}
                animate={side === 'bottom' ? { y: 0 } : { opacity: 1, scale: 1 }}
                exit={side === 'bottom' ? { y: '100%' } : { opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 360, damping: 34 }}
                className={cn(
                  'fixed z-50 border border-border bg-surface shadow-soft-lg',
                  side === 'bottom'
                    ? 'pb-safe inset-x-0 bottom-0 max-h-[90vh] overflow-y-auto rounded-t-sheet px-4 pb-6 pt-3'
                    : 'left-1/2 top-1/2 w-[min(92vw,30rem)] -translate-x-1/2 -translate-y-1/2 rounded-card p-5',
                  className,
                )}
              >
                {side === 'bottom' && (
                  <div className="mx-auto mb-3 h-1.5 w-10 rounded-pill bg-border" aria-hidden />
                )}
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    {title && (
                      <Dialog.Title className="text-h3 font-display font-bold">{title}</Dialog.Title>
                    )}
                    {description && (
                      <Dialog.Description className="mt-0.5 text-small text-muted-foreground">
                        {description}
                      </Dialog.Description>
                    )}
                  </div>
                  <Dialog.Close className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground" aria-label="Cerrar">
                    <X className="h-5 w-5" />
                  </Dialog.Close>
                </div>
                {children}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
