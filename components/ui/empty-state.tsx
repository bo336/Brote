import { type ReactNode } from 'react';
import { Pip } from '@/components/pip/Pip';
import { cn } from '@/lib/utils/cn';

interface EmptyStateProps {
  /** Always speak in Pip's voice (BUILD_SPEC §2.7). */
  message: string;
  title?: string;
  action?: ReactNode;
  className?: string;
  pipMood?: 'happy' | 'sleepy' | 'worried';
}

/** Friendly empty state with the mascot. */
export function EmptyState({ message, title, action, className, pipMood = 'happy' }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 px-6 py-12 text-center', className)}>
      <Pip size={72} mood={pipMood} />
      {title && <h3 className="text-h3 font-display font-bold">{title}</h3>}
      <p className="max-w-xs text-balance text-small text-muted-foreground">{message}</p>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
