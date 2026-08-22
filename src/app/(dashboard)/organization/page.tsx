'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Building2, CalendarRange, Copy, CreditCard, ShieldCheck, Users } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchOrganizationDetails } from '@/features/org/orgSlice';
import { RequirePermission } from '@/components/auth/RequirePermission';
import { Can } from '@/components/auth/Can';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Button } from '@/components/ui/button';
import { ErrorState, SkeletonCards } from '@/components/ui/states';
import { useToast } from '@/hooks/useToast';
import { usePermissions } from '@/hooks/usePermission';
import { formatDateTime } from '@/utils/formatters';

export default function OrganizationPage() {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const { activeRoleName } = usePermissions();

  const activeOrgId = useAppSelector((state) => state.auth.activeOrgId);
  const { details, isLoadingDetails, detailsError } = useAppSelector((state) => state.org);

  useEffect(() => {
    if (activeOrgId) void dispatch(fetchOrganizationDetails(activeOrgId));
  }, [dispatch, activeOrgId]);

  const copyCode = async () => {
    if (!details?.code) return;
    try {
      await navigator.clipboard.writeText(details.code);
      toast.success('Code copied', 'Share it with people joining your institution.');
    } catch {
      toast.error('Could not copy', 'Select the code and copy it manually.');
    }
  };

  return (
    <RequirePermission action="org.read" title="organization settings">
      <div className="space-y-5">
        <PageHeader
          title={details?.name ?? 'Organization'}
          description={
            activeRoleName ? `You're signed in as ${activeRoleName}.` : undefined
          }
          actions={
            <>
              <Button variant="outline" asChild>
                <Link href="/organization/members">
                  <Users className="h-4 w-4" aria-hidden="true" />
                  Members
                </Link>
              </Button>
              <Can action="role.manage">
                <Button variant="outline" asChild>
                  <Link href="/organization/roles">
                    <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                    Roles
                  </Link>
                </Button>
              </Can>
              <Can action="org.billing">
                <Button variant="outline" asChild>
                  <Link href="/organization/billing">
                    <CreditCard className="h-4 w-4" aria-hidden="true" />
                    Billing
                  </Link>
                </Button>
              </Can>
            </>
          }
        />

        {detailsError ? (
          <ErrorState
            message={detailsError}
            onRetry={() => activeOrgId && void dispatch(fetchOrganizationDetails(activeOrgId))}
          />
        ) : isLoadingDetails && !details ? (
          <SkeletonCards count={3} className="lg:grid-cols-3" />
        ) : (
          details && (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard
                  label="Members"
                  value={details._count?.members ?? 0}
                  icon={Users}
                  href="/organization/members"
                  linkLabel="Manage"
                />
                <StatCard
                  label="Programs"
                  value={details._count?.programs ?? 0}
                  icon={CalendarRange}
                  href="/programs"
                  linkLabel="View"
                />
                <StatCard
                  label="Venues"
                  value={details._count?.venues ?? 0}
                  icon={Building2}
                  href="/venues"
                  linkLabel="Manage"
                />
              </div>

              <section className="rounded-xl border border-border bg-card">
                <header className="border-b border-border px-5 py-3.5">
                  <h2 className="text-sm font-semibold text-foreground">Details</h2>
                </header>

                <dl className="divide-y divide-border">
                  <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                    <dt className="text-sm text-muted-foreground">Name</dt>
                    <dd className="text-sm font-medium text-foreground">{details.name}</dd>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                    <dt className="text-sm text-muted-foreground">
                      Institution code
                      <span className="mt-0.5 block text-xs">
                        People type this at sign-up to join — they choose their own password.
                      </span>
                    </dt>
                    <dd className="flex items-center gap-2">
                      <code className="rounded bg-muted px-2 py-1 font-mono text-sm text-foreground">
                        {details.code}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={copyCode}
                        aria-label="Copy institution code"
                      >
                        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                    </dd>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                    <dt className="text-sm text-muted-foreground">Created</dt>
                    <dd className="text-sm text-foreground">{formatDateTime(details.createdAt)}</dd>
                  </div>

                  {details.logoUrl && (
                    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                      <dt className="text-sm text-muted-foreground">Logo</dt>
                      <dd className="max-w-xs truncate text-sm text-foreground">
                        {details.logoUrl}
                      </dd>
                    </div>
                  )}
                </dl>
              </section>

              <section className="rounded-xl border border-border bg-card p-5">
                <h2 className="text-sm font-semibold text-foreground">Adding people</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  You never create accounts or passwords for anyone — every person sets their own.
                  There are two ways in:
                </p>
                <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-2.5">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      1
                    </span>
                    <span>
                      <span className="font-medium text-foreground">Share the code above.</span>{' '}
                      They register at <span className="font-medium">/register</span>, enter the
                      code, and pick their own password. They join as{' '}
                      <span className="font-medium text-foreground">Member</span>; change their role
                      afterwards on the members page.
                    </span>
                  </li>
                  <li className="flex gap-2.5">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      2
                    </span>
                    <span>
                      <span className="font-medium text-foreground">Invite them by email</span> from
                      the members page, choosing their role up front. If they already have an
                      Eventler account this adds them immediately.
                    </span>
                  </li>
                </ol>
                <Button variant="outline" size="sm" className="mt-4" asChild>
                  <Link href="/organization/members">
                    <Users className="h-3.5 w-3.5" aria-hidden="true" />
                    Go to members
                  </Link>
                </Button>
              </section>

              <p className="text-xs text-muted-foreground">
                This server exposes no endpoint for editing an organization, so name, code and logo
                are read-only here.
              </p>
            </>
          )
        )}
      </div>
    </RequirePermission>
  );
}
