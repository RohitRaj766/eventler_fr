import { axiosInstance, setApiAuthToken, setApiActiveOrgId } from './axiosInstance';
import { LoginInput, RegisterInput } from '@/utils/validationSchemas';

export const authService = {
  async login(credentials: LoginInput) {
    const response = await axiosInstance.post('/auth/login', credentials);
    const data = response.data.data;
    setApiAuthToken(data.accessToken);
    if (data.activeOrgId) {
      setApiActiveOrgId(data.activeOrgId);
    }
    return data;
  },

  async register(data: RegisterInput) {
    const response = await axiosInstance.post('/auth/register', data);
    return response.data.data;
  },

  async getMe() {
    const response = await axiosInstance.get('/auth/me');
    return response.data.data;
  },

  async refreshToken() {
    const response = await axiosInstance.post('/auth/refresh');
    const data = response.data.data;
    if (data.accessToken) {
      setApiAuthToken(data.accessToken);
    }
    return data;
  },

  async logout() {
    try {
      await axiosInstance.post('/auth/logout');
    } finally {
      setApiAuthToken(null);
      setApiActiveOrgId(null);
    }
  },

  async switchOrg(organizationId: string) {
    const response = await axiosInstance.post('/auth/switch-org', { organizationId });
    setApiActiveOrgId(organizationId);
    return response.data.data;
  },

  async forgotPassword(email: string) {
    const response = await axiosInstance.post('/auth/forgot-password', { email });
    return response.data.data;
  },

  async resetPassword(token: string, newPassword: string) {
    const response = await axiosInstance.post('/auth/reset-password', { token, newPassword });
    return response.data.data;
  },

  async changePassword(oldPassword: string, newPassword: string) {
    const response = await axiosInstance.post('/auth/change-password', { oldPassword, newPassword });
    return response.data.data;
  },
};
