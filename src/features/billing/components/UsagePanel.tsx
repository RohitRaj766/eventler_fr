'use client';

import type { UsageMetric } from '@/types/billing';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

/** Bar turns amber past 75% and red past 90%, so a ceiling is visible early. */
function toneFor(ratio: number): 'default' | 'warning' | 'danger' {
  if (ratio >= 0.9) return 'danger';
  if (ratio >= 0.75) return 'warning';
  return 'default';
}

/**
 * Usage against plan limits.
 *
 * The `used` figures are the organization's real counts from
 * `GET /organizations/{id}`, so these meters are accurate today; only the
 * limits they are compared against are placeholder until billing ships.
 */
export function UsagePanel({
  metrics,
  isPreview,
}: {
  metrics: UsageMetric[];
  isPreview: boolean;
}) {
  return (
    <section className="rounded-xl border border-border bg-card">
      <header className="border-b border-border px-5 py-3.5">
        <h2 className="text-sm font-semibold text-foreground">Usage this period</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {isPreview
            ? 'Counts are real; the limits they are measured against are placeholder.'
            : 'Counts and limits for the current billing period.'}
        </p>
      </header>

      <dl className="divide-y divide-border">
        {metrics.map((metric) => {
          const unlimited = metric.limit === null;
          const ratio = unlimited ? 0 : metric.used / Math.max(1, metric.limit!);
          const percent = unlimited ? 0 : Math.round(ratio * 100);
          const atLimit = !unlimited && metric.used >= metric.limit!;

          return (
            <div key={metric.key} className="px-5 py-3.5">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-sm font-medium text-foreground">{metric.label}</dt>
                <dd className="text-sm tabular-nums text-muted-foreground">
                  <span
                    className={cn(
                      'font-semibold text-foreground',
                      atLimit && 'text-destructive',
                    )}
                  >
                    {metric.used}
                  </span>
                  {unlimited ? ' of unlimited' : ` of ${metric.limit}`}
                </dd>
              </div>

              {unlimited ? (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  No limit on this plan.
                </p>
              ) : (
                <>
                  <Progress
                    value={percent}
                    tone={toneFor(ratio)}
                    className="mt-2"
                    aria-label={`${metric.label}: ${metric.used} of ${metric.limit} used`}
                  />
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {atLimit
                      ? `You've reached the ${metric.label.toLowerCase()} limit on this plan.`
                      : `${percent}% used`}
                  </p>
                </>
              )}
            </div>
          );
        })}
      </dl>
    </section>
  );
}
