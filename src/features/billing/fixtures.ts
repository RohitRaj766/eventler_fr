import type {
  BillingPlan,
  Invoice,
  PaymentMethod,
  Subscription,
} from '@/types/billing';

/**
 * Preview data for the billing screens.
 *
 * The backend has no billing endpoints yet, so these values exist purely to
 * show the layout. Two rules they all follow:
 *
 *   1. Nothing may be mistakable for a real financial record. Invoice numbers
 *      are literally `SAMPLE-…`, the card is the industry-standard test PAN
 *      suffix, and every screen renders a persistent notice saying so.
 *   2. Nothing is written anywhere. There is no store, no cache, no download —
 *      it is display-only scaffolding that disappears the moment
 *      `isBillingApiEnabled` flips to true.
 */

export const PREVIEW_PLANS: BillingPlan[] = [
  {
    id: 'preview-starter',
    name: 'Starter',
    description: 'For a single department running a handful of events a year.',
    price: { amountMinor: 0, currency: 'INR' },
    interval: 'MONTHLY',
    limits: { programs: 3, members: 25, venues: 5 },
    features: [
      'Up to 3 active programs',
      'Event tree and task management',
      'Email notifications',
    ],
  },
  {
    id: 'preview-institution',
    name: 'Institution',
    description: 'For a full campus coordinating across departments.',
    price: { amountMinor: 499_00, currency: 'INR' },
    interval: 'MONTHLY',
    limits: { programs: 25, members: 250, venues: 50 },
    features: [
      'Up to 25 active programs',
      'Live event mode and schedule propagation',
      'Custom roles and permissions',
      'Audit log retention',
    ],
    isRecommended: true,
  },
  {
    id: 'preview-enterprise',
    name: 'Enterprise',
    description: 'For multi-campus groups with no practical ceiling.',
    price: { amountMinor: 1_999_00, currency: 'INR' },
    interval: 'MONTHLY',
    limits: { programs: null, members: null, venues: null },
    features: [
      'Unlimited programs, members and venues',
      'Priority support',
      'SSO and directory sync',
      'Extended audit retention',
    ],
  },
];

/** Dates are relative to now so the preview never looks stale. */
function daysFromNow(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

export const PREVIEW_SUBSCRIPTION: Subscription = {
  id: 'preview-subscription',
  organizationId: 'preview',
  plan: PREVIEW_PLANS[1],
  status: 'ACTIVE',
  currentPeriodStart: daysFromNow(-12),
  currentPeriodEnd: daysFromNow(18),
  cancelAt: null,
  trialEndsAt: null,
};

export const PREVIEW_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'preview-card',
    organizationId: 'preview',
    brand: 'VISA',
    // 4242 is the universally recognised test-card suffix — not a real card.
    last4: '4242',
    expiryMonth: 4,
    expiryYear: new Date().getFullYear() + 3,
    holderName: 'Sample Cardholder',
    isDefault: true,
    addedAt: daysFromNow(-120),
  },
];

export const PREVIEW_INVOICES: Invoice[] = [0, 1, 2, 3].map((index) => ({
  id: `preview-invoice-${index}`,
  // Prefixed so the number itself says what it is, even out of context.
  number: `SAMPLE-${String(1004 - index).padStart(4, '0')}`,
  organizationId: 'preview',
  status: index === 0 ? 'OPEN' : 'PAID',
  total: { amountMinor: 499_00, currency: 'INR' },
  periodStart: daysFromNow(-30 * (index + 1)),
  periodEnd: daysFromNow(-30 * index),
  issuedAt: daysFromNow(-30 * index),
  dueAt: index === 0 ? daysFromNow(18) : null,
  paidAt: index === 0 ? null : daysFromNow(-30 * index + 2),
  // No download target: a sample invoice must not produce a document.
  pdfUrl: null,
}));
