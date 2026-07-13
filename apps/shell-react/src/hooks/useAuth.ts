import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/auth-api';
import { userApi } from '../api/user-api';
import { decodeTokenPayload, isTokenExpired, useAuthStore } from '../store/auth-store';
import type { LoginRequest } from '../types/models';

async function loadRoleFromApi(username: string): Promise<void> {
  try {
    const users = await userApi.getAll();
    const match = users.find((u) => u.username === username);
    const role = match?.roles?.[0]?.name ?? null;
    useAuthStore.getState().setSession(username, role);
  } catch {
    // role lookup failing shouldn't block the session — leave role null
  }
}

export function useAuth() {
  const store = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginRequest) => authApi.login(credentials),
    onMutate: () => {
      store.setLoading(true);
      store.setError(null);
    },
    onSuccess: (response, credentials) => {
      store.setTokens(response.accessToken, response.refreshToken);
      store.setLoading(false);
      void loadRoleFromApi(credentials.username);
    },
    onError: (err: any) => {
      const status = err?.response?.status;
      const message =
        status === 401
          ? 'Invalid username or password.'
          : status === undefined
          ? 'Cannot reach server. Check connection.'
          : 'Login failed. Please try again.';
      store.setLoading(false);
      store.setError(message);
    },
  });

  async function logout(): Promise<void> {
    try {
      await authApi.logout();
    } finally {
      store.clear();
    }
  }

  return {
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    error: store.error,
    username: store.username,
    role: store.role,
    login: loginMutation.mutateAsync,
    logout,
    hasAnyRole: (...roles: string[]) => !!store.role && roles.includes(store.role),
  };
}

// Called once at app bootstrap to restore session state (username/role) after a page refresh.
export async function resumeSession(): Promise<void> {
  const { accessToken, refreshToken, clear, setTokens, setSession } = useAuthStore.getState();
  if (!accessToken) return;

  if (!isTokenExpired(accessToken)) {
    const payload = decodeTokenPayload(accessToken);
    const username = payload?.['sub'] ?? payload?.['username'] ?? 'Admin';
    setSession(username, null);
    await loadRoleFromApi(username);
    return;
  }

  if (!refreshToken) {
    clear();
    return;
  }

  try {
    const response = await authApi.refresh(refreshToken);
    setTokens(response.accessToken, response.refreshToken);
    const payload = decodeTokenPayload(response.accessToken);
    const username = payload?.['sub'] ?? payload?.['username'] ?? 'Admin';
    setSession(username, null);
    await loadRoleFromApi(username);
  } catch {
    clear();
  }
}
