import { axiosInstance } from './axiosInstance';

export const metaService = {
  async getAllEnums() {
    const response = await axiosInstance.get('/meta/enums');
    return response.data.data;
  },

  async getRolesEnum() {
    const response = await axiosInstance.get('/meta/roles-enum');
    return response.data.data;
  },

  async getNodeTypes() {
    const response = await axiosInstance.get('/meta/node-types');
    return response.data.data;
  },

  async getOrgRoles() {
    const response = await axiosInstance.get('/meta/org-roles');
    return response.data.data;
  },

  async getOrgVenues() {
    const response = await axiosInstance.get('/meta/org-venues');
    return response.data.data;
  },
};
