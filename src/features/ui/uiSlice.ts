import { createSlice, nanoid, type PayloadAction } from '@reduxjs/toolkit';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  /** Milliseconds before auto-dismiss; 0 keeps it until dismissed. */
  duration: number;
  createdAt: number;
}

export type ThemePreference = 'light' | 'dark' | 'system';

interface UiState {
  toasts: Toast[];
  sidebarCollapsed: boolean;
  theme: ThemePreference;
}

const initialState: UiState = {
  toasts: [],
  sidebarCollapsed: false,
  theme: 'system',
};

/** Errors linger longer than confirmations — they usually need to be read. */
const DEFAULT_DURATION: Record<ToastVariant, number> = {
  success: 4_000,
  info: 5_000,
  warning: 7_000,
  error: 9_000,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    pushToast: {
      reducer(state, action: PayloadAction<Toast>) {
        // Collapse a repeated message instead of stacking duplicates.
        const duplicate = state.toasts.find(
          (toast) =>
            toast.title === action.payload.title &&
            toast.description === action.payload.description,
        );
        if (duplicate) {
          duplicate.createdAt = action.payload.createdAt;
          return;
        }
        state.toasts.push(action.payload);
        if (state.toasts.length > 4) state.toasts.shift();
      },
      prepare(input: {
        title: string;
        description?: string;
        variant?: ToastVariant;
        duration?: number;
      }) {
        const variant = input.variant ?? 'info';
        return {
          payload: {
            id: nanoid(),
            title: input.title,
            description: input.description,
            variant,
            duration: input.duration ?? DEFAULT_DURATION[variant],
            createdAt: Date.now(),
          } satisfies Toast,
        };
      },
    },
    dismissToast(state, action: PayloadAction<string>) {
      state.toasts = state.toasts.filter((toast) => toast.id !== action.payload);
    },
    clearToasts(state) {
      state.toasts = [];
    },
    toggleSidebar(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed(state, action: PayloadAction<boolean>) {
      state.sidebarCollapsed = action.payload;
    },
    setTheme(state, action: PayloadAction<ThemePreference>) {
      state.theme = action.payload;
    },
  },
});

export const {
  pushToast,
  dismissToast,
  clearToasts,
  toggleSidebar,
  setSidebarCollapsed,
  setTheme,
} = uiSlice.actions;

export default uiSlice.reducer;
