import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthFacade } from '@people-stack/auth';

export const authGuard: CanActivateFn = () => {
  const facade = inject(AuthFacade);
  const router = inject(Router);
  return facade.isLoggedIn() ? true : router.createUrlTree(['/login']);
};
