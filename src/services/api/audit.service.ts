import type { AuditLog } from '@/types';
import { apiGet } from './axiosInstance';

export interface AuditQuery {
  /** The only filter the endpoint accepts server-side today. */
  programId?: string;
}

export const auditService = {
  async list(query: AuditQuery = {}) {
    const params: Record<string, string> = {};
    if (query.programId) params.programId = query.programId;
    return apiGet<AuditLog[]>('/audit', { params });
  },
};
