import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { authService, clearSession, setActiveOrgId } from '@/services/api';
import type { LoginPayload, RegisterPayload } from '@/services/api';
import { getErrorMessage } from '@/lib/apiError';
import type { OrganizationMembershipSummary, User } from '@/types';

export type AuthStatus = 'idle' | 'restoring' | 'authenticated' | 'unauthenticated';

interface AuthState {
  user: User | null;
  organizations: OrganizationMembershipSummary[];
  /** Effective permission actions for the active organization. `*` = all. */
  permissions: string[];
  activeOrgId: string | null;
  status: AuthStatus;
  /** In-flight flag for the sign-in / sign-up forms. */
  isSubmitting: boolean;
  isSwitchingOrg: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  organizations: [],
  permissions: [],
  activeOrgId: null,
  status: 'idle',
  isSubmitting: false,
  isSwitchingOrg: false,
  error: null,
};

/** Picks the org to open with: the server's choice, else the first joined one. */
function resolveActiveOrg(
  organizations: OrganizationMembershipSummary[],
  preferred?: string | null,
): string | null {
  if (preferred && organizations.some((org) => org.id === preferred)) return preferred;
  return organizations[0]?.id ?? null;
}

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginPayload, { rejectWithValue }) => {
    try {
      return await authService.login(credentials);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (payload: RegisterPayload, { rejectWithValue }) => {
    try {
      return await authService.register(payload);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

/**
 * Restores the session on boot and refreshes it after anything that can change
 * the user's effective permissions (role change, org switch, joining an org).
 */
export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_: void, { rejectWithValue }) => {
    try {
      return await authService.getMe();
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  await authService.logout();
});

export const switchOrganization = createAsyncThunk(
  'auth/switchOrganization',
  async (organizationId: string, { rejectWithValue }) => {
    try {
      return await authService.switchOrg(organizationId);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /** Called by the axios session-expiry broadcast. */
    sessionExpired(state) {
      clearSession();
      state.user = null;
      state.organizations = [];
      state.permissions = [];
      state.activeOrgId = null;
      state.status = 'unauthenticated';
      state.isSubmitting = false;
      state.isSwitchingOrg = false;
    },
    clearAuthError(state) {
      state.error = null;
    },
    /** Marks the boot-time restore as started so guards can show a spinner. */
    beginSessionRestore(state) {
      if (state.status === 'idle') state.status = 'restoring';
    },
    noSessionToRestore(state) {
      state.status = 'unauthenticated';
    },
    /** Locally merges a freshly created organization into the picker. */
    organizationJoined(state, action: PayloadAction<OrganizationMembershipSummary>) {
      if (!state.organizations.some((org) => org.id === action.payload.id)) {
        state.organizations.push(action.payload);
      }
      state.activeOrgId = action.payload.id;
      setActiveOrgId(action.payload.id);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        const { user, organizations, permissions, activeOrganizationId } = action.payload;
        state.isSubmitting = false;
        state.user = user;
        state.organizations = organizations ?? [];
        state.permissions = permissions ?? [];
        state.activeOrgId = resolveActiveOrg(organizations ?? [], activeOrganizationId);
        setActiveOrgId(state.activeOrgId);
        state.status = 'authenticated';
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = (action.payload as string) ?? 'Sign in failed';
        state.status = 'unauthenticated';
      })

      .addCase(registerUser.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        const { user, organizations, permissions, activeOrganizationId } = action.payload;
        state.isSubmitting = false;
        state.user = user;
        state.organizations = organizations ?? [];
        state.permissions = permissions ?? [];
        state.activeOrgId = resolveActiveOrg(organizations ?? [], activeOrganizationId);
        setActiveOrgId(state.activeOrgId);
        state.status = 'authenticated';
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = (action.payload as string) ?? 'Registration failed';
      })

      .addCase(fetchCurrentUser.pending, (state) => {
        if (state.status === 'idle') state.status = 'restoring';
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        const { user, organizations, permissions, activeOrganizationId } = action.payload;
        state.user = user;
        state.organizations = organizations ?? [];
        state.permissions = permissions ?? [];
        state.activeOrgId = resolveActiveOrg(organizations ?? [], activeOrganizationId ?? state.activeOrgId);
        setActiveOrgId(state.activeOrgId);
        state.status = 'authenticated';
        state.error = null;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        clearSession();
        state.user = null;
        state.organizations = [];
        state.permissions = [];
        state.activeOrgId = null;
        state.status = 'unauthenticated';
      })

      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.organizations = [];
        state.permissions = [];
        state.activeOrgId = null;
        state.status = 'unauthenticated';
        state.error = null;
      })

      .addCase(switchOrganization.pending, (state) => {
        state.isSwitchingOrg = true;
        state.error = null;
      })
      .addCase(switchOrganization.fulfilled, (state, action) => {
        state.isSwitchingOrg = false;
        state.activeOrgId = action.payload.activeOrganization.id;
        state.permissions = action.payload.permissions ?? [];
        // Keep the membership list's role label in step with the new context.
        const index = state.organizations.findIndex(
          (org) => org.id === action.payload.activeOrganization.id,
        );
        if (index === -1) state.organizations.push(action.payload.activeOrganization);
        else state.organizations[index] = action.payload.activeOrganization;
      })
      .addCase(switchOrganization.rejected, (state, action) => {
        state.isSwitchingOrg = false;
        state.error = (action.payload as string) ?? 'Could not switch organization';
      });
  },
});

export const {
  sessionExpired,
  clearAuthError,
  beginSessionRestore,
  noSessionToRestore,
  organizationJoined,
} = authSlice.actions;

export default authSlice.reducer;
