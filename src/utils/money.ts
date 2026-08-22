import type { Money } from '@/types/billing';

/**
 * Formats minor-unit money for display.
 *
 * Amounts are stored in minor units (paise, cents) so no arithmetic happens in
 * floating point; the division to major units happens only at the point of
 * rendering.
 */
export function formatMoney(money: Money | null | undefined, fallback = '—'): string {
  if (!money) return fallback;
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: money.currency,
      minimumFractionDigits: money.amountMinor % 100 === 0 ? 0 : 2,
    }).format(money.amountMinor / 100);
  } catch {
    // Unknown currency code — fall back to a plain number plus the code.
    return `${(money.amountMinor / 100).toFixed(2)} ${money.currency}`;
  }
}

/** "₹499 / month" */
export function formatPrice(money: Money, interval: 'MONTHLY' | 'YEARLY'): string {
  if (money.amountMinor === 0) return 'Free';
  return `${formatMoney(money)} / ${interval === 'YEARLY' ? 'year' : 'month'}`;
}
