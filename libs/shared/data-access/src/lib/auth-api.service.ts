import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LoginRequest, LoginResponse } from '@ps/shared/models';
import { APP_CONFIG } from '../tokens/app-config.token';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);

  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      `${this.config.apiBaseUrl}/api/auth/login`,
      payload
    );
  }

  logout(): Observable<string> {
    return this.http.post(
      `${this.config.apiBaseUrl}/api/auth/logout`,
      null,
      { responseType: 'text' }
    );
  }

  refresh(refreshToken: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      `${this.config.apiBaseUrl}/api/auth/refresh`,
      { refreshToken }
    );
  }
}
