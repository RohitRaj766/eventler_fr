import { axiosInstance } from './axiosInstance';

export const notificationService = {
  async getMyNotifications() {
    const response = await axiosInstance.get('/notifications/my');
    return response.data.data;
  },
};
