import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '@/services/api';
import { Organization } from '@/types';
import { CreateOrgInput } from '@/utils/validationSchemas';

interface OrgState {
  myOrganizations: Organization[];
  currentOrgDetails: Organization | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: OrgState = {
  myOrganizations: [],
  currentOrgDetails: null,
  isLoading: false,
  error: null,
};

export const fetchMyOrganizations = createAsyncThunk(
  'org/fetchMy',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/organizations/my');
      return response.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch organizations');
    }
  }
);

export const createOrganization = createAsyncThunk(
  'org/create',
  async (data: CreateOrgInput, { rejectWithValue }) => {
    try {
      const response = await api.post('/organizations', data);
      return response.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create organization');
    }
  }
);

export const fetchOrganizationDetails = createAsyncThunk(
  'org/fetchDetails',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/organizations/${id}`);
      return response.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch org details');
    }
  }
);

const orgSlice = createSlice({
  name: 'org',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyOrganizations.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchMyOrganizations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.myOrganizations = action.payload || [];
      })
      .addCase(fetchMyOrganizations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createOrganization.fulfilled, (state, action) => {
        state.myOrganizations.push(action.payload);
      })
      .addCase(fetchOrganizationDetails.fulfilled, (state, action) => {
        state.currentOrgDetails = action.payload;
      });
  },
});

export default orgSlice.reducer;
