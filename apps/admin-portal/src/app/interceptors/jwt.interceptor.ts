import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthStore } from '@people-stack/auth';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const store  = inject(AuthStore);
  const router = inject(Router);
  const token  = store.accessToken();
  const isAuth = req.url.includes('/auth/login');
  const cloned = (token && !isAuth)
    ? req.clone({ headers: req.headers.set('Authorization', `Bearer ${token}`) })
    : req;
  return next(cloned).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 403 || err.status === 401) { store.clear(); router.navigate(['/login']); }
      return throwError(() => err);
    })
  );
};
