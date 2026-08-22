'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppSelector } from '@/app/hooks';
import { LoadingState } from '@/components/ui/states';

/**
 * Gate for the authenticated shell.
 *
 * Waits for `SessionBootstrap` to settle `status` before deciding, so a user
 * reloading a deep link is never bounced to /login while their token is still
 * being restored. The redirect carries the intended path so they land back
 * where they meant to go.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const status = useAppSelector((state) => state.auth.status);

  useEffect(() => {
    if (status !== 'unauthenticated') return;
    const next = pathname && pathname !== '/dashboard' ? `?next=${encodeURIComponent(pathname)}` : '';
    router.replace(`/login${next}`);
  }, [status, router, pathname]);

  if (status === 'authenticated') return <>{children}</>;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background">
      <LoadingState label="Restoring your session…" />
    </div>
  );
}
