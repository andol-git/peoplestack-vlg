import axios, { AxiosError, type AxiosRequestConfig } from 'axios';
import { message } from 'antd';
import { APP_CONFIG } from '../config/app-config';
import { useAuthStore, getAccessToken, getRefreshToken } from '../store/auth-store';
import type { LoginResponse } from '../types/models';

export const http = axios.create({
  baseURL: APP_CONFIG.apiBaseUrl,
});

function isAuthCall(url?: string): boolean {
  return !!url && url.includes('/api/auth/');
}

http.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token && !isAuthCall(config.url)) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Single-flight refresh: concurrent 401s wait on the same refresh call instead of each firing their own.
let refreshInFlight: Promise<string> | null = null;

function expireSession(reason: string): void {
  // eslint-disable-next-line no-console
  console.warn(`[auth] session expired — ${reason}`);
  useAuthStore.getState().clear();
  message.warning('Your session has expired. Please log in again.', 3.5);
  setTimeout(() => {
    window.location.href = '/login';
  }, 1500);
}

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (AxiosRequestConfig & { _retried?: boolean }) | undefined;
    const status = error.response?.status;
    // This backend returns 403 (not 401) for a missing/invalid/expired token on protected
    // endpoints, so both statuses need to go through the refresh-and-retry flow. A genuine
    // role-permission 403 will still fail the same way after one retry, since `_retried`
    // prevents a second attempt.
    const isAuthRelated = status === 401 || status === 403;

    if (!isAuthRelated || !original || isAuthCall(original.url) || original._retried) {
      return Promise.reject(error);
    }

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      expireSession(`got ${status} on ${original.url} and there's no refresh token stored`);
      return Promise.reject(error);
    }

    original._retried = true;

    try {
      if (!refreshInFlight) {
        refreshInFlight = axios
          .post<LoginResponse>(`${APP_CONFIG.apiBaseUrl}/api/auth/refresh`, { refreshToken })
          .then((res) => {
            const { accessToken, refreshToken: newRefreshToken } = res.data ?? {};
            if (!accessToken || !newRefreshToken) {
              // eslint-disable-next-line no-console
              console.error('[auth] /api/auth/refresh returned an unexpected shape:', res.data);
              throw new Error('Refresh response missing accessToken/refreshToken');
            }
            useAuthStore.getState().setTokens(accessToken, newRefreshToken);
            return accessToken;
          })
          .finally(() => {
            refreshInFlight = null;
          });
      }

      const newToken = await refreshInFlight;
      original.headers = original.headers ?? {};
      (original.headers as Record<string, string>).Authorization = `Bearer ${newToken}`;
      return http(original);
    } catch (refreshError) {
      const detail =
        axios.isAxiosError(refreshError) && refreshError.response
          ? `refresh call failed with ${refreshError.response.status}: ${JSON.stringify(refreshError.response.data)}`
          : `refresh call threw: ${String(refreshError)}`;
      expireSession(`original request to ${original.url} got ${status}, then ${detail}`);
      return Promise.reject(refreshError);
    }
  }
);
