'use client';

import type { ComponentType, ReactNode } from 'react';
import { AlertCircle, Inbox, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/* Loading                                                             */
/* ------------------------------------------------------------------ */

export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2
      className={cn('h-4 w-4 animate-spin', className)}
      aria-hidden="true"
    />
  );
}

/** Full-panel loading state with an accessible announcement. */
export function LoadingState({
  label = 'Loading…',
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn('flex flex-col items-center justify-center gap-3 py-16 text-center', className)}
    >
      <Spinner className="h-6 w-6 text-primary" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

/** Grey block placeholder. Prefer this over a spinner for known layouts. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-md', className)} aria-hidden="true" />;
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={cn('h-3.5', index === lines - 1 ? 'w-2/3' : 'w-full')}
        />
      ))}
    </div>
  );
}

export function SkeletonCards({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-4', className)} aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-xl border border-border bg-card p-5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-4 h-7 w-16" />
          <Skeleton className="mt-4 h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonRows({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="divide-y divide-border" aria-hidden="true">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex items-center gap-4 px-4 py-3.5">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              className={cn('h-3.5', colIndex === 0 ? 'w-40' : 'w-24', colIndex === cols - 1 && 'ml-auto')}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Error                                                               */
/* ------------------------------------------------------------------ */

/**
 * Always fed a message from `normalizeApiError`, so what lands here is a
 * sentence written for a person — never a status code or a stack trace.
 */
export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  className,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/25 bg-destructive/5 px-6 py-12 text-center',
        className,
      )}
    >
      <AlertCircle className="h-6 w-6 text-destructive" aria-hidden="true" />
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {message && <p className="mt-1 max-w-md text-sm text-muted-foreground">{message}</p>}
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          Try again
        </Button>
      )}
    </div>
  );
}

/** Inline banner for errors that shouldn't take over the whole panel. */
export function InlineError({ message, className }: { message: string; className?: string }) {
  return (
    <p
      role="alert"
      className={cn(
        'flex items-start gap-2 rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive',
        className,
      )}
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </p>
  );
}

/* ------------------------------------------------------------------ */
/* Empty                                                               */
/* ------------------------------------------------------------------ */

/**
 * Empty states name the next action rather than just reporting absence —
 * "No programs yet. Create your first event program."
 */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: {
  icon?: ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/50 px-6 py-14 text-center',
        className,
      )}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <div className="max-w-sm">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}
