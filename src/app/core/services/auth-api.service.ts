import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { AppConfigService } from '../../config/app-config.service';

export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
    errors?: string[];
}

export interface LoginRequest {
    email: string;
    password: string;
    tipoUsuario: string;
}

export interface LoginResponse {
    idUsuario: string;
    accessToken: string;
    email: string;
    userName: string;
    tipoUsuario: string;
    idEmpleado: string | null;
    idCliente: string | null;
    expiresAt: string;
    roles: string[];
}

export interface AuthMeResponse {
    idUsuario: string;
    idEmpleado: string | null;
    email: string;
    userName?: string;
    tipoUsuario?: string;
    activo: boolean;
    idCliente: string | null;
    roles: string[];
}

export interface RegisterClienteRequest {
    email: string;
    password: string;
    confirmPassword: string;
    nbComercial: string;
    clTipoCliente: string;
    clMonedaIdCatalogo: string;
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
}

@Injectable({ providedIn: 'root' })
export class AuthApiService {
    private readonly http = inject(HttpClient);
    private readonly appConfig = inject(AppConfigService);

    private get authUrl(): string {
        return `${this.appConfig.getApiBase()}/AdminAuth`;
    }

    login(payload: LoginRequest): Observable<LoginResponse> {
        return this.http.post<ApiResponse<LoginResponse> | LoginResponse>(`${this.authUrl}/login`, payload).pipe(
            map((response) => this.unwrap(response))
        );
    }

    getMe(): Observable<AuthMeResponse> {
        return this.http.get<ApiResponse<AuthMeResponse> | AuthMeResponse>(`${this.authUrl}/me`).pipe(map((response) => this.unwrap(response)));
    }

    registerCliente(payload: RegisterClienteRequest): Observable<LoginResponse> {
        return this.http.post<ApiResponse<LoginResponse> | LoginResponse>(`${this.authUrl}/register-cliente`, payload).pipe(
            map((response) => this.unwrap(response))
        );
    }

    changePassword(payload: ChangePasswordRequest): Observable<LoginResponse> {
        return this.http.post<ApiResponse<LoginResponse> | LoginResponse>(`${this.authUrl}/change-password`, payload).pipe(
            map((response) => this.unwrap(response))
        );
    }

    logout(): Observable<LoginResponse> {
        return this.http.post<ApiResponse<LoginResponse> | LoginResponse>(`${this.authUrl}/logout`, {}).pipe(map((response) => this.unwrap(response)));
    }


    private unwrap<T>(response: ApiResponse<T> | T): T {
        if (response && typeof response === 'object' && 'data' in response) {
            const apiResponse = response as ApiResponse<T>;

            if (apiResponse.success === false) {
                throw new Error(apiResponse.message || apiResponse.errors?.join(', ') || 'La operación no pudo completarse.');
            }

            return apiResponse.data as T;
        }

        return response as T;
    }
}

