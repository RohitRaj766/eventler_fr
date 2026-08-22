'use client';

import Link from 'next/link';
import { Bell, CheckCheck } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  markAllNotificationsRead,
  markNotificationRead,
  selectUnreadCount,
} from '@/features/notification/notificationSlice';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { EmptyState, SkeletonText } from '@/components/ui/states';
import { NotificationRow } from './NotificationRow';

/** Header inbox: unread count, the ten most recent, and a link to the full page. */
export function NotificationBell() {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((state) => state.auth.user?.id);
  const { items, isLoading } = useAppSelector((state) => state.notification);
  const unread = useAppSelector(selectUnreadCount);
  const recent = items.slice(0, 10);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        >
          <Bell className="h-4 w-4" aria-hidden="true" />
          {unread > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-destructive-foreground tabular-nums">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[22rem] p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
          <p className="text-sm font-semibold">Notifications</p>
          {unread > 0 && userId && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => void dispatch(markAllNotificationsRead(userId))}
            >
              <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Mark all read
            </Button>
          )}
        </div>

        <div className="scrollbar-thin max-h-80 overflow-y-auto">
          {isLoading && !items.length ? (
            <SkeletonText lines={4} className="p-3" />
          ) : recent.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="You're all caught up"
              description="Schedule changes and task assignments will show up here."
              className="border-0 bg-transparent py-8"
            />
          ) : (
            <ul className="divide-y divide-border">
              {recent.map((notification) => (
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
                    compact
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-border p-2">
          <Button variant="ghost" size="sm" className="w-full" asChild>
            <Link href="/notifications">View all notifications</Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
