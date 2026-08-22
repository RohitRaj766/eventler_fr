'use client';

import { AlertTriangle, ArrowRight, History } from 'lucide-react';
import type { ScheduleChange } from '@/types';
import { EmptyState, SkeletonText } from '@/components/ui/states';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatDateTime, formatDuration, formatTimeOnly, fullName } from '@/utils/formatters';
import { cn } from '@/lib/utils';

/**
 * Audit trail of every schedule change, newest first.
 *
 * Each entry shows the before and after side by side plus how far the change
 * rippled, because "the keynote moved" matters far less than "the keynote
 * moved and pushed four downstream sessions".
 */
export function SchedulePropagationTimeline({
  changes,
  isLoading,
  nodeNames,
}: {
  changes: ScheduleChange[];
  isLoading?: boolean;
  /** Node id -> name, for resolving the affected-node ids. */
  nodeNames?: Map<string, string>;
}) {
  if (isLoading && !changes.length) return <SkeletonText lines={6} className="p-4" />;

  if (!changes.length) {
    return (
      <EmptyState
        icon={History}
        title="No schedule changes yet"
        description="Once someone records an actual time, every adjustment the engine makes will be listed here."
      />
    );
  }

  return (
    <ol className="relative space-y-0">
      {changes.map((change, index) => {
        const delay = Number(change.newState?.delayMinutes ?? 0);
        const previousEnd = change.previousState?.projectedEndTime;
        const newEnd = change.newState?.projectedEndTime;
        const isLast = index === changes.length - 1;

        return (
          <li key={change.id} className="relative flex gap-4 pb-6 last:pb-0">
            {/* Connector rail */}
            {!isLast && (
              <span
                className="absolute left-[0.5625rem] top-6 h-full w-px bg-border"
                aria-hidden="true"
              />
            )}
            <span
              className={cn(
                'relative z-10 mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ring-4 ring-background',
                delay > 0 ? 'bg-amber-500' : 'bg-emerald-500',
              )}
              aria-hidden="true"
            />

            <div className="min-w-0 flex-1 rounded-lg border border-border bg-card p-3.5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {change.node?.name ?? nodeNames?.get(change.nodeId) ?? 'Node'}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatDateTime(change.createdAt)} · {fullName(change.actor)}
                  </p>
                </div>
                {delay > 0 ? (
                  <span className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
                    <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                    {formatDuration(delay)} late
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    On time
                  </span>
                )}
              </div>

              <p className="mt-2 text-sm text-muted-foreground">{change.reason}</p>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                {change.previousState?.status && (
                  <>
                    <StatusBadge value={change.previousState.status} />
                    <ArrowRight className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                  </>
                )}
                {change.newState?.status && <StatusBadge value={change.newState.status} />}
              </div>

              {previousEnd && newEnd && previousEnd !== newEnd && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Projected end moved{' '}
                  <span className="font-medium tabular-nums line-through">
                    {formatTimeOnly(previousEnd)}
                  </span>{' '}
                  <ArrowRight className="inline h-3 w-3" aria-hidden="true" />{' '}
                  <span className="font-medium tabular-nums text-foreground">
                    {formatTimeOnly(newEnd)}
                  </span>
                </p>
              )}

              {change.affectedNodes.length > 0 && (
                <div className="mt-3 border-t border-border pt-2.5">
                  <p className="text-xs font-medium text-foreground">
                    Downstream impact · {change.affectedNodes.length}{' '}
                    {change.affectedNodes.length === 1 ? 'node' : 'nodes'} rescheduled
                  </p>
                  <ul className="mt-1.5 flex flex-wrap gap-1.5">
                    {change.affectedNodes.slice(0, 6).map((nodeId) => (
                      <li
                        key={nodeId}
                        className="rounded border border-border px-1.5 py-0.5 text-xs text-muted-foreground"
                      >
                        {nodeNames?.get(nodeId) ?? 'Node'}
                      </li>
                    ))}
                    {change.affectedNodes.length > 6 && (
                      <li className="px-1.5 py-0.5 text-xs text-muted-foreground">
                        +{change.affectedNodes.length - 6} more
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
