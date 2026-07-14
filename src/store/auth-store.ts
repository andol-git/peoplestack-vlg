import { create } from 'zustand';

const ACCESS_TOKEN_KEY = 'ps_access_token';
const REFRESH_TOKEN_KEY = 'ps_refresh_token';

export function decodeTokenPayload(token: string | null): Record<string, any> | null {
  if (!token) return null;
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

function isTokenExpired(token: string | null): boolean {
  const payload = decodeTokenPayload(token);
  if (!payload?.['exp']) return true;
  return payload['exp'] - Math.floor(Date.now() / 1000) <= 0;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  username: string | null;
  role: string | null;
  isLoading: boolean;
  error: string | null;
  sessionMessage: string | null;

  setTokens: (accessToken: string, refreshToken: string) => void;
  setSession: (username: string | null, role: string | null) => void;
  setLoading: (v: boolean) => void;
  setError: (msg: string | null) => void;
  setSessionMessage: (msg: string | null) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: localStorage.getItem(ACCESS_TOKEN_KEY),
  refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
  isAuthenticated: !!localStorage.getItem(ACCESS_TOKEN_KEY) && !isTokenExpired(localStorage.getItem(ACCESS_TOKEN_KEY)),
  username: null,
  role: null,
  isLoading: false,
  error: null,
  sessionMessage: null,

  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    set({ accessToken, refreshToken, isAuthenticated: true });
  },
  setSession: (username, role) => set({ username, role }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setSessionMessage: (sessionMessage) => set({ sessionMessage }),
  clear: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    set({
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      username: null,
      role: null,
      error: null,
      sessionMessage: null,
    });
  },
}));

export function getAccessToken(): string | null {
  return useAuthStore.getState().accessToken;
}

export function getRefreshToken(): string | null {
  return useAuthStore.getState().refreshToken;
}

export { isTokenExpired, ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY };
