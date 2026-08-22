import type {
  AuthSessionPayload,
  CurrentUserPayload,
  RefreshPayload,
  SwitchOrgPayload,
} from '@/types';
import { apiGet, apiPost } from './axiosInstance';
import {
  clearSession,
  getRefreshToken,
  setAccessToken,
  setActiveOrgId,
  setRefreshToken,
} from './tokenStore';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  /** Joins an existing institution during self-registration. */
  orgCode?: string;
}

/** Persists whatever token material a session response carried. */
function adoptSession(payload: AuthSessionPayload) {
  if (payload?.accessToken) setAccessToken(payload.accessToken);
  if (payload?.refreshToken) setRefreshToken(payload.refreshToken);
  if (payload?.activeOrganizationId) setActiveOrgId(payload.activeOrganizationId);
  return payload;
}

export const authService = {
  async login(credentials: LoginPayload) {
    return adoptSession(await apiPost<AuthSessionPayload>('/auth/login', credentials));
  },

  async register(payload: RegisterPayload) {
    // The backend logs the user straight in and returns a full token pair.
    const body: RegisterPayload = {
      email: payload.email,
      password: payload.password,
      firstName: payload.firstName,
      lastName: payload.lastName,
    };
    if (payload.phoneNumber) body.phoneNumber = payload.phoneNumber;
    if (payload.orgCode) body.orgCode = payload.orgCode;

    return adoptSession(await apiPost<AuthSessionPayload>('/auth/register', body));
  },

  async getMe() {
    return apiGet<CurrentUserPayload>('/auth/me');
  },

  async refresh() {
    const stored = getRefreshToken();
    const data = await apiPost<RefreshPayload>(
      '/auth/refresh',
      stored ? { refreshToken: stored } : {},
    );
    if (data?.accessToken) setAccessToken(data.accessToken);
    if (data?.refreshToken) setRefreshToken(data.refreshToken);
    return data;
  },

  async logout() {
    const stored = getRefreshToken();
    try {
      await apiPost<null>('/auth/logout', stored ? { refreshToken: stored } : {});
    } finally {
      // Local state is cleared even if the server call fails, so a user on a
      // shared machine is never left signed in by a network error.
      clearSession();
    }
  },

  /**
   * Swaps the tenant context and returns a re-scoped access token. The caller
   * must adopt the new token before issuing any org-scoped request.
   */
  async switchOrg(organizationId: string) {
    const data = await apiPost<SwitchOrgPayload>('/auth/switch-org', { organizationId });
    if (data?.accessToken) setAccessToken(data.accessToken);
    setActiveOrgId(organizationId);
    return data;
  },

  async forgotPassword(email: string) {
    // In the current deployment the response also carries `resetTokenMock`,
    // because no mail transport is wired up yet.
    return apiPost<{ message: string; resetTokenMock?: string }>('/auth/forgot-password', {
      email,
    });
  },

  async resetPassword(token: string, newPassword: string) {
    return apiPost<null>('/auth/reset-password', { token, newPassword });
  },

  async changePassword(currentPassword: string, newPassword: string) {
    return apiPost<null>('/auth/change-password', { currentPassword, newPassword });
  },
};
