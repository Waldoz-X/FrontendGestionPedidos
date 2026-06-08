import { inject } from '@angular/core';
import { CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { AuthSessionService } from '../services/auth-session.service';

export const adminGuard: CanActivateFn = (_route, state: RouterStateSnapshot) => {
    const authSession = inject(AuthSessionService);
    const router = inject(Router);

    if (!authSession.isAuthenticated()) {
        return router.createUrlTree(['/auth/login'], {
            queryParams: {
                returnUrl: state.url
            }
        });
    }

    if (!authSession.isAdminUser()) {
        return router.createUrlTree(['/auth/error'], {
            queryParams: {
                code: 403,
                reason: 'forbidden'
            }
        });
    }

    return true;
};

