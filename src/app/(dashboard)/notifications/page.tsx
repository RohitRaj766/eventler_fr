'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  selectUnreadCount,
} from '@/features/notification/notificationSlice';
import { NotificationRow } from '@/features/notification/components/NotificationRow';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState, ErrorState, SkeletonText } from '@/components/ui/states';

type Filter = 'all' | 'unread';

export default function NotificationsPage() {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((state) => state.auth.user?.id);
  const { items, isLoading, error, readStatePersistedRemotely } = useAppSelector(
    (state) => state.notification,
  );
  const unread = useAppSelector(selectUnreadCount);
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    if (userId) void dispatch(fetchNotifications(userId));
  }, [dispatch, userId]);

  const rows = useMemo(
    () => (filter === 'unread' ? items.filter((item) => !item.isRead) : items),
    [items, filter],
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Notifications"
        description="Schedule changes, task assignments and alerts from your organizations."
        actions={
          unread > 0 &&
          userId && (
            <Button
              variant="outline"
              onClick={() => void dispatch(markAllNotificationsRead(userId))}
            >
              <CheckCheck className="h-4 w-4" aria-hidden="true" />
              Mark all read
            </Button>
          )
        }
      />

      {!readStatePersistedRemotely && (
        <p className="rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
          This server has no endpoint for marking notifications as read, so read state is
          remembered in this browser only — it won&apos;t follow you to another device.
        </p>
      )}

      <Tabs value={filter} onValueChange={(value) => setFilter(value as Filter)}>
        <TabsList>
          <TabsTrigger value="all">All ({items.length})</TabsTrigger>
          <TabsTrigger value="unread">Unread ({unread})</TabsTrigger>
        </TabsList>
      </Tabs>

      {error ? (
        <ErrorState
          message={error}
          onRetry={() => userId && void dispatch(fetchNotifications(userId))}
        />
      ) : isLoading && !items.length ? (
        <div className="rounded-xl border border-border bg-card">
          <SkeletonText lines={6} className="p-5" />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={filter === 'unread' ? 'Nothing unread' : "You're all caught up"}
          description={
            filter === 'unread'
              ? 'Every notification has been read.'
              : "When a schedule shifts or you're assigned a task, it'll show up here."
          }
        />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {rows.map((notification) => (
            <li key={notification.id}>
              <NotificationRow
                notification={notification}
                onMarkRead={
                  userId && !notification.isRead
                    ? () =>
                        void dispatch(
                          markNotificationRead({ userId, notificationId: notification.id }),
                        )
                    : undefined
                }
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
