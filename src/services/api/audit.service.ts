import { axiosInstance } from './axiosInstance';

export const auditService = {
  async getAuditLogs(params: { action?: string; entityType?: string } = {}) {
    const response = await axiosInstance.get('/audit', { params });
    return response.data.data;
  },
};
