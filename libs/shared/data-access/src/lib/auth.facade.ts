import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { AuthApiService } from './auth-api.service';
import { TokenStorageService } from './token-storage.service';
import { UserApiService } from './user-api.service';
import { LoginRequest, LoginResponse } from '@ps/shared/models';

export interface AuthState {
  isAuthenticated: boolean;
  username: string | null;
  role: string | null;
  isLoading: boolean;
  error: string | null;
  sessionMessage: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthFacade {
  private readonly authApi      = inject(AuthApiService);
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly userApi      = inject(UserApiService);
  private readonly router       = inject(Router);


  private readonly _state = signal<AuthState>({
    isAuthenticated: this.tokenStorage.hasToken(),
    username: null,
    role: null,
    isLoading: false,
    error: null,
    sessionMessage: null,
  });

  readonly isAuthenticated = computed(() => this._state().isAuthenticated);
  readonly isLoading       = computed(() => this._state().isLoading);
  readonly authError       = computed(() => this._state().error);
  readonly username        = computed(() => this._state().username);
  readonly role            = computed(() => this._state().role);
  readonly sessionMessage  = computed(() => this._state().sessionMessage);
  readonly isSuperAdmin    = computed(() => this._state().role === 'ROLE_SUPER_ADMIN');

  hasAnyRole(...roles: string[]): boolean {
    const current = this._state().role;
    return !!current && roles.includes(current);
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    this._patch({ isLoading: true, error: null });

    return this.authApi.login(credentials).pipe(
      tap((response) => {
        this.tokenStorage.setTokens(response.accessToken, response.refreshToken);
        this._patch({
          isAuthenticated: true,
          username: credentials.username,
          isLoading: false,
          error: null,
          sessionMessage: null,
        });
        this._loadRoleFromApi(credentials.username);
        this._startSessionMonitor();
        this.router.navigate(['/dashboard']);
      }),
      catchError((err) => {
        const message = err?.error?.message ?? 'Invalid username or password.';
        this._patch({ isLoading: false, error: message, isAuthenticated: false });
        return throwError(() => err);
      })
    );
  }

  logout(): void {
    this.authApi.logout().subscribe({
      complete: () => this._clearSession(),
      error:    () => this._clearSession(),
    });
  }

  // Called on app init if token already exists (page refresh / HMR reload)
  resumeSession(): void {
    if (!this.tokenStorage.hasToken()) return;

    if (!this.tokenStorage.isTokenExpired()) {
      // Token still valid — restore state immediately
      const payload  = this.tokenStorage.getTokenPayload();
      const username = payload?.['sub'] ?? payload?.['username'] ?? 'Admin';
      this._patch({ isAuthenticated: true, username });
      this._loadRoleFromApi(username);
      this._startSessionMonitor();
      return;
    }

    // Access token expired — try refresh before giving up
    const refreshToken = this.tokenStorage.getRefreshToken();
    if (!refreshToken) {
      this.tokenStorage.clearTokens();
      this._patch({ isAuthenticated: false });
      return;
    }

    this.authApi.refresh(refreshToken).subscribe({
      next: (response) => {
        this.tokenStorage.setTokens(response.accessToken, response.refreshToken);
        const payload  = this.tokenStorage.getTokenPayload();
        const username = payload?.['sub'] ?? payload?.['username'] ?? 'Admin';
        this._patch({ isAuthenticated: true, username });
        this._loadRoleFromApi(username);
        this._startSessionMonitor();
      },
      error: () => {
        this.tokenStorage.clearTokens();
        this._patch({ isAuthenticated: false });
      },
    });
  }

  private _loadRoleFromApi(username: string): void {
    this.userApi.getAll().subscribe({
      next: (users) => {
        const match = users.find(u => u.username === username);
        const role  = match?.roles?.[0]?.name ?? null;
        this._patch({ role });
      },
    });
  }

  private _startSessionMonitor(): void {
    // Session monitoring disabled — JWT interceptor handles token expiry via 401 responses
  }

  private _clearSession(): void {
    this.tokenStorage.clearTokens();
    this._patch({ isAuthenticated: false, username: null, role: null, sessionMessage: null });
    this.router.navigate(['/login']);
  }

  private _patch(partial: Partial<AuthState>): void {
    this._state.update((s) => ({ ...s, ...partial }));
  }
}

