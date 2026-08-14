import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { organizationService, setApiActiveOrgId, getApiActiveOrgId } from '@/services/api';
import { Organization } from '@/types';
import { CreateOrgInput } from '@/utils/validationSchemas';

interface OrgState {
  myOrganizations: Organization[];
  currentOrgDetails: Organization | null;
  members: any[];
  isLoading: boolean;
  error: string | null;
}

const initialState: OrgState = {
  myOrganizations: [],
  currentOrgDetails: null,
  members: [],
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
  },
  {
    condition: (_, { getState }: any) => {
      const { org } = getState();
      if (org.myOrganizations && org.myOrganizations.length > 0) {
        return false;
      }
      return true;
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

export const fetchOrgMembers = createAsyncThunk(
  'org/fetchMembers',
  async (_, { rejectWithValue }) => {
    try {
      return await organizationService.getMembers();
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch members');
    }
  }
);

export const updateUserRole = createAsyncThunk(
  'org/updateRole',
  async ({ userId, roleId }: { userId: string; roleId: string }, { rejectWithValue }) => {
    try {
      return await organizationService.updateMemberRole(userId, roleId);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update member role');
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
      })
      .addCase(fetchOrgMembers.fulfilled, (state, action) => {
        state.members = action.payload || [];
      })
      .addCase(updateUserRole.fulfilled, (state, action) => {
        const index = state.members.findIndex((m) => m.userId === action.payload.userId || m.user?.id === action.payload.userId);
        if (index !== -1) {
          state.members[index].role = action.payload.role;
          state.members[index].roleId = action.payload.roleId;
        }
      });
  },
});

export default orgSlice.reducer;
