'use client';

import { useState } from 'react';
import Link from 'next/link';
import { KeyRound, Mail, Phone, ShieldCheck } from 'lucide-react';
import { useAppSelector } from '@/app/hooks';
import { OtpVerificationPanel } from '@/features/verification/components/OtpVerificationPanel';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatDateTime, fullName, initialsOf } from '@/utils/formatters';
import { usePermissions } from '@/hooks/usePermission';

/**
 * Profile.
 *
 * Read-only: the backend exposes no endpoint for editing a user's own details.
 * What it does offer is verification, so that's what the actions here do.
 */
export default function ProfilePage() {
  const user = useAppSelector((state) => state.auth.user);
  const organizations = useAppSelector((state) => state.auth.organizations);
  const { activeRoleName, permissions, isSuperAdmin } = usePermissions();
  const [verifying, setVerifying] = useState<'email' | 'phone' | null>(null);

  if (!user) return null;

  return (
    <div className="max-w-2xl space-y-5">
      <PageHeader title="Profile" description="Your account and organization memberships." />

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14">
            <AvatarFallback className="bg-primary text-lg font-semibold text-primary-foreground">
              {initialsOf(user)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-foreground">{fullName(user)}</h2>
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
            {user.createdAt && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Member since {formatDateTime(user.createdAt)}
              </p>
            )}
          </div>
        </div>

        <dl className="mt-5 divide-y divide-border border-t border-border">
          <div className="flex flex-wrap items-center justify-between gap-3 py-3">
            <dt className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" aria-hidden="true" />
              Email
            </dt>
            <dd className="flex items-center gap-2">
              <span className="text-sm text-foreground">{user.email}</span>
              <Button variant="outline" size="sm" onClick={() => setVerifying('email')}>
                Verify
              </Button>
            </dd>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 py-3">
            <dt className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" aria-hidden="true" />
              Phone
            </dt>
            <dd className="flex items-center gap-2">
              <span className="text-sm text-foreground">{user.phoneNumber ?? 'Not provided'}</span>
              {user.phoneNumber && (
                <Button variant="outline" size="sm" onClick={() => setVerifying('phone')}>
                  Verify
                </Button>
              )}
            </dd>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 py-3">
            <dt className="flex items-center gap-2 text-sm text-muted-foreground">
              <KeyRound className="h-4 w-4" aria-hidden="true" />
              Password
            </dt>
            <dd>
              <Button variant="outline" size="sm" asChild>
                <Link href="/settings/password">Change password</Link>
              </Button>
            </dd>
          </div>
        </dl>

        <p className="mt-3 text-xs text-muted-foreground">
          Your name and contact details are read-only — this server has no endpoint for editing a
          user profile.
        </p>
      </section>

      <section className="rounded-xl border border-border bg-card">
        <header className="border-b border-border px-5 py-3.5">
          <h2 className="text-sm font-semibold text-foreground">Organizations</h2>
        </header>
        <ul className="divide-y divide-border">
          {organizations.map((org) => (
            <li key={org.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{org.name}</p>
                <p className="truncate text-xs text-muted-foreground">{org.code}</p>
              </div>
              <span className="shrink-0 text-sm text-muted-foreground">{org.role}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
          Your permissions here
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {activeRoleName
            ? `As ${activeRoleName} in the active organization you can:`
            : 'In the active organization you can:'}
        </p>
        {isSuperAdmin ? (
          <p className="mt-3 text-sm text-foreground">
            Everything — you hold the full permission set.
          </p>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {permissions.map((permission) => (
              <li
                key={permission}
                className="rounded border border-border px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground"
              >
                {permission}
              </li>
            ))}
          </ul>
        )}
      </section>

      <Dialog open={Boolean(verifying)} onOpenChange={(open) => !open && setVerifying(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Verify your {verifying === 'phone' ? 'phone number' : 'email address'}
            </DialogTitle>
            <DialogDescription>
              We&apos;ll send a 6-digit code so we can reach you when a schedule changes.
            </DialogDescription>
          </DialogHeader>
          {verifying && (
            <OtpVerificationPanel
              channel={verifying}
              destination={(verifying === 'phone' ? user.phoneNumber : user.email) ?? ''}
              onVerified={() => setVerifying(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
