'use client';

import { AlertTriangle, Info, Siren } from 'lucide-react';
import type { AppNotification, NotificationSeverity } from '@/types';
import { formatRelativeTime } from '@/utils/formatters';
import { cn } from '@/lib/utils';

const SEVERITY: Record<NotificationSeverity, { icon: typeof Info; className: string }> = {
  INFO: { icon: Info, className: 'text-sky-600 dark:text-sky-400' },
  WARNING: { icon: AlertTriangle, className: 'text-amber-600 dark:text-amber-400' },
  CRITICAL: { icon: Siren, className: 'text-red-600 dark:text-red-400' },
};

/**
 * One notification. The payload shape varies by producer, so title and body
 * are read from the several field names the backend uses, with a readable
 * fallback rather than an empty row.
 */
export function NotificationRow({
  notification,
  onMarkRead,
  compact,
}: {
  notification: AppNotification;
  onMarkRead?: () => void;
  compact?: boolean;
}) {
  const severity = SEVERITY[notification.severity ?? 'INFO'] ?? SEVERITY.INFO;
  const Icon = severity.icon;

  const title = notification.title ?? 'Notification';
  const body = notification.message ?? notification.body ?? '';
  const unread = !notification.isRead;

  return (
    <button
      type="button"
      onClick={onMarkRead}
      disabled={!onMarkRead}
      className={cn(
        'flex w-full items-start gap-3 px-3 text-left transition-colors',
        compact ? 'py-2.5' : 'py-3.5',
        onMarkRead && 'hover:bg-muted/60',
        !onMarkRead && 'cursor-default',
        unread && 'bg-accent/40',
      )}
    >
      <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', severity.className)} aria-hidden="true" />

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span
            className={cn(
              'truncate text-sm',
              unread ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground',
            )}
          >
            {title}
          </span>
          {unread && (
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
              aria-label="Unread"
              role="img"
            />
          )}
        </span>
        {body && (
          <span className={cn('mt-0.5 block text-sm text-muted-foreground', compact && 'line-clamp-2')}>
            {body}
          </span>
        )}
        <span className="mt-1 block text-xs text-muted-foreground">
          {formatRelativeTime(notification.createdAt)}
        </span>
      </span>
    </button>
  );
}
