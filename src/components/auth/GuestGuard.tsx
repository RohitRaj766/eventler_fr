'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAppSelector } from '@/app/hooks';
import { LoadingState } from '@/components/ui/states';

/**
 * Inverse of `AuthGuard`: keeps a signed-in user out of the sign-in screens,
 * honouring the `?next=` hint left behind by the redirect that sent them here.
 */
/**
 * Routes a signed-in user is still allowed to open.
 *
 * Verification runs *after* registration, when the user is already
 * authenticated — bouncing them away would make the OTP step unreachable.
 */
const ALLOWED_WHILE_AUTHENTICATED = ['/verify'];

export function GuestGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const status = useAppSelector((state) => state.auth.status);
  const organizations = useAppSelector((state) => state.auth.organizations);

  useEffect(() => {
    if (status !== 'authenticated') return;
    if (pathname && ALLOWED_WHILE_AUTHENTICATED.includes(pathname)) return;
    const next = searchParams.get('next');
    // A user with no organization cannot do anything until they create or
    // join one, so send them to onboarding rather than an empty dashboard.
    if (!organizations.length) {
      router.replace('/onboarding');
      return;
    }
    router.replace(next && next.startsWith('/') ? next : '/dashboard');
  }, [status, router, pathname, searchParams, organizations.length]);

  if (status === 'restoring' || status === 'idle') {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <LoadingState label="Checking your session…" />
      </div>
    );
  }

  return <>{children}</>;
}
