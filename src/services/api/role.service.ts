import type { Permission, Role, RoleCategory } from '@/types';
import { apiGet, apiPost } from './axiosInstance';

export interface CreateRolePayload {
  name: string;
  description?: string;
  category?: RoleCategory;
  permissionIds: string[];
}

export const roleService = {
  async listPermissions() {
    return apiGet<Permission[]>('/roles/permissions');
  },

  /**
   * `GET /roles` currently returns roles from every organization — the query
   * is missing its tenant filter server-side. Callers must pass the active org
   * id so the leak never reaches the UI.
   */
  async listForOrg(organizationId: string | null) {
    const roles = await apiGet<Role[]>('/roles');
    if (!organizationId) return [];
    return (roles ?? []).filter((role) => role.organizationId === organizationId);
  },

  async create(payload: CreateRolePayload) {
    return apiPost<Role>('/roles', payload);
  },
};
