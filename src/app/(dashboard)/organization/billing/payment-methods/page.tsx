'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CreditCard, Plus, ShieldCheck, Star, Trash2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  fetchPaymentMethods,
  removePaymentMethod,
  selectIsBillingPreview,
  selectPaymentMethods,
  setDefaultPaymentMethod,
} from '@/features/billing/billingSlice';
import { BillingPreviewNotice } from '@/features/billing/components/BillingPreviewNotice';
import { RequirePermission } from '@/components/auth/RequirePermission';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/hooks/useToast';
import { formatDateOnly } from '@/utils/formatters';
import type { PaymentMethod } from '@/types/billing';
import { cn } from '@/lib/utils';

const BRAND_LABELS: Record<PaymentMethod['brand'], string> = {
  VISA: 'Visa',
  MASTERCARD: 'Mastercard',
  AMEX: 'American Express',
  RUPAY: 'RuPay',
  DISCOVER: 'Discover',
  OTHER: 'Card',
};

/** Expiry is compared by month, so a card expiring this month still counts. */
function isExpired(method: PaymentMethod, now: Date): boolean {
  const expiry = new Date(method.expiryYear, method.expiryMonth, 0, 23, 59, 59);
  return expiry.getTime() < now.getTime();
}

export default function PaymentMethodsPage() {
  const dispatch = useAppDispatch();
  const toast = useToast();

  const activeOrgId = useAppSelector((state) => state.auth.activeOrgId);
  const methods = useAppSelector(selectPaymentMethods);
  const isMutating = useAppSelector((state) => state.billing.isMutating);
  const error = useAppSelector((state) => state.billing.error);
  const isPreview = selectIsBillingPreview();

  const [pendingRemoval, setPendingRemoval] = useState<PaymentMethod | null>(null);

  useEffect(() => {
    void dispatch(fetchPaymentMethods());
  }, [dispatch, activeOrgId]);

  const handleSetDefault = async (method: PaymentMethod) => {
    const result = await dispatch(setDefaultPaymentMethod(method.id));
    if (setDefaultPaymentMethod.rejected.match(result)) {
      toast.error('Could not set the default card', result.payload as string);
      return;
    }
    toast.success('Default payment method updated');
  };

  const handleRemove = async (method: PaymentMethod) => {
    const result = await dispatch(removePaymentMethod(method.id));
    if (removePaymentMethod.rejected.match(result)) {
      toast.error('Could not remove the card', result.payload as string);
      return;
    }
    toast.success('Payment method removed');
  };

  return (
    <RequirePermission action="org.billing" title="payment methods">
      <div className="space-y-5">
        <PageHeader
          title="Payment methods"
          description="Cards used to pay this organization's invoices."
          actions={
            <Button variant="ghost" asChild>
              <Link href="/organization/billing">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back to billing
              </Link>
            </Button>
          }
        />

        {isPreview && <BillingPreviewNotice />}

        {error && !isPreview && (
          <ErrorState message={error} onRetry={() => void dispatch(fetchPaymentMethods())} />
        )}

        {/*
          Card details are never collected by this app. When billing ships, the
          button hands off to the payment provider's hosted form and we only
          ever receive a token plus the last four digits — so a full card number
          has no path into this frontend at all.
        */}
        <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border bg-card px-5 py-4">
          <div className="flex items-start gap-3">
            <ShieldCheck
              className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">
                Card details are handled by the payment provider
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Adding a card opens the provider&apos;s secure form. Eventler never sees or stores
                a full card number — only the brand and last four digits.
              </p>
            </div>
          </div>

          <Button
            disabled={isPreview}
            title={isPreview ? 'Available once billing is connected.' : undefined}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add payment method
          </Button>
        </div>

        {methods.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="No payment methods"
            description="Add a card so invoices for this organization can be paid automatically."
          />
        ) : (
          <ul className="space-y-3">
            {methods.map((method) => {
              const expired = isExpired(method, new Date());

              return (
                <li
                  key={method.id}
                  className={cn(
                    'flex flex-wrap items-center gap-4 rounded-xl border bg-card p-4',
                    method.isDefault ? 'border-primary' : 'border-border',
                  )}
                >
                  <span className="flex h-10 w-14 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {BRAND_LABELS[method.brand].slice(0, 4)}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
                      {BRAND_LABELS[method.brand]}
                      <span className="tabular-nums text-muted-foreground">•••• {method.last4}</span>
                      {method.isDefault && (
                        <span className="rounded-full border border-primary px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-primary">
                          Default
                        </span>
                      )}
                      {expired && (
                        <span className="rounded-full border border-destructive px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-destructive">
                          Expired
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Expires {String(method.expiryMonth).padStart(2, '0')}/{method.expiryYear}
                      {method.holderName && ` · ${method.holderName}`}
                      {` · added ${formatDateOnly(method.addedAt)}`}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    {!method.isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isPreview || isMutating || expired}
                        onClick={() => void handleSetDefault(method)}
                        title={
                          isPreview
                            ? 'Available once billing is connected.'
                            : expired
                              ? 'An expired card cannot be made the default.'
                              : undefined
                        }
                      >
                        <Star className="h-3.5 w-3.5" aria-hidden="true" />
                        Make default
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      disabled={isPreview || isMutating}
                      onClick={() => setPendingRemoval(method)}
                      aria-label={`Remove ${BRAND_LABELS[method.brand]} ending ${method.last4}`}
                      title={isPreview ? 'Available once billing is connected.' : undefined}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <ConfirmDialog
          open={Boolean(pendingRemoval)}
          onOpenChange={(open) => !open && setPendingRemoval(null)}
          title="Remove this payment method?"
          description={
            pendingRemoval ? (
              <>
                <strong>
                  {BRAND_LABELS[pendingRemoval.brand]} ending {pendingRemoval.last4}
                </strong>{' '}
                will be removed from this organization.
                {pendingRemoval.isDefault && (
                  <>
                    {' '}
                    It is currently the default card, so add another before your next invoice or
                    the payment will fail.
                  </>
                )}
              </>
            ) : (
              ''
            )
          }
          confirmLabel="Remove card"
          onConfirm={async () => {
            if (pendingRemoval) await handleRemove(pendingRemoval);
            setPendingRemoval(null);
          }}
        />
      </div>
    </RequirePermission>
  );
}
