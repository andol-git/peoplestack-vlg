import { Injectable, signal, computed } from '@angular/core';
import { AuthTokens } from '@people-stack/shared-ui';

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

  setTokens(t: AuthTokens): void { this._tokens.set(t); localStorage.setItem(KEY, JSON.stringify(t)); }
  setLoading(v: boolean): void { this._loading.set(v); }
  setError(m: string | null): void { this._error.set(m); }
  clear(): void { this._tokens.set(null); this._error.set(null); localStorage.removeItem(KEY); }

  private hydrate(): AuthTokens | null {
    try { const r = localStorage.getItem(KEY); return r ? JSON.parse(r) : null; }
    catch { return null; }
  }
}
