import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { roleService } from '@/services/api';
import { Role, Permission } from '@/types';

interface RoleState {
  roles: Role[];
  permissions: Permission[];
  isLoading: boolean;
  error: string | null;
}

const initialState: RoleState = {
  roles: [],
  permissions: [],
  isLoading: false,
  error: null,
};

export const fetchRoles = createAsyncThunk(
  'role/fetchRoles',
  async (_, { rejectWithValue }) => {
    try {
      return await roleService.getRoles();
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch roles');
    }
  }
);

export const fetchPermissions = createAsyncThunk(
  'role/fetchPermissions',
  async (_, { rejectWithValue }) => {
    try {
      return await roleService.getPermissions();
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch permissions');
    }
  }
);

export const createRole = createAsyncThunk(
  'role/createRole',
  async (data: { name: string; description?: string; category?: string; permissionIds: string[] }, { rejectWithValue }) => {
    try {
      return await roleService.createRole(data);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create role');
    }
  }
);

const roleSlice = createSlice({
  name: 'role',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.roles = action.payload || [];
      })
      .addCase(fetchPermissions.fulfilled, (state, action) => {
        state.permissions = action.payload || [];
      })
      .addCase(createRole.fulfilled, (state, action) => {
        state.roles.push(action.payload);
      });
  },
});

export default roleSlice.reducer;
