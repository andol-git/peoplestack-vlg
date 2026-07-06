import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LoginRequest, AuthTokens } from '@people-stack/shared-ui';
import { environment } from '../../../../apps/admin-portal/src/environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  login(b: LoginRequest): Observable<AuthTokens> {
    return this.http.post<AuthTokens>(`${environment.apiBase}/auth/login`, b);
  }
  logout(): Observable<string> {
    return this.http.post<string>(`${environment.apiBase}/auth/logout`, null, { responseType: 'text' as 'json' });
  }
}
