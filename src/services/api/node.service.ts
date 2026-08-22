import type { EventNode, NodeStatus, NodeTypeCategory } from '@/types';
import { apiDelete, apiGet, apiPatch, apiPost } from './axiosInstance';

export interface CreateNodePayload {
  programId: string;
  parentId?: string | null;
  /** Backend field is `type`, not Swagger's `typeCategory`. */
  type: NodeTypeCategory;
  /** Backend field is `name`, not Swagger's `title`. */
  name: string;
  description?: string;
  plannedStartTime: string;
  plannedEndTime: string;
  venueId?: string | null;
  customTypeName?: string | null;
  sortOrder?: number;
}

export interface UpdateNodePayload {
  name?: string;
  description?: string | null;
  type?: NodeTypeCategory;
  customTypeName?: string | null;
  status?: NodeStatus;
  plannedStartTime?: string;
  plannedEndTime?: string;
  venueId?: string | null;
  sortOrder?: number;
  /** Required by the backend for optimistic locking. */
  version: number;
}

export const nodeService = {
  async create(payload: CreateNodePayload) {
    return apiPost<EventNode>('/nodes', payload);
  },

  async getById(id: string) {
    return apiGet<EventNode>(`/nodes/${id}`);
  },

  async update(id: string, payload: UpdateNodePayload) {
    return apiPatch<EventNode>(`/nodes/${id}`, payload);
  },

  async remove(id: string) {
    return apiDelete<null>(`/nodes/${id}`);
  },

  /** Swagger says PATCH; the deployed route is POST. */
  async move(id: string, newParentId: string | null, newPosition: number) {
    return apiPost<EventNode>(`/nodes/${id}/move`, { newParentId, newPosition });
  },
};
