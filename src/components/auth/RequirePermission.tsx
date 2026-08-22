'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { ShieldOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePermissions, type PermissionAction } from '@/hooks/usePermission';

interface RequirePermissionProps {
  action: PermissionAction | PermissionAction[];
  children: ReactNode;
  /** Named in the explanation so the message is specific, not generic. */
  title?: string;
}

/**
 * Page-level guard. Where `Can` hides a control, this replaces a whole screen
 * with an explanation, so a user who follows a stale link understands why the
 * page is empty instead of seeing a broken dashboard.
 */
export function RequirePermission({
  action,
  children,
  title = 'this area',
}: RequirePermissionProps) {
  const { can, activeRoleName } = usePermissions();

  if (can(action)) return <>{children}</>;

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <ShieldOff className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="text-lg font-semibold text-foreground">You don&apos;t have access to {title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {activeRoleName
            ? `Your role in this organization is ${activeRoleName}, which doesn't include this permission.`
            : 'Your role in this organization does not include this permission.'}{' '}
          Ask an organization admin if you need it.
        </p>
        <Button asChild className="mt-6">
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
