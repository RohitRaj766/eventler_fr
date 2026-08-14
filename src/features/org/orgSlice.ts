import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { organizationService, setApiActiveOrgId, getApiActiveOrgId } from '@/services/api';
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
      const orgs = await organizationService.getMyOrgs();
      if (orgs && orgs.length > 0) {
        const currentOrg = getApiActiveOrgId();
        if (!currentOrg || !orgs.some((o: Organization) => o.id === currentOrg)) {
          setApiActiveOrgId(orgs[0].id);
        }
      }
      return orgs;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch organizations');
    }
  }
);

export const createOrganization = createAsyncThunk(
  'org/create',
  async (data: CreateOrgInput, { rejectWithValue }) => {
    try {
      const newOrg = await organizationService.createOrg(data);
      if (newOrg?.id) {
        setApiActiveOrgId(newOrg.id);
      }
      return newOrg;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create organization');
    }
  }
);

export const fetchOrganizationDetails = createAsyncThunk(
  'org/fetchDetails',
  async (id: string, { rejectWithValue }) => {
    try {
      return await organizationService.getOrgDetails(id);
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
