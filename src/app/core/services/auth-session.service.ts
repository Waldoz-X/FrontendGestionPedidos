import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { AuthApiService, AuthMeResponse, LoginRequest, LoginResponse } from './auth-api.service';

export interface SessionUser {
    idUsuario?: string;
    email: string;
    userName?: string;
    tipoUsuario?: string;
    idEmpleado?: string | null;
    idCliente?: string | null;
    roles: string[];
    activo?: boolean;
    expiresAt?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
    private readonly tokenKey = 'gp_token';
    private readonly meKey = 'gp_me';
    private readonly authApi = inject(AuthApiService);

    login(payload: LoginRequest): Observable<LoginResponse> {
        return this.authApi.login(payload).pipe(
            tap((response) => {
                this.setToken(response.accessToken);
                this.setSessionUser({
                    idUsuario: response.idUsuario,
                    email: response.email,
                    userName: response.userName,
                    tipoUsuario: response.tipoUsuario,
                    idEmpleado: response.idEmpleado,
                    idCliente: response.idCliente,
                    roles: response.roles,
                    expiresAt: response.expiresAt
                });
            })
        );
    }

    getMe(): Observable<AuthMeResponse> {
        return this.authApi.getMe().pipe(
            tap((response) => {
                this.setSessionUser({
                    idUsuario: response.idUsuario,
                    email: response.email,
                    userName: response.userName,
                    tipoUsuario: response.tipoUsuario,
                    idEmpleado: response.idEmpleado,
                    idCliente: response.idCliente,
                    roles: response.roles,
                    activo: response.activo
                });
            })
        );
    }

    getToken(): string | null {
        return localStorage.getItem(this.tokenKey);
    }

    getSessionUser(): SessionUser | null {
        const raw = localStorage.getItem(this.meKey);

        if (!raw) {
            return null;
        }

        try {
            return JSON.parse(raw) as SessionUser;
        } catch {
            return null;
        }
    }

    setSessionUser(user: SessionUser): void {
        localStorage.setItem(this.meKey, JSON.stringify(user));
    }

    setToken(token: string): void {
        localStorage.setItem(this.tokenKey, token);
    }

    isAuthenticated(): boolean {
        return !!this.getToken();
    }

    hasAnyRole(allowedRoles: string[]): boolean {
        const roles = this.getSessionUser()?.roles ?? [];
        const normalizedAllowedRoles = allowedRoles.map((role) => role.toLowerCase());

        return roles.some((role) => normalizedAllowedRoles.includes(role.toLowerCase()));
    }

    isAdminUser(): boolean {
        return this.hasAnyRole(['Admin', 'Administrador', 'SuperAdmin']);
    }

    validateSession(): Observable<boolean> {
        if (!this.isAuthenticated()) {
            return of(false);
        }

        return this.getMe().pipe(
            map(() => true),
            catchError(() => of(false)),
            tap((isValid) => {
                if (!isValid) {
                    this.clearSession();
                }
            })
        );
    }

    clearSession(): void {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.meKey);
        sessionStorage.removeItem(this.meKey);
    }

    logout(): Observable<void> {
        return this.authApi.logout().pipe(
            map(() => void 0),
            tap(() => this.clearSession()),
            catchError(() => {
                this.clearSession();

                return of(void 0);
            }),
            map(() => void 0)
        );
    }
}

