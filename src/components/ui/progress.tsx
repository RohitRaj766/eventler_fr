'use client';

import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cn } from '@/lib/utils';

interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  /** 0–100. Values outside the range are clamped. */
  value?: number;
  /** Bar colour; defaults to the primary accent. */
  tone?: 'default' | 'warning' | 'danger';
}

const TONES: Record<NonNullable<ProgressProps['tone']>, string> = {
  default: 'bg-primary',
  warning: 'bg-amber-500',
  danger: 'bg-destructive',
};

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value = 0, tone = 'default', ...props }, ref) => {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <ProgressPrimitive.Root
      ref={ref}
      value={clamped}
      className={cn('relative h-2 w-full overflow-hidden rounded-full bg-muted', className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn('h-full w-full flex-1 transition-transform duration-500', TONES[tone])}
        style={{ transform: `translateX(-${100 - clamped}%)` }}
      />
    </ProgressPrimitive.Root>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
