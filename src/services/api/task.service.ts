import { axiosInstance } from './axiosInstance';
import { CreateTaskInput } from '@/utils/validationSchemas';
import { Task } from '@/types';

export const taskService = {
  async createTask(data: CreateTaskInput) {
    const response = await axiosInstance.post('/tasks', data);
    return response.data.data;
  },

  async updateTask(id: string, updates: Partial<Task>) {
    const response = await axiosInstance.patch(`/tasks/${id}`, updates);
    return response.data.data;
  },

  async getTasksByNode(nodeId: string) {
    const response = await axiosInstance.get(`/tasks/node/${nodeId}`);
    return response.data.data;
  },
};
