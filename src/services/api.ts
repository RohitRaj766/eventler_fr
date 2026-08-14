import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let inMemoryToken: string | null = null;
let activeOrgId: string | null = null;

export function setApiAuthToken(token: string | null) {
  inMemoryToken = token;
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

api.interceptors.request.use(
  (config) => {
    if (inMemoryToken) {
      config.headers.Authorization = `Bearer ${inMemoryToken}`;
    }
    const currentOrgId = getApiActiveOrgId();
    if (currentOrgId) {
      config.headers['x-organization-id'] = currentOrgId;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
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
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const newToken = refreshResponse.data?.data?.accessToken;
        if (newToken) {
          setApiAuthToken(newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshErr) {
        setApiAuthToken(null);
      }
    }
    return Promise.reject(error);
  }
);
