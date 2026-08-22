import type {
  EnumOption,
  NodeTypeMeta,
  OrgRoleMeta,
  RolePermissionPools,
  SystemEnums,
  SystemRoleMeta,
  Venue,
} from '@/types';
import { apiGet } from './axiosInstance';

/**
 * Metadata is the backend's own description of its enums, so the UI never
 * hardcodes dropdown values. All of it is immutable for the life of a session,
 * which is why `metaSlice` fetches each entry once and caches it.
 */
export const metaService = {
  async getEnums() {
    return apiGet<SystemEnums>('/meta/enums');
  },

  async getEnum(enumName: string) {
    return apiGet<EnumOption[]>(`/meta/enum/${enumName}`);
  },

  async getNodeTypes() {
    return apiGet<NodeTypeMeta[]>('/meta/node-types');
  },

  async getSystemRoles() {
    return apiGet<SystemRoleMeta[]>('/meta/roles-enum');
  },

  async getRolePermissionPools() {
    return apiGet<RolePermissionPools>('/meta/role-permission-pools');
  },

  /** Org-scoped: needs an access token and the tenant header. */
  async getOrgRoles() {
    return apiGet<OrgRoleMeta[]>('/meta/org-roles');
  },

  async getOrgVenues() {
    return apiGet<Venue[]>('/meta/org-venues');
  },
};
