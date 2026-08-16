import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://eventler.onrender.com/api/v1';

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let inMemoryToken: string | null = null;
let inMemoryRefreshToken: string | null = null;
let activeOrgId: string | null = null;

export function setApiAuthToken(token: string | null) {
  inMemoryToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('eventler_access_token', token);
    } else {
      localStorage.removeItem('eventler_access_token');
    }
  }
}

export function getApiAuthToken(): string | null {
  if (inMemoryToken) return inMemoryToken;
  if (typeof window !== 'undefined') {
    return localStorage.getItem('eventler_access_token');
  }
  return null;
}

export function setApiRefreshToken(token: string | null) {
  inMemoryRefreshToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('eventler_refresh_token', token);
    } else {
      localStorage.removeItem('eventler_refresh_token');
    }
  }
}

export function getApiRefreshToken(): string | null {
  if (inMemoryRefreshToken) return inMemoryRefreshToken;
  if (typeof window !== 'undefined') {
    return localStorage.getItem('eventler_refresh_token');
  }
  return null;
}

export function setApiActiveOrgId(orgId: string | null) {
  activeOrgId = orgId;
  if (typeof window !== 'undefined') {
    if (orgId) {
      localStorage.setItem('eventler_active_org_id', orgId);
    } else {
      localStorage.removeItem('eventler_active_org_id');
    }
  }
}

export function getApiActiveOrgId(): string | null {
  if (activeOrgId) return activeOrgId;
  if (typeof window !== 'undefined') {
    return localStorage.getItem('eventler_active_org_id');
  }
  return null;
}

axiosInstance.interceptors.request.use(
  (config) => {
    const token = getApiAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const currentOrgId = getApiActiveOrgId();
    if (currentOrgId) {
      config.headers['x-organization-id'] = currentOrgId;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      originalRequest._retry = true;
      try {
        const storedRefreshToken = getApiRefreshToken();
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken: storedRefreshToken },
          { withCredentials: true }
        );
        const newToken = refreshResponse.data?.data?.accessToken;
        const newRefreshToken = refreshResponse.data?.data?.refreshToken;
        if (newToken) {
          setApiAuthToken(newToken);
          if (newRefreshToken) setApiRefreshToken(newRefreshToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axiosInstance(originalRequest);
        }
      } catch (refreshErr) {
        setApiAuthToken(null);
        setApiRefreshToken(null);
      }
    }
    return Promise.reject(error);
  }
);
