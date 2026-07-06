import { Injectable } from '@angular/core';

const ACCESS_TOKEN_KEY  = 'ps_access_token';
const REFRESH_TOKEN_KEY = 'ps_refresh_token';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  clearTokens(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  hasToken(): boolean {
    return !!this.getAccessToken();
  }

  // Decode JWT payload without any library
  getTokenPayload(): Record<string, any> | null {
    const token = this.getAccessToken();
    if (!token) return null;
    try {
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(base64));
    } catch {
      return null;
    }
  }

  // Returns seconds until token expires. Negative = already expired.
  getSecondsUntilExpiry(): number {
    const payload = this.getTokenPayload();
    if (!payload?.['exp']) return -1;
    return payload['exp'] - Math.floor(Date.now() / 1000);
  }

  isTokenExpired(): boolean {
    return this.getSecondsUntilExpiry() <= 0;
  }

  // Returns all roles as strings from the JWT payload.
  // Handles: string[], {authority:string}[], {name:string}[], or plain string.
  getRoles(): string[] {
    const payload = this.getTokenPayload();
    if (!payload) return [];
    const raw = payload['roles'] ?? payload['authorities'] ?? payload['role'] ?? payload['scope'];
    if (!raw) return [];
    const arr = Array.isArray(raw) ? raw : [raw];
    return arr.map((r: any) =>
      typeof r === 'string' ? r : (r?.authority ?? r?.name ?? String(r))
    );
  }

  getRole(): string | null {
    return this.getRoles()[0] ?? null;
  }

  hasRole(role: string): boolean {
    return this.getRoles().includes(role);
  }
}
