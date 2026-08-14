import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api, setApiAuthToken, setApiActiveOrgId } from '@/services/api';
import { AuthState, User, Organization } from '@/types';
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
      const response = await api.post('/auth/login', credentials);
      const data = response.data.data;
      setApiAuthToken(data.accessToken);
      if (data.activeOrgId) {
        setApiActiveOrgId(data.activeOrgId);
      }
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Login failed');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (data: RegisterInput, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/register', data);
      return response.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Registration failed');
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  'auth/me',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/auth/me');
      return response.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch user session');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { dispatch }) => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // Ignore network errors on logout
    } finally {
      setApiAuthToken(null);
      setApiActiveOrgId(null);
    }
  }
);

export const switchOrganization = createAsyncThunk(
  'auth/switchOrg',
  async (organizationId: string, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/switch-org', { organizationId });
      setApiActiveOrgId(organizationId);
      return response.data.data;
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
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.activeOrgId = action.payload.activeOrgId || null;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Register
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
      // Fetch me
      .addCase(fetchCurrentUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.activeOrg = action.payload.activeOrg || null;
        state.activeOrgId = action.payload.activeOrg?.id || state.activeOrgId;
        state.isAuthenticated = true;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.activeOrgId = null;
        state.activeOrg = null;
        state.isAuthenticated = false;
      })
      // Switch Org
      .addCase(switchOrganization.fulfilled, (state, action) => {
        state.activeOrgId = action.meta.arg;
        if (action.payload?.organization) {
          state.activeOrg = action.payload.organization;
        }
      });
  },
});

export const { setAuthToken, setActiveOrgId, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
