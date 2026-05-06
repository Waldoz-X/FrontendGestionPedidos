import { inject, Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { AuthMeResponse, LoginRequest, LoginResponse } from '@/app/pages/service/empleados-api.types';
import { EmpleadosService } from '@/app/pages/service/empleados.service';

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
    private readonly tokenKey = 'gp_token';
    private readonly meKey = 'gp_me';
    private readonly empleadosService = inject(EmpleadosService);

    login(payload: LoginRequest): Observable<LoginResponse> {
        return this.empleadosService.login(payload).pipe(
            tap((response) => {
                this.setToken(response.accessToken);
            })
        );
    }

    getMe(): Observable<AuthMeResponse> {
        return this.empleadosService.getMe().pipe(
            tap((response) => {
                localStorage.setItem(this.meKey, JSON.stringify(response));
            })
        );
    }

    getToken(): string | null {
        return localStorage.getItem(this.tokenKey);
    }

    setToken(token: string): void {
        localStorage.setItem(this.tokenKey, token);
    }

    isAuthenticated(): boolean {
        return !!this.getToken();
    }

    clearSession(): void {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.meKey);
        sessionStorage.removeItem(this.meKey);
    }

    logout(): void {
        this.clearSession();
    }
}

