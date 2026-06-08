import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthSessionService } from '../services/auth-session.service';

export const guestGuard: CanActivateFn = () => {
    const authSession = inject(AuthSessionService);
    const router = inject(Router);

    if (!authSession.isAuthenticated()) {
        return true;
    }

    return authSession.validateSession().pipe(
        map((isValid) => {
            if (isValid) {
                return router.createUrlTree(['/']);
            }

            return true;
        })
    );
};

