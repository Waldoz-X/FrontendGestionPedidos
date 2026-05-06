import { inject } from '@angular/core';
import { CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { AuthSessionService } from '../services/auth-session.service';

export const authGuard: CanActivateFn = (_route, state: RouterStateSnapshot) => {
	const authSession = inject(AuthSessionService);
	const router = inject(Router);

	if (authSession.isAuthenticated()) {
		return true;
	}

	return router.createUrlTree(['/auth/login'], {
		queryParams: {
			returnUrl: state.url
		}
	});
};
