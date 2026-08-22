import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { billingService, isBillingApiEnabled } from '@/services/api/billing.service';
import { getErrorMessage } from '@/lib/apiError';
import type {
  BillingOverview,
  BillingPlan,
  Invoice,
  PaymentMethod,
  UsageMetric,
} from '@/types/billing';
import {
  PREVIEW_INVOICES,
  PREVIEW_PAYMENT_METHODS,
  PREVIEW_PLANS,
  PREVIEW_SUBSCRIPTION,
} from './fixtures';

/**
 * Billing state.
 *
 * The thunks below are the real wiring for endpoints that do not exist yet.
 * Each one is gated on `isBillingApiEnabled`, so today they never fire and the
 * selectors serve clearly-labelled preview data instead. Implement the routes,
 * flip `NEXT_PUBLIC_BILLING_API_ENABLED`, and the same components render live
 * data with no further changes.
 */

interface BillingState {
  overview: BillingOverview | null;
  plans: BillingPlan[];
  invoices: Invoice[];
  paymentMethods: PaymentMethod[];
  isLoading: boolean;
  isMutating: boolean;
  error: string | null;
}

const initialState: BillingState = {
  overview: null,
  plans: [],
  invoices: [],
  paymentMethods: [],
  isLoading: false,
  isMutating: false,
  error: null,
};

/** Skips the request entirely while the backend has no billing routes. */
const onlyWhenApiEnabled = () => isBillingApiEnabled;

export const fetchBillingOverview = createAsyncThunk(
  'billing/fetchOverview',
  async (_: void, { rejectWithValue }) => {
    try {
      const [overview, plans] = await Promise.all([
        billingService.getOverview(),
        billingService.listPlans(),
      ]);
      return { overview, plans };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
  { condition: onlyWhenApiEnabled },
);

export const fetchInvoices = createAsyncThunk(
  'billing/fetchInvoices',
  async (_: void, { rejectWithValue }) => {
    try {
      return await billingService.listInvoices();
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
  { condition: onlyWhenApiEnabled },
);

export const fetchPaymentMethods = createAsyncThunk(
  'billing/fetchPaymentMethods',
  async (_: void, { rejectWithValue }) => {
    try {
      return await billingService.listPaymentMethods();
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
  { condition: onlyWhenApiEnabled },
);

export const setDefaultPaymentMethod = createAsyncThunk(
  'billing/setDefaultPaymentMethod',
  async (paymentMethodId: string, { rejectWithValue }) => {
    try {
      return await billingService.setDefaultPaymentMethod(paymentMethodId);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
  { condition: onlyWhenApiEnabled },
);

export const removePaymentMethod = createAsyncThunk(
  'billing/removePaymentMethod',
  async (paymentMethodId: string, { rejectWithValue }) => {
    try {
      await billingService.removePaymentMethod(paymentMethodId);
      return paymentMethodId;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
  { condition: onlyWhenApiEnabled },
);

const billingSlice = createSlice({
  name: 'billing',
  initialState,
  reducers: {
    resetBilling: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBillingOverview.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBillingOverview.fulfilled, (state, action) => {
        state.isLoading = false;
        state.overview = action.payload.overview;
        state.plans = action.payload.plans ?? [];
      })
      .addCase(fetchBillingOverview.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) ?? 'Could not load billing details';
      })

      .addCase(fetchInvoices.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchInvoices.fulfilled, (state, action) => {
        state.isLoading = false;
        state.invoices = action.payload ?? [];
      })
      .addCase(fetchInvoices.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) ?? 'Could not load invoices';
      })

      .addCase(fetchPaymentMethods.fulfilled, (state, action) => {
        state.paymentMethods = action.payload ?? [];
      })

      .addCase(setDefaultPaymentMethod.pending, (state) => {
        state.isMutating = true;
      })
      .addCase(setDefaultPaymentMethod.fulfilled, (state, action) => {
        state.isMutating = false;
        state.paymentMethods = state.paymentMethods.map((method) => ({
          ...method,
          isDefault: method.id === action.payload.id,
        }));
      })
      .addCase(setDefaultPaymentMethod.rejected, (state) => {
        state.isMutating = false;
      })

      .addCase(removePaymentMethod.pending, (state) => {
        state.isMutating = true;
      })
      .addCase(removePaymentMethod.fulfilled, (state, action) => {
        state.isMutating = false;
        state.paymentMethods = state.paymentMethods.filter(
          (method) => method.id !== action.payload,
        );
      })
      .addCase(removePaymentMethod.rejected, (state) => {
        state.isMutating = false;
      });
  },
});

export const { resetBilling } = billingSlice.actions;
export default billingSlice.reducer;

/* ------------------------------------------------------------------ */
/* Selectors                                                           */
/* ------------------------------------------------------------------ */

type RootLike = {
  billing: BillingState;
  org: { details: { _count?: { members: number; programs: number; venues: number } } | null };
};

/**
 * True while the screens are showing scaffolding rather than real data. Every
 * billing page reads this and says so on the page — a financial screen must
 * never leave someone unsure whether what they are reading is real.
 */
export const selectIsBillingPreview = () => !isBillingApiEnabled;

export const selectSubscription = (state: RootLike) =>
  isBillingApiEnabled ? state.billing.overview?.subscription ?? null : PREVIEW_SUBSCRIPTION;

export const selectPlans = (state: RootLike) =>
  isBillingApiEnabled ? state.billing.plans : PREVIEW_PLANS;

export const selectInvoices = (state: RootLike) =>
  isBillingApiEnabled ? state.billing.invoices : PREVIEW_INVOICES;

export const selectPaymentMethods = (state: RootLike) =>
  isBillingApiEnabled ? state.billing.paymentMethods : PREVIEW_PAYMENT_METHODS;

/**
 * Usage against plan limits.
 *
 * The `used` side is genuinely real even in preview — it comes from the
 * organization's own `_count` — so the meters are useful immediately. Only the
 * limits they are measured against are placeholder.
 */
export const selectUsageMetrics = (state: RootLike): UsageMetric[] => {
  const counts = state.org.details?._count;
  const limits = selectSubscription(state)?.plan.limits ?? {
    programs: null,
    members: null,
    venues: null,
  };

  return [
    { key: 'programs', label: 'Programs', used: counts?.programs ?? 0, limit: limits.programs },
    { key: 'members', label: 'Members', used: counts?.members ?? 0, limit: limits.members },
    { key: 'venues', label: 'Venues', used: counts?.venues ?? 0, limit: limits.venues },
  ];
};
