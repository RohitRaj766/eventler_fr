'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchNotifications } from '@/features/notification/notificationSlice';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AppSidebar } from './AppSidebar';
import { Header } from './Header';
import { DynamicBreadcrumb } from './DynamicBreadcrumb';
import { LoadingState } from '@/components/ui/states';
import { useRealtimeChannel, useRealtimeConnection, useRealtimeEvent, roomFor } from '@/hooks/useRealtime';
import { REALTIME_EVENTS } from '@/services/socket';
import { applyRealtimeNotification } from '@/features/notification/notificationSlice';
import type { AppNotification } from '@/types';

/** Keeps the inbox current for the whole shell — the bell lives in the header. */
function NotificationSync() {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((state) => state.auth.user?.id);

  useEffect(() => {
    if (userId) void dispatch(fetchNotifications(userId));
  }, [dispatch, userId]);

  useRealtimeEvent<AppNotification>(
    REALTIME_EVENTS.notification,
    (payload) => {
      if (payload?.id) dispatch(applyRealtimeNotification(payload));
    },
    Boolean(userId),
  );

  useRealtimeChannel({
    room: userId ? roomFor.user(userId) : null,
    refresh: () => {
      if (userId) void dispatch(fetchNotifications(userId));
    },
    // The inbox is not time-critical, so it polls slowly.
    intervalMs: 60_000,
    connectedIntervalMs: 300_000,
    enabled: Boolean(userId),
  });

  return null;
}

/** Sends a user with no organization to onboarding before anything renders. */
function OrganizationGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const organizations = useAppSelector((state) => state.auth.organizations);
  const needsOnboarding = organizations.length === 0 && pathname !== '/onboarding';

  useEffect(() => {
    if (needsOnboarding) router.replace('/onboarding');
  }, [needsOnboarding, router]);

  if (needsOnboarding) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <LoadingState label="Setting things up…" />
      </div>
    );
  }
  return <>{children}</>;
}

export function DashboardLayout({ children }: { children: ReactNode }) {
  useRealtimeConnection();

  return (
    <AuthGuard>
      <OrganizationGate>
        <NotificationSync />
        <div className="flex h-dvh w-full overflow-hidden bg-background">
          <div className="hidden shrink-0 lg:block">
            <AppSidebar />
          </div>

          <div className="flex min-w-0 flex-1 flex-col">
            <Header />
            <main
              id="main-content"
              className="scrollbar-thin flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6"
            >
              <div className="mx-auto flex max-w-7xl flex-col gap-5">
                <DynamicBreadcrumb />
                {children}
              </div>
            </main>
          </div>
        </div>
      </OrganizationGate>
    </AuthGuard>
  );
}
