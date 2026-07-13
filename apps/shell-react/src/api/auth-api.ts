import { http } from '../lib/http';
import type { LoginRequest, LoginResponse } from '../types/models';

export const authApi = {
  login(payload: LoginRequest) {
    return http.post<LoginResponse>('/api/auth/login', payload).then((r) => r.data);
  },
  logout() {
    return http.post<string>('/api/auth/logout', null, { responseType: 'text' as const }).then((r) => r.data);
  },
  refresh(refreshToken: string) {
    return http.post<LoginResponse>('/api/auth/refresh', { refreshToken }).then((r) => r.data);
  },
};
