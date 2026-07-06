import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from './auth.service';
import { AuthStore } from './auth.store';
import { LoginRequest } from '@ps/shared-ui';

@Injectable({ providedIn: 'root' })
export class AuthFacade {
  private svc   = inject(AuthService);
  private store = inject(AuthStore);
  private router= inject(Router);

  readonly isAuthenticated = this.store.isAuthenticated;
  readonly loading         = this.store.loading;
  readonly error           = this.store.error;
  readonly accessToken     = this.store.accessToken;
  readonly role            = this.store.role;
  readonly username        = this.store.username;

  hasAnyRole(...roles: string[]): boolean {
    const current = this.store.role();
    return !!current && roles.includes(current);
  }

  login(creds: LoginRequest): void {
    this.store.setLoading(true);
    this.store.setError(null);
    this.svc.login(creds).pipe(finalize(() => this.store.setLoading(false))).subscribe({
      next: tokens => { this.store.setTokens(tokens); this.router.navigate(['/dashboard']); },
      error: err => {
        this.store.setError(
          err.status === 401 ? 'Invalid username or password.' :
          err.status === 0   ? 'Cannot reach server. Check connection.' :
          'Login failed. Please try again.'
        );
      }
    });
  }

  logout(): void {
    this.svc.logout().pipe(finalize(() => { this.store.clear(); this.router.navigate(['/login']); })).subscribe();
  }

  isLoggedIn(): boolean { return this.store.isAuthenticated(); }
}
