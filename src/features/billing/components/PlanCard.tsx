'use client';

import { Check, Sparkles } from 'lucide-react';
import type { BillingPlan } from '@/types/billing';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/utils/money';
import { cn } from '@/lib/utils';

/**
 * One plan in the comparison row.
 *
 * The action is deliberately inert while billing is in preview — a button that
 * looked like it would start a subscription but silently did nothing would be
 * worse than one that says why it can't.
 */
export function PlanCard({
  plan,
  isCurrent,
  disabled,
  disabledReason,
  onSelect,
}: {
  plan: BillingPlan;
  isCurrent: boolean;
  disabled: boolean;
  disabledReason?: string;
  onSelect?: () => void;
}) {
  return (
    <div
      className={cn(
        'relative flex flex-col rounded-xl border bg-card p-5',
        isCurrent ? 'border-primary ring-1 ring-primary' : 'border-border',
      )}
    >
      {plan.isRecommended && !isCurrent && (
        <span className="absolute -top-2.5 left-5 flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
          <Sparkles className="h-2.5 w-2.5" aria-hidden="true" />
          Recommended
        </span>
      )}

      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">{plan.name}</h3>
        {isCurrent && (
          <span className="rounded-full border border-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
            Current
          </span>
        )}
      </div>

      <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>

      <p className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
        {formatPrice(plan.price, plan.interval)}
      </p>

      <ul className="mt-4 flex-1 space-y-2">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
            <Check
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
              aria-hidden="true"
            />
            {feature}
          </li>
        ))}
      </ul>

      <Button
        className="mt-5 w-full"
        variant={isCurrent ? 'outline' : 'default'}
        disabled={disabled || isCurrent}
        onClick={onSelect}
        title={disabled ? disabledReason : undefined}
      >
        {isCurrent ? 'Your current plan' : `Switch to ${plan.name}`}
      </Button>

      {disabled && !isCurrent && disabledReason && (
        <p className="mt-2 text-center text-xs text-muted-foreground">{disabledReason}</p>
      )}
    </div>
  );
}
