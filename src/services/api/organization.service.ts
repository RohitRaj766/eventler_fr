import type {
  InvitationResult,
  Organization,
  OrganizationInvitation,
  OrganizationMember,
  User,
} from '@/types';
import { apiDelete, apiGet, apiPost, apiPut } from './axiosInstance';

export interface CreateOrganizationPayload {
  name: string;
  /**
   * Unique institution slug members type to self-register.
   * Server caps this at 20 characters.
   */
  code: string;
  logoUrl?: string;
}

export interface CreateInvitationPayload {
  email: string;
  roleId: string;
  /** Scopes the invitation to a single program instead of the whole org. */
  programId?: string | null;
}

/**
 * Removes the bcrypt hash the backend leaks on `POST /organizations/invitations`
 * when the invited email already has an account, so it never reaches the store
 * or the DOM. (Same class of leak as `POST /tasks`.)
 */
function scrubUser(user: User | undefined): User | undefined {
  if (!user) return user;
  const safe: User = { ...(user as User & { passwordHash?: string }) };
  delete (safe as { passwordHash?: string }).passwordHash;
  return safe;
}

export const organizationService = {
  /** The creator is auto-assigned the Organization Super Admin role. */
  async create(payload: CreateOrganizationPayload) {
    return apiPost<Organization>('/organizations', payload);
  },

  async getById(id: string) {
    return apiGet<Organization>(`/organizations/${id}`);
  },

  async getMembers() {
    return apiGet<OrganizationMember[]>('/organizations/members');
  },

  async updateMemberRole(userId: string, roleId: string) {
    return apiPut<OrganizationMember>(`/organizations/members/${userId}/role`, { roleId });
  },

  /* ---------------- Invitations ---------------- */

  async listInvitations() {
    return apiGet<OrganizationInvitation[]>('/organizations/invitations');
  },

  /**
   * Invites someone by email.
   *
   * If they already have an Eventler account the backend adds them to the
   * roster straight away. If they don't, it records a PENDING invitation —
   * but note there is no accept endpoint deployed yet, so a brand-new person
   * still has to register with the organization code to actually get in.
   */
  async createInvitation(payload: CreateInvitationPayload) {
    const result = await apiPost<InvitationResult>('/organizations/invitations', payload);
    return { ...result, user: scrubUser(result.user) };
  },

  async revokeInvitation(invitationId: string) {
    return apiDelete<OrganizationInvitation>(`/organizations/invitations/${invitationId}`);
  },
};
