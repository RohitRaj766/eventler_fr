'use client';

import Link from 'next/link';
import type { ComponentType } from 'react';
import { ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/states';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  /** Short qualifier under the number — never invented, always derived. */
  caption?: string;
  icon?: ComponentType<{ className?: string }>;
  href?: string;
  linkLabel?: string;
  isLoading?: boolean;
  /** Accent hue; defaults to the neutral card treatment. */
  tone?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}

const TONES: Record<NonNullable<StatCardProps['tone']>, string> = {
  default: 'bg-muted text-muted-foreground',
  primary: 'bg-primary/10 text-primary',
  success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  danger: 'bg-red-500/10 text-red-600 dark:text-red-400',
};

export function StatCard({
  label,
  value,
  caption,
  icon: Icon,
  href,
  linkLabel = 'View',
  isLoading,
  tone = 'default',
}: StatCardProps) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {Icon && (
          <span
            className={cn('flex h-8 w-8 items-center justify-center rounded-lg', TONES[tone])}
          >
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>

      {isLoading ? (
        <Skeleton className="mt-3 h-8 w-20" />
      ) : (
        <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-foreground">
          {value}
        </p>
      )}

      {caption && !isLoading && (
        <p className="mt-1 text-xs text-muted-foreground">{caption}</p>
      )}

      {href && (
        <span className="mt-4 flex items-center gap-1 text-xs font-medium text-primary">
          {linkLabel}
          <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </span>
      )}
    </>
  );

  const className =
    'flex flex-col rounded-xl border border-border bg-card p-5 transition-colors';

  if (href) {
    return (
      <Link href={href} className={cn(className, 'hover:border-primary/40 hover:bg-accent/40')}>
        {body}
      </Link>
    );
  }

  return <div className={className}>{body}</div>;
}
