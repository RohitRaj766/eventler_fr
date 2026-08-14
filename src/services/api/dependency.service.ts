import { axiosInstance } from './axiosInstance';
import { CreateDependencyInput } from '@/utils/validationSchemas';

export const dependencyService = {
  async createDependency(data: CreateDependencyInput) {
    const response = await axiosInstance.post('/dependencies', data);
    return response.data.data;
  },

  async removeDependency(predecessorId: string, successorId: string) {
    const response = await axiosInstance.delete(`/dependencies/${predecessorId}/${successorId}`);
    return response.data.data;
  },
};
