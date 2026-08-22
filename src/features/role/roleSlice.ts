import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { roleService, type CreateRolePayload } from '@/services/api';
import { getErrorMessage } from '@/lib/apiError';
import type { Permission, Role } from '@/types';

interface RoleState {
  roles: Role[];
  permissions: Permission[];
  isLoading: boolean;
  isMutating: boolean;
  error: string | null;
}

const initialState: RoleState = {
  roles: [],
  permissions: [],
  isLoading: false,
  isMutating: false,
  error: null,
};

/**
 * `GET /roles` is not tenant-scoped server-side yet, so the active org id is
 * required and the service filters the response before it reaches the store.
 */
export const fetchRoles = createAsyncThunk(
  'role/fetchRoles',
  async (organizationId: string | null, { rejectWithValue }) => {
    try {
      return await roleService.listForOrg(organizationId);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const fetchPermissions = createAsyncThunk(
  'role/fetchPermissions',
  async (_: void, { rejectWithValue }) => {
    try {
      return await roleService.listPermissions();
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const createRole = createAsyncThunk(
  'role/create',
  async (payload: CreateRolePayload, { rejectWithValue }) => {
    try {
      return await roleService.create(payload);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

const roleSlice = createSlice({
  name: 'role',
  initialState,
  reducers: {
    resetRoles: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRoles.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.isLoading = false;
        state.roles = action.payload ?? [];
      })
      .addCase(fetchRoles.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) ?? 'Could not load roles';
      })
      .addCase(fetchPermissions.fulfilled, (state, action) => {
        state.permissions = action.payload ?? [];
      })
      .addCase(createRole.pending, (state) => {
        state.isMutating = true;
      })
      .addCase(createRole.fulfilled, (state, action) => {
        state.isMutating = false;
        state.roles.push(action.payload);
      })
      .addCase(createRole.rejected, (state, action) => {
        state.isMutating = false;
        state.error = (action.payload as string) ?? 'Could not create the role';
      });
  },
});

export const { resetRoles } = roleSlice.actions;
export default roleSlice.reducer;
