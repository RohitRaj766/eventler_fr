import { axiosInstance } from './axiosInstance';

export const roleService = {
  async getPermissions() {
    const response = await axiosInstance.get('/roles/permissions');
    return response.data.data;
  },

  async createRole(data: { name: string; description?: string; category?: string; permissionIds: string[] }) {
    const response = await axiosInstance.post('/roles', data);
    return response.data.data;
  },

  async getRoles() {
    const response = await axiosInstance.get('/roles');
    return response.data.data;
  },

  async getRolePermissionPools() {
    const response = await axiosInstance.get('/meta/role-permission-pools');
    return response.data.data;
  },
};
