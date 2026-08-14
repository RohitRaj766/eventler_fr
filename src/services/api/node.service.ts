import { axiosInstance } from './axiosInstance';
import { CreateNodeInput } from '@/utils/validationSchemas';

export const nodeService = {
  async createNode(payload: { programId: string; parentId?: string; data: CreateNodeInput }) {
    const response = await axiosInstance.post('/nodes', {
      ...payload.data,
      programId: payload.programId,
      parentId: payload.parentId,
    });
    return response.data.data;
  },

  async getNodeDetails(id: string) {
    const response = await axiosInstance.get(`/nodes/${id}`);
    return response.data.data;
  },

  async updateNode(id: string, updates: Partial<CreateNodeInput>) {
    const response = await axiosInstance.patch(`/nodes/${id}`, updates);
    return response.data.data;
  },

  async moveNode(id: string, newParentId?: string | null, newSortOrder?: number) {
    const response = await axiosInstance.post(`/nodes/${id}/move`, {
      newParentId: newParentId || null,
      newSortOrder: typeof newSortOrder === 'number' ? newSortOrder : 0,
    });
    return response.data.data;
  },

  async deleteNode(id: string) {
    const response = await axiosInstance.delete(`/nodes/${id}`);
    return response.data.data;
  },
};
