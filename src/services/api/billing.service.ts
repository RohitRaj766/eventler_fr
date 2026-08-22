import type {
  BillingOverview,
  BillingPlan,
  Invoice,
  PaymentMethod,
} from '@/types/billing';
import { apiDelete, apiGet, apiPost } from './axiosInstance';

/**
 * Billing API client.
 *
 * Nothing here is deployed yet: the backend exposes no `/billing` routes, so
 * every call below would 404 today. Rather than let the UI hammer missing
 * endpoints and render error states, the whole feature sits behind one flag.
 *
 * To go live: implement the routes, then set
 *   NEXT_PUBLIC_BILLING_API_ENABLED=true
 * The slice and screens are already wired — no component changes needed.
 */
export const isBillingApiEnabled =
  process.env.NEXT_PUBLIC_BILLING_API_ENABLED === 'true';

export const billingService = {
  /** Current subscription, default payment method and the next invoice. */
  async getOverview() {
    return apiGet<BillingOverview>('/billing/overview');
  },

  async listPlans() {
    return apiGet<BillingPlan[]>('/billing/plans');
  },

  async listInvoices() {
    return apiGet<Invoice[]>('/billing/invoices');
  },

  async listPaymentMethods() {
    return apiGet<PaymentMethod[]>('/billing/payment-methods');
  },

  /**
   * Starts a plan change. Card details must never touch this frontend, so the
   * expected contract is a redirect to a hosted checkout / provider session
   * rather than a payload of payment credentials.
   */
  async startPlanChange(planId: string) {
    return apiPost<{ checkoutUrl: string }>('/billing/subscription/change', { planId });
  },

  /** Same reasoning: the provider collects the card, we only get a token back. */
  async startAddPaymentMethod() {
    return apiPost<{ setupUrl: string }>('/billing/payment-methods/setup', {});
  },

  async setDefaultPaymentMethod(paymentMethodId: string) {
    return apiPost<PaymentMethod>(`/billing/payment-methods/${paymentMethodId}/default`, {});
  },

  async removePaymentMethod(paymentMethodId: string) {
    return apiDelete<null>(`/billing/payment-methods/${paymentMethodId}`);
  },
};
