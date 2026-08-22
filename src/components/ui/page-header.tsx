'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Primary and secondary actions, right-aligned on wide screens. */
  actions?: ReactNode;
  /** Badges or meta shown beside the title. */
  meta?: ReactNode;
  className?: string;
}

/** Consistent title block across every screen. */
export function PageHeader({
  title,
  description,
  actions,
  meta,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="truncate text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {title}
          </h1>
          {meta}
        </div>
        {description && (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
