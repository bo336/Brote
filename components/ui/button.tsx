'use client';

import { forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { haptic } from '@/lib/utils/haptics';

/**
 * Motion note (§5.6): press scales down, and filled buttons lift ~1px on
 * hover. The lift is what separates a button that feels physical from one
 * that only changes colour. `transition-all` is deliberately narrowed to the
 * properties that actually animate — animating `all` on a button that also
 * changes width during loading causes a visible reflow smear.
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-button font-semibold select-none ' +
    'transition-[transform,box-shadow,background-color,border-color,color,opacity] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ' +
    'disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none active:scale-[0.97]',
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-primary-foreground shadow-crisp hover:bg-brote-green-deep hover:-translate-y-px hover:shadow-soft-lg active:translate-y-0',
        secondary:
          'border border-border bg-surface-2 text-foreground hover:border-border hover:bg-muted hover:-translate-y-px active:translate-y-0',
        ghost: 'bg-transparent text-foreground hover:bg-surface-2',
        danger: 'bg-brote-coral text-white shadow-crisp hover:brightness-95 hover:-translate-y-px active:translate-y-0',
        sun: 'bg-brote-sun text-brote-ink shadow-crisp hover:brightness-95 hover:-translate-y-px hover:shadow-sun-glow active:translate-y-0',
        outline: 'border border-primary/50 text-primary hover:border-primary hover:bg-primary/10',
      },
      size: {
        sm: 'h-9 gap-1.5 px-3.5 text-small',
        md: 'h-11 px-5 text-body',
        lg: 'h-[3.25rem] px-6 text-body',
        icon: 'h-11 w-11',
        'icon-sm': 'h-9 w-9',
      },
      block: { true: 'w-full', false: '' },
    },
    defaultVariants: { variant: 'primary', size: 'md', block: false },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  /** Fire a light haptic on press (default true for primary/sun). */
  withHaptic?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, block, asChild, loading, withHaptic = true, children, onClick, ...props },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, block }), className)}
        onClick={(e) => {
          if (withHaptic) haptic('light');
          onClick?.(e as React.MouseEvent<HTMLButtonElement>);
        }}
        disabled={loading || props.disabled}
        {...props}
      >
        {/*
          The spinner replaces the label in place instead of being prepended
          to it. Prepending grew the button mid-click, which shifted whatever
          sat next to it — the kind of jump that reads as cheap.
        */}
        {loading ? (
          <span className="relative inline-flex items-center justify-center">
            <span className="invisible contents">{children}</span>
            <Loader2 className="absolute h-4 w-4 animate-spin" aria-hidden />
          </span>
        ) : (
          children
        )}
      </Comp>
    );
  },
);
Button.displayName = 'Button';

export { buttonVariants };
