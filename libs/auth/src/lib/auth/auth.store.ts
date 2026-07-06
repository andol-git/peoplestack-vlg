import { Injectable, signal, computed } from '@angular/core';
import { AuthTokens } from '@ps/shared-ui';

const KEY = 'ps_tokens';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly _tokens  = signal<AuthTokens | null>(this.hydrate());
  private readonly _loading = signal(false);
  private readonly _error   = signal<string | null>(null);

  readonly tokens          = this._tokens.asReadonly();
  readonly loading         = this._loading.asReadonly();
  readonly error           = this._error.asReadonly();
  readonly isAuthenticated = computed(() => !!this._tokens()?.accessToken);
  readonly accessToken     = computed(() => this._tokens()?.accessToken ?? null);

  private readonly tokenPayload = computed(() => this.decodePayload(this._tokens()?.accessToken ?? null));

  readonly role = computed<string | null>(() => {
    const payload = this.tokenPayload();
    const raw = payload?.['roles'] ?? payload?.['authorities'] ?? payload?.['role'] ?? payload?.['scope'];
    if (!raw) return null;
    const first = Array.isArray(raw) ? raw[0] : raw;
    if (!first) return null;
    return typeof first === 'string' ? first : (first.authority ?? first.name ?? null);
  });

  readonly username = computed<string | null>(() => {
    const payload = this.tokenPayload();
    return payload?.['sub'] ?? payload?.['username'] ?? null;
  });

  setTokens(t: AuthTokens): void { this._tokens.set(t); localStorage.setItem(KEY, JSON.stringify(t)); }
  setLoading(v: boolean): void { this._loading.set(v); }
  setError(m: string | null): void { this._error.set(m); }
  clear(): void { this._tokens.set(null); this._error.set(null); localStorage.removeItem(KEY); }

  private hydrate(): AuthTokens | null {
    try { const r = localStorage.getItem(KEY); return r ? JSON.parse(r) : null; }
    catch { return null; }
  }

  private decodePayload(token: string | null): Record<string, any> | null {
    if (!token) return null;
    try {
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(base64));
    } catch {
      return null;
    }
  }
}
