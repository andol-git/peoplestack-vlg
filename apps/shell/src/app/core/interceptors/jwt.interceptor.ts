import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError, switchMap, BehaviorSubject, filter, take, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { TokenStorageService } from '@ps/shared/data-access';
import { AuthApiService } from '@ps/shared/data-access';

// Module-level state — shared across all interceptor invocations for the same app instance
let isRefreshing = false;
const refreshDone$ = new BehaviorSubject<string | null>(null);

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenStorage = inject(TokenStorageService);
  const authApi      = inject(AuthApiService);
  const router       = inject(Router);

  const isAuthCall = req.url.includes('/api/auth/');
  const token      = tokenStorage.getAccessToken();

  if (token && !isAuthCall) {
    req = withToken(req, token);
  }

  return next(req).pipe(
    catchError((err) => {
      if (err.status === 401 && !isAuthCall) {
        return handle401(req, next, tokenStorage, authApi, router);
      }
      return throwError(() => err);
    }),
  );
};

function withToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

function handle401(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  tokenStorage: TokenStorageService,
  authApi: AuthApiService,
  router: Router,
): Observable<HttpEvent<unknown>> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshDone$.next(null);

    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) {
      isRefreshing = false;
      return expireSession(tokenStorage, router);
    }

    return authApi.refresh(refreshToken).pipe(
      switchMap((response) => {
        isRefreshing = false;
        tokenStorage.setTokens(response.accessToken, response.refreshToken);
        refreshDone$.next(response.accessToken);
        // Retry the original request with the new token
        return next(withToken(req, response.accessToken));
      }),
      catchError(() => {
        isRefreshing = false;
        return expireSession(tokenStorage, router);
      }),
    );
  }

  // Another request got a 401 while refresh is in flight — wait for the new token then retry
  return refreshDone$.pipe(
    filter((token): token is string => token !== null),
    take(1),
    switchMap((token) => next(withToken(req, token))),
  );
}

function expireSession(tokenStorage: TokenStorageService, router: Router): Observable<never> {
  tokenStorage.clearTokens();
  showSessionToast('Your session has expired. Please log in again.');
  setTimeout(() => router.navigate(['/login']), 2500);
  return throwError(() => new Error('session_expired'));
}

function showSessionToast(message: string): void {
  const existing = document.getElementById('session-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'session-toast';
  toast.style.cssText = `
    position:fixed; top:24px; left:50%; transform:translateX(-50%);
    z-index:99999; display:flex; align-items:center; gap:12px;
    padding:14px 20px; background:#1e293b; color:white;
    border-radius:12px; box-shadow:0 10px 40px rgba(0,0,0,0.3);
    font-family:'Inter',-apple-system,sans-serif; font-size:14px;
    font-weight:500; min-width:320px; max-width:480px;
    border-left:4px solid #f59e0b;
    animation:psSlideDown 0.3s cubic-bezier(0.16,1,0.3,1) forwards;
  `;
  toast.innerHTML = `
    <style>
      @keyframes psSlideDown {
        from { opacity:0; transform:translateX(-50%) translateY(-12px); }
        to   { opacity:1; transform:translateX(-50%) translateY(0); }
      }
    </style>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" style="flex-shrink:0">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
    <div style="flex:1">
      <div style="font-weight:600;margin-bottom:2px;">Session Ended</div>
      <div style="color:#94a3b8;font-size:13px;">${message}</div>
    </div>
    <div style="margin-left:auto;color:#64748b;font-size:12px;">Redirecting...</div>
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}
