import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { ApiResponse, RefreshPayload } from '@/types';
import {
  clearSession,
  getAccessToken,
  getActiveOrgId,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from './tokenStore';

const ORIGIN = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://eventler.onrender.com'
).replace(/\/+$/, '');

export const API_ORIGIN = ORIGIN;
export const API_BASE_URL = `${ORIGIN}/api/v1`;

/** Endpoints that must never trigger the refresh-and-retry dance. */
const NO_REFRESH_PATHS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  // Sends the HttpOnly cookie pair whenever the browser considers the request
  // same-site; harmless (and required for CORS credentials) otherwise.
  withCredentials: true,
  timeout: 45_000,
  headers: { 'Content-Type': 'application/json' },
});

/* ------------------------------------------------------------------ */
/* Session-expiry broadcast                                            */
/* ------------------------------------------------------------------ */

type UnauthorizedHandler = () => void;
const unauthorizedHandlers = new Set<UnauthorizedHandler>();

/**
 * Registers a callback fired once the refresh chain is exhausted. The Redux
 * layer uses this to clear state and bounce to /login without the API module
 * having to import the store (which would be a cycle).
 */
export function onSessionExpired(handler: UnauthorizedHandler): () => void {
  unauthorizedHandlers.add(handler);
  return () => unauthorizedHandlers.delete(handler);
}

let expiryBroadcast = false;
function broadcastSessionExpired() {
  clearSession();
  if (expiryBroadcast) return;
  expiryBroadcast = true;
  unauthorizedHandlers.forEach((handler) => handler());
  // Allow a later sign-in to fire the handlers again.
  setTimeout(() => {
    expiryBroadcast = false;
  }, 1000);
}

/* ------------------------------------------------------------------ */
/* Request interceptor: bearer token + tenant header                   */
/* ------------------------------------------------------------------ */

axiosInstance.interceptors.request.use((config) => {
  const headers = AxiosHeaders.from(config.headers);

  const token = getAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const orgId = getActiveOrgId();
  if (orgId) headers.set('x-organization-id', orgId);

  config.headers = headers;
  return config;
});

/* ------------------------------------------------------------------ */
/* Single-flight refresh                                               */
/* ------------------------------------------------------------------ */

/**
 * The backend rotates the refresh token on every use and invalidates the whole
 * token family if an old one is replayed. Two parallel 401s must therefore
 * share one refresh call — every caller awaits the same promise.
 */
let refreshInFlight: Promise<string> | null = null;

async function performRefresh(): Promise<string> {
  const stored = getRefreshToken();

  // A bare client (no interceptors) so a failing refresh cannot recurse.
  const { data } = await axios.post<ApiResponse<RefreshPayload>>(
    `${API_BASE_URL}/auth/refresh`,
    // Cookie-first: when the HttpOnly cookie is usable the body is ignored.
    // The stored token is the cross-origin fallback.
    stored ? { refreshToken: stored } : {},
    { withCredentials: true, timeout: 30_000 },
  );

  const next = data?.data;
  if (!next?.accessToken) throw new Error('Refresh response did not include an access token');

  setAccessToken(next.accessToken);
  if (next.refreshToken) setRefreshToken(next.refreshToken);
  return next.accessToken;
}

export function refreshAccessToken(): Promise<string> {
  if (!refreshInFlight) {
    refreshInFlight = performRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

/* ------------------------------------------------------------------ */
/* Response interceptor: refresh once, then replay the request         */
/* ------------------------------------------------------------------ */

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const status = error.response?.status;
    const url = original?.url ?? '';

    const refreshable =
      status === 401 &&
      original &&
      !original._retried &&
      !NO_REFRESH_PATHS.some((path) => url.includes(path));

    if (!refreshable) {
      if (status === 401 && !NO_REFRESH_PATHS.some((path) => url.includes(path))) {
        broadcastSessionExpired();
      }
      return Promise.reject(error);
    }

    original._retried = true;

    try {
      const token = await refreshAccessToken();
      const headers = AxiosHeaders.from(original.headers);
      headers.set('Authorization', `Bearer ${token}`);
      // Re-read the tenant header: an org switch may have landed mid-flight.
      const orgId = getActiveOrgId();
      if (orgId) headers.set('x-organization-id', orgId);
      original.headers = headers;
      return axiosInstance(original);
    } catch {
      broadcastSessionExpired();
      return Promise.reject(error);
    }
  },
);

/* ------------------------------------------------------------------ */
/* Small helpers so services stay one-liners                           */
/* ------------------------------------------------------------------ */

/** Unwraps the `{ success, message, data }` envelope down to `data`. */
export async function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await axiosInstance.get<ApiResponse<T>>(url, config);
  return response.data.data as T;
}

export async function apiPost<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await axiosInstance.post<ApiResponse<T>>(url, body, config);
  return response.data.data as T;
}

export async function apiPatch<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await axiosInstance.patch<ApiResponse<T>>(url, body, config);
  return response.data.data as T;
}

export async function apiPut<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await axiosInstance.put<ApiResponse<T>>(url, body, config);
  return response.data.data as T;
}

export async function apiDelete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await axiosInstance.delete<ApiResponse<T>>(url, config);
  return response.data.data as T;
}
