'use client';

import { ReactNode, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchCurrentUser } from '@/features/auth/authSlice';
import { fetchMyOrganizations } from '@/features/org/orgSlice';
import { AppSidebar } from './AppSidebar';
import { Header } from './Header';
import { DynamicBreadcrumb } from './DynamicBreadcrumb';
import { useRouter } from 'next/navigation';

export function DashboardLayout({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchCurrentUser())
      .unwrap()
      .then(() => {
        dispatch(fetchMyOrganizations());
      })
      .catch(() => {
        router.push('/login');
      });
  }, [dispatch, router]);

  if (isLoading && !isAuthenticated) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-medium text-muted-foreground">Loading Eventler Session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Desktop Collapsible Sidebar */}
      <div className="hidden md:flex shrink-0">
        <AppSidebar />
      </div>

      {/* Main Content Shell */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-5">
            {/* Dynamic Breadcrumbs Navigation (Below Header) */}
            <div className="pb-1">
              <DynamicBreadcrumb />
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
