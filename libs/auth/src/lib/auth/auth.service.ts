import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LoginRequest, AuthTokens } from '@ps/shared-ui';
import { APP_CONFIG } from '@ps/shared/data-access';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);

  login(b: LoginRequest): Observable<AuthTokens> {
    return this.http.post<AuthTokens>(`${this.config.apiBaseUrl}/api/auth/login`, b);
  }
  logout(): Observable<string> {
    return this.http.post<string>(`${this.config.apiBaseUrl}/api/auth/logout`, null, { responseType: 'text' as 'json' });
  }
}
