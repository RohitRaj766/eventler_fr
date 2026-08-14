import { axiosInstance } from './axiosInstance';

export const metaService = {
  async getAllEnums() {
    const response = await axiosInstance.get('/meta/enums');
    return response.data.data;
  },

  async getEnumByName(enumName: string) {
    const response = await axiosInstance.get(`/meta/enum/${enumName}`);
    return response.data.data;
  },
};
