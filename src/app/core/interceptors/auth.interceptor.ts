import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthSessionService } from '../services/auth-session.service';

const AUTH_PUBLIC_ENDPOINTS = ['/api/adminauth/login', '/api/auth/login'];
let redirectInProgress = false;

const normalizeUrl = (url: string): string => url.toLowerCase();

const isPublicAuthRequest = (url: string): boolean => {
    const normalizedUrl = normalizeUrl(url);

    return AUTH_PUBLIC_ENDPOINTS.some((endpoint) => normalizedUrl.includes(endpoint));
};

const isApiRequest = (url: string): boolean => {
    const normalizedUrl = normalizeUrl(url);

    return normalizedUrl.startsWith('/api') || normalizedUrl.includes('/api/');
};

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authSession = inject(AuthSessionService);
    const router = inject(Router);
    const token = authSession.getToken();

    const isApiCall = isApiRequest(req.url);

    const request = token && isApiCall
        ? req.clone({
              setHeaders: {
                  Authorization: `Bearer ${token}`
              }
          })
        : req;

    return next(request).pipe(
        catchError((error: unknown) => {
            if (!(error instanceof HttpErrorResponse)) {
                return throwError(() => error);
            }

            const isUnauthorized = error.status === 401 || error.status === 403;
            const shouldHandleSessionExpiry = isApiCall && isUnauthorized && !isPublicAuthRequest(req.url) && authSession.isAuthenticated();

            if (shouldHandleSessionExpiry) {
                authSession.clearSession();

                if (!redirectInProgress && !router.url.startsWith('/auth/login')) {
                    redirectInProgress = true;
                    const returnUrl = router.url || '/';

                    void router
                        .navigate(['/auth/login'], {
                            queryParams: {
                                returnUrl,
                                reason: 'session_expired'
                            }
                        })
                        .finally(() => {
                            redirectInProgress = false;
                        });
                }
            }

            return throwError(() => error);
        })
    );
};

void authInterceptor;
