import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  organizationService,
  type CreateInvitationPayload,
  type CreateOrganizationPayload,
} from '@/services/api';
import { getErrorMessage } from '@/lib/apiError';
import type {
  InvitationResult,
  Organization,
  OrganizationInvitation,
  OrganizationMember,
} from '@/types';

interface OrgState {
  /** Details + resource counts for the active organization. */
  details: Organization | null;
  isLoadingDetails: boolean;
  detailsError: string | null;

  members: OrganizationMember[];
  isLoadingMembers: boolean;
  membersError: string | null;

  invitations: OrganizationInvitation[];
  isLoadingInvitations: boolean;
  invitationsError: string | null;

  isMutating: boolean;
}

const initialState: OrgState = {
  details: null,
  isLoadingDetails: false,
  detailsError: null,
  members: [],
  isLoadingMembers: false,
  membersError: null,
  invitations: [],
  isLoadingInvitations: false,
  invitationsError: null,
  isMutating: false,
};

export const fetchOrganizationDetails = createAsyncThunk(
  'org/fetchDetails',
  async (organizationId: string, { rejectWithValue }) => {
    try {
      return await organizationService.getById(organizationId);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const fetchOrgMembers = createAsyncThunk(
  'org/fetchMembers',
  async (_: void, { rejectWithValue }) => {
    try {
      return await organizationService.getMembers();
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const createOrganization = createAsyncThunk(
  'org/create',
  async (payload: CreateOrganizationPayload, { rejectWithValue }) => {
    try {
      return await organizationService.create(payload);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const updateMemberRole = createAsyncThunk(
  'org/updateMemberRole',
  async (
    { userId, roleId }: { userId: string; roleId: string },
    { rejectWithValue },
  ) => {
    try {
      return await organizationService.updateMemberRole(userId, roleId);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const fetchInvitations = createAsyncThunk(
  'org/fetchInvitations',
  async (_: void, { rejectWithValue }) => {
    try {
      return await organizationService.listInvitations();
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const inviteMember = createAsyncThunk(
  'org/inviteMember',
  async (payload: CreateInvitationPayload, { rejectWithValue }) => {
    try {
      return await organizationService.createInvitation(payload);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const revokeInvitation = createAsyncThunk(
  'org/revokeInvitation',
  async (invitationId: string, { rejectWithValue }) => {
    try {
      return await organizationService.revokeInvitation(invitationId);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

const orgSlice = createSlice({
  name: 'org',
  initialState,
  reducers: {
    resetOrg: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrganizationDetails.pending, (state) => {
        state.isLoadingDetails = true;
        state.detailsError = null;
      })
      .addCase(fetchOrganizationDetails.fulfilled, (state, action) => {
        state.isLoadingDetails = false;
        state.details = action.payload;
      })
      .addCase(fetchOrganizationDetails.rejected, (state, action) => {
        state.isLoadingDetails = false;
        state.detailsError = (action.payload as string) ?? 'Could not load the organization';
      })

      .addCase(fetchOrgMembers.pending, (state) => {
        state.isLoadingMembers = true;
        state.membersError = null;
      })
      .addCase(fetchOrgMembers.fulfilled, (state, action) => {
        state.isLoadingMembers = false;
        state.members = action.payload ?? [];
      })
      .addCase(fetchOrgMembers.rejected, (state, action) => {
        state.isLoadingMembers = false;
        state.membersError = (action.payload as string) ?? 'Could not load members';
      })

      .addCase(createOrganization.pending, (state) => {
        state.isMutating = true;
      })
      .addCase(createOrganization.fulfilled, (state) => {
        state.isMutating = false;
      })
      .addCase(createOrganization.rejected, (state) => {
        state.isMutating = false;
      })

      .addCase(updateMemberRole.pending, (state) => {
        state.isMutating = true;
      })
      .addCase(updateMemberRole.fulfilled, (state, action) => {
        state.isMutating = false;
        const index = state.members.findIndex(
          (member) => member.userId === action.payload.userId,
        );
        if (index !== -1) state.members[index] = { ...state.members[index], ...action.payload };
      })
      .addCase(updateMemberRole.rejected, (state) => {
        state.isMutating = false;
      })

      .addCase(fetchInvitations.pending, (state) => {
        state.isLoadingInvitations = true;
        state.invitationsError = null;
      })
      .addCase(fetchInvitations.fulfilled, (state, action) => {
        state.isLoadingInvitations = false;
        state.invitations = action.payload ?? [];
      })
      .addCase(fetchInvitations.rejected, (state, action) => {
        state.isLoadingInvitations = false;
        state.invitationsError = (action.payload as string) ?? 'Could not load invitations';
      })

      .addCase(inviteMember.pending, (state) => {
        state.isMutating = true;
      })
      .addCase(inviteMember.fulfilled, (state, action) => {
        state.isMutating = false;
        const { invitation } = action.payload as InvitationResult;
        const index = state.invitations.findIndex((item) => item.id === invitation.id);
        if (index === -1) state.invitations.unshift(invitation);
        else state.invitations[index] = invitation;
      })
      .addCase(inviteMember.rejected, (state) => {
        state.isMutating = false;
      })

      .addCase(revokeInvitation.pending, (state) => {
        state.isMutating = true;
      })
      .addCase(revokeInvitation.fulfilled, (state, action) => {
        state.isMutating = false;
        // The row survives with status REVOKED rather than being deleted.
        const index = state.invitations.findIndex((item) => item.id === action.payload.id);
        if (index !== -1) state.invitations[index] = action.payload;
      })
      .addCase(revokeInvitation.rejected, (state) => {
        state.isMutating = false;
      });
  },
});

export const { resetOrg } = orgSlice.actions;
export default orgSlice.reducer;
