import type { DependencyType, NodeDependency } from '@/types';
import { apiDelete, apiPost } from './axiosInstance';

export interface CreateDependencyPayload {
  predecessorId: string;
  successorId: string;
  type?: DependencyType;
  lagMinutes?: number;
}

export const dependencyService = {
  /** Rejected with 400 if the edge would close a cycle (backend runs DFS). */
  async create(payload: CreateDependencyPayload) {
    return apiPost<NodeDependency>('/dependencies', payload);
  },

  async remove(predecessorId: string, successorId: string) {
    return apiDelete<null>(`/dependencies/${predecessorId}/${successorId}`);
  },
};
