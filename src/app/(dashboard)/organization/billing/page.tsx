'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { CreditCard, FileText, ReceiptText } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchBillingOverview } from '@/features/billing/billingSlice';
import {
  selectIsBillingPreview,
  selectPlans,
  selectSubscription,
  selectUsageMetrics,
} from '@/features/billing/billingSlice';
import { fetchOrganizationDetails } from '@/features/org/orgSlice';
import { BillingPreviewNotice } from '@/features/billing/components/BillingPreviewNotice';
import { UsagePanel } from '@/features/billing/components/UsagePanel';
import { PlanCard } from '@/features/billing/components/PlanCard';
import { RequirePermission } from '@/components/auth/RequirePermission';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/states';
import { formatDateOnly, formatRelativeTime, humanizeEnum } from '@/utils/formatters';
import { formatPrice } from '@/utils/money';
import { cn } from '@/lib/utils';

const SUBSCRIPTION_TONES: Record<string, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-700',
  TRIALING: 'bg-sky-50 text-sky-800 border-sky-300 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-700',
  PAST_DUE: 'bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-700',
  CANCELLED: 'bg-red-50 text-red-800 border-red-300 dark:bg-red-950/50 dark:text-red-300 dark:border-red-700',
  EXPIRED: 'bg-red-50 text-red-800 border-red-300 dark:bg-red-950/50 dark:text-red-300 dark:border-red-700',
};

/**
 * Billing overview.
 *
 * Gated on the backend's own `org.billing` action rather than a hardcoded role
 * name, so granting that permission to another role server-side surfaces this
 * screen with no frontend change. Today only Organization Super Admin holds it.
 */
export default function BillingPage() {
  const dispatch = useAppDispatch();

  const activeOrgId = useAppSelector((state) => state.auth.activeOrgId);
  const error = useAppSelector((state) => state.billing.error);
  const subscription = useAppSelector(selectSubscription);
  const plans = useAppSelector(selectPlans);
  const usage = useAppSelector(selectUsageMetrics);
  const isPreview = selectIsBillingPreview();

  useEffect(() => {
    void dispatch(fetchBillingOverview());
  }, [dispatch, activeOrgId]);

  // Usage meters read the org's real resource counts.
  useEffect(() => {
    if (activeOrgId) void dispatch(fetchOrganizationDetails(activeOrgId));
  }, [dispatch, activeOrgId]);

  const previewReason = isPreview ? 'Available once billing is connected.' : undefined;

  return (
    <RequirePermission action="org.billing" title="billing">
      <div className="space-y-5">
        <PageHeader
          title="Billing"
          description="Your plan, usage and payment details for this organization."
          actions={
            <>
              <Button variant="outline" asChild>
                <Link href="/organization/billing/invoices">
                  <FileText className="h-4 w-4" aria-hidden="true" />
                  Invoices
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/organization/billing/payment-methods">
                  <CreditCard className="h-4 w-4" aria-hidden="true" />
                  Payment methods
                </Link>
              </Button>
            </>
          }
        />

        {isPreview && <BillingPreviewNotice />}

        {error && !isPreview && (
          <ErrorState message={error} onRetry={() => void dispatch(fetchBillingOverview())} />
        )}

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <section className="rounded-xl border border-border bg-card">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3.5">
              <h2 className="text-sm font-semibold text-foreground">Current plan</h2>
              {subscription && (
                <span
                  className={cn(
                    'rounded-full border px-2 py-0.5 text-xs font-medium',
                    SUBSCRIPTION_TONES[subscription.status] ??
                      'border-border bg-muted text-muted-foreground',
                  )}
                >
                  {humanizeEnum(subscription.status)}
                </span>
              )}
            </header>

            {subscription ? (
              <div className="px-5 py-4">
                <p className="text-xl font-semibold tracking-tight text-foreground">
                  {subscription.plan.name}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {formatPrice(subscription.plan.price, subscription.plan.interval)}
                </p>

                <dl className="mt-4 divide-y divide-border border-t border-border">
                  <div className="flex items-center justify-between gap-3 py-2.5">
                    <dt className="text-sm text-muted-foreground">Current period</dt>
                    <dd className="text-sm text-foreground">
                      {formatDateOnly(subscription.currentPeriodStart)} –{' '}
                      {formatDateOnly(subscription.currentPeriodEnd)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3 py-2.5">
                    <dt className="text-sm text-muted-foreground">
                      {subscription.cancelAt ? 'Ends' : 'Renews'}
                    </dt>
                    <dd className="text-sm text-foreground">
                      {formatDateOnly(subscription.cancelAt ?? subscription.currentPeriodEnd)}
                      <span className="ml-1.5 text-muted-foreground">
                        ({formatRelativeTime(subscription.cancelAt ?? subscription.currentPeriodEnd)})
                      </span>
                    </dd>
                  </div>
                  {subscription.trialEndsAt && (
                    <div className="flex items-center justify-between gap-3 py-2.5">
                      <dt className="text-sm text-muted-foreground">Trial ends</dt>
                      <dd className="text-sm text-foreground">
                        {formatDateOnly(subscription.trialEndsAt)}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            ) : (
              <div className="px-5 py-8 text-center">
                <ReceiptText
                  className="mx-auto h-6 w-6 text-muted-foreground"
                  aria-hidden="true"
                />
                <p className="mt-2 text-sm font-medium text-foreground">No active subscription</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Choose a plan below to get started.
                </p>
              </div>
            )}
          </section>

          <UsagePanel metrics={usage} isPreview={isPreview} />
        </div>

        <section>
          <h2 className="text-sm font-semibold text-foreground">Plans</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {isPreview
              ? 'Plan names, prices and limits are placeholders until billing is connected.'
              : 'Switching takes effect at the start of your next billing period.'}
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isCurrent={subscription?.plan.id === plan.id}
                disabled={isPreview}
                disabledReason={previewReason}
              />
            ))}
          </div>
        </section>
      </div>
    </RequirePermission>
  );
}
