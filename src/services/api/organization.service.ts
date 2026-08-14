import { axiosInstance } from './axiosInstance';
import { CreateOrgInput } from '@/utils/validationSchemas';

export const organizationService = {
  async createOrg(data: CreateOrgInput) {
    const response = await axiosInstance.post('/organizations', data);
    return response.data.data;
  },

  async getMyOrgs() {
    const response = await axiosInstance.get('/organizations/my');
    return response.data.data;
  },

  async getOrgDetails(id: string) {
    const response = await axiosInstance.get(`/organizations/${id}`);
    return response.data.data;
  },

  async getMembers() {
    const response = await axiosInstance.get('/organizations/members');
    return response.data.data;
  },

  async updateMemberRole(userId: string, roleId: string) {
    const response = await axiosInstance.put(`/organizations/members/${userId}/role`, { roleId });
    return response.data.data;
  },

  async createInvitation(data: { email: string; roleId: string; programId?: string }) {
    const response = await axiosInstance.post('/organizations/invitations', data);
    return response.data.data;
  },

  async getInvitations(programId?: string) {
    const response = await axiosInstance.get('/organizations/invitations', {
      params: { programId }
    });
    return response.data.data;
  },

  async revokeInvitation(invitationId: string) {
    const response = await axiosInstance.delete(`/organizations/invitations/${invitationId}`);
    return response.data.data;
  },
};
