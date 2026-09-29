'use client';

import { forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { haptic } from '@/lib/utils/haptics';
import { buttonVariants } from './button-variants';

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
