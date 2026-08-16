import { axiosInstance } from './axiosInstance';
import { CreateProgramInput } from '@/utils/validationSchemas';
import { NodeStatus } from '@/types';

export const programService = {
  async createProgram(data: CreateProgramInput) {
    const response = await axiosInstance.post('/programs', data);
    return response.data.data;
  },

  async getOrgPrograms() {
    const response = await axiosInstance.get('/programs');
    return response.data.data;
  },

  async getUserPrograms() {
    return this.getOrgPrograms();
  },

  async getProgramTree(id: string) {
    const response = await axiosInstance.get(`/programs/${id}`);
    return response.data.data;
  },

  async getProgramById(id: string) {
    return this.getProgramTree(id);
  },

  async updateProgramStatus(id: string, status: NodeStatus) {
    const response = await axiosInstance.patch(`/programs/${id}/status`, { status });
    return response.data.data;
  },
};
