'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

/**
 * The one text field.
 *
 * Before this existed the same input was retyped in eleven files with six
 * different results — some on `bg-surface`, some on `bg-surface-2`, padding at
 * py-2 / py-2.5 / py-3, and a focus ring on roughly half of them. Nothing was
 * individually wrong, which is exactly why it read as sloppy: fields changed
 * height and colour as you moved between screens.
 *
 * `icon` reserves the left padding for a leading glyph so callers stop
 * hand-tuning `pl-9`, and `invalid` carries the error state rather than every
 * form inventing its own red border.
 */
export const inputBase =
  'w-full rounded-button border bg-surface text-body text-foreground placeholder:text-muted-foreground/70 ' +
  'outline-none transition-[border-color,box-shadow,background-color] duration-150 ' +
  'border-border hover:border-border/80 ' +
  'focus:border-primary focus:shadow-[0_0_0_3px_rgb(31_181_122_/_0.14)] ' +
  'disabled:cursor-not-allowed disabled:opacity-60';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Reserve room for a leading icon positioned by the caller. */
  icon?: boolean;
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, invalid, ...props }, ref) => (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        inputBase,
        'h-11 px-3.5',
        icon && 'pl-10',
        invalid && 'border-brote-coral focus:border-brote-coral focus:shadow-[0_0_0_3px_rgb(255_107_94_/_0.16)]',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn(inputBase, 'min-h-24 resize-y px-3.5 py-2.5 leading-relaxed', className)} {...props} />
  ),
);
Textarea.displayName = 'Textarea';

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select ref={ref} className={cn(inputBase, 'h-11 cursor-pointer px-3 pr-9', className)} {...props} />
  ),
);
Select.displayName = 'Select';

/** Label + optional help text wrapper, so forms stop hand-rolling this. */
export function Field({
  label,
  help,
  htmlFor,
  children,
  className,
}: {
  label: string;
  help?: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('block', className)}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-small font-medium text-foreground">
        {label}
      </label>
      {children}
      {help && <p className="mt-1.5 text-caption leading-relaxed text-muted-foreground">{help}</p>}
    </div>
  );
}
