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

  async getAllTasks(programId?: string) {
    const params = programId ? { programId } : {};
    const response = await axiosInstance.get('/tasks', { params });
    return response.data.data;
  },

  async getTaskEnums() {
    const response = await axiosInstance.get('/tasks/enums');
    return response.data.data as { statuses: string[]; priorities: string[] };
  },
};
