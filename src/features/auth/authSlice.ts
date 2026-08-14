import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authService, setApiAuthToken, setApiActiveOrgId } from '@/services/api';
import { AuthState } from '@/types';
import { LoginInput, RegisterInput } from '@/utils/validationSchemas';

const initialState: AuthState = {
  user: null,
  accessToken: null,
  activeOrgId: null,
  activeOrg: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginInput, { rejectWithValue }) => {
    try {
      return await authService.login(credentials);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Login failed');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (data: RegisterInput, { rejectWithValue }) => {
    try {
      return await authService.register(data);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Registration failed');
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  'auth/me',
  async (_, { rejectWithValue }) => {
    try {
      return await authService.getMe();
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch user session');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async () => {
    await authService.logout();
  }
);

export const switchOrganization = createAsyncThunk(
  'auth/switchOrg',
  async (organizationId: string, { rejectWithValue }) => {
    try {
      return await authService.switchOrg(organizationId);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to switch organization');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthToken(state, action: PayloadAction<string | null>) {
      state.accessToken = action.payload;
      setApiAuthToken(action.payload);
    },
    setActiveOrgId(state, action: PayloadAction<string | null>) {
      state.activeOrgId = action.payload;
      setApiActiveOrgId(action.payload);
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        const orgId = action.payload.activeOrgId || action.payload.user?.organizationId || null;
        state.activeOrgId = orgId;
        if (orgId) setApiActiveOrgId(orgId);
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchCurrentUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.activeOrg = action.payload.activeOrg || null;
        const orgId = action.payload.activeOrg?.id || action.payload.user?.organizationId || state.activeOrgId;
        state.activeOrgId = orgId;
        if (orgId) setApiActiveOrgId(orgId);
        state.isAuthenticated = true;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.activeOrgId = null;
        state.activeOrg = null;
        state.isAuthenticated = false;
      })
      .addCase(switchOrganization.fulfilled, (state, action) => {
        const orgId = action.meta.arg;
        state.activeOrgId = orgId;
        setApiActiveOrgId(orgId);
        if (action.payload?.organization) {
          state.activeOrg = action.payload.organization;
        }
      });
  },
});

export const { setAuthToken, setActiveOrgId, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
