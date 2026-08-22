/**
 * Billing models.
 *
 * The backend has no billing surface yet — there are no `/api/v1/billing/*`
 * routes and no billing objects in the Swagger spec. These types are the
 * frontend's proposal for that contract, shaped to match the conventions the
 * rest of the API already uses (uuid ids, ISO timestamps, SCREAMING_CASE
 * enums, minor-unit money).
 *
 * When the real endpoints ship, reconcile these against the actual responses
 * the same way every other model here was verified — by probing the live API,
 * not by trusting a spec.
 */

export type BillingInterval = 'MONTHLY' | 'YEARLY';

export type SubscriptionStatus =
  | 'TRIALING'
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'CANCELLED'
  | 'EXPIRED';

export type InvoiceStatus = 'DRAFT' | 'OPEN' | 'PAID' | 'VOID' | 'UNCOLLECTIBLE';

export type PaymentMethodBrand =
  | 'VISA'
  | 'MASTERCARD'
  | 'AMEX'
  | 'RUPAY'
  | 'DISCOVER'
  | 'OTHER';

/**
 * Money is carried in minor units (paise, cents) with an explicit currency, so
 * no arithmetic ever happens in floating point.
 */
export interface Money {
  amountMinor: number;
  currency: string;
}

export interface PlanLimits {
  /** `null` means unlimited. */
  programs: number | null;
  members: number | null;
  venues: number | null;
}

export interface BillingPlan {
  id: string;
  name: string;
  description: string;
  price: Money;
  interval: BillingInterval;
  limits: PlanLimits;
  features: string[];
  /** Highlighted in the plan picker. */
  isRecommended?: boolean;
}

export interface Subscription {
  id: string;
  organizationId: string;
  plan: BillingPlan;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  /** Set when the subscription is scheduled to stop at period end. */
  cancelAt?: string | null;
  trialEndsAt?: string | null;
}

export interface Invoice {
  id: string;
  number: string;
  organizationId: string;
  status: InvoiceStatus;
  total: Money;
  periodStart: string;
  periodEnd: string;
  issuedAt: string;
  dueAt?: string | null;
  paidAt?: string | null;
  /** Server-signed download URL; absent until the invoice is finalised. */
  pdfUrl?: string | null;
}

export interface PaymentMethod {
  id: string;
  organizationId: string;
  brand: PaymentMethodBrand;
  /** Last four digits only — a full PAN must never reach the frontend. */
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  holderName?: string | null;
  isDefault: boolean;
  addedAt: string;
}

/** One row of the usage panel: what the org uses against what the plan allows. */
export interface UsageMetric {
  key: 'programs' | 'members' | 'venues';
  label: string;
  used: number;
  /** `null` means unlimited. */
  limit: number | null;
}

export interface BillingOverview {
  subscription: Subscription | null;
  defaultPaymentMethod: PaymentMethod | null;
  upcomingInvoice: Invoice | null;
}
