import { axiosInstance, setApiAuthToken, setApiRefreshToken, getApiRefreshToken, setApiActiveOrgId } from './axiosInstance';
import { LoginInput, RegisterInput } from '@/utils/validationSchemas';

export const authService = {
  async login(credentials: LoginInput) {
    const response = await axiosInstance.post('/auth/login', credentials);
    const data = response.data.data;
    if (data.accessToken) {
      setApiAuthToken(data.accessToken);
    }
    if (data.refreshToken) {
      setApiRefreshToken(data.refreshToken);
    }
    if (data.activeOrgId || data.activeOrganizationId) {
      setApiActiveOrgId(data.activeOrgId || data.activeOrganizationId);
    }
    return data;
  },

  async register(data: RegisterInput) {
    const response = await axiosInstance.post('/auth/register', data);
    const resData = response.data.data;
    if (resData?.accessToken) {
      setApiAuthToken(resData.accessToken);
    }
    if (resData?.refreshToken) {
      setApiRefreshToken(resData.refreshToken);
    }
    if (resData?.activeOrgId || resData?.activeOrganizationId) {
      setApiActiveOrgId(resData.activeOrgId || resData.activeOrganizationId);
    }
    return resData;
  },

  async getMe() {
    const response = await axiosInstance.get('/auth/me');
    return response.data.data;
  },

  async refreshToken() {
    const storedRefreshToken = getApiRefreshToken();
    const response = await axiosInstance.post('/auth/refresh', { refreshToken: storedRefreshToken });
    const data = response.data.data;
    if (data.accessToken) {
      setApiAuthToken(data.accessToken);
    }
    if (data.refreshToken) {
      setApiRefreshToken(data.refreshToken);
    }
    return data;
  },

  async logout() {
    try {
      const storedRefreshToken = getApiRefreshToken();
      await axiosInstance.post('/auth/logout', { refreshToken: storedRefreshToken });
    } finally {
      setApiAuthToken(null);
      setApiRefreshToken(null);
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
